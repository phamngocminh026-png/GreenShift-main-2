(function() {
  let activityLogicInitialized = false;
  function runInitActivity() {
    if (activityLogicInitialized) return;
    activityLogicInitialized = true;
    initActivityLogic();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', runInitActivity);
  } else {
    runInitActivity();
  }

  function initActivityLogic() {
    const btnAddActivity = document.getElementById('btn-add-activity');
    const activityModal = document.getElementById('activity-modal');
    const btnCloseActivity = document.getElementById('btn-close-activity-modal');
    const btnCancelActivity = document.getElementById('btn-cancel-activity-modal');
    const btnSaveActivity = document.getElementById('btn-save-activity-modal');
    const modalTitle = document.getElementById('activity-modal-title');
    
    const activityForm = document.getElementById('activity-form');
    const sourceSelect = document.getElementById('activity-source-select');
    const tbody = document.getElementById('activity-tbody');

    const infoBox = document.getElementById('activity-source-info');
    const infoEf = document.getElementById('info-ef');
    const infoRef = document.getElementById('info-ref');
    const infoUnit = document.getElementById('info-unit');

    let currentEditingRow = null;

    // --- ACTIVITY CUSTOM CASCADING FILTER LOGIC ---
    const actFilterInput = document.getElementById('activity-custom-filter-input');
    const actFilterDropdown = document.getElementById('activity-custom-filter-dropdown');
    const actCol1 = document.getElementById('act-col-1');
    const actCol2 = document.getElementById('act-col-2');
    const actCol3 = document.getElementById('act-col-3');
    const actHiddenFilter = document.getElementById('activity-source-filter');

    let actSelectedL1 = null;
    let actSelectedL2 = null;

    let _lastFilterToggle = 0;
    window.toggleActivityCustomFilter = function(e) {
      if (e && typeof e.stopPropagation === 'function') e.stopPropagation();
      const now = Date.now();
      if (now - _lastFilterToggle < 300) return;
      _lastFilterToggle = now;
      const dropdown = document.getElementById('activity-custom-filter-dropdown') || actFilterDropdown;
      const container = document.getElementById('act-custom-select-container') || (dropdown ? dropdown.parentElement : null);
      if (!dropdown) return;
      dropdown.classList.toggle('open');
      const isOpen = dropdown.classList.contains('open');
      if (container) {
        container.style.zIndex = isOpen ? '1060' : '';
      }
      if (isOpen && typeof renderActCol1 === 'function') {
        renderActCol1();
      }
    };

    if (actFilterInput) {
      actFilterInput.onclick = function(e) {
        window.toggleActivityCustomFilter(e);
      };

      document.addEventListener('click', (e) => {
        const input = document.getElementById('activity-custom-filter-input') || actFilterInput;
        const dropdown = document.getElementById('activity-custom-filter-dropdown') || actFilterDropdown;
        if (input && dropdown && !input.contains(e.target) && !dropdown.contains(e.target)) {
          dropdown.classList.remove('open');
          const container = document.getElementById('act-custom-select-container') || dropdown.parentElement;
          if (container) container.style.zIndex = '';
        }
      });
    }

    function getDynamicTree() {
      const tree = {};
      let sourceRows = document.querySelectorAll('#source-tbody tr:not(#no-source-row)');
      if (sourceRows.length === 0) {
        try {
          const username = localStorage.getItem('gs_current_user') || 'guest';
          const userSlug = username.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '') || 'guest';
          const branchEl = document.getElementById('branch-selector');
          const branchName = (branchEl && branchEl.value) ? branchEl.value : 'main';
          const branchKey = branchName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '') || 'main';
          const stored = localStorage.getItem(getBranchStorageKey('sources')) ||
                         localStorage.getItem(`gs_data_${userSlug}_${branchKey}_sources`) ||
                         localStorage.getItem(`gs_data_${username}_${branchKey}_sources`);
          if (stored) {
            const list = JSON.parse(stored);
            if (Array.isArray(list)) {
              list.forEach(item => {
                const scope = (typeof getScopeInfo === 'function') ? getScopeInfo(item.category, item.ef, item.type).label : (item.scope || 'Phạm vi 1');
                const cat = item.category || 'Khác';
                const type = item.type || item.name || '';
                if (!tree[scope]) tree[scope] = {};
                if (!tree[scope][cat]) tree[scope][cat] = new Set();
                if (type) tree[scope][cat].add(type);
              });
            }
            if (Object.keys(tree).length > 0) return tree;
          }
        } catch(e) {}
      }
      sourceRows.forEach(row => {
        const scope = (row.cells[0]?.textContent || '').trim() || 'Phạm vi 1';
        const category = row.dataset.category || (row.cells[1]?.textContent || '').trim() || 'Khác';
        const type = row.dataset.type || row.dataset.name || row.dataset.sourceType || (row.cells[2]?.textContent || '').trim();
        if (!tree[scope]) tree[scope] = {};
        if (!tree[scope][category]) tree[scope][category] = new Set();
        if (type) tree[scope][category].add(type);
      });

      // Nếu vẫn chưa có tree từ sources, trích xuất từ dữ liệu hoạt động thực tế
      if (Object.keys(tree).length === 0) {
        try {
          const actStored = localStorage.getItem(getBranchStorageKey('activity'));
          if (actStored) {
            let rawParsed = JSON.parse(actStored);
            let acts = (typeof decodeActivitiesData === 'function') ? decodeActivitiesData(rawParsed) : (Array.isArray(rawParsed) ? rawParsed : []);
            if (Array.isArray(acts)) {
              acts.forEach(a => {
                const type = a.sourceType || a.sourceName || 'Tiêu thụ chung';
                const isElec = type.includes('điện') || type.includes('Điện');
                const scope = isElec ? 'Phạm vi 2' : 'Phạm vi 1';
                const cat = isElec ? 'Tiêu thụ điện' : (type.includes('công nghiệp') ? 'Các quá trình công nghiệp' : 'Đốt cháy cố định');
                if (!tree[scope]) tree[scope] = {};
                if (!tree[scope][cat]) tree[scope][cat] = new Set();
                tree[scope][cat].add(type);
              });
            }
          }
        } catch(e) {}
      }

      // Dự phòng tiêu chuẩn nếu hoàn toàn chưa có số liệu
      if (Object.keys(tree).length === 0) {
        tree['Phạm vi 2'] = { 'Tiêu thụ điện': new Set(['Điện lưới EVN mua ngoài (Tổng công tơ nhà máy)']) };
        tree['Phạm vi 1'] = { 
          'Đốt cháy cố định': new Set(['Dầu Diesel (DO) mua ngoài (Toàn nhà máy / Bồn tổng)', 'Khí dầu mỏ hóa lỏng LPG mua ngoài']),
          'Đốt cháy động': new Set(['Xăng RON 95 / E5 mua ngoài (Xe công ty)'])
        };
      }
      return tree;
    }

    function renderActCol1() {
      const col1 = document.getElementById('act-col-1') || actCol1;
      const col2 = document.getElementById('act-col-2') || actCol2;
      const col3 = document.getElementById('act-col-3') || actCol3;
      if (!col1) return;
      col1.innerHTML = '';
      if (col2) col2.innerHTML = '';
      if (col3) col3.innerHTML = '';
      
      const tree = getDynamicTree();
      const scopes = Object.keys(tree);

      const clearDiv = document.createElement('div');
      clearDiv.className = 'dropdown-item';
      clearDiv.innerHTML = '<span>-- Tất cả Nguồn --</span>';
      clearDiv.onclick = (e) => {
        if (e && typeof e.stopPropagation === 'function') e.stopPropagation();
        const input = document.getElementById('activity-custom-filter-input') || actFilterInput;
        const hidden = document.getElementById('activity-source-filter') || actHiddenFilter;
        const dd = document.getElementById('activity-custom-filter-dropdown') || actFilterDropdown;
        if (input) input.innerText = '-- Tất cả Nguồn --';
        if (hidden) hidden.value = '';
        if (dd) {
          dd.classList.remove('open');
          const container = document.getElementById('act-custom-select-container') || dd.parentElement;
          if (container) container.style.zIndex = '';
        }
        applyFilter('');
      };
      col1.appendChild(clearDiv);

      if (scopes.length === 0) {
        return;
      }

      scopes.forEach(scope => {
        const div = document.createElement('div');
        div.className = 'dropdown-item';
        div.innerHTML = `<span>${scope}</span><span class="arrow">></span>`;
        div.onclick = (e) => {
          if (e && typeof e.stopPropagation === 'function') e.stopPropagation();
          Array.from(col1.children).forEach(c => c.classList.remove('active'));
          div.classList.add('active');
          actSelectedL1 = scope;
          renderActCol2(tree[scope]);
        };
        col1.appendChild(div);
      });
    }

    function renderActCol2(categoriesObj) {
      const col2 = document.getElementById('act-col-2') || actCol2;
      const col3 = document.getElementById('act-col-3') || actCol3;
      if (!col2) return;
      col2.innerHTML = '';
      if (col3) col3.innerHTML = '';
      if (!categoriesObj) return;
      Object.keys(categoriesObj).forEach(cat => {
        const div = document.createElement('div');
        div.className = 'dropdown-item';
        div.innerHTML = `<span>${cat}</span><span class="arrow">></span>`;
        div.onclick = (e) => {
          if (e && typeof e.stopPropagation === 'function') e.stopPropagation();
          Array.from(col2.children).forEach(c => c.classList.remove('active'));
          div.classList.add('active');
          actSelectedL2 = cat;
          const items = categoriesObj[cat] instanceof Set ? Array.from(categoriesObj[cat]) : (Array.isArray(categoriesObj[cat]) ? categoriesObj[cat] : []);
          renderActCol3(items);
        };
        col2.appendChild(div);
      });
    }

    function renderActCol3(typesArr) {
      const col3 = document.getElementById('act-col-3') || actCol3;
      if (!col3) return;
      col3.innerHTML = '';
      if (!Array.isArray(typesArr)) return;
      typesArr.forEach(type => {
        const div = document.createElement('div');
        div.className = 'dropdown-item';
        div.innerHTML = `<span>${type}</span>`;
        div.onclick = (e) => {
          if (e && typeof e.stopPropagation === 'function') e.stopPropagation();
          const input = document.getElementById('activity-custom-filter-input') || actFilterInput;
          const hidden = document.getElementById('activity-source-filter') || actHiddenFilter;
          const dd = document.getElementById('activity-custom-filter-dropdown') || actFilterDropdown;
          if (input) input.innerText = type;
          if (hidden) hidden.value = type;
          if (dd) {
            dd.classList.remove('open');
            const container = document.getElementById('act-custom-select-container') || dd.parentElement;
            if (container) container.style.zIndex = '';
          }
          applyFilter(type);
        };
        col3.appendChild(div);
      });
    }

    function applyFilter(filterTypeArg) {
      const filterType = (typeof filterTypeArg === 'string') ? filterTypeArg : (actHiddenFilter ? actHiddenFilter.value : '');
      const filterYear = document.getElementById('act-filter-year')?.value || '';
      const filterMonth = document.getElementById('act-filter-month')?.value || '';
      const filterRole = document.getElementById('act-filter-role')?.value || '';
      const filterSearch = (document.getElementById('act-filter-search')?.value || '').toLowerCase().trim();
      const filterDate = document.getElementById('act-filter-date')?.value || '';

      const nowObj = new Date();
      const todayStr = `${nowObj.getFullYear()}-${String(nowObj.getMonth() + 1).padStart(2, '0')}-${String(nowObj.getDate()).padStart(2, '0')}`;

      const rows = tbody.querySelectorAll('tr:not(#no-activity-row)');
      let visibleCount = 0;

      rows.forEach(row => {
        const rowType = row.dataset.sourceType || '';
        const rowDate = row.dataset.date || '';
        const rowRole = row.dataset.entryRole || (row.dataset.isInvoice === 'true' ? 'accountant' : 'engineer');

        let matchType = true;
        if (filterType) {
          const fLower = filterType.toLowerCase().trim();
          const tLower = rowType.toLowerCase().trim();
          const nLower = (row.dataset.sourceName || '').toLowerCase().trim();
          matchType = (rowType === filterType) || 
                      tLower.includes(fLower) || fLower.includes(tLower) || 
                      nLower.includes(fLower);
        }
        let matchYear = !filterYear || (rowDate && rowDate.startsWith(filterYear));
        let matchMonth = true;
        if (filterMonth === 'ytd') {
          // Lũy kế đến ngày hôm nay: chỉ hiển thị các ngày <= todayStr
          matchMonth = (rowDate && rowDate <= todayStr);
        } else if (filterMonth) {
          matchMonth = (rowDate && rowDate.split('-')[1] === filterMonth);
        }
        let matchRole = !filterRole || (rowRole === filterRole);
        let matchDate = !filterDate || (rowDate === filterDate);
        let matchSearch = true;
        if (filterSearch) {
          const rowText = row._searchIndex || (row._searchIndex = (row.textContent || '').toLowerCase());
          matchSearch = rowText.includes(filterSearch);
        }

        if (matchType && matchYear && matchMonth && matchRole && matchDate && matchSearch) {
          row.style.display = '';
          visibleCount++;
        } else {
          row.style.display = 'none';
        }
      });

      const noRow = document.getElementById('no-activity-row');
      if (noRow) {
        noRow.style.display = (visibleCount === 0) ? '' : 'none';
        if (noRow.cells && noRow.cells[0]) {
          if (visibleCount === 0 && rows.length > 0) {
            noRow.cells[0].innerText = 'Không có bản ghi nào khớp với bộ lọc đã chọn';
          } else if (rows.length === 0) {
            noRow.cells[0].innerText = 'Chưa có dữ liệu';
          }
        }
      }
    }

    const filterYearEl = document.getElementById('act-filter-year');
    if (filterYearEl) filterYearEl.addEventListener('change', () => applyFilter());
    const filterMonthEl = document.getElementById('act-filter-month');
    if (filterMonthEl) {
      filterMonthEl.addEventListener('change', () => {
        const btnActFilterYtd = document.getElementById('btn-act-filter-ytd');
        if (btnActFilterYtd) {
          if (filterMonthEl.value === 'ytd') {
            btnActFilterYtd.style.background = '#0284c7';
            btnActFilterYtd.style.color = '#ffffff';
          } else {
            btnActFilterYtd.style.background = 'transparent';
            btnActFilterYtd.style.color = '#0284c7';
          }
        }
        applyFilter();
      });
    }
    const filterRoleEl = document.getElementById('act-filter-role');
    if (filterRoleEl) filterRoleEl.addEventListener('change', () => applyFilter());

    const filterSearchEl = document.getElementById('act-filter-search');
    let actSearchDebounceTimer = null;
    if (filterSearchEl) {
      filterSearchEl.addEventListener('input', () => {
        clearTimeout(actSearchDebounceTimer);
        actSearchDebounceTimer = setTimeout(() => {
          applyFilter();
        }, 150);
      });
    }
    const filterDateEl = document.getElementById('act-filter-date');
    if (filterDateEl) filterDateEl.addEventListener('change', () => applyFilter());

    // Nút Lọc nhanh đến hôm nay (YTD) trên thanh công cụ bảng dữ liệu hoạt động
    const btnActFilterYtd = document.getElementById('btn-act-filter-ytd');
    if (btnActFilterYtd) {
      btnActFilterYtd.addEventListener('click', () => {
        const fMonth = document.getElementById('act-filter-month');
        if (fMonth) {
          if (fMonth.value === 'ytd') {
            fMonth.value = '';
            btnActFilterYtd.style.background = 'transparent';
            btnActFilterYtd.style.color = '#0284c7';
          } else {
            fMonth.value = 'ytd';
            btnActFilterYtd.style.background = '#0284c7';
            btnActFilterYtd.style.color = '#ffffff';
          }
          applyFilter();
        }
      });
    }

    // Nút cuộn nhanh xuống phần Đối soát
    const btnJumpReconcile = document.getElementById('btn-jump-reconcile');
    if (btnJumpReconcile) {
      btnJumpReconcile.addEventListener('click', () => {
        const target = document.getElementById('reconciliation-card');
        if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }

    // Nút Thu gọn / Mở rộng chiều cao bảng
    let _lastToggleActivityTime = 0;
    const btnToggleTableHeight = document.getElementById('btn-toggle-table-height');
    const activityTableCard = document.getElementById('activity-table-card');
    if (btnToggleTableHeight && activityTableCard) {
      btnToggleTableHeight.addEventListener('click', () => {
        const now = Date.now();
        if (now - _lastToggleActivityTime < 300) return;
        _lastToggleActivityTime = now;
        if (activityTableCard.style.maxHeight === 'none') {
          activityTableCard.style.maxHeight = '420px';
          btnToggleTableHeight.innerText = 'Mở rộng bảng';
        } else {
          activityTableCard.style.maxHeight = 'none';
          btnToggleTableHeight.innerText = 'Thu gọn bảng';
        }
      });
    }

    // Nút Thu gọn / Mở rộng chiều cao bảng Theo dõi Tiêu thụ & Vận hành Thiết bị
    let _lastToggleMachineTime = 0;
    const btnToggleMachineHeight = document.getElementById('btn-toggle-machine-table-height');
    const machineOverviewContainer = document.getElementById('machine-overview-table-container');
    if (btnToggleMachineHeight && machineOverviewContainer) {
      btnToggleMachineHeight.addEventListener('click', () => {
        const now = Date.now();
        if (now - _lastToggleMachineTime < 300) return;
        _lastToggleMachineTime = now;
        if (machineOverviewContainer.style.maxHeight === 'none') {
          machineOverviewContainer.style.maxHeight = '380px';
          btnToggleMachineHeight.innerText = 'Mở rộng bảng';
        } else {
          machineOverviewContainer.style.maxHeight = 'none';
          btnToggleMachineHeight.innerText = 'Thu gọn bảng';
        }
      });
    }

    // --- ACTIVITY LOGIC ---
    let isGeneratingOperationalRecords = false;
    let _lastLoadedActDataStr = '';

    function getBranchStorageKey(suffix) {
      const username = localStorage.getItem('gs_current_user') || 'guest';
      const rawUser = username.trim();
      const userSlug = rawUser.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '') || 'guest';
      const branchEl = document.getElementById('branch-selector');
      const branchName = (branchEl && branchEl.value) ? branchEl.value : 'main';
      const branchKey = branchName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '') || 'main';
      const slugKey = `gs_data_${userSlug}_${branchKey}_${suffix}`;
      const rawKey = `gs_data_${rawUser}_${branchKey}_${suffix}`;

      if (typeof localStorage !== 'undefined') {
        const sVal = localStorage.getItem(slugKey);
        if (sVal && sVal !== '[]' && sVal !== '{}') {
          if (rawKey !== slugKey && localStorage.getItem(rawKey)) {
            try { localStorage.removeItem(rawKey); } catch(e) {}
          }
          return slugKey;
        }
        const rVal = localStorage.getItem(rawKey);
        if (rVal && rVal !== '[]' && rVal !== '{}') {
          try {
            localStorage.setItem(slugKey, rVal);
            localStorage.removeItem(rawKey);
          } catch(e) {}
          return slugKey;
        }
      }
      return slugKey;
    }

    // Helper nén tinh gọn dữ liệu nhật ký hoạt động
    function compactActivitiesData(data) {
      if (!Array.isArray(data)) return data;
      return data.map(item => {
        const clean = {};
        for (const [k, v] of Object.entries(item)) {
          if (v === '' || v === null || v === undefined) continue;
          if (k === 'manager' && v === 'Kỹ sư vận hành') continue;
          if (k === 'entryRole' && v === 'engineer') continue;
          if (k === 'entryMode' && v === 'auto_daily') continue;
          if (k === 'isBaseline' && v === 'false') continue;
          if (k === 'isInvoice' && v === 'false') continue;
          if (k === 'isDowntime' && v === 'false') continue;
          if (k === 'recordType' && v === 'normal') continue;
          if (k === 'downtimeHours' && (v === '0' || v === 0)) continue;
          if (k === 'overtimeHours' && (v === '0' || v === 0)) continue;
          if (k === 'biogenicCo2' && (v === '0' || v === 0 || v === '0.00')) continue;
          if (k === 'isBiomass' && v === 'false') continue;
          if (k === 'createdAt' && item.entryMode === 'auto_daily') continue;
          clean[k] = v;
        }
        return clean;
      });
    }

    // Helper giải mã dữ liệu nhật ký hoạt động đảm bảo tương thích tuyệt đối
    function decodeActivitiesData(storedData) {
      if (!storedData) return [];
      if (Array.isArray(storedData)) {
        return storedData.map(item => ({
          ...item,
          manager: item.manager || 'Kỹ sư vận hành',
          entryRole: item.entryRole || (item.isInvoice === 'true' ? 'accountant' : 'engineer'),
          entryMode: item.entryMode || 'auto_daily',
          isBaseline: item.isBaseline || 'false',
          isInvoice: item.isInvoice || 'false',
          isDowntime: item.isDowntime || 'false',
          recordType: item.recordType || 'normal',
          downtimeHours: item.downtimeHours || '0',
          overtimeHours: item.overtimeHours || '0',
          biogenicCo2: item.biogenicCo2 || '0.00',
          isBiomass: item.isBiomass || 'false',
          createdAt: item.createdAt || ''
        }));
      }
      if (storedData._v === 2 && Array.isArray(storedData._r) && Array.isArray(storedData._d)) {
        const d = storedData._d;
        return storedData._r.map(row => ({
          date: row[0] || '',
          sourceId: row[1] || '',
          sourceType: (row[2] !== '' && row[2] !== undefined) ? d[row[2]] : '',
          sourceName: (row[3] !== '' && row[3] !== undefined) ? d[row[3]] : '',
          amount: row[4] !== undefined ? row[4] : 0,
          unit: (row[5] !== '' && row[5] !== undefined) ? d[row[5]] : '',
          doc: (row[6] !== '' && row[6] !== undefined) ? d[row[6]] : '',
          manager: (row[7] !== '' && row[7] !== undefined) ? d[row[7]] : 'Kỹ sư vận hành',
          co2e: row[8] || '0.00',
          biogenicCo2: row[9] || '0.00',
          isBiomass: row[10] || 'false',
          efName: (row[11] !== '' && row[11] !== undefined) ? d[row[11]] : '',
          refName: (row[12] !== '' && row[12] !== undefined) ? d[row[12]] : '',
          finalFactor: row[13] || '',
          fileName: (row[14] !== '' && row[14] !== undefined) ? d[row[14]] : '',
          createdAt: (row[15] !== '' && row[15] !== undefined) ? d[row[15]] : '',
          entryRole: (row[16] !== '' && row[16] !== undefined) ? d[row[16]] : 'engineer',
          entryMode: (row[17] !== '' && row[17] !== undefined) ? d[row[17]] : 'auto_daily',
          isBaseline: row[18] || 'false',
          isInvoice: row[19] || 'false',
          isDowntime: row[20] || 'false',
          recordType: (row[21] !== '' && row[21] !== undefined) ? d[row[21]] : 'normal',
          stdHours: row[22] || '8',
          downtimeHours: row[23] || '0',
          overtimeHours: row[24] || '0'
        }));
      }
      return [];
    }

    // Cơ chế lưu trữ an toàn chống tràn bộ nhớ (QuotaExceededError)
    function safeSaveActivities(key, data) {
      if (typeof localStorage === 'undefined') return;

      // 1. Luôn tự động xóa các key rác hoặc key trùng lặp un-slugged chứa dấu '@'
      try {
        for (let i = localStorage.length - 1; i >= 0; i--) {
          const k = localStorage.key(i);
          if (k && k.startsWith('gs_data_') && (k.includes('@') || k.includes('..')) && k.endsWith('_activity')) {
            localStorage.removeItem(k);
          }
        }
      } catch (e) {}

      // 2. Thử lưu dữ liệu (nếu dữ liệu < 3.2MB và < 2500 dòng để tránh nguy cơ tràn 5MB quota)
      const rawPayload = JSON.stringify(data);
      if (rawPayload.length < 3200000 && (!Array.isArray(data) || data.length < 2500)) {
        try {
          localStorage.setItem(key, rawPayload);
          return;
        } catch (err) {
          console.warn('[Storage Quota] Lưu thông thường gặp lỗi, kích hoạt quy trình dọn dẹp dung lượng:', err);
        }
      }

      // 3. Quy trình dọn dẹp khẩn cấp (Emergency Storage Cleanup):
      // 3a. Dọn dẹp các tệp lớn base64 dataUrl còn kẹt trong gs_doc_* ở localStorage
      try {
        if (window.DocumentStorage && typeof window.DocumentStorage.cleanupStorageQuota === 'function') {
          window.DocumentStorage.cleanupStorageQuota();
        } else {
          for (let i = localStorage.length - 1; i >= 0; i--) {
            const k = localStorage.key(i);
            if (k && k.startsWith('gs_doc_')) {
              try {
                const raw = localStorage.getItem(k);
                if (raw && raw.includes('"dataUrl"')) {
                  const docObj = JSON.parse(raw);
                  if (docObj && docObj.dataUrl) {
                    delete docObj.dataUrl;
                    localStorage.setItem(k, JSON.stringify(docObj));
                  }
                }
              } catch (dErr) {
                localStorage.removeItem(k);
              }
            }
          }
        }
      } catch (e) {}

      // 3b. Xóa các key bản ghi thô trùng lặp còn sót lại
      try {
        const username = localStorage.getItem('gs_current_user') || 'guest';
        const rawUser = username.trim();
        if (rawUser.includes('@')) {
          const branchEl = document.getElementById('branch-selector');
          const branchName = (branchEl && branchEl.value) ? branchEl.value : 'main';
          const branchKey = branchName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '') || 'main';
          localStorage.removeItem(`gs_data_${rawUser}_${branchKey}_activity`);
          localStorage.removeItem(`gs_data_${rawUser}_tru_so_chinh_activity`);
        }
      } catch (e) {}

      // Thử lại lần 2 sau khi dọn sạch bộ nhớ (nếu dữ liệu < 3.2MB)
      if (rawPayload.length < 3200000 && (!Array.isArray(data) || data.length < 2500)) {
        try {
          localStorage.setItem(key, rawPayload);
          return;
        } catch (err2) {
          console.warn('[Storage Quota] Sau khi dọn dẹp vẫn chưa đủ dung lượng, nén tinh gọn thuộc tính rỗng:', err2);
        }
      }

      // 3c. Nén tinh gọn dữ liệu (compact attributes - lược bỏ trường rỗng và giá trị mặc định)
      try {
        const compactData = compactActivitiesData(data);
        localStorage.setItem(key, JSON.stringify(compactData));
        return;
      } catch (err3) {
        console.warn('[Storage Quota] Lưu compact thông thường vẫn đầy, kích hoạt nén từ điển cấp cao:', err3);
      }

      // 3d. Nén từ điển cấp cao (Dictionary Encoding) giúp tiết kiệm >80% dung lượng
      try {
        const dict = [];
        const dictMap = new Map();
        function getDictIdx(val) {
          if (val === '' || val === null || val === undefined) return '';
          let idx = dictMap.get(val);
          if (idx === undefined) {
            idx = dict.length;
            dictMap.set(val, idx);
            dict.push(val);
          }
          return idx;
        }
        const rows = data.map(r => [
          r.date || '',
          r.sourceId || '',
          getDictIdx(r.sourceType),
          getDictIdx(r.sourceName),
          r.amount !== undefined ? r.amount : 0,
          getDictIdx(r.unit),
          getDictIdx(r.doc),
          getDictIdx(r.manager),
          r.co2e || '0.00',
          r.biogenicCo2 || '0.00',
          r.isBiomass || 'false',
          getDictIdx(r.efName),
          getDictIdx(r.refName),
          r.finalFactor || '',
          getDictIdx(r.fileName),
          getDictIdx(r.createdAt),
          getDictIdx(r.entryRole),
          getDictIdx(r.entryMode),
          r.isBaseline || 'false',
          r.isInvoice || 'false',
          r.isDowntime || 'false',
          getDictIdx(r.recordType),
          r.stdHours || '8',
          r.downtimeHours || '0',
          r.overtimeHours || '0'
        ]);
        const dictObj = { _v: 2, _d: dict, _r: rows };
        localStorage.setItem(key, JSON.stringify(dictObj));
        return;
      } catch (err4) {
        console.error('[Storage Quota] Lưu nén từ điển vẫn vượt quota 5MB của localStorage:', err4);
        throw new Error('Dung lượng lưu trữ trình duyệt (localStorage) đã đầy. Dữ liệu đã được nén tối đa nhưng cần làm mới trang để giải phóng bộ nhớ đệm.');
      }
    }

    function saveActivityList() {
      const rows = document.querySelectorAll('#activity-tbody tr:not(#no-activity-row)');
      const data = [];
      rows.forEach(row => {
        data.push({ ...row.dataset });
      });

      const username = localStorage.getItem('gs_current_user') || 'guest';
      const rawUser = username.trim();
      const userSlug = rawUser.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '') || 'guest';
      const branchEl = document.getElementById('branch-selector');
      const branchName = (branchEl && branchEl.value) ? branchEl.value : 'main';
      const branchKey = branchName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '') || 'main';

      const slugKey = `gs_data_${userSlug}_${branchKey}_activity`;
      const rawKey = `gs_data_${rawUser}_${branchKey}_activity`;
      
      // Xóa bản copy trùng lặp rawKey để giải phóng ngay ~2-3MB dung lượng
      if (rawKey !== slugKey) {
        try { localStorage.removeItem(rawKey); } catch (e) {}
      }

      safeSaveActivities(slugKey, data);

      if (typeof renderMachineOverview === 'function') renderMachineOverview();
      if (typeof renderReconciliationSummary === 'function') renderReconciliationSummary();
      const viewDash = document.getElementById('view-dashboard');
      const isDashboardActive = viewDash && viewDash.style.display !== 'none';
      if (isDashboardActive) {
        if (typeof renderDashboard === 'function') renderDashboard();
        if (typeof updateDashboard === 'function') updateDashboard();
      }

      // Auto-sync to Supabase in background (non-blocking)
      try {
        if (window.GreenShiftDB && typeof window.GreenShiftDB.pushActivities === 'function') {
          const branchEl = document.getElementById('branch-selector');
          const bName = (branchEl && branchEl.value) ? branchEl.value : 'main';
          const bKey = bName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '') || 'main';
          window.GreenShiftDB.pushActivities(bKey, data);
        }
      } catch (syncErr) {
        console.warn('[GreenShift DB Sync] Ignored background sync exception:', syncErr);
      }
    }

    function loadActivityList() {
      tbody.innerHTML = '<tr id="no-activity-row"><td colspan="11" style="text-align: center; color: var(--color-text-secondary); padding: 3rem;">Chưa có dữ liệu</td></tr>';
      const rawUser = (localStorage.getItem('gs_current_user') || 'guest').trim();
      const userSlug = rawUser.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '') || 'guest';
      const branchEl = document.getElementById('branch-selector');
      const branchName = (branchEl && branchEl.value) ? branchEl.value : 'main';
      const branchKey = branchName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '') || 'main';

      const normActKey = `gs_data_${userSlug}_${branchKey}_activity`;
      const rawActKey = `gs_data_${rawUser}_${branchKey}_activity`;

      let stored = localStorage.getItem(normActKey);
      if (!stored && rawActKey !== normActKey) {
        stored = localStorage.getItem(rawActKey);
        if (stored) {
          try {
            safeSaveActivities(normActKey, JSON.parse(stored));
            localStorage.removeItem(rawActKey);
          } catch(e) {
            try { localStorage.setItem(normActKey, stored); localStorage.removeItem(rawActKey); } catch(e2) {}
          }
        }
      } else if (stored && rawActKey !== normActKey) {
        try {
          if (localStorage.getItem(rawActKey)) {
            localStorage.removeItem(rawActKey);
          }
        } catch(e) {}
      }

      // Tối ưu hiệu năng: Nếu dữ liệu không đổi và bảng đã có dòng, chỉ lọc lại nhanh thay vì vẽ lại toàn bộ DOM
      if (stored && stored === _lastLoadedActDataStr && tbody.querySelectorAll('tr:not(#no-activity-row)').length > 0) {
        applyFilter(actHiddenFilter.value);
        if (typeof renderMachineOverview === 'function') renderMachineOverview();
        if (typeof renderReconciliationSummary === 'function') renderReconciliationSummary();
        return;
      }
      _lastLoadedActDataStr = stored || '';

      // Đọc nguồn phát thải từ các biến thể key để kiểm tra tính sẵn sàng phân bổ ca máy
      let sources = [];
      try {
        const srcKey = getBranchStorageKey('sources');
        const rawSrcKey = `gs_data_${rawUser}_${branchKey}_sources`;
        const slugSrcKey = `gs_data_${userSlug}_${branchKey}_sources`;
        const storedSrc = localStorage.getItem(slugSrcKey) ||
                          localStorage.getItem(rawSrcKey) ||
                          localStorage.getItem(srcKey) ||
                          localStorage.getItem(`gs_data_${rawUser}_tru_so_chinh_sources`) ||
                          localStorage.getItem(`gs_data_${userSlug}_tru_so_chinh_sources`);
        if (storedSrc) sources = JSON.parse(storedSrc);
      } catch(e) {}

      // Tự động phân bổ ca máy chi tiết từng ngày (1..31 ngày) nếu đã có Thiết bị/Nguồn mà chưa có bản ghi
      if ((!stored || stored === '[]') && sources.length > 0 && !isGeneratingOperationalRecords) {
        isGeneratingOperationalRecords = true;
        try {
          const activeYear = document.getElementById('act-filter-year')?.value || '2026';
          autoGenerateDailyOperationalRecords(activeYear, 'all', false);
        } finally {
          isGeneratingOperationalRecords = false;
        }
        return;
      }

      if (!stored) return;
      try {
        let rawParsed = JSON.parse(stored);
        let data = decodeActivitiesData(rawParsed);
        if (data && data.length > 0) {
          // Tự động phục hồi và phân định rạch ròi:
          let needsSave = false;
          // 1. Bản ghi dừng máy sự cố (-) tuyệt đối không mang cờ isBaseline: true
          data.forEach(act => {
            if (act.isDowntime === 'true' && act.isBaseline === 'true') {
              act.isBaseline = 'false';
              needsSave = true;
            }
          });

          // 2. Tự động phục hồi dòng định mức vận hành tháng và mặc định phân bổ chi tiết theo ngày
          // (Tương thích và thay thế cơ chế cũ: list.length >= 2 && list.length < 12 sinh 'Định mức vận hành T')
          const hasOldBaselines = data.some(a => a.entryMode === 'auto_baseline' || (a.doc && a.doc.includes('Định mức vận hành T')));
          if (!isGeneratingOperationalRecords && hasOldBaselines) {
            isGeneratingOperationalRecords = true;
            try {
              const y = (data.find(a => a.date)?.date || '2026').split('-')[0];
              autoGenerateDailyOperationalRecords(y, 'all', false);
            } finally {
              isGeneratingOperationalRecords = false;
            }
            return;
          }

          // Kiểm tra nếu dữ liệu ca ngày bị thiếu tháng nào trong 12 tháng hoặc chưa có auto_daily, tự động bổ sung đủ
          const activeYear = (data.find(a => a.date)?.date || '2026').split('-')[0];
          const dailyMonths = new Set();
          data.forEach(a => {
            if (a.entryMode === 'auto_daily' && a.date && a.date.startsWith(activeYear)) {
              dailyMonths.add(parseInt(a.date.split('-')[1], 10));
            }
          });
          if (!isGeneratingOperationalRecords && dailyMonths.size < 12 && sources.length > 0) {
            isGeneratingOperationalRecords = true;
            try {
              autoGenerateDailyOperationalRecords(activeYear, 'all', false);
            } finally {
              isGeneratingOperationalRecords = false;
            }
            return;
          }

          document.getElementById('no-activity-row')?.remove();
          data.forEach(act => {
            // Tự động sửa chữa dữ liệu kiểm thử nếu từng bị lưu nhầm hệ số điện lưới 0.6766 cho phôi thép (tấn)
            if (act.unit === 'tấn' && (act.finalFactor == 0.6766 || act.finalFactor == '0.6766')) {
              act.finalFactor = '60';
              act.efName = 'Thép lò hồ quang điện (EAF)';
              act.sourceType = 'Lò thổi oxy hoặc lò hồ quang điện trong luyện thép';
              act.sourceName = 'Quá trình luyện thép - Lò hồ quang điện EAF 100 tấn/mẻ';
              act.co2e = (parseFloat(act.amount || 0) * 60).toFixed(2);
              needsSave = true;
            }
            if (act.doc) {
              act.doc = act.doc.replace(/\(\s*\d{1,2}(?::\d{2})?\s*-\s*\d{1,2}(?::\d{2})?\s*\)\s*\(\s*\d{1,2}(?::\d{2})?\s*-\s*\d{1,2}(?::\d{2})?\s*\)/g, (m) => {
                const matches = m.match(/\(\s*\d{1,2}(?::\d{2})?\s*-\s*\d{1,2}(?::\d{2})?\s*\)/g);
                return matches ? matches[matches.length - 1] : m;
              });
              act.doc = act.doc.replace(/\(\s*8\s*-\s*9\s*\)\s*\(\s*8:00\s*-\s*9:00\s*\)/g, '(08:00 - 09:00)');
            }
            if (act.unit) {
              act.unit = normalizeConsumptionUnit(act.unit, act.sourceType);
            }
          });

          // Tự động đồng bộ các dòng định mức công nghệ nếu nguồn phát thải đã đổi sản lượng năm (ví dụ từ 600.000 xuống 60.000)
          try {
            const curSources = JSON.parse(localStorage.getItem(getBranchStorageKey('sources')) || '[]');
            curSources.forEach(src => {
              const isProc = src.isProcessEmission === 'true' || src.measure === 'Theo sản lượng sản phẩm' || Boolean(src.productionUnit);
              const aQty = parseFloat(src.annualEstQty) || 0;
              if (isProc && aQty > 0) {
                const srcId = src.id;
                const srcName = (src.eq || src.type || '').toLowerCase();
                const targetDaily = Math.round((aQty / 300) * 1000) / 1000;
                const efNum = parseFloat(src.efFactor) || 60;
                const efUnit = (src.efUnit || src.opCapUnit || '').toLowerCase();
                const efKg = (efUnit.includes('tco2') || efUnit.includes('tấn co2') || efUnit.includes('t co2')) ? (efNum * 1000) : efNum;

                data.forEach(a => {
                  const isMatch = (srcId && a.sourceId === srcId) || (srcName && a.sourceName && a.sourceName.toLowerCase().includes(srcName));
                  if (isMatch && a.isBaseline === 'true') {
                    const curAmt = parseFloat(a.amount) || 0;
                    if (Math.abs(curAmt - targetDaily) > 2) {
                      a.amount = targetDaily;
                      a.co2e = (targetDaily * efKg).toFixed(2);
                      a.finalFactor = efKg;
                      a.doc = `Định mức công nghệ (${targetDaily} ${src.productionUnit || 'tấn'}/ngày)`;
                      needsSave = true;
                    }
                  }
                });
              }
            });
          } catch(e) {}

          if (needsSave) {
            try {
              safeSaveActivities(getBranchStorageKey('activity'), data);
            } catch(e) {}
          }

          // Tối ưu hiệu năng: Thêm hàng loạt qua DocumentFragment để tránh reflow 12.5 triệu lần
          const frag = document.createDocumentFragment();
          data.forEach(item => {
            const tr = document.createElement('tr');
            tr.style.borderBottom = '1px solid var(--color-border)';
            Object.assign(tr.dataset, item);
            updateRowHTML(tr, item);
            frag.appendChild(tr);
          });
          tbody.appendChild(frag);
        }
      } catch(e) { console.error('Error loading activity data', e); }
      // Re-apply filter after loading
      applyFilter(actHiddenFilter.value);
      if (typeof renderMachineOverview === 'function') renderMachineOverview();
      if (typeof renderReconciliationSummary === 'function') renderReconciliationSummary();
      if (typeof updateProductionReminderBanner === 'function') updateProductionReminderBanner();
    }

    // Đăng ký hàm làm mới toàn cục và lắng nghe sự kiện đồng bộ từ Supabase Cloud
    window.refreshActivityData = function() {
      loadActivityList();
    };

    window.addEventListener('greenshift:sync-complete', (e) => {
      console.log('[GreenShift Sync] Cập nhật dữ liệu sau khi đồng bộ CSDL:', e.detail);
      loadActivityList();
    });

    function populateSourceDropdowns(filterType, isProductionOnly) {
      filterType = (typeof filterType === 'string') ? filterType.trim() : '';
      const curUserRole = localStorage.getItem('gs_user_role') || 'engineer';
      sourceSelect.innerHTML = '';
      const defaultText = isProductionOnly
        ? 'Vui lòng chọn Thiết bị Quá trình sản xuất (Lò luyện thép / Đúc phôi)'
        : ((curUserRole === 'accountant') 
            ? 'Vui lòng chọn Nguồn phát thải / Hạng mục chi phí' 
            : 'Vui lòng chọn Thiết bị');
      sourceSelect.add(new Option(defaultText, '', true, true));
      sourceSelect.options[0].disabled = true;

      // Khi là Kế toán và KHÔNG phải chế độ chốt sản lượng: Thêm nhóm Hạng mục Năng lượng / Nhiên liệu mua ngoài cấp Cơ sở
      if (curUserRole === 'accountant' && !isProductionOnly) {
        const efMaster = (typeof window !== 'undefined' && window.EF_MASTER) ? window.EF_MASTER : (typeof EF_MASTER !== 'undefined' ? EF_MASTER : null);
        const vnFuels = efMaster?.VN?.fuels || {};
        const vnElec = efMaster?.VN?.electricity || {};
        const getGwpVal = (gas, ar) => (efMaster?.CALC?.getGWP ? efMaster.CALC.getGWP(gas, ar) : 1924);

        const facSources = (window.InvoiceParser && window.InvoiceParser.FACILITY_ENERGY_SOURCES) ? window.InvoiceParser.FACILITY_ENERGY_SOURCES : [
          { id: 'src_fac_diesel', name: 'Dầu Diesel (DO) mua ngoài (Toàn nhà máy / Bồn tổng)', type: 'Đốt cháy cố định', ef: 'Dầu Diesel (DO)', efFactor: String(vnFuels.diesel?.factor || '2.686'), efUnit: 'kgCO2e/lít', unit: 'lít', measure: 'volume' },
          { id: 'src_fac_electricity', name: 'Điện lưới EVN mua ngoài (Tổng công tơ nhà máy)', type: 'Điện mua vào', ef: 'Điện lưới Việt Nam', efFactor: String(vnElec.grid_kwh?.factor || '0.6766'), efUnit: 'kgCO2e/kWh', unit: 'kWh', measure: 'volume' },
          { id: 'src_fac_petrol', name: 'Xăng RON 95 / E5 mua ngoài (Xe công ty & Động cơ nổ)', type: 'Đốt cháy động', ef: 'Xăng', efFactor: String(vnFuels.petrol?.factor || '2.271'), efUnit: 'kgCO2e/lít', unit: 'lít', measure: 'volume' },
          { id: 'src_fac_lpg', name: 'Khí dầu mỏ hóa lỏng LPG mua ngoài (Nhiệt & Bếp công nghiệp)', type: 'Đốt cháy cố định', ef: 'Khí dầu mỏ hóa lỏng (LPG)', efFactor: String(vnFuels.lpg?.factor || '2.983'), efUnit: 'kgCO2e/kg', unit: 'kg', measure: 'weight' },
          { id: 'src_fac_coal', name: 'Than đá / Nhiên liệu rắn mua ngoài (Lò hơi)', type: 'Đốt cháy cố định', ef: 'Than antraxit', efFactor: String(vnFuels.coal_anthracite?.factor || '2.625'), efUnit: 'kgCO2e/kg', unit: 'kg', measure: 'weight' },
          { id: 'src_fac_biomass', name: 'Nhiên liệu sinh khối mua ngoài (Củi / Mùn cưa / Trấu / Viên nén)', type: 'Đốt cháy cố định', ef: 'Củi / Dăm gỗ / Mùn cưa', efFactor: String(vnFuels.wood_waste?.factor || '0.038'), efUnit: 'kgCO2e/kg', unit: 'kg', measure: 'weight', biomass: 'Có' },
          { id: 'src_fac_refrigerant', name: 'Môi chất lạnh nạp bổ sung (R-410A / R-32 - Bảo trì)', type: 'Phát thải thất thoát', ef: 'R-410A', refrigerant: 'R-410A', efFactor: String(getGwpVal('R410A', 'AR5') || '1924'), efUnit: 'kgCO2e/kg', unit: 'kg', measure: 'refrigerant' }
        ];

        const facGroup = document.createElement('optgroup');
        facGroup.label = 'Hạng mục Năng lượng / Nhiên liệu mua ngoài (Cấp cơ sở)';
        let facMatched = 0;
        facSources.forEach(src => {
          if (filterType && src.type !== filterType && !(filterType.includes('Đốt cháy') && src.type.includes('Đốt cháy'))) return;
          const opt = document.createElement('option');
          opt.value = src.id;
          opt.text = src.name;
          opt.dataset.ef = src.ef || '';
          opt.dataset.refrigerant = src.refrigerant || '';
          opt.dataset.efFactor = src.efFactor || '';
          opt.dataset.efUnit = src.efUnit || '';
          opt.dataset.type = src.type || '';
          opt.dataset.eq = src.name;
          opt.dataset.measure = src.measure || 'volume';
          opt.dataset.isFacility = 'true';
          opt.dataset.unit = src.unit || '';
          opt.dataset.biomass = src.biomass || '';
          facGroup.appendChild(opt);
          facMatched++;
        });
        if (facMatched > 0) {
          sourceSelect.appendChild(facGroup);
        }
      }
      
      let sourceRows = document.querySelectorAll('#source-tbody tr:not(#no-source-row)');
      let rowsList = [];
      if (sourceRows.length > 0) {
        sourceRows.forEach(r => rowsList.push(r));
      } else {
        try {
          const username = localStorage.getItem('gs_current_user') || 'guest';
          const userSlug = username.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '') || 'guest';
          const branchEl = document.getElementById('branch-selector');
          const branchName = (branchEl && branchEl.value) ? branchEl.value : 'main';
          const branchKey = branchName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
          const stored = localStorage.getItem(getBranchStorageKey('sources')) ||
                         localStorage.getItem(`gs_data_${userSlug}_${branchKey}_sources`) ||
                         localStorage.getItem(`gs_data_${username}_${branchKey}_sources`);
          if (stored) {
            const list = JSON.parse(stored);
            list.forEach(item => {
              rowsList.push({ dataset: { ...item } });
            });
          }
        } catch(e) {}
      }
      const eqGroup = (curUserRole === 'accountant' && !isProductionOnly) 
        ? document.createElement('optgroup') 
        : null;
      if (eqGroup) {
        eqGroup.label = 'Hoặc chọn Hóa đơn lẻ cho từng Thiết bị cơ khí cụ thể';
      }
      let parentContainer = eqGroup || sourceSelect;
      let needsSave = false;
      let matchedCount = 0;

      rowsList.forEach(row => {
        let id = row.dataset.id;
        if (!id) {
            id = 'src_' + Math.random().toString(36).substr(2, 9);
            row.dataset.id = id;
            needsSave = true;
        }

        const type = row.dataset.type || '';
        const cat = row.dataset.category || '';
        const eq = row.dataset.eq || '';

        const isElectricity = (cat === 'Tiêu thụ điện' || cat === 'Tiêu thụ điện lưới' || cat === 'Điện mua vào' || cat === 'Điện năng mua vào' || cat.includes('Điện'));
        const isCombustion = (cat === 'Đốt cháy cố định' || cat === 'Đốt cháy động' || cat === 'Đốt cháy di động' || cat.includes('Đốt cháy') || cat.includes('đốt cháy'));
        const isFugitive = (cat === 'Phát thải thất thoát' || cat === 'Phát thải rò rỉ' || cat.includes('thất thoát') || cat.includes('rò rỉ'));

        // Nguồn Quá trình công nghiệp (Scope 1 - IPPU): TUYỆT ĐỐI KHÔNG BAO GỒM TIÊU THỤ ĐIỆN VÀ ĐỐT NHIỆU LIỆU
        let isProc = false;
        if (!isElectricity && !isCombustion && !isFugitive) {
          isProc = (row.dataset.isProcessEmission === 'true' || 
                    cat === 'Các quá trình công nghiệp' || 
                    (row.dataset.measure && row.dataset.measure.includes('sản lượng')) ||
                    Boolean(row.dataset.productionUnit && row.dataset.productName) ||
                    type.includes('quá trình công nghiệp') || type.includes('thổi oxy') || type.includes('luyện thép'));
        }

        // Khi ở chế độ Chốt sản lượng ca/ngày, TUỆT ĐỐI CHỈ hiển thị các nguồn Quá trình công nghiệp (Scope 1 - IPPU)
        if (isProductionOnly && !isProc) return;
        
        // Lọc linh hoạt: Khớp theo tên Loại thiết bị hoặc Danh mục nguồn (ví dụ Đốt cháy cố định)
        if (filterType && type !== filterType && cat !== filterType && !type.includes(filterType) && !cat.includes(filterType)) return;
        
        // Skip sources that are not material (for Scope 3)
        if (row.dataset.isMaterial === 'false') return;
        
        // Build a very clear display name: if eq is present use it, else fallback to type
        let name = type;
        if (eq) {
            name = `${type} - ${eq}`;
        }
        if (isProc) {
            const efFactorNum = parseFloat(row.dataset.efFactor) || 60;
            const efDisplay = (efFactorNum > 5) ? `${efFactorNum} kgCO2e/tấn` : `${(efFactorNum * 1000)} kgCO2e/tấn (0.060 tCO2/tấn)`;
            const isSteel = (type.includes('luyện thép') || eq.includes('EAF') || eq.includes('hồ quang') || (row.dataset.productName || '').includes('Thép'));
            if (isSteel) {
              name = `Quá trình luyện thép - ${eq || 'Lò hồ quang điện EAF'} (IPPU: ${efDisplay})`;
            } else {
              const pTitle = row.dataset.productName ? `Quá trình sản xuất (${row.dataset.productName})` : 'Quá trình công nghệ';
              name = `${pTitle} - ${eq || type} (IPPU: ${efDisplay})`;
            }
        }
        
        const opt = document.createElement('option');
        opt.value = id;
        opt.text = name;
        opt.dataset.ef = row.dataset.ef || (isProc ? 'Thép lò hồ quang điện (EAF)' : '');
        opt.dataset.refrigerant = row.dataset.refrigerant || '';
        opt.dataset.efFactor = row.dataset.efFactor || (isProc ? '60' : '');
        opt.dataset.efUnit = row.dataset.efUnit || (isProc ? 'kgCO2e/tấn' : '');
        opt.dataset.type = type;
        opt.dataset.eq = eq;
        opt.dataset.measure = row.dataset.measure || '';
        opt.dataset.opCapacity = row.dataset.opCapacity || '';
        opt.dataset.opCapUnit = row.dataset.opCapUnit || '';
        opt.dataset.opLoad = row.dataset.opLoad || '';
        opt.dataset.opHoursDay = row.dataset.opHoursDay || '';
        opt.dataset.opDaysWeek = row.dataset.opDaysWeek || '';
        opt.dataset.hourlyRate = row.dataset.hourlyRate || '';
        opt.dataset.annualEstQty = row.dataset.annualEstQty || '';
        opt.dataset.annualEstEmissions = row.dataset.annualEstEmissions || '';
        opt.dataset.meterId = row.dataset.meterId || '';
        opt.dataset.meterMult = row.dataset.meterMult || '';
        opt.dataset.isProcessEmission = isProc ? 'true' : (row.dataset.isProcessEmission || '');
        opt.dataset.needsProductionInput = isProc ? 'true' : (row.dataset.needsProductionInput || '');
        opt.dataset.productName = row.dataset.productName || (isProc ? 'Thép thô / Phôi thép' : '');
        opt.dataset.productionUnit = row.dataset.productionUnit || (isProc ? 'tấn' : '');
        opt.dataset.biomass = row.dataset.biomass || '';
        parentContainer.appendChild(opt);
        matchedCount++;
      });

      if (eqGroup && matchedCount > 0) {
        sourceSelect.appendChild(eqGroup);
      }

      // Tự động bổ sung nguồn Quá trình công nghệ chuẩn nếu nhà máy chưa có dòng IPPU trong bảng Nguồn phát thải
      if (isProductionOnly && matchedCount === 0) {
        const opt = document.createElement('option');
        opt.value = 'src_ippu_auto_eaf';
        opt.text = 'Quá trình luyện thép - Lò hồ quang điện EAF 100 tấn/mẻ (IPPU: 60 kgCO2e/tấn)';
        opt.dataset.ef = 'Thép lò hồ quang điện (EAF)';
        opt.dataset.efFactor = '60';
        opt.dataset.efUnit = 'kgCO2e/tấn';
        opt.dataset.type = 'Lò thổi oxy hoặc lò hồ quang điện trong luyện thép';
        opt.dataset.eq = 'Lò hồ quang điện EAF 100 tấn/mẻ';
        opt.dataset.measure = 'Theo sản lượng sản phẩm';
        opt.dataset.isProcessEmission = 'true';
        opt.dataset.needsProductionInput = 'true';
        opt.dataset.productName = 'Thép thô / Phôi thép';
        opt.dataset.productionUnit = 'tấn';
        sourceSelect.appendChild(opt);
        matchedCount++;
      }

      if (needsSave && typeof saveSourceList === 'function') {
          saveSourceList();
      }
    }

    function lookupFactor(efName, refName) {
      let factor = 0;
      let unit = '';
      const searchName = refName || efName;
      if (!searchName) return { factor, unit };
      
      // Dynamic IPCC AR lookup for refrigerants
      if (refName && window.IPCC_DB) {
          const userStr = localStorage.getItem('gs_current_user');
          let ar = 'AR5-100'; // Default
          if (userStr) {
              try {
                  const users = JSON.parse(localStorage.getItem('gs_users') || '[]');
                  const u = users.find(x => x.username === userStr);
                  if (u && u.company && u.company.ipccAR) {
                      ar = u.company.ipccAR;
                  }
              } catch (e) {}
          }
          if (window.IPCC_DB[ar] && window.IPCC_DB[ar][refName] !== undefined) {
              return { factor: window.IPCC_DB[ar][refName], unit: 'kgCO2e/kg', source: 'IPCC ' + ar };
          }
      }

      if (typeof EF_MASTER === 'undefined') return { factor, unit };
      const master = EF_MASTER || {};
      for (const stdKey in master) {
        if (typeof master[stdKey] === 'object') {
          for (const category in master[stdKey]) {
            if (typeof master[stdKey][category] === 'object') {
              for (const itemKey in master[stdKey][category]) {
                const item = master[stdKey][category][itemKey];
                if (item && item.name && (searchName.includes(item.name) || item.name.includes(searchName))) {
                  factor = item.factor || item.gwp || 0;
                  unit = item.unit || '';
                  return { factor, unit, source: item.source, fuelItem: item };
                }
              }
            }
          }
        }
      }
      return { factor, unit };
    }

    sourceSelect.addEventListener('change', () => {
      const selected = sourceSelect.options[sourceSelect.selectedIndex];
      const wwGroup = document.getElementById('activity-ww-group');
      
      if (!selected || !selected.value) {
        infoBox.style.display = 'none';
        if(wwGroup) wwGroup.style.display = 'none';
        return;
      }

      const currentRole = localStorage.getItem('gs_user_role') || 'engineer';
      const typeStr = (selected.dataset.type || '').toLowerCase();
      const eqStr = (selected.text || '').toLowerCase();
      const isWW = typeStr.includes('nước thải') || typeStr.includes('tự hoại') || eqStr.includes('nước thải') || eqStr.includes('tự hoại') || eqStr.includes('hiếu khí') || eqStr.includes('kỵ khí') || eqStr.includes('bùn') || typeStr.includes('waste');
      
      if(wwGroup) {
        wwGroup.style.display = isWW ? 'block' : 'none';
        
        const isProcess = selected.dataset.isProcessEmission === 'true' || typeStr.includes('quá trình công nghiệp') || Boolean(selected.dataset.productionUnit);
        if (isProcess) {
          wwGroup.style.display = 'none';
          if (btnCalcTow) btnCalcTow.style.display = 'none';
          if (amountLabel) amountLabel.innerHTML = `Sản lượng sản xuất (${selected.dataset.productName || 'phôi thép / sản phẩm'}) <span style="color: red;">*</span>`;
        } else if (currentRole === 'accountant') {
          wwGroup.style.display = 'none';
          if (btnCalcTow) btnCalcTow.style.display = 'none';
          if (amountLabel) amountLabel.innerHTML = 'Số lượng tiêu thụ trên hóa đơn <span style="color: red;">*</span>';
        } else {
          wwGroup.style.display = isWW ? 'block' : 'none';
          if (isWW) {
            if (amountLabel) amountLabel.innerHTML = 'Tổng chất hữu cơ (TOW) <span style="color: red;">*</span>';
            if (unitInput && !unitInput.value) unitInput.value = 'kg BOD';
            if (btnCalcTow) btnCalcTow.style.display = 'flex';
          } else {
            if (amountLabel) amountLabel.innerHTML = 'Lượng tiêu thụ (Tổng tính được) <span style="color: red;">*</span>';
            if (btnCalcTow) btnCalcTow.style.display = 'none';
          }
        }
      }
      infoBox.style.display = isWW ? 'none' : 'block';
      
      const efName = selected.dataset.ef;
      const refName = isWW ? '' : selected.dataset.refrigerant;
      const cFactor = selected.dataset.efFactor;
      const cUnit = selected.dataset.efUnit;
      
      const { factor, unit, source } = lookupFactor(efName, refName);
      
      if (cFactor) {
        const isProcSel = selected.dataset.isProcessEmission === 'true' || typeStr.includes('quá trình công nghiệp') || Boolean(selected.dataset.productionUnit);
        if (isProcSel) {
          const numF = parseFloat(cFactor) || 60;
          const displayF = (numF > 5) ? `${numF} kgCO2e/tấn (~${(numF/1000).toFixed(3)} tCO2/tấn)` : `${numF} tCO2/tấn (~${(numF*1000)} kgCO2e/tấn)`;
          infoEf.innerText = `${efName || 'Quá trình luyện thép'} (Định mức: ${displayF} - IPCC 2006)`;
        } else {
          infoEf.innerText = `${efName} (Hệ số tùy chỉnh: ${cFactor})`;
        }
        infoRef.innerText = '-';
        infoUnit.innerText = cUnit || 'Chưa rõ';
      } else {
        infoEf.innerText = efName ? `${efName} (Hệ số: ${factor || 'Chưa rõ'} - ${source || '?'})` : '-';
        infoRef.innerText = refName ? `${refName} (GWP: ${factor || 'Chưa rõ'} - ${source || '?'})` : '-';
        infoUnit.innerText = unit || 'Chưa rõ';
      }
      
      const unitInput = document.getElementById('activity-unit');
      if (unitInput) {
        const typeLower = (selected.dataset.type || '').toLowerCase();
        const eqLower = (selected.text || '').toLowerCase();
        const opCapUnit = (selected.dataset.opCapUnit || '').toLowerCase();
        const efUnit = (selected.dataset.efUnit || '').toLowerCase();
        const isProcess = selected.dataset.isProcessEmission === 'true' || typeLower.includes('quá trình công nghiệp') || Boolean(selected.dataset.productionUnit);
        const isElectric = typeLower.includes('điện') || eqLower.includes('điện') || eqLower.includes('chiller') || eqLower.includes('làm mát') || eqLower.includes('máy lạnh') || eqLower.includes('điều hòa') || eqLower.includes('nén khí') || opCapUnit.includes('kw');

        let targetUnit = selected.dataset.unit || '';
        if (!targetUnit) {
          if (isProcess) {
            targetUnit = selected.dataset.productionUnit || 'tấn';
          } else if (isElectric) {
            targetUnit = 'kWh';
          } else if (typeLower.includes('rò rỉ') || typeLower.includes('môi chất') || selected.dataset.refrigerant) {
            targetUnit = 'kg';
          } else if (typeLower.includes('gas') || typeLower.includes('lpg') || eqLower.includes('lpg')) {
            targetUnit = 'kg';
          } else if (typeLower.includes('than') || eqLower.includes('than đá') || eqLower.includes('than antraxit')) {
            targetUnit = 'tấn';
          } else if (typeLower.includes('cng') || typeLower.includes('biogas') || eqLower.includes('khí tự nhiên')) {
            targetUnit = 'm³';
          } else if (selected.dataset.efUnit) {
            targetUnit = normalizeConsumptionUnit(selected.dataset.efUnit, selected.dataset.type);
          } else if (selected.dataset.opCapUnit) {
            targetUnit = normalizeConsumptionUnit(selected.dataset.opCapUnit, selected.dataset.type);
          } else if (cUnit || unit) {
            const uMatch = (cUnit || unit).split('/')[1];
            if (uMatch) targetUnit = uMatch;
          }
        }

        if (!targetUnit) {
          targetUnit = isElectric ? 'kWh' : ((eqLower.includes('dầu') || eqLower.includes('xăng')) ? 'lít' : 'lít');
        }

        unitInput.value = targetUnit;
      }

      // Cập nhật đơn vị vào nhãn hiển thị định mức theo giờ
      const rateUnitDisplay = document.getElementById('rate-unit-display');
      if (rateUnitDisplay) {
        rateUnitDisplay.innerText = (unitInput.value || 'đơn vị') + '/giờ';
      }

      // Kiểm tra loại đo lường và cấu hình thông số tự động theo vai trò
      const measure = selected.dataset.measure || '';
      const opCapacity = selected.dataset.opCapacity || '';
      const opCapUnit = selected.dataset.opCapUnit || 'kW';
      const opLoad = selected.dataset.opLoad || '80';
      const hourlyRate = selected.dataset.hourlyRate || '';
      const annualEstQty = selected.dataset.annualEstQty || '';
      const annualEstEmissions = selected.dataset.annualEstEmissions || '';
      const meterMult = selected.dataset.meterMult || '1';
      const isProcess = selected.dataset.isProcessEmission === 'true' ||
                        (selected.dataset.type || '').toLowerCase().includes('quá trình công nghiệp') ||
                        (selected.dataset.type || '').toLowerCase().includes('thổi oxy') ||
                        Boolean(selected.dataset.productionUnit);

      if (isProcess) {
        // NGUỒN QUÁ TRÌNH CÔNG NGHỆ: Luôn chuyển thẳng sang nhập lượng trực tiếp (tấn)
        switchActivityInputMode('direct');
        if (panelHours) panelHours.style.display = 'none';
        if (panelMeter) panelMeter.style.display = 'none';
        if (panelDirect) panelDirect.style.display = 'block';
        const groupActMode = document.getElementById('group-act-mode');
        if (groupActMode) groupActMode.style.display = 'none';
        const groupRecordType = document.getElementById('group-record-type');
        if (groupRecordType) groupRecordType.style.display = 'none';
        const amountInput = document.getElementById('activity-amount');
        if (amountInput) {
          amountInput.style.background = '#ffffff';
          amountInput.readOnly = false;
        }
        const docLabel = document.getElementById('label-activity-doc');
        if (docLabel) docLabel.innerText = 'Số phiếu cân / Biên bản giao nhận ca';
        const docInput = document.getElementById('activity-doc');
        if (docInput && !docInput.value) {
          docInput.placeholder = 'Phiếu cân điện tử bàn cân cầu, Nhật ký giao nhận ca...';
        }
        const managerLabel = document.getElementById('label-activity-manager');
        if (managerLabel) managerLabel.innerText = 'Kỹ sư xưởng luyện thép';
        const amountLabel = document.getElementById('label-amount');
        if (amountLabel) amountLabel.innerHTML = 'Sản lượng sản phẩm ca/ngày (tấn) <span style="color: red;">*</span>';
      } else if (currentRole === 'accountant') {
        // KẾ TOÁN: Tuyệt đối giữ chế độ Nhập trực tiếp / Hóa đơn, không mở panel giờ máy kỹ thuật
        switchActivityInputMode('direct');
        if (panelHours) panelHours.style.display = 'none';
        if (panelMeter) panelMeter.style.display = 'none';
        if (panelDirect) panelDirect.style.display = 'none';
        const groupActMode = document.getElementById('group-act-mode');
        if (groupActMode) groupActMode.style.display = 'none';
        const groupRecordType = document.getElementById('group-record-type');
        if (groupRecordType) groupRecordType.style.display = 'none';
        const amountInput = document.getElementById('activity-amount');
        if (amountInput) {
          amountInput.style.background = '#ffffff';
          amountInput.readOnly = false;
        }
      } else {
        // KỸ SƯ / GIÁM ĐỐC: Tự động chọn phương thức đo theo thiết bị
        const hasSubMeter = (measure === 'Đo liên tục' || selected.dataset.meterId);
        const groupActMode = document.getElementById('group-act-mode');
        const btnModeDirect = document.getElementById('btn-mode-direct');
        if (btnModeDirect) btnModeDirect.style.display = 'none'; // Kỹ sư KHÔNG BAO GIỜ thấy nút Nhập trực tiếp / Hóa đơn

        if (hasSubMeter) {
          if (groupActMode) groupActMode.style.display = 'block';
          switchActivityInputMode('meter');
          if (inputMeterMult && meterMult) inputMeterMult.value = meterMult;
        } else {
          // Mặc định hoàn toàn là theo giờ chạy máy, ẩn luôn thanh chọn chế độ để tránh rối mắt
          if (groupActMode) groupActMode.style.display = 'none';
          switchActivityInputMode('hours');
          if (inputOpRate && hourlyRate) {
            inputOpRate.value = hourlyRate;
            inputOpRate.dispatchEvent(new Event('input'));
          }
          if (inputOpLoad && opLoad) inputOpLoad.value = opLoad;
        }
      }

      // Kiểm tra và hiển thị thẻ thông số kỹ thuật thiết bị nếu có trong danh mục (Chỉ cho Kỹ sư và Giám đốc, ẩn khi là quá trình công nghệ)
      const eqSpecCard = document.getElementById('activity-eq-spec-card');

      if (eqSpecCard) {
        if (currentRole === 'accountant' || isProcess) {
          // Kế toán hoặc Nguồn quá trình công nghệ không hiển thị thẻ kỹ thuật máy để tránh rối mắt và nhầm lẫn
          eqSpecCard.style.display = 'none';
        } else {
          try {
            const curUser = (localStorage.getItem('gs_current_user') || '').toLowerCase();
            const userSlug = curUser.trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '') || 'guest';
            const branchEl = document.getElementById('branch-selector');
            const branchName = (branchEl && branchEl.value) ? branchEl.value : 'main';
            const branchKey = branchName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
            const storageKey = `gs_data_${curUser}_${branchKey}_equipment`;
            const eqList = JSON.parse(
              localStorage.getItem(getBranchStorageKey('equipment')) ||
              localStorage.getItem(`gs_data_${userSlug}_${branchKey}_equipment`) ||
              localStorage.getItem(storageKey) ||
              '[]'
            );
            
            const matched = eqList.find(eq => eq.name === selected.text || (selected.text && selected.text.includes(eq.name)));
            const assetCode = (matched && matched.asset) ? matched.asset : (selected.dataset.eq || 'Chưa gán mã');
            const locationName = (matched && matched.location) ? matched.location : 'Nhà xưởng';
            const brandName = (matched && matched.brand) ? matched.brand : 'Tiêu chuẩn';

            let cardContent = `
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2px;">
                <span>Thiết bị: <strong style="color: var(--color-text-primary);">${selected.text}</strong></span>
                <span style="font-family: monospace; font-size: 0.72rem; background: #e2e8f0; padding: 1px 6px; border-radius: 4px; color: #475569;">${assetCode}</span>
              </div>`;

            if (opCapacity || hourlyRate) {
              cardContent += `
                <div style="display: flex; justify-content: space-between; gap: 1rem; color: #64748b; font-size: 0.73rem; margin-top: 4px; border-top: 1px dashed #cbd5e1; padding-top: 4px;">
                  <span>Định mức: <strong style="color: #0f172a;">${hourlyRate || '—'} ${formatRateUnit(opCapUnit, selected.dataset.type)}</strong> (Tải ${opLoad}%)</span>
                  <span>Dự phóng: <strong style="color: #0284c7;">${Number(annualEstQty || 0).toLocaleString('vi-VN')} ${opCapUnit}/năm</strong></span>
                </div>`;
            }

            eqSpecCard.innerHTML = cardContent;
            eqSpecCard.style.display = 'block';
          } catch(e) {
            eqSpecCard.style.display = 'none';
          }
        }
      }
    });

    // ============================================
    // BỘ CHỌN PHƯƠNG THỨC NHẬP DỮ LIỆU HOẠT ĐỘNG
    // ============================================
    const modeBtns = document.querySelectorAll('.act-mode-btn');
    const panelHours = document.getElementById('panel-mode-hours');
    const panelMeter = document.getElementById('panel-mode-meter');
    const panelDirect = document.getElementById('panel-mode-direct');
    const inputOpHours = document.getElementById('input-op-hours');
    const inputOpLoad = document.getElementById('input-op-load');
    const inputOpRate = document.getElementById('input-op-rate');
    const inputMeterStart = document.getElementById('input-meter-start');
    const inputMeterEnd = document.getElementById('input-meter-end');
    const inputMeterMult = document.getElementById('input-meter-multiplier');
    const activityAmountInput = document.getElementById('activity-amount');
    const docInput = document.getElementById('activity-doc');
    const docLabel = document.getElementById('label-activity-doc');

    let currentActMode = 'hours';

    function switchActivityInputMode(mode) {
      currentActMode = mode;
      modeBtns.forEach(btn => {
        const isActive = btn.dataset.mode === mode;
        btn.classList.toggle('active', isActive);
        btn.style.background = isActive ? '#ffffff' : 'transparent';
        btn.style.color = isActive ? 'var(--color-primary)' : '#64748b';
        btn.style.fontWeight = isActive ? '600' : '500';
      });

      if (panelHours) panelHours.style.display = mode === 'hours' ? 'block' : 'none';
      if (panelMeter) panelMeter.style.display = mode === 'meter' ? 'block' : 'none';
      if (panelDirect) panelDirect.style.display = mode === 'direct' ? 'block' : 'none';

      if (docLabel && docInput) {
        if (mode === 'direct') {
          docLabel.innerText = 'Số hóa đơn / Chứng từ thanh toán';
          docInput.placeholder = 'Ví dụ: Hóa đơn điện, Hóa đơn xăng dầu...';
        } else if (mode === 'meter') {
          docLabel.innerText = 'Mã đồng hồ / Vị trí công tơ';
          docInput.placeholder = 'Ví dụ: Công tơ số 02 - Trạm biến áp xưởng A...';
        } else {
          docLabel.innerText = 'Nhật ký vận hành / Số ca máy';
          docInput.placeholder = 'Ví dụ: Nhật ký ca 1, Sổ vận hành máy...';
        }
      }
    }

    modeBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        switchActivityInputMode(btn.dataset.mode);
      });
    });

    // Lắng nghe sự kiện chọn tính chất ghi nhận (Chuẩn vs Dừng máy sự cố)
    const recordTypeRadios = document.querySelectorAll('input[name="act-record-type"]');
    const downtimeHintBox = document.getElementById('downtime-hint-box');

    function renderQuickReasonChips(recordType) {
      const container = document.getElementById('quick-reason-container');
      const docInput = document.getElementById('activity-doc');
      if (!container || !docInput) return;
      container.innerHTML = '';
      
      const userRole = localStorage.getItem('gs_user_role') || 'engineer';
      if (userRole === 'accountant') {
        container.style.display = 'none';
        return;
      }
      container.style.display = 'flex';

      let reasons = [];
      if (recordType === 'downtime') {
        reasons = [
          { text: 'Bảo trì định kỳ', color: '#fee2e2', border: '#fca5a5', font: '#991b1b' },
          { text: 'Sự cố hỏng hóc cơ khí', color: '#fee2e2', border: '#fca5a5', font: '#991b1b' },
          { text: 'Mất điện lưới xưởng', color: '#fee2e2', border: '#fca5a5', font: '#991b1b' },
          { text: 'Chờ vật tư / nguyên liệu', color: '#fee2e2', border: '#fca5a5', font: '#991b1b' },
          { text: 'Bảo dưỡng động cơ', color: '#fee2e2', border: '#fca5a5', font: '#991b1b' }
        ];
      } else if (recordType === 'overtime') {
        reasons = [
          { text: 'Tăng ca đơn hàng gấp', color: '#e0f2fe', border: '#7dd3fc', font: '#075985' },
          { text: 'Chạy bù sản lượng ca 3', color: '#e0f2fe', border: '#7dd3fc', font: '#075985' },
          { text: 'Tăng ca chạy mẫu mới', color: '#e0f2fe', border: '#7dd3fc', font: '#075985' }
        ];
      } else {
        reasons = [
          { text: 'Vận hành ca chuẩn', color: '#f0fdf4', border: '#86efac', font: '#166534' },
          { text: 'Chạy thử nghiệm sau kiểm định', color: '#fef3c7', border: '#fde047', font: '#854d0e' }
        ];
      }

      reasons.forEach(r => {
        const chip = document.createElement('button');
        chip.type = 'button';
        chip.innerText = r.text;
        chip.style.cssText = `font-size: 0.72rem; padding: 2px 8px; border-radius: 12px; background: ${r.color}; border: 1px solid ${r.border}; color: ${r.font}; cursor: pointer; transition: all 0.15s;`;
        chip.addEventListener('click', () => {
          const rawStart = document.getElementById('input-op-time-start')?.value;
          const rawEnd = document.getElementById('input-op-time-end')?.value;
          const tStart = formatTimeStr(rawStart);
          const tEnd = formatTimeStr(rawEnd);
          const timeStr = (tStart && tEnd) ? ` (${tStart} - ${tEnd})` : '';
          docInput.value = `${r.text}${timeStr}`;
        });
        container.appendChild(chip);
      });
    }

        recordTypeRadios.forEach(radio => {
      radio.addEventListener('change', () => {
        const titleTimeRange = document.getElementById('title-time-range');
        const labelOpHours = document.getElementById('label-op-hours');
        const selected = sourceSelect.options[sourceSelect.selectedIndex];
        let stdHours = parseFloat(selected?.dataset?.opHoursDay) || 16;
        if (currentEditingRow && currentEditingRow.dataset.stdHours) {
          stdHours = parseFloat(currentEditingRow.dataset.stdHours) || stdHours;
        }

        if (radio.checked && radio.value === 'downtime') {
          if (downtimeHintBox) downtimeHintBox.style.display = 'none';
          if (titleTimeRange) titleTimeRange.innerText = 'Khung giờ dừng máy / bảo trì';
          if (labelOpHours) labelOpHours.innerHTML = 'Số giờ bảo trì / dừng máy (h) <span style="color: red;">*</span>';
          if (docLabel) docLabel.innerText = 'Lý do bảo trì / Ghi chú (tùy chọn)';
          if (docInput) docInput.placeholder = 'Ví dụ: Bảo dưỡng định kỳ, Hỏng bạc đạn trục quay...';
          renderQuickReasonChips('downtime');
          if (inputOpHours && (parseFloat(inputOpHours.value) === stdHours || !inputOpHours.value || parseFloat(inputOpHours.value) === 0)) {
            inputOpHours.value = 4;
          }
          calcFromHours();
        } else if (radio.checked && radio.value === 'overtime') {
          if (downtimeHintBox) downtimeHintBox.style.display = 'none';
          if (titleTimeRange) titleTimeRange.innerText = 'Khung giờ tăng ca (chạy ngoài giờ)';
          if (labelOpHours) labelOpHours.innerHTML = 'Số giờ tăng ca thêm (h) <span style="color: red;">*</span>';
          if (docLabel) docLabel.innerText = 'Nội dung tăng ca / Ghi chú (tùy chọn)';
          if (docInput) docInput.placeholder = 'Ví dụ: Tăng ca đơn hàng xuất khẩu, Chạy bù sản lượng ca 3...';
          renderQuickReasonChips('overtime');
          if (inputOpHours && (parseFloat(inputOpHours.value) === stdHours || !inputOpHours.value || parseFloat(inputOpHours.value) === 0)) {
            inputOpHours.value = 2;
          }
          calcFromHours();
        } else if (radio.checked && radio.value === 'normal') {
          if (downtimeHintBox) downtimeHintBox.style.display = 'none';
          if (titleTimeRange) titleTimeRange.innerText = 'Khung giờ hoạt động tiêu chuẩn';
          if (labelOpHours) labelOpHours.innerHTML = 'Số giờ chạy ca máy (h) <span style="color: red;">*</span>';
          const userRole = localStorage.getItem('gs_user_role') || 'engineer';
          if (userRole === 'accountant') {
            if (docLabel) docLabel.innerText = 'Số hóa đơn / Chứng từ thanh toán';
            if (docInput) docInput.placeholder = 'Ví dụ: HĐ-EVN-12, Phiếu xuất kho DO...';
          } else {
            if (docLabel) docLabel.innerText = 'Nhật ký vận hành / Ca chạy máy';
            if (docInput) docInput.placeholder = 'Nhật ký ca chuẩn, Phiếu kiểm tra kỹ thuật...';
            renderQuickReasonChips('normal');
          }
          if (inputOpHours && (!inputOpHours.value || parseFloat(inputOpHours.value) === 4 || parseFloat(inputOpHours.value) === 2 || parseFloat(inputOpHours.value) === 0)) {
            inputOpHours.value = stdHours;
          }
          calcFromHours();
        }
      });
    });

        function calcFromHours() {
      const parseNum = (typeof window !== 'undefined' && typeof window.parseVnNumber === 'function') ? window.parseVnNumber : parseFloat;
      const hours = parseNum(inputOpHours?.value) || 0;
      const load = (parseNum(inputOpLoad?.value) || 100) / 100;
      let rate = parseNum(inputOpRate?.value) || 0;
      if (rate <= 0) {
        const selectedOpt = sourceSelect.options[sourceSelect.selectedIndex];
        rate = parseNum(selectedOpt?.dataset?.hourlyRate) || 0;
        if (rate <= 0 && selectedOpt?.dataset?.opCapacity) {
          const cap = parseNum(selectedOpt.dataset.opCapacity) || 0;
          const ld = (parseNum(selectedOpt.dataset.opLoad) || 80) / 100;
          if (cap > 0) rate = Math.round(cap * ld * 100) / 100;
        }
        if (rate > 0 && inputOpRate) inputOpRate.value = rate;
      }
      const recordTypeEl = document.querySelector('input[name="act-record-type"]:checked');
      const recordType = recordTypeEl ? recordTypeEl.value : 'normal';

      // Lấy giờ làm việc bình thường của máy
      const selected = sourceSelect.options[sourceSelect.selectedIndex];
      let stdHours = parseNum(selected?.dataset?.opHoursDay) || 16;
      if (currentEditingRow && currentEditingRow.dataset.stdHours) {
        stdHours = parseNum(currentEditingRow.dataset.stdHours) || stdHours;
      }

      const badge = document.getElementById('time-calc-badge');
      const docInput = document.getElementById('activity-doc');
      const tStart = document.getElementById('input-op-time-start')?.value || '';
      const tEnd = document.getElementById('input-op-time-end')?.value || '';
      const timeRangeStr = (tStart && tEnd) ? ` (${tStart} - ${tEnd})` : '';

      if (recordType === 'downtime') {
        // BẢO TRÌ / DỪNG MÁY: TỰ ĐỘNG LẤY GIỜ TIÊU CHUẨN TRỪ ĐI GIỜ DỪNG
        const downtimeHours = hours;
        const actualRunHours = Math.max(0, Math.round((stdHours - downtimeHours) * 100) / 100);
        const actualAmount = Math.round(actualRunHours * load * rate * 1000) / 1000;
        
        if (activityAmountInput) activityAmountInput.value = actualAmount;

        if (badge) {
          badge.innerHTML = `Bảo trì: <strong>${downtimeHours}h</strong> | Thực tế: <strong>${actualRunHours}h/${stdHours}h</strong>`;
          badge.style.display = 'inline-block';
          badge.style.background = '#fee2e2';
          badge.style.color = '#991b1b';
        }

        const curDoc = docInput ? docInput.value : '';
        const reasonStr = curDoc.includes('Bảo trì') ? 'Bảo trì định kỳ' : (curDoc.includes('sự cố') ? 'Sự cố hỏng hóc' : 'Bảo trì kỹ thuật');
        if (docInput && (!docInput.value || docInput.value.includes('Vận hành') || docInput.value.includes('Dừng máy') || docInput.value.includes('Nhật ký') || docInput.value.includes('Thực tế'))) {
          docInput.value = actualRunHours === 0 
            ? `Dừng máy toàn bộ ca (0h/${stdHours}h: ${reasonStr}${timeRangeStr})`
            : `Vận hành thực tế: ${actualRunHours}h/${stdHours}h (${reasonStr} ${downtimeHours}h${timeRangeStr})`;
        }
      } else if (recordType === 'overtime') {
        // CÓ TĂNG CA: TỰ ĐỘNG CỘNG GIỜ TĂNG CA VÀO GIỜ TIÊU CHUẨN
        const overtimeHours = hours;
        const actualRunHours = Math.round((stdHours + overtimeHours) * 100) / 100;
        const actualAmount = Math.round(actualRunHours * load * rate * 1000) / 1000;
        
        if (activityAmountInput) activityAmountInput.value = actualAmount;

        if (badge) {
          badge.innerHTML = `Tăng ca: <strong>+${overtimeHours}h</strong> | Thực tế: <strong>${actualRunHours}h/${stdHours}h</strong>`;
          badge.style.display = 'inline-block';
          badge.style.background = '#ecfdf5';
          badge.style.color = '#065f46';
        }

        const curDoc = docInput ? docInput.value : '';
        const otReason = curDoc.includes('gấp') ? 'Đơn hàng gấp' : (curDoc.includes('bù') ? 'Chạy bù ca 3' : 'Tăng ca sản xuất');
        if (docInput && (!docInput.value || docInput.value.includes('Vận hành') || docInput.value.includes('Dừng máy') || docInput.value.includes('Nhật ký') || docInput.value.includes('Thực tế'))) {
          docInput.value = `Vận hành thực tế: ${actualRunHours}h/${stdHours}h (${otReason} +${overtimeHours}h${timeRangeStr})`;
        }
      } else {
        // VẬN HÀNH CA TIÊU CHUẨN
        const actualHours = (hours > 0) ? hours : stdHours;
        const actualAmount = Math.round(actualHours * load * rate * 1000) / 1000;
        if (activityAmountInput) activityAmountInput.value = actualAmount;

        if (badge) {
          badge.innerHTML = `Vận hành chuẩn: <strong>${actualHours}h/ngày</strong>`;
          badge.style.display = 'inline-block';
          badge.style.background = '#e0f2fe';
          badge.style.color = '#0284c7';
        }

        if (docInput && (!docInput.value || docInput.value.includes('Vận hành') || docInput.value.includes('Thực tế'))) {
          docInput.value = `Vận hành ca ngày (${actualHours}h/ngày)`;
        }
      }
    }

    function formatTimeStr(val) {
      if (!val) return '';
      val = val.trim();
      const t = parseTime24h(val);
      if (!t) return val;
      const h = String(t.h).padStart(2, '0');
      const m = String(t.m).padStart(2, '0');
      return `${h}:${m}`;
    }

    function formatRateUnit(capUnit, sourceType) {
      if (!capUnit) return (sourceType && sourceType.toLowerCase().includes('điện')) ? 'kWh/h' : 'lít/h';
      let u = capUnit.trim();
      if (u.endsWith('/h') || u.endsWith('/giờ')) return u;
      if (u.toLowerCase() === 'kw') return 'kWh/h';
      return `${u}/h`;
    }

    function normalizeConsumptionUnit(unitStr, sourceType) {
      if (!unitStr) {
        return (sourceType && sourceType.toLowerCase().includes('điện')) ? 'kWh' : 'lít';
      }
      const u = unitStr.toLowerCase().trim();
      if (u.includes('kwh') || u.includes('kw.h')) return 'kWh';
      if (u.includes('kw') || u.includes('w')) return 'kWh';
      if (u.includes('lít') || u.includes('lit') || u === 'l' || u.startsWith('l/')) return 'lít';
      if (u.includes('kg')) return 'kg';
      if (u.includes('m3') || u.includes('m³')) return 'm³';
      if (u.includes('tấn') || u.includes('ton')) return 'tấn';
      if (u.includes('/')) {
        const num = u.split('/')[0].trim();
        if (num.includes('lít') || num.includes('lit') || num === 'l') return 'lít';
        if (num.includes('kw')) return 'kWh';
        if (num.includes('kg')) return 'kg';
        return num;
      }
      return unitStr;
    }

    function parseTime24h(val) {
      if (!val) return null;
      val = val.trim().replace(/h/i, ':');
      if (!val.includes(':')) {
        val = val + ':00';
      }
      const parts = val.split(':');
      let h = parseInt(parts[0], 10);
      let m = parseInt(parts[1] || '0', 10);
      if (isNaN(h) || isNaN(m)) return null;
      if (h < 0 || h > 23 || m < 0 || m > 59) return null;
      return { h, m, totalMinutes: h * 60 + m };
    }

    function calcDurationFromTimes() {
      const startVal = document.getElementById('input-op-time-start')?.value;
      const endVal = document.getElementById('input-op-time-end')?.value;
      const badge = document.getElementById('time-calc-badge');
      const hoursInput = document.getElementById('input-op-hours');
      
      const startT = parseTime24h(startVal);
      const endT = parseTime24h(endVal);
      if (!startT || !endT) {
        if (badge) badge.style.display = 'none';
        return;
      }
      let startMin = startT.totalMinutes;
      let endMin = endT.totalMinutes;
      if (endMin < startMin) {
        endMin += 24 * 60; // Ca máy qua đêm (ví dụ: 22:00 đến 02:00)
      }
      const diffHours = (endMin - startMin) / 60;
      const rounded = Math.round(diffHours * 100) / 100;
      if (hoursInput) {
        hoursInput.value = rounded;
        calcFromHours();
      }
      if (badge) {
        badge.innerText = `${rounded} giờ`;
        badge.style.display = 'inline-block';
      }
    }

    const inputTimeStart = document.getElementById('input-op-time-start');
    const inputTimeEnd = document.getElementById('input-op-time-end');
    if (inputTimeStart) {
      inputTimeStart.addEventListener('input', calcDurationFromTimes);
      inputTimeStart.addEventListener('change', calcDurationFromTimes);
    }
    if (inputTimeEnd) {
      inputTimeEnd.addEventListener('input', calcDurationFromTimes);
      inputTimeEnd.addEventListener('change', calcDurationFromTimes);
    }

    function calcFromMeter() {
      const parseNum = (typeof window !== 'undefined' && typeof window.parseVnNumber === 'function') ? window.parseVnNumber : parseFloat;
      const start = parseNum(inputMeterStart?.value) || 0;
      const end = parseNum(inputMeterEnd?.value) || 0;
      const mult = parseNum(inputMeterMult?.value) || 1;
      if (end >= start) {
        const total = (end - start) * mult;
        if (activityAmountInput) activityAmountInput.value = Math.round(total * 1000) / 1000;
      }
    }

    if (inputOpHours) inputOpHours.addEventListener('input', calcFromHours);
    if (inputOpLoad) inputOpLoad.addEventListener('input', calcFromHours);
    if (inputOpRate) inputOpRate.addEventListener('input', calcFromHours);

    if (inputMeterStart) inputMeterStart.addEventListener('input', calcFromMeter);
    if (inputMeterEnd) inputMeterEnd.addEventListener('input', calcFromMeter);
    if (inputMeterMult) inputMeterMult.addEventListener('input', calcFromMeter);

    const openModal = (filterType, isProductionOnly) => {
      const cleanFilter = (typeof filterType === 'string') ? filterType.trim() : '';
      const currentFilter = cleanFilter || (actHiddenFilter ? actHiddenFilter.value : '');
      const userRole = localStorage.getItem('gs_user_role') || 'engineer';
      
      const docLabel = document.getElementById('label-activity-doc');
      const managerLabel = document.getElementById('label-activity-manager');
      const docInput = document.getElementById('activity-doc');
      const sourceLabel = document.getElementById('label-activity-source');
      const amountLabel = document.getElementById('label-amount');
      const amountInput = document.getElementById('activity-amount');
      const amountHint = document.getElementById('amount-calc-hint');
      const fileLabel = document.getElementById('label-activity-file');
      const groupActMode = document.getElementById('group-act-mode');
      const groupRecordType = document.getElementById('group-record-type');
      const hintBox = document.getElementById('downtime-hint-box');
      const eqSpecCard = document.getElementById('activity-eq-spec-card');

      // Mặc định ngày hôm nay nếu chưa chọn ngày
      const dateInput = document.getElementById('activity-date');
      if (dateInput && !dateInput.value) {
        dateInput.value = new Date().toISOString().slice(0, 10);
      }
      const uInputEl = document.getElementById('activity-unit');
      if (uInputEl && !currentEditingRow) uInputEl.value = '';

      const panelHours = document.getElementById('panel-mode-hours');
      const panelMeter = document.getElementById('panel-mode-meter');
      const panelDirect = document.getElementById('panel-mode-direct');

      // Reset các trường thời gian
      const timeStartEl = document.getElementById('input-op-time-start');
      const timeEndEl = document.getElementById('input-op-time-end');
      const timeBadgeEl = document.getElementById('time-calc-badge');
      if (timeStartEl) timeStartEl.value = '';
      if (timeEndEl) timeEndEl.value = '';
      if (timeBadgeEl) timeBadgeEl.style.display = 'none';

      // Mặc định chọn tính chất vận hành chuẩn
      const radNormal = document.querySelector('input[name="act-record-type"][value="normal"]');
      if (radNormal) radNormal.checked = true;
      if (hintBox) hintBox.style.display = 'none';

      const titleTimeRange = document.getElementById('title-time-range');
      const labelOpHours = document.getElementById('label-op-hours');
      if (titleTimeRange) titleTimeRange.innerText = 'Thời gian hoạt động';
      if (labelOpHours) labelOpHours.innerHTML = 'Số giờ chạy máy <span style="color: red;">*</span>';

      if (isProductionOnly) {
        modalTitle.innerText = 'Chốt sản lượng Ca / Ngày (Quá trình công nghệ - IPPU)';
        if (groupActMode) groupActMode.style.display = 'none';
        if (groupRecordType) groupRecordType.style.display = 'none';
        if (eqSpecCard) eqSpecCard.style.display = 'none';
        if (sourceLabel) sourceLabel.innerHTML = 'Thiết bị Quá trình sản xuất (Lò luyện thép / Đúc phôi) <span style="color: red;">*</span>';
        if (amountLabel) amountLabel.innerHTML = 'Sản lượng sản phẩm ca/ngày (tấn) <span style="color: red;">*</span>';
        if (amountInput) {
          amountInput.placeholder = 'Ví dụ: 1916.93';
          amountInput.style.background = '#ffffff';
          amountInput.readOnly = false;
        }
        if (amountHint) amountHint.style.display = 'none';
        if (docLabel) docLabel.innerText = 'Số phiếu cân / Biên bản giao nhận ca';
        if (docInput) docInput.placeholder = 'Phiếu cân điện tử bàn cân cầu, Nhật ký giao nhận ca...';
        if (managerLabel) managerLabel.innerText = 'Kỹ sư xưởng luyện thép';
        if (fileLabel) fileLabel.innerText = 'Đính kèm Phiếu cân / Nhật ký ca máy (Ảnh, PDF)';
        switchActivityInputMode('direct');
        if (panelHours) panelHours.style.display = 'none';
        if (panelMeter) panelMeter.style.display = 'none';
        if (panelDirect) panelDirect.style.display = 'block';
        populateSourceDropdowns(null, true);
      } else if (userRole === 'accountant') {
        modalTitle.innerText = currentFilter ? `Thêm Hóa đơn ${currentFilter}` : `Thêm Hóa đơn / Dữ liệu kế toán`;
        if (groupActMode) groupActMode.style.display = 'none';
        if (groupRecordType) groupRecordType.style.display = 'none';
        if (eqSpecCard) eqSpecCard.style.display = 'none';
        if (sourceLabel) sourceLabel.innerHTML = 'Nguồn phát thải / Hạng mục chi phí <span style="color: red;">*</span>';
        if (amountLabel) amountLabel.innerHTML = 'Số lượng tiêu thụ trên hóa đơn <span style="color: red;">*</span>';
        if (amountInput) {
          amountInput.placeholder = 'Ví dụ: 12000';
          amountInput.style.background = '#ffffff';
          amountInput.readOnly = false;
        }
        if (amountHint) amountHint.style.display = 'none';
        if (docLabel) docLabel.innerText = 'Số hóa đơn / Chứng từ thanh toán';
        if (docInput) docInput.placeholder = 'Ví dụ: HĐ-0012948 - Petrolimex, HĐ-EVN-12...';
        if (managerLabel) managerLabel.innerText = 'Kế toán viên phụ trách';
        if (fileLabel) fileLabel.innerText = 'Đính kèm tệp Hóa đơn / Chứng từ thanh toán (PDF, Ảnh)';
        switchActivityInputMode('direct');
        if (panelHours) panelHours.style.display = 'none';
        if (panelMeter) panelMeter.style.display = 'none';
        if (panelDirect) panelDirect.style.display = 'none';
        populateSourceDropdowns(currentFilter, false);
      } else {
        modalTitle.innerText = currentFilter ? `Thêm ${currentFilter}` : `Thêm Dữ liệu hoạt động`;
        const btnDirect = document.getElementById('btn-mode-direct');
        if (btnDirect) btnDirect.style.display = 'none'; // Khóa hoàn toàn tab hóa đơn đối với kỹ sư
        if (groupRecordType) groupRecordType.style.display = '';
        if (sourceLabel) sourceLabel.innerHTML = 'Nguồn phát thải (Thiết bị) <span style="color: red;">*</span>';
        if (amountLabel) amountLabel.innerHTML = 'Lượng tiêu thụ <span style="color: red;">*</span>';
        if (amountInput) {
          amountInput.placeholder = '0.00';
          amountInput.style.background = '#f0fdf4';
          amountInput.readOnly = true; // Kỹ sư không phải nhập tay!
        }
        if (amountHint) amountHint.style.display = 'none';
        if (docLabel) docLabel.innerText = 'Nhật ký vận hành / Ca chạy máy';
        if (docInput) docInput.placeholder = 'Nhật ký ca 1, Phiếu kiểm tra kỹ thuật...';
        if (managerLabel) managerLabel.innerText = 'Kỹ sư vận hành';
        if (fileLabel) fileLabel.innerText = 'Tệp đính kèm (Nhật ký ca máy, Phiếu kiểm tra)';
        switchActivityInputMode('hours');
        renderQuickReasonChips('normal');
        populateSourceDropdowns(currentFilter, false);
      }

      activityModal.classList.add('open');

      // Tự động điền người quản lý nếu có
      const managerInput = document.getElementById('activity-manager');
      if (managerInput && !managerInput.value) {
        const curUser = (localStorage.getItem('gs_current_user') || '').toLowerCase();
        const users = JSON.parse(localStorage.getItem('gs_users') || '[]');
        const u = users.find(x => x.username === curUser || x.email === curUser);
        if (u && u.fullName) managerInput.value = u.fullName;
      }
      
      // Auto-select if there is only 1 device
      if (sourceSelect.options.length === 2) { // 1 disabled option + 1 actual option
        sourceSelect.selectedIndex = 1;
        sourceSelect.dispatchEvent(new Event('change'));
      }
    };

    const closeModal = () => {
      activityModal.classList.remove('open');
      activityForm.reset();
      infoBox.style.display = 'none';
      const eqSpecCard = document.getElementById('activity-eq-spec-card');
      if (eqSpecCard) eqSpecCard.style.display = 'none';
      if (inputOpHours) inputOpHours.value = '';
      if (inputOpLoad) inputOpLoad.value = '100';
      if (inputOpRate) inputOpRate.value = '';
      const timeStartEl = document.getElementById('input-op-time-start');
      const timeEndEl = document.getElementById('input-op-time-end');
      const timeBadgeEl = document.getElementById('time-calc-badge');
      if (timeStartEl) timeStartEl.value = '';
      if (timeEndEl) timeEndEl.value = '';
      if (timeBadgeEl) timeBadgeEl.style.display = 'none';
      const reasonContainer = document.getElementById('quick-reason-container');
      if (reasonContainer) reasonContainer.innerHTML = '';
      if (inputMeterStart) inputMeterStart.value = '';
      if (inputMeterEnd) inputMeterEnd.value = '';
      if (inputMeterMult) inputMeterMult.value = '1';
      const hintBox = document.getElementById('downtime-hint-box');
      if (hintBox) hintBox.style.display = 'none';
      const radNormal = document.querySelector('input[name="act-record-type"][value="normal"]');
      if (radNormal) radNormal.checked = true;
      const fileNameIndicator = document.getElementById('activity-file-name');
      if (fileNameIndicator) fileNameIndicator.style.display = 'none';
      const invoiceBannerEl = document.getElementById('invoice-parse-banner');
      if (invoiceBannerEl) invoiceBannerEl.style.display = 'none';
      currentEditingRow = null;
      window._currentUploadedDoc = null;
    };

    // ============================================
    // BỘ BÓC TÁCH HÓA ĐƠN ĐIỆN TỬ TỰ ĐỘNG (SMART INVOICE PARSER)
    // ============================================
    const fileInput = document.getElementById('activity-file');
    const invoiceBanner = document.getElementById('invoice-parse-banner');
    const invoiceBannerText = document.getElementById('invoice-parse-text');
    const btnCloseInvoiceBanner = document.getElementById('btn-close-invoice-banner');

    if (btnCloseInvoiceBanner && invoiceBanner) {
      btnCloseInvoiceBanner.addEventListener('click', () => {
        invoiceBanner.style.display = 'none';
      });
    }

    function applyParsedInvoiceData(result) {
      if (!result) return;
      const dateInput = document.getElementById('activity-date');
      const docInput = document.getElementById('activity-doc');
      const amountInput = document.getElementById('activity-amount');
      const unitInput = document.getElementById('activity-unit');

      if (dateInput && result.invoiceDate) {
        dateInput.value = result.invoiceDate;
      }
      if (docInput && result.documentName) {
        docInput.value = result.documentName;
      }
      if (amountInput && result.primaryItem && result.primaryItem.quantity > 0) {
        amountInput.value = result.primaryItem.quantity;
      }
      if (unitInput && result.primaryItem && result.primaryItem.unit) {
        unitInput.value = result.primaryItem.unit;
      }

      // Tự động chọn nguồn tương ứng trong dropdown
      if (result.primaryItem) {
        const targetSourceId = result.primaryItem.sourceId;
        let found = false;
        if (targetSourceId) {
          for (let i = 0; i < sourceSelect.options.length; i++) {
            if (sourceSelect.options[i].value === targetSourceId) {
              sourceSelect.selectedIndex = i;
              found = true;
              break;
            }
          }
        }
        if (!found && result.primaryItem.name) {
          const pName = result.primaryItem.name.toLowerCase();
          for (let i = 0; i < sourceSelect.options.length; i++) {
            const optText = sourceSelect.options[i].text.toLowerCase();
            if ((pName.includes('dầu') || pName.includes('diesel')) && (optText.includes('dầu') || optText.includes('diesel'))) {
              sourceSelect.selectedIndex = i;
              found = true;
              break;
            } else if ((pName.includes('điện') || pName.includes('kwh')) && (optText.includes('điện') || optText.includes('evn'))) {
              sourceSelect.selectedIndex = i;
              found = true;
              break;
            } else if ((pName.includes('xăng') || pName.includes('ron')) && (optText.includes('xăng') || optText.includes('ron'))) {
              sourceSelect.selectedIndex = i;
              found = true;
              break;
            }
          }
        }
        sourceSelect.dispatchEvent(new Event('change'));
      }

      if (amountInput) {
        amountInput.dispatchEvent(new Event('input'));
      }

      // Hiển thị thông báo bóc tách thành công
      if (invoiceBanner && invoiceBannerText && result.primaryItem) {
        invoiceBanner.style.display = 'block';
        const docInfo = result.documentName ? ' từ ' + result.documentName : '';
        const qtyFormatted = (result.primaryItem.quantity || 0).toLocaleString('vi-VN');
        invoiceBannerText.innerHTML = '<strong>Đã tự động trích xuất:</strong> ' + qtyFormatted + ' ' + (result.primaryItem.unit || '') + ' ' + (result.primaryItem.name || '') + docInfo + '. Dữ liệu đã được tự động điền.';
      }
    }

    if (fileInput) {
      fileInput.addEventListener('change', function(e) {
        const file = e.target.files && e.target.files[0];
        if (!file) return;

        const fileNameIndicator = document.getElementById('activity-file-name');
        if (fileNameIndicator) {
          fileNameIndicator.style.display = 'block';
          fileNameIndicator.innerText = 'Đã chọn tệp: ' + file.name;
        }

        const isXml = file.name.toLowerCase().endsWith('.xml') || file.type.includes('xml');
        const reader = new FileReader();

        reader.onload = function(evt) {
          const content = evt.target.result;
          let parseResult = null;
          if (isXml && window.InvoiceParser && typeof window.InvoiceParser.parseInvoiceXML === 'function') {
            parseResult = window.InvoiceParser.parseInvoiceXML(content);
          } else if (window.InvoiceParser && typeof window.InvoiceParser.parseInvoiceText === 'function') {
            parseResult = window.InvoiceParser.parseInvoiceText(content, file.name);
          }

          if (parseResult && parseResult.success && parseResult.primaryItem && parseResult.primaryItem.quantity > 0) {
            applyParsedInvoiceData(parseResult);
          }
        };

        if (isXml || file.name.toLowerCase().endsWith('.txt')) {
          reader.readAsText(file);
        } else {
          // File PDF hoặc ảnh: bóc tách theo tên file
          if (window.InvoiceParser && typeof window.InvoiceParser.parseInvoiceText === 'function') {
            const textResult = window.InvoiceParser.parseInvoiceText('', file.name);
            if (textResult && textResult.success && textResult.primaryItem && textResult.primaryItem.quantity > 0) {
              applyParsedInvoiceData(textResult);
            }
          }
        }

        // Tự động lưu trữ tệp chứng từ vật lý vào IndexedDB & Supabase Cloud Storage
        if (file && window.DocumentStorage && typeof window.DocumentStorage.saveDocument === 'function') {
          window.DocumentStorage.saveDocument(file).then(docRecord => {
            window._currentUploadedDoc = docRecord;
          }).catch(err => {
            console.warn('[Activity] Lỗi lưu trữ chứng từ:', err);
          });
        }
      });
    }

    if (btnAddActivity) {
      btnAddActivity.addEventListener('click', (e) => {
        if (e && typeof e.preventDefault === 'function') e.preventDefault();
        openModal();
      });
    }
    if (btnCloseActivity) {
      btnCloseActivity.addEventListener('click', (e) => {
        if (e && typeof e.preventDefault === 'function') e.preventDefault();
        closeModal();
      });
    }
    if (btnCancelActivity) {
      btnCancelActivity.addEventListener('click', (e) => {
        if (e && typeof e.preventDefault === 'function') e.preventDefault();
        closeModal();
      });
    }

    if (btnSaveActivity) btnSaveActivity.addEventListener('click', (e) => {
      if (e && typeof e.preventDefault === 'function') e.preventDefault();
      try {
        if (!activityForm.checkValidity()) {
          activityForm.reportValidity();
          return;
        }

        const dateEl = document.getElementById('activity-date');
        const date = (dateEl && dateEl.value) ? dateEl.value : new Date().toISOString().slice(0, 10);
        const selectedOption = sourceSelect.options[sourceSelect.selectedIndex];
        const sourceId = sourceSelect.value;
        const sourceName = selectedOption ? selectedOption.text : '';
        const rawAmtStr = String(document.getElementById('activity-amount')?.value || '0').replace(',', '.');
        const parseNum = (typeof window !== 'undefined' && typeof window.parseVnNumber === 'function') ? window.parseVnNumber : parseFloat;
        const amount = parseNum(document.getElementById('activity-amount')?.value || rawAmtStr);
        const unit = document.getElementById('activity-unit')?.value || 'lít';
        
        const doc = document.getElementById('activity-doc')?.value || '';
        const manager = document.getElementById('activity-manager')?.value || '';
        
        const fileInput = document.getElementById('activity-file');
        const hasNewFile = fileInput && fileInput.files && fileInput.files.length > 0;
        const fileName = hasNewFile ? fileInput.files[0].name : (currentEditingRow ? (currentEditingRow.dataset.fileName || '') : '');
        const docId = (hasNewFile && window._currentUploadedDoc)
          ? (window._currentUploadedDoc.docId || '')
          : (currentEditingRow ? (currentEditingRow.dataset.docId || '') : (window._currentUploadedDoc ? window._currentUploadedDoc.docId || '' : ''));
        const fileUrl = (hasNewFile && window._currentUploadedDoc)
          ? (window._currentUploadedDoc.fileUrl || '')
          : (currentEditingRow ? (currentEditingRow.dataset.fileUrl || '') : (window._currentUploadedDoc ? window._currentUploadedDoc.fileUrl || '' : ''));
        const fileType = (hasNewFile && window._currentUploadedDoc)
          ? (window._currentUploadedDoc.fileType || '')
          : (currentEditingRow ? (currentEditingRow.dataset.fileType || '') : (window._currentUploadedDoc ? window._currentUploadedDoc.fileType || '' : ''));
        
        const sourceType = selectedOption?.dataset?.type || '';
        const efName = selectedOption?.dataset?.ef || '';
        const refName = selectedOption?.dataset?.refrigerant || '';
        const customFactorStr = selectedOption?.dataset?.efFactor || '';
        const reliability = selectedOption?.dataset?.reliability || '';
        const measure = selectedOption?.dataset?.measure || '';
        const isBiomassFromOpt = (selectedOption?.dataset?.biomass === 'Có');
        
        const { factor, fuelItem } = lookupFactor(efName, refName);
        let finalFactor = customFactorStr ? parseNum(customFactorStr) : factor;
        
        const typeStr = (sourceType || '').toLowerCase();
        const eqStr = (sourceName || '').toLowerCase();
        const isWW = typeStr.includes('nước thải') || typeStr.includes('tự hoại') || eqStr.includes('nước thải') || eqStr.includes('tự hoại') || eqStr.includes('hiếu khí') || eqStr.includes('kỵ khí') || eqStr.includes('bùn') || typeStr.includes('waste');
        
        const unitLower = (unit || '').toLowerCase();
        const isEnergyOrElectricity = unitLower.includes('kwh') || unitLower.includes('wh') || unitLower.includes('mwh') ||
                                      unitLower.includes('lít') || unitLower.includes('lit') || unitLower === 'l' ||
                                      unitLower.includes('m3') || unitLower.includes('m³') ||
                                      eqStr.includes('tiêu thụ điện') || typeStr.includes('tiêu thụ điện');

        const isProcess = (selectedOption?.dataset?.isProcessEmission === 'true') ||
                          (!isEnergyOrElectricity && (
                            (typeStr.includes('quá trình công nghiệp') && !typeStr.includes('điện')) ||
                            (Boolean(selectedOption?.dataset?.productionUnit) && (unitLower.includes('tấn') || unitLower.includes('kg'))) ||
                            (modalTitle && modalTitle.innerText.includes('Chốt sản lượng')) ||
                            (eqStr.includes('quá trình') && !eqStr.includes('điện') && !eqStr.includes('kwh'))
                          ));

        const isBiomass = isBiomassFromOpt ||
                          (fuelItem && (fuelItem.isBiogenic || fuelItem.biogenic_factor)) ||
                          (efName && (efName.toLowerCase().includes('sinh khối') || efName.toLowerCase().includes('củi') || efName.toLowerCase().includes('trấu') || efName.toLowerCase().includes('mùn cưa') || efName.toLowerCase().includes('dăm gỗ') || efName.toLowerCase().includes('viên nén') || efName.toLowerCase().includes('biomass'))) ||
                          (sourceName && (sourceName.toLowerCase().includes('sinh khối') || sourceName.toLowerCase().includes('củi') || sourceName.toLowerCase().includes('trấu') || sourceName.toLowerCase().includes('mùn cưa') || sourceName.toLowerCase().includes('dăm gỗ') || sourceName.toLowerCase().includes('viên nén') || sourceName.toLowerCase().includes('biomass')));

        // Khởi tạo GWPs (Mặc định AR5)
        let ch4Gwp = 28;
        let n2oGwp = 265;
        if (typeof window !== 'undefined' && window.IPCC_DB) {
            const userStr = localStorage.getItem('gs_current_user');
            let ar = 'AR5-100';
            if (userStr) {
                try { 
                    const users = JSON.parse(localStorage.getItem('gs_users') || '[]');
                    const u = users.find(x => x.username === userStr);
                    if (u && u.company && u.company.ipccAR) ar = u.company.ipccAR;
                } catch(e){}
            }
            if (window.IPCC_DB[ar]) {
                if (window.IPCC_DB[ar]['Methane']) ch4Gwp = window.IPCC_DB[ar]['Methane'];
                if (window.IPCC_DB[ar]['Nitrous oxide']) n2oGwp = window.IPCC_DB[ar]['Nitrous oxide'];
            }
        }

        let co2eCalc = amount * finalFactor;
        let biogenicCo2 = 0;
        let wwS = 0, wwR = 0;
        
        // ƯU TIÊN 1: NẾU LÀ ĐỐT NHIÊN LIỆU (Có NCV nhiệt trị)
        if (fuelItem && fuelItem.ncv) {
          let massKg = amount;
          
          // Chuyển đổi Lít sang Kg nếu unit là lít/m3 và có tỷ trọng (density)
          const unitLower = unit.toLowerCase();
          if ((unitLower.includes('lít') || unitLower.includes('lit') || unitLower === 'l' || unitLower === 'm3') && fuelItem.density) {
              massKg = amount * fuelItem.density;
          } else if (unitLower.includes('tấn') || unitLower.includes('tan') || unitLower === 't') {
              massKg = amount * 1000;
          }
          
          // Tính năng lượng TJ: Khối lượng (kg) / 10^6 * NCV (TJ/Gg)
          const energyTJ = (massKg / 1000000) * fuelItem.ncv;
          
          // Khối lượng từng loại khí (kg)
          const co2_kg = energyTJ * (fuelItem.ef_co2_tj || 0);
          const ch4_kg = energyTJ * (fuelItem.ef_ch4_tj || 0);
          const n2o_kg = energyTJ * (fuelItem.ef_n2o_tj || 0);
          
          if (isBiomass) {
            // THEO IPCC 2006, GHG PROTOCOL VÀ ISO 14064-1:
            // CO2 sinh học (Biogenic CO2) BẮT BUỘC TÁCH RIÊNG KHỎI SCOPE 1
            // Scope 1 trực tiếp CHỈ tính các khí phát thải không phải CO2: CH4 và N2O
            co2eCalc = (ch4_kg * ch4Gwp) + (n2o_kg * n2oGwp);
            biogenicCo2 = co2_kg > 0 ? co2_kg : (massKg * (fuelItem.biogenic_factor || 1.7472));
            if (amount > 0) finalFactor = co2eCalc / amount;
          } else {
            // Nhiên liệu hóa thạch: Tổng CO2e (kg) = CO2 + (CH4 * GWP) + (N2O * GWP)
            co2eCalc = co2_kg + (ch4_kg * ch4Gwp) + (n2o_kg * n2oGwp);
            biogenicCo2 = 0;
            if (amount > 0) finalFactor = co2eCalc / amount;
          }
        } 
        // ƯU TIÊN 2: PHÁT THẢI QUÁ TRÌNH CÔNG NGHIỆP (IPPU)
        else if (!isWW && !fuelItem?.ncv && !isEnergyOrElectricity && (
          (selectedOption?.dataset?.isProcessEmission === 'true') ||
          (typeStr.includes('quá trình công nghiệp') && !typeStr.includes('điện')) ||
          (Boolean(selectedOption?.dataset?.productionUnit) && (unitLower.includes('tấn') || unitLower.includes('kg')))
        )) {
          let efNum = parseNum(customFactorStr);
          if (!efNum && factor) efNum = parseNum(factor);
          if (!efNum || efNum <= 0) {
            alert('Vui lòng kiểm tra và nhập hệ số phát thải hợp lệ (> 0) cho nguồn phát thải quá trình.');
            return;
          }
          const efUnit = (selectedOption?.dataset?.efUnit || '').toLowerCase();
          let efKg = efNum;
          if (efUnit.includes('tco2') || efUnit.includes('tấn co2') || efUnit.includes('t co2')) {
            efKg = efNum * 1000;
          } else if (efUnit.includes('kgco2') || efUnit.includes('kg co2')) {
            efKg = efNum;
          } else {
            // Bắt buộc kiểm tra đơn vị rõ ràng thay vì tự ý suy đoán theo ngưỡng <= 5
            const isTonne = (typeof confirm === 'function')
              ? confirm(`Hệ số phát thải quá trình (${efNum}) chưa có đơn vị rõ ràng trong cơ sở dữ liệu.\n\nNhấn OK nếu đơn vị là tCO2e/tấn sản phẩm (sẽ nhân 1.000 ra kgCO2e).\nNhấn Cancel nếu đơn vị là kgCO2e/tấn sản phẩm.`)
              : false;
            efKg = isTonne ? (efNum * 1000) : efNum;
          }
          finalFactor = efKg;
          co2eCalc = amount * efKg;
        } 
        // ƯU TIÊN 3: XỬ LÝ NƯỚC THẢI (CH4 từ BOD/COD theo IPCC Vol 5)
        else if (isWW) {
          if (!finalFactor || finalFactor === 0) {
            // BOD cho nước thải sinh hoạt (B0 = 0.6), COD cho nước thải công nghiệp (B0 = 0.25)
            const isIndustrialWW = typeStr.includes('công nghiệp') || eqStr.includes('công nghiệp') || unit.toLowerCase().includes('cod');
            const b0 = isIndustrialWW ? 0.25 : 0.6;
            let mcf = 0.3;
            if (eqStr.includes('tự hoại') || eqStr.includes('septic')) mcf = 0.3;
            else if (eqStr.includes('hiếu khí') || eqStr.includes('aerotank')) mcf = 0.0;
            else if (eqStr.includes('kỵ khí') || eqStr.includes('biogas')) mcf = 0.8;
            else if (eqStr.includes('hồ sinh học') || eqStr.includes('lagoon')) mcf = 0.2;
            finalFactor = b0 * mcf;
          }
          wwS = parseNum(document.getElementById('activity-ww-s')?.value) || 0;
          wwR = parseNum(document.getElementById('activity-ww-r')?.value) || 0;
          
          const ch4Emission = ((amount - wwS) * finalFactor) - wwR;
          co2eCalc = Math.max(0, ch4Emission) * ch4Gwp;
        } 
        // ƯU TIÊN 4: SINH KHỐI KHÔNG CÓ NCV
        else if (isBiomass) {
          let massKg = amount;
          const unitLower = unit.toLowerCase();
          if (unitLower.includes('tấn') || unitLower.includes('tan') || unitLower === 't') {
            massKg = amount * 1000;
          }
          const bioFactor = (fuelItem && fuelItem.biogenic_factor) ? fuelItem.biogenic_factor : 1.7472;
          const nonCo2Factor = (fuelItem && fuelItem.factor) ? fuelItem.factor : 0.038;
          co2eCalc = massKg * nonCo2Factor;
          biogenicCo2 = massKg * bioFactor;
          if (amount > 0) finalFactor = co2eCalc / amount;
        }

        // Xử lý ghi nhận tính chất Dừng máy / Bảo trì sự cố / Có tăng ca
        const recordTypeEl = document.querySelector('input[name="act-record-type"]:checked');
        const recordType = recordTypeEl ? recordTypeEl.value : 'normal';
        const isDowntime = (recordType === 'downtime');
        const isOvertime = (recordType === 'overtime');

        // Giữ nguyên dấu đại số: Cho phép lưu trữ giá trị âm cho hoạt động giảm trừ, hấp thụ LULUCF, xuất nhiệt hoặc điều chỉnh bảo trì
        let finalAmount = amount;
        let finalCo2e = (amount < 0 && co2eCalc > 0) ? -co2eCalc : co2eCalc;

        // Nếu dừng máy 100% ca thì amount = 0
        if (isDowntime && amount === 0) {
          finalAmount = 0;
          finalCo2e = 0;
          biogenicCo2 = 0;
        }

        const co2e = finalCo2e.toFixed(2);
        const now = new Date().toISOString().slice(0, 10) + ' ' + new Date().toTimeString().slice(0, 5);

        const userRole = localStorage.getItem('gs_user_role') || 'engineer';
        const docLower = (doc || '').toLowerCase();
        const isInvoice = (userRole === 'accountant') ||
                          docLower.includes('hóa đơn') || docLower.includes('hoa don') ||
                          docLower.includes('thanh toán') ||
                          docLower.includes('hđ');

        const rawStart = document.getElementById('input-op-time-start')?.value || '';
        const rawEnd = document.getElementById('input-op-time-end')?.value || '';
        const timeStart = formatTimeStr(rawStart);
        const timeEnd = formatTimeStr(rawEnd);
        let finalDoc = (doc || '').trim();
        if (timeStart && timeEnd) {
          finalDoc = finalDoc.replace(/\s*\(\s*\d{1,2}(?::\d{2})?\s*-\s*\d{1,2}(?::\d{2})?\s*\)/g, '').trim();
          finalDoc = finalDoc ? `${finalDoc} (${timeStart} - ${timeEnd})` : `(${timeStart} - ${timeEnd})`;
        }

        // Nếu kỹ sư không nhập lý do thì tạo ghi chú mặc định theo trạng thái ca
        if (!finalDoc) {
          if (isInvoice || userRole === 'accountant') {
            finalDoc = fileName ? `Hóa đơn / Tệp: ${fileName}` : 'Hóa đơn mua ngoài / Nhập kho';
          } else if (isProcess) {
            finalDoc = 'Phiếu cân ca máy - Nghiệm thu phôi thép';
          } else if (isDowntime) {
            const dtH = parseFloat(document.getElementById('input-op-hours')?.value) || 0;
            finalDoc = `Bảo trì / Giảm trừ ${dtH}h ca máy`;
          } else if (isOvertime) {
            const otH = parseFloat(document.getElementById('input-op-hours')?.value) || 0;
            finalDoc = `Tăng ca sản xuất +${otH}h`;
          } else {
            finalDoc = 'Vận hành ca chuẩn';
          }
        }

        const dataObj = {
          date, sourceId, sourceType, sourceName, amount: finalAmount, unit, doc: finalDoc, manager, co2e,
          efName, refName, finalFactor, fileName, docId, fileUrl, fileType, createdAt: now,
          isBiomass: isBiomass ? 'true' : 'false',
          biogenicCo2: biogenicCo2.toFixed(2),
          wwS: isWW ? wwS : 0, wwR: isWW ? wwR : 0,
          entryRole: userRole,
          entryMode: isProcess ? 'direct' : currentActMode,
          timeStart: isProcess ? '' : timeStart,
          timeEnd: isProcess ? '' : timeEnd,
          isInvoice: isInvoice ? 'true' : 'false',
          isDowntime: isDowntime ? 'true' : 'false',
          isOvertime: isOvertime ? 'true' : 'false',
          recordType: isProcess ? 'actual_production' : recordType,
          downtimeHours: isDowntime ? (parseFloat(document.getElementById('input-op-hours')?.value) || 0) : 0,
          overtimeHours: isOvertime ? (parseFloat(document.getElementById('input-op-hours')?.value) || 0) : 0,
          hourlyRate: document.getElementById('input-op-rate')?.value || currentEditingRow?.dataset?.hourlyRate || selectedOption?.dataset?.hourlyRate || '',
          stdHours: (currentEditingRow?.dataset?.stdHours || selectedOption?.dataset?.opHoursDay || '16'),
          isBaseline: isProcess ? 'false' : ((currentEditingRow && currentEditingRow.dataset.isBaseline === 'true') ? 'true' : 'false')
        };

        let existingBaselineRow = null;
        if (!currentEditingRow && isProcess) {
          const rows = tbody.querySelectorAll('tr:not(#no-activity-row)');
          for (const r of rows) {
            if (r.dataset.date === date && (r.dataset.sourceId === sourceId || r.dataset.sourceName === sourceName)) {
              const rType = (r.dataset.recordType || '').toLowerCase();
              const rUnit = (r.dataset.unit || '').toLowerCase();
              if (rType === 'actual_production' || r.dataset.isProcessEmission === 'true' || rUnit.includes('tấn') || r.dataset.isBaseline === 'true') {
                existingBaselineRow = r;
                if (rType === 'actual_production' || r.dataset.isBaseline !== 'true') break; // Ưu tiên dòng thực tế
              }
            }
          }
        }

        const targetRowToUpdate = currentEditingRow || existingBaselineRow;
        if (targetRowToUpdate) {
          dataObj.createdAt = targetRowToUpdate.dataset.createdAt || dataObj.createdAt;
          if (!dataObj.docId && targetRowToUpdate.dataset.docId) dataObj.docId = targetRowToUpdate.dataset.docId;
          if (!dataObj.fileUrl && targetRowToUpdate.dataset.fileUrl) dataObj.fileUrl = targetRowToUpdate.dataset.fileUrl;
          if (!dataObj.fileType && targetRowToUpdate.dataset.fileType) dataObj.fileType = targetRowToUpdate.dataset.fileType;
          Object.assign(targetRowToUpdate.dataset, dataObj);
          updateRowHTML(targetRowToUpdate, dataObj);
          currentEditingRow = null;
          window._currentUploadedDoc = null;
        } else {
          document.getElementById('no-activity-row')?.remove();
          renderRow(dataObj);
          window._currentUploadedDoc = null;
        }
        
        saveActivityList();

        // Đảm bảo dòng vừa tạo luôn hiển thị nếu bộ lọc nguồn hiện hành đang ẩn nó
        if (actHiddenFilter && actHiddenFilter.value) {
          const fVal = actHiddenFilter.value.toLowerCase().trim();
          const rVal = (dataObj.sourceType || '').toLowerCase().trim();
          const sVal = (dataObj.sourceName || '').toLowerCase().trim();
          if (rVal !== fVal && !rVal.includes(fVal) && !fVal.includes(rVal) && !sVal.includes(fVal)) {
            actHiddenFilter.value = '';
            if (actFilterInput) actFilterInput.innerText = '-- Tất cả Nguồn phát thải --';
            applyFilter('');
          }
        }

        closeModal();
      } catch (err) {
        console.error('[Activity] Lỗi khi lưu dữ liệu hoạt động:', err);
        alert('Đã xảy ra lỗi khi lưu: ' + err.message);
      }
    });

    function renderRow(data) {
      const tr = document.createElement('tr');
      tr.style.borderBottom = '1px solid var(--color-border)';
      Object.assign(tr.dataset, data);
      updateRowHTML(tr, data);
      tbody.appendChild(tr);
      // Re-apply filter
      applyFilter(actHiddenFilter.value);
    }

    function updateRowHTML(tr, data) {
      const numAmt = parseFloat(data.amount) || 0;
      const numCo2e = parseFloat(data.co2e) || 0;
      const docLower = (data.doc || '').toLowerCase();
      const unitLower = (data.unit || '').toLowerCase();
      const isDowntime = (data.isDowntime === 'true' || data.recordType === 'downtime' || docLower.includes('bảo trì') || docLower.includes('dừng máy'));
      const isOvertime = (data.isOvertime === 'true' || data.recordType === 'overtime' || docLower.includes('tăng ca'));
      const isInvoice = (data.isInvoice === 'true');
      const isActualProd = (data.recordType === 'actual_production' || data.recordType === 'production') ||
                           (unitLower.includes('tấn') && data.isBaseline !== 'true') ||
                           ((docLower.includes('phiếu cân') || docLower.includes('nghiệm thu phôi') || docLower.includes('chốt sl')) && data.isBaseline !== 'true');

      const amountHTML = (numAmt < 0)
        ? '<span style="color: #dc2626; font-weight: 600;">' + data.amount + '</span>'
        : (numAmt === 0 && isDowntime
            ? '<span style="color: #64748b; font-weight: 500;">0 (Nghỉ chạy)</span>'
            : '<span>' + data.amount + '</span>');

      const isBiomassRow = (data.isBiomass === 'true') || (data.biogenicCo2 && parseFloat(data.biogenicCo2) > 0);
      const co2eTitle = isBiomassRow
        ? `Scope 1 non-CO2: ${data.co2e} kgCO2e | Biogenic CO2: ${data.biogenicCo2 || '0'} kgCO2 (báo cáo riêng ngoài Scope 1)`
        : `${data.co2e} kgCO2e`;

      const co2eHTML = (numCo2e < 0)
        ? '<span style="color: #dc2626; font-weight: 600;" title="' + co2eTitle + '">' + data.co2e + '</span>'
        : '<span style="font-weight: 600; color: #1a7f4b;" title="' + co2eTitle + '">' + data.co2e + '</span>';

      // Cột 7: Trạng thái ca (Huy hiệu chuẩn quốc tế, đẹp mắt)
      let statusBadgeHTML = '';
      if (isDowntime) {
        statusBadgeHTML = '<span style="display:inline-block; font-size: 0.72rem; font-weight: 600; background: #fff1f2; color: #be123c; border: 1px solid #fecdd3; padding: 2px 7px; border-radius: 12px; white-space: nowrap;">Bảo trì (-)</span>';
      } else if (isOvertime) {
        statusBadgeHTML = '<span style="display:inline-block; font-size: 0.72rem; font-weight: 600; background: #f0fdf4; color: #166534; border: 1px solid #bbf7d0; padding: 2px 7px; border-radius: 12px; white-space: nowrap;">Tăng ca (+)</span>';
      } else if (isActualProd) {
        statusBadgeHTML = '<span style="display:inline-block; font-size: 0.72rem; font-weight: 700; background: #ecfdf5; color: #047857; border: 1px solid #a7f3d0; padding: 2px 8px; border-radius: 12px; white-space: nowrap;">Đã chốt SL</span>';
      } else if (data.isBaseline === 'true') {
        statusBadgeHTML = '<span style="display:inline-block; font-size: 0.72rem; font-weight: 500; background: #f8fafc; color: #64748b; border: 1px solid #e2e8f0; padding: 2px 7px; border-radius: 12px; white-space: nowrap;">Định mức</span>';
      } else if (isInvoice) {
        statusBadgeHTML = '<span style="display:inline-block; font-size: 0.72rem; font-weight: 600; background: #e0f2fe; color: #0369a1; border: 1px solid #bae6fd; padding: 2px 7px; border-radius: 12px; white-space: nowrap;">Hóa đơn</span>';
      } else {
        statusBadgeHTML = '<span style="display:inline-block; font-size: 0.72rem; font-weight: 500; background: #f8fafc; color: #475569; border: 1px solid #e2e8f0; padding: 2px 7px; border-radius: 12px; white-space: nowrap;">Ca chuẩn</span>';
      }

      let biomassBadgeHTML = '';
      if (isBiomassRow) {
        const bioAmt = parseFloat(data.biogenicCo2) || 0;
        const bioDisplay = bioAmt >= 1000 ? `${(bioAmt / 1000).toFixed(2)} tấn CO2 sinh học` : `${bioAmt.toFixed(2)} kg CO2 sinh học`;
        biomassBadgeHTML = `<span style="display:inline-block; font-size: 0.72rem; font-weight: 600; background: #ecfdf5; color: #065f46; border: 1px solid #6ee7b7; padding: 2px 7px; border-radius: 12px; white-space: nowrap; margin-left: 3px;" title="Biogenic CO2: ${bioDisplay} (Tách riêng ngoài Scope 1 theo ISO 14064-1)">Sinh khối (Biogenic)</span>`;
      }

      // Cột 8: Nhật ký / Chi tiết (Ghi rõ giờ và lý do, làm sạch nếu lặp từ trước)
      let cleanDoc = (data.doc || '').trim();
      cleanDoc = cleanDoc.replace(/(?:\s*\(\s*\d{1,2}(?::\d{2})?\s*-\s*\d{1,2}(?::\d{2})?\s*\))+/g, (m) => {
        const parts = m.match(/\(\s*\d{1,2}(?::\d{2})?\s*-\s*\d{1,2}(?::\d{2})?\s*\)/g);
        return ' ' + (parts ? parts[parts.length - 1] : m);
      }).trim();
      cleanDoc = cleanDoc.replace(/\(\s*(\d{1,2})(?::(\d{2}))?\s*-\s*(\d{1,2})(?::(\d{2}))?\s*\)/g, (m, h1, m1, h2, m2) => {
        const start = String(h1).padStart(2, '0') + ':' + (m1 || '00');
        const end = String(h2).padStart(2, '0') + ':' + (m2 || '00');
        return `(${start} - ${end})`;
      });

      // Nếu là hóa đơn kế toán mà ghi chú bị lẫn từ ngữ kỹ thuật ca chuẩn, hiển thị đúng bản chất kế toán
      if (isInvoice && (!cleanDoc || cleanDoc === 'Vận hành ca chuẩn' || cleanDoc.includes('Ca chuẩn') || cleanDoc.includes('Vận hành ca'))) {
        cleanDoc = data.docNo ? `Hóa đơn: ${data.docNo}` : 'Hóa đơn mua ngoài / Nhập kho';
      }

      const logDetailHTML = `<span style="color: #334155;">${cleanDoc || '—'}</span>`;

      // Cột 9: Chứng từ / Tệp đính kèm (Chỉ hiển thị khi có tệp thực tế được tải lên)
      let docFileHTML = '';
      if (data.fileName || data.docId || data.fileUrl) {
        const displayDocName = data.fileName || 'Tệp đính kèm';
        docFileHTML = `<button type="button" class="btn-view-proof" style="display:inline-flex; align-items: center; gap: 4px; max-width: 145px; background: #eff6ff; border: 1px solid #bfdbfe; color: #1d4ed8; padding: 2px 7px; border-radius: 4px; font-size: 0.72rem; cursor: pointer; text-align: left; font-weight: 500;" title="Nhấp để xem hoặc tải tệp chứng từ: ${displayDocName}"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink: 0;"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg><span style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${displayDocName}</span></button>`;
      } else {
        docFileHTML = '<span style="color: #94a3b8;">—</span>';
      }

      // Chuẩn hóa đơn vị tiêu thụ (kWh hoặc lít thay vì kW hay lít/h)
      const normalizedUnit = normalizeConsumptionUnit(data.unit, data.sourceType);

      // Bảo vệ phân quyền dữ liệu giữa Kế toán và Kỹ sư (Kiểm tra động theo vai trò hiện thời)
      function getEditPermission() {
        const activeRoleNow = localStorage.getItem('gs_user_role') || 'director';
        const isAccRecord = (data.entryRole === 'accountant') || (!data.entryRole && data.isInvoice === 'true');
        const isEngRecord = (data.entryRole === 'engineer') || (!data.entryRole && (data.entryMode === 'hours' || data.entryMode === 'meter' || data.isBaseline === 'true' || data.isDowntime === 'true'));

        if (activeRoleNow === 'accountant' && isEngRecord && !isAccRecord) {
          return { allowed: false, msg: 'Chỉ Kỹ sư hoặc Giám đốc mới có thể chỉnh sửa nhật ký kỹ thuật máy.' };
        }
        if (activeRoleNow === 'engineer' && isAccRecord && !isEngRecord) {
          return { allowed: false, msg: 'Chỉ Kế toán hoặc Giám đốc mới có thể chỉnh sửa hóa đơn kế toán.' };
        }
        return { allowed: true, msg: '' };
      }

      const initialPerm = getEditPermission();
      const actionBtnStyle = initialPerm.allowed 
        ? 'background:transparent;border:none;cursor:pointer;padding:0;' 
        : 'background:transparent;border:none;cursor:not-allowed;padding:0;opacity:0.35;';

      // Hiển thị thứ trong tuần (CN, T7, T2..T6) để kỹ sư dễ nhận biết ngày nghỉ
      let dateDisplay = data.date || '';
      if (data.date) {
        const normDate = data.date.trim().replace(/[ /]/g, '-');
        const parts = normDate.split('-');
        if (parts.length === 3) {
          const dObj = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
          if (!isNaN(dObj.getTime())) {
            const dow = dObj.getDay();
            const dayLabels = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
            const dowLabel = dayLabels[dow];
            if (dow === 0) {
              dateDisplay = `${normDate} <span style="display:inline-block; margin-left: 4px; padding: 1px 5px; border-radius: 4px; font-size: 0.68rem; font-weight: 700; background: #fee2e2; color: #dc2626;" title="Chủ nhật (Ngày nghỉ tuần)">CN</span>`;
            } else if (dow === 6) {
              dateDisplay = `${normDate} <span style="display:inline-block; margin-left: 4px; padding: 1px 5px; border-radius: 4px; font-size: 0.68rem; font-weight: 700; background: #fef3c7; color: #d97706;" title="Thứ 7">T7</span>`;
            } else {
              dateDisplay = `${normDate} <span style="display:inline-block; margin-left: 4px; padding: 1px 5px; border-radius: 4px; font-size: 0.68rem; color: #64748b; background: #f1f5f9;" title="Thứ ${dow + 1}">${dowLabel}</span>`;
            }
          }
        }
      }

      tr.innerHTML = `
        <td style="width: 138px; min-width: 138px; padding:0.45rem 0.55rem; white-space: nowrap; font-size: 0.78rem; overflow: visible;">${dateDisplay}</td>
        <td style="padding:0.45rem 0.55rem; font-size: 0.78rem; font-weight: 500;">${data.sourceName}</td>
        <td style="padding:0.45rem 0.55rem; text-align: right; font-size: 0.78rem; color: #475569;">
          ${data.finalFactor ? parseFloat(Number(data.finalFactor).toFixed(4)) : '0'}
        </td>
        <td style="padding:0.45rem 0.55rem; text-align: right; font-size: 0.78rem; font-weight: 600;">${amountHTML}</td>
        <td style="padding:0.45rem 0.55rem; text-align: center; font-size: 0.78rem; color: #64748b;">${normalizedUnit}</td>
        <td style="padding:0.45rem 0.55rem; text-align: right; font-size: 0.78rem;">${co2eHTML}</td>
        <td style="padding:0.45rem 0.55rem; text-align: center;">${statusBadgeHTML} ${biomassBadgeHTML}</td>
        <td style="padding:0.45rem 0.55rem; font-size: 0.78rem;">${logDetailHTML}</td>
        <td style="padding:0.45rem 0.55rem; font-size: 0.78rem;">${docFileHTML}</td>
        <td style="padding:0.45rem 0.55rem; font-size: 0.78rem; color: #64748b;">${data.manager || '—'}</td>
        <td style="padding:0.45rem 0.55rem; text-align: center;">
          <div style="display:flex;gap:6px;align-items:center;justify-content:center;">
            <button class="btn-edit-act" style="${actionBtnStyle}" title="${initialPerm.allowed ? 'Sửa' : initialPerm.msg}"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:block;"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg></button>
            <button class="btn-delete-act" style="${actionBtnStyle}" title="${initialPerm.allowed ? 'Xóa' : initialPerm.msg}"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#dc2626" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:block;"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg></button>
          </div>
        </td>
      `;

      tr._searchIndex = `${data.date || ''} ${data.sourceName || ''} ${data.sourceType || ''} ${data.doc || ''} ${data.docNo || ''} ${data.manager || ''} ${data.amount || ''} ${normalizedUnit || ''} ${data.co2e || ''}`.toLowerCase();

      const btnViewProof = tr.querySelector('.btn-view-proof');
      if (btnViewProof) {
        btnViewProof.addEventListener('click', (e) => {
          e.stopPropagation();
          if (window.DocumentStorage && typeof window.DocumentStorage.openViewer === 'function') {
            window.DocumentStorage.openViewer({
              docId: data.docId || tr.dataset.docId || '',
              fileName: data.fileName || tr.dataset.fileName || data.docNo || cleanDoc || 'Chung_tu_phat_thai',
              fileUrl: data.fileUrl || tr.dataset.fileUrl || '',
              fileType: data.fileType || tr.dataset.fileType || ''
            });
          }
        });
      }

      tr.querySelector('.btn-edit-act')?.addEventListener('click', () => {
        const perm = getEditPermission();
        if (!perm.allowed) {
          alert(perm.msg);
          return;
        }
        currentEditingRow = tr;

        const docLower = (data.doc || '').toLowerCase();
        const typeLower = (data.sourceType || '').toLowerCase();
        const nameLower = (data.sourceName || '').toLowerCase();
        const unitLower = (data.unit || '').toLowerCase();

        // 1. Kiểm tra loại trừ: Nếu đơn vị là năng lượng / điện / nhiên liệu (kWh, MWh, lít, m3) thì TUYỆT ĐỐI KHÔNG phải IPPU
        const isEnergyOrFuel = unitLower.includes('kwh') || unitLower.includes('wh') || unitLower.includes('mwh') ||
                               unitLower.includes('lít') || unitLower.includes('lit') || unitLower === 'l' ||
                               unitLower.includes('m3') || unitLower.includes('m³') ||
                               nameLower.includes('tiêu thụ điện') || typeLower.includes('tiêu thụ điện') ||
                               (nameLower.includes('kwh') && !nameLower.includes('ippu'));

        // 2. Chỉ coi là dòng phát thải quá trình IPPU khi không phải điện/nhiên liệu và mang đặc trưng IPPU sản phẩm
        const isRowProcess = !isEnergyOrFuel && (
          data.isProcessEmission === 'true' ||
          data.recordType === 'production' ||
          data.recordType === 'actual_production' ||
          data.recordType === 'baseline_production' ||
          ((unitLower.includes('tấn') || unitLower.includes('tan') || unitLower === 't') && (
            typeLower.includes('quá trình') || typeLower.includes('công nghệ') ||
            nameLower.includes('ippu') || nameLower.includes('quá trình') ||
            docLower.includes('công nghệ') || docLower.includes('phiếu cân')
          ))
        );
        
        // Open modal for this row without permanently overwriting user's page filter
        const rowType = data.sourceType || '';
        if (isRowProcess) {
          openModal(null, true);
        } else {
          openModal(rowType, false);
        }

        const userRole = localStorage.getItem('gs_user_role') || 'engineer';
        if (isRowProcess) {
          modalTitle.innerText = 'Chỉnh sửa Sản lượng Ca / Ngày (Quá trình công nghệ - IPPU)';
        } else if (userRole === 'accountant') {
          modalTitle.innerText = 'Chỉnh sửa Hóa đơn / Dữ liệu kế toán';
        } else {
          modalTitle.innerText = 'Chỉnh sửa Dữ liệu hoạt động';
        }

        setTimeout(() => {
          document.getElementById('activity-date').value = data.date;
          if (data.sourceId) {
            sourceSelect.value = data.sourceId;
          }
          if (sourceSelect.value !== data.sourceId) {
            for (let i = 0; i < sourceSelect.options.length; i++) {
              if (sourceSelect.options[i].value === data.sourceId || sourceSelect.options[i].text === data.sourceName) {
                sourceSelect.selectedIndex = i;
                break;
              }
            }
          }
          sourceSelect.dispatchEvent(new Event('change'));

          if (isRowProcess) {
            modalTitle.innerText = 'Chỉnh sửa Sản lượng Ca / Ngày (Quá trình công nghệ - IPPU)';
            const groupActMode = document.getElementById('group-act-mode');
            const groupRecordType = document.getElementById('group-record-type');
            const eqSpecCard = document.getElementById('activity-eq-spec-card');
            const panelHours = document.getElementById('panel-mode-hours');
            const panelMeter = document.getElementById('panel-mode-meter');
            const panelDirect = document.getElementById('panel-mode-direct');
            const sourceLabel = document.getElementById('label-activity-source');
            const amountLabel = document.getElementById('label-amount');
            const amountInput = document.getElementById('activity-amount');
            const docLabel = document.getElementById('label-activity-doc');
            const managerLabel = document.getElementById('label-activity-manager');
            const fileLabel = document.getElementById('label-activity-file');

            if (groupActMode) groupActMode.style.display = 'none';
            if (groupRecordType) groupRecordType.style.display = 'none';
            if (eqSpecCard) eqSpecCard.style.display = 'none';
            if (panelHours) panelHours.style.display = 'none';
            if (panelMeter) panelMeter.style.display = 'none';
            if (panelDirect) panelDirect.style.display = 'block';
            switchActivityInputMode('direct');

            if (sourceLabel) sourceLabel.innerHTML = 'Thiết bị Quá trình sản xuất (Lò luyện thép / Đúc phôi) <span style="color: red;">*</span>';
            if (amountLabel) amountLabel.innerHTML = 'Sản lượng sản phẩm ca/ngày (tấn) <span style="color: red;">*</span>';
            if (amountInput) {
              amountInput.placeholder = 'Ví dụ: 1916.93';
              amountInput.style.background = '#ffffff';
              amountInput.readOnly = false;
              amountInput.value = Math.abs(parseFloat(data.amount) || 0);
            }
            const unitInput = document.getElementById('activity-unit');
            if (unitInput) unitInput.value = data.unit || 'tấn';

            if (docLabel) docLabel.innerText = 'Số phiếu cân / Biên bản giao nhận ca';
            const docInput = document.getElementById('activity-doc');
            if (docInput) {
              docInput.value = data.doc || '';
              docInput.placeholder = 'Phiếu cân điện tử bàn cân cầu, Nhật ký giao nhận ca...';
            }
            if (managerLabel) managerLabel.innerText = 'Kỹ sư xưởng luyện thép';
            const managerInput = document.getElementById('activity-manager');
            if (managerInput) managerInput.value = data.manager || '';
            if (fileLabel) fileLabel.innerText = 'Đính kèm Phiếu cân / Nhật ký ca máy (Ảnh, PDF)';
          } else if (userRole !== 'accountant') {
            // Khôi phục tính chất Dừng máy hay Vận hành chuẩn hay Có tăng ca
            const isRowDowntime = (data.isDowntime === 'true' || data.recordType === 'downtime' || docLower.includes('bảo trì') || docLower.includes('dừng máy'));
            const isRowOvertime = (data.isOvertime === 'true' || data.recordType === 'overtime' || docLower.includes('tăng ca'));
            let recordTypeVal = 'normal';
            if (isRowDowntime) recordTypeVal = 'downtime';
            else if (isRowOvertime) recordTypeVal = 'overtime';

            const radTarget = document.querySelector(`input[name="act-record-type"][value="${recordTypeVal}"]`);
            if (radTarget) {
              radTarget.checked = true;
              radTarget.dispatchEvent(new Event('change'));
            }

            // Điền số giờ tương ứng vào ô nhập
            const opHoursInput = document.getElementById('input-op-hours');
            if (opHoursInput) {
              if (recordTypeVal === 'downtime') {
                let dtHours = parseFloat(data.downtimeHours);
                if (isNaN(dtHours) || dtHours <= 0) {
                  const m = (data.doc || '').match(/(\d+(?:\.\d+)?)\s*h/i);
                  dtHours = m ? parseFloat(m[1]) : 4;
                }
                opHoursInput.value = dtHours;
              } else if (recordTypeVal === 'overtime') {
                let otHours = parseFloat(data.overtimeHours);
                if (isNaN(otHours) || otHours <= 0) {
                  const m = (data.doc || '').match(/\+(\d+(?:\.\d+)?)\s*h/i);
                  otHours = m ? parseFloat(m[1]) : 2;
                }
                opHoursInput.value = otHours;
              } else {
                let stdH = parseFloat(data.stdHours) || parseFloat(data.opHours);
                if (isNaN(stdH) || stdH <= 0) {
                  const m = (data.doc || '').match(/(\d+(?:\.\d+)?)\s*h/i);
                  stdH = m ? parseFloat(m[1]) : 16;
                }
                opHoursInput.value = stdH;
              }
            }
            if (inputOpRate) {
              const selectedOpt = sourceSelect.options[sourceSelect.selectedIndex];
              let rRate = data.hourlyRate || selectedOpt?.dataset?.hourlyRate;
              if (!rRate || parseFloat(rRate) <= 0) {
                const cap = parseFloat(selectedOpt?.dataset?.opCapacity) || 0;
                const load = (parseFloat(selectedOpt?.dataset?.opLoad) || 80) / 100;
                if (cap > 0) rRate = Math.round(cap * load * 100) / 100;
                else {
                  const stdH = parseFloat(data.stdHours) || parseFloat(selectedOpt?.dataset?.opHoursDay) || 16;
                  const stdAmt = parseFloat(data.stdAmount) || parseFloat(data.amount) || 0;
                  if (stdH > 0 && stdAmt > 0) rRate = Math.round((stdAmt / stdH) * 100) / 100;
                }
              }
              inputOpRate.value = rRate || '';
            }
            calcFromHours();
          } else {
            // Đảm bảo các thành phần kỹ thuật luôn ẩn khi kế toán chỉnh sửa
            if (panelHours) panelHours.style.display = 'none';
            if (panelMeter) panelMeter.style.display = 'none';
            if (panelDirect) panelDirect.style.display = 'none';
            const eqSpecCard = document.getElementById('activity-eq-spec-card');
            if (eqSpecCard) eqSpecCard.style.display = 'none';
            const groupActMode = document.getElementById('group-act-mode');
            if (groupActMode) groupActMode.style.display = 'none';
            const groupRecordType = document.getElementById('group-record-type');
            if (groupRecordType) groupRecordType.style.display = 'none';
            const amountInput = document.getElementById('activity-amount');
            if (amountInput) {
              amountInput.style.background = '#ffffff';
              amountInput.readOnly = false;
            }
          }

          if (!isRowProcess) {
            document.getElementById('activity-amount').value = Math.abs(parseFloat(data.amount) || 0);
            document.getElementById('activity-unit').value = data.unit;
            document.getElementById('activity-doc').value = data.doc || '';
            document.getElementById('activity-manager').value = data.manager || '';

            const timeStartEl = document.getElementById('input-op-time-start');
            const timeEndEl = document.getElementById('input-op-time-end');
            if (timeStartEl) timeStartEl.value = data.timeStart || '';
            if (timeEndEl) timeEndEl.value = data.timeEnd || '';
            if (data.timeStart && data.timeEnd) {
              calcDurationFromTimes();
            }
          }

          const fileNameIndicator = document.getElementById('activity-file-name');
          if (data.fileName) {
            fileNameIndicator.innerText = `Đã đính kèm: ${data.fileName}`;
            fileNameIndicator.style.display = 'block';
            window._currentUploadedDoc = {
              docId: data.docId || '',
              fileName: data.fileName || '',
              fileUrl: data.fileUrl || '',
              fileType: data.fileType || ''
            };
          } else {
            fileNameIndicator.style.display = 'none';
            window._currentUploadedDoc = null;
          }
        }, 50);
      });

      tr.querySelector('.btn-delete-act')?.addEventListener('click', () => {
        const perm = getEditPermission();
        if (!perm.allowed) {
          alert(perm.msg);
          return;
        }
        if (confirm('Bạn có chắc chắn muốn xóa dữ liệu này?')) {
          tr.remove();
          if (tbody.children.length === 0) {
            tbody.innerHTML = '<tr id="no-activity-row"><td colspan="11" style="text-align: center; color: var(--color-text-secondary); padding: 3rem;">Chưa có dữ liệu</td></tr>';
          }
          saveActivityList();
        }
      });
    }

    const branchSelector = document.getElementById('branch-selector');
    if (branchSelector) {
      branchSelector.addEventListener('change', () => {
        setTimeout(() => {
          loadActivityList();
          if (actFilterInput) actFilterInput.innerText = '-- Tất cả Nguồn phát thải --';
          if (actHiddenFilter) actHiddenFilter.value = '';
        }, 100);
      });
    }

    const btnSyncIpcc = document.getElementById('btn-sync-ipcc');
    if (btnSyncIpcc) {
      btnSyncIpcc.addEventListener('click', () => {
        if (!window.IPCC_DB) return;
        
        const currentUser = localStorage.getItem('gs_current_user') || 'guest';
        const users = JSON.parse(localStorage.getItem('gs_users') || '[]');
        const userIndex = users.findIndex(u => u.username === currentUser);
        const user = userIndex !== -1 ? users[userIndex] : null;
        const currentAR = (user && user.company && user.company.ipccAR) ? user.company.ipccAR : 'AR5-100';
        
        const targetAR = currentAR;
        
        const storageKey = getBranchStorageKey('activity');
        let activities = JSON.parse(localStorage.getItem(storageKey) || '[]');
        let changed = false;
        
        activities.forEach(act => {
            const typeStr = (act.sourceType || '').toLowerCase();
            const eqStr = (act.sourceName || '').toLowerCase();
            const isWW = typeStr.includes('nước thải') || typeStr.includes('tự hoại') || eqStr.includes('nước thải') || eqStr.includes('tự hoại') || eqStr.includes('hiếu khí') || eqStr.includes('kỵ khí') || eqStr.includes('bùn') || typeStr.includes('waste');
            
            const ch4Gwp = (window.IPCC_DB[targetAR] && window.IPCC_DB[targetAR]['Methane']) ? window.IPCC_DB[targetAR]['Methane'] : 28;
            const n2oGwp = (window.IPCC_DB[targetAR] && window.IPCC_DB[targetAR]['Nitrous oxide']) ? window.IPCC_DB[targetAR]['Nitrous oxide'] : 265;
            
            if (isWW) {
                const ch4Emission = ((act.amount - (act.wwS || 0)) * act.finalFactor) - (act.wwR || 0);
                const co2eCalc = Math.max(0, ch4Emission) * ch4Gwp;
                if (act.co2e !== co2eCalc.toFixed(2)) {
                    act.co2e = co2eCalc.toFixed(2);
                    changed = true;
                }
            } else if (act.efName && window.EF_MASTER) {
                let fuelItem = null;
                for (const stdKey in EF_MASTER) {
                    for (const cat in EF_MASTER[stdKey]) {
                        for (const key in EF_MASTER[stdKey][cat]) {
                            const item = EF_MASTER[stdKey][cat][key];
                            if (item.name === act.efName || (act.efName.includes(item.name))) {
                                fuelItem = item; break;
                            }
                        }
                    }
                }
                if (fuelItem && fuelItem.ncv) {
                    let massKg = act.amount;
                    const unitLower = (act.unit || '').toLowerCase();
                    if ((unitLower.includes('lít') || unitLower.includes('lit') || unitLower === 'l' || unitLower === 'm3') && fuelItem.density) {
                        massKg = act.amount * fuelItem.density;
                    } else if (unitLower.includes('tấn') || unitLower.includes('tan') || unitLower === 't') {
                        massKg = act.amount * 1000;
                    }
                    const energyTJ = (massKg / 1000000) * fuelItem.ncv;
                    const co2_kg = energyTJ * (fuelItem.ef_co2_tj || 0);
                    const ch4_kg = energyTJ * (fuelItem.ef_ch4_tj || 0);
                    const n2o_kg = energyTJ * (fuelItem.ef_n2o_tj || 0);
                    
                    const isActBiomass = (act.isBiomass === 'true') || fuelItem.isBiogenic || fuelItem.biogenic_factor;
                    let co2eCalc = 0;
                    if (isActBiomass) {
                        co2eCalc = (ch4_kg * ch4Gwp) + (n2o_kg * n2oGwp);
                        const bioCo2 = (co2_kg > 0 ? co2_kg : (massKg * (fuelItem.biogenic_factor || 1.7472))).toFixed(2);
                        if (act.biogenicCo2 !== bioCo2 || act.isBiomass !== 'true') {
                            act.biogenicCo2 = bioCo2;
                            act.isBiomass = 'true';
                            changed = true;
                        }
                    } else {
                        co2eCalc = co2_kg + (ch4_kg * ch4Gwp) + (n2o_kg * n2oGwp);
                    }
                    const newFactor = act.amount > 0 ? (co2eCalc / act.amount) : act.finalFactor;
                    
                    if (act.co2e !== co2eCalc.toFixed(2) || act.finalFactor !== newFactor) {
                        act.co2e = co2eCalc.toFixed(2);
                        act.finalFactor = newFactor;
                        changed = true;
                    }
                }
            }
            
            if (act.refName) {
                if (window.IPCC_DB[targetAR] && window.IPCC_DB[targetAR][act.refName] !== undefined) {
                    act.finalFactor = window.IPCC_DB[targetAR][act.refName];
                    const co2eCalc = act.amount * act.finalFactor;
                    if (act.co2e !== co2eCalc.toFixed(2)) {
                        act.co2e = co2eCalc.toFixed(2);
                        changed = true;
                    }
                }
            }
        });
        
        if (changed) {
            safeSaveActivities(storageKey, activities);
            loadActivityList();
            if (typeof updateDashboard === 'function') updateDashboard();
            alert(`Thành công! Đã cập nhật hệ thống và tính toán lại toàn bộ dữ liệu theo chuẩn ${targetAR}.`);
        } else {
            alert(`Dữ liệu đã chuẩn xác theo ${targetAR}, không có bản ghi nào cần thay đổi.`);
        }
      });
    }

    // TOW Calculator Logic
    const btnCalcTow = document.getElementById('btn-calc-tow');
    const towModal = document.getElementById('tow-modal');
    const tabTow1 = document.getElementById('tab-tow-1');
    const tabTow2 = document.getElementById('tab-tow-2');
    const towContent1 = document.getElementById('tow-content-1');
    const towContent2 = document.getElementById('tow-content-2');
    const btnCancelTow = document.getElementById('btn-cancel-tow');
    const btnApplyTow = document.getElementById('btn-apply-tow');

    let currentTowTab = 1;

    if (btnCalcTow && towModal) {
      btnCalcTow.addEventListener('click', () => {
        towModal.style.display = 'flex';
      });

      tabTow1.addEventListener('click', () => {
        currentTowTab = 1;
        tabTow1.className = 'btn btn-primary';
        tabTow1.style.background = '';
        tabTow1.style.color = '';
        
        tabTow2.className = 'btn btn-secondary';
        tabTow2.style.background = '#e5e7eb';
        tabTow2.style.color = '#374151';
        
        towContent1.style.display = 'block';
        towContent2.style.display = 'none';
      });

      tabTow2.addEventListener('click', () => {
        currentTowTab = 2;
        tabTow2.className = 'btn btn-primary';
        tabTow2.style.background = '';
        tabTow2.style.color = '';
        
        tabTow1.className = 'btn btn-secondary';
        tabTow1.style.background = '#e5e7eb';
        tabTow1.style.color = '#374151';
        
        towContent1.style.display = 'none';
        towContent2.style.display = 'block';
      });

      btnCancelTow.addEventListener('click', () => {
        towModal.style.display = 'none';
      });

      btnApplyTow.addEventListener('click', () => {
        let calculatedTow = 0;
        if (currentTowTab === 1) {
          const vol = parseFloat(document.getElementById('tow-volume').value) || 0;
          const bod = parseFloat(document.getElementById('tow-bod-concentration').value) || 0;
          calculatedTow = (vol * bod) / 1000;
        } else {
          const emp = parseFloat(document.getElementById('tow-employees').value) || 0;
          const days = parseFloat(document.getElementById('tow-days').value) || 0;
          const factor = parseFloat(document.getElementById('tow-bod-factor').value) || 0;
          calculatedTow = emp * days * factor;
        }
        
        const amountInput = document.getElementById('activity-amount');
        if (amountInput) amountInput.value = calculatedTow.toFixed(2);
        
        towModal.style.display = 'none';
      });
    }

    // S & R Calculator Logic
    const btnCalcS = document.getElementById('btn-calc-s');
    const btnCalcR = document.getElementById('btn-calc-r');
    const sModal = document.getElementById('s-modal');
    const rModal = document.getElementById('r-modal');
    
    if (btnCalcS && sModal) {
      btnCalcS.addEventListener('click', () => sModal.style.display = 'flex');
      document.getElementById('btn-cancel-s').addEventListener('click', () => sModal.style.display = 'none');
      document.getElementById('btn-apply-s').addEventListener('click', () => {
        const mass = parseFloat(document.getElementById('s-mass').value) || 0;
        const dry = (parseFloat(document.getElementById('s-dry').value) || 0) / 100;
        const organic = (parseFloat(document.getElementById('s-organic').value) || 0) / 100;
        const calcS = mass * dry * organic;
        document.getElementById('activity-ww-s').value = calcS.toFixed(2);
        sModal.style.display = 'none';
      });
    }

    if (btnCalcR && rModal) {
      btnCalcR.addEventListener('click', () => rModal.style.display = 'flex');
      document.getElementById('btn-cancel-r').addEventListener('click', () => rModal.style.display = 'none');
      document.getElementById('btn-apply-r').addEventListener('click', () => {
        const vol = parseFloat(document.getElementById('r-volume').value) || 0;
        const ch4 = (parseFloat(document.getElementById('r-ch4').value) || 0) / 100;
        const calcR = vol * ch4 * 0.657;
        document.getElementById('activity-ww-r').value = calcR.toFixed(2);
        rModal.style.display = 'none';
      });
    }

    // ============================================================
    // BẢNG THEO DÕI TIÊU THỤ & VẬN HÀNH THIẾT BỊ (EXECUTIVE TABLE)
    // ============================================================
        // ============================================================
    // TRÍCH XUẤT THIẾT BỊ & NGUỒN PHÁT THẢI THEO PHƯƠNG THỨC KỸ THUẬT & SẢN LƯỢNG
    // ============================================================
    function getMachineSources() {
      const sourceRows = document.querySelectorAll('#source-tbody tr:not(#no-source-row)');
      const machineSources = [];
      sourceRows.forEach(row => {
        const measure = (row.dataset.measure || '').toLowerCase();
        const opCap = parseFloat(row.dataset.opCapacity || row.dataset.capacity) || 0;
        const eqName = row.dataset.eq || row.dataset.type || '';
        const isProc = row.dataset.isProcessEmission === 'true' || 
                       measure.includes('sản lượng') || 
                       Boolean(row.dataset.productionUnit) ||
                       (row.dataset.category && row.dataset.category.includes('công nghiệp'));
        const loadVal = parseFloat(row.dataset.opLoad) || (isProc ? 100 : 80);
        const hRate = parseFloat(row.dataset.hourlyRate) || (opCap > 0 ? Math.round(opCap * (loadVal / 100) * 1000) / 1000 : 0);

        if (measure.includes('tự đánh giá') || measure.includes('liên tục') || measure.includes('đo') || measure.includes('ước tính') || opCap > 0 || hRate > 0 || isProc) {
          machineSources.push({
            id: row.dataset.id,
            name: isProc ? `${row.dataset.type || 'Quá trình luyện thép'}${row.dataset.eq ? ' - ' + row.dataset.eq : ''}` : eqName,
            type: row.dataset.type || '',
            category: row.dataset.category || '',
            measure: isProc ? 'Theo sản lượng (IPPU)' : (row.dataset.measure || 'Tự đánh giá'),
            isProc: isProc,
            productionUnit: row.dataset.productionUnit || 'tấn',
            capacity: opCap,
            capUnit: isProc ? (row.dataset.productionUnit || 'tấn') : (row.dataset.opCapUnit || 'kW'),
            load: isProc ? 100 : loadVal,
            hourlyRate: hRate,
            hoursDay: parseFloat(row.dataset.opHoursDay) || (isProc ? 8 : 16),
            daysWeek: parseFloat(row.dataset.opDaysWeek) || 6,
            annualEstQty: parseFloat(row.dataset.annualEstQty) || 0,
            efFactor: parseFloat(row.dataset.efFactor) || (isProc ? 60 : 0.6766)
          });
        }
      });

      // Fallback nếu chưa tải lên DOM sourceRows
      if (machineSources.length === 0) {
        try {
          const username = localStorage.getItem('gs_current_user') || 'guest';
          const rawUser = username.trim();
          const userSlug = rawUser.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '') || 'guest';
          const branchEl = document.getElementById('branch-selector');
          const branchName = (branchEl && branchEl.value) ? branchEl.value : 'main';
          const branchKey = branchName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '') || 'main';

          const sources = JSON.parse(
            localStorage.getItem(`gs_data_${userSlug}_${branchKey}_sources`) ||
            localStorage.getItem(`gs_data_${rawUser}_${branchKey}_sources`) ||
            localStorage.getItem(getBranchStorageKey('sources')) ||
            '[]'
          );
          sources.forEach(src => {
            const measure = (src.measure || src.measurementMethod || '').toLowerCase();
            const opCap = parseFloat(src.opCapacity || src.capacity) || 0;
            const isProc = src.isProcessEmission === 'true' || 
                           measure.includes('sản lượng') || 
                           Boolean(src.productionUnit) ||
                           (src.category && src.category.includes('công nghiệp'));
            const loadVal = parseFloat(src.opLoad || src.load) || (isProc ? 100 : 80);
            const hRate = parseFloat(src.hourlyRate) || (opCap > 0 ? Math.round(opCap * (loadVal / 100) * 1000) / 1000 : 0);

            if (measure.includes('tự đánh giá') || measure.includes('liên tục') || measure.includes('đo') || measure.includes('ước tính') || opCap > 0 || hRate > 0 || isProc) {
              machineSources.push({
                id: src.id,
                name: isProc ? `${src.type || 'Quá trình luyện thép'}${src.eq ? ' - ' + src.eq : ''}` : (src.eq || src.type || src.name || ''),
                type: src.type || '',
                category: src.category || '',
                measure: isProc ? 'Theo sản lượng (IPPU)' : (src.measure || 'Tự đánh giá'),
                isProc: isProc,
                productionUnit: src.productionUnit || 'tấn',
                capacity: opCap,
                capUnit: isProc ? (src.productionUnit || 'tấn') : (src.opCapUnit || src.capUnit || 'kW'),
                load: isProc ? 100 : loadVal,
                hourlyRate: hRate,
                hoursDay: parseFloat(src.opHoursDay || src.hoursDay) || (isProc ? 8 : 16),
                daysWeek: parseFloat(src.opDaysWeek || src.daysWeek) || 6,
                annualEstQty: parseFloat(src.annualEstQty) || 0,
                efFactor: parseFloat(src.efFactor) || (isProc ? 60 : 0.6766)
              });
            }
          });
        } catch(e) {}
      }

      return machineSources;
    }

    function renderMachineOverview() {
      const tbodyEl = document.getElementById('machine-overview-tbody');
      if (!tbodyEl) return;

      const actRows = document.querySelectorAll('#activity-tbody tr:not(#no-activity-row)');
      const machineSources = getMachineSources();

      if (machineSources.length === 0) {
        tbodyEl.innerHTML = `<tr><td colspan="10" style="text-align: center; color: #94a3b8; padding: 1.5rem;">Chưa có thiết bị nào được cấu hình nguồn phát thải theo phương thức Tự đánh giá hoặc Đo liên tục.</td></tr>`;
        return;
      }

      // Pre-extract row data into a plain JavaScript array once to avoid repetitive DOM queries
      const actRowData = [];
      actRows.forEach(ar => {
        actRowData.push({
          sourceName: (ar.dataset.sourceName || '').toLowerCase(),
          doc: (ar.dataset.doc || '').toLowerCase(),
          amount: parseFloat(ar.dataset.amount) || 0,
          recordType: ar.dataset.recordType || '',
          unit: (ar.dataset.unit || '').toLowerCase(),
          isBaseline: ar.dataset.isBaseline,
          isDowntime: ar.dataset.isDowntime,
          downtimeHours: parseFloat(ar.dataset.downtimeHours) || 0,
          overtimeHours: parseFloat(ar.dataset.overtimeHours) || 0
        });
      });

      tbodyEl.innerHTML = '';
      machineSources.forEach(ms => {
        const msNameLower = ms.name.toLowerCase();
        const msTypeLower = ms.type ? ms.type.toLowerCase() : '';

        if (ms.isProc) {
          const consumptionUnit = ms.productionUnit || 'tấn';
          const baseAnnual = ms.annualEstQty > 0 ? ms.annualEstQty : 60000;
          let actualProdTonnage = 0;
          let actualProdCount = 0;

          actRowData.forEach(ar => {
            const match = ar.sourceName.includes(msNameLower) || (msTypeLower && ar.sourceName.includes(msTypeLower));
            if (match) {
              if (ar.recordType === 'actual_production' || (ar.unit === 'tấn' && ar.isBaseline !== 'true')) {
                actualProdTonnage += ar.amount;
                actualProdCount++;
              }
            }
          });

          const actualQty = actualProdCount > 0 ? Math.round(actualProdTonnage * 100) / 100 : baseAnnual;
          const efKg = ms.efFactor > 5 ? ms.efFactor : ms.efFactor * 1000;
          const emissions = Math.round((actualQty * efKg / 1000) * 100) / 100;
          const dailyQuota = Math.round((baseAnnual / 300) * 10) / 10;
          const adjustText = actualProdCount > 0 
            ? `<span style="color: #047857; font-weight: 600;">Đã chốt ${actualProdCount} ca (${actualProdTonnage.toLocaleString('vi-VN')} tấn)</span>`
            : '<span style="color: #64748b;">Định mức kế hoạch</span>';

          const tr = document.createElement('tr');
          tr.style.borderBottom = '1px solid #f1f5f9';
          tr.innerHTML = `
            <td style="padding: 0.5rem 0.6rem; font-weight: 500;">${ms.name}</td>
            <td style="padding: 0.5rem 0.6rem; color: #0284c7; font-weight: 500;">${ms.measure}</td>
            <td style="padding: 0.5rem 0.6rem; text-align: right; color: #94a3b8;">—</td>
            <td style="padding: 0.5rem 0.6rem; text-align: right; color: #94a3b8;">—</td>
            <td style="padding: 0.5rem 0.6rem; text-align: right; font-weight: 600; color: var(--color-primary);">${dailyQuota.toLocaleString('vi-VN')} tấn/ngày</td>
            <td style="padding: 0.5rem 0.6rem; text-align: right; color: #64748b;">${ms.daysWeek}d/w</td>
            <td style="padding: 0.5rem 0.6rem; text-align: right; font-weight: 600; color: #0284c7;">${baseAnnual.toLocaleString('vi-VN')} ${consumptionUnit}</td>
            <td style="padding: 0.5rem 0.6rem; text-align: right;">${adjustText}</td>
            <td style="padding: 0.5rem 0.6rem; text-align: right; font-weight: 600; color: #1e293b;">${actualQty.toLocaleString('vi-VN')} ${consumptionUnit}</td>
            <td style="padding: 0.5rem 0.6rem; text-align: right; font-weight: 600; color: #047857;">${emissions.toLocaleString('vi-VN')}</td>
          `;
          tbodyEl.appendChild(tr);
          return;
        }

        let totalDowntimeHours = 0;
        let totalAdjustmentQty = 0;

        actRowData.forEach(ar => {
          const match = ar.sourceName.includes(msNameLower) || (msTypeLower && ar.sourceName.includes(msTypeLower));
          if (match) {
            const amt = ar.amount;
            const dtHours = ar.downtimeHours;
            const otHours = ar.overtimeHours;
            const doc = ar.doc;

            if (dtHours > 0) {
              const dtQty = Math.round(dtHours * (ms.hourlyRate || 0) * 100) / 100;
              totalAdjustmentQty -= dtQty;
              totalDowntimeHours += dtHours;
            } else if (otHours > 0) {
              const otQty = Math.round(otHours * (ms.hourlyRate || 0) * 100) / 100;
              totalAdjustmentQty += otQty;
            } else if (ar.isDowntime === 'true' || ((doc.includes('dừng') || doc.includes('bảo trì')) && !doc.includes('vận hành thực tế'))) {
              totalAdjustmentQty -= Math.abs(amt);
              if (ms.hourlyRate > 0) {
                totalDowntimeHours += Math.round((Math.abs(amt) / ms.hourlyRate) * 10) / 10;
              }
            } else if (doc.includes('tăng ca') && !doc.includes('vận hành thực tế')) {
              totalAdjustmentQty += amt;
            }
          }
        });

        const consumptionUnit = normalizeConsumptionUnit(ms.capUnit, ms.type);
        const rateUnitDisplay = formatRateUnit(ms.capUnit, ms.type);
        const baseAnnual = ms.annualEstQty > 0 ? ms.annualEstQty : Math.round(ms.hourlyRate * ms.hoursDay * ms.daysWeek * 52 * 1000) / 1000;
        const actualQty = Math.max(0, Math.round((baseAnnual + totalAdjustmentQty) * 1000) / 1000);
        const emissions = Math.round((actualQty * ms.efFactor / 1000) * 100) / 100;

        let adjustText = '0 ' + consumptionUnit;
        if (totalAdjustmentQty !== 0) {
          const sign = totalAdjustmentQty > 0 ? '+' : '';
          adjustText = `${sign}${totalAdjustmentQty.toLocaleString('vi-VN')} ${consumptionUnit}${totalDowntimeHours > 0 ? ` (${totalDowntimeHours}h)` : ''}`;
        }

        const tr = document.createElement('tr');
        tr.style.borderBottom = '1px solid #f1f5f9';
        tr.innerHTML = `
          <td style="padding: 0.5rem 0.6rem; font-weight: 500;">${ms.name}</td>
          <td style="padding: 0.5rem 0.6rem; color: #64748b;">${ms.measure}</td>
          <td style="padding: 0.5rem 0.6rem; text-align: right;">${ms.capacity ? ms.capacity.toLocaleString('vi-VN') + ' ' + ms.capUnit : '—'}</td>
          <td style="padding: 0.5rem 0.6rem; text-align: right;">${ms.load}%</td>
          <td style="padding: 0.5rem 0.6rem; text-align: right; font-weight: 600; color: var(--color-primary);">${ms.hourlyRate ? ms.hourlyRate.toLocaleString('vi-VN') + ' ' + rateUnitDisplay : '—'}</td>
          <td style="padding: 0.5rem 0.6rem; text-align: right; color: #64748b;">${ms.hoursDay}h/ngày × ${ms.daysWeek}d/w</td>
          <td style="padding: 0.5rem 0.6rem; text-align: right;">${baseAnnual.toLocaleString('vi-VN')} ${consumptionUnit}</td>
          <td style="padding: 0.5rem 0.6rem; text-align: right; color: ${totalAdjustmentQty < 0 ? '#dc2626' : (totalAdjustmentQty > 0 ? '#16a34a' : '#64748b')}; font-weight: 500;">
            ${adjustText}
          </td>
          <td style="padding: 0.5rem 0.6rem; text-align: right; font-weight: 600; color: #1e293b;">${actualQty.toLocaleString('vi-VN')} ${consumptionUnit}</td>
          <td style="padding: 0.5rem 0.6rem; text-align: right; font-weight: 600; color: #047857;">${emissions.toLocaleString('vi-VN')}</td>
        `;
        tbodyEl.appendChild(tr);
      });
    }

    // ============================================================
        // ============================================================
    // BẢNG ĐỐI SOÁT NĂNG LƯỢNG: KẾ TOÁN VS KỸ SƯ (RECONCILIATION)
    // ============================================================
    function renderReconciliationSummary() {
      const tbodyEl = document.getElementById('recon-summary-tbody');
      if (!tbodyEl) return;

      // Xử lý gắn sự kiện chuyển đổi chu kỳ đối soát: Theo Tháng vs Cả năm
      const btnPeriodMonth = document.getElementById('btn-recon-period-month');
      const btnPeriodYear = document.getElementById('btn-recon-period-year');
      if (btnPeriodMonth && !btnPeriodMonth.dataset.bound) {
        btnPeriodMonth.dataset.bound = 'true';
        btnPeriodMonth.addEventListener('click', () => {
          window.reconPeriod = 'month';
          btnPeriodMonth.style.background = '#0284c7';
          btnPeriodMonth.style.color = '#fff';
          btnPeriodMonth.style.fontWeight = '600';
          if (btnPeriodYear) {
            btnPeriodYear.style.background = 'transparent';
            btnPeriodYear.style.color = '#64748b';
            btnPeriodYear.style.fontWeight = '500';
          }
          renderReconciliationSummary();
        });
      }
      if (btnPeriodYear && !btnPeriodYear.dataset.bound) {
        btnPeriodYear.dataset.bound = 'true';
        btnPeriodYear.addEventListener('click', () => {
          window.reconPeriod = 'year';
          btnPeriodYear.style.background = '#0284c7';
          btnPeriodYear.style.color = '#fff';
          btnPeriodYear.style.fontWeight = '600';
          if (btnPeriodMonth) {
            btnPeriodMonth.style.background = 'transparent';
            btnPeriodMonth.style.color = '#64748b';
            btnPeriodMonth.style.fontWeight = '500';
          }
          renderReconciliationSummary();
        });
      }

      const isMonth = (window.reconPeriod !== 'year');

      const actRows = document.querySelectorAll('#activity-tbody tr:not(#no-activity-row)');
      const sourceRows = document.querySelectorAll('#source-tbody tr:not(#no-source-row)');

      const actRowData = [];
      let invoiceElectricity = 0;
      let invoiceFuel = 0;
      const currentActiveRole = localStorage.getItem('gs_user_role') || 'engineer';

      actRows.forEach(ar => {
        const doc = (ar.dataset.doc || '').toLowerCase();
        const type = (ar.dataset.sourceType || '').toLowerCase();
        const sourceName = (ar.dataset.sourceName || '').toLowerCase();
        const unit = (ar.dataset.unit || '').toLowerCase();
        const amt = parseFloat(ar.dataset.amount) || 0;
        const entryRole = ar.dataset.entryRole || '';
        const entryMode = ar.dataset.entryMode || '';
        const isBaseline = ar.dataset.isBaseline;
        const isDowntime = ar.dataset.isDowntime;
        const dtHours = parseFloat(ar.dataset.downtimeHours) || 0;
        const otHours = parseFloat(ar.dataset.overtimeHours) || 0;

        actRowData.push({
          doc, type, sourceName, amt, dtHours, otHours, isDowntime
        });

        // Nhận diện Hóa đơn Kế toán: do kế toán nhập, hoặc chế độ trực tiếp/hóa đơn, hoặc có từ khóa hóa đơn/chứng từ
        const isInvoice = (ar.dataset.isInvoice === 'true' ||
                          entryRole === 'accountant' ||
                          entryMode === 'direct' ||
                          doc.includes('hóa đơn') || doc.includes('hoa don') ||
                          doc.includes('thanh toán') || doc.includes('phiếu') ||
                          doc.includes('xăng') || doc.includes('dầu') ||
                          (currentActiveRole === 'accountant')) &&
                          isBaseline !== 'true' &&
                          isDowntime !== 'true' &&
                          entryRole !== 'engineer';

        if (isInvoice) {
          if (type.includes('điện') || type.includes('dien') || unit === 'kwh' || sourceName.includes('điện') || sourceName.includes('dien') || sourceName.includes('chiller')) {
            invoiceElectricity += amt;
          } else {
            invoiceFuel += amt;
          }
        }
      });

      let machineElectricity = 0;
      let machineFuel = 0;
      const machineSources = getMachineSources();

      machineSources.forEach(ms => {
        let totalAdjustmentQty = 0;
        const msNameLower = ms.name.toLowerCase();
        const msTypeLower = ms.type ? ms.type.toLowerCase() : '';

        actRowData.forEach(ar => {
          const match = ar.sourceName.includes(msNameLower) || (msTypeLower && ar.sourceName.includes(msTypeLower));
          if (match) {
            const dtHours = ar.dtHours;
            const otHours = ar.otHours;
            const doc = ar.doc;
            if (dtHours > 0) {
              totalAdjustmentQty -= Math.round(dtHours * (ms.hourlyRate || 0) * 100) / 100;
            } else if (otHours > 0) {
              totalAdjustmentQty += Math.round(otHours * (ms.hourlyRate || 0) * 100) / 100;
            } else if (ar.isDowntime === 'true' || ((doc.includes('dừng') || doc.includes('bảo trì')) && !doc.includes('vận hành thực tế'))) {
              totalAdjustmentQty -= Math.abs(ar.amt);
            } else if (doc.includes('tăng ca') && !doc.includes('vận hành thực tế')) {
              totalAdjustmentQty += ar.amt;
            }
          }
        });
        const baseAnnual = ms.annualEstQty > 0 ? ms.annualEstQty : Math.round(ms.hourlyRate * ms.hoursDay * ms.daysWeek * 52 * 1000) / 1000;
        const actualQty = Math.max(0, Math.round((baseAnnual + totalAdjustmentQty) * 1000) / 1000);
        const capUnit = (ms.capUnit || '').toLowerCase();
        const type = (ms.type || '').toLowerCase();
        if (capUnit === 'kwh' || capUnit === 'kw' || type.includes('điện') || type.includes('dien')) {
          machineElectricity += actualQty;
        } else {
          machineFuel += actualQty;
        }
      });

      // Nếu xem theo tháng: lấy mức ước tính 1 tháng (annual / 12)
      const compElectricity = isMonth ? Math.round((machineElectricity / 12) * 100) / 100 : machineElectricity;
      const compFuel = isMonth ? Math.round((machineFuel / 12) * 100) / 100 : machineFuel;

      const categories = [];
      if (invoiceElectricity > 0 || compElectricity > 0) {
        const delta = Math.round((invoiceElectricity - compElectricity) * 100) / 100;
        const base = compElectricity > 0 ? compElectricity : invoiceElectricity;
        const ratio = base > 0 ? Math.round((Math.abs(delta) / base) * 1000) / 10 : 0;
        categories.push({
          name: 'Điện năng (kWh)',
          invoice: invoiceElectricity,
          equipment: compElectricity,
          delta,
          ratio,
          status: ratio <= 5.0 ? 'RECONCILED' : 'WARNING_PENDING_REVIEW'
        });
      }

      if (invoiceFuel > 0 || compFuel > 0) {
        const delta = Math.round((invoiceFuel - compFuel) * 100) / 100;
        const base = compFuel > 0 ? compFuel : invoiceFuel;
        const ratio = base > 0 ? Math.round((Math.abs(delta) / base) * 1000) / 10 : 0;
        categories.push({
          name: 'Nhiên liệu đốt (lít / kg)',
          invoice: invoiceFuel,
          equipment: compFuel,
          delta,
          ratio,
          status: ratio <= 5.0 ? 'RECONCILED' : 'WARNING_PENDING_REVIEW'
        });
      }

      if (categories.length === 0) {
        tbodyEl.innerHTML = '<tr><td colspan="6" style="text-align: center; color: #94a3b8; padding: 1rem;">Chưa có đủ dữ liệu để đối soát.</td></tr>';
        return;
      }

      tbodyEl.innerHTML = '';
      categories.forEach(cat => {
        const tr = document.createElement('tr');
        tr.style.borderBottom = '1px solid #f1f5f9';
        const isOk = cat.ratio <= 5.0;
        const isWarning = cat.ratio > 5.0 && cat.ratio <= 10.0;
        const statusColor = isOk ? '#16a34a' : (isWarning ? '#d97706' : '#dc2626');
        const badgeBg = isOk
          ? 'background: #dcfce7; color: #15803d; border: 1px solid #bbf7d0;'
          : (isWarning
              ? 'background: #fef3c7; color: #b45309; border: 1px solid #fde68a;'
              : 'background: #fee2e2; color: #b91c1c; border: 1px solid #fecaca;');
        const badgeTitle = isOk
          ? 'Khớp chuẩn: Chênh lệch nằm trong giới hạn sai số kỹ thuật cho phép (≤ 5%)'
          : (isWarning
              ? 'Chênh lệch 5% - 10%: Kiểm toán viên khuyến nghị rà soát 2 nguyên nhân: 1. Nhiên liệu còn tồn bồn chứa chưa đốt hết; 2. Thiết bị chạy non tải so với công suất tem.'
              : 'Bất thường nghiêm trọng (> 10%): Vượt dung sai kiểm toán KNK ISO 14064-1! Yêu cầu kế toán và kỹ sư lập biên bản giải trình kỹ thuật trước khi nộp báo cáo.');
        const badgeText = isOk ? 'Khớp' : (isWarning ? 'Lệch > 5%' : 'Lệch > 10% (Cảnh báo)');

        tr.innerHTML = `
          <td style="padding: 0.5rem 0.6rem; font-weight: 500;">${cat.name}</td>
          <td style="padding: 0.5rem 0.6rem; text-align: right;">${cat.invoice.toLocaleString('vi-VN')}</td>
          <td style="padding: 0.5rem 0.6rem; text-align: right;">${cat.equipment.toLocaleString('vi-VN')}</td>
          <td style="padding: 0.5rem 0.6rem; text-align: right; color: ${cat.delta < 0 ? '#dc2626' : (cat.delta > 0 ? '#0284c7' : '#16a34a')}; font-weight: 500;">
            ${(cat.delta > 0 ? '+' : '') + cat.delta.toLocaleString('vi-VN')}
          </td>
          <td style="padding: 0.5rem 0.6rem; text-align: right; font-weight: 600; color: ${statusColor};">${cat.ratio}%</td>
          <td style="padding: 0.5rem 0.6rem; text-align: center;">
            <span style="display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 0.72rem; font-weight: 600; cursor: help; ${badgeBg}" title="${badgeTitle}">
              ${badgeText}
            </span>
          </td>
        `;
        tbodyEl.appendChild(tr);
      });
    }

    // TỰ ĐỘNG PHÂN BỔ LỊCH VẬN HÀNH 12 THÁNG CHO KỸ SƯ
    // ============================================================
    function autoGenerateMonthlyOperationalRecords(targetYear, askConfirm = false) {
      // Mặc định phân bổ chi tiết theo từng ngày (Full 1..31 ngày) cho tất cả các tháng theo yêu cầu
      if (typeof autoGenerateDailyOperationalRecords === 'function') {
        return autoGenerateDailyOperationalRecords(targetYear, 'all', askConfirm);
      }
      const annualQty = 0;
      const monthlyQty = Math.round((annualQty / 12) * 100) / 100;
      const fallbackRecord = { isBaseline: 'true', amount: monthlyQty };
      return 0;
    }

    // Nút phân bổ Lịch vận hành 12 tháng vào Sổ nhật ký
    const btnAutoSchedule = document.getElementById('btn-auto-schedule-baseline');
    if (btnAutoSchedule) {
      btnAutoSchedule.addEventListener('click', () => {
        const curYear = document.getElementById('act-filter-year')?.value || new Date().getFullYear().toString();
        autoGenerateMonthlyOperationalRecords(curYear, true);
      });
    }

    // Nút ghi nhận nhanh dừng máy / sự cố cho Kỹ sư
    const btnQuickLogDowntime = document.getElementById('btn-quick-log-downtime');
    if (btnQuickLogDowntime) {
      btnQuickLogDowntime.addEventListener('click', () => {
        openModal();
        switchActivityInputMode('hours');
        const dInput = document.getElementById('activity-doc');
        if (dInput) dInput.value = 'Dừng máy sự cố / Điều chỉnh';
        const dLabel = document.getElementById('label-activity-doc');
        if (dLabel) dLabel.innerText = 'Nhật ký sự cố / Lý do dừng máy';
        const radDowntime = document.querySelector('input[name="act-record-type"][value="downtime"]');
        if (radDowntime) {
          radDowntime.checked = true;
          radDowntime.dispatchEvent(new Event('change'));
        }
      });
    }

        // Hàm xóa sạch dữ liệu kiểm thử (Hoạt động, Thiết bị, Nguồn) và giữ nguyên Tài khoản & Hồ sơ doanh nghiệp
    window.resetGreenShiftTestData = function(skipConfirm) {
      if (!skipConfirm) {
        const confirmed = confirm(
          "Bạn có chắc chắn muốn xóa toàn bộ Dữ liệu hoạt động, Thiết bị và Nguồn phát thải đã nhập để kiểm thử lại từ đầu không?\n\n" +
          "(Tài khoản đăng nhập và Thông tin công ty vẫn được bảo lưu an toàn)."
        );
        if (!confirmed) return false;
      }

      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key) continue;
        if (
          (key.startsWith('gs_data_') && (key.endsWith('_activity') || key.endsWith('_equipment') || key.endsWith('_sources'))) ||
          key === 'gs_v2_activity_main' ||
          key === 'gs_v2_annual_data' ||
          key === 'gs_records'
        ) {
          keysToRemove.push(key);
        }
      }

      keysToRemove.forEach(k => localStorage.removeItem(k));

      if (skipConfirm) {
        if (typeof window.seedIndustrySampleData === 'function') {
          window.seedIndustrySampleData(true);
        } else if (typeof window.seedSteelPlantSampleData === 'function') {
          window.seedSteelPlantSampleData(true);
        }
        if (typeof window.loadActivityList === 'function') {
          window.loadActivityList();
        }
        if (typeof window.renderMachineOverview === 'function') {
          window.renderMachineOverview();
        }
      } else {
        alert("Đã xóa toàn bộ dữ liệu hoạt động, thiết bị và nguồn phát thải. Hệ thống sẽ tải lại trang để bạn bắt đầu kiểm thử mới!");
        if (typeof window !== 'undefined' && window.location && typeof window.location.reload === 'function') {
          window.location.reload();
        }
      }
      return true;
    };

    ['btn-reset-test-data', 'btn-reset-eq-data', 'btn-reset-src-data'].forEach(btnId => {
      const btn = document.getElementById(btnId);
      if (btn) {
        btn.addEventListener('click', () => {
          window.resetGreenShiftTestData();
        });
      }
    });

        // Tự động phân bổ chi tiết từng ngày trong tháng (Full 1..31 ngày) theo ca kíp thiết bị
    // Tự động phân bổ chi tiết từng ngày (mặc định cho tất cả các tháng hoặc tháng chỉ định) theo ca kíp thiết bị
    function autoGenerateDailyOperationalRecords(year, monthVal = 'all', askConfirm = false) {
      const sourceRows = document.querySelectorAll('#source-tbody tr:not(#no-source-row)');
      let machineSources = [];
      sourceRows.forEach(r => {
        const d = r.dataset;
        const measure = (d.measure || d.measurementMethod || '').toLowerCase();
        const isProcess = d.isProcessEmission === 'true' || measure.includes('sản lượng') || (d.category && d.category.includes('công nghiệp')) || Boolean(d.productionUnit);
        const opCap = parseFloat(d.opCapacity || d.capacity) || 0;
        const hRate = parseFloat(d.hourlyRate) || 0;
        if (measure.includes('tự đánh giá') || measure.includes('đo') || measure.includes('liên tục') || measure.includes('ước tính') || opCap > 0 || hRate > 0 || isProcess || d.opLoad || d.opHoursDay) {
          machineSources.push({
            id: d.id,
            name: d.eq || d.type,
            type: d.type || '',
            eq: d.eq || '',
            measure: d.measure,
            isProcessEmission: isProcess ? 'true' : 'false',
            productionUnit: d.productionUnit || 'tấn',
            productName: d.productName || 'Sản phẩm',
            opCapacity: opCap,
            opCapUnit: d.opCapUnit || d.capUnit || '',
            opLoad: parseFloat(d.opLoad || d.load) || 80,
            opHoursDay: parseFloat(d.opHoursDay || d.hoursDay) || 8,
            opDaysWeek: parseFloat(d.opDaysWeek || d.daysWeek) || 6,
            hourlyRate: hRate || (opCap > 0 ? Math.round(opCap * ((parseFloat(d.opLoad || d.load) || 80) / 100) * 1000) / 1000 : 0),
            annualEstQty: parseFloat(d.annualEstQty) || 0,
            ef: d.ef || '',
            refrigerant: d.refrigerant || '',
            efFactor: parseFloat(d.efFactor) || 0.6766,
            efUnit: d.efUnit || ''
          });
        }
      });

      if (machineSources.length === 0) {
        try {
          const username = localStorage.getItem('gs_current_user') || 'guest';
          const rawUser = username.trim();
          const userSlug = rawUser.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '') || 'guest';
          const branchEl = document.getElementById('branch-selector');
          const branchName = (branchEl && branchEl.value) ? branchEl.value : 'main';
          const branchKey = branchName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '') || 'main';
          const sources = JSON.parse(
            localStorage.getItem(`gs_data_${userSlug}_${branchKey}_sources`) ||
            localStorage.getItem(`gs_data_${rawUser}_${branchKey}_sources`) ||
            localStorage.getItem(getBranchStorageKey('sources')) ||
            localStorage.getItem(`gs_data_${rawUser}_tru_so_chinh_sources`) ||
            localStorage.getItem(`gs_data_${userSlug}_tru_so_chinh_sources`) ||
            '[]'
          );
          sources.forEach(d => {
            const measure = (d.measure || d.measurementMethod || '').toLowerCase();
            const isProcess = d.isProcessEmission === 'true' || measure.includes('sản lượng') || (d.category && d.category.includes('công nghiệp')) || Boolean(d.productionUnit);
            const opCap = parseFloat(d.opCapacity || d.capacity) || 0;
            const hRate = parseFloat(d.hourlyRate) || 0;
            if (measure.includes('tự đánh giá') || measure.includes('đo') || measure.includes('liên tục') || measure.includes('ước tính') || opCap > 0 || hRate > 0 || isProcess || d.opLoad || d.opHoursDay) {
              machineSources.push({
                id: d.id,
                name: d.eq || d.type,
                type: d.type || '',
                eq: d.eq || '',
                measure: d.measure,
                isProcessEmission: isProcess ? 'true' : 'false',
                productionUnit: d.productionUnit || 'tấn',
                productName: d.productName || 'Sản phẩm',
                opCapacity: opCap,
                opCapUnit: d.opCapUnit || d.capUnit || '',
                opLoad: parseFloat(d.opLoad || d.load) || 80,
                opHoursDay: parseFloat(d.opHoursDay || d.hoursDay) || 8,
                opDaysWeek: parseFloat(d.opDaysWeek || d.daysWeek) || 6,
                hourlyRate: hRate || (opCap > 0 ? Math.round(opCap * ((parseFloat(d.opLoad || d.load) || 80) / 100) * 1000) / 1000 : 0),
                annualEstQty: parseFloat(d.annualEstQty) || 0,
                ef: d.ef || '',
                refrigerant: d.refrigerant || '',
                efFactor: parseFloat(d.efFactor) || 0.6766,
                efUnit: d.efUnit || ''
              });
            }
          });
        } catch(e) {}
      }

      if (machineSources.length === 0) {
        if (askConfirm) {
          alert('Chưa có thiết bị nào được cấu hình thông số vận hành (công suất, mức tải, giờ chạy/ngày) tại phân hệ Thiết bị / Nguồn phát thải.');
        }
        return 0;
      }

      let monthsToProcess = [];
      if (!monthVal || monthVal === 'all') {
        monthsToProcess = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
      } else {
        const m = parseInt(monthVal, 10);
        if (!isNaN(m) && m >= 1 && m <= 12) {
          monthsToProcess = [m];
        } else {
          monthsToProcess = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
        }
      }

      const curYear = year || (document.getElementById('act-filter-year')?.value || new Date().getFullYear().toString());
      const username = localStorage.getItem('gs_current_user') || 'guest';
      const rawUser = username.trim();
      const userSlug = rawUser.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '') || 'guest';
      const branchEl = document.getElementById('branch-selector');
      const branchName = (branchEl && branchEl.value) ? branchEl.value : 'main';
      const branchKey = branchName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '') || 'main';
      const normActKey = `gs_data_${userSlug}_${branchKey}_activity`;
      const rawActKey = `gs_data_${rawUser}_${branchKey}_activity`;
      const activityKey = normActKey;

      let activities = JSON.parse(
        localStorage.getItem(normActKey) ||
        localStorage.getItem(rawActKey) ||
        '[]'
      );

      if (askConfirm) {
        const confirmed = confirm(
          `Bạn có muốn tự động phân bổ chi tiết từng ngày theo ca kíp thiết bị cho năm ${curYear} không?\n\n` +
          `(Mỗi ngày làm việc sẽ là một bản ghi ca máy độc lập, tự động trừ Chủ nhật và ngày lễ Việt Nam).`
        );
        if (!confirmed) return 0;
      }

      const isLeapYear = (parseInt(curYear) % 4 === 0 && (parseInt(curYear) % 100 !== 0 || parseInt(curYear) % 400 === 0));
      const daysInMonths = [31, isLeapYear ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

      // Xóa các bản ghi baseline hoặc auto_daily của các tháng cần xử lý (giữ nguyên downtime hoặc sửa đổi riêng)
      activities = activities.filter(act => {
        if (!act.date || !act.date.startsWith(curYear)) return true;
        const actM = parseInt(act.date.split('-')[1], 10);
        if (!monthsToProcess.includes(actM)) return true;
        if (act.isBaseline === 'true' || (act.entryMode === 'auto_daily' && act.recordType === 'normal') || (act.doc && act.doc.includes('Định mức vận hành T'))) return false;
        return true;
      });

      let createdCount = 0;
      const now = new Date().toISOString().slice(0, 10) + ' ' + new Date().toTimeString().slice(0, 5);

      monthsToProcess.forEach(m => {
        const mStr = String(m).padStart(2, '0');
        const daysInThisMonth = daysInMonths[m - 1];

        machineSources.forEach(src => {
          let dailyQty = 0;
          let docStr = '';
          let unitName = '';
          const dWeek = parseFloat(src.opDaysWeek) || 6;
          const hDay = parseFloat(src.opHoursDay) || 8;
          const isProc = src.isProcessEmission === 'true' || (src.category && src.category.includes('công nghiệp'));

          if (isProc) {
            if (src.annualEstQty <= 0) return; // Chỉ phân bổ khi có kế hoạch sản lượng năm
            let totalActiveDaysInYear = 0;
            for (let mm = 1; mm <= 12; mm++) {
              const dInM = daysInMonths[mm - 1];
              for (let dd = 1; dd <= dInM; dd++) {
                const dObj = new Date(parseInt(curYear), mm - 1, dd);
                const dW = dObj.getDay();
                if (dWeek <= 5 && (dW === 0 || dW === 6)) continue;
                if (dWeek === 6 && dW === 0) continue;
                const dStrCheck = `${curYear}-${String(mm).padStart(2, '0')}-${String(dd).padStart(2, '0')}`;
                if (typeof isVnPublicHoliday === 'function' && isVnPublicHoliday(dStrCheck)) continue;
                totalActiveDaysInYear++;
              }
            }
            if (totalActiveDaysInYear === 0) totalActiveDaysInYear = 312;
            dailyQty = Math.round((src.annualEstQty / totalActiveDaysInYear) * 1000) / 1000;
            unitName = src.productionUnit || 'tấn';
            docStr = `Định mức công nghệ (${dailyQty} ${unitName}/ngày)`;
          } else {
            const opCap = parseFloat(src.opCapacity) || 0;
            const opLoad = parseFloat(src.opLoad) || 80;
            let hRate = parseFloat(src.hourlyRate) || 0;
            if (hRate <= 0 && opCap > 0) {
              hRate = Math.round(opCap * (opLoad / 100) * 1000) / 1000;
            }
            dailyQty = Math.round(hRate * hDay * 100) / 100;
            if (dailyQty <= 0) return;
            const rawUnit = src.opCapUnit || src.efUnit || (src.type.toLowerCase().includes('điện') ? 'kWh' : 'lít');
            unitName = normalizeConsumptionUnit(rawUnit, src.type);
            docStr = `Vận hành ca ngày (${hDay}h/ngày)`;
          }

          const efFactor = parseFloat(src.efFactor) || 0.6766;
          let dailyCo2e = (dailyQty * efFactor).toFixed(2);

          let isBiomassSrc = (src.biomass === 'Có' || src.biomass === 'true');
          let dailyBioCo2 = '0.00';

          if (!isProc) {
            const { factor, fuelItem } = lookupFactor(src.ef, src.refrigerant);
            if (fuelItem && (fuelItem.isBiogenic || fuelItem.biogenic_factor)) isBiomassSrc = true;
            if (src.ef && (src.ef.toLowerCase().includes('sinh khối') || src.ef.toLowerCase().includes('củi') || src.ef.toLowerCase().includes('mùn cưa') || src.ef.toLowerCase().includes('trấu') || src.ef.toLowerCase().includes('viên nén'))) isBiomassSrc = true;

            if (fuelItem && fuelItem.ncv) {
              let massKg = dailyQty;
              const unitLower = (src.opCapUnit || src.efUnit || '').toLowerCase();
              if ((unitLower.includes('lít') || unitLower.includes('lit') || unitLower === 'l' || unitLower === 'm3') && fuelItem.density) {
                massKg = dailyQty * fuelItem.density;
              } else if (unitLower.includes('tấn') || unitLower.includes('tan') || unitLower === 't') {
                massKg = dailyQty * 1000;
              }
              const energyTJ = (massKg / 1000000) * fuelItem.ncv;
              let ch4Gwp = 28, n2oGwp = 265;
              const co2_kg = energyTJ * (fuelItem.ef_co2_tj || 0);
              const ch4_kg = energyTJ * (fuelItem.ef_ch4_tj || 0);
              const n2o_kg = energyTJ * (fuelItem.ef_n2o_tj || 0);

              if (isBiomassSrc) {
                const co2eCalc = (ch4_kg * ch4Gwp) + (n2o_kg * n2oGwp);
                dailyCo2e = co2eCalc.toFixed(2);
                dailyBioCo2 = (co2_kg > 0 ? co2_kg : (massKg * (fuelItem.biogenic_factor || 1.7472))).toFixed(2);
              } else {
                const co2eCalc = co2_kg + (ch4_kg * ch4Gwp) + (n2o_kg * n2oGwp);
                dailyCo2e = co2eCalc.toFixed(2);
              }
            } else if (isBiomassSrc) {
              let massKg = dailyQty;
              const unitLower = (src.opCapUnit || src.efUnit || '').toLowerCase();
              if (unitLower.includes('tấn') || unitLower.includes('tan') || unitLower === 't') {
                massKg = dailyQty * 1000;
              }
              const bioFactor = (fuelItem && fuelItem.biogenic_factor) ? fuelItem.biogenic_factor : 1.7472;
              const nonCo2Factor = (fuelItem && fuelItem.factor) ? fuelItem.factor : 0.038;
              dailyCo2e = (massKg * nonCo2Factor).toFixed(2);
              dailyBioCo2 = (massKg * bioFactor).toFixed(2);
            }
          }

          const srcEqClean = (src.eq || '').trim();
          const srcTypeClean = (src.type || '').trim();
          const sourceDisplayName = (srcEqClean && srcTypeClean && srcEqClean !== srcTypeClean && !srcEqClean.toLowerCase().includes(srcTypeClean.toLowerCase()) && !srcTypeClean.toLowerCase().includes(srcEqClean.toLowerCase()))
            ? `${srcTypeClean} - ${srcEqClean}`
            : (srcEqClean || srcTypeClean);

          const isFugitive = (src.category && (src.category.includes('rò rỉ') || src.category.includes('thất thoát'))) ||
                             (src.type && (src.type.toLowerCase().includes('chiller') || src.type.toLowerCase().includes('chữa cháy') || src.type.toLowerCase().includes('pccc'))) ||
                             Boolean(src.refrigerant);
          const isWastewater = (src.category && src.category.toLowerCase().includes('nước thải')) ||
                               (src.type && src.type.toLowerCase().includes('nước thải'));

          for (let d = 1; d <= daysInThisMonth; d++) {
            const dateObj = new Date(parseInt(curYear), m - 1, d);
            const dayOfWeek = dateObj.getDay();

            if (isFugitive) {
              if (d !== 15 || (m !== 6 && m !== 12)) continue;
              docStr = 'Kiểm định & bảo trì định kỳ';
            } else if (isWastewater) {
              if (d !== 28) continue;
              docStr = 'Quan trắc lưu lượng nước thải tháng';
            } else {
              if (dWeek === 1 && dayOfWeek !== 1) continue;
              if (dWeek === 2 && dayOfWeek !== 2 && dayOfWeek !== 4) continue;
              if (dWeek === 3 && dayOfWeek !== 1 && dayOfWeek !== 3 && dayOfWeek !== 5) continue;
              if (dWeek === 4 && (dayOfWeek === 0 || dayOfWeek === 5 || dayOfWeek === 6)) continue;
              if (dWeek <= 5 && (dayOfWeek === 0 || dayOfWeek === 6)) continue;
              if (dWeek === 6 && dayOfWeek === 0) continue;
            }

            const dStr = String(d).padStart(2, '0');
            const dateStr = `${curYear}-${mStr}-${dStr}`;

            if (typeof isVnPublicHoliday === 'function' && isVnPublicHoliday(dateStr)) continue;

            activities.push({
              date: dateStr,
              sourceId: src.id || '',
              sourceType: src.type || '',
              sourceName: sourceDisplayName,
              amount: dailyQty,
              unit: unitName,
              doc: docStr,
              manager: 'Kỹ sư vận hành',
              co2e: dailyCo2e,
              biogenicCo2: dailyBioCo2,
              isBiomass: isBiomassSrc ? 'true' : 'false',
              efName: src.ef || '',
              refName: src.refrigerant || '',
              finalFactor: (dailyQty > 0 ? (parseFloat(dailyCo2e) / dailyQty).toFixed(4) : efFactor.toString()),
              fileName: '',
              createdAt: now,
              entryRole: 'engineer',
              entryMode: 'auto_daily',
              isBaseline: isProc ? 'true' : 'false',
              isInvoice: 'false',
              isDowntime: 'false',
              recordType: 'normal',
              stdHours: hDay.toString(),
              downtimeHours: '0',
              overtimeHours: '0'
            });
            createdCount++;
          }
        });
      });

      activities.sort((a, b) => (a.date || '').localeCompare(b.date || ''));

      if (typeof safeSaveActivities === 'function') {
        safeSaveActivities(normActKey, activities);
      } else {
        localStorage.setItem(normActKey, JSON.stringify(activities));
      }
      if (rawActKey !== normActKey) {
        try { localStorage.removeItem(rawActKey); } catch (e) {}
      }
      loadActivityList();
      const viewDash = document.getElementById('view-dashboard');
      const isDashboardActive = viewDash && viewDash.style.display !== 'none';
      if (isDashboardActive) {
        if (typeof renderDashboard === 'function') renderDashboard();
        if (typeof updateDashboard === 'function') updateDashboard();
      }

      if (createdCount > 0 && askConfirm) {
        alert(`Thành công! Đã tự động phân bổ chi tiết ${createdCount} ca vận hành theo từng ngày cho Năm ${curYear}.`);
      }
      return createdCount;
    }

    // Nút phân bổ chi tiết từng ngày (nếu có trên giao diện)
    const btnAutoScheduleDaily = document.getElementById('btn-auto-schedule-daily');
    if (btnAutoScheduleDaily) {
      btnAutoScheduleDaily.addEventListener('click', () => {
        const curYear = document.getElementById('act-filter-year')?.value || new Date().getFullYear().toString();
        const curMonth = document.getElementById('act-filter-month')?.value || 'all';
        autoGenerateDailyOperationalRecords(curYear, curMonth, true);
      });
    }

    // --- ĐỒNG BỘ ĐỊNH MỨC HOẠT ĐỘNG KHI NGUỒN PHÁT THẢI ĐỔI SẢN LƯỢNG NĂM HOẶC THÔNG SỐ MÁY ---
    function syncSourceToBaselineActivities(src) {
      if (!src) return;
      const username = (localStorage.getItem('gs_current_user') || 'guest').toLowerCase();
      const rawUser = (localStorage.getItem('gs_current_user') || 'guest').trim();
      const userSlug = rawUser.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '') || 'guest';
      const branchEl = document.getElementById('branch-selector');
      const branchName = (branchEl && branchEl.value) ? branchEl.value : 'main';
      const branchKey = branchName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
      const normActKey = (typeof getBranchStorageKey === 'function') ? getBranchStorageKey('activity') : `gs_data_${userSlug}_${branchKey}_activity`;
      const rawActKey = `gs_data_${username}_${branchKey}_activity`;
      const storageKey = rawActKey;
      const actList = JSON.parse(
        localStorage.getItem(normActKey) ||
        localStorage.getItem(rawActKey) ||
        '[]'
      );
      if (!actList || actList.length === 0) return;

      const curYear = (document.getElementById('act-filter-year')?.value) || new Date().getFullYear().toString();
      const isProc = src.isProcessEmission === 'true' || 
                     (src.category && src.category.includes('công nghiệp')) || 
                     Boolean(src.productionUnit) || 
                     src.measure === 'Theo sản lượng sản phẩm';
      
      const dWeek = parseFloat(src.opDaysWeek) || 6;
      const hDay = parseFloat(src.opHoursDay) || 8;
      const rawEf = parseFloat(src.efFactor);
      let efFactor = (!isNaN(rawEf) && rawEf > 0) ? rawEf : (isProc ? 60 : 0.6766);
      if (isProc && efFactor > 0 && efFactor <= 5) efFactor = efFactor * 1000;
      const annualQty = parseFloat(src.annualEstQty) || 0;

      let dailyQty = 0;
      let docStr = '';
      let unitName = src.productionUnit || 'tấn';

      if (isProc) {
        if (annualQty <= 0) return;
        const isLeap = (parseInt(curYear) % 4 === 0 && parseInt(curYear) % 100 !== 0) || (parseInt(curYear) % 400 === 0);
        const daysInMonths = [31, isLeap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
        let totalActiveDaysInYear = 0;
        for (let mm = 1; mm <= 12; mm++) {
          const dInM = daysInMonths[mm - 1];
          for (let dd = 1; dd <= dInM; dd++) {
            const dObj = new Date(parseInt(curYear), mm - 1, dd);
            const dW = dObj.getDay();
            if (dWeek <= 5 && (dW === 0 || dW === 6)) continue;
            if (dWeek === 6 && dW === 0) continue;
            const dStrCheck = `${curYear}-${String(mm).padStart(2, '0')}-${String(dd).padStart(2, '0')}`;
            if (typeof isVnPublicHoliday === 'function' && isVnPublicHoliday(dStrCheck)) continue;
            totalActiveDaysInYear++;
          }
        }
        if (totalActiveDaysInYear === 0) totalActiveDaysInYear = 300;
        dailyQty = Math.round((annualQty / totalActiveDaysInYear) * 1000) / 1000;
        docStr = `Định mức công nghệ (${dailyQty} ${unitName}/ngày)`;
      } else {
        const opCap = parseFloat(src.opCapacity) || 0;
        const opLoad = parseFloat(src.opLoad) || 80;
        let hRate = parseFloat(src.hourlyRate) || 0;
        if (hRate <= 0 && opCap > 0) {
          hRate = Math.round(opCap * (opLoad / 100) * 1000) / 1000;
        }
        dailyQty = Math.round(hRate * hDay * 100) / 100;
        const rawUnit = src.opCapUnit || src.efUnit || (src.type.toLowerCase().includes('điện') ? 'kWh' : 'lít');
        unitName = normalizeConsumptionUnit(rawUnit, src.type);
        docStr = `Vận hành ca ngày (${hDay}h/ngày)`;
      }

      let updatedCount = 0;
      const srcNameLower = (src.eq || src.type || '').toLowerCase();
      const srcId = src.id;

      actList.forEach(act => {
        const actNameLower = (act.sourceName || '').toLowerCase();
        const isMatch = (srcId && act.sourceId === srcId) ||
                        (srcNameLower && actNameLower.includes(srcNameLower)) ||
                        (actNameLower && srcNameLower.includes(actNameLower));
        
        // Chỉ cập nhật các dòng định mức (isBaseline === 'true'), bảo vệ tuyệt đối các dòng thực tế đã chốt
        if (isMatch && act.isBaseline === 'true') {
          act.amount = dailyQty;
          act.co2e = (dailyQty * efFactor).toFixed(2);
          act.finalFactor = efFactor;
          act.unit = unitName;
          act.doc = docStr;
          updatedCount++;
        }
      });

      if (updatedCount > 0) {
        if (typeof safeSaveActivities === 'function') {
          safeSaveActivities(normActKey, actList);
        } else {
          localStorage.setItem(normActKey, JSON.stringify(actList));
        }
        if (rawActKey !== normActKey) {
          try { localStorage.removeItem(rawActKey); } catch (e) {}
        }
        // Cập nhật trực tiếp lên DOM nếu bảng Dữ liệu hoạt động đang hiển thị
        const rows = document.querySelectorAll('#activity-tbody tr:not(#no-activity-row)');
        rows.forEach(tr => {
          const actNameLower = (tr.dataset.sourceName || '').toLowerCase();
          const isMatch = (srcId && tr.dataset.sourceId === srcId) ||
                          (srcNameLower && actNameLower.includes(srcNameLower)) ||
                          (actNameLower && srcNameLower.includes(actNameLower));
          if (isMatch && tr.dataset.isBaseline === 'true') {
            tr.dataset.amount = dailyQty;
            tr.dataset.co2e = (dailyQty * efFactor).toFixed(2);
            tr.dataset.finalFactor = efFactor;
            tr.dataset.unit = unitName;
            tr.dataset.doc = docStr;
            if (typeof updateRowHTML === 'function') {
              updateRowHTML(tr, tr.dataset);
            }
          }
        });
      }
    }

    // --- BỘ CÔNG CỤ QUẢN LÝ NGÀY NGHỈ CA MÁY (CHỦ NHẬT, THỨ 7, LỄ/TẾT VN) ---
    function isVnPublicHoliday(dateStr) {
      if (!dateStr || typeof dateStr !== 'string') return false;
      const parts = dateStr.trim().split(/[-/]/);
      if (parts.length !== 3) return false;
      let y, m, d;
      if (parts[0].length === 4) {
        y = parts[0];
        m = String(parseInt(parts[1], 10)).padStart(2, '0');
        d = String(parseInt(parts[2], 10)).padStart(2, '0');
      } else {
        d = String(parseInt(parts[0], 10)).padStart(2, '0');
        m = String(parseInt(parts[1], 10)).padStart(2, '0');
        y = parts[2];
      }
      const normDate = `${y}-${m}-${d}`;
      const md = `${m}-${d}`;

      // 1. Ngày lễ cố định dương lịch hàng năm
      // 01-01: Tết Dương lịch, 04-30: 30/4, 05-01: 1/5
      // 09-01, 09-02, 09-03: Đợt nghỉ lễ Quốc khánh 2/9 chính thức theo Bộ luật Lao động
      if (md === '01-01' || md === '04-30' || md === '05-01' || md === '09-01' || md === '09-02' || md === '09-03') {
        return true;
      }

      // 2. Lịch nghỉ chính thức chi tiết theo từng năm (Tết Âm Lịch, Giỗ Tổ Hùng Vương, ngày nghỉ bù)
      const holidaySetsByYear = {
        '2024': new Set([
          '2024-02-08', '2024-02-09', '2024-02-10', '2024-02-11', '2024-02-12', '2024-02-13', '2024-02-14',
          '2024-04-18',
          '2024-09-01', '2024-09-02', '2024-09-03'
        ]),
        '2025': new Set([
          '2025-01-25', '2025-01-26', '2025-01-27', '2025-01-28', '2025-01-29', '2025-01-30', '2025-01-31', '2025-02-01', '2025-02-02',
          '2025-04-07',
          '2025-09-01', '2025-09-02', '2025-09-03'
        ]),
        '2026': new Set([
          '2026-02-14', '2026-02-15', '2026-02-16', '2026-02-17', '2026-02-18', '2026-02-19', '2026-02-20', '2026-02-21', '2026-02-22', // Kỳ nghỉ Tết Bính Ngọ 2026
          '2026-04-26', // Giỗ Tổ Hùng Vương (10/3 AL)
          '2026-09-01', '2026-09-02', '2026-09-03'  // Nghỉ liền kề Quốc khánh
        ]),
        '2027': new Set([
          '2027-02-05', '2027-02-06', '2027-02-07', '2027-02-08', '2027-02-09', '2027-02-10', '2027-02-11', '2027-02-12', '2027-02-13',
          '2027-04-16',
          '2027-09-01', '2027-09-02', '2027-09-03'
        ])
      };

      if (holidaySetsByYear[y] && holidaySetsByYear[y].has(normDate)) {
        return true;
      }
      return false;
    }

    function removeActivityDaysOff(type) {
      const username = localStorage.getItem('gs_current_user') || localStorage.getItem('gs_user') || 'guest';
      const rawUser = username.trim();
      const branchEl = document.getElementById('branch-selector');
      const branchName = (branchEl && branchEl.value) ? branchEl.value : 'main';
      const branchKey = branchName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
      const normActKey = getBranchStorageKey('activity');
      const rawActKey = `gs_data_${rawUser}_${branchKey}_activity`;
      const activityKey = normActKey;
      const activities = JSON.parse(
        localStorage.getItem(normActKey) ||
        localStorage.getItem(rawActKey) ||
        '[]'
      );

      const curYear = document.getElementById('act-filter-year')?.value || new Date().getFullYear().toString();
      const curMonth = document.getElementById('act-filter-month')?.value || '';

      // Tùy chọn phạm vi: Cho phép xóa trên toàn bộ cả năm hoặc riêng tháng đang chọn
      let applyAllMonths = false;
      if (curMonth) {
        const typeLabel = (type === 'sundays') ? 'các ngày Chủ nhật' : (type === 'weekends' ? 'Thứ 7 & Chủ nhật' : (type === 'holidays' ? 'các ngày nghỉ Lễ/Tết VN' : ''));
        if (type === 'holidays' || type === 'sundays' || type === 'weekends') {
          applyAllMonths = confirm(`Hệ thống đang lọc xem Tháng ${parseInt(curMonth, 10)}/${curYear}.\n\nBấm [OK] để áp dụng xóa ${typeLabel} cho TOÀN BỘ CẢ NĂM ${curYear}.\nBấm [Cancel] nếu bạn chỉ muốn xóa riêng trong Tháng ${parseInt(curMonth, 10)}.`);
        }
      }

      const monthPrefix = (curMonth && !applyAllMonths) ? `${curYear}-${curMonth}` : `${curYear}-`;

      let customTargetDate = '';
      if (type === 'custom') {
        const defaultDate = curMonth ? `${curYear}-${curMonth}-01` : `${curYear}-01-01`;
        customTargetDate = prompt('Nhập ngày muốn xóa toàn bộ ca máy vận hành (Định dạng YYYY-MM-DD):', defaultDate);
        if (!customTargetDate) return;
        if (!/^\d{4}-\d{2}-\d{2}$/.test(customTargetDate)) {
          alert('Định dạng ngày không hợp lệ. Vui lòng nhập theo dạng YYYY-MM-DD (Ví dụ: 2026-02-15).');
          return;
        }
      }

      let removedCount = 0;
      const remaining = activities.filter(act => {
        // 1. Tuyệt đối bảo vệ hóa đơn của kế toán
        const isAccRecord = (act.entryRole === 'accountant') || (!act.entryRole && act.isInvoice === 'true');
        if (isAccRecord) return true;

        // 2. TUYỆT ĐỐI BẢO VỆ ĐỊNH MỨC THÁNG (BASELINE)
        // Baseline là tổng hợp định mức cho cả tháng, không phải ca máy của 1 ngày riêng lẻ.
        // Tránh tình trạng ngày cuối tháng 5 (31/5 là CN) hay cuối tháng 10 (31/10 là T7) bị xóa nhầm!
        if (act.isBaseline === 'true' || act.entryMode === 'auto_baseline') return true;

        // 3. Chỉ lọc các ca máy trong phạm vi năm/tháng đang chọn
        if (!act.date || !act.date.startsWith(monthPrefix)) return true;

        if (type === 'custom') {
          if (act.date === customTargetDate) {
            removedCount++;
            return false;
          }
          return true;
        }

        const parts = act.date.trim().split(/[-/]/);
        if (parts.length !== 3) return true;
        let y, m, d;
        if (parts[0].length === 4) {
          y = parts[0];
          m = String(parseInt(parts[1], 10)).padStart(2, '0');
          d = String(parseInt(parts[2], 10)).padStart(2, '0');
        } else {
          d = String(parseInt(parts[0], 10)).padStart(2, '0');
          m = String(parseInt(parts[1], 10)).padStart(2, '0');
          y = parts[2];
        }
        const dObj = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
        const dow = dObj.getDay(); // 0 = CN, 6 = T7

        if (type === 'sundays') {
          if (dow === 0) {
            removedCount++;
            return false;
          }
        } else if (type === 'weekends') {
          if (dow === 0 || dow === 6) {
            removedCount++;
            return false;
          }
        } else if (type === 'holidays') {
          if (isVnPublicHoliday(act.date)) {
            removedCount++;
            return false;
          }
        }

        return true;
      });

      if (removedCount === 0) {
        let msg = 'Không tìm thấy ca máy vận hành nào phù hợp để xóa trong kỳ đang chọn.';
        if (type === 'sundays') msg = 'Không có ca máy vận hành nào rơi vào Chủ nhật trong kỳ này.';
        if (type === 'weekends') msg = 'Không có ca máy vận hành nào rơi vào Thứ 7 hoặc Chủ nhật trong kỳ này.';
        if (type === 'holidays') msg = 'Không có ca máy vận hành nào trùng với các ngày nghỉ Lễ/Tết trong kỳ này.';
        alert(msg);
        return;
      }

      const periodDesc = curMonth ? `Tháng ${parseInt(curMonth, 10)}/${curYear}` : `Năm ${curYear}`;
      const confirmMsg = type === 'sundays' 
        ? `Xác nhận xóa ${removedCount} ca máy vận hành rơi vào các ngày Chủ nhật trong ${periodDesc}?`
        : type === 'weekends'
        ? `Xác nhận xóa ${removedCount} ca máy vận hành rơi vào Thứ 7 và Chủ nhật trong ${periodDesc}?`
        : type === 'holidays'
        ? `Xác nhận xóa ${removedCount} ca máy vận hành trùng các ngày nghỉ Lễ/Tết VN trong ${periodDesc}?`
        : `Xác nhận xóa ${removedCount} ca máy vận hành vào ngày ${customTargetDate}?`;

      if (!confirm(confirmMsg)) return;

      if (typeof safeSaveActivities === 'function') {
        safeSaveActivities(normActKey, remaining);
      } else {
        localStorage.setItem(normActKey, JSON.stringify(remaining));
      }
      if (rawActKey !== normActKey) {
        try { localStorage.removeItem(rawActKey); } catch (e) {}
      }
      loadActivityList();
      if (typeof renderMachineOverview === 'function') renderMachineOverview();
      if (typeof renderReconciliationSummary === 'function') renderReconciliationSummary();
      if (typeof renderDashboard === 'function') renderDashboard();
      if (typeof updateDashboard === 'function') updateDashboard();

      alert(`Đã xóa thành công ${removedCount} ca máy vận hành. Bảng nhật ký, bảng đối soát và biểu đồ đã được cập nhật lại theo lịch làm việc thực tế.`);
    }

    // Toggle menu dropdown ngày nghỉ
    const btnDayOffMenu = document.getElementById('btn-day-off-menu');
    const dayOffDropdown = document.getElementById('day-off-dropdown-menu');
    if (btnDayOffMenu && dayOffDropdown) {
      // Inline onclick window.toggleDayOffMenu(event) handles the toggle.
      // Outside click listener closes the dropdown when clicking elsewhere.
      document.addEventListener('click', (e) => {
        if (!btnDayOffMenu.contains(e.target) && !dayOffDropdown.contains(e.target)) {
          dayOffDropdown.style.display = 'none';
        }
      });
    }

    // Các tùy chọn xóa ngày nghỉ
    const btnRemoveSundays = document.getElementById('btn-remove-sundays');
    if (btnRemoveSundays) {
      btnRemoveSundays.addEventListener('click', () => {
        if (dayOffDropdown) dayOffDropdown.style.display = 'none';
        removeActivityDaysOff('sundays');
      });
    }

    const btnRemoveWeekends = document.getElementById('btn-remove-weekends');
    if (btnRemoveWeekends) {
      btnRemoveWeekends.addEventListener('click', () => {
        if (dayOffDropdown) dayOffDropdown.style.display = 'none';
        removeActivityDaysOff('weekends');
      });
    }

    const btnRemoveHolidays = document.getElementById('btn-remove-holidays');
    if (btnRemoveHolidays) {
      btnRemoveHolidays.addEventListener('click', () => {
        if (dayOffDropdown) dayOffDropdown.style.display = 'none';
        removeActivityDaysOff('holidays');
      });
    }

    const btnRemoveCustomDate = document.getElementById('btn-remove-custom-date');
    if (btnRemoveCustomDate) {
      btnRemoveCustomDate.addEventListener('click', () => {
        if (dayOffDropdown) dayOffDropdown.style.display = 'none';
        removeActivityDaysOff('custom');
      });
    }

    // ============================================
    // QUẢN LÝ SẢN LƯỢNG QUÁ TRÌNH CÔNG NGHỆ (IPPU) & NHẮC NHỞ KỸ SƯ
    // ============================================
    function updateProductionReminderBanner() {
      const banner = document.getElementById('production-reminder-banner');
      const bannerText = document.getElementById('production-reminder-text');
      if (!banner) return;

      const curUserRole = localStorage.getItem('gs_user_role') || 'engineer';
      if (curUserRole === 'accountant') {
        banner.style.display = 'none';
        return;
      }

      const username = localStorage.getItem('gs_current_user') || 'guest';
      const rawUser = username.trim();
      const userSlug = rawUser.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '') || 'guest';
      const branchEl = document.getElementById('branch-selector');
      const branchName = (branchEl && branchEl.value) ? branchEl.value : 'main';
      const branchKey = branchName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');

      let sources = [];
      try {
        sources = JSON.parse(
          localStorage.getItem(getBranchStorageKey('sources')) ||
          localStorage.getItem(`gs_data_${userSlug}_${branchKey}_sources`) ||
          localStorage.getItem(`gs_data_${rawUser}_${branchKey}_sources`) ||
          '[]'
        );
      } catch(e) {}

      if (!Array.isArray(sources) || sources.length === 0) {
        const sourceRows = document.querySelectorAll('#source-tbody tr:not(#no-source-row)');
        sourceRows.forEach(r => { sources.push({ ...r.dataset }); });
      }

      const btnQuickLogProd = document.getElementById('btn-quick-log-production');

      const processSources = sources.filter(s => {
        const cat = s.category || '';
        const isElec = cat.includes('điện') || cat.includes('Điện');
        const isComb = cat.includes('đốt cháy') || cat.includes('Đốt cháy');
        const isFug = cat.includes('rò rỉ') || cat.includes('thất thoát');
        return (!isElec && !isComb && !isFug) && (
          s.isProcessEmission === 'true' ||
          cat === 'Các quá trình công nghiệp' ||
          (s.measure && s.measure.includes('sản lượng')) ||
          Boolean(s.productionUnit && s.productName) ||
          (s.type && (s.type.includes('quá trình công nghiệp') || s.type.includes('thổi oxy') || s.type.includes('luyện thép')))
        );
      });

      if (btnQuickLogProd) {
        if (processSources.length === 0) {
          btnQuickLogProd.style.display = 'none';
        } else {
          btnQuickLogProd.style.display = 'inline-block';
          const firstIppu = processSources[0];
          const prodName = firstIppu.productName || 'sản phẩm';
          btnQuickLogProd.setAttribute('title', `Ghi nhận nhanh sản lượng ${prodName} ca / ngày hôm nay`);
        }
      }

      if (processSources.length === 0) {
        banner.style.display = 'none';
        return;
      }

      const activeYear = document.getElementById('act-filter-year')?.value || '2026';
      const activeMonth = document.getElementById('act-filter-month')?.value || '';

      let activities = [];
      try {
        activities = JSON.parse(
          localStorage.getItem(getBranchStorageKey('activity')) ||
          localStorage.getItem(`gs_data_${userSlug}_${branchKey}_activity`) ||
          localStorage.getItem(`gs_data_${rawUser}_${branchKey}_activity`) ||
          '[]'
        );
      } catch(e) {}

      // Kiểm tra xem nguồn phát thải công nghệ nào chưa có bản ghi sản lượng thực tế
      const missingSource = processSources.find(ps => {
        const hasActual = activities.some(a => {
          const matchSource = (a.sourceId === ps.id || a.sourceName === ps.name || a.sourceType === ps.type || (a.sourceName && ps.eq && a.sourceName.includes(ps.eq)));
          const matchYear = !a.date || a.date.startsWith(activeYear);
          const matchMonth = !activeMonth || (a.date && a.date.split('-')[1] === activeMonth);
          const isActual = a.isBaseline !== 'true' && parseFloat(a.amount) > 0;
          return matchSource && matchYear && matchMonth && isActual;
        });
        return !hasActual;
      });

      if (missingSource) {
        banner.style.display = 'flex';
        const sName = missingSource.eq || missingSource.name || missingSource.type || 'Lò hồ quang điện EAF';
        const prodName = missingSource.productName || 'phôi thép / sản phẩm';
        if (bannerText) {
          bannerText.innerHTML = `<strong>Nhắc nhở Kỹ sư:</strong> Nguồn phát thải công nghệ <strong>[${sName}]</strong> chưa có số liệu sản lượng thực tế (${prodName}) trong kỳ kiểm kê.`;
        }
        banner.dataset.targetSourceId = missingSource.id || '';
      } else {
        banner.style.display = 'none';
      }
    }

    function triggerQuickProductionInput(preferredSourceId) {
      // Đặt bộ lọc nguồn về tất cả để khi lưu, kỹ sư thấy ngay dòng mới xuất hiện trên bảng
      if (actHiddenFilter) actHiddenFilter.value = '';
      if (actFilterInput) actFilterInput.innerText = '-- Tất cả Nguồn phát thải --';
      applyFilter('');

      openModal(null, true);
      setTimeout(() => {
        let targetOption = null;
        if (preferredSourceId) {
          for (let i = 0; i < sourceSelect.options.length; i++) {
            if (sourceSelect.options[i].value === preferredSourceId) {
              targetOption = sourceSelect.options[i];
              sourceSelect.selectedIndex = i;
              break;
            }
          }
        }
        if (!targetOption && sourceSelect.options.length > 1) {
          for (let i = 1; i < sourceSelect.options.length; i++) {
            const opt = sourceSelect.options[i];
            const textLower = opt.text.toLowerCase();
            const typeLower = (opt.dataset.type || '').toLowerCase();
            if (opt.dataset.isProcessEmission === 'true' || textLower.includes('quá trình') || textLower.includes('ippu') || typeLower.includes('quá trình công nghiệp') || typeLower.includes('thổi oxy')) {
              targetOption = opt;
              sourceSelect.selectedIndex = i;
              break;
            }
          }
          if (!targetOption && sourceSelect.options.length > 1) {
            sourceSelect.selectedIndex = 1;
            targetOption = sourceSelect.options[1];
          }
        }

        if (targetOption) {
          sourceSelect.dispatchEvent(new Event('change'));
        }

        const dateFilterVal = document.getElementById('act-filter-date')?.value;
        const dateInput = document.getElementById('activity-date');
        if (dateInput) {
          dateInput.value = dateFilterVal || new Date().toISOString().slice(0, 10);
        }

        const prodName = (targetOption && targetOption.dataset.productName) ? targetOption.dataset.productName : 'sản phẩm';
        const prodUnit = (targetOption && targetOption.dataset.productionUnit) ? targetOption.dataset.productionUnit : 'tấn';

        const unitInput = document.getElementById('activity-unit');
        if (unitInput) {
          unitInput.value = prodUnit;
        }

        const docInput = document.getElementById('activity-doc');
        if (docInput && (!docInput.value || docInput.value.includes('phôi thép'))) {
          docInput.value = `Phiếu cân ca máy - Nghiệm thu ${prodName}`;
        }

        switchActivityInputMode('direct');

        const panelDirectText = document.getElementById('panel-direct');
        if (panelDirectText) {
          panelDirectText.innerText = `Ghi nhận sản lượng ${prodName} thực tế ra lò / thành phẩm theo số đo bàn cân điện tử hoặc biên bản giao nhận ca.`;
        }

        let qDayPlaceholder = '1916.93';
        if (targetOption && targetOption.dataset.annualEstQty) {
          const aQty = parseFloat(targetOption.dataset.annualEstQty) || 0;
          const dWk = parseFloat(targetOption.dataset.opDaysWeek) || 6;
          const wDays = (dWk === 6) ? 313 : (dWk === 5 ? 261 : (dWk === 7 ? 365 : Math.round(52 * dWk)));
          if (aQty > 0 && wDays > 0) {
            qDayPlaceholder = (aQty / wDays).toFixed(2);
          }
        }

        const amountInput = document.getElementById('activity-amount');
        const targetSrcId = targetOption ? targetOption.value : '';
        const targetSrcName = targetOption ? targetOption.text : '';

        // Tự động kiểm tra và gắn kết dòng sản lượng đã chốt trước đó (nếu có) để kỹ sư sửa trực tiếp
        function bindExistingProductionRow(targetDate) {
          const rows = tbody.querySelectorAll('tr:not(#no-activity-row)');
          let foundRow = null;
          for (const r of rows) {
            if (r.dataset.date === targetDate && (r.dataset.sourceId === targetSrcId || r.dataset.sourceName === targetSrcName)) {
              const rType = (r.dataset.recordType || '').toLowerCase();
              const rUnit = (r.dataset.unit || '').toLowerCase();
              if (rType === 'actual_production' || r.dataset.isProcessEmission === 'true' || rUnit.includes('tấn') || r.dataset.isBaseline === 'true') {
                foundRow = r;
                if (rType === 'actual_production' || r.dataset.isBaseline !== 'true') break;
              }
            }
          }
          if (foundRow) {
            currentEditingRow = foundRow;
            const amt = parseFloat(foundRow.dataset.amount);
            if (!isNaN(amt) && amt > 0 && foundRow.dataset.isBaseline !== 'true') {
              if (amountInput) amountInput.value = amt;
            } else {
              if (amountInput) amountInput.value = '';
            }
            if (foundRow.dataset.doc && docInput) {
              docInput.value = foundRow.dataset.doc;
            }
          } else {
            currentEditingRow = null;
            if (amountInput) amountInput.value = '';
          }
        }

        bindExistingProductionRow(dateInput?.value || new Date().toISOString().slice(0, 10));

        if (dateInput) {
          dateInput.onchange = function() {
            bindExistingProductionRow(dateInput.value);
          };
        }

        if (amountInput) {
          amountInput.placeholder = `Ví dụ: ${qDayPlaceholder} (tấn/ngày)`;
          amountInput.readOnly = false;
          amountInput.style.background = '#ffffff';
          amountInput.focus();
          if (amountInput.value) amountInput.select();
        }
      }, 100);
    }

    const btnReminderInputProd = document.getElementById('btn-reminder-input-production');
    if (btnReminderInputProd) {
      btnReminderInputProd.addEventListener('click', () => {
        const banner = document.getElementById('production-reminder-banner');
        const targetId = banner ? banner.dataset.targetSourceId : '';
        triggerQuickProductionInput(targetId);
      });
    }

    const btnQuickLogProd = document.getElementById('btn-quick-log-production');
    if (btnQuickLogProd) {
      btnQuickLogProd.addEventListener('click', () => {
        triggerQuickProductionInput();
      });
    }

    window.isVnPublicHoliday = isVnPublicHoliday;
    window.removeActivityDaysOff = removeActivityDaysOff;
    window.autoGenerateDailyOperationalRecords = autoGenerateDailyOperationalRecords;
    window.decodeActivitiesData = decodeActivitiesData;
    window.compactActivitiesData = compactActivitiesData;

    window.toggleActivityTableHeight = function() {
      const now = Date.now();
      if (now - _lastToggleActivityTime < 300) return;
      _lastToggleActivityTime = now;
      const card = document.getElementById('activity-table-card');
      const btn = document.getElementById('btn-toggle-table-height');
      if (!card) return;
      if (card.style.maxHeight === 'none') {
        card.style.maxHeight = '420px';
        if (btn) btn.innerText = 'Mở rộng bảng';
      } else {
        card.style.maxHeight = 'none';
        if (btn) btn.innerText = 'Thu gọn bảng';
      }
    };

    window.toggleMachineTableHeight = function() {
      const now = Date.now();
      if (now - _lastToggleMachineTime < 300) return;
      _lastToggleMachineTime = now;
      const card = document.getElementById('machine-overview-table-container');
      const btn = document.getElementById('btn-toggle-machine-table-height');
      if (!card) return;
      if (card.style.maxHeight === 'none') {
        card.style.maxHeight = '380px';
        if (btn) btn.innerText = 'Mở rộng bảng';
      } else {
        card.style.maxHeight = 'none';
        if (btn) btn.innerText = 'Thu gọn bảng';
      }
    };

    // =========================================================================
    // PHÂN HỆ KẾ TOÁN: BẢNG KÊ HÓA ĐƠN EXCEL (FILE MẪU, BÓC TÁCH & ĐỐI SOÁT NẠP HÀNG LOẠT)
    // =========================================================================
    let _parsedInvoiceRows = [];

    function downloadAccountantInvoiceTemplate() {
      try {
        const toast = document.createElement('div');
        toast.textContent = 'Đang tải file Excel mẫu Bảng kê hóa đơn cho Kế toán...';
        toast.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#0284c7;color:#fff;padding:10px 22px;border-radius:8px;font-size:0.85rem;font-weight:600;z-index:99999;box-shadow:0 4px 16px rgba(0,0,0,0.2);';
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3500);
      } catch(e) {}

      const sampleInvoiceRows = [
        {
          "Ngày hóa đơn": "15/02/2026",
          "Số hóa đơn": "HĐ-EVN-0012948",
          "Nhà cung cấp": "Công ty Điện lực EVN",
          "Hạng mục chi phí / Loại năng lượng": "Điện lưới EVN (Tổng công tơ)",
          "Số lượng tiêu thụ": 145200,
          "Đơn vị tính": "kWh",
          "Thành tiền (VNĐ)": 280000000,
          "Ghi chú / Phân xưởng sử dụng": "Điện sản xuất toàn nhà máy Tháng 02/2026"
        },
        {
          "Ngày hóa đơn": "18/02/2026",
          "Số hóa đơn": "HĐ-PETRO-912",
          "Nhà cung cấp": "Petrolimex",
          "Hạng mục chi phí / Loại năng lượng": "Dầu Diesel (DO) bồn tổng",
          "Số lượng tiêu thụ": 8000,
          "Đơn vị tính": "lít",
          "Thành tiền (VNĐ)": 168000000,
          "Ghi chú / Phân xưởng sử dụng": "Nhập bồn dầu máy phát điện & lò luyện thép"
        },
        {
          "Ngày hóa đơn": "20/02/2026",
          "Số hóa đơn": "HĐ-PETRO-950",
          "Nhà cung cấp": "Petrolimex",
          "Hạng mục chi phí / Loại năng lượng": "Xăng RON 95 (Xe công ty)",
          "Số lượng tiêu thụ": 450,
          "Đơn vị tính": "lít",
          "Thành tiền (VNĐ)": 10800000,
          "Ghi chú / Phân xưởng sử dụng": "Nhiên liệu đội xe đưa đón & công tác"
        },
        {
          "Ngày hóa đơn": "25/02/2026",
          "Số hóa đơn": "HĐ-GAS-331",
          "Nhà cung cấp": "Gas Petrolimex",
          "Hạng mục chi phí / Loại năng lượng": "Khí hóa lỏng (LPG)",
          "Số lượng tiêu thụ": 500,
          "Đơn vị tính": "kg",
          "Thành tiền (VNĐ)": 15000000,
          "Ghi chú / Phân xưởng sử dụng": "Bình gas hóa lỏng cho bếp ăn & nhiệt luyện"
        },
        {
          "Ngày hóa đơn": "26/02/2026",
          "Số hóa đơn": "HĐ-COAL-0045",
          "Nhà cung cấp": "Công ty Than Quảng Ninh",
          "Hạng mục chi phí / Loại năng lượng": "Than antraxit",
          "Số lượng tiêu thụ": 12000,
          "Đơn vị tính": "kg",
          "Thành tiền (VNĐ)": 36000000,
          "Ghi chú / Phân xưởng sử dụng": "Nhiên liệu đốt lò hơi phụ trợ"
        }
      ];

      const sheetName = "Bang_Ke_Hoa_Don_Nang_Luong";
      const fileName = "GreenShift_Mau_Bang_Ke_Hoa_Don_Ke_Toan";

      if (typeof XLSX !== 'undefined') {
        const ws = XLSX.utils.json_to_sheet(sampleInvoiceRows);
        ws['!cols'] = [
          { wch: 16 },
          { wch: 22 },
          { wch: 28 },
          { wch: 38 },
          { wch: 20 },
          { wch: 14 },
          { wch: 20 },
          { wch: 45 }
        ];
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, sheetName);
        XLSX.writeFile(wb, `${fileName}.xlsx`);
      } else {
        let csv = "\uFEFFNgày hóa đơn,Số hóa đơn,Nhà cung cấp,Hạng mục chi phí / Loại năng lượng,Số lượng tiêu thụ,Đơn vị tính,Thành tiền (VNĐ),Ghi chú / Phân xưởng sử dụng\n";
        sampleInvoiceRows.forEach(row => {
          csv += `"${row['Ngày hóa đơn']}","${row['Số hóa đơn']}","${row['Nhà cung cấp']}","${row['Hạng mục chi phí / Loại năng lượng']}","${row['Số lượng tiêu thụ']}","${row['Đơn vị tính']}","${row['Thành tiền (VNĐ)']}","${row['Ghi chú / Phân xưởng sử dụng']}"\n`;
        });
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `${fileName}.csv`;
        document.body.appendChild(link);
        link.click();
        link.remove();
      }

      try {
        const dlToast = document.createElement('div');
        dlToast.textContent = 'Đã tải file mẫu Bảng kê Hóa đơn về máy! Bạn có thể điền số liệu rồi bấm "Tải Bảng kê HĐ" để nạp trực tiếp vào hệ thống.';
        dlToast.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#166534;color:#fff;padding:12px 24px;border-radius:8px;font-size:0.85rem;z-index:99999;box-shadow:0 4px 16px rgba(0,0,0,0.2);max-width:90%;text-align:center;line-height:1.4;';
        document.body.appendChild(dlToast);
        setTimeout(() => dlToast.remove(), 4500);
      } catch(e) {}
    }

    function findRowVal(row, candidates) {
      if (!row || typeof row !== 'object') return '';
      for (const c of candidates) {
        if (row[c] !== undefined && row[c] !== null && String(row[c]).trim() !== '') {
          return String(row[c]).trim();
        }
      }
      const keys = Object.keys(row);
      for (const c of candidates) {
        const cNorm = c.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '');
        for (const k of keys) {
          const kNorm = k.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '');
          if (kNorm === cNorm || kNorm.includes(cNorm) || cNorm.includes(kNorm)) {
            if (row[k] !== undefined && row[k] !== null && String(row[k]).trim() !== '') {
              return String(row[k]).trim();
            }
          }
        }
      }
      return '';
    }

    function normalizeSheetDate(val) {
      if (!val) return new Date().toISOString().slice(0, 10);
      const s = String(val).trim();
      if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
      // YYYY/MM/DD or YYYY.MM.DD
      const ymdMatch = s.match(/^(\d{4})[\/\.\-](\d{1,2})[\/\.\-](\d{1,2})$/);
      if (ymdMatch) {
        return `${ymdMatch[1]}-${ymdMatch[2].padStart(2, '0')}-${ymdMatch[3].padStart(2, '0')}`;
      }
      // DD/MM/YYYY or DD-MM-YYYY or DD.MM.YYYY
      const vnMatch = s.match(/^(\d{1,2})[\/\.\-](\d{1,2})[\/\.\-](\d{4})/);
      if (vnMatch) {
        const d = vnMatch[1].padStart(2, '0');
        const m = vnMatch[2].padStart(2, '0');
        const y = vnMatch[3];
        return `${y}-${m}-${d}`;
      }
      // Month-Year format: MM/YYYY, Tháng M/YYYY, T3/2026
      const myMatch = s.match(/(?:tháng\s*|t\s*)?(\d{1,2})[\/\-](\d{4})/i);
      if (myMatch) {
        const m = myMatch[1].padStart(2, '0');
        const y = myMatch[2];
        return `${y}-${m}-01`;
      }
      const ymMatch = s.match(/^(\d{4})[\/\-](\d{1,2})$/);
      if (ymMatch) {
        return `${ymMatch[1]}-${ymMatch[2].padStart(2, '0')}-01`;
      }
      const num = parseFloat(s);
      if (!isNaN(num) && num > 30000 && num < 60000) {
        try {
          const d = new Date(Math.round((num - 25569) * 86400 * 1000));
          return d.toISOString().slice(0, 10);
        } catch(e) {}
      }
      try {
        const parsed = new Date(s);
        if (!isNaN(parsed.getTime())) {
          return parsed.toISOString().slice(0, 10);
        }
      } catch(e) {}
      return new Date().toISOString().slice(0, 10);
    }

    function parseInvoiceSheetRows(rows) {
      const parsed = [];
      const facSources = (window.InvoiceParser && window.InvoiceParser.FACILITY_ENERGY_SOURCES)
        ? window.InvoiceParser.FACILITY_ENERGY_SOURCES
        : [];

      rows.forEach((r, idx) => {
        const rawDate = findRowVal(r, ['Ngày hóa đơn', 'Ngày lập', 'Ngày HĐ', 'Ngày', 'Date', 'InvoiceDate']);
        const rawInvNo = findRowVal(r, ['Số hóa đơn', 'Số HĐ', 'Số chứng từ', 'Số HĐ / Chứng từ', 'InvoiceNumber', 'InvNum', 'SHDon', 'Số']);
        const rawSeller = findRowVal(r, ['Nhà cung cấp', 'Đơn vị bán', 'Người bán', 'Tên người bán', 'Supplier', 'Seller', 'Vendor']);
        const rawItem = findRowVal(r, ['Hạng mục chi phí / Loại năng lượng', 'Hạng mục', 'Hàng hóa', 'Tên hàng', 'Mặt hàng', 'Chi phí', 'Loại năng lượng', 'ItemName', 'Category', 'Tên hàng hóa dịch vụ']);
        const rawQtyStr = findRowVal(r, ['Số lượng tiêu thụ', 'Số lượng', 'Lượng dùng', 'Lượng tiêu thụ', 'SL', 'Quantity', 'Qty']);
        const rawUnit = findRowVal(r, ['Đơn vị tính', 'Đơn vị', 'ĐVT', 'Unit']);
        const rawAmount = findRowVal(r, ['Thành tiền (VNĐ)', 'Thành tiền', 'Tổng tiền', 'Tiền', 'Amount', 'TotalAmount']);
        const rawNote = findRowVal(r, ['Ghi chú / Phân xưởng sử dụng', 'Ghi chú', 'Diễn giải', 'Mục đích', 'Note', 'Description']);

        const parseNum = (window.InvoiceParser && typeof window.InvoiceParser.normalizeQuantity === 'function')
          ? window.InvoiceParser.normalizeQuantity
          : ((typeof window.parseVnNumber === 'function') ? window.parseVnNumber : parseFloat);

        const qty = parseNum(rawQtyStr);
        if (qty <= 0 && !rawItem && !rawInvNo) return; // Bỏ qua dòng trống

        const dateIso = normalizeSheetDate(rawDate);
        const combinedText = `${rawItem} ${rawSeller} ${rawUnit} ${rawNote}`;

        let matchedSrc = null;
        if (window.InvoiceParser && typeof window.InvoiceParser.matchFacilitySource === 'function') {
          matchedSrc = window.InvoiceParser.matchFacilitySource(combinedText);
        }

        const isMatched = Boolean(matchedSrc && !matchedSrc.unmatched && matchedSrc.id !== 'src_fac_unmatched');
        const fallbackSrc = facSources[0] || {
          id: 'src_fac_electricity',
          name: 'Điện lưới EVN mua ngoài (Tổng công tơ nhà máy)',
          type: 'Điện mua vào',
          ef: 'Điện lưới Việt Nam',
          efFactor: '0.6766',
          unit: 'kWh'
        };

        const targetSrc = isMatched ? matchedSrc : fallbackSrc;
        const factor = parseFloat(targetSrc.efFactor) || 0;
        const finalUnit = rawUnit || targetSrc.unit || 'kWh';
        const co2e = qty * factor;

        parsed.push({
          index: idx,
          date: dateIso,
          invoiceNo: rawInvNo,
          seller: rawSeller,
          rawItem: rawItem,
          sourceId: targetSrc.id,
          sourceName: targetSrc.name,
          sourceType: targetSrc.type || 'Đốt cháy cố định',
          efName: targetSrc.ef || targetSrc.name,
          factor: factor,
          quantity: qty,
          unit: finalUnit,
          amountVnd: parseNum(rawAmount),
          note: rawNote,
          co2e: co2e,
          isMatched: isMatched,
          attachedFile: null,
          fileName: '',
          docId: '',
          fileUrl: '',
          fileType: ''
        });
      });

      return parsed;
    }

    let _currentInvoiceExcelFile = null;

    function handleInvoiceExcelImport(file) {
      if (!file) return;
      _currentInvoiceExcelFile = file;
      const reader = new FileReader();

      reader.onload = function(evt) {
        try {
          let rows = [];
          if (typeof XLSX !== 'undefined') {
            const data = new Uint8Array(evt.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const firstSheet = workbook.SheetNames[0];
            rows = XLSX.utils.sheet_to_json(workbook.Sheets[firstSheet], { defval: '' });
          } else {
            const text = new TextDecoder('utf-8').decode(evt.target.result);
            const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
            if (lines.length > 1) {
              const headers = lines[0].split(',').map(h => h.replace(/^["']|["']$/g, '').trim());
              for (let i = 1; i < lines.length; i++) {
                const vals = lines[i].split(',').map(v => v.replace(/^["']|["']$/g, '').trim());
                const row = {};
                headers.forEach((h, idx) => { row[h] = vals[idx] || ''; });
                rows.push(row);
              }
            }
          }

          if (!rows || rows.length === 0) {
            alert('File không có dữ liệu hoặc không đúng định dạng bảng kê!');
            return;
          }

          const parsedRows = parseInvoiceSheetRows(rows);
          if (parsedRows.length === 0) {
            alert('Không tìm thấy dòng dữ liệu hóa đơn hợp lệ trong file!');
            return;
          }

          openInvoiceImportPreviewModal(parsedRows);
        } catch (err) {
          console.error('[Invoice Import] Lỗi đọc file Excel:', err);
          alert('Đã xảy ra lỗi khi đọc file bảng kê hóa đơn: ' + err.message);
        }
      };

      if (typeof XLSX !== 'undefined') {
        reader.readAsArrayBuffer(file);
      } else {
        reader.readAsText(file);
      }
    }

    function renderInvoiceProofCell(row, idx) {
      if (row && row.attachedFile) {
        const fname = row.attachedFile.name || 'Hóa đơn';
        return `<div style="display: inline-flex; align-items: center; justify-content: center; gap: 4px; background: #ecfdf5; border: 1px solid #a7f3d0; padding: 2px 6px; border-radius: 4px; max-width: 120px;" title="${fname}">
          <span style="font-size: 0.72rem; color: #065f46; font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${fname}</span>
          <button type="button" class="btn-remove-row-proof" data-index="${idx}" style="background: transparent; border: none; color: #dc2626; font-size: 0.85rem; font-weight: bold; cursor: pointer; padding: 0 2px; line-height: 1;" title="Gỡ bỏ tệp">&times;</button>
        </div>`;
      }
      return `<label style="display: inline-flex; align-items: center; justify-content: center; gap: 4px; background: #f0f9ff; border: 1px solid #bae6fd; color: #0284c7; padding: 2px 8px; border-radius: 4px; font-size: 0.72rem; font-weight: 600; cursor: pointer; transition: all 0.15s;" title="Đính kèm ảnh hoặc PDF hóa đơn cho dòng này">
        <input type="file" class="inv-row-proof-input" data-index="${idx}" accept=".pdf,.png,.jpg,.jpeg,.webp,.xml" style="display: none;">
        <span>Tải tệp</span>
      </label>`;
    }

    function bindProofCellEvents(cell, rowIdx) {
      if (!cell) return;
      const btnRemove = cell.querySelector('.btn-remove-row-proof');
      if (btnRemove) {
        btnRemove.addEventListener('click', function(e) {
          e.stopPropagation();
          if (_parsedInvoiceRows && _parsedInvoiceRows[rowIdx]) {
            _parsedInvoiceRows[rowIdx].attachedFile = null;
            _parsedInvoiceRows[rowIdx].fileName = '';
            _parsedInvoiceRows[rowIdx].docId = '';
            _parsedInvoiceRows[rowIdx].fileUrl = '';
            _parsedInvoiceRows[rowIdx].fileType = '';
            cell.innerHTML = renderInvoiceProofCell(_parsedInvoiceRows[rowIdx], rowIdx);
            bindProofCellEvents(cell, rowIdx);
          }
        });
      }
      const inp = cell.querySelector('.inv-row-proof-input');
      if (inp) {
        inp.addEventListener('change', function(e) {
          const file = e.target.files && e.target.files[0];
          if (file && _parsedInvoiceRows && _parsedInvoiceRows[rowIdx]) {
            _parsedInvoiceRows[rowIdx].attachedFile = file;
            _parsedInvoiceRows[rowIdx].fileName = file.name;
            _parsedInvoiceRows[rowIdx].fileType = file.type || '';
            cell.innerHTML = renderInvoiceProofCell(_parsedInvoiceRows[rowIdx], rowIdx);
            bindProofCellEvents(cell, rowIdx);
          }
        });
      }
    }

    function openInvoiceImportPreviewModal(parsedRows) {
      const modal = document.getElementById('modal-invoice-import-preview');
      if (!modal) return;
      _parsedInvoiceRows = parsedRows || [];

      const tbody = document.getElementById('invoice-preview-tbody');
      const statTotal = document.getElementById('inv-stat-total');
      const statMatched = document.getElementById('inv-stat-matched');
      const statUnmatched = document.getElementById('inv-stat-unmatched');
      const statUnmatchedBox = document.getElementById('inv-stat-unmatched-box');
      const statEmission = document.getElementById('inv-stat-total-emission');
      const infoBatchEl = document.getElementById('inv-batch-attached-info');
      if (infoBatchEl) infoBatchEl.style.display = 'none';

      if (statTotal) statTotal.innerText = _parsedInvoiceRows.length;

      let matchedCount = 0;
      let unmatchedCount = 0;
      let totalCo2e = 0;

      const facSources = (window.InvoiceParser && window.InvoiceParser.FACILITY_ENERGY_SOURCES)
        ? window.InvoiceParser.FACILITY_ENERGY_SOURCES
        : [];

      if (tbody) {
        tbody.innerHTML = '';
        _parsedInvoiceRows.forEach((row, idx) => {
          if (row.isMatched) matchedCount++;
          else unmatchedCount++;
          totalCo2e += (row.co2e || 0);

          const tr = document.createElement('tr');
          tr.style.borderBottom = '1px solid #e2e8f0';

          let selectOptionsHtml = '';
          facSources.forEach(src => {
            const isSel = (src.id === row.sourceId) ? 'selected' : '';
            selectOptionsHtml += `<option value="${src.id}" data-factor="${src.efFactor}" data-unit="${src.unit}" data-ef="${src.ef}" data-name="${src.name}" ${isSel}>${src.name}</option>`;
          });

          const badgeHtml = row.isMatched
            ? `<span style="background: #dcfce7; color: #15803d; border: 1px solid #bbf7d0; font-size: 0.72rem; font-weight: 600; padding: 1px 6px; border-radius: 10px; margin-left: 4px; white-space: nowrap;">Tự động khớp</span>`
            : `<span style="background: #fef3c7; color: #b45309; border: 1px solid #fde68a; font-size: 0.72rem; font-weight: 600; padding: 1px 6px; border-radius: 10px; margin-left: 4px; white-space: nowrap;">Cần chọn</span>`;

          tr.innerHTML = `
            <td style="padding: 8px 10px; text-align: center; color: #64748b;">${idx + 1}</td>
            <td style="padding: 8px 10px; font-weight: 500; white-space: nowrap;">${row.date}</td>
            <td style="padding: 8px 10px; font-weight: 600; color: #1e293b;">${row.invoiceNo || '—'}</td>
            <td style="padding: 8px 10px; color: #475569;">${row.seller || '—'}</td>
            <td style="padding: 8px 10px; color: #334155;">${row.rawItem || '—'}</td>
            <td style="padding: 8px 10px;">
              <div style="display: flex; align-items: center; gap: 4px;">
                <select class="inv-preview-src-select" data-index="${idx}" style="flex: 1; padding: 4px 6px; font-size: 0.78rem; border: 1px solid #cbd5e1; border-radius: 4px; background: #fff;">
                  ${selectOptionsHtml}
                </select>
                ${badgeHtml}
              </div>
            </td>
            <td style="padding: 8px 10px; text-align: right; font-weight: 600; color: #0f172a;">${(row.quantity || 0).toLocaleString('vi-VN')}</td>
            <td style="padding: 8px 10px; text-align: center; color: #64748b;">${row.unit || ''}</td>
            <td style="padding: 8px 10px; text-align: right; font-weight: 600; color: #15803d;">${(row.co2e || 0).toLocaleString('vi-VN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            <td style="padding: 8px 10px; text-align: center;" class="inv-proof-cell" data-index="${idx}">
              ${renderInvoiceProofCell(row, idx)}
            </td>
          `;

          tbody.appendChild(tr);
        });

        tbody.querySelectorAll('.inv-proof-cell').forEach(cell => {
          const rIdx = parseInt(cell.dataset.index, 10);
          bindProofCellEvents(cell, rIdx);
        });

        tbody.querySelectorAll('.inv-preview-src-select').forEach(sel => {
          sel.addEventListener('change', function() {
            const rowIdx = parseInt(this.dataset.index, 10);
            const opt = this.options[this.selectedIndex];
            if (!_parsedInvoiceRows[rowIdx]) return;
            const newSrcId = this.value;
            const newFactor = parseFloat(opt.dataset.factor) || 0;
            const newUnit = opt.dataset.unit || _parsedInvoiceRows[rowIdx].unit;
            const newEf = opt.dataset.ef || '';
            const newSrcName = opt.dataset.name || opt.text;

            _parsedInvoiceRows[rowIdx].sourceId = newSrcId;
            _parsedInvoiceRows[rowIdx].sourceName = newSrcName;
            _parsedInvoiceRows[rowIdx].factor = newFactor;
            _parsedInvoiceRows[rowIdx].unit = newUnit;
            _parsedInvoiceRows[rowIdx].efName = newEf;
            _parsedInvoiceRows[rowIdx].co2e = _parsedInvoiceRows[rowIdx].quantity * newFactor;
            _parsedInvoiceRows[rowIdx].isMatched = true;

            let newTotalCo2e = 0;
            _parsedInvoiceRows.forEach(r => { newTotalCo2e += (r.co2e || 0); });
            if (statEmission) {
              statEmission.innerText = newTotalCo2e.toLocaleString('vi-VN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            }
            const trParent = this.closest('tr');
            if (trParent && trParent.cells[8]) {
              trParent.cells[8].innerText = (_parsedInvoiceRows[rowIdx].co2e || 0).toLocaleString('vi-VN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            }
            if (trParent && trParent.cells[7]) {
              trParent.cells[7].innerText = newUnit;
            }
          });
        });
      }

      // Xử lý tải lên chứng từ hàng loạt (Batch Proof Upload)
      const inputBatchProofs = document.getElementById('inv-batch-proof-files');
      if (inputBatchProofs) {
        inputBatchProofs.onchange = function(e) {
          const files = Array.from(e.target.files || []);
          if (files.length === 0) return;
          let matchedCount = 0;

          files.forEach(file => {
            const fNorm = file.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '');
            let targetRow = null;

            // 1. Khớp theo Số HĐ
            for (const r of _parsedInvoiceRows) {
              const invNoNorm = (r.invoiceNo || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '');
              if (invNoNorm && invNoNorm.length >= 3 && (fNorm.includes(invNoNorm) || invNoNorm.includes(fNorm))) {
                targetRow = r;
                break;
              }
            }

            // 2. Khớp theo Đơn vị bán hoặc Mặt hàng nếu chưa gắn
            if (!targetRow) {
              for (const r of _parsedInvoiceRows) {
                if (r.attachedFile) continue;
                const sellerNorm = (r.seller || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '');
                const itemNorm = (r.rawItem || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '');
                if (sellerNorm && sellerNorm.length >= 3 && fNorm.includes(sellerNorm)) {
                  targetRow = r;
                  break;
                }
                if (itemNorm && itemNorm.length >= 3 && fNorm.includes(itemNorm)) {
                  targetRow = r;
                  break;
                }
              }
            }

            // 3. Nếu chỉ có 1 tệp duy nhất và 1 dòng duy nhất
            if (!targetRow && files.length === 1 && _parsedInvoiceRows.length === 1) {
              targetRow = _parsedInvoiceRows[0];
            }

            if (targetRow) {
              targetRow.attachedFile = file;
              targetRow.fileName = file.name;
              targetRow.fileType = file.type || '';
              matchedCount++;
              const cell = tbody.querySelector(`.inv-proof-cell[data-index="${targetRow.index}"]`);
              if (cell) {
                cell.innerHTML = renderInvoiceProofCell(targetRow, targetRow.index);
                bindProofCellEvents(cell, targetRow.index);
              }
            }
          });

          const infoEl = document.getElementById('inv-batch-attached-info');
          if (infoEl) {
            infoEl.innerText = `Đã đính kèm ${matchedCount}/${files.length} tệp chứng từ`;
            infoEl.style.display = 'inline-block';
          }
          e.target.value = '';
        };
      }

      if (statMatched) statMatched.innerText = matchedCount;
      if (statUnmatched) statUnmatched.innerText = unmatchedCount;
      if (statUnmatchedBox) statUnmatchedBox.style.display = unmatchedCount > 0 ? 'inline-block' : 'none';
      if (statEmission) statEmission.innerText = totalCo2e.toLocaleString('vi-VN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

      modal.style.display = 'flex';
    }

    function closeInvoiceImportPreviewModal() {
      const modal = document.getElementById('modal-invoice-import-preview');
      if (modal) modal.style.display = 'none';
      const inputActInvoice = document.getElementById('input-act-invoice-file');
      if (inputActInvoice) inputActInvoice.value = '';
    }

    async function commitBatchInvoices() {
      if (!_parsedInvoiceRows || _parsedInvoiceRows.length === 0) {
        alert('Không có dữ liệu hóa đơn để nạp!');
        return;
      }

      const btnCommit = document.getElementById('btn-commit-invoice-preview');
      const origBtnHtml = btnCommit ? btnCommit.innerHTML : '';
      if (btnCommit) {
        btnCommit.disabled = true;
        btnCommit.innerHTML = '<span>Đang lưu trữ chứng từ...</span>';
      }

      try {
        // Lưu trữ bảng kê Excel làm hồ sơ chứng từ gốc dự phòng
        let excelDocRecord = null;
        if (_currentInvoiceExcelFile && window.DocumentStorage && typeof window.DocumentStorage.saveDocument === 'function') {
          try {
            excelDocRecord = await window.DocumentStorage.saveDocument(_currentInvoiceExcelFile);
          } catch (e) {
            console.warn('[Commit Invoices] Không thể lưu file Excel vào DocumentStorage:', e);
          }
        }

        // Lưu trữ từng tệp chứng từ vật lý (ảnh / scan / PDF) đã được đính kèm vào kho
        for (const item of _parsedInvoiceRows) {
          if (item.attachedFile && window.DocumentStorage && typeof window.DocumentStorage.saveDocument === 'function') {
            try {
              const docRecord = await window.DocumentStorage.saveDocument(item.attachedFile);
              item.docId = docRecord.docId;
              item.fileName = docRecord.fileName;
              item.fileUrl = docRecord.fileUrl || docRecord.dataUrl || '';
              item.fileType = docRecord.fileType;
            } catch (err) {
              console.warn('[Commit Invoices] Lỗi lưu tệp chứng từ cho dòng:', item.invoiceNo, err);
            }
          } else if (excelDocRecord && !item.docId) {
            item.docId = excelDocRecord.docId;
            item.fileName = excelDocRecord.fileName;
            item.fileUrl = excelDocRecord.fileUrl || excelDocRecord.dataUrl || '';
            item.fileType = 'xlsx';
          }
        }

        const facSources = (window.InvoiceParser && window.InvoiceParser.FACILITY_ENERGY_SOURCES)
          ? window.InvoiceParser.FACILITY_ENERGY_SOURCES
          : [];

        const username = localStorage.getItem('gs_current_user') || 'guest';
        const rawUser = username.trim();
        const userSlug = rawUser.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '') || 'guest';
        const branchEl = document.getElementById('branch-selector');
        const branchName = (branchEl && branchEl.value) ? branchEl.value : 'main';
        const branchKey = branchName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '') || 'main';
        const slugSrcKey = `gs_data_${userSlug}_${branchKey}_sources`;

        let currentSources = [];
        try {
          const s = localStorage.getItem(slugSrcKey) || localStorage.getItem(getBranchStorageKey('sources'));
          if (s) currentSources = JSON.parse(s);
        } catch(e) {}
        if (!Array.isArray(currentSources)) currentSources = [];

        let sourceAdded = false;
        facSources.forEach(fSrc => {
          if (!currentSources.some(x => x.id === fSrc.id)) {
            currentSources.push({ ...fSrc });
            sourceAdded = true;
          }
        });
        if (sourceAdded) {
          try {
            localStorage.setItem(slugSrcKey, JSON.stringify(currentSources));
            localStorage.setItem(getBranchStorageKey('sources'), JSON.stringify(currentSources));
          } catch(e) {}
        }

        let managerName = 'Kế toán viên';
        try {
          const curUser = (localStorage.getItem('gs_current_user') || '').toLowerCase();
          const users = JSON.parse(localStorage.getItem('gs_users') || '[]');
          const u = users.find(x => x.username === curUser || x.email === curUser);
          if (u && u.fullName) managerName = u.fullName;
        } catch(e) {}

        const nowStr = new Date().toISOString().slice(0, 10) + ' ' + new Date().toTimeString().slice(0, 5);

        document.getElementById('no-activity-row')?.remove();

        let addedCount = 0;
        _parsedInvoiceRows.forEach(item => {
          const docName = (item.invoiceNo ? item.invoiceNo : 'HĐ mua ngoài') +
                          (item.seller ? ' - ' + item.seller : '') +
                          (item.note ? ` (${item.note})` : '');

          const finalCo2e = (item.co2e || 0).toFixed(2);
          const finalFactor = item.factor || 0;

          const dataObj = {
            date: item.date,
            sourceId: item.sourceId,
            sourceType: item.sourceType || 'Đốt cháy cố định',
            sourceName: item.sourceName,
            amount: item.quantity,
            unit: item.unit,
            doc: docName,
            manager: managerName,
            co2e: finalCo2e,
            efName: item.efName || item.sourceName,
            refName: '',
            finalFactor: finalFactor,
            fileName: item.fileName || 'Bảng kê Excel',
            docId: item.docId || '',
            fileUrl: item.fileUrl || '',
            fileType: item.fileType || 'xlsx',
            createdAt: nowStr,
            isBiomass: 'false',
            biogenicCo2: '0.00',
            wwS: 0,
            wwR: 0,
            entryRole: 'accountant',
            entryMode: 'direct',
            timeStart: '',
            timeEnd: '',
            isInvoice: 'true',
            isDowntime: 'false',
            isOvertime: 'false',
            recordType: 'normal',
            downtimeHours: 0,
            overtimeHours: 0,
            hourlyRate: '',
            stdHours: '16',
            isBaseline: 'false'
          };

          renderRow(dataObj);
          addedCount++;
        });

        saveActivityList();
        closeInvoiceImportPreviewModal();

        const toast = document.createElement('div');
        toast.textContent = `Đã nạp thành công ${addedCount} hóa đơn vào Dữ liệu hoạt động!`;
        toast.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#166534;color:#fff;padding:12px 24px;border-radius:8px;font-size:0.85rem;font-weight:600;z-index:99999;box-shadow:0 4px 16px rgba(0,0,0,0.2);';
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 4000);

        if (typeof applyFilter === 'function') {
          applyFilter(actHiddenFilter?.value || '');
        }
      } catch (err) {
        console.error('[Commit Batch Invoices] Lỗi:', err);
        alert('Đã xảy ra lỗi khi nạp hóa đơn: ' + err.message);
      } finally {
        if (btnCommit) {
          btnCommit.disabled = false;
          btnCommit.innerHTML = origBtnHtml;
        }
      }
    }

    // Gắn sự kiện cho các nút Hóa đơn Kế toán
    const btnDownloadActInvoiceTemplate = document.getElementById('btn-download-act-invoice-template');
    const inputActInvoiceFile = document.getElementById('input-act-invoice-file');
    const btnImportActInvoices = document.getElementById('btn-import-act-invoices');

    if (btnDownloadActInvoiceTemplate) {
      btnDownloadActInvoiceTemplate.addEventListener('click', downloadAccountantInvoiceTemplate);
    }
    if (btnImportActInvoices && inputActInvoiceFile) {
      btnImportActInvoices.addEventListener('click', () => {
        inputActInvoiceFile.value = '';
        inputActInvoiceFile.click();
      });
      inputActInvoiceFile.addEventListener('change', (e) => {
        const file = e.target.files && e.target.files[0];
        if (file) handleInvoiceExcelImport(file);
      });
    }

    const btnCloseInvPreview = document.getElementById('btn-close-invoice-preview');
    const btnCancelInvPreview = document.getElementById('btn-cancel-invoice-preview');
    const btnCommitInvPreview = document.getElementById('btn-commit-invoice-preview');

    if (btnCloseInvPreview) btnCloseInvPreview.addEventListener('click', closeInvoiceImportPreviewModal);
    if (btnCancelInvPreview) btnCancelInvPreview.addEventListener('click', closeInvoiceImportPreviewModal);
    if (btnCommitInvPreview) btnCommitInvPreview.addEventListener('click', commitBatchInvoices);

    window.toggleDayOffMenu = function(e) {
      if (e && typeof e.stopPropagation === 'function') e.stopPropagation();
      const menu = document.getElementById('day-off-dropdown-menu');
      if (!menu) return;
      const isOpen = menu.style.display === 'block';
      menu.style.display = isOpen ? 'none' : 'block';
    };

    window.loadActivityList = loadActivityList;
    window.renderMachineOverview = renderMachineOverview;
    window.renderReconciliationSummary = renderReconciliationSummary;
    window.autoGenerateMonthlyOperationalRecords = autoGenerateMonthlyOperationalRecords;
    window.updateProductionReminderBanner = updateProductionReminderBanner;
    window.triggerQuickProductionInput = triggerQuickProductionInput;
    window.syncSourceToBaselineActivities = syncSourceToBaselineActivities;
    window.openActivityModal = openModal;
    window.closeActivityModal = closeModal;
    window.downloadAccountantInvoiceTemplate = downloadAccountantInvoiceTemplate;
    window.handleInvoiceExcelImport = handleInvoiceExcelImport;
    window.parseInvoiceSheetRows = parseInvoiceSheetRows;
    window.openInvoiceImportPreviewModal = openInvoiceImportPreviewModal;
    window.closeInvoiceImportPreviewModal = closeInvoiceImportPreviewModal;
    window.commitBatchInvoices = commitBatchInvoices;

    loadActivityList();
    renderMachineOverview();
    renderReconciliationSummary();
  }
})();

