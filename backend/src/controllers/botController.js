const pool = require('../config/database');
const { sendWhatsAppMessage } = require('../services/whatsappService');
const { generateSingleReport } = require('../bot/reportGenerator');

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

exports.triggerTestReport = async (req, res) => {
    const workspaceId = req.user.workspace_id;
    const whatsappNumber = req.user.whatsapp_number;

    if (!workspaceId || !whatsappNumber) {
        return res.status(400).json({ message: 'Workspace atau nomor WhatsApp tidak terkonfigurasi.' });
    }

    try {
        const [workspaces] = await pool.query('SELECT * FROM workspaces WHERE id = ?', [workspaceId]);
        if (workspaces.length === 0) {
            return res.status(404).json({ message: 'Workspace tidak ditemukan.' });
        }
        
        const workspaceData = { 
            id: workspaces[0].id,
            name: workspaces[0].name,
            whatsapp_number: whatsappNumber,
            active_device_id: workspaces[0].active_device_id
        };

        const result = await generateSingleReport(workspaceData);

        if (result.success) {
            res.status(200).json({ message: 'Laporan tes berhasil dikirim ke WhatsApp Anda.' });
        } else {
            throw new Error(result.error || 'Gagal mengirim laporan tes dari generator.');
        }

    } catch (error) {
        console.error("TRIGGER TEST REPORT ERROR:", error);
        res.status(500).json({ message: error.message });
    }
};