const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cron = require('node-cron');

const pool = require('./src/config/database');
let RouterOSAPI = require('node-routeros');
if (RouterOSAPI.RouterOSAPI) {
    RouterOSAPI = RouterOSAPI.RouterOSAPI;
}

const apiRoutes = require('./src/routes');
const authRoutes = require('./src/routes/authRoutes');
const userRoutes = require('./src/routes/userRoutes');
const pppoeRoutes = require('./src/routes/pppoeRoutes');
const assetRoutes = require('./src/routes/assetRoutes');
const sessionRoutes = require('./src/routes/sessionRoutes');
const cloneRoutes = require('./src/routes/cloneRoutes');
const hotspotRoutes = require('./src/routes/hotspotRoutes');
const importRoutes = require('./src/routes/importRoutes');
const registrationRoutes = require('./src/routes/registrationRoutes');
const workspaceRoutes = require('./src/routes/workspaceRoutes');
const deviceRoutes = require('./src/routes/deviceRoutes');
const ipPoolRoutes = require('./src/routes/ipPoolRoutes');
const botRoutes = require('./src/routes/botRoutes');
const { startWhatsApp } = require('./src/services/whatsappService');
const { handleCommand } = require('./src/bot/commandHandler');
const { sendWhatsAppMessage } = require('./src/services/whatsappService');
const { generateAndSendDailyReports } = require('./src/bot/reportGenerator');


const alarmState = new Map();

const app = express();
const server = http.createServer(app);

app.set('trust proxy', 1);
const allowedOrigins = [
    'https://alinos-dashboard.my.id',
    'http://localhost:5173'
];
app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Tidak diizinkan oleh CORS'));
        }
    },
    credentials: true,
}));
app.use(helmet());
app.use(express.json());
app.use(cookieParser());
app.use(require('./src/middleware/logger'));
const apiLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 500, standardHeaders: true, legacyHeaders: false });

app.use('/public', express.static('public'));

app.use('/api', apiLimiter); 

