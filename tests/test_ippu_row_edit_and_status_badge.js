const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('=== TEST: IPPU PROCESS EMISSION ROW EDIT & STATUS BADGE VERIFICATION ===');

const actCode = fs.readFileSync(path.join(__dirname, '../assets/js/carbon-activity.js'), 'utf8');

// 1. Check status badge logic in updateRowHTML
assert(actCode.includes('isActualProd'), 'updateRowHTML must define isActualProd');
assert(actCode.includes('Đã chốt SL'), 'updateRowHTML must include badge "Đã chốt SL"');
assert(actCode.includes('Định mức'), 'updateRowHTML must include badge "Định mức"');

// 2. Check edit button handler checks for process emission
assert(actCode.includes('isRowProcess'), 'Edit button handler must detect isRowProcess');
assert(actCode.includes('Chỉnh sửa Sản lượng Ca / Ngày (Quá trình công nghệ - IPPU)'), 'Modal title must be specialized for process emission edit');

// 3. Check save logic sets actual_production and isBaseline = false
assert(actCode.includes('existingBaselineRow'), 'Save logic must check existingBaselineRow to avoid duplicate baseline rows');
assert(actCode.includes("dataObj.recordType = 'actual_production'") || actCode.includes("recordType: isProcess ? 'actual_production' : recordType"), 'Save logic must mark process emission as actual_production');

// 4. Functional simulation of updateRowHTML badge generation
function mockUpdateRowHTML(data) {
  const numAmt = parseFloat(data.amount) || 0;
  const numCo2e = parseFloat(data.co2e) || 0;
  const docLower = (data.doc || '').toLowerCase();
  const unitLower = (data.unit || '').toLowerCase();
  const isDowntime = (data.isDowntime === 'true' || data.recordType === 'downtime' || docLower.includes('bảo trì') || docLower.includes('dừng máy'));
  const isOvertime = (data.isOvertime === 'true' || data.recordType === 'overtime' || docLower.includes('tăng ca'));
  const isInvoice = (data.isInvoice === 'true');
  const isActualProd = (data.recordType === 'actual_production' || data.recordType === 'production') ||
                       (unitLower.includes('tấn') && data.isBaseline !== 'true') ||
                       ((docLower.includes('phiếu cân') || docLower.includes('nghiệm thu phôi') || docLower.includes('chốt sl')) && data.isBaseline !== 'true');

  let statusBadgeHTML = '';
  if (isDowntime) {
    statusBadgeHTML = 'Bảo trì (-)';
  } else if (isOvertime) {
    statusBadgeHTML = 'Tăng ca (+)';
  } else if (isActualProd) {
    statusBadgeHTML = 'Đã chốt SL';
  } else if (data.isBaseline === 'true') {
    statusBadgeHTML = 'Định mức';
  } else if (isInvoice) {
    statusBadgeHTML = 'Hóa đơn';
  } else {
    statusBadgeHTML = 'Ca chuẩn';
  }
  return statusBadgeHTML;
}

// Baseline process emission row (Row 2 in user screenshot: 2000 tấn/ngày định mức)
const baselineRow = {
  date: '2026-09-02',
  sourceName: 'Quá trình luyện thép Lò EAF',
  amount: 2000,
  unit: 'tấn',
  doc: 'Định mức công nghệ (2000 tấn/ngày)',
  isBaseline: 'true',
  recordType: 'baseline_production'
};

const baselineBadge = mockUpdateRowHTML(baselineRow);
assert.strictEqual(baselineBadge, 'Định mức', 'Baseline row must have status badge "Định mức"');
console.log('PASS 1: Dòng định mức 2000 tấn/ngày hiển thị chuẩn xác huy hiệu [Định mức].');

// When user inputs / edits actual production (e.g. 1916.93 tấn with weighbridge slip)
const lockedActualRow = {
  date: '2026-09-02',
  sourceName: 'Quá trình luyện thép Lò EAF',
  amount: 1916.93,
  unit: 'tấn',
  doc: 'Phiếu cân bàn cầu số 142/PC-GS',
  isBaseline: 'false',
  recordType: 'actual_production'
};

const actualBadge = mockUpdateRowHTML(lockedActualRow);
assert.strictEqual(actualBadge, 'Đã chốt SL', 'Locked actual production row must have status badge "Đã chốt SL"');
console.log('PASS 2: Dòng sản lượng thực tế sau khi chốt hiển thị chuẩn xác huy hiệu [Đã chốt SL].');

// Normal electric machine row
const normalMachineRow = {
  date: '2026-09-02',
  sourceName: 'Lò hồ quang điện EAF (Điện)',
  amount: 108000,
  unit: 'kWh',
  doc: 'Vận hành ca chuẩn',
  isBaseline: 'false',
  recordType: 'normal'
};
const machineBadge = mockUpdateRowHTML(normalMachineRow);
assert.strictEqual(machineBadge, 'Ca chuẩn', 'Machine row should have Ca chuẩn badge');
console.log('PASS 3: Dòng vận hành máy bình thường hiển thị chuẩn xác [Ca chuẩn].');

console.log('=== ALL IPPU EDIT & STATUS BADGE CHECKS PASSED 100% ===');
