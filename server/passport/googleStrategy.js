const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');
require('dotenv').config();

passport.use(new GoogleStrategy(
  {
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL,
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      const email = profile.emails?.[0]?.value;
      const emailVerified = profile._json?.email_verified;
      const hostedDomain = profile._json?.hd;

      if (!email || !emailVerified || hostedDomain !== 'bitsathy.ac.in') {
        return done(
          { redirectTo: `${process.env.FRONTEND_URL}/unauthorized` },
          false
        );
      }

      const user = await User.findOrCreateByGoogle(
        profile.id,
        email,
        profile.displayName
      );

      return done(null, user);
    } catch (err) {
      console.error('Google Strategy Error:', err);
      return done(err, false);
    }
  }
));
