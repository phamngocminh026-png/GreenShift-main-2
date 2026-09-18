// ============================================================================
// KIEM THU: GOM NHOM DU LIEU HOAT DONG TRUOC KHI XUAT BAO CAO WORD
// Tuan thu quy chuan ISO 14064-1 va Nghi dinh 06/2022/ND-CP
// ============================================================================

const fs = require('fs');
const path = require('path');
const assert = require('assert');

const rootDir = path.resolve(__dirname, '..');
const WordExport = require(path.join(rootDir, 'assets', 'js', 'word-export.js'));

console.log('===============================================================');
console.log('KIEM THU: GOM NHOM DU LIEU TRUOC KHI XUAT BAO CAO WORD (MUC 5)');
console.log('===============================================================');

// Mock global EF_MASTER neu chua co
global.EF_MASTER = {
  VN: {
    fuels: {
      fuel_coal_3a: {
        id: 'fuel_coal_3a',
        name: 'Than cám 3a',
        density: 1,
        ncv: 22.5,
        ef_co2_tj: 94600,
        ef_ch4_tj: 10,
        ef_n2o_tj: 1.5,
        factor: 2.13,
        ipcc_code: '1.A.1.a'
      },
      fuel_diesel: {
        id: 'fuel_diesel',
        name: 'Dầu DO',
        density: 0.84,
        ncv: 43.0,
        ef_co2_tj: 74100,
        ef_ch4_tj: 3,
        ef_n2o_tj: 0.6,
        factor: 2.68,
        ipcc_code: '1.A.3.b'
      },
      fuel_biomass_pellet: {
        id: 'fuel_biomass_pellet',
        name: 'Viên nén mùn cưa',
        density: 1,
        ncv: 17.5,
        ef_co2_tj: 112000,
        ef_ch4_tj: 30,
        ef_n2o_tj: 4,
        factor: 0.05,
        ipcc_code: '1.A.2.m'
      }
    },
    electricity: {
      elec_grid: {
        id: 'elec_grid',
        name: 'Điện lưới Việt Nam',
        factor: 0.7221,
        ipcc_code: '2.A'
      }
    }
  }
};

// [TEST 1] Kiem tra su ton tai cua ham groupActivities
console.log('\n[TEST 1] Kiem tra phuong thuc groupActivities tren WordExport:');
assert.strictEqual(typeof WordExport.groupActivities, 'function', 'WordExport phai co ham groupActivities');
console.log('  [PASS] Phuong thuc groupActivities ton tai va san sang su dung');

// [TEST 2] Kiem tra gom nhom 365 ban ghi dien Scope 2 thanh 1 dong duy nhat
console.log('\n[TEST 2] Kiem tra gom nhom 365 ban ghi dien Scope 2:');
const dailyElecActs = [];
const expectedElecAmountPerDay = 1000; // 1,000 kWh / ngay
const expectedTotalElecAmount = 365 * expectedElecAmountPerDay; // 365,000 kWh

for (let day = 1; day <= 365; day++) {
  const monthStr = String(Math.floor((day - 1) / 31) + 1).padStart(2, '0');
  const dayStr = String(((day - 1) % 31) + 1).padStart(2, '0');
  dailyElecActs.push({
    id: `elec_day_${day}`,
    sourceName: 'Xưởng Luyện Thép',
    sourceType: 'Tiêu thụ điện lưới',
    category: 'Phạm vi 2',
    amount: expectedElecAmountPerDay,
    unit: 'kWh',
    fuelId: 'elec_grid',
    finalFactor: 0.7221,
    co2e: (expectedElecAmountPerDay * 0.7221).toFixed(2),
    date: `2026-${monthStr}-${dayStr}`,
    measure: 'Đo liên tục'
  });
}

const elecGrouped = WordExport.groupActivities(dailyElecActs);
assert.strictEqual(elecGrouped.scope2_grid.length, 1, '365 ban ghi dien cho cung 1 xuong phai duoc gom thanh dung 1 dong');
const elecRow = elecGrouped.scope2_grid[0];
assert.strictEqual(elecRow.name, 'Xưởng Luyện Thép', 'Ten xuong phai duoc giu nguyen');
assert.strictEqual(elecRow.consumption_kwh, expectedTotalElecAmount.toLocaleString('vi-VN'), 'Tong san luong dien phai bang 365,000 kWh');

const expectedTotalCo2e = (expectedTotalElecAmount * 0.7221) / 1000;
const actualCo2e = parseFloat(elecRow.t_co2e.replace(',', '.'));
assert.ok(Math.abs(actualCo2e - expectedTotalCo2e) < 0.1, `Phat thai Scope 2 phai xap xi ${expectedTotalCo2e}`);
console.log(`  [PASS] 365 ban ghi dien da duoc gom thanh 1 dong duy nhat voi tong kWh = ${elecRow.consumption_kwh} va tCO2e = ${elecRow.t_co2e}`);

