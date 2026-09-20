const fs = require('fs');
const path = require('path');
const assert = require('assert');
const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');

const rootDir = path.resolve(__dirname, '..');
const wordExportJs = fs.readFileSync(path.join(rootDir, 'assets', 'js', 'word-export.js'), 'utf8');

console.log('===============================================================');
console.log('KIEM TRA CHUAN HOA PHONG CHU 13PT TRONG XUAT BAO CAO WORD');
console.log('===============================================================');

// [TEST 1] Kiem tra template base64 duoc nhung trong word-export.js
console.log('\n[TEST 1] Kiem tra TEMPLATE_BASE64 trong word-export.js:');
const b64Match = wordExportJs.match(/const TEMPLATE_BASE64 = "([^"]+)";/);
assert.ok(b64Match, 'word-export.js phai chua TEMPLATE_BASE64');
const zip = new PizZip(Buffer.from(b64Match[1], 'base64'));
console.log('  [PASS] TEMPLATE_BASE64 duoc trich xuat hop le.');

// [TEST 2] Kiem tra styles.xml dat mac dinh 13pt (sz=26, szCs=26) va Times New Roman
console.log('\n[TEST 2] Kiem tra docDefaults va TableParagraph trong styles.xml:');
const stylesXml = zip.file('word/styles.xml').asText();
assert.ok(stylesXml.includes('<w:sz w:val="26"/>'), 'styles.xml phai chua sz=26');
assert.ok(stylesXml.includes('<w:szCs w:val="26"/>'), 'styles.xml phai chua szCs=26');
assert.ok(stylesXml.includes('Times New Roman'), 'styles.xml phai dat Times New Roman');
console.log('  [PASS] styles.xml mac dinh 13pt (sz=26) va Times New Roman.');

// [TEST 3] Render WordExport voi du lieu mau (nganh Sat Thep, Bang 1.3)
console.log('\n[TEST 3] Render bao cao voi du lieu mau va kiem tra Bang 1.3:');
const WordExport = require(path.join(rootDir, 'assets', 'js', 'word-export.js'));

const mockCompany = {
  name: 'Cong ty Co phan Thep Mien Nam - Phat Thanh Vinh',
  industry: 'Sat Thep',
  tax: '0101234567',
  address: 'KCN Thep Mien Nam',
  repName: 'Nguyen Van Kiem Ke',
  repTitle: 'Tong Giam Doc',
  descBoundary: 'Toan bo khuon vien nha may va cac phan xuong san xuat'
};

const doc = WordExport.exportReport(mockCompany, null, '2026', []);
const renderedXml = doc.getZip().file('word/document.xml').asText();

// Tim Bang 1.3
const b13Idx = renderedXml.indexOf('B\u1ea3ng 1.3. Th\u00f4ng tin v\u1ec1 l\u0129nh v\u1ef1c', 70000);
assert.ok(b13Idx !== -1, 'Phai tim thay Bang 1.3 trong noi dung bao cao');

const tblStart = renderedXml.indexOf('<w:tbl', b13Idx);
const tblEnd = renderedXml.indexOf('</w:tbl>', tblStart) + 8;
const table13Xml = renderedXml.substring(tblStart, tblEnd);

// Kiem tra cac gia tri da nap trong Bang 1.3
assert.ok(table13Xml.includes('Sat Thep'), 'Bang 1.3 phai nap gia tri nganh Sat Thep');
assert.ok(table13Xml.includes('Toan bo khuon vien nha may va cac phan xuong san xuat'), 'Bang 1.3 phai nap descBoundary');
assert.ok(table13Xml.includes('Năm kiểm kê 2026'), 'Bang 1.3 phai nap nam kiem ke 2026');

// Kiem tra moi run trong Bang 1.3 phai co sz=26 va szCs=26 (13pt)
const runs13 = table13Xml.match(/<w:r\b[\s\S]*?<\/w:r>/g) || [];
assert.ok(runs13.length > 0, 'Bang 1.3 phai chua cac the w:r');

let hasNon26 = false;
for (const r of runs13) {
  if (r.includes('w:vertAlign')) continue;
  const szMatch = r.match(/<w:sz\s+w:val="([^"]+)"/);
  const szCsMatch = r.match(/<w:szCs\s+w:val="([^"]+)"/);
  if (!szMatch || szMatch[1] !== '26' || !szCsMatch || szCsMatch[1] !== '26') {
    hasNon26 = true;
    console.error('  Phan tu chua dat 13pt trong Bang 1.3:', r);
  }
}
assert.strictEqual(hasNon26, false, 'Tat ca cac gia tri va van ban trong Bang 1.3 phai dong nhat 13pt (sz=26, szCs=26)');
console.log('  [PASS] Tat ca cac dong va o trong Bang 1.3 deu dat chuan 13pt (sz=26).');

// [TEST 4] Kiem tra toan bo 31 bang trong van ban xuat ra dat 100% 13pt
console.log('\n[TEST 4] Kiem tra tat ca cac bang bieu trong bao cao:');
const tblRegex = /<w:tbl\b[\s\S]*?<\/w:tbl>/g;
let m;
let tableIndex = 0;
let badTableCount = 0;

while ((m = tblRegex.exec(renderedXml)) !== null) {
  tableIndex++;
  const tblContent = m[0];
  const tRuns = tblContent.match(/<w:r\b[\s\S]*?<\/w:r>/g) || [];
  for (const r of tRuns) {
    if (r.includes('w:vertAlign')) continue; // bo qua chi so duoi hoa hoc nhu CO2
    const szMatch = r.match(/<w:sz\s+w:val="([^"]+)"/);
    if (!szMatch || szMatch[1] !== '26') {
      badTableCount++;
      break;
    }
  }
}

assert.strictEqual(badTableCount, 0, `Khong duoc co bat ky bang nao chua phong chu khong phai 13pt (phat hien ${badTableCount})`);
console.log(`  [PASS] 100% cac bang bieu (${tableIndex} bang) dong nhat phong chu 13pt.`);

// [TEST 5] Quy tac ZERO EMOJI
console.log('\n[TEST 5] Kiem tra quy tac ZERO EMOJI:');
const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E6}-\u{1F1FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{1FA70}-\u{1FAFF}]/u;
assert.ok(!emojiRegex.test(wordExportJs), 'word-export.js khong duoc chua bat ky emoji nao');
const thisFileContent = fs.readFileSync(__filename, 'utf8');
assert.ok(!emojiRegex.test(thisFileContent), 'File test khong duoc chua bat ky emoji nao');
console.log('  [PASS] 100% tuan thu quy tac ZERO EMOJI.');

console.log('===============================================================');
console.log('TAT CA CAC KIEM TRA CHUAN HOA PHONG CHU 13PT DEU THANH CONG!');
console.log('===============================================================');
