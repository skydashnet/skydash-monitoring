const { runCommandForWorkspace } = require('../utils/apiConnection');
const pool = require('../config/database');
const ipToLong = (ip) => ip.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet, 10), 0);
const longToIp = (long) => [(long >>> 24), (long >>> 16) & 255, (long >>> 8) & 255, long & 255].join('.');

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
    if (!workspaceId || !profile) {
        return res.status(400).json({ message: 'Profil harus dipilih.' });
    }

    try {
        const [pools] = await pool.query('SELECT * FROM ip_pools WHERE workspace_id = ? AND profile_name = ?', [workspaceId, profile]);
        if (pools.length === 0) {
            throw new Error(`Belum ada IP Pool yang diatur untuk profil "${profile}".`);
        }
        const poolRule = pools[0];
        const startIpLong = ipToLong(poolRule.ip_start);
        const endIpLong = ipToLong(poolRule.ip_end);
        const secrets = await runCommandForWorkspace(workspaceId, '/ppp/secret/print');
        const usedIps = new Set(secrets.map(s => s['remote-address']));
        let nextIp = null;
        for (let currentIpLong = startIpLong; currentIpLong <= endIpLong; currentIpLong++) {
            const currentIp = longToIp(currentIpLong);
            if (!usedIps.has(currentIp)) {
                nextIp = currentIp;
                break;
            }
        }

        if (!nextIp) {
            throw new Error(`Semua IP dalam rentang untuk profil "${profile}" sudah terpakai.`);
        }
        res.json({
            localAddress: poolRule.gateway,
            remoteAddress: nextIp
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
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

exports.updateSecret = (req, res) => {
    res.status(501).json({ message: 'Fungsi update secret belum diimplementasikan.' });
};

exports.setSecretStatus = async (req, res) => {
    const workspaceId = req.user.workspace_id;
    const { id } = req.params;
    const { disabled } = req.body;

    try {
        await runCommandForWorkspace(workspaceId, '/ppp/secret/set', [
            `=.id=${id}`,
            `=disabled=${disabled}`
        ]);
        res.status(200).json({ message: `Secret berhasil di-${disabled === 'true' ? 'disable' : 'enable'}.` });
    } catch (error) {
        res.status(500).json({ message: 'Gagal mengubah status secret.', error: error.message });
    }
};

exports.kickActiveUser = async (req, res) => {
    const workspaceId = req.user.workspace_id;
    const { id } = req.params;

    try {
        await runCommandForWorkspace(workspaceId, '/ppp/active/remove', [
            `=.id=${id}`
        ]);
        res.status(200).json({ message: 'Koneksi pengguna berhasil diputuskan.' });
    } catch (error) {
        if (error.message.includes('no such item')) {
            return res.status(404).json({ message: 'Koneksi aktif tidak ditemukan. Mungkin pengguna sudah disconnect.' });
        }
        res.status(500).json({ message: 'Gagal memutuskan koneksi.', error: error.message });
    }
};

exports.getManagementPageData = async (req, res) => {
    const workspaceId = req.user.workspace_id;
    if (!workspaceId) {
        return res.json({ summary: { total: 0, active: 0, inactive: 0 }, secrets: [] });
    }
    try {
        const [secrets, active] = await Promise.all([
            runCommandForWorkspace(workspaceId, '/ppp/secret/print'),
            runCommandForWorkspace(workspaceId, '/ppp/active/print', ['?service=pppoe'])
        ]);

        const summary = {
            total: secrets.length,
            active: active.length,
            inactive: secrets.length - active.length
        };
        
        res.json({ summary, secrets });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getSecretDetails = async (req, res) => {
    const workspaceId = req.user.workspace_id;
    const { name } = req.params;

    if (!workspaceId) {
        return res.status(400).json({ message: 'Workspace tidak valid.' });
    }

    try {
        const secrets = await runCommandForWorkspace(workspaceId, '/ppp/secret/print', [`?name=${name}`]);
        if (secrets.length === 0) {
            return res.status(404).json({ message: `Pengguna PPPoE dengan nama "${name}" tidak ditemukan.` });
        }
        const secretInfo = secrets[0];

        const [odpConnections] = await pool.query(
            `SELECT na.name as odp_name, na.type as odp_type 
             FROM odp_user_connections ouc
             JOIN network_assets na ON ouc.asset_id = na.id
             WHERE ouc.workspace_id = ? AND ouc.pppoe_secret_name = ?`,
            [workspaceId, name]
        );
        const connectionInfo = odpConnections.length > 0 ? odpConnections[0] : null;

        const responseData = {
            secret: secretInfo,
            connection: connectionInfo
        };

        res.json(responseData);

    } catch (error) {
        console.error(`Error getting details for secret ${name}:`, error);
        res.status(500).json({ message: 'Gagal mengambil detail pengguna.', error: error.message });
    }
};

exports.getSlaDetails = async (req, res) => {
    const { name } = req.params;
    const workspaceId = req.user.workspace_id;

    if (!workspaceId) {
        return res.status(400).json({ message: 'Workspace tidak valid.' });
    }

    try {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const [downtimeResult] = await pool.query(
            `SELECT COALESCE(SUM(duration_seconds), 0) as total_downtime
             FROM downtime_events 
             WHERE workspace_id = ? AND pppoe_user = ? AND start_time >= ?`,
            [workspaceId, name, thirtyDaysAgo]
        );
        const totalDowntimeSeconds = downtimeResult[0].total_downtime;

        const totalSecondsInPeriod = 30 * 24 * 60 * 60;
        
        const uptimeSeconds = totalSecondsInPeriod - totalDowntimeSeconds;
        const slaPercentage = (uptimeSeconds / totalSecondsInPeriod) * 100;

        const [downtimeEvents] = await pool.query(
            `SELECT start_time, duration_seconds 
             FROM downtime_events 
             WHERE workspace_id = ? AND pppoe_user = ? AND end_time IS NOT NULL
             ORDER BY start_time DESC 
             LIMIT 5`,
            [workspaceId, name]
        );

        res.json({
            sla_percentage: slaPercentage.toFixed(4),
            total_downtime_seconds: totalDowntimeSeconds,
            recent_events: downtimeEvents
        });

    } catch (error) {
        console.error(`Error getting SLA details for ${name}:`, error);
        res.status(500).json({ message: 'Gagal mengambil detail SLA.', error: error.message });
    }
};