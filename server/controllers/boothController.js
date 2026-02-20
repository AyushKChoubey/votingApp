// controllers/boothController.js (Complete and Enhanced)
const Booth = require("../models/booth");
const User = require("../models/user");
const Vote = require("../models/vote");
const BoothActivity = require("../models/boothActivity");
const logActivity = require("../utils/logActivity");
const validator = require("validator");
const socket = require("../config/socket");
const mongoose = require("mongoose");

// Helper function to find booth by either boothId or MongoDB _id
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

// Input validation helpers
const validateBoothName = (name) => {
  return (
    name &&
    typeof name === "string" &&
    name.trim().length >= 3 &&
    name.trim().length <= 50
  );
};

const validateDescription = (description) => {
  return (
    description &&
    typeof description === "string" &&
    description.trim().length >= 10 &&
    description.trim().length <= 200
  );
};

const validateCandidates = (candidates) => {
  if (!Array.isArray(candidates) || candidates.length < 2) {
    return false;
  }

  return candidates.every(
    (candidate) =>
      candidate.name &&
      typeof candidate.name === "string" &&
      candidate.name.trim().length >= 1 &&
      candidate.name.trim().length <= 100,
  );
};

const validateMaxMembers = (maxMembers) => {
  const num = parseInt(maxMembers);
  return !isNaN(num) && num >= 2 && num <= 10000;
};

