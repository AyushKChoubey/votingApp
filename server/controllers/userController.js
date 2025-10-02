// controllers/userController.js (Complete)
const User = require('../models/user');
const { generateToken, generateRefreshToken, blacklistToken } = require('../middleware/jwt');
const validator = require('validator');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

// Input validation helpers
const validateEmail = (email) => {
    return validator.isEmail(email) && email.length <= 254;
};

const validatePassword = (password) => {
    return password && 
           password.length >= 8 && 
           password.length <= 128 &&
           /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password);
};

const validateName = (name) => {
    return name && 
           name.trim().length >= 2 && 
           name.trim().length <= 50 &&
           /^[a-zA-Z\s\-'\.]+$/.test(name.trim());
};

// Register new user
exports.signup = async (req, res) => {
    try {
        let { name, email, password, confirmPassword, role } = req.body;
        
        // Sanitize inputs
        name = name ? name.trim() : '';
        email = email ? email.trim().toLowerCase() : '';
        
        // Validation
        const errors = [];
        
        if (!validateName(name)) {
            errors.push('Name must be 2-50 characters and contain only letters, spaces, hyphens, apostrophes, and periods');
        }
        
        if (!validateEmail(email)) {
            errors.push('Please provide a valid email address');
        }
        
        if (!validatePassword(password)) {
            errors.push('Password must be 8-128 characters with at least one uppercase, lowercase, and number');
        }
        
        if (password !== confirmPassword) {
            errors.push('Passwords do not match');
        }
        
        if (errors.length > 0) {
            return res.render('register', { 
                error: errors.join('. '),
                success: null,
                formData: { name, email }
            });
        }
        
        // Check if email already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.render('register', { 
                error: 'Email already registered. Please use a different email or try logging in.',
                success: null,
                formData: { name, email }
            });
        }
        
        // Create new user
        const newUser = new User({
            name: name.trim(),
            email,
            password,
            role: role === 'admin' ? 'admin' : 'voter' // Prevent unauthorized admin creation
        });
        
        const savedUser = await newUser.save();
        
        // Generate tokens
        const token = generateToken(savedUser);
        const refreshToken = generateRefreshToken(savedUser);
        
        // Set secure cookies
        const cookieOptions = {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 24 * 60 * 60 * 1000 // 24 hours
        };
        
        res.cookie('token', token, cookieOptions);
        res.cookie('refreshToken', refreshToken, {
            ...cookieOptions,
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });
        
        // Log successful registration
        console.log(`New user registered: ${email} at ${new Date().toISOString()}`);
        
        res.redirect('/booth/dashboard');
    } catch (err) {
        console.error('Registration error:', err);
        
        // Handle specific MongoDB errors
        let errorMessage = 'Registration failed. Please try again.';
        
        if (err.code === 11000) {
            if (err.keyPattern?.email) {
                errorMessage = 'Email already registered. Please use a different email.';
            }
        }
        
        res.render('register', { 
            error: errorMessage,
            success: null,
            formData: req.body
        });
    }
};

