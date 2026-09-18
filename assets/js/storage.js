/**
 * GreenShift v2.0 — Storage Module
 * Stores company data and annual entry data in localStorage
 */

const Storage = {
  getCompany() {
    const v2 = JSON.parse(localStorage.getItem('gs_v2_company')) || {};
    try {
      const userStr = localStorage.getItem('gs_current_user') || 'guest';
      const users = JSON.parse(localStorage.getItem('gs_users') || '[]');
      const user = users.find(u => u.username === userStr);
      if (user && user.company && user.company.name) {
        return {
          ...v2,
          ...user.company,
          name: user.company.name,
          tax: user.company.taxId || user.company.tax || v2.tax,
          address: user.company.address || v2.address
        };
      }
    } catch(e) {}
    return Object.keys(v2).length > 0 ? v2 : null;
  },
  
  saveCompany(data) {
    localStorage.setItem('gs_v2_company', JSON.stringify(data));
  },

  getAnnualData() {
    return JSON.parse(localStorage.getItem('gs_v2_annual_data')) || {};
  },

  saveAnnualData(data) {
    localStorage.setItem('gs_v2_annual_data', JSON.stringify(data));
  },

  clearAll() {
    localStorage.removeItem('gs_v2_company');
    localStorage.removeItem('gs_v2_annual_data');
    // Also clear old v1 data
    localStorage.removeItem('gs_company');
    localStorage.removeItem('gs_records');
  }
};

/**
 * Tiền xử lý và chuyển đổi chuỗi số định dạng Việt Nam / Quốc tế thành số thực (float)
 * Hỗ trợ các trường hợp:
 * - "150,5" -> 150.5 (dấu phẩy thập phân)
 * - "1.200,5" -> 1200.5 (dấu chấm phân cách ngàn, dấu phẩy thập phân)
 * - "1,200.5" -> 1200.5 (dấu phẩy phân cách ngàn, dấu chấm thập phân)
 * - Số nguyên, số thực hoặc chuỗi rỗng / null / undefined -> 0
 * @param {any} val
 * @returns {number}
 */
function parseVnNumber(val) {
  if (val === null || val === undefined) return 0;
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  let s = String(val).trim().replace(/\s/g, '');
  if (!s) return 0;
  if (s.includes(',') && s.includes('.')) {
    if (s.lastIndexOf(',') > s.lastIndexOf('.')) {
      s = s.replace(/\./g, '').replace(',', '.');
    } else {
      s = s.replace(/,/g, '');
    }
  } else if (s.includes(',')) {
    s = s.replace(',', '.');
  }
  const n = parseFloat(s);
  return isNaN(n) ? 0 : n;
}

if (typeof window !== 'undefined') {
  window.Storage = Storage;
  window.parseVnNumber = parseVnNumber;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { Storage, parseVnNumber };
}
