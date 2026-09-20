const fs = require('fs');
const path = require('path');
const assert = require('assert');

// Mock browser environment
global.window = {
  removeVietnameseTones: function(str) {
    if (!str) return '';
    return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D');
  }
};
global.localStorage = {
  _store: {},
  getItem: function(k) { return this._store[k] || null; },
  setItem: function(k, v) { this._store[k] = String(v); },
  removeItem: function(k) { delete this._store[k]; }
};

// Load modules
require('../assets/js/ipcc-data.js');
require('../assets/js/equipment-db.js');
require('../assets/js/industry-catalog-16.js');

console.log('====================================================================');
console.log('KIEM THU TOAN DIEN CHUAN HOA PHAT THAI 16 NGANH & TRIET TIEU PHONG DAI');
console.log('====================================================================\n');

// 1. Kiem tra phuong thuc calcEquipmentStandardMetrics
console.log('[TEST 1] Kiem tra window.calcEquipmentStandardMetrics hoat dong chuan xac');
assert.strictEqual(typeof window.calcEquipmentStandardMetrics, 'function', 'calcEquipmentStandardMetrics phai duoc dinh nghia');
assert.strictEqual(typeof window.calcEquipmentHourlyRate, 'function', 'calcEquipmentHourlyRate phai duoc dinh nghia');
assert.strictEqual(typeof window.calcEquipmentAnnual, 'function', 'calcEquipmentAnnual phai duoc dinh nghia');
console.log('  [PASS] Cac ham tinh toan tieu chuan da san sang');

// 2. Kiem tra thiet bi Co gioi dinh muc theo nam (lit/nam)
console.log('\n[TEST 2] Kiem tra doan xe tai nang LOG-TRUCK-HEAVY (480.000 lit/nam)');
const logTruck = {
  'Tên thiết bị': 'Đoàn 20 xe đầu kéo vận chuyển container hàng hóa liên tỉnh',
  'Số tài sản': 'LOG-TRUCK-HEAVY',
  'Loại thiết bị': 'Xe đầu kéo',
  'Nguồn phát thải': 'Đốt cháy động',
  'Loại năng lượng sử dụng (Điện / Nhiên liệu đốt)': 'Dầu Diesel (DO)',
  'Công suất định mức': 480000,
  'Đơn vị công suất': 'lít/năm',
  'Mức tải TB (%)': 80,
  'Giờ làm việc bình thường (h/ngày)': 16,
  'Số ngày chạy/tuần': 6
};

const mLogTruck = window.calcEquipmentStandardMetrics(logTruck);
console.log(`  Ket qua LOG-TRUCK-HEAVY: annualQty=${mLogTruck.annualEstQty} ${mLogTruck.qtyUnit}, tCO2e=${mLogTruck.annualEstEmissions}`);
assert.strictEqual(mLogTruck.annualEstQty, 384000, 'Luong tieu thu nam phai la 480.000 * 80% = 384.000 lit');
assert.ok(mLogTruck.annualEstEmissions > 1000 && mLogTruck.annualEstEmissions < 1100, `Phat thai phai khoang 1.031 tan CO2e, thuc te: ${mLogTruck.annualEstEmissions}`);
assert.ok(mLogTruck.annualEstEmissions < 5000000, 'KHONG DUOC BI PHONG DAI LEN 5 TRIEU TAN CO2E');
console.log('  [PASS] LOG-TRUCK-HEAVY triet tieu hoan toan loi nhan 4.992 gio/nam');

// 3. Kiem tra bep gas cong nghiep theo thang (650 kg/thang)
console.log('\n[TEST 3] Kiem tra bep gas nha an STEEL-CANTEEN-GAS (650 kg/thang)');
const canteenGas = {
  'Tên thiết bị': 'Dàn bếp gas công nghiệp nấu phục vụ ca ngày và ca tăng ca',
  'Số tài sản': 'STEEL-CANTEEN-GAS',
  'Loại thiết bị': 'Bếp gas công nghiệp',
  'Nguồn phát thải': 'Đốt cháy cố định',
  'Loại năng lượng sử dụng (Điện / Nhiên liệu đốt)': 'Khí hóa lỏng (LPG)',
  'Công suất định mức': 650,
  'Đơn vị công suất': 'kg/tháng',
  'Mức tải TB (%)': 80,
  'Giờ làm việc bình thường (h/ngày)': 8,
  'Số ngày chạy/tuần': 6
};

