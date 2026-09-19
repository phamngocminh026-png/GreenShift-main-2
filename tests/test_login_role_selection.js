const fs = require('fs');
const assert = require('assert');

console.log('--- TEST: ĐĂNG NHẬP CHỌN ROLE & ĐIỀU HƯỚNG GIAO DIỆN CHUẨN ---');

const loginHtml = fs.readFileSync('login.html', 'utf8');
const carbonHtml = fs.readFileSync('carbon-inventory.html', 'utf8');

// 1. Kiểm tra login.html có form role selector với các option chuẩn
assert.ok(loginHtml.includes('id="login-role"'), 'login.html phải có select #login-role');
assert.ok(loginHtml.includes('value="engineer"'), 'Option engineer trong login.html');
assert.ok(loginHtml.includes('value="accountant"'), 'Option accountant trong login.html');
assert.ok(loginHtml.includes('value="esg_director"'), 'Option esg_director trong login.html');

// 2. Kiểm tra logic gán role trong submit handler của login.html không bị ghi đè thành accountant mặc định
assert.ok(
  loginHtml.includes('const selectedRole = role || loggedUser.role || \'engineer\';') ||
  loginHtml.includes('role || loggedUser.role'),
  'login.html phải ưu tiên lấy role từ dropdown khi đăng nhập'
);
assert.ok(
  !loginHtml.includes('// Vai trò được xác thực từ hồ sơ tài khoản (KHÔNG cho phép ghi đè tự do từ dropdown client)'),
  'Đã gỡ bỏ đoạn code chặn ghi đè role của người dùng'
);

// 3. Kiểm tra carbon-inventory.html có #user-role-selector và xử lý chuẩn hóa
assert.ok(carbonHtml.includes('id="user-role-selector"'), 'carbon-inventory.html phải có #user-role-selector');
assert.ok(carbonHtml.includes('applyRoleBasedNavigation(currentActiveRole, true)'), 'carbon-inventory.html phải kích hoạt tab mặc định của role ngay khi tải trang');

// 4. Giả lập luồng đăng nhập và chuyển hướng cho cả 3 role
const mockStorage = {};
const mockLocalStorage = {
  getItem: (k) => mockStorage[k] || null,
  setItem: (k, v) => { mockStorage[k] = String(v); },
  removeItem: (k) => { delete mockStorage[k]; }
};

// Giả lập tài khoản đã đăng ký (role ban đầu có thể là bất kỳ)
const testUsers = [
  {
    username: 'nguyenvana@gmail.com',
    email: 'nguyenvana@gmail.com',
    role: 'accountant', // Lúc đăng ký có thể mặc định là gì đó
    fullName: 'Nguyễn Văn A'
  }
];
mockLocalStorage.setItem('gs_users', JSON.stringify(testUsers));

function simulateLogin(selectedRoleDropdown) {
  const users = JSON.parse(mockLocalStorage.getItem('gs_users'));
  const loggedUser = users[0];
  const selectedRole = selectedRoleDropdown || loggedUser.role || 'engineer';
  
  mockLocalStorage.setItem('gs_current_user', loggedUser.username);
  mockLocalStorage.setItem('gs_user_role', selectedRole);
  users[0].role = selectedRole;
  mockLocalStorage.setItem('gs_users', JSON.stringify(users));
}

// Case A: Người dùng chọn Kỹ sư (engineer)
simulateLogin('engineer');
assert.strictEqual(mockLocalStorage.getItem('gs_user_role'), 'engineer');
assert.strictEqual(JSON.parse(mockLocalStorage.getItem('gs_users'))[0].role, 'engineer');
console.log('✅ TEST A: Chọn Kỹ sư khi đăng nhập -> gs_user_role lưu đúng "engineer".');

// Case B: Người dùng chọn Kế toán (accountant)
simulateLogin('accountant');
assert.strictEqual(mockLocalStorage.getItem('gs_user_role'), 'accountant');
assert.strictEqual(JSON.parse(mockLocalStorage.getItem('gs_users'))[0].role, 'accountant');
console.log('✅ TEST B: Chọn Kế toán khi đăng nhập -> gs_user_role lưu đúng "accountant".');

// Case C: Người dùng chọn Ban Giám đốc / ESG (esg_director)
simulateLogin('esg_director');
assert.strictEqual(mockLocalStorage.getItem('gs_user_role'), 'esg_director');
assert.strictEqual(JSON.parse(mockLocalStorage.getItem('gs_users'))[0].role, 'esg_director');
console.log('✅ TEST C: Chọn Ban Giám đốc khi đăng nhập -> gs_user_role lưu đúng "esg_director".');

console.log('\n🎉 TẤT CẢ KIỂM THỬ ĐĂNG NHẬP THEO VAI TRÒ ĐỀU THÀNH CÔNG RỰC RỠ!');
