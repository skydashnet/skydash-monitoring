const { runCommandForUser } = require('../utils/apiConnection');
const pool = require('../config/database');

exports.getSystemResource = async (req, res) => {
    try {
        const resources = await runCommandForUser(req.user.id, '/system/resource/print');
        res.json(resources[0]);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getUserDevice = async (req, res) => {
    const workspaceId = req.user.workspace_id;
    if (!workspaceId) {
        return res.status(404).json({ message: 'Belum ada perangkat yang dikonfigurasi.' });
    }
    try {
        const [devices] = await pool.query('SELECT id, host, user, name, port FROM mikrotik_devices WHERE workspace_id = ?', [workspaceId]);
        if (devices.length > 0) {
            res.json(devices[0]);
        } else {
            res.status(404).json({ message: 'Belum ada perangkat yang dikonfigurasi.' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Gagal mengambil data perangkat', error: error.message });
    }
};

exports.saveUserDevice = async (req, res) => {
    let workspaceId = req.user.workspace_id;
    const userId = req.user.id;
    const { host, user, password, name, port } = req.body;

    if (!host || !user || !name || !port) {
        return res.status(400).json({ message: 'Semua field harus diisi' });
    }

    const dbConnection = await pool.getConnection();

    try {
        await dbConnection.beginTransaction();
        if (!workspaceId) {
            const [wsResult] = await dbConnection.query(
                'INSERT INTO workspaces (name, owner_id) VALUES (?, ?)',
                [`${req.user.username}'s Workspace`, userId]
            );
            workspaceId = wsResult.insertId;
            await dbConnection.query('UPDATE users SET workspace_id = ? WHERE id = ?', [workspaceId, userId]);
        }
        const sql = `
            INSERT INTO mikrotik_devices (host, user, password, name, port, workspace_id) 
            VALUES (?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE host=VALUES(host), user=VALUES(user), password=VALUES(password), name=VALUES(name), port=VALUES(port)
        `;
        const devicePassword = password && password.length > 0 ? password : null;
        await dbConnection.query(sql, [host, user, devicePassword, name, port, workspaceId]);

        await dbConnection.commit();
        res.status(200).json({ message: 'Konfigurasi perangkat berhasil disimpan' });

    } catch (error) {
        await dbConnection.rollback();
        console.error("DATABASE SAVE DEVICE ERROR:", error);
        res.status(500).json({ message: 'Gagal menyimpan konfigurasi', error: error.message });
    } finally {
        dbConnection.release();
    }
};