// controllers/userController.js (Complete)
const User = require("../models/user");
const {
  generateToken,
  generateRefreshToken,
  blacklistToken,
} = require("../middleware/jwt");
const validator = require("validator");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const emailService = require("../utils/emailService");
const {
  cloudinary,
  deleteImage,
  extractPublicId,
} = require("../config/cloudinary");
const streamifier = require("streamifier");
const serviceHealth = require("../utils/serviceHealth");

// Input validation helpers
const validateEmail = (email) => {
  return validator.isEmail(email) && email.length <= 254;
};

const validatePassword = (password) => {
  return (
    password &&
    password.length >= 8 &&
    password.length <= 128 &&
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)
  );
};

const validateName = (name) => {
  return (
    name &&
    name.trim().length >= 2 &&
    name.trim().length <= 50 &&
    /^[a-zA-Z\s\-'\.]+$/.test(name.trim())
  );
};

// Helper: Parse user-agent safely without exposing unnecessary location data
const parseUserAgent = (uaString = "") => {
  let browser = "Web Browser";
  let os = "Unknown OS";
  let deviceType = "desktop";

  if (!uaString) {
    return { browser, os, deviceType };
  }

  // OS & deviceType detection
  if (/iphone/i.test(uaString)) {
    os = "iOS";
    deviceType = "mobile";
  } else if (/ipad/i.test(uaString)) {
    os = "iPadOS";
    deviceType = "tablet";
  } else if (/android/i.test(uaString)) {
    os = "Android";
    deviceType = /mobile/i.test(uaString) ? "mobile" : "tablet";
  } else if (/windows nt 10/i.test(uaString)) {
    os = "Windows 10/11";
  } else if (/windows nt/i.test(uaString)) {
    os = "Windows";
  } else if (/macintosh|mac os x/i.test(uaString)) {
    os = "macOS";
  } else if (/linux/i.test(uaString)) {
    os = "Linux";
  }

  // Browser detection
  if (/edg\//i.test(uaString)) {
    browser = "Microsoft Edge";
  } else if (/opr\/|opera/i.test(uaString)) {
    browser = "Opera";
  } else if (/chrome|crios/i.test(uaString)) {
    browser = "Chrome";
  } else if (/firefox|fxios/i.test(uaString)) {
    browser = "Firefox";
  } else if (/safari/i.test(uaString) && !/chrome/i.test(uaString)) {
    browser = "Safari";
  }

  return { browser, os, deviceType };
};

// Register new user
exports.signup = async (req, res) => {
  try {
    let { name, email, password, confirmPassword, role } = req.body;

    // Sanitize inputs
    name = name ? name.trim() : "";
    email = email ? email.trim().toLowerCase() : "";

    // Validation
    const errors = [];

    if (!validateName(name)) {
      errors.push(
        "Name must be 2-50 characters and contain only letters, spaces, hyphens, apostrophes, and periods",
      );
    }

    if (!validateEmail(email)) {
      errors.push("Please provide a valid email address");
    }

    if (!validatePassword(password)) {
      errors.push(
        "Password must be 8-128 characters with at least one uppercase, lowercase, and number",
      );
    }

    if (password !== confirmPassword) {
      errors.push("Passwords do not match");
    }

    if (errors.length > 0) {
      return res.status(400).json({
        error: errors.join(". "),
        formData: { name, email },
      });
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        error:
          "Email already registered. Please use a different email or try logging in.",
        formData: { name, email },
      });
    }

    // Create new user with isEmailVerified = false (default)
    const newUser = new User({
      name: name.trim(),
      email,
      password,
      role: "voter", // Admin promotion must be done manually via database
      isEmailVerified: false, // Explicitly set to false
    });

    // Generate email verification token
    const verificationToken = newUser.createEmailVerificationToken();

    const savedUser = await newUser.save();

    // Send verification email (don't block registration if email fails)
    let emailSent = false;
    try {
      const emailResult = await emailService.sendVerificationEmail({
        to: savedUser.email,
        name: savedUser.name,
        token: verificationToken,
      });

      if (emailResult && emailResult.success) {
        emailSent = true;
        try {
          serviceHealth.setStatus("email", true);
        } catch (e) {
          // ignore
        }
      } else {
        console.warn("⚠️  Email sent but with warning:", emailResult?.message);
        try {
          serviceHealth.setStatus("email", false, {
            message: emailResult?.message,
          });
        } catch (e) {
          // ignore
        }
      }
    } catch (emailError) {
      console.error("❌ Failed to send verification email:", emailError);
      try {
        serviceHealth.setStatus("email", false, {
          message: emailError.message,
        });
      } catch (e) {
        // ignore
      }
      // Continue - user is created, they can request resend later
    }

    // DO NOT return auth tokens - user must verify email first
    res.status(201).json({
      success: true,
      message: emailSent
        ? "Registration successful! Please check your email to verify your account."
        : "Registration successful! However, we couldn't send the verification email. Please use the 'Resend Verification' option to try again.",
      email: savedUser.email,
      requiresVerification: true,
      emailSent,
    });
  } catch (err) {
    console.error("Registration error:", err);

    // Handle specific MongoDB errors
    let errorMessage = "Registration failed. Please try again.";

    if (err.code === 11000) {
      if (err.keyPattern?.email) {
        errorMessage =
          "Email already registered. Please use a different email.";
      }
    }

    res.status(500).json({
      error: errorMessage,
      formData: { name: req.body.name, email: req.body.email },
    });
  }
};

