// routes/boothRoutes-api.js - API-only booth routes for React frontend
const express = require("express");
const router = express.Router();
const boothController = require("../controllers/boothController");
const { jwtAuthMiddleware } = require("../middleware/jwt");
const Booth = require("../models/booth");
const Vote = require("../models/vote");
const logActivity = require("../utils/logActivity");
const mongoose = require("mongoose");
const {
  createBoothLimiter,
  voteLimiter,
  joinBoothLimiter,
} = require("../middleware/rateLimiter");
const { csrfProtection } = require("../middleware/security");

// Shared helper function to find booth by either boothId or MongoDB _id
const findBoothByIdOrBoothId = async (identifier) => {
  // Check if it's a boothId format (VBB + hex)
  if (/^VBB[0-9A-F]{6}$/i.test(identifier)) {
    return await Booth.findByBoothId(identifier);
  }
  // Otherwise, try MongoDB ObjectId
  if (mongoose.Types.ObjectId.isValid(identifier)) {
    return await Booth.findById(identifier);
  }
  return null;
};

// ===== API Routes for React Frontend =====

// Get user dashboard data (booth stats)
router.get("/dashboard", jwtAuthMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const User = require("../models/user");
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Get booths created by user
    const createdBooths = await Booth.find({ creator: userId }).sort({
      createdAt: -1,
    });

    // Auto-update scheduled status for all created booths
    await Promise.all(
      createdBooths.map(async (booth) => {
        try {
          if (typeof booth.updateScheduledStatus === "function") {
            await booth.updateScheduledStatus();
          }
        } catch (e) {
          // swallow errors
        }
      }),
    );

    // logging removed

    // Get booths where user is a member
    const joinedBooths = await Booth.find({
      "members.user": userId,
      creator: { $ne: userId },
    })
      .populate("creator", "name")
      .sort({ createdAt: -1 });

    // Auto-update scheduled status for all joined booths
    await Promise.all(
      joinedBooths.map(async (booth) => {
        try {
          if (typeof booth.updateScheduledStatus === "function") {
            await booth.updateScheduledStatus();
          }
        } catch (e) {
          // swallow errors
        }
      }),
    );

    // Calculate stats
    const stats = {
      totalBooths: createdBooths.length,
      joinedBooths: joinedBooths.length,
      totalVotes: createdBooths.reduce(
        (sum, booth) => sum + booth.totalVotes,
        0,
      ),
      activeBooths: createdBooths.filter((b) => b.status === "active").length,
    };

    // DEBUG: Log sample booth to verify boothId is included
    // logging removed

    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
        },
        createdBooths: createdBooths.map((booth) => ({
          id: booth._id,
          boothId: booth.boothId,
          name: booth.name,
          description: booth.description,
          status: booth.status,
          createdAt: booth.createdAt,
          totalVotes: booth.totalVotes,
          memberCount: booth.members.length,
          candidateCount: booth.candidates.length,
          inviteCode: booth.inviteCode,
        })),
        joinedBooths: joinedBooths.map((booth) => ({
          id: booth._id,
          boothId: booth.boothId,
          name: booth.name,
          description: booth.description,
          status: booth.status,
          // return a small creator object to keep payload minimal
          creator: {
            id: booth.creator._id,
            name: booth.creator.name,
          },
          memberCount: booth.members.length,
          totalVotes: booth.totalVotes || 0,
          candidateCount: (booth.candidates || []).length,
          hasVoted: booth.hasUserVoted(userId),
        })),
        stats,
      },
    });
  } catch (err) {
    // logging removed
    res.status(500).json({ error: "Failed to load dashboard data" });
  }
});

// Check if user can create booth
router.get("/create", jwtAuthMiddleware, async (req, res) => {
  try {
    const User = require("../models/user");
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const canCreate = await user.canCreateBooth();

    res.json({
      success: true,
      data: {
        canCreate,
        maxBooths: 10,
        currentBooths: user.createdBooths.length,
      },
    });
  } catch (err) {
    // logging removed
    res.status(500).json({ error: "Failed to check creation permissions" });
  }
});

