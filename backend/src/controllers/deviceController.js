const pool = require('../config/database');

exports.listDevices = async (req, res) => {
    const workspaceId = req.user.workspace_id;
    if (!workspaceId) return res.json([]);
    try {
        const [devices] = await pool.query('SELECT * FROM mikrotik_devices WHERE workspace_id = ?', [workspaceId]);
        res.json(devices);
    } catch (error) {
        res.status(500).json({ message: 'Gagal mengambil daftar perangkat', error: error.message });
    }
};

exports.addDevice = async (req, res) => {
    const workspaceId = req.user.workspace_id;
    if (!workspaceId) return res.status(403).json({ message: 'Anda harus berada di workspace untuk menambah perangkat.' });
    
    const { name, host, user, password, port } = req.body;
    if (!name || !host || !user || !port) {
        return res.status(400).json({ message: 'Nama, Host, User, dan Port harus diisi.' });
    }
    try {
        await pool.query(
            'INSERT INTO mikrotik_devices (workspace_id, name, host, user, password, port) VALUES (?, ?, ?, ?, ?, ?)',
            [workspaceId, name, host, user, password || null, port]
        );
        res.status(201).json({ message: 'Perangkat berhasil ditambahkan.' });
    } catch (error) {
        res.status(500).json({ message: 'Gagal menambah perangkat', error: error.message });
    }
};

exports.updateDevice = async (req, res) => {
    const { id } = req.params;
    const workspaceId = req.user.workspace_id;
    const { name, host, user, password, port } = req.body;
    if (!name || !host || !user || !port) {
        return res.status(400).json({ message: 'Semua field wajib diisi.' });
    }
    try {
        const [devices] = await pool.query('SELECT id FROM mikrotik_devices WHERE id = ? AND workspace_id = ?', [id, workspaceId]);
        if (devices.length === 0) {
            return res.status(403).json({ message: 'Aksi tidak diizinkan.' });
        }
        
        let query, params;
        if (password && password.length > 0) {
            query = 'UPDATE mikrotik_devices SET name = ?, host = ?, user = ?, port = ?, password = ? WHERE id = ?';
            params = [name, host, user, port, password, id];
        } else {
            query = 'UPDATE mikrotik_devices SET name = ?, host = ?, user = ?, port = ? WHERE id = ?';
            params = [name, host, user, port, id];
        }
        
        await pool.query(query, params);
        res.status(200).json({ message: 'Perangkat berhasil diperbarui.' });
    } catch (error) {
        res.status(500).json({ message: 'Gagal memperbarui perangkat.', error: error.message });
    }
};

exports.deleteDevice = async (req, res) => {
    const { id } = req.params;
    const workspaceId = req.user.workspace_id;
    try {
        const [result] = await pool.query('DELETE FROM mikrotik_devices WHERE id = ? AND workspace_id = ?', [id, workspaceId]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Perangkat tidak ditemukan atau Anda tidak memiliki izin.' });
        }
        const [workspaces] = await pool.query('SELECT active_device_id FROM workspaces WHERE id = ?', [workspaceId]);
        if (workspaces.length > 0 && workspaces[0].active_device_id === parseInt(id, 10)) {
            await pool.query('UPDATE workspaces SET active_device_id = NULL WHERE id = ?', [workspaceId]);
        }
        res.status(200).json({ message: 'Perangkat berhasil dihapus.' });
    } catch (error) {
        res.status(500).json({ message: 'Gagal menghapus perangkat.', error: error.message });
    }
};