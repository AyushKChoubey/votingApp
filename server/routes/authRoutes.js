// routes/authRoutes.js - OAuth2 Authentication Routes
const express = require('express');
const router = express.Router();
const passport = require('../config/passport');
const { generateToken } = require('../middleware/jwt');

// Google OAuth Login
router.get('/google',
    passport.authenticate('google', {
        scope: ['profile', 'email'],
        prompt: 'select_account'
    })
);

// Google OAuth Callback
router.get('/google/callback',
    passport.authenticate('google', { 
        failureRedirect: process.env.CLIENT_URL ? `${process.env.CLIENT_URL}/login?error=oauth_failed` : 'http://localhost:5173/login?error=oauth_failed',
        session: false 
    }),
    async (req, res) => {
        try {
            // Generate JWT token
            const token = generateToken({
                id: req.user._id,
                email: req.user.email,
                name: req.user.name
            });

            // Redirect to frontend with token
            const clientURL = process.env.CLIENT_URL || 'http://localhost:5173';
            res.redirect(`${clientURL}/auth/callback?token=${token}`);
        } catch (err) {
            console.error('OAuth callback error:', err);
            const clientURL = process.env.CLIENT_URL || 'http://localhost:5173';
            res.redirect(`${clientURL}/login?error=authentication_failed`);
        }
    }
);

// Check OAuth status
router.get('/status', (req, res) => {
    res.json({
        googleOAuth: {
            enabled: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
            configured: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET)
        }
    });
});

module.exports = router;
