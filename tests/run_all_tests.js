const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const testsDir = __dirname;
const files = fs.readdirSync(testsDir).filter(f => f.startsWith('test_') && f.endsWith('.js'));

console.log(`Found ${files.length} test files in ${testsDir}\n`);

let passed = 0;
let failed = 0;
const failedFiles = [];

for (const file of files) {
  const filePath = path.join(testsDir, file);
  process.stdout.write(`Testing ${file} ... `);
  try {
    execSync(`node "${filePath}"`, { stdio: 'pipe' });
    console.log('PASSED');
    passed++;
  } catch (err) {
    console.log('FAILED');
    console.error(err.stdout ? err.stdout.toString() : err.message);
    failed++;
    failedFiles.push(file);
  }
}

console.log(`\n===================================`);
console.log(`Summary: ${passed} passed, ${failed} failed`);
if (failed > 0) {
  console.log(`Failed files:`, failedFiles);
  process.exit(1);
} else {
  console.log(`ALL TESTS PASSED SUCCESSFULLY!`);
}
