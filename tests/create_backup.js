const fs = require('fs');
const path = require('path');

const srcDir = path.resolve('.');
const destFolder = path.resolve('C:/Users/PC/Downloads/GreenShift-Backup-Connected-DB');

function copyDirRecursive(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === '.vscode') continue;
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

console.log('Copying files to:', destFolder);
copyDirRecursive(srcDir, destFolder);
console.log('Folder clone created successfully!');
