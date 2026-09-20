const fs = require('fs');
const path = require('path');
const assert = require('assert');
const vm = require('vm');

console.log('================================================================');
console.log('KIEM THU: TUY BIEN MAU HOA DON EXCEL CHO KE TOAN THEO 16 NGANH');
console.log('================================================================');

// 1. Doc file assets/js/carbon-activity.js va assets/js/invoice-parser.js
const actJs = fs.readFileSync(path.join(__dirname, '../assets/js/carbon-activity.js'), 'utf8');
const parserJs = fs.readFileSync(path.join(__dirname, '../assets/js/invoice-parser.js'), 'utf8');

// Zero emoji check
const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E6}-\u{1F1FF}]/u;
assert.ok(!emojiRegex.test(actJs), 'carbon-activity.js khong duoc chua bat ky emoji nao');
assert.ok(!emojiRegex.test(parserJs), 'invoice-parser.js khong duoc chua bat ky emoji nao');
console.log('PASS 1: Quy tac ZERO EMOJI tuyet doi tren ma nguon.');

// 2. Nap vao sandbox
const createMockEl = () => ({
  value: '',
  style: {},
  dataset: {},
  classList: { add: () => {}, remove: () => {} },
  addEventListener: () => {},
  removeEventListener: () => {},
  appendChild: () => {},
  click: () => {},
  querySelector: () => null,
  querySelectorAll: () => []
});

const mockDoc = {
  readyState: 'complete',
  addEventListener: () => {},
  removeEventListener: () => {},
  querySelector: () => null,
  querySelectorAll: () => [],
  getElementById: (id) => {
    const el = createMockEl();
    if (id === 'ci-setup-industry') el.value = 'Xi Măng';
    return el;
  },
  createElement: () => createMockEl(),
  body: createMockEl()
};

const mockWindow = {
  document: mockDoc,
  addEventListener: () => {},
  removeEventListener: () => {},
  localStorage: {
    getItem: () => null,
    setItem: () => {}
  },
  INDUSTRY_16_ALIAS_MAP: {
    'sat thep': 'Thep_Luyen_Kim',
    'thep': 'Thep_Luyen_Kim',
    'nhom': 'Nhom_Luyen_Kim',
    'xi mang': 'Xi_Mang',
    'nhua': 'Nhua_Hoa_Chat',
    'hoa chat': 'Nhua_Hoa_Chat',
    'phan bon': 'Phan_Bon',
    'nhiet dien': 'Nhiet_Dien_Dien_Luc',
    'hydrogen': 'Hydrogen',
    'giay': 'Bao_Bi_Giay',
    'det may': 'Det_May',
    'da giay': 'Da_Giay',
    'go': 'Go_Noi_That',
    'dien tu': 'Dien_Tu',
    'thuc pham': 'Thuc_Pham_Do_Uong',
    'co khi': 'Co_Khi_Che_Tao',
    'nong nghiep': 'Nong_Nghiep',
    'van tai': 'Van_Tai_Logistics'
  }
};

const sandbox = {
  window: mockWindow,
  document: mockDoc,
  localStorage: mockWindow.localStorage,
  console: console,
  setTimeout: () => {},
  clearTimeout: () => {}
};
sandbox.global = sandbox;

vm.createContext(sandbox);
vm.runInContext(parserJs, sandbox);
vm.runInContext(actJs, sandbox);

const InvoiceParser = sandbox.window.InvoiceParser;
const templates = sandbox.window.INDUSTRY_INVOICE_TEMPLATES;
const getRows = sandbox.window.getIndustryInvoiceTemplateRows;
const resolveKey = sandbox.window.resolveAccountantIndustryKey;

assert.ok(templates, 'INDUSTRY_INVOICE_TEMPLATES phai duoc export tren window');
assert.strictEqual(typeof getRows, 'function', 'getIndustryInvoiceTemplateRows phai la ham');
assert.strictEqual(typeof resolveKey, 'function', 'resolveAccountantIndustryKey phai la ham');

// 3. Kiem tra danh sach 16 nganh
const expectedIndustries = [
  'Thep_Luyen_Kim',    'Nhom_Luyen_Kim',
  'Xi_Mang',           'Nhua_Hoa_Chat',
  'Phan_Bon',          'Nhiet_Dien_Dien_Luc',
  'Hydrogen',          'Bao_Bi_Giay',
  'Det_May',           'Da_Giay',
  'Go_Noi_That',       'Dien_Tu',
  'Thuc_Pham_Do_Uong', 'Co_Khi_Che_Tao',
  'Nong_Nghiep',       'Van_Tai_Logistics'
];

