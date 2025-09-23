// routes/index.js (Main application routes)
const express = require('express');
const router = express.Router();

// Middleware to extract JWT from cookie
const extractTokenFromCookie = (req, res, next) => {
    if (req.cookies && req.cookies.token) {
        req.headers.authorization = 'Bearer ' + req.cookies.token;
    }
    next();
};

// Home page
router.get('/', (req, res) => {
    const message = req.query.message;
    let alertMessage = null;
    let alertType = 'info';
    
    switch (message) {
        case 'logged_out':
            alertMessage = 'You have been logged out successfully.';
            alertType = 'success';
            break;
        case 'session_expired':
            alertMessage = 'Your session has expired. Please log in again.';
            alertType = 'warning';
            break;
        case 'unauthorized':
            alertMessage = 'Please log in to access this page.';
            alertType = 'warning';
            break;
    }
    
    res.render('index', { 
        title: 'VoteBooth - Secure Online Voting Platform',
        alertMessage,
        alertType,
        user: req.user || null
    });
});

// About page
router.get('/about', (req, res) => {
    res.render('about', { 
        title: 'About VoteBooth',
        user: req.user || null
    });
});

// Features page
router.get('/features', (req, res) => {
    res.render('features', { 
        title: 'Features - VoteBooth',
        user: req.user || null
    });
});

// Pricing page
router.get('/pricing', (req, res) => {
    res.render('pricing', { 
        title: 'Pricing - VoteBooth',
        user: req.user || null
    });
});

// Contact page
router.get('/contact', (req, res) => {
    res.render('contact', { 
        title: 'Contact Us - VoteBooth',
        user: req.user || null,
        error: null,
        success: null
    });
});

// Contact form submission
router.post('/contact', async (req, res) => {
    try {
        const { name, email, subject, message } = req.body;
        
        // Validate inputs
        const errors = [];
        
        if (!name || name.trim().length < 2) {
            errors.push('Please provide a valid name');
        }
        
        if (!email || !email.includes('@')) {
            errors.push('Please provide a valid email address');
        }
        
        if (!subject || subject.trim().length < 5) {
            errors.push('Please provide a subject');
        }
        
        if (!message || message.trim().length < 10) {
            errors.push('Please provide a detailed message');
        }
        
        if (errors.length > 0) {
            return res.render('contact', {
                title: 'Contact Us - VoteBooth',
                user: req.user || null,
                error: errors.join('. '),
                success: null,
                formData: { name, email, subject, message }
            });
        }
        
        // TODO: Send email or save to database
        console.log('Contact form submission:', { name, email, subject, message });
        
        res.render('contact', {
            title: 'Contact Us - VoteBooth',
            user: req.user || null,
            error: null,
            success: 'Thank you for your message! We will get back to you soon.',
            formData: {}
        });
    } catch (err) {
        console.error('Contact form error:', err);
        res.render('contact', {
            title: 'Contact Us - VoteBooth',
            user: req.user || null,
            error: 'Failed to send message. Please try again.',
            success: null,
            formData: req.body
        });
    }
});

// Terms of Service
router.get('/terms', (req, res) => {
    res.render('legal/terms', { 
        title: 'Terms of Service - VoteBooth',
        user: req.user || null
    });
});

// Privacy Policy
router.get('/privacy', (req, res) => {
    res.render('legal/privacy', { 
        title: 'Privacy Policy - VoteBooth',
        user: req.user || null
    });
});

// Help/FAQ page
router.get('/help', (req, res) => {
    res.render('help/index', { 
        title: 'Help & FAQ - VoteBooth',
        user: req.user || null
    });
});

// API Health check
router.get('/api/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: process.env.npm_package_version || '1.0.0'
    });
});

// API Status endpoint
router.get('/api/status', (req, res) => {
    res.json({
        application: 'VoteBooth API',
        status: 'running',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// // 404 handler for undefined routes
// router.get('*', (req, res) => {
//     res.status(404).render('error', { 
//         error: 'Page not found',
//         title: '404 - Page Not Found',
//         user: req.user || null
//     });
// });

module.exports = router;