// middleware/jwt.js
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

// Token blacklist with expiry (in production, use Redis or database)
// Map<token, expiresAt> — tokens are auto-pruned when expired
const tokenBlacklist = new Map();

// Prune expired tokens periodically
const pruneBlacklist = () => {
  const now = Date.now();
  for (const [token, expiresAt] of tokenBlacklist) {
    if (expiresAt <= now) {
      tokenBlacklist.delete(token);
    }
  }
};

// Prune every 10 minutes
setInterval(pruneBlacklist, 10 * 60 * 1000).unref();

// Warn at startup if refresh secret is missing
if (!process.env.JWT_REFRESH_SECRET) {
  console.warn(
    "⚠️  WARNING: JWT_REFRESH_SECRET is not set. Refresh tokens will use JWT_SECRET as fallback. Set a separate JWT_REFRESH_SECRET in production for stronger security.",
  );
}

const jwtAuthMiddleware = async (req, res, next) => {
  try {
    let token = null;

    // Check for JWT token in authorization header or cookies
    const authorization = req.headers.authorization;
    if (authorization && authorization.startsWith("Bearer ")) {
      token = authorization.split(" ")[1];
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      if (req.accepts("html")) {
        return res.redirect(
          "/user/login?redirect=" + encodeURIComponent(req.originalUrl),
        );
      }
      return res.status(401).json({ error: "Authentication required" });
    }

    // Check if token is blacklisted
    if (tokenBlacklist.has(token)) {
      res.clearCookie("token");
      if (req.accepts("html")) {
        return res.redirect("/user/login?error=session_expired");
      }
      return res.status(401).json({ error: "Token has been revoked" });
    }

    // Verify the JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check if user still exists
    const User = require("../models/user");
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      res.clearCookie("token");
      if (req.accepts("html")) {
        return res.redirect("/user/login?error=user_not_found");
      }
      return res.status(401).json({ error: "User not found" });
    }

    // Check if token was issued before password change
    if (
      user.passwordChangedAt &&
      decoded.iat < user.passwordChangedAt.getTime() / 1000
    ) {
      res.clearCookie("token");
      if (req.accepts("html")) {
        return res.redirect("/user/login?error=password_changed");
      }
      return res
        .status(401)
        .json({ error: "Please login again due to password change" });
    }

    // Attach user information to the request object
    req.user = decoded;
    req.user.userData = user;
    res.locals.user = user; // Make user available in views

    next();
  } catch (err) {
    console.error("JWT Auth Error:", err.message);

    // Clear invalid token
    res.clearCookie("token");

    if (req.accepts("html")) {
      return res.redirect("/user/login?error=invalid_token");
    }

    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Token expired" });
    }

    res.status(401).json({ error: "Invalid token" });
  }
};

// Optional auth middleware (doesn't redirect if no token)
const optionalAuth = async (req, res, next) => {
  try {
    let token = null;

    const authorization = req.headers.authorization;
    if (authorization && authorization.startsWith("Bearer ")) {
      token = authorization.split(" ")[1];
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return next();
    }

    if (tokenBlacklist.has(token)) {
      res.clearCookie("token");
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const User = require("../models/user");
    const user = await User.findById(decoded.id).select("-password");

    if (user) {
      req.user = decoded;
      req.user.userData = user;
      res.locals.user = user;
    }

    next();
  } catch (err) {
    // Clear invalid token and continue
    res.clearCookie("token");
    next();
  }
};

// Function to generate JWT token with enhanced security
const generateToken = (userData, options = {}) => {
  const payload = {
    id: userData.id || userData._id,
    email: userData.email,
    role: userData.role,
    iat: Math.floor(Date.now() / 1000),
    jti: crypto.randomUUID(), // Unique token ID
  };

  const defaultOptions = {
    expiresIn: "24h",
    issuer: "voting-app",
    audience: "voting-app-users",
  };

  return jwt.sign(payload, process.env.JWT_SECRET, {
    ...defaultOptions,
    ...options,
  });
};

// Function to generate refresh token
const generateRefreshToken = (userData) => {
  const payload = {
    id: userData.id || userData._id,
    type: "refresh",
    jti: crypto.randomUUID(),
  };

  return jwt.sign(
    payload,
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
    {
      expiresIn: "7d",
      issuer: "voting-app",
    },
  );
};

// Function to blacklist token (for logout)
const blacklistToken = (token) => {
  tokenBlacklist.set(token, Date.now() + 24 * 60 * 60 * 1000);
};

// Function to blacklist refresh token (for token rotation)
const blacklistRefreshToken = (token) => {
  tokenBlacklist.set(token, Date.now() + 7 * 24 * 60 * 60 * 1000);
};

// Note: `requireAdmin` and `requireBoothOwnership` helpers removed —
// they were not referenced elsewhere in the codebase. If you need
// admin or ownership checks later, re-add focused middleware here.

module.exports = {
  jwtAuthMiddleware,
  optionalAuth,
  generateToken,
  generateRefreshToken,
  blacklistToken,
  blacklistRefreshToken,
};
