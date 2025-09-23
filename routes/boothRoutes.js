// routes/boothRoutes.js (Complete and Fixed)
const express = require('express');
const router = express.Router();
const { jwtAuthMiddleware } = require('../middleware/jwt');
const boothController = require('../controllers/boothController'); // Fixed filename
const Booth = require('../models/booth');
const Vote = require('../models/vote');

// Middleware to extract JWT from cookie for SSR pages
const extractTokenFromCookie = (req, res, next) => {
    if (req.cookies && req.cookies.token) {
        req.headers.authorization = 'Bearer ' + req.cookies.token;
    }
    next();
};

// ===== SSR Routes (Pages) =====

// Dashboard - List user's booths
router.get('/dashboard', extractTokenFromCookie, jwtAuthMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const User = require('../models/user');
        
        const user = await User.findById(userId)
            .populate({
                path: 'createdBooths',
                select: 'name description status members inviteCode createdAt totalVotes'
            })
            .populate({
                path: 'joinedBooths',
                select: 'name description status createdAt totalVotes',
                populate: {
                    path: 'creator',
                    select: 'name'
                }
            });

        // Get user statistics
        const stats = await user.getStats();
        
        // Add member counts to booths
        const createdBooths = user.createdBooths.map(booth => ({
            ...booth.toObject(),
            memberCount: booth.members ? booth.members.length : 0
        }));
        
        const joinedBooths = user.joinedBooths.filter(booth => 
            booth.creator && booth.creator._id.toString() !== userId
        );
        
        res.render('booth/dashboard', { 
            user,
            createdBooths,
            joinedBooths,
            stats,
            message: req.query.message
        });
    } catch (err) {
        console.error('Dashboard error:', err);
        res.status(500).render('error', { error: 'Failed to load dashboard' });
    }
});

// Create booth page
router.get('/create', extractTokenFromCookie, jwtAuthMiddleware, async (req, res) => {
    try {
        const user = await require('../models/user').findById(req.user.id);
        
        // Check if user can create more booths
        const canCreate = await user.canCreateBooth();
        
        res.render('booth/create', { 
            error: null, 
            success: null,
            canCreate,
            maxBooths: user.subscription.maxBooths,
            user: user
        });
    } catch (err) {
        console.error('Create booth page error:', err);
        res.status(500).render('error', { 
            error: 'Failed to load create booth page',
            title: 'Error - VoteBooth'
        });
    }
});

// Join booth page (with code input)
router.get('/join', extractTokenFromCookie, jwtAuthMiddleware, (req, res) => {
    res.render('booth/join', { 
        error: null, 
        success: null,
        booth: null 
    });
});

// Join booth via invite link
router.get('/join/:code', extractTokenFromCookie, jwtAuthMiddleware, async (req, res) => {
    try {
        const { code } = req.params;
        const booth = await Booth.findOne({ inviteCode: code.toUpperCase() })
            .populate('creator', 'name');
        
        if (!booth) {
            return res.render('booth/join', { 
                error: 'Invalid invite code',
                success: null,
                booth: null
            });
        }
        
        // Check if user is already a member
        const userId = req.user.id;
        if (booth.isMember(userId)) {
            return res.redirect(`/booth/${booth._id}`);
        }
        
        res.render('booth/join-confirm', { 
            booth,
            code,
            error: null,
            memberCount: booth.members.length
        });
    } catch (err) {
        console.error('Join booth link error:', err);
        res.render('error', { error: 'Failed to process invite link' });
    }
});

