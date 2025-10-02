// routes/api.js (API-only routes)
const express = require('express');
const router = express.Router();

// API Health check
router.get('/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: process.env.npm_package_version || '1.0.0'
    });
});

// API Status endpoint
router.get('/status', (req, res) => {
    res.json({
        application: 'VoteBooth API',
        status: 'running',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// Contact form submission (API only)
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
            return res.status(400).json({
                error: 'Validation failed',
                details: errors
            });
        }
        
        // TODO: Send email or save to database
        console.log('Contact form submission:', { name, email, subject, message });
        
        res.json({
            success: true,
            message: 'Thank you for your message! We will get back to you soon.'
        });
        
    } catch (err) {
        console.error('Contact form error:', err);
        res.status(500).json({
            error: 'Failed to send message. Please try again.'
        });
    }
});

module.exports = router;