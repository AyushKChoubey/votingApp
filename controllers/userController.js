const User = require('../models/user');
const { generateToken } = require('../middleware/jwt');

// Register new user
exports.signup = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;
        
        // Check if email already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.render('register', { 
                error: 'Email already registered',
                success: null 
            });
        }
        
        // Create new user
        const newUser = new User({
            name,
            email,
            password,
            role: role || 'voter'
        });
        
        const savedUser = await newUser.save();
        
        // Generate token
        const payload = { id: savedUser._id };
        const token = generateToken(payload);
        
        // Set cookie and redirect to dashboard
        res.cookie('token', token, { 
            httpOnly: true,
            maxAge: 24 * 60 * 60 * 1000 // 24 hours
        });
        
        res.redirect('/booth/dashboard');
    } catch (err) {
        console.error(err);
        res.render('register', { 
            error: 'Registration failed. Please try again.',
            success: null 
        });
    }
};

// Login user
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        
        if (!email || !password) {
            return res.render('login', { 
                error: 'Email and password are required',
                success: null 
            });
        }
        
        const user = await User.findOne({ email });
        if (!user) {
            return res.render('login', { 
                error: 'Invalid email or password',
                success: null 
            });
        }
        
        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            return res.render('login', { 
                error: 'Invalid email or password',
                success: null 
            });
        }
        
        // Update last login
        user.lastLogin = new Date();
        await user.save();
        
        // Generate token
        const payload = { id: user._id };
        const token = generateToken(payload);
        
        // Set cookie and redirect to dashboard
        res.cookie('token', token, { 
            httpOnly: true,
            maxAge: 24 * 60 * 60 * 1000 // 24 hours
        });
        
        res.redirect('/booth/dashboard');
    } catch (err) {
        console.error(err);
        res.render('login', { 
            error: 'Login failed. Please try again.',
            success: null 
        });
    }
};

// Get user profile
exports.getProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await User.findById(userId)
            .select('-password')
            .populate('createdBooths', 'name status')
            .populate('joinedBooths', 'name status');
        
        const stats = await user.getStats();
        
        res.render('profile', { 
            user,
            stats,
            error: null,
            success: null
        });
    } catch (err) {
        console.error(err);
        res.status(500).render('error', { 
            error: 'Failed to load profile' 
        });
    }
};

// Update password
exports.updatePassword = async (req, res) => {
    try {
        const userId = req.user.id;
        const { currentPassword, newPassword } = req.body;
        
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ 
                error: 'Both current and new passwords are required' 
            });
        }
        
        const user = await User.findById(userId);
        const isPasswordValid = await user.comparePassword(currentPassword);
        
        if (!isPasswordValid) {
            return res.status(401).json({ 
                error: 'Current password is incorrect' 
            });
        }
        
        user.password = newPassword;
        await user.save();
        
        res.json({ message: 'Password updated successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to update password' });
    }
};

// Update profile
exports.updateProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const { name, organization, bio } = req.body;
        
        const user = await User.findById(userId);
        
        if (name) user.name = name;
        if (organization) user.profile.organization = organization;
        if (bio) user.profile.bio = bio;
        
        await user.save();
        
        res.json({ 
            message: 'Profile updated successfully',
            user: {
                name: user.name,
                email: user.email,
                profile: user.profile
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to update profile' });
    }
};