const fs = require('fs');
const path = require('path');
const assert = require('assert');
const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');

const rootDir = path.resolve(__dirname, '..');
const WordExport = require(path.join(rootDir, 'assets', 'js', 'word-export.js'));

console.log('================================================================');
console.log('AUDIT TOAN DIEN BAO CAO KNK THEP MIEN NAM - PHAT THANH VINH 2026');
console.log('================================================================');

// 1. Khoi tao ho so nha may thep
const mockSteelCompany = {
  name: 'Công ty Cổ phần Thép Miền Nam - Phát Thanh Vinh',
  tax: '0301889966',
  address: 'Khu công nghiệp Phú Mỹ I, Phường Phú Mỹ, Thị xã Phú Mỹ, Tỉnh Bà Rịa - Vũng Tàu',
  industry: 'Sắt Thép',
  repName: 'Phát Thanh Vinh',
  repTitle: 'Tổng Giám Đốc',
  descBoundary: 'Toàn bộ ranh giới khuôn viên Nhà máy luyện cán thép chi nhánh Phú Mỹ gồm Xưởng Luyện thép EAF, Xưởng Cán thép, Trạm biến áp 110kV và khu vực kho bãi thành phẩm.',
  employees: 480,
  employeeCount: 480
};

// 2. Tao bo du lieu hoat dong mau chuan cong nghiep cua nha may thep EAF trong nam 2026
const mockSteelActivities = [
  // Scope 2: Dien luoi EVN tram bien ap 110kV
  {
    id: 'act_elec_eaf',
    sourceName: 'Trạm biến áp 110kV cấp Lò hồ quang điện UHP và Lò tinh luyện LF',
    sourceType: 'Tiêu thụ điện',
    category: 'Phạm vi 2',
    amount: 185000000,
    unit: 'kWh',
    fuelId: 'elec_grid',
    finalFactor: 0.6766,
    co2e: (185000000 * 0.6766).toFixed(2),
    date: '2026-06-30',
    measure: 'Công tơ đo đếm điện tử chuyên dụng'
  },
  {
    id: 'act_elec_rolling',
    sourceName: 'Dây chuyền cán thép thanh và thép cuộn xây dựng',
    sourceType: 'Tiêu thụ điện',
    category: 'Phạm vi 2',
    amount: 25000000,
    unit: 'kWh',
    fuelId: 'elec_grid',
    finalFactor: 0.6766,
    co2e: (25000000 * 0.6766).toFixed(2),
    date: '2026-06-30',
    measure: 'Công tơ đo đếm điện tử chuyên dụng'
  },
  // Scope 1: IPPU - Luyen thep lo ho quang EAF (60 kgCO2e/tan thep tho)
  {
    id: 'act_ippu_steel',
    sourceName: 'Quá trình luyện thép - Lò hồ quang điện EAF (IPPU: 60 kgCO2e/tấn)',
    sourceType: 'Các quá trình công nghiệp',
    category: 'Các quá trình công nghiệp',
    isProcessEmission: 'true',
    amount: 350000,
    unit: 'tấn',
    finalFactor: 60,
    co2e: (350000 * 60).toFixed(2),
    date: '2026-12-31',
    measure: 'Theo sản lượng (IPPU)'
  },
  // Scope 1: Dot co dinh - Khi LNG nung phoi
  {
    id: 'act_lng_reheat',
    sourceName: 'Lò nung phôi thép liên tục (Reheating Furnace)',
    sourceType: 'Đốt cháy cố định',
    category: 'Đốt cháy cố định',
    amount: 8500,
    unit: 'tấn',
    fuelId: 'fuel_natural_gas',
    efName: 'Khí tự nhiên hóa lỏng (LNG)',
    finalFactor: 2.693,
    co2e: (8500 * 1000 * 2.693).toFixed(2),
    date: '2026-12-31',
    measure: 'Đo đếm lưu lượng kế LNG'
  },
  // Scope 1: Dot co dinh - Than antraxit / Than coc tao xi bot EAF
  {
    id: 'act_coal_eaf',
    sourceName: 'Lò hồ quang điện EAF (Than antraxit tạo xỉ bọt)',
    sourceType: 'Đốt cháy cố định',
    category: 'Đốt cháy cố định',
    amount: 4200,
    unit: 'tấn',
    fuelId: 'fuel_coal_anthracite',
    efName: 'Than antraxit',
    finalFactor: 2.625,
    co2e: (4200 * 1000 * 2.625).toFixed(2),
    date: '2026-12-31',
    measure: 'Cân bồn nạp liệu tự động'
  },
  // Scope 1: Dot co dinh - Khi LPG say thung rot & cat phoi
  {
    id: 'act_lpg_ladle',
    sourceName: 'Hệ thống đầu đốt sấy thùng rót Ladle & mỏ cắt phôi',
    sourceType: 'Đốt cháy cố định',
    category: 'Đốt cháy cố định',
    amount: 180000,
    unit: 'kg',
    fuelId: 'fuel_lpg',
    efName: 'Khí hóa lỏng (LPG)',
    finalFactor: 2.983,
    co2e: (180000 * 2.983).toFixed(2),
    date: '2026-12-31',
    measure: 'Hóa đơn bồn cấp LPG'
  },
  // Scope 1: Dot di dong - Dau DO xe xuc xi & xe nang phoi
  {
    id: 'act_do_mobile',
    sourceName: 'Đội xe xúc xỉ mác thép & xe nâng vận chuyển phôi nội bộ',
    sourceType: 'Đốt cháy động',
    category: 'Đốt cháy động',
    isMobile: true,
    amount: 220000,
    unit: 'lít',
    fuelId: 'fuel_diesel',
    efName: 'Dầu Diesel (DO)',
    finalFactor: 2.686,
    co2e: (220000 * 2.686).toFixed(2),
    date: '2026-12-31',
    measure: 'Đo bồn dầu nội bộ'
  },
  // Scope 1: Ro ri moi chat lanh Chiller EAF
  {
    id: 'act_fugitive_chiller',
    sourceName: 'Hệ thống Chiller giải nhiệt nước tuần hoàn lò EAF',
    sourceType: 'Phát thải thất thoát',
    category: 'Phát thải thất thoát',
    refName: 'R-410A',
    amount: 150,
    unit: 'kg',
    finalFactor: 2088,
    co2e: (150 * 2088).toFixed(2),
    date: '2026-12-31',
    measure: 'Nhật ký bảo dưỡng định kỳ'
  },
  // Scope 1: Binh PCCC CO2
  {
    id: 'act_pccc_co2',
    sourceName: 'Hệ thống bình chữa cháy xách tay CO2 toàn nhà máy',
    sourceType: 'PCCC CO2',
    category: 'Phát thải thất thoát',
    amount: 1200,
    unit: 'kg',
    finalFactor: 0.05,
    co2e: (1200 * 0.05).toFixed(2),
    date: '2026-12-31',
    measure: 'Kiểm định PCCC hàng năm'
  },
  // Scope 1: Nuoc thai sinh hoat
  {
    id: 'act_wastewater_septic',
    sourceName: 'Trạm xử lý nước thải sinh hoạt & bể tự hoại nhà máy',
    sourceType: 'Nước thải',
    category: 'Nước thải',
    amount: 1920,
    tow: 1920,
    finalFactor: 0.18,
    co2e: (1920 * 0.18 * 27.9).toFixed(2),
    date: '2026-12-31',
    measure: 'Tính toán theo nhân sự'
  }
];

