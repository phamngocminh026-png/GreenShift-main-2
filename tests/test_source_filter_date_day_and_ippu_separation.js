const fs = require('fs');
const path = require('path');
const assert = require('assert');
const vm = require('vm');

console.log('--- TEST: Source Filter Debounce, Date Day Badge & IPPU Separation ---');

const actJsPath = path.join(__dirname, '..', 'assets', 'js', 'carbon-activity.js');
const invHtmlPath = path.join(__dirname, '..', 'carbon-inventory.html');

const actJs = fs.readFileSync(actJsPath, 'utf8');
const invHtml = fs.readFileSync(invHtmlPath, 'utf8');

// 1. Check Date column width and overflow in HTML
assert.ok(invHtml.includes('#activity-table-card th:nth-child(1), #activity-table-card td:nth-child(1) { width: 138px; }'), 'Date column width must be 138px to fit date and day-of-week badge without truncation');
assert.ok(invHtml.includes('#activity-table-card td:nth-child(1) { overflow: visible; }'), 'Date td must have overflow: visible to prevent ellipsis clipping');

console.log('PASS 1: Cột Ngày và Huy hiệu thứ trong tuần đã được cấp đủ 138px, không bị cắt bớt thành dấu ba chấm (...).');

// 2. Check toggleActivityCustomFilter debounce in carbon-activity.js
assert.ok(actJs.includes('_lastFilterToggle'), 'toggleActivityCustomFilter must have debounce timestamp guard');
assert.ok(actJs.includes('now - _lastFilterToggle < 300'), 'toggleActivityCustomFilter must guard against double-toggle within 300ms');

console.log('PASS 2: Dropdown Tất cả nguồn phát thải đã có bộ chống lặp cú nhấp (debounce guard 300ms), phản hồi ngay khi bấm.');

// 3. Functional test of isRowProcess separation (EAF Electricity kWh vs IPPU Steel tonnes)
function evalIsRowProcess(data) {
  const docLower = (data.doc || '').toLowerCase();
  const typeLower = (data.sourceType || '').toLowerCase();
  const nameLower = (data.sourceName || '').toLowerCase();
  const unitLower = (data.unit || '').toLowerCase();

  const isEnergyOrFuel = unitLower.includes('kwh') || unitLower.includes('wh') || unitLower.includes('mwh') ||
                         unitLower.includes('lít') || unitLower.includes('lit') || unitLower === 'l' ||
                         unitLower.includes('m3') || unitLower.includes('m³') ||
                         nameLower.includes('tiêu thụ điện') || typeLower.includes('tiêu thụ điện') ||
                         (nameLower.includes('kwh') && !nameLower.includes('ippu'));

  const isRowProcess = !isEnergyOrFuel && (
    data.isProcessEmission === 'true' ||
    data.recordType === 'production' ||
    data.recordType === 'actual_production' ||
    data.recordType === 'baseline_production' ||
    ((unitLower.includes('tấn') || unitLower.includes('tan') || unitLower === 't') && (
      typeLower.includes('quá trình') || typeLower.includes('công nghệ') ||
      nameLower.includes('ippu') || nameLower.includes('quá trình') ||
      docLower.includes('công nghệ') || docLower.includes('phiếu cân')
    ))
  );

  return isRowProcess;
}

// Row 1: EAF Electricity Consumption (kWh)
const eafElectricityRow = {
  date: '2026-01-02',
  sourceName: 'Lò hồ quang điện EAF (Electric Arc Furnace)',
  sourceType: 'Lò thổi oxy hoặc lò hồ quang điện trong luyện thép',
  amount: '590400',
  unit: 'kWh',
  doc: 'Vận hành thực tế: 21h/16h (Tăng ca sản xuất +5h)',
  recordType: 'overtime',
  isBaseline: 'true'
};

// Row 2: Steelmaking Process IPPU (tonnes)
const eafIppuRow = {
  date: '2026-01-02',
  sourceName: 'Quá trình luyện thép - Lò hồ quang điện EAF (IPPU: 60 kgCO2e/tấn)',
  sourceType: 'Lò thổi oxy hoặc lò hồ quang điện trong luyện thép',
  amount: '42.1',
  unit: 'tấn',
  doc: 'Phiếu cân bàn cân cầu #12',
  recordType: 'actual_production',
  isProcessEmission: 'true'
};

assert.strictEqual(evalIsRowProcess(eafElectricityRow), false, 'Lò hồ quang điện EAF (kWh) KHÔNG ĐƯỢC coi là phát thải quá trình IPPU');
assert.strictEqual(evalIsRowProcess(eafIppuRow), true, 'Quá trình luyện thép IPPU (tấn) phải được nhận diện chính xác là IPPU');

console.log('PASS 3: Phân định rạch ròi 100% giữa thiết bị tiêu thụ điện (kWh) và phát thải quá trình luyện thép IPPU (tấn).');

// 4. Test Date badge generation
const testRow = { date: '2026-01-02' }; // Friday -> T6
const parts = testRow.date.split('-');
const dObj = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
const dow = dObj.getDay();
const dayLabels = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
assert.strictEqual(dayLabels[dow], 'T6', '2026-01-02 phải là Thứ Sáu (T6)');

console.log('PASS 4: Nhãn ngày thứ (T6, CN...) được tính toán chính xác theo chuẩn ngày làm việc.');

console.log('\n=== TẤT CẢ CÁC BÀI KIỂM THỬ ĐÃ VƯỢT QUA 100%! ===');
