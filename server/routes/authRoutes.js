// routes/authRoutes.js - OAuth2 Authentication Routes
const express = require('express');
const router = express.Router();
const crypto = require('crypto');
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
    const nonce = crypto.randomBytes(16).toString('hex');
    try {
        if (req.session) req.session.oauthNonce = nonce;
    } catch (e) {
        // ignore session write errors
    }

    let stateObj = { n: nonce };
    if (req.query.mobile === '1') {
        stateObj.m = 1;
    }
    if (isSafeRedirect(redirect)) {
        stateObj.r = redirect;
    }

    // Native OAuth finishes in an external browser, so its WebView session
    // cookie is unavailable when the callback returns to the app. Sign the
    // state so native callbacks can be verified without that cookie.
    if (stateObj.m === 1) {
        const statePayload = JSON.stringify(stateObj);
        stateObj.s = crypto
            .createHmac('sha256', process.env.SESSION_SECRET || 'dev-secret-change-in-production')
            .update(statePayload)
            .digest('hex');
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
            // Redirect to frontend with token. If the OAuth `state` was
            // provided we encoded JSON with a nonce (and possibly a redirect).
            // Validate state & nonce BEFORE issuing any token.
            const clientURL = process.env.CLIENT_URL || 'http://localhost:5173';
            let statePart = '';
            let mobileRedirect = false;
            if (req.query.state) {
                try {
                    const decoded = decodeURIComponent(req.query.state);
                    const parsed = JSON.parse(decoded);
                    mobileRedirect = parsed && parsed.m === 1;

                    if (mobileRedirect) {
                        const signature = parsed.s;
                        const unsignedState = { ...parsed };
                        delete unsignedState.s;
                        const expectedSignature = crypto
                            .createHmac('sha256', process.env.SESSION_SECRET || 'dev-secret-change-in-production')
                            .update(JSON.stringify(unsignedState))
                            .digest('hex');
                        const signaturesMatch =
                            typeof signature === 'string' &&
                            signature.length === expectedSignature.length &&
                            crypto.timingSafeEqual(
                                Buffer.from(signature),
                                Buffer.from(expectedSignature),
                            );
                        if (!signaturesMatch) {
                            console.warn('Invalid native OAuth state signature. Rejecting callback.');
                            return res.redirect(`${clientURL}/login?error=invalid_oauth_state`);
                        }
                    }

                    // Validate CSRF nonce from session. Any error reading session
                    // or mismatch must be treated as failure.
                    let nonceValid = mobileRedirect;
                    try {
                        const sessionNonce = req.session && req.session.oauthNonce;
                        const parsedNonce = parsed && parsed.n;
                        if (parsedNonce && sessionNonce && parsedNonce === sessionNonce) {
                            nonceValid = true;
                        }
                    } catch (e) {
                        // treat as invalid
                        nonceValid = false;
                    }

                    if (!nonceValid) {
                        console.warn('OAuth state nonce mismatch or missing. Rejecting callback.');
                        try { if (req.session) req.session.oauthNonce = undefined; } catch (e) {}
                        return res.redirect(`${clientURL}/login?error=invalid_oauth_state`);
                    }

                    // Clear nonce to prevent replay
                    try { if (req.session) req.session.oauthNonce = undefined; } catch (e) {}

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

            // Record active session for OAuth login
            const sessionId = crypto.randomUUID();
            try {
                const User = require('../models/user');
                const user = await User.findById(req.user._id);
                if (user) {
                    if (!user.sessions) user.sessions = [];
                    const ua = req.headers['user-agent'] || '';
                    let browser = 'Web Browser';
                    let os = 'Unknown OS';
                    let deviceType = 'desktop';
                    if (/iphone/i.test(ua)) { os = 'iOS'; deviceType = 'mobile'; }
                    else if (/ipad/i.test(ua)) { os = 'iPadOS'; deviceType = 'tablet'; }
                    else if (/android/i.test(ua)) { os = 'Android'; deviceType = /mobile/i.test(ua) ? 'mobile' : 'tablet'; }
                    else if (/windows/i.test(ua)) os = 'Windows';
                    else if (/macintosh/i.test(ua)) os = 'macOS';
                    else if (/linux/i.test(ua)) os = 'Linux';
                    if (/edg\//i.test(ua)) browser = 'Microsoft Edge';
                    else if (/chrome/i.test(ua)) browser = 'Chrome';
                    else if (/firefox/i.test(ua)) browser = 'Firefox';
                    else if (/safari/i.test(ua)) browser = 'Safari';

                    const existingIndex = user.sessions.findIndex(
                        (s) => s.browser === browser && s.os === os && s.deviceType === deviceType
                    );
                    if (existingIndex !== -1) {
                        user.sessions[existingIndex].sessionId = sessionId;
                        user.sessions[existingIndex].lastActive = new Date();
                    } else {
                        user.sessions.push({
                            sessionId,
                            browser,
                            os,
                            deviceType,
                            lastActive: new Date(),
                            createdAt: new Date(),
                        });
                    }
                    if (user.sessions.length > 20) user.sessions = user.sessions.slice(-20);
                    await user.save();
                }
            } catch (sessionErr) {
                console.warn('OAuth session tracking error:', sessionErr.message);
            }

            // Generate JWT token AFTER validation
            const token = generateToken({
                id: req.user._id,
                email: req.user.email,
                name: req.user.name,
                sessionId,
            });

            const callbackBase = mobileRedirect
                ? 'votebooth://auth/callback'
                : `${clientURL}/auth/callback`;
            res.redirect(`${callbackBase}?token=${token}${statePart}`);
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
