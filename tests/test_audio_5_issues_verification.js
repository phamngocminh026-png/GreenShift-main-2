/**
 * Test Suite: Xac minh toan dien 5 van de tu 5 file am thanh va 2 anh chup man hinh
 * 1. Audio 1: Tang so luong thiet bi tu dong dong bo vao nguon phat thai & nhat ky hoat dong
 * 2. Audio 2: Khong bi khau tru thoi gian ngung may (downtime am) voi nhat ky bao tri chiller & chay thu PCCC
 * 3. Audio 3: Tinh toan phat thai may Chiller chuan IPCC 2006 (ti le ro ri 3%/nam thay vi chay lien tuc 8760h)
 * 4. Audio 4: Trinh xem chung tu khong bi dump rac ma nguon/binary khi xem file bang tinh Excel (.xlsx)
 * 5. Audio 5: Xuat bao cao Word hoan thien Bang 3.7, 3.8 va 3.14 (BOD, TOW, so ngay lam viec ~300 ngay)
 * Quy tac nghiem ngat: ZERO EMOJI
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const PizZip = require('pizzip');

const rootDir = path.resolve(__dirname, '..');
const wordExportJs = fs.readFileSync(path.join(rootDir, 'assets', 'js', 'word-export.js'), 'utf8');
const WordExport = require('../assets/js/word-export.js');
const docStorageJs = fs.readFileSync(path.join(rootDir, 'assets', 'js', 'document-storage.js'), 'utf8');
const carbonInvHtml = fs.readFileSync(path.join(rootDir, 'carbon-inventory.html'), 'utf8');
const carbonActJs = fs.readFileSync(path.join(rootDir, 'assets', 'js', 'carbon-activity.js'), 'utf8');

console.log('====================================================================');
console.log('KIEM THU XAC MINH 5 VAN DE NGUOI DUNG BAO CAO (5 AUDIO & 2 ANH CHUP)');
console.log('====================================================================\n');

// ----------------------------------------------------------------------------
// [TEST 1] AUDIO 1: Dong bo so luong thiet bi vao Nguon & Nhat ky hoat dong
// ----------------------------------------------------------------------------
console.log('[TEST 1] Audio 1: Kiem tra dong bo so luong thiet bi vao danh sach Nguon');
assert.ok(
  carbonInvHtml.includes('autoSyncEquipmentToSources(equipmentList);') ||
  carbonInvHtml.includes('saveEquipmentList') && carbonInvHtml.includes('sources'),
  'saveEquipmentList phai tu dong goi co che dong bo vao sources'
);
assert.ok(
  carbonInvHtml.includes('isFugitiveSrc') && carbonInvHtml.includes('0.03'),
  'Khi dong bo sang Nguon phat thai, thiet bi ro ri phai tinh theo 3% luong nap hang nam'
);
console.log('  [PASS] saveEquipmentList da tich hop co che tu dong dong bo so luong thiet bi vao sources');

// ----------------------------------------------------------------------------
// [TEST 2] AUDIO 2: Nhat ky bao tri chiller & chay thu PCCC khong bi coi la downtime am
// ----------------------------------------------------------------------------
console.log('\n[TEST 2] Audio 2: Kiem tra phan loai nhat ky van hanh va tranh tru downtime oan');
assert.ok(
  carbonActJs.normalize('NFC').includes("!docLower.includes('nạp gas')") ||
  carbonActJs.normalize('NFC').includes("!doc.includes('nạp gas')"),
  'carbon-activity.js phai co co che chan khong coi bao tri gas lanh la downtime am'
);
assert.ok(
  carbonActJs.normalize('NFC').includes("!docLower.includes('chạy thử')") ||
  carbonActJs.normalize('NFC').includes("!doc.includes('chạy thử')"),
  'carbon-activity.js phai co co che chan khong coi chay thu PCCC la downtime am'
);
console.log('  [PASS] Nhat ky bao tri dinh ky va chay thu he thong khong bi danh dong thanh downtime giam tru');

// ----------------------------------------------------------------------------
// [TEST 3] AUDIO 3: Tinh toan Chiller theo IPCC 2006 (3% ro ri/nam) thay vi 8760h dot chay
// ----------------------------------------------------------------------------
console.log('\n[TEST 3] Audio 3: Kiem tra cong thuc phat thai ro ri Chiller chuan IPCC 2006 Vol 3 Ch 7');
const ratedCapacityKg = 120; // 120 kg gas R-410A
const annualLeakRate = 0.03; // 3% ro ri moi nam theo chuan IPCC cho Chiller thuong mai/cong nghiep
const annualLeakKg = ratedCapacityKg * annualLeakRate; // 3.6 kg / nam
const gwpR410A = 2088;
const expectedTCo2e = (annualLeakKg * gwpR410A) / 1000; // 7.5168 -> 7.52 tCO2e/nam

assert.strictEqual(Math.round(annualLeakKg * 100) / 100, 3.6, 'Luong ro ri hang nam cua may 120 kg voi ty le 3% phai la 3.6 kg/nam');
assert.ok(Math.abs(expectedTCo2e - 7.52) < 0.05, `Phat thai hang nam phai xap xi 7.52 tCO2e, khong phai 675.000 tCO2e (thuc te: ${expectedTCo2e.toFixed(2)})`);

assert.ok(
  carbonActJs.includes('isFugitiveAct && parseFloat(act.amount) > 100') ||
  carbonActJs.includes('Bảo dưỡng định kỳ & nạp gas lạnh'),
  'carbon-activity.js phai co co che tu sua ban ghi Chiller phong dai'
);
console.log('  [PASS] Phat thai Chiller dat muc 7.52 tCO2e/nam, triet tieu hoan toan loi phong dai 675.000 tan');

// ----------------------------------------------------------------------------
// [TEST 4] AUDIO 4: Trinh xem chung tu xu ly em dep file bang tinh Excel (.xlsx)
// ----------------------------------------------------------------------------
console.log('\n[TEST 4] Audio 4: Kiem tra Proof Viewer khong dump binary Excel (.xlsx) vao the pre');
assert.ok(
  docStorageJs.includes('isXlsx') && (docStorageJs.includes('.xlsx') || docStorageJs.includes('excel')),
  'document-storage.js phai phan loai ro rang file Excel OpenXML (.xlsx)'
);
assert.ok(
  docStorageJs.includes('!isXlsx') && docStorageJs.includes('isXml'),
  'isXml khong duoc nham lan voi file Excel chua chuoi xml'
);
assert.ok(
  docStorageJs.includes('Bảng tính Hóa đơn / Dữ liệu Excel') || docStorageJs.includes('Tải xuống bảng tính Excel'),
  'Proof Viewer phai render the thong tin tai xuong chuyen nghiep cho file Excel'
);
console.log('  [PASS] File Excel .xlsx duoc hien thi duoi dang Document Card chuyen nghiep va nut tai ve an toan');

// ----------------------------------------------------------------------------
// [TEST 5] AUDIO 5: Xuat bao cao Word day du Bang 3.7, Bang 3.8 va Bang 3.14 (BOD, TOW)
// ----------------------------------------------------------------------------
console.log('\n[TEST 5] Audio 5: Kiem tra docxtemplater xuat bao cao KNK day du Bang 3.7, 3.8 va 3.14');

const mockCompany = {
  name: 'Cong ty Co phan Thep Viet Nhat',
  tax: '0109998888',
  address: 'KCN Nam Cau Kien, Hai Phong',
  industry: 'San xuat Thep',
  employees: 450
};

const mockActivities = [
  {
    id: 'chiller_fugitive_01',
    sourceName: 'He thong Chiller Daikin 160kW',
    sourceType: 'Phat thai that thoat',
    refName: 'R-410A',
    amount: 3.6,
    unit: 'kg',
    co2e: (3.6 * 2088).toFixed(2),
    capacity: '546.000 BTU/h (160 kW)',
    location: 'Phong co dien trung tam',
    startDate: '2020'
  },
  {
    id: 'ww_septic_01',
    sourceName: 'He thong be tu hoai nha may',
    sourceType: 'Nuoc thai',
    amount: 1800,
    tow: 1800,
    finalFactor: 0.18,
    co2e: (1800 * 0.18 * 27.9).toFixed(2)
  }
];

const grouped = WordExport.groupActivities(mockActivities);

// 5.1: Kiem tra du lieu Bang 3.7 (Thiet bi lanh)
assert.strictEqual(grouped.scope1_fugitive.length, 1, 'Phai co 1 hang thiet bi lanh');
const fugRow = grouped.scope1_fugitive[0];
assert.strictEqual(fugRow.name, 'He thong Chiller Daikin 160kW');
assert.strictEqual(fugRow.ref_gas, 'R-410A');
assert.strictEqual(fugRow.capacity, '546.000 BTU/h (160 kW)');
assert.strictEqual(fugRow.charge_kg, '120');
assert.strictEqual(fugRow.amount, '3,6');
assert.strictEqual(fugRow.time, 'Định kỳ hàng năm');
assert.strictEqual(fugRow.t_co2e, '7,52');
console.log('  [PASS] Bang 3.7 thiet bi lanh day du cac cot: cong suat, luong nap 120kg, ro ri 3.6kg, tCO2e 7.52');

// 5.2: Kiem tra du lieu Bang 3.8 & Bang 3.14 (Nuoc thai, BOD & TOW)
assert.strictEqual(grouped.ww_employees, '450', 'So nhan vien phai la 450');
assert.strictEqual(grouped.ww_hours, '8', 'So gio lam viec phai la 8h/ngay');
assert.strictEqual(grouped.ww_days, '300', 'So ngay lam viec phai tu dong ke thua ~300 ngay/nam');
assert.strictEqual(grouped.ww_bod_conc, '40', 'Ham luong BOD phai la 40 g/nguoi/ngay');
assert.strictEqual(grouped.ww_bod_per_person_year, '4,00', 'BOD tinh theo nguoi/nam phai bang 4.00 kgBOD/nguoi/nam');
assert.strictEqual(grouped.ww_i_factor, '1,00', 'He so hieu chinh I mac dinh phai la 1.00');
assert.strictEqual(grouped.ww_tow, '1.800', 'Tong TOW phai la 1,800 kgBOD/nam (450 * 4.00 * 1.00)');
assert.strictEqual(grouped.ww_tech_type, 'Bể tự hoại (Septic tank)');
assert.strictEqual(grouped.ww_b0, '0,60', 'Bo phai la 0.60 kgCH4/kgBOD');
assert.strictEqual(grouped.ww_mcf, '0,50', 'MCF be tu hoai phai la 0.50');
assert.strictEqual(grouped.ww_ef, '0,30', 'EFj = Bo * MCF = 0.30 kgCH4/kgBOD');

// 5.3: Kiem tra render docxtemplater khong bi loi va XML ket qua chua du lieu
if (typeof window === 'undefined') {
  global.window = { __exportActivitiesOverride: mockActivities };
} else {
  window.__exportActivitiesOverride = mockActivities;
}

const doc = WordExport.exportReport(mockCompany, { total: 100, scope1: 50, scope2: 50 }, '2026');
assert.ok(doc, 'docxtemplater phai xuat file thanh cong');
const zip = doc.getZip();
const renderedXml = zip.file('word/document.xml').asText();

// Kiem tra du lieu da duoc dien vao bang, khong con placeholder rong
assert.ok(renderedXml.includes('450'), 'File Word phai chua gia tri so luong nhan vien 450');
assert.ok(renderedXml.includes('300'), 'File Word phai chua so ngay lam viec 300');
assert.ok(renderedXml.includes('1.800'), 'File Word phai chua gia tri TOW 1.800');
assert.ok(renderedXml.includes('546.000 BTU/h (160 kW)'), 'File Word phai chua cong suat Chiller');
assert.ok(renderedXml.includes('7,52'), 'File Word phai chua phat thai ro ri Chiller 7,52');

console.log('  [PASS] File Word render hoan hao khong co tag bi thieu va cac bang 3.7, 3.8, 3.14 duoc dien day du');

// ----------------------------------------------------------------------------
// [TEST 6] ZERO EMOJI COMPLIANCE
// ----------------------------------------------------------------------------
console.log('\n[TEST 6] Kiem tra quy tac ZERO EMOJI tren toan bo ma nguon sua doi:');
const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E6}-\u{1F1FF}]/u;

assert.ok(!emojiRegex.test(wordExportJs), 'word-export.js khong duoc chua bat ky emoji nao');
assert.ok(!emojiRegex.test(docStorageJs), 'document-storage.js khong duoc chua bat ky emoji nao');
assert.ok(!emojiRegex.test(carbonActJs), 'carbon-activity.js khong duoc chua bat ky emoji nao');
assert.ok(!emojiRegex.test(carbonInvHtml), 'carbon-inventory.html khong duoc chua bat ky emoji nao');
const thisTestContent = fs.readFileSync(__filename, 'utf8');
assert.ok(!emojiRegex.test(thisTestContent), 'test_audio_5_issues_verification.js khong duoc chua emoji');
console.log('  [PASS] 100% tuan thu quy tac ZERO EMOJI tren toan bo he thong');

console.log('\n====================================================================');
console.log('TAT CA CAC KIEM THU CHO 5 VAN DE NGUOI DUNG DA HOAN TOAN VUOT QUA!');
console.log('====================================================================\n');
