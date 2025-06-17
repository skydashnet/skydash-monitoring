const pool = require('../config/database');

let RouterOSAPI = require('node-routeros');
if (RouterOSAPI.RouterOSAPI) {
    RouterOSAPI = RouterOSAPI.RouterOSAPI;
}

const runCommandForWorkspace = async (workspaceId, command, params = []) => {
    if (!workspaceId) {
        throw new Error('Pengguna tidak berada dalam workspace manapun.');
    }
    const [devices] = await pool.query('SELECT * FROM mikrotik_devices WHERE workspace_id = ?', [workspaceId]);
    if (devices.length === 0) {
        throw new Error('Perangkat belum dikonfigurasi untuk workspace ini.');
    }
    const device = devices[0];

    const client = new RouterOSAPI({
        host: device.host,
        user: device.user,
        password: device.password,
        port: device.port,
        timeout: 5
    });

    try {
        await client.connect();
        const result = await client.write(command, params);
        client.close();
        return result;
    } catch (error) {
        if (client.connected) client.close();
        throw error;
    }
};

module.exports = { runCommandForWorkspace };