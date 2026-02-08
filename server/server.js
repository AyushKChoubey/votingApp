// server-api.js (API-only server for React frontend)
const express = require('express');
const app = express();
const db = require('./config/database');
require('dotenv').config();

// Initialize email service
const emailService = require('./utils/emailService');
emailService.initialize().catch(err => {
    console.error('Failed to initialize email service:', err);
});

// Initialize Cloudinary
const { verifyCloudinaryConfig } = require('./config/cloudinary');
verifyCloudinaryConfig();

const bodyParser = require('body-parser');
const path = require('path');
const compression = require('compression');
const cors = require('cors');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const passport = require('./config/passport');

// Import security middleware
const {
    securityHeaders,
    validateInput,
    xssProtection,
    securityLogger
} = require('./middleware/security');

// Security middleware (must be first)
app.use(securityHeaders);
app.use(compression());

// CORS configuration for React frontend
const corsOptions = {
    origin: function (origin, callback) {
        // Get allowed origins from environment variables or use defaults
        const productionOrigins = process.env.ALLOWED_ORIGINS 
            ? process.env.ALLOWED_ORIGINS.split(',').map(url => url.trim())
            : ['https://yourdomain.com']; // fallback
        
        const developmentOrigins = ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'];
        
        const allowedOrigins = process.env.NODE_ENV === 'production' 
            ? productionOrigins
            : developmentOrigins;
        
        // Allow requests with no origin (like mobile apps, curl, or same-origin requests)
        if (!origin) {
            return callback(null, true);
        }
        
        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
    exposedHeaders: ['X-Total-Count'],
    optionsSuccessStatus: 200 // For legacy browser support
};

app.use(cors(corsOptions));

// Manual preflight handling for complex requests
app.options('*', (req, res) => {
    res.header('Access-Control-Allow-Origin', req.get('Origin'));
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS,PATCH');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
    res.sendStatus(200);
});

// Body parsing middleware
app.use(bodyParser.json({ 
    limit: '10mb',
    strict: true
}));

app.use(bodyParser.urlencoded({ 
    extended: true, 
    limit: '10mb',
    parameterLimit: 100
}));

// Security middleware
app.use(validateInput);
app.use(xssProtection);
app.use(securityLogger);

// Session configuration for OAuth
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key-change-in-production',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: process.env.MONGODB_URI || process.env.MONGODB_LOCAL_URL || 'mongodb://localhost:27017/votingApp',
        touchAfter: 24 * 3600, // lazy session update
        ttl: 24 * 60 * 60, // = 24 hours. Default session expiration time
        autoRemove: 'native', // Default - let MongoDB handle expired sessions
        crypto: {
            secret: process.env.SESSION_SECRET || 'your-secret-key-change-in-production'
        }
    }),
    cookie: {
        secure: process.env.NODE_ENV === 'production', // HTTPS only in production
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Trust proxy in production (for correct IP addresses)
if (process.env.NODE_ENV === 'production') {
    app.set('trust proxy', 1);
}

// Health check endpoint
app.get('/health', (req, res) => {

    res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: process.env.APP_VERSION || '1.0.0',
        environment: process.env.NODE_ENV || 'development'
    });
});

// API status endpoint
app.get('/api/status', (req, res) => {
    res.json({
        application: 'VoteBooth API',
        status: 'running',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        version: process.env.APP_VERSION || '1.0.0'
    });
});

const userRoutes = require('./routes/userRoutes');
const boothRoutes = require('./routes/boothRoutes');
const apiRoutes = require('./routes/api');
const authRoutes = require('./routes/authRoutes');

// ✅ Clean mount structure
app.use('/api/auth', authRoutes);  // OAuth routes
app.use('/api/user', userRoutes);  // all user routes
app.use('/api/booth', boothRoutes); // all booth routes
app.use('/api', apiRoutes); // general api routes

// API-only server (frontend deployed separately)
// Handle 404s for unknown API routes
app.use('/api/*', (req, res) => {
    res.status(404).json({ 
        error: 'API endpoint not found',
        path: req.originalUrl,
        method: req.method,
        timestamp: new Date().toISOString()
    });
});

// For non-API routes, return helpful message about separate frontend
app.use('*', (req, res) => {
    if (process.env.NODE_ENV === 'production') {
        res.status(200).json({
            message: 'VoteBooth API Server',
            note: 'Frontend is deployed separately. API available at /api/*',
            path: req.originalUrl,
            timestamp: new Date().toISOString()
        });
    } else {
        res.status(200).json({
            message: 'React development server should handle this route',
            note: 'Make sure your React dev server is running on http://localhost:5173',
            path: req.originalUrl,
            timestamp: new Date().toISOString()
        });
    }
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('API Error:', {
        message: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
        url: req.originalUrl,
        method: req.method,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        timestamp: new Date().toISOString()
    });

    // Determine error status
    const status = err.status || err.statusCode || 500;
    
    // Send JSON error response
    res.status(status).json({
        error: process.env.NODE_ENV === 'production' 
            ? (status === 500 ? 'Internal server error' : err.message)
            : err.message,
        status,
        timestamp: new Date().toISOString(),
        path: req.originalUrl
    });
});

// Start the API server
const http = require('http');
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;
// Use 0.0.0.0 for production (cloud platforms) and localhost for development
const HOST = process.env.NODE_ENV === 'production' ? '0.0.0.0' : (process.env.HOST || 'localhost');

// Initialize socket.io (lazy module to avoid circular requires)
    try {
    const socket = require('./config/socket');
    socket.init(server);
} catch (err) {
    console.error('Failed to initialize socket.io:', err);
}

const startServer = async () => {
    try {
        server.listen(PORT, HOST, () => {
            console.log(`🚀 VoteBooth API Server running at http://${HOST}:${PORT}`);
            console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
            console.log(`🔗 Health check: http://${HOST}:${PORT}/health`);
            console.log(`📡 CORS enabled for: ${process.env.NODE_ENV === 'production' ? 'production domains' : 'http://localhost:5173'}`);
        });
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
};

// Handle graceful shutdown
process.on('SIGTERM', () => {
    console.log('🛑 SIGTERM received, shutting down gracefully');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('🛑 SIGINT received, shutting down gracefully');
    process.exit(0);
});

startServer();

module.exports = app;