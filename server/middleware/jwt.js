// middleware/jwt.js
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// Token blacklist (in production, use Redis or database)
const tokenBlacklist = new Set();

const jwtAuthMiddleware = async (req, res, next) => {
    try {
        let token = null;
        
        // Check for JWT token in authorization header or cookies
        const authorization = req.headers.authorization;
        if (authorization && authorization.startsWith('Bearer ')) {
            token = authorization.split(' ')[1];
        } else if (req.cookies && req.cookies.token) {
            token = req.cookies.token;
        }
        
        if (!token) {
            if (req.accepts('html')) {
                return res.redirect('/user/login?redirect=' + encodeURIComponent(req.originalUrl));
            }
            return res.status(401).json({ error: 'Authentication required' });
        }
        
        // Check if token is blacklisted
        if (tokenBlacklist.has(token)) {
            res.clearCookie('token');
            if (req.accepts('html')) {
                return res.redirect('/user/login?error=session_expired');
            }
            return res.status(401).json({ error: 'Token has been revoked' });
        }
        
        // Verify the JWT token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Check if user still exists
        const User = require('../models/user');
        const user = await User.findById(decoded.id).select('-password');
        
        if (!user) {
            res.clearCookie('token');
            if (req.accepts('html')) {
                return res.redirect('/user/login?error=user_not_found');
            }
            return res.status(401).json({ error: 'User not found' });
        }
        
        // Check if token was issued before password change
        if (user.passwordChangedAt && decoded.iat < user.passwordChangedAt.getTime() / 1000) {
            res.clearCookie('token');
            if (req.accepts('html')) {
                return res.redirect('/user/login?error=password_changed');
            }
            return res.status(401).json({ error: 'Please login again due to password change' });
        }
        
        // Attach user information to the request object
        req.user = decoded;
        req.user.userData = user;
        res.locals.user = user; // Make user available in views
        
        next();
    } catch (err) {
        console.error('JWT Auth Error:', err.message);
        
        // Clear invalid token
        res.clearCookie('token');
        
        if (req.accepts('html')) {
            return res.redirect('/user/login?error=invalid_token');
        }
        
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Token expired' });
        }
        
        res.status(401).json({ error: 'Invalid token' });
    }
};

// Optional auth middleware (doesn't redirect if no token)
const optionalAuth = async (req, res, next) => {
    try {
        let token = null;
        
        const authorization = req.headers.authorization;
        if (authorization && authorization.startsWith('Bearer ')) {
            token = authorization.split(' ')[1];
        } else if (req.cookies && req.cookies.token) {
            token = req.cookies.token;
        }
        
        if (!token) {
            return next();
        }
        
        if (tokenBlacklist.has(token)) {
            res.clearCookie('token');
            return next();
        }
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const User = require('../models/user');
        const user = await User.findById(decoded.id).select('-password');
        
        if (user) {
            req.user = decoded;
            req.user.userData = user;
            res.locals.user = user;
        }
        
        next();
    } catch (err) {
        // Clear invalid token and continue
        res.clearCookie('token');
        next();
    }
};

// Function to generate JWT token with enhanced security
const generateToken = (userData, options = {}) => {
    const payload = {
        id: userData.id || userData._id,
        email: userData.email,
        role: userData.role,
        iat: Math.floor(Date.now() / 1000),
        jti: crypto.randomUUID() // Unique token ID
    };
    
    const defaultOptions = {
        expiresIn: '24h',
        issuer: 'voting-app',
        audience: 'voting-app-users'
    };
    
    return jwt.sign(payload, process.env.JWT_SECRET, { ...defaultOptions, ...options });
};

// Function to generate refresh token
const generateRefreshToken = (userData) => {
    const payload = {
        id: userData.id || userData._id,
        type: 'refresh',
        jti: crypto.randomUUID()
    };
    
    return jwt.sign(payload, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET, {
        expiresIn: '7d',
        issuer: 'voting-app'
    });
};

// Function to blacklist token (for logout)
const blacklistToken = (token) => {
    tokenBlacklist.add(token);
    
    // In production, store in Redis with expiration
    // redis.setex(`blacklist:${token}`, 86400, 'true'); // 24 hours
    
    // Clean up old tokens periodically (in production, handle this better)
    if (tokenBlacklist.size > 10000) {
        tokenBlacklist.clear();
    }
};

// Middleware to check if user is admin
const requireAdmin = (req, res, next) => {
    if (!req.user || req.user.role !== 'admin') {
        if (req.accepts('html')) {
            return res.status(403).render('error', { 
                error: 'Admin access required' 
            });
        }
        return res.status(403).json({ error: 'Admin access required' });
    }
    next();
};

// Middleware to check booth ownership
const requireBoothOwnership = async (req, res, next) => {
    try {
        const { boothId } = req.params;
        const userId = req.user.id;
        
        const Booth = require('../models/booth');
        const booth = await Booth.findById(boothId);
        
        if (!booth) {
            if (req.accepts('html')) {
                return res.status(404).render('error', { error: 'Booth not found' });
            }
            return res.status(404).json({ error: 'Booth not found' });
        }
        
        if (booth.creator.toString() !== userId) {
            if (req.accepts('html')) {
                return res.status(403).render('error', { 
                    error: 'Only booth creator can perform this action' 
                });
            }
            return res.status(403).json({ 
                error: 'Only booth creator can perform this action' 
            });
        }
        
        req.booth = booth;
        next();
    } catch (err) {
        console.error('Booth ownership check error:', err);
        if (req.accepts('html')) {
            return res.status(500).render('error', { error: 'Server error' });
        }
        res.status(500).json({ error: 'Server error' });
    }
};

module.exports = {
    jwtAuthMiddleware,
    optionalAuth,
    generateToken,
    generateRefreshToken,
    blacklistToken,
    requireAdmin,
    requireBoothOwnership
};