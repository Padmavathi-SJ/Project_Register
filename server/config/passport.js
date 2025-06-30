const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');
const { google } = require('../config/envConfig');

passport.use(
    new GoogleStrategy(
        {
            clientID: google.clientId,
            clientSecret: google.clientSecret,
            callbackURL: google.callbackURL,
            passReqToCallback: true,
            scope: ['profile', 'email']
        },
        async (req, accessToken, refreshToken, profile, done) => {
            try {
                console.log('Google Profile:', profile);
                
                // Extract essential user information
                const email = profile.emails?.[0]?.value;
                if (!email) {
                    const error = new Error('No email found in Google profile');
                    error.redirectTo = `${process.env.FRONTEND_URL}/auth?error=no_email`;
                    return done(error, null);
                }

                // Check for existing user
                const user = await User.findByEmail(email);
                console.log('Found user:', user);
                
                if (!user) {
                    const error = new Error('User not registered');
                    error.redirectTo = `${process.env.FRONTEND_URL}/auth?error=not_registered&email=${encodeURIComponent(email)}&name=${encodeURIComponent(profile.displayName)}`;
                    return done(error, null);
                }

                // Update user's Google ID if not already set
                if (!user.googleId) {
                    await pool.query('UPDATE users SET googleId = ? WHERE id = ?', [profile.id, user.id]);
                    user.googleId = profile.id;
                }

                return done(null, user);
            } catch (err) {
                console.error('Google Auth Error:', err);
                err.redirectTo = `${process.env.FRONTEND_URL}/auth?error=server_error`;
                return done(err, null);
            }
        }
    )
);

// Serialization/Deserialization remains the same
passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (err) {
        console.error('Deserialization Error:', err);
        done(err, null);
    }
});

module.exports = passport;