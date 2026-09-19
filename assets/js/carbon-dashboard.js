// Dashboard logic for GreenShift

let chartScopeObj = null;
let chartMonthlyObj = null;
let chartCategoryObj = null;
let chartEquipmentObj = null;

function checkVnPublicHoliday(dateStr) {
  if (typeof isVnPublicHoliday === 'function') return isVnPublicHoliday(dateStr);
  if (typeof window !== 'undefined' && typeof window.isVnPublicHoliday === 'function') return window.isVnPublicHoliday(dateStr);
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
  if (md === '01-01' || md === '04-30' || md === '05-01' || md === '09-01' || md === '09-02' || md === '09-03') return true;
  const holidays2026 = new Set([
    '2026-02-14', '2026-02-15', '2026-02-16', '2026-02-17', '2026-02-18', '2026-02-19', '2026-02-20', '2026-02-21', '2026-02-22',
    '2026-04-26', '2026-09-01', '2026-09-02', '2026-09-03'
  ]);
  if (y === '2026' && holidays2026.has(normDate)) return true;
  return false;
}

function renderDashboard() {
  const username = localStorage.getItem('gs_current_user') || 'guest';
  const rawUser = username.trim();
  const userSlug = rawUser.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '') || 'guest';
  const branchEl = document.getElementById('branch-selector');
  const branchName = (branchEl && branchEl.value) ? branchEl.value : 'main';
  const branchKey = branchName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
  const storageKey = `gs_data_${userSlug}_${branchKey}_activity`;
  
  const yearEl = document.getElementById('dash-year-select');
  const selectedYear = (yearEl && yearEl.value) ? yearEl.value : new Date().getFullYear().toString();
  
  const viewModeEl = document.getElementById('dash-view-mode');
  const userRole = localStorage.getItem('gs_user_role') || 'director';
  let viewMode = (viewModeEl && viewModeEl.value) ? viewModeEl.value : '';
  if (!viewMode) {
    if (userRole === 'accountant') viewMode = 'invoice';
    else if (userRole === 'engineer') viewMode = 'engineer';
    else viewMode = 'scope'; // Cho Giám đốc / Ban ESG: Mặc định phân rã Scope
    if (viewModeEl) viewModeEl.value = viewMode;
  }

  const timeframeEl = document.getElementById('dash-timeframe-select');
  const selectedTimeframe = (timeframeEl && timeframeEl.value) ? timeframeEl.value : 'all';
  const isMonthFilter = (selectedTimeframe !== 'all');
  const isYtd = (selectedTimeframe === 'ytd');
  const selMonthNum = (isMonthFilter && !isYtd) ? parseInt(selectedTimeframe, 10) : 0;
  const targetMonthPrefix = (isMonthFilter && !isYtd) ? `${selectedYear}-${selectedTimeframe}` : '';

  const nowObj = new Date();
  const todayYear = nowObj.getFullYear();
  const todayMonth = nowObj.getMonth() + 1;
  const todayDay = nowObj.getDate();
  const todayStr = `${todayYear}-${String(todayMonth).padStart(2, '0')}-${String(todayDay).padStart(2, '0')}`;
  const todayDisplay = `${String(todayDay).padStart(2, '0')}/${String(todayMonth).padStart(2, '0')}/${todayYear}`;

  let monthNameStr = '';
  if (isYtd) {
    monthNameStr = `Lũy kế đến ngày ${todayDisplay}`;
  } else if (isMonthFilter) {
    monthNameStr = `Tháng ${selMonthNum}/${selectedYear}`;
  } else {
    monthNameStr = `Năm ${selectedYear}`;
  }

  // Đồng bộ giao diện 3 nút chuyển đổi Executive Switcher (YTD, Cả năm, Chi tiết theo Tháng)
  const btnDashYtd = document.getElementById('btn-dash-ytd');
  const btnDashAll = document.getElementById('btn-dash-all');
  const btnDashMonth = document.getElementById('btn-dash-month');
  if (btnDashYtd && btnDashAll) {
    if (isYtd) {
      btnDashYtd.style.background = '#0284c7';
      btnDashYtd.style.color = '#ffffff';
      btnDashYtd.style.fontWeight = '600';
      btnDashAll.style.background = 'transparent';
      btnDashAll.style.color = '#64748b';
      btnDashAll.style.fontWeight = '500';
      if (btnDashMonth) {
        btnDashMonth.style.background = 'transparent';
        btnDashMonth.style.color = '#64748b';
        btnDashMonth.style.fontWeight = '500';
        btnDashMonth.textContent = 'Chi tiết Theo Tháng';
      }
    } else if (selectedTimeframe === 'all') {
      btnDashYtd.style.background = 'transparent';
      btnDashYtd.style.color = '#64748b';
      btnDashYtd.style.fontWeight = '500';
      btnDashAll.style.background = '#0284c7';
      btnDashAll.style.color = '#ffffff';
      btnDashAll.style.fontWeight = '600';
      if (btnDashMonth) {
        btnDashMonth.style.background = 'transparent';
        btnDashMonth.style.color = '#64748b';
        btnDashMonth.style.fontWeight = '500';
        btnDashMonth.textContent = 'Chi tiết Theo Tháng';
      }
    } else {
      // isMonthFilter === true
      btnDashYtd.style.background = 'transparent';
      btnDashYtd.style.color = '#64748b';
      btnDashYtd.style.fontWeight = '500';
      btnDashAll.style.background = 'transparent';
      btnDashAll.style.color = '#64748b';
      btnDashAll.style.fontWeight = '500';
      if (btnDashMonth) {
        btnDashMonth.style.background = '#0284c7';
        btnDashMonth.style.color = '#ffffff';
        btnDashMonth.style.fontWeight = '600';
        btnDashMonth.textContent = `Chi tiết Tháng ${selMonthNum}`;
      }
    }
  }

  const activities = JSON.parse(localStorage.getItem(storageKey) || '[]');
  
  // Filter by year and YTD
  const filtered = activities.filter(act => {
    if (!act.date || !act.date.startsWith(selectedYear)) return false;
    if (isYtd && act.date > todayStr) return false;
    return true;
  });
  
  // Load sources to get correct Scope mappings
  const sources = JSON.parse(localStorage.getItem(`gs_data_${userSlug}_${branchKey}_sources`) || '[]');
  const sourceMap = {};
  const sourceTypeMap = {};
  const sourceDaysWeekMap = {};
  sources.forEach(src => {
    if (src.id) {
      sourceMap[src.id] = src.category || 'Khác';
      sourceDaysWeekMap[src.id] = parseFloat(src.opDaysWeek || src.daysWeek) || 6;
    }
    if (src.type && src.category) {
      sourceTypeMap[src.type] = src.category;
    }
    if (src.type && (src.opDaysWeek || src.daysWeek)) {
      sourceDaysWeekMap[src.type] = parseFloat(src.opDaysWeek || src.daysWeek) || 6;
    }
  });

  const CATEGORY_SCOPE = {
    // Scope 1 (Loại 1)
    'Đốt cháy cố định': 1, 'Đốt cháy di động': 1, 'Đốt cháy động': 1, 'Phát thải thất thoát': 1, 'Các quá trình công nghiệp': 1, 'Sử dụng đất, thay đổi sử dụng đất và lâm nghiệp (LULUCF)': 1, 'Xử lý nước thải nội bộ': 1, 'Xử lý nước thải': 1,
    // Scope 2 (Loại 2)
    'Điện mua vào': 2, 'Tiêu thụ điện': 2, 'Tiêu thụ điện lưới': 2, 'Điện năng mua vào': 2, 'Năng lượng mua vào (hơi, nhiệt)': 2, 'Hơi nhiệt mua vào': 2, 'Năng lượng mua vào': 2,
    // Scope 3 (Loại 3, 4, 5, 6)
    'Vận chuyển phân phối thượng nguồn': 3, 'Vận chuyển phân phối hạ nguồn': 3, 'Đi lại của nhân viên': 3, 'Đi công tác': 3,
    'Sản phẩm dịch vụ đã mua': 3, 'Hoạt động liên quan nhiên liệu ngoài loại 1, 2': 3, 'Hàng hóa vốn mua vào': 3, 'Xử lý chất thải phát sinh': 3,
    'Tài sản cho thuê thượng nguồn': 3, 'Sử dụng các dịch vụ': 3, 'Chế biến sản phẩm đã bán': 3, 'Sử dụng sản phẩm dịch vụ đã bán': 3,
    'Xử lý cuối vòng đời sản phẩm': 3, 'Tài sản cho thuê hạ nguồn': 3, 'Danh mục đầu tư': 3, 'Các nguồn phát thải gián tiếp đặc thù khác': 3
  };

  const getScopeNum = cat => {
    if (!cat || cat === 'Chưa phân loại') return 0;
    if (CATEGORY_SCOPE[cat]) return CATEGORY_SCOPE[cat];
    const lower = String(cat).toLowerCase();
    if (lower.includes('nước thải') || lower.includes('nuoc thai')) return 1;
    if (lower.includes('điện') || lower.includes('năng lượng mua vào') || lower.includes('hơi') || lower.includes('nhiệt') || lower.includes('kwh') || lower.includes('evn')) return 2;
    if (lower.includes('cố định') || lower.includes('động') || lower.includes('thất thoát') || lower.includes('rò rỉ') || lower.includes('công nghiệp') || lower.includes('lulucf') || lower.includes('diesel') || lower.includes('xăng') || lower.includes('lpg') || lower.includes('than')) return 1;
    return 3;
  };

  const getEnergyKey = act => {
    const combined = `${act.fuel || ''} ${act.sourceName || ''} ${act.category || ''} ${act.ef || ''} ${act.sourceType || ''}`.toLowerCase();
    if (combined.includes('diesel') || combined.includes('dầu do') || combined.includes('dau do') || combined.includes('máy phát điện') || combined.includes('may phat dien')) return 'diesel';
    if (combined.includes('xăng') || combined.includes('xang') || combined.includes('petrol') || combined.includes('gasoline')) return 'petrol';
    if (combined.includes('than') || combined.includes('coal') || combined.includes('antraxit')) return 'coal';
    if (combined.includes('gas') || combined.includes('lpg') || combined.includes('cng') || combined.includes('lng')) return 'gas';
    if (combined.includes('r-') || combined.includes('môi chất') || combined.includes('gas lạnh') || combined.includes('hfc') || combined.includes('cfc') || combined.includes('fm200')) return 'refrigerant';
    if (combined.includes('sinh khối') || combined.includes('biomass') || combined.includes('củi') || combined.includes('trấu') || combined.includes('mùn cưa')) return 'biomass';
    if (combined.includes('điện') || combined.includes('dien') || combined.includes('evn') || combined.includes('kwh')) return 'electricity';
    return act.category || 'other';
  };

  const getTrueCategory = act => {
    if (act.category && CATEGORY_SCOPE[act.category]) return act.category;
    if (act.sourceId && sourceMap[act.sourceId]) {
      const mapped = sourceMap[act.sourceId];
      if (CATEGORY_SCOPE[mapped]) return mapped;
    }
    if (act.sourceType && CATEGORY_SCOPE[act.sourceType]) return act.sourceType;
    if (act.sourceType && sourceTypeMap[act.sourceType]) {
      const mapped = sourceTypeMap[act.sourceType];
      if (CATEGORY_SCOPE[mapped]) return mapped;
    }

    // Nhận diện tự động: Ưu tiên nhiên liệu đốt cháy & thiết bị phát điện (Scope 1) trước "điện"
    const combinedStr = `${act.sourceName || ''} ${act.sourceType || ''} ${act.category || ''} ${act.fuel || ''} ${act.ef || ''}`.toLowerCase();
    
    // 1. Rò rỉ môi chất lạnh / PCCC (Scope 1) - Ưu tiên trước để gas lạnh không rơi vào nhánh gas đốt
    if (combinedStr.includes('r-') || combinedStr.includes('môi chất') || combinedStr.includes('gas lạnh') || combinedStr.includes('gas lanh') || combinedStr.includes('hfc') || combinedStr.includes('cfc') || combinedStr.includes('fm200') || combinedStr.includes('pccc') || combinedStr.includes('chữa cháy') || combinedStr.includes('chua chay')) return 'Phát thải thất thoát';

    // 2. Đốt cháy cố định (Scope 1) - bao gồm Máy phát điện chạy dầu DO
    if (combinedStr.includes('diesel') || combinedStr.includes('dầu do') || combinedStr.includes('dau do') || combinedStr.includes('dầu fo') || combinedStr.includes('dau fo') || combinedStr.includes('lò hơi') || combinedStr.includes('máy phát điện') || combinedStr.includes('may phat dien')) return 'Đốt cháy cố định';
    if (combinedStr.includes('lpg') || combinedStr.includes('cng') || combinedStr.includes('lng') || (combinedStr.includes('gas') && !combinedStr.includes('gas lạnh') && !combinedStr.includes('gas lanh'))) return 'Đốt cháy cố định';
    if (combinedStr.includes('than') || combinedStr.includes('coal') || combinedStr.includes('sinh khối') || combinedStr.includes('biomass') || combinedStr.includes('củi') || combinedStr.includes('trấu') || combinedStr.includes('mùn cưa')) return 'Đốt cháy cố định';

    // 3. Đốt cháy di động (Scope 1)
    if (combinedStr.includes('xăng') || combinedStr.includes('xang') || combinedStr.includes('xe nâng') || combinedStr.includes('ô tô') || combinedStr.includes('xe tải') || combinedStr.includes('phương tiện')) return 'Đốt cháy động';

    // 4. Xử lý nước thải nội bộ (Scope 1 chuẩn IPCC Vol 5 & NĐ 06)
    if (combinedStr.includes('nước thải') || combinedStr.includes('nuoc thai') || combinedStr.includes('tự hoại') || combinedStr.includes('bod') || combinedStr.includes('cod')) return 'Xử lý nước thải nội bộ';

    // 5. Điện mua vào (Scope 2) - sau khi đã loại trừ máy phát điện DO
    if (combinedStr.includes('điện') || combinedStr.includes('dien') || combinedStr.includes('evn') || combinedStr.includes('chiller') || combinedStr.includes('kwh') || combinedStr.includes('công tơ')) return 'Điện mua vào';

    return 'Chưa phân loại';
  };

  // Phân loại rạch ròi giữa Hóa đơn Kế toán và Dữ liệu Kỹ thuật vận hành máy
  const isInvoiceAct = act => (act.entryRole === 'accountant' || act.isInvoice === 'true');
  const isEngineerAct = act => (act.entryRole === 'engineer' || act.isBaseline === 'true' || (!act.entryRole && act.isInvoice !== 'true'));

  const invoiceList = filtered.filter(isInvoiceAct);
  const engineerList = filtered.filter(isEngineerAct);

  // Tính toán riêng cho Hóa đơn Kế toán (12 tháng)
  const monthlyInvoiceData = { 0: Array(12).fill(0), 1: Array(12).fill(0), 2: Array(12).fill(0), 3: Array(12).fill(0), total: Array(12).fill(0) };
  let totalInvoiceKg = 0;
  const invoiceMonths = new Set();
  const invoiceEnergyMonthKeys = new Set();
  invoiceList.forEach(act => {
    const co2e = parseFloat(act.co2e) || 0;
    totalInvoiceKg += co2e;
    const cat = getTrueCategory(act);
    const scNum = getScopeNum(cat);
    if (act.date) {
      const monthIdx = parseInt(act.date.split('-')[1], 10) - 1;
      if (monthIdx >= 0 && monthIdx < 12) {
        monthlyInvoiceData[scNum][monthIdx] += co2e;
        monthlyInvoiceData.total[monthIdx] += co2e;
        invoiceMonths.add(monthIdx);
        const eKey = getEnergyKey(act);
        invoiceEnergyMonthKeys.add(`${eKey}_${monthIdx}`);
      }
    }
  });

  // Tính toán riêng cho Kỹ thuật máy móc (12 tháng)
  const monthlyEngineerData = { 0: Array(12).fill(0), 1: Array(12).fill(0), 2: Array(12).fill(0), 3: Array(12).fill(0), total: Array(12).fill(0) };
  let totalEngineerKg = 0;
  engineerList.forEach(act => {
    const co2e = parseFloat(act.co2e) || 0;
    totalEngineerKg += co2e;
    const cat = getTrueCategory(act);
    const scNum = getScopeNum(cat);
    if (act.date) {
      const monthIdx = parseInt(act.date.split('-')[1], 10) - 1;
      if (monthIdx >= 0 && monthIdx < 12) {
        monthlyEngineerData[scNum][monthIdx] += co2e;
        monthlyEngineerData.total[monthIdx] += co2e;
      }
    }
  });

  // Xác định danh sách hoạt động activeList và tổng phát thải totalKg theo góc nhìn viewMode
  let activeList = [];
  let totalKg = 0;
  const scopeData = { 'Scope 0': 0, 'Scope 1': 0, 'Scope 2': 0, 'Scope 3': 0 };
  const categoryData = {};
  const equipmentData = {};
  const monthlyScopeData = { 0: Array(12).fill(0), 1: Array(12).fill(0), 2: Array(12).fill(0), 3: Array(12).fill(0) };
  const catScopeMap = {};
  const eqScopeMap = {};

  // Hàm lọc kỹ thuật: Chống trùng lặp theo cặp (Loại năng lượng x Tháng)
  const filterEngineerDeduplicated = act => {
    if (!act.date) return true;
    const m = parseInt(act.date.split('-')[1], 10) - 1;
    const eKey = getEnergyKey(act);
    return !invoiceEnergyMonthKeys.has(`${eKey}_${m}`);
  };

  if (viewMode === 'invoice') {
    // 1. CHỈ HÓA ĐƠN KẾ TOÁN (Chính thức)
    activeList = invoiceList;
    totalKg = totalInvoiceKg;
  } else if (viewMode === 'engineer') {
    // 2. CHỈ VẬN HÀNH KỸ THUẬT MÁY MÓC
    activeList = engineerList;
    totalKg = totalEngineerKg;
  } else if (viewMode === 'combined') {
    // 3. DỰ PHÓNG KẾT HỢP (Chống trùng theo từng loại năng lượng x tháng)
    activeList = [
      ...invoiceList,
      ...engineerList.filter(filterEngineerDeduplicated)
    ];
    totalKg = activeList.reduce((acc, a) => acc + (parseFloat(a.co2e) || 0), 0);
  } else if (viewMode === 'scope') {
    // 4. PHÂN RÃ THEO 3 PHẠM VI SCOPE (Scope 1, Scope 2, Scope 3)
    activeList = [
      ...invoiceList,
      ...engineerList.filter(filterEngineerDeduplicated)
    ];
    totalKg = activeList.reduce((acc, a) => acc + (parseFloat(a.co2e) || 0), 0);
  } else {
    // 5. viewMode === 'reconcile' (SO SÁNH ĐỐI SOÁT HÓA ĐƠN VS KỸ THUẬT)
    activeList = [
      ...invoiceList,
      ...engineerList.filter(filterEngineerDeduplicated)
    ];
    totalKg = totalInvoiceKg;
  }

  // Tổng hợp Scope, Category, Equipment từ activeList (Cả năm)
  activeList.forEach(act => {
    const co2e = parseFloat(act.co2e) || 0;
    const cat = getTrueCategory(act);
    const scNum = getScopeNum(cat);
    const scope = 'Scope ' + scNum;
    if (scopeData[scope] !== undefined) {
      scopeData[scope] += co2e;
    } else {
      scopeData['Scope 0'] = (scopeData['Scope 0'] || 0) + co2e;
    }

    if (act.date) {
      const monthIdx = parseInt(act.date.split('-')[1], 10) - 1;
      if (monthIdx >= 0 && monthIdx < 12) {
        if (!monthlyScopeData[scNum]) {
          monthlyScopeData[scNum] = Array(12).fill(0);
        }
        monthlyScopeData[scNum][monthIdx] += co2e;
      }
    }

    categoryData[cat] = (categoryData[cat] || 0) + co2e;
    catScopeMap[cat] = scNum;

    const eq = act.sourceName || 'Chưa rõ';
    equipmentData[eq] = (equipmentData[eq] || 0) + co2e;
    eqScopeMap[eq] = scNum;
  });

  let totalBiogenicKg = 0;
  activeList.forEach(act => {
    totalBiogenicKg += (parseFloat(act.biogenicCo2) || 0);
  });

  // Xác định danh sách hoạt động và số liệu hiển thị theo Khung thời gian đã chọn (Tháng vs Cả năm)
  const activeListForDisplay = isMonthFilter && !isYtd
    ? activeList.filter(act => act.date && act.date.startsWith(targetMonthPrefix))
    : activeList;

  let displayBiogenicKg = 0;
  activeListForDisplay.forEach(act => {
    displayBiogenicKg += (parseFloat(act.biogenicCo2) || 0);
  });

  let displayTotalKg = 0;
  let displayInvoiceKg = totalInvoiceKg;
  let displayEngineerKg = totalEngineerKg;

  if (isMonthFilter && !isYtd) {
    const mIdx = selMonthNum - 1;
    displayInvoiceKg = monthlyInvoiceData.total[mIdx] || 0;
    displayEngineerKg = monthlyEngineerData.total[mIdx] || 0;
    if (viewMode === 'invoice') {
      displayTotalKg = displayInvoiceKg;
    } else if (viewMode === 'engineer') {
      displayTotalKg = displayEngineerKg;
    } else {
      // combined or scope
      displayTotalKg = invoiceMonths.has(mIdx) ? displayInvoiceKg : displayEngineerKg;
    }
  } else {
    displayTotalKg = totalKg;
  }

  const displayScopeData = { 'Scope 0': 0, 'Scope 1': 0, 'Scope 2': 0, 'Scope 3': 0 };
  const displayCategoryData = {};
  const displayEquipmentData = {};

  activeListForDisplay.forEach(act => {
    const co2e = parseFloat(act.co2e) || 0;
    const cat = getTrueCategory(act);
    const scNum = getScopeNum(cat);
    const scope = 'Scope ' + scNum;
    if (displayScopeData[scope] !== undefined) {
      displayScopeData[scope] += co2e;
    } else {
      displayScopeData['Scope 0'] = (displayScopeData['Scope 0'] || 0) + co2e;
    }
    displayCategoryData[cat] = (displayCategoryData[cat] || 0) + co2e;
    const eq = act.sourceName || 'Chưa rõ';
    displayEquipmentData[eq] = (displayEquipmentData[eq] || 0) + co2e;
  });

  // Cập nhật thẻ tổng quan bên trái
  const cardTotal = document.getElementById('card-total-emissions');
  if (viewMode === 'reconcile') {
    const deltaKg = displayInvoiceKg - displayEngineerKg;
    const pct = displayEngineerKg > 0 ? ((deltaKg / displayEngineerKg) * 100).toFixed(1) : '0';
    const deltaColor = deltaKg > 0 ? '#b91c1c' : (deltaKg < 0 ? '#1d4ed8' : '#15803d');
    const signStr = deltaKg > 0 ? '+' : '';

    if (cardTotal) {
      cardTotal.innerHTML = `
        <div style="font-weight: 600; font-size: 0.85rem; color: var(--color-text-primary); margin-bottom: 0.5rem; text-align: left;">
          Đối soát Năng lượng ${isMonthFilter ? `(Tháng ${selMonthNum}/${selectedYear})` : '(Hóa đơn vs Kỹ thuật)'}
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center; width: 100%; gap: 4px;">
          <div style="text-align: center; flex: 1;">
            <div style="font-size: 0.7rem; color: #1d4ed8; font-weight: 600;">Hóa đơn Kế toán</div>
            <div style="font-size: 1.35rem; font-weight: bold; color: #1d4ed8;">${(displayInvoiceKg / 1000).toFixed(2)}</div>
            <div style="font-size: 0.68rem; color: #64748b;">tCO2e ${isMonthFilter ? `Tháng ${selMonthNum}` : 'thực chi'}</div>
          </div>
          <div style="height: 36px; border-right: 1px solid #e2e8f0;"></div>
          <div style="text-align: center; flex: 1;">
            <div style="font-size: 0.7rem; color: #10b981; font-weight: 600;">Kỹ thuật Máy</div>
            <div style="font-size: 1.35rem; font-weight: bold; color: #10b981;">${(displayEngineerKg / 1000).toFixed(2)}</div>
            <div style="font-size: 0.68rem; color: #64748b;">tCO2e ${isMonthFilter ? `Tháng ${selMonthNum}` : 'định mức'}</div>
          </div>
          <div style="height: 36px; border-right: 1px solid #e2e8f0;"></div>
          <div style="text-align: center; flex: 1;">
            <div style="font-size: 0.7rem; color: ${deltaColor}; font-weight: 600;">Độ lệch đối soát</div>
            <div style="font-size: 1.35rem; font-weight: bold; color: ${deltaColor};">${signStr}${(deltaKg / 1000).toFixed(2)}</div>
            <div style="font-size: 0.68rem; color: ${deltaColor}; font-weight: 500;">${signStr}${pct}%</div>
          </div>
        </div>
        <div style="font-size: 0.72rem; color: #64748b; margin-top: 0.4rem; text-align: center;">
          ${isMonthFilter 
            ? (invoiceMonths.has(selMonthNum - 1) ? `Đã có hóa đơn cho Tháng ${selMonthNum}/${selectedYear}` : `Tháng ${selMonthNum} chưa có hóa đơn kế toán`)
            : (invoiceMonths.size > 0 ? `Đã có hóa đơn cho ${invoiceMonths.size}/12 tháng` : 'Chưa có hóa đơn nào được ghi nhận')}
        </div>
      `;
    }
  } else {
    const totalTonnes = (displayTotalKg / 1000).toFixed(2);
    const formattedTonnes = parseFloat(totalTonnes).toLocaleString('vi-VN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    if (cardTotal) {
      cardTotal.innerHTML = `
        <div style="font-weight: bold; font-size: 0.95rem; color: var(--color-text-primary); margin-bottom: 0.35rem;" id="dash-total-title">Tổng lượng khí thải (tCO2e)</div>
        <div id="dash-total-emissions" style="font-size: 2.35rem; color: var(--color-primary); font-weight: bold; letter-spacing: -0.5px;" data-tonnes="${totalTonnes}" title="${totalTonnes} tCO2e">${formattedTonnes}</div>
        <div style="font-size: 0.85rem; color: var(--color-text-secondary); margin-top: 0.35rem;" id="dash-total-subtitle">Thực tế ${monthNameStr} (${totalTonnes} tCO2e)</div>
      `;
    }
    const tTitle = document.getElementById('dash-total-title');
    const tSub = document.getElementById('dash-total-subtitle');
    if (tTitle && tSub) {
      if (viewMode === 'invoice') {
        tTitle.innerText = isYtd
          ? `Tổng phát thải theo Hóa đơn Kế toán Lũy kế (tCO2e)`
          : `Tổng phát thải theo Hóa đơn Kế toán ${isMonthFilter ? `Tháng ${selMonthNum}/${selectedYear}` : ''} (tCO2e)`.trim();
        tSub.innerText = isYtd
          ? `Hóa đơn Kế toán lũy kế đến ngày ${todayDisplay} (${activeListForDisplay.length} chứng từ) [${totalTonnes} tCO2e]`
          : `Chính thức từ Hóa đơn Kế toán (${activeListForDisplay.length} chứng từ) [${totalTonnes} tCO2e]`;
      } else if (viewMode === 'engineer') {
        tTitle.innerText = isYtd
          ? `Tổng phát thải Ước tính Kỹ thuật Lũy kế (tCO2e)`
          : `Tổng phát thải Ước tính Kỹ thuật ${isMonthFilter ? `Tháng ${selMonthNum}/${selectedYear}` : ''} (tCO2e)`.trim();
        tSub.innerText = isYtd
          ? `Vận hành máy lũy kế đến ngày ${todayDisplay} (${activeListForDisplay.length} ca máy) [${totalTonnes} tCO2e]`
          : `Dựa theo công suất & nhật ký máy (${activeListForDisplay.length} bản ghi) [${totalTonnes} tCO2e]`;
      } else if (viewMode === 'combined') {
        tTitle.innerText = isYtd
          ? `Tổng phát thải Lũy kế Thực tế (tCO2e)`
          : `Tổng phát thải Dự phóng kết hợp ${isMonthFilter ? `Tháng ${selMonthNum}/${selectedYear}` : ''} (tCO2e)`.trim();
        if (isYtd) {
          tSub.innerText = `Lũy kế thực tế từ 01/01 đến ${todayDisplay} [${totalTonnes} tCO2e]`;
        } else if (isMonthFilter) {
          tSub.innerText = invoiceMonths.has(selMonthNum - 1)
            ? `Hóa đơn thực tế Tháng ${selMonthNum} [${totalTonnes} tCO2e]`
            : `Dự báo Kỹ thuật vận hành Tháng ${selMonthNum} (Chưa có hóa đơn) [${totalTonnes} tCO2e]`;
        } else {
          const invMonthsArr = Array.from(invoiceMonths).map(m => m + 1).sort((a, b) => a - b);
          tSub.innerText = invMonthsArr.length > 0 
            ? `Hóa đơn thực tế Tháng ${invMonthsArr.join(', ')} + Dự báo kỹ thuật các tháng còn lại [${totalTonnes} tCO2e]`
            : `Dự báo Kỹ thuật vận hành 12 tháng (Chưa có hóa đơn) [${totalTonnes} tCO2e]`;
        }
      } else if (viewMode === 'scope') {
        tTitle.innerText = isYtd
          ? `Tổng phát thải Lũy kế đến ngày ${todayDisplay} (tCO2e)`
          : `Tổng phát thải theo 3 Phạm vi Scope ${isMonthFilter ? `Tháng ${selMonthNum}/${selectedYear}` : ''} (tCO2e)`.trim();
        const sc1 = (displayScopeData['Scope 1'] / 1000).toLocaleString('vi-VN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        const sc2 = (displayScopeData['Scope 2'] / 1000).toLocaleString('vi-VN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        const sc3 = (displayScopeData['Scope 3'] / 1000).toLocaleString('vi-VN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        const bioTonnes = (displayBiogenicKg / 1000).toLocaleString('vi-VN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        const bioBadgeHTML = displayBiogenicKg > 0 ? `
            <span style="display: inline-flex; align-items: center; gap: 4px; padding: 2px 7px; border-radius: 4px; background: #ecfdf5; color: #065f46; border: 1px solid #a7f3d0; white-space: nowrap;" title="CO2 sinh học (Biogenic CO2) được báo cáo riêng ngoài Scope 1 theo ISO 14064-1 & Nghị định 06/2022/NĐ-CP">
              <span style="width: 6px; height: 6px; border-radius: 50%; background: #059669; display: inline-block;"></span>
              Biogenic CO2: ${bioTonnes}t
            </span>
        ` : '';
        const unclassTonnes = ((displayScopeData['Scope 0'] || 0) / 1000).toLocaleString('vi-VN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        const unclassBadgeHTML = (displayScopeData['Scope 0'] || 0) > 0 ? `
            <span style="display: inline-flex; align-items: center; gap: 4px; padding: 2px 7px; border-radius: 4px; background: #fff1f2; color: #be123c; border: 1px solid #fecdd3; white-space: nowrap;" title="Phát thải chưa phân loại Scope - Cần phân loại nguồn để hoàn thiện báo cáo">
              <span style="width: 6px; height: 6px; border-radius: 50%; background: #e11d48; display: inline-block;"></span>
              Chưa phân loại: ${unclassTonnes}t
            </span>
        ` : '';
        tSub.innerHTML = `
          <div style="display: flex; justify-content: center; gap: 6px; flex-wrap: wrap; margin-top: 6px; font-size: 0.74rem; font-weight: 600;">
            ${unclassBadgeHTML}
            <span style="display: inline-flex; align-items: center; gap: 4px; padding: 2px 7px; border-radius: 4px; background: #fff7ed; color: #c2410c; border: 1px solid #ffedd5; white-space: nowrap;">
              <span style="width: 6px; height: 6px; border-radius: 50%; background: #ea580c; display: inline-block;"></span>
              Scope 1: ${sc1}t
            </span>
            <span style="display: inline-flex; align-items: center; gap: 4px; padding: 2px 7px; border-radius: 4px; background: #f0f9ff; color: #0369a1; border: 1px solid #e0f2fe; white-space: nowrap;">
              <span style="width: 6px; height: 6px; border-radius: 50%; background: #0284c7; display: inline-block;"></span>
              Scope 2: ${sc2}t
            </span>
            <span style="display: inline-flex; align-items: center; gap: 4px; padding: 2px 7px; border-radius: 4px; background: #f5f3ff; color: #6d28d9; border: 1px solid #ede9fe; white-space: nowrap;">
              <span style="width: 6px; height: 6px; border-radius: 50%; background: #8b5cf6; display: inline-block;"></span>
              Scope 3: ${sc3}t
            </span>
            ${bioBadgeHTML}
          </div>
        `;
      }
    }
  }

  // --- YoY Comparison Logic (Tính trên activeList) ---
  const yoyContainer = document.getElementById('yoy-comparison-container');
  if (yoyContainer) {
    const targetYear = parseInt(selectedYear) || new Date().getFullYear();
    const years = [targetYear - 2, targetYear - 1, targetYear];
    
    // Structure: yoyData[scopeNum][catName][year] = total tCO2e
    const yoyData = { 0: {}, 1: {}, 2: {}, 3: {} };
    
    // Lọc theo viewMode cho các năm
    const yoyActivities = activities.filter(act => {
      if (viewMode === 'invoice') return isInvoiceAct(act);
      if (viewMode === 'engineer') return isEngineerAct(act);
      return true;
    });

    yoyActivities.forEach(act => {
      if (!act.date) return;
      const y = parseInt(act.date.split('-')[0]);
      if (years.includes(y)) {
        const co2e = parseFloat(act.co2e) || 0;
        const trueCat = getTrueCategory(act);
        const scNum = getScopeNum(trueCat);
        if (!yoyData[scNum]) {
          yoyData[scNum] = {};
        }
        if (!yoyData[scNum][trueCat]) {
          yoyData[scNum][trueCat] = { [years[0]]: 0, [years[1]]: 0, [years[2]]: 0 };
        }
        yoyData[scNum][trueCat][y] += co2e;
      }
    });

    let html = `
    <table style="width: 100%; border-collapse: collapse; font-size: 0.9rem;">
      <thead>
        <tr style="border-bottom: 2px solid #eee; text-align: center; color: #666;">
          <th style="text-align: left; padding: 10px; width: 30%;">Loại khí thải</th>
          <th style="padding: 10px; width: 15%;">Năm ${years[0]}</th>
          <th style="padding: 10px; width: 15%;">Năm ${years[1]}</th>
          <th style="padding: 10px; width: 15%;">Năm ${years[2]}</th>
          <th style="padding: 10px; width: 25%;">So sánh hàng năm</th>
        </tr>
      </thead>
      <tbody>
    `;

    // Totals across all scopes
    let grandTotals = { [years[0]]: 0, [years[1]]: 0, [years[2]]: 0 };

    [1, 2, 3].forEach(scNum => {
      const cats = Object.keys(yoyData[scNum]);
      let scopeTotals = { [years[0]]: 0, [years[1]]: 0, [years[2]]: 0 };
      
      cats.forEach(cat => {
        years.forEach(y => {
          scopeTotals[y] += yoyData[scNum][cat][y];
        });
      });
      
      years.forEach(y => {
        grandTotals[y] += scopeTotals[y];
      });

      let diff1 = scopeTotals[years[0]] === 0 ? (scopeTotals[years[1]] > 0 ? 100 : 0) : ((scopeTotals[years[1]] - scopeTotals[years[0]]) / scopeTotals[years[0]] * 100);
      let diff2 = scopeTotals[years[1]] === 0 ? (scopeTotals[years[2]] > 0 ? 100 : 0) : ((scopeTotals[years[2]] - scopeTotals[years[1]]) / scopeTotals[years[1]] * 100);
      
      const formatDiff = (diff) => {
        if (diff === 0) return `<span style="color:#aaa;">-</span>`;
        if (diff > 0) return `<span style="color:#ef4444; font-size:0.75rem;">▲ +${diff.toFixed(1)}%</span>`;
        return `<span style="color:#10b981; font-size:0.75rem;">▼ ${diff.toFixed(1)}%</span>`;
      };
      
      const t1 = (scopeTotals[years[0]] / 1000).toFixed(2);
      const t2 = (scopeTotals[years[1]] / 1000).toFixed(2);
      const t3 = (scopeTotals[years[2]] / 1000).toFixed(2);

      html += `
        <tr style="border-bottom: 1px solid #eee; background: #fafafa; cursor: pointer;" onclick="document.getElementById('yoy-scope-${scNum}').style.display = document.getElementById('yoy-scope-${scNum}').style.display === 'none' ? 'table-row-group' : 'none'">
          <td style="padding: 12px 10px; font-weight: 600; text-align: left;">
            <svg width="12" height="12" style="margin-right:6px; display:inline-block;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>
            Scope ${scNum} (Phạm vi ${scNum})
          </td>
          <td style="padding: 12px 10px; text-align: center;">${t1 === '0.00' ? '0' : t1}</td>
          <td style="padding: 12px 10px; text-align: center;">${t2 === '0.00' ? '0' : t2}</td>
          <td style="padding: 12px 10px; text-align: center;">${t3 === '0.00' ? '0' : t3}</td>
          <td style="padding: 12px 10px; text-align: center;">
            <div style="display:flex; justify-content:center; gap: 10px;">
              ${formatDiff(diff1)} ${formatDiff(diff2)}
            </div>
          </td>
        </tr>
      `;

      html += `<tbody id="yoy-scope-${scNum}" style="display: none;">`;
      cats.forEach(cat => {
        let v1 = yoyData[scNum][cat][years[0]];
        let v2 = yoyData[scNum][cat][years[1]];
        let v3 = yoyData[scNum][cat][years[2]];
        
        let d1 = v1 === 0 ? (v2 > 0 ? 100 : 0) : ((v2 - v1) / v1 * 100);
        let d2 = v2 === 0 ? (v3 > 0 ? 100 : 0) : ((v3 - v2) / v2 * 100);
        
        const f1 = (v1 / 1000).toFixed(2);
        const f2 = (v2 / 1000).toFixed(2);
        const f3 = (v3 / 1000).toFixed(2);
        
        html += `
          <tr style="border-bottom: 1px solid #f5f5f5;">
            <td style="padding: 8px 10px 8px 30px; color: #555;">${cat}</td>
            <td style="padding: 8px 10px; text-align: center; color: #555;">${f1 === '0.00' ? '0' : f1}</td>
            <td style="padding: 8px 10px; text-align: center; color: #555;">${f2 === '0.00' ? '0' : f2}</td>
            <td style="padding: 8px 10px; text-align: center; color: #555;">${f3 === '0.00' ? '0' : f3}</td>
            <td style="padding: 8px 10px; text-align: center;">
              <div style="display:flex; justify-content:center; gap: 10px;">
                ${formatDiff(d1)} ${formatDiff(d2)}
              </div>
            </td>
          </tr>
        `;
      });

      if (cats.length === 0) {
        html += `
          <tr style="border-bottom: 1px solid #f5f5f5;">
            <td style="padding: 8px 10px 8px 30px; color: #aaa; font-style: italic;">Không có dữ liệu</td>
            <td style="padding: 8px 10px; text-align: center; color: #aaa;">0</td>
            <td style="padding: 8px 10px; text-align: center; color: #aaa;">0</td>
            <td style="padding: 8px 10px; text-align: center; color: #aaa;">0</td>
            <td style="padding: 8px 10px; text-align: center;">-</td>
          </tr>
        `;
      }
      html += `</tbody>`;
    });
    
    // Grand totals
    let gt1 = (grandTotals[years[0]] / 1000).toFixed(2);
    let gt2 = (grandTotals[years[1]] / 1000).toFixed(2);
    let gt3 = (grandTotals[years[2]] / 1000).toFixed(2);
    
    let gDiff1 = grandTotals[years[0]] === 0 ? (grandTotals[years[1]] > 0 ? 100 : 0) : ((grandTotals[years[1]] - grandTotals[years[0]]) / grandTotals[years[0]] * 100);
    let gDiff2 = grandTotals[years[1]] === 0 ? (grandTotals[years[2]] > 0 ? 100 : 0) : ((grandTotals[years[2]] - grandTotals[years[1]]) / grandTotals[years[1]] * 100);
    
    const formatDiffTotal = (diff) => {
      if (diff === 0) return `<span style="color:#aaa;">-</span>`;
      if (diff > 0) return `<span style="color:#ef4444; font-size:0.75rem;">▲ +${diff.toFixed(1)}%</span>`;
      return `<span style="color:#10b981; font-size:0.75rem;">▼ ${diff.toFixed(1)}%</span>`;
    };

    html += `
      <tbody>
        <tr style="border-top: 2px solid #eee; font-weight: bold; background: #fff;">
          <td style="padding: 12px 10px; text-align: center;">Tổng cộng</td>
          <td style="padding: 12px 10px; text-align: center;">${gt1 === '0.00' ? '0' : gt1}</td>
          <td style="padding: 12px 10px; text-align: center;">${gt2 === '0.00' ? '0' : gt2}</td>
          <td style="padding: 12px 10px; text-align: center;">${gt3 === '0.00' ? '0' : gt3}</td>
          <td style="padding: 12px 10px; text-align: center;">
            <div style="display:flex; justify-content:center; gap: 10px;">
              ${formatDiffTotal(gDiff1)} ${formatDiffTotal(gDiff2)}
            </div>
          </td>
        </tr>
      </tbody>
    </table>
    `;
    yoyContainer.innerHTML = html;
  }

  // --- BẢNG CƠ CẤU PHÁT THẢI CHI TIẾT 12 THÁNG ---
  const monthlyContainer = document.getElementById('monthly-breakdown-container');
  if (monthlyContainer) {
    let mHtml = `
      <table style="width: 100%; border-collapse: collapse; font-size: 0.82rem;">
        <thead>
          <tr style="background: #f8fafc; border-bottom: 2px solid #e2e8f0; color: #475569;">
            <th style="padding: 10px; text-align: left;">Tháng</th>
            <th style="padding: 10px; text-align: right; color: #c2410c;">Scope 1 (tCO2e)</th>
            <th style="padding: 10px; text-align: right; color: #0369a1;">Scope 2 (tCO2e)</th>
            <th style="padding: 10px; text-align: right; color: #6d28d9;">Scope 3 (tCO2e)</th>
            <th style="padding: 10px; text-align: right; font-weight: 700;">Tổng phát thải (tCO2e)</th>
            <th style="padding: 10px; text-align: center;">Tỷ trọng (%)</th>
            <th style="padding: 10px; text-align: center;">Trạng thái số liệu</th>
            <th style="padding: 10px; text-align: center;">Hành động</th>
          </tr>
        </thead>
        <tbody>
    `;

    let sumSc1 = 0, sumSc2 = 0, sumSc3 = 0, sumGrand = 0;
    const currentMonthReal = new Date().getMonth() + 1; // 1-12
    const isCurrentYear = (parseInt(selectedYear) === new Date().getFullYear());

    for (let m = 0; m < 12; m++) {
      let sc1 = (monthlyScopeData[1][m] || 0) / 1000;
      let sc2 = (monthlyScopeData[2][m] || 0) / 1000;
      let sc3 = (monthlyScopeData[3][m] || 0) / 1000;
      let sc0 = (monthlyScopeData[0] ? (monthlyScopeData[0][m] || 0) : 0) / 1000;
      let mTotal = sc1 + sc2 + sc3 + sc0;

      if (viewMode === 'invoice') {
        mTotal = (monthlyInvoiceData.total[m] || 0) / 1000;
      } else if (viewMode === 'engineer') {
        mTotal = (monthlyEngineerData.total[m] || 0) / 1000;
      }

      sumSc1 += sc1;
      sumSc2 += sc2;
      sumSc3 += sc3;
      sumGrand += mTotal;
    }

    for (let m = 0; m < 12; m++) {
      const mNum = m + 1;
      const mStr = String(mNum).padStart(2, '0');
      let sc1 = (monthlyScopeData[1][m] || 0) / 1000;
      let sc2 = (monthlyScopeData[2][m] || 0) / 1000;
      let sc3 = (monthlyScopeData[3][m] || 0) / 1000;
      let sc0 = (monthlyScopeData[0] ? (monthlyScopeData[0][m] || 0) : 0) / 1000;
      let mTotal = sc1 + sc2 + sc3 + sc0;
      if (viewMode === 'invoice') mTotal = (monthlyInvoiceData.total[m] || 0) / 1000;
      else if (viewMode === 'engineer') mTotal = (monthlyEngineerData.total[m] || 0) / 1000;

      const pct = sumGrand > 0 ? ((mTotal / sumGrand) * 100).toFixed(1) : '0.0';
      const isSelectedMonth = (isMonthFilter && selMonthNum === mNum);
      const isFutureMonth = (isCurrentYear && mNum > currentMonthReal);
      const hasInvoice = invoiceMonths.has(m);

      let statusBadge = '';
      if (hasInvoice) {
        statusBadge = '<span style="display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 0.72rem; font-weight: 600; background: #dbeafe; color: #1e40af; border: 1px solid #bfdbfe;">Hóa đơn chốt</span>';
      } else if (isFutureMonth) {
        statusBadge = '<span style="display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 0.72rem; font-weight: 500; background: #f1f5f9; color: #64748b; border: 1px solid #e2e8f0;">Dự toán định mức</span>';
      } else if (mTotal > 0) {
        statusBadge = '<span style="display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 0.72rem; font-weight: 600; background: #dcfce7; color: #166534; border: 1px solid #bbf7d0;">Vận hành thực tế</span>';
      } else {
        statusBadge = '<span style="display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 0.72rem; color: #94a3b8;">Chưa phát sinh</span>';
      }

      const rowBg = isSelectedMonth ? '#eff6ff' : (m % 2 === 0 ? '#fafafa' : '#ffffff');
      const rowBorder = isSelectedMonth ? '2px solid #3b82f6' : '1px solid #f1f5f9';

      mHtml += `
        <tr style="background: ${rowBg}; border-bottom: ${rowBorder}; transition: background 0.15s;" onmouseover="if (!${isSelectedMonth}) this.style.background='#f8fafc'" onmouseout="if (!${isSelectedMonth}) this.style.background='${rowBg}'">
          <td style="padding: 10px; font-weight: 600; color: #1e293b;">
            ${isSelectedMonth ? '<span style="color: #0284c7; margin-right: 4px;">▶</span>' : ''}Tháng ${mNum}/${selectedYear}
          </td>
          <td style="padding: 10px; text-align: right; color: #c2410c;">${sc1.toLocaleString('vi-VN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
          <td style="padding: 10px; text-align: right; color: #0369a1;">${sc2.toLocaleString('vi-VN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
          <td style="padding: 10px; text-align: right; color: #6d28d9;">${sc3.toLocaleString('vi-VN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
          <td style="padding: 10px; text-align: right; font-weight: 700; color: #0f172a;">${mTotal.toLocaleString('vi-VN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
          <td style="padding: 10px; text-align: center; color: #64748b; font-weight: 500;">${pct}%</td>
          <td style="padding: 10px; text-align: center;">${statusBadge}</td>
          <td style="padding: 10px; text-align: center;">
            <button type="button" onclick="if (typeof window.toggleDashboardMonth === 'function') window.toggleDashboardMonth('${mStr}'); else if (typeof window.selectDashboardMonth === 'function') window.selectDashboardMonth('${mStr}');" style="padding: 3px 10px; font-size: 0.75rem; border-radius: 5px; border: 1px solid #cbd5e1; background: ${isSelectedMonth ? '#0284c7' : '#ffffff'}; color: ${isSelectedMonth ? '#ffffff' : '#0284c7'}; font-weight: 600; cursor: pointer; transition: all 0.2s;" onmouseover="this.style.background='#0284c7'; this.style.color='#ffffff';" onmouseout="this.style.background='${isSelectedMonth ? '#0284c7' : '#ffffff'}'; this.style.color='${isSelectedMonth ? '#ffffff' : '#0284c7'}';" title="Xem sâu cơ cấu phát thải và ca máy từng ngày trong Tháng ${mNum}">
              ${isSelectedMonth ? 'Đang mở' : 'Xem chi tiết'}
            </button>
          </td>
        </tr>
      `;

      if (isSelectedMonth) {
        // Thu thap hoat dong chi tiet cua thang duoc chon
        const monthActs = activeList.filter(act => act.date && act.date.startsWith(`${selectedYear}-${mStr}`));

        const s1Map = new Map();
        const s2Map = new Map();
        const s3Map = new Map();

        monthActs.forEach(act => {
          const cat = getTrueCategory(act);
          const sc = getScopeNum(cat);
          const co2eTon = (parseFloat(act.co2e) || 0) / 1000;
          const sName = act.sourceName || 'Thiet bi';
          const amt = parseFloat(act.amount) || 0;
          const u = act.unit || '';

          if (sc === 1) {
            let fuel = act.fuel || act.energyType || cat;
            if (fuel.includes('Đốt cháy cố định')) fuel = 'Nhiên liệu cố định';
            if (fuel.includes('Đốt cháy động')) fuel = 'Dầu DO / Xăng';
            const k = `${sName}:::${fuel}`;
            if (!s1Map.has(k)) {
              s1Map.set(k, { name: sName, fuel: fuel, tco2e: 0, amount: 0, unit: u });
            }
            const item = s1Map.get(k);
            item.tco2e += co2eTon;
            item.amount += amt;
          } else if (sc === 2) {
            const k = sName;
            if (!s2Map.has(k)) {
              s2Map.set(k, { name: sName, tco2e: 0, kwh: 0 });
            }
            const item = s2Map.get(k);
            item.tco2e += co2eTon;
            item.kwh += amt;
          } else {
            const k = cat;
            if (!s3Map.has(k)) {
              s3Map.set(k, { name: sName, cat: cat, tco2e: 0 });
            }
            const item = s3Map.get(k);
            item.tco2e += co2eTon;
          }
        });

        // Du phong neu khong co chi tiet tung ban ghi nhung sc > 0
        if (s1Map.size === 0 && sc1 > 0) {
          s1Map.set('default_s1', { name: 'Đốt nhiên liệu cố định & di động', fuel: 'Nhiên liệu cơ sở', tco2e: sc1, amount: 0, unit: '' });
        }
        if (s2Map.size === 0 && sc2 > 0) {
          s2Map.set('default_s2', { name: 'Điện năng nhận từ lưới điện quốc gia', tco2e: sc2, kwh: Math.round(sc2 * 1000 / 0.6766) });
        }
        if (s3Map.size === 0 && sc3 > 0) {
          s3Map.set('default_s3', { name: 'Hoạt động chuỗi giá trị gián tiếp', cat: 'Scope 3 gián tiếp', tco2e: sc3 });
        }

        const s1Rows = Array.from(s1Map.values()).map(item => {
          const itemPct = sc1 > 0 ? ((item.tco2e / sc1) * 100).toFixed(1) : '0.0';
          const amtStr = item.amount > 0 ? `${item.amount.toLocaleString('vi-VN')} ${item.unit}` : '-';
          return `
            <tr style="border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 6px 8px; color: #1e293b; font-weight: 500;">${item.name}</td>
              <td style="padding: 6px 8px; color: #64748b;">${item.fuel}</td>
              <td style="padding: 6px 8px; text-align: right; font-weight: 600; color: #c2410c;">${item.tco2e.toLocaleString('vi-VN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
              <td style="padding: 6px 8px; text-align: right; color: #64748b;">${itemPct}%</td>
            </tr>
          `;
        }).join('');

        const s2Rows = Array.from(s2Map.values()).map(item => {
          const itemPct = sc2 > 0 ? ((item.tco2e / sc2) * 100).toFixed(1) : '0.0';
          const kwhStr = item.kwh > 0 ? item.kwh.toLocaleString('vi-VN') : '-';
          return `
            <tr style="border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 6px 8px; color: #1e293b; font-weight: 500;">${item.name}</td>
              <td style="padding: 6px 8px; text-align: right; color: #64748b;">${kwhStr}</td>
              <td style="padding: 6px 8px; text-align: right; font-weight: 600; color: #0369a1;">${item.tco2e.toLocaleString('vi-VN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
              <td style="padding: 6px 8px; text-align: right; color: #64748b;">${itemPct}%</td>
            </tr>
          `;
        }).join('');

        const s3Rows = Array.from(s3Map.values()).map(item => {
          const itemPct = sc3 > 0 ? ((item.tco2e / sc3) * 100).toFixed(1) : '0.0';
          return `
            <tr style="border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 6px 8px; color: #1e293b; font-weight: 500;">${item.cat || item.name}</td>
              <td style="padding: 6px 8px; text-align: right; font-weight: 600; color: #6d28d9;">${item.tco2e.toLocaleString('vi-VN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
              <td style="padding: 6px 8px; text-align: right; color: #64748b;">${itemPct}%</td>
            </tr>
          `;
        }).join('');

        mHtml += `
          <tr id="month-drawer-${mStr}" style="background: #f8fafc; border-bottom: 2px solid #3b82f6;">
            <td colspan="8" style="padding: 12px 14px;">
              <div style="background: #ffffff; border: 1px solid #cbd5e1; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.04); padding: 14px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px;">
                  <div>
                    <span style="font-weight: 700; font-size: 0.88rem; color: #0f172a;">Phân rã chi tiết nguồn phát thải Tháng ${mNum}/${selectedYear}</span>
                    <span style="margin-left: 10px; font-size: 0.78rem; color: #64748b;">Tổng phát thải: <strong style="color: #0f172a;">${mTotal.toLocaleString('vi-VN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} tCO2e</strong></span>
                  </div>
                  <button type="button" onclick="if (typeof window.toggleDashboardMonth === 'function') window.toggleDashboardMonth('${mStr}'); else if (typeof window.selectDashboardMonth === 'function') window.selectDashboardMonth('${mStr}');" style="padding: 3px 8px; font-size: 0.72rem; border-radius: 4px; border: 1px solid #cbd5e1; background: #f8fafc; color: #475569; cursor: pointer; font-weight: 600;">
                    Đóng chi tiết [x]
                  </button>
                </div>

                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 12px;">
                  <!-- Scope 1 Drawer Card -->
                  <div style="border: 1px solid #fed7aa; border-radius: 6px; background: #ffffff; overflow: hidden;">
                    <div style="background: #fff7ed; border-bottom: 1px solid #fed7aa; padding: 6px 10px; display: flex; justify-content: space-between; align-items: center;">
                      <span style="font-weight: 700; color: #c2410c; font-size: 0.78rem;">Scope 1: Phát thải trực tiếp</span>
                      <span style="font-weight: 700; color: #c2410c; font-size: 0.78rem;">${sc1.toLocaleString('vi-VN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} tCO2e</span>
                    </div>
                    ${s1Map.size > 0 ? `
                      <table style="width: 100%; border-collapse: collapse; font-size: 0.75rem;">
                        <thead>
                          <tr style="background: #fafafa; color: #64748b; border-bottom: 1px solid #f1f5f9;">
                            <th style="padding: 5px 8px; text-align: left;">Thiết bị</th>
                            <th style="padding: 5px 8px; text-align: left;">Nhiên liệu</th>
                            <th style="padding: 5px 8px; text-align: right;">tCO2e</th>
                            <th style="padding: 5px 8px; text-align: right;">%</th>
                          </tr>
                        </thead>
                        <tbody>${s1Rows}</tbody>
                      </table>
                    ` : `
                      <div style="padding: 12px; text-align: center; color: #94a3b8; font-size: 0.75rem;">Không phát sinh phát thải Scope 1</div>
                    `}
                  </div>

                  <!-- Scope 2 Drawer Card -->
                  <div style="border: 1px solid #bae6fd; border-radius: 6px; background: #ffffff; overflow: hidden;">
                    <div style="background: #f0f9ff; border-bottom: 1px solid #bae6fd; padding: 6px 10px; display: flex; justify-content: space-between; align-items: center;">
                      <span style="font-weight: 700; color: #0369a1; font-size: 0.78rem;">Scope 2: Điện lưới mua ngoài</span>
                      <span style="font-weight: 700; color: #0369a1; font-size: 0.78rem;">${sc2.toLocaleString('vi-VN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} tCO2e</span>
                    </div>
                    ${s2Map.size > 0 ? `
                      <table style="width: 100%; border-collapse: collapse; font-size: 0.75rem;">
                        <thead>
                          <tr style="background: #fafafa; color: #64748b; border-bottom: 1px solid #f1f5f9;">
                            <th style="padding: 5px 8px; text-align: left;">Trạm / Thiết bị</th>
                            <th style="padding: 5px 8px; text-align: right;">kWh</th>
                            <th style="padding: 5px 8px; text-align: right;">tCO2e</th>
                            <th style="padding: 5px 8px; text-align: right;">%</th>
                          </tr>
                        </thead>
                        <tbody>${s2Rows}</tbody>
                      </table>
                    ` : `
                      <div style="padding: 12px; text-align: center; color: #94a3b8; font-size: 0.75rem;">Không phát sinh phát thải Scope 2</div>
                    `}
                  </div>

                  <!-- Scope 3 Drawer Card -->
                  <div style="border: 1px solid #ddd6fe; border-radius: 6px; background: #ffffff; overflow: hidden;">
                    <div style="background: #f5f3ff; border-bottom: 1px solid #ddd6fe; padding: 6px 10px; display: flex; justify-content: space-between; align-items: center;">
                      <span style="font-weight: 700; color: #6d28d9; font-size: 0.78rem;">Scope 3: Chuỗi cung ứng</span>
                      <span style="font-weight: 700; color: #6d28d9; font-size: 0.78rem;">${sc3.toLocaleString('vi-VN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} tCO2e</span>
                    </div>
                    ${s3Map.size > 0 ? `
                      <table style="width: 100%; border-collapse: collapse; font-size: 0.75rem;">
                        <thead>
                          <tr style="background: #fafafa; color: #64748b; border-bottom: 1px solid #f1f5f9;">
                            <th style="padding: 5px 8px; text-align: left;">Hạng mục / Nguồn</th>
                            <th style="padding: 5px 8px; text-align: right;">tCO2e</th>
                            <th style="padding: 5px 8px; text-align: right;">%</th>
                          </tr>
                        </thead>
                        <tbody>${s3Rows}</tbody>
                      </table>
                    ` : `
                      <div style="padding: 12px; text-align: center; color: #94a3b8; font-size: 0.75rem;">Không phát sinh phát thải Scope 3</div>
                    `}
                  </div>
                </div>
              </div>
            </td>
          </tr>
        `;
      }
    }

    mHtml += `
        </tbody>
        <tfoot>
          <tr style="background: #f8fafc; border-top: 2px solid #cbd5e1; font-weight: 700; color: #0f172a;">
            <td style="padding: 12px 10px;">Tổng cộng Cả năm ${selectedYear}</td>
            <td style="padding: 12px 10px; text-align: right; color: #c2410c;">${sumSc1.toLocaleString('vi-VN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            <td style="padding: 12px 10px; text-align: right; color: #0369a1;">${sumSc2.toLocaleString('vi-VN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            <td style="padding: 12px 10px; text-align: right; color: #6d28d9;">${sumSc3.toLocaleString('vi-VN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            <td style="padding: 12px 10px; text-align: right; font-size: 0.95rem; color: var(--color-primary);">${sumGrand.toLocaleString('vi-VN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            <td style="padding: 12px 10px; text-align: center;">100.0%</td>
            <td colspan="2" style="padding: 12px 10px; text-align: center; color: #64748b; font-size: 0.75rem; font-weight: normal;">Số liệu hợp nhất 12 tháng</td>
          </tr>
        </tfoot>
      </table>
    `;

    monthlyContainer.innerHTML = mHtml;
  }

  // Cập nhật tiêu đề bảng theo tab và năm đang chọn
  const dashTableTitle = document.getElementById('dash-table-title');
  if (dashTableTitle) {
    if (typeof window !== 'undefined' && window.dashTableTab === 'yoy') {
      dashTableTitle.textContent = `Bảng theo dõi biến động phát thải theo Năm (YoY)`;
    } else {
      dashTableTitle.textContent = `Bảng Cơ cấu Phát thải Chi tiết 12 Tháng Năm ${selectedYear} (tCO2e)`;
    }
  }

  // Bảng màu 3 Scope chuẩn ESG Doanh nghiệp: Scope 1 (Cam Hổ Phách) - Scope 2 (Xanh Biển Sâu) - Scope 3 (Tím Thạch Anh)
  const scopeColors = ['#ea580c', '#0284c7', '#8b5cf6'];
  
  // Chart: Scope (Doughnut)
  const ctxScope = document.getElementById('chartScope');
  if (chartScopeObj) chartScopeObj.destroy();
  if (ctxScope) {
    chartScopeObj = new Chart(ctxScope, {
      type: 'doughnut',
      data: (() => {
        const labels = ['Scope 1 (Trực tiếp)', 'Scope 2 (Điện lưới)', 'Scope 3 (Chuỗi cung ứng)'];
        const chartData = [displayScopeData['Scope 1'] || 0, displayScopeData['Scope 2'] || 0, displayScopeData['Scope 3'] || 0];
        const colors = [...scopeColors];
        if ((displayScopeData['Scope 0'] || 0) > 0) {
          labels.push('Chưa phân loại (Cần phân loại)');
          chartData.push(displayScopeData['Scope 0']);
          colors.push('#f43f5e');
        }
        return {
          labels,
          datasets: [{
            data: chartData,
            backgroundColor: colors,
            borderWidth: 0
          }]
        };
      })(),
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom' }
        },
        cutout: '70%'
      }
    });
  }
  
  // Chart: Monthly / Daily (Bar)
  const ctxMonthly = document.getElementById('chartMonthly');
  if (chartMonthlyObj) chartMonthlyObj.destroy();
  if (ctxMonthly) {
    const timeframeEl = document.getElementById('dash-timeframe-select');
    const selectedTimeframe = (timeframeEl && timeframeEl.value) ? timeframeEl.value : 'all';
    const isYtd = (selectedTimeframe === 'ytd');
    const isMonthFilter = (!isYtd && selectedTimeframe !== 'all');

    let chartLabels = [];
    let monthlyDatasets = [];
    let isStacked = (typeof window !== 'undefined' && window.dashStackMode !== false);
    let showLegend = false;
    let xAxisTitle = '';

    if (isMonthFilter) {
      // CHẾ ĐỘ XEM THEO NGÀY (DAILY VIEW) TRONG THÁNG ĐƯỢC CHỌN
      const selMonth = parseInt(selectedTimeframe, 10);
      const isLeap = (parseInt(selectedYear) % 4 === 0 && (parseInt(selectedYear) % 100 !== 0 || parseInt(selectedYear) % 400 === 0));
      const daysCount = [31, isLeap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][selMonth - 1];
      chartLabels = Array.from({ length: daysCount }, (_, i) => `${i + 1}`);
      xAxisTitle = `Ngày trong Tháng ${selMonth}/${selectedYear}`;

      const targetMonthPrefix = `${selectedYear}-${selectedTimeframe}`;
      const engMonthActs = engineerList.filter(a => a.date && a.date.startsWith(targetMonthPrefix));
      const invMonthActs = invoiceList.filter(a => a.date && a.date.startsWith(targetMonthPrefix));

      const dailyEngineerData = Array(daysCount).fill(0);
      const dailyDowntimeData = Array(daysCount).fill(0);
      const dailyScopeData = { 0: Array(daysCount).fill(0), 1: Array(daysCount).fill(0), 2: Array(daysCount).fill(0), 3: Array(daysCount).fill(0) };

      engMonthActs.forEach(act => {
        const co2e = parseFloat(act.co2e) || 0;
        const dayNum = parseInt((act.date.split('-')[2] || '1'), 10);
        const dayIdx = Math.max(0, Math.min(daysCount - 1, dayNum - 1));
        const cat = getTrueCategory(act);
        const scNum = getScopeNum(cat);

        if (act.isDowntime === 'true') {
          dailyDowntimeData[dayIdx] += co2e; // số âm
          dailyScopeData[scNum][dayIdx] += co2e;
        } else if (act.isBaseline === 'true') {
          const dWeek = (act.sourceId && sourceDaysWeekMap[act.sourceId])
            ? sourceDaysWeekMap[act.sourceId]
            : ((act.sourceType && sourceDaysWeekMap[act.sourceType]) ? sourceDaysWeekMap[act.sourceType] : 6);
          let workingDays = 0;
          for (let d = 0; d < daysCount; d++) {
            const dt = new Date(parseInt(selectedYear), selMonth - 1, d + 1);
            const dow = dt.getDay(); // 0 = CN, 6 = T7
            const dStr = `${selectedYear}-${selectedTimeframe}-${String(d + 1).padStart(2, '0')}`;
            const isOff = (dWeek <= 5 && (dow === 0 || dow === 6)) || (dWeek === 6 && dow === 0) || checkVnPublicHoliday(dStr);
            if (!isOff) workingDays++;
          }
          if (workingDays === 0) workingDays = daysCount;
          const dailyShare = co2e / workingDays;
          for (let d = 0; d < daysCount; d++) {
            const dt = new Date(parseInt(selectedYear), selMonth - 1, d + 1);
            const dow = dt.getDay();
            const dStr = `${selectedYear}-${selectedTimeframe}-${String(d + 1).padStart(2, '0')}`;
            const isOff = (dWeek <= 5 && (dow === 0 || dow === 6)) || (dWeek === 6 && dow === 0) || checkVnPublicHoliday(dStr);
            if (!isOff) {
              dailyEngineerData[d] += dailyShare;
              dailyScopeData[scNum][d] += dailyShare;
            }
          }
        } else {
          dailyEngineerData[dayIdx] += co2e;
          dailyScopeData[scNum][dayIdx] += co2e;
        }
      });

      const dailyInvoiceData = Array(daysCount).fill(0);
      invMonthActs.forEach(act => {
        const co2e = parseFloat(act.co2e) || 0;
        const dayNum = parseInt((act.date.split('-')[2] || daysCount.toString()), 10);
        const dayIdx = Math.max(0, Math.min(daysCount - 1, dayNum - 1));
        dailyInvoiceData[dayIdx] += co2e;
        if (engMonthActs.length === 0) {
          const cat = getTrueCategory(act);
          const scNum = getScopeNum(cat);
          dailyScopeData[scNum][dayIdx] += co2e;
        }
      });

      if (viewMode === 'scope') {
        isStacked = (typeof window !== 'undefined' && window.dashStackMode !== false);
        showLegend = true;
        monthlyDatasets = [
          {
            label: 'Scope 1 - Trực tiếp',
            data: dailyScopeData[1].map(v => Math.max(0, Math.round(v * 100) / 100)),
            backgroundColor: scopeColors[0],
            borderRadius: isStacked ? 0 : 3
          },
          {
            label: 'Scope 2 - Gián tiếp điện lưới',
            data: dailyScopeData[2].map(v => Math.max(0, Math.round(v * 100) / 100)),
            backgroundColor: scopeColors[1],
            borderRadius: isStacked ? 0 : 3
          },
          {
            label: 'Scope 3 - Chuỗi cung ứng',
            data: dailyScopeData[3].map(v => Math.max(0, Math.round(v * 100) / 100)),
            backgroundColor: scopeColors[2],
            borderRadius: isStacked ? 3 : 3
          }
        ];
      } else if (viewMode === 'reconcile') {
        isStacked = false;
        showLegend = true;
        monthlyDatasets = [
          {
            label: 'Hóa đơn Kế toán (kgCO2e)',
            data: dailyInvoiceData.map(v => Math.round(v * 100) / 100),
            backgroundColor: '#1d4ed8',
            borderRadius: 3
          },
          {
            label: 'Kỹ thuật Vận hành thực tế (kgCO2e)',
            data: dailyEngineerData.map((v, i) => Math.round((v + dailyDowntimeData[i]) * 100) / 100),
            backgroundColor: '#10b981',
            borderRadius: 3
          }
        ];
      } else if (viewMode === 'invoice') {
        isStacked = false;
        showLegend = true;
        monthlyDatasets = [
          {
            label: 'Hóa đơn Kế toán phát sinh (kgCO2e)',
            data: dailyInvoiceData.map(v => Math.round(v * 100) / 100),
            backgroundColor: '#1d4ed8',
            borderRadius: 3
          }
        ];
      } else {
        // Engineer hoặc Combined: Hiện rõ vận hành chuẩn và cột giảm trừ do sự cố
        isStacked = false;
        showLegend = true;
        monthlyDatasets = [
          {
            label: 'Vận hành chuẩn (kgCO2e)',
            data: dailyEngineerData.map(v => Math.round(v * 100) / 100),
            backgroundColor: '#10b981',
            borderRadius: 3
          },
          {
            label: 'Giảm trừ Dừng máy sự cố (-) (kgCO2e)',
            data: dailyDowntimeData.map(v => Math.round(v * 100) / 100),
            backgroundColor: '#ef4444',
            borderRadius: 3
          }
        ];
      }
    } else {
      // CHẾ ĐỘ XEM CẢ NĂM (12 THÁNG HOẶC LŨY KẾ YTD)
      chartLabels = ['Th 1', 'Th 2', 'Th 3', 'Th 4', 'Th 5', 'Th 6', 'Th 7', 'Th 8', 'Th 9', 'Th 10', 'Th 11', 'Th 12'];
      xAxisTitle = isYtd ? `12 Tháng Năm ${selectedYear} (Lũy kế Thực tế đến ngày ${todayDisplay})` : `12 Tháng Năm ${selectedYear}`;

      if (viewMode === 'scope') {
        isStacked = (typeof window !== 'undefined' && window.dashStackMode !== false);
        showLegend = true;

        monthlyDatasets = [
          {
            type: 'bar',
            label: 'Scope 1 - Nhiên liệu trực tiếp',
            data: monthlyScopeData[1].map(v => Math.max(0, Math.round(v * 100) / 100)),
            backgroundColor: scopeColors[0],
            borderRadius: isStacked ? 0 : 3
          },
          {
            type: 'bar',
            label: 'Scope 2 - Gián tiếp điện lưới',
            data: monthlyScopeData[2].map(v => Math.max(0, Math.round(v * 100) / 100)),
            backgroundColor: scopeColors[1],
            borderRadius: isStacked ? 0 : 3
          },
          {
            type: 'bar',
            label: 'Scope 3 - Chuỗi cung ứng',
            data: monthlyScopeData[3].map(v => Math.max(0, Math.round(v * 100) / 100)),
            backgroundColor: scopeColors[2],
            borderRadius: isStacked ? 4 : 3
          }
        ];
      } else if (viewMode === 'reconcile') {
        // Chế độ Đối soát: 2 cột đôi song song cho 12 tháng
        isStacked = false;
        showLegend = true;
        monthlyDatasets = [
          {
            type: 'bar',
            label: 'Hóa đơn Kế toán',
            data: monthlyInvoiceData.total.map(v => Math.round(v * 100) / 100),
            backgroundColor: '#1e40af',
            borderRadius: 4
          },
          {
            type: 'bar',
            label: 'Kỹ thuật Ước tính',
            data: monthlyEngineerData.total.map(v => Math.round(v * 100) / 100),
            backgroundColor: '#059669',
            borderRadius: 4
          }
        ];
      } else if (viewMode === 'combined') {
        // Chế độ Dự phóng kết hợp: Phân biệt rõ Thực tế Hóa đơn vs Dự báo Kỹ thuật (KHÔNG TRÙNG LẶP THEO NĂNG LƯỢNG)
        isStacked = true;
        showLegend = true;
        const combinedEngineerByMonth = Array(12).fill(0);
        engineerList.filter(filterEngineerDeduplicated).forEach(act => {
          if (act.date) {
            const m = parseInt(act.date.split('-')[1], 10) - 1;
            if (m >= 0 && m < 12) combinedEngineerByMonth[m] += (parseFloat(act.co2e) || 0);
          }
        });
        const actualInvoiceData = monthlyInvoiceData.total.map(v => Math.round(v * 100) / 100);
        const forecastEngineerData = combinedEngineerByMonth.map(v => Math.round(v * 100) / 100);

        monthlyDatasets = [
          {
            type: 'bar',
            label: 'Hóa đơn Thực tế',
            data: actualInvoiceData,
            backgroundColor: '#1e40af',
            borderRadius: 4
          },
          {
            type: 'bar',
            label: 'Dự báo Kỹ thuật',
            data: forecastEngineerData,
            backgroundColor: '#059669',
            borderRadius: 4
          }
        ];
      } else {
        // Chế độ Hóa đơn đơn lẻ hoặc Chế độ Kỹ thuật đơn lẻ: Phân bổ theo Scope
        isStacked = true;
        showLegend = true;
        monthlyDatasets = [
          { type: 'bar', label: 'Scope 1', data: monthlyScopeData[1], backgroundColor: scopeColors[0], borderRadius: 0 },
          { type: 'bar', label: 'Scope 2', data: monthlyScopeData[2], backgroundColor: scopeColors[1], borderRadius: 0 },
          { type: 'bar', label: 'Scope 3', data: monthlyScopeData[3], backgroundColor: scopeColors[2], borderRadius: 4 }
        ];
      }
    }

    chartMonthlyObj = new Chart(ctxMonthly, {
      type: 'bar',
      data: {
        labels: chartLabels,
        datasets: monthlyDatasets
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        onClick: (event, elements) => {
          if (elements && elements.length > 0 && (selectedTimeframe === 'all' || selectedTimeframe === 'ytd')) {
            const idx = elements[0].index;
            if (idx >= 0 && idx < 12) {
              const mStr = String(idx + 1).padStart(2, '0');
              const tfEl = document.getElementById('dash-timeframe-select');
              if (tfEl) {
                tfEl.value = mStr;
                renderDashboard();
              }
            }
          }
        },
        scales: {
          y: { stacked: isStacked, beginAtZero: true, grid: { color: '#f3f4f6' } },
          x: { 
            stacked: isStacked, 
            grid: { display: false },
            title: { display: Boolean(xAxisTitle), text: xAxisTitle, font: { size: 11 } }
          }
        },
        plugins: {
          legend: {
            display: showLegend,
            position: 'top',
            labels: { boxWidth: 12, font: { size: 11 } }
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                let label = context.dataset.label || '';
                if (label) label += ': ';
                const val = context.parsed.y !== null ? context.parsed.y : context.raw;
                label += (typeof val === 'number' ? val.toLocaleString('vi-VN') : val) + ' kgCO2e';
                if (isStacked && context.chart.data.datasets.length > 1 && context.dataset.type !== 'line') {
                  let totalForIndex = 0;
                  context.chart.data.datasets.forEach(ds => {
                    if (ds.type !== 'line') {
                      const v = ds.data[context.dataIndex] || 0;
                      if (v > 0) totalForIndex += v;
                    }
                  });
                  if (totalForIndex > 0 && val > 0) {
                    const pct = ((val / totalForIndex) * 100).toFixed(1);
                    label += ` (${pct}%)`;
                  }
                }
                return label;
              },
              footer: function(tooltipItems) {
                if (isStacked && tooltipItems.length > 1) {
                  let sum = 0;
                  tooltipItems.forEach(item => {
                    if (item.dataset.type !== 'line') {
                      sum += (item.parsed.y || 0);
                    }
                  });
                  return 'Tổng phát thải: ' + (Math.round(sum * 100) / 100).toLocaleString('vi-VN') + ' kgCO2e';
                }
                return '';
              }
            }
          }
        }
      }
    });

    const chartTitleEl = document.getElementById('chart-monthly-title');
    const chartSubtitleEl = document.getElementById('chart-monthly-subtitle');
    const btnBackToYear = document.getElementById('btn-back-to-year');

    if (btnBackToYear) {
      btnBackToYear.style.display = isMonthFilter ? 'inline-flex' : 'none';
    }

    if (chartTitleEl) {
      if (isMonthFilter) {
        const selMonth = parseInt(selectedTimeframe, 10);
        if (viewMode === 'scope') {
          chartTitleEl.textContent = `Cơ cấu Scope 1, 2, 3 - Chi tiết Tháng ${selMonth}/${selectedYear} (kgCO2e)`;
        } else if (viewMode === 'reconcile') {
          chartTitleEl.textContent = `Đối soát Hóa đơn vs Vận hành - Tháng ${selMonth}/${selectedYear} (kgCO2e)`;
        } else if (viewMode === 'invoice') {
          chartTitleEl.textContent = `Phát thải Hóa đơn Kế toán - Tháng ${selMonth}/${selectedYear} (kgCO2e)`;
        } else {
          chartTitleEl.textContent = `Vận hành Kỹ thuật Máy móc - Tháng ${selMonth}/${selectedYear} (kgCO2e)`;
        }
        if (chartSubtitleEl) chartSubtitleEl.textContent = `Biểu đồ phân rã ca máy từng ngày (1 - ${daysCount}) trong tháng`;
      } else if (isYtd) {
        if (viewMode === 'scope') {
          chartTitleEl.textContent = `Phát thải Lũy kế Thực tế đến ngày ${todayDisplay} (kgCO2e)`;
        } else if (viewMode === 'reconcile') {
          chartTitleEl.textContent = `Đối soát Thực tế Hóa đơn vs Kỹ thuật đến ngày ${todayDisplay} (kgCO2e)`;
        } else if (viewMode === 'combined') {
          chartTitleEl.textContent = `Phát thải Thực tế Lũy kế đến ngày ${todayDisplay} (kgCO2e)`;
        } else {
          chartTitleEl.textContent = `Phát thải Thực tế Lũy kế đến ngày ${todayDisplay} (kgCO2e)`;
        }
        if (chartSubtitleEl) chartSubtitleEl.textContent = `Số liệu thực tế tính từ 01/01 đến ${todayDisplay} (các tháng tương lai chưa phát sinh = 0)`;
      } else {
        if (viewMode === 'scope') {
          chartTitleEl.textContent = `Cơ cấu Phát thải theo Scope 12 Tháng Năm ${selectedYear} (kgCO2e)`;
        } else if (viewMode === 'reconcile') {
          chartTitleEl.textContent = `So sánh Đối soát Hóa đơn vs Kỹ thuật 12 Tháng Năm ${selectedYear} (kgCO2e)`;
        } else if (viewMode === 'combined') {
          chartTitleEl.textContent = `Dự phóng Phát thải Kết hợp 12 Tháng Năm ${selectedYear} (kgCO2e)`;
        } else {
          chartTitleEl.textContent = `Lượng khí thải carbon hàng tháng Năm ${selectedYear} (kgCO2e)`;
        }
        if (chartSubtitleEl) chartSubtitleEl.textContent = `Nhấp trực tiếp vào cột tháng để xem sâu chi tiết từng ngày, rê chuột xem tỷ lệ %`;
      }
    }

    const btnToggleStack = document.getElementById('btn-toggle-stack-mode');
    if (btnToggleStack) {
      btnToggleStack.style.display = (viewMode === 'scope') ? 'inline-flex' : 'none';
      const span = btnToggleStack.querySelector('span');
      if (span) {
        span.innerText = isStacked ? 'Xem dạng Tách cột' : 'Xem dạng Chồng lớp';
      }
    }
  }
  
  // Sort Category and Equipment data for horizontal bars (Đồng bộ theo Tháng / Cả năm)
  const sortData = (obj) => {
    return Object.keys(obj).map(k => ({ label: k, value: obj[k] })).sort((a, b) => b.value - a.value).slice(0, 5);
  };
  
  const catSorted = sortData(displayCategoryData);
  const eqSorted = sortData(displayEquipmentData);
  
  // Chart: Category
  const ctxCategory = document.getElementById('chartCategory');
  if (chartCategoryObj) chartCategoryObj.destroy();
  if (ctxCategory) {
    chartCategoryObj = new Chart(ctxCategory, {
      type: 'bar',
      data: {
        labels: catSorted.map(d => d.label.length > 20 ? d.label.substring(0, 20) + '...' : d.label),
        datasets: [{
          data: catSorted.map(d => d.value),
          backgroundColor: catSorted.map(d => scopeColors[(catScopeMap[d.label] || 3) - 1]),
          borderRadius: 4
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: { beginAtZero: true, grid: { color: '#f3f4f6' } },
          y: { grid: { display: false } }
        },
        plugins: { legend: { display: false } }
      }
    });
  }
  
  // Chart: Equipment
  const ctxEquipment = document.getElementById('chartEquipment');
  if (chartEquipmentObj) chartEquipmentObj.destroy();
  if (ctxEquipment) {
    chartEquipmentObj = new Chart(ctxEquipment, {
      type: 'bar',
      data: {
        labels: eqSorted.map(d => d.label.length > 20 ? d.label.substring(0, 20) + '...' : d.label),
        datasets: [{
          data: eqSorted.map(d => d.value),
          backgroundColor: eqSorted.map(d => scopeColors[(eqScopeMap[d.label] || 3) - 1]),
          borderRadius: 4
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: { beginAtZero: true, grid: { color: '#f3f4f6' } },
          y: { grid: { display: false } }
        },
        plugins: { legend: { display: false } }
      }
    });
  }

}

// Hook up events
document.addEventListener('DOMContentLoaded', () => {
  const branchEl = document.getElementById('branch-selector');
  if (branchEl) {
    branchEl.addEventListener('change', () => {
      setTimeout(renderDashboard, 100);
    });
  }
  
  const yearSelect = document.getElementById('dash-year-select');
  if (yearSelect) {
    yearSelect.addEventListener('change', renderDashboard);
  }

  const viewModeSelect = document.getElementById('dash-view-mode');
  if (viewModeSelect) {
    viewModeSelect.addEventListener('change', renderDashboard);
  }

  const timeframeSelect = document.getElementById('dash-timeframe-select');
  if (timeframeSelect) {
    timeframeSelect.addEventListener('change', renderDashboard);
  }

  const btnDashYtd = document.getElementById('btn-dash-ytd');
  if (btnDashYtd) {
    btnDashYtd.addEventListener('click', () => {
      const tfEl = document.getElementById('dash-timeframe-select');
      if (tfEl) tfEl.value = 'ytd';
      renderDashboard();
    });
  }

  const btnDashAll = document.getElementById('btn-dash-all');
  if (btnDashAll) {
    btnDashAll.addEventListener('click', () => {
      const tfEl = document.getElementById('dash-timeframe-select');
      if (tfEl) tfEl.value = 'all';
      renderDashboard();
    });
  }

  const btnDashMonth = document.getElementById('btn-dash-month');
  if (btnDashMonth) {
    btnDashMonth.addEventListener('click', () => {
      const tfEl = document.getElementById('dash-timeframe-select');
      if (tfEl) {
        if (tfEl.value === 'ytd' || tfEl.value === 'all') {
          const currentMonthNum = new Date().getMonth() + 1;
          tfEl.value = String(currentMonthNum).padStart(2, '0');
        }
      }
      renderDashboard();
    });
  }

  // Chuyển đổi giữa Bảng Cơ cấu 12 Tháng và Bảng Biến động Năm (YoY)
  const btnTabMonthly = document.getElementById('btn-tab-monthly-breakdown');
  const btnTabYoy = document.getElementById('btn-tab-yoy-breakdown');
  const contMonthly = document.getElementById('monthly-breakdown-container');
  const contYoy = document.getElementById('yoy-comparison-container');
  const titleDashTable = document.getElementById('dash-table-title');

  if (btnTabMonthly && btnTabYoy) {
    btnTabMonthly.addEventListener('click', () => {
      window.dashTableTab = 'monthly';
      if (contMonthly) contMonthly.style.display = 'block';
      if (contYoy) contYoy.style.display = 'none';
      btnTabMonthly.style.background = '#0284c7';
      btnTabMonthly.style.color = '#ffffff';
      btnTabMonthly.style.fontWeight = '600';
      btnTabYoy.style.background = 'transparent';
      btnTabYoy.style.color = '#64748b';
      btnTabYoy.style.fontWeight = '500';
      if (titleDashTable) {
        const yearVal = document.getElementById('dash-year-select')?.value || '2026';
        titleDashTable.textContent = `Bảng Cơ cấu Phát thải Chi tiết 12 Tháng Năm ${yearVal} (tCO2e)`;
      }
    });

    btnTabYoy.addEventListener('click', () => {
      window.dashTableTab = 'yoy';
      if (contMonthly) contMonthly.style.display = 'none';
      if (contYoy) contYoy.style.display = 'block';
      btnTabYoy.style.background = '#0284c7';
      btnTabYoy.style.color = '#ffffff';
      btnTabYoy.style.fontWeight = '600';
      btnTabMonthly.style.background = 'transparent';
      btnTabMonthly.style.color = '#64748b';
      btnTabMonthly.style.fontWeight = '500';
      if (titleDashTable) {
        titleDashTable.textContent = `Bảng theo dõi biến động phát thải theo Năm (YoY)`;
      }
    });
  }
  
  // Render on view switch to dashboard được điều phối duy nhất bởi main view switcher trong carbon-inventory.html
  
  // Re-render when Activity Data is saved
  const btnSaveActivity = document.getElementById('btn-save-activity-modal');
  if (btnSaveActivity) {
    btnSaveActivity.addEventListener('click', () => {
      setTimeout(renderDashboard, 200);
    });
  }

  // Nút chuyển đổi xem chồng lớp (Stacked) / tách cột (Grouped)
  const btnToggleStack = document.getElementById('btn-toggle-stack-mode');
  if (btnToggleStack) {
    btnToggleStack.addEventListener('click', () => {
      window.dashStackMode = (window.dashStackMode === false) ? true : false;
      renderDashboard();
    });
  }

  // Nút quay lại cả năm khi đang drilldown vào tháng
  const btnBackYear = document.getElementById('btn-back-to-year');
  if (btnBackYear) {
    btnBackYear.addEventListener('click', () => {
      const tfEl = document.getElementById('dash-timeframe-select');
      if (tfEl) tfEl.value = 'all';
      renderDashboard();
    });
  }
  
  // Initial render
  setTimeout(renderDashboard, 500);
});

function selectDashboardMonth(mStr) {
  const tfEl = document.getElementById('dash-timeframe-select');
  if (tfEl) {
    tfEl.value = mStr;
    renderDashboard();
  }
}

function toggleDashboardMonth(mStr) {
  const tfEl = document.getElementById('dash-timeframe-select');
  if (tfEl) {
    if (tfEl.value === mStr) {
      tfEl.value = 'all';
    } else {
      tfEl.value = mStr;
    }
    renderDashboard();
  }
}

if (typeof window !== 'undefined') {
  window.renderDashboard = renderDashboard;
  window.selectDashboardMonth = selectDashboardMonth;
  window.toggleDashboardMonth = toggleDashboardMonth;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { renderDashboard, selectDashboardMonth, toggleDashboardMonth };
}
