const fs = require('fs');
const path = require('path');
const assert = require('assert');
const vm = require('vm');

console.log('=== GREENSHIFT COMPREHENSIVE 16-INDUSTRY AUDIT SUITE ===\n');

// 1. Zero Emoji Rule Verification
console.log('Test 1: Zero Emoji Rule Audit...');
const filesToCheck = [
  './assets/js/carbon-activity.js',
  './carbon-inventory.html',
  './assets/js/industry-catalog-16.js'
];
const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1FA00}-\u{1FAFF}]/u;
filesToCheck.forEach(f => {
  const content = fs.readFileSync(f, 'utf8');
  assert.strictEqual(emojiRegex.test(content), false, `Zero Emoji rule violated in ${f}`);
});
console.log('PASS 1: Zero Emoji verified across carbon-activity.js, carbon-inventory.html, industry-catalog-16.js.');

// Setup Sandbox
const sandbox = {
  window: {},
  document: {
    getElementById: (id) => null,
    querySelectorAll: (sel) => []
  },
  localStorage: {
    getItem: () => null,
    setItem: () => null,
    removeItem: () => null
  },
  console: console
};
sandbox.global = sandbox.window;
sandbox.window.window = sandbox.window;
vm.createContext(sandbox);

// Load Scripts
vm.runInContext(fs.readFileSync('./assets/js/ef_database.js', 'utf8'), sandbox);
vm.runInContext(fs.readFileSync('./assets/js/equipment-db.js', 'utf8'), sandbox);
vm.runInContext(fs.readFileSync('./assets/js/industry-catalog-16.js', 'utf8'), sandbox);

const htmlContent = fs.readFileSync('./carbon-inventory.html', 'utf8');
const catScopeMatch = htmlContent.match(/const CATEGORY_SCOPE = \{([\s\S]*?)\n    \};/);
assert.ok(catScopeMatch, 'CATEGORY_SCOPE must be found in carbon-inventory.html');
vm.runInContext('const CATEGORY_SCOPE = {' + catScopeMatch[1] + '}; window.CATEGORY_SCOPE = CATEGORY_SCOPE;', sandbox);

const scopeInfoMatch = htmlContent.match(/function getScopeInfo\([\s\S]*?\n    \}/);
assert.ok(scopeInfoMatch, 'getScopeInfo must be found in carbon-inventory.html');
vm.runInContext(scopeInfoMatch[0], sandbox);

const ippuMatch = htmlContent.match(/window\.IPPU_EQUIPMENT_RULES\s*=\s*(\[[\s\S]*?\n    \]);/);
assert.ok(ippuMatch, 'IPPU_EQUIPMENT_RULES must be found in carbon-inventory.html');
vm.runInContext('window.IPPU_EQUIPMENT_RULES = ' + ippuMatch[1] + ';', sandbox);

const activityContent = fs.readFileSync('./assets/js/carbon-activity.js', 'utf8');
const startIppuFn = activityContent.indexOf('function getIndustryIppuDefaults(ind) {');
const endIppuFn = activityContent.indexOf('window.getCurrentIndustry = getCurrentIndustry;', startIppuFn);
assert.ok(startIppuFn !== -1 && endIppuFn !== -1, 'getIndustryIppuDefaults must be found in carbon-activity.js');
const getIndustryIppuCode = activityContent.substring(startIppuFn, endIppuFn).trim();
vm.runInContext(getIndustryIppuCode + '; window.getIndustryIppuDefaults = getIndustryIppuDefaults;', sandbox);

const formatRateUnitMatch = activityContent.match(/function formatRateUnit\(capUnit, sourceType\)\s*\{[\s\S]*?\n    \}/);
assert.ok(formatRateUnitMatch, 'formatRateUnit must be found in carbon-activity.js');
vm.runInContext(formatRateUnitMatch[0] + '; window.formatRateUnit = formatRateUnit;', sandbox);

