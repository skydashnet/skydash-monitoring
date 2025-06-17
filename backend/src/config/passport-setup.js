const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const pool = require('./database');

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const [users] = await pool.query('SELECT * FROM users WHERE id = ?', [id]);
        done(null, users[0]);
    } catch (err) {
        done(err, null);
    }
});

passport.use(
    new GoogleStrategy({
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL,
        passReqToCallback: true
    }, 
    async (req, accessToken, refreshToken, profile, done) => {
        const googleId = profile.id;
        const displayName = profile.displayName;
        const email = profile.emails[0].value;
        const avatar = profile.photos[0].value;

        try {
            if (req.user) {
                const userId = req.user.id;
                await pool.query(
                    'UPDATE users SET google_id = ?, email = ? WHERE id = ?',
                    [googleId, email, userId]
                );
                const [updatedUser] = await pool.query('SELECT * FROM users WHERE id = ?', [userId]);
                return done(null, updatedUser[0]);
            } 
            else {
                const [existingUser] = await pool.query('SELECT * FROM users WHERE google_id = ? OR email = ?', [googleId, email]);
                if (existingUser.length > 0) {
                    return done(null, existingUser[0]);
                } else {
                    const username = email.split('@')[0] + Math.floor(Math.random() * 1000);
                    const [newUserResult] = await pool.query(
                        'INSERT INTO users (username, email, display_name, profile_picture_url, google_id) VALUES (?, ?, ?, ?, ?)',
                        [username, email, displayName, avatar, googleId]
                    );
                    const [newUser] = await pool.query('SELECT * FROM users WHERE id = ?', [newUserResult.insertId]);
                    return done(null, newUser[0]);
                }
            }
        } catch (error) {
            return done(error, null);
        }
    })
);