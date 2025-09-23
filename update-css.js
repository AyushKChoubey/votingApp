const fs = require('fs');
const path = require('path');

// Function to recursively find all .ejs files
function findEjsFiles(dir, fileList = []) {
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory()) {
            findEjsFiles(filePath, fileList);
        } else if (path.extname(file) === '.ejs') {
            fileList.push(filePath);
        }
    });
    
    return fileList;
}

// Function to update CDN references to local CSS
function updateEjsFile(filePath) {
    try {
        let content = fs.readFileSync(filePath, 'utf8');
        let updated = false;
        
        // Replace Tailwind CDN script
        if (content.includes('https://cdn.tailwindcss.com')) {
            content = content.replace(
                /<script src="https:\/\/cdn\.tailwindcss\.com"><\/script>/g,
                '<link href="/public/css/tailwind.css" rel="stylesheet">'
            );
            updated = true;
        }
        
        // Remove tailwind.config inline script
        if (content.includes('tailwind.config = {')) {
            const scriptRegex = /<script>\s*tailwind\.config[\s\S]*?<\/script>/g;
            content = content.replace(scriptRegex, '');
            updated = true;
        }
        
        // Add Inter font if not present
        if (!content.includes('fonts.googleapis.com') && content.includes('<head>')) {
            content = content.replace(
                /<title>.*<\/title>/,
                '$&\n    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">'
            );
            updated = true;
        }
        
        // Update Font Awesome to latest version
        if (content.includes('font-awesome/6.0.0')) {
            content = content.replace(
                /font-awesome\/6\.0\.0/g,
                'font-awesome/6.4.0'
            );
            updated = true;
        }
        
        if (updated) {
            fs.writeFileSync(filePath, content, 'utf8');
            console.log(`✅ Updated: ${filePath}`);
        } else {
            console.log(`⏭️  No changes needed: ${filePath}`);
        }
    } catch (error) {
        console.error(`❌ Error updating ${filePath}:`, error.message);
    }
}

// Main execution
console.log('🔄 Updating EJS files to use local Tailwind CSS...\n');

const viewsDir = path.join(__dirname, 'views');
const ejsFiles = findEjsFiles(viewsDir);

console.log(`Found ${ejsFiles.length} EJS files:\n`);

ejsFiles.forEach(updateEjsFile);

console.log('\n✨ Update complete!');
console.log('\n📝 Next steps:');
console.log('1. Run: npm run build:css:prod');
console.log('2. Start your server: npm start');
console.log('3. For development with auto-rebuild: npm run build:css');