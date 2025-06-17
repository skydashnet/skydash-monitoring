const pool = require('../config/database');

exports.getAssets = async (req, res) => {
    const workspaceId = req.user.workspace_id;
    if (!workspaceId) {
        return res.json([]);
    }
    try {
        const [assets] = await pool.query('SELECT * FROM network_assets WHERE workspace_id = ? ORDER BY name ASC', [workspaceId]);
        res.json(assets);
    } catch (error) {
        res.status(500).json({ message: 'Gagal mengambil data aset', error: error.message });
    }
};

exports.addAsset = async (req, res) => {
    const workspaceId = req.user.workspace_id;
    if (!workspaceId) {
        return res.status(400).json({ message: 'Tidak bisa menambah aset, Anda belum tergabung dalam workspace.' });
    }
    const { name, type, latitude, longitude, description, splitter_count } = req.body;
    if (!name || !type || !latitude || !longitude) {
        return res.status(400).json({ message: 'Field yang wajib diisi tidak boleh kosong.' });
    }
    try {
        const [result] = await pool.query(
            'INSERT INTO network_assets (workspace_id, name, type, latitude, longitude, description, splitter_count) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [workspaceId, name, type, latitude, longitude, description, splitter_count || null]
        );
        res.status(201).json({ message: 'Aset berhasil ditambahkan', assetId: result.insertId });
    } catch (error) {
        console.error("ADD ASSET ERROR:", error);
        res.status(500).json({ message: 'Gagal menambah aset', error: error.message });
    }
};

exports.updateAsset = async (req, res) => {
    const assetId = req.params.id;
    const workspaceId = req.user.workspace_id;
    const { name, type, latitude, longitude, description, splitter_count } = req.body;
    if (!name || !type || !latitude || !longitude) {
        return res.status(400).json({ message: 'Field yang wajib diisi tidak boleh kosong.' });
    }
    try {
        const [result] = await pool.query(
            'UPDATE network_assets SET name=?, type=?, latitude=?, longitude=?, description=?, splitter_count=? WHERE id = ? AND workspace_id = ?',
            [name, type, latitude, longitude, description, splitter_count || null, assetId, workspaceId]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Aset tidak ditemukan atau Anda tidak memiliki izin untuk mengeditnya.' });
        }
        res.status(200).json({ message: 'Aset berhasil diperbarui.' });
    } catch (error) {
        console.error("UPDATE ASSET ERROR:", error);
        res.status(500).json({ message: 'Gagal memperbarui aset', error: error.message });
    }
};

exports.deleteAsset = async (req, res) => {
    const assetId = req.params.id;
    const workspaceId = req.user.workspace_id;
    try {
        const [result] = await pool.query('DELETE FROM network_assets WHERE id = ? AND workspace_id = ?', [assetId, workspaceId]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Aset tidak ditemukan atau Anda tidak memiliki izin untuk menghapusnya.' });
        }
        res.status(200).json({ message: 'Aset berhasil dihapus.' });
    } catch (error) {
        console.error("DELETE ASSET ERROR:", error);
        res.status(500).json({ message: 'Gagal menghapus aset', error: error.message });
    }
};

exports.getUnassignedAssets = async (req, res) => {
    const workspaceId = req.user.workspace_id;
    const { type } = req.query;
    if (!workspaceId) return res.json([]);
    try {
        const [assets] = await pool.query(
            'SELECT id, name FROM network_assets WHERE workspace_id = ? AND type = ? AND parent_asset_id IS NULL',
            [workspaceId, type]
        );
        res.json(assets);
    } catch (error) {
        res.status(500).json({ message: 'Gagal mengambil aset', error: error.message });
    }
};

exports.assignOdpToOdc = async (req, res) => {
    const { odpId } = req.body;
    const { odcId } = req.params;
    const workspaceId = req.user.workspace_id;
    try {
        await pool.query(
            'UPDATE network_assets SET parent_asset_id = ? WHERE id = ? AND workspace_id = ?',
            [odcId, odpId, workspaceId]
        );
        res.status(200).json({ message: `ODP berhasil terhubung ke ODC.` });
    } catch (error) {
        res.status(500).json({ message: 'Gagal menghubungkan ODP', error: error.message });
    }
};

exports.getConnectedOdps = async (req, res) => {
    const { id: odcId } = req.params;
    const workspaceId = req.user.workspace_id;
    try {
        const [assets] = await pool.query(
            'SELECT id, name, type FROM network_assets WHERE workspace_id = ? AND parent_asset_id = ?',
            [workspaceId, odcId]
        );
        res.json(assets);
    } catch (error) {
        res.status(500).json({ message: 'Gagal mengambil ODP yang terhubung', error: error.message });
    }
};