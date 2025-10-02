// routes/boothRoutes-api.js - API-only booth routes for React frontend
const express = require('express');
const router = express.Router();
const boothController = require('../controllers/boothController');
const { jwtAuthMiddleware } = require('../middleware/jwt');
const Booth = require('../models/booth');
const Vote = require('../models/vote');

// ===== API Routes for React Frontend =====

// Get user dashboard data (booth stats)
router.get('/dashboard', jwtAuthMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const User = require('../models/user');
        const user = await User.findById(userId);
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        // Get booths created by user
        const createdBooths = await Booth.find({ creator: userId })
            .sort({ createdAt: -1 });
        
        // Get booths where user is a member
        const joinedBooths = await Booth.find({ 
            'members.user': userId,
            creator: { $ne: userId }
        })
            .populate('creator', 'name')
            .sort({ createdAt: -1 });
        
        // Calculate stats
        const stats = {
            totalBooths: createdBooths.length,
            joinedBooths: joinedBooths.length,
            totalVotes: createdBooths.reduce((sum, booth) => sum + booth.totalVotes, 0),
            activeBooths: createdBooths.filter(b => b.status === 'active').length
        };
        
        res.json({
            success: true,
            data: {
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    subscription: user.subscription
                },
                createdBooths: createdBooths.map(booth => ({
                    id: booth._id,
                    name: booth.name,
                    description: booth.description,
                    status: booth.status,
                    createdAt: booth.createdAt,
                    totalVotes: booth.totalVotes,
                    memberCount: booth.members.length,
                    candidateCount: booth.candidates.length,
                    inviteCode: booth.inviteCode
                })),
                joinedBooths: joinedBooths.map(booth => ({
                    id: booth._id,
                    name: booth.name,
                    description: booth.description,
                    status: booth.status,
                    creator: booth.creator,
                    memberCount: booth.members.length,
                    hasVoted: booth.hasUserVoted(userId)
                })),
                stats
            }
        });
    } catch (err) {
        console.error('Dashboard API error:', err);
        res.status(500).json({ error: 'Failed to load dashboard data' });
    }
});

// Check if user can create booth
router.get('/api/create/check', jwtAuthMiddleware, async (req, res) => {
    try {
        const User = require('../models/user');
        const user = await User.findById(req.user.id);
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        const canCreate = await user.canCreateBooth();
        
        res.json({
            success: true,
            data: {
                canCreate,
                maxBooths: user.subscription.maxBooths,
                currentBooths: user.createdBooths.length
            }
        });
    } catch (err) {
        console.error('Create check API error:', err);
        res.status(500).json({ error: 'Failed to check creation permissions' });
    }
});

// Find booth by invite code (for join confirmation)
router.get('/api/join/:code', jwtAuthMiddleware, async (req, res) => {
    try {
        const { code } = req.params;
        const booth = await Booth.findOne({ inviteCode: code.toUpperCase() })
            .populate('creator', 'name');
        
        if (!booth) {
            return res.status(404).json({ error: 'Invalid invite code' });
        }
        
        const userId = req.user.id;
        const isMember = booth.isMember(userId);
        const isCreator = booth.creator._id.toString() === userId;
        
        res.json({
            success: true,
            data: {
                booth: {
                    id: booth._id,
                    name: booth.name,
                    description: booth.description,
                    creator: booth.creator,
                    memberCount: booth.members.length,
                    status: booth.status
                },
                isMember,
                isCreator,
                code
            }
        });
    } catch (err) {
        console.error('Join code API error:', err);
        res.status(500).json({ error: 'Failed to process invite code' });
    }
});

