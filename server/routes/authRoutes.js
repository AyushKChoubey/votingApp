// routes/authRoutes.js - OAuth2 Authentication Routes
const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const passport = require('../config/passport');
const { generateToken } = require('../middleware/jwt');
const { resendLimiter, verifyEmailLimiter, passwordResetLimiter } = require('../middleware/rateLimiter');
const { verifyEmail, resendVerificationEmail, forgotPassword, resetPassword } = require('../controllers/userController');

// Helper: safe relative path only
const isSafeRedirect = (p) => {
    if (!p || typeof p !== 'string') return false;
    if (!p.startsWith('/')) return false;
    if (p.startsWith('//')) return false;
    if (p.includes('://')) return false;
    if (/\r|\n/.test(p)) return false;
    return true;
};

// Helper: safe secret retrieval for OAuth signing
const getOAuthSecret = () => {
    return process.env.SESSION_SECRET || process.env.JWT_SECRET || 'dev-secret-change-in-production';
};

// Helper: Parse OAuth state supporting Base64URL, JSON, and URI-encoded strings
const parseOAuthState = (rawState) => {
    if (!rawState || typeof rawState !== 'string') return null;

    // 1. Try Base64URL decoding
    try {
        const jsonStr = Buffer.from(rawState, 'base64url').toString('utf8');
        const parsed = JSON.parse(jsonStr);
        if (parsed && typeof parsed === 'object') return parsed;
    } catch (e) {}

    // 2. Try direct JSON parse
    try {
        const parsed = JSON.parse(rawState);
        if (parsed && typeof parsed === 'object') return parsed;
    } catch (e) {}

    // 3. Try URI decoding (handles single or double URL encoding)
    try {
        let decoded = decodeURIComponent(rawState);
        if (decoded.includes('%')) {
            try { decoded = decodeURIComponent(decoded); } catch (e) {}
        }
        const parsed = JSON.parse(decoded);
        if (parsed && typeof parsed === 'object') return parsed;
    } catch (e) {}

    return null;
};

// Helper: Verify HMAC signature and timestamp freshness for OAuth state
const validateOAuthState = (parsed, secret, session) => {
    if (!parsed || typeof parsed !== 'object') {
        return { valid: false, error: 'unparseable_state' };
    }

    // A. Verify HMAC signature if present
    if (parsed.s) {
        const signature = parsed.s;
        const unsignedState = { ...parsed };
        delete unsignedState.s;
        const expectedSignature = crypto
            .createHmac('sha256', secret)
            .update(JSON.stringify(unsignedState))
            .digest('hex');

        const signaturesMatch =
            typeof signature === 'string' &&
            signature.length === expectedSignature.length &&
            crypto.timingSafeEqual(
                Buffer.from(signature),
                Buffer.from(expectedSignature),
            );

        if (signaturesMatch) {
            // Check expiration if timestamp exists (15 min freshness window)
            if (parsed.ts) {
                const age = Date.now() - parsed.ts;
                if (age > 15 * 60 * 1000 || age < -60 * 1000) {
                    return { valid: false, error: 'expired_state' };
                }
            }
            return { valid: true, state: parsed };
        }
    }

    // B. Fallback: Check against session oauthNonce if session cookie survived
    const sessionNonce = session && session.oauthNonce;
    const parsedNonce = parsed && parsed.n;
    if (parsedNonce && sessionNonce && parsedNonce === sessionNonce) {
        return { valid: true, state: parsed };
    }

    return { valid: false, error: 'nonce_mismatch_or_invalid_signature' };
};

// Google OAuth Login
router.get('/google', (req, res, next) => {
    const redirect = req.query.redirect;
    const isMobile = req.query.mobile === '1';
    const secret = getOAuthSecret();

    // Create CSRF nonce and build signed state payload
    const nonce = crypto.randomBytes(16).toString('hex');
    const statePayload = {
        n: nonce,
        ts: Date.now(),
        m: isMobile ? 1 : 0,
    };
    if (isSafeRedirect(redirect)) {
        statePayload.r = redirect;
    }

    // Sign the state with HMAC-SHA256 for all environments (web and mobile)
    const signature = crypto
        .createHmac('sha256', secret)
        .update(JSON.stringify(statePayload))
        .digest('hex');

    const stateObj = { ...statePayload, s: signature };

    // Also store in session as fallback
    try {
        if (req.session) {
            req.session.oauthNonce = nonce;
            req.session.oauthTime = Date.now();
        }
    } catch (e) {}

    // Encode state using Base64URL for URL safety without risk of double-encoding
    const encodedState = Buffer.from(JSON.stringify(stateObj)).toString('base64url');

    const options = {
        scope: ['profile', 'email'],
        prompt: 'select_account',
        state: encodedState,
    };

    passport.authenticate('google', options)(req, res, next);
});