const mCanteen = window.calcEquipmentStandardMetrics(canteenGas);
console.log(`  Ket qua STEEL-CANTEEN-GAS: annualQty=${mCanteen.annualEstQty} ${mCanteen.qtyUnit}, tCO2e=${mCanteen.annualEstEmissions}`);
assert.strictEqual(mCanteen.annualEstQty, 6240, 'Luong gas nam phai la 650 * 12 * 80% = 6.240 kg');
assert.ok(mCanteen.annualEstEmissions > 9 && mCanteen.annualEstEmissions < 11, `Phat thai phai khoang 10 tan CO2e, thuc te: ${mCanteen.annualEstEmissions}`);
assert.ok(mCanteen.annualEstEmissions < 3000, 'KHONG DUOC BI PHONG DAI LEN 3.478 TAN CO2E');
console.log('  [PASS] STEEL-CANTEEN-GAS triet tieu hoan toan loi nhan hang trieu kg gas');

// 4. Kiem tra tram xu ly nuoc thai tap trung (120 m3/ngay)
console.log('\n[TEST 4] Kiem tra tram xu ly nuoc thai STEEL-WWTP-CENT (120 m3/ngay)');
const wwtp = {
  'Tên thiết bị': 'Cụm bể xử lý nước thải sinh hoạt và phụ trợ vi sinh hiếu khí',
  'Số tài sản': 'STEEL-WWTP-CENT',
  'Loại thiết bị': 'Trạm xử lý nước thải',
  'Nguồn phát thải': 'Xử lý chất thải / Nước thải',
  'Loại năng lượng sử dụng (Điện / Nhiên liệu đốt)': 'Nước thải sinh hoạt & phụ trợ',
  'Công suất định mức': 120,
  'Đơn vị công suất': 'm3/ngày',
  'Mức tải TB (%)': 80,
  'Giờ làm việc bình thường (h/ngày)': 24,
  'Số ngày chạy/tuần': 7
};

const mWwtp = window.calcEquipmentStandardMetrics(wwtp);
console.log(`  Ket qua STEEL-WWTP-CENT: annualQty=${mWwtp.annualEstQty} ${mWwtp.qtyUnit}, tCO2e=${mWwtp.annualEstEmissions}`);
assert.strictEqual(mWwtp.annualEstQty, 28800, 'Luu luong nuoc thai nam phai la 120 * 80% * 300 = 28.800 m3');
assert.ok(mWwtp.annualEstEmissions > 11 && mWwtp.annualEstEmissions < 13, `Phat thai phai khoang 12.1 tan CO2e, thuc te: ${mWwtp.annualEstEmissions}`);
assert.ok(mWwtp.annualEstEmissions < 200, 'KHONG DUOC BI PHONG DAI LEN 201 - 600 TAN CO2E');
console.log('  [PASS] STEEL-WWTP-CENT tinh chuan theo 300 ngay lam viec');

// 5. Kiem tra may phat dien diesel du phong STEEL-GENSET-DIESEL (800 kW)
console.log('\n[TEST 5] Kiem tra may phat dien du phong STEEL-GENSET-DIESEL (800 kW, chay thu 1h/tuan)');
const genset = {
  'Tên thiết bị': 'Máy phát điện Diesel tự động khởi động khi mất điện lưới',
  'Số tài sản': 'STEEL-GENSET-DIESEL',
  'Loại thiết bị': 'Máy phát điện Diesel',
  'Nguồn phát thải': 'Đốt cháy cố định',
  'Loại năng lượng sử dụng (Điện / Nhiên liệu đốt)': 'Dầu Diesel (DO)',
  'Công suất định mức': 800,
  'Đơn vị công suất': 'kW',
  'Mức tải TB (%)': 80,
  'Giờ làm việc bình thường (h/ngày)': 1,
  'Số ngày chạy/tuần': 1
};