// Create a new booth
exports.createBooth = async (req, res) => {
  try {
    let { name, description, candidates, maxMembers, settings } = req.body;
    const userId = req.user.id;

    // Sanitize basic inputs
    name = name ? name.trim() : "";
    description = description ? description.trim() : "";
    maxMembers = parseInt(maxMembers) || 50;

    // Check if user can create more booths
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (!(await user.canCreateBooth())) {
      return res.status(403).json({
        error: "Booth creation limit reached. You can create up to 10 booths.",
        maxBooths: 10,
      });
    }

    // Validate inputs
    const errors = [];

    if (!validateBoothName(name)) {
      errors.push("Booth name must be 3-50 characters");
    }

    if (!validateDescription(description)) {
      errors.push("Description must be 10-200 characters");
    }

    if (!validateMaxMembers(maxMembers)) {
      errors.push("Maximum members must be between 2 and 10,000");
    }

    // Format and validate candidates
    let formattedCandidates = [];

    if (Array.isArray(candidates)) {
      formattedCandidates = candidates
        .map((c) => {
          if (typeof c === "string") {
            return {
              name: c.trim(),
              description: "",
              voteCount: 0,
            };
          } else if (c && typeof c === "object") {
            return {
              name: (c.name || "").trim(),
              description: (c.description || "").trim(),
              voteCount: 0,
            };
          }
          return null;
        })
        .filter((c) => c && c.name);
    } else {
      // Handle form data format
      const candidateKeys = Object.keys(req.body)
        .filter((key) => key.match(/^candidates\[\d+\]\[name\]$/))
        .sort((a, b) => {
          const aIndex = parseInt(a.match(/\[(\d+)\]/)[1]);
          const bIndex = parseInt(b.match(/\[(\d+)\]/)[1]);
          return aIndex - bIndex;
        });

      formattedCandidates = candidateKeys
        .map((nameKey) => {
          const index = nameKey.match(/\[(\d+)\]/)[1];
          const descKey = `candidates[${index}][description]`;
          const name = (req.body[nameKey] || "").trim();

          if (!name) return null;

          return {
            name,
            description: (req.body[descKey] || "").trim(),
            voteCount: 0,
          };
        })
        .filter((c) => c);
    }

    if (!validateCandidates(formattedCandidates)) {
      errors.push("At least 2 valid candidates are required");
    }

    // Validate candidate names are unique
    const candidateNames = formattedCandidates.map((c) => c.name.toLowerCase());
    if (new Set(candidateNames).size !== candidateNames.length) {
      errors.push("Candidate names must be unique");
    }

    if (errors.length > 0) {
      return res.status(400).json({
        error: errors.join(". "),
        formData: req.body,
      });
    }

    // Process settings
    let processedSettings = {};

    if (settings && typeof settings === "string") {
      try {
        processedSettings = JSON.parse(settings);
      } catch (e) {
        processedSettings = {};
      }
    } else if (settings && typeof settings === "object") {
      processedSettings = settings;
    }

    // Always process form data to ensure proper boolean conversion
    // Handle form data - this ensures checkboxes are properly converted to booleans
    const formSettings = {
      // Voting Rules
      resultsVisibleToVoters:
        req.body["settings[resultsVisibleToVoters]"] === "on" ||
        req.body["settings[resultsVisibleToVoters]"] === "true",
      showLiveResults:
        req.body["settings[showLiveResults]"] === "on" ||
        req.body["settings[showLiveResults]"] === "true",

      // Access Control
      // note: requireEmailVerification removed
      requireApproval:
        req.body["settings[requireApproval]"] === "on" ||
        req.body["settings[requireApproval]"] === "true",
      // sendNotifications removed

      // Time Settings
      votingStartTime: req.body["settings[votingStartTime]"]
        ? new Date(req.body["settings[votingStartTime]"])
        : null,
      votingEndTime: req.body["settings[votingEndTime]"]
        ? new Date(req.body["settings[votingEndTime]"])
        : null,

      // Email Domain Restrictions
      allowedEmailDomains: req.body["settings[allowedEmailDomains]"]
        ? req.body["settings[allowedEmailDomains]"]
            .split(",")
            .map((d) => d.trim())
            .filter((d) => d.length > 0)
        : [],
    };

    // Merge processed settings with form settings, giving priority to form settings
    processedSettings = { ...processedSettings, ...formSettings };

    // Validate time settings
    if (processedSettings.votingStartTime && processedSettings.votingEndTime) {
      if (
        processedSettings.votingStartTime >= processedSettings.votingEndTime
      ) {
        return res.status(400).json({
          error: "Voting end time must be after start time",
          formData: req.body,
        });
      }
    }

    // Validate email domains
    if (
      processedSettings.allowedEmailDomains &&
      processedSettings.allowedEmailDomains.length > 0
    ) {
      const invalidDomains = processedSettings.allowedEmailDomains.filter(
        (domain) => {
          const cleanDomain = domain.startsWith("@") ? domain.slice(1) : domain;
          return !validator.isFQDN(cleanDomain);
        },
      );

      if (invalidDomains.length > 0) {
        return res.status(400).json({
          error: `Invalid email domains: ${invalidDomains.join(", ")}`,
          formData: req.body,
        });
      }
    }

    // Create booth
    const booth = new Booth({
      name,
      description,
      creator: userId,
      candidates: formattedCandidates,
      maxMembers,
      settings: processedSettings,
      members: [{ user: userId, hasVoted: false }],
    });

    await booth.save();

    // Update user's created booths
    user.createdBooths.push(booth._id);
    if (!user.joinedBooths.includes(booth._id)) {
      user.joinedBooths.push(booth._id);
    }
    await user.save();

    // Log activity — include admin name and creation time only here
    const createdAt = booth.createdAt
      ? new Date(booth.createdAt).toISOString()
      : new Date().toISOString();
    logActivity(
      booth._id,
      userId,
      `${user.name} created this booth on ${createdAt}`,
    ).catch(err => console.error("Failed to log booth creation activity:", err));

    res.status(201).json({
      success: true,
      message: "Booth created successfully",
      booth: {
        id: booth._id,
        boothId: booth.boothId,
        name: booth.name,
        inviteCode: booth.inviteCode,
        inviteLink: `${req.protocol}://${req.get("host")}/booth/join/${booth.inviteCode}`,
      },
    });
  } catch (err) {
    console.error("Create booth error:", err);
    res.status(500).json({
      error: "Failed to create booth. Please try again.",
      formData: req.body,
    });
  }
};

