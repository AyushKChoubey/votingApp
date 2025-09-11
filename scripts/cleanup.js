// scripts/cleanup.js - Database cleanup script
const mongoose = require('mongoose');
const User = require('../models/user');
const Booth = require('../models/booth');
const Vote = require('../models/vote');
require('dotenv').config();

async function cleanup() {
    try {
        console.log('🧹 Starting database cleanup...');
        
        await mongoose.connect(process.env.MONGODB_URL, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        
        console.log('✅ Connected to MongoDB');
        
        // Remove expired booths
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const expiredBooths = await Booth.find({
            status: 'closed',
            updatedAt: { $lt: thirtyDaysAgo }
        });
        
        console.log(`🗑️ Found ${expiredBooths.length} expired booths`);
        
        for (const booth of expiredBooths) {
            // Remove votes associated with the booth
            await Vote.deleteMany({ booth: booth._id });
            
            // Remove booth from users' arrays
            await User.updateMany(
                { $or: [{ createdBooths: booth._id }, { joinedBooths: booth._id }] },
                { $pull: { createdBooths: booth._id, joinedBooths: booth._id } }
            );
            
            // Delete the booth
            await Booth.deleteOne({ _id: booth._id });
        }
        
        // Remove orphaned votes (votes without corresponding booths)
        const allBoothIds = await Booth.distinct('_id');
        const orphanedVotes = await Vote.deleteMany({
            booth: { $nin: allBoothIds }
        });
        
        console.log(`🗑️ Removed ${orphanedVotes.deletedCount} orphaned votes`);
        
        // Clean up user references to non-existent booths
        const users = await User.find({});
        for (const user of users) {
            const validCreatedBooths = user.createdBooths.filter(boothId => 
                allBoothIds.some(validId => validId.toString() === boothId.toString())
            );
            const validJoinedBooths = user.joinedBooths.filter(boothId => 
                allBoothIds.some(validId => validId.toString() === boothId.toString())
            );
            
            if (validCreatedBooths.length !== user.createdBooths.length || 
                validJoinedBooths.length !== user.joinedBooths.length) {
                user.createdBooths = validCreatedBooths;
                user.joinedBooths = validJoinedBooths;
                await user.save();
            }
        }
        
        // Remove users who haven't logged in for 1 year (optional)
        const oneYearAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
        const inactiveUsers = await User.countDocuments({
            lastLogin: { $lt: oneYearAgo },
            role: 'voter' // Don't remove admin users
        });
        
        console.log(`⚠️ Found ${inactiveUsers} inactive users (not removed automatically)`);
        
        // Reset failed login attempts older than 24 hours
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const resetResult = await User.updateMany(
            { lockUntil: { $lt: oneDayAgo } },
            { $unset: { loginAttempts: 1, lockUntil: 1 } }
        );
        
        console.log(`🔓 Reset login attempts for ${resetResult.modifiedCount} users`);
        
        console.log('✅ Cleanup completed successfully');
        
    } catch (error) {
        console.error('❌ Cleanup failed:', error);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
        console.log('👋 Disconnected from MongoDB');
        process.exit(0);
    }
}

// Run cleanup if called directly
if (require.main === module) {
    cleanup();
}

module.exports = cleanup;