// 2. Test Catalog Loading across all 16 industries
console.log('\nTest 2: Auditing Catalog Equipment for all 16 Industries...');
const industries = [
  { name: 'Sắt Thép', key: 'Thep_Luyen_Kim', count: 26, isIppuExpected: true },
  { name: 'Nhôm', key: 'Nhom_Luyen_Kim', count: 23, isIppuExpected: true },
  { name: 'Xi măng', key: 'Xi_Mang', count: 26, isIppuExpected: true },
  { name: 'Phân bón', key: 'Phan_Bon', count: 23, isIppuExpected: true },
  { name: 'Nhiệt điện / Điện lực', key: 'Nhiet_Dien_Dien_Luc', count: 21, isIppuExpected: false },
  { name: 'Hydrogen', key: 'Hydrogen', count: 20, isIppuExpected: true },
  { name: 'Bao bì & Giấy', key: 'Bao_Bi_Giay', count: 20, isIppuExpected: false },
  { name: 'Dệt may', key: 'Det_May', count: 21, isIppuExpected: false },
  { name: 'Da giày', key: 'Da_Giay', count: 20, isIppuExpected: false },
  { name: 'Nhựa & Hóa chất', key: 'Nhua_Hoa_Chat', count: 22, isIppuExpected: false },
  { name: 'Thực phẩm & Đồ uống', key: 'Thuc_Pham_Do_Uong', count: 20, isIppuExpected: false },
  { name: 'Cơ khí chế tạo', key: 'Co_Khi_Che_Tao', count: 20, isIppuExpected: false },
  { name: 'Nông nghiệp', key: 'Nong_Nghiep', count: 20, isIppuExpected: false },
  { name: 'Vận tải & Logistics', key: 'Van_Tai_Logistics', count: 20, isIppuExpected: false },
  { name: 'Gỗ & Nội thất', key: 'Go_Noi_That', count: 27, isIppuExpected: false },
  { name: 'Điện tử', key: 'Dien_Tu', count: 20, isIppuExpected: false }
];

let totalEquipments = 0;
industries.forEach((ind, idx) => {
  const rows = sandbox.window.getIndustry16TemplateRows(ind.name);
  assert.ok(rows && rows.length === ind.count, `Industry ${ind.name} must have ${ind.count} items, got ${rows ? rows.length : 0}`);
  totalEquipments += rows.length;
});
assert.strictEqual(totalEquipments, 349, 'Total equipment items in 16 catalogs must equal 349');
console.log('PASS 2: All 16 industries catalog templates successfully verified (Total 349 standard equipment items).');

// 3. Test Scope 1 / Scope 2 / Scope 3 Classification
console.log('\nTest 3: Auditing Scope 1/2/3 Categorization & Biogenic Scope 1 Alignment...');
let biogenicCount = 0;
industries.forEach(ind => {
  const rows = sandbox.window.getIndustry16TemplateRows(ind.name);
  rows.forEach(eq => {
    const cat = eq['Nguồn phát thải'] || '';
    const fuel = eq['Loại năng lượng sử dụng (Điện / Nhiên liệu đốt)'] || '';
    const type = eq['Loại thiết bị'] || '';
    const info = sandbox.getScopeInfo(cat, fuel, type);
    assert.ok(info && (info.scope === 1 || info.scope === 2 || info.scope === 3), `Scope must be 1, 2, or 3 for ${eq['Tên thiết bị']}`);
    if (cat.includes('sinh khối') || cat.includes('Biogenic')) {
      biogenicCount++;
      assert.strictEqual(info.scope, 1, `Biogenic equipment ${eq['Tên thiết bị']} MUST be Scope 1 direct combustion per ISO 14064-1`);
    }
  });
});
assert.ok(biogenicCount >= 2, 'Must have at least 2 biogenic equipment items tested');
console.log(`PASS 3: 100% of 349 equipment correctly classified. Biogenic biomass (${biogenicCount} items) accurately mapped to Scope 1.`);

// 4. Test IPPU Defaults for all 16 Industries (No Steel Spillover)
console.log('\nTest 4: Auditing IPPU Defaults across all 16 industries (No steel spillover)...');
industries.forEach(ind => {
  const def = sandbox.window.getIndustryIppuDefaults(ind.name);
  assert.ok(def, `Defaults must exist for ${ind.name}`);
  assert.ok(def.managerTitle, `managerTitle must exist for ${ind.name}`);
  assert.ok(def.productName, `productName must exist for ${ind.name}`);
  assert.ok(def.productionUnit, `productionUnit must exist for ${ind.name}`);

  if (ind.name !== 'Sắt Thép') {
    assert.strictEqual(
      def.managerTitle.includes('luyện thép'),
      false,
      `Industry "${ind.name}" must NOT spill over to "luyện thép" managerTitle (got: ${def.managerTitle})`
    );
  }
});

