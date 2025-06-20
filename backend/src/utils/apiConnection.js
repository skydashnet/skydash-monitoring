const { getConnection } = require('../services/connectionManager');

const runCommandForWorkspace = async (workspaceId, command, params = []) => {
    if (!workspaceId) {
        throw new Error('Pengguna tidak berada dalam workspace manapun.');
    }
    const connection = getConnection(workspaceId);
    if (!connection || !connection.client || !connection.client.connected) {
        throw new Error('Koneksi ke perangkat tidak aktif. Harap refresh halaman atau tunggu data live.');
    }
    try {
        const result = await connection.client.write(command, params);
        return result;
    } catch (error) {
        console.error(`Gagal menjalankan perintah API '${command}' di workspace ${workspaceId}:`, error);
        throw error;
    }
};

module.exports = { runCommandForWorkspace };
