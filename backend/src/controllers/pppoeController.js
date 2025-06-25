let RouterOSAPI = require('node-routeros');
if (RouterOSAPI.RouterOSAPI) {
    RouterOSAPI = RouterOSAPI.RouterOSAPI;
}
const { runCommandForWorkspace } = require('../utils/apiConnection');
const pool = require('../config/database');
const ipToLong = (ip) => ip.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet, 10), 0);
const longToIp = (long) => [(long >>> 24), (long >>> 16) & 255, (long >>> 8) & 255, long & 255].join('.');

const getTempMikrotikClient = async (workspaceId) => {
    const [devices] = await pool.query('SELECT * FROM mikrotik_devices WHERE id = (SELECT active_device_id FROM workspaces WHERE id = ?)', [workspaceId]);
    if (devices.length === 0) throw new Error('Perangkat aktif tidak ditemukan untuk workspace ini.');
    const device = devices[0];
    const client = new RouterOSAPI({ host: device.host, user: device.user, password: device.password, port: device.port });
    await client.connect();
    return client;
};

exports.getSummary = async (req, res, next) => {
    const workspaceId = req.user.workspace_id;
    if (!workspaceId) return res.json({ total: 0, active: 0, inactive: 0 });

    let client;
    try {
        client = await getTempMikrotikClient(workspaceId);
        const [secrets, active] = await Promise.all([
            client.write('/ppp/secret/print', ['?service=pppoe']),
            client.write('/ppp/active/print', ['?service=pppoe'])
        ]);
        client.close();
        res.json({ total: secrets.length, active: active.length, inactive: secrets.length - active.length });
    } catch (error) {
        if(client) client.close();
        next(error);
    }
};

exports.getSecrets = async (req, res, next) => {
    const workspaceId = req.user.workspace_id;
    if (!workspaceId) return res.json([]);
    try {
        const secrets = await runCommandForWorkspace(workspaceId, '/ppp/secret/print');
        res.json(secrets);
    } catch (error) { next(error); }
};

exports.addSecret = async (req, res, next) => {
    const workspaceId = req.user.workspace_id;
    const { name, password, profile, service, localAddress, remoteAddress } = req.body;
    if (!name || !password || !profile) return res.status(400).json({ message: 'Nama, password, dan profile harus diisi.' });
    try {
        const params = [`=name=${name}`, `=password=${password}`, `=profile=${profile}`, `=service=${service || 'pppoe'}`];
        if (localAddress) params.push(`=local-address=${localAddress}`);
        if (remoteAddress) params.push(`=remote-address=${remoteAddress}`);
        await runCommandForWorkspace(workspaceId, '/ppp/secret/add', params);
        res.status(201).json({ message: `Secret untuk pengguna ${name} berhasil dibuat.` });
    } catch (error) { next(error); }
};

exports.getUnassignedSecrets = async (req, res, next) => {
    const workspaceId = req.user.workspace_id;
    if (!workspaceId) return res.json([]);
    
    try {
        const allSecretsFromMikrotik = await runCommandForWorkspace(req.user.workspace_id, '/ppp/secret/print', ['?service=pppoe']);
        
        const [assignedDbRows] = await pool.query('SELECT pppoe_secret_name FROM odp_user_connections WHERE workspace_id = ?', [workspaceId]);
        const assignedNames = new Set(assignedDbRows.map(s => s.pppoe_secret_name));
        
        const unassigned = allSecretsFromMikrotik.filter(s => !assignedNames.has(s.name));
        res.json(unassigned);
    } catch (error) {
        next(error);
    }
};

exports.getInactiveSecrets = async (req, res, next) => {
    const workspaceId = req.user.workspace_id;
    if (!workspaceId) return res.json([]);
    let client;
    try {
        client = await getTempMikrotikClient(workspaceId);
        const [secrets, activeSessions] = await Promise.all([
            client.write('/ppp/secret/print', ['?service=pppoe']),
            client.write('/ppp/active/print', ['?service=pppoe'])
        ]);
        client.close();
        const activeUsernames = new Set(activeSessions.map(session => session.name));
        const inactiveSecrets = secrets.filter(secret => !activeUsernames.has(secret.name) && secret.disabled !== 'true');
        res.json(inactiveSecrets);
    } catch (error) { 
        if(client) client.close();
        next(error);
    }
};

