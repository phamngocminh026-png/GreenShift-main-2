const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('--- TEST: Source Update Baseline Sync & Executive YTD Dashboard ---');

// 1. Check carbon-inventory.html contains UI controls
const htmlPath = path.join(__dirname, '..', 'carbon-inventory.html');
const html = fs.readFileSync(htmlPath, 'utf8');

assert(html.includes('id="btn-dash-ytd"'), 'Phải có nút btn-dash-ytd trên Dashboard');
assert(html.includes('id="btn-dash-all"'), 'Phải có nút btn-dash-all trên Dashboard');
assert(html.includes('value="ytd"'), 'dash-timeframe-select phải có option value="ytd"');
assert(html.includes('id="btn-act-filter-ytd"'), 'Thanh công cụ hoạt động phải có nút btn-act-filter-ytd');
assert(html.includes('syncSourceToBaselineActivities'), 'carbon-inventory.html phải gọi syncSourceToBaselineActivities khi lưu nguồn phát thải');
console.log('PASS: carbon-inventory.html có đầy đủ nút bấm và lời gọi hàm đồng bộ.');

// 2. Check carbon-activity.js exports and functions
const actJsPath = path.join(__dirname, '..', 'assets', 'js', 'carbon-activity.js');
const actJs = fs.readFileSync(actJsPath, 'utf8');

assert(actJs.includes('function syncSourceToBaselineActivities(src)'), 'carbon-activity.js phải định nghĩa hàm syncSourceToBaselineActivities');
assert(actJs.includes('window.syncSourceToBaselineActivities = syncSourceToBaselineActivities'), 'Phải xuất syncSourceToBaselineActivities ra window');
assert(actJs.includes("filterMonth === 'ytd'"), 'applyFilter phải xử lý filterMonth === ytd');
assert(actJs.includes('getMachineSources'), 'Phải có hàm getMachineSources');
console.log('PASS: carbon-activity.js chứa đầy đủ logic sync định mức và lọc YTD.');

// 3. Test syncSourceToBaselineActivities simulation
const mockLocalStorage = {};
global.localStorage = {
  getItem: k => mockLocalStorage[k] || null,
  setItem: (k, v) => { mockLocalStorage[k] = v; },
  removeItem: k => { delete mockLocalStorage[k]; }
};
global.document = {
  getElementById: id => {
    if (id === 'branch-selector') return { value: 'main' };
    if (id === 'act-filter-year') return { value: '2026' };
    return null;
  },
  querySelectorAll: () => []
};

// Seed activities: Lò hồ quang điện có 300 dòng định mức 2,000 tấn/ngày (do ban đầu là 600,000 tấn/năm)
const initialActs = [
  {
    id: 'act_1',
    sourceId: 'src_eaf_01',
    sourceName: 'Lò hồ quang điện EAF 100 tấn/mẻ',
    sourceType: 'Lò thổi oxy hoặc lò hồ quang điện trong luyện thép',
    isBaseline: 'true',
    amount: '2000',
    unit: 'tấn',
    finalFactor: 60,
    co2e: '120000.00',
    date: '2026-01-05'
  },
  {
    id: 'act_2',
    sourceId: 'src_eaf_01',
    sourceName: 'Lò hồ quang điện EAF 100 tấn/mẻ',
    sourceType: 'Lò thổi oxy hoặc lò hồ quang điện trong luyện thép',
    isBaseline: 'true',
    amount: '2000',
    unit: 'tấn',
    finalFactor: 60,
    co2e: '120000.00',
    date: '2026-09-18'
  },
  {
    id: 'act_locked',
    sourceId: 'src_eaf_01',
    sourceName: 'Lò hồ quang điện EAF 100 tấn/mẻ',
    sourceType: 'Lò thổi oxy hoặc lò hồ quang điện trong luyện thép',
    isBaseline: 'false', // Dòng thực tế đã chốt
    amount: '1850',
    unit: 'tấn',
    finalFactor: 60,
    co2e: '111000.00',
    date: '2026-09-17'
  }
];
mockLocalStorage['gs_data_guest_main_activity'] = JSON.stringify(initialActs);