// API-only login (for React frontend)
exports.loginAPI = async (req, res) => {
    try {
        let { email, password, remember } = req.body;
        
        // Sanitize inputs
        email = email ? email.trim().toLowerCase() : '';
        
        // Validation
        if (!email || !password) {
            return res.status(400).json({
                error: 'Email and password are required'
            });
        }
        
        if (!validateEmail(email)) {
            return res.status(400).json({
                error: 'Please provide a valid email address'
            });
        }
        
        // Find user and include password for comparison
        const user = await User.findOne({ email }).select('+password');
        if (!user) {
            return res.status(401).json({
                error: 'Invalid email or password'
            });
        }
        
        // Check if account is locked
        if (user.isLocked) {
            return res.status(423).json({
                error: 'Account is temporarily locked due to too many failed login attempts. Please try again later.'
            });
        }
        
        // Check password
        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            // Increment login attempts
            await user.incLoginAttempts();
            
            return res.status(401).json({
                error: 'Invalid email or password'
            });
        }
        
        // Reset login attempts on successful login
        if (user.loginAttempts && user.loginAttempts > 0) {
            await user.resetLoginAttempts();
        }
        
        // Update last login and login count
        user.lastLogin = new Date();
        user.loginCount = (user.loginCount || 0) + 1;
        await user.save();
        
        // Generate tokens
        const tokenExpiry = remember ? '7d' : '24h';
        const token = generateToken(user, { expiresIn: tokenExpiry });
        const refreshToken = generateRefreshToken(user);
        
        // Return user data and token (no cookies for API)
        const userData = {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            isEmailVerified: user.isEmailVerified,
            lastLogin: user.lastLogin,
            preferences: user.preferences
        };
        
        // Log successful login
        console.log(`User logged in via API: ${email} at ${new Date().toISOString()}`);
        
        res.json({
            success: true,
            message: 'Login successful',
            token,
            refreshToken,
            user: userData
        });
        
    } catch (err) {
        console.error('API Login error:', err);
        res.status(500).json({
            error: 'Login failed. Please try again.'
        });
    }
};

// Login user
exports.login = async (req, res) => {
    try {
        let { email, password, remember } = req.body;
        const redirectUrl = req.query.redirect || '/booth/dashboard';
        
        // Sanitize inputs
        email = email ? email.trim().toLowerCase() : '';
        
        // Validation
        if (!email || !password) {
            return res.render('login', { 
                error: 'Email and password are required',
                success: null,
                redirectUrl
            });
        }
        
        if (!validateEmail(email)) {
            return res.render('login', { 
                error: 'Please provide a valid email address',
                success: null,
                redirectUrl
            });
        }
        
        // Find user and include password for comparison
        const user = await User.findOne({ email }).select('+password');
        if (!user) {
            // Use same error message to prevent email enumeration
            return res.render('login', { 
                error: 'Invalid email or password',
                success: null,
                redirectUrl
            });
        }
        
        // Check if account is locked
        if (user.isLocked) {
            return res.render('login', { 
                error: 'Account is temporarily locked due to too many failed login attempts. Please try again later.',
                success: null,
                redirectUrl
            });
        }
        
        // Check password
        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            // Increment login attempts
            await user.incLoginAttempts();
            
            return res.render('login', { 
                error: 'Invalid email or password',
                success: null,
                redirectUrl
            });
        }
        
        // Reset login attempts on successful login
        if (user.loginAttempts && user.loginAttempts > 0) {
            await user.resetLoginAttempts();
        }
        
        // Update last login and login count
        user.lastLogin = new Date();
        user.loginCount = (user.loginCount || 0) + 1;
        await user.save();
        
        // Generate tokens
        const tokenExpiry = remember ? '7d' : '24h';
        const token = generateToken(user, { expiresIn: tokenExpiry });
        const refreshToken = generateRefreshToken(user);
        
        // Set secure cookies
        const cookieOptions = {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: remember ? 7 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000
        };
        
        res.cookie('token', token, cookieOptions);
        res.cookie('refreshToken', refreshToken, {
            ...cookieOptions,
            maxAge: 7 * 24 * 60 * 60 * 1000
        });
        
        // Log successful login
        console.log(`User login: ${email} at ${new Date().toISOString()} from IP: ${req.ip}`);
        
        // Redirect to intended page or dashboard
        const safeRedirectUrl = validator.isURL(redirectUrl, { 
            require_host: false, 
            require_protocol: false,
            allow_query_components: true 
        }) ? redirectUrl : '/booth/dashboard';
        
        res.redirect(safeRedirectUrl);
    } catch (err) {
        console.error('Login error:', err);
        res.render('login', { 
            error: 'Login failed. Please try again.',
            success: null,
            redirectUrl: req.query.redirect
        });
    }
};

