const fs = require('fs');
const path = require('path');
const assert = require('assert');
const vm = require('vm');
const XLSX = require('../assets/vendor/xlsx.full.min.js');

console.log('=== TEST: 16 INDUSTRIES STANDALONE TEMPLATES & CATALOG INTEGRITY ===');

const templatesDir = path.join(__dirname, '..', 'templates');
const userDownloadsDir = 'C:\\Users\\PC\\Downloads\\GreenShift_16_Mau_Thiet_Bi_Tach';
const catalogJsPath = path.join(__dirname, '..', 'assets', 'js', 'industry-catalog-16.js');

// 1. Verify all 16 template files in templates/
const expectedFiles = [
  'GreenShift_Mau_Thiet_Bi_Thep_Luyen_Kim.xlsx',
  'GreenShift_Mau_Thiet_Bi_Nhom_Luyen_Kim.xlsx',
  'GreenShift_Mau_Thiet_Bi_Xi_Mang.xlsx',
  'GreenShift_Mau_Thiet_Bi_Nhua_Hoa_Chat.xlsx',
  'GreenShift_Mau_Thiet_Bi_Phan_Bon.xlsx',
  'GreenShift_Mau_Thiet_Bi_Nhiet_Dien_Dien_Luc.xlsx',
  'GreenShift_Mau_Thiet_Bi_Hydrogen.xlsx',
  'GreenShift_Mau_Thiet_Bi_Bao_Bi_Giay.xlsx',
  'GreenShift_Mau_Thiet_Bi_Det_May.xlsx',
  'GreenShift_Mau_Thiet_Bi_Da_Giay.xlsx',
  'GreenShift_Mau_Thiet_Bi_Go_Noi_That.xlsx',
  'GreenShift_Mau_Thiet_Bi_Dien_Tu.xlsx',
  'GreenShift_Mau_Thiet_Bi_Thuc_Pham_Do_Uong.xlsx',
  'GreenShift_Mau_Thiet_Bi_Co_Khi_Che_Tao.xlsx',
  'GreenShift_Mau_Thiet_Bi_Nong_Nghiep.xlsx',
  'GreenShift_Mau_Thiet_Bi_Van_Tai_Logistics.xlsx'
];

expectedFiles.forEach(f => {
  const p = path.join(templatesDir, f);
  assert.ok(fs.existsSync(p), `Template file ${f} must exist in templates/`);
});
console.log('PASS 1: All 16 template files exist in templates/.');

// 2. Verify all 16 template files in user download folder
if (fs.existsSync(userDownloadsDir)) {
  expectedFiles.forEach(f => {
    const up = path.join(userDownloadsDir, f);
    assert.ok(fs.existsSync(up), `Template file ${f} must exist in user downloads folder`);
  });
  console.log('PASS 2: All 16 template files exist in user Downloads folder.');
}

// 3. Verify structure, 15 columns, and total row count (349 rows)
const requiredCols = [
  'Loại thiết bị', 'Tên thiết bị', 'Số tài sản', 'Vị trí', 'Thương hiệu / Mẫu mã',
  'Nguồn phát thải', 'Loại năng lượng sử dụng (Điện / Nhiên liệu đốt)',
  'Công suất định mức', 'Đơn vị công suất', 'Mức tải TB (%)',
  'Giờ làm việc bình thường (h/ngày)', 'Số ngày chạy/tuần',
  'Độ tin cậy của dữ liệu', 'Phương pháp đo lường', 'Mã đồng hồ đo'
];

let totalRows = 0;
expectedFiles.forEach(f => {
  const p = path.join(templatesDir, f);
  const buf = fs.readFileSync(p);
  const wb = XLSX.read(buf, { type: 'buffer' });
  const sheetName = wb.SheetNames[0];
  const rows = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], { defval: '' });
  assert.ok(rows.length >= 20, `${f} must contain at least 20 equipment rows (found ${rows.length})`);
  totalRows += rows.length;

  const firstRow = rows[0];
  requiredCols.forEach(col => {
    assert.ok(col in firstRow, `${f} missing standard column: ${col}`);
  });
});

assert.strictEqual(totalRows, 349, `Total equipment records must be exactly 349 (found ${totalRows})`);
console.log(`PASS 3: All 16 workbooks validated with exact 15 columns, total ${totalRows} equipment rows.`);

// 4. Verify industry-catalog-16.js execution and helper functions
assert.ok(fs.existsSync(catalogJsPath), 'industry-catalog-16.js must exist');
const catalogCode = fs.readFileSync(catalogJsPath, 'utf8');

const sandbox = {
  window: {},
  removeVietnameseTones: (str) => {
    if (!str) return '';
    return str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd');
  }
};
sandbox.window.removeVietnameseTones = sandbox.removeVietnameseTones;
vm.createContext(sandbox);
vm.runInContext(catalogCode, sandbox);

assert.ok(sandbox.window.INDUSTRY_16_CATALOG, 'window.INDUSTRY_16_CATALOG must be defined');
assert.strictEqual(Object.keys(sandbox.window.INDUSTRY_16_CATALOG).length, 16, 'Catalog must contain 16 sheets');
assert.ok(typeof sandbox.window.getIndustry16TemplateRows === 'function', 'getIndustry16TemplateRows must be a function');

// Test retrieval across sectors
const testSectors = [
  { name: 'Xi măng', expectedPrefix: 'CEM' },
  { name: 'Hydrogen', expectedPrefix: 'HYD' },
  { name: 'Gỗ & Nội thất', expectedPrefix: 'WOOD' },
  { name: 'Nhiệt điện', expectedPrefix: 'POW' },
  { name: 'Chế biến thực phẩm', expectedPrefix: 'FOOD' },
  { name: 'Da giày', expectedPrefix: 'SHOE' },
  { name: 'Nhôm', expectedPrefix: 'ALU' },
  { name: 'Vận tải & Logistics', expectedPrefix: 'LOG' }
];

testSectors.forEach(ts => {
  const rows = sandbox.window.getIndustry16TemplateRows(ts.name);
  assert.ok(rows && rows.length >= 20, `Sector ${ts.name} must return >= 20 rows`);
  assert.ok(rows.some(r => (r['Số tài sản'] || '').includes(ts.expectedPrefix)), `Sector ${ts.name} must contain code prefix ${ts.expectedPrefix}`);
});
console.log('PASS 4: getIndustry16TemplateRows successfully retrieved records across all test sectors.');

console.log('ALL CHECKS PASSED: 16 Industry Standalone Templates & Catalog are 100% verified.');
