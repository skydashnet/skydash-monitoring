const pool = require('../config/database');
const UAParser = require('ua-parser-js');

exports.getActiveSessions = async (req, res) => {
    const userId = req.user.id;
    const currentTokenId = req.user.jti;

    try {
        const [sessions] = await pool.query('SELECT * FROM user_sessions WHERE user_id = ? ORDER BY last_seen DESC', [userId]);
        
        const parser = new UAParser();
        const detailedSessions = sessions.map(session => {
            const uaResult = parser.setUA(session.user_agent || "").getResult();
            
            const browserInfo = `${uaResult.browser?.name || 'Unknown'} ${uaResult.browser?.version || ''}`.trim();
            const osInfo = `${uaResult.os?.name || 'Unknown'} ${uaResult.os?.version || ''}`.trim();
            const isCurrentSession = session.token_id === currentTokenId;

            return {
                id: session.id,
                browser: browserInfo,
                os: osInfo,
                ip_address: session.ip_address,
                last_seen: session.last_seen,
                isCurrentSession: isCurrentSession 
            };
        });

        res.json(detailedSessions);
    } catch (error) {
        console.error("GET SESSIONS ERROR:", error);
        res.status(500).json({ message: 'Gagal mengambil data sesi', error: error.message });
    }
};

exports.deleteSession = async (req, res) => {
    const sessionIdToDelete = req.params.id;
    const currentUserId = req.user.id;

    try {
        const [result] = await pool.query('DELETE FROM user_sessions WHERE id = ? AND user_id = ?', [sessionIdToDelete, currentUserId]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Sesi tidak ditemukan atau Anda tidak memiliki izin.' });
        }
        
        res.status(200).json({ message: 'Sesi berhasil dihentikan' });
    } catch (error) {
        console.error("DELETE SESSION ERROR:", error);
        res.status(500).json({ message: 'Gagal menghentikan sesi', error: error.message });
    }
};