// [TEST 3] Kiem tra gom nhom 300 ban ghi dot than va 50 ban ghi dot dau Scope 1
console.log('\n[TEST 3] Kiem tra gom nhom 300 ban ghi than va 50 ban ghi dau DO Scope 1:');
const combustionActs = [];
// 300 ban ghi than cho Lo nung EAF 01 (10 tan/ngay)
for (let i = 1; i <= 300; i++) {
  combustionActs.push({
    id: `coal_log_${i}`,
    sourceName: 'Lò nung EAF 01',
    sourceType: 'Đốt cháy cố định',
    sourceGroup: 'Nguồn đốt cố định',
    amount: 10,
    unit: 'tấn',
    fuelId: 'fuel_coal_3a',
    efName: 'Than cám 3a',
    finalFactor: 2.13,
    co2e: (10 * 2.13 * 1000).toFixed(2),
    date: '2026-05-10',
    measure: 'Bằng chứng kế toán / Hóa đơn'
  });
}
// 50 ban ghi dau DO cho May phat dien (100 lit/ngay)
for (let j = 1; j <= 50; j++) {
  combustionActs.push({
    id: `diesel_log_${j}`,
    sourceName: 'Máy phát điện dự phòng',
    sourceType: 'Đốt cháy cố định',
    sourceGroup: 'Nguồn đốt cố định',
    amount: 100,
    unit: 'lít',
    fuelId: 'fuel_diesel',
    efName: 'Dầu DO',
    finalFactor: 2.68,
    co2e: (100 * 2.68).toFixed(2),
    date: '2026-06-15',
    measure: 'Đo liên tục'
  });
}

const combGrouped = WordExport.groupActivities(combustionActs);
assert.strictEqual(combGrouped.scope1_stationary.length, 2, '350 ban ghi dot chay phai duoc gom dung thanh 2 dong thiet bi');

const coalRow = combGrouped.scope1_stationary.find(r => r.name === 'Lò nung EAF 01');
const dieselRow = combGrouped.scope1_stationary.find(r => r.name === 'Máy phát điện dự phòng');

assert.ok(coalRow, 'Phai co dong thiet bi Lo nung EAF 01');
assert.ok(dieselRow, 'Phai co dong thiet bi May phat dien du phong');
assert.strictEqual(coalRow.consumption_original, (300 * 10).toLocaleString('vi-VN'), 'Tong than tieu thu phai bang 3,000 tan');
assert.strictEqual(dieselRow.consumption_original, (50 * 100).toLocaleString('vi-VN'), 'Tong dau tieu thu phai bang 5,000 lit');
console.log('  [PASS] 350 ban ghi dot chay Scope 1 duoc gom thanh 2 dong chuan xac');

// [TEST 4] Kiem tra phan tach Biogenic CO2 trong gom nhom
console.log('\n[TEST 4] Kiem tra phan tach Biogenic CO2 tu nhien lieu sinh hoc:');
const biomassActs = [
  {
    id: 'bio_log_1',
    sourceName: 'Lò hơi đốt sinh khối',
    sourceType: 'Đốt cháy cố định',
    amount: 50,
    unit: 'tấn',
    fuelId: 'fuel_biomass_pellet',
    efName: 'Viên nén mùn cưa',
    isBiomass: true,
    biogenicCo2: 85.5,
    co2e: (50 * 0.05 * 1000).toFixed(2)
  },
  {
    id: 'bio_log_2',
    sourceName: 'Lò hơi đốt sinh khối',
    sourceType: 'Đốt cháy cố định',
    amount: 50,
    unit: 'tấn',
    fuelId: 'fuel_biomass_pellet',
    efName: 'Viên nén mùn cưa',
    isBiomass: true,
    biogenicCo2: 85.5,
    co2e: (50 * 0.05 * 1000).toFixed(2)
  }
];

const bioGrouped = WordExport.groupActivities(biomassActs);
assert.strictEqual(bioGrouped.scope1_stationary.length, 1, '2 ban ghi sinh khoi phai duoc gom thanh 1 dong');
const bioRow = bioGrouped.scope1_stationary[0];
assert.strictEqual(bioRow.consumption_original, (100).toLocaleString('vi-VN'));
assert.ok(bioRow.fuel.includes('Sinh học / Biomass'), 'Ten nhien lieu phai co nhan Sinh hoc / Biomass');
assert.strictEqual(bioRow.t_co2, '-', 'Phat thai CO2 hoa thach phai la 0 hoac khong tinh vao Scope 1');
console.log('  [PASS] Phat thai sinh hoc Biogenic CO2 duoc tach biet va dan nhan minh bach');

