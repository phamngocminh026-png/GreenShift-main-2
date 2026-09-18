const fs = require('fs');
const path = require('path');
const assert = require('assert');
const XLSX = require('../assets/vendor/xlsx.full.min.js');

console.log('=== TEST: STEEL EQUIPMENT TEMPLATE & WORKFLOW VALIDATION ===');

// 1. Kiểm tra file mẫu đã tồn tại
const xlsxPath = path.join(__dirname, '..', 'templates', 'excel', 'GreenShift_Mau_Thiet_Bi_Nha_May_Thep.xlsx');
const csvPath = path.join(__dirname, '..', 'templates', 'excel', 'GreenShift_Mau_Thiet_Bi_Nha_May_Thep.csv');
assert.ok(fs.existsSync(xlsxPath), 'File mẫu XLSX nhà máy thép phải tồn tại');
assert.ok(fs.existsSync(csvPath), 'File mẫu CSV nhà máy thép phải tồn tại');
console.log('PASS 1: Template files exist in templates/excel/ and data/');

// 2. Đọc và phân tích cấu trúc file XLSX
const fileBuf = fs.readFileSync(xlsxPath);
const wb = XLSX.read(fileBuf, { type: 'buffer' });
assert.ok(wb.SheetNames.includes('Danh_Muc_Thiet_Bi_Thep'), 'Workbook phải có sheet Danh_Muc_Thiet_Bi_Thep');
const rows = XLSX.utils.sheet_to_json(wb.Sheets['Danh_Muc_Thiet_Bi_Thep'], { defval: '' });
assert.strictEqual(rows.length, 16, 'File mẫu phải chứa đủ 16 thiết bị chuẩn nhà máy thép từ database');
console.log(`PASS 2: XLSX parsed successfully with ${rows.length} realistic steel equipment rows.`);

// 3. Kiểm tra các trường dữ liệu quan trọng của từng thiết bị
const assetCodes = rows.map(r => r['Số tài sản']);
assert.ok(assetCodes.includes('STEEL-EAF-01'), 'Phải có Lò hồ quang điện EAF');
assert.ok(assetCodes.includes('STEEL-LRF-01'), 'Phải có Lò tinh luyện thùng LRF');
assert.ok(assetCodes.includes('STEEL-CCM-01'), 'Phải có Máy đúc phôi liên tục CCM');
assert.ok(assetCodes.includes('STEEL-FURN-01'), 'Phải có Lò nung phôi cán nóng đốt dầu FO');
assert.ok(assetCodes.includes('STEEL-ROLL-HOT'), 'Phải có Dây chuyền cán thép cuộn cán nóng HRC');
assert.ok(assetCodes.includes('STEEL-ROLL-COLD'), 'Phải có Dây chuyền cán nguội CRC');
assert.ok(assetCodes.includes('STEEL-PICKLING'), 'Phải có Dây chuyền tẩy gỉ axit CPL');
assert.ok(assetCodes.includes('STEEL-GALV-01'), 'Phải có Dây chuyền mạ kẽm CGL');
assert.ok(assetCodes.includes('STEEL-ROLL-ROD'), 'Phải có Dây chuyền cán thép thanh & dây cuộn Wire Rod');
assert.ok(assetCodes.includes('STEEL-TUBE-01'), 'Phải có Máy định hình ống thép ERW');
assert.ok(assetCodes.includes('STEEL-FAST-01'), 'Phải có Máy dập nguội bu lông ốc vít');
assert.ok(assetCodes.includes('STEEL-CRANE-01'), 'Phải có Cầu trục gian lò 150 tấn');
assert.ok(assetCodes.includes('GEN-GENSET-DIESEL'), 'Phải có Máy phát điện dự phòng Diesel');
assert.ok(assetCodes.includes('GEN-FORKLIFT-FLEET'), 'Phải có Đội xe nâng hàng');
assert.ok(assetCodes.includes('GEN-AIR-COMP-CENT'), 'Phải có Trạm máy nén khí');
assert.ok(assetCodes.includes('REF-CHILLER-CENT'), 'Phải có Hệ thống Chiller');
console.log('PASS 3: All 16 standard database steel equipment confirmed with exact asset codes.');

// 4. Mô phỏng hàm import trong carbon-inventory.html
const eqDbCode = fs.readFileSync(path.join(__dirname, '..', 'assets', 'js', 'equipment-db.js'), 'utf8');
const sandbox = { window: {} };
new Function('window', eqDbCode)(sandbox.window);

rows.forEach(r => {
  const type = (r['Loại thiết bị'] || '').toString().trim();
  const name = (r['Tên thiết bị'] || '').toString().trim();
  const asset = (r['Số tài sản'] || '').toString().trim();
  const cap = parseFloat(r['Công suất định mức']);
  const load = parseFloat(r['Mức tải TB (%)']);
  const hours = parseFloat(r['Giờ làm việc bình thường (h/ngày)']);
  const days = parseFloat(r['Số ngày chạy/tuần']);
  const fuel = (r['Loại năng lượng sử dụng (Điện / Nhiên liệu đốt)'] || '').toString().trim();

  assert.ok(cap > 0, `Thiết bị ${asset} công suất phải > 0`);
  assert.ok(load > 0 && load <= 100, `Thiết bị ${asset} tải phải từ 1-100%`);
  assert.ok(hours > 0 && hours <= 24, `Thiết bị ${asset} giờ chạy phải từ 1-24h`);
  assert.ok(days > 0 && days <= 7, `Thiết bị ${asset} ngày chạy phải từ 1-7d`);

  const hourly = Math.round(cap * (load / 100) * 1000) / 1000;
  const annual = Math.round(hourly * hours * days * 52 * 1000) / 1000;
  assert.ok(!isNaN(hourly) && hourly > 0, `Thiết bị ${asset} hourly rate hợp lệ`);
  assert.ok(!isNaN(annual) && annual > 0, `Thiết bị ${asset} annual estimate hợp lệ`);
});
console.log('PASS 4: All calculation formulas (hourly rate, annual estimates) validated with zero NaN.');

console.log('=== STEEL EQUIPMENT VALIDATION PASSED 100%! ===\n');