// Booth detail/voting page
router.get('/:boothId', extractTokenFromCookie, jwtAuthMiddleware, async (req, res) => {
    try {
        const { boothId } = req.params;
        const userId = req.user.id;
        
        // First get booth without populating members for membership check
        const booth = await Booth.findById(boothId)
            .populate('creator', 'name email');
        
        if (!booth) {
            return res.status(404).render('error', { error: 'Booth not found' });
        }

        const isMember = booth.isMember(userId);
        const isCreator = booth.creator._id.toString() === userId;
        const hasVoted = booth.hasUserVoted(userId);
        
        if (!isMember && !isCreator) {
            return res.status(403).render('error', { 
                error: 'You are not a member of this booth. Please join using an invite code.' 
            });
        }

        // Now populate members for display
        await booth.populate('members.user', 'name');
        
        // Check voting status
        const votingStatus = booth.isVotingAllowed();
        const stats = booth.getStats();
        
        res.render('booth/detail', {
            booth,
            isCreator,
            isMember,
            hasVoted,
            user: req.user,
            votingStatus,
            stats
        });
    } catch (err) {
        console.error('Booth detail error:', err);
        res.status(500).render('error', { error: 'Failed to load booth' });
    }
});

// Results page
router.get('/:boothId/results', extractTokenFromCookie, jwtAuthMiddleware, async (req, res) => {
    try {
        const { boothId } = req.params;
        const userId = req.user.id;
        
        const booth = await Booth.findById(boothId)
            .populate('creator', 'name');
        
        if (!booth) {
            return res.status(404).render('error', { error: 'Booth not found' });
        }
        
        const isCreator = booth.creator._id.toString() === userId;
        const isMember = booth.isMember(userId);
        
        // Check permissions
        if (!isCreator && !booth.settings.resultsVisibleToVoters) {
            return res.status(403).render('error', { 
                error: 'Results are not visible to voters' 
            });
        }
        
        if (!isCreator && !isMember) {
            return res.status(403).render('error', { 
                error: 'You must be a member to view results' 
            });
        }
        
        const totalVotes = booth.candidates.reduce((sum, c) => sum + c.voteCount, 0);
        const stats = booth.getStats();
        
        // Prepare chart data
        const chartData = {
            labels: booth.candidates.map(c => c.name),
            data: booth.candidates.map(c => c.voteCount),
            backgroundColor: [
                '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', 
                '#9966FF', '#FF9F40', '#FF6384', '#C9CBCF'
            ]
        };
        
        res.render('booth/results', {
            booth,
            totalVotes,
            isCreator,
            stats,
            chartData: JSON.stringify(chartData),
            candidatesWithPercentage: booth.candidates.map(c => ({
                ...c.toObject(),
                percentage: totalVotes > 0 ? 
                    Math.round((c.voteCount / totalVotes) * 100 * 100) / 100 : 0
            }))
        });
    } catch (err) {
        console.error('Results page error:', err);
        res.status(500).render('error', { error: 'Failed to load results' });
    }
});