// Login user (API endpoint for React frontend)
exports.login = async (req, res) => {
  try {
    let { email, password, remember } = req.body;

    // Sanitize inputs
    email = email ? email.trim().toLowerCase() : "";

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        error: "Email and password are required",
      });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({
        error: "Please provide a valid email address",
      });
    }

    // Find user and include password for comparison
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return res.status(401).json({
        error: "Invalid email or password",
      });
    }

    // Check if email is verified (skip for OAuth users)
    if (!user.isEmailVerified && user.authProvider === "local") {
      return res.status(403).json({
        error:
          "Please verify your email before logging in. Check your inbox for the verification link.",
        requiresVerification: true,
        email: user.email,
      });
    }

    // Check if account is locked
    if (user.isLocked) {
      return res.status(423).json({
        error:
          "Account is temporarily locked due to too many failed login attempts. Please try again later.",
      });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      // Increment login attempts
      const attemptsLeft = await user.incLoginAttempts();

      // Check if account will be locked after this attempt
      if (attemptsLeft === 0) {
        return res.status(423).json({
          error:
            "Too many failed login attempts. Your account has been temporarily locked for security. Please try again later.",
        });
      } else if (attemptsLeft <= 2 && attemptsLeft > 0) {
        return res.status(401).json({
          error: `Invalid email or password. Warning: ${attemptsLeft} attempt${attemptsLeft === 1 ? "" : "s"} remaining before account lockout.`,
        });
      }

      return res.status(401).json({
        error:
          "Invalid email or password. Please check your credentials and try again.",
      });
    }

    // Reset login attempts on successful login
    if (user.loginAttempts && user.loginAttempts > 0) {
      await user.resetLoginAttempts();
    }

    // Update last login and login count
    user.lastLogin = new Date();
    user.loginCount = (user.loginCount || 0) + 1;

    // Track active session / device: strictly 1 entry per device, update if already exists
    const sessionId = crypto.randomUUID();
    const { browser, os, deviceType } = parseUserAgent(req.headers["user-agent"]);

    if (!user.sessions) {
      user.sessions = [];
    }

    // Add unique session for this sign-in
    user.sessions.push({
      sessionId,
      browser,
      os,
      deviceType,
      lastActive: new Date(),
      createdAt: new Date(),
    });

    if (user.sessions.length > 20) {
      user.sessions = user.sessions.slice(-20);
    }

    await user.save();

    // Generate tokens
    const tokenExpiry = remember ? "7d" : "24h";
    const token = generateToken(user, { expiresIn: tokenExpiry, sessionId });
    const refreshToken = generateRefreshToken(user, { sessionId });
    // Set refresh token as an httpOnly cookie for secure refresh flow
    try {
      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });
    } catch (cookieErr) {
      console.warn(
        "Failed to set refresh token cookie:",
        cookieErr && cookieErr.message,
      );
    }

    // Return user data and token (access token still returned in body for API clients)
    const userData = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isEmailVerified: user.isEmailVerified,
      lastLogin: user.lastLogin,
      preferences: user.preferences,
    };

    res.json({
      success: true,
      message: "Login successful",
      token,
      user: userData,
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({
      error: "Login failed. Please try again.",
    });
  }
};

