const fs = require('fs');

let content = fs.readFileSync('carbon-inventory.html', 'utf8');

// 1. Thêm Supabase scripts sau carbon-dashboard.js
const dashScript = '<script src="assets/js/carbon-dashboard.js?v=1788042726.66285"></script>';
const supaTags = [
  '  <!-- Supabase Cloud DB & Local-First Sync Engine -->',
  '  <script src="assets/vendor/supabase.min.js"></script>',
  '  <script src="assets/js/supabase-config.js"></script>',
  '  <script src="assets/js/supabase-client.js"></script>',
  '  <script src="assets/js/supabase-ui.js"></script>'
].join('\n');

if (!content.includes('assets/js/supabase-client.js')) {
  content = content.replace(dashScript, dashScript + '\n' + supaTags);
}

// 2. Cập nhật saveEquipmentList để đẩy dữ liệu ngầm lên Supabase nếu có
const oldSaveEq = "localStorage.setItem(getBranchStorageKey('equipment'), JSON.stringify(eqData));";
const newSaveEq = `localStorage.setItem(getBranchStorageKey('equipment'), JSON.stringify(eqData));
      try {
        if (window.GreenShiftDB && typeof window.GreenShiftDB.pushEquipments === 'function') {
          const branchEl = document.getElementById('branch-selector');
          const bName = (branchEl && branchEl.value) ? branchEl.value : 'main';
          const bKey = bName.toLowerCase().normalize('NFD').replace(/[\\u0300-\\u036f]/g, '').replace(/\\s+/g, '_').replace(/[^a-z0-9_]/g, '');
          window.GreenShiftDB.pushEquipments(bKey, eqData);
        }
      } catch(e) {}`;

if (!content.includes('window.GreenShiftDB.pushEquipments')) {
  content = content.replace(oldSaveEq, newSaveEq);
}

// 3. Đồng bộ tên công ty trong export Word: ưu tiên profile doanh nghiệp của user hiện tại
const oldExportCompany = `const company = Storage.getCompany ? Storage.getCompany() : {};`;
const newExportCompany = `const userStr = localStorage.getItem('gs_current_user') || 'guest';
            const users = JSON.parse(localStorage.getItem('gs_users')) || [];
            const curUser = users.find(u => u.username === userStr);

            let company = (Storage.getCompany ? Storage.getCompany() : null) || {};
            if (curUser && curUser.company && curUser.company.name) {
              company = { ...company, ...curUser.company, name: curUser.company.name };
            }`;

if (!content.includes('curUser && curUser.company')) {
  content = content.replace(oldExportCompany, newExportCompany);
}

fs.writeFileSync('carbon-inventory.html', content, 'utf8');
console.log('Successfully patched carbon-inventory.html!');
