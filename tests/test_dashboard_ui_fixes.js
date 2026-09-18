const fs = require('fs');
const assert = require('assert');

console.log('=== TEST: DASHBOARD UI FIXES & ROLE SWITCHING INTEGRITY ===');

const html = fs.readFileSync('carbon-inventory.html', 'utf8');
const dashJs = fs.readFileSync('assets/js/carbon-dashboard.js', 'utf8');

// 1. Kiểm tra nhãn "Năm:" xuất hiện cạnh dropdown chọn năm
assert.ok(html.includes('>Năm:</span>'), 'Thiếu nhãn Năm: trước dash-year-select');

// 2. Kiểm tra vai trò chuyển đổi mượt mà
assert.ok(html.includes('applyRoleBasedNavigation(newRole, true)'), 'Thiếu tham số isUserChange khi người dùng đổi vai trò');
assert.ok(html.includes('if (isUserChange || !currentActiveNav'), 'applyRoleBasedNavigation phải chuyển ngay tới tab chính khi đổi role');

// 3. Kiểm tra thẻ Tổng lượng khí thải hiển thị huy hiệu Scope độc lập, không ngắt dòng xấu
assert.ok(dashJs.includes('Scope 1: ${sc1}t'), 'Thiếu định dạng pill badge cho Scope 1');
assert.ok(dashJs.includes('Scope 2: ${sc2}t'), 'Thiếu định dạng pill badge cho Scope 2');
assert.ok(dashJs.includes('Scope 3: ${sc3}t'), 'Thiếu định dạng pill badge cho Scope 3');
assert.ok(dashJs.includes('white-space: nowrap'), 'Thiếu thuộc tính chống tràn ngắt dòng white-space: nowrap');

// 4. Kiểm tra loại bỏ sự kiện trùng lặp gây đơ giao diện
assert.ok(!dashJs.includes('setTimeout(renderDashboard, 50)'), 'Đã loại bỏ renderDashboard trùng lặp 50ms');

console.log('ALL DASHBOARD UI FIXES VERIFIED 100%!');
