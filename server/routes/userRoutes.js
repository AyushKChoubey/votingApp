// routes/userRoutes-api.js (API-only user routes)
const express = require('express');
const router = express.Router();
const { jwtAuthMiddleware } = require('../middleware/jwt');
const userController = require('../controllers/userController');

// ===== Authentication API Routes =====

// POST: Register
router.post('/register', async (req, res) => {
    try {
        await userController.signup(req, res);
    } catch (error) {
        res.status(500).json({
            error: 'Registration failed',
            message: error.message
        });
    }
});

// POST: Login
router.post('/login', async (req, res) => {
    try {
        await userController.loginAPI(req, res);
    } catch (error) {
        res.status(500).json({
            error: 'Login failed',
            message: error.message
        });
    }
});

// POST: Logout
router.post('/logout', jwtAuthMiddleware, async (req, res) => {
    try {
        // For JWT tokens, we just need to clear client-side storage
        // In a production app, you might want to blacklist the token
        res.json({
            success: true,
            message: 'Logged out successfully'
        });
    } catch (error) {
        res.status(500).json({
            error: 'Logout failed',
            message: error.message
        });
    }
});

// ===== Profile Management API Routes =====

// GET: Get user profile
router.get('/api/profile', jwtAuthMiddleware, async (req, res) => {
    try {
        const user = await require('../models/user').findById(req.user.id)
            .select('-password -emailVerificationToken -passwordResetToken')
            .populate('createdBooths', 'name status createdAt')
            .populate('joinedBooths', 'name status creator');
            
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        res.json({
            success: true,
            user: user
        });
    } catch (error) {
        res.status(500).json({
            error: 'Failed to get profile',
            message: error.message
        });
    }
});

// PUT: Update user profile
router.put('/api/profile', jwtAuthMiddleware, async (req, res) => {
    try {
        await userController.updateProfile(req, res);
    } catch (error) {
        res.status(500).json({
            error: 'Profile update failed',
            message: error.message
        });
    }
});

// GET: Get user statistics
router.get('/api/stats', jwtAuthMiddleware, async (req, res) => {
    try {
        const user = await require('../models/user').findById(req.user.id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        const stats = await user.getStats();
        
        res.json({
            success: true,
            stats: stats
        });
    } catch (error) {
        res.status(500).json({
            error: 'Failed to get statistics',
            message: error.message
        });
    }
});

// PUT: Change password
router.put('/api/password', jwtAuthMiddleware, async (req, res) => {
    try {
        await userController.updatePassword(req, res);
    } catch (error) {
        res.status(500).json({
            error: 'Password update failed',
            message: error.message
        });
    }
});

// PUT: Update preferences
router.put('/api/preferences', jwtAuthMiddleware, async (req, res) => {
    try {
        const user = await require('../models/user').findById(req.user.id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        const { emailNotifications, theme, language } = req.body;
        
        // Update preferences
        if (typeof emailNotifications !== 'undefined') {
            user.preferences.emailNotifications = emailNotifications;
        }
        
        if (theme && ['light', 'dark', 'auto'].includes(theme)) {
            user.preferences.theme = theme;
        }
        
        if (language && typeof language === 'string') {
            user.preferences.language = language;
        }
        
        await user.save();
        
        res.json({
            success: true,
            message: 'Preferences updated successfully',
            preferences: user.preferences
        });
    } catch (error) {
        res.status(500).json({
            error: 'Failed to update preferences',
            message: error.message
        });
    }
});

// POST: Refresh token
router.post('/api/refresh-token', async (req, res) => {
    try {
        await userController.refreshToken(req, res);
    } catch (error) {
        res.status(500).json({
            error: 'Token refresh failed',
            message: error.message
        });
    }
});

// DELETE: Delete account
router.delete('/api/account', jwtAuthMiddleware, async (req, res) => {
    try {
        const { password } = req.body;
        
        if (!password) {
            return res.status(400).json({
                error: 'Password is required to delete account'
            });
        }
        
        const user = await require('../models/user').findById(req.user.id).select('+password');
        
        // Verify password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(400).json({
                error: 'Incorrect password'
            });
        }
        
        // Delete user's booths and votes
        await require('../models/booth').deleteMany({ creator: user._id });
        await require('../models/vote').deleteMany({ voter: user._id });
        
        // Delete user account
        await user.deleteOne();
        
        res.json({
            success: true,
            message: 'Account deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            error: 'Failed to delete account',
            message: error.message
        });
    }
});

module.exports = router;