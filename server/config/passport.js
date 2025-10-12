// config/passport.js - Passport OAuth2 Configuration
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/user');
const { generateToken } = require('../middleware/jwt');

// Serialize user for session
passport.serializeUser((user, done) => {
    done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (err) {
        done(err, null);
    }
});

// Google OAuth Strategy
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/auth/google/callback',
    userProfileURL: 'https://www.googleapis.com/oauth2/v3/userinfo'
},
async (accessToken, refreshToken, profile, done) => {
    try {
        // Check if user already exists
        let user = await User.findOne({ googleId: profile.id });

        if (user) {
            // User exists, update last login
            user.lastLogin = new Date();
            await user.save();
            return done(null, user);
        }

        // Check if user exists with same email
        user = await User.findOne({ email: profile.emails[0].value });

        if (user) {
            // Link Google account to existing user
            user.googleId = profile.id;
            user.emailVerified = true; // Google accounts are already verified
            user.lastLogin = new Date();
            await user.save();
            return done(null, user);
        }

        // Create new user
        const newUser = new User({
            googleId: profile.id,
            email: profile.emails[0].value,
            name: profile.displayName,
            emailVerified: true, // Google accounts are already verified
            authProvider: 'google',
            profilePicture: profile.photos && profile.photos.length > 0 ? profile.photos[0].value : null,
            lastLogin: new Date()
        });

        await newUser.save();
        done(null, newUser);
    } catch (err) {
        console.error('Google OAuth error:', err);
        done(err, null);
    }
}));

module.exports = passport;
