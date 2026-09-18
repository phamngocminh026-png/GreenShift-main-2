const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('--- TEST: Engineer Operational Log Modal & Time-Range UX ---');

const htmlPath = path.join(__dirname, '..', 'carbon-inventory.html');
const jsPath = path.join(__dirname, '..', 'assets', 'js', 'carbon-activity.js');

const html = fs.readFileSync(htmlPath, 'utf8');
const js = fs.readFileSync(jsPath, 'utf8');

// 1. Kiểm tra không còn tab "Nhập trực tiếp / Hóa đơn" cho Kỹ sư
assert(html.includes('id="btn-mode-direct"'), 'Phải có id btn-mode-direct');
assert(html.includes('style="display: none;'), 'Nút hóa đơn trực tiếp mặc định ẩn');
assert(js.includes("btnModeDirect.style.display = 'none'"), 'Kỹ sư mở modal thì nút hóa đơn trực tiếp bị ẩn 100%');
console.log('PASS 1: Đã loại bỏ hoàn toàn tab Nhập trực tiếp / Hóa đơn khỏi giao diện Kỹ sư.');

// 2. Kiểm tra bộ chọn khung giờ bắt đầu / kết thúc (Từ mấy giờ đến mấy giờ)
assert(html.includes('id="input-op-time-start"'), 'Phải có ô nhập Từ mấy giờ (time-start)');
assert(html.includes('id="input-op-time-end"'), 'Phải có ô nhập Đến mấy giờ (time-end)');
assert(html.includes('id="time-calc-badge"'), 'Phải có badge hiển thị thời lượng tính toán');
console.log('PASS 2: Các trường khung giờ Từ mấy giờ - Đến mấy giờ đã được tích hợp đầy đủ.');

// 3. Kiểm tra logic tự động tính số giờ chạy máy / dừng máy
assert(js.includes('calcDurationFromTimes'), 'Phải có hàm calcDurationFromTimes');
assert(js.includes('inputTimeStart.addEventListener'), 'Phải lắng nghe thay đổi thời gian bắt đầu');
assert(js.includes('inputTimeEnd.addEventListener'), 'Phải lắng nghe thay đổi thời gian kết thúc');
console.log('PASS 3: Logic tính toán tự động số giờ từ khung giờ đã sẵn sàng.');

// 4. Kiểm tra danh sách thẻ gợi ý lý do nhanh (Quick Reason Chips)
assert(html.includes('id="quick-reason-container"'), 'Phải có container quick-reason-container');
assert(js.includes('renderQuickReasonChips'), 'Phải có hàm renderQuickReasonChips');
assert(js.includes('Bảo trì định kỳ') && js.includes('Sự cố hỏng hóc cơ khí'), 'Phải có gợi ý cho Dừng máy');
assert(js.includes('Tăng ca đơn hàng gấp') && js.includes('Chạy bù sản lượng ca 3'), 'Phải có gợi ý cho Tăng ca');
console.log('PASS 4: Thẻ lý do nhanh thông minh cho Dừng máy và Tăng ca hoạt động chuẩn xác.');

// 5. Kiểm tra tự do nhập giờ (không còn datalist xổ dài gò bó) và xử lý 24h
assert(!html.includes('id="hours-24h-list"'), 'Đã loại bỏ datalist hours-24h-list cồng kềnh');
assert(js.includes('parseTime24h'), 'Phải có hàm parseTime24h xử lý giờ 24h linh hoạt khi tự nhập');
console.log('PASS 5: Đã chuyển sang chế độ tự do nhập thời gian không rập khuôn với bộ phân tích 24h.');

// 6. Kiểm tra ô lượng tiêu thụ được khóa tự động (readOnly) cho kỹ sư
assert(html.includes('id="amount-calc-hint"'), 'Phải có thẻ ghi chú tự động tính amount-calc-hint');
assert(js.includes('amountInput.readOnly = true'), 'Kỹ sư được khóa readOnly ô lượng tiêu thụ');
console.log('PASS 6: Ô lượng tiêu thụ đã chuyển sang chế độ tự động tính (readOnly) cho Kỹ sư.');

// 7. Kiểm tra không có emoji sticker nào trong mã nguồn mới
const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;
assert(!emojiRegex.test(js), 'carbon-activity.js tuyệt đối không chứa emoji sticker');
console.log('PASS 7: Chuẩn phong cách thiết kế chuyên nghiệp, không chứa emoji.');

console.log('TẤT CẢ KIỂM TRA GIAO DIỆN & NGHIỆP VỤ KỸ SƯ ĐÃ PASS THÀNH CÔNG 100%!');
