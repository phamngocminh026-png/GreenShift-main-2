const fs = require('fs');
const files = fs.readdirSync('.').filter(f => f.endsWith('.html'));
let missing = 0;
files.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  const matches = content.match(/(src|href)=["']([^"'#?]+)["']/g) || [];
  matches.forEach(m => {
    const val = m.replace(/^(src|href)=["']/, '').replace(/["']$/, '');
    if (val.startsWith('http') || val.startsWith('mailto:') || val.startsWith('tel:') || val.startsWith('data:')) return;
    if (!fs.existsSync(val)) {
      console.log(`[Broken in ${file}]: ${val}`);
      missing++;
    }
  });
});
console.log('Total broken local references:', missing);