// Find booth by invite code (for join confirmation)
router.get("/join/:code", jwtAuthMiddleware, async (req, res) => {
  try {
    const { code } = req.params;
    const booth = await Booth.findOne({
      inviteCode: code.toUpperCase(),
    }).populate("creator", "name");

    if (!booth) {
      return res.status(404).json({ error: "Invalid invite code" });
    }

    const userId = req.user.id;
    const isMember = booth.isMember(userId);
    // Auto-update booth status based on schedule (open/close)
    try {
      if (typeof booth.updateScheduledStatus === "function") {
        await booth.updateScheduledStatus();
      }
    } catch (e) {
      // logging removed
    }
    const isCreator = booth.creator._id.toString() === userId;

    res.json({
      success: true,
      data: {
        permissions: {
          isCreator,
        },
        booth: {
          id: booth._id,
          boothId: booth.boothId,
          name: booth.name,
          description: booth.description,
          creator: booth.creator,
          memberCount: booth.members.length,
          status: booth.status,
        },
        isMember,
        isCreator,
        code,
      },
    });
  } catch (err) {
    // logging removed
    res.status(500).json({ error: "Failed to process invite code" });
  }
});

// Get booth details for voting/viewing
router.get("/:boothId", jwtAuthMiddleware, async (req, res) => {
  try {
    const { boothId } = req.params;
    const userId = req.user.id;

    const booth = await findBoothByIdOrBoothId(boothId);

    if (!booth) {
      return res.status(404).json({ error: "Booth not found" });
    }

    // Populate after finding
    await booth.populate("creator", "name email");
    await booth.populate("members.user", "name");

    // Auto-update booth status based on schedule
    try {
      if (typeof booth.updateScheduledStatus === "function") {
        await booth.updateScheduledStatus();
      }
    } catch (e) {
      // logging removed
    }

    const isMember = booth.isMember(userId);
    const isCreator = booth.creator._id.toString() === userId;
    const hasVoted = booth.hasUserVoted(userId);

    if (!isMember && !isCreator) {
      return res.status(403).json({
        error:
          "You are not a member of this booth. Please join using an invite code.",
      });
    }

    const votingStatus = booth.isVotingAllowed();
    const stats = booth.getStats();

    res.json({
      success: true,
      data: {
        booth: {
          id: booth._id,
          boothId: booth.boothId, // Include public boothId in response
          name: booth.name,
          description: booth.description,
          creator: booth.creator,
          candidates: booth.candidates,
          members: booth.members,
          memberCount: booth.members.length,
          maxMembers: booth.maxMembers,
          settings: booth.settings,
          status: booth.status,
          createdAt: booth.createdAt,
          inviteCode: isCreator ? booth.inviteCode : undefined,
          inviteLink: isCreator
            ? `${req.protocol}://${req.get("host")}/booth/join/${booth.inviteCode}`
            : undefined,
          totalVotes: booth.totalVotes,
        },
        permissions: {
          isCreator,
          isMember,
          hasVoted,
          // allowVoteChange removed: users cannot change votes once cast
          canVote: votingStatus.allowed && !hasVoted,
        },
        votingStatus,
        stats,
      },
    });
  } catch (err) {
    // logging removed
    res.status(500).json({ error: "Failed to load booth details" });
  }
});

// Get booth results
router.get("/:boothId/results", jwtAuthMiddleware, async (req, res) => {
  try {
    const { boothId } = req.params;
    const userId = req.user.id;

    const booth = await findBoothByIdOrBoothId(boothId);

    if (!booth) {
      return res.status(404).json({ error: "Booth not found" });
    }

    await booth.populate("creator", "name");

    const isCreator = booth.creator._id.toString() === userId;
    const isMember = booth.isMember(userId);

    // Check permissions
    if (!isCreator && !booth.settings.resultsVisibleToVoters) {
      return res.status(403).json({
        error: "Results are not visible to voters",
      });
    }

    if (!isCreator && !isMember) {
      return res.status(403).json({
        error: "You must be a member to view results",
      });
    }

    const totalVotes = booth.candidates.reduce(
      (sum, c) => sum + c.voteCount,
      0,
    );
    const stats = booth.getStats();

    const candidatesWithPercentage = booth.candidates.map((c) => ({
      ...c.toObject(),
      percentage:
        totalVotes > 0
          ? Math.round((c.voteCount / totalVotes) * 100 * 100) / 100
          : 0,
    }));

    res.json({
      success: true,
      data: {
        booth: {
          id: booth._id,
          boothId: booth.boothId,
          name: booth.name,
          description: booth.description,
          creator: booth.creator,
        },
        results: {
          candidates: candidatesWithPercentage,
          totalVotes,
          stats,
        },
        permissions: {
          isCreator,
        },
      },
    });
  } catch (err) {
    // logging removed
    res.status(500).json({ error: "Failed to load results" });
  }
});

