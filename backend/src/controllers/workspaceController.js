const pool = require('../config/database');

exports.setActiveDevice = async (req, res) => {
    const workspaceId = req.user.workspace_id;
    const { deviceId } = req.body;
    try {
        await pool.query('UPDATE workspaces SET active_device_id = ? WHERE id = ?', [deviceId, workspaceId]);
        res.status(200).json({ message: 'Perangkat aktif berhasil diubah.' });
    } catch (error) {
        res.status(500).json({ message: 'Gagal mengubah perangkat aktif', error: error.message });
    }
};

exports.getWorkspace = async (req, res) => {
    const workspaceId = req.user.workspace_id;
    if (!workspaceId) {
        return res.status(404).json({ message: 'Workspace tidak ditemukan.' });
    }
    try {
        const [workspaces] = await pool.query('SELECT * FROM workspaces WHERE id = ?', [workspaceId]);
        res.json(workspaces[0]);
    } catch (error) {
        res.status(500).json({ message: 'Gagal mengambil data workspace.' });
    }
};