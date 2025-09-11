// controllers/boothController.js (Fixed and Enhanced)
const Booth = require('../models/booth');
const User = require('../models/user');
const Vote = require('../models/vote');
const validator = require('validator');

// Input validation helpers
const validateBoothName = (name) => {
    return name && 
           typeof name === 'string' && 
           name.trim().length >= 3 && 
           name.trim().length <= 100;
};

const validateDescription = (description) => {
    return description && 
           typeof description === 'string' && 
           description.trim().length >= 10 && 
           description.trim().length <= 500;
};

const validateCandidates = (candidates) => {
    if (!Array.isArray(candidates) || candidates.length < 2) {
        return false;
    }
    
    return candidates.every(candidate => 
        candidate.name && 
        typeof candidate.name === 'string' && 
        candidate.name.trim().length >= 1 && 
        candidate.name.trim().length <= 100
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
        name = name ? name.trim() : '';
        description = description ? description.trim() : '';
        maxMembers = maxMembers ? parseInt(maxMembers) : 100;
        
        // Check if user can create more booths
        const user = await User.findById(userId);
        if (!user) {
            const error = 'User not found';
            if (req.accepts('html')) {
                return res.render('booth/create', { error });
            }
            return res.status(404).json({ error });
        }
        
        if (!await user.canCreateBooth()) {
            const error = 'Booth creation limit reached. Upgrade your account to create more booths.';
            if (req.accepts('html')) {
                return res.render('booth/create', { error });
            }
            return res.status(403).json({ error });
        }
        
        // Validate inputs
        const errors = [];
        
        if (!validateBoothName(name)) {
            errors.push('Booth name must be 3-100 characters');
        }
        
        if (!validateDescription(description)) {
            errors.push('Description must be 10-500 characters');
        }
        
        if (!validateMaxMembers(maxMembers)) {
            errors.push('Maximum members must be between 2 and 10,000');
        }
        
        // Format and validate candidates
        let formattedCandidates = [];
        
        if (Array.isArray(candidates)) {
            formattedCandidates = candidates.map(c => {
                if (typeof c === 'string') {
                    return { 
                        name: c.trim(), 
                        description: '', 
                        voteCount: 0 
                    };
                } else if (c && typeof c === 'object') {
                    return {
                        name: (c.name || '').trim(),
                        description: (c.description || '').trim(),
                        voteCount: 0
                    };
                }
                return null;
            }).filter(c => c && c.name);
        } else {
            // Handle form data format
            const candidateKeys = Object.keys(req.body)
                .filter(key => key.match(/^candidates\[\d+\]\[name\]$/))
                .sort((a, b) => {
                    const aIndex = parseInt(a.match(/\[(\d+)\]/)[1]);
                    const bIndex = parseInt(b.match(/\[(\d+)\]/)[1]);
                    return aIndex - bIndex;
                });
            
            formattedCandidates = candidateKeys.map(nameKey => {
                const index = nameKey.match(/\[(\d+)\]/)[1];
                const descKey = `candidates[${index}][description]`;
                const name = (req.body[nameKey] || '').trim();
                
                if (!name) return null;
                
                return {
                    name,
                    description: (req.body[descKey] || '').trim(),
                    voteCount: 0
                };
            }).filter(c => c);
        }
        
        if (!validateCandidates(formattedCandidates)) {
            errors.push('At least 2 valid candidates are required');
        }
        
        // Validate candidate names are unique
        const candidateNames = formattedCandidates.map(c => c.name.toLowerCase());
        if (new Set(candidateNames).size !== candidateNames.length) {
            errors.push('Candidate names must be unique');
        }
        
        if (errors.length > 0) {
            const error = errors.join('. ');
            if (req.accepts('html')) {
                return res.render('booth/create', { error, formData: req.body });
            }
            return res.status(400).json({ error });
        }
        
        // Process settings
        let processedSettings = {};
        
        if (settings && typeof settings === 'string') {
            try {
                processedSettings = JSON.parse(settings);
            } catch (e) {
                processedSettings = {};
            }
        } else if (settings && typeof settings === 'object') {
            processedSettings = settings;
        } else {
            // Handle form data
            processedSettings = {
                // Voting Rules
                resultsVisibleToVoters: req.body['settings[resultsVisibleToVoters]'] === 'on' || req.body['settings[resultsVisibleToVoters]'] === 'true',
                anonymousVoting: req.body['settings[anonymousVoting]'] === 'on' || req.body['settings[anonymousVoting]'] === 'true',
                allowVoteChange: req.body['settings[allowVoteChange]'] === 'on' || req.body['settings[allowVoteChange]'] === 'true',
                showLiveResults: req.body['settings[showLiveResults]'] === 'on' || req.body['settings[showLiveResults]'] === 'true',
                
                // Access Control
                requireEmailVerification: req.body['settings[requireEmailVerification]'] === 'on' || req.body['settings[requireEmailVerification]'] === 'true',
                requireApproval: req.body['settings[requireApproval]'] === 'on' || req.body['settings[requireApproval]'] === 'true',
                publicBooth: req.body['settings[publicBooth]'] === 'on' || req.body['settings[publicBooth]'] === 'true',
                sendNotifications: req.body['settings[sendNotifications]'] === 'on' || req.body['settings[sendNotifications]'] === 'true',
                
                // Time Settings
                votingStartTime: req.body['settings[votingStartTime]'] ? new Date(req.body['settings[votingStartTime]']) : null,
                votingEndTime: req.body['settings[votingEndTime]'] ? new Date(req.body['settings[votingEndTime]']) : null,
                
                // Email Domain Restrictions
                allowedEmailDomains: req.body['settings[allowedEmailDomains]'] ? 
                    req.body['settings[allowedEmailDomains]']
                        .split(',')
                        .map(d => d.trim())
                        .filter(d => d.length > 0) : []
            };
        }
        
        // Validate time settings
        if (processedSettings.votingStartTime && processedSettings.votingEndTime) {
            if (processedSettings.votingStartTime >= processedSettings.votingEndTime) {
                const error = 'Voting end time must be after start time';
                if (req.accepts('html')) {
                    return res.render('booth/create', { error, formData: req.body });
                }
                return res.status(400).json({ error });
            }
        }
        
        // Validate email domains
        if (processedSettings.allowedEmailDomains && processedSettings.allowedEmailDomains.length > 0) {
            const invalidDomains = processedSettings.allowedEmailDomains.filter(domain => {
                const cleanDomain = domain.startsWith('@') ? domain.slice(1) : domain;
                return !validator.isFQDN(cleanDomain);
            });
            
            if (invalidDomains.length > 0) {
                const error = `Invalid email domains: ${invalidDomains.join(', ')}`;
                if (req.accepts('html')) {
                    return res.render('booth/create', { error, formData: req.body });
                }
                return res.status(400).json({ error });
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
            members: [{ user: userId, hasVoted: false }]
        });
        
        await booth.save();
        
        // Update user's created booths
        user.createdBooths.push(booth._id);
        if (!user.joinedBooths.includes(booth._id)) {
            user.joinedBooths.push(booth._id);
        }
        await user.save();
        
        // Log booth creation
        console.log(`Booth created: ${booth.name} by ${user.email} at ${new Date().toISOString()}`);
        
        if (req.accepts('html')) {
            return res.redirect(`/booth/${booth._id}/admin`);
        }
        
        res.status(201).json({
            message: 'Booth created successfully',
            booth: {
                id: booth._id,
                name: booth.name,
                inviteCode: booth.inviteCode,
                inviteLink: `${req.protocol}://${req.get('host')}/booth/join/${booth.inviteCode}`
            }
        });
    } catch (err) {
        console.error('Create booth error:', err);
        const error = 'Failed to create booth. Please try again.';
        if (req.accepts('html')) {
            return res.render('booth/create', { error, formData: req.body });
        }
        res.status(500).json({ error });
    }
};