// Logout user
exports.logout = (req, res) => {
    try {
        // Blacklist current token if exists
        const token = req.cookies?.token || 
                     (req.headers.authorization && req.headers.authorization.split(' ')[1]);
        
        if (token) {
            blacklistToken(token);
        }
        
        // Clear cookies
        res.clearCookie('token');
        res.clearCookie('refreshToken');
        
        // Log logout
        if (req.user) {
            console.log(`User logout: ${req.user.email || req.user.id} at ${new Date().toISOString()}`);
        }
        
        // Handle both API and HTML requests
        if (req.accepts('html')) {
            return res.redirect('/?message=logged_out');
        }
        
        res.json({ message: 'Logged out successfully' });
    } catch (err) {
        console.error('Logout error:', err);
        if (req.accepts('html')) {
            return res.redirect('/');
        }
        res.status(500).json({ error: 'Logout failed' });
    }
};

// Get user profile
exports.getProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await User.findById(userId)
            .select('-password')
            .populate('createdBooths', 'name status createdAt')
            .populate('joinedBooths', 'name status createdAt');
        
        if (!user) {
            if (req.accepts('html')) {
                return res.status(404).render('error', { error: 'User not found' });
            }
            return res.status(404).json({ error: 'User not found' });
        }
        
        const stats = await user.getStats();
        
        if (req.accepts('html')) {
            res.render('profile', { 
                user,
                stats,
                error: null,
                success: null
            });
        } else {
            res.json({ user, stats });
        }
    } catch (err) {
        console.error('Get profile error:', err);
        if (req.accepts('html')) {
            return res.status(500).render('error', { 
                error: 'Failed to load profile' 
            });
        }
        res.status(500).json({ error: 'Failed to load profile' });
    }
};

// Update password
exports.updatePassword = async (req, res) => {
    try {
        const userId = req.user.id;
        const { currentPassword, newPassword, confirmNewPassword } = req.body;
        
        // Validation
        if (!currentPassword || !newPassword || !confirmNewPassword) {
            return res.status(400).json({ 
                error: 'All password fields are required' 
            });
        }
        
        if (!validatePassword(newPassword)) {
            return res.status(400).json({ 
                error: 'New password must be 8-128 characters with at least one uppercase, lowercase, and number' 
            });
        }
        
        if (newPassword !== confirmNewPassword) {
            return res.status(400).json({ 
                error: 'New passwords do not match' 
            });
        }
        
        if (currentPassword === newPassword) {
            return res.status(400).json({ 
                error: 'New password must be different from current password' 
            });
        }
        
        // Get user with password
        const user = await User.findById(userId).select('+password');
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        // Verify current password
        const isPasswordValid = await user.comparePassword(currentPassword);
        if (!isPasswordValid) {
            return res.status(401).json({ 
                error: 'Current password is incorrect' 
            });
        }
        
        // Update password
        user.password = newPassword;
        user.passwordChangedAt = new Date();
        await user.save();
        
        // Log password change
        console.log(`Password changed for user: ${user.email} at ${new Date().toISOString()}`);
        
        res.json({ message: 'Password updated successfully' });
    } catch (err) {
        console.error('Update password error:', err);
        res.status(500).json({ error: 'Failed to update password' });
    }
};

