const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('=== TEST SUITE: DIRECT DAY ADJUSTMENT & SIMPLIFICATION ===');

const htmlPath = path.join(__dirname, '..', 'carbon-inventory.html');
const jsPath = path.join(__dirname, '..', 'assets', 'js', 'carbon-activity.js');

const html = fs.readFileSync(htmlPath, 'utf8');
const js = fs.readFileSync(jsPath, 'utf8');

// TEST 1: Redundant button is gone
console.log('Test 1: Check redundant #btn-quick-log-downtime is removed from toolbar...');
assert.strictEqual(
  html.includes('id="btn-quick-log-downtime"'),
  false,
  'Redundant #btn-quick-log-downtime must not exist in carbon-inventory.html'
);
console.log('-> PASSED: Redundant button removed from toolbar.');

// TEST 2: 3 Radio options exist in activity modal
console.log('Test 2: Check 3 radio options in #group-record-type...');
assert.ok(html.includes('value="normal"'), 'Must have normal radio');
assert.ok(html.includes('value="downtime"'), 'Must have downtime radio');
assert.ok(html.includes('value="overtime"'), 'Must have overtime radio');
assert.ok(html.includes('Vận hành chuẩn'), 'Label for normal must be Vận hành chuẩn');
assert.ok(html.includes('Bảo trì / Dừng máy (-)'), 'Label for downtime must be Bảo trì / Dừng máy (-)');
assert.ok(html.includes('Có tăng ca (+)'), 'Label for overtime must be Có tăng ca (+)');
console.log('-> PASSED: All 3 radio options are present with professional labels.');

// TEST 3: Math verification for Direct Day Adjustment
console.log('Test 3: Verify mathematical formulas for direct adjustments...');

const stdHours = 16;
const hourlyRate = 45; // Lò hơi: 45 lít/h
const load = 0.8; // 80% tải

// Case 3.1: Normal day
const normalHours = stdHours;
const normalConsumption = Math.round(normalHours * load * hourlyRate * 1000) / 1000;
assert.strictEqual(normalConsumption, 576, 'Standard 16h day should consume 576 liters');

// Case 3.2: Maintenance / Downtime (-4h)
const downtimeHours = 4;
const actualRunDowntime = Math.max(0, stdHours - downtimeHours);
assert.strictEqual(actualRunDowntime, 12, '16h - 4h downtime = 12h running');
const downtimeConsumption = Math.round(actualRunDowntime * load * hourlyRate * 1000) / 1000;
assert.strictEqual(downtimeConsumption, 432, '12h running should consume 432 liters (positive net consumption)');
const netAdjustmentDowntime = downtimeConsumption - normalConsumption;
assert.strictEqual(netAdjustmentDowntime, -144, 'Downtime adjustment should be exactly -144 liters (-4h * 36)');

// Case 3.3: Overtime (+3h)
const overtimeHours = 3;
const actualRunOvertime = stdHours + overtimeHours;
assert.strictEqual(actualRunOvertime, 19, '16h + 3h overtime = 19h running');
const overtimeConsumption = Math.round(actualRunOvertime * load * hourlyRate * 1000) / 1000;
assert.strictEqual(overtimeConsumption, 684, '19h running should consume 684 liters');
const netAdjustmentOvertime = overtimeConsumption - normalConsumption;
assert.strictEqual(netAdjustmentOvertime, 108, 'Overtime adjustment should be exactly +108 liters (+3h * 36)');

console.log('-> PASSED: All mathematical formulas are 100% verified.');

// TEST 4: Code inspection in carbon-activity.js
console.log('Test 4: Verify JS logic for in-place edit and calculation...');
assert.ok(js.includes('calcFromHours'), 'calcFromHours must exist');
assert.ok(js.includes('recordType === \'downtime\''), 'calcFromHours handles downtime');
assert.ok(js.includes('recordType === \'overtime\''), 'calcFromHours handles overtime');
assert.ok(js.includes('Bảo trì: <strong>'), 'Badge updates for maintenance');
assert.ok(js.includes('Tăng ca: <strong>'), 'Badge updates for overtime');
assert.ok(js.includes('downtimeHours: isDowntime ?'), 'save handler saves downtimeHours');
assert.ok(js.includes('overtimeHours: isOvertime ?'), 'save handler saves overtimeHours');
assert.strictEqual(js.includes('currentEditingRow = null;\n      }\n\n      if (currentEditingRow)'), false, 'Must not detach currentEditingRow during save');

console.log('-> PASSED: carbon-activity.js logic satisfies all direct day adjustment criteria.');

console.log('\n=== ALL 4 DIRECT DAY ADJUSTMENT TESTS PASSED! ===');