// Get booth details for voting/viewing
router.get('/api/:boothId', jwtAuthMiddleware, async (req, res) => {
    try {
        const { boothId } = req.params;
        const userId = req.user.id;
        
        const booth = await Booth.findById(boothId)
            .populate('creator', 'name email')
            .populate('members.user', 'name');
        
        if (!booth) {
            return res.status(404).json({ error: 'Booth not found' });
        }

        const isMember = booth.isMember(userId);
        const isCreator = booth.creator._id.toString() === userId;
        const hasVoted = booth.hasUserVoted(userId);
        
        if (!isMember && !isCreator) {
            return res.status(403).json({ 
                error: 'You are not a member of this booth. Please join using an invite code.' 
            });
        }
        
        const votingStatus = booth.isVotingAllowed();
        const stats = booth.getStats();
        
        res.json({
            success: true,
            data: {
                booth: {
                    id: booth._id,
                    name: booth.name,
                    description: booth.description,
                    creator: booth.creator,
                    candidates: booth.candidates,
                    members: booth.members,
                    settings: booth.settings,
                    status: booth.status,
                    createdAt: booth.createdAt,
                    inviteCode: isCreator ? booth.inviteCode : undefined,
                    totalVotes: booth.totalVotes
                },
                permissions: {
                    isCreator,
                    isMember,
                    hasVoted,
                    canVote: votingStatus.allowed && !hasVoted
                },
                votingStatus,
                stats
            }
        });
    } catch (err) {
        console.error('Booth details API error:', err);
        res.status(500).json({ error: 'Failed to load booth details' });
    }
});

// Get booth results
router.get('/api/:boothId/results', jwtAuthMiddleware, async (req, res) => {
    try {
        const { boothId } = req.params;
        const userId = req.user.id;
        
        const booth = await Booth.findById(boothId)
            .populate('creator', 'name');
        
        if (!booth) {
            return res.status(404).json({ error: 'Booth not found' });
        }
        
        const isCreator = booth.creator._id.toString() === userId;
        const isMember = booth.isMember(userId);
        
        // Check permissions
        if (!isCreator && !booth.settings.resultsVisibleToVoters) {
            return res.status(403).json({ 
                error: 'Results are not visible to voters' 
            });
        }
        
        if (!isCreator && !isMember) {
            return res.status(403).json({ 
                error: 'You must be a member to view results' 
            });
        }
        
        const totalVotes = booth.candidates.reduce((sum, c) => sum + c.voteCount, 0);
        const stats = booth.getStats();
        
        const candidatesWithPercentage = booth.candidates.map(c => ({
            ...c.toObject(),
            percentage: totalVotes > 0 ? 
                Math.round((c.voteCount / totalVotes) * 100 * 100) / 100 : 0
        }));
        
        res.json({
            success: true,
            data: {
                booth: {
                    id: booth._id,
                    name: booth.name,
                    description: booth.description,
                    creator: booth.creator
                },
                results: {
                    candidates: candidatesWithPercentage,
                    totalVotes,
                    stats
                },
                permissions: {
                    isCreator
                }
            }
        });
    } catch (err) {
        console.error('Results API error:', err);
        res.status(500).json({ error: 'Failed to load results' });
    }
});

// Get admin panel data
router.get('/api/:boothId/admin', jwtAuthMiddleware, async (req, res) => {
    try {
        const { boothId } = req.params;
        const userId = req.user.id;
        
        const booth = await Booth.findById(boothId)
            .populate('members.user', 'name email')
            .populate('creator', 'name email');
        
        if (!booth) {
            return res.status(404).json({ error: 'Booth not found' });
        }
        
        if (booth.creator._id.toString() !== userId) {
            return res.status(403).json({ 
                error: 'Only booth creator can access admin panel' 
            });
        }
        
        const voteCount = await Vote.countDocuments({ booth: boothId });
        const stats = booth.getStats();
        
        // Get recent votes for audit
        const recentVotes = await Vote.find({ booth: boothId })
            .populate('voter', 'name email')
            .sort({ votedAt: -1 })
            .limit(10);
        
        res.json({
            success: true,
            data: {
                booth: {
                    id: booth._id,
                    name: booth.name,
                    description: booth.description,
                    creator: booth.creator,
                    members: booth.members,
                    candidates: booth.candidates,
                    settings: booth.settings,
                    status: booth.status,
                    inviteCode: booth.inviteCode,
                    createdAt: booth.createdAt,
                    totalVotes: booth.totalVotes
                },
                analytics: {
                    voteCount,
                    stats,
                    recentVotes: recentVotes.map(vote => ({
                        id: vote._id,
                        voter: vote.voter,
                        candidate: vote.candidate,
                        votedAt: vote.votedAt
                    }))
                },
                inviteLink: `${req.protocol}://${req.get('host')}/booth/join/${booth.inviteCode}`
            }
        });
    } catch (err) {
        console.error('Admin panel API error:', err);
        res.status(500).json({ error: 'Failed to load admin panel data' });
    }
});

