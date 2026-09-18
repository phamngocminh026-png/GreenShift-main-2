const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('--- TEST: Dashboard Perspective Modes & Double-Counting Prevention ---');

// 1. Check carbon-inventory.html has dash-view-mode and required elements
const htmlPath = path.join(__dirname, '..', 'carbon-inventory.html');
const html = fs.readFileSync(htmlPath, 'utf8');

assert(html.includes('id="dash-view-mode"'), 'carbon-inventory.html must have #dash-view-mode');
assert(html.includes('value="reconcile"'), 'dash-view-mode must have reconcile option');
assert(html.includes('value="combined"'), 'dash-view-mode must have combined option');
assert(html.includes('value="invoice"'), 'dash-view-mode must have invoice option');
assert(html.includes('value="engineer"'), 'dash-view-mode must have engineer option');
assert(html.includes('id="card-total-emissions"'), 'Must have #card-total-emissions container');
console.log('PASS: carbon-inventory.html UI controls present for perspective selection.');

// 2. Check role-based perspective initialization in carbon-inventory.html
assert(html.includes("dashViewMode.value = 'invoice'"), 'Accountant role defaults to invoice view');
assert(html.includes("dashViewMode.value = 'engineer'"), 'Engineer role defaults to engineer view');
assert(html.includes("dashViewMode.value = 'scope'"), 'Director role defaults to scope view for executive decarbonization insights');
console.log('PASS: Role-based default perspective routing verified.');

// 3. Mock DOM and simulate carbon-dashboard.js logic
class MockCanvas {
  getContext() { return {}; }
}
class MockChart {
  constructor(ctx, config) {
    this.ctx = ctx;
    this.config = config;
    MockChart.instances.push(this);
  }
  destroy() {}
}
MockChart.instances = [];

global.Chart = MockChart;

const mockElements = {
  'branch-selector': { value: 'main' },
  'dash-year-select': { value: '2026' },
  'dash-view-mode': { value: 'reconcile' },
  'card-total-emissions': { innerHTML: '' },
  'chartScope': new MockCanvas(),
  'chartMonthly': new MockCanvas(),
  'chartCategory': new MockCanvas(),
  'chartEquipment': new MockCanvas(),
  'yoy-comparison-container': { innerHTML: '' }
};

global.document = {
  getElementById: (id) => mockElements[id] || null,
  querySelectorAll: () => [],
  addEventListener: () => {}
};

const storage = {};
global.localStorage = {
  getItem: (key) => storage[key] || null,
  setItem: (key, val) => { storage[key] = val; }
};

// Seed test activities
// 12 monthly engineer baselines (50,000 kgCO2e each = 600,000 kgCO2e total)
const engineerActivities = [];
for (let m = 1; m <= 12; m++) {
  const mStr = m < 10 ? '0' + m : '' + m;
  engineerActivities.push({
    id: 'eng_' + m,
    date: `2026-${mStr}-01`,
    sourceName: 'Điện lưới trạm biến áp #1',
    sourceType: 'Điện lưới',
    entryRole: 'engineer',
    isBaseline: 'true',
    co2e: 50000
  });
}

// 1 accountant invoice in Month 1 (320,000 kgCO2e)
const invoiceActivities = [
  {
    id: 'inv_1',
    date: '2026-01-15',
    sourceName: 'Hóa đơn Điện lực EVN Tháng 1',
    sourceType: 'Điện lưới',
    entryRole: 'accountant',
    isInvoice: 'true',
    co2e: 320000
  }
];

const allActivities = [...engineerActivities, ...invoiceActivities];
storage['gs_current_user'] = 'test_user';
storage['gs_user_role'] = 'director';
storage['gs_data_test_user_main_activity'] = JSON.stringify(allActivities);
storage['gs_data_test_user_main_sources'] = JSON.stringify([
  { id: 's1', type: 'Lò hơi', category: 'Đốt cháy cố định' },
  { id: 's2', type: 'Điện lưới', category: 'Điện mua vào' }
]);

const { renderDashboard } = require('../assets/js/carbon-dashboard.js');

// Test Mode 1: Reconcile Mode (Đối soát)
mockElements['dash-view-mode'].value = 'reconcile';
renderDashboard();

const lastMonthlyChartReconcile = MockChart.instances.find(c => c.ctx === mockElements['chartMonthly']);
assert(lastMonthlyChartReconcile, 'Monthly chart must be initialized in reconcile mode');
assert.strictEqual(lastMonthlyChartReconcile.config.data.datasets.length, 2, 'Reconcile mode must have 2 datasets');
assert.strictEqual(lastMonthlyChartReconcile.config.data.datasets[0].label, 'Hóa đơn Kế toán');
assert.strictEqual(lastMonthlyChartReconcile.config.data.datasets[1].label, 'Kỹ thuật Ước tính');
assert.strictEqual(lastMonthlyChartReconcile.config.data.datasets[0].data[0], 320000, 'Month 1 invoice must be 320,000');
assert.strictEqual(lastMonthlyChartReconcile.config.data.datasets[1].data[0], 50000, 'Month 1 engineer estimate must be 50,000');
assert.strictEqual(lastMonthlyChartReconcile.config.options.scales.x.stacked, false, 'Reconcile bars must be side-by-side (not stacked)');

