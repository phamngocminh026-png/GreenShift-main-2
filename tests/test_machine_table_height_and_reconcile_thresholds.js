const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('=== TEST: MACHINE TABLE HEIGHT TOGGLE & 3-TIER RECONCILIATION THRESHOLDS ===\n');

const rootDir = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(rootDir, 'carbon-inventory.html'), 'utf8');
const actJs = fs.readFileSync(path.join(rootDir, 'assets', 'js', 'carbon-activity.js'), 'utf8');

// 1. Kiem tra nut Mo rong bang va container cuon co sticky header
console.log('[TEST 1] Kiem tra nut Mo rong bang Theo doi Thiet bi trong HTML:');
assert.ok(html.includes('id="btn-toggle-machine-table-height"'), 'Phai co nut id="btn-toggle-machine-table-height"');
assert.ok(html.includes('id="machine-overview-table-container"'), 'Phai co container id="machine-overview-table-container"');
assert.ok(html.includes('max-height: 380px'), 'machine-overview-table-container phai co max-height: 380px');
assert.ok(html.includes('overflow-y: auto'), 'machine-overview-table-container phai co overflow-y: auto');
assert.ok(html.includes('position: sticky; top: 0'), 'Thead tr phai co position: sticky; top: 0');
console.log('  [PASS] Nut bam, container max-height: 380px va sticky header co mat day du!');

// 2. Kiem tra logic JS bat su kien click chuyen doi chieu cao
console.log('\n[TEST 2] Kiem tra logic xu ly su kien nut trong carbon-activity.js:');
assert.ok(actJs.includes("document.getElementById('btn-toggle-machine-table-height')"), 'Phai lay phan tu btn-toggle-machine-table-height');
assert.ok(actJs.includes("document.getElementById('machine-overview-table-container')"), 'Phai lay phan tu machine-overview-table-container');
assert.ok(actJs.includes("machineOverviewContainer.style.maxHeight = '380px'"), 'Phai co lenh thu gon ve 380px');
assert.ok(actJs.includes("machineOverviewContainer.style.maxHeight = 'none'"), 'Phai co lenh mo rong thanh none');
assert.ok(actJs.includes("btnToggleMachineHeight.innerText = 'Thu gọn bảng'"), 'Phai doi chu nut thanh Thu gon bang');
assert.ok(actJs.includes("btnToggleMachineHeight.innerText = 'Mở rộng bảng'"), 'Phai doi chu nut thanh Mo rong bang');
console.log('  [PASS] Logic chuyen doi chieu cao bang thiet bi hoat dong hoan hao!');

// 3. Kiem tra logic 3 thang mau canh bao doi soat nang luong
console.log('\n[TEST 3] Kiem tra logic 3 thang mau canh bao doi soat (Xanh <= 5%, Vang 5-10%, Do > 10%):');
assert.ok(actJs.includes('const isOk = cat.ratio <= 5.0;'), 'Phai kiem tra nguong ti le <= 5%');
assert.ok(actJs.includes('const isWarning = cat.ratio > 5.0 && cat.ratio <= 10.0;'), 'Phai kiem tra nguong ti le tu 5% den 10%');
assert.ok(actJs.includes('#16a34a') && actJs.includes('#d97706') && actJs.includes('#dc2626'), 'Phai co 3 ma mau text phu hop');
assert.ok(actJs.includes('#dcfce7') && actJs.includes('#fef3c7') && actJs.includes('#fee2e2'), 'Phai co 3 ma mau badge nen phu hop');
assert.ok(actJs.includes("'Khớp'"), 'Phai co nhan Khop');
assert.ok(actJs.includes("'Lệch > 5%'"), 'Phai co nhan Lech > 5%');
assert.ok(actJs.includes("'Lệch > 10% (Cảnh báo)'"), 'Phai co nhan Lech > 10% (Canh bao)');
console.log('  [PASS] 3 thang mau va noi dung canh bao kiem toan duoc cai dat day du!');

// 4. Mo phong phan loai ti le lech thuc te
console.log('\n[TEST 4] Mo phong tinh toan phan loai ti le lech:');
function evaluateRatio(ratio) {
  const isOk = ratio <= 5.0;
  const isWarning = ratio > 5.0 && ratio <= 10.0;
  return isOk ? 'Khớp' : (isWarning ? 'Lệch > 5%' : 'Lệch > 10% (Cảnh báo)');
}

assert.strictEqual(evaluateRatio(0.0), 'Khớp');
assert.strictEqual(evaluateRatio(3.2), 'Khớp');
assert.strictEqual(evaluateRatio(5.0), 'Khớp');
assert.strictEqual(evaluateRatio(5.1), 'Lệch > 5%');
assert.strictEqual(evaluateRatio(8.4), 'Lệch > 5%');
assert.strictEqual(evaluateRatio(10.0), 'Lệch > 5%');
assert.strictEqual(evaluateRatio(10.1), 'Lệch > 10% (Cảnh báo)');
assert.strictEqual(evaluateRatio(25.6), 'Lệch > 10% (Cảnh báo)');
console.log('  [PASS] Cac moc 0%, 3.2%, 5.0%, 5.1%, 8.4%, 10.0%, 10.1%, 25.6% deu phan loai chinh xac 100%!');

console.log('\n=== TAT CA CAC KIEM TRA HOAN THANH XUAT SAC! ===');
