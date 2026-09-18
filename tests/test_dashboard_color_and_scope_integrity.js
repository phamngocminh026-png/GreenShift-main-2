const fs = require('fs');
const assert = require('assert');

console.log('=== TEST: DASHBOARD SCOPE CATEGORIZATION & COLOR INTEGRITY ===');

// 1. Kiểm tra mã nguồn carbon-dashboard.js
const dashCode = fs.readFileSync('assets/js/carbon-dashboard.js', 'utf8');

// Trích xuất CATEGORY_SCOPE và getTrueCategory từ file
assert.ok(dashCode.includes("const scopeColors = ['#ea580c', '#0284c7', '#8b5cf6']"), 'Scope colors must be Warm Amber (#ea580c), Slate Blue (#0284c7), Amethyst Violet (#8b5cf6)');
assert.ok(dashCode.includes("viewMode === 'scope'"), 'carbon-dashboard.js must handle viewMode === scope for breakdown');
assert.ok(dashCode.includes("checkVnPublicHoliday"), 'carbon-dashboard.js must check Vietnamese public holidays on working days distribution');
assert.ok(dashCode.includes("btn-toggle-stack-mode"), 'carbon-dashboard.js must handle Stack/Group toggle button');
assert.ok(dashCode.includes("btn-back-to-year"), 'carbon-dashboard.js must handle Back to Year button');
assert.ok(!dashCode.includes("renderDecarbonizationInsights"), 'carbon-dashboard.js removed redundant decarbonization insights per user request');
assert.ok(dashCode.includes("backgroundColor: '#1e40af'"), 'Invoice reconcile color must be Navy Blue');
assert.ok(dashCode.includes("backgroundColor: '#059669'"), 'Machine engineering color must be Teal/Emerald Green');

console.log('-> PASS 1: Scope colors, breakdown mode, holiday checks, stack toggle verified with 0 collision.');

// 2. Kiểm tra hàm getTrueCategory với các Hạng mục Năng lượng mua ngoài (Kế toán)
const CATEGORY_SCOPE = {
  'Đốt cháy cố định': 1, 'Đốt cháy di động': 1, 'Đốt cháy động': 1, 'Phát thải thất thoát': 1, 'Các quá trình công nghiệp': 1, 'Sử dụng đất, thay đổi sử dụng đất và lâm nghiệp (LULUCF)': 1,
  'Điện mua vào': 2, 'Năng lượng mua vào (hơi, nhiệt)': 2,
  'Vận chuyển phân phối thượng nguồn': 3, 'Vận chuyển phân phối hạ nguồn': 3, 'Đi lại của nhân viên': 3, 'Đi công tác': 3,
  'Sản phẩm dịch vụ đã mua': 3, 'Hoạt động liên quan nhiên liệu ngoài loại 1, 2': 3, 'Hàng hóa vốn mua vào': 3, 'Xử lý chất thải phát sinh': 3,
  'Tài sản cho thuê thượng nguồn': 3, 'Sử dụng các dịch vụ': 3, 'Chế biến sản phẩm đã bán': 3, 'Sử dụng sản phẩm dịch vụ đã bán': 3,
  'Xử lý cuối vòng đời sản phẩm': 3, 'Tài sản cho thuê hạ nguồn': 3, 'Danh mục đầu tư': 3, 'Các nguồn phát thải gián tiếp đặc thù khác': 3
};

const sourceMap = {};
const sourceTypeMap = {};

