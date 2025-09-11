const Booth = require('../models/booth');
const User = require('../models/user');
const Vote = require('../models/vote');

// Create a new booth
exports.createBooth = async (req, res) => {
    try {
        const { name, description, candidates, maxMembers, settings } = req.body;
        const userId = req.user.id;
        
        // Check if user can create more booths
        const user = await User.findById(userId);
        if (!await user.canCreateBooth()) {
            const error = 'Booth creation limit reached. Upgrade your account to create more booths.';
            if (req.accepts('html')) {
                return res.render('booth/create', { error });
            }
            return res.status(403).json({ error });
        }
        
        // Validate input
        if (!name || !description || !candidates) {
            const error = 'Name, description, and candidates are required';
            if (req.accepts('html')) {
                return res.render('booth/create', { error });
            }
            return res.status(400).json({ error });
        }
        
        // Format candidates - handle both object and string formats
        let formattedCandidates = [];
        if (Array.isArray(candidates)) {
            formattedCandidates = candidates.map(c => {
                if (typeof c === 'string') {
                    return { name: c, description: '', voteCount: 0 };
                } else {
                    return {
                        name: c.name || '',
                        description: c.description || '',
                        voteCount: 0
                    };
                }
            });
        } else {
            // Handle form data format where candidates come as candidates[0][name], etc.
            const candidateNames = Object.keys(req.body)
                .filter(key => key.match(/^candidates\[\d+\]\[name\]$/))
                .sort();
            
            formattedCandidates = candidateNames.map((nameKey, index) => {
                const descKey = `candidates[${index}][description]`;
                return {
                    name: req.body[nameKey],
                    description: req.body[descKey] || '',
                    voteCount: 0
                };
            });
        }
        
        // Validate candidates
        if (formattedCandidates.length < 2) {
            const error = 'At least 2 candidates are required';
            if (req.accepts('html')) {
                return res.render('booth/create', { error });
            }
            return res.status(400).json({ error });
        }
        
        // Process settings - handle both JSON API and form data
        let processedSettings = {};
        
        // Check if settings came as a JSON string (API request)
        if (settings && typeof settings === 'string') {
            try {
                processedSettings = JSON.parse(settings);
            } catch (e) {
                processedSettings = {};
            }
        } 
        // Check if settings came as an object (parsed JSON)
        else if (settings && typeof settings === 'object') {
            processedSettings = settings;
        } 
        // Handle form data (HTML form submission)
        else {
            processedSettings = {
                // Voting Rules
                resultsVisibleToVoters: req.body['settings[resultsVisibleToVoters]'] === 'on',
                anonymousVoting: req.body['settings[anonymousVoting]'] === 'on',
                allowVoteChange: req.body['settings[allowVoteChange]'] === 'on',
                showLiveResults: req.body['settings[showLiveResults]'] === 'on',
                
                // Access Control
                requireEmailVerification: req.body['settings[requireEmailVerification]'] === 'on',
                requireApproval: req.body['settings[requireApproval]'] === 'on',
                publicBooth: req.body['settings[publicBooth]'] === 'on',
                sendNotifications: req.body['settings[sendNotifications]'] === 'on',
                
                // Time Settings
                votingStartTime: req.body['settings[votingStartTime]'] ? new Date(req.body['settings[votingStartTime]']) : null,
                votingEndTime: req.body['settings[votingEndTime]'] ? new Date(req.body['settings[votingEndTime]']) : null,
                
                // Email Domain Restrictions
                allowedEmailDomains: req.body['settings[allowedEmailDomains]'] ? 
                    req.body['settings[allowedEmailDomains]'].split(',').map(d => d.trim()).filter(d => d.length > 0) : []
            };
        }
        
        // Ensure all boolean values are properly converted
        processedSettings.resultsVisibleToVoters = Boolean(processedSettings.resultsVisibleToVoters);
        processedSettings.anonymousVoting = Boolean(processedSettings.anonymousVoting);
        processedSettings.allowVoteChange = Boolean(processedSettings.allowVoteChange);
        processedSettings.showLiveResults = Boolean(processedSettings.showLiveResults);
        processedSettings.requireEmailVerification = Boolean(processedSettings.requireEmailVerification);
        processedSettings.requireApproval = Boolean(processedSettings.requireApproval);
        processedSettings.publicBooth = Boolean(processedSettings.publicBooth);
        processedSettings.sendNotifications = Boolean(processedSettings.sendNotifications);
        
        // Create booth
        const booth = new Booth({
            name: name.trim(),
            description: description.trim(),
            creator: userId,
            candidates: formattedCandidates,
            maxMembers: parseInt(maxMembers) || 100,
            settings: processedSettings,
            members: [{ user: userId, hasVoted: false }] // Creator is automatically a member
        });
        
        await booth.save();
        
        // Update user's created booths
        user.createdBooths.push(booth._id);
        if (!user.joinedBooths.includes(booth._id)) {
            user.joinedBooths.push(booth._id);
        }
        await user.save();
        
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
        console.error(err);
        if (req.accepts('html')) {
            return res.render('booth/create', { error: 'Failed to create booth' });
        }
        res.status(500).json({ error: 'Failed to create booth' });
    }
};

