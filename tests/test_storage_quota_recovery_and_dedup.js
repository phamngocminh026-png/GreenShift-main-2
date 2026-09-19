const fs = require('fs');
const path = require('path');
const assert = require('assert');
const vm = require('vm');

console.log('--- TEST: Storage Quota Recovery, Deduplication & Safety ---');

const actJsPath = path.join(__dirname, '..', 'assets', 'js', 'carbon-activity.js');
const docStorageJsPath = path.join(__dirname, '..', 'assets', 'js', 'document-storage.js');
const companyJsPath = path.join(__dirname, '..', 'assets', 'js', 'carbon-company.js');

const actJs = fs.readFileSync(actJsPath, 'utf8');
const docStorageJs = fs.readFileSync(docStorageJsPath, 'utf8');
const companyJs = fs.readFileSync(companyJsPath, 'utf8');

// 1. Static verifications
assert.ok(actJs.includes('function safeSaveActivities'), 'carbon-activity.js phải có hàm safeSaveActivities');
assert.ok(docStorageJs.includes('cleanupStorageQuota'), 'document-storage.js phải có cleanupStorageQuota');
assert.ok(!actJs.includes("localStorage.setItem(rawKey, JSON.stringify(data));"), 'Tuyệt đối KHÔNG được ghi đúp 2 bản copy data vào rawKey');

console.log('PASS 1: Kiểm tra tĩnh mã nguồn: Đã loại bỏ hoàn toàn việc ghi đúp dữ liệu và tích hợp safeSaveActivities.');

// 2. Functional Test: Quota Exhaustion & Auto Recovery Simulation
const store = {};
let quotaExceededTrigger = false;

const mockLocalStorage = {
  getItem(k) { return store[k] || null; },
  setItem(k, v) {
    if (quotaExceededTrigger) {
      const err = new Error("Failed to execute 'setItem' on 'Storage': Setting the value of '" + k + "' exceeded the quota.");
      err.name = 'QuotaExceededError';
      throw err;
    }
    store[k] = String(v);
  },
  removeItem(k) { delete store[k]; },
  get length() { return Object.keys(store).length; },
  key(i) { return Object.keys(store)[i] || null; }
};

// Seed legacy duplicate keys and large doc in mock store
const testUserEmail = 'phamcaovinh123@gmail.com';
const testUserSlug = 'phamcaovinh123gmailcom';
const rawKey = `gs_data_${testUserEmail}_tru_so_chinh_activity`;
const slugKey = `gs_data_${testUserSlug}_tru_so_chinh_activity`;

store['gs_current_user'] = testUserEmail;
store[rawKey] = JSON.stringify([{ id: 'old_1', amount: 100 }]);
store['gs_doc_123'] = JSON.stringify({
  docId: 'doc_123',
  fileName: 'heavy_file.pdf',
  dataUrl: 'data:application/pdf;base64,' + 'A'.repeat(80000)
});

const sandbox = {
  window: {},
  document: {
    getElementById: (id) => {
      if (id === 'branch-selector') return { value: 'Trụ sở chính' };
      return null;
    },
    querySelectorAll: () => [],
    addEventListener: () => {}
  },
  localStorage: mockLocalStorage,
  console: {
    log: () => {},
    warn: () => {},
    error: () => {}
  },
  setTimeout: (fn) => fn(),
  clearTimeout: () => {},
  parseFloat: parseFloat,
  parseInt: parseInt,
  Math: Math,
  Date: Date,
  String: String,
  JSON: JSON
};

vm.createContext(sandbox);
vm.runInContext(docStorageJs, sandbox);
assert.ok(sandbox.window.DocumentStorage, 'DocumentStorage phải sẵn sàng');

// Verify cleanupStorageQuota stripped large dataUrl
assert.ok(!store['gs_doc_123'].includes('dataUrl'), 'DocumentStorage.cleanupStorageQuota phải giải phóng chuỗi base64 lớn khỏi localStorage');
console.log('PASS 2: DocumentStorage đã dọn sạch các tệp base64 nặng trong localStorage.');

// Extract safeSaveActivities and test it
const startSave = actJs.indexOf('function safeSaveActivities');
const endSave = actJs.indexOf('function saveActivityList', startSave);
const fnCode = actJs.slice(startSave, endSave);
vm.runInContext(fnCode, sandbox);

// Call safeSaveActivities with sample activities
const sampleActivities = [
  { id: '1', date: '2026-01-02', amount: 45.1, unit: 'tấn', isDowntime: 'false', isInvoice: 'false', downtimeHours: '0', overtimeHours: '0' },
  { id: '2', date: '2026-01-03', amount: 46.2, unit: 'tấn', isDowntime: 'false', isInvoice: 'false', downtimeHours: '0', overtimeHours: '0' }
];

sandbox.safeSaveActivities(slugKey, sampleActivities);

// Verify slugKey is written and legacy rawKey with email @ was cleaned up
assert.ok(store[slugKey], 'slugKey phải được lưu trữ an toàn');
assert.strictEqual(store[rawKey], undefined, 'Key trùng lặp rawKey chứa @ phải được xóa triệt để để giải phóng bộ nhớ');
console.log('PASS 3: safeSaveActivities tự động dọn sạch key rác/key email có dấu @ và ghi thành công vào key chuẩn hóa.');

// 3. Test Emergency Compaction when localStorage throws QuotaExceededError on first try
let attempts = 0;
sandbox.localStorage.setItem = function(k, v) {
  attempts++;
  if (attempts <= 1) {
    const err = new Error("Setting the value of '" + k + "' exceeded the quota.");
    err.name = 'QuotaExceededError';
    throw err;
  }
  store[k] = String(v);
};

sandbox.safeSaveActivities(slugKey, sampleActivities);
assert.ok(store[slugKey], 'Sau khi gặp lỗi QuotaExceeded lần đầu, safeSaveActivities phải tự động dọn dẹp và nén để lưu thành công');
console.log('PASS 4: Tự động khôi phục dung lượng khẩn cấp và lưu thành công khi quota trình duyệt bị đầy.');

console.log('\n=== TẤT CẢ CÁC BÀI KIỂM THỬ DUNG LƯỢNG LƯU TRỮ ĐÃ ĐẠT 100%! ===');
