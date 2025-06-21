const pool = require('../config/database');
let RouterOSAPI = require('node-routeros');
if (RouterOSAPI.RouterOSAPI) { RouterOSAPI = RouterOSAPI.RouterOSAPI; }

/**
 * @param {object} workspace
 */
async function logStatsForWorkspace(workspace) {
    let client;
    try {
        const [devices] = await pool.query('SELECT * FROM mikrotik_devices WHERE id = ?', [workspace.active_device_id]);
        if (devices.length === 0) return;
        
        const device = devices[0];
        client = new RouterOSAPI({
            host: device.host, user: device.user, password: device.password,
            port: device.port, timeout: 15
        });
        await client.connect();
        const [activePppoe, activeHotspot, interfaces] = await Promise.all([
            client.write('/ppp/active/print').catch(() => []),
            client.write('/ip/hotspot/active/print').catch(() => []),
            client.write('/interface/print').catch(() => []),
        ]);

        client.close();

        const totalRx = interfaces
            .filter(iface => ['ether', 'wlan'].includes(iface.type))
            .reduce((sum, iface) => sum + parseInt(iface['rx-byte'], 10), 0);

        const totalTx = interfaces
            .filter(iface => ['ether', 'wlan'].includes(iface.type))
            .reduce((sum, iface) => sum + parseInt(iface['tx-byte'], 10), 0);

        const stats = {
            workspace_id: workspace.id,
            device_id: device.id,
            active_pppoe_count: activePppoe.length,
            active_hotspot_count: activeHotspot.length,
            total_rx_bytes: totalRx,
            total_tx_bytes: totalTx
        };
        await pool.query('INSERT INTO historical_stats SET ?', stats);
        console.log(`[Data Logger] Statistik untuk workspace ${workspace.id} berhasil dicatat.`);

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
