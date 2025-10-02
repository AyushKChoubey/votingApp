// controllers/boothController.js (Complete and Enhanced)
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
                return res.render('booth/create', { 
                    error,
                    success: null,
                    canCreate: false,
                    maxBooths: 5,
                    user: null
                });
            }
            return res.status(404).json({ error });
        }
        
        if (!await user.canCreateBooth()) {
            const error = 'Booth creation limit reached. Upgrade your account to create more booths.';
            if (req.accepts('html')) {
                return res.render('booth/create', { 
                    error,
                    success: null,
                    canCreate: false,
                    maxBooths: user.subscription.maxBooths,
                    user: user
                });
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
                return res.render('booth/create', { 
                    error, 
                    formData: req.body,
                    success: null,
                    canCreate: true,
                    maxBooths: user.subscription.maxBooths,
                    user: user
                });
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
        }
        
        // Always process form data to ensure proper boolean conversion
        // Handle form data - this ensures checkboxes are properly converted to booleans
        const formSettings = {
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
        
        // Merge processed settings with form settings, giving priority to form settings
        processedSettings = { ...processedSettings, ...formSettings };
        
        // Validate time settings
        if (processedSettings.votingStartTime && processedSettings.votingEndTime) {
            if (processedSettings.votingStartTime >= processedSettings.votingEndTime) {
                const error = 'Voting end time must be after start time';
                if (req.accepts('html')) {
                    return res.render('booth/create', { 
                        error, 
                        formData: req.body,
                        success: null,
                        canCreate: true,
                        maxBooths: user.subscription.maxBooths,
                        user: user
                    });
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
                    return res.render('booth/create', { 
                        error, 
                        formData: req.body,
                        success: null,
                        canCreate: true,
                        maxBooths: user.subscription.maxBooths,
                        user: user
                    });
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
            return res.render('booth/create', { 
                error, 
                formData: req.body,
                success: null,
                canCreate: true,
                maxBooths: 5,
                user: null
            });
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

// Get results
exports.getResults = async (req, res) => {
    try {
        const { boothId } = req.params;
        const userId = req.user.id;
        
        if (!validator.isMongoId(boothId)) {
            const error = 'Invalid booth ID';
            return res.status(404).json({ error });
        }
        
        const booth = await Booth.findById(boothId).populate('creator', 'name email');
        
        if (!booth) {
            return res.status(404).json({ error: 'Booth not found' });
        }
        
        const isCreator = booth.creator._id.toString() === userId;
        const isMember = booth.isMember(userId);
        
        // Check permissions to view results
        if (!isCreator && !booth.settings.resultsVisibleToVoters) {
            return res.status(403).json({ error: 'Results are not visible to voters' });
        }
        
        if (!isCreator && !isMember) {
            return res.status(403).json({ error: 'You must be a member to view results' });
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
                percentage: booth.totalVotes > 0 ? 
                    Math.round((candidate.voteCount / booth.totalVotes) * 100 * 100) / 100 : 0
            })),
            votingAllowed: booth.isVotingAllowed(),
            userHasVoted: booth.hasUserVoted(userId),
            isCreator
        };
        
        res.json(results);
    } catch (err) {
        console.error('Get results error:', err);
        res.status(500).json({ error: 'Failed to fetch results' });
    }
};

// Reset invite code
exports.resetInviteCode = async (req, res) => {
    try {
        const { boothId } = req.params;
        const userId = req.user.id;
        
        if (!validator.isMongoId(boothId)) {
            return res.status(404).json({ error: 'Invalid booth ID' });
        }
        
        const booth = await Booth.findById(boothId);
        
        if (!booth) {
            return res.status(404).json({ error: 'Booth not found' });
        }
        
        if (booth.creator.toString() !== userId) {
            return res.status(403).json({ error: 'Only booth creator can reset invite code' });
        }
        
        await booth.generateNewInviteCode();
        
        const inviteLink = `${req.protocol}://${req.get('host')}/booth/join/${booth.inviteCode}`;
        
        res.json({
            message: 'Invite code reset successfully',
            inviteCode: booth.inviteCode,
            inviteLink
        });
    } catch (err) {
        console.error('Reset invite code error:', err);
        res.status(500).json({ error: 'Failed to reset invite code' });
    }
};

// Update booth settings
exports.updateBoothSettings = async (req, res) => {
    try {
        const { boothId } = req.params;
        const userId = req.user.id;
        const settings = req.body;
        
        if (!validator.isMongoId(boothId)) {
            return res.status(404).json({ error: 'Invalid booth ID' });
        }
        
        const booth = await Booth.findById(boothId);
        
        if (!booth) {
            return res.status(404).json({ error: 'Booth not found' });
        }
        
        if (booth.creator.toString() !== userId) {
            return res.status(403).json({ error: 'Only booth creator can update settings' });
        }
        
        // Validate time settings if provided
        if (settings.votingStartTime && settings.votingEndTime) {
            const startTime = new Date(settings.votingStartTime);
            const endTime = new Date(settings.votingEndTime);
            
            if (startTime >= endTime) {
                return res.status(400).json({ error: 'Voting end time must be after start time' });
            }
        }
        
        // Update settings
        booth.settings = { ...booth.settings, ...settings };
        await booth.save();
        
        res.json({
            message: 'Settings updated successfully',
            settings: booth.settings
        });
    } catch (err) {
        console.error('Update booth settings error:', err);
        res.status(500).json({ error: 'Failed to update settings' });
    }
};

// Get booth edit form
exports.getBoothEditForm = async (req, res) => {
    try {
        const { boothId } = req.params;
        const userId = req.user.id;
        
        if (!validator.isMongoId(boothId)) {
            return res.status(404).render('error', { error: 'Invalid booth ID' });
        }
        
        const booth = await Booth.findById(boothId);
        
        if (!booth) {
            return res.status(404).render('error', { error: 'Booth not found' });
        }
        
        if (booth.creator.toString() !== userId) {
            return res.status(403).render('error', { error: 'Only booth creator can edit booth' });
        }
        
        res.render('booth/edit', { booth, error: null, success: null });
    } catch (err) {
        console.error('Get booth edit form error:', err);
        res.status(500).render('error', { error: 'Failed to load edit form' });
    }
};

// Edit booth
exports.editBooth = async (req, res) => {
    try {
        const { boothId } = req.params;
        const userId = req.user.id;
        let { name, description, maxMembers } = req.body;
        
        // Sanitize inputs
        name = name ? name.trim() : '';
        description = description ? description.trim() : '';
        maxMembers = maxMembers ? parseInt(maxMembers) : null;
        
        if (!validator.isMongoId(boothId)) {
            return res.status(404).render('error', { error: 'Invalid booth ID' });
        }
        
        const booth = await Booth.findById(boothId);
        
        if (!booth) {
            return res.status(404).render('error', { error: 'Booth not found' });
        }
        
        if (booth.creator.toString() !== userId) {
            return res.status(403).render('error', { error: 'Only booth creator can edit booth' });
        }
        
        // Validate inputs
        const errors = [];
        
        if (name && !validateBoothName(name)) {
            errors.push('Booth name must be 3-100 characters');
        }
        
        if (description && !validateDescription(description)) {
            errors.push('Description must be 10-500 characters');
        }
        
        if (maxMembers && !validateMaxMembers(maxMembers)) {
            errors.push('Maximum members must be between 2 and 10,000');
        }
        
        // Check if reducing maxMembers below current member count
        if (maxMembers && maxMembers < booth.members.length) {
            errors.push(`Cannot reduce maximum members below current member count (${booth.members.length})`);
        }
        
        if (errors.length > 0) {
            return res.render('booth/edit', { 
                booth, 
                error: errors.join('. '), 
                success: null 
            });
        }
        
        // Update booth
        if (name) booth.name = name;
        if (description) booth.description = description;
        if (maxMembers) booth.maxMembers = maxMembers;
        
        await booth.save();
        
        res.render('booth/edit', { 
            booth, 
            error: null, 
            success: 'Booth updated successfully' 
        });
    } catch (err) {
        console.error('Edit booth error:', err);
        res.status(500).render('error', { error: 'Failed to update booth' });
    }
};

// Delete booth
exports.deleteBooth = async (req, res) => {
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
        
        const booth = await Booth.findById(boothId);
        
        if (!booth) {
            const error = 'Booth not found';
            if (req.accepts('html')) {
                return res.status(404).render('error', { error });
            }
            return res.status(404).json({ error });
        }
        
        if (booth.creator.toString() !== userId) {
            const error = 'Only booth creator can delete booth';
            if (req.accepts('html')) {
                return res.status(403).render('error', { error });
            }
            return res.status(403).json({ error });
        }
        
        // Delete related votes
        await Vote.deleteMany({ booth: boothId });
        
        // Remove booth from users' arrays
        await User.updateMany(
            { $or: [{ createdBooths: boothId }, { joinedBooths: boothId }] },
            { 
                $pull: { 
                    createdBooths: boothId,
                    joinedBooths: boothId 
                }
            }
        );
        
        // Delete the booth
        await Booth.findByIdAndDelete(boothId);
        
        console.log(`Booth deleted: ${booth.name} by user ${userId} at ${new Date().toISOString()}`);
        
        if (req.accepts('html')) {
            return res.redirect('/booth/dashboard?message=booth_deleted');
        }
        
        res.json({ message: 'Booth deleted successfully' });
    } catch (err) {
        console.error('Delete booth error:', err);
        const error = 'Failed to delete booth';
        if (req.accepts('html')) {
            return res.status(500).render('error', { error });
        }
        res.status(500).json({ error });
    }
};

// Toggle booth status
exports.toggleBoothStatus = async (req, res) => {
    try {
        const { boothId } = req.params;
        const userId = req.user.id;
        
        if (!validator.isMongoId(boothId)) {
            return res.status(404).json({ error: 'Invalid booth ID' });
        }
        
        const booth = await Booth.findById(boothId);
        
        if (!booth) {
            return res.status(404).json({ error: 'Booth not found' });
        }
        
        if (booth.creator.toString() !== userId) {
            return res.status(403).json({ error: 'Only booth creator can toggle status' });
        }
        
        // Toggle between active and closed
        const newStatus = booth.status === 'active' ? 'closed' : 'active';
        booth.status = newStatus;
        await booth.save();
        
        res.json({
            message: `Booth status changed to ${newStatus}`,
            status: newStatus
        });
    } catch (err) {
        console.error('Toggle booth status error:', err);
        res.status(500).json({ error: 'Failed to toggle booth status' });
    }
};

// Get user's booths
exports.getUserBooths = async (req, res) => {
    try {
        const userId = req.user.id;
        const { type = 'all' } = req.query; // 'created', 'joined', 'all'
        
        const user = await User.findById(userId);
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        let query = {};
        
        switch (type) {
            case 'created':
                query = { creator: userId };
                break;
            case 'joined':
                query = { 'members.user': userId, creator: { $ne: userId } };
                break;
            case 'all':
            default:
                query = {
                    $or: [
                        { creator: userId },
                        { 'members.user': userId }
                    ]
                };
                break;
        }
        
        const booths = await Booth.find(query)
            .populate('creator', 'name email')
            .select('name description status createdAt memberCount totalVotes inviteCode')
            .sort({ createdAt: -1 });
        
        // Add computed fields
        const boothsWithStats = booths.map(booth => {
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
                    email: isCreator ? booth.creator.email : undefined
                }
            };
        });
        
        res.json({
            booths: boothsWithStats,
            total: boothsWithStats.length
        });
    } catch (err) {
        console.error('Get user booths error:', err);
        res.status(500).json({ error: 'Failed to fetch user booths' });
    }
};