// Get booth details
exports.getBoothDetails = async (req, res) => {
    try {
        const { boothId } = req.params;
        const userId = req.user.id;
        
        if (!validator.isMongoId(boothId)) {
            const error = 'Invalid booth ID';
            if (req.accepts('html')) {
                return res.status(404).render('error', { error });
            }
            return res.status(404).json({ error });
        }
        
        const booth = await Booth.findById(boothId)
            .populate('creator', 'name email')
            .populate('members.user', 'name email');
        
        if (!booth) {
            const error = 'Booth not found';
            if (req.accepts('html')) {
                return res.status(404).render('error', { error });
            }
            return res.status(404).json({ error });
        }
        
        const isMember = booth.isMember(userId);
        const isCreator = booth.creator._id.toString() === userId;
        
        if (!isMember && !isCreator) {
            const error = 'Access denied. You are not a member of this booth.';
            if (req.accepts('html')) {
                return res.status(403).render('error', { error });
            }
            return res.status(403).json({ error });
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
                inviteLink: isCreator ? `${req.protocol}://${req.get('host')}/booth/join/${booth.inviteCode}` : undefined,
                settings: booth.settings,
                candidates: booth.candidates.map(c => ({
                    name: c.name,
                    description: c.description,
                    voteCount: (isCreator || booth.settings.resultsVisibleToVoters) ? c.voteCount : undefined
                })),
                hasVoted: booth.hasUserVoted(userId),
                isCreator,
                votingStatus: booth.isVotingAllowed()
            }
        };
        
        if (isCreator) {
            response.booth.members = booth.members;
        }
        
        if (req.accepts('html')) {
            return res.render('booth/detail', response.booth);
        }
        
        res.json(response);
    } catch (err) {
        console.error('Get booth details error:', err);
        const error = 'Failed to fetch booth details';
        if (req.accepts('html')) {
            return res.status(500).render('error', { error });
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
            const error = 'Invalid invite code format';
            if (req.accepts('html')) {
                return res.render('booth/join', { error, success: null });
            }
            return res.status(400).json({ error });
        }
        
        const booth = await Booth.findOne({ inviteCode: code.toUpperCase() });
        
        if (!booth) {
            const error = 'Invalid invite code';
            if (req.accepts('html')) {
                return res.render('booth/join', { error, success: null });
            }
            return res.status(404).json({ error });
        }
        
        if (booth.status !== 'active') {
            const error = 'This booth is not accepting new members';
            if (req.accepts('html')) {
                return res.render('booth/join', { error, success: null });
            }
            return res.status(400).json({ error });
        }
        
        // Check if user is already a member
        if (booth.isMember(userId)) {
            if (req.accepts('html')) {
                return res.redirect(`/booth/${booth._id}`);
            }
            return res.json({ 
                message: 'You are already a member of this booth',
                boothId: booth._id,
                boothName: booth.name
            });
        }
        
        // Check booth capacity
        if (booth.members.length >= booth.maxMembers) {
            const error = 'This booth is full';
            if (req.accepts('html')) {
                return res.render('booth/join', { error, success: null });
            }
            return res.status(400).json({ error });
        }
        
        // Check email domain restriction
        if (booth.settings?.allowedEmailDomains?.length > 0) {
            const user = await User.findById(userId);
            
            if (!user?.email) {
                const error = 'User account must have a valid email address to join this booth';
                if (req.accepts('html')) {
                    return res.render('booth/join', { error, success: null });
                }
                return res.status(400).json({ error });
            }
            
            const userEmailDomain = user.email.split('@')[1];
            const isAllowed = booth.settings.allowedEmailDomains.some(allowedDomain => {
                const cleanDomain = allowedDomain.startsWith('@') ? 
                    allowedDomain.slice(1) : allowedDomain;
                return cleanDomain.toLowerCase() === userEmailDomain.toLowerCase();
            });
            
            if (!isAllowed) {
                const domainList = booth.settings.allowedEmailDomains
                    .map(d => d.startsWith('@') ? d : '@' + d)
                    .join(', ');
                const error = `Only users with ${domainList} email addresses can join this booth`;
                if (req.accepts('html')) {
                    return res.render('booth/join', { error, success: null });
                }
                return res.status(403).json({ error });
            }
        }
        
        try {
            await booth.addMember(userId);
            
            // Update user's joined booths
            const user = await User.findById(userId);
            if (!user.joinedBooths.includes(booth._id)) {
                user.joinedBooths.push(booth._id);
                await user.save();
            }
            
            // Log successful join
            console.log(`User joined booth: ${user.email} joined ${booth.name} at ${new Date().toISOString()}`);
            
            if (req.accepts('html')) {
                return res.redirect(`/booth/${booth._id}`);
            }
            
            res.json({ 
                message: 'Successfully joined booth',
                boothId: booth._id,
                boothName: booth.name
            });
        } catch (err) {
            const error = err.message;
            if (req.accepts('html')) {
                return res.render('booth/join', { error, success: null });
            }
            res.status(400).json({ error });
        }
    } catch (err) {
        console.error('Join booth error:', err);
        const error = 'Failed to join booth. Please try again.';
        if (req.accepts('html')) {
            return res.render('booth/join', { error, success: null });
        }
        res.status(500).json({ error });
    }
};

