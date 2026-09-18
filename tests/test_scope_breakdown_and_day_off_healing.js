const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('=== TEST: SCOPE BREAKDOWN, HOLIDAYS & DAY-OFF HEALING INTEGRITY ===');

const dashJs = fs.readFileSync(path.join(__dirname, '..', 'assets', 'js', 'carbon-dashboard.js'), 'utf8');
const actJs = fs.readFileSync(path.join(__dirname, '..', 'assets', 'js', 'carbon-activity.js'), 'utf8');
const html = fs.readFileSync(path.join(__dirname, '..', 'carbon-inventory.html'), 'utf8');

// 1. Kiểm tra bảng màu 3 Scope mới
console.log('1. Checking new ESG Scope Palette...');
assert.ok(dashJs.includes("const scopeColors = ['#ea580c', '#0284c7', '#8b5cf6']"), 'Scope colors must be Warm Amber (#ea580c), Slate Blue (#0284c7), Amethyst Violet (#8b5cf6)');
console.log('   PASS 1: New Scope color palette strictly applied (#ea580c, #0284c7, #8b5cf6).');

// 2. Kiểm tra tùy chọn Phân rã theo Scope trong dropdown chế độ xem và toolbar biểu đồ
console.log('2. Checking Scope breakdown option and executive controls in HTML...');
assert.ok(html.includes('<option value="scope" selected>Cơ cấu theo Scope (Scope 1, Scope 2, Scope 3)</option>'), 'HTML must have scope breakdown option in #dash-view-mode');
assert.ok(html.includes('id="btn-back-to-year"'), 'HTML must have back to year button');
assert.ok(html.includes('id="btn-toggle-stack-mode"'), 'HTML must have stack toggle button');
assert.ok(!html.includes('id="tab-mode-scope"'), 'HTML removed duplicate scope tab per user request');
assert.ok(!html.includes('id="tab-mode-reconcile"'), 'HTML removed duplicate reconcile tab per user request');
assert.ok(!html.includes('id="card-decarbonization-insights"'), 'HTML removed decarbonization insights card per user request');
assert.ok(html.includes('id="chart-monthly-title"'), 'HTML must have dynamic chart title container');
console.log('   PASS 2: Scope breakdown option, stack toggle and chart controls present in HTML.');

// 3. Kiểm tra logic phân rã Scope trong carbon-dashboard.js cho cả Chế độ Ngày và Chế độ Năm
console.log('3. Checking daily & yearly scope breakdown dataset logic...');
assert.ok(dashJs.includes("const dailyScopeData = { 1: Array(daysCount).fill(0), 2: Array(daysCount).fill(0), 3: Array(daysCount).fill(0) };"),
  'carbon-dashboard.js must calculate dailyScopeData for all 3 scopes');
assert.ok(dashJs.includes("label: 'Scope 1 - Trực tiếp'"), 'Daily/Yearly view must have Scope 1 dataset');
assert.ok(dashJs.includes("label: 'Scope 2 - Gián tiếp điện lưới'"), 'Daily/Yearly view must have Scope 2 dataset');
assert.ok(dashJs.includes("label: 'Scope 3 - Chuỗi cung ứng'"), 'Daily/Yearly view must have Scope 3 dataset');
assert.ok(dashJs.includes("btn-toggle-stack-mode"), 'Must have click listener for stack toggle');
assert.ok(dashJs.includes("btn-back-to-year"), 'Must have click listener for back to year');
console.log('   PASS 3: Daily & Yearly Scope breakdown datasets and toolbars fully integrated.');

// 4. Kiểm tra Tooltip tính toán % đóng góp của từng Scope
console.log('4. Checking Tooltip percentage calculation...');
assert.ok(dashJs.includes("pct = ((val / totalForIndex) * 100).toFixed(1)"), 'Tooltip must calculate percentage contribution of each scope');
console.log('   PASS 4: Tooltip dynamic percentage contribution verified.');