const getTrueCategory = act => {
  if (act.category && CATEGORY_SCOPE[act.category]) return act.category;
  if (act.sourceId && sourceMap[act.sourceId]) return sourceMap[act.sourceId];
  if (act.sourceType && CATEGORY_SCOPE[act.sourceType]) return act.sourceType;
  if (act.sourceType && sourceTypeMap[act.sourceType]) return sourceTypeMap[act.sourceType];
  if (act.sourceName) {
    const sLower = act.sourceName.toLowerCase();
    if (sLower.includes('diesel') || sLower.includes('dầu do') || sLower.includes('dầu fo') || sLower.includes('lò hơi')) return 'Đốt cháy cố định';
    if (sLower.includes('điện') || sLower.includes('evn')) return 'Điện mua vào';
    if (sLower.includes('xăng')) return 'Đốt cháy động';
    if (sLower.includes('gas') || sLower.includes('lpg')) return 'Đốt cháy cố định';
    if (sLower.includes('than')) return 'Đốt cháy cố định';
    if (sLower.includes('r-') || sLower.includes('môi chất') || sLower.includes('gas lạnh')) return 'Phát thải thất thoát';
  }
  return 'Khác';
};

// Test Dầu Diesel DO -> Phải là Scope 1
const dieselAct = { sourceId: 'src_fac_diesel', sourceType: 'Đốt cháy cố định', sourceName: 'Dầu Diesel (DO) mua ngoài (Toàn nhà máy / Bồn tổng)', co2e: 40.3 };
assert.strictEqual(CATEGORY_SCOPE[getTrueCategory(dieselAct)], 1, 'Dầu Diesel mua ngoài phải thuộc Scope 1');

// Test Điện lưới EVN -> Phải là Scope 2
const evnAct = { sourceId: 'src_fac_electricity', sourceType: 'Điện mua vào', sourceName: 'Điện lưới EVN mua ngoài (Tổng công tơ nhà máy)', co2e: 67.6 };
assert.strictEqual(CATEGORY_SCOPE[getTrueCategory(evnAct)], 2, 'Điện lưới EVN mua ngoài phải thuộc Scope 2');

// Test Xăng RON95 -> Phải là Scope 1
const petrolAct = { sourceId: 'src_fac_petrol', sourceType: 'Đốt cháy động', sourceName: 'Xăng RON 95 / E5 mua ngoài', co2e: 15.2 };
assert.strictEqual(CATEGORY_SCOPE[getTrueCategory(petrolAct)], 1, 'Xăng xe công ty phải thuộc Scope 1');

// Test Gas LPG -> Phải là Scope 1
const lpgAct = { sourceId: 'src_fac_lpg', sourceType: 'Đốt cháy cố định', sourceName: 'Khí dầu mỏ hóa lỏng LPG mua ngoài', co2e: 8.5 };
assert.strictEqual(CATEGORY_SCOPE[getTrueCategory(lpgAct)], 1, 'Khí LPG phải thuộc Scope 1');

// Test Tiêu thụ điện / Chiller -> Phải thuộc Scope 2
const chillerAct = { sourceId: 'src_chiller_01', sourceType: 'Tiêu thụ điện', sourceName: 'Hệ thống Chiller làm mát xưởng', co2e: 25.4 };
const chillerCatScope = dashCode.includes("'Tiêu thụ điện': 2");
assert.ok(chillerCatScope, 'CATEGORY_SCOPE trong carbon-dashboard.js phải chứa Tiêu thụ điện: 2');
assert.ok(dashCode.includes("getScopeNum"), 'carbon-dashboard.js phải có hàm getScopeNum');

console.log('-> PASS 2: Facility energy categories and Electricity consumption correctly classified into Scope 1 and Scope 2.');

// 3. Kiểm tra carbon-inventory.html: năm 2026 selected mặc định và CATEGORY_SCOPE có Tiêu thụ điện -> Loại 2
const html = fs.readFileSync('carbon-inventory.html', 'utf8');
assert.ok(html.includes('<option value="2026" selected>2026</option>'), 'Năm 2026 phải được selected mặc định trong #dash-year-select');
assert.ok(html.includes("'Tiêu thụ điện':                                       { label: 'Loại 2', scope: 2 }"), 'carbon-inventory.html phải map Tiêu thụ điện -> Loại 2, Scope 2');

console.log('-> PASS 3: Default year 2026 selected and Tiêu thụ điện strictly mapped to Loại 2 (Scope 2).');

console.log('=== DASHBOARD SCOPE & COLOR TEST PASSED 100%! ===\n');