// Logout user
exports.logout = (req, res) => {
  try {
    // Blacklist current token if exists
    const token =
      req.cookies?.token ||
      (req.headers.authorization && req.headers.authorization.split(" ")[1]);

    if (token) {
      blacklistToken(token);
    }

    // Clear cookies
    res.clearCookie("token");
    res.clearCookie("refreshToken");

    // Log logout
    res.json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (err) {
    console.error("Logout error:", err);
    res.status(500).json({ error: "Logout failed" });
  }
};

// Get user profile
exports.getProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId)
      .select("-password")
      .populate("createdBooths", "name status createdAt")
      .populate("joinedBooths", "name status createdAt");

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const stats = await user.getStats();

    res.json({
      success: true,
      user,
      stats,
    });
  } catch (err) {
    console.error("Get profile error:", err);
    res.status(500).json({ error: "Failed to load profile" });
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
        error: "All password fields are required",
      });
    }

    if (!validatePassword(newPassword)) {
      return res.status(400).json({
        error:
          "New password must be 8-128 characters with at least one uppercase, lowercase, and number",
      });
    }

    if (newPassword !== confirmNewPassword) {
      return res.status(400).json({
        error: "New passwords do not match",
      });
    }

    if (currentPassword === newPassword) {
      return res.status(400).json({
        error: "New password must be different from current password",
      });
    }

    // Get user with password
    const user = await User.findById(userId).select("+password");
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Verify current password
    const isPasswordValid = await user.comparePassword(currentPassword);
    if (!isPasswordValid) {
      return res.status(401).json({
        error: "Current password is incorrect",
      });
    }

    // Update password
    user.password = newPassword;
    user.passwordChangedAt = new Date();
    await user.save();

    res.json({ message: "Password updated successfully" });
  } catch (err) {
    console.error("Update password error:", err);
    res.status(500).json({ error: "Failed to update password" });
  }
};

// Update profile
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    // Extract from request body following frontend structure
    let { name, profile, address } = req.body;

    // Sanitize inputs
    name = name ? name.trim() : "";
    const organization = profile?.organization
      ? profile.organization.trim()
      : "";
    const bio = profile?.bio ? profile.bio.trim() : "";
    address = address ? address.trim() : "";

    // Validation
    const errors = [];

    if (name && !validateName(name)) {
      errors.push(
        "Name must be 2-50 characters and contain only letters, spaces, hyphens, apostrophes, and periods",
      );
    }

    if (organization && organization.length > 100) {
      errors.push("Organization name must be less than 100 characters");
    }

    if (bio && bio.length > 500) {
      errors.push("Bio must be less than 500 characters");
    }

    if (address && address.length > 200) {
      errors.push("Address must be less than 200 characters");
    }

    if (errors.length > 0) {
      return res.status(400).json({ error: errors.join(". ") });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Ensure profile object exists
    if (!user.profile) {
      user.profile = {};
    }

    // Update fields
    if (name) user.name = name;
    user.profile.organization = organization;
    user.profile.bio = bio;

    // Remove website field if it exists (cleanup old data)
    if (user.profile.website !== undefined) {
      user.profile.website = undefined;
    }

    if (address !== undefined) user.address = address;

    await user.save();

    // Return full user object (excluding password) to match getProfile response
    const updatedUser = await User.findById(userId)
      .select("-password")
      .populate("createdBooths", "name status createdAt")
      .populate("joinedBooths", "name status createdAt");

    res.json({
      success: true,
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (err) {
    console.error("Update profile error:", err);
    res.status(500).json({ error: "Failed to update profile" });
  }
};

// Refresh token
exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.cookies;

    if (!refreshToken) {
      return res.status(401).json({ error: "Refresh token required" });
    }

    // Check if refresh token has been blacklisted (already used/rotated)
    const { blacklistRefreshToken } = require("../middleware/jwt");

    const decoded = jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
    );

    if (decoded.type !== "refresh") {
      return res.status(401).json({ error: "Invalid refresh token" });
    }

    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    // Blacklist the old refresh token (rotation — prevents reuse)
    blacklistRefreshToken(refreshToken);

    let sessionId = decoded.sessionId;
    if (user.sessions && user.sessions.length > 0) {
      if (sessionId) {
        const sIdx = user.sessions.findIndex((s) => s.sessionId === sessionId);
        if (sIdx !== -1) {
          user.sessions[sIdx].lastActive = new Date();
          await user.save();
        } else {
          user.sessions.push({
            sessionId,
            lastActive: new Date(),
            createdAt: new Date(),
          });
          await user.save();
        }
      } else {
        sessionId = user.sessions[user.sessions.length - 1]?.sessionId || crypto.randomUUID();
        if (!user.sessions.some((s) => s.sessionId === sessionId)) {
          user.sessions.push({
            sessionId,
            lastActive: new Date(),
            createdAt: new Date(),
          });
          await user.save();
        }
      }
    }

    // Generate new access token preserving session
    const newToken = generateToken(user, { sessionId });

    // Generate new refresh token preserving session
    const newRefreshToken = generateRefreshToken(user, { sessionId });

    // Set new access token cookie
    res.cookie("token", newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 24 * 60 * 60 * 1000,
    });

    // Set new refresh token cookie (rotated)
    res.cookie("refreshToken", newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({ success: true, message: "Token refreshed successfully" });
  } catch (err) {
    console.error("Refresh token error:", err);
    res.status(401).json({ error: "Invalid refresh token" });
  }
};

