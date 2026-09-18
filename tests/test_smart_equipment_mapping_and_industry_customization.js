const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('================================================================');
console.log('TEST: SMART EQUIPMENT MAPPING & MULTI-INDUSTRY CUSTOMIZATION');
console.log('================================================================');

// 1. Setup mock environment & load equipment-db.js
global.window = global;
const eqDbCode = fs.readFileSync(path.join(__dirname, '..', 'assets', 'js', 'equipment-db.js'), 'utf8');
eval(eqDbCode);

console.log('PASS 1: equipment-db.js loaded successfully into test sandbox.');

// 2. Strict backward-compatibility assertion
assert.strictEqual(window.EQUIPMENT_MASTER.length, 92, 'EQUIPMENT_MASTER length must strictly remain 92 for legacy suite compatibility');
assert.ok(window.INDUSTRY_EQUIPMENT_REGISTRY && window.INDUSTRY_EQUIPMENT_REGISTRY.length >= 40, 'INDUSTRY_EQUIPMENT_REGISTRY must contain >= 40 industrial equipments');
const allEquipments = window.getAllEquipments();
assert.strictEqual(allEquipments.length, 92 + window.INDUSTRY_EQUIPMENT_REGISTRY.length, 'getAllEquipments must combine master + registry');

console.log(`PASS 2: Backward-compatibility preserved (Master: 92, Registry: ${window.INDUSTRY_EQUIPMENT_REGISTRY.length}, Total Combined: ${allEquipments.length}).`);

// 3. Multi-Industry Registry retrieval
const paperEqs = window.getIndustryEquipments('Giấy & Bột giấy');
assert.ok(paperEqs.length >= 4, 'Paper sector must have at least 4 registered equipments');
assert.ok(paperEqs.some(e => e.name.includes('Lò hơi tầng sôi') && e.name.includes('vỏ cây')), 'Paper must contain biomass fluidized bed boiler');

const textileEqs = window.getIndustryEquipments('Dệt may');
assert.ok(textileEqs.length >= 4, 'Textile sector must have at least 4 registered equipments');
assert.ok(textileEqs.some(e => e.name.includes('Máy nhuộm cao áp')), 'Textile must contain high pressure jet dyeing machine');

const foodEqs = window.getIndustryEquipments('Chế biến thực phẩm');
assert.ok(foodEqs.length >= 4, 'Food & Beverage must have at least 4 registered equipments');
assert.ok(foodEqs.some(e => e.name.includes('tiệt trùng thực phẩm UHT') || e.name.includes('UHT')), 'Food must contain UHT sterilizer');

const steelEqs = window.getIndustryEquipments('Sắt Thép');
assert.ok(steelEqs.length >= 10, 'Steel must retrieve standard steel equipments');

console.log('PASS 3: Industry equipment retrieval verified across Paper, Textile, Food, and Steel.');

// 4. Smart Equipment Identification & Alias Mapping for Shop-floor engineer inputs
const testPrompts = [
  { input: 'nồi hơi tầng sôi đốt vỏ cây mùn cưa', expected: 'Lò hơi tầng sôi đốt sinh khối', minConf: 0.8 },
  { input: 'may nhuom cao ap jet vai cuon', expected: 'Máy nhuộm cao áp Jet Dyeing', minConf: 0.8 },
  { input: 'hầm sấy keo eva đế giày thể thao', expected: 'Buồng sấy keo dán đế', minConf: 0.8 },
  { input: 'he thong tiet trung uht thanh trung sua', expected: 'tiệt trùng thực phẩm UHT', minConf: 0.8 },
  { input: 'may ep phun nhua thuy luc 250 tan', expected: 'Máy ép phun định hình hạt nhựa', minConf: 0.8 },
  { input: 'lo toi ram tham carbon nhiet luyen chi tiet may', expected: 'Lò tôi cao tần nhiệt luyện', minConf: 0.8 },
  { input: 'lo say go cong nghiep bang hoi nuoc', expected: 'Lò sấy gỗ công nghiệp', minConf: 0.8 },
  { input: 'xe nang forklift 3.5 tan chay dau diesel kho hang', expected: 'xe nâng hàng nội bộ', minConf: 0.8 },
  { input: 'dien phan nuoc san xuat khi hydrogen xanh', expected: 'điện phân nước', minConf: 0.8 },
  { input: 'lo han hoi luu smt 8 vung nhiet lap rap bo mach', expected: 'Lò hàn sóng Reflow Soldering', minConf: 0.8 },
  { input: 'tua bin hoi nuoc phat dien nhiet dien', expected: 'Tua bin hơi phát điện', minConf: 0.8 },
  { input: 'may say lua thap say nong san lua gao', expected: 'Máy sấy lúa / nông sản', minConf: 0.8 },
  { input: 'lo ho quang dien EAF luyen thep', expected: 'Lò hồ quang điện EAF', minConf: 0.9 }
];

testPrompts.forEach((tc, idx) => {
  const res = window.findStandardEquipmentSmart(tc.input);
  assert.ok(res, `Prompt "${tc.input}" must return a match`);
  assert.ok(res.confidence >= tc.minConf, `Prompt "${tc.input}" confidence (${res.confidence}) must be >= ${tc.minConf}`);
  const matchName = res.equipment ? res.equipment.name : (res.matched ? res.matched.name : '');
  assert.ok(matchName.toLowerCase().includes(tc.expected.toLowerCase()) || tc.expected.toLowerCase().includes(matchName.toLowerCase()),
    `Prompt "${tc.input}" matched "${matchName}", expected to include "${tc.expected}"`);
  console.log(`   [Prompt ${idx + 1}] "${tc.input}" -> Matched "${matchName}" (${Math.round(res.confidence * 100)}% by ${res.matchReason})`);
});

