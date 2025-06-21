const pool = require('../config/database');
let RouterOSAPI = require('node-routeros');
if (RouterOSAPI.RouterOSAPI) { RouterOSAPI = RouterOSAPI.RouterOSAPI; }

// Fungsi ini kita jadikan "bawel" untuk debugging
async function runCommandForWorkspace(workspaceId, command, params = []) {
    // console.log(`\n--- [DIAGNOSTIK] Memulai runCommandForWorkspace untuk Workspace ID: ${workspaceId} ---`);
    // console.log(`[DIAGNOSTIK] Perintah yang diminta: ${command} | Parameter: ${JSON.stringify(params)}`);

    try {
        const [devices] = await pool.query(
            'SELECT * FROM mikrotik_devices WHERE id = (SELECT active_device_id FROM workspaces WHERE id = ?)',
            [workspaceId]
        );

        if (devices.length === 0) {
            // console.error('[DIAGNOSTIK] GAGAL: Tidak ada perangkat aktif yang ditemukan untuk workspace ini.');
            throw new Error(`Tidak ada perangkat aktif yang terkonfigurasi untuk workspace ID ${workspaceId}.`);
        }

        const device = devices[0];
        // console.log(`[DIAGNOSTIK] Menggunakan perangkat: ${device.name} (Host: ${device.host})`);

        const client = new RouterOSAPI({
            host: device.host,
            user: device.user,
            password: device.password,
            port: device.port,
            timeout: 10,
        });

        // console.log('[DIAGNOSTIK] Mencoba menyambungkan ke MikroTik...');
        await client.connect();
        // console.log('[DIAGNOSTIK] Koneksi Berhasil! Menjalankan perintah...');

        const results = await client.write(command, params);
        // console.log(`[DIAGNOSTIK] Perintah "${command}" berhasil dijalankan. Hasil mentah:`, JSON.stringify(results, null, 2));

        client.close();
        // console.log('[DIAGNOSTIK] Koneksi ditutup. Proses selesai.');
        // console.log('--- [DIAGNOSTIK] Selesai ---\n');
        
        return results;

    } catch (error) {
        // console.error(`[DIAGNOSTIK] GAGAL TOTAL saat menjalankan "${command}":`, error);
        // console.log('--- [DIAGNOSTIK] Selesai dengan ERROR ---\n');
        throw error;
    }
}

module.exports = { runCommandForWorkspace };