// Delete account
exports.deleteAccount = async (req, res) => {
  try {
    const userId = req.user.id;
    const { password } = req.body || {};

    // Get user with password
    const user = await User.findById(userId).select("+password");
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // For local accounts, verify password
    if (user.authProvider !== "google") {
      if (!password) {
        return res
          .status(400)
          .json({ error: "Password is required to delete account" });
      }

      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        return res.status(401).json({ error: "Incorrect password" });
      }
    }

    // Delete user's votes
    const Vote = require("../models/vote");
    await Vote.deleteMany({ voter: userId });

    // Delete booths created by user
    const Booth = require("../models/booth");
    await Booth.deleteMany({ creator: userId });

    // Remove user from other booths
    await Booth.updateMany(
      { "members.user": userId },
      { $pull: { members: { user: userId } } },
    );

    // Delete the user
    await User.findByIdAndDelete(userId);

    // Clear cookies
    res.clearCookie("token");
    res.clearCookie("refreshToken");

    res.json({ message: "Account deleted successfully" });
  } catch (err) {
    console.error("Delete account error:", err);
    res.status(500).json({ error: "Failed to delete account" });
  }
};

// Get user statistics
exports.getUserStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const stats = await user.getStats();

    res.json(stats);
  } catch (err) {
    console.error("Get user stats error:", err);
    res.status(500).json({ error: "Failed to fetch user statistics" });
  }
};

// Update user preferences
exports.updatePreferences = async (req, res) => {
  try {
    const userId = req.user.id;
    const { emailNotifications, smsNotifications, theme, language } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Update preferences
    if (emailNotifications !== undefined) {
      user.preferences.emailNotifications = Boolean(emailNotifications);
    }
    if (smsNotifications !== undefined) {
      user.preferences.smsNotifications = Boolean(smsNotifications);
    }
    if (theme && ["light", "dark", "auto"].includes(theme)) {
      user.preferences.theme = theme;
    }
    if (language) {
      user.preferences.language = language;
    }

    await user.save();

    res.json({
      message: "Preferences updated successfully",
      preferences: user.preferences,
    });
  } catch (err) {
    console.error("Update preferences error:", err);
    res.status(500).json({ error: "Failed to update preferences" });
  }
};

// Verify email with token
exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({
        success: false,
        error: "Verification token is required",
      });
    }

    // Hash the token to compare with stored hashed token
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    // Find user with this token and check if not expired
    const user = await User.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        error: "Invalid or expired verification link",
        expired: true,
      });
    }

    // Check if already verified
    if (user.isEmailVerified) {
      return res.status(200).json({
        success: true,
        message: "Email already verified",
        alreadyVerified: true,
      });
    }

    // Mark email as verified
    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Email verified successfully! You can now log in.",
      verified: true,
    });
  } catch (err) {
    console.error("Email verification error:", err);
    res.status(500).json({
      success: false,
      error: "Failed to verify email. Please try again.",
    });
  }
};