// [TEST 5] Kiem tra phat thai ro ri Fugitive & Nuoc thai Wastewater
console.log('\n[TEST 5] Kiem tra gom nhom ro ri moi chat lanh va nuoc thai:');
const otherActs = [
  {
    id: 'chiller_1',
    sourceName: 'Hệ thống Chiller 01',
    sourceType: 'Phát thải thất thoát',
    refName: 'R-410A',
    amount: 15,
    unit: 'kg',
    finalFactor: 2088,
    co2e: (15 * 2088).toFixed(2)
  },
  {
    id: 'chiller_2',
    sourceName: 'Hệ thống Chiller 01',
    sourceType: 'Phát thải thất thoát',
    refName: 'R-410A',
    amount: 10,
    unit: 'kg',
    finalFactor: 2088,
    co2e: (10 * 2088).toFixed(2)
  },
  {
    id: 'ww_1',
    sourceName: 'Trạm xử lý nước thải',
    sourceType: 'Nước thải',
    amount: 500,
    wwS: 20,
    wwR: 5,
    finalFactor: 0.25,
    co2e: 120000
  },
  {
    id: 'ww_2',
    sourceName: 'Trạm xử lý nước thải',
    sourceType: 'Nước thải',
    amount: 500,
    wwS: 20,
    wwR: 5,
    finalFactor: 0.25,
    co2e: 120000
  }
];

const otherGrouped = WordExport.groupActivities(otherActs);
assert.strictEqual(otherGrouped.scope1_fugitive.length, 1, '2 ban ghi chiller phai duoc gom thanh 1 dong');
assert.strictEqual(otherGrouped.scope1_fugitive[0].amount, '25', 'Tong moi chat phai bang 25 kg');
assert.strictEqual(otherGrouped.scope1_wastewater.length, 1, '2 ban ghi nuoc thai phai duoc gom thanh 1 dong');
assert.strictEqual(otherGrouped.scope1_wastewater[0].tow, '1.000', 'Tong TOW phai bang 1,000');
console.log('  [PASS] Moi chat lanh va nuoc thai duoc gom nhom hoan hao');

// [TEST 6] Kiem tra bang do khong dam bao do khong con trung lap
console.log('\n[TEST 6] Kiem tra bang bat dinh tbl_317 va tbl_318 khong bi trung lap:');
const allTestActs = [
  ...dailyElecActs,
  ...combustionActs,
  ...biomassActs,
  ...otherActs
];
const fullGrouped = WordExport.groupActivities(allTestActs);
assert.ok(allTestActs.length > 700, 'Tong so ban ghi dau vao phai tren 700 dong');
assert.ok(fullGrouped.tbl_317.length <= 10, `Bang bat dinh chi duoc chua vai dong dai dien (thuc te: ${fullGrouped.tbl_317.length})`);
assert.ok(fullGrouped.tbl_318.length <= 15, `Bang bat dinh EF chi duoc chua vai dong dai dien (thuc te: ${fullGrouped.tbl_318.length})`);

// Kiem tra khong co cap (name + gas) nao bi lap lai trong tbl_317
const keys317 = fullGrouped.tbl_317.map(r => `${r.name}_${r.gas}`);
const uniqueKeys317 = new Set(keys317);
assert.strictEqual(keys317.length, uniqueKeys317.size, 'tbl_317 khong duoc co khoa trung lap');
console.log(`  [PASS] Bang bat dinh duoc rut gon tu >700 dong xuong con ${fullGrouped.tbl_317.length} dong khong trung lap`);

// [TEST 7] Kiem tra exportReport ket xuat Docxtemplater khong loi
console.log('\n[TEST 7] Kiem tra ket xuat Docxtemplater thuc te voi du lieu da gom nhom:');
const companyInfo = {
  name: 'Công ty Cổ phần Thép GreenSteel Hải Phòng',
  tax: '0201999888',
  address: 'KCN Đình Vũ, Hải Phòng',
  industry: 'Sản xuất Thép'
};
const calcResults = {
  total: 5420.5,
  scope1: 4200.0,
  scope2: 1220.5,
  biogenic: 171.0
};

// Set override
if (typeof window === 'undefined') {
  global.window = { __exportActivitiesOverride: allTestActs };
} else {
  window.__exportActivitiesOverride = allTestActs;
}

const doc = WordExport.exportReport(companyInfo, calcResults, '2026');
assert.ok(doc, 'exportReport phai tra ve doi tuong docxtemplater hop le');
console.log('  [PASS] Docxtemplater da render thanh cong file Word bao cao khong phat sinh loi tag!');

// [TEST 8] Kiem tra quy tac ZERO EMOJIS
console.log('\n[TEST 8] Kiem tra quy tac ZERO EMOJIS tren word-export.js va test file:');
const wordExportJs = fs.readFileSync(path.join(rootDir, 'assets', 'js', 'word-export.js'), 'utf8');
const testJs = fs.readFileSync(__filename, 'utf8');
const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E6}-\u{1F1FF}]/u;

assert.ok(!emojiRegex.test(wordExportJs), 'word-export.js khong duoc chua bat ky emoji nao');
assert.ok(!emojiRegex.test(testJs), 'test file khong duoc chua bat ky emoji nao');
console.log('  [PASS] 100% sach se emoji tren ca ma nguon va bai kiem thu');

console.log('===============================================================');
console.log('TAT CA CAC KIEM THU CHO MUC 5 (GOM NHOM DU LIEU WORD) DA QUA!');
console.log('===============================================================');
