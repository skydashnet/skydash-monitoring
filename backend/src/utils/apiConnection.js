const { getConnection } = require('../services/connectionManager');
const pool = require('../config/database');
let RouterOSAPI = require('node-routeros');
if (RouterOSAPI.RouterOSAPI) {
    RouterOSAPI = RouterOSAPI.RouterOSAPI;
}

async function runCommandForWorkspace(workspaceId, command, params = []) {
    if (!workspaceId) {
        throw new Error('Workspace ID tidak valid.');
    }
    const [workspaces] = await pool.query('SELECT active_device_id FROM workspaces WHERE id = ?', [workspaceId]);
    if (!workspaces[0]?.active_device_id) {
        throw new Error(`Tidak ada perangkat aktif yang terkonfigurasi untuk workspace ID ${workspaceId}.`);
    }
    const deviceId = workspaces[0].active_device_id;
    const persistentConnection = getConnection(deviceId);

    if (persistentConnection && persistentConnection.client && persistentConnection.client.connected) {
        console.log(`[API Command] Efisien: Menggunakan koneksi persisten untuk device ${deviceId} -> ${command}`);
        try {
            return await persistentConnection.client.write(command, params);
        } catch (error) {
            console.error(`[API Command Error] Gagal menjalankan "${command}" pada koneksi persisten:`, error.message);
            throw error;
        }
    } else {
        console.log(`[API Command] Fallback: Membuat koneksi sementara untuk device ${deviceId} -> ${command}`);
        let tempClient;
        try {
            const [devices] = await pool.query('SELECT * FROM mikrotik_devices WHERE id = ?', [deviceId]);
            if (devices.length === 0) throw new Error(`Perangkat dengan ID ${deviceId} tidak ditemukan.`);
            const device = devices[0];

            tempClient = new RouterOSAPI({ host: device.host, user: device.user, password: device.password, port: device.port });
            await tempClient.connect();
            const results = await tempClient.write(command, params);
            tempClient.close();
            return results;
        } catch (error) {
            if (tempClient && tempClient.connected) tempClient.close();
            console.error(`[API Command Error] Gagal menjalankan "${command}" pada koneksi sementara:`, error.message);
            throw error;
        }
    }
}

module.exports = { runCommandForWorkspace };
