const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const oldDir = path.join(__dirname, 'public/Team NAme');
const newDir = path.join(__dirname, 'public/team-images');

// Create new directory
if (!fs.existsSync(newDir)) {
  fs.mkdirSync(newDir, { recursive: true });
}

const files = fs.readdirSync(oldDir);

files.forEach(file => {
  // e.g. "Rishika OH .webp" -> "rishika-oh.webp"
  const ext = path.extname(file);
  const name = path.basename(file, ext);
  
  const cleanName = name.trim().toLowerCase().replace(/\s+/g, '-');
  const cleanFile = cleanName + ext;
  
  console.log(`Renaming: "${file}" -> "${cleanFile}"`);
  
  // Use git mv to preserve history
  execSync(`git mv "public/Team NAme/${file}" "public/team-images/${cleanFile}"`);
});

// Remove old directory if empty
execSync(`git rm -r "public/Team NAme" || true`);