const mGenset = window.calcEquipmentStandardMetrics(genset);
console.log(`  Ket qua STEEL-GENSET-DIESEL: hourlyRate=${mGenset.hourlyRate} lit/h, annualQty=${mGenset.annualEstQty} ${mGenset.qtyUnit}, tCO2e=${mGenset.annualEstEmissions}`);
assert.strictEqual(mGenset.hourlyRate, 160, 'Suat tieu hao dau phai la 800 * 80% * 0.25 = 160 lit/h');
assert.strictEqual(mGenset.annualEstQty, 8320, 'Tieu hao ca nam phai la 160 * 1h * 1d * 52w = 8.320 lit');
assert.ok(mGenset.annualEstEmissions > 21 && mGenset.annualEstEmissions < 24, `Phat thai phai khoang 22.3 tan CO2e, thuc te: ${mGenset.annualEstEmissions}`);
assert.ok(mGenset.annualEstEmissions < 8000, 'KHONG DUOC BI PHONG DAI LEN 8.600 TAN CO2E');
console.log('  [PASS] STEEL-GENSET-DIESEL ap dung dung suat tieu hao rieng BSFC 0.25 L/kWh');

// 6. Kiem tra binh khi sach HFC-227ea / FM-200 (120 kg)
console.log('\n[TEST 6] Kiem tra binh PCCC khi sach FM-200 LOG-FIRE-FM200 (120 kg HFC-227ea)');
const fm200 = {
  'Tên thiết bị': 'Cụm bình khí sạch HFC-227ea dập cháy tự động bảo vệ tủ SCADA',
  'Số tài sản': 'LOG-FIRE-FM200',
  'Loại thiết bị': 'Hệ thống chữa cháy FM-200',
  'Nguồn phát thải': 'Phát thải rò rỉ',
  'Loại năng lượng sử dụng (Điện / Nhiên liệu đốt)': 'HFC-227ea',
  'Công suất định mức': 120,
  'Đơn vị công suất': 'kg HFC-227ea',
  'Mức tải TB (%)': 100,
  'Giờ làm việc bình thường (h/ngày)': 24,
  'Số ngày chạy/tuần': 7
};

const mFm200 = window.calcEquipmentStandardMetrics(fm200);
console.log(`  Ket qua LOG-FIRE-FM200: annualQty=${mFm200.annualEstQty} ${mFm200.qtyUnit}, efFactor=${mFm200.efFactor}, tCO2e=${mFm200.annualEstEmissions}`);
assert.strictEqual(mFm200.hourlyRate, 0, 'He thong ro ri khong co cong suat tieu thu theo gio');
assert.strictEqual(mFm200.annualEstQty, 2.4, 'Ty le ro ri PCCC hang nam la 2% cua 120 kg = 2.4 kg');
assert.strictEqual(mFm200.efFactor, 3220, 'He so GWP cua HFC-227ea phai la 3220 theo IPCC AR4');
assert.ok(mFm200.annualEstEmissions > 7 && mFm200.annualEstEmissions < 8, `Phat thai phai khoang 7.73 tan CO2e, thuc te: ${mFm200.annualEstEmissions}`);
console.log('  [PASS] LOG-FIRE-FM200 tinh chuan theo IPCC 2006 Vol 3 Ch 7');

// 7. Kiem tra binh chua chay khi CO2 LOG-FIRE-EXT-CO2 (85 kg CO2)
console.log('\n[TEST 7] Kiem tra binh chua chay xach tay khi CO2 LOG-FIRE-EXT-CO2 (85 kg CO2)');
const co2Ext = {
  'Tên thiết bị': 'Bình chữa cháy xách tay khí CO2 phân bổ tại các tủ điện',
  'Số tài sản': 'LOG-FIRE-EXT-CO2',
  'Loại thiết bị': 'Bình chữa cháy CO2',
  'Nguồn phát thải': 'Phát thải rò rỉ',
  'Loại năng lượng sử dụng (Điện / Nhiên liệu đốt)': 'Khí CO2',
  'Công suất định mức': 85,
  'Đơn vị công suất': 'kg CO2',
  'Mức tải TB (%)': 100,
  'Giờ làm việc bình thường (h/ngày)': 24,
  'Số ngày chạy/tuần': 7
};