// Get booth details
exports.getBoothDetails = async (req, res) => {
  try {
    const { boothId } = req.params;
    const userId = req.user.id;

    const booth = await findBoothByIdOrBoothId(boothId);

    if (!booth) {
      const error = "Booth not found";
      if (req.accepts("html")) {
        return res.status(404).render("error", { error });
      }
      return res.status(404).json({ error });
    }

    await booth.populate("creator", "name email");
    await booth.populate("members.user", "name email");

    const isMember = booth.isMember(userId);
    const isCreator = booth.creator._id.toString() === userId;

    if (!isMember && !isCreator) {
      return res
        .status(403)
        .json({ error: "Access denied. You are not a member of this booth." });
    }

    // Prepare response based on user role
    const response = {
      booth: {
        id: booth._id,
        name: booth.name,
        description: booth.description,
        creator: booth.creator,
        memberCount: booth.members.length,
        maxMembers: booth.maxMembers,
        status: booth.status,
        inviteCode: isCreator ? booth.inviteCode : undefined,
        inviteLink: isCreator
          ? `${req.protocol}://${req.get("host")}/booth/join/${booth.inviteCode}`
          : undefined,
        settings: booth.settings,
        candidates: booth.candidates.map((c) => ({
          name: c.name,
          description: c.description,
          voteCount:
            isCreator || booth.settings.resultsVisibleToVoters
              ? c.voteCount
              : undefined,
        })),
        hasVoted: booth.hasUserVoted(userId),
        isCreator,
        votingStatus: booth.isVotingAllowed(),
      },
    };

    if (isCreator) {
      response.booth.members = booth.members;
    }

    res.json(response);
  } catch (err) {
    console.error("Get booth details error:", err);
    const error = "Failed to fetch booth details";
    if (req.accepts("html")) {
      return res.status(500).render("error", { error });
    }
    res.status(500).json({ error });
  }
};

