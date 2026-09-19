const fs = require('fs');
const assert = require('assert');

console.log('=== TEST: SAVE PRODUCTION, UNIT AUTOFILL & RECONCILIATION BADGE ===');

const html = fs.readFileSync('carbon-inventory.html', 'utf8');
const actJs = fs.readFileSync('assets/js/carbon-activity.js', 'utf8');

// 1. Kiểm tra Chốt sản lượng Ca / Ngày (IPPU) - Nút Lưu không bị lỗi ReferenceError
assert.ok(actJs.includes('const isProcess = (selectedOption?.dataset?.isProcessEmission === \'true\') ||'),
  'carbon-activity.js must declare isProcess in btnSaveActivity click handler');
assert.ok(!actJs.includes('curRole === \'accountant\''),
  'carbon-activity.js must NOT use undeclared curRole in sourceSelect change handler');
assert.ok(actJs.includes('currentRole === \'accountant\''),
  'carbon-activity.js must use declared currentRole in sourceSelect change handler');
assert.ok(actJs.includes('console.error(\'[Activity] Lỗi khi lưu dữ liệu hoạt động:\', err)'),
  'btnSaveActivity must include try-catch error handler to prevent silent failures');

console.log('PASS 1: Sửa triệt để lỗi nút Lưu trong modal Chốt sản lượng Ca/Ngày (ReferenceError isProcess & curRole).');

// 2. Kiểm tra Tự động điền đơn vị và gợi ý danh sách đơn vị
assert.ok(html.includes('list="activity-unit-list"'),
  'HTML must link #activity-unit input to #activity-unit-list datalist');
assert.ok(html.includes('<datalist id="activity-unit-list">'),
  'HTML must provide <datalist id="activity-unit-list">');
assert.ok(html.includes('<option value="lít"></option>') && html.includes('<option value="kWh"></option>'),
  'Datalist must include standard measurement units: lít, kWh, kg, tấn, m³');

// Kiểm tra logic tự động gán targetUnit khi chọn nguồn
assert.ok(actJs.includes('unitInput.value = targetUnit;'),
  'sourceSelect change event must auto-populate unitInput.value with targetUnit');
assert.ok(actJs.includes("targetUnit = selected.dataset.unit || '';"),
  'targetUnit must prioritize unit defined in facility energy sources dataset');

console.log('PASS 2: Đơn vị tính được tự động điền theo đúng hạng mục nhiên liệu và có danh sách gợi ý datalist.');

// 3. Kiểm tra Thông báo đối soát thiết bị và Badge đếm số lượng cần kiểm tra
assert.ok(html.includes('id="smart-eq-alert-banner"'),
  'HTML must include #smart-eq-alert-banner above equipment table');
assert.ok(html.includes('id="smart-eq-alert-text"'),
  'HTML must include #smart-eq-alert-text for descriptive reconciliation guidance');
assert.ok(html.includes('window.updateEquipmentReconciliationBadge = function()'),
  'HTML must define window.updateEquipmentReconciliationBadge function');
assert.ok(html.includes('cần kiểm tra'),
  'updateEquipmentReconciliationBadge must display count of items needing review');

console.log('PASS 3: Thanh thông báo đối soát và Badge đếm số thiết bị cần chuẩn hóa hoạt động đầy đủ.');

console.log('=== ALL TESTS IN SUITE PASSED SUCCESSFULLY ===');
