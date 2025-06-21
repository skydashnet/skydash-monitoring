const pool = require('../config/database');
const { sendWhatsAppMessage } = require('../services/whatsappService');

let RouterOSAPI = require('node-routeros');
if (RouterOSAPI.RouterOSAPI) {
    RouterOSAPI = RouterOSAPI.RouterOSAPI;
}

const formatDataSize = (bytes) => {
    if (!+bytes || bytes < 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

const formatSpeed = (bits) => {
    if (!+bits || bits < 0) return '0 Kbps';
    const k = 1000;
    const sizes = ['bps', 'Kbps', 'Mbps', 'Gbps'];
    const i = Math.floor(Math.log(bits) / Math.log(k));
    return `${parseFloat((bits / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

/**
 * @param {object} workspace
 */
async function generateSingleAnalyticReport(workspace) {
    console.log(`[Analis Laporan] Memproses workspace: ${workspace.name} (ID: ${workspace.id})`);
    
    try {
        const [stats] = await pool.query(
            'SELECT * FROM historical_stats WHERE workspace_id = ? AND timestamp >= NOW() - INTERVAL 1 DAY ORDER BY timestamp ASC',
            [workspace.id]
        );

        if (stats.length < 2) {
            console.log(`[Analis Laporan] Data historis tidak cukup untuk workspace ${workspace.id}, mengirim laporan snapshot.`);
            await sendSimpleSnapshot(workspace);
            return;
        }

        let peakTotalUsers = 0;
        let peakTrafficRecord = stats[0];
        let maxThroughput = 0;

        stats.forEach(stat => {
            const totalCurrentUser = stat.active_pppoe_count + stat.active_hotspot_count;
            if (totalCurrentUser > peakTotalUsers) {
                peakTotalUsers = totalCurrentUser;
            }
            const currentThroughput = (stat.peak_rx_bps || 0) + (stat.peak_tx_bps || 0);
            if (currentThroughput > maxThroughput) {
                maxThroughput = currentThroughput;
                peakTrafficRecord = stat;
            }
        });
        
        const firstRecord = stats[0];
        const lastRecord = stats[stats.length - 1];
        const totalDataUsed = (lastRecord.total_rx_bytes - firstRecord.total_rx_bytes) + (lastRecord.total_tx_bytes - firstRecord.total_tx_bytes);
        
        const peakHour = new Date(peakTrafficRecord.timestamp).getHours();
        const busyTime = `sekitar jam *${String(peakHour).padStart(2, '0')}:00*`;
        const snapshotData = await getLiveSnapshot(workspace);
        const date = new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' });
        let reportMessage = `*Laporan Harian SkydashNET* 📈\n_Ringkasan untuk ${date}_\n\n`;
        reportMessage += `Berikut adalah analisis jaringan untuk *${workspace.name}*:\n\n`;
        
        reportMessage += `*📊 Analisis 24 Jam Terakhir:*\n`;
        reportMessage += `> Total Data Terpakai: *${formatDataSize(totalDataUsed)}*\n`;
        reportMessage += `> Puncak Aktivitas: ${busyTime}\n`;
        reportMessage += `> dengan *${peakTotalUsers}* pengguna & traffic *${formatSpeed(maxThroughput)}*\n\n`;

        reportMessage += `* snapshot saat ini:*\n`;
        reportMessage += `> PPPoE Aktif: *${snapshotData.pppoeActive}*\n`;
        reportMessage += `> Hotspot Aktif: *${snapshotData.hotspotActive}*\n\n`;
        
        reportMessage += `_Semoga harimu lancar!_\n- Bot Analis SkydashNET`;

        await sendWhatsAppMessage(workspace.whatsapp_number, reportMessage);
        console.log(`[Analis Laporan] Laporan analitik berhasil dikirim ke workspace ${workspace.name}`);
        return { success: true, workspaceName: workspace.name };

    } catch (error) {
        console.error(`[Analis Laporan] GAGAL membuat laporan untuk workspace ID ${workspace.id}:`, error.message);
        return { success: false, workspaceName: workspace.name, error: error.message };
    }
}

async function getLiveSnapshot(workspace) {
    let client;
    try {
        const [devices] = await pool.query('SELECT * FROM mikrotik_devices WHERE id = (SELECT active_device_id FROM workspaces WHERE id = ?)', [workspace.id]);
        if (devices.length === 0) throw new Error('Perangkat aktif tidak ditemukan');
        
        client = new RouterOSAPI({ host: devices[0].host, user: devices[0].user, password: devices[0].password, port: devices[0].port, timeout: 10 });
        await client.connect();

        const pppoeActive = (await client.write('/ppp/active/print', ['=count-only=']))[0]?.count || '0';
        const hotspotActive = (await client.write('/ip/hotspot/active/print', ['=count-only=']))[0]?.count || '0';
        client.close();
        return { pppoeActive, hotspotActive };
    } catch(e) {
        if (client && client.connected) client.close();
        console.error(`Gagal mengambil snapshot untuk workspace ${workspace.id}:`, e.message);
        return { pppoeActive: 'N/A', hotspotActive: 'N/A' };
    }
}

async function sendSimpleSnapshot(workspace) {
    const snapshotData = await getLiveSnapshot(workspace);
    const snapshotMessage = `*Laporan Snapshot Pagi* ☀️\n\n_Data historis belum cukup untuk analisis._\n\n*Kondisi Saat Ini:*\n- Pengguna PPPoE Aktif: *${snapshotData.pppoeActive}*\n- Pengguna Hotspot Aktif: *${snapshotData.hotspotActive}*`;
    await sendWhatsAppMessage(workspace.whatsapp_number, snapshotMessage);
}

async function generateAndSendDailyReports() {
    console.log(`[Laporan Harian] Memulai proses terjadwal... (${new Date().toLocaleTimeString()})`);
    try {
        const [workspaces] = await pool.query(
            `SELECT w.id, w.name, u.whatsapp_number 
             FROM workspaces w 
             JOIN users u ON w.owner_id = u.id 
             WHERE w.whatsapp_bot_enabled = TRUE AND u.whatsapp_number IS NOT NULL`
        );
        
        for (const workspace of workspaces) {
            await generateSingleAnalyticReport(workspace);
        }
    } catch (error) {
        console.error("[Laporan Harian] Terjadi error saat mengambil data workspace:", error);
    }
}

module.exports = { generateAndSendDailyReports, generateSingleReport: generateSingleAnalyticReport };