// Join booth using invite code
exports.joinBooth = async (req, res) => {
  try {
    const { code } = req.params;
    const userId = req.user.id;

    // Validate invite code format
    if (!code || !/^[A-Z0-9]{6,8}$/.test(code.toUpperCase())) {
      return res.status(400).json({ error: "Invalid invite code format" });
    }

    const booth = await Booth.findOne({ inviteCode: code.toUpperCase() });

    if (!booth) {
      return res.status(404).json({ error: "Invalid invite code" });
    }

    if (booth.status !== "active") {
      return res
        .status(400)
        .json({ error: "This booth is not accepting new members" });
    }

    // Check if user is already a member
    if (booth.isMember(userId)) {
      return res.json({
        success: true,
        message: "You are already a member of this booth",
        boothId: booth._id,
        boothName: booth.name,
      });
    }

    // Check booth capacity
    if (booth.members.length >= booth.maxMembers) {
      return res.status(400).json({ error: "This booth is full" });
    }

    // If booth requires approval, add a pending request instead of directly joining
    if (booth.settings?.requireApproval) {
      // If already requested, respond accordingly
      try {
        await booth.addPendingRequest(userId);
        const requestingUser = await User.findById(userId).select("name");
        logActivity(
          booth._id,
          userId,
          `${requestingUser?.name || "Someone"} submitted a join request`,
        ).catch(err => console.error("Failed to log join request activity:", err));
        return res.json({
          success: true,
          message: "Join request submitted and pending approval",
        });
      } catch (reqErr) {
        // If duplicate request or other known reason, return friendly message
        return res
          .status(400)
          .json({ error: reqErr.message || "Failed to submit join request" });
      }
    }

    // Check email domain restriction
    if (booth.settings?.allowedEmailDomains?.length > 0) {
      const User = require("../models/user");
      const user = await User.findById(userId);

      if (!user?.email) {
        return res.status(400).json({
          error:
            "User account must have a valid email address to join this booth",
        });
      }

      const userEmailDomain = user.email.split("@")[1];
      const isAllowed = booth.settings.allowedEmailDomains.some(
        (allowedDomain) => {
          const cleanDomain = allowedDomain.startsWith("@")
            ? allowedDomain.slice(1)
            : allowedDomain;
          return cleanDomain.toLowerCase() === userEmailDomain.toLowerCase();
        },
      );

      if (!isAllowed) {
        const domainList = booth.settings.allowedEmailDomains
          .map((d) => (d.startsWith("@") ? d : "@" + d))
          .join(", ");
        return res.status(403).json({
          error: `Only users with ${domainList} email addresses can join this booth`,
        });
      }
    }

    try {
      // Add member (this already saves the booth)
      await booth.addMember(userId);

      // Update user's joined booths
      const User = require("../models/user");
      const user = await User.findById(userId);
      if (!user.joinedBooths.includes(booth._id)) {
        user.joinedBooths.push(booth._id);
        await user.save();
      }

      logActivity(
        booth._id,
        userId,
        `${user?.name || "Someone"} joined the booth`,
      ).catch(err => console.error("Failed to log join booth activity:", err));

      res.json({
        success: true,
        message: "Successfully joined booth",
        boothId: booth._id,
        boothName: booth.name,
      });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  } catch (err) {
    console.error("Join booth error:", err);
    res.status(500).json({ error: "Failed to join booth. Please try again." });
  }
};

// Vote in a booth
exports.vote = async (req, res) => {
  try {
    const { boothId } = req.params;
    const { candidateIndex } = req.body;
    const userId = req.user.id;

    const booth = await findBoothByIdOrBoothId(boothId);

    if (!booth) {
      return res.status(404).json({ error: "Booth not found" });
    }

    // Check voting permissions
    const votingStatus = booth.isVotingAllowed();
    if (!votingStatus.allowed) {
      return res.status(400).json({ error: votingStatus.reason });
    }

    // Check if user is a member
    if (!booth.isMember(userId)) {
      return res.status(403).json({ error: "You must be a member to vote" });
    }

    // Check if user has already voted
    if (booth.hasUserVoted(userId)) {
      return res
        .status(400)
        .json({ error: "You have already voted in this booth" });
    }

    // Validate candidate index
    const candidateIdx = parseInt(candidateIndex);
    if (
      isNaN(candidateIdx) ||
      candidateIdx < 0 ||
      candidateIdx >= booth.candidates.length
    ) {
      return res.status(400).json({ error: "Invalid candidate selection" });
    }

    // Note: vote changes are not supported (legacy setting removed);
    // users who have voted cannot change their vote.

    // Mark user as voted and increment vote count
    await booth.markAsVoted(userId);
    await booth.incrementVote(candidateIdx);

    // Log activity (fire-and-forget)
    const votingUser = await User.findById(userId).select("name");
    logActivity(
      booth._id,
      userId,
      `${votingUser?.name || "Someone"} cast a vote`,
    ).catch(err => console.error("Failed to log vote activity:", err));

    // Create vote record for audit trail
    const vote = new Vote({
      booth: booth._id,
      voter: userId,
      candidateIndex: candidateIdx,
      candidateName: booth.candidates[candidateIdx].name,
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
    });
    await vote.save();

    // Emit live update to any connected clients for this booth (if socket initialized)
    try {
      const io = socket.getIo && socket.getIo();
      if (io) {
        // Send aggregate counts only (no voter-identifying data)
        io.to(`booth:${booth._id}`).emit("vote:update", {
          candidateIndex: candidateIdx,
          candidates: booth.candidates.map((c) => ({
            _id: c._id,
            name: c.name,
            voteCount: c.voteCount,
          })),
          totalVotes: booth.totalVotes,
        });
      }
    } catch (emitErr) {
      // Don't fail the request if emit fails — log and continue
      console.error("Failed to emit vote:update", emitErr);
    }

    res.json({
      success: true,
      message: "Vote recorded successfully",
      candidate: booth.candidates[candidateIdx].name,
    });
  } catch (err) {
    console.error("Vote error:", err);
    res.status(500).json({ error: "Failed to record vote. Please try again." });
  }
};

// Get results
exports.getResults = async (req, res) => {
  try {
    const { boothId } = req.params;
    const userId = req.user.id;

    const booth = await findBoothByIdOrBoothId(boothId);

    if (!booth) {
      return res.status(404).json({ error: "Booth not found" });
    }

    await booth.populate("creator", "name email");

    const isCreator = booth.creator._id.toString() === userId;
    const isMember = booth.isMember(userId);

    // Check permissions to view results
    if (!isCreator && !booth.settings.resultsVisibleToVoters) {
      return res
        .status(403)
        .json({ error: "Results are not visible to voters" });
    }

    if (!isCreator && !isMember) {
      return res
        .status(403)
        .json({ error: "You must be a member to view results" });
    }

    const stats = booth.getStats();

    const results = {
      boothId: booth._id,
      boothName: booth.name,
      status: booth.status,
      totalVotes: booth.totalVotes,
      statistics: stats,
      candidates: booth.candidates.map((candidate, index) => ({
        index,
        name: candidate.name,
        description: candidate.description,
        voteCount: candidate.voteCount,
        percentage:
          booth.totalVotes > 0
            ? Math.round((candidate.voteCount / booth.totalVotes) * 100 * 100) /
              100
            : 0,
      })),
      votingAllowed: booth.isVotingAllowed(),
      userHasVoted: booth.hasUserVoted(userId),
      isCreator,
    };

    res.json(results);
  } catch (err) {
    console.error("Get results error:", err);
    res.status(500).json({ error: "Failed to fetch results" });
  }
};

// Reset invite code
exports.resetInviteCode = async (req, res) => {
  try {
    const { boothId } = req.params;
    const userId = req.user.id;

    const booth = await findBoothByIdOrBoothId(boothId);

    if (!booth) {
      return res.status(404).json({ error: "Booth not found" });
    }

    if (booth.creator.toString() !== userId) {
      return res
        .status(403)
        .json({ error: "Only booth creator can reset invite code" });
    }

    await booth.generateNewInviteCode();

    logActivity(booth._id, userId, "Admin reset the invite code")
      .catch(err => console.error("Failed to log invite code reset activity:", err));

    const inviteLink = `${req.protocol}://${req.get("host")}/booth/join/${booth.inviteCode}`;

    // Return a consistent response shape with success flag
    res.json({
      success: true,
      message: "Invite code reset successfully",
      inviteCode: booth.inviteCode,
      inviteLink,
    });
  } catch (err) {
    console.error("Reset invite code error:", err);
    res.status(500).json({ error: "Failed to reset invite code" });
  }
};

// Update booth settings
exports.updateBoothSettings = async (req, res) => {
  try {
    const { boothId } = req.params;
    const userId = req.user.id;
    const settings = req.body;

    const booth = await findBoothByIdOrBoothId(boothId);

    if (!booth) {
      return res.status(404).json({ error: "Booth not found" });
    }

    if (booth.creator.toString() !== userId) {
      return res
        .status(403)
        .json({ error: "Only booth creator can update settings" });
    }

    // Validate time settings if provided
    if (settings.votingStartTime && settings.votingEndTime) {
      const startTime = new Date(settings.votingStartTime);
      const endTime = new Date(settings.votingEndTime);

      if (startTime >= endTime) {
        return res
          .status(400)
          .json({ error: "Voting end time must be after start time" });
      }
    }

    // Update settings
    booth.settings = { ...booth.settings, ...settings };
    await booth.save();

    logActivity(booth._id, userId, "Admin updated booth settings")
      .catch(err => console.error("Failed to log settings update activity:", err));

    // Return consistent success shape so clients can check `response.success`
    res.json({
      success: true,
      message: "Settings updated successfully",
      settings: booth.settings,
    });
  } catch (err) {
    console.error("Update booth settings error:", err);
    res.status(500).json({ error: "Failed to update settings" });
  }
};

// Get booth edit form
exports.getBoothEditForm = async (req, res) => {
  try {
    const { boothId } = req.params;
    const userId = req.user.id;

    const booth = await findBoothByIdOrBoothId(boothId);

    if (!booth) {
      return res.status(404).render("error", { error: "Booth not found" });
    }

    if (booth.creator.toString() !== userId) {
      return res
        .status(403)
        .render("error", { error: "Only booth creator can edit booth" });
    }

    res.json({
      success: true,
      booth,
    });
  } catch (err) {
    console.error("Get booth edit form error:", err);
    res.status(500).json({ error: "Failed to load edit form" });
  }
};

// Edit booth
exports.editBooth = async (req, res) => {
  try {
    const { boothId } = req.params;
    const userId = req.user.id;
    // accept optional candidates array in body
    let { name, description, maxMembers, candidates } = req.body;

    // Sanitize inputs
    name = name ? name.trim() : "";
    description = description ? description.trim() : "";
    maxMembers = maxMembers ? parseInt(maxMembers) : null;

    const booth = await findBoothByIdOrBoothId(boothId);

    if (!booth) {
      return res.status(404).render("error", { error: "Booth not found" });
    }

    if (booth.creator.toString() !== userId) {
      return res
        .status(403)
        .render("error", { error: "Only booth creator can edit booth" });
    }

    // Validate inputs
    const errors = [];

    if (name && !validateBoothName(name)) {
      errors.push("Booth name must be 3-100 characters");
    }

    if (description && !validateDescription(description)) {
      errors.push("Description must be 10-500 characters");
    }

    if (maxMembers && !validateMaxMembers(maxMembers)) {
      errors.push("Maximum members must be between 2 and 10,000");
    }

    // Check if reducing maxMembers below current member count
    if (maxMembers && maxMembers < booth.members.length) {
      errors.push(
        `Cannot reduce maximum members below current member count (${booth.members.length})`,
      );
    }

    // Handle optional candidates update
    let candidatesToSet = undefined;
    if (typeof candidates !== "undefined") {
      // Accept JSON string or array
      let formattedCandidates = [];
      if (typeof candidates === "string") {
        try {
          formattedCandidates = JSON.parse(candidates);
        } catch (e) {
          formattedCandidates = [];
        }
      } else if (Array.isArray(candidates)) {
        formattedCandidates = candidates;
      } else if (candidates && typeof candidates === "object") {
        // If object (form-like), try to coerce to array
        formattedCandidates = Array.isArray(candidates.items)
          ? candidates.items
          : [];
      }

      // Normalize
      formattedCandidates = formattedCandidates
        .map((c) => ({
          name: (c.name || "").trim(),
          description: (c.description || "").trim(),
          voteCount: c.voteCount ? parseInt(c.voteCount) : 0,
        }))
        .filter((c) => c.name);

      if (!validateCandidates(formattedCandidates)) {
        errors.push("At least 2 valid candidates are required");
      }

      const candidateNames = formattedCandidates.map((c) =>
        c.name.toLowerCase(),
      );
      if (new Set(candidateNames).size !== candidateNames.length) {
        errors.push("Candidate names must be unique");
      }

      // Prevent candidate edits after votes exist
      if (booth.totalVotes && booth.totalVotes > 0) {
        errors.push("Cannot modify candidates after votes have been cast");
      } else {
        candidatesToSet = formattedCandidates;
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({
        error: errors.join(". "),
        booth,
      });
    }

    // Update booth
    if (name) booth.name = name;
    if (description) booth.description = description;
    if (maxMembers) booth.maxMembers = maxMembers;
    if (typeof candidatesToSet !== "undefined") {
      // Reset vote counts to 0 for new candidates (safe because we blocked edits when votes exist)
      booth.candidates = candidatesToSet.map((c) => ({
        name: c.name,
        description: c.description,
        voteCount: 0,
      }));
      booth.totalVotes = 0;
    }

    await booth.save();

    logActivity(booth._id, userId, "Admin updated booth details")
      .catch(err => console.error("Failed to log booth update activity:", err));

    res.json({
      success: true,
      message: "Booth updated successfully",
      booth,
    });
  } catch (err) {
    console.error("Edit booth error:", err);
    res.status(500).json({ error: "Failed to update booth" });
  }
};

// Soft-delete booth — marks isDeleted: true, preserves votes and history
exports.deleteBooth = async (req, res) => {
  try {
    const { boothId } = req.params;
    const userId = req.user.id;

    const booth = await findBoothByIdOrBoothId(boothId);

    if (!booth) {
      const error = "Booth not found";
      if (req.accepts("html")) {
        return res.status(404).render("error", { error });
      }
      return res.status(404).json({ error });
    }

    if (booth.creator.toString() !== userId) {
      const error = "Only booth creator can delete booth";
      if (req.accepts("html")) {
        return res.status(403).render("error", { error });
      }
      return res.status(403).json({ error });
    }

    // Soft delete — votes, members, and analytics are preserved
    booth.isDeleted = true;
    booth.deletedAt = new Date();
    await booth.save();

    logActivity(booth._id, userId, "Admin deleted the booth")
      .catch(err => console.error("Failed to log booth deletion activity:", err));

    res.json({
      success: true,
      message: "Booth deleted successfully",
    });
  } catch (err) {
    console.error("Delete booth error:", err);
    const error = "Failed to delete booth";
    if (req.accepts("html")) {
      return res.status(500).render("error", { error });
    }
    res.status(500).json({ error });
  }
};

// Toggle booth status
exports.toggleBoothStatus = async (req, res) => {
  try {
    const { boothId } = req.params;
    const userId = req.user.id;

    const booth = await findBoothByIdOrBoothId(boothId);

    if (!booth) {
      return res.status(404).json({ error: "Booth not found" });
    }

    if (booth.creator.toString() !== userId) {
      return res
        .status(403)
        .json({ error: "Only booth creator can toggle status" });
    }

    // Toggle between active and closed
    const newStatus = booth.status === "active" ? "closed" : "active";

    // If attempting to reopen, prevent activation if votingEndTime has already passed
    if (
      newStatus === "active" &&
      booth.settings &&
      booth.settings.votingEndTime
    ) {
      const end = new Date(booth.settings.votingEndTime);
      const now = new Date();
      if (now > end) {
        return res.status(400).json({
          success: false,
          error:
            "Voting period has already ended. To reopen voting, update the schedule (new end time) or disable scheduling.",
          code: "SCHEDULE_EXPIRED",
        });
      }
    }

    booth.status = newStatus;
    await booth.save();

    const statusMsg =
      newStatus === "active" ? "Admin started voting" : "Admin closed voting";
    logActivity(booth._id, userId, statusMsg)
      .catch(err => console.error("Failed to log status toggle activity:", err));

    // Return consistent success shape so client handlers can check response.success
    res.json({
      success: true,
      message: `Booth status changed to ${newStatus}`,
      status: newStatus,
    });
  } catch (err) {
    console.error("Toggle booth status error:", err);
    res.status(500).json({ error: "Failed to toggle booth status" });
  }
};

// Approve pending join request (creator only)
exports.approveJoinRequest = async (req, res) => {
  try {
    const { boothId, userId } = req.params;
    const actorId = req.user.id;

    if (!validator.isMongoId(userId)) {
      return res.status(404).json({ error: "Invalid user ID provided" });
    }

    const booth = await findBoothByIdOrBoothId(boothId);
    if (!booth) return res.status(404).json({ error: "Booth not found" });

    if (booth.creator.toString() !== actorId) {
      return res
        .status(403)
        .json({ error: "Only booth creator can approve requests" });
    }

    // Ensure the request exists
    const pending = (booth.pendingRequests || []).some(
      (r) => (r.user._id || r.user).toString() === userId,
    );
    if (!pending) {
      return res
        .status(400)
        .json({ error: "No pending request from this user" });
    }

    // Attempt to add member (this will check capacity and duplicates)
    try {
      await booth.addMember(userId);
    } catch (addErr) {
      return res
        .status(400)
        .json({ error: addErr.message || "Failed to add member" });
    }

    // Remove pending request
    await booth.removePendingRequest(userId);

    // Log activity — look up the approved user's name
    const approvedUser = await User.findById(userId).select("name");
    logActivity(
      booth._id,
      actorId,
      `Admin approved ${approvedUser?.name || "a member"}`,
    ).catch(err => console.error("Failed to log approval activity:", err));

    // Notify the requester via socket (if connected)
    try {
      const io = socket.getIo && socket.getIo();
      if (io) {
        io.to(`user:${userId}`).emit("joinRequest:status", {
          boothId: booth._id,
          boothName: booth.name,
          status: "approved",
          message: "Your join request has been approved.",
        });
      }
    } catch (emitErr) {
      console.error("Failed to emit joinRequest approved event", emitErr);
    }

    res.json({ success: true, message: "Member approved and added" });
  } catch (err) {
    console.error("Approve join request error:", err);
    res.status(500).json({ error: "Failed to approve join request" });
  }
};

// Reject pending join request (creator only)
exports.rejectJoinRequest = async (req, res) => {
  try {
    const { boothId, userId } = req.params;
    const actorId = req.user.id;

    if (!validator.isMongoId(userId)) {
      return res.status(404).json({ error: "Invalid user ID provided" });
    }

    const booth = await findBoothByIdOrBoothId(boothId);
    if (!booth) return res.status(404).json({ error: "Booth not found" });

    if (booth.creator.toString() !== actorId) {
      return res
        .status(403)
        .json({ error: "Only booth creator can reject requests" });
    }

    // Ensure the request exists
    const pending = (booth.pendingRequests || []).some(
      (r) => (r.user._id || r.user).toString() === userId,
    );
    if (!pending) {
      return res
        .status(400)
        .json({ error: "No pending request from this user" });
    }

    await booth.removePendingRequest(userId);

    // Log activity
    const rejectedUser = await User.findById(userId).select("name");
    logActivity(
      booth._id,
      actorId,
      `Admin rejected ${rejectedUser?.name || "a user"}'s join request`,
    ).catch(err => console.error("Failed to log rejection activity:", err));

    // Notify the requester via socket (if connected)
    try {
      const io = socket.getIo && socket.getIo();
      if (io) {
        io.to(`user:${userId}`).emit("joinRequest:status", {
          boothId: booth._id,
          boothName: booth.name,
          status: "rejected",
          message: "Your join request has been rejected.",
        });
      }
    } catch (emitErr) {
      console.error("Failed to emit joinRequest rejected event", emitErr);
    }

    res.json({ success: true, message: "Join request rejected" });
  } catch (err) {
    console.error("Reject join request error:", err);
    res.status(500).json({ error: "Failed to reject join request" });
  }
};

// Get user's booths
exports.getUserBooths = async (req, res) => {
  try {
    const userId = req.user.id;
    const { type = "all" } = req.query; // 'created', 'joined', 'all'

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    let query = {};

    switch (type) {
      case "created":
        query = { creator: userId };
        break;
      case "joined":
        query = { "members.user": userId, creator: { $ne: userId } };
        break;
      case "all":
      default:
        query = {
          $or: [{ creator: userId }, { "members.user": userId }],
        };
        break;
    }

    const booths = await Booth.find(query)
      .populate("creator", "name email")
      .select(
        "name description status createdAt memberCount totalVotes inviteCode",
      )
      .sort({ createdAt: -1 });

    // Add computed fields
    const boothsWithStats = booths.map((booth) => {
      const isCreator = booth.creator._id.toString() === userId;
      const memberCount = booth.members ? booth.members.length : 0;

      return {
        id: booth._id,
        name: booth.name,
        description: booth.description,
        status: booth.status,
        createdAt: booth.createdAt,
        memberCount,
        totalVotes: booth.totalVotes,
        isCreator,
        inviteCode: isCreator ? booth.inviteCode : undefined,
        creator: {
          name: booth.creator.name,
          email: isCreator ? booth.creator.email : undefined,
        },
      };
    });

    res.json({
      booths: boothsWithStats,
      total: boothsWithStats.length,
    });
  } catch (err) {
    console.error("Get user booths error:", err);
    res.status(500).json({ error: "Failed to fetch user booths" });
  }
};

// Legacy direct-invite handler removed — front-end join flow and API are used instead.

// Get booth activity timeline (admin only)
exports.getBoothActivity = async (req, res) => {
  try {
    const { boothId } = req.params;
    const userId = req.user.id;

    const booth = await findBoothByIdOrBoothId(boothId);

    if (!booth) {
      return res.status(404).json({ error: "Booth not found" });
    }

    // Only booth creator (admin) may view the activity log
    if (booth.creator.toString() !== userId) {
      return res
        .status(403)
        .json({ error: "Only booth admins can view the activity log" });
    }

    // Pagination parameters
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 50));
    const skip = (page - 1) * limit;

    // Get total count for pagination metadata
    const totalCount = await BoothActivity.countDocuments({ booth: booth._id });

    const activities = await BoothActivity.find({ booth: booth._id })
      .populate("user", "name")
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip);

    res.json({
      success: true,
      data: { 
        activities,
        pagination: {
          page,
          limit,
          total: totalCount,
          totalPages: Math.ceil(totalCount / limit),
          hasNext: page * limit < totalCount,
          hasPrev: page > 1,
        },
      },
    });
  } catch (err) {
    console.error("Get booth activity error:", err);
    res.status(500).json({ error: "Failed to fetch activity log" });
  }
};
