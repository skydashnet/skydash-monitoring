const pool = require('../config/database');
const bcrypt = require('bcryptjs');
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

const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

exports.requestOtp = async (req, res) => {
    const { username, displayName, password, whatsapp } = req.body;
    if (!username || !displayName || !password || !whatsapp) {
        return res.status(400).json({ message: 'Semua field harus diisi' });
    }

    const normalizedWhatsapp = normalizeWANumber(whatsapp);
    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
    const password_hash = await bcrypt.hash(password, 10);

    try {
        await pool.query(
            `INSERT INTO pending_registrations (whatsapp_number, username, display_name, password_hash, otp_code, expires_at)
             VALUES (?, ?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE username=VALUES(username), display_name=VALUES(display_name), password_hash=VALUES(password_hash), otp_code=VALUES(otp_code), expires_at=VALUES(expires_at)`,
            [normalizedWhatsapp, username, displayName, password_hash, otp, expiresAt]
        );
        
        const otpMessage = `*SkydashNET - Kode Verifikasi*\n\nGunakan kode di bawah ini untuk menyelesaikan pendaftaran Anda.\n_JANGAN bagikan kode ini dengan siapa pun._\n\nKode Anda:\n\`\`\`${otp}\`\`\`\n\nKode ini akan kedaluwarsa dalam 5 menit.`;
        
        await sendWhatsAppMessage(normalizedWhatsapp, otpMessage);

        res.status(200).json({ message: `Kode OTP telah dikirim ke nomor WhatsApp Anda.` });
    } catch (error) {
        console.error("REQUEST OTP ERROR:", error);
        res.status(500).json({ message: 'Gagal mengirim OTP.', error: error.message });
    }
};

exports.verifyOtpAndRegister = async (req, res) => {
    const { whatsapp, otp } = req.body;
    if (!whatsapp || !otp) {
        return res.status(400).json({ message: 'Nomor WhatsApp dan OTP harus diisi.' });
    }

    const normalizedWhatsapp = normalizeWANumber(whatsapp);

    try {
        const [pending] = await pool.query('SELECT * FROM pending_registrations WHERE whatsapp_number = ? AND expires_at > NOW()', [normalizedWhatsapp]);
        if (pending.length === 0 || pending[0].otp_code !== otp) {
            return res.status(400).json({ message: 'Kode OTP salah atau sudah kedaluwarsa.' });
        }
        
        const userData = pending[0];
        const defaultAvatarUrl = `https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(userData.username)}`;

        const [result] = await pool.query(
        'INSERT INTO users (username, display_name, password_hash, profile_picture_url, whatsapp_number) VALUES (?, ?, ?, ?, ?)',
        [userData.username, userData.display_name, userData.password_hash, defaultAvatarUrl, userData.whatsapp_number]
        );
        
        await pool.query('DELETE FROM pending_registrations WHERE whatsapp_number = ?', [normalizedWhatsapp]);

        const welcomeMessage = `*Selamat Datang di SkydashNET!* 🎉\n\nAkun Anda telah berhasil dibuat! Anda sekarang bisa login dan mulai memonitor jaringan Anda.\n\nBerikut adalah detail login Anda:\n- _Username:_ \`${userData.username}\`\nSelamat menjelajahi dasbor Anda!\n*- Tim SkydashNET*`;

        await sendWhatsAppMessage(normalizedWhatsapp, welcomeMessage);

        res.status(201).json({ message: 'Registrasi berhasil!', userId: result.insertId });

    } catch (error) {
        console.error("VERIFY OTP ERROR:", error);
        res.status(500).json({ message: 'Gagal menyelesaikan registrasi.', error: error.message });
    }
};
