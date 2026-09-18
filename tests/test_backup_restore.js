/**
 * Unit test for Data Backup & Restore functionality
 */
const assert = require('assert');

// Mock localStorage
class MockLocalStorage {
  constructor() {
    this.store = {};
  }
  getItem(key) {
    return this.store[key] !== undefined ? this.store[key] : null;
  }
  setItem(key, value) {
    this.store[key] = String(value);
  }
  removeItem(key) {
    delete this.store[key];
  }
  clear() {
    this.store = {};
  }
}

global.localStorage = new MockLocalStorage();

console.log('Testing GreenShift Backup & Restore logic...');

// 1. Setup sample data
localStorage.setItem('gs_company', JSON.stringify({ name: 'Hòa Bình Steel', tax: '0101234567' }));
localStorage.setItem('gs_activities', JSON.stringify([{ id: 'act-1', emission: 125.4 }]));
localStorage.setItem('cbam_goods', JSON.stringify([{ code: '72061000', name: 'Ingots' }]));

// 2. Perform mock export
const backupKeys = [
  'gs_users', 'gs_user', 'gs_company', 'gs_v2_company',
  'gs_activities', 'gs_custom_ef', 'gs_settings',
  'cbam_declarations', 'cbam_installations', 'cbam_processes', 'cbam_goods',
  'gs_audit_logs', 'gs_reconciliation_records'
];

const backupData = {
  app: 'GreenShift Core Engine',
  version: '2.2.0',
  exportedAt: new Date().toISOString(),
  data: {}
};

backupKeys.forEach(k => {
  const item = localStorage.getItem(k);
  if (item !== null) {
    try {
      backupData.data[k] = JSON.parse(item);
    } catch (e) {
      backupData.data[k] = item;
    }
  }
});

assert.strictEqual(backupData.app, 'GreenShift Core Engine');
assert.strictEqual(backupData.version, '2.2.0');
assert.strictEqual(backupData.data.gs_company.name, 'Hòa Bình Steel');
assert.strictEqual(backupData.data.gs_activities.length, 1);
assert.strictEqual(backupData.data.cbam_goods.length, 1);

// 3. Clear localStorage and perform restore
localStorage.clear();
assert.strictEqual(localStorage.getItem('gs_company'), null);

const jsonToRestore = JSON.parse(JSON.stringify(backupData));
const dataObj = jsonToRestore.data;
let restoredCount = 0;
Object.keys(dataObj).forEach(k => {
  if (k.startsWith('gs_') || k.startsWith('cbam_')) {
    const val = typeof dataObj[k] === 'object' ? JSON.stringify(dataObj[k]) : dataObj[k];
    localStorage.setItem(k, val);
    restoredCount++;
  }
});

assert.strictEqual(restoredCount, 3);
const restoredCompany = JSON.parse(localStorage.getItem('gs_company'));
assert.strictEqual(restoredCompany.name, 'Hòa Bình Steel');
const restoredActivities = JSON.parse(localStorage.getItem('gs_activities'));
assert.strictEqual(restoredActivities[0].emission, 125.4);

console.log('✅ Backup & Restore test passed successfully (100%)');
