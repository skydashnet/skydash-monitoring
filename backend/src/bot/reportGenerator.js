const pool = require('../config/database');
const { runCommandForWorkspace } = require('../utils/apiConnection');
const { sendWhatsAppMessage } = require('../services/whatsappService');

async function generateAndSendDailyReports() {
    console.log(`[Laporan Harian] Memulai proses pembuatan laporan... (${new Date().toLocaleTimeString()})`);
    
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

        console.log(`[Laporan Harian] Menyiapkan laporan untuk ${workspaces.length} workspace...`);
        for (const workspace of workspaces) {
            try {
                const [pppoeSummary, hotspotSummary] = await Promise.all([
                    runCommandForWorkspace(workspace.id, '/ppp/secret/print', ['=count-only=']).then(r => r[0] || { count: 0 }),
                    runCommandForWorkspace(workspace.id, '/ppp/active/print', ['=count-only=']).then(r => r[0] || { count: 0 }),
                    runCommandForWorkspace(workspace.id, '/ip/hotspot/user/print', ['=count-only=']).then(r => r[0] || { count: 0 }),
                    runCommandForWorkspace(workspace.id, '/ip/hotspot/active/print', ['=count-only=']).then(r => r[0] || { count: 0 })
                ]).then(([secrets, pppoeActive, hotspotUsers, hotspotActive]) => [
                    { total: secrets.count, active: pppoeActive.count },
                    { total: hotspotUsers.count, active: hotspotActive.count }
                ]);
                
                const date = new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
                let reportMessage = `*Laporan Harian SkydashNET* ☀️\n_${date}_\n\n`;
                reportMessage += `Berikut adalah ringkasan status jaringan untuk workspace *${workspace.name}*:\n\n`;
                reportMessage += `*👤 PPPoE*\n`;
                reportMessage += `> Total Pelanggan: *${pppoeSummary.total}*\n`;
                reportMessage += `> Sedang Aktif: *${pppoeSummary.active}*\n\n`;
                reportMessage += `*📶 Hotspot*\n`;
                reportMessage += `> Total User: *${hotspotSummary.total}*\n`;
                reportMessage += `> Sedang Aktif: *${hotspotSummary.active}*\n\n`;
                reportMessage += `_Semoga harimu lancar!_\n- Bot SkydashNET`;

                await sendWhatsAppMessage(workspace.whatsapp_number, reportMessage);
                console.log(`[Laporan Harian] Laporan berhasil dikirim ke workspace ${workspace.name}`);

            } catch (error) {
                console.error(`[Laporan Harian] Gagal membuat laporan untuk workspace ID ${workspace.id}:`, error.message);
            }
        }

    } catch (error) {
        console.error("[Laporan Harian] Terjadi error saat mengambil data workspace:", error);
    }
}

module.exports = { generateAndSendDailyReports };