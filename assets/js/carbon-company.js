/**
 * GreenShift - Module Quản lý Thiết lập Công ty & Ngành nghề
 * Tích hợp tab 'Thông tin & Ngành nghề' trong Carbon Inventory
 */

(function () {
  // Lấy dữ liệu người dùng hiện tại
  function getCurrentUserData() {
    const currentUser = (localStorage.getItem('gs_current_user') || '').trim();
    const currentLower = currentUser.toLowerCase();
    const users = JSON.parse(localStorage.getItem('gs_users')) || [];
    const userIndex = users.findIndex(u => 
      (u.username && u.username.toLowerCase() === currentLower) || 
      (u.email && u.email.toLowerCase() === currentLower)
    );
    const user = userIndex !== -1 ? users[userIndex] : null;
    
    // Lấy đúng company của user hiện tại, tránh dùng chung gs_v2_company của tài khoản khác
    let company = (user && user.company && Object.keys(user.company).length > 0) ? user.company : null;
    if (!company && !user) {
      try {
        company = JSON.parse(localStorage.getItem('gs_v2_company') || 'null');
      } catch (e) {}
    }
    return { currentUser, users, userIndex, user, company };
  }

  // Cập nhật danh sách chi nhánh vào selector topbar
  function updateTopbarBranchSelector(company) {
    const branchSelector = document.getElementById('branch-selector');
    if (!branchSelector) return;
    const currentVal = branchSelector.value;
    branchSelector.innerHTML = '<option value="Trụ sở chính">Trụ sở chính</option>';

    if (company && company.branchCount > 0 && Array.isArray(company.branches)) {
      company.branches.forEach((branch, idx) => {
        const bName = (branch && branch.name) ? branch.name : `Chi nhánh ${idx + 1}`;
        const opt = document.createElement('option');
        opt.value = bName;
        opt.textContent = bName;
        branchSelector.appendChild(opt);
      });
    }

    if (currentVal && Array.from(branchSelector.options).some(o => o.value === currentVal)) {
      branchSelector.value = currentVal;
    }
  }

  // Tạo HTML cho các thẻ cơ sở / chi nhánh con
  function renderBranchCards(count, existingBranches) {
    const wrapper = document.getElementById('ci-branches-wrapper');
    const badge = document.getElementById('ci-branches-badge');
    if (!wrapper) return;

    const numBranches = Math.max(0, parseInt(count, 10) || 0);

    if (badge) {
      if (numBranches === 0) {
        badge.textContent = '1 Cơ sở (Trụ sở chính)';
        badge.className = 'badge badge-green';
      } else {
        badge.textContent = `1 Trụ sở chính + ${numBranches} Chi nhánh`;
        badge.className = 'badge badge-amber';
      }
    }

    if (numBranches === 0) {
      wrapper.innerHTML = `
        <div style="padding: 1.5rem; text-align: center; color: var(--color-text-secondary); background: #f9fafb; border-radius: var(--radius-md); border: 1px dashed var(--color-border); font-size: 0.9rem;">
          Doanh nghiệp hiện hoạt động với 1 cơ sở duy nhất (<strong>Trụ sở chính</strong>).<br>
          Nếu doanh nghiệp có thêm nhà máy hoặc chi nhánh hạch toán phụ thuộc, hãy tăng <strong>"Số lượng Cơ sở / Chi nhánh"</strong> ở trên.
        </div>
      `;
      return;
    }

    const industryOptionsHtml = `
      <option value="" disabled>Chọn ngành nghề</option>
      <optgroup label="Bắt buộc kiểm kê (Nhóm hàng CBAM xuất khẩu EU)">
        <option value="Sắt Thép">Sắt Thép</option>
        <option value="Nhôm">Nhôm</option>
        <option value="Xi măng">Xi măng</option>
        <option value="Phân bón">Phân bón</option>
        <option value="Nhiệt điện / Điện lực">Nhiệt điện / Điện lực</option>
        <option value="Hydrogen">Hydrogen</option>
      </optgroup>
      <optgroup label="Bắt buộc kiểm kê (QĐ 42/2026/QĐ-TTg)">
        <option value="Bao bì & Giấy">Bao bì & Giấy</option>
        <option value="Dệt may">Dệt may</option>
        <option value="Da giày">Da giày</option>
        <option value="Nhựa & Hóa chất">Nhựa & Hóa chất</option>
        <option value="Thực phẩm & Đồ uống">Thực phẩm & Đồ uống</option>
        <option value="Cơ khí chế tạo">Cơ khí chế tạo</option>
        <option value="Nông nghiệp">Nông nghiệp</option>
        <option value="Vận tải & Logistics">Vận tải & Logistics</option>
      </optgroup>
      <optgroup label="Kiểm kê tự nguyện (Doanh nghiệp khác)">
        <option value="Gỗ & Nội thất">Gỗ & Nội thất</option>
        <option value="Điện tử">Điện tử</option>
      </optgroup>
    `;

    let html = '';
    for (let i = 1; i <= numBranches; i++) {
      const bData = (existingBranches && existingBranches[i - 1]) ? existingBranches[i - 1] : {};
      const selIndustry = bData.industry || '';

      html += `
        <div class="branch-card-item" style="background: #f8fafc; border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: 1.25rem; margin-bottom: 0.75rem;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; border-bottom: 1px dashed #cbd5e1; padding-bottom: 0.5rem;">
            <div style="font-weight: 700; color: var(--color-primary); display: flex; align-items: center; gap: 0.5rem;">
              Chi nhánh / Cơ sở ${i}
            </div>
            <span style="font-size: 0.75rem; color: #64748b; font-weight: 500;">Hạch toán trực thuộc</span>
          </div>

          <div class="form-row" style="grid-template-columns: 2fr 1fr 1.5fr; margin-bottom: 0.75rem;">
            <div class="form-group" style="margin-bottom: 0;">
              <label style="font-size: 0.85rem;">Tên cơ sở / chi nhánh <span style="color: red;">*</span></label>
              <input type="text" id="ci-branch-name-${i}" class="form-control" required placeholder="Nhập tên cơ sở" value="${bData.name || ''}">
            </div>
            <div class="form-group" style="margin-bottom: 0;">
              <label style="font-size: 0.85rem;">Mã số thuế chi nhánh</label>
              <input type="text" id="ci-branch-tax-${i}" class="form-control" placeholder="Mã số thuế" value="${bData.tax || ''}">
            </div>
            <div class="form-group" style="margin-bottom: 0;">
              <label style="font-size: 0.85rem;">Ngành nghề chính <span style="color: red;">*</span></label>
              <select id="ci-branch-industry-${i}" class="form-control" required>
                ${industryOptionsHtml}
              </select>
            </div>
          </div>

          <div class="form-row" style="grid-template-columns: 1fr 1fr 1fr;">
            <div class="form-group" style="margin-bottom: 0;">
              <label style="font-size: 0.85rem;">Doanh thu (triệu VNĐ) <span style="color: red;">*</span></label>
              <input type="number" id="ci-branch-revenue-${i}" class="form-control" required value="${bData.revenue || ''}" placeholder="0">
            </div>
            <div class="form-group" style="margin-bottom: 0;">
              <label style="font-size: 0.85rem;">Số lao động <span style="color: red;">*</span></label>
              <input type="number" id="ci-branch-employees-${i}" class="form-control" required value="${bData.employees || ''}" placeholder="0">
            </div>
            <div class="form-group" style="margin-bottom: 0;">
              <label style="font-size: 0.85rem;">Sản lượng năm (tấn/sp) <span style="color: red;">*</span></label>
              <input type="number" id="ci-branch-production-${i}" class="form-control" required value="${bData.production || ''}" placeholder="0">
            </div>
          </div>
        </div>
      `;
    }

    wrapper.innerHTML = html;

    // Set selected industry for each branch
    for (let i = 1; i <= numBranches; i++) {
      const bData = (existingBranches && existingBranches[i - 1]) ? existingBranches[i - 1] : {};
      const selectEl = document.getElementById(`ci-branch-industry-${i}`);
      if (selectEl && bData.industry) {
        selectEl.value = bData.industry;
      }
    }
  }

  // Tải dữ liệu công ty vào form
  function loadCompanyFormData() {
    const { company, currentUser } = getCurrentUserData();
    if (!company) return;

    const setVal = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.value = val !== undefined && val !== null ? val : '';
    };

    setVal('ci-setup-name', company.name);
    setVal('ci-setup-tax', company.tax);
    setVal('ci-setup-license', company.license);
    setVal('ci-setup-founded-year', company.foundedYear);
    setVal('ci-setup-address', company.address);
    setVal('ci-setup-manager-agency', company.managerAgency);
    setVal('ci-setup-gps', company.gps);
    setVal('ci-setup-phone', company.phone);
    setVal('ci-setup-email', company.email);
    setVal('ci-setup-website', company.website);

    setVal('ci-setup-rep-name', company.repName);
    setVal('ci-setup-rep-title', company.repTitle);
    setVal('ci-setup-rep-phone', company.repPhone);
    setVal('ci-setup-rep-email', company.repEmail);

    setVal('ci-setup-industry', company.industry);
    setVal('ci-setup-ipcc-ar', company.ipccAR || 'AR5-100');
    setVal('ci-setup-revenue', company.revenue);
    setVal('ci-setup-employees', company.employees);
    setVal('ci-setup-production', company.production);
    setVal('ci-setup-desc-process', company.descProcess || '');

    const bCount = company.branchCount || (company.branches ? company.branches.length : 0);
    setVal('ci-setup-branches', bCount);

    renderBranchCards(bCount, company.branches || []);

    // Hien thi nut Mock data neu la tai khoan test duy nhat phamngocminh026
    const btnMockTop = document.getElementById('btn-ci-mock-data');
    const btnMockBottom = document.getElementById('btn-ci-mock-data-bottom');
    const isTester = currentUser && (currentUser.toLowerCase().includes('phamngocminh026'));
    if (btnMockTop) btnMockTop.style.display = isTester ? 'inline-flex' : 'none';
    if (btnMockBottom) btnMockBottom.style.display = isTester ? 'inline-flex' : 'none';
  }

  // Tự động đồng bộ lại phát thải nếu chuẩn IPCC AR thay đổi
  function syncEmissionsForNewAR(newAR, companyInfo, currentUser) {
    if (typeof window === 'undefined' || !window.IPCC_DB) return 0;
    const ipccDb = window.IPCC_DB;

    const branchNames = ['Trụ sở chính'];
    if (companyInfo.branches) {
      companyInfo.branches.forEach(b => { if (b && b.name) branchNames.push(b.name); });
    }
    const branchKeys = branchNames.map(name =>
      name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')
    );

    let totalSynced = 0;
    branchKeys.forEach(bKey => {
      const storageKey = `gs_data_${currentUser}_${bKey}_activity`;
      let activities = [];
      try {
        activities = JSON.parse(localStorage.getItem(storageKey) || '[]');
      } catch (e) {}

      let changed = false;
      activities.forEach(act => {
        const typeStr = (act.sourceType || '').toLowerCase();
        const eqStr = (act.sourceName || '').toLowerCase();
        const isWW = typeStr.includes('nước thải') || typeStr.includes('tự hoại') || eqStr.includes('nước thải') || eqStr.includes('tự hoại') || eqStr.includes('hiếu khí') || eqStr.includes('kỵ khí') || eqStr.includes('bùn') || typeStr.includes('waste');

        const ch4Gwp = (ipccDb[newAR] && ipccDb[newAR]['Methane']) ? ipccDb[newAR]['Methane'] : 28;
        const n2oGwp = (ipccDb[newAR] && ipccDb[newAR]['Nitrous oxide']) ? ipccDb[newAR]['Nitrous oxide'] : 265;

        if (isWW) {
          const ch4Emission = ((act.amount - (act.wwS || 0)) * act.finalFactor) - (act.wwR || 0);
          const co2eCalc = Math.max(0, ch4Emission) * ch4Gwp;
          if (act.co2e !== co2eCalc.toFixed(2)) {
            act.co2e = co2eCalc.toFixed(2);
            changed = true;
            totalSynced++;
          }
        } else if (act.efName && window.EF_MASTER) {
          let fuelItem = null;
          for (const stdKey in EF_MASTER) {
            for (const cat in EF_MASTER[stdKey]) {
              for (const key in EF_MASTER[stdKey][cat]) {
                const item = EF_MASTER[stdKey][cat][key];
                if (item.name === act.efName || (act.efName.includes(item.name))) {
                  fuelItem = item;
                  break;
                }
              }
            }
          }

          if (fuelItem && fuelItem.ncv) {
            let massKg = act.amount;
            const unitLower = (act.unit || '').toLowerCase();
            if ((unitLower.includes('lít') || unitLower.includes('lit') || unitLower === 'l' || unitLower === 'm3') && fuelItem.density) {
              massKg = act.amount * fuelItem.density;
            }
            const energyTJ = (massKg / 1000000) * fuelItem.ncv;
            const co2_kg = energyTJ * (fuelItem.ef_co2_tj || 0);
            const ch4_kg = energyTJ * (fuelItem.ef_ch4_tj || 0);
            const n2o_kg = energyTJ * (fuelItem.ef_n2o_tj || 0);

            const co2eCalc = co2_kg + (ch4_kg * ch4Gwp) + (n2o_kg * n2oGwp);
            const newFactor = act.amount > 0 ? (co2eCalc / act.amount) : act.finalFactor;

            if (act.co2e !== co2eCalc.toFixed(2) || act.finalFactor !== newFactor) {
              act.co2e = co2eCalc.toFixed(2);
              act.finalFactor = newFactor;
              changed = true;
              totalSynced++;
            }
          }
        }

        if (act.refName) {
          if (ipccDb[newAR] && ipccDb[newAR][act.refName] !== undefined) {
            act.finalFactor = ipccDb[newAR][act.refName];
            const co2eCalc = act.amount * act.finalFactor;
            if (act.co2e !== co2eCalc.toFixed(2)) {
              act.co2e = co2eCalc.toFixed(2);
              changed = true;
              totalSynced++;
            }
          }
        }
      });

      if (changed) {
        localStorage.setItem(storageKey, JSON.stringify(activities));
      }
    });

    return totalSynced;
  }

  // Hiển thị thông báo Toast / Alert
  function showCompanyAlert(message, type = 'success') {
    const alertBox = document.getElementById('ci-company-alert');
    if (!alertBox) return;

    alertBox.style.display = 'block';
    alertBox.textContent = message;

    if (type === 'success') {
      alertBox.style.backgroundColor = '#ecfdf5';
      alertBox.style.color = '#065f46';
      alertBox.style.border = '1px solid #a7f3d0';
    } else {
      alertBox.style.backgroundColor = '#fef2f2';
      alertBox.style.color = '#991b1b';
      alertBox.style.border = '1px solid #fecaca';
    }

    try {
      alertBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } catch(e) {}

    setTimeout(() => {
      alertBox.style.display = 'none';
    }, 4000);
  }

  // Xử lý lưu form thiết lập công ty
  function handleSaveCompanyForm(e) {
    if (e) e.preventDefault();

    const getVal = id => {
      const el = document.getElementById(id);
      return el ? el.value.trim() : '';
    };

    const name = getVal('ci-setup-name');
    if (!name) {
      showCompanyAlert('Vui lòng nhập Tên công ty!', 'error');
      const el = document.getElementById('ci-setup-name');
      if (el) el.focus();
      return;
    }

    const numBranches = Math.max(0, parseInt(getVal('ci-setup-branches'), 10) || 0);
    const branchesData = [];

    for (let i = 1; i <= numBranches; i++) {
      const bName = getVal(`ci-branch-name-${i}`);
      const bIndustry = getVal(`ci-branch-industry-${i}`);
      if (!bName) {
        showCompanyAlert(`Vui lòng nhập Tên cho Chi nhánh ${i}!`, 'error');
        const el = document.getElementById(`ci-branch-name-${i}`);
        if (el) el.focus();
        return;
      }
      branchesData.push({
        name: bName,
        tax: getVal(`ci-branch-tax-${i}`),
        industry: bIndustry || getVal('ci-setup-industry'),
        revenue: getVal(`ci-branch-revenue-${i}`),
        employees: getVal(`ci-branch-employees-${i}`),
        production: getVal(`ci-branch-production-${i}`)
      });
    }

    const { currentUser, users, userIndex: foundIndex } = getCurrentUserData();
    let userIndex = foundIndex;
    if (userIndex === -1) {
      const currentLower = (currentUser || '').toLowerCase();
      userIndex = users.findIndex(u => 
        (u.username && u.username.toLowerCase() === currentLower) ||
        (u.email && u.email.toLowerCase() === currentLower)
      );
    }
    if (userIndex === -1) {
      userIndex = users.length;
      users.push({ username: currentUser || 'guest', email: currentUser || '', company: {} });
    }

    const oldAR = users[userIndex]?.company?.ipccAR || 'AR5-100';
    const newAR = getVal('ci-setup-ipcc-ar') || 'AR5-100';

    const companyInfo = {
      name: name,
      tax: getVal('ci-setup-tax'),
      license: getVal('ci-setup-license'),
      foundedYear: getVal('ci-setup-founded-year'),
      address: getVal('ci-setup-address'),
      managerAgency: getVal('ci-setup-manager-agency'),
      gps: getVal('ci-setup-gps'),
      phone: getVal('ci-setup-phone'),
      email: getVal('ci-setup-email'),
      website: getVal('ci-setup-website'),
      repName: getVal('ci-setup-rep-name'),
      repTitle: getVal('ci-setup-rep-title'),
      repPhone: getVal('ci-setup-rep-phone'),
      repEmail: getVal('ci-setup-rep-email'),
      industry: getVal('ci-setup-industry'),
      ipccAR: newAR,
      revenue: getVal('ci-setup-revenue'),
      employees: getVal('ci-setup-employees'),
      production: getVal('ci-setup-production'),
      descProcess: getVal('ci-setup-desc-process'),
      branchCount: numBranches,
      branches: branchesData,
      configured: true
    };

    // Lưu vào localStorage
    users[userIndex].company = companyInfo;
    localStorage.setItem('gs_users', JSON.stringify(users));
    localStorage.setItem('gs_v2_company', JSON.stringify(companyInfo));

    // Cập nhật hiển thị giao diện ngay lập tức
    const topCompEl = document.getElementById('text-company');
    if (topCompEl) topCompEl.innerText = companyInfo.name || 'Công ty';

    const repCompEl = document.getElementById('report-company-name');
    if (repCompEl) repCompEl.innerText = companyInfo.name || 'Công ty';

    updateTopbarBranchSelector(companyInfo);

    // Đồng bộ lại IPCC nếu thay đổi
    let syncMsg = '';
    if (oldAR !== newAR) {
      const count = syncEmissionsForNewAR(newAR, companyInfo, currentUser);
      syncMsg = ` Đã tự động cập nhật hệ số tính toán cho ${count} bản ghi theo chuẩn ${newAR}.`;
    }

    // Đồng bộ Cloud nếu có kết nối Supabase
    if (window.GreenShiftDB && typeof window.GreenShiftDB.pushCompanyProfile === 'function') {
      try {
        window.GreenShiftDB.pushCompanyProfile(companyInfo);
      } catch (err) {
        console.warn('Lỗi đồng bộ Supabase:', err);
      }
    }

    showCompanyAlert(`Đã lưu cấu hình thông tin Công ty & Ngành nghề thành công!${syncMsg}`, 'success');
  }

  // Điền dữ liệu mẫu (Mock data test)
  function fillMockData() {
    const setVal = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.value = val;
    };

    setVal('ci-setup-name', 'Công ty TNHH Sắt Thép Hòa Bình');
    setVal('ci-setup-tax', '0101234567');
    setVal('ci-setup-license', 'Số 123/QĐ-BCT cấp ngày 15/05/2018');
    setVal('ci-setup-founded-year', '2018');
    setVal('ci-setup-address', 'Lô B1, KCN Phú Mỹ 1, Phường Phú Mỹ, Thị xã Phú Mỹ, Tỉnh Bà Rịa - Vũng Tàu');
    setVal('ci-setup-manager-agency', 'Sở Tài nguyên và Môi trường tỉnh Bà Rịa - Vũng Tàu');
    setVal('ci-setup-gps', '10.590123, 107.031567');
    setVal('ci-setup-phone', '0254 3123 456');
    setVal('ci-setup-email', 'info@satthephoabinh.vn');
    setVal('ci-setup-website', 'https://satthephoabinh.vn');

    setVal('ci-setup-rep-name', 'Nguyễn Văn Kiểm Kê');
    setVal('ci-setup-rep-title', 'Tổng Giám Đốc');
    setVal('ci-setup-rep-phone', '0988 123 456');
    setVal('ci-setup-rep-email', 'ceonguyen@satthephoabinh.vn');

    setVal('ci-setup-industry', 'Sắt Thép');
    setVal('ci-setup-ipcc-ar', 'AR5-100');
    setVal('ci-setup-revenue', '150000');
    setVal('ci-setup-employees', '1200');
    setVal('ci-setup-production', '50000');
    setVal('ci-setup-branches', '3');

    const sampleBranches = [
      {
        name: 'Nhà máy Phôi thép Phú Mỹ',
        tax: '0101234567-001',
        industry: 'Sắt Thép',
        revenue: '70000',
        employees: '500',
        production: '25000'
      },
      {
        name: 'Nhà máy Cán thép Hòa Bình',
        tax: '0101234567-002',
        industry: 'Sắt Thép',
        revenue: '50000',
        employees: '400',
        production: '15000'
      },
      {
        name: 'Kho vận & Logistics Cái Mép',
        tax: '0101234567-003',
        industry: 'Vận tải & Logistics',
        revenue: '30000',
        employees: '300',
        production: '10000'
      }
    ];

    renderBranchCards(3, sampleBranches);
    
    // Cập nhật ngay lập tức tên công ty lên thanh điều hướng topbar
    const topCompEl = document.getElementById('text-company');
    if (topCompEl) topCompEl.innerText = 'Công ty TNHH Sắt Thép Hòa Bình';
    const repCompEl = document.getElementById('report-company-name');
    if (repCompEl) repCompEl.innerText = 'Công ty TNHH Sắt Thép Hòa Bình';

    showCompanyAlert('Đã điền dữ liệu mẫu (Sắt Thép Hòa Bình)! Bấm "Lưu thay đổi" để lưu chính thức.', 'success');
  }

  // Khởi tạo các sự kiện giao diện
  function initCompanySetupView() {
    // 1. Đồng bộ tức thời tên công ty lên thanh topbar khi người dùng gõ phím
    const nameInput = document.getElementById('ci-setup-name');
    if (nameInput) {
      nameInput.addEventListener('input', function () {
        const val = this.value.trim() || 'Tên công ty';
        const topEl = document.getElementById('text-company');
        if (topEl) topEl.innerText = val;
        const repEl = document.getElementById('report-company-name');
        if (repEl) repEl.innerText = val;
      });

      // Lưu nhanh tên công ty vào localStorage khi rời khỏi ô nhập
      nameInput.addEventListener('blur', function () {
        const val = this.value.trim();
        if (val) {
          const { currentUser, users, userIndex } = getCurrentUserData();
          if (userIndex !== -1 && users[userIndex]) {
            if (!users[userIndex].company) users[userIndex].company = {};
            users[userIndex].company.name = val;
            localStorage.setItem('gs_users', JSON.stringify(users));
            try {
              let v2 = JSON.parse(localStorage.getItem('gs_v2_company') || '{}');
              v2.name = val;
              localStorage.setItem('gs_v2_company', JSON.stringify(v2));
            } catch (e) {}
          }
        }
      });
    }

    const branchesInput = document.getElementById('ci-setup-branches');
    if (branchesInput) {
      branchesInput.addEventListener('input', function () {
        const { company } = getCurrentUserData();
        renderBranchCards(this.value, (company && company.branches) ? company.branches : []);
      });
    }

    const form = document.getElementById('ci-company-form');
    if (form) {
      form.addEventListener('submit', handleSaveCompanyForm);
    }

    const btnTopSave = document.getElementById('btn-ci-save-company-top');
    if (btnTopSave) {
      btnTopSave.addEventListener('click', (e) => {
        if (e) e.preventDefault();
        handleSaveCompanyForm();
      });
    }

    const btnMockTop = document.getElementById('btn-ci-mock-data');
    if (btnMockTop) {
      btnMockTop.addEventListener('click', fillMockData);
    }

    const btnMockBottom = document.getElementById('btn-ci-mock-data-bottom');
    if (btnMockBottom) {
      btnMockBottom.addEventListener('click', fillMockData);
    }


    const btnExportBackup = document.getElementById('btn-export-backup');
    if (btnExportBackup) {
      btnExportBackup.addEventListener('click', exportBackupData);
    }

    const btnImportBackup = document.getElementById('btn-import-backup');
    const inputBackupFile = document.getElementById('input-backup-file');
    if (btnImportBackup && inputBackupFile) {
      btnImportBackup.addEventListener('click', () => {
        inputBackupFile.click();
      });
      inputBackupFile.addEventListener('change', (e) => {
        const file = e.target.files && e.target.files[0];
        if (file) {
          handleRestoreFileInput(file);
          inputBackupFile.value = '';
        }
      });
    }

    // Tu dong load du lieu
    loadCompanyFormData();
  }

  // Mau quy trinh cong nghe san xuat co so theo Nghi dinh 06/2022/ND-CP & Thong tu 38/2023/TT-BCT
  function getIndustryProcessPreset(industry) {
    const presets = {
      'Sắt Thép': 'Quy trình sản xuất thép công nghệ lò hồ quang điện (EAF): Tiếp nhận và tuyển chọn thép phế liệu -> Nạp liệu vào lò điện hồ quang EAF nấu chảy (tiêu hao điện cực graphit và vôi tạo xỉ) -> Tinh luyện tại lò thùng LRF (khử oxy, khử lưu huỳnh, hợp kim hóa) -> Đúc phôi vuông/dẹt liên tục CCM -> Lò gia nhiệt phôi cán -> Dây chuyền cán nóng tạo thép thanh vằn và thép cuộn xây dựng -> Làm nguội, nắn thẳng, cắt quy cách, đóng gói thành phẩm. Hệ thống hút lọc bụi tay áo thu gom và xử lý 100% khói bụi lò luyện.',
      'Nhôm': 'Quy trình sản xuất nhôm điện phân & đúc định hình: Tiếp nhận alumina (Al2O3) và muối criolit -> Điện phân nóng chảy trong dãy bể Hall-Héroult (dòng điện 130-160 kA, tiêu hao cực Anode carbon) -> Hút nhôm lỏng sang lò giữ nhiệt/lò nấu chảy -> Tinh luyện khử khí và đúc thỏi Ingot / thanh Billet nhôm -> Gia nhiệt và ép đùn thủy lực định hình -> Xử lý bề mặt anot hóa (Anodizing) và thu hồi khí Flo tại tháp xử lý khí khô FTP.',
      'Bao bì & Giấy': 'Quy trình sản xuất bao bì carton và giấy công nghiệp: Tiếp nhận và đánh tơi bột giấy tái chế / dăm gỗ tại máy nghiền Hydrapulper -> Nấu và tẩy trắng bột giấy -> Xử lý nghiền mịn, phối trộn phụ gia hồ sợi keo -> Dây chuyền máy xeo Fourdrinier tạo hình tấm lưới ẩm -> Ép nước và sấy khô bằng lô sấy Yankee / dàn lô sấy hơi nước bão hòa -> Cuộn ép bóng và cắt chia cuộn giấy hoàn thiện -> Hệ thống xử lý nước thải Aerotank thu hồi nước tái tuần hoàn.',
      'Xi măng': 'Quy trình sản xuất xi măng phương pháp khô: Khai thác và đồng nhất sơ bộ đá vôi, đất sét -> Nghiền mịn nguyên liệu tại máy nghiền đứng liệu sống -> Hệ thống tháp trao đổi nhiệt nhiều tầng tiền nung canxi hóa Calciner -> Nung luyện clinker tại lò quay 1450°C -> Làm nguội clinker kiểu ghi lắc -> Nghiền mịn xi măng phối trộn thạch cao và phụ gia khoáng pozzolana -> Đóng bao và xuất xi măng rời.',
      'Dệt may': 'Quy trình dệt nhuộm và may mặc công nghiệp: Tiếp nhận sợi bông / PE -> Kéo sợi và mắc sợi -> Dệt thoi / dệt kim tạo vải mộc -> Nấu tẩy tiền xử lý -> Nhuộm màu tại máy nhuộm áp suất cao (gia nhiệt hơi nước) -> Giặt định hình và sấy căng sợi mộc -> Cắt may dây chuyền hoàn thiện sản phẩm may mặc -> Hệ thống xử lý nước thải dệt nhuộm tập trung.',
      'Nhựa & Hóa chất': 'Quy trình tổng hợp và đùn ép hạt nhựa công nghiệp: Tiếp nhận hạt nhựa nguyên sinh và phụ gia phụ trợ -> Sấy khô khử ẩm chân không -> Phối trộn hạt màu và hóa chất trợ gia công -> Nạp liệu vào máy đùn trục vít gia nhiệt điện trở -> Tạo hình thổi màng / ép phun khuôn mẫu -> Làm nguội bằng nước tuần hoàn chiller -> Cắt tạo hình đóng gói thành phẩm.',
      'Thực phẩm & Đồ uống': 'Quy trình chế biến thực phẩm và đồ uống đóng gói: Tiếp nhận và kiểm định nguyên liệu nông sản -> Rửa sạch, phân loại và sơ chế -> Nấu tiệt trùng / thanh trùng nhiệt hơi nước bão hòa -> Phối trộn thành phần theo công thức -> Chiết rót vô trùng và đóng nắp bao bì lon/chai -> Làm nguội nhanh -> Dán nhãn, đóng thùng và lưu kho mát bảo quản.'
    };
    return presets[industry] || presets['Sắt Thép'];
  }

  // Sao lưu toan bo du lieu kiem ke sang JSON (ISO 14064 Data Retention)
  function exportBackupData() {
    try {
      const backupKeys = [
        'gs_users', 'gs_user', 'gs_company', 'gs_v2_company',
        'gs_activities', 'gs_custom_ef', 'gs_settings',
        'cbam_declarations', 'cbam_installations', 'cbam_processes', 'cbam_goods',
        'gs_audit_logs', 'gs_reconciliation_records'
      ];

      // Quet them toan bo cac khoa chi nhanh va du lieu hoat dong trong LocalStorage
      const allKeys = new Set(backupKeys);
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && (k.startsWith('gs_') || k.startsWith('cbam_') || k.startsWith('greenshift_'))) {
          allKeys.add(k);
        }
      }

      const backupData = {
        app: 'GreenShift Core Engine',
        version: '2.2.0',
        exportedAt: new Date().toISOString(),
        totalKeys: allKeys.size,
        data: {}
      };

      allKeys.forEach(k => {
        const item = localStorage.getItem(k);
        if (item !== null) {
          try {
            backupData.data[k] = JSON.parse(item);
          } catch (e) {
            backupData.data[k] = item;
          }
        }
      });

      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const compName = (document.getElementById('ci-setup-name')?.value || 'greenshift').trim().replace(/[^a-zA-Z0-9_-]/g, '_');
      const dateStr = new Date().toISOString().slice(0, 10);
      a.href = url;
      a.download = `GreenShift_Backup_${compName}_${dateStr}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      showCompanyAlert(`Xuất tệp sao lưu dữ liệu (.json) thành công! (${allKeys.size} danh mục dữ liệu bao gồm toàn bộ cơ sở và chi nhánh)`, 'success');
    } catch (err) {
      console.error('Lỗi sao lưu:', err);
      showCompanyAlert('Có lỗi xảy ra khi sao lưu dữ liệu: ' + err.message, 'error');
    }
  }

  // Khoi phuc du lieu tu tep sao luu JSON
  function handleRestoreFileInput(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function (e) {
      try {
        const json = JSON.parse(e.target.result);
        if (!json || typeof json !== 'object' || (!json.data && !json.app)) {
          throw new Error('Định dạng tệp sao lưu không hợp lệ!');
        }

        const dataObj = json.data || json;
        let restoreCount = 0;
        Object.keys(dataObj).forEach(k => {
          if (k.startsWith('gs_') || k.startsWith('cbam_') || k.startsWith('greenshift_')) {
            const val = typeof dataObj[k] === 'object' ? JSON.stringify(dataObj[k]) : dataObj[k];
            localStorage.setItem(k, val);
            restoreCount++;
          }
        });

        showCompanyAlert(`Khôi phục thành công ${restoreCount} mục dữ liệu (toàn bộ cơ sở, thiết bị và hoạt động)! Đang làm mới trang...`, 'success');
        setTimeout(() => {
          window.location.reload();
        }, 1200);
      } catch (err) {
        console.error('Lỗi khôi phục:', err);
        showCompanyAlert('Lỗi đọc tệp sao lưu: ' + err.message, 'error');
      }
    };
    reader.readAsText(file);
  }

  // Export các hàm ra global để tích hợp với carbon-inventory
  window.renderCompanySetupView = loadCompanyFormData;
  window.initCompanySetupView = initCompanySetupView;

  // Lắng nghe sự kiện DOMContentLoaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCompanySetupView);
  } else {
    initCompanySetupView();
  }
})();
