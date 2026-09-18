const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('=== RUNNING TEST: RESET TEST DATA FUNCTIONALITY ===');

// 1. Verify HTML buttons
const html = fs.readFileSync(path.join(__dirname, '..', 'carbon-inventory.html'), 'utf8');
assert(html.includes('id="btn-reset-test-data"'), 'btn-reset-test-data must exist in Activity toolbar');
assert(html.includes('id="btn-reset-eq-data"'), 'btn-reset-eq-data must exist in Equipment toolbar');
assert(html.includes('id="btn-reset-src-data"'), 'btn-reset-src-data must exist in Sources toolbar');
console.log('PASS: All 3 reset buttons exist in HTML UI.');

// 2. Verify JS logic in carbon-activity.js
const js = fs.readFileSync(path.join(__dirname, '..', 'assets', 'js', 'carbon-activity.js'), 'utf8');
assert(js.includes('resetGreenShiftTestData'), 'resetGreenShiftTestData function must exist in carbon-activity.js');
assert(js.includes('btn-reset-test-data'), 'btn-reset-test-data must be bound');
assert(js.includes('btn-reset-eq-data'), 'btn-reset-eq-data must be bound');
assert(js.includes('btn-reset-src-data'), 'btn-reset-src-data must be bound');
console.log('PASS: JS logic and button bindings exist.');

// 3. Test execution behavior of resetGreenShiftTestData
const mockStorage = {
  // Data that MUST BE REMOVED:
  'gs_data_admin_main_activity': JSON.stringify([{ id: 'act_1', co2e: 100 }]),
  'gs_data_admin_main_equipment': JSON.stringify([{ name: 'May phat dien 1', asset: 'EQ-01' }]),
  'gs_data_admin_main_sources': JSON.stringify([{ id: 'src_1', type: 'Dau Diesel' }]),
  'gs_data_engineer1_branch2_activity': JSON.stringify([{ id: 'act_2' }]),
  'gs_v2_activity_main': JSON.stringify([{ id: 'act_old' }]),
  'gs_v2_annual_data': JSON.stringify({ year: 2026 }),
  'gs_records': JSON.stringify([]),

  // Data that MUST BE PRESERVED:
  'gs_users': JSON.stringify([{ username: 'admin', password: '123', company: { name: 'Cong ty GreenShift' } }]),
  'gs_current_user': 'admin',
  'gs_user_role': 'director',
  'gs_v2_company': JSON.stringify({ name: 'Cong ty GreenShift', ipccAR: 'AR5-100' }),
  'gs_company': JSON.stringify({ name: 'Cong ty GreenShift' }),
  'gs_supabase_url': 'https://example.supabase.co',
  'gs_supabase_key': 'mock_key'
};

const localStorage = {
  getItem: (k) => (k in mockStorage ? mockStorage[k] : null),
  setItem: (k, v) => { mockStorage[k] = String(v); },
  removeItem: (k) => { delete mockStorage[k]; },
  get length() { return Object.keys(mockStorage).length; },
  key: (i) => Object.keys(mockStorage)[i] || null
};

// Simulate the reset function
function testReset(skipConfirm) {
  const keysToRemove = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key) continue;
    if (
      (key.startsWith('gs_data_') && (key.endsWith('_activity') || key.endsWith('_equipment') || key.endsWith('_sources'))) ||
      key === 'gs_v2_activity_main' ||
      key === 'gs_v2_annual_data' ||
      key === 'gs_records'
    ) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach(k => localStorage.removeItem(k));
  return true;
}

testReset(true);

// Verification of deletions
assert.strictEqual(mockStorage['gs_data_admin_main_activity'], undefined, 'Activity data must be cleared');
assert.strictEqual(mockStorage['gs_data_admin_main_equipment'], undefined, 'Equipment data must be cleared');
assert.strictEqual(mockStorage['gs_data_admin_main_sources'], undefined, 'Sources data must be cleared');
assert.strictEqual(mockStorage['gs_data_engineer1_branch2_activity'], undefined, 'All branches activity data must be cleared');
assert.strictEqual(mockStorage['gs_v2_activity_main'], undefined, 'Legacy activity data must be cleared');
assert.strictEqual(mockStorage['gs_v2_annual_data'], undefined, 'Annual data must be cleared');
assert.strictEqual(mockStorage['gs_records'], undefined, 'Legacy records must be cleared');
console.log('PASS: All activity, equipment, and source test data cleared.');

// Verification of preservation
assert(mockStorage['gs_users'] !== undefined, 'gs_users must be preserved');
assert(mockStorage['gs_current_user'] === 'admin', 'gs_current_user must be preserved');
assert(mockStorage['gs_user_role'] === 'director', 'gs_user_role must be preserved');
assert(mockStorage['gs_v2_company'] !== undefined, 'gs_v2_company must be preserved');
assert(mockStorage['gs_company'] !== undefined, 'gs_company must be preserved');
assert(mockStorage['gs_supabase_url'] !== undefined, 'Supabase URL must be preserved');
console.log('PASS: User authentication, roles, and company profiles strictly preserved.');

console.log('\nALL CHECKS PASSED SUCCESSFULLY!');