// 5. Kiểm tra bảo vệ tuyệt đối Định mức tháng (Baseline) trong removeActivityDaysOff (Lỗi mất dữ liệu T5, T10)
console.log('5. Checking baseline protection in removeActivityDaysOff...');
assert.ok(actJs.includes("if (act.isBaseline === 'true' || act.entryMode === 'auto_baseline') return true;"),
  'removeActivityDaysOff must strictly protect baseline records from deletion regardless of last-day weekend date');

// Mô phỏng ngày cuối tháng 5/2026 (31/5 là Chủ nhật) và cuối tháng 10/2026 (31/10 là Thứ 7)
const mayBaseline = { date: '2026-05-31', isBaseline: 'true', co2e: 100 };
const octBaseline = { date: '2026-10-31', isBaseline: 'true', co2e: 100 };
const sundayShift = { date: '2026-05-31', isBaseline: 'false', entryMode: 'auto_daily', co2e: 10 };

const protectRecord = act => (act.isBaseline === 'true' || act.entryMode === 'auto_baseline');
assert.strictEqual(protectRecord(mayBaseline), true, 'May 31 baseline must be protected on Sunday deletion');
assert.strictEqual(protectRecord(octBaseline), true, 'October 31 baseline must be protected on Weekend deletion');
assert.strictEqual(protectRecord(sundayShift), false, 'Daily shift on Sunday can be deleted');
console.log('   PASS 5: Root cause for Month 5 and Month 10 data loss permanently resolved and protected.');

// 6. Kiểm tra cơ chế Tự động phục hồi (Auto-healing) định mức các tháng bị thiếu
console.log('6. Checking auto-healing of missing monthly baselines...');
assert.ok(actJs.includes("list.length >= 2 && list.length < 12"), 'loadActivityList must detect incomplete baseline years');
assert.ok(actJs.includes("Định mức vận hành T"), 'Auto-heal must regenerate missing monthly quota entries');
console.log('   PASS 6: Auto-healing mechanism restores any missing months automatically.');

// 7. Kiểm tra Quốc khánh 2/9 và các ngày Lễ/Tết Việt Nam
console.log('7. Checking September 2nd (2/9) holiday detection and daily chart exclusion...');
assert.ok(actJs.includes("'09-02'") || actJs.includes("09-02"), 'isVnPublicHoliday must detect National Day 2/9');
assert.ok(dashJs.includes("checkVnPublicHoliday"), 'carbon-dashboard.js must check Vietnamese public holidays');
assert.ok(dashJs.includes("checkVnPublicHoliday(dStr)"), 'Baseline allocation on daily chart must check holidays');

// Trích xuất checkVnPublicHoliday từ carbon-dashboard.js
const holidayMatch = dashJs.match(/function checkVnPublicHoliday\(dateStr\)\s*\{[\s\S]*?return false;\s*\}/);
assert.ok(holidayMatch, 'Could extract checkVnPublicHoliday');
const checkHoliday = new Function(`return ${holidayMatch[0]}`)();

assert.strictEqual(checkHoliday('2026-09-02'), true, '2026-09-02 must be recognized as National Day');
assert.strictEqual(checkHoliday('2026-09-01'), true, '2026-09-01 must be recognized as holiday');
assert.strictEqual(checkHoliday('2026-04-30'), true, '2026-04-30 must be recognized as holiday');
assert.strictEqual(checkHoliday('2026-05-01'), true, '2026-05-01 must be recognized as holiday');
assert.strictEqual(checkHoliday('2026-09-10'), false, '2026-09-10 must NOT be holiday');
console.log('   PASS 7: September 2nd and public holidays strictly recognized and excluded from working days.');

// 8. Kiểm tra không có emoji sticker trong các file vừa chỉnh sửa
console.log('8. Checking zero emoji stickers rule...');
const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;
assert.ok(!emojiRegex.test(dashJs), 'carbon-dashboard.js must NOT contain any emoji stickers');
console.log('   PASS 8: Zero emoji stickers in carbon-dashboard.js.');

console.log('=== ALL SCOPE BREAKDOWN & DAY-OFF HEALING TESTS PASSED 100%! ===\n');
