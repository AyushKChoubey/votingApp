// routes/authRoutes.js - OAuth2 Authentication Routes
const express = require('express');
const router = express.Router();
const passport = require('../config/passport');
const { generateToken } = require('../middleware/jwt');
const { resendLimiter, verifyEmailLimiter, passwordResetLimiter } = require('../middleware/rateLimiter');
const { verifyEmail, resendVerificationEmail, forgotPassword, resetPassword } = require('../controllers/userController');

// Google OAuth Login
router.get('/google', (req, res, next) => {
    // Allow an optional `redirect` query param but validate it before including
    // it in the OAuth state to avoid open-redirects. Also include a CSRF nonce.
    const redirect = req.query.redirect;
    const options = {
        scope: ['profile', 'email'],
        prompt: 'select_account'
    };

    // helper: safe relative path only
    const isSafeRedirect = (p) => {
        if (!p || typeof p !== 'string') return false;
        if (!p.startsWith('/')) return false;
        if (p.startsWith('//')) return false;
        if (p.includes('://')) return false;
        if (/\r|\n/.test(p)) return false;
        return true;
    };

    // create CSRF nonce and store minimally in session
    const crypto = require('crypto');
    const nonce = crypto.randomBytes(16).toString('hex');
    try {
        if (req.session) req.session.oauthNonce = nonce;
    } catch (e) {
        // ignore session write errors
    }

    let stateObj = { n: nonce };
    if (isSafeRedirect(redirect)) {
        stateObj.r = redirect;
    }

    // Encode state as JSON then URI component to keep it safe for query use
    try {
        options.state = encodeURIComponent(JSON.stringify(stateObj));
    } catch (e) {
        options.state = encodeURIComponent(JSON.stringify({ n: nonce }));
    }

    passport.authenticate('google', options)(req, res, next);
});

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

            // Redirect to frontend with token. If the OAuth `state` was
            // provided we encoded JSON with a nonce (and possibly a redirect).
            // Only forward a validated redirect to the client.
            const clientURL = process.env.CLIENT_URL || 'http://localhost:5173';
            let statePart = '';
            if (req.query.state) {
                try {
                    const decoded = decodeURIComponent(req.query.state);
                    const parsed = JSON.parse(decoded);

                    // Validate CSRF nonce from session
                    try {
                        const sessionNonce = req.session && req.session.oauthNonce;
                        const parsedNonce = parsed && parsed.n;
                        if (!parsedNonce || !sessionNonce || parsedNonce !== sessionNonce) {
                            console.warn('OAuth state nonce mismatch or missing. Rejecting callback.');
                            const clientURL = process.env.CLIENT_URL || 'http://localhost:5173';
                            // Clear any stored nonce
                            try { if (req.session) req.session.oauthNonce = undefined; } catch (e) {}
                            return res.redirect(`${clientURL}/login?error=invalid_oauth_state`);
                        }
                        // Clear nonce to prevent replay
                        try { if (req.session) req.session.oauthNonce = undefined; } catch (e) {}
                    } catch (e) {
                        // ignore session read/clear errors but fail safe below
                    }

                    const r = parsed && parsed.r;
                    // reuse same safe-check used earlier
                    const isSafeRedirect = (p) => {
                        if (!p || typeof p !== 'string') return false;
                        if (!p.startsWith('/')) return false;
                        if (p.startsWith('//')) return false;
                        if (p.includes('://')) return false;
                        if (/\r|\n/.test(p)) return false;
                        return true;
                    };
                    if (isSafeRedirect(r)) {
                        statePart = `&redirect=${encodeURIComponent(r)}`;
                    }
                } catch (e) {
                    // ignore malformed state
                }
            }

            res.redirect(`${clientURL}/auth/callback?token=${token}${statePart}`);
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

// Email Verification Routes
router.get('/verify-email', verifyEmailLimiter, verifyEmail); // GET /api/auth/verify-email?token=xxx
router.post('/resend-verification', resendLimiter, resendVerificationEmail); // POST /api/auth/resend-verification

// Password Reset Routes
router.post('/forgot-password', passwordResetLimiter, forgotPassword); // POST /api/auth/forgot-password
router.post('/reset-password', passwordResetLimiter, resetPassword); // POST /api/auth/reset-password

module.exports = router;
