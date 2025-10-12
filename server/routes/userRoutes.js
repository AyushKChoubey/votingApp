// routes/userRoutes-api.js (API-only user routes)
const express = require('express');
const router = express.Router();
const { jwtAuthMiddleware } = require('../middleware/jwt');
const userController = require('../controllers/userController');
const User = require('../models/user');
const Booth = require('../models/booth');
const Vote = require('../models/vote');

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
        await userController.login(req, res);
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
        // JWT logout: handled client-side; optionally implement server blacklist
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
router.get('/profile', jwtAuthMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user.id)
            .select('-password -emailVerificationToken -passwordResetToken')
            .populate('createdBooths', 'name status createdAt')
            .populate('joinedBooths', 'name status creator');
            
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        res.json({ success: true, user });
    } catch (error) {
        res.status(500).json({
            error: 'Failed to get profile',
            message: error.message
        });
    }
});

// PUT: Update user profile
router.put('/profile', jwtAuthMiddleware, async (req, res) => {
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
router.get('/stats', jwtAuthMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        const stats = await user.getStats();
        res.json({ success: true, stats });
    } catch (error) {
        res.status(500).json({
            error: 'Failed to get statistics',
            message: error.message
        });
    }
});

// PUT: Change password
router.put('/password', jwtAuthMiddleware, async (req, res) => {
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
router.put('/preferences', jwtAuthMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        const { emailNotifications, theme, language } = req.body;
        
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

// PUT: Update password
router.put('/password', jwtAuthMiddleware, async (req, res) => {
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
router.put('/preferences', jwtAuthMiddleware, async (req, res) => {
    try {
        await userController.updatePreferences(req, res);
    } catch (error) {
        res.status(500).json({
            error: 'Preferences update failed',
            message: error.message
        });
    }
});

// POST: Refresh token
router.post('/refresh-token', async (req, res) => {
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
router.delete('/account', jwtAuthMiddleware, async (req, res) => {
    try {
        const { password } = req.body;
        if (!password) {
            return res.status(400).json({ error: 'Password is required to delete account' });
        }
        
        const user = await User.findById(req.user.id).select('+password');
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(400).json({ error: 'Incorrect password' });
        }
        
        await Booth.deleteMany({ creator: user._id });
        await Vote.deleteMany({ voter: user._id });
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