// Google OAuth Callback
router.get('/google/callback', (req, res, next) => {
    const clientURL = process.env.CLIENT_URL || 'http://localhost:5173';
    const secret = getOAuthSecret();

    // 1. Check for provider-level errors (e.g. user cancelled Google sign-in)
    if (req.query.error) {
        console.warn('Google OAuth returned error query param:', req.query.error);
        const parsedState = parseOAuthState(req.query.state);
        const isMobile = parsedState && parsedState.m === 1;
        const redirectBase = isMobile ? 'votebooth://auth/callback' : `${clientURL}/login`;
        const errorCode = req.query.error === 'access_denied' ? 'oauth_cancelled' : 'oauth_failed';
        return res.redirect(`${redirectBase}?error=${errorCode}`);
    }

    // 2. Pre-validate state & CSRF nonce BEFORE contacting Google token endpoint
    const stateCheck = validateOAuthState(parseOAuthState(req.query.state), secret, req.session);
    if (!stateCheck.valid) {
        console.warn('OAuth state nonce mismatch or missing. Rejecting callback:', stateCheck.error);
        try { if (req.session) req.session.oauthNonce = undefined; } catch (e) {}
        return res.redirect(`${clientURL}/login?error=invalid_oauth_state`);
    }

    // Clear session nonce to prevent replay
    try { if (req.session) req.session.oauthNonce = undefined; } catch (e) {}

    // 3. Verify authorization code is present
    if (!req.query.code) {
        console.warn('Google OAuth callback missing authorization code.');
        return res.redirect(`${clientURL}/login?error=oauth_failed`);
    }

    const stateObj = stateCheck.state;
    const mobileRedirect = stateObj && stateObj.m === 1;
    let statePart = '';
    const r = stateObj && stateObj.r;
    if (isSafeRedirect(r)) {
        statePart = `&redirect=${encodeURIComponent(r)}`;
    }

    // 4. Authenticate code with Google via custom callback to catch errors cleanly
    passport.authenticate('google', { session: false }, async (err, user, info) => {
        if (err || !user) {
            console.warn('Google OAuth token exchange failed:', err?.message || info?.message || 'No user returned');
            const callbackBase = mobileRedirect
                ? 'votebooth://auth/callback'
                : `${clientURL}/login`;
            return res.redirect(`${callbackBase}?error=oauth_failed`);
        }

        try {
            // Record active session for OAuth login
            const sessionId = crypto.randomUUID();
            try {
                const User = require('../models/user');
                const dbUser = await User.findById(user._id);
                if (dbUser) {
                    if (!dbUser.sessions) dbUser.sessions = [];
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

                    const existingIndex = dbUser.sessions.findIndex(
                        (s) => s.browser === browser && s.os === os && s.deviceType === deviceType
                    );
                    if (existingIndex !== -1) {
                        dbUser.sessions[existingIndex].sessionId = sessionId;
                        dbUser.sessions[existingIndex].lastActive = new Date();
                    } else {
                        dbUser.sessions.push({
                            sessionId,
                            browser,
                            os,
                            deviceType,
                            lastActive: new Date(),
                            createdAt: new Date(),
                        });
                    }
                    if (dbUser.sessions.length > 20) dbUser.sessions = dbUser.sessions.slice(-20);
                    await dbUser.save();
                }
            } catch (sessionErr) {
                console.warn('OAuth session tracking error:', sessionErr.message);
            }

            // Generate JWT token AFTER validation
            const token = generateToken({
                id: user._id,
                email: user.email,
                name: user.name,
                sessionId,
            });

            const callbackBase = mobileRedirect
                ? 'votebooth://auth/callback'
                : `${clientURL}/auth/callback`;
            res.redirect(`${callbackBase}?token=${token}${statePart}`);
        } catch (postAuthErr) {
            console.error('OAuth post-auth error:', postAuthErr);
            const redirectBase = mobileRedirect
                ? 'votebooth://auth/callback'
                : `${clientURL}/login`;
            res.redirect(`${redirectBase}?error=authentication_failed`);
        }
    })(req, res, next);
});

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
