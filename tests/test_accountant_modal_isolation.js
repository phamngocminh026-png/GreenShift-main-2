const fs = require('fs');
const assert = require('assert');

// 1. Check HTML structure in carbon-inventory.html
const html = fs.readFileSync('carbon-inventory.html', 'utf8');

assert.ok(html.includes('id="group-act-mode"'), 'Thiếu id="group-act-mode" trong carbon-inventory.html');
assert.ok(html.includes('id="label-activity-source"'), 'Thiếu id="label-activity-source"');
assert.ok(html.includes('id="label-activity-file"'), 'Thiếu id="label-activity-file"');
assert.ok(html.includes('Loại báo cáo'), 'Chưa cập nhật "Loại báo cáo" trong view-report');
assert.ok(!html.includes('Tải xuống danh mục'), 'Vẫn còn "Tải xuống danh mục" trong view-report');

// Table header check: exactly 9 columns
const tableHeaderRegex = /<thead>[\s\S]*?<tr>([\s\S]*?)<\/tr>[\s\S]*?<\/thead>/;
const match = html.match(tableHeaderRegex);
assert.ok(match, 'Không tìm thấy thead trong carbon-inventory.html');

// 2. Check carbon-activity.js logic
const actJs = fs.readFileSync('assets/js/carbon-activity.js', 'utf8');

// Check that accountant mode completely hides panelHours, panelMeter, eqSpecCard, groupActMode, groupRecordType
assert.ok(actJs.includes("if (currentRole === 'accountant')"), 'Thiếu điều kiện currentRole === accountant trong sourceSelect');
assert.ok(actJs.includes("if (groupActMode) groupActMode.style.display = 'none';"), 'Thiếu ẩn groupActMode khi là accountant');
assert.ok(actJs.includes("if (eqSpecCard) eqSpecCard.style.display = 'none';"), 'Thiếu ẩn eqSpecCard khi là accountant');

// Check role-based dynamic labels in openModal
assert.ok(actJs.includes("Nguồn phát thải / Hạng mục chi phí"), 'Thiếu nhãn Nguồn phát thải / Hạng mục chi phí cho kế toán');
assert.ok(actJs.includes("Số lượng tiêu thụ trên hóa đơn"), 'Thiếu nhãn Số lượng tiêu thụ trên hóa đơn cho kế toán');
assert.ok(actJs.includes("Đính kèm tệp Hóa đơn / Chứng từ thanh toán"), 'Thiếu nhãn tệp đính kèm hóa đơn cho kế toán');
assert.ok(actJs.includes("Kế toán viên phụ trách"), 'Thiếu nhãn Kế toán viên phụ trách');

// Check edit modal title
assert.ok(actJs.includes("'Chỉnh sửa Hóa đơn / Dữ liệu kế toán'"), 'Thiếu tiêu đề chỉnh sửa cho kế toán');
assert.ok(actJs.includes("'Chỉnh sửa Dữ liệu hoạt động'"), 'Thiếu tiêu đề chỉnh sửa cho kỹ sư');

// Check that no emoji stickers exist in JS files
const forbiddenEmojis = ['📎', '🔧', '📊', '👑', '➕', '⚙️', '🚀'];
forbiddenEmojis.forEach(emoji => {
  assert.ok(!actJs.includes(emoji), `carbon-activity.js chứa emoji cấm: ${emoji}`);
});

// 3. Check carbon-dashboard.js
const dashJs = fs.readFileSync('assets/js/carbon-dashboard.js', 'utf8');
assert.ok(dashJs.includes('Năm ${years[0]}'), 'carbon-dashboard.js phải dùng "Năm ${years[0]}"');
assert.ok(!dashJs.includes('${years[0]}Năm'), 'carbon-dashboard.js vẫn còn "${years[0]}Năm"');
assert.ok(dashJs.includes('Scope ${scNum} (Phạm vi ${scNum})'), 'carbon-dashboard.js phải dùng chuẩn Scope & Phạm vi');

console.log('Tất cả kiểm tra phân quyền và cách ly giao diện Kế toán - Kỹ sư đã PASS thành công!');