const mCo2Ext = window.calcEquipmentStandardMetrics(co2Ext);
console.log(`  Ket qua LOG-FIRE-EXT-CO2: annualQty=${mCo2Ext.annualEstQty} ${mCo2Ext.qtyUnit}, efFactor=${mCo2Ext.efFactor}, tCO2e=${mCo2Ext.annualEstEmissions}`);
assert.strictEqual(mCo2Ext.efFactor, 1.0, 'He so GWP cua khi CO2 phai bang 1.0');
assert.ok(mCo2Ext.annualEstEmissions < 0.01, 'Phat thai phai xap xi 0.0017 tan CO2e');
console.log('  [PASS] LOG-FIRE-EXT-CO2 khong bi nham he so 2088 cua R-410A');

// 8. Kiem tra may lam lanh NH3 (Amoniac) FOOD-REFRIG-NH3 (4.500 kg NH3)
console.log('\n[TEST 8] Kiem tra he thong lam lanh Amoniac FOOD-REFRIG-NH3 (4.500 kg NH3)');
const nh3 = {
  'Tên thiết bị': 'Tổ hợp 04 máy nén trục vít Amoniac R-717 làm lạnh âm 40 độ C',
  'Số tài sản': 'FOOD-REFRIG-NH3',
  'Loại thiết bị': 'Hệ thống lạnh NH3',
  'Nguồn phát thải': 'Phát thải rò rỉ',
  'Loại năng lượng sử dụng (Điện / Nhiên liệu đốt)': 'Khí Amoniac (NH3 / R-717)',
  'Công suất định mức': 4500,
  'Đơn vị công suất': 'kg nạp',
  'Mức tải TB (%)': 100,
  'Giờ làm việc bình thường (h/ngày)': 24,
  'Số ngày chạy/tuần': 7
};

const mNh3 = window.calcEquipmentStandardMetrics(nh3);
console.log(`  Ket qua FOOD-REFRIG-NH3: efFactor=${mNh3.efFactor}, tCO2e=${mNh3.annualEstEmissions}`);
assert.strictEqual(mNh3.efFactor, 0.0, 'NH3 khong phai khi nha kinh theo IPCC (GWP = 0)');
assert.strictEqual(mNh3.annualEstEmissions, 0, 'Phat thai CO2e cua he thong lanh NH3 phai bang 0');
console.log('  [PASS] FOOD-REFRIG-NH3 dat dung chuan quoc te IPCC (GWP = 0)');

// 9. Kiem tra kho lanh R-404A LOG-COLD-STOR (320 kg)
console.log('\n[TEST 9] Kiem tra kho lanh R-404A LOG-COLD-STOR (320 kg R-404A)');
const coldStor = {
  'Tên thiết bị': 'Cụm kho lạnh lưu trữ hàng hóa logistics thể tích 50.000 m3',
  'Số tài sản': 'LOG-COLD-STOR',
  'Loại thiết bị': 'Hệ thống kho lạnh trung tâm',
  'Nguồn phát thải': 'Phát thải rò rỉ',
  'Loại năng lượng sử dụng (Điện / Nhiên liệu đốt)': 'R-404A',
  'Công suất định mức': 320,
  'Đơn vị công suất': 'kg nạp',
  'Mức tải TB (%)': 100,
  'Giờ làm việc bình thường (h/ngày)': 24,
  'Số ngày chạy/tuần': 7
};

const mColdStor = window.calcEquipmentStandardMetrics(coldStor);
console.log(`  Ket qua LOG-COLD-STOR: annualQty=${mColdStor.annualEstQty} ${mColdStor.qtyUnit}, efFactor=${mColdStor.efFactor}, tCO2e=${mColdStor.annualEstEmissions}`);
assert.strictEqual(mColdStor.annualEstQty, 9.6, 'Ro ri 3% cua 320 kg la 9.6 kg/nam');
assert.strictEqual(mColdStor.efFactor, 3922, 'GWP cua R-404A phai la 3922');
assert.ok(mColdStor.annualEstEmissions > 36 && mColdStor.annualEstEmissions < 39, `Phat thai phai khoang 37.65 tan CO2e, thuc te: ${mColdStor.annualEstEmissions}`);
assert.ok(mColdStor.annualEstEmissions < 6000000, 'KHONG DUOC BI PHONG DAI LEN 6.26 TRIEU TAN CO2E');
console.log('  [PASS] LOG-COLD-STOR tinh dung dinh muc ro ri theo nam');