// 3. Kiem tra gom nhom
const grouped = WordExport.groupActivities(mockSteelActivities);

assert.ok(grouped.scope1_stationary.length >= 4, 'Phai co it nhat 4 hang dot co dinh va IPPU');
assert.ok(grouped.scope1_mobile.length >= 1, 'Phai co hang dot di dong');
assert.strictEqual(grouped.scope1_mobile[0].unit, 'lít', 'Don vi dot di dong phai la lit');
assert.ok(grouped.scope1_fugitive.length >= 1, 'Phai co hang ro ri moi chat lanh');
assert.ok(grouped.scope1_pccc.length >= 1, 'Phai co hang binh PCCC CO2');
assert.ok(grouped.scope1_wastewater.length >= 1, 'Phai co hang nuoc thai sinh hoat');
assert.ok(grouped.scope2_grid.length >= 2, 'Phai co 2 hang tieu thu dien luoi');

// Kiem tra can bang toan ven
const s1Val = parseFloat(grouped.scope1_total.replace(/\./g, '').replace(',', '.'));
const s2Val = parseFloat(grouped.scope2_total.replace(/\./g, '').replace(',', '.'));
const totalVal = parseFloat(grouped.total_emissions.replace(/\./g, '').replace(',', '.'));
assert.ok(Math.abs((s1Val + s2Val) - totalVal) < 0.05, 'Tong phat thai phai can bang 100% giua Scope 1 + Scope 2 va Total');

// 4. Render file Word va kiem tra toan ven
const doc = WordExport.exportReport(mockSteelCompany, null, '2026', mockSteelActivities);
assert.ok(doc, 'docxtemplater phai render thanh cong');
const renderedXml = doc.getZip().file('word/document.xml').asText();

// Kiem tra zero unrendered tags
const unrendered = renderedXml.match(/\{+([a-zA-Z0-9_#\/^]+)\}+/g) || [];
assert.strictEqual(unrendered.length, 0, `Khong duoc con the tag nao chua render: ${unrendered.join(', ')}`);

// Kiem tra cac thong tin cot loi xuat hien trong document.xml
assert.ok(renderedXml.includes('Công ty Cổ phần Thép Miền Nam - Phát Thanh Vinh'), 'Phai chua ten cong ty day du');
assert.ok(renderedXml.includes('Phát Thanh Vinh'), 'Phai chua ten nguoi dai dien');
assert.ok(renderedXml.includes('Khu công nghiệp Phú Mỹ I'), 'Phai chua dia chi');
assert.ok(renderedXml.includes('2026'), 'Phai chua nam 2026');

// Quy tac ZERO EMOJI
const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E6}-\u{1F1FF}]/u;
assert.ok(!emojiRegex.test(renderedXml), 'document.xml khong duoc chua bat ky emoji nao');

console.log('PASS: 100% kiem tra bao cao Thep Mien Nam - Phat Thanh Vinh 2026 dat chuan toan ven!');
