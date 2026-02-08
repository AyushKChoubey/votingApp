// middleware/security.js
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');

// Security headers middleware
const securityHeaders = helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://cdn.tailwindcss.com", "https://cdnjs.cloudflare.com"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://cdn.tailwindcss.com", "https://cdnjs.cloudflare.com"],
            imgSrc: ["'self'", "data:", "https:"],
            fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com"],
            connectSrc: ["'self'"],
            frameSrc: ["'none'"],
            objectSrc: ["'none'"],
            mediaSrc: ["'none'"],
            manifestSrc: ["'self'"]
        }
    },
    crossOriginEmbedderPolicy: false,
    hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
    }
});

// Input validation middleware
const validateInput = (req, res, next) => {
    // Remove any null bytes
    for (let key in req.body) {
        if (typeof req.body[key] === 'string') {
            req.body[key] = req.body[key].replace(/\0/g, '');
        }
    }
    
    // Sanitize MongoDB operators
    mongoSanitize()(req, res, next);
};

// XSS Protection
const xssProtection = (req, res, next) => {
    res.setHeader('X-XSS-Protection', '1; mode=block');
    next();
};

// CSRF Protection for forms
const csrfProtection = (req, res, next) => {
    if (req.method === 'POST' && req.get('Content-Type')?.includes('application/x-www-form-urlencoded')) {
        // For form submissions, we'll rely on SameSite cookies and origin checking
        const origin = req.get('Origin') || req.get('Referer');
        const host = req.get('Host');
        const isDevelopment = process.env.NODE_ENV !== 'production';
        const isLocalhost = host && (host.includes('localhost') || host.includes('127.0.0.1'));
        
        // Skip CSRF check entirely in development for localhost
        if (isDevelopment && isLocalhost) {
            return next();
        }
        
        // Skip CSRF check if no origin is present (direct navigation)
        if (!origin) {
            return next();
        }
        
        // In production, perform strict origin checking
        if (origin && host && !isDevelopment) {
            try {
                const originHost = new URL(origin).host;
                const expectedHost = host;
                
                if (originHost !== expectedHost) {
                    console.warn(`CSRF violation: Origin ${originHost} does not match host ${expectedHost}`);
                    return res.status(403).json({ error: 'Invalid request origin' });
                }
            } catch (error) {
                console.warn('Invalid origin URL:', origin);
                return res.status(403).json({ error: 'Invalid request origin' });
            }
        }
    }
    next();
};

// Log security events
const securityLogger = (req, res, next) => {
    // Log suspicious activities
    const suspiciousPatterns = [
        /script/i,
        /javascript/i,
        /onload/i,
        /onerror/i,
        /eval\(/i,
        /<.*>/,
        /\$ne|\$gt|\$lt|\$in/
    ];
    
    const checkSuspicious = (obj) => {
        for (let key in obj) {
            if (typeof obj[key] === 'string') {
                for (let pattern of suspiciousPatterns) {
                    if (pattern.test(obj[key])) {
                        console.warn(`Suspicious input detected from ${req.ip}: ${key} = ${obj[key]}`);
                        break;
                    }
                }
            } else if (typeof obj[key] === 'object' && obj[key] !== null) {
                checkSuspicious(obj[key]);
            }
        }
    };
    
    if (req.body) checkSuspicious(req.body);
    if (req.query) checkSuspicious(req.query);
    
    next();
};

module.exports = {
    securityHeaders,
    validateInput,
    xssProtection,
    csrfProtection,
    securityLogger
};