// 10. Quet toan bo 16 nganh cong nghiep va dam bao khong co thiet bi nao bi phong dai bat thuong
console.log('\n[TEST 10] Quet kiem tra toan bo 349 thiet bi cua 16 nganh cong nghiep');
const catalog = window.INDUSTRY_16_CATALOG;
let countScanned = 0;
let anomalousEquipments = [];

Object.entries(catalog).forEach(([ind, eqs]) => {
  eqs.forEach(eq => {
    countScanned++;
    const res = window.calcEquipmentStandardMetrics(eq);
    const unit = (eq['Đơn vị công suất'] || '').toLowerCase();
    const fuel = (eq['Loại năng lượng sử dụng (Điện / Nhiên liệu đốt)'] || '').toLowerCase();
    
    // Cac thiet bi khong phai lo luyen thep/xi mang/nhiet dien cong suat cuc lon thi khong duoc vuot qua 50.000 tan
    const isMega = eq['Số tài sản'].includes('EAF') || eq['Số tài sản'].includes('BOILER-PC') || eq['Số tài sản'].includes('POT-LINE') || eq['Số tài sản'].includes('CALCINER') || eq['Số tài sản'].includes('KILN-MAIN') || eq['Số tài sản'].includes('ROLL-') || eq['Số tài sản'].includes('REF-') || eq['Số tài sản'].includes('SMR-') || eq['Số tài sản'].includes('LF-') || eq['Số tài sản'].includes('ASU-') || eq['Số tài sản'].includes('ANODE-FURN') || eq['Số tài sản'].includes('COMP-SYN') || eq['Số tài sản'].includes('ELECT-ALK') || eq['Số tài sản'].includes('RECOV-BOIL');
    if (!isMega && res.annualEstEmissions > 50000) {
      anomalousEquipments.push({ ind, code: eq['Số tài sản'], name: eq['Tên thiết bị'], cap: eq['Công suất định mức'], unit, emissions: res.annualEstEmissions });
    }
  });
});

console.log(`  Da quet xong ${countScanned} thiet bi tren toan bo 16 nganh`);
assert.strictEqual(anomalousEquipments.length, 0, `Phat hien ${anomalousEquipments.length} thiet bi bi phong dai bat thuong: ${JSON.stringify(anomalousEquipments)}`);
console.log('  [PASS] Toan bo 349 thiet bi deu co ket qua phat thai hop ly, dat chuan ky thuat');

// 11. Kiem tra quy tac ZERO EMOJI tren cac tap tin ma nguon
console.log('\n[TEST 11] Kiem tra quy tac khong chua bat ky emoji nao (ZERO EMOJI rule)');
const emojiRegex = /[\u{1F300}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1F1E0}-\u{1F1FF}]/u;

const filesToCheck = [
  path.join(__dirname, '..', 'assets', 'js', 'equipment-db.js'),
  path.join(__dirname, '..', 'assets', 'js', 'carbon-activity.js'),
  path.join(__dirname, '..', 'carbon-inventory.html'),
  path.join(__dirname, 'test_audit_16_industries_zero_inflation.js')
];

filesToCheck.forEach(f => {
  const content = fs.readFileSync(f, 'utf8');
  assert.ok(!emojiRegex.test(content), `Phat hien emoji trong tap tin: ${path.basename(f)}`);
  console.log(`  [PASS] ${path.basename(f)} hoan toan sach emoji`);
});

console.log('\n====================================================================');
console.log('KET LUAN: 100% KIEM THU CHUAN HOA PHAT THAI 16 NGANH THANH CONG TOT DEP!');
console.log('====================================================================');
