// models/boothActivity.js
const mongoose = require("mongoose");

const boothActivitySchema = new mongoose.Schema({
  booth: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Booth",
    required: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null,
  },
  message: {
    type: String,
    required: true,
    trim: true,
    maxLength: 500,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Compound index for efficient per-booth queries sorted by time
boothActivitySchema.index({ booth: 1, createdAt: -1 });

const BoothActivity = mongoose.model("BoothActivity", boothActivitySchema);
module.exports = BoothActivity;
