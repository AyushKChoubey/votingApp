// server-api.js (API-only server for React frontend)
const express = require("express");
const app = express();
const db = require("./config/database");
require("dotenv").config();

// Service health tracker
const serviceHealth = require("./utils/serviceHealth");

// Initialize email service
const emailService = require("./utils/emailService");
emailService.initialize().catch((err) => {
  console.error("Failed to initialize email service:", err);
  serviceHealth.setStatus("email", false);
});

// Initialize Cloudinary
const { verifyCloudinaryConfig } = require("./config/cloudinary");
try {
  verifyCloudinaryConfig();
} catch (err) {
  console.error("Failed to initialize Cloudinary:", err);
  serviceHealth.setStatus("cloudinary", false);
}

const bodyParser = require("body-parser");
const path = require("path");
const compression = require("compression");
const cors = require("cors");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const passport = require("./config/passport");

// Import security middleware
const {
  securityHeaders,
  validateInput,
  xssProtection,
  securityLogger,
} = require("./middleware/security");

// Security middleware (must be first)
app.use(securityHeaders);
app.use(compression());

// CORS configuration for React frontend
const corsOptions = {
  origin: function (origin, callback) {
    // Get allowed origins from environment variables or use defaults
    const productionOrigins = process.env.ALLOWED_ORIGINS
      ? process.env.ALLOWED_ORIGINS.split(",").map((url) => url.trim())
      : null;

    // In production, require ALLOWED_ORIGINS to be set
    if (process.env.NODE_ENV === "production" && !productionOrigins) {
      console.error("FATAL: ALLOWED_ORIGINS environment variable is not set in production");
      console.error("Please set ALLOWED_ORIGINS to a comma-separated list of allowed origins");
      process.exit(1);
    }

    const developmentOrigins = [
      "http://localhost:5173",
      "http://localhost:3000",
      "http://127.0.0.1:5173",
    ];

    const allowedOrigins =
      process.env.NODE_ENV === "production"
        ? productionOrigins
        : developmentOrigins;

    // Allow requests with no origin (like mobile apps, curl, or same-origin requests)
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "Accept",
    "Origin",
  ],
  exposedHeaders: ["X-Total-Count"],
  optionsSuccessStatus: 200, // For legacy browser support
};

// Permissive CORS for health check endpoints (before main CORS)
app.use(["/health", "/api/health", "/api/health/services"], cors({
  origin: "*", // Allow health checks from any origin
  methods: ["GET", "OPTIONS"],
  optionsSuccessStatus: 200,
}));

app.use(cors(corsOptions));

// Body parsing middleware
app.use(
  bodyParser.json({
    limit: "10mb",
    strict: true,
  }),
);

app.use(
  bodyParser.urlencoded({
    extended: true,
    limit: "10mb",
    parameterLimit: 100,
  }),
);

// Security middleware
app.use(validateInput);
app.use(xssProtection);
app.use(securityLogger);

// Validate SESSION_SECRET in production
let sessionSecret = process.env.SESSION_SECRET;
if (!sessionSecret) {
  if (process.env.NODE_ENV === "production") {
    console.error("FATAL: SESSION_SECRET environment variable is not set in production");
    console.error("Please set SESSION_SECRET to a strong random string");
    process.exit(1);
  } else {
    sessionSecret = "dev-secret-change-in-production";
    console.warn("WARNING: Using development session secret. Set SESSION_SECRET in production!");
  }
}

// Session configuration for OAuth
app.use(
  session({
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl:
        process.env.MONGODB_URI ||
        process.env.MONGODB_LOCAL_URL ||
        "mongodb://localhost:27017/votingApp",
      touchAfter: 24 * 3600, // lazy session update
      ttl: 24 * 60 * 60, // = 24 hours. Default session expiration time
      autoRemove: "native", // Default - let MongoDB handle expired sessions
      crypto: {
        secret: sessionSecret,
      },
    }),
    cookie: {
      secure: process.env.NODE_ENV === "production", // HTTPS only in production
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  }),
);

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Trust proxy in production (for correct IP addresses)
if (process.env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    version: process.env.APP_VERSION || "1.0.0",
    environment: process.env.NODE_ENV || "development",
  });
});

// API status endpoint
app.get("/api/status", (req, res) => {
  res.json({
    application: "VoteBooth API",
    status: "running",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
    version: process.env.APP_VERSION || "1.0.0",
  });
});

// Service health endpoint (public — no auth required)
app.get("/api/health/services", (req, res) => {
  const services = serviceHealth.getAll();
  const allOk = serviceHealth.allHealthy();
  res.status(allOk ? 200 : 503).json({
    ok: allOk,
    services,
    timestamp: new Date().toISOString(),
  });
});

const userRoutes = require("./routes/userRoutes");
const boothRoutes = require("./routes/boothRoutes");
const apiRoutes = require("./routes/api");
const authRoutes = require("./routes/authRoutes");

