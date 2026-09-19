const fs = require('fs');
const assert = require('assert');

console.log('=== TEST: USER 7-AUDIO FEEDBACK FIXES VERIFICATION ===');

const invHtml = fs.readFileSync('carbon-inventory.html', 'utf8');
const actJs = fs.readFileSync('assets/js/carbon-activity.js', 'utf8');

// 1. Toolbar: #btn-add-equipment is visible and manual dropdown includes Scope 2
assert.ok(invHtml.includes('id="btn-add-equipment" class="btn btn-primary" style="display: inline-flex;'), 'Nút + Thêm thiết bị phải hiển thị rõ ràng trên thanh công cụ');
assert.ok(invHtml.includes("'Điện mua vào'"), 'Manual equipment dropdown phải hỗ trợ Scope 2 Điện mua vào');

// 2. Equipment form: "Ngày mua thiết bị" is optional
assert.ok(!invHtml.includes('<input type="date" id="eq-date" class="form-control" required>'), 'Ngày mua thiết bị không được bắt buộc (required)');
assert.ok(invHtml.includes('<input type="date" id="eq-date" class="form-control">'), 'Ngày mua thiết bị input date tồn tại');

// 3. No dummy accountant invoices generated upon import
assert.ok(!invHtml.includes('act_acc_${impYear}_${m}_elec'), 'Không được tự động sinh 24 hóa đơn kế toán giả lập khi import thiết bị');
assert.ok(!invHtml.includes('HĐ-EVN-${impYear}-${mStr}'), 'Không được sinh mã hóa đơn EVN giả lập');

// 4. Role separation in navigation
assert.ok(invHtml.includes("filterRoleEl.value = 'accountant';"), 'Khi vào vai trò Kế toán, chỉ lọc chứng từ hóa đơn kế toán');
assert.ok(invHtml.includes("filterRoleEl.value = 'engineer';"), 'Khi vào vai trò Kỹ sư, chỉ lọc ca máy kỹ thuật');

// 5. Source Edit modal smart mapping & validation
assert.ok(invHtml.includes("mLower.includes('ước tính') || mLower.includes('tự đánh giá')"), 'Loại đo lường phải có smart mapping vào Tự đánh giá');
assert.ok(invHtml.includes("rLower.includes('thứ cấp') || rLower.includes('kỹ thuật')"), 'Độ tin cậy phải có smart mapping vào Dữ liệu thứ cấp / Tham khảo');
assert.ok(invHtml.includes("row.dataset.startDate || '2026-01-01'"), 'Ngày bắt đầu phải mặc định hợp lệ để không chặn Lưu');
assert.ok(invHtml.includes("isElecOrRef"), 'Nhiên liệu không bắt buộc đối với điện hoặc rò rỉ môi chất lạnh');

// 6. Day Off menu double toggle resolved
assert.ok(!actJs.includes("dayOffDropdown.style.display = isOpen ? 'none' : 'block';"), 'Đã loại bỏ double toggle trên btnDayOffMenu');
assert.ok(actJs.includes("window.toggleDayOffMenu"), 'window.toggleDayOffMenu hoạt động độc lập');

// 7. Filter lock bug resolved: btn-edit-act does not overwrite actHiddenFilter
assert.ok(!actJs.includes("actHiddenFilter.value = isRowProcess ? '' : rowType;"), 'Sửa dòng hoạt động không được khóa cứng bộ lọc trang actHiddenFilter');

// 8. Activity Edit hourlyRate persistence & fallback
assert.ok(actJs.includes("hourlyRate: document.getElementById('input-op-rate')?.value"), 'Lưu hoạt động phải lưu định mức hourlyRate vào dataObj');
assert.ok(actJs.includes("inputOpRate.value = rate;"), 'calcFromHours phải tự động khôi phục rate nếu bị trống');

// 9. Instant tab switching cached data guard
assert.ok(actJs.includes("_lastLoadedActDataStr"), 'loadActivityList phải có guard lưu trữ dữ liệu để chuyển tab tức thì');

// 10. All inline script blocks in carbon-inventory.html must parse without syntax error
const scriptRegex = /<script\b[^>]*>([\s\S]*?)<\/script>/gi;
let match;
let scriptBlockCount = 0;
while ((match = scriptRegex.exec(invHtml)) !== null) {
  const code = match[1].trim();
  if (code) {
    scriptBlockCount++;
    assert.doesNotThrow(() => new Function(code), `Khối script inline #${scriptBlockCount} trong carbon-inventory.html phải có cú pháp hợp lệ`);
  }
}
assert.ok(scriptBlockCount >= 5, 'Phải có ít nhất 5 khối script inline được kiểm tra');

console.log('ALL 10 VERIFICATION CHECKS PASSED 100%!');
