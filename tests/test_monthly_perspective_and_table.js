const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('--- TEST: Dashboard Monthly Perspective, Switcher & 12-Month Breakdown Table ---');

// 1. Kiểm tra carbon-inventory.html
const htmlPath = path.join(__dirname, '..', 'carbon-inventory.html');
const html = fs.readFileSync(htmlPath, 'utf8');

assert(html.includes('id="btn-dash-month"'), 'Phải có nút id="btn-dash-month" trong nhóm nút góc nhìn');
assert(html.includes('id="btn-dash-ytd"'), 'Phải có nút id="btn-dash-ytd"');
assert(html.includes('id="btn-dash-all"'), 'Phải có nút id="btn-dash-all"');
assert(html.includes('id="monthly-breakdown-container"'), 'Phải có container #monthly-breakdown-container');
assert(html.includes('id="btn-tab-monthly-breakdown"'), 'Phải có nút chuyển tab #btn-tab-monthly-breakdown');
assert(html.includes('id="btn-tab-yoy-breakdown"'), 'Phải có nút chuyển tab #btn-tab-yoy-breakdown');
console.log('PASS 1: carbon-inventory.html có đầy đủ markup cho nút Chi tiết Theo Tháng và bảng 12 tháng.');

// 2. Kiểm tra logic trong carbon-dashboard.js
const dashPath = path.join(__dirname, '..', 'assets', 'js', 'carbon-dashboard.js');
const dashJs = fs.readFileSync(dashPath, 'utf8');

assert(dashJs.includes('btnDashMonth'), 'carbon-dashboard.js phải tham chiếu btnDashMonth');
assert(dashJs.includes('monthly-breakdown-container'), 'carbon-dashboard.js phải render monthly-breakdown-container');
assert(dashJs.includes('selectDashboardMonth'), 'Phải có hàm selectDashboardMonth để drilldown vào tháng');
console.log('PASS 2: carbon-dashboard.js có đầy đủ logic đồng bộ 3 nút và render bảng 12 tháng.');

// 3. Giả lập DOM và kiểm thử tính toán bảng 12 tháng
class MockCanvas {
  getContext() { return {}; }
}
class MockChart {
  constructor(ctx, cfg) {
    this.ctx = ctx;
    this.cfg = cfg;
  }
  destroy() {}
}
global.Chart = MockChart;

const mockElements = {
  'branch-selector': { value: 'main' },
  'dash-year-select': { value: '2026' },
  'dash-view-mode': { value: 'scope' },
  'dash-timeframe-select': { value: '09' },
  'btn-dash-ytd': { style: {} },
  'btn-dash-all': { style: {} },
  'btn-dash-month': { style: {}, textContent: '' },
  'card-total-emissions': { innerHTML: '' },
  'chartScope': new MockCanvas(),
  'chartMonthly': new MockCanvas(),
  'chartCategory': new MockCanvas(),
  'chartEquipment': new MockCanvas(),
  'yoy-comparison-container': { innerHTML: '', style: {} },
  'monthly-breakdown-container': { innerHTML: '', style: {} },
  'dash-table-title': { textContent: '' },
  'btn-tab-monthly-breakdown': { style: {} },
  'btn-tab-yoy-breakdown': { style: {} },
  'btn-back-to-year': { style: {} },
  'btn-toggle-stack-mode': { style: {}, querySelector: () => ({ innerText: '' }) }
};

global.document = {
  getElementById: (id) => mockElements[id] || null,
  querySelectorAll: () => [],
  addEventListener: () => {}
};

const storage = {};
global.localStorage = {
  getItem: (k) => storage[k] || null,
  setItem: (k, v) => { storage[k] = v; }
};

// Chuẩn bị dữ liệu mẫu 12 tháng
const activities = [];
for (let m = 1; m <= 12; m++) {
  const mStr = String(m).padStart(2, '0');
  activities.push({
    id: `act_${m}`,
    date: `2026-${mStr}-15`,
    sourceName: 'Lò hơi đốt than',
    sourceType: 'Lò hơi',
    category: 'Đốt cháy cố định',
    co2e: 10000 // 10 tCO2e Scope 1
  });
  activities.push({
    id: `act_elec_${m}`,
    date: `2026-${mStr}-20`,
    sourceName: 'Điện lưới nhà máy',
    sourceType: 'Điện lưới',
    category: 'Điện mua vào',
    co2e: 20000 // 20 tCO2e Scope 2
  });
}

storage['gs_current_user'] = 'test_director';
storage['gs_user_role'] = 'director';
storage['gs_data_test_director_main_activity'] = JSON.stringify(activities);
storage['gs_data_test_director_main_sources'] = JSON.stringify([
  { id: 's1', type: 'Lò hơi', category: 'Đốt cháy cố định' },
  { id: 's2', type: 'Điện lưới', category: 'Điện mua vào' }
]);

const { renderDashboard, selectDashboardMonth } = require(dashPath);

// Chạy renderDashboard ở chế độ Tháng 9
renderDashboard();

// Kiểm tra nút Chi tiết Tháng 9 được active
assert.strictEqual(mockElements['btn-dash-month'].textContent, 'Chi tiết Tháng 9', 'Nút btn-dash-month phải hiển thị Chi tiết Tháng 9');
assert.strictEqual(mockElements['btn-dash-month'].style.background, '#0284c7', 'Nút btn-dash-month phải có màu nền active #0284c7');
assert.strictEqual(mockElements['btn-dash-ytd'].style.background, 'transparent', 'btn-dash-ytd phải transparent');
assert.strictEqual(mockElements['btn-dash-all'].style.background, 'transparent', 'btn-dash-all phải transparent');
console.log('PASS 3: Đồng bộ trạng thái active của nút Chi tiết Tháng 9 chính xác.');

// Kiểm tra nội dung render của bảng 12 tháng
const tableHtml = mockElements['monthly-breakdown-container'].innerHTML;
assert(tableHtml.includes('Tháng 1/2026'), 'Bảng phải có Tháng 1');
assert(tableHtml.includes('Tháng 9/2026'), 'Bảng phải có Tháng 9');
assert(tableHtml.includes('Tháng 12/2026'), 'Bảng phải có Tháng 12');
assert(tableHtml.includes('10,00'), 'Scope 1 mỗi tháng phải là 10,00 tCO2e');
assert(tableHtml.includes('20,00'), 'Scope 2 mỗi tháng phải là 20,00 tCO2e');
assert(tableHtml.includes('30,00'), 'Tổng mỗi tháng phải là 30,00 tCO2e');
assert(tableHtml.includes('360,00'), 'Tổng cả năm 12 tháng phải là 360,00 tCO2e (12 * 30)');
console.log('PASS 4: Bảng tổng hợp 12 tháng tính toán chính xác tuyệt đối Scope 1, Scope 2 và Tổng phát thải.');

// Kiểm tra gọi hàm selectDashboardMonth('05')
selectDashboardMonth('05');
assert.strictEqual(mockElements['dash-timeframe-select'].value, '05', 'selectDashboardMonth phải chuyển khung thời gian sang Tháng 05');
assert.strictEqual(mockElements['btn-dash-month'].textContent, 'Chi tiết Tháng 5', 'Nút btn-dash-month phải chuyển thành Chi tiết Tháng 5');
console.log('PASS 5: Hàm selectDashboardMonth drilldown mượt mà vào bất kỳ tháng nào.');

console.log('\n=== TẤT CẢ CÁC KIỂM THỬ XEM CHI TIẾT THEO THÁNG TRÊN DASHBOARD ĐÃ THÀNH CÔNG 100%! ===');