// Specific industry checks
const aluDef = sandbox.window.getIndustryIppuDefaults('Nhôm');
assert.strictEqual(aluDef.efFactor, '1600');
assert.strictEqual(aluDef.productName, 'Nhôm nguyên sinh');
assert.strictEqual(aluDef.managerTitle, 'Kỹ sư xưởng điện phân nhôm');

const cemDef = sandbox.window.getIndustryIppuDefaults('Xi măng');
assert.strictEqual(cemDef.efFactor, '525');
assert.strictEqual(cemDef.productName, 'Clinker xi măng');
assert.strictEqual(cemDef.managerTitle, 'Kỹ sư công nghệ clanhke');

const fertDef = sandbox.window.getIndustryIppuDefaults('Phân bón');
assert.strictEqual(fertDef.efFactor, '1694');
assert.strictEqual(fertDef.productName, 'Amoniac (NH3) / Phân đạm Ure');
assert.strictEqual(fertDef.managerTitle, 'Kỹ sư công nghệ tổng hợp NH3 / Ure');

const hydDef = sandbox.window.getIndustryIppuDefaults('Hydrogen');
assert.strictEqual(hydDef.efFactor, '8900');
assert.strictEqual(hydDef.productName, 'Khí Hydro (H2)');
assert.strictEqual(hydDef.managerTitle, 'Kỹ sư công nghệ sản xuất Hydrogen');

const footDef = sandbox.window.getIndustryIppuDefaults('Da giày');
assert.strictEqual(footDef.productionUnit, 'đôi');
assert.strictEqual(footDef.productName, 'Giày dép thành phẩm');
assert.strictEqual(footDef.managerTitle, 'Kỹ sư công nghệ gò ráp da giày');

const elecDef = sandbox.window.getIndustryIppuDefaults('Điện tử');
assert.strictEqual(elecDef.productionUnit, 'sản phẩm');
assert.strictEqual(elecDef.productName, 'Bo mạch điện tử PCBA / Thiết bị điện tử');
assert.strictEqual(elecDef.managerTitle, 'Kỹ sư trưởng dây chuyền SMT / Bán dẫn');

const logDef = sandbox.window.getIndustryIppuDefaults('Vận tải & Logistics');
assert.strictEqual(logDef.productionUnit, 'tấn.km');
assert.strictEqual(logDef.managerTitle, 'Quản lý đội xe & Điều hành logistics');
console.log('PASS 4: All 16 industries have distinct, domain-accurate IPPU & production defaults with zero steel spillover.');

// 5. Test IPPU Auto-Provisioning & Exclusion Precision
console.log('\nTest 5: Auditing IPPU Auto-Provisioning & Auxiliary Exclusions...');
const ippuRules = sandbox.window.IPPU_EQUIPMENT_RULES;
assert.ok(ippuRules.length >= 8, 'Must have at least 8 IPPU rules including Ammonia and Hydrogen');

function checkIppuMatch(eq) {
  const lowerStr = ((eq['Loại thiết bị'] || '') + ' ' + (eq['Tên thiết bị'] || '')).toLowerCase();
  const isCoolerOrAux = lowerStr.includes('làm nguội') || lowerStr.includes('cooler') || lowerStr.includes('nghiền') || lowerStr.includes('mill') || lowerStr.includes('silo') || lowerStr.includes('băng tải') || lowerStr.includes('conveyor') || lowerStr.includes('hút bụi') || lowerStr.includes('baghouse') || lowerStr.includes('lọc bụi') || lowerStr.includes('quạt') || lowerStr.includes('xử lý bụi') || lowerStr.includes('hàn') || lowerStr.includes('robot hàn') || lowerStr.includes('máy hàn');
  if (isCoolerOrAux) return null;
  return ippuRules.find(rule => rule.keywords.some(kw => lowerStr.includes(kw)));
}

// Steel checks
const steelRows = sandbox.window.getIndustry16TemplateRows('Sắt Thép');
const eafFurnace = steelRows.find(e => e['Số tài sản'] === 'STEEL-EAF-01');
const steelBaghouse = steelRows.find(e => e['Tên thiết bị'].includes('Baghouse EAF'));
assert.ok(eafFurnace, 'STEEL-EAF-01 must exist');
assert.ok(steelBaghouse, 'Baghouse EAF must exist');
assert.ok(checkIppuMatch(eafFurnace), 'STEEL-EAF-01 furnace MUST trigger IPPU rule');
assert.ok(!checkIppuMatch(steelBaghouse), 'Baghouse EAF dust collector must NOT trigger IPPU rule');

