const pool = require('../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { sendWhatsAppMessage } = require('../services/whatsappService');

const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

exports.register = async (req, res) => {
    const { username, displayName, password } = req.body;
    if (!username || !displayName || !password) {
        return res.status(400).json({ message: 'Semua field harus diisi' });
    }
    try {
        const [existingUser] = await pool.query('SELECT id FROM users WHERE username = ?', [username]);
        if (existingUser.length > 0) {
            return res.status(409).json({ message: 'Username sudah digunakan!' });
        }
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);
        const defaultAvatarUrl = `https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(username)}`;
        const [result] = await pool.query(
            'INSERT INTO users (username, display_name, password_hash, profile_picture_url) VALUES (?, ?, ?, ?)',
            [username, displayName, password_hash, defaultAvatarUrl]
        );
        res.status(201).json({ message: 'Pengguna berhasil dibuat!', userId: result.insertId });
    } catch (error) {
        console.error("REGISTER ERROR:", error);
        res.status(500).json({ message: 'Server error saat registrasi! Hubungi Administrator' });
    }
};

exports.login = async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ message: 'Username dan password harus diisi.' });

    try {
        const [users] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
        if (users.length === 0) return res.status(401).json({ message: 'Username Salah. Mohon cek kembali.' });
        
        const user = users[0];
        if (!user.whatsapp_number) return res.status(400).json({ message: 'Akun ini tidak memiliki nomor WhatsApp terdaftar untuk 2FA.' });
        
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) return res.status(401).json({ message: 'Password salah. Mohon cek kembali.' });

        const otp = generateOtp();
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
        
        await pool.query(
            `INSERT INTO login_otps (user_id, otp_code, expires_at) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE otp_code=VALUES(otp_code), expires_at=VALUES(expires_at)`,
            [user.id, otp, expiresAt]
        );
        const otpMessage = `*SkydashNET - Permintaan Login* 🔐\n\nSeseorang (semoga Anda) mencoba login ke akun Anda. Gunakan kode di bawah ini untuk melanjutkan.\n\nKode Login Anda:\n\`\`\`${otp}\`\`\`\n\n_Jika ini bukan Anda, segera amankan akun Anda atau abaikan pesan ini._`;

        await sendWhatsAppMessage(user.whatsapp_number, otpMessage);

        res.status(200).json({ 
            message: 'OTP telah dikirim ke WhatsApp Anda.', 
            userId: user.id,
            whatsappNumber: user.whatsapp_number
        });

    } catch (error) {
        console.error("LOGIN OTP REQUEST ERROR:", error);
        res.status(500).json({ message: 'Gagal mengirim OTP login.', error: error.message });
    }
};


exports.verifyLoginOtp = async (req, res) => {
    const { userId, otp } = req.body;
    if (!userId || !otp) return res.status(400).json({ message: 'User ID dan OTP harus diisi.' });

    try {
        const [otps] = await pool.query('SELECT * FROM login_otps WHERE user_id = ? AND expires_at > NOW()', [userId]);
        if (otps.length === 0 || otps[0].otp_code !== otp) {
            return res.status(400).json({ message: 'Kode OTP salah atau sudah kedaluwarsa.' });
        }
        
        const [users] = await pool.query('SELECT * FROM users WHERE id = ?', [userId]);
        const user = users[0];
        
        const jti = uuidv4();
        const payload = { id: user.id, username: user.username, displayName: user.display_name, profile_picture_url: user.profile_picture_url, workspace_id: user.workspace_id, jti: jti };
        const token = jwt.sign(payload, process.env.JWT_SECRET || 'your_default_secret_key', { expiresIn: '7d' });
        
        await pool.query(
            'INSERT INTO user_sessions (user_id, token_id, user_agent, ip_address) VALUES (?, ?, ?, ?)',
            [user.id, jti, req.headers['user-agent'], req.ip]
        );

        res.cookie('token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', maxAge: 7 * 24 * 60 * 60 * 1000, sameSite: 'lax' });
        
        res.status(200).json({ message: 'Login berhasil', user: payload });

    } catch (error) {
        console.error("LOGIN VERIFY OTP ERROR:", error);
        res.status(500).json({ message: 'Gagal verifikasi OTP.', error: error.message });
    }
};


exports.logout = async (req, res) => {
    try {
        const token = req.cookies.token;
        if (token) {
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_default_secret_key');
            await pool.query('DELETE FROM user_sessions WHERE token_id = ?', [decoded.jti]);
        }
    } catch (error) {}
    
    res.cookie('token', '', { httpOnly: true, expires: new Date(0) });
    res.status(200).json({ message: 'Logout berhasil' });
};

exports.getMe = (req, res) => {
    res.status(200).json(req.user);
};
