const pool = require('../config/database');
const { sendWhatsAppMessage } = require('../services/whatsappService');

exports.toggleBotStatus = async (req, res) => {
    const workspaceId = req.user.workspace_id;
    const { isEnabled } = req.body;
    const whatsappNumber = req.user.whatsapp_number;

    try {
        await pool.query('UPDATE workspaces SET whatsapp_bot_enabled = ? WHERE id = ?', [isEnabled, workspaceId]);
        if (whatsappNumber) {
            let notificationMessage;
            if (isEnabled) {
                notificationMessage = "✅ *Bot Aktif!*\n\nAsisten SkydashNET Anda sekarang aktif dan siap menerima perintah di chat ini.\n\nKetik `.help` untuk melihat daftar perintah.";
            } else {
                notificationMessage = "💤 *Bot Dinonaktifkan.*\n\nBot tidak akan lagi merespons perintah. Anda bisa mengaktifkannya kembali kapan saja dari halaman Pengaturan.";
            }

            try {
                await sendWhatsAppMessage(whatsappNumber, notificationMessage);
            } catch (waError) {
                console.error("Gagal mengirim notifikasi toggle bot:", waError.message);
            }
        }
        res.status(200).json({ message: `Bot WhatsApp telah ${isEnabled ? 'diaktifkan' : 'dinonaktifkan'}.` });
    } catch (error) {
        res.status(500).json({ message: 'Gagal mengubah status bot', error: error.message });
    }
};