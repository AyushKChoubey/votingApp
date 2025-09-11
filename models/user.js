const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['voter', 'admin'],
        default: 'voter'
    },
    // Legacy fields for backwards compatibility
    mobile: String,
    address: String,
    aadharCardNumber: {
        type: String,
        unique: true,
        sparse: true // Allow null values but ensure uniqueness when present
    },
    age: Number,
    
    // Track booths created by this user
    createdBooths: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Booth'
    }],
    // Track booths user has joined
    joinedBooths: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Booth'
    }],
    // Profile information
    profile: {
        avatar: String,
        bio: String,
        organization: String
    },
    // Security
    emailVerified: {
        type: Boolean,
        default: false
    },
    emailVerificationToken: String,
    passwordResetToken: String,
    passwordResetExpires: Date,
    lastLogin: Date,
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
    const user = this;
    
    // Only hash the password if it has been modified (or is new)
    if (!user.isModified('password')) return next();
    
    try {
        // Generate salt and hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(user.password, salt);
        
        // Replace the plain password with the hashed one
        user.password = hashedPassword;
        next();
    } catch (err) {
        return next(err);
    }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
    try {
        const isMatch = await bcrypt.compare(candidatePassword, this.password);
        return isMatch;
    } catch (err) {
        throw err;
    }
};

// Get user's booth statistics
userSchema.methods.getStats = async function() {
    const Booth = mongoose.model('Booth');
    const Vote = mongoose.model('Vote');
    
    const createdBoothsCount = await Booth.countDocuments({ creator: this._id });
    const votesCount = await Vote.countDocuments({ voter: this._id });
    
    return {
        boothsCreated: createdBoothsCount,
        boothsJoined: this.joinedBooths.length,
        totalVotes: votesCount
    };
};

// Check if user can create more booths (e.g., limit free users)
userSchema.methods.canCreateBooth = async function() {
    const Booth = mongoose.model('Booth');
    const boothCount = await Booth.countDocuments({ creator: this._id });
    
    // Example: Free users can create up to 5 booths
    const maxBooths = this.role === 'admin' ? 100 : 5;
    return boothCount < maxBooths;
};

// Update last login
userSchema.methods.updateLastLogin = function() {
    this.lastLogin = new Date();
    return this.save();
};

// Indexes for better performance and constraints
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ aadharCardNumber: 1 }, { unique: true, sparse: true }); // sparse allows multiple null values
userSchema.index({ role: 1 });
userSchema.index({ createdAt: -1 });

const User = mongoose.model('User', userSchema);
module.exports = User;