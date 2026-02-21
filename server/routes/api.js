// routes/api.js (API-only routes)
const express = require('express');
const router = express.Router();
const { csrfProtection } = require('../middleware/security');
const emailService = require('../utils/emailService');

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
router.post('/contact', csrfProtection, async (req, res) => {
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
        
        // Check email service health first
        const serviceHealth = require('../utils/serviceHealth');
        const emailStatus = serviceHealth.get('email');
        
        if (emailStatus && emailStatus.ok === false) {
            return res.status(503).json({
                error: 'Email service is currently unavailable. Please try again later or contact us directly at votebooth1@gmail.com',
                serviceUnavailable: true
            });
        }
        
        // Send email to support
        await emailService.initialize();
        const result = await emailService.sendContactFormEmail({
            name: name.trim(),
            email: email.trim(),
            subject: subject.trim(),
            message: message.trim()
        });
        
        if (!result.success) {
            console.error('Email sending failed:', result.message);
            try {
                serviceHealth.setStatus('email', false, { message: result.message });
            } catch (e) {
                // ignore
            }
            return res.status(503).json({
                error: 'Failed to send your message. Please try again later or contact us directly at votebooth1@gmail.com',
                serviceUnavailable: true
            });
        } else {
            try {
                serviceHealth.setStatus('email', true);
            } catch (e) {
                // ignore
            }
        }
        
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