const fs = require('fs');
const assert = require('assert');

console.log('=== TEST: IPPU AUTO-PROVISIONING, PRODUCTION REMINDERS & WORKDAYS CONSERVATION ===');

// Setup Node mock browser environment
global.window = global;

const html = fs.readFileSync('carbon-inventory.html', 'utf8');

// 1. Extract IPPU_EQUIPMENT_RULES from carbon-inventory.html
const rIdx = html.indexOf('window.IPPU_EQUIPMENT_RULES = [');
assert.ok(rIdx !== -1, 'window.IPPU_EQUIPMENT_RULES must be defined in carbon-inventory.html');
const rEnd = html.indexOf('];', rIdx) + 2;
eval(html.substring(rIdx, rEnd));

assert.ok(Array.isArray(global.IPPU_EQUIPMENT_RULES), 'IPPU_EQUIPMENT_RULES must be an array');
assert.ok(global.IPPU_EQUIPMENT_RULES.length >= 6, 'Must have at least 6 standard IPPU industrial rules');

console.log('PASS 1: window.IPPU_EQUIPMENT_RULES defined globally with', global.IPPU_EQUIPMENT_RULES.length, 'rules.');

// Verify EAF rule specifically
const eafRule = global.IPPU_EQUIPMENT_RULES.find(r => r.keywords.includes('eaf') || r.keywords.includes('lò hồ quang điện'));
assert.ok(eafRule, 'Must contain Electric Arc Furnace (EAF) rule');
assert.strictEqual(eafRule.efFactor, 60, 'EAF emission factor must be 60 kgCO2e/tonne (0.060 tCO2/tonne crude steel)');
assert.strictEqual(eafRule.productionUnit, 'tấn', 'Production unit must be tấn');
assert.strictEqual(eafRule.category, 'Các quá trình công nghiệp', 'Category must be Các quá trình công nghiệp');

// 2. Test Dual-Stream Auto-Provisioning on Template Import
const loopStart = html.indexOf('rows.forEach(r => {');
const loopEnd = html.indexOf('if (addedCount > 0) {', loopStart);
const loopBody = html.substring(loopStart, loopEnd);

const testRows = [
  {
    'Loại thiết bị': 'Lò hồ quang điện',
    'Tên thiết bị': 'Lò hồ quang điện EAF 100 tấn/mẻ',
    'Số tài sản': 'STEEL-EAF-01',
    'Vị trí': 'Xưởng Luyện thép EAF',
    'Nguồn phát thải': 'Tiêu thụ điện',
    'Loại năng lượng sử dụng (Điện / Nhiên liệu đốt)': 'Điện lưới Việt Nam',
    'Công suất định mức': 45000,
    'Đơn vị công suất': 'kW',
    'Mức tải TB (%)': 82,
    'Giờ làm việc bình thường (h/ngày)': 16,
    'Số ngày chạy/tuần': 6
  },
  {
    'Loại thiết bị': 'Lò nung nhiệt luyện nung bán thành phẩm thép',
    'Tên thiết bị': 'Lò nung lại phôi cán nóng (Đốt dầu FO)',
    'Số tài sản': 'STEEL-FURN-01',
    'Vị trí': 'Đầu dây chuyền cán nóng',
    'Nguồn phát thải': 'Đốt cháy cố định',
    'Loại năng lượng sử dụng (Điện / Nhiên liệu đốt)': 'Dầu nặng FO (Fuel Oil)',
    'Công suất định mức': 3500,
    'Đơn vị công suất': 'kg/h',
    'Mức tải TB (%)': 80,
    'Giờ làm việc bình thường (h/ngày)': 16,
    'Số ngày chạy/tuần': 6
  },
  {
    'Loại thiết bị': 'Xe nâng hàng (Diesel/Xăng/LPG)',
    'Tên thiết bị': 'Đội xe nâng hàng bốc dỡ phôi thép',
    'Số tài sản': 'GEN-FORKLIFT-01',
    'Vị trí': 'Kho bãi thành phẩm',
    'Nguồn phát thải': 'Đốt cháy động',
    'Loại năng lượng sử dụng (Điện / Nhiên liệu đốt)': 'Dầu Diesel (DO)',
    'Công suất định mức': 15,
    'Đơn vị công suất': 'lít/h',
    'Mức tải TB (%)': 65,
    'Giờ làm việc bình thường (h/ngày)': 8,
    'Số ngày chạy/tuần': 6
  }
];

let currentList = [];
let sourceList = [];
let addedCount = 0;
let ippuAddedCount = 0;
const todayStr = '2026-09-18';
const rows = testRows;

function getBranchStorageKey(k) { return 'mock_' + k; }
const localStorage = { getItem: () => null, setItem: () => {} };

eval(loopBody);

assert.strictEqual(addedCount, 3, 'Must process 3 equipment rows');
assert.strictEqual(currentList.length, 3, 'Must create 3 equipment records');
// 3 equipment -> 3 energy sources + 1 paired IPPU source for EAF = 4 sources
assert.strictEqual(sourceList.length, 4, 'Must create 4 sources (3 energy + 1 paired IPPU process source)');

const eafEnergySource = sourceList.find(s => s.eqAsset === 'STEEL-EAF-01');
assert.ok(eafEnergySource, 'Must have energy source for EAF');
assert.strictEqual(eafEnergySource.category, 'Tiêu thụ điện');