// Resend verification email (rate-limited)
exports.resendVerificationEmail = async (req, res) => {
  try {
    let { email } = req.body;

    // Sanitize input
    email = email ? email.trim().toLowerCase() : "";

    if (!validateEmail(email)) {
      return res.status(400).json({
        error: "Please provide a valid email address",
      });
    }

    // Check email service health before attempting to reveal anything
    const emailStatus = serviceHealth.get("email");
    if (emailStatus && emailStatus.ok === false) {
      // Email service is down - inform user instead of silently failing
      return res.status(503).json({
        error:
          "Email service is currently unavailable. Please try again later.",
        serviceUnavailable: true,
      });
    }

    // Find user (don't reveal if email exists - prevent user enumeration)
    const user = await User.findOne({ email });

    // Always return success to prevent user enumeration
    const successResponse = {
      success: true,
      message:
        "If your email is registered and unverified, you will receive a verification link shortly.",
    };

    if (!user) {
      // Email doesn't exist - but don't reveal this
      return res.status(200).json(successResponse);
    }

    // Already verified
    if (user.isEmailVerified) {
      // Don't reveal this either
      return res.status(200).json(successResponse);
    }

    // OAuth users don't need email verification
    if (user.authProvider !== "local") {
      return res.status(200).json(successResponse);
    }

    // Check if user recently requested (rate limiting at application level)
    // If emailVerificationExpires is still valid, they already have an active token
    if (
      user.emailVerificationExpires &&
      user.emailVerificationExpires > Date.now()
    ) {
      const timeLeft = Math.ceil(
        (user.emailVerificationExpires - Date.now()) / 1000 / 60,
      );
      if (timeLeft > 1380) {
        // Less than 60 minutes since last send (24h - 60min)
        return res.status(200).json(successResponse);
      }
    }

    // Generate new verification token
    const verificationToken = user.createEmailVerificationToken();
    await user.save();

    // Send verification email
    let emailSent = false;
    try {
      const emailResult = await emailService.sendVerificationEmail({
        to: user.email,
        name: user.name,
        token: verificationToken,
      });

      if (emailResult && emailResult.success) {
        emailSent = true;
        try {
          serviceHealth.setStatus("email", true);
        } catch (e) {
          // ignore
        }
      } else {
        console.warn("⚠️  Email sent but with warning:", emailResult?.message);
        try {
          serviceHealth.setStatus("email", false, {
            message: emailResult?.message,
          });
        } catch (e) {
          // ignore
        }
      }
    } catch (emailError) {
      console.error("❌ Failed to send verification email:", emailError);
      try {
        serviceHealth.setStatus("email", false, {
          message: emailError.message,
        });
      } catch (e) {
        // ignore
      }
    }

    if (!emailSent) {
      return res.status(503).json({
        error: "Failed to send verification email. Please try again later.",
        serviceUnavailable: true,
      });
    }

    res.status(200).json(successResponse);
  } catch (err) {
    console.error("Resend verification error:", err);
    res.status(500).json({
      error: "Failed to process request. Please try again.",
    });
  }
};
// Forgot password - generates reset token and sends email
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    // Validate email input
    if (!email || !email.trim()) {
      return res.status(400).json({
        error: "Email is required",
      });
    }

    // Generic success response (same for valid/invalid email to prevent user enumeration)
    const successResponse = {
      success: true,
      message:
        "If an account exists with that email, a password reset link has been sent.",
    };

    // Check email service health before attempting
    const emailStatus = serviceHealth.get("email");
    if (emailStatus && emailStatus.ok === false) {
      return res.status(503).json({
        error:
          "Email service is currently unavailable. Please try again later.",
        serviceUnavailable: true,
      });
    }

    // Find user by email
    const user = await User.findOne({ email: email.trim().toLowerCase() });

    // If user doesn't exist, return generic success (don't reveal)
    if (!user) {
      return res.status(200).json(successResponse);
    }

    // OAuth users cannot reset password
    if (user.authProvider !== "local") {
      return res.status(200).json(successResponse);
    }

    // Generate reset token (returns unhashed version)
    const resetToken = user.createPasswordResetToken();

    // Save user with hashed reset token
    await user.save({ validateBeforeSave: false });

    // Send password reset email
    let emailSent = false;
    try {
      const emailResult = await emailService.sendPasswordResetEmail({
        to: user.email,
        name: user.name,
        token: resetToken,
      });

      if (emailResult && emailResult.success) {
        emailSent = true;
        try {
          serviceHealth.setStatus("email", true);
        } catch (e) {
          // ignore
        }
      } else {
        console.warn(
          "⚠️  Email service returned failure:",
          emailResult?.message,
        );
        try {
          serviceHealth.setStatus("email", false, {
            message: emailResult?.message,
          });
        } catch (e) {
          // ignore
        }
      }
    } catch (emailError) {
      console.error("❌ Failed to send password reset email:", emailError);
      try {
        serviceHealth.setStatus("email", false, {
          message: emailError.message,
        });
      } catch (e) {
        // ignore
      }
      // Clear reset token if email fails
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save({ validateBeforeSave: false });
    }

    if (!emailSent) {
      return res.status(503).json({
        error: "Failed to send password reset email. Please try again later.",
        serviceUnavailable: true,
      });
    }

    // Always return success (prevent user enumeration)
    res.status(200).json(successResponse);
  } catch (err) {
    console.error("❌ Forgot password error:", err);
    res.status(500).json({
      error: "Failed to process request. Please try again.",
    });
  }
};
// Upload avatar
exports.uploadAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: "No image file provided",
      });
    }

    const userId = req.user.id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        error: "User not found",
      });
    }

    // Upload to Cloudinary using buffer
    const uploadResult = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: "votingapp/avatars",
          transformation: [
            { width: 400, height: 400, crop: "fill", gravity: "face" },
            { quality: "auto:good" },
            { fetch_format: "auto" },
          ],
          resource_type: "image",
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        },
      );

      streamifier.createReadStream(req.file.buffer).pipe(uploadStream);
    });

    // Delete old avatar from Cloudinary if exists
    if (user.profile?.avatar) {
      const oldPublicId = extractPublicId(user.profile.avatar);
      if (oldPublicId) {
        try {
          await deleteImage(oldPublicId);
        } catch (deleteError) {
          console.warn("Failed to delete old avatar:", deleteError.message);
        }
      }
    }

    // Update user profile with new avatar URL
    user.profile = user.profile || {};
    user.profile.avatar = uploadResult.secure_url;
    await user.save();

    console.log("✅ Avatar uploaded successfully for user:", user.email);

    // Return full user object (excluding password) to match getProfile response
    const updatedUser = await User.findById(userId)
      .select("-password")
      .populate("createdBooths", "name status createdAt")
      .populate("joinedBooths", "name status createdAt");

    res.status(200).json({
      success: true,
      message: "Avatar uploaded successfully",
      avatar: uploadResult.secure_url,
      user: updatedUser,
    });
  } catch (err) {
    console.error("Avatar upload error:", err);
    // Don't expose raw error messages to clients (may contain provider internals)
    const cloudStatus = serviceHealth.get("cloudinary");
    if (cloudStatus && cloudStatus.ok === false) {
      return res.status(503).json({
        error:
          "Image upload service is currently unavailable. Please try again later.",
      });
    }

    res.status(500).json({
      error: "Failed to upload avatar. Please try again.",
    });
  }
};

