// models/user.js (Enhanced)
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true,
        minlength: [2, 'Name must be at least 2 characters'],
        maxlength: [50, 'Name cannot exceed 50 characters'],
        match: [/^[a-zA-Z\s\-'\.]+$/, 'Name contains invalid characters']
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true,
        maxlength: [254, 'Email is too long'],
        match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please provide a valid email']
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [8, 'Password must be at least 8 characters'],
        select: false // Don't include password in queries by default
    },
    role: {
        type: String,
        enum: {
            values: ['voter', 'admin', 'moderator'],
            message: 'Role must be either voter, admin, or moderator'
        },
        default: 'voter'
    },
    
    // Account status
    isActive: {
        type: Boolean,
        default: true
    },
    isEmailVerified: {
        type: Boolean,
        default: false
    },
    emailVerificationToken: String,
    emailVerificationExpires: Date,
    
    // Security fields
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    loginAttempts: {
        type: Number,
        default: 0
    },
    lockUntil: Date,
    lastLogin: Date,
    loginCount: {
        type: Number,
        default: 0
    },
    
    // Legacy fields for backwards compatibility
    mobile: {
        type: String,
        match: [/^\+?[\d\s\-\(\)]+$/, 'Please provide a valid mobile number']
    },
    address: {
        type: String,
        maxlength: [200, 'Address cannot exceed 200 characters']
    },
    aadharCardNumber: {
        type: String,
        unique: true,
        sparse: true,
        match: [/^\d{12}$/, 'Aadhar card number must be 12 digits']
    },
    age: {
        type: Number,
        min: [13, 'Age must be at least 13'],
        max: [150, 'Age cannot exceed 150']
    },
    
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
        avatar: {
            type: String,
            match: [/^https?:\/\//, 'Avatar must be a valid URL']
        },
        bio: {
            type: String,
            maxlength: [500, 'Bio cannot exceed 500 characters']
        },
        organization: {
            type: String,
            maxlength: [100, 'Organization name cannot exceed 100 characters']
        },
        website: {
            type: String,
            match: [/^https?:\/\//, 'Website must be a valid URL']
        },
        timezone: {
            type: String,
            default: 'UTC'
        }
    },
    
    // Preferences
    preferences: {
        emailNotifications: {
            type: Boolean,
            default: true
        },
        smsNotifications: {
            type: Boolean,
            default: false
        },
        theme: {
            type: String,
            enum: ['light', 'dark', 'auto'],
            default: 'auto'
        },
        language: {
            type: String,
            default: 'en'
        }
    },
    
    // Subscription/Plan information
    subscription: {
        plan: {
            type: String,
            enum: ['free', 'premium', 'enterprise'],
            default: 'free'
        },
        expiresAt: Date,
        maxBooths: {
            type: Number,
            default: 5
        },
        maxMembersPerBooth: {
            type: Number,
            default: 100
        }
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

// Virtual for account lock status
userSchema.virtual('isLocked').get(function() {
    return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Update the updatedAt field on save
userSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    next();
});

// Hash password before saving
userSchema.pre('save', async function(next) {
    const user = this;
    
    // Only hash the password if it has been modified (or is new)
    if (!user.isModified('password')) return next();
    
    try {
        // Generate salt and hash password
        const salt = await bcrypt.genSalt(12); // Increased from 10 to 12 for better security
        const hashedPassword = await bcrypt.hash(user.password, salt);
        
        // Replace the plain password with the hashed one
        user.password = hashedPassword;
        
        // Set password changed timestamp
        if (!user.isNew) {
            user.passwordChangedAt = new Date();
        }
        
        next();
    } catch (err) {
        return next(err);
    }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
    try {
        if (!candidatePassword || !this.password) {
            return false;
        }
        
        const isMatch = await bcrypt.compare(candidatePassword, this.password);
        return isMatch;
    } catch (err) {
        console.error('Password comparison error:', err);
        return false;
    }
};

// Account locking methods
userSchema.methods.incLoginAttempts = async function() {
    // If we have a previous lock that has expired, restart at 1
    if (this.lockUntil && this.lockUntil < Date.now()) {
        return this.updateOne({
            $set: { loginAttempts: 1 },
            $unset: { lockUntil: 1 }
        });
    }
    
    const updates = { $inc: { loginAttempts: 1 } };
    
    // Lock account after 5 failed attempts
    if (this.loginAttempts + 1 >= 5 && !this.isLocked) {
        updates.$set = { lockUntil: Date.now() + 2 * 60 * 60 * 1000 }; // 2 hours
    }
    
    return this.updateOne(updates);
};

userSchema.methods.resetLoginAttempts = function() {
    return this.updateOne({
        $unset: { loginAttempts: 1, lockUntil: 1 }
    });
};

// Get user's booth statistics
userSchema.methods.getStats = async function() {
    try {
        const Booth = mongoose.model('Booth');
        const Vote = mongoose.model('Vote');
        
        const [createdBoothsCount, votesCount] = await Promise.all([
            Booth.countDocuments({ creator: this._id }),
            Vote.countDocuments({ voter: this._id })
        ]);
        
        return {
            boothsCreated: createdBoothsCount,
            boothsJoined: this.joinedBooths.length,
            totalVotes: votesCount,
            memberSince: this.createdAt,
            lastLogin: this.lastLogin,
            accountType: this.subscription.plan
        };
    } catch (err) {
        console.error('Error getting user stats:', err);
        return {
            boothsCreated: 0,
            boothsJoined: 0,
            totalVotes: 0,
            memberSince: this.createdAt,
            lastLogin: this.lastLogin,
            accountType: this.subscription.plan
        };
    }
};

// Check if user can create more booths
userSchema.methods.canCreateBooth = async function() {
    try {
        const Booth = mongoose.model('Booth');
        const boothCount = await Booth.countDocuments({ creator: this._id });
        
        // Check subscription limits
        const maxBooths = this.subscription.maxBooths || 5;
        return boothCount < maxBooths;
    } catch (err) {
        console.error('Error checking booth creation limit:', err);
        return false;
    }
};

// Update last login
userSchema.methods.updateLastLogin = function() {
    this.lastLogin = new Date();
    this.loginCount = (this.loginCount || 0) + 1;
    return this.save();
};

// Generate email verification token
userSchema.methods.createEmailVerificationToken = function() {
    const verificationToken = crypto.randomBytes(32).toString('hex');
    
    this.emailVerificationToken = crypto
        .createHash('sha256')
        .update(verificationToken)
        .digest('hex');
    
    this.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
    
    return verificationToken;
};

// Generate password reset token
userSchema.methods.createPasswordResetToken = function() {
    const resetToken = crypto.randomBytes(32).toString('hex');
    
    this.passwordResetToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');
    
    this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
    
    return resetToken;
};

// Verify email with token
userSchema.methods.verifyEmail = function(token) {
    const hashedToken = crypto
        .createHash('sha256')
        .update(token)
        .digest('hex');
    
    if (this.emailVerificationToken === hashedToken && 
        this.emailVerificationExpires > Date.now()) {
        
        this.isEmailVerified = true;
        this.emailVerificationToken = undefined;
        this.emailVerificationExpires = undefined;
        
        return true;
    }
    
    return false;
};

// Static method to find user by reset token
userSchema.statics.findByPasswordResetToken = function(token) {
    const hashedToken = crypto
        .createHash('sha256')
        .update(token)
        .digest('hex');
    
    return this.findOne({
        passwordResetToken: hashedToken,
        passwordResetExpires: { $gt: Date.now() }
    });
};

// Indexes for better performance and constraints
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ aadharCardNumber: 1 }, { unique: true, sparse: true });
userSchema.index({ role: 1 });
userSchema.index({ createdAt: -1 });
userSchema.index({ lastLogin: -1 });
userSchema.index({ 'subscription.plan': 1 });
userSchema.index({ emailVerificationToken: 1 });
userSchema.index({ passwordResetToken: 1 });

// Compound indexes
userSchema.index({ email: 1, isActive: 1 });
userSchema.index({ createdBooths: 1, createdAt: -1 });
userSchema.index({ joinedBooths: 1, createdAt: -1 });

const User = mongoose.model('User', userSchema);
module.exports = User;