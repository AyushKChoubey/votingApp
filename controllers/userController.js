const User = require('../models/user');
const { generateToken } = require('../middleware/jwt');

exports.signup = async (req, res) => {
    try {
        const data = req.body;
        const adminUser = await User.findOne({ role: 'admin' });
        if (data.role === 'admin' && adminUser) {
            return res.status(400).json({ error: 'Admin user already exists' });
        }
        if (!/^\d{12}$/.test(data.aadharCardNumber)) {
            return res.status(400).json({ error: 'Aadhar Card Number must be exactly 12 digits' });
        }
        const existingUser = await User.findOne({ aadharCardNumber: data.aadharCardNumber });
        if (existingUser) {
            return res.status(400).json({ error: 'User with the same Aadhar Card Number already exists' });
        }
        const newUser = new User(data);
        const response = await newUser.save();
        const payload = { id: response.id };
        const token = generateToken(payload);
        res.status(200).json({ response, token });
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

// Login user (authenticate, set cookie, redirect)
exports.login = async (req, res) => {
    try {
        const { aadharCardNumber, password } = req.body;
        if (!aadharCardNumber || !password) {
            return res.render('login', { error: 'Aadhar Card Number and password are required' });
        }
        const user = await User.findOne({ aadharCardNumber });
        if (!user || !(await user.comparePassword(password))) {
            return res.render('login', { error: 'Invalid Aadhar Card Number or Password' });
        }
        const payload = { id: user.id };
        const token = generateToken(payload);
        res.cookie('token', token, { httpOnly: true });
        res.redirect('/user/profile');
    } catch (err) {
        console.error(err);
        res.render('login', { error: 'Internal Server Error' });
    }
};

exports.getProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await User.findById(userId);
        res.status(200).json({ user });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

exports.updatePassword = async (req, res) => {
    try {
        const userId = req.user.id;
        const { currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ error: 'Both currentPassword and newPassword are required' });
        }
        const user = await User.findById(userId);
        if (!user || !(await user.comparePassword(currentPassword))) {
            return res.status(401).json({ error: 'Invalid current password' });
        }
        user.password = newPassword;
        await user.save();
        res.status(200).json({ message: 'Password updated' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