// Delete avatar
exports.deleteAvatar = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        error: "User not found",
      });
    }

    if (!user.profile?.avatar) {
      return res.status(400).json({
        error: "No avatar to delete",
      });
    }

    // Delete from Cloudinary
    const publicId = extractPublicId(user.profile.avatar);
    if (publicId) {
      try {
        await deleteImage(publicId);
      } catch (deleteError) {
        console.warn("Failed to delete from Cloudinary:", deleteError.message);
      }
    }

    // Remove avatar from user profile
    user.profile.avatar = undefined;
    await user.save();

    console.log("✅ Avatar deleted successfully for user:", user.email);

    // Return full user object (excluding password) to match getProfile response
    const updatedUser = await User.findById(userId)
      .select("-password")
      .populate("createdBooths", "name status createdAt")
      .populate("joinedBooths", "name status createdAt");

    res.status(200).json({
      success: true,
      message: "Avatar deleted successfully",
      user: updatedUser,
    });
  } catch (err) {
    console.error("Avatar delete error:", err);
    res.status(500).json({
      error: "Failed to delete avatar",
    });
  }
};
// Reset password - validates token and updates password
exports.resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    // Validate input
    if (!token || !password) {
      return res.status(400).json({
        error: "Token and new password are required",
      });
    }

    // Validate password strength
    if (password.length < 8) {
      return res.status(400).json({
        error: "Password must be at least 8 characters long",
      });
    }

    if (password.length > 128) {
      return res.status(400).json({
        error: "Password must be less than 128 characters",
      });
    }

    if (!/(?=.*[a-z])/.test(password)) {
      return res.status(400).json({
        error: "Password must contain at least one lowercase letter",
      });
    }

    if (!/(?=.*[A-Z])/.test(password)) {
      return res.status(400).json({
        error: "Password must contain at least one uppercase letter",
      });
    }

    if (!/(?=.*\d)/.test(password)) {
      return res.status(400).json({
        error: "Password must contain at least one number",
      });
    }

    // Find user by valid reset token
    const user = await User.findByPasswordResetToken(token).select("+password");

    if (!user) {
      return res.status(400).json({
        error: "Password reset token is invalid or has expired",
      });
    }

    // Set new password
    user.password = password;

    // Clear reset token fields
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;

    // Save user (password will be hashed by pre-save hook)
    await user.save();

    res.status(200).json({
      success: true,
      message:
        "Password has been reset successfully. You can now log in with your new password.",
    });
  } catch (err) {
    console.error("Reset password error:", err);
    res.status(500).json({
      error: "Failed to reset password. Please try again.",
    });
  }
};