// Get booth details
exports.getBoothDetails = async (req, res) => {
    try {
        const { boothId } = req.params;
        const userId = req.user.id;
        
        const booth = await Booth.findById(boothId)
            .populate('creator', 'name email')
            .populate('members.user', 'name email');
        
        if (!booth) {
            return res.status(404).json({ error: 'Booth not found' });
        }
        
        // Check if user is a member
        const isMember = booth.isMember(userId);
        const isCreator = booth.creator._id.toString() === userId;
        
        if (!isMember && !isCreator) {
            return res.status(403).json({ error: 'Access denied. You are not a member of this booth.' });
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
                isCreator
            }
        };
        
        if (isCreator) {
            response.booth.members = booth.members;
        }
        
        res.json(response);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch booth details' });
    }
};

// Join booth using invite code
exports.joinBooth = async (req, res) => {
    try {
        const { code } = req.params;
        const userId = req.user.id;
        
        const booth = await Booth.findOne({ inviteCode: code.toUpperCase() });
        
        if (!booth) {
            if (req.accepts('html')) {
                return res.render('booth/join', { 
                    error: 'Invalid invite code', 
                    success: null 
                });
            }
            return res.status(404).json({ error: 'Invalid invite code' });
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
        if (booth.settings && booth.settings.allowedEmailDomains && 
            booth.settings.allowedEmailDomains.length > 0 && 
            booth.settings.allowedEmailDomains.some(domain => domain.trim().length > 0)) {
            
            const user = await User.findById(userId);
            console.log('Email domain check - User:', user?.email, 'Allowed domains:', booth.settings.allowedEmailDomains);
            
            if (!user || !user.email) {
                const error = 'User account must have a valid email address to join this booth';
                if (req.accepts('html')) {
                    return res.render('booth/join', { error, success: null });
                }
                return res.status(400).json({ error });
            }
            
            const userEmailDomain = user.email.split('@')[1];
            const emailDomainWithAt = '@' + userEmailDomain;
            
            // Check if user's email domain is in the allowed list (support both formats: @domain.com and domain.com)
            const isAllowed = booth.settings.allowedEmailDomains.some(allowedDomain => {
                if (!allowedDomain || allowedDomain.trim().length === 0) return false;
                const normalizedAllowed = allowedDomain.startsWith('@') ? allowedDomain : '@' + allowedDomain;
                return normalizedAllowed.toLowerCase() === emailDomainWithAt.toLowerCase();
            });
            
            console.log('Domain check result:', {
                userDomain: emailDomainWithAt,
                allowedDomains: booth.settings.allowedEmailDomains,
                isAllowed
            });
            
            if (!isAllowed) {
                const domainList = booth.settings.allowedEmailDomains
                    .filter(d => d && d.trim().length > 0)
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
            console.log('Adding member to booth:', { boothId: booth._id, userId });
            await booth.addMember(userId);
            
            // Update user's joined booths
            const user = await User.findById(userId);
            if (!user.joinedBooths.includes(booth._id)) {
                user.joinedBooths.push(booth._id);
                await user.save();
            }

            // Verify membership was added
            const updatedBooth = await Booth.findById(booth._id);
            console.log('Membership verification:', {
                isMember: updatedBooth.isMember(userId),
                memberCount: updatedBooth.members.length,
                members: updatedBooth.members.map(m => m.user.toString())
            });
            
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
        console.error(err);
        if (req.accepts('html')) {
            return res.render('booth/join', { 
                error: 'Failed to join booth', 
                success: null 
            });
        }
        res.status(500).json({ error: 'Failed to join booth' });
    }
};

// Vote in a booth
exports.vote = async (req, res) => {
    try {
        const { boothId } = req.params;
        const { candidateIndex } = req.body;
        const userId = req.user.id;
        
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
        
        try {
            // Check if user is a member and hasn't voted
            if (!booth.isMember(userId)) {
                const error = 'You must be a member to vote';
                if (req.accepts('html')) {
                    return res.status(403).render('error', { error });
                }
                return res.status(403).json({ error });
            }
            
            if (booth.hasUserVoted(userId)) {
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
            
            if (req.accepts('html')) {
                return res.redirect(`/booth/${boothId}/results`);
            }
            
            res.json({ 
                message: 'Vote recorded successfully',
                candidate: booth.candidates[candidateIdx].name
            });
        } catch (err) {
            const error = err.message;
            if (req.accepts('html')) {
                return res.status(400).render('error', { error });
            }
            res.status(400).json({ error });
        }
    } catch (err) {
        console.error(err);
        if (req.accepts('html')) {
            return res.status(500).render('error', { error: 'Failed to record vote' });
        }
        res.status(500).json({ error: 'Failed to record vote' });
    }
};

// Get booth results
exports.getResults = async (req, res) => {
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
        
        // Check if user can view results
        if (!isCreator && !booth.settings.resultsVisibleToVoters) {
            return res.status(403).json({ error: 'Results are not visible to voters' });
        }
        
        if (!isCreator && !isMember) {
            return res.status(403).json({ error: 'You must be a member to view results' });
        }
        
        const totalVotes = booth.candidates.reduce((sum, c) => sum + c.voteCount, 0);
        
        const results = {
            booth: {
                name: booth.name,
                description: booth.description,
                totalMembers: booth.members.length,
                totalVotes,
                votingRate: booth.members.length > 0 ? 
                    ((totalVotes / booth.members.length) * 100).toFixed(1) : 0
            },
            candidates: booth.candidates.map(c => ({
                name: c.name,
                description: c.description,
                votes: c.voteCount,
                percentage: totalVotes > 0 ? 
                    ((c.voteCount / totalVotes) * 100).toFixed(1) : 0
            })).sort((a, b) => b.votes - a.votes)
        };
        
        res.json(results);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch results' });
    }
};

// Reset invite code (admin only)
exports.resetInviteCode = async (req, res) => {
    try {
        const { boothId } = req.params;
        const userId = req.user.id;
        
        const booth = await Booth.findById(boothId);
        
        if (!booth) {
            const error = 'Booth not found';
            if (req.accepts('html')) {
                return res.status(404).render('error', { error });
            }
            return res.status(404).json({ error });
        }
        
        if (booth.creator.toString() !== userId) {
            const error = 'Only booth creator can reset invite code';
            if (req.accepts('html')) {
                return res.status(403).render('error', { error });
            }
            return res.status(403).json({ error });
        }
        
        await booth.generateNewInviteCode();
        
        if (req.accepts('html')) {
            return res.redirect(`/booth/${boothId}/admin`);
        }
        
        res.json({ 
            message: 'Invite code reset successfully',
            newCode: booth.inviteCode,
            inviteLink: `${req.protocol}://${req.get('host')}/booth/join/${booth.inviteCode}`
        });
    } catch (err) {
        console.error(err);
        if (req.accepts('html')) {
            return res.status(500).render('error', { error: 'Failed to reset invite code' });
        }
        res.status(500).json({ error: 'Failed to reset invite code' });
    }
};

// Get user's booths
exports.getUserBooths = async (req, res) => {
    try {
        const userId = req.user.id;
        
        const user = await User.findById(userId)
            .populate('createdBooths', 'name description status memberCount')
            .populate('joinedBooths', 'name description status');
        
        const stats = await user.getStats();
        
        res.json({
            stats,
            createdBooths: user.createdBooths,
            joinedBooths: user.joinedBooths
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch user booths' });
    }
};

// Update booth settings (admin only)
exports.updateBoothSettings = async (req, res) => {
    try {
        const { boothId } = req.params;
        const userId = req.user.id;
        const updates = req.body;
        
        const booth = await Booth.findById(boothId);
        
        if (!booth) {
            const error = 'Booth not found';
            if (req.accepts('html')) {
                return res.status(404).render('error', { error });
            }
            return res.status(404).json({ error });
        }
        
        if (booth.creator.toString() !== userId) {
            const error = 'Only booth creator can update settings';
            if (req.accepts('html')) {
                return res.status(403).render('error', { error });
            }
            return res.status(403).json({ error });
        }
        
        // Update allowed fields
        const allowedUpdates = ['name', 'description', 'status', 'maxMembers', 'settings'];
        allowedUpdates.forEach(field => {
            if (updates[field] !== undefined) {
                if (field === 'maxMembers') {
                    booth[field] = parseInt(updates[field]) || booth[field];
                } else {
                    booth[field] = updates[field];
                }
            }
        });
        
        await booth.save();
        
        if (req.accepts('html')) {
            return res.redirect(`/booth/${boothId}/admin`);
        }
        
        res.json({ 
            message: 'Booth updated successfully',
            booth
        });
    } catch (err) {
        console.error(err);
        if (req.accepts('html')) {
            return res.status(500).render('error', { error: 'Failed to update booth' });
        }
        res.status(500).json({ error: 'Failed to update booth' });
    }
};

// Edit booth details (admin only)
exports.editBooth = async (req, res) => {
    try {
        const { boothId } = req.params;
        const { name, description, candidates, maxMembers } = req.body;
        const userId = req.user.id;
        
        const booth = await Booth.findById(boothId);
        if (!booth) {
            const error = 'Booth not found';
            if (req.accepts('html')) {
                return res.status(404).render('error', { error });
            }
            return res.status(404).json({ error });
        }
        
        // Check if user is the creator
        if (booth.creator.toString() !== userId) {
            const error = 'Only the booth creator can edit this booth';
            if (req.accepts('html')) {
                return res.status(403).render('error', { error });
            }
            return res.status(403).json({ error });
        }
        
        // Update booth details
        if (name) booth.name = name.trim();
        if (description) booth.description = description.trim();
        if (maxMembers) booth.maxMembers = parseInt(maxMembers);
        
        // Update candidates if provided
        if (candidates) {
            let formattedCandidates = [];
            
            if (Array.isArray(candidates)) {
                formattedCandidates = candidates.map(candidate => ({
                    name: candidate.name,
                    description: candidate.description || '',
                    voteCount: candidate.voteCount || 0
                }));
            } else if (typeof candidates === 'object') {
                // Handle form data format
                const candidateNames = Object.keys(candidates).filter(key => key.includes('[name]'));
                formattedCandidates = candidateNames.map((nameKey, index) => {
                    const descKey = `candidates[${index}][description]`;
                    return {
                        name: candidates[nameKey],
                        description: candidates[descKey] || '',
                        voteCount: booth.candidates[index]?.voteCount || 0
                    };
                });
            }
            
            if (formattedCandidates.length >= 2) {
                booth.candidates = formattedCandidates;
            }
        }
        
        await booth.save();
        
        if (req.accepts('html')) {
            return res.redirect(`/booth/${boothId}/admin`);
        }
        
        res.json({ 
            message: 'Booth updated successfully',
            booth
        });
    } catch (err) {
        console.error(err);
        if (req.accepts('html')) {
            return res.status(500).render('error', { error: 'Failed to update booth' });
        }
        res.status(500).json({ error: 'Failed to update booth' });
    }
};

// Delete booth (admin only)
exports.deleteBooth = async (req, res) => {
    try {
        const { boothId } = req.params;
        const userId = req.user.id;
        
        const booth = await Booth.findById(boothId);
        if (!booth) {
            const error = 'Booth not found';
            if (req.accepts('html')) {
                return res.status(404).render('error', { error });
            }
            return res.status(404).json({ error });
        }
        
        // Check if user is the creator
        if (booth.creator.toString() !== userId) {
            const error = 'Only the booth creator can delete this booth';
            if (req.accepts('html')) {
                return res.status(403).render('error', { error });
            }
            return res.status(403).json({ error });
        }
        
        // Delete associated votes
        await Vote.deleteMany({ booth: boothId });
        
        // Remove booth from user's arrays
        await User.updateMany(
            { $or: [{ createdBooths: boothId }, { joinedBooths: boothId }] },
            { $pull: { createdBooths: boothId, joinedBooths: boothId } }
        );
        
        // Delete the booth
        await Booth.findByIdAndDelete(boothId);
        
        if (req.accepts('html')) {
            return res.redirect('/booth/dashboard');
        }
        
        res.json({ message: 'Booth deleted successfully' });
    } catch (err) {
        console.error(err);
        if (req.accepts('html')) {
            return res.status(500).render('error', { error: 'Failed to delete booth' });
        }
        res.status(500).json({ error: 'Failed to delete booth' });
    }
};

// Toggle booth status (active/inactive)
exports.toggleBoothStatus = async (req, res) => {
    try {
        const { boothId } = req.params;
        const userId = req.user.id;
        
        const booth = await Booth.findById(boothId);
        if (!booth) {
            return res.status(404).json({ error: 'Booth not found' });
        }
        
        // Check if user is the creator
        if (booth.creator.toString() !== userId) {
            return res.status(403).json({ error: 'Only the booth creator can change booth status' });
        }
        
        // Toggle status
        booth.status = booth.status === 'active' ? 'inactive' : 'active';
        await booth.save();
        
        res.json({ 
            message: 'Booth status updated successfully',
            status: booth.status
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to update booth status' });
    }
};

// Get booth edit form data
exports.getBoothEditForm = async (req, res) => {
    try {
        const { boothId } = req.params;
        const userId = req.user.id;
        
        const booth = await Booth.findById(boothId);
        if (!booth) {
            return res.status(404).render('error', { error: 'Booth not found' });
        }
        
        // Check if user is the creator
        if (booth.creator.toString() !== userId) {
            return res.status(403).render('error', { 
                error: 'Only the booth creator can edit this booth' 
            });
        }
        
        res.render('booth/edit', { booth });
    } catch (err) {
        console.error(err);
        res.status(500).render('error', { error: 'Failed to load edit form' });
    }
};