const express = require('express');
const router = express.Router();
const { jwtAuthMiddleware } = require('../middleware/jwt');
const boothController = require('../controllers/boothControler');
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
                select: 'name description status members inviteCode'
            })
            .populate({
                path: 'joinedBooths',
                select: 'name description status'
            });
        
        res.render('booth/dashboard', { 
            user,
            createdBooths: user.createdBooths,
            joinedBooths: user.joinedBooths
        });
    } catch (err) {
        console.error(err);
        res.status(500).render('error', { error: 'Failed to load dashboard' });
    }
});

// Create booth page
router.get('/create', extractTokenFromCookie, jwtAuthMiddleware, (req, res) => {
    res.render('booth/create');
});

// Join booth page (with code input)
router.get('/join', extractTokenFromCookie, jwtAuthMiddleware, (req, res) => {
    res.render('booth/join', { error: null, success: null });
});

// Join booth via invite link
router.get('/join/:code', extractTokenFromCookie, jwtAuthMiddleware, async (req, res) => {
    try {
        const { code } = req.params;
        const booth = await Booth.findOne({ inviteCode: code.toUpperCase() });
        
        if (!booth) {
            return res.render('booth/join', { 
                error: 'Invalid invite code',
                success: null 
            });
        }
        
        res.render('booth/join-confirm', { 
            booth,
            code,
            error: null
        });
    } catch (err) {
        console.error(err);
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

        // Debug logging
        console.log('Booth access debug:', {
            userId: userId,
            creatorId: booth.creator._id.toString(),
            members: booth.members.map(m => ({
                userId: m.user.toString(),
                hasVoted: m.hasVoted
            }))
        });
        
        const isMember = booth.isMember(userId);
        const isCreator = booth.creator._id.toString() === userId;
        const hasVoted = booth.hasUserVoted(userId);

        console.log('Access check:', { isMember, isCreator, hasVoted });
        
        if (!isMember && !isCreator) {
            console.log('Access denied for user:', userId);
            return res.status(403).render('error', { 
                error: 'You are not a member of this booth' 
            });
        }

        // Now populate members for display
        await booth.populate('members.user', 'name');
        
        res.render('booth/detail', {
            booth,
            isCreator,
            isMember,
            hasVoted,
            user: req.user
        });
    } catch (err) {
        console.error(err);
        res.status(500).render('error', { error: 'Failed to load booth' });
    }
});

// Results page
router.get('/:boothId/results', extractTokenFromCookie, jwtAuthMiddleware, async (req, res) => {
    try {
        const { boothId } = req.params;
        const userId = req.user.id;
        
        const booth = await Booth.findById(boothId);
        
        if (!booth) {
            return res.status(404).render('error', { error: 'Booth not found' });
        }
        
        const isCreator = booth.creator.toString() === userId;
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
        
        res.render('booth/results', {
            booth,
            totalVotes,
            isCreator,
            chartData: JSON.stringify({
                labels: booth.candidates.map(c => c.name),
                data: booth.candidates.map(c => c.voteCount)
            })
        });
    } catch (err) {
        console.error(err);
        res.status(500).render('error', { error: 'Failed to load results' });
    }
});

// Admin panel for booth
router.get('/:boothId/admin', extractTokenFromCookie, jwtAuthMiddleware, async (req, res) => {
    try {
        const { boothId } = req.params;
        const userId = req.user.id;
        
        const booth = await Booth.findById(boothId)
            .populate('members.user', 'name email');
        
        if (!booth) {
            return res.status(404).render('error', { error: 'Booth not found' });
        }
        
        if (booth.creator.toString() !== userId) {
            return res.status(403).render('error', { 
                error: 'Only booth creator can access admin panel' 
            });
        }
        
        const voteCount = await Vote.countDocuments({ booth: boothId });
        
        res.render('booth/admin', {
            booth,
            voteCount,
            inviteLink: `${req.protocol}://${req.get('host')}/booth/join/${booth.inviteCode}`
        });
    } catch (err) {
        console.error(err);
        res.status(500).render('error', { error: 'Failed to load admin panel' });
    }
});

// ===== API Routes =====

// Create booth
router.post('/create', jwtAuthMiddleware, boothController.createBooth);

// Join booth (via code)
router.post('/join/:code', jwtAuthMiddleware, boothController.joinBooth);

// Join booth (via code form)
router.post('/join-by-code', jwtAuthMiddleware, async (req, res) => {
    try {
        const { inviteCode } = req.body;
        if (!inviteCode) {
            return res.render('booth/join', { 
                error: 'Please enter an invite code', 
                success: null 
            });
        }
        
        // Redirect to the join route with the code
        res.redirect(`/booth/join/${inviteCode}`);
    } catch (err) {
        console.error(err);
        res.render('booth/join', { 
            error: 'Failed to process request', 
            success: null 
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
        
        res.json({ success: true, message: 'Member removed successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: 'Failed to remove member' });
    }
});

// Admin booth management routes
router.get('/:boothId/edit', extractTokenFromCookie, jwtAuthMiddleware, boothController.getBoothEditForm);
router.post('/:boothId/edit', extractTokenFromCookie, jwtAuthMiddleware, boothController.editBooth);
router.delete('/:boothId/delete', extractTokenFromCookie, jwtAuthMiddleware, boothController.deleteBooth);
router.post('/:boothId/delete', extractTokenFromCookie, jwtAuthMiddleware, boothController.deleteBooth);
router.post('/:boothId/toggle-status', extractTokenFromCookie, jwtAuthMiddleware, boothController.toggleBoothStatus);

// Get user's booths (API)
router.get('/api/user/booths', jwtAuthMiddleware, boothController.getUserBooths);

module.exports = router;