assert(mockElements['card-total-emissions'].innerHTML.includes('320.00'), 'Card must show 320.00 tCO2e for accountant invoice');
assert(mockElements['card-total-emissions'].innerHTML.includes('600.00'), 'Card must show 600.00 tCO2e for engineer estimate');
assert(mockElements['card-total-emissions'].innerHTML.includes('-280.00'), 'Card must show delta -280.00 tCO2e');
console.log('PASS: Mode "reconcile" displays side-by-side comparisons and reconciliation card.');

// Test Mode 2: Combined Mode (Dự phóng kết hợp - KHÔNG TRÙNG LẶP)
MockChart.instances = [];
mockElements['dash-view-mode'].value = 'combined';
renderDashboard();

const lastMonthlyChartCombined = MockChart.instances.find(c => c.ctx === mockElements['chartMonthly']);
assert(lastMonthlyChartCombined, 'Monthly chart must be initialized in combined mode');
// Month 1: Invoice = 320,000, Engineer = 0 (suppressed to prevent double counting!)
assert.strictEqual(lastMonthlyChartCombined.config.data.datasets[0].data[0], 320000, 'Month 1 should take invoice');
assert.strictEqual(lastMonthlyChartCombined.config.data.datasets[1].data[0], 0, 'Month 1 engineer estimate suppressed in combined view to prevent double-count');
// Month 2: Invoice = 0, Engineer = 50,000
assert.strictEqual(lastMonthlyChartCombined.config.data.datasets[0].data[1], 0, 'Month 2 invoice is 0');
assert.strictEqual(lastMonthlyChartCombined.config.data.datasets[1].data[1], 50000, 'Month 2 uses engineer forecast');

// Total should be 320,000 (Month 1) + 11 * 50,000 (Months 2-12) = 870,000 kgCO2e = 870.00 tCO2e (NOT 920 or 947!)
assert(mockElements['card-total-emissions'].innerHTML.includes('870.00'), 'Combined total must be exactly 870.00 tCO2e with zero double-counting');
console.log('PASS: Mode "combined" prevents double-counting and merges actual invoice with remaining forecasts.');

// Test Scenario from Audit: Tháng có hóa đơn điện + dữ liệu dầu DO kỹ thuật
// Hóa đơn điện KHÔNG ĐƯỢC xóa dữ liệu dầu DO kỹ thuật của cùng tháng đó
const dieselAct = {
  id: 'eng_diesel_01',
  date: '2026-01-20',
  sourceName: 'Máy phát điện dự phòng - Dầu DO',
  sourceType: 'Dầu Diesel (DO)',
  entryRole: 'engineer',
  isBaseline: 'false',
  co2e: 15000 // 15 tCO2e
};
storage['gs_data_test_user_main_activity'] = JSON.stringify([...allActivities, dieselAct]);
MockChart.instances = [];
mockElements['dash-view-mode'].value = 'combined';
renderDashboard();
const chartDieselTest = MockChart.instances.find(c => c.ctx === mockElements['chartMonthly']);
// In Month 1: electric invoice is 320,000; engineer diesel (15,000) MUST NOT be wiped out!
assert.strictEqual(chartDieselTest.config.data.datasets[1].data[0], 15000, 'Month 1 engineer diesel must be preserved despite electricity invoice');
console.log('PASS: Electricity invoice in Month 1 does not suppress engineer diesel DO data.');

// Restore original activities for remaining tests
storage['gs_data_test_user_main_activity'] = JSON.stringify(allActivities);

// Test Mode 3: Invoice Mode (Chỉ Kế toán)
MockChart.instances = [];
mockElements['dash-view-mode'].value = 'invoice';
renderDashboard();
assert(mockElements['card-total-emissions'].innerHTML.includes('320.00'), 'Invoice mode total must be exactly 320.00 tCO2e');
console.log('PASS: Mode "invoice" displays solely accounting invoice figures.');

// Test Mode 4: Engineer Mode (Chỉ Kỹ thuật)
MockChart.instances = [];
mockElements['dash-view-mode'].value = 'engineer';
renderDashboard();
assert(mockElements['card-total-emissions'].innerHTML.includes('600.00'), 'Engineer mode total must be exactly 600.00 tCO2e');
console.log('PASS: Mode "engineer" displays solely technical equipment baseline figures.');

console.log('ALL DASHBOARD PERSPECTIVE TESTS PASSED SUCCESSFULLY!');
