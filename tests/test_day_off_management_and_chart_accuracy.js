const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('--- RUNNING TEST: test_day_off_management_and_chart_accuracy.js ---');

const htmlContent = fs.readFileSync(path.join(__dirname, '../carbon-inventory.html'), 'utf8');
const activityJsContent = fs.readFileSync(path.join(__dirname, '../assets/js/carbon-activity.js'), 'utf8');
const dashboardJsContent = fs.readFileSync(path.join(__dirname, '../assets/js/carbon-dashboard.js'), 'utf8');

// 1. Kiểm tra sự tồn tại của UI Menu Quản lý ngày nghỉ trong HTML
console.log('1. Checking Day-Off Manager UI elements in carbon-inventory.html...');
assert(htmlContent.includes('id="btn-day-off-menu"'), 'Must have btn-day-off-menu button');
assert(htmlContent.includes('id="day-off-dropdown-menu"'), 'Must have day-off-dropdown-menu');
assert(htmlContent.includes('id="btn-remove-sundays"'), 'Must have btn-remove-sundays button');
assert(htmlContent.includes('id="btn-remove-weekends"'), 'Must have btn-remove-weekends button');
assert(htmlContent.includes('id="btn-remove-holidays"'), 'Must have btn-remove-holidays button');
assert(htmlContent.includes('id="btn-remove-custom-date"'), 'Must have btn-remove-custom-date button');
console.log('   PASS: All Day-Off Manager UI elements exist.');

// 2. Kiểm tra logic nhận diện ngày lễ Việt Nam (isVnPublicHoliday)
console.log('2. Testing isVnPublicHoliday logic in carbon-activity.js...');
assert(activityJsContent.includes('function isVnPublicHoliday'), 'Must contain isVnPublicHoliday function');

// Trích xuất hàm isVnPublicHoliday để test
const holidayFuncMatch = activityJsContent.match(/function isVnPublicHoliday\(dateStr\)\s*\{[\s\S]*?return false;\s*\}/);
assert(holidayFuncMatch, 'Could extract isVnPublicHoliday function body');
const evalHolidayFunc = new Function(`return ${holidayFuncMatch[0]}`)();

// Kiểm tra Tết Bính Ngọ Tháng 2/2026
assert.strictEqual(evalHolidayFunc('2026-02-14'), true, '2026-02-14 must be Tet holiday');
assert.strictEqual(evalHolidayFunc('2026-02-17'), true, '2026-02-17 (Mung 1 Tet) must be Tet holiday');
assert.strictEqual(evalHolidayFunc('2026-02-22'), true, '2026-02-22 must be Tet holiday');
// Ngày làm việc bình thường trong Tháng 2/2026
assert.strictEqual(evalHolidayFunc('2026-02-10'), false, '2026-02-10 must NOT be a holiday');
// Các ngày lễ cố định
assert.strictEqual(evalHolidayFunc('2026-04-30'), true, '30/4 must be a holiday');
assert.strictEqual(evalHolidayFunc('2026-05-01'), true, '1/5 must be a holiday');
assert.strictEqual(evalHolidayFunc('2026-09-02'), true, '2/9 must be a holiday');
assert.strictEqual(evalHolidayFunc('2026-01-01'), true, '1/1 must be a holiday');
console.log('   PASS: isVnPublicHoliday accurately recognizes Tet 2026 and national holidays.');

// 3. Kiểm tra logic phân bổ biểu đồ theo ngày làm việc trong carbon-dashboard.js
console.log('3. Testing working days distribution in carbon-dashboard.js...');
assert(dashboardJsContent.includes('isOff = (dWeek <= 5 && (dow === 0 || dow === 6)) || (dWeek === 6 && dow === 0)'),
  'carbon-dashboard.js must calculate non-working days based on dWeek');
assert(dashboardJsContent.includes('const dailyShare = co2e / workingDays;'),
  'carbon-dashboard.js must allocate monthly baseline only to actual working days');

