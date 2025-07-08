const fs = require('fs');
const path = require('path');

// Function to recursively find all TypeScript files
function findTsFiles(dir, files = []) {
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory() && !item.includes('node_modules') && !item.includes('dist')) {
      findTsFiles(fullPath, files);
    } else if (item.endsWith('.ts') || item.endsWith('.tsx')) {
      files.push(fullPath);
    }
  }
  
  return files;
}

// Update imports in all TypeScript files
const srcDir = path.join(__dirname, '../src');
const tsFiles = findTsFiles(srcDir);

for (const file of tsFiles) {
  let content = fs.readFileSync(file, 'utf8');
  const updated = content.replace(
    /from 'kingslayer-shared'/g,
    "from '../shared'"
  );
  
  if (content !== updated) {
    // Adjust relative path based on file depth
    const depth = path.relative(path.dirname(file), srcDir).split('..').length - 1;
    const prefix = '../'.repeat(depth);
    const finalContent = updated.replace(
      /from '\.\.\/shared'/g,
      `from '${prefix}shared'`
    );
    
    fs.writeFileSync(file, finalContent);
    console.log(`✅ Updated imports in ${path.relative(srcDir, file)}`);
  }
}

console.log('✅ All imports updated');