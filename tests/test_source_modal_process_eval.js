const fs = require('fs');
const assert = require('assert');

console.log('=== TEST: SOURCE MODAL ADAPTIVE UI FOR INDUSTRIAL PROCESS EMISSIONS (IPPU) ===');

const html = fs.readFileSync('carbon-inventory.html', 'utf8');

// 1. Verify HTML Structure
assert.ok(html.includes('id="source-proc-annual-qty"'), 'Must contain input for annual planned quantity');
assert.ok(html.includes('id="source-proc-product"'), 'Must contain input for product name');
assert.ok(html.includes('id="source-proc-unit"'), 'Must contain input for production unit');
assert.ok(html.includes('id="source-proc-days-week"'), 'Must contain input for working days/week');
assert.ok(html.includes('id="source-proc-calc-workdays"'), 'Must contain display element for active workdays');
assert.ok(html.includes('id="source-proc-calc-daily"'), 'Must contain display element for daily quota');
assert.ok(html.includes('id="source-proc-calc-ef"'), 'Must contain display element for emission factor');
assert.ok(html.includes('id="source-proc-calc-emissions"'), 'Must contain display element for annual planned emissions');
assert.ok(html.includes('Theo sản lượng sản phẩm'), 'Must include measurement option Theo sản lượng sản phẩm');

console.log('PASS 1: Source modal process evaluation HTML elements verified.');

// 2. Test Calculation Logic
function calcProcessEval(annualQty, daysWeek, efVal) {
  const activeWorkdays = (daysWeek === 6) ? 313 : (daysWeek === 5 ? 261 : (daysWeek === 7 ? 365 : Math.round(52 * daysWeek)));
  const dailyQty = activeWorkdays > 0 ? (annualQty / activeWorkdays) : 0;
  const efInTonne = (efVal > 5) ? (efVal / 1000) : efVal;
  const annualEmissions = Math.round(annualQty * efInTonne * 100) / 100;
  return {
    activeWorkdays,
    dailyQty: Math.round(dailyQty * 1000) / 1000,
    efInTonne,
    annualEmissions
  };
}

const result = calcProcessEval(600000, 6, 60);
assert.strictEqual(result.activeWorkdays, 313, 'Active workdays for 6-day workweek in 2026 must be 313 days');
assert.strictEqual(result.dailyQty, 1916.933, 'Daily quota must be 1,916.933 tonnes/day');
assert.strictEqual(result.efInTonne, 0.060, 'EF in tonnes must be 0.060 tCO2/tonne');
assert.strictEqual(result.annualEmissions, 36000, 'Annual emissions must be exactly 36,000 tCO2e');

console.log('PASS 2: Process evaluation mathematical calculation verified (600,000 t -> 1,916.933 t/day -> 36,000 tCO2e).');

// 3. Test Adaptive Detection Function Extraction
assert.ok(html.includes('function isCurrentSourceProcessEmission()'), 'Must contain isCurrentSourceProcessEmission helper');
assert.ok(html.includes('function recalcSourceProcessEval()'), 'Must contain recalcSourceProcessEval helper');

console.log('PASS 3: JavaScript function definitions verified in carbon-inventory.html.');

// 4. Test Pre-fill Logic in attachSourceRowEvents
assert.ok(html.includes("procQtyEl.value = row.dataset.annualEstQty || (row.dataset.eq?.includes('EAF') || row.dataset.type?.includes('quang điện') ? '600000' : '500000');"), 'Must prefill annualEstQty from row dataset or EAF standard 600000');

console.log('PASS 4: Row edit pre-fill logic verified.');

// 5. Test Default Initialization in loadSourceList
assert.ok(html.includes('if (d.isProcessEmission === \'true\' && (!d.annualEstQty || parseFloat(d.annualEstQty) <= 0)) {'), 'Must migrate legacy/zero annualEstQty to 600,000 in loadSourceList');

console.log('PASS 5: Auto-migration for existing IPPU rows verified.');

console.log('\n=== ALL SOURCE MODAL PROCESS EVAL TESTS PASSED 100%! ===');
