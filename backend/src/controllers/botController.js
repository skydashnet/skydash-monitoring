const pool = require('../config/database');
const { sendWhatsAppMessage } = require('../services/whatsappService');

const normalizeWANumber = (number) => {
    let cleanNumber = number.replace(/\D/g, '');
    if (cleanNumber.startsWith('0')) {
        return '62' + cleanNumber.substring(1);
    }
    if (cleanNumber.startsWith('62')) {
        return cleanNumber;
    }
    return '62' + cleanNumber;
};
exports.toggleBotStatus = async (req, res) => {
    const workspaceId = req.user.workspace_id;
    const { isEnabled } = req.body;
    const whatsappNumber = req.user.whatsapp_number;
    if (!workspaceId) {
        return res.status(400).json({ message: 'Anda tidak berada dalam workspace yang valid.' });
    }
    try {
        await pool.query('UPDATE workspaces SET whatsapp_bot_enabled = ? WHERE id = ?', [isEnabled, workspaceId]);
        const successResponse = { 
            message: `Bot WhatsApp telah berhasil ${isEnabled ? 'diaktifkan' : 'dinonaktifkan'}.` 
        };
        if (whatsappNumber) {
            const template = isEnabled
                ? "✅ *Bot Aktif!*\n\nAsisten SkydashNET Anda sekarang aktif dan siap menerima perintah di chat ini.\n\nKetik `.help` untuk melihat daftar perintah."
                : "💤 *Bot Dinonaktifkan.*\n\nBot tidak akan lagi merespons perintah. Anda bisa mengaktifkannya kembali kapan saja dari halaman Pengaturan.";
            sendWhatsAppMessage(whatsappNumber, template)
                .catch(waError => {
                    console.error(`[Notifikasi Toggle Bot] Gagal mengirim pesan ke ${whatsappNumber}:`, waError.message);
                    successResponse.notificationStatus = "Status bot diubah, tetapi notifikasi WhatsApp gagal terkirim.";
                });
        }
        res.status(200).json(successResponse);
    } catch (error) {
        console.error("DATABASE UPDATE BOT STATUS ERROR:", error);
        res.status(500).json({ message: 'Gagal mengubah status bot di database.', error: error.message });
    }
};