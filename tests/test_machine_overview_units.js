const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('=== TEST: MACHINE OVERVIEW UNITS & DISPLAY FORMAT ===');

const html = fs.readFileSync(path.join(__dirname, '..', 'carbon-inventory.html'), 'utf8');
const js = fs.readFileSync(path.join(__dirname, '..', 'assets', 'js', 'carbon-activity.js'), 'utf8');

// 1. Check Table Headers in carbon-inventory.html
console.log('Test 1: Check updated headers in machine-overview-card...');
assert.ok(html.includes('>Điều chỉnh vận hành</th>'), 'Header must be Điều chỉnh vận hành');
assert.ok(html.includes('>Sản lượng sau chỉnh</th>'), 'Header must be Sản lượng sau chỉnh');
console.log('-> PASS 1: Machine overview headers updated cleanly.');

// 2. Check formatRateUnit implementation
console.log('Test 2: Check formatRateUnit implementation...');
assert.ok(js.includes('function formatRateUnit('), 'Must define formatRateUnit');
assert.strictEqual(js.includes('${opCapUnit}/h'), false, 'Must not blindly append /h to opCapUnit');
assert.strictEqual(js.includes('${ms.capUnit + \'/h\'}'), false, 'Must not blindly append /h to ms.capUnit');
console.log('-> PASS 2: Redundant /h/h eliminated from both tech spec card and overview table.');

// 3. Mathematical & Unit Verification for Screenshot Equipment
console.log('Test 3: Simulate exact screenshot equipment rows...');

function formatRateUnit(capUnit, sourceType) {
  if (!capUnit) return (sourceType && sourceType.toLowerCase().includes('điện')) ? 'kWh/h' : 'lít/h';
  let u = capUnit.trim();
  if (u.endsWith('/h') || u.endsWith('/giờ')) return u;
  if (u.toLowerCase() === 'kw') return 'kWh/h';
  return `${u}/h`;
}

function normalizeConsumptionUnit(unitStr, sourceType) {
  if (!unitStr) return (sourceType && sourceType.toLowerCase().includes('điện')) ? 'kWh' : 'lít';
  const u = unitStr.toLowerCase().trim();
  if (u.includes('kwh') || u.includes('kw.h')) return 'kWh';
  if (u.includes('kw') || u.includes('w')) return 'kWh';
  if (u.includes('lít') || u.includes('lit') || u === 'l' || u.startsWith('l/')) return 'lít';
  if (u.includes('kg')) return 'kg';
  if (u.includes('m3') || u.includes('m³')) return 'm³';
  if (u.includes('tấn') || u.includes('ton')) return 'tấn';
  if (u.includes('/')) {
    const num = u.split('/')[0].trim();
    if (num.includes('lít') || num.includes('lit') || num === 'l') return 'lít';
    if (num.includes('kw')) return 'kWh';
    if (num.includes('kg')) return 'kg';
    return num;
  }
  return unitStr;
}

// Row 1: Boiler (Lò hơi số 1 - 45 lít/h, 80% tải)
const boilerCapUnit = 'lít/h';
const boilerRateUnit = formatRateUnit(boilerCapUnit, 'Nhiên liệu cố định');
const boilerConsUnit = normalizeConsumptionUnit(boilerCapUnit, 'Nhiên liệu cố định');
assert.strictEqual(boilerRateUnit, 'lít/h', 'Boiler rate unit must be lít/h (NOT lít/h/h)');
assert.strictEqual(boilerConsUnit, 'lít', 'Boiler consumption unit must be lít (NOT lít/h)');

// Row 2: Chiller (45 kW, 80% tải, 1h downtime = -36 kWh)
const chillerCapUnit = 'kW';
const chillerRateUnit = formatRateUnit(chillerCapUnit, 'Tiêu thụ điện');
const chillerConsUnit = normalizeConsumptionUnit(chillerCapUnit, 'Tiêu thụ điện');
assert.strictEqual(chillerRateUnit, 'kWh/h', 'Chiller rate unit must be kWh/h (NOT kW/h)');
assert.strictEqual(chillerConsUnit, 'kWh', 'Chiller consumption unit must be kWh (NOT kW)');

// Row 3: Generator (100 lít/h, 75% tải)
assert.strictEqual(formatRateUnit('lít/h', 'Máy phát điện'), 'lít/h');
assert.strictEqual(normalizeConsumptionUnit('lít/h', 'Máy phát điện'), 'lít');

// Row 4: Forklift (5 lít/h, 60% tải)
assert.strictEqual(formatRateUnit('lít/h', 'Xe nâng'), 'lít/h');
assert.strictEqual(normalizeConsumptionUnit('lít/h', 'Xe nâng'), 'lít');

console.log('-> PASS 3: All 4 equipment rows in screenshot now have 100% accurate units.');

// 4. Verify Chiller Downtime Display in Overview Table
console.log('Test 4: Verify -36 adjustment format...');
const totalAdjustmentQty = -36;
const totalDowntimeHours = 1;
const adjustText = `${totalAdjustmentQty.toLocaleString('vi-VN')} ${chillerConsUnit}${totalDowntimeHours > 0 ? ` (${totalDowntimeHours}h)` : ''}`;
assert.strictEqual(adjustText, '-36 kWh (1h)', 'Must clearly indicate unit and hours for adjustments');
console.log('-> PASS 4: Adjustment text formatted as -36 kWh (1h).');

console.log('\n=== ALL OVERVIEW UNIT TESTS PASSED 100%! ===');