// Get admin panel data
router.get("/:boothId/admin", jwtAuthMiddleware, async (req, res) => {
  try {
    const { boothId } = req.params;
    const userId = req.user.id;

    const booth = await findBoothByIdOrBoothId(boothId);

    if (!booth) {
      return res.status(404).json({ error: "Booth not found" });
    }

    await booth.populate("members.user", "name email");
    await booth.populate("creator", "name email");
    await booth.populate("pendingRequests.user", "name email");

    if (booth.creator._id.toString() !== userId) {
      return res.status(403).json({
        error: "Only booth creator can access admin panel",
      });
    }
    // Auto-update booth status based on schedule (admin view should reflect current status)
    try {
      if (typeof booth.updateScheduledStatus === "function") {
        await booth.updateScheduledStatus();
      }
    } catch (e) {
      // logging removed
    }

    const voteCount = await Vote.countDocuments({ booth: booth._id });
    const stats = booth.getStats();

    // Get recent votes for audit
    const recentVotes = await Vote.find({ booth: booth._id })
      .populate("voter", "name email")
      .sort({ votedAt: -1 })
      .limit(10);

    res.json({
      success: true,
      data: {
        permissions: {
          isCreator: true,
        },
        booth: {
          id: booth._id,
          boothId: booth.boothId,
          name: booth.name,
          description: booth.description,
          creator: booth.creator,
          members: booth.members,
          candidates: booth.candidates,
          pendingRequests: booth.pendingRequests,
          settings: booth.settings,
          status: booth.status,
          inviteCode: booth.inviteCode,
          createdAt: booth.createdAt,
          totalVotes: booth.totalVotes,
        },
        analytics: {
          voteCount,
          stats,
          recentVotes: recentVotes.map((vote) => ({
            id: vote._id,
            voter: vote.voter,
            candidate: vote.candidate,
            votedAt: vote.votedAt,
          })),
        },
        inviteLink: `${req.protocol}://${req.get("host")}/booth/join/${booth.inviteCode}`,
      },
    });
  } catch (err) {
    // logging removed
    res.status(500).json({ error: "Failed to load admin panel data" });
  }
});

// Export booth data (JSON format for API)
router.get("/:boothId/export", jwtAuthMiddleware, async (req, res) => {
  try {
    const { boothId } = req.params;
    const userId = req.user.id;

    const booth = await findBoothByIdOrBoothId(boothId);

    if (!booth) {
      return res.status(404).json({ error: "Booth not found" });
    }

    await booth.populate("creator", "name email");
    await booth.populate("members.user", "name email");

    if (booth.creator._id.toString() !== userId) {
      return res
        .status(403)
        .json({ error: "Only booth creator can export data" });
    }

    const votes = await Vote.find({ booth: booth._id })
      .populate("voter", "name email")
      .sort({ votedAt: -1 });

    const data = {
      booth: {
        id: booth._id,
        boothId: booth.boothId,
        name: booth.name,
        description: booth.description,
        createdAt: booth.createdAt,
        totalVotes: booth.totalVotes,
        status: booth.status,
      },
      candidates: booth.candidates.map((c) => ({
        name: c.name,
        description: c.description,
        voteCount: c.voteCount,
        percentage:
          booth.totalVotes > 0
            ? ((c.voteCount / booth.totalVotes) * 100).toFixed(2)
            : "0.00",
      })),
      members: booth.members.map((m) => ({
        name: m.user.name,
        email: m.user.email,
        joinedAt: m.joinedAt,
      })),
      votes: votes.map((v) => ({
        voter: {
          name: v.voter.name,
          email: v.voter.email,
        },
        candidate: v.candidate,
        votedAt: v.votedAt,
      })),
      statistics: booth.getStats(),
      exportedAt: new Date().toISOString(),
    };

    res.json({
      success: true,
      data,
    });
  } catch (err) {
    // logging removed
    res.status(500).json({ error: "Failed to export booth data" });
  }
});