// Simulate executing syncSourceToBaselineActivities with annualEstQty = 60000
const vm = require('vm');
const sandbox = {
  window: {},
  document: global.document,
  localStorage: global.localStorage,
  console: console,
  setTimeout: setTimeout,
  clearTimeout: clearTimeout,
  parseFloat: parseFloat,
  parseInt: parseInt,
  Math: Math,
  Date: Date,
  String: String,
  JSON: JSON
};
vm.createContext(sandbox);

// Extract syncSourceToBaselineActivities function definition
const startIdx = actJs.indexOf('function syncSourceToBaselineActivities');
const endIdx = actJs.indexOf('// --- BỘ CÔNG CỤ QUẢN LÝ NGÀY NGHỈ CA MÁY', startIdx);
const syncCode = actJs.slice(startIdx, endIdx);
vm.runInContext(syncCode, sandbox);

// Call sync function with edited source (60,000 tấn/năm)
const editedSource = {
  id: 'src_eaf_01',
  eq: 'Lò hồ quang điện EAF 100 tấn/mẻ',
  type: 'Lò thổi oxy hoặc lò hồ quang điện trong luyện thép',
  category: 'Các quá trình công nghiệp',
  annualEstQty: '60000',
  measure: 'Theo sản lượng sản phẩm',
  isProcessEmission: 'true',
  productionUnit: 'tấn',
  efFactor: '60',
  opDaysWeek: '6'
};
sandbox.syncSourceToBaselineActivities(editedSource);

// Check updated localStorage
const updatedActs = JSON.parse(mockLocalStorage['gs_data_guest_main_activity']);
const updatedAct1 = updatedActs.find(a => a.id === 'act_1');
const updatedAct2 = updatedActs.find(a => a.id === 'act_2');
const lockedAct = updatedActs.find(a => a.id === 'act_locked');

assert.ok(Math.abs(parseFloat(updatedAct1.amount) - (60000 / 313)) < 1, `Baseline act_1 phải được cập nhật từ 2,000 thành ~191.69 tấn/ngày (actual: ${updatedAct1.amount})`);
assert.ok(Math.abs(parseFloat(updatedAct1.co2e) - (parseFloat(updatedAct1.amount) * 60)) < 0.1, 'Baseline act_1 phát thải phải đúng bằng amount * 60 kgCO2e');
assert.ok(Math.abs(parseFloat(updatedAct2.amount) - (60000 / 313)) < 1, 'Baseline act_2 phải được cập nhật tương ứng');
assert.strictEqual(parseFloat(lockedAct.amount), 1850, 'Dòng thực tế đã chốt (isBaseline: false) phải được bảo vệ nguyên vẹn 1,850 tấn');

console.log('PASS: syncSourceToBaselineActivities cập nhật chính xác 200 tấn/ngày và bảo vệ an toàn dòng chốt thực tế.');

// 4. Test Dashboard YTD Filtering Logic
const dashJsPath = path.join(__dirname, '..', 'assets', 'js', 'carbon-dashboard.js');
const dashJs = fs.readFileSync(dashJsPath, 'utf8');

assert(dashJs.includes("selectedTimeframe === 'ytd'"), 'Dashboard phải nhận diện selectedTimeframe === ytd');
assert(dashJs.includes('act.date > todayStr'), 'Dashboard YTD phải loại trừ các bản ghi tương lai (act.date > todayStr)');
assert(dashJs.includes('btn-dash-ytd'), 'Dashboard phải liên kết nút btn-dash-ytd');
assert(dashJs.includes('btn-dash-all'), 'Dashboard phải liên kết nút btn-dash-all');

console.log('PASS: carbon-dashboard.js chứa đầy đủ logic lọc YTD và đồng bộ nút bấm.');

console.log('ALL SOURCE SYNC & YTD DASHBOARD TESTS PASSED 100%!');