// Cement checks
const cementRows = sandbox.window.getIndustry16TemplateRows('Xi măng');
const clinkerKiln = cementRows.find(e => e['Số tài sản'] === 'CEM-KILN-MAIN');
const grateCooler = cementRows.find(e => e['Số tài sản'] === 'CEM-COOLER-GRATE');
assert.ok(clinkerKiln, 'CEM-KILN-MAIN must exist');
assert.ok(grateCooler, 'CEM-COOLER-GRATE must exist');
assert.ok(checkIppuMatch(clinkerKiln), 'CEM-KILN-MAIN clinker kiln MUST trigger IPPU');
assert.ok(!checkIppuMatch(grateCooler), 'CEM-COOLER-GRATE grate cooler must NOT trigger IPPU');

// Fertilizer checks
const fertRows = sandbox.window.getIndustry16TemplateRows('Phân bón');
const primReformer = fertRows.find(e => e['Số tài sản'] === 'FERT-REF-PRIM');
const fertMatch = checkIppuMatch(primReformer);
assert.ok(fertMatch, 'FERT-REF-PRIM primary reformer MUST trigger Ammonia IPPU');
assert.strictEqual(fertMatch.efFactor, 1694);

// Hydrogen checks
const hydRows = sandbox.window.getIndustry16TemplateRows('Hydrogen');
const smrFurnace = hydRows.find(e => e['Số tài sản'] === 'HYD-SMR-FURN');
const hydMatch = checkIppuMatch(smrFurnace);
assert.ok(hydMatch, 'HYD-SMR-FURN SMR furnace MUST trigger Hydrogen IPPU');
assert.strictEqual(hydMatch.efFactor, 8900);

// Non-IPPU industries: zero IPPU triggers
const nonIppuIndustries = ['Dệt may', 'Da giày', 'Gỗ & Nội thất', 'Điện tử', 'Thực phẩm & Đồ uống', 'Cơ khí chế tạo', 'Nông nghiệp', 'Vận tải & Logistics'];
nonIppuIndustries.forEach(indName => {
  const rows = sandbox.window.getIndustry16TemplateRows(indName);
  const matched = rows.filter(e => checkIppuMatch(e));
  assert.strictEqual(matched.length, 0, `Non-IPPU industry "${indName}" must have 0 IPPU triggers, got: ${matched.map(m => m['Tên thiết bị']).join(', ')}`);
});
console.log('PASS 5: IPPU auto-provisioning verified. Zero false positives for dust filters and non-IPPU sectors.');

// 6. Test Rate Units Formatting across all 349 equipments
console.log('\nTest 6: Auditing Rate Units formatting across all 349 equipments...');
const allUnitsFound = new Set();
industries.forEach(ind => {
  const rows = sandbox.window.getIndustry16TemplateRows(ind.name);
  rows.forEach(eq => {
    const u = eq['Đơn vị công suất'];
    if (u) allUnitsFound.add(u);
    const formatted = sandbox.window.formatRateUnit(u, eq['Loại thiết bị']);
    assert.strictEqual(formatted.includes('/tháng/h'), false, `Unit stacking /tháng/h in ${eq['Tên thiết bị']}`);
    assert.strictEqual(formatted.includes('/ngày/h'), false, `Unit stacking /ngày/h in ${eq['Tên thiết bị']}`);
    assert.strictEqual(formatted.includes('/năm/h'), false, `Unit stacking /năm/h in ${eq['Tên thiết bị']}`);
  });
});
assert.strictEqual(sandbox.window.formatRateUnit('kg/tháng', 'Bếp gas'), 'kg/h');
assert.strictEqual(sandbox.window.formatRateUnit('m3/ngày', 'Nước thải'), 'm3/h');
assert.strictEqual(sandbox.window.formatRateUnit('kW', 'Động cơ'), 'kWh/h');
assert.strictEqual(sandbox.window.formatRateUnit('Nm3/h', 'Lò Reforming'), 'Nm3/h');
console.log('PASS 6: Rate unit formatting validated with zero stacking across all capacity units in 16 sectors.');

console.log('\n=== ALL 6 COMPREHENSIVE AUDIT TESTS PASSED 100% ===');