// GET: Get active sessions / devices (safely without exposing precise location, 1 entry per device)
exports.getDevices = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    let currentSessionId = req.user.sessionId;
    const { browser, os, deviceType } = parseUserAgent(req.headers["user-agent"]);

    if (!user.sessions) {
      user.sessions = [];
    }

    // Keep active sessions unique by sessionId
    const sessionMap = new Map();
    for (const session of user.sessions) {
      if (session.sessionId) {
        sessionMap.set(session.sessionId, session);
      }
    }
    user.sessions = Array.from(sessionMap.values());

    // If completely empty, add exactly 1 entry for this current device
    if (user.sessions.length === 0) {
      currentSessionId = currentSessionId || crypto.randomUUID();
      user.sessions.push({
        sessionId: currentSessionId,
        browser,
        os,
        deviceType,
        lastActive: new Date(),
        createdAt: new Date(),
      });
      await user.save();
    }

    // Find current device session strictly by sessionId (do not match by device fingerprint)
    let currentSession = user.sessions.find(
      (s) => currentSessionId && s.sessionId === currentSessionId
    );

    if (!currentSession && currentSessionId) {
      currentSession = {
        sessionId: currentSessionId,
        browser,
        os,
        deviceType,
        lastActive: new Date(),
        createdAt: new Date(),
      };
      user.sessions.push(currentSession);
      await user.save();
    }

    if (currentSession) {
      currentSessionId = currentSession.sessionId;
      // Only touch lastActive if at least 15 minutes passed to avoid write churn
      if (Date.now() - new Date(currentSession.lastActive).getTime() > 15 * 60 * 1000) {
        currentSession.lastActive = new Date();
        await user.save();
      }
    }

    const devices = user.sessions.map((s) => ({
      sessionId: s.sessionId,
      browser: s.browser || "Web Browser",
      os: s.os || "Unknown OS",
      deviceType: s.deviceType || "desktop",
      lastActive: s.lastActive || s.createdAt || new Date(),
      isCurrent: s.sessionId === currentSessionId,
    }));

    // Current device always first, then sort remaining by lastActive desc
    devices.sort((a, b) => {
      if (a.isCurrent) return -1;
      if (b.isCurrent) return 1;
      return new Date(b.lastActive) - new Date(a.lastActive);
    });

    res.json({
      success: true,
      currentSessionId,
      devices,
    });
  } catch (err) {
    console.error("Get devices error:", err);
    res.status(500).json({ error: "Failed to retrieve active devices" });
  }
};

// POST: Sign out of all other devices
exports.revokeOtherDevices = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    let currentSessionId = req.user.sessionId;
    const { browser, os, deviceType } = parseUserAgent(req.headers["user-agent"]);

    if (user.sessions && user.sessions.length > 0) {
      if (currentSessionId) {
        user.sessions = user.sessions.filter(
          (s) => s.sessionId === currentSessionId
        );
      } else {
        user.sessions = [];
      }
      if (user.sessions.length === 0 && currentSessionId) {
        user.sessions = [
          {
            sessionId: currentSessionId,
            browser,
            os,
            deviceType,
            lastActive: new Date(),
            createdAt: new Date(),
          },
        ];
      }
      await user.save();
    }

    res.json({
      success: true,
      message: "Signed out of all other devices successfully",
    });
  } catch (err) {
    console.error("Revoke other devices error:", err);
    res.status(500).json({ error: "Failed to revoke other devices" });
  }
};
