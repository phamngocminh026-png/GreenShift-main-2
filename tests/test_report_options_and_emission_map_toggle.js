const fs = require('fs');
const assert = require('assert');

// Đọc nội dung carbon-inventory.html
const html = fs.readFileSync('carbon-inventory.html', 'utf8');

// 1. Kiểm tra Loại báo cáo trong view-report: Chỉ để kiểm kê KNK theo NĐ 06, bỏ ISO và Giảm nhẹ
assert.ok(html.includes('id="report-category"'), 'Thiếu id="report-category"');
assert.ok(html.includes('value="nd06" selected>Báo cáo Kiểm kê Khí nhà kính theo Nghị định 06'), 'Thiếu lựa chọn Nghị định 06 mặc định');
assert.ok(!html.includes('value="iso"'), 'Vẫn còn lựa chọn báo cáo ISO (cần loại bỏ theo yêu cầu)');
assert.ok(!html.includes('value="giamnhe"'), 'Vẫn còn lựa chọn báo cáo Giảm nhẹ (cần loại bỏ theo yêu cầu)');

// 2. Kiểm tra Năm báo cáo trong view-report: Mặc định là 2026, sắp xếp giảm dần, không mặc định 2020
assert.ok(html.includes('id="report-year"'), 'Thiếu id="report-year"');
assert.ok(html.includes('<option value="2026" selected>2026</option>'), 'Năm 2026 chưa được đặt làm mặc định selected');

// Trích xuất danh sách các năm trong select report-year
const reportYearSelectMatch = html.match(/<select id="report-year"[\s\S]*?<\/select>/);
assert.ok(reportYearSelectMatch, 'Không tìm thấy thẻ select report-year');
const yearOptions = [...reportYearSelectMatch[0].matchAll(/value="(\d+)"/g)].map(m => parseInt(m[1], 10));

assert.strictEqual(yearOptions[0], 2026, 'Năm đầu tiên trong dropdown phải là 2026');
assert.ok(yearOptions[0] > yearOptions[1], 'Danh sách năm phải được sắp xếp giảm dần để không phải cuộn');
assert.ok(yearOptions.includes(2020), 'Phải bao gồm cả các năm trước đó như 2020');

// 3. Kiểm tra Bản đồ phát thải toàn diện: Có nút toggle và MẶC ĐỊNH ẨN
assert.ok(html.includes('id="btn-toggle-emission-map"'), 'Thiếu nút btn-toggle-emission-map');
assert.ok(html.includes('Hiện bản đồ phát thải'), 'Nút chưa có nhãn "Hiện bản đồ phát thải" ban đầu');
assert.ok(html.includes('id="emission-map-container" style="display: none;'), 'Bản đồ phát thải chưa được mặc định ẩn (display: none)');
assert.ok(html.includes('BẢN ĐỒ PHÁT THẢI TOÀN DIỆN CỦA DOANH NGHIỆP'), 'Tiêu đề bản đồ phát thải bị mất');

// 4. Kiểm tra Danh sách nguồn phát thải: Mặc định hiển thị
assert.ok(html.includes('id="source-table-container" style="display: block;'), 'Bảng danh sách nguồn phát thải chưa được hiển thị mặc định');

console.log('Test test_report_options_and_emission_map_toggle.js passed successfully!');
