// routes/userRoutes-api.js (API-only user routes)
const express = require('express');
const router = express.Router();
const { jwtAuthMiddleware } = require('../middleware/jwt');
const userController = require('../controllers/userController');
const { authLimiter } = require('../middleware/rateLimiter');
const { csrfProtection } = require('../middleware/security');
const { upload, handleMulterError } = require('../middleware/upload');

// ===== Authentication API Routes =====

// POST: Register
router.post('/register', authLimiter, csrfProtection, userController.signup);

// POST: Login
router.post('/login', authLimiter, csrfProtection, userController.login);

// POST: Logout
router.post('/logout', jwtAuthMiddleware, userController.logout);

// ===== Profile Management API Routes =====

// GET: Get user profile
router.get('/profile', jwtAuthMiddleware, userController.getProfile);

// PUT: Update user profile
router.put('/profile', jwtAuthMiddleware, userController.updateProfile);

// GET: Get user statistics
router.get('/stats', jwtAuthMiddleware, userController.getUserStats);

// PUT: Change password
router.put('/password', jwtAuthMiddleware, userController.updatePassword);

// PUT: Update preferences
router.put('/preferences', jwtAuthMiddleware, userController.updatePreferences);

// POST: Refresh token
router.post('/refresh-token', authLimiter, csrfProtection, userController.refreshToken);

// POST: Upload avatar
router.post('/avatar', jwtAuthMiddleware, upload.single('avatar'), handleMulterError, userController.uploadAvatar);

// DELETE: Delete avatar
router.delete('/avatar', jwtAuthMiddleware, userController.deleteAvatar);

// DELETE: Delete account
router.delete('/account', jwtAuthMiddleware, userController.deleteAccount);

module.exports = router;