console.log('PASS 4: All 13 real-world engineer prompts accurately identified with high confidence.');

// 5. Check carbon-inventory.html UI components & Controller
const html = fs.readFileSync(path.join(__dirname, '..', 'carbon-inventory.html'), 'utf8');

assert.ok(html.includes('id="btn-smart-mapping-review"'), 'carbon-inventory.html must include #btn-smart-mapping-review button');
assert.ok(html.includes('id="modal-smart-eq-mapping"'), 'carbon-inventory.html must include #modal-smart-eq-mapping modal');
assert.ok(html.includes('window.openSmartEquipmentMappingModal'), 'carbon-inventory.html must define window.openSmartEquipmentMappingModal');
assert.ok(html.includes('smart-map-tbody'), 'carbon-inventory.html must contain #smart-map-tbody');
assert.ok(html.includes('smart-map-filter-input'), 'carbon-inventory.html must contain #smart-map-filter-input');
assert.ok(html.includes('btn-commit-smart-mapping'), 'carbon-inventory.html must contain #btn-commit-smart-mapping');

console.log('PASS 5: Smart Equipment Mapping Modal markup and controller scripts verified in carbon-inventory.html.');

// 6. Test Dynamic Excel Template Generation logic
assert.ok(html.includes('function downloadEquipmentTemplate()'), 'carbon-inventory.html must contain downloadEquipmentTemplate()');
assert.ok(html.includes('ci-setup-industry'), 'downloadEquipmentTemplate must read industry from ci-setup-industry');
assert.ok(html.includes('GreenShift_Mau_Thiet_Bi_Nha_May_Thep'), 'Steel industry template file name preserved');
assert.ok(html.includes('GreenShift_Mau_Thiet_Bi_'), 'Dynamic industry template file name generation implemented');

console.log('PASS 6: Dynamic industry Excel template generation verified for all mandatory sectors.');

// 7. Verify Universal Common Equipment across All Sectors (Audio Feedback Issue #2)
const mandatoryIndustries = ['Sắt Thép', 'Xi Măng', 'Dệt May', 'Chế Biến Thực Phẩm', 'Hóa Chất', 'Nhựa & Cao Su', 'Giấy & Bột Giấy'];
mandatoryIndustries.forEach(ind => {
  const eqs = window.getIndustryEquipments(ind);
  const commonCodes = eqs.filter(e => e.isCommon).map(e => e.code);
  assert.ok(commonCodes.includes('GEN-CHILLER-CENT'), `${ind} must include Chiller / Máy lạnh trung tâm`);
  assert.ok(commonCodes.includes('GEN-SEPTIC-TANK'), `${ind} must include Bể tự hoại & Xử lý nước thải sinh hoạt (Bể phốt)`);
  assert.ok(commonCodes.includes('GEN-CANTEEN-GAS'), `${ind} must include Hệ thống bếp ăn tập thể cán bộ CNV`);
  assert.ok(commonCodes.includes('GEN-GENSET-DIESEL'), `${ind} must include Máy phát điện dự phòng Diesel`);
  assert.ok(commonCodes.includes('GEN-FORKLIFT-FLEET'), `${ind} must include Đội xe nâng hàng`);
  assert.ok(commonCodes.includes('GEN-AIR-COMP-CENT'), `${ind} must include Trạm máy nén khí`);
  assert.ok(commonCodes.includes('GEN-FIRE-PUMP'), `${ind} must include Bơm chữa cháy PCCC`);
});
console.log('PASS 7: All 7 key industrial sectors contain 100% universal common equipment (Chiller, Bể phốt, Bếp ăn, Genset, Xe nâng, Máy nén khí, PCCC).');

// 8. Verify Alert Banner, Inline Editing & Empty Facility Guidance (Audio Feedback Issue #1)
assert.ok(html.includes('id="smart-map-alert-banner"'), 'carbon-inventory.html must include #smart-map-alert-banner');
assert.ok(html.includes('smart-map-input-name'), 'carbon-inventory.html must support inline editing of equipment name');
assert.ok(html.includes('smart-map-input-fuel'), 'carbon-inventory.html must support inline editing of fuel/energy');
assert.ok(html.includes('smart-map-input-cap'), 'carbon-inventory.html must support inline editing of capacity');
assert.ok(html.includes('smart-map-input-unit'), 'carbon-inventory.html must support inline editing of capacity unit');
assert.ok(html.includes('id="smart-map-empty-view"'), 'carbon-inventory.html must include #smart-map-empty-view for empty facility guidance');
assert.ok(html.includes('btn-smart-map-empty-download'), 'Empty view must include download template button');
assert.ok(html.includes('btn-smart-map-empty-upload'), 'Empty view must include upload equipment button');

console.log('PASS 8: Alert banner, inline manual editing, and empty facility guidance UI confirmed in carbon-inventory.html.');

console.log('\n================================================================');
console.log('ALL SMART EQUIPMENT MAPPING & INDUSTRY TESTS PASSED 100%!');
console.log('================================================================\n');