// Update profile
exports.updateProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        let { name, organization, bio, website, mobile, address } = req.body;
        
        // Sanitize inputs
        name = name ? name.trim() : '';
        organization = organization ? organization.trim() : '';
        bio = bio ? bio.trim() : '';
        website = website ? website.trim() : '';
        mobile = mobile ? mobile.trim() : '';
        address = address ? address.trim() : '';
        
        // Validation
        const errors = [];
        
        if (name && !validateName(name)) {
            errors.push('Name must be 2-50 characters and contain only letters, spaces, hyphens, apostrophes, and periods');
        }
        
        if (organization && organization.length > 100) {
            errors.push('Organization name must be less than 100 characters');
        }
        
        if (bio && bio.length > 500) {
            errors.push('Bio must be less than 500 characters');
        }
        
        if (website && !validator.isURL(website)) {
            errors.push('Please provide a valid website URL');
        }
        
        if (mobile && !/^\+?[\d\s\-\(\)]+$/.test(mobile)) {
            errors.push('Please provide a valid mobile number');
        }
        
        if (address && address.length > 200) {
            errors.push('Address must be less than 200 characters');
        }
        
        if (errors.length > 0) {
            return res.status(400).json({ error: errors.join('. ') });
        }
        
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        // Update fields
        if (name) user.name = name;
        if (organization !== undefined) user.profile.organization = organization;
        if (bio !== undefined) user.profile.bio = bio;
        if (website !== undefined) user.profile.website = website;
        if (mobile !== undefined) user.mobile = mobile;
        if (address !== undefined) user.address = address;
        
        await user.save();
        
        // Log profile update
        console.log(`Profile updated for user: ${user.email} at ${new Date().toISOString()}`);
        
        res.json({ 
            message: 'Profile updated successfully',
            user: {
                name: user.name,
                email: user.email,
                mobile: user.mobile,
                address: user.address,
                profile: user.profile
            }
        });
    } catch (err) {
        console.error('Update profile error:', err);
        res.status(500).json({ error: 'Failed to update profile' });
    }
};

// Refresh token
exports.refreshToken = async (req, res) => {
    try {
        const { refreshToken } = req.cookies;
        
        if (!refreshToken) {
            return res.status(401).json({ error: 'Refresh token required' });
        }
        
        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET);
        
        if (decoded.type !== 'refresh') {
            return res.status(401).json({ error: 'Invalid refresh token' });
        }
        
        const user = await User.findById(decoded.id);
        if (!user) {
            return res.status(401).json({ error: 'User not found' });
        }
        
        // Generate new access token
        const newToken = generateToken(user);
        
        res.cookie('token', newToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 24 * 60 * 60 * 1000
        });
        
        res.json({ message: 'Token refreshed successfully' });
    } catch (err) {
        console.error('Refresh token error:', err);
        res.status(401).json({ error: 'Invalid refresh token' });
    }
};

// Delete account
exports.deleteAccount = async (req, res) => {
    try {
        const userId = req.user.id;
        const { password } = req.body;
        
        if (!password) {
            return res.status(400).json({ error: 'Password is required to delete account' });
        }
        
        // Get user with password
        const user = await User.findById(userId).select('+password');
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        // Verify password
        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Incorrect password' });
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
        
        // Clear cookies
        res.clearCookie('token');
        res.clearCookie('refreshToken');
        
        console.log(`User account deleted: ${user.email} at ${new Date().toISOString()}`);
        
        res.json({ message: 'Account deleted successfully' });
    } catch (err) {
        console.error('Delete account error:', err);
        res.status(500).json({ error: 'Failed to delete account' });
    }
};

// Get user statistics
exports.getUserStats = async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await User.findById(userId);
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        const stats = await user.getStats();
        
        res.json(stats);
    } catch (err) {
        console.error('Get user stats error:', err);
        res.status(500).json({ error: 'Failed to fetch user statistics' });
    }
};

// Update user preferences
exports.updatePreferences = async (req, res) => {
    try {
        const userId = req.user.id;
        const { emailNotifications, smsNotifications, theme, language } = req.body;
        
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        // Update preferences
        if (emailNotifications !== undefined) {
            user.preferences.emailNotifications = Boolean(emailNotifications);
        }
        if (smsNotifications !== undefined) {
            user.preferences.smsNotifications = Boolean(smsNotifications);
        }
        if (theme && ['light', 'dark', 'auto'].includes(theme)) {
            user.preferences.theme = theme;
        }
        if (language) {
            user.preferences.language = language;
        }
        
        await user.save();
        
        res.json({
            message: 'Preferences updated successfully',
            preferences: user.preferences
        });
    } catch (err) {
        console.error('Update preferences error:', err);
        res.status(500).json({ error: 'Failed to update preferences' });
    }
};