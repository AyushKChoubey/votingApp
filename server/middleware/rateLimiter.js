// middleware/rateLimiter.js - Centralized rate limiting configurations
const rateLimit = require('express-rate-limit');

// Rate limiter for booth creation (5 requests per 15 minutes)
const createBoothLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // limit each IP to 5 booth creations per window
    message: {
        error: 'Too many booth creation attempts, please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Rate limiter for voting (10 requests per minute)
const voteLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 10, // limit each IP to 10 votes per minute
    message: {
        error: 'Too many voting attempts, please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Rate limiter for authentication (10 requests per 15 minutes)
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // limit each IP to 10 auth attempts per window
    message: {
        error: 'Too many authentication attempts, please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Rate limiter for joining booths (20 requests per 5 minutes)
const joinBoothLimiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 20, // limit each IP to 20 join attempts per 5 minutes
    message: {
        error: 'Too many join attempts, please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Rate limiter for email verification resend (3 requests per 15 minutes)
const resendLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 3, // 3 requests per window
    message: {
        error: 'Too many verification requests. Please try again later.',
        retryAfter: '15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Rate limiter for email verification attempts (10 requests per 15 minutes)
const verifyEmailLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // 10 verification attempts per window
    message: {
        error: 'Too many verification attempts. Please try again later.',
        retryAfter: '15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Rate limiter for password reset (3 requests per 15 minutes)
const passwordResetLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 3, // 3 requests per window
    message: {
        error: 'Too many password reset requests. Please try again later.',
        retryAfter: '15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

module.exports = {
    createBoothLimiter,
    voteLimiter,
    authLimiter,
    joinBoothLimiter,
    resendLimiter,
    verifyEmailLimiter,
    passwordResetLimiter
};
