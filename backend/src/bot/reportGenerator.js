const pool = require('../config/database');
const { runCommandForWorkspace } = require('../utils/apiConnection');
const { sendWhatsAppMessage } = require('../services/whatsappService');

async function generateSingleReport(workspace) {
    console.log(`[Laporan Harian] Memproses workspace: ${workspace.name} (ID: ${workspace.id})`);
    try {
        const pppoeSummary = await runCommandForWorkspace(workspace.id, '/ppp/secret/print', ['=count-only=']).then(r => r[0]?.count || '0');
        const pppoeActive = await runCommandForWorkspace(workspace.id, '/ppp/active/print', ['=count-only=']).then(r => r[0]?.count || '0');
        const hotspotSummary = await runCommandForWorkspace(workspace.id, '/ip/hotspot/user/print', ['=count-only=']).then(r => r[0]?.count || '0');
        const hotspotActive = await runCommandForWorkspace(workspace.id, '/ip/hotspot/active/print', ['=count-only=']).then(r => r[0]?.count || '0');

        const date = new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        let reportMessage = `*Laporan Harian SkydashNET* ☀️\n_${date}_\n\n`;
        reportMessage += `Berikut adalah ringkasan status jaringan untuk workspace *${workspace.name}*:\n\n`;
        reportMessage += `*👤 PPPoE*\n`;
        reportMessage += `> Total Pelanggan: *${pppoeSummary}*\n`;
        reportMessage += `> Sedang Aktif: *${pppoeActive}*\n\n`;
        reportMessage += `*📶 Hotspot*\n`;
        reportMessage += `> Total User: *${hotspotSummary}*\n`;
        reportMessage += `> Sedang Aktif: *${hotspotActive}*\n\n`;
        reportMessage += `_Semoga harimu lancar!_\n- Bot SkydashNET`;

        await sendWhatsAppMessage(workspace.whatsapp_number, reportMessage);
        console.log(`[Laporan Harian] Laporan berhasil dikirim ke workspace ${workspace.name}`);
        return { success: true, workspaceName: workspace.name };
    } catch (error) {
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
        
        if (workspaces.length === 0) return;
        for (const workspace of workspaces) {
            await generateSingleReport(workspace);
        }
    } catch (error) {
        console.error("[Laporan Harian] Terjadi error saat mengambil data workspace:", error);
    }
}

module.exports = { generateAndSendDailyReports, generateSingleReport };
