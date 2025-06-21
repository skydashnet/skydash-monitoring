const pool = require('../config/database');
let RouterOSAPI = require('node-routeros');
if (RouterOSAPI.RouterOSAPI) { RouterOSAPI = RouterOSAPI.RouterOSAPI; }

/**
 * @param {object} workspace - Objek berisi id, active_device_id
 */
async function logStatsForWorkspace(workspace) {
    let client;
    try {
        const [devices] = await pool.query('SELECT * FROM mikrotik_devices WHERE id = ?', [workspace.active_device_id]);
        if (devices.length === 0) {
            console.log(`[Data Logger] Tidak ada perangkat aktif untuk workspace ${workspace.id}`);
            return;
        }
        const device = devices[0];
        if (!device.wan_interface) {
            console.log(`[Data Logger] Lewati workspace ${workspace.id}, interface WAN belum diatur untuk perangkat ${device.name}.`);
            return;
        }

        client = new RouterOSAPI({
            host: device.host, user: device.user, password: device.password,
            port: device.port, timeout: 15
        });
        await client.connect();
        const [activePppoe, activeHotspot] = await Promise.all([
            client.write('/ppp/active/print', ['=count-only=']).then(r => r[0]?.count || 0).catch(() => 0),
            client.write('/ip/hotspot/active/print', ['=count-only=']).then(r => r[0]?.count || 0).catch(() => 0)
        ]);
        const [wanInterfaceData] = await client.write('/interface/print', [`?name=${device.wan_interface}`]).catch(() => [null]);
        
        client.close();
        const stats = {
            workspace_id: workspace.id,
            device_id: device.id,
            active_pppoe_count: parseInt(activePppoe, 10),
            active_hotspot_count: parseInt(hotspotActive, 10),
            total_rx_bytes: wanInterfaceData ? parseInt(wanInterfaceData['rx-byte'], 10) : 0,
            total_tx_bytes: wanInterfaceData ? parseInt(wanInterfaceData['tx-byte'], 10) : 0,
        };
        await pool.query('INSERT INTO historical_stats SET ?', stats);
        console.log(`[Data Logger] Statistik untuk workspace ${workspace.id} (WAN: ${device.wan_interface}) berhasil dicatat.`);

    } catch (error) {
        if (client && client.connected) client.close();
        console.error(`[Data Logger] Gagal mencatat statistik untuk workspace ${workspace.id}:`, error.message);
    }
}

async function logAllActiveWorkspaces() {
    console.log(`[Data Logger] Memulai tugas pencatatan statistik... (${new Date().toLocaleTimeString()})`);
    try {
        const [workspaces] = await pool.query('SELECT id, active_device_id FROM workspaces WHERE active_device_id IS NOT NULL');
        
        if (workspaces.length === 0) {
            console.log("[Data Logger] Tidak ada workspace dengan perangkat aktif untuk dicatat.");
            return;
        }
        for (const workspace of workspaces) {
            await logStatsForWorkspace(workspace);
        }
    } catch (error) {
        console.error("[Data Logger] Terjadi error saat mengambil data workspace:", error);
    }
}

module.exports = { logAllActiveWorkspaces };