// Remove member (admin only)
router.delete(
  "/:boothId/members/:memberId",
  jwtAuthMiddleware,
  async (req, res) => {
    try {
      const { boothId, memberId } = req.params;
      const userId = req.user.id;

      const booth = await findBoothByIdOrBoothId(boothId);

      if (!booth) {
        return res.status(404).json({ error: "Booth not found" });
      }

      if (booth.creator.toString() !== userId) {
        return res
          .status(403)
          .json({ error: "Only booth creator can remove members" });
      }

      if (memberId === userId) {
        return res.status(400).json({ error: "Cannot remove yourself" });
      }

      // Find any votes by this member for this booth so we can adjust counts
      const memberVotes = await Vote.find({
        booth: booth._id,
        voter: memberId,
      });

      // Remove member from the booth (model method saves and returns updated doc)
      const updatedBooth = await booth.removeMember(memberId);

      // If votes exist, decrement candidate voteCounts and totalVotes on the booth
      if (memberVotes && memberVotes.length > 0) {
        let modified = false;
        for (const v of memberVotes) {
          const idx = v.candidateIndex;
          if (typeof idx === "number" && updatedBooth.candidates[idx]) {
            updatedBooth.candidates[idx].voteCount = Math.max(
              0,
              (updatedBooth.candidates[idx].voteCount || 0) - 1,
            );
            updatedBooth.totalVotes = Math.max(
              0,
              (updatedBooth.totalVotes || 0) - 1,
            );
            modified = true;
          }
        }

        if (modified) {
          await updatedBooth.save();
        }
      }

      // Also remove from user's joined booths
      const User = require("../models/user");
      const removedUser = await User.findById(memberId);
      if (removedUser) {
        removedUser.joinedBooths = removedUser.joinedBooths.filter(
          (id) => id.toString() !== booth._id.toString(),
        );
        await removedUser.save();
      }

      // Finally remove member's Vote documents
      await Vote.deleteMany({ booth: booth._id, voter: memberId });

      await logActivity(
        booth._id,
        userId,
        `Admin removed ${removedUser?.name || "a member"}`,
      );

      res.json({ success: true, message: "Member removed successfully" });
    } catch (err) {
      // logging removed
      res.status(500).json({ error: "Failed to remove member" });
    }
  },
);

// ===== Standard API Routes (from controller) =====

// Create booth
router.post(
  "/create",
  jwtAuthMiddleware,
  createBoothLimiter,
  csrfProtection,
  boothController.createBooth,
);

// Join booth (via code)
router.post(
  "/join/:code",
  jwtAuthMiddleware,
  joinBoothLimiter,
  csrfProtection,
  boothController.joinBooth,
);

// Vote
router.post(
  "/:boothId/vote",
  jwtAuthMiddleware,
  voteLimiter,
  csrfProtection,
  boothController.vote,
);

// Reset invite code
router.post(
  "/:boothId/reset-code",
  jwtAuthMiddleware,
  boothController.resetInviteCode,
);

// Update booth settings
router.put(
  "/:boothId/settings",
  jwtAuthMiddleware,
  boothController.updateBoothSettings,
);

// Approve or reject pending join requests
router.post(
  "/:boothId/requests/:userId/approve",
  jwtAuthMiddleware,
  boothController.approveJoinRequest,
);
router.post(
  "/:boothId/requests/:userId/reject",
  jwtAuthMiddleware,
  boothController.rejectJoinRequest,
);

// Toggle booth status
router.post(
  "/:boothId/toggle-status",
  jwtAuthMiddleware,
  boothController.toggleBoothStatus,
);

// Delete booth (soft delete)
router.delete("/:boothId", jwtAuthMiddleware, boothController.deleteBooth);

// Edit booth
router.put("/:boothId", jwtAuthMiddleware, boothController.editBooth);

// Also accept POST /:boothId/edit for clients that post edits (keeps compatibility)
router.post("/:boothId/edit", jwtAuthMiddleware, boothController.editBooth);

// Get user's booths (API)
router.get("/user/booths", jwtAuthMiddleware, boothController.getUserBooths);

// Booth activity timeline (admin only)
router.get(
  "/:boothId/activity",
  jwtAuthMiddleware,
  boothController.getBoothActivity,
);

module.exports = router;
