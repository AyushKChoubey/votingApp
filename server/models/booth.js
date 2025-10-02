const mongoose = require('mongoose');

const boothSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        maxLength: 100
    },
    description: {
        type: String,
        required: true,
        trim: true,
        maxLength: 500
    },
    creator: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    inviteCode: {
        type: String,
        unique: true,
        uppercase: true,
        minLength: 6,
        maxLength: 8
    },
    candidates: [{
        name: {
            type: String,
            required: true,
            trim: true
        },
        description: {
            type: String,
            default: '',
            maxLength: 200
        },
        voteCount: {
            type: Number,
            default: 0,
            min: 0
        }
    }],
    members: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        joinedAt: {
            type: Date,
            default: Date.now
        },
        hasVoted: {
            type: Boolean,
            default: false
        }
    }],
    maxMembers: {
        type: Number,
        default: 100,
        min: 1,
        max: 10000
    },
    status: {
        type: String,
        enum: ['draft', 'active', 'closed', 'archived'],
        default: 'active'
    },
    settings: {
        // Voting Rules
        resultsVisibleToVoters: {
            type: Boolean,
            default: true
        },
        anonymousVoting: {
            type: Boolean,
            default: true
        },
        allowVoteChange: {
            type: Boolean,
            default: false
        },
        showLiveResults: {
            type: Boolean,
            default: false
        },
        allowMultipleVotes: {
            type: Boolean,
            default: false
        },
        
        // Access Control
        requireEmailVerification: {
            type: Boolean,
            default: false
        },
        requireApproval: {
            type: Boolean,
            default: false
        },
        publicBooth: {
            type: Boolean,
            default: false
        },
        sendNotifications: {
            type: Boolean,
            default: false
        },
        
        // Time Settings
        votingStartTime: Date,
        votingEndTime: Date,
        
        // Email Domain Restrictions
        allowedEmailDomains: [{
            type: String,
            lowercase: true
        }]
    },
    totalVotes: {
        type: Number,
        default: 0,
        min: 0
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Generate unique invite code
boothSchema.methods.generateInviteCode = function() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
};

// Generate and save a new invite code
boothSchema.methods.generateNewInviteCode = async function() {
    let code;
    let isUnique = false;
    
    while (!isUnique) {
        code = this.generateInviteCode();
        const existing = await this.constructor.findOne({ inviteCode: code });
        if (!existing || existing._id.toString() === this._id.toString()) {
            isUnique = true;
        }
    }
    
    this.inviteCode = code;
    return this.save();
};

// Pre-save middleware to generate invite code
boothSchema.pre('save', async function(next) {
    if (!this.inviteCode) {
        let code;
        let isUnique = false;
        
        while (!isUnique) {
            code = this.generateInviteCode();
            const existing = await this.constructor.findOne({ inviteCode: code });
            if (!existing) {
                isUnique = true;
            }
        }
        
        this.inviteCode = code;
    }
    
    this.updatedAt = new Date();
    next();
});

// Check if user is a member
boothSchema.methods.isMember = function(userId) {
    return this.members.some(member => 
        member.user.toString() === userId.toString()
    );
};

// Check if user has voted
boothSchema.methods.hasUserVoted = function(userId) {
    const member = this.members.find(member => 
        member.user.toString() === userId.toString()
    );
    return member ? member.hasVoted : false;
};

// Add a member to the booth
boothSchema.methods.addMember = async function(userId) {
    if (this.isMember(userId)) {
        throw new Error('User is already a member');
    }
    
    if (this.members.length >= this.maxMembers) {
        throw new Error('Booth is full');
    }
    
    this.members.push({
        user: userId,
        hasVoted: false
    });
    
    return this.save();
};

// Remove a member from the booth
boothSchema.methods.removeMember = async function(userId) {
    this.members = this.members.filter(member => 
        member.user.toString() !== userId.toString()
    );
    
    return this.save();
};

// Mark user as voted
boothSchema.methods.markAsVoted = async function(userId) {
    const member = this.members.find(member => 
        member.user.toString() === userId.toString()
    );
    
    if (!member) {
        throw new Error('User is not a member of this booth');
    }
    
    if (member.hasVoted && !this.settings.allowMultipleVotes) {
        throw new Error('User has already voted');
    }
    
    member.hasVoted = true;
    return this.save();
};

// Increment vote count for a candidate
boothSchema.methods.incrementVote = async function(candidateIndex) {
    if (candidateIndex < 0 || candidateIndex >= this.candidates.length) {
        throw new Error('Invalid candidate index');
    }
    
    this.candidates[candidateIndex].voteCount += 1;
    this.totalVotes += 1;
    
    return this.save();
};

// Get voting statistics
boothSchema.methods.getStats = function() {
    const totalMembers = this.members.length;
    const totalVoted = this.members.filter(m => m.hasVoted).length;
    const votingPercentage = totalMembers > 0 ? (totalVoted / totalMembers) * 100 : 0;
    
    return {
        totalMembers,
        totalVoted,
        votingPercentage: Math.round(votingPercentage * 100) / 100,
        totalVotes: this.totalVotes,
        candidatesCount: this.candidates.length
    };
};

// Check if voting is allowed
boothSchema.methods.isVotingAllowed = function() {
    if (this.status !== 'active') {
        return { allowed: false, reason: 'Booth is not active' };
    }
    
    const now = new Date();
    
    if (this.settings.votingStartTime && now < this.settings.votingStartTime) {
        return { allowed: false, reason: 'Voting has not started yet' };
    }
    
    if (this.settings.votingEndTime && now > this.settings.votingEndTime) {
        return { allowed: false, reason: 'Voting has ended' };
    }
    
    return { allowed: true };
};

// Static method to find booth by invite code
boothSchema.statics.findByInviteCode = function(code) {
    return this.findOne({ inviteCode: code.toUpperCase() });
};

// Indexes for better performance
boothSchema.index({ inviteCode: 1 });
boothSchema.index({ creator: 1, createdAt: -1 });
boothSchema.index({ 'members.user': 1 });
boothSchema.index({ status: 1, createdAt: -1 });

const Booth = mongoose.model('Booth', boothSchema);
module.exports = Booth;