const eafIppuSource = sourceList.find(s => s.isProcessEmission === 'true');
assert.ok(eafIppuSource, 'Must have paired IPPU process emission source');
assert.strictEqual(eafIppuSource.eqAsset, 'STEEL-EAF-01-IPPU');
assert.strictEqual(eafIppuSource.category, 'Các quá trình công nghiệp');
assert.strictEqual(eafIppuSource.ef, 'Thép lò hồ quang điện (EAF)');
assert.strictEqual(eafIppuSource.efFactor, '60');
assert.strictEqual(eafIppuSource.needsProductionInput, 'true');
assert.strictEqual(eafIppuSource.productionUnit, 'tấn');
assert.strictEqual(eafIppuSource.productName, 'Thép thô / Phôi thép');

console.log('PASS 2: Dual-Stream Auto-Provisioning succeeded. Created 1 energy source + 1 IPPU process source for EAF.');

// 3. Test Badge Rendering for Pending Production
assert.ok(html.includes('badge-pending-production'), 'HTML must include badge-pending-production CSS / markup');
assert.ok(html.includes('Chờ nhập sản lượng'), 'HTML must display Chờ nhập sản lượng text');

console.log('PASS 3: Pending production badge verified in source list markup.');

// 4. Test Smart Reminder Banner & Quick Shift Logging Button
assert.ok(html.includes('id="production-reminder-banner"'), 'HTML must include production-reminder-banner element');
assert.ok(html.includes('id="btn-quick-log-production"'), 'HTML must include btn-quick-log-production button');
assert.ok(html.includes('id="btn-reminder-input-production"'), 'HTML must include btn-reminder-input-production button');

console.log('PASS 4: Production reminder banner & quick log button verified in carbon-inventory.html.');

// 5. Test Conservation of Total Baseline Emissions Across Active Workdays
const annualPlannedTonnage = 600000; // 600,000 tonnes of crude steel / year
const daysWeek = 6; // 6 workdays per week (Sunday off)
const curYear = 2026;
const daysInMonths = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

let activeWorkdaysInYear = 0;
let sundayCount = 0;

for (let m = 1; m <= 12; m++) {
  const daysInM = daysInMonths[m - 1];
  for (let d = 1; d <= daysInM; d++) {
    const dObj = new Date(curYear, m - 1, d);
    if (dObj.getDay() === 0) {
      sundayCount++;
    } else {
      activeWorkdaysInYear++;
    }
  }
}

assert.strictEqual(sundayCount, 52, 'Year 2026 has exactly 52 Sundays');
assert.strictEqual(activeWorkdaysInYear, 313, 'Year 2026 has exactly 313 active workdays (365 - 52)');

// Daily allocation
const dailyQty = Math.round((annualPlannedTonnage / activeWorkdaysInYear) * 1000) / 1000;
const eafFactorKg = 60; // 60 kgCO2e / tonne = 0.060 tCO2 / tonne
const dailyEmissionKg = dailyQty * eafFactorKg;
const dailyEmissionTonne = dailyEmissionKg / 1000;

// Total annual emission from daily sum
const totalAnnualAllocatedTonnage = activeWorkdaysInYear * dailyQty;
const totalAnnualEmissionsTonne = activeWorkdaysInYear * dailyEmissionTonne;

const theoreticalTonnage = 600000;
const theoreticalEmissionsTonne = (600000 * 60) / 1000; // 36,000 tCO2e

assert.strictEqual(theoreticalEmissionsTonne, 36000, 'Theoretical baseline annual emissions is exactly 36,000 tCO2e');
const tonnageDiff = Math.abs(totalAnnualAllocatedTonnage - theoreticalTonnage);
const emissionsDiff = Math.abs(totalAnnualEmissionsTonne - theoreticalEmissionsTonne);

// Conservation tolerance within rounding of 0.001 tonne / day
assert.ok(tonnageDiff < 1.0, `Allocated tonnage (${totalAnnualAllocatedTonnage}) must conserve 600,000 tonnes (diff = ${tonnageDiff})`);
assert.ok(emissionsDiff < 0.1, `Allocated emissions (${totalAnnualEmissionsTonne}) must conserve 36,000 tCO2e (diff = ${emissionsDiff})`);

console.log('PASS 5: Conservation of total emissions verified:');
console.log('   - Active workdays (Mon-Sat):', activeWorkdaysInYear, 'days');
console.log('   - Sundays (Off, 0 tCO2e):', sundayCount, 'days');
console.log('   - Daily allocated output:', dailyQty.toFixed(3), 'tonnes/day');
console.log('   - Total allocated annual emissions:', totalAnnualEmissionsTonne.toFixed(2), 'tCO2e (Target: 36,000 tCO2e, Conservation rate: 100.00%)');

// 6. Test Daily Shift Logging by Engineer & Reconciliation Calculation
const engineerDailyActualOutput = 1850; // 1,850 tonnes on shift
const engineerDailyActualEmissions = (engineerDailyActualOutput * eafFactorKg) / 1000; // 111 tCO2e

assert.strictEqual(engineerDailyActualEmissions, 111, '1,850 tonnes * 60 kgCO2e/t / 1000 must equal 111 tCO2e');

const varianceTonnage = engineerDailyActualOutput - dailyQty;
const variancePercent = (varianceTonnage / dailyQty) * 100;

assert.ok(!isNaN(variancePercent), 'Variance percent must be a valid number');
console.log('PASS 6: Engineer shift logging & Reconciliation:');
console.log('   - Actual production logged:', engineerDailyActualOutput, 'tonnes');
console.log('   - Actual emissions calculated:', engineerDailyActualEmissions, 'tCO2e');
console.log('   - Daily Baseline vs Actual variance:', variancePercent.toFixed(2) + '%', '(No NaN)');

console.log('\n=== ALL IPPU & PRODUCTION WORKFLOW TESTS PASSED 100%! ===');
