// routes/userRoutes.js (Complete)
const express = require('express');
const router = express.Router();
const { jwtAuthMiddleware } = require('../middleware/jwt');
const userController = require('../controllers/userController');
const User = require('../models/user');

// Middleware to extract JWT from cookie for SSR pages
const extractTokenFromCookie = (req, res, next) => {
    if (req.cookies && req.cookies.token) {
        req.headers.authorization = 'Bearer ' + req.cookies.token;
    }
    next();
};

// ===== SSR Routes (Pages) =====

// SSR: Login page
router.get('/login', (req, res) => {
    // If user is already authenticated, redirect to dashboard
    if (req.cookies && req.cookies.token) {
        return res.redirect('/booth/dashboard');
    }
    res.render('login', { 
        title: 'Login - VoteBooth',
        error: null, 
        success: null, 
        redirectUrl: req.query.redirect,
        user: null
    });
});

// SSR: Register page
router.get('/register', (req, res) => {
    // If user is already authenticated, redirect to dashboard
    if (req.cookies && req.cookies.token) {
        return res.redirect('/booth/dashboard');
    }
    res.render('register', { 
        title: 'Register - VoteBooth',
        error: null, 
        success: null, 
        formData: {},
        user: null
    });
});

// SSR: Profile page (protected, using JWT from cookie)
router.get('/profile', extractTokenFromCookie, jwtAuthMiddleware, userController.getProfile);

// SSR: Settings page
router.get('/settings', extractTokenFromCookie, jwtAuthMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        res.render('user/settings', { 
            user, 
            error: null, 
            success: null 
        });
    } catch (err) {
        console.error(err);
        res.status(500).render('error', { error: 'Failed to load settings' });
    }
});

// ===== Authentication Routes =====

// POST: Register form submission
router.post('/register', userController.signup);

// POST: Login form submission (authenticate, set cookie, redirect)
router.post('/login', userController.login);

// POST: Logout (clear cookies, redirect)
router.post('/logout', userController.logout);

// GET: Logout (for direct links)
router.get('/logout', userController.logout);

// ===== API Routes (Protected) =====

// Profile management
router.get('/api/profile', jwtAuthMiddleware, userController.getProfile);
router.put('/api/profile', jwtAuthMiddleware, userController.updateProfile);
router.get('/api/stats', jwtAuthMiddleware, userController.getUserStats);

// Password management
router.put('/api/password', jwtAuthMiddleware, userController.updatePassword);

// Preferences
router.put('/api/preferences', jwtAuthMiddleware, userController.updatePreferences);

// Token management
router.post('/api/refresh-token', userController.refreshToken);

// Account deletion
router.delete('/api/account', jwtAuthMiddleware, userController.deleteAccount);

// ===== Admin Routes (if needed) =====

// Get all users (admin only)
router.get('/api/admin/users', extractTokenFromCookie, jwtAuthMiddleware, async (req, res) => {
    try {
        // Check if user is admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Admin access required' });
        }
        
        const { page = 1, limit = 20, search = '' } = req.query;
        const skip = (page - 1) * limit;
        
        let query = {};
        if (search) {
            query = {
                $or: [
                    { name: { $regex: search, $options: 'i' } },
                    { email: { $regex: search, $options: 'i' } }
                ]
            };
        }
        
        const users = await User.find(query)
            .select('-password')
            .skip(skip)
            .limit(parseInt(limit))
            .sort({ createdAt: -1 });
        
        const total = await User.countDocuments(query);
        
        res.json({
            users,
            pagination: {
                current: parseInt(page),
                pages: Math.ceil(total / limit),
                total
            }
        });
    } catch (err) {
        console.error('Get users error:', err);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

// Toggle user status (admin only)
router.patch('/api/admin/users/:userId/status', extractTokenFromCookie, jwtAuthMiddleware, async (req, res) => {
    try {
        // Check if user is admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Admin access required' });
        }
        
        const { userId } = req.params;
        const { isActive } = req.body;
        
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        user.isActive = Boolean(isActive);
        await user.save();
        
        res.json({
            message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                isActive: user.isActive
            }
        });
    } catch (err) {
        console.error('Toggle user status error:', err);
        res.status(500).json({ error: 'Failed to update user status' });
    }
});

// Delete user (admin only)
router.delete('/api/admin/users/:userId', extractTokenFromCookie, jwtAuthMiddleware, async (req, res) => {
    try {
        // Check if user is admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Admin access required' });
        }
        
        const { userId } = req.params;
        
        if (userId === req.user.id) {
            return res.status(400).json({ error: 'Cannot delete your own account' });
        }
        
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        // Delete user's votes
        const Vote = require('../models/vote');
        await Vote.deleteMany({ voter: userId });
        
        // Delete booths created by user
        const Booth = require('../models/booth');
        await Booth.deleteMany({ creator: userId });
        
        // Remove user from other booths
        await Booth.updateMany(
            { 'members.user': userId },
            { $pull: { members: { user: userId } } }
        );
        
        // Delete the user
        await User.findByIdAndDelete(userId);
        
        console.log(`User deleted by admin: ${user.email} deleted by ${req.user.email} at ${new Date().toISOString()}`);
        
        res.json({ message: 'User deleted successfully' });
    } catch (err) {
        console.error('Delete user error:', err);
        res.status(500).json({ error: 'Failed to delete user' });
    }
});

module.exports = router;