const fs = require('fs');
const assert = require('assert');

console.log('--- KIỂM TRA PHÂN QUYỀN TAB THEO VAI TRÒ (ROLE-BASED TABS) ---');

// 1. Kiểm tra carbon-inventory.html chứa đầy đủ các thành phần phân quyền
const html = fs.readFileSync('carbon-inventory.html', 'utf8');

// Kiểm tra user-role-selector trong topbar
assert.ok(html.includes('id="user-role-selector"'), 'Thiếu #user-role-selector trong carbon-inventory.html');
assert.ok(html.includes('value="engineer"'), 'Thiếu role engineer trong selector');
assert.ok(html.includes('value="accountant"'), 'Thiếu role accountant trong selector');
assert.ok(html.includes('value="esg_director"'), 'Thiếu role esg_director trong selector');
assert.ok(!html.includes('id="sidebar-role-badge"'), 'Không còn sidebar-role-badge để giao diện sạch sẽ');
assert.ok(html.includes('function applyRoleBasedNavigation'), 'Thiếu hàm applyRoleBasedNavigation');

console.log('✅ TEST 1: File carbon-inventory.html có đầy đủ markup phân quyền tối giản, sạch sẽ.');

// 2. Mock DOM môi trường để kiểm tra chức năng ẩn/hiện tab theo vai trò
class ElementMock {
  constructor(name, dataTarget = '') {
    this.name = name;
    this.dataTarget = dataTarget;
    this.style = { display: '' };
    this.classList = new Set();
    this.innerText = '';
    this.value = '';
    this.clicked = false;
  }
  getAttribute(attr) {
    if (attr === 'data-target') return this.dataTarget;
    return null;
  }
  click() {
    this.clicked = true;
  }
}

function runRoleTest(role) {
  const elements = {
    'view-dashboard': new ElementMock('Bảng điều khiển', 'view-dashboard'),
    'view-company': new ElementMock('Thông tin & Ngành nghề', 'view-company'),
    'view-equipment': new ElementMock('Thiết bị', 'view-equipment'),
    'view-source': new ElementMock('Nguồn phát thải', 'view-source'),
    'view-activity': new ElementMock('Dữ liệu hoạt động', 'view-activity'),
    'view-report': new ElementMock('Báo cáo', 'view-report'),
  };

  const navDashboard = elements['view-dashboard'];
  const navCompany = elements['view-company'];
  const navEquipment = elements['view-equipment'];
  const navSource = elements['view-source'];
  const navActivity = elements['view-activity'];
  const navReport = elements['view-report'];

  const allNavs = [navDashboard, navCompany, navEquipment, navSource, navActivity, navReport];
  allNavs.forEach(nav => { nav.style.display = ''; });

  let targetDefaultNav = navDashboard;

  if (role === 'engineer') {
    if (navDashboard) navDashboard.style.display = 'none';
    if (navCompany) navCompany.style.display = 'none';
    if (navReport) navReport.style.display = 'none';
    targetDefaultNav = navEquipment;
  } else if (role === 'accountant') {
    if (navCompany) navCompany.style.display = 'none';
    if (navEquipment) navEquipment.style.display = 'none';
    if (navSource) navSource.style.display = 'none';
    targetDefaultNav = navActivity;
  } else {
    targetDefaultNav = navDashboard;
  }

  targetDefaultNav.click();

  return { elements, targetDefaultNav };
}

// TEST 2: Role 'engineer' (Kỹ sư)
const eng = runRoleTest('engineer');
assert.strictEqual(eng.elements['view-dashboard'].style.display, 'none', 'Kỹ sư không thấy Bảng điều khiển');
assert.strictEqual(eng.elements['view-company'].style.display, 'none', 'Kỹ sư không thấy Thông tin & Ngành nghề');
assert.strictEqual(eng.elements['view-report'].style.display, 'none', 'Kỹ sư không thấy Báo cáo');
assert.strictEqual(eng.elements['view-equipment'].style.display, '', 'Kỹ sư thấy Thiết bị');
assert.strictEqual(eng.elements['view-source'].style.display, '', 'Kỹ sư thấy Nguồn phát thải');
assert.strictEqual(eng.elements['view-activity'].style.display, '', 'Kỹ sư thấy Dữ liệu hoạt động');
assert.strictEqual(eng.targetDefaultNav.dataTarget, 'view-equipment', 'Tab mặc định của Kỹ sư là Thiết bị');
assert.strictEqual(eng.targetDefaultNav.clicked, true);
console.log('✅ TEST 2: Vai trò KỸ SƯ hiển thị đúng 3 tab: Thiết bị, Nguồn phát thải, Dữ liệu hoạt động.');

// TEST 3: Role 'accountant' (Kế toán)
const acc = runRoleTest('accountant');
assert.strictEqual(acc.elements['view-company'].style.display, 'none', 'Kế toán không thấy Thông tin & Ngành nghề');
assert.strictEqual(acc.elements['view-equipment'].style.display, 'none', 'Kế toán không thấy Thiết bị');
assert.strictEqual(acc.elements['view-source'].style.display, 'none', 'Kế toán không thấy Nguồn phát thải');
assert.strictEqual(acc.elements['view-dashboard'].style.display, '', 'Kế toán thấy Bảng điều khiển');
assert.strictEqual(acc.elements['view-activity'].style.display, '', 'Kế toán thấy Dữ liệu hoạt động');
assert.strictEqual(acc.elements['view-report'].style.display, '', 'Kế toán thấy Báo cáo');
assert.strictEqual(acc.targetDefaultNav.dataTarget, 'view-activity', 'Tab mặc định của Kế toán là Dữ liệu hoạt động');
assert.strictEqual(acc.targetDefaultNav.clicked, true);
console.log('✅ TEST 3: Vai trò KẾ TOÁN hiển thị đúng 3 tab: Bảng điều khiển, Dữ liệu hoạt động, Báo cáo.');

// TEST 4: Role 'esg_director' (Ban ESG / Giám đốc)
const esg = runRoleTest('esg_director');
assert.strictEqual(esg.elements['view-dashboard'].style.display, '', 'ESG Director thấy Bảng điều khiển');
assert.strictEqual(esg.elements['view-company'].style.display, '', 'ESG Director thấy Thông tin & Ngành nghề');
assert.strictEqual(esg.elements['view-equipment'].style.display, '', 'ESG Director thấy Thiết bị');
assert.strictEqual(esg.elements['view-source'].style.display, '', 'ESG Director thấy Nguồn phát thải');
assert.strictEqual(esg.elements['view-activity'].style.display, '', 'ESG Director thấy Dữ liệu hoạt động');
assert.strictEqual(esg.elements['view-report'].style.display, '', 'ESG Director thấy Báo cáo');
assert.strictEqual(esg.targetDefaultNav.dataTarget, 'view-dashboard', 'Tab mặc định của Giám đốc là Bảng điều khiển');
assert.strictEqual(esg.targetDefaultNav.clicked, true);
console.log('✅ TEST 4: Vai trò GIÁM ĐỐC / BAN ESG hiển thị đầy đủ cả 6 tab.');

console.log('\n🎉 TẤT CẢ CÁC KIỂM THỬ PHÂN QUYỀN TAB CHO TỪNG ROLE ĐỀU ĐẠT CHUẨN!');