// ✅ Clean mount structure
app.use("/api/auth", authRoutes); // OAuth routes
app.use("/api/user", userRoutes); // all user routes
app.use("/api/booth", boothRoutes); // all booth routes
app.use("/api", apiRoutes); // general api routes

// API-only server (frontend deployed separately)
// Handle 404s for unknown API routes
app.use("/api/*", (req, res) => {
  res.status(404).json({
    error: "API endpoint not found",
    path: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString(),
  });
});

// For non-API routes, return helpful message about separate frontend
app.use("*", (req, res) => {
  if (process.env.NODE_ENV === "production") {
    res.status(200).json({
      message: "VoteBooth API Server",
      note: "Frontend is deployed separately. API available at /api/*",
      path: req.originalUrl,
      timestamp: new Date().toISOString(),
    });
  } else {
    res.status(200).json({
      message: "React development server should handle this route",
      note: "Make sure your React dev server is running on http://localhost:5173",
      path: req.originalUrl,
      timestamp: new Date().toISOString(),
    });
  }
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("API Error:", {
    message: err.message,
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get("User-Agent"),
    timestamp: new Date().toISOString(),
  });

  // Determine error status
  const status = err.status || err.statusCode || 500;

  // Determine safe error message for production
  let errorMessage;
  if (process.env.NODE_ENV === "production") {
    if (status === 500) {
      // Never expose internal server errors
      errorMessage = "Internal server error";
    } else if (status >= 400 && status < 500) {
      // Client errors (4xx) are safe to expose
      errorMessage = err.message || "Bad request";
    } else {
      // For other statuses, check if error is marked as safe
      const isSafeError = err.safeMessage || 
        err.name === 'ValidationError' || 
        err.name === 'NotFoundError' ||
        err.name === 'UnauthorizedError' ||
        err.isOperational;
      errorMessage = isSafeError ? err.message : "An error occurred";
    }
  } else {
    // Development: always show full error message
    errorMessage = err.message;
  }

  // Send JSON error response
  res.status(status).json({
    error: errorMessage,
    status,
    timestamp: new Date().toISOString(),
    path: req.originalUrl,
  });
});

// Start the API server
const http = require("http");
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;
// Use 0.0.0.0 for production (cloud platforms) and localhost for development
const HOST =
  process.env.NODE_ENV === "production"
    ? "0.0.0.0"
    : process.env.HOST || "localhost";

// Initialize socket.io (lazy module to avoid circular requires)
try {
  const socket = require("./config/socket");
  socket.init(server);
} catch (err) {
  console.error("Failed to initialize socket.io:", err);
}

const startServer = async () => {
  // Handle server errors
  server.on('error', (err) => {
    // Only exit for bind/startup errors
    if (err.code === 'EADDRINUSE' || err.code === 'EACCES') {
      console.error('❌ Failed to start server:', err);
      console.error(`   Port ${PORT} on ${HOST} may already be in use or permission denied`);
      console.error(`   Error code: ${err.code}`);
      process.exit(1);
    } else {
      // Log runtime errors but don't exit
      console.error('⚠️ Server error:', err);
      console.error(`   Error code: ${err.code}`);
    }
  });

  server.listen(PORT, HOST, () => {
    console.log(`🚀 VoteBooth API Server running at http://${HOST}:${PORT}`);
    console.log(`📊 Environment: ${process.env.NODE_ENV || "development"}`);
    console.log(`🔗 Health check: http://${HOST}:${PORT}/health`);
    console.log(
      `📡 CORS enabled for: ${process.env.NODE_ENV === "production" ? "production domains" : "http://localhost:5173"}`,
    );
  });
};

// Graceful shutdown function
const closeServerGracefully = async (signal) => {
  console.log(`🛑 ${signal} received, shutting down gracefully`);
  
  let exitCode = 0;
  
  // Set timeout for forced shutdown
  const forceShutdownTimeout = setTimeout(() => {
    console.error("⚠️ Forcing shutdown after timeout");
    process.exit(1);
  }, 10000); // 10 second timeout
  
  try {
    // Promisify server.close to await it properly
    await new Promise((resolve, reject) => {
      server.close((err) => {
        if (err) {
          console.error("❌ Error closing server:", err);
          reject(err);
        } else {
          console.log("✅ Server closed successfully");
          resolve();
        }
      });
    });
  } catch (err) {
    console.error("❌ Failed to close server:", err);
    exitCode = 1;
  }
  
  try {
    // Close database connection
    await db.close();
    console.log("✅ Database connection closed");
  } catch (err) {
    console.error("❌ Error closing database:", err);
    exitCode = 1;
  }
  
  clearTimeout(forceShutdownTimeout);
  console.log("👋 Shutdown complete");
  process.exit(exitCode);
};

// Handle graceful shutdown
process.on("SIGTERM", () => closeServerGracefully("SIGTERM"));
process.on("SIGINT", () => closeServerGracefully("SIGINT"));

startServer();

module.exports = app;
