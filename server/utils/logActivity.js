// utils/logActivity.js
const BoothActivity = require("../models/boothActivity");

/**
 * Log a booth activity entry.
 * Never throws — failures are silently swallowed so they never break the main request.
 *
 * @param {string|ObjectId} boothId  - The booth's _id
 * @param {string|ObjectId|null} userId - The acting user's _id (null for system events)
 * @param {string} message            - Human-readable description, e.g. "Ayush created the booth"
 */
const logActivity = async (boothId, userId, message) => {
  try {
    await BoothActivity.create({
      booth: boothId,
      user: userId || null,
      message,
    });
  } catch (err) {
    // Never surface activity-log errors to callers
    console.error("logActivity error:", err.message);
  }
};

module.exports = logActivity;
