const fs = require('fs');
const path = require('path');

const dirToProcess = [
  path.join(__dirname, 'app'),
  path.join(__dirname, 'components')
];

const replacements = {
  'ink-': 'charcoal-',
  'sage-': 'celestial-',
  'cream-': 'canvas-',
  'terracotta-': 'gold-',
};

function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts') || fullPath.endsWith('.css')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let updated = content;
      
      for (const [oldKey, newKey] of Object.entries(replacements)) {
        // Use a regex to match the exact class token prefix
        const regex = new RegExp(`\\b${oldKey}(\\d{2,3})\\b`, 'g');
        updated = updated.replace(regex, `${newKey}$1`);
      }
      
      if (content !== updated) {
        console.log(`Updated: ${fullPath}`);
        fs.writeFileSync(fullPath, updated, 'utf8');
      }
    }
  }
}

dirToProcess.forEach(processDirectory);
console.log('Done.');
