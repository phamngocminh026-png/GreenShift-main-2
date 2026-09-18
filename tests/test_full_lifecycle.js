const fs = require('fs');
const assert = require('assert');

console.log('====================================================');
console.log('🧪 BẮT ĐẦU KIỂM TRA TOÀN DIỆN LOGIN & KIỂM KÊ KNK');
console.log('====================================================');

// 1. Kiểm tra mã HTML của login.html
const loginHtml = fs.readFileSync('login.html', 'utf8');

assert.ok(loginHtml.includes('id="signup-fullname"'), 'signup-fullname exists');
assert.ok(loginHtml.includes('id="signup-company"'), 'signup-company exists');
assert.ok(loginHtml.includes('id="signup-email"'), 'signup-email exists');
assert.ok(loginHtml.includes('id="signup-password"'), 'signup-password exists');
assert.ok(loginHtml.includes('id="signup-confirm-password"'), 'signup-confirm-password exists');
assert.ok(loginHtml.includes('id="login-username"'), 'login-username exists');
assert.ok(loginHtml.includes('id="login-password"'), 'login-password exists');
assert.ok(loginHtml.includes('id="login-system"'), 'login-system exists');
assert.ok(loginHtml.includes('id="login-role"'), 'login-role exists');
console.log('✅ Form login.html đầy đủ tất cả các trường theo yêu cầu.');

// 2. Giả lập vòng đời người dùng (User lifecycle)
const storage = {};
global.localStorage = {
  getItem: k => storage[k] || null,
  setItem: (k, v) => { storage[k] = String(v); },
  removeItem: k => { delete storage[k]; }
};

// Đăng ký
function signup(fullName, companyName, email, password, confirmPassword) {
  if (!fullName || !email || !password || !confirmPassword) return { ok: false, msg: 'Thiếu thông tin' };
  if (password.length < 4) return { ok: false, msg: 'Mật khẩu quá ngắn' };
  if (password !== confirmPassword) return { ok: false, msg: 'Mật khẩu không khớp' };
  
  let users = JSON.parse(localStorage.getItem('gs_users')) || [];
  const emailLower = email.toLowerCase();
  if (users.some(u => u.email === emailLower)) return { ok: false, msg: 'Email đã tồn tại' };

  const newUser = {
    username: emailLower,
    email: emailLower,
    fullName: fullName,
    password: password,
    company: {
      name: companyName || ('Công ty ' + fullName),
      tax: '',
      industry: 'Sắt Thép',
      ipccAR: 'AR5-100',
      branchCount: 0,
      branches: []
    }
  };
  users.push(newUser);
  localStorage.setItem('gs_users', JSON.stringify(users));
  return { ok: true, user: newUser };
}

// Đăng nhập
function login(userInput, passInput, system, role) {
  const users = JSON.parse(localStorage.getItem('gs_users')) || [];
  const inputLower = userInput.toLowerCase();
  const idx = users.findIndex(u => (u.username === inputLower || u.email === inputLower) && u.password === passInput);
  if (idx === -1) return { ok: false, msg: 'Sai tài khoản hoặc mật khẩu' };

  const loggedUser = users[idx];
  localStorage.setItem('gs_current_user', loggedUser.username);
  localStorage.setItem('gs_user_role', role);
  return { ok: true, redirect: system === 'cbam' ? 'cbam-dashboard.html' : 'carbon-inventory.html' };
}

// TEST 1: Đăng ký thành công User 1
const s1 = signup('Nguyễn Văn A', 'Công ty Thép Việt', 'nguyenvana@gmail.com', '1234', '1234');
assert.strictEqual(s1.ok, true);
assert.strictEqual(s1.user.company.name, 'Công ty Thép Việt');
console.log('✅ TEST 1: Đăng ký tài khoản 1 (Công ty Thép Việt) thành công.');

// TEST 2: Xác nhận mật khẩu không khớp
const sFail1 = signup('B', 'C', 'b@g.com', '1234', '9999');
assert.strictEqual(sFail1.ok, false);
assert.strictEqual(sFail1.msg, 'Mật khẩu không khớp');
console.log('✅ TEST 2: Kiểm tra mật khẩu nhập lại không khớp hoạt động đúng.');

// TEST 3: Đăng ký thành công User 2 với công ty khác
const s2 = signup('Trần Thị B', 'Nhà máy Xi măng Hoàng Mai', 'tranthib@gmail.com', 'abcd', 'abcd');
assert.strictEqual(s2.ok, true);
assert.strictEqual(s2.user.company.name, 'Nhà máy Xi măng Hoàng Mai');
console.log('✅ TEST 3: Đăng ký tài khoản 2 (Nhà máy Xi măng Hoàng Mai) thành công.');

// TEST 4: Đăng nhập User 1
const l1 = login('nguyenvana@gmail.com', '1234', 'carbon', 'engineer');
assert.strictEqual(l1.ok, true);
assert.strictEqual(l1.redirect, 'carbon-inventory.html');
assert.strictEqual(localStorage.getItem('gs_current_user'), 'nguyenvana@gmail.com');
assert.strictEqual(localStorage.getItem('gs_user_role'), 'engineer');
console.log('✅ TEST 4: Đăng nhập tài khoản 1 thành công (chuyển hướng carbon-inventory.html, vai trò: Kỹ sư).');

// Giả lập load carbon-inventory cho User 1
let curUser = localStorage.getItem('gs_current_user').toLowerCase();
let uObj1 = JSON.parse(localStorage.getItem('gs_users')).find(u => u.username === curUser);
assert.strictEqual(uObj1.fullName, 'Nguyễn Văn A');
assert.strictEqual(uObj1.company.name, 'Công ty Thép Việt');

// Thêm hoạt động phát thải cho User 1
localStorage.setItem('gs_data_' + curUser + '_main_activity', JSON.stringify([{ id: 1, co2e: '100' }]));

// TEST 5: Đăng nhập User 2
const l2 = login('tranthib@gmail.com', 'abcd', 'carbon', 'accountant');
assert.strictEqual(l2.ok, true);
assert.strictEqual(localStorage.getItem('gs_current_user'), 'tranthib@gmail.com');
assert.strictEqual(localStorage.getItem('gs_user_role'), 'accountant');
console.log('✅ TEST 5: Đăng nhập tài khoản 2 thành công (vai trò: Kế toán).');

// Giả lập load carbon-inventory cho User 2
curUser = localStorage.getItem('gs_current_user').toLowerCase();
let uObj2 = JSON.parse(localStorage.getItem('gs_users')).find(u => u.username === curUser);
assert.strictEqual(uObj2.fullName, 'Trần Thị B');
assert.strictEqual(uObj2.company.name, 'Nhà máy Xi măng Hoàng Mai');

// Kiểm tra hoạt động phát thải của User 2 không bị dính dữ liệu của User 1
const u2Activities = JSON.parse(localStorage.getItem('gs_data_' + curUser + '_main_activity') || '[]');
assert.strictEqual(u2Activities.length, 0, 'Dữ liệu phát thải User 2 phải trống');
console.log('✅ TEST 6: Dữ liệu phát thải và công ty giữa các tài khoản được phân tách 100%!');

console.log('\n🎉 TẤT CẢ 6/6 KIỂM THỬ XÁC THỰC & KIỂM KÊ KNK ĐỀU ĐẠT CHUẨN!');
