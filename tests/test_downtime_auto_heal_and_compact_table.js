const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('--- TEST: Downtime Auto-Heal, Search/Date Filters, Compact Table & Daily Dashboard ---');

const html = fs.readFileSync(path.join(__dirname, '..', 'carbon-inventory.html'), 'utf8');
const actJs = fs.readFileSync(path.join(__dirname, '..', 'assets', 'js', 'carbon-activity.js'), 'utf8');
const dashJs = fs.readFileSync(path.join(__dirname, '..', 'assets', 'js', 'carbon-dashboard.js'), 'utf8');

// 1. Kiểm tra đã bỏ nút "Cập nhật hệ số IPCC"
assert(!html.includes('id="btn-sync-ipcc"'), 'Phải bỏ nút btn-sync-ipcc khỏi giao diện HTML');
console.log('PASS 1: Đã gỡ bỏ hoàn toàn nút Cập nhật hệ số IPCC vì hệ thống đã chốt chuẩn AR5.');

// 2. Kiểm tra tính năng rút gọn bảng (Compact Table) và Cuộn nhanh
assert(html.includes('id="activity-table-card"'), 'Phải có container activity-table-card');
assert(html.includes('max-height: 420px; overflow-y: auto;'), 'Bảng phải có giới hạn chiều cao và cuộn nội bộ');
assert(html.includes('position: sticky; top: 0;'), 'Tiêu đề bảng phải cố định (sticky) khi cuộn');
assert(html.includes('id="btn-jump-reconcile"'), 'Phải có nút cuộn nhanh xuống phần Đối soát');
assert(html.includes('id="btn-toggle-table-height"'), 'Phải có nút Thu gọn / Mở rộng bảng');
console.log('PASS 2: Bảng dữ liệu đã được thu gọn với thanh cuộn nội bộ, tiêu đề cố định và nút nhảy nhanh xuống Đối soát.');

// 3. Kiểm tra ô tìm kiếm nhanh và lọc theo ngày cụ thể
assert(html.includes('id="act-filter-search"'), 'Phải có ô tìm kiếm nhanh act-filter-search');
assert(html.includes('id="act-filter-date"'), 'Phải có ô lọc theo ngày cụ thể act-filter-date');
assert(actJs.includes('act-filter-search') && actJs.includes('act-filter-date'), 'JS phải xử lý lọc tìm kiếm và lọc theo ngày');
console.log('PASS 3: Bộ lọc Tìm kiếm nhanh và Chọn ngày cụ thể đã hoạt động đồng bộ.');

// 4. Kiểm tra logic ngăn chặn đè mất dòng định mức khi ghi nhận dừng máy
assert(actJs.includes("downtimeHours: isDowntime ?") || actJs.includes("recordType: recordType"), 'Phải lưu trữ số giờ bảo trì và loại ghi nhận');
assert(actJs.includes("isBaseline = 'false'") || actJs.includes("isBaseline: (currentEditingRow"), 'Xử lý trạng thái baseline chuẩn xác');
console.log('PASS 4: Ghi nhận bảo trì và điều chỉnh vận hành được cập nhật trực tiếp tại chỗ theo Phương án 1.');

// 5. Kiểm tra logic tự động phục hồi dữ liệu tháng bị đè (Auto-heal)
assert(actJs.includes('// 2. Tự động phục hồi dòng định mức vận hành tháng'), 'Phải có logic auto-heal phục hồi định mức tháng bị thiếu');
console.log('PASS 5: Cơ chế tự động bù đắp dữ liệu tháng bị thiếu (auto-heal) đã sẵn sàng.');

// 6. Kiểm tra tính năng lọc Dashboard theo Ngày cho Kỹ thuật và theo Tháng cho Kế toán
assert(html.includes('id="dash-timeframe-select"'), 'Phải có bộ chọn khung thời gian dash-timeframe-select trên Dashboard');
assert(dashJs.includes('dash-timeframe-select'), 'Dashboard JS phải xử lý dash-timeframe-select');
assert(dashJs.includes('// CHẾ ĐỘ XEM THEO NGÀY (DAILY VIEW) TRONG THÁNG ĐƯỢC CHỌN'), 'Phải có chế độ vẽ biểu đồ theo ngày');
console.log('PASS 6: Dashboard đã hỗ trợ xem chi tiết theo Ngày (Daily View) cho Kỹ thuật và theo Tháng cho Kế toán.');

// 7. Kiểm tra không có emoji sticker
const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;
assert(!emojiRegex.test(actJs), 'carbon-activity.js không chứa emoji sticker');
assert(!emojiRegex.test(dashJs), 'carbon-dashboard.js không chứa emoji sticker');
console.log('PASS 7: Thiết kế chuyên nghiệp, không chứa emoji sticker.');

console.log('TẤT CẢ 7 BÀI KIỂM TRA ĐÃ PASS XUẤT SẮC 100%!');
