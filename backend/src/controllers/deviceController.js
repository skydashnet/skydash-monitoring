const pool = require('../config/database');
const { runCommandForWorkspace } = require('../utils/apiConnection');

let RouterOSAPI = require('node-routeros');
if (RouterOSAPI.RouterOSAPI) {
    RouterOSAPI = RouterOSAPI.RouterOSAPI;
}

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
    const dbConnection = await pool.getConnection();
    try {
        await dbConnection.beginTransaction();
        const [result] = await dbConnection.query(
            'INSERT INTO mikrotik_devices (workspace_id, name, host, user, password, port) VALUES (?, ?, ?, ?, ?, ?)',
            [workspaceId, name, host, user, password || null, port]
        );
        const newDeviceId = result.insertId;
        const [devices] = await dbConnection.query('SELECT id FROM mikrotik_devices WHERE workspace_id = ?', [workspaceId]);
        if (devices.length === 1) {
            await dbConnection.query('UPDATE workspaces SET active_device_id = ? WHERE id = ?', [newDeviceId, workspaceId]);
        }
        await dbConnection.commit();
        res.status(201).json({ message: 'Perangkat berhasil ditambahkan.' });
    } catch (error) {
        await dbConnection.rollback();
        res.status(500).json({ message: 'Gagal menambah perangkat', error: error.message });
    } finally {
        dbConnection.release();
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

exports.getDeviceCapabilities = async (req, res) => {
    const workspaceId = req.user.workspace_id;
    if (!workspaceId) {
        return res.json({ hasPppoe: false, hasHotspot: false });
    }

    try {
        const allInterfaces = await runCommandForWorkspace(workspaceId, '/interface/print').catch(() => []);
        const hasPppoe = allInterfaces.some(iface => iface.type.startsWith('pppoe'));
        const hotspotCheck = await runCommandForWorkspace(workspaceId, '/ip/hotspot/profile/print', ['=count-only='])
            .catch(() => null);
        const hasHotspot = hotspotCheck !== null;
        const capabilities = {
            hasPppoe,
            hasHotspot
        };
        console.log(`[Capability Check] Workspace ${workspaceId}:`, capabilities);
        res.json(capabilities);

    } catch (error) {
        console.error("CAPABILITIES CHECK ERROR:", error.message);
        res.json({ hasPppoe: false, hasHotspot: false });
    }
};

exports.getInterfaces = async (req, res) => {
    const { id: deviceId } = req.params;
    const workspaceId = req.user.workspace_id;
    try {
        const [devices] = await pool.query('SELECT * FROM mikrotik_devices WHERE id = ? AND workspace_id = ?', [deviceId, workspaceId]);
        if (devices.length === 0) throw new Error('Perangkat tidak ditemukan atau Anda tidak punya izin.');

        const device = devices[0];
        const client = new RouterOSAPI({ host: device.host, user: device.user, password: device.password, port: device.port, timeout: 10 });
        
        await client.connect();
        const allInterfaces = await client.write('/interface/print');
        client.close();

        const filteredInterfaces = allInterfaces
            .filter(iface => iface.type === 'ether' || iface.type === 'wlan')
            .map(iface => iface.name);

        res.json(filteredInterfaces);
    } catch (error) {
        console.error("GET INTERFACES ERROR:", error);
        res.status(500).json({ message: `Gagal mengambil interface: ${error.message}` });
    }
};

exports.setWanInterface = async (req, res) => {
    const { id: deviceId } = req.params;
    const { interfaceName } = req.body;
    const workspaceId = req.user.workspace_id;
    try {
        await pool.query(
            'UPDATE mikrotik_devices SET wan_interface = ? WHERE id = ? AND workspace_id = ?',
            [interfaceName, deviceId, workspaceId]
        );
        res.status(200).json({ message: `Interface WAN berhasil diatur ke ${interfaceName}` });
    } catch (error) {
        res.status(500).json({ message: `Gagal mengatur interface WAN: ${error.message}` });
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