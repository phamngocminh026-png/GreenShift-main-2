const fs = require('fs');
const assert = require('assert');

console.log('=== TEST: EXACT IMPORT CODE EXECUTION FROM CARBON-INVENTORY.HTML ===');

global.window = global;

const html = fs.readFileSync('carbon-inventory.html', 'utf8');

// Extract sampleEquipmentTemplateData
const sIdx = html.indexOf('const sampleEquipmentTemplateData = [');
const eIdx = html.indexOf('function downloadEquipmentTemplate()');
const templateDataCode = html.substring(sIdx, eIdx).replace('const sampleEquipmentTemplateData =', 'global.sampleEquipmentTemplateData =');
eval(templateDataCode);

assert(Array.isArray(global.sampleEquipmentTemplateData), 'sampleEquipmentTemplateData must be an array');
assert(global.sampleEquipmentTemplateData.length >= 4, 'Must have sample equipment items');

// Extract IPPU_EQUIPMENT_RULES
const rIdx = html.indexOf('window.IPPU_EQUIPMENT_RULES = [');
if (rIdx !== -1) {
  const rEnd = html.indexOf('];', rIdx) + 2;
  eval(html.substring(rIdx, rEnd));
}

// Extract the exact rows.forEach logic inside reader.onload
const loopStart = html.indexOf('rows.forEach(r => {');
const loopEnd = html.indexOf('if (addedCount > 0) {', loopStart);
const loopBody = html.substring(loopStart, loopEnd);

// Mock environment
let currentList = [];
let sourceList = [];
let addedCount = 0;
let ippuAddedCount = 0;
const todayStr = '2026-09-17';
const rows = global.sampleEquipmentTemplateData;

function getBranchStorageKey(k) { return 'mock_' + k; }
const localStorage = {
  getItem: () => null,
  setItem: () => {}
};

// Execute the loop directly!
try {
  eval(loopBody);
  console.log('PASS: loopBody executed without any ReferenceError or SyntaxError!');
} catch (err) {
  console.error('FAIL: Error during loop execution:', err);
  assert.fail(err.message);
}

assert.strictEqual(addedCount, rows.length, 'Must successfully process all template rows');
assert.strictEqual(currentList.length, rows.length, 'Must add all equipments');
assert.strictEqual(sourceList.length, rows.length + 1, 'Must provision all energy sources plus IPPU process emission sources');

const eafIppu = sourceList.find(x => x.isProcessEmission === 'true' && x.ef.includes('EAF'));
assert.ok(eafIppu, 'Must create paired IPPU process emission source for EAF');
assert.strictEqual(eafIppu.category, 'Các quá trình công nghiệp');
assert.strictEqual(eafIppu.productName, 'Thép thô / Phôi thép');
assert.strictEqual(eafIppu.productionUnit, 'tấn');
assert.strictEqual(eafIppu.needsProductionInput, 'true');

// Verify fields
const furnace = currentList.find(x => x.asset === 'STEEL-FURN-01');
assert.ok(furnace, 'Must find STEEL-FURN-01');
assert.strictEqual(furnace.hoursDay, 16, 'Furnace hoursDay must be 16');
assert.strictEqual(furnace.fuel, 'Dầu nặng FO (Fuel Oil)', 'Furnace fuel must be Dầu nặng FO (Fuel Oil)');

const forklift = currentList.find(x => x.asset === 'GEN-FORKLIFT-FLEET');
assert.ok(forklift, 'Must find GEN-FORKLIFT-FLEET');
assert.strictEqual(forklift.hoursDay, 8, 'Forklift hoursDay must be 8');
assert.strictEqual(forklift.fuel, 'Dầu Diesel (DO)', 'Forklift fuel must be Dầu Diesel (DO)');

const chiller = currentList.find(x => x.asset === 'REF-CHILLER-CENT');
assert.ok(chiller, 'Must find REF-CHILLER-CENT');
assert.strictEqual(chiller.hoursDay, 16, 'Chiller hoursDay must be 16');
assert.strictEqual(chiller.category, 'Tiêu thụ điện', 'Chiller category must be Tiêu thụ điện');

console.log('PASS: All steel equipment and sources correctly mapped with hoursDay and fuels.');
console.log('\nEXACT IMPORT CODE TEST PASSED 100%!');
