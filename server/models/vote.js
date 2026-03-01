const mongoose = require("mongoose");

const voteSchema = new mongoose.Schema({
  booth: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Booth",
    required: true,
  },
  voter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  candidateIndex: {
    type: Number,
    required: true,
  },
  candidateName: {
    type: String,
    required: true,
  },
  votedAt: {
    type: Date,
    default: Date.now,
  },
  ipAddress: String,
  userAgent: String,
});

// Strip internal fields from JSON output
voteSchema.set("toJSON", {
  transform: (doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

// Compound unique index to prevent duplicate votes
voteSchema.index({ booth: 1, voter: 1 }, { unique: true });

// Index for faster queries
voteSchema.index({ booth: 1, votedAt: -1 });
voteSchema.index({ voter: 1, votedAt: -1 });

const Vote = mongoose.model("Vote", voteSchema);
module.exports = Vote;
