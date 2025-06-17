const { runCommandForWorkspace } = require('../utils/apiConnection');

exports.getHotspotSummary = async (req, res) => {
    const workspaceId = req.user.workspace_id;
    if (!workspaceId) return res.json({ totalUsers: 0, activeUsers: 0 });
    try {
        const [users, active] = await Promise.all([
            runCommandForWorkspace(workspaceId, '/ip/hotspot/user/print'),
            runCommandForWorkspace(workspaceId, '/ip/hotspot/active/print')
        ]);
        res.json({ totalUsers: users.length, activeUsers: active.length });
    } catch (error) { res.status(500).json({ message: 'Gagal mengambil ringkasan Hotspot', error: error.message }); }
};

exports.getHotspotUsers = async (req, res) => {
    const workspaceId = req.user.workspace_id;
    if (!workspaceId) return res.json([]);
    try {
        const users = await runCommandForWorkspace(workspaceId, '/ip/hotspot/user/print');
        res.json(users);
    } catch (error) { res.status(500).json({ message: 'Gagal mengambil daftar user Hotspot', error: error.message }); }
};

exports.getHotspotProfiles = async (req, res) => {
    const workspaceId = req.user.workspace_id;
    if (!workspaceId) return res.json([]);
    try {
        const profiles = await runCommandForWorkspace(workspaceId, '/ip/hotspot/user/profile/print');
        res.json(profiles.map(p => p.name));
    } catch (error) { res.status(500).json({ message: 'Gagal mengambil profil Hotspot', error: error.message }); }
};

exports.addHotspotUser = async (req, res) => {
    const workspaceId = req.user.workspace_id;
    const { name, password, profile, timeLimit } = req.body;
    if (!name || !password || !profile) return res.status(400).json({ message: 'Nama, password, dan profile harus diisi.' });
    try {
        const params = [`=name=${name}`, `=password=${password}`,`=profile=${profile}`];
        if (timeLimit) params.push(`=limit-uptime=${timeLimit}`);
        await runCommandForWorkspace(workspaceId, '/ip/hotspot/user/add', params);
        res.status(201).json({ message: `User hotspot ${name} berhasil dibuat.` });
    } catch (error) { res.status(500).json({ message: 'Gagal menambah user hotspot', error: error.message }); }
};