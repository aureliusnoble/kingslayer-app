const fs = require('fs');
const path = require('path');

// Create a local copy of shared types for Vercel deployment
const sourceDir = path.join(__dirname, '../../shared/src');
const targetDir = path.join(__dirname, '../src/shared');

// Create target directory if it doesn't exist
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

// Copy types.ts
const sourceFile = path.join(sourceDir, 'types.ts');
const targetFile = path.join(targetDir, 'types.ts');

if (fs.existsSync(sourceFile)) {
  fs.copyFileSync(sourceFile, targetFile);
  console.log('✅ Copied shared types');
} else {
  console.error('❌ Source file not found:', sourceFile);
  process.exit(1);
}

// Create index.ts
fs.writeFileSync(
  path.join(targetDir, 'index.ts'),
  "export * from './types';\n"
);

console.log('✅ Shared types copied successfully');