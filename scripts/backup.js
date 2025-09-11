// scripts/backup.js - Database backup script
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function backup() {
    try {
        console.log('💾 Starting database backup...');
        
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupDir = path.join(__dirname, '..', 'backups');
        const backupPath = path.join(backupDir, `backup-${timestamp}`);
        
        // Create backup directory if it doesn't exist
        if (!fs.existsSync(backupDir)) {
            fs.mkdirSync(backupDir, { recursive: true });
        }
        
        // Parse MongoDB URL to get database name
        const mongoUrl = process.env.MONGODB_URL;
        const dbName = mongoUrl.split('/').pop().split('?')[0];
        
        console.log(`📦 Backing up database: ${dbName}`);
        
        // Run mongodump
        const mongodump = spawn('mongodump', [
            '--uri', mongoUrl,
            '--out', backupPath
        ]);
        
        mongodump.stdout.on('data', (data) => {
            console.log(data.toString());
        });
        
        mongodump.stderr.on('data', (data) => {
            console.error(data.toString());
        });
        
        mongodump.on('close', (code) => {
            if (code === 0) {
                console.log(`✅ Backup completed: ${backupPath}`);
                
                // Clean up old backups (keep last 5)
                const backups = fs.readdirSync(backupDir)
                    .filter(file => file.startsWith('backup-'))
                    .sort()
                    .reverse();
                
                if (backups.length > 5) {
                    const toDelete = backups.slice(5);
                    toDelete.forEach(backup => {
                        const backupToDelete = path.join(backupDir, backup);
                        fs.rmSync(backupToDelete, { recursive: true, force: true });
                        console.log(`🗑️ Deleted old backup: ${backup}`);
                    });
                }
            } else {
                console.error(`❌ Backup failed with code ${code}`);
                process.exit(1);
            }
        });
        
    } catch (error) {
        console.error('❌ Backup failed:', error);
        process.exit(1);
    }
}

// Run backup if called directly
if (require.main === module) {
    backup();
}

module.exports = backup;