// Export booth data (JSON format for API)
router.get('/api/:boothId/export', jwtAuthMiddleware, async (req, res) => {
    try {
        const { boothId } = req.params;
        const userId = req.user.id;
        
        const booth = await Booth.findById(boothId)
            .populate('creator', 'name email')
            .populate('members.user', 'name email');
        
        if (!booth) {
            return res.status(404).json({ error: 'Booth not found' });
        }
        
        if (booth.creator._id.toString() !== userId) {
            return res.status(403).json({ error: 'Only booth creator can export data' });
        }
        
        const votes = await Vote.find({ booth: boothId })
            .populate('voter', 'name email')
            .sort({ votedAt: -1 });
        
        const data = {
            booth: {
                id: booth._id,
                name: booth.name,
                description: booth.description,
                createdAt: booth.createdAt,
                totalVotes: booth.totalVotes,
                status: booth.status
            },
            candidates: booth.candidates.map(c => ({
                name: c.name,
                description: c.description,
                voteCount: c.voteCount,
                percentage: booth.totalVotes > 0 ? 
                    ((c.voteCount / booth.totalVotes) * 100).toFixed(2) : '0.00'
            })),
            members: booth.members.map(m => ({
                name: m.user.name,
                email: m.user.email,
                joinedAt: m.joinedAt
            })),
            votes: votes.map(v => ({
                voter: {
                    name: v.voter.name,
                    email: v.voter.email
                },
                candidate: v.candidate,
                votedAt: v.votedAt
            })),
            statistics: booth.getStats(),
            exportedAt: new Date().toISOString()
        };
        
        res.json({
            success: true,
            data
        });
    } catch (err) {
        console.error('Export API error:', err);
        res.status(500).json({ error: 'Failed to export booth data' });
    }
});

// Remove member (admin only)
router.delete('/api/:boothId/members/:memberId', jwtAuthMiddleware, async (req, res) => {
    try {
        const { boothId, memberId } = req.params;
        const userId = req.user.id;
        
        const booth = await Booth.findById(boothId);
        
        if (!booth) {
            return res.status(404).json({ error: 'Booth not found' });
        }
        
        if (booth.creator.toString() !== userId) {
            return res.status(403).json({ error: 'Only booth creator can remove members' });
        }
        
        if (memberId === userId) {
            return res.status(400).json({ error: 'Cannot remove yourself' });
        }
        
        await booth.removeMember(memberId);
        
        // Also remove from user's joined booths
        const User = require('../models/user');
        const user = await User.findById(memberId);
        if (user) {
            user.joinedBooths = user.joinedBooths.filter(id => id.toString() !== boothId);
            await user.save();
        }
        
        // Remove member's votes if any
        await Vote.deleteMany({ booth: boothId, voter: memberId });
        
        res.json({ success: true, message: 'Member removed successfully' });
    } catch (err) {
        console.error('Remove member API error:', err);
        res.status(500).json({ error: 'Failed to remove member' });
    }
});

// ===== Standard API Routes (from controller) =====

// Create booth
router.post('/api/create', jwtAuthMiddleware, boothController.createBooth);

// Join booth (via code)
router.post('/api/join/:code', jwtAuthMiddleware, boothController.joinBooth);

// Vote
router.post('/api/:boothId/vote', jwtAuthMiddleware, boothController.vote);

// Reset invite code
router.post('/api/:boothId/reset-code', jwtAuthMiddleware, boothController.resetInviteCode);

// Update booth settings
router.put('/api/:boothId/settings', jwtAuthMiddleware, boothController.updateBoothSettings);

// Toggle booth status
router.post('/api/:boothId/toggle-status', jwtAuthMiddleware, boothController.toggleBoothStatus);

// Delete booth
router.delete('/api/:boothId', jwtAuthMiddleware, boothController.deleteBooth);

// Edit booth
router.put('/api/:boothId', jwtAuthMiddleware, boothController.editBooth);

// Get user's booths (API)
router.get('/api/user/booths', jwtAuthMiddleware, boothController.getUserBooths);

module.exports = router;