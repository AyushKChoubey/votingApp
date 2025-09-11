const jwt = require('jsonwebtoken');

const jwtAuthMiddleware = (req, res, next) => {
    // Check for JWT token in authorization header or cookies
    let token = null;
    
    // First, check the authorization header
    const authorization = req.headers.authorization;
    if (authorization) {
        token = authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
        // If no header, check cookies
        token = req.cookies.token;
    }
    
    if (!token) {
        // For web pages, redirect to login
        if (req.accepts('html')) {
            return res.redirect('/user/login');
        }
        return res.status(401).json({ error: 'Token Not Found' });
    }

    try {
        // Verify the JWT token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        // Attach user information to the request object
        req.user = decoded;
        next();
    } catch (err) {
        console.error(err);
        // For web pages, redirect to login
        if (req.accepts('html')) {
            res.clearCookie('token');
            return res.redirect('/user/login');
        }
        res.status(401).json({ error: 'Invalid token' });
    }
};

// Function to generate JWT token
const generateToken = (userData) => {
    // Generate a new JWT token using user data (expires in 7 days)
    return jwt.sign(userData, process.env.JWT_SECRET, { expiresIn: '7d' });
};

module.exports = { jwtAuthMiddleware, generateToken };
