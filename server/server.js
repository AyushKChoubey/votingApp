// server-api.js (API-only server for React frontend)
const express = require('express');
const app = express();
const db = require('./db');
require('dotenv').config();

const bodyParser = require('body-parser');
const path = require('path');
const compression = require('compression');
const cors = require('cors');

// Import security middleware
const {
    securityHeaders,
    validateInput,
    xssProtection,
    securityLogger
} = require('./middleware/security');

// Import enhanced JWT middleware
const { optionalAuth } = require('./middleware/jwt');

// Security middleware (must be first)
app.use(securityHeaders);
app.use(compression());

// CORS configuration for React frontend
app.use(cors({
    origin: process.env.NODE_ENV === 'production' 
        ? ['https://yourdomain.com'] // Replace with your production domain
        : ['http://localhost:3000'], // React dev server
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['X-Total-Count']
}));

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

// API Routes - JSON only responses
app.use('/api', require('./routes/api'));                 // General API routes
// Routes
const userRoutes = require('./routes/userRoutes');
const boothRoutes = require('./routes/boothRoutes');

app.use('/api/users', userRoutes);
app.use('/', userRoutes); // For compatibility with some routes
app.use('/api', boothRoutes); // Booth routes with /api prefix built in
app.use('/user', require('./routes/userRoutes'));    // User auth and profile routes
app.use('/api', require('./routes/boothRoutes'));   // Booth functionality routes

// Handle 404 for API routes
app.use('*', (req, res) => {
    res.status(404).json({ 
        error: 'API endpoint not found',
        path: req.originalUrl,
        method: req.method,
        timestamp: new Date().toISOString()
    });
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
const PORT = process.env.API_PORT || 3001;
const HOST = process.env.HOST || 'localhost';

const startServer = async () => {
    try {
        app.listen(PORT, HOST, () => {
            console.log(`🚀 VoteBooth API Server running at http://${HOST}:${PORT}`);
            console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
            console.log(`🔗 Health check: http://${HOST}:${PORT}/health`);
            console.log(`📡 CORS enabled for: ${process.env.NODE_ENV === 'production' ? 'production domains' : 'http://localhost:3000'}`);
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