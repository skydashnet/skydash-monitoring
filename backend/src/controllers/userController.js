const pool = require('../config/database');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
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

exports.updateUserDetails = async (req, res) => {
    const { displayName } = req.body;
    const userId = req.user.id;
    if (!displayName) {
        return res.status(400).json({ message: 'Nama Display tidak boleh kosong' });
    }
    try {
        await pool.query('UPDATE users SET display_name = ? WHERE id = ?', [displayName, userId]);
        const updatedUser = { ...req.user, display_name: displayName };
        res.status(200).json({ message: 'Profil berhasil diperbarui', user: updatedUser });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.updateAvatar = async (req, res) => {
    const userId = req.user.id;
    if (!req.file) {
        return res.status(400).json({ message: 'Tidak ada file yang diunggah' });
    }
    try {
        const avatarUrl = `/public/uploads/avatars/${req.file.filename}`;
        await pool.query('UPDATE users SET profile_picture_url = ? WHERE id = ?', [avatarUrl, userId]);
        const updatedUser = { ...req.user, profile_picture_url: avatarUrl };
        res.status(200).json({ message: 'Foto profil berhasil diperbarui', user: updatedUser });
    } catch (error) {
        console.error("AVATAR UPLOAD ERROR:", error);
        res.status(500).json({ message: 'Server error saat memperbarui foto profil' });
    }
};

exports.changePassword = async (req, res) => {
    const { oldPassword, newPassword } = req.body;
    const userId = req.user.id;
    if (!oldPassword || !newPassword) {
        return res.status(400).json({ message: 'Semua field harus diisi' });
    }
    if (newPassword.length < 6) {
        return res.status(400).json({ message: 'Password baru minimal harus 6 karakter' });
    }
    try {
        const [users] = await pool.query('SELECT password_hash FROM users WHERE id = ?', [userId]);
        if (users.length === 0) return res.status(404).json({ message: 'User tidak ditemukan' });
        
        const user = users[0];
        const isMatch = await bcrypt.compare(oldPassword, user.password_hash);
        if (!isMatch) return res.status(401).json({ message: 'Password lama salah' });

        const salt = await bcrypt.genSalt(10);
        const newPasswordHash = await bcrypt.hash(newPassword, salt);
        await pool.query('UPDATE users SET password_hash = ? WHERE id = ?', [newPasswordHash, userId]);
        res.status(200).json({ message: 'Password berhasil diperbarui' });
    } catch (error) {
        console.error("CHANGE PASSWORD ERROR:", error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.deleteAccount = async (req, res) => {
    const userId = req.user.id;
    const { password } = req.body;

    if (!password) {
        return res.status(400).json({ message: 'Password diperlukan untuk konfirmasi.' });
    }

    try {
        const [users] = await pool.query('SELECT * FROM users WHERE id = ?', [userId]);
        if (users.length === 0) {
            return res.status(404).json({ message: 'User tidak ditemukan.' });
        }
        const user = users[0];

        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ message: 'Password salah. Aksi dibatalkan.' });
        }

        if (user.profile_picture_url && !user.profile_picture_url.includes('api.dicebear.com')) {
            const avatarPath = path.join(__dirname, '..', '..', user.profile_picture_url);
            if (fs.existsSync(avatarPath)) {
                fs.unlink(avatarPath, (err) => {
                    if (err) console.error("Gagal menghapus file avatar lama:", err);
                    else console.log("File avatar berhasil dihapus:", avatarPath);
                });
            }
        }
        
        await pool.query('DELETE FROM users WHERE id = ?', [userId]);

        res.cookie('token', '', { httpOnly: true, expires: new Date(0) });
        res.status(200).json({ message: 'Akun Anda dan semua data terkait telah berhasil dihapus secara permanen.' });

    } catch (error) {
        console.error("DELETE ACCOUNT ERROR:", error);
        res.status(500).json({ message: 'Gagal menghapus akun', error: error.message });
    }
};

exports.requestWhatsappChange = async (req, res) => {
    const userId = req.user.id;
    const { whatsappNumber } = req.body;
    if (!whatsappNumber) return res.status(400).json({ message: 'Nomor WhatsApp tidak boleh kosong.' });

    const normalizedWhatsapp = normalizeWANumber(whatsappNumber);
    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    try {
        await pool.query(
            `INSERT INTO whatsapp_updates (user_id, new_whatsapp_number, otp_code, expires_at) VALUES (?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE new_whatsapp_number=VALUES(new_whatsapp_number), otp_code=VALUES(otp_code), expires_at=VALUES(expires_at)`,
            [userId, normalizedWhatsapp, otp, expiresAt]
        );
        const otpMessage = `*SkydashNET - Konfirmasi Perubahan Nomor*\n\nSeseorang (semoga Anda) telah meminta untuk mengubah nomor WhatsApp yang terhubung dengan akun Anda.\n\nGunakan kode di bawah ini untuk menyelesaikan proses:\n\`\`\`${otp}\`\`\`\n\n_Jika Anda tidak merasa melakukan ini, mohon abaikan pesan ini dan segera amankan akun Anda._`;
        
        await sendWhatsAppMessage(normalizedWhatsapp, otpMessage);
        
        res.status(200).json({ message: 'Kode OTP telah dikirim ke nomor WhatsApp baru Anda.' });
    } catch (error) {
        console.error("WHATSAPP CHANGE OTP ERROR:", error);
        res.status(500).json({ message: 'Gagal mengirim OTP.', error: error.message });
    }
};

exports.verifyWhatsappChange = async (req, res) => {
    const userId = req.user.id;
    const { otp } = req.body;
    if (!otp) return res.status(400).json({ message: 'OTP tidak boleh kosong.' });

    try {
        const [pending] = await pool.query('SELECT * FROM whatsapp_updates WHERE user_id = ? AND expires_at > NOW()', [userId]);
        if (pending.length === 0 || pending[0].otp_code !== otp) {
            return res.status(400).json({ message: 'Kode OTP salah atau kedaluwarsa.' });
        }
        
        const newWhatsappNumber = pending[0].new_whatsapp_number;
        await pool.query('UPDATE users SET whatsapp_number = ? WHERE id = ?', [newWhatsappNumber, userId]);
        await pool.query('DELETE FROM whatsapp_updates WHERE user_id = ?', [userId]);

        res.status(200).json({ message: 'Nomor WhatsApp berhasil diperbarui.' });
    } catch (error) {
        console.error("VERIFY WHATSAPP CHANGE ERROR:", error);
        res.status(500).json({ message: 'Gagal memverifikasi OTP.', error: error.message });
    }
};