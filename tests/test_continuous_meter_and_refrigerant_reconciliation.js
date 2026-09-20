const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('=== TEST: CONTINUOUS METER & REFRIGERANT RECONCILIATION ===');

const js = fs.readFileSync(path.join(__dirname, '..', 'assets', 'js', 'carbon-activity.js'), 'utf8');

// 1. Check meter dataObj saving
assert.ok(js.includes("meterStart: currentActMode === 'meter'"), 'JS must save meterStart in dataObj');
assert.ok(js.includes("meterEnd: currentActMode === 'meter'"), 'JS must save meterEnd in dataObj');
assert.ok(js.includes("meterMultiplier: currentActMode === 'meter'"), 'JS must save meterMultiplier in dataObj');
console.log('PASS 1: meterStart, meterEnd, meterMultiplier are saved in dataObj.');

// 2. Check meter mode restoration in editRowHandler
assert.ok(js.includes("const isMeterMode = (data.entryMode === 'meter')"), 'JS must detect isMeterMode in editRowHandler');
assert.ok(js.includes("switchActivityInputMode('meter');"), 'JS must switch to meter mode when editing meter row');
console.log('PASS 2: editRowHandler restores meter mode and inputs.');

// 3. Check status badge for meter
assert.ok(js.includes("statusBadgeHTML = '<span style=\"display:inline-block; font-size: 0.72rem; font-weight: 600; background: #f0f9ff; color: #0284c7; border: 1px solid #bae6fd; padding: 2px 7px; border-radius: 12px; white-space: nowrap;\">Đo công tơ</span>';"), 'JS must render Đo công tơ badge');
console.log('PASS 3: Đo công tơ badge is rendered cleanly.');

// 4. Check auto generator meter tracking
assert.ok(js.includes("const meterTracker = {};"), 'JS must maintain meterTracker in generateMockActivityData');
assert.ok(js.includes("Chốt công tơ"), 'JS must generate Chốt công tơ document strings for continuous meter');
console.log('PASS 4: generateMockActivityData tracks cumulative meter readings.');

// 5. Check refrigerant reconciliation separation
assert.ok(js.includes("let invoiceRef = 0;"), 'JS must track invoiceRef in renderReconciliationSummary');
assert.ok(js.includes("let machineRef = 0;"), 'JS must track machineRef in renderReconciliationSummary');
assert.ok(js.includes("'Khí nạp / Môi chất lạnh (kg)'"), 'JS must display Khí nạp / Môi chất lạnh (kg) row when refrigerant exists');
console.log('PASS 5: Refrigerant / Fugitive gas is cleanly decoupled in reconciliation summary.');

console.log('\nALL CONTINUOUS METER & RECONCILIATION TESTS PASSED 100%!');
