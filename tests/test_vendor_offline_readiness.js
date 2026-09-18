const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('=== KIEM TRA TINH SAN SANG OFFLINE & INTRANET (VENDOR LIBRARIES) ===\n');

const rootDir = path.resolve(__dirname, '..');
const htmlPath = path.join(rootDir, 'carbon-inventory.html');
const htmlContent = fs.readFileSync(htmlPath, 'utf8');

// 1. Kiem tra khong con bat ky script nao tro den CDN ngoai
console.log('[TEST 1] Kiem tra khong con bat ky the script CDN ngoai nao trong carbon-inventory.html:');
const scriptRegex = /<script\s+[^>]*src=["']([^"']+)["'][^>]*>/gi;
let match;
const localScripts = [];
const externalScripts = [];

while ((match = scriptRegex.exec(htmlContent)) !== null) {
  const src = match[1];
  if (src.startsWith('http://') || src.startsWith('https://') || src.startsWith('//')) {
    externalScripts.push(src);
  } else {
    localScripts.push(src);
  }
}

assert.strictEqual(
  externalScripts.length,
  0,
  `Van con the script CDN ngoai: ${externalScripts.join(', ')}`
);
console.log('  [PASS] carbon-inventory.html hoan toan khong con the script CDN ngoai nao!');

// 2. Kiem tra tat ca cac script cuc bo phai ton tai thuc te tren o dia
console.log('\n[TEST 2] Kiem tra tat ca cac file script noi bo ton tai va co kich thuoc > 0:');
assert.ok(localScripts.length > 0, 'Phai co it nhat 1 script noi bo');

localScripts.forEach(src => {
  const cleanSrc = src.split('?')[0].split('#')[0];
  const fullPath = path.join(rootDir, cleanSrc);
  assert.ok(fs.existsSync(fullPath), `Tep script khong ton tai: ${cleanSrc}`);
  const stat = fs.statSync(fullPath);
  assert.ok(stat.size > 0, `Tep script rong: ${cleanSrc}`);
  console.log(`  [PASS] ${cleanSrc} (${(stat.size / 1024).toFixed(1)} KB)`);
});

// 3. Kiem tra danh sach thu vien vendor cot loi
console.log('\n[TEST 3] Kiem tra cac thu vien vendor cot loi trong assets/vendor/:');
const requiredVendors = [
  { file: 'assets/vendor/chart.umd.min.js', minSize: 100000 },
  { file: 'assets/vendor/xlsx.full.min.js', minSize: 500000 },
  { file: 'assets/vendor/docxtemplater.js', minSize: 100000 },
  { file: 'assets/vendor/pizzip.js', minSize: 50000 },
  { file: 'assets/vendor/FileSaver.min.js', minSize: 1000 },
  { file: 'assets/vendor/supabase.min.js', minSize: 100000 }
];

requiredVendors.forEach(item => {
  const p = path.join(rootDir, item.file);
  assert.ok(fs.existsSync(p), `Thieu file vendor: ${item.file}`);
  const sz = fs.statSync(p).size;
  assert.ok(sz >= item.minSize, `File vendor ${item.file} dung luong qua nho: ${sz} bytes`);
  console.log(`  [PASS] ${item.file}: ${sz} bytes (>= ${item.minSize} bytes)`);
});

// 4. Kiem tra kha nang khoi tao docxtemplater va pizzip voi mau thuc te
console.log('\n[TEST 4] Kiem tra kha nang khoi tao docxtemplater va pizzip voi mau Word thuc te:');
const PizZip = require(path.join(rootDir, 'node_modules', 'pizzip'));
const Docxtemplater = require(path.join(rootDir, 'node_modules', 'docxtemplater'));

const wordExportJs = fs.readFileSync(path.join(rootDir, 'assets', 'js', 'word-export.js'), 'utf8');
const b64Match = wordExportJs.match(/const TEMPLATE_BASE64 = "([^"]+)";/);
assert.ok(b64Match, 'Phai tim thay TEMPLATE_BASE64 trong word-export.js');

const buffer = Buffer.from(b64Match[1], 'base64');
const zip = new PizZip(buffer);
const doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true });
doc.render({
  company_name: 'Test Intranet Factory',
  reportYear: '2026',
  tbl_317: [],
  tbl_318: [],
  scope1_stationary: [],
  scope1_mobile: [],
  scope2_grid: [],
  uncertainty_pct: '5.0'
});
const output = doc.getZip().generate({ type: 'nodebuffer' });
assert.ok(output.length > 0, 'Ket xuat docx phai thanh cong');
console.log('  [PASS] Docxtemplater va PizZip render thanh cong mau van ban Word offline!');

console.log('\n=== TAT CA CAC KIEM TRA OFFLINE VENDOR DEU THANH CONG! ===');

