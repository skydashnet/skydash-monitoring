const jwt = require('jsonwebtoken');
const pool = require('../config/database');

const protect = async (req, res, next) => {
    const token = req.cookies.token;

    if (!token) {
        return res.status(401).json({ message: 'Tidak terotorisasi, tidak ada token' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_default_secret_key');
        const [sessions] = await pool.query('SELECT user_id FROM user_sessions WHERE token_id = ? AND user_id = ?', [decoded.jti, decoded.id]);
        if (sessions.length === 0) {
            return res.status(401).json({ message: 'Tidak terotorisasi, sesi tidak valid' });
        }
        const [users] = await pool.query('SELECT id, username, display_name, profile_picture_url, workspace_id FROM users WHERE id = ?', [decoded.id]);
        if (users.length > 0) {
            const user = users[0];
            req.user = { ...user, jti: decoded.jti };
            await pool.query('UPDATE user_sessions SET last_seen = CURRENT_TIMESTAMP WHERE token_id = ?', [decoded.jti]);
            next();
        } else {
            res.status(401).json({ message: 'Tidak terotorisasi, user tidak ditemukan' });
        }

    } catch (error) {
        res.status(401).json({ message: 'Tidak terotorisasi, token gagal' });
    }
};

module.exports = { protect };