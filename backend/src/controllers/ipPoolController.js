const pool = require('../config/database');

exports.getPools = async (req, res) => {
    const workspaceId = req.user.workspace_id;
    if (!workspaceId) {
        return res.json([]);
    }
    try {
        const [pools] = await pool.query('SELECT * FROM ip_pools WHERE workspace_id = ? ORDER BY profile_name ASC', [workspaceId]);
        res.json(pools);
    } catch (error) {
        console.error("GET POOLS ERROR:", error);
        res.status(500).json({ message: 'Gagal mengambil data IP Pools', error: error.message });
    }
};

exports.addPool = async (req, res) => {
    const workspaceId = req.user.workspace_id;
    const { profile_name, ip_start, ip_end, gateway } = req.body;
    if (!workspaceId || !profile_name || !ip_start || !ip_end || !gateway) {
        return res.status(400).json({ message: 'Semua field harus diisi.' });
    }
    try {
        const sql = `
            INSERT INTO ip_pools (workspace_id, profile_name, ip_start, ip_end, gateway) 
            VALUES (?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE ip_start=VALUES(ip_start), ip_end=VALUES(ip_end), gateway=VALUES(gateway)`;
        await pool.query(sql, [workspaceId, profile_name, ip_start, ip_end, gateway]);
        res.status(201).json({ message: `IP Pool untuk profil ${profile_name} berhasil disimpan.` });
    } catch (error) {
        console.error("ADD/UPDATE POOL ERROR:", error);
        res.status(500).json({ message: 'Gagal menyimpan IP Pool', error: error.message });
    }
};

exports.deletePool = async (req, res) => {
    const workspaceId = req.user.workspace_id;
    const { id } = req.params;
    try {
        const [result] = await pool.query('DELETE FROM ip_pools WHERE id = ? AND workspace_id = ?', [id, workspaceId]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'IP Pool tidak ditemukan atau Anda tidak punya izin.' });
        }
        res.status(200).json({ message: 'IP Pool berhasil dihapus.' });
    } catch (error) {
        console.error("DELETE POOL ERROR:", error);
        res.status(500).json({ message: 'Gagal menghapus IP Pool.', error: error.message });
    }
};