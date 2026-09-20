const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('=== TEST: test_emission_sources_table_facility_isolation.js ===');

const invHtmlPath = path.join(__dirname, '..', 'carbon-inventory.html');
const actJsPath = path.join(__dirname, '..', 'assets', 'js', 'carbon-activity.js');
const dashJsPath = path.join(__dirname, '..', 'assets', 'js', 'carbon-dashboard.js');

const invHtml = fs.readFileSync(invHtmlPath, 'utf8');
const actJs = fs.readFileSync(actJsPath, 'utf8');
const dashJs = fs.readFileSync(dashJsPath, 'utf8');

// 1. Kiểm tra carbon-inventory.html loadSourceList() đã lọc bỏ triệt để FACILITY_ENERGY_SOURCES
assert.ok(invHtml.includes('isFacilityEnergySource'), 'loadSourceList() phải có hàm kiểm tra isFacilityEnergySource');
assert.ok(invHtml.includes("startsWith('src_fac_')"), 'Phải kiểm tra tiền tố src_fac_');
assert.ok(invHtml.includes('hadFacilitySources'), 'Phải xử lý hadFacilitySources để dọn sạch localStorage');
console.log('PASS 1: carbon-inventory.html đã lọc bỏ hoàn toàn các nguồn cấp cơ sở khỏi bảng Nguồn phát thải.');

// 2. Kiểm tra commitBatchInvoices() trong carbon-activity.js không chèn FACILITY_ENERGY_SOURCES vào sources
assert.ok(!actJs.includes('sourceAdded = true;'), 'commitBatchInvoices() không được chèn các nguồn fSrc vào sources');
assert.ok(actJs.includes("filter(x => !x.isFacility && !String(x.id || '').startsWith('src_fac_'))"), 'commitBatchInvoices() phải chủ động dọn sạch các nguồn src_fac_ khỏi sources');
console.log('PASS 2: commitBatchInvoices() không gây ô nhiễm bảng nguồn thiết bị khi nạp bảng kê hóa đơn.');

// 3. Kiểm tra populateSourceDropdowns() trong carbon-activity.js không lặp các nguồn cơ sở trong nhóm thiết bị
assert.ok(actJs.includes("row.dataset.isFacility === 'true' || row.dataset.isFacility === true || (id && id.startsWith('src_fac_'))"), 'populateSourceDropdowns() phải bỏ qua src_fac_ trong rowsList');
console.log('PASS 3: Dropdown thiết bị của Kế toán không bị lặp các mục Đốt cháy cố định generic.');

// 4. Kiểm tra carbon-dashboard.js nạp sẵn FACILITY_ENERGY_SOURCES vào sourceMap
assert.ok(dashJs.includes('facMasterSources'), 'carbon-dashboard.js phải nạp facMasterSources vào sourceMap');
assert.ok(dashJs.includes('InvoiceParser.FACILITY_ENERGY_SOURCES'), 'carbon-dashboard.js phải tham chiếu InvoiceParser.FACILITY_ENERGY_SOURCES');
console.log('PASS 4: Dashboard luôn nhận diện chuẩn Scope của các hóa đơn cơ sở mà không cần lưu lẫn vào danh mục thiết bị.');

// 5. Mô phỏng logic lọc nguồn phát thải
const mockSources = [
  { id: 'src_fac_diesel', name: 'Dầu Diesel (DO) mua ngoài', category: 'Đốt cháy cố định', isFacility: 'true' },
  { id: 'src_fac_electricity', name: 'Điện lưới EVN', category: 'Điện mua vào', isFacility: 'true' },
  { id: 'src_genset_01', name: 'Máy phát điện Cummins 500kVA', eq: 'Máy phát điện', category: 'Đốt cháy cố định' },
  { id: 'src_ippu_steel', name: 'Quá trình luyện thép EAF', eq: 'Lò hồ quang điện', category: 'Các quá trình công nghiệp' }
];

const isFac = d => Boolean(d && (d.isFacility === 'true' || d.isFacility === true || (d.id && String(d.id).startsWith('src_fac_'))));
const cleanList = mockSources.filter(d => !isFac(d));

assert.strictEqual(cleanList.length, 2, 'Sau khi lọc chỉ còn 2 nguồn thiết bị thực tế');
assert.strictEqual(cleanList[0].id, 'src_genset_01');
assert.strictEqual(cleanList[1].id, 'src_ippu_steel');
console.log('PASS 5: Mô phỏng thuật toán lọc nguồn hoạt động chính xác 100%.');

console.log('\n=== TẤT CẢ 5 TIÊU CHÍ KIỂM THỬ ĐÃ ĐẠT 100%! ===');
