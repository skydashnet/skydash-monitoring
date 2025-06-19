const { runCommandForWorkspace } = require('../utils/apiConnection');
const crypto = require('crypto');

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

exports.setHotspotUserStatus = async (req, res) => {
    const workspaceId = req.user.workspace_id;
    const { id } = req.params;
    const { disabled } = req.body;

    try {
        await runCommandForWorkspace(workspaceId, '/ip/hotspot/user/set', [
            `=.id=${id}`,
            `=disabled=${disabled}`
        ]);
        res.status(200).json({ message: `User hotspot berhasil di-${disabled === 'true' ? 'disable' : 'enable'}.` });
    } catch (error) {
        res.status(500).json({ message: 'Gagal mengubah status user hotspot.', error: error.message });
    }
};

exports.kickHotspotUser = async (req, res) => {
    const workspaceId = req.user.workspace_id;
    const { id } = req.params;

    try {
        await runCommandForWorkspace(workspaceId, '/ip/hotspot/active/remove', [
            `=.id=${id}`
        ]);
        res.status(200).json({ message: 'Koneksi pengguna hotspot berhasil diputuskan.' });
    } catch (error) {
        if (error.message.includes('no such item')) {
            return res.status(404).json({ message: 'Koneksi aktif tidak ditemukan.' });
        }
        res.status(500).json({ message: 'Gagal memutuskan koneksi.', error: error.message });
    }
};

exports.generateVouchers = async (req, res) => {
    const workspaceId = req.user.workspace_id;
    const { count, profile, length = 4 } = req.body;

    if (!count || !profile) {
        return res.status(400).json({ message: 'Jumlah dan profil harus ditentukan.' });
    }

    try {
        const generatedUsers = [];
        for (let i = 0; i < count; i++) {
            const randomChars = crypto.randomBytes(Math.ceil(length / 2)).toString('hex').slice(0, length);
            const username = `v${randomChars}`; // v untuk voucher
            const password = Math.floor(1000 + Math.random() * 9000).toString(); // password 4 digit
            
            const params = [
                `=name=${username}`,
                `=password=${password}`,
                `=profile=${profile}`,
            ];
            // Tambahkan user baru ke MikroTik
            await runCommandForWorkspace(workspaceId, '/ip/hotspot/user/add', params);
            generatedUsers.push({ username, password });
        }
        
        res.status(201).json({ 
            message: `${count} voucher berhasil dibuat.`,
            vouchers: generatedUsers
        });

    } catch (error) {
        res.status(500).json({ message: 'Gagal membuat voucher', error: error.message });
    }
};