const workspaceConnections = new Map();
const getConnection = (workspaceId) => {
    return workspaceConnections.get(workspaceId);
};

const addConnection = (workspaceId, connectionData) => {
    const dataWithUserCount = { ...connectionData, userCount: 0 };
    workspaceConnections.set(workspaceId, dataWithUserCount);
};

const removeConnection = (workspaceId) => {
    const connection = workspaceConnections.get(workspaceId);
    if (connection) {
        console.log(`[Connection Manager] Menghapus koneksi untuk workspace ID: ${workspaceId}`);
        clearInterval(connection.intervalId);
        if (connection.client && connection.client.connected) {
            connection.client.close().catch(err => console.error("Error saat menutup koneksi lama:", err));
        }
        workspaceConnections.delete(workspaceId);
    }
};

module.exports = {
    workspaceConnections,
    getConnection,
    addConnection,
    removeConnection
};