app.use('/api', apiRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/pppoe', pppoeRoutes);
app.use('/api/assets', assetRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/clone', cloneRoutes);
app.use('/api/hotspot', hotspotRoutes);
app.use('/api/import', importRoutes);
app.use('/api/register', registrationRoutes);
app.use('/api/workspaces', workspaceRoutes);
app.use('/api/devices', deviceRoutes);
app.use('/api/ip-pools', ipPoolRoutes);
app.use('/api/bot', botRoutes);

const wss = new WebSocket.Server({ server, path: "/ws" });
const workspaceConnections = new Map();

function broadcastToWorkspace(workspaceId, data) {
    wss.clients.forEach((client) => {
        if (client.workspaceId === workspaceId && client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(data));
        }
    });
}

function stopWorkspaceMonitoring(workspaceId) {
    const connection = workspaceConnections.get(workspaceId);
    if (connection) {
        console.log(`[Manager] Menghentikan monitoring untuk workspace ID: ${workspaceId}`);
        clearInterval(connection.intervalId);
        if (connection.client && connection.client.connected) connection.client.close();
        workspaceConnections.delete(workspaceId);
    }
}

async function startWorkspaceMonitoring(workspaceId) {
    if (workspaceConnections.has(workspaceId) && workspaceConnections.get(workspaceId)?.client?.connected) {
        return;
    }
    console.log(`[Manager] Mencoba memulai monitoring untuk workspace ID: ${workspaceId}`);
    
    let client;
    try {
        const [workspaces] = await pool.query('SELECT active_device_id FROM workspaces WHERE id = ?', [workspaceId]);
        if (!workspaces[0]?.active_device_id) {
            broadcastToWorkspace(workspaceId, { type: 'config_error', message: 'Pilih perangkat aktif di Pengaturan.' });
            return;
        }
        const activeDeviceId = workspaces[0].active_device_id;
        const [devices] = await pool.query('SELECT * FROM mikrotik_devices WHERE id = ? AND workspace_id = ?', [activeDeviceId, workspaceId]);
        if (devices.length === 0) {
            broadcastToWorkspace(workspaceId, { type: 'config_error', message: `Perangkat aktif tidak ditemukan.` });
            return;
        }
        
        const device = devices[0];
        client = new RouterOSAPI({ host: device.host, user: device.user, password: device.password, port: device.port, keepalive: true });
        
        await client.connect();
        console.log(`[Manager] KONEKSI BERHASIL untuk workspace ID: ${workspaceId} ke ${device.name}`);

        const runMonitoringCycle = async () => {
            if (!client?.connected) {
                stopWorkspaceMonitoring(workspaceId); return;
            }
            try {
                const safeWrite = (command, params = []) => client.write(command, params).catch(err => []);
                const [alarms] = await pool.query('SELECT * FROM alarms WHERE workspace_id = ?', [workspaceId]);
                const pppoeAlarm = alarms.find(a => a.type === 'PPPOE_TRAFFIC');
                const [resource, activePppoeUsers, allInterfaces, activeHotspotUsers, simpleQueues] = await Promise.all([
                    safeWrite('/system/resource/print'),
                    safeWrite('/ppp/active/print', ['?service=pppoe']),
                    safeWrite('/interface/print'),
                    safeWrite('/ip/hotspot/active/print'),
                    safeWrite('/queue/simple/print')
                ]);

                const pppoeInterfaces = activePppoeUsers.map(user => `<pppoe-${user.name}>`);
                const etherInterfaces = allInterfaces.filter(iface => iface.type === 'ether').map(iface => iface.name);
                const trafficPromises = [...etherInterfaces, ...pppoeInterfaces].map(async (ifaceName) => {
                    try {
                        const [[trafficDetails], [interfaceDetails]] = await Promise.all([
                            client.write('/interface/monitor-traffic', [`=interface=${ifaceName}`, '=once=']),
                            client.write('/interface/print', [`?name=${ifaceName}`])
                        ]);
                        let remoteAddress = null;
                        if (ifaceName.startsWith('<pppoe-')) {
                            const username = ifaceName.substring(7, ifaceName.length - 1);
                            const pppUser = activePppoeUsers.find(u => u.name === username);
                            if (pppUser) remoteAddress = pppUser.address;
                        }
                        return { interface: ifaceName, data: { ...trafficDetails, 'rx-byte': interfaceDetails?.['rx-byte'] || '0', 'tx-byte': interfaceDetails?.['tx-byte'] || '0', ...(remoteAddress && { address: remoteAddress }) }};
                    } catch (e) { return null; }
                });
                
                const queueMap = new Map(simpleQueues.map(q => [q.target.split('/')[0], q]));
                const enrichedHotspotUsers = activeHotspotUsers.map(user => {
                    const queue = queueMap.get(user.address);
                    const rates = queue?.rate?.split('/') || ['0', '0'];
                    return { ...user, uploadSpeed: parseFloat(rates[0]) || 0, downloadSpeed: parseFloat(rates[1]) || 0 };
                });

                const trafficResults = await Promise.all(trafficPromises);
                const trafficUpdateBatch = {};
                trafficResults.filter(r => r).forEach(result => { trafficUpdateBatch[result.interface] = result.data; });
                if (pppoeAlarm) {
                    const thresholdBps = pppoeAlarm.threshold_mbps * 1000 * 1000;
                    
                    activePppoeUsers.forEach(async (user) => {
                        const ifaceName = `<pppoe-${user.name}>`;
                        const trafficData = trafficUpdateBatch[ifaceName];
                        if (!trafficData) return;

                        const downloadSpeed = parseFloat(trafficData['rx-bits-per-second']);
                        
                        if (downloadSpeed > thresholdBps) {
                            const lastAlert = alarmState.get(ifaceName) || 0;
                            const now = Date.now();
                            if (now - lastAlert > 15 * 60 * 1000) {
                                console.log(`[ALARM] Memicu alarm untuk ${user.name}`);
                                const [ownerInfo] = await pool.query('SELECT u.whatsapp_number FROM users u JOIN workspaces w ON u.id = w.owner_id WHERE w.id = ?', [workspaceId]);
                                if (ownerInfo[0]?.whatsapp_number) {
                                    const ownerNumber = ownerInfo[0].whatsapp_number;
                                    const speedMbps = (downloadSpeed / 1000 / 1000).toFixed(2);
                                    const alarmMessage = `🚨 *ALARM TRAFFIC TINGGI* 🚨\n\nPengguna PPPoE \`${user.name}\` terdeteksi menggunakan bandwidth *${speedMbps} Mbps*, melebihi batas alarm Anda (*${pppoeAlarm.threshold_mbps} Mbps*).`;
                                    sendWhatsAppMessage(ownerNumber, alarmMessage);
                                    alarmState.set(ifaceName, now);
                                }
                            }
                        }
                    });
                }
                const batchPayload = { resource: resource[0] || {}, traffic: trafficUpdateBatch, hotspotActive: enrichedHotspotUsers };
                broadcastToWorkspace(workspaceId, { type: 'batch-update', payload: batchPayload });
                
            } catch (cycleError) {
                console.error(`[Cycle Error] Workspace ID ${workspaceId}:`, cycleError.message);
                stopWorkspaceMonitoring(workspaceId);
            }
        };

        const intervalId = setInterval(runMonitoringCycle, 500);
        workspaceConnections.set(workspaceId, { client, intervalId, userCount: 0 });
        runMonitoringCycle();

    } catch (connectError) {
        console.error(`[Manager] GAGAL terhubung ke MikroTik untuk workspace ID ${workspaceId}:`, connectError.message);
        broadcastToWorkspace(workspaceId, { type: 'error', message: `Gagal terhubung ke perangkat` });
        if(client?.connected) client.close();
    }
};

wss.on('connection', async (ws, req) => {
    try {
        const cookieHeader = req.headers.cookie || '';
        const cookies = Object.fromEntries(cookieHeader.split(';').map(c => c.trim().split('=').map(decodeURIComponent)));
        const token = cookies.token;
        if (!token) return ws.close(1008, "Tidak ada token");

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_default_secret_key');
        const [users] = await pool.query('SELECT workspace_id FROM users WHERE id = ?', [decoded.id]);
        if (users.length === 0) return ws.close(1008, "User tidak ditemukan");

        const workspaceId = users[0].workspace_id;
        ws.workspaceId = workspaceId;
        console.log(`[WebSocket] Token valid. User ID: ${decoded.id}, terhubung ke Workspace ID: ${workspaceId}`);

        if (!workspaceId) return;

        let connection = workspaceConnections.get(workspaceId);
        if (!connection || !connection.client?.connected) {
            await startWorkspaceMonitoring(workspaceId);
            connection = workspaceConnections.get(workspaceId);
        }

        if (connection) {
            connection.userCount++;
            console.log(`User terhubung ke workspace ${workspaceId}. Total user di workspace ini: ${connection.userCount}`);
        }
        
        ws.on('close', () => {
            if (workspaceId) {
                const connection = workspaceConnections.get(workspaceId);
                if (connection) {
                    connection.userCount--;
                    console.log(`User terputus dari workspace ${workspaceId}. Sisa user: ${connection.userCount}`);
                    if (connection.userCount <= 0) {
                        stopWorkspaceMonitoring(workspaceId);
                    }
                }
            }
        });
    } catch (error) {
        ws.close(1008, "Token tidak valid atau error lain");
    }
});


const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log(`Server backend berjalan di port ${PORT}`);
    startWhatsApp(handleCommand);
    cron.schedule('0 8 * * *', () => {
        generateAndSendDailyReports();
    }, {
        scheduled: true,
        timezone: "Asia/Jakarta"
    });
    console.log('[Scheduler] Penjadwal laporan harian telah diaktifkan, akan berjalan setiap jam 8 pagi WIB.');
});