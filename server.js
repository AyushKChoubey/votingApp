// server.js (Production Ready)
const express = require('express');
const app = express();
const db = require('./db');
require('dotenv').config();

const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const path = require('path');
const compression = require('compression');
const cors = require('cors');

// Import security middleware
const {
    securityHeaders,
    validateInput,
    xssProtection,
    csrfProtection,
    securityLogger
} = require('./middleware/security');

// Import enhanced JWT middleware
const { optionalAuth } = require('./middleware/jwt');

// Security middleware (must be first)
app.use(securityHeaders);
app.use(compression());

// CORS configuration
app.use(cors({
    origin: process.env.ALLOWED_ORIGINS ? 
        process.env.ALLOWED_ORIGINS.split(',') : 
        ['http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Body parsing middleware with limits
app.use(bodyParser.json({ 
    limit: '10mb',
    verify: (req, res, buf) => {
        try {
            JSON.parse(buf);
        } catch (e) {
            res.status(400).json({ error: 'Invalid JSON' });
        }
    }
}));

app.use(bodyParser.urlencoded({ 
    extended: true, 
    limit: '10mb',
    parameterLimit: 100
}));

app.use(cookieParser());

// Security middleware
app.use(validateInput);
app.use(xssProtection);
app.use(csrfProtection);
app.use(securityLogger);

// View engine and static files
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Static files with proper caching
app.use('/public', express.static(path.join(__dirname, 'public'), {
    maxAge: process.env.NODE_ENV === 'production' ? '30d' : '1d',
    etag: true,
    lastModified: true
}));

// Serve favicon
app.get('/favicon.ico', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'favicon.ico'));
});

// Trust proxy in production (for correct IP addresses)
if (process.env.NODE_ENV === 'production') {
    app.set('trust proxy', 1);
}

// Global middleware for views
app.use(optionalAuth); // This will set res.locals.user if authenticated
app.use((req, res, next) => {
    res.locals.error = null;
    res.locals.success = null;
    res.locals.NODE_ENV = process.env.NODE_ENV;
    res.locals.APP_NAME = process.env.APP_NAME || 'Voting App';
    next();
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: process.env.APP_VERSION || '1.0.0'
    });
});

// API versioning
app.use('/api/v1/user', require('./routes/userRoutes'));
app.use('/api/v1/booth', require('./routes/boothRoutes'));

// Routes
app.use('/user', require('./routes/userRoutes'));
app.use('/booth', require('./routes/boothRoutes'));

// Home page
app.get('/', (req, res) => {
    const isLoggedIn = res.locals.user !== null;
    const message = req.query.message;
    const error = req.query.error;
    
    res.render('index', { 
        isLoggedIn, 
        message, 
        error,
        title: 'Home - ' + res.locals.APP_NAME
    });
});

// About page
app.get('/about', (req, res) => {
    res.render('about', { 
        title: 'About - ' + res.locals.APP_NAME 
    });
});

// Logout route
app.get('/logout', (req, res) => {
    res.clearCookie('token');
    res.clearCookie('refreshToken');
    res.redirect('/?message=logged_out');
});

// API documentation route (in development)
if (process.env.NODE_ENV !== 'production') {
    app.get('/api-docs', (req, res) => {
        res.render('api-docs', { 
            title: 'API Documentation - ' + res.locals.APP_NAME 
        });
    });
}

// Handle 404 for API routes
app.use('/api/*', (req, res) => {
    res.status(404).json({ 
        error: 'API endpoint not found',
        path: req.originalUrl
    });
});

// 404 handler for web pages
app.use((req, res) => {
    res.status(404).render('error', { 
        error: 'Page not found',
        title: '404 - Page Not Found',
        statusCode: 404
    });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('Unhandled error:', {
        error: err.message,
        stack: err.stack,
        url: req.url,
        method: req.method,
        ip: req.ip,
        userAgent: req.get('user-agent'),
        timestamp: new Date().toISOString()
    });
    
    // Don't leak error details in production
    const isDevelopment = process.env.NODE_ENV !== 'production';
    const errorMessage = isDevelopment ? err.message : 'Something went wrong!';
    
    if (req.path.startsWith('/api/')) {
        res.status(500).json({ 
            error: errorMessage,
            ...(isDevelopment && { stack: err.stack })
        });
    } else {
        res.status(500).render('error', { 
            error: errorMessage,
            title: '500 - Server Error',
            statusCode: 500,
            ...(isDevelopment && { stack: err.stack })
        });
    }
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received. Shutting down gracefully...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('SIGINT received. Shutting down gracefully...');
    process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});

const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔗 URL: http://localhost:${PORT}`);
});

// Set server timeout
server.timeout = 30000; // 30 seconds

module.exports = app;