// Vote in a booth
exports.vote = async (req, res) => {
    try {
        const { boothId } = req.params;
        const { candidateIndex } = req.body;
        const userId = req.user.id;
        
        if (!validator.isMongoId(boothId)) {
            const error = 'Invalid booth ID';
            if (req.accepts('html')) {
                return res.status(404).render('error', { error });
            }
            return res.status(404).json({ error });
        }
        
        const booth = await Booth.findById(boothId);
        
        if (!booth) {
            const error = 'Booth not found';
            if (req.accepts('html')) {
                return res.status(404).render('error', { error });
            }
            return res.status(404).json({ error });
        }
        
        // Check voting permissions
        const votingStatus = booth.isVotingAllowed();
        if (!votingStatus.allowed) {
            if (req.accepts('html')) {
                return res.status(400).render('error', { error: votingStatus.reason });
            }
            return res.status(400).json({ error: votingStatus.reason });
        }
        
        // Check if user is a member
        if (!booth.isMember(userId)) {
            const error = 'You must be a member to vote';
            if (req.accepts('html')) {
                return res.status(403).render('error', { error });
            }
            return res.status(403).json({ error });
        }
        
        // Check if user has already voted
        if (booth.hasUserVoted(userId) && !booth.settings.allowVoteChange) {
            const error = 'You have already voted in this booth';
            if (req.accepts('html')) {
                return res.status(400).render('error', { error });
            }
            return res.status(400).json({ error });
        }
        
        // Validate candidate index
        const candidateIdx = parseInt(candidateIndex);
        if (isNaN(candidateIdx) || candidateIdx < 0 || candidateIdx >= booth.candidates.length) {
            const error = 'Invalid candidate selection';
            if (req.accepts('html')) {
                return res.status(400).render('error', { error });
            }
            return res.status(400).json({ error });
        }
        
        // Handle vote change
        if (booth.hasUserVoted(userId) && booth.settings.allowVoteChange) {
            // Find and remove previous vote
            const previousVote = await Vote.findOne({ booth: boothId, voter: userId });
            if (previousVote) {
                // Decrement previous candidate's vote count
                if (previousVote.candidateIndex < booth.candidates.length) {
                    booth.candidates[previousVote.candidateIndex].voteCount = 
                        Math.max(0, booth.candidates[previousVote.candidateIndex].voteCount - 1);
                    booth.totalVotes = Math.max(0, booth.totalVotes - 1);
                }
                await Vote.deleteOne({ _id: previousVote._id });
            }
        }
        
        // Mark user as voted and increment vote count
        await booth.markAsVoted(userId);
        await booth.incrementVote(candidateIdx);
        
        // Create vote record for audit trail
        const vote = new Vote({
            booth: boothId,
            voter: userId,
            candidateIndex: candidateIdx,
            candidateName: booth.candidates[candidateIdx].name,
            ipAddress: req.ip,
            userAgent: req.get('user-agent')
        });
        await vote.save();
        
        // Log vote
        console.log(`Vote cast: User ${userId} voted for ${booth.candidates[candidateIdx].name} in booth ${booth.name} at ${new Date().toISOString()}`);
        
        if (req.accepts('html')) {
            return res.redirect(`/booth/${boothId}/results`);
        }
        
        res.json({ 
            message: 'Vote recorded successfully',
            candidate: booth.candidates[candidateIdx].name
        });
    } catch (err) {
        console.error('Vote error:', err);
        const error = 'Failed to record vote. Please try again.';
        if (req.accepts('html')) {
            return res.status(500).render('error', { error });
        }
        res.status(500).json({ error });
    }
};

// Continue with other methods...
// [Additional methods like getResults, resetInviteCode, etc. would follow the same pattern]