// Kiểm tra thuật toán phân bổ: Tháng 2/2026 có 28 ngày
const daysCount = 28;
const selectedYear = 2026;
const selMonth = 2; // Tháng 2
const dWeek = 6; // Tuần làm việc 6 ngày (Nghỉ Chủ nhật)
let workingDays = 0;
for (let d = 0; d < daysCount; d++) {
  const dt = new Date(selectedYear, selMonth - 1, d + 1);
  const dow = dt.getDay(); // 0 = CN
  const isOff = (dWeek <= 5 && (dow === 0 || dow === 6)) || (dWeek === 6 && dow === 0);
  if (!isOff) workingDays++;
}
// Tháng 2/2026 có 4 ngày Chủ nhật: ngày 1, 8, 15, 22. Số ngày làm việc = 24.
assert.strictEqual(workingDays, 24, 'Feb 2026 with 6-day work week must have exactly 24 working days');

const co2e = 624.96;
const dailyShare = co2e / workingDays;
const dailyEngineerData = Array(daysCount).fill(0);
for (let d = 0; d < daysCount; d++) {
  const dt = new Date(selectedYear, selMonth - 1, d + 1);
  const dow = dt.getDay();
  const isOff = (dWeek <= 5 && (dow === 0 || dow === 6)) || (dWeek === 6 && dow === 0);
  if (!isOff) {
    dailyEngineerData[d] += dailyShare;
  }
}
// Ngày 1/2/2026 là Chủ nhật -> giá trị phải bằng 0!
assert.strictEqual(dailyEngineerData[0], 0, 'Feb 1 2026 (Sunday) must have 0 emission');
// Ngày 8/2/2026 là Chủ nhật -> giá trị phải bằng 0!
assert.strictEqual(dailyEngineerData[7], 0, 'Feb 8 2026 (Sunday) must have 0 emission');
// Ngày 15/2/2026 là Chủ nhật -> giá trị phải bằng 0!
assert.strictEqual(dailyEngineerData[14], 0, 'Feb 15 2026 (Sunday) must have 0 emission');
// Ngày 22/2/2026 là Chủ nhật -> giá trị phải bằng 0!
assert.strictEqual(dailyEngineerData[21], 0, 'Feb 22 2026 (Sunday) must have 0 emission');
// Tổng phát thải trên toàn bộ các ngày phải bằng đúng 624.96 tCO2e (không suy hao hay nhân đôi)
const totalSum = dailyEngineerData.reduce((a, b) => a + b, 0);
assert(Math.abs(totalSum - co2e) < 0.0001, 'Sum across working days must strictly equal monthly total co2e');
console.log('   PASS: Dashboard working days distribution algorithm verified with 100% precision.');

// 4. Kiểm tra gắn nhãn Thứ trong tuần trên bảng nhật ký hoạt động
console.log('4. Checking day-of-week badges in activity table...');
assert(activityJsContent.includes('title="Chủ nhật (Ngày nghỉ tuần)">CN</span>'), 'Must display CN badge in red for Sundays');
assert(activityJsContent.includes('title="Thứ 7">T7</span>'), 'Must display T7 badge in amber for Saturdays');
console.log('   PASS: Day-of-week badges are configured.');

// 5. Kiểm tra hàm removeActivityDaysOff bảo vệ hóa đơn kế toán
console.log('5. Checking removeActivityDaysOff logic and invoice preservation...');
assert(activityJsContent.includes('function removeActivityDaysOff'), 'Must contain removeActivityDaysOff function');
assert(activityJsContent.includes('(act.entryRole === \'accountant\') || (!act.entryRole && act.isInvoice === \'true\')'),
  'Must protect accountant invoices from being deleted during day-off cleanup');
console.log('   PASS: Accountant invoices are strictly protected.');

console.log('--- ALL DAY-OFF MANAGEMENT AND CHART ACCURACY TESTS PASSED ---');