exports.getPppProfiles = async (req, res, next) => {
    const workspaceId = req.user.workspace_id;
    if (!workspaceId) return res.json([]);
    try {
        const profiles = await runCommandForWorkspace(workspaceId, '/ppp/profile/print');
        res.json(profiles.map(p => p.name));
    } catch (error) { next(error); }
};

exports.getNextIp = async (req, res, next) => {
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
        next(error);
    }
};

exports.assignUserToOdp = async (req, res, next) => {
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
        next(error);
    }
};

exports.getConnectedUsers = async (req, res, next) => {
    const { id: odpId } = req.params;
    const workspaceId = req.user.workspace_id;
    if (!workspaceId) return res.json([]);
    try {
        const [connections] = await pool.query('SELECT pppoe_secret_name as name, id FROM odp_user_connections WHERE asset_id = ? AND workspace_id = ?', [odpId, workspaceId]);
        res.json(connections);
    } catch (error) { next(error); }
};

exports.updateSecret = (req, res, next) => {
    res.status(501).json({ message: 'Fungsi update secret belum diimplementasikan.' });
};

exports.setSecretStatus = async (req, res, next) => {
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
        next(error);
    }
};

exports.kickActiveUser = async (req, res, next) => {
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
        next(error);
    }
};

exports.getManagementPageData = async (req, res, next) => {
    const workspaceId = req.user.workspace_id;
    if (!workspaceId) {
        return res.json({ summary: { total: 0, active: 0, inactive: 0 }, secrets: [] });
    }
    let client;
    try {
        client = await getTempMikrotikClient(workspaceId);
        const [secrets, active] = await Promise.all([
            client.write('/ppp/secret/print'),
            client.write('/ppp/active/print', ['?service=pppoe'])
        ]);
        client.close();

        const summary = {
            total: secrets.length,
            active: active.length,
            inactive: secrets.length - active.length
        };
        
        res.json({ summary, secrets });
    } catch (error) {
        if(client) client.close();
        next(error);
    }
};

exports.getSecretDetails = async (req, res, next) => {
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
        next(error);
    }
};

exports.getSlaDetails = async (req, res, next) => {
    const { name } = req.params;
    const workspaceId = req.user.workspace_id;

    if (!workspaceId) {
        return res.status(400).json({ message: 'Workspace tidak valid.' });
    }

    try {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const [downtimeResult] = await pool.query(
            `SELECT COALESCE(SUM(total_duration), 0) as total_downtime
            FROM (
                SELECT duration_seconds as total_duration
                FROM downtime_events
                WHERE workspace_id = ? AND pppoe_user = ? AND start_time >= ? AND end_time IS NOT NULL
                
                UNION ALL

                SELECT TIMESTAMPDIFF(SECOND, start_time, NOW()) as total_duration
                FROM downtime_events
                WHERE workspace_id = ? AND pppoe_user = ? AND start_time >= ? AND end_time IS NULL
            ) as combined_downtime`,
            [workspaceId, name, thirtyDaysAgo, workspaceId, name, thirtyDaysAgo]
        );
        const totalDowntimeSeconds = parseInt(downtimeResult[0].total_downtime, 10);

        const totalSecondsInPeriod = 30 * 24 * 60 * 60;
        const uptimeSeconds = totalSecondsInPeriod - totalDowntimeSeconds;
        const slaPercentage = (uptimeSeconds / totalSecondsInPeriod) * 100;

        const [downtimeEvents] = await pool.query(
            `SELECT 
                start_time, 
                COALESCE(duration_seconds, TIMESTAMPDIFF(SECOND, start_time, NOW())) as duration_seconds,
                (end_time IS NULL) as is_ongoing
             FROM downtime_events 
             WHERE workspace_id = ? AND pppoe_user = ? AND start_time >= ?
             ORDER BY start_time DESC 
             LIMIT 5`,
            [workspaceId, name, thirtyDaysAgo]
        );

        res.json({
            sla_percentage: slaPercentage.toFixed(4),
            total_downtime_seconds: totalDowntimeSeconds,
            recent_events: downtimeEvents
        });

    } catch (error) {
        next(error);
    }
};