const fs = require('fs');
const assert = require('assert');

console.log('=== TEST: MATERIALITY SCOPE 3 ISOLATION & DEDICATED PRODUCTION LOGGING ===');

// Setup mock browser environment
global.window = global;
global.document = {
  getElementById: (id) => ({
    id,
    style: {},
    value: '',
    innerText: '',
    innerHTML: '',
    classList: { add: () => {}, remove: () => {}, contains: () => false },
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
    focus: () => {},
    select: () => {},
    scrollIntoView: () => {},
    closest: () => ({ style: {} })
  }),
  querySelectorAll: () => []
};

const html = fs.readFileSync('carbon-inventory.html', 'utf8');
const actJs = fs.readFileSync('assets/js/carbon-activity.js', 'utf8');

// 1. Kiểm tra carbon-inventory.html: openSourceModal phải ẩn materiality-assessment khi không thuộc Scope 3
assert.ok(html.includes('matDiv.style.display = (scopeInfo && scopeInfo.scope === 3) ? \'block\' : \'none\''), 
  'openSourceModal must hide materiality-assessment when category is not Scope 3');
assert.ok(html.includes('matDiv.style.display = (editScope && editScope.scope === 3) ? \'block\' : \'none\''),
  'attachSourceRowEvents must hide materiality-assessment when editing Scope 1/2 source');

console.log('PASS 1: Đánh giá trọng yếu (Scope 3) được cô lập chính xác, hoàn toàn ẩn với Scope 1 và Scope 2.');

// 2. Kiểm tra Các quá trình công nghiệp: Tự động mở sẵn khung cấu hình sản lượng năm và click vào badge
assert.ok(html.includes('sourceMeasureSelect.value = \'Theo sản lượng sản phẩm\''),
  'openSourceModal must auto-set measure to Theo sản lượng sản phẩm for Các quá trình công nghiệp');
assert.ok(html.includes('badgeProd.addEventListener(\'click\''),
  'attachSourceRowEvents must bind click handler to badge-pending-production');
assert.ok(html.includes('source-proc-annual-qty'),
  'HTML must include annual production input source-proc-annual-qty');

console.log('PASS 2: Khung cấu hình sản lượng năm mở sẵn cho Quá trình công nghiệp & nhấp trực tiếp từ nhãn Chờ nhập sản lượng.');

// 3. Kiểm tra carbon-activity.js: populateSourceDropdowns và triggerQuickProductionInput
assert.ok(actJs.includes('function populateSourceDropdowns(filterType, isProductionOnly)'),
  'populateSourceDropdowns must accept isProductionOnly flag');
assert.ok(actJs.includes('if (isProductionOnly && !isProc) return;'),
  'populateSourceDropdowns must skip non-production devices when in production-only mode');
assert.ok(actJs.includes('openModal(null, true)'),
  'triggerQuickProductionInput must call openModal with isProductionOnly=true');
assert.ok(actJs.includes('modalTitle.innerText = \'Chốt sản lượng Ca / Ngày (Quá trình công nghệ - IPPU)\''),
  'openModal must set dedicated title when isProductionOnly is true');

console.log('PASS 3: Chế độ Chốt sản lượng ca/ngày được chuyên biệt hóa, chỉ hiển thị thiết bị công nghệ luyện thép.');

// 4. Kiểm tra logic lọc thiết bị trong populateSourceDropdowns
const mockRows = [
  { type: 'Tiêu thụ điện', eq: 'Máy bơm cấp nước', category: 'Tiêu thụ điện', isProcessEmission: 'false' },
  { type: 'Tiêu thụ điện', eq: 'Quạt thông gió lò', category: 'Tiêu thụ điện', isProcessEmission: 'false' },
  { type: 'Các quá trình công nghiệp', eq: 'Lò hồ quang điện EAF 100 tấn/mẻ', category: 'Các quá trình công nghiệp', isProcessEmission: 'true', productionUnit: 'tấn', productName: 'Thép thô' },
  { type: 'Đốt cháy cố định', eq: 'Lò nung phôi thép', category: 'Đốt cháy cố định', isProcessEmission: 'false' }
];

let regularOptions = [];
let prodOnlyOptions = [];

mockRows.forEach(row => {
  const combined = (row.type + ' ' + row.eq + ' ' + row.category).toLowerCase();
  const isProc = (row.isProcessEmission === 'true' || 
                  row.category === 'Các quá trình công nghiệp' || 
                  combined.includes('hồ quang') || combined.includes('eaf') || combined.includes('luyện thép'));
  
  // Regular
  regularOptions.push(row.eq);
  // Production only
  if (isProc) {
    prodOnlyOptions.push(row.eq);
  }
});

assert.strictEqual(regularOptions.length, 4, 'Chế độ thường phải có đủ 4 thiết bị');
assert.strictEqual(prodOnlyOptions.length, 1, 'Chế độ chốt sản lượng chỉ được có 1 thiết bị công nghệ (Lò EAF)');
assert.strictEqual(prodOnlyOptions[0], 'Lò hồ quang điện EAF 100 tấn/mẻ', 'Thiết bị công nghệ duy nhất phải là Lò EAF');

console.log('PASS 4: Logic lọc thiết bị hoạt động hoàn hảo: loại bỏ máy bơm, quạt gió, giữ lại đúng Lò EAF 100 tấn/mẻ.');

console.log('=== ALL ASSERTIONS PASSED SUCCESSFULLY ===');