expectedIndustries.forEach(ind => {
  const rows = templates[ind];
  assert.ok(Array.isArray(rows), `Nganh ${ind} phai co mang hoa don mau`);
  assert.ok(rows.length >= 4, `Nganh ${ind} phai co it nhat 4 dong hoa don dac thu (thuc te: ${rows.length})`);
  rows.forEach(r => {
    assert.ok(r['Ngày hóa đơn'], `${ind}: phai co 'Ngày hóa đơn'`);
    assert.ok(r['Số hóa đơn'], `${ind}: phai co 'Số hóa đơn'`);
    assert.ok(r['Nhà cung cấp'], `${ind}: phai co 'Nhà cung cấp'`);
    assert.ok(r['Hạng mục chi phí / Loại năng lượng'], `${ind}: phai co 'Hạng mục chi phí / Loại năng lượng'`);
    assert.ok(typeof r['Số lượng tiêu thụ'] === 'number' && r['Số lượng tiêu thụ'] > 0, `${ind}: 'Số lượng tiêu thụ' phai la so duong`);
    assert.ok(r['Đơn vị tính'], `${ind}: phai co 'Đơn vị tính'`);
    assert.ok(typeof r['Thành tiền (VNĐ)'] === 'number' && r['Thành tiền (VNĐ)'] > 0, `${ind}: 'Thành tiền (VNĐ)' phai la so duong`);
    assert.ok(r['Ghi chú / Phân xưởng sử dụng'], `${ind}: phai co 'Ghi chú / Phân xưởng sử dụng'`);
  });
});
console.log(`PASS 2: 100% 16 nganh cong nghiep deu co bo du lieu hoa don dac thu chi tiet.`);

// 4. Kiem tra dac thu nganh Xi mang
const cementRows = getRows('Xi măng');
assert.ok(cementRows.some(r => r['Hạng mục chi phí / Loại năng lượng'].includes('Than cám')), 'Xi mang phai co hoa don Than cam');
assert.ok(cementRows.some(r => r['Hạng mục chi phí / Loại năng lượng'].includes('Dầu Diesel')), 'Xi mang phai co hoa don Dau Diesel mo da');
assert.ok(cementRows.some(r => r['Hạng mục chi phí / Loại năng lượng'].includes('Điện lưới EVN')), 'Xi mang phai co hoa don Dien EVN tram nghien');
console.log('PASS 3: Nganh Xi mang duoc tuy bien hoan hao voi Than cam, Dau DO va Dien luoi.');

// 5. Kiem tra dac thu nganh Nhom (nhu tren anh cua nguoi dung)
const aluRows = getRows('Nhôm & Luyện kim');
assert.ok(aluRows.some(r => r['Hạng mục chi phí / Loại năng lượng'].includes('Dầu nặng FO') || r['Hạng mục chi phí / Loại năng lượng'].includes('FO')), 'Nhom phai co hoa don Dau FO lo nung Anode');
assert.ok(aluRows.some(r => r['Hạng mục chi phí / Loại năng lượng'].includes('Rectifier') || r['Hạng mục chi phí / Loại năng lượng'].includes('Điện')), 'Nhom phai co hoa don Dien tram nan dong be dien phan');
assert.ok(aluRows.some(r => r['Hạng mục chi phí / Loại năng lượng'].includes('LNG')), 'Nhom phai co hoa don LNG lo nau chay nhom');
assert.ok(aluRows.some(r => r['Hạng mục chi phí / Loại năng lượng'].includes('LPG')), 'Nhom phai co hoa don LPG lo dong deu nhiet');
console.log('PASS 4: Nganh Nhom duoc tuy bien chinh xac voi Dau FO nung Anode, Dien be Hall-Heroult va LNG/LPG.');

// 6. Kiem tra dac thu nganh Sat Thep
const steelRows = getRows('Sắt Thép');
assert.ok(steelRows.some(r => r['Hạng mục chi phí / Loại năng lượng'].includes('Than antraxit') || r['Hạng mục chi phí / Loại năng lượng'].includes('cốc')), 'Thep phai co hoa don Than coc/antraxit EAF');
assert.ok(steelRows.some(r => r['Hạng mục chi phí / Loại năng lượng'].includes('EAF & LF')), 'Thep phai co hoa don Dien 110kV EAF');
assert.ok(steelRows.some(r => r['Hạng mục chi phí / Loại năng lượng'].includes('LNG')), 'Thep phai co hoa don LNG nung phoi');
assert.ok(steelRows.some(r => r['Hạng mục chi phí / Loại năng lượng'].includes('R-410A')), 'Thep phai co hoa don R-410A Chiller EAF');
console.log('PASS 5: Nganh Sat Thep duoc tuy bien chinh xac voi Dien cao the EAF, Than EAF, LNG va R-410A.');

// 7. Kiem tra kha nang nhan dien cua bo boc tach hoa don (InvoiceParser)
const matchFO = InvoiceParser.matchFacilitySource("Dầu nặng FO (Fuel Oil 380) Petrolimex kg");
assert.strictEqual(matchFO.id, 'src_fac_fuel_oil', 'InvoiceParser phai nhan dien Dung nguon Dau FO');

const matchLNG = InvoiceParser.matchFacilitySource("Khí tự nhiên hóa lỏng (LNG) PV Gas kg");
assert.strictEqual(matchLNG.id, 'src_fac_natural_gas', 'InvoiceParser phai nhan dien Dung nguon Khi tu nhien LNG');

const matchCoal = InvoiceParser.matchFacilitySource("Than cám antraxit (Cám 3a / 4a mịn) TKV kg");
assert.strictEqual(matchCoal.id, 'src_fac_coal', 'InvoiceParser phai nhan dien Dung nguon Than da');

console.log('PASS 6: InvoiceParser ho tro nhan dien tu dong 100% cac hang muc hoa don FO, LNG, Than da.');

console.log('\n================================================================');
console.log('TAT CA CAC KIEM THU TUY BIEN HOA DON KE TOAN 16 NGANH DA QUA 100%!');
console.log('================================================================');
