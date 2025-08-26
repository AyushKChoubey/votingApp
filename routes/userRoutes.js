
const express = require('express');
const router = express.Router();
const { jwtAuthMiddleware, generateToken } = require('../middleware/jwt');
const userController = require('../controllers/userController');
const User = require('../models/user');

// SSR: Login page
router.get('/login', (req, res) => {
	res.render('login');
});

// SSR: Register page
router.get('/register', (req, res) => {
	res.render('register');
});

// SSR: Profile page (protected, using JWT from cookie)
router.get('/profile', (req, res, next) => {
	if (req.cookies && req.cookies.token) {
		req.headers.authorization = 'Bearer ' + req.cookies.token;
	}
	next();
}, jwtAuthMiddleware, async (req, res) => {
	const user = await User.findById(req.user.id);
	res.render('profile', { user });
});

// POST: Register form submission
router.post('/register', userController.signup);

// POST: Login form submission (authenticate, set cookie, redirect)
router.post('/login', userController.login);    


// API: Profile data
router.get('/profile/data', jwtAuthMiddleware, userController.getProfile);
router.put('/profile/password', jwtAuthMiddleware, userController.updatePassword);

module.exports = router;