// Admin panel for booth
router.get('/:boothId/admin', extractTokenFromCookie, jwtAuthMiddleware, async (req, res) => {
    try {
        const { boothId } = req.params;
        const userId = req.user.id;
        
        const booth = await Booth.findById(boothId)
            .populate('members.user', 'name email')
            .populate('creator', 'name email');
        
        if (!booth) {
            return res.status(404).render('error', { error: 'Booth not found' });
        }
        
        if (booth.creator._id.toString() !== userId) {
            return res.status(403).render('error', { 
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
        
        res.render('booth/admin', {
            booth,
            voteCount,
            stats,
            recentVotes,
            inviteLink: `${req.protocol}://${req.get('host')}/booth/join/${booth.inviteCode}`,
            message: req.query.message
        });
    } catch (err) {
        console.error('Admin panel error:', err);
        res.status(500).render('error', { error: 'Failed to load admin panel' });
    }
});

// ===== API Routes =====

// Create booth
router.post('/create', extractTokenFromCookie, jwtAuthMiddleware, boothController.createBooth);

// Join booth (via code)
router.post('/join/:code', jwtAuthMiddleware, boothController.joinBooth);

// Join booth (via code form)
router.post('/join-by-code', jwtAuthMiddleware, async (req, res) => {
    try {
        const { inviteCode } = req.body;
        if (!inviteCode) {
            return res.render('booth/join', { 
                error: 'Please enter an invite code', 
                success: null,
                booth: null
            });
        }
        
        // Redirect to the join route with the code
        res.redirect(`/booth/join/${inviteCode.trim().toUpperCase()}`);
    } catch (err) {
        console.error('Join by code error:', err);
        res.render('booth/join', { 
            error: 'Failed to process request', 
            success: null,
            booth: null
        });
    }
});

// Vote
router.post('/:boothId/vote', jwtAuthMiddleware, boothController.vote);

// Get booth details (API)
router.get('/api/:boothId', jwtAuthMiddleware, boothController.getBoothDetails);

// Get results (API)
router.get('/api/:boothId/results', jwtAuthMiddleware, boothController.getResults);

// Reset invite code
router.post('/:boothId/reset-code', jwtAuthMiddleware, boothController.resetInviteCode);

// Update booth settings
router.put('/:boothId/settings', jwtAuthMiddleware, boothController.updateBoothSettings);

// Remove member (admin only)
router.post('/:boothId/remove-member/:memberId', jwtAuthMiddleware, async (req, res) => {
    try {
        const { boothId, memberId } = req.params;
        const userId = req.user.id;
        
        const booth = await Booth.findById(boothId);
        
        if (!booth) {
            return res.status(404).json({ success: false, error: 'Booth not found' });
        }
        
        if (booth.creator.toString() !== userId) {
            return res.status(403).json({ success: false, error: 'Only booth creator can remove members' });
        }
        
        if (memberId === userId) {
            return res.status(400).json({ success: false, error: 'Cannot remove yourself' });
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
        console.error('Remove member error:', err);
        res.status(500).json({ success: false, error: 'Failed to remove member' });
    }
});

// Admin booth management routes
router.get('/:boothId/edit', extractTokenFromCookie, jwtAuthMiddleware, boothController.getBoothEditForm);
router.post('/:boothId/edit', extractTokenFromCookie, jwtAuthMiddleware, boothController.editBooth);
router.delete('/:boothId/delete', jwtAuthMiddleware, boothController.deleteBooth);
router.post('/:boothId/delete', extractTokenFromCookie, jwtAuthMiddleware, boothController.deleteBooth);
router.post('/:boothId/toggle-status', jwtAuthMiddleware, boothController.toggleBoothStatus);

// Get user's booths (API)
router.get('/api/user/booths', jwtAuthMiddleware, boothController.getUserBooths);

// Export booth data (CSV/JSON)
router.get('/:boothId/export/:format', extractTokenFromCookie, jwtAuthMiddleware, async (req, res) => {
    try {
        const { boothId, format } = req.params;
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
        
        if (format === 'csv') {
            const csv = [
                'Candidate,Votes,Percentage',
                ...booth.candidates.map(c => {
                    const percentage = booth.totalVotes > 0 ? 
                        ((c.voteCount / booth.totalVotes) * 100).toFixed(2) : '0.00';
                    return `"${c.name}",${c.voteCount},${percentage}%`;
                })
            ].join('\n');
            
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename="${booth.name}-results.csv"`);
            res.send(csv);
        } else if (format === 'json') {
            const data = {
                booth: {
                    id: booth._id,
                    name: booth.name,
                    description: booth.description,
                    createdAt: booth.createdAt,
                    totalVotes: booth.totalVotes
                },
                candidates: booth.candidates.map(c => ({
                    name: c.name,
                    description: c.description,
                    voteCount: c.voteCount,
                    percentage: booth.totalVotes > 0 ? 
                        ((c.voteCount / booth.totalVotes) * 100).toFixed(2) : '0.00'
                })),
                statistics: booth.getStats(),
                exportedAt: new Date().toISOString()
            };
            
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Content-Disposition', `attachment; filename="${booth.name}-results.json"`);
            res.json(data);
        } else {
            res.status(400).json({ error: 'Invalid export format. Use csv or json.' });
        }
    } catch (err) {
        console.error('Export booth data error:', err);
        res.status(500).json({ error: 'Failed to export booth data' });
    }
});

module.exports = router;