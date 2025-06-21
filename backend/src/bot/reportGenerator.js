const pool = require('../config/database');
const { sendWhatsAppMessage } = require('../services/whatsappService');
let RouterOSAPI = require('node-routeros');
if (RouterOSAPI.RouterOSAPI) {
    RouterOSAPI = RouterOSAPI.RouterOSAPI;
}

/**
 * @param {object} workspace
 */
async function generateSingleReport(workspace) {
    console.log(`[Laporan Harian] Memproses workspace: ${workspace.name} (ID: ${workspace.id})`);
    
    let client;
    try {
        const [devices] = await pool.query(
            'SELECT * FROM mikrotik_devices WHERE id = (SELECT active_device_id FROM workspaces WHERE id = ?)',
            [workspace.id]
        );

        if (devices.length === 0) {
            throw new Error('Tidak ada perangkat aktif yang ditemukan untuk workspace ini.');
        }
        const device = devices[0];
        client = new RouterOSAPI({
            host: device.host, user: device.user, password: device.password,
            port: device.port, timeout: 10
        });
        await client.connect();
        const safeCount = (command) => client.write(command, ['=count-only=']).then(r => r[0]?.count || '0').catch(() => 'N/A');

        const [pppoeTotal, pppoeActive, hotspotTotal, hotspotActive] = await Promise.all([
            safeCount('/ppp/secret/print'),
            safeCount('/ppp/active/print'),
            safeCount('/ip/hotspot/user/print'),
            safeCount('/ip/hotspot/active/print')
        ]);
        
        client.close();
        const date = new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        let reportMessage = `*Laporan Harian SkydashNET* ☀️\n_${date}_\n\n`;
        reportMessage += `Berikut adalah ringkasan status jaringan untuk workspace *${workspace.name}*:\n\n`;
        reportMessage += `*👤 PPPoE*\n`;
        reportMessage += `> Total Pelanggan: *${pppoeTotal}*\n`;
        reportMessage += `> Sedang Aktif: *${pppoeActive}*\n\n`;
        reportMessage += `*📶 Hotspot*\n`;
        reportMessage += `> Total User: *${hotspotTotal}*\n`;
        reportMessage += `> Sedang Aktif: *${hotspotActive}*\n\n`;
        reportMessage += `_Semoga harimu lancar!_\n- Bot SkydashNET`;

        await sendWhatsAppMessage(workspace.whatsapp_number, reportMessage);
        console.log(`[Laporan Harian] Laporan berhasil dikirim ke workspace ${workspace.name}`);
        return { success: true, workspaceName: workspace.name };

    } catch (error) {
        if (client && client.connected) client.close();
        console.error(`[Laporan Harian] GAGAL membuat laporan untuk workspace ID ${workspace.id}:`, error.message);
        return { success: false, workspaceName: workspace.name, error: error.message };
    }
}

async function generateAndSendDailyReports() {
    console.log(`[Laporan Harian] Memulai proses terjadwal... (${new Date().toLocaleTimeString()})`);
    try {
        const [workspaces] = await pool.query(
            `SELECT w.id, w.name, u.whatsapp_number 
             FROM workspaces w 
             JOIN users u ON w.owner_id = u.id 
             WHERE w.whatsapp_bot_enabled = TRUE AND u.whatsapp_number IS NOT NULL`
        );
        
        if (workspaces.length === 0) {
            console.log("[Laporan Harian] Tidak ada workspace yang perlu dikirimi laporan.");
            return;
        }
        for (const workspace of workspaces) {
            await generateSingleReport(workspace);
        }
    } catch (error) {
        console.error("[Laporan Harian] Terjadi error saat mengambil data workspace:", error);
    }
}

module.exports = { generateAndSendDailyReports, generateSingleReport };
