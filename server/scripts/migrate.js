// scripts/migrate.js - Database migration script
const mongoose = require('mongoose');
require('dotenv').config();

async function migrate() {
    try {
        console.log('🔄 Starting database migration...');
        
        // Connect to MongoDB
        const mongoURL = process.env.MONGODB_URI || process.env.MONGODB_URL || process.env.MONGODB_URL_LOCAL || 'mongodb://localhost:27017/votingApp';
        await mongoose.connect(mongoURL, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        
        console.log('✅ Connected to MongoDB');
        
        const db = mongoose.connection.db;
        
        // Create indexes for better performance
        console.log('📚 Creating indexes...');
        
        // User collection indexes
        const userCollection = db.collection('users');
        await userCollection.createIndex({ email: 1 }, { unique: true });
        await userCollection.createIndex({ role: 1 });
        await userCollection.createIndex({ createdAt: -1 });
        await userCollection.createIndex({ lastLogin: -1 });
        await userCollection.createIndex({ 'subscription.plan': 1 });
        await userCollection.createIndex({ emailVerificationToken: 1 });
        await userCollection.createIndex({ passwordResetToken: 1 });
        await userCollection.createIndex({ email: 1, isActive: 1 });
        
        // Booth collection indexes
        const boothCollection = db.collection('booths');
        await boothCollection.createIndex({ inviteCode: 1 }, { unique: true });
        await boothCollection.createIndex({ creator: 1, createdAt: -1 });
        await boothCollection.createIndex({ 'members.user': 1 });
        await boothCollection.createIndex({ status: 1, createdAt: -1 });

        
        // Vote collection indexes
        const voteCollection = db.collection('votes');
        await voteCollection.createIndex({ booth: 1, voter: 1 }, { unique: true });
        await voteCollection.createIndex({ booth: 1, votedAt: -1 });
        await voteCollection.createIndex({ voter: 1, votedAt: -1 });
        
        console.log('✅ Indexes created successfully');
        
        // Update existing users with new fields
        console.log('🔄 Updating user documents...');
        await userCollection.updateMany(
            { subscription: { $exists: false } },
            {
                $set: {
                    subscription: {
                        plan: 'free',
                        maxBooths: 5,
                        maxMembersPerBooth: 100
                    },
                    preferences: {
                        emailNotifications: true,
                        smsNotifications: false,
                        theme: 'auto',
                        language: 'en'
                    },
                    isActive: true,
                    loginCount: 0
                }
            }
        );
        
        // Update existing booths with new settings defaults
        console.log('🔄 Updating booth documents with new defaults...');
        await boothCollection.updateMany(
            { 'settings.resultsVisibleToVoters': { $exists: false } },
            {
                $set: {
                    'settings.resultsVisibleToVoters': true,
                    'settings.showLiveResults': false,
                    'settings.requireApproval': false,
                    totalVotes: 0
                }
            }
        );
        
        // Recalculate total votes for existing booths
        console.log('🔄 Recalculating vote totals...');
        const booths = await boothCollection.find({}).toArray();
        
        for (const booth of booths) {
            const totalVotes = booth.candidates.reduce((sum, candidate) => sum + (candidate.voteCount || 0), 0);
            await boothCollection.updateOne(
                { _id: booth._id },
                { $set: { totalVotes } }
            );
        }
        
        console.log('✅ Migration completed successfully');
        
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
        console.log('👋 Disconnected from MongoDB');
        process.exit(0);
    }
}

// Run migration if called directly
if (require.main === module) {
    migrate();
}

module.exports = migrate;