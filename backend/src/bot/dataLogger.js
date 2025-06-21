const pool = require('../config/database');
let RouterOSAPI = require('node-routeros');
if (RouterOSAPI.RouterOSAPI) { RouterOSAPI = RouterOSAPI.RouterOSAPI; }

async function logAllActiveWorkspaces() {
    console.log(`[Data Logger] Memulai tugas pencatatan statistik... (${new Date().toLocaleTimeString()})`);
    try {
        const [workspaces] = await pool.query(
            'SELECT w.id, w.active_device_id, d.host, d.user, d.password, d.port, d.wan_interface, d.name as device_name FROM workspaces w JOIN mikrotik_devices d ON w.active_device_id = d.id WHERE w.active_device_id IS NOT NULL'
        );
        
        if (workspaces.length === 0) {
            console.log("[Data Logger] Tidak ada workspace dengan perangkat aktif untuk dicatat.");
            return;
        }

        const workspacesByDevice = workspaces.reduce((acc, ws) => {
            const deviceId = ws.active_device_id;
            if (!acc[deviceId]) {
                acc[deviceId] = {
                    device: {
                        id: ws.active_device_id,
                        host: ws.host,
                        user: ws.user,
                        password: ws.password,
                        port: ws.port,
                        wan_interface: ws.wan_interface,
                        name: ws.device_name
                    },
                    workspaces: []
                };
            }
            acc[deviceId].workspaces.push({ id: ws.id });
            return acc;
        }, {});

        for (const deviceId in workspacesByDevice) {
            const group = workspacesByDevice[deviceId];
            const { device, workspaces: associatedWorkspaces } = group;
            let client;

            if (!device.wan_interface) {
                console.log(`[Data Logger] Lewati perangkat ${device.name}, interface WAN belum diatur.`);
                continue;
            }

            try {
                client = new RouterOSAPI({
                    host: device.host, user: device.user, password: device.password,
                    port: device.port, timeout: 15
                });
                await client.connect();
                console.log(`[Data Logger] Koneksi berhasil ke perangkat: ${device.name} (ID: ${deviceId})`);

                const [activePppoe, activeHotspot, [wanInterfaceData]] = await Promise.all([
                    client.write('/ppp/active/print').then(r => r.length).catch(() => 0),
                    client.write('/ip/hotspot/active/print').then(r => r.length).catch(() => 0),
                    client.write('/interface/print', [`?name=${device.wan_interface}`]).catch(() => [null])
                ]);

                client.close();
                const commonStats = {
                    device_id: device.id,
                    active_pppoe_count: activePppoe,
                    active_hotspot_count: activeHotspot,
                    total_rx_bytes: wanInterfaceData ? parseInt(wanInterfaceData['rx-byte'], 10) : 0,
                    total_tx_bytes: wanInterfaceData ? parseInt(wanInterfaceData['tx-byte'], 10) : 0,
                };
                
                for (const workspace of associatedWorkspaces) {
                    const finalStats = { ...commonStats, workspace_id: workspace.id };
                    await pool.query('INSERT INTO historical_stats SET ?', finalStats);
                    console.log(`[Data Logger] Statistik untuk workspace ${workspace.id} (dari perangkat ${device.name}) berhasil dicatat.`);
                }

            } catch (error) {
                if (client && client.connected) client.close();
                console.error(`[Data Logger] Gagal memproses perangkat ${device.name} (ID: ${deviceId}):`, error.message);
            }
        }

    } catch (error) {
        console.error("[Data Logger] Terjadi error saat mengambil data workspace:", error);
    }
}

module.exports = { logAllActiveWorkspaces };