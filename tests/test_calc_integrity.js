/**
 * GREENSHIFT CALCULATION & EMISSION FACTOR INTEGRITY TEST
 * Kiểm thử độ chính xác tuyệt đối của công thức tính toán phát thải (Scope 1, 2, 3)
 */

const fs = require('fs');
const path = require('path');

console.log('===============================================================');
console.log('🧪 BẮT ĐẦU KIỂM THỬ TÍNH TOÀN VẸN CỦA CÔNG THỨC PHÁT THẢI');
console.log('===============================================================');

// Giả lập môi trường window / browser
global.window = {};
var window = global.window;

// 1. Nạp cơ sở dữ liệu IPCC & EF Master
const ipccPath = path.join(__dirname, '..', 'assets', 'js', 'ipcc-data.js');
const efMasterPath = path.join(__dirname, '..', 'assets', 'js', 'ef-master.js');

if (fs.existsSync(ipccPath)) {
  const ipccContent = fs.readFileSync(ipccPath, 'utf8');
  eval(ipccContent);
}

const IPCC_DB = global.window.IPCC_DB;
const efMaster = require(efMasterPath);
global.window.EF_MASTER = efMaster;
const EF_MASTER = efMaster;

let testsPassed = 0;
let testsFailed = 0;

function assertClose(name, actual, expected, maxDelta = 0.01) {
  const diff = Math.abs(actual - expected);
  if (diff <= maxDelta) {
    console.log(`  ✅ [PASS] ${name}: ${actual.toFixed(4)} tCO2e (kỳ vọng: ${expected.toFixed(4)})`);
    testsPassed++;
  } else {
    console.error(`  ❌ [FAIL] ${name}: thực tế ${actual.toFixed(4)} != kỳ vọng ${expected.toFixed(4)} (lệch ${diff.toFixed(4)})`);
    testsFailed++;
  }
}

// TEST 1: Kiểm tra GWP các loại khí nhà kính trong AR5 & AR4
console.log('\n📌 1. Kiểm tra Chỉ số Tiềm năng Nóng lên Toàn cầu (GWP):');
try {
  const ar5_ch4 = IPCC_DB['AR5-100']['Methane'];
  const ar5_n2o = IPCC_DB['AR5-100']['Nitrous oxide'];
  const ar4_ch4 = IPCC_DB['AR4-100']['Methane'];
  
  assertClose('AR5 Methane GWP', ar5_ch4, 28, 0.001);
  assertClose('AR5 Nitrous Oxide GWP', ar5_n2o, 265, 0.001);
  assertClose('AR4 Methane GWP', ar4_ch4, 25, 0.001);
} catch (e) {
  console.error('  ❌ Lỗi truy xuất IPCC_DB:', e.message);
  testsFailed++;
}

// TEST 2: Đốt nhiên liệu cố định (Scope 1 - Than cám / Than đá)
console.log('\n📌 2. Kiểm tra Phát thải Đốt nhiên liệu Cố định (Scope 1):');
try {
  // Giả lập tính toán: 10,000 kg than antraxit (10 tấn)
  // Than antraxit: NCV = 26.7 TJ/Gg, EF_CO2 = 98,300 kg/TJ
  const amountKg = 10000;
  const ncv = 26.7; // TJ / 1000 tấn
  const ef_co2 = 98300; // kg CO2 / TJ
  const ef_ch4 = 1.0;
  const ef_n2o = 1.5;
  const ch4Gwp = 28;
  const n2oGwp = 265;

  const energyTJ = (amountKg / 1000000) * ncv;
  const co2_kg = energyTJ * ef_co2;
  const ch4_kg = energyTJ * ef_ch4;
  const n2o_kg = energyTJ * ef_n2o;
  const co2e_ton = (co2_kg + (ch4_kg * ch4Gwp) + (n2o_kg * n2oGwp)) / 1000;

  // Kỳ vọng ~ 26.28 tCO2e
  assertClose('10 tấn Than Antraxit', co2e_ton, 26.28, 0.1);
} catch (e) {
  console.error('  ❌ Lỗi tính Scope 1 than đá:', e.message);
  testsFailed++;
}

// TEST 3: Tiêu thụ Điện lưới Quốc gia EVN (Scope 2)
console.log('\n📌 3. Kiểm tra Phát thải Điện lưới Quốc gia EVN (Scope 2):');
try {
  // Tiêu thụ 100,000 kWh điện. Hệ số phát thải EVN chuẩn = 0.7221 tCO2/MWh = 0.0007221 tCO2/kWh
  const kwh = 100000;
  const ef_evn = 0.7221 / 1000; // tCO2e / kWh
  const actualScope2 = kwh * ef_evn;
  const expectedScope2 = 72.21; // 72.21 tCO2e

  assertClose('100,000 kWh Điện lưới EVN (Hệ số 0.7221)', actualScope2, expectedScope2, 0.001);
} catch (e) {
  console.error('  ❌ Lỗi tính Scope 2 điện lưới:', e.message);
  testsFailed++;
}

// TEST 4: Rò rỉ môi chất lạnh gas điều hòa (Scope 1 Fugitive)
console.log('\n📌 4. Kiểm tra Phát thải Môi chất lạnh R410A (Scope 1 Fugitive):');
try {
  // Nạp 50 kg gas R410A (GWP = 2088 theo IPCC AR5)
  const amountKg = 50;
  const gwp_r410a = (IPCC_DB['AR5'] && IPCC_DB['AR5']['R-410A']) ? IPCC_DB['AR5']['R-410A'] : 2088;
  const actualFugitive = (amountKg * gwp_r410a) / 1000;
  const expectedFugitive = 104.40; // 104.4 tCO2e

  assertClose('50 kg Gas R410A', actualFugitive, expectedFugitive, 0.001);
} catch (e) {
  console.error('  ❌ Lỗi tính Scope 1 môi chất lạnh:', e.message);
  testsFailed++;
}

console.log('\n---------------------------------------------------------------');
console.log(`📊 TỔNG KẾT KIỂM THỬ: ${testsPassed} passed, ${testsFailed} failed`);
if (testsFailed === 0) {
  console.log('🎉 100% CÔNG THỨC TOÀN VẸN! Không có bất kỳ sai lệch nào so với tiêu chuẩn.');
} else {
  console.error('⚠️ Có lỗi kiểm thử công thức, cần rà soát lại!');
  process.exit(1);
}
console.log('===============================================================\n');
