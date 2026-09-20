const fs = require('fs');
const path = require('path');
const assert = require('assert');
const vm = require('vm');

console.log('====================================================================');
console.log('KIEM THU TICH HOP: NAP MAU TOAN BO 16 NGANH & TINH TOAN PHAT THAI');
console.log('====================================================================\n');

const rootDir = path.resolve(__dirname, '..');
const invHtml = fs.readFileSync(path.join(rootDir, 'carbon-inventory.html'), 'utf8');

const mockLocalStorage = {
  'gs_current_user': 'pham_ngoc_vinh',
  'gs_user_role': 'engineer'
};

const sandbox = {
  window: {},
  document: {
    getElementById: (id) => {
      if (id === 'branch-selector') return { value: 'main' };
      if (id === 'source-tbody') return { querySelectorAll: () => [] };
      return null;
    },
    querySelectorAll: (sel) => []
  },
  localStorage: {
    getItem: (k) => mockLocalStorage[k] || null,
    setItem: (k, v) => { mockLocalStorage[k] = String(v); },
    removeItem: (k) => { delete mockLocalStorage[k]; }
  },
  console: console,
  setTimeout: (fn) => fn(),
  Math: Math,
  Date: Date,
  parseFloat: parseFloat,
  parseInt: parseInt,
  JSON: JSON
};
vm.createContext(sandbox);

// Load required scripts in sandbox
const ipccJs = fs.readFileSync(path.join(rootDir, 'assets', 'js', 'ipcc-data.js'), 'utf8');
vm.runInContext(ipccJs, sandbox);
const eqDbJs = fs.readFileSync(path.join(rootDir, 'assets', 'js', 'equipment-db.js'), 'utf8');
vm.runInContext(eqDbJs, sandbox);
const catJs = fs.readFileSync(path.join(rootDir, 'assets', 'js', 'industry-catalog-16.js'), 'utf8');
vm.runInContext(catJs, sandbox);

// Mock helper functions in sandbox
sandbox.getBranchStorageKey = function(suffix) {
  const rawUser = (mockLocalStorage['gs_current_user'] || 'guest').trim();
  const userSlug = rawUser.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '') || 'guest';
  return `gs_data_${userSlug}_main_${suffix}`;
};
sandbox.window.removeVietnameseTones = function(str) {
  if (!str) return '';
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D');
};

// Extract seedIndustrySampleData from HTML
const seedStart = invHtml.indexOf('window.seedIndustrySampleData = function');
const seedEnd = invHtml.indexOf('window.seedSteelPlantSampleData = function', seedStart);
const seedFnCode = invHtml.slice(seedStart, seedEnd);
vm.runInContext(seedFnCode, sandbox);

const industries = [
  'Thep_Luyen_Kim',
  'Nhom_Luyen_Kim',
  'Xi_Mang',
  'Nhua_Hoa_Chat',
  'Phan_Bon',
  'Nhiet_Dien_Dien_Luc',
  'Hydrogen',
  'Bao_Bi_Giay',
  'Det_May',
  'Da_Giay',
  'Go_Noi_That',
  'Dien_Tu',
  'Thuc_Pham_Do_Uong',
  'Co_Khi_Che_Tao',
  'Nong_Nghiep',
  'Van_Tai_Logistics'
];

industries.forEach((ind, idx) => {
  console.log(`[TEST ${idx + 1}/16] Nap mau chuan nganh: ${ind}`);
  sandbox.window.seedIndustrySampleData(true, ind);

  const srcKey = sandbox.getBranchStorageKey('sources');
  const eqKey = sandbox.getBranchStorageKey('equipment');
  const actKey = sandbox.getBranchStorageKey('activity');

  const sources = JSON.parse(mockLocalStorage[srcKey] || '[]');
  const equipments = JSON.parse(mockLocalStorage[eqKey] || '[]');
  const activities = JSON.parse(mockLocalStorage[actKey] || '[]');

  assert.ok(sources.length > 0, `Nganh ${ind} phai co nguon phat thai`);
  assert.ok(equipments.length > 0, `Nganh ${ind} phai co danh muc thiet bi`);

  let totalEstimatedEmissions = 0;
  sources.forEach(s => {
    const emissions = parseFloat(s.annualEstEmissions) || 0;
    const qty = parseFloat(s.annualEstQty) || 0;
    assert.ok(!isNaN(emissions) && isFinite(emissions), `Phat thai phai la so hop le cho ${s.name}`);
    assert.ok(!isNaN(qty) && isFinite(qty), `San luong phai la so hop le cho ${s.name}`);
    
    // Khong mot nguon don le nao duoc vuot qua 5 trieu tan CO2e
    assert.ok(emissions < 5000000, `Nguon ${s.name} (${s.eqAsset}) co phat thai bi phong dai qua muc: ${emissions} tCO2e`);
    totalEstimatedEmissions += emissions;
  });

  console.log(`  Tong phat thai uoc tinh nguon (${ind}): ${Math.round(totalEstimatedEmissions).toLocaleString('vi-VN')} tCO2e`);
  console.log(`  So thiet bi: ${equipments.length}, So nguon: ${sources.length}, So ban ghi hoat dong: ${activities.length}`);

  // Doi voi Logistics, tong phat thai phai duoi 50.000 tan CO2e (truoc day bi phong dai 6+ trieu tan)
  if (ind === 'Van_Tai_Logistics') {
    assert.ok(totalEstimatedEmissions < 50000, `Van Tai Logistics khong duoc vuot qua 50.000 tan (thuc te: ${totalEstimatedEmissions})`);
  }
  // Doi voi Da Giay, tong phat thai duoi 20.000 tan CO2e
  if (ind === 'Da_Giay') {
    assert.ok(totalEstimatedEmissions < 20000, `Da Giay khong duoc vuot qua 20.000 tan (thuc te: ${totalEstimatedEmissions})`);
  }
  // Doi voi Co Khi Che Tao, tong phat thai duoi 20.000 tan CO2e
  if (ind === 'Co_Khi_Che_Tao') {
    assert.ok(totalEstimatedEmissions < 20000, `Co Khi Che Tao khong duoc vuot qua 20.000 tan (thuc te: ${totalEstimatedEmissions})`);
  }
});

console.log('\n====================================================================');
console.log('KET LUAN: 100% TAT CA 16 NGANH NAP MAU VA TINH TOAN CHUAN XAC!');
console.log('====================================================================');
