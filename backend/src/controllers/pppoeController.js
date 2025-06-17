const { runCommandForWorkspace } = require('../utils/apiConnection');
const pool = require('../config/database');

// Semua fungsi di file ini diubah untuk menggunakan runCommandForWorkspace
exports.getSummary = async (req, res) => {
    const workspaceId = req.user.workspace_id;
    if (!workspaceId) return res.json({ total: 0, active: 0, inactive: 0 });
    try {
        const [secrets, active] = await Promise.all([
            runCommandForWorkspace(workspaceId, '/ppp/secret/print', ['?service=pppoe']),
            runCommandForWorkspace(workspaceId, '/ppp/active/print', ['?service=pppoe'])
        ]);
        res.json({ total: secrets.length, active: active.length, inactive: secrets.length - active.length });
    } catch (error) { res.status(500).json({ message: error.message }); }
};

exports.getSecrets = async (req, res) => {
    const workspaceId = req.user.workspace_id;
    if (!workspaceId) return res.json([]);
    try {
        const secrets = await runCommandForWorkspace(workspaceId, '/ppp/secret/print');
        res.json(secrets);
    } catch (error) { res.status(500).json({ message: 'Gagal mengambil daftar secrets', error: error.message }); }
};

// Menambah secret PPPoE baru ke dalam workspace
exports.addSecret = async (req, res) => {
    const workspaceId = req.user.workspace_id;
    const { name, password, profile, service, localAddress, remoteAddress } = req.body;
    if (!name || !password || !profile) return res.status(400).json({ message: 'Nama, password, dan profile harus diisi.' });
    try {
        const params = [`=name=${name}`, `=password=${password}`, `=profile=${profile}`, `=service=${service || 'pppoe'}`];
        if (localAddress) params.push(`=local-address=${localAddress}`);
        if (remoteAddress) params.push(`=remote-address=${remoteAddress}`);
        await runCommandForWorkspace(workspaceId, '/ppp/secret/add', params);
        res.status(201).json({ message: `Secret untuk pengguna ${name} berhasil dibuat.` });
    } catch (error) { res.status(500).json({ message: 'Gagal menambah secret', error: error.message }); }
};

// --- FUNGSI YANG HILANG, SEKARANG DIKEMBALIKAN ---
exports.getUnassignedSecrets = async (req, res) => {
    const workspaceId = req.user.workspace_id;
    if (!workspaceId) return res.json([]);
    
    try {
        const allSecretsFromMikrotik = await runCommandForWorkspace(req.user.workspace_id, '/ppp/secret/print', ['?service=pppoe']);
        
        const [assignedDbRows] = await pool.query('SELECT pppoe_secret_name FROM odp_user_connections WHERE workspace_id = ?', [workspaceId]);
        const assignedNames = new Set(assignedDbRows.map(s => s.pppoe_secret_name));
        
        const unassigned = allSecretsFromMikrotik.filter(s => !assignedNames.has(s.name));
        res.json(unassigned);
    } catch (error) {
        res.status(500).json({ message: 'Gagal mengambil secrets yang belum terhubung', error: error.message });
    }
};
// ----------------------------------------------------

// ... (sisa fungsi lainnya seperti getInactiveSecrets, getPppProfiles, dll, tetap sama) ...
exports.getInactiveSecrets = async (req, res) => {
    const workspaceId = req.user.workspace_id;
    if (!workspaceId) return res.json([]);
    try {
        const [secrets, activeSessions] = await Promise.all([
            runCommandForWorkspace(workspaceId, '/ppp/secret/print', ['?service=pppoe']),
            runCommandForWorkspace(workspaceId, '/ppp/active/print', ['?service=pppoe'])
        ]);
        const activeUsernames = new Set(activeSessions.map(session => session.name));
        const inactiveSecrets = secrets.filter(secret => !activeUsernames.has(secret.name));
        res.json(inactiveSecrets);
    } catch (error) { res.status(500).json({ message: 'Gagal mengambil daftar secrets tidak aktif', error: error.message }); }
};

exports.getPppProfiles = async (req, res) => {
    const workspaceId = req.user.workspace_id;
    if (!workspaceId) return res.json([]);
    try {
        const profiles = await runCommandForWorkspace(workspaceId, '/ppp/profile/print');
        res.json(profiles.map(p => p.name));
    } catch (error) { res.status(500).json({ message: 'Gagal mengambil profil PPP', error: error.message }); }
};

exports.getNextIp = async (req, res) => {
    const { profile } = req.query;
    const workspaceId = req.user.workspace_id;
    if (!workspaceId) return res.json({ localAddress: '', remoteAddress: '' });
    try {
        const secrets = await runCommandForWorkspace(workspaceId, '/ppp/secret/print');
        let localAddress = '172.25.1.1';
        let subnet = '172.25.1.';
        const specialProfiles = ["UPTO || 30M || BR", "PAKET 150 RIBU"];
        if (specialProfiles.includes(profile)) {
            localAddress = '172.25.2.1';
            subnet = '172.25.2.';
        }
        const usedIps = secrets.map(s => s['remote-address']).filter(ip => ip && ip.startsWith(subnet)).map(ip => parseInt(ip.split('.')[3], 10)).sort((a, b) => a - b);
        let nextIpOctet = 2;
        for (const ipOctet of usedIps) {
            if (ipOctet === nextIpOctet) { nextIpOctet++; } else { break; }
        }
        res.json({ localAddress, remoteAddress: `${subnet}${nextIpOctet}` });
    } catch (error) { res.status(500).json({ message: 'Gagal mendapatkan IP berikutnya', error: error.message }); }
};

exports.assignUserToOdp = async (req, res) => {
    const { pppoe_secret_name } = req.body;
    const { odpId } = req.params;
    const workspaceId = req.user.workspace_id;
    if (!workspaceId) return res.status(400).json({ message: 'Operasi tidak valid, workspace tidak ditemukan.' });
    try {
        await pool.query('INSERT INTO odp_user_connections (asset_id, pppoe_secret_name, workspace_id) VALUES (?, ?, ?)', [odpId, pppoe_secret_name, workspaceId]);
        res.status(200).json({ message: `Pengguna ${pppoe_secret_name} berhasil terhubung ke ODP.` });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: `Pengguna ${pppoe_secret_name} sudah terhubung ke ODP lain.` });
        }
        res.status(500).json({ message: 'Gagal menghubungkan pengguna', error: error.message });
    }
};

exports.getConnectedUsers = async (req, res) => {
    const { id: odpId } = req.params;
    const workspaceId = req.user.workspace_id;
    if (!workspaceId) return res.json([]);
    try {
        const [connections] = await pool.query('SELECT pppoe_secret_name as name, id FROM odp_user_connections WHERE asset_id = ? AND workspace_id = ?', [odpId, workspaceId]);
        res.json(connections);
    } catch (error) { res.status(500).json({ message: 'Gagal mengambil pengguna yang terhubung', error: error.message }); }
};

// Fungsi ini sengaja kosong untuk rute PUT yang tidak kita pakai
exports.updateSecret = (req, res) => {
    res.status(501).json({ message: 'Fungsi update secret belum diimplementasikan.' });
};