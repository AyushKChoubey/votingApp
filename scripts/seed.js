// scripts/seed.js - Database seeding script
const mongoose = require('mongoose');
const User = require('../models/user');
const Booth = require('../models/booth');
const Vote = require('../models/vote');
require('dotenv').config();

async function seed() {
    try {
        console.log('🌱 Starting database seeding...');
        
        // Connect to MongoDB using the same logic as db.js
        const mongoURL = process.env.MONGODB_URL || process.env.MONGODB_URL_LOCAL || 'mongodb://localhost:27017/votingApp';
        await mongoose.connect(mongoURL, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        
        console.log('✅ Connected to MongoDB');
        console.log(`📍 Database URL: ${mongoURL}`);
        
        // Clear existing data (WARNING: This will delete all data!)
        if (process.env.NODE_ENV !== 'production') {
            console.log('🧹 Clearing existing data...');
            await Vote.deleteMany({});
            await Booth.deleteMany({});
            await User.deleteMany({});
        }
        
        // Create admin user
        console.log('👤 Creating admin user...');
        const adminUser = new User({
            name: 'Admin User',
            email: 'admin@votingapp.com',
            password: 'AdminPass123!',
            role: 'admin',
            isEmailVerified: true,
            subscription: {
                plan: 'enterprise',
                maxBooths: 100,
                maxMembersPerBooth: 10000
            }
        });
        await adminUser.save();
        
        // Create test users
        console.log('👥 Creating test users...');
        const testUsers = [];
        const userNames = ['Alice Smith', 'Bob Johnson', 'Carol Williams', 'David Brown', 'Emma Davis'];
        
        for (let i = 0; i < 5; i++) {
            const user = new User({
                name: userNames[i],
                email: `user${i + 1}@test.com`,
                password: 'TestPass123!',
                role: 'voter',
                isEmailVerified: true,
                profile: {
                    bio: `This is a test user profile for ${userNames[i]}`,
                    organization: `Test Organization`
                }
            });
            await user.save();
            testUsers.push(user);
        }
        
        // Create sample booths
        console.log('📊 Creating sample booths...');
        const sampleBooths = [];
        
        // Sample booth 1: Simple poll
        const booth1 = new Booth({
            name: 'Best Programming Language 2024',
            description: 'Vote for your favorite programming language for web development in 2024',
            creator: adminUser._id,
            candidates: [
                { name: 'JavaScript', description: 'The language of the web', voteCount: 0 },
                { name: 'Python', description: 'Simple and powerful', voteCount: 0 },
                { name: 'TypeScript', description: 'JavaScript with types', voteCount: 0 },
                { name: 'Go', description: 'Fast and efficient', voteCount: 0 }
            ],
            maxMembers: 50,
            settings: {
                resultsVisibleToVoters: true,
                anonymousVoting: true,
                allowVoteChange: false,
                showLiveResults: true,
                publicBooth: true
            },
            members: [{ user: adminUser._id, hasVoted: false }]
        });
        await booth1.save();
        sampleBooths.push(booth1);
        
        // Sample booth 2: Company decision
        const booth2 = new Booth({
            name: 'Office Lunch Options',
            description: 'Help us decide what to order for the team lunch this Friday',
            creator: testUsers[0]._id,
            candidates: [
                { name: 'Pizza', description: 'Classic choice that everyone loves', voteCount: 0 },
                { name: 'Chinese Food', description: 'Variety of dishes to choose from', voteCount: 0 },
                { name: 'Sandwiches', description: 'Light and healthy option', voteCount: 0 },
                { name: 'Mexican Food', description: 'Tacos and burritos', voteCount: 0 }
            ],
            maxMembers: 20,
            settings: {
                resultsVisibleToVoters: false,
                anonymousVoting: true,
                allowVoteChange: true,
                showLiveResults: false,
                publicBooth: false,
                votingEndTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 1 week from now
            },
            members: [
                { user: testUsers[0]._id, hasVoted: false },
                { user: testUsers[1]._id, hasVoted: false },
                { user: testUsers[2]._id, hasVoted: false }
            ]
        });
        await booth2.save();
        sampleBooths.push(booth2);
        
        // Sample booth 3: Academic survey
        const booth3 = new Booth({
            name: 'Student Satisfaction Survey',
            description: 'Rate your overall satisfaction with the computer science program',
            creator: testUsers[1]._id,
            candidates: [
                { name: 'Excellent', description: 'Extremely satisfied with the program', voteCount: 0 },
                { name: 'Good', description: 'Generally satisfied with minor issues', voteCount: 0 },
                { name: 'Fair', description: 'Neutral, has both pros and cons', voteCount: 0 },
                { name: 'Poor', description: 'Not satisfied, needs improvement', voteCount: 0 }
            ],
            maxMembers: 100,
            settings: {
                resultsVisibleToVoters: true,
                anonymousVoting: true,
                allowVoteChange: false,
                showLiveResults: false,
                publicBooth: false,
                allowedEmailDomains: ['university.edu', 'student.edu'],
                votingStartTime: new Date(),
                votingEndTime: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
            },
            members: [{ user: testUsers[1]._id, hasVoted: false }]
        });
        await booth3.save();
        sampleBooths.push(booth3);
        
        // Update user booth references
        console.log('🔗 Updating user booth references...');
        
        adminUser.createdBooths.push(booth1._id);
        adminUser.joinedBooths.push(booth1._id);
        await adminUser.save();
        
        testUsers[0].createdBooths.push(booth2._id);
        testUsers[0].joinedBooths.push(booth2._id);
        await testUsers[0].save();
        
        testUsers[1].createdBooths.push(booth3._id);
        testUsers[1].joinedBooths.push(booth3._id);
        testUsers[1].joinedBooths.push(booth2._id);
        await testUsers[1].save();
        
        testUsers[2].joinedBooths.push(booth2._id);
        await testUsers[2].save();
        
        // Create some sample votes
        console.log('🗳️ Creating sample votes...');
        
        // Vote in booth 1 (Programming languages)
        const vote1 = new Vote({
            booth: booth1._id,
            voter: testUsers[2]._id,
            candidateIndex: 0, // JavaScript
            candidateName: 'JavaScript',
            ipAddress: '127.0.0.1',
            userAgent: 'Mozilla/5.0 (Test)'
        });
        await vote1.save();
        
        // Update booth 1 vote count and member status
        booth1.candidates[0].voteCount = 1;
        booth1.totalVotes = 1;
        booth1.members.push({ user: testUsers[2]._id, hasVoted: true });
        await booth1.save();
        
        // Vote in booth 2 (Lunch options)
        const vote2 = new Vote({
            booth: booth2._id,
            voter: testUsers[1]._id,
            candidateIndex: 1, // Chinese Food
            candidateName: 'Chinese Food',
            ipAddress: '127.0.0.1',
            userAgent: 'Mozilla/5.0 (Test)'
        });
        await vote2.save();
        
        // Update booth 2 vote count and member status
        booth2.candidates[1].voteCount = 1;
        booth2.totalVotes = 1;
        const member = booth2.members.find(m => m.user.toString() === testUsers[1]._id.toString());
        if (member) {
            member.hasVoted = true;
        }
        await booth2.save();
        
        console.log('✅ Seeding completed successfully!');
        console.log('\n📋 Summary:');
        console.log(`👤 Created 1 admin user and 5 test users`);
        console.log(`📊 Created 3 sample booths`);
        console.log(`🗳️ Created 2 sample votes`);
        console.log('\n🔐 Login credentials:');
        console.log('Admin: admin@votingapp.com / AdminPass123!');
        console.log('Users: user1@test.com to user5@test.com / TestPass123!');
        console.log('\n📊 Sample booth invite codes:');
        for (const booth of sampleBooths) {
            console.log(`${booth.name}: ${booth.inviteCode}`);
        }
        
    } catch (error) {
        console.error('❌ Seeding failed:', error);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
        console.log('👋 Disconnected from MongoDB');
        process.exit(0);
    }
}

// Run seeding if called directly
if (require.main === module) {
    seed();
}

module.exports = seed;