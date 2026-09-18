/**
 * GreenShift - Smart e-Invoice Parser (Bộ bóc tách Hóa đơn Điện tử Thông minh)
 * Tuân thủ chuẩn Thông tư 78/2021/TT-BTC & Nghị định 123/2020/NĐ-CP của Tổng cục Thuế Việt Nam.
 * Hỗ trợ bóc tách hóa đơn Petrolimex, EVN, VNPT, Viettel, MISA, Bkav...
 */

(function(window) {
  'use strict';

  const getMasterFuelFactor = (key, fallback) => {
    if (typeof window !== 'undefined' && window.EF_MASTER && window.EF_MASTER.VN && window.EF_MASTER.VN.fuels && window.EF_MASTER.VN.fuels[key]) {
      return String(window.EF_MASTER.VN.fuels[key].factor);
    }
    return fallback;
  };

  const getMasterElecFactor = (fallback) => {
    if (typeof window !== 'undefined' && window.EF_MASTER && window.EF_MASTER.VN && window.EF_MASTER.VN.electricity && window.EF_MASTER.VN.electricity.grid_kwh) {
      return String(window.EF_MASTER.VN.electricity.grid_kwh.factor);
    }
    return fallback;
  };

  // Danh mục Hạng mục Năng lượng cấp Cơ sở cho Kế toán (Đồng bộ chuẩn EF_MASTER)
  const FACILITY_ENERGY_SOURCES = [
    {
      id: 'src_fac_diesel',
      name: 'Dầu Diesel (DO) mua ngoài (Toàn nhà máy / Bồn tổng)',
      category: 'Đốt cháy cố định',
      type: 'Đốt cháy cố định',
      ef: 'Dầu Diesel (DO)',
      efFactor: getMasterFuelFactor('diesel', '2.686'),
      efUnit: 'kgCO2e/lít',
      unit: 'lít',
      measure: 'volume',
      isFacility: 'true',
      scope: 1,
      keywords: ['dầu', 'dau', 'diesel', 'diezen', 'do 0,05s', 'do 0.05s', 'petrolimex']
    },
    {
      id: 'src_fac_electricity',
      name: 'Điện lưới EVN mua ngoài (Tổng công tơ nhà máy)',
      category: 'Điện mua vào',
      type: 'Điện mua vào',
      ef: 'Điện lưới Việt Nam',
      efFactor: getMasterElecFactor('0.6766'),
      efUnit: 'kgCO2e/kWh',
      unit: 'kWh',
      measure: 'volume',
      isFacility: 'true',
      scope: 2,
      keywords: ['điện', 'dien', 'kwh', 'evn', 'điện năng', 'dien nang', 'công tơ']
    },
    {
      id: 'src_fac_petrol',
      name: 'Xăng RON 95 / E5 mua ngoài (Xe công ty & Động cơ nổ)',
      category: 'Đốt cháy động',
      type: 'Đốt cháy động',
      ef: 'Xăng',
      efFactor: getMasterFuelFactor('petrol', '2.271'),
      efUnit: 'kgCO2e/lít',
      unit: 'lít',
      measure: 'volume',
      isFacility: 'true',
      scope: 1,
      keywords: ['xăng', 'xang', 'ron 95', 'ron 92', 'e5', 'mogas']
    },
    {
      id: 'src_fac_lpg',
      name: 'Khí dầu mỏ hóa lỏng LPG mua ngoài (Nhiệt & Bếp công nghiệp)',
      category: 'Đốt cháy cố định',
      type: 'Đốt cháy cố định',
      ef: 'Khí dầu mỏ hóa lỏng (LPG)',
      efFactor: getMasterFuelFactor('lpg', '2.983'),
      efUnit: 'kgCO2e/kg',
      unit: 'kg',
      measure: 'weight',
      isFacility: 'true',
      scope: 1,
      keywords: ['lpg', 'gas', 'khí dầu mỏ', 'khi hoa long']
    },
    {
      id: 'src_fac_coal',
      name: 'Than đá / Nhiên liệu rắn mua ngoài (Lò hơi)',
      category: 'Đốt cháy cố định',
      type: 'Đốt cháy cố định',
      ef: 'Than antraxit',
      efFactor: getMasterFuelFactor('coal_anthracite', '2.625'),
      efUnit: 'kgCO2e/kg',
      unit: 'kg',
      measure: 'weight',
      isFacility: 'true',
      scope: 1,
      keywords: ['than', 'than đá', 'than antraxit', 'coal']
    },
    {
      id: 'src_fac_biomass',
      name: 'Nhiên liệu sinh khối mua ngoài (Củi / Mùn cưa / Trấu / Viên nén)',
      category: 'Đốt cháy cố định',
      type: 'Đốt cháy cố định',
      ef: 'Củi / Dăm gỗ / Mùn cưa',
      efFactor: '0.0380',
      efUnit: 'kgCO2e/kg',
      unit: 'kg',
      measure: 'weight',
      isFacility: 'true',
      biomass: 'Có',
      scope: 1,
      keywords: ['củi', 'cui', 'dăm gỗ', 'dam go', 'mùn cưa', 'mun cua', 'trấu', 'trau', 'bã mía', 'ba mia', 'viên nén', 'biomass', 'sinh khối']
    },
    {
      id: 'src_fac_refrigerant',
      name: 'Môi chất lạnh nạp bổ sung (R-410A / R-32 - Bảo trì)',
      category: 'Phát thải thất thoát',
      type: 'Phát thải thất thoát',
      ef: 'R-410A',
      refrigerant: 'R-410A',
      efFactor: '2088.0',
      efUnit: 'kgCO2e/kg',
      unit: 'kg',
      measure: 'refrigerant',
      isFacility: 'true',
      scope: 1,
      keywords: ['r-410a', 'r410a', 'r-32', 'r32', 'r-134a', 'r134a', 'gas lạnh', 'môi chất lạnh']
    }
  ];

  // Hạng mục mặc định khi không nhận diện được hóa đơn năng lượng
  const UNMATCHED_FACILITY_SOURCE = {
    id: 'src_fac_unmatched',
    name: 'Chưa xác định / Cần phân loại thủ công',
    category: 'Chưa phân loại',
    type: 'Chưa phân loại',
    ef: 'Chưa xác định',
    efFactor: '0',
    efUnit: 'kgCO2e/đơn vị',
    unit: '',
    measure: 'other',
    isFacility: 'false',
    scope: 0,
    unmatched: true
  };

  function matchFacilitySource(text) {
    if (!text) return UNMATCHED_FACILITY_SOURCE;
    const s = text.toLowerCase();
    for (const src of FACILITY_ENERGY_SOURCES) {
      if (src.keywords.some(k => s.includes(k))) {
        return src;
      }
    }
    // Fallback based on specific units ONLY if context suggests energy/electricity
    if (s.includes('kwh')) return FACILITY_ENERGY_SOURCES[1];
    if (/\b(lít|lit)\b/.test(s) && (s.includes('dầu') || s.includes('xăng') || s.includes('nhiên liệu'))) {
      if (s.includes('xăng') || s.includes('ron')) return FACILITY_ENERGY_SOURCES[2];
      return FACILITY_ENERGY_SOURCES[0];
    }
    // Tuyệt đối không tự tiện fallback về Dầu Diesel khi không khớp từ khóa
    return UNMATCHED_FACILITY_SOURCE;
  }

  function normalizeQuantity(valStr) {
    if (valStr === undefined || valStr === null || valStr === '') return 0;
    let s = valStr.toString().trim().replace(/\s/g, '');
    if (!s) return 0;

    // Xử lý khi có cả dấu chấm và dấu phẩy (vd: 5.000,00 hoặc 5,000.00)
    if (s.includes('.') && s.includes(',')) {
      if (s.lastIndexOf(',') > s.lastIndexOf('.')) {
        // Kiểu VN / EU: 5.000,50 -> 5000.50
        s = s.replace(/\./g, '').replace(',', '.');
      } else {
        // Kiểu US / UK: 5,000.50 -> 5000.50
        s = s.replace(/,/g, '');
      }
    } else if (s.includes(',')) {
      const commaCount = (s.match(/,/g) || []).length;
      if (commaCount > 1) {
        // Nhiều dấu phẩy: chắc chắn phân cách hàng nghìn (vd: 1,000,000)
        s = s.replace(/,/g, '');
      } else {
        const parts = s.split(',');
        // Nếu có đúng 3 chữ số đằng sau và phần trước từ 1-3 chữ số (vd: 1,000 hoặc 5,200)
        if (parts[1].length === 3 && parts[0].length >= 1 && parts[0].length <= 3) {
          s = s.replace(',', '');
        } else {
          // Dấu thập phân kiểu VN (vd: 12,5 hoặc 1,5 hoặc 12,75)
          s = s.replace(',', '.');
        }
      }
    } else if (s.includes('.')) {
      const dotCount = (s.match(/\./g) || []).length;
      if (dotCount > 1) {
        // Nhiều dấu chấm: phân cách hàng nghìn kiểu VN (vd: 1.000.000)
        s = s.replace(/\./g, '');
      } else {
        const parts = s.split('.');
        // Nếu có đúng 3 chữ số và phần trước 1-3 chữ số (vd: 5.000)
        if (parts[1].length === 3 && parts[0].length >= 1 && parts[0].length <= 3) {
          s = s.replace('.', '');
        }
      }
    }
    const n = parseFloat(s);
    return Number.isFinite(n) ? n : 0;
  }

  function formatDateIso(dateStr) {
    if (!dateStr) return '';
    const s = dateStr.trim();
    // YYYY-MM-DD
    const isoMatch = s.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
    if (isoMatch) {
      const y = isoMatch[1];
      const m = isoMatch[2].padStart(2, '0');
      const d = isoMatch[3].padStart(2, '0');
      return `${y}-${m}-${d}`;
    }
    // DD/MM/YYYY
    const vnMatch = s.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
    if (vnMatch) {
      const d = vnMatch[1].padStart(2, '0');
      const m = vnMatch[2].padStart(2, '0');
      const y = vnMatch[3];
      return `${y}-${m}-${d}`;
    }
    return '';
  }

  /**
   * Parse XML hóa đơn điện tử (TT78 / NĐ123)
   */
  function parseInvoiceXML(xmlContent) {
    try {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlContent, 'text/xml');
      const parseError = xmlDoc.querySelector('parsererror');
      if (parseError) {
        return { success: false, error: 'File XML không đúng định dạng: ' + parseError.textContent };
      }

      // 1. Số hóa đơn
      let invoiceNo = '';
      const shdEl = xmlDoc.querySelector('SHDon') || xmlDoc.querySelector('invNum') || xmlDoc.querySelector('InvoiceNumber') || xmlDoc.querySelector('SoHoaDon');
      if (shdEl) invoiceNo = shdEl.textContent.trim();

      // Ký hiệu hóa đơn
      let serialNo = '';
      const khEl = xmlDoc.querySelector('KHHDon') || xmlDoc.querySelector('invSeries') || xmlDoc.querySelector('InvoiceSeries');
      if (khEl) serialNo = khEl.textContent.trim();

      // 2. Ngày lập
      let invoiceDate = '';
      const nlapEl = xmlDoc.querySelector('NLap') || xmlDoc.querySelector('invDate') || xmlDoc.querySelector('InvoiceDate') || xmlDoc.querySelector('NgayLap');
      if (nlapEl) {
        invoiceDate = formatDateIso(nlapEl.textContent);
      }

      // 3. Tên người bán
      let sellerName = '';
      const nbanEl = xmlDoc.querySelector('NBan Ten') || xmlDoc.querySelector('Seller Name') || xmlDoc.querySelector('SellerName') || xmlDoc.querySelector('NBan > Ten');
      if (nbanEl) sellerName = nbanEl.textContent.trim();
      if (!sellerName) {
        const anySeller = xmlDoc.querySelector('TenNBan') || xmlDoc.querySelector('sellerName');
        if (anySeller) sellerName = anySeller.textContent.trim();
      }

      // 4. Danh sách hàng hóa / dịch vụ
      const items = [];
      const itemNodes = xmlDoc.querySelectorAll('HHDVu, Item, Product, ChiTietHoaDon, Detail');

      if (itemNodes.length > 0) {
        itemNodes.forEach(node => {
          const nameEl = node.querySelector('THHDichVu') || node.querySelector('ItemName') || node.querySelector('TenHang') || node.querySelector('Name');
          const unitEl = node.querySelector('DVTinh') || node.querySelector('Unit') || node.querySelector('DonViTinh');
          const qtyEl = node.querySelector('SLuong') || node.querySelector('Quantity') || node.querySelector('SoLuong');
          const amtEl = node.querySelector('ThTien') || node.querySelector('Amount') || node.querySelector('ThanhTien');

          const name = nameEl ? nameEl.textContent.trim() : '';
          const unit = unitEl ? unitEl.textContent.trim() : '';
          const quantity = qtyEl ? normalizeQuantity(qtyEl.textContent) : 0;
          const amount = amtEl ? normalizeQuantity(amtEl.textContent) : 0;

          if (name || quantity > 0) {
            const matchedSrc = matchFacilitySource(name + ' ' + unit);
            items.push({
              name,
              unit: matchedSrc.unit || unit,
              quantity,
              amount,
              sourceId: matchedSrc.id,
              sourceName: matchedSrc.name,
              ef: matchedSrc.ef,
              efFactor: matchedSrc.efFactor,
              efUnit: matchedSrc.efUnit,
              unmatched: !!matchedSrc.unmatched
            });
          }
        });
      }

      // Nếu không có node danh sách, tìm thẻ tổng quát
      if (items.length === 0) {
        const generalQty = xmlDoc.querySelector('SLuong, Quantity, SoLuong');
        const generalUnit = xmlDoc.querySelector('DVTinh, Unit, DonViTinh');
        const generalName = xmlDoc.querySelector('THHDichVu, ItemName, TenHang');

        const name = generalName ? generalName.textContent.trim() : (sellerName || 'Nhiên liệu / Điện năng');
        const unit = generalUnit ? generalUnit.textContent.trim() : '';
        const quantity = generalQty ? normalizeQuantity(generalQty.textContent) : 0;
        const matchedSrc = matchFacilitySource(name + ' ' + unit);

        items.push({
          name,
          unit: matchedSrc.unit || unit,
          quantity,
          amount: 0,
          sourceId: matchedSrc.id,
          sourceName: matchedSrc.name,
          ef: matchedSrc.ef,
          efFactor: matchedSrc.efFactor,
          efUnit: matchedSrc.efUnit,
          unmatched: !!matchedSrc.unmatched
        });
      }

      // Tổng tiền thanh toán
      let totalAmountVnd = 0;
      const ttEl = xmlDoc.querySelector('TgTTMSOThue') || xmlDoc.querySelector('TotalAmount') || xmlDoc.querySelector('TongTienThanhToan');
      if (ttEl) totalAmountVnd = normalizeQuantity(ttEl.textContent);

      const primary = items[0] || {};
      const fullDocName = (sellerName ? sellerName + ' - ' : '') + 
                          (serialNo ? serialNo + '/' : '') + 
                          (invoiceNo ? 'HĐ ' + invoiceNo : 'Hóa đơn');

      return {
        success: true,
        invoiceNo,
        serialNo,
        sellerName,
        invoiceDate: invoiceDate || new Date().toISOString().split('T')[0],
        documentName: fullDocName,
        items,
        primaryItem: primary,
        totalAmountVnd
      };
    } catch (e) {
      return { success: false, error: 'Lỗi bóc tách XML: ' + e.message };
    }
  }

  /**
   * Bóc tách thông tin từ text hoặc tên file (dành cho PDF / Ảnh)
   */
  function parseInvoiceText(text, fileName) {
    const combined = (text || '') + ' ' + (fileName || '');
    const matchedSrc = matchFacilitySource(combined);

    // Tìm số lượng: 5000 L, 5,000 lít, 80000 kWh...
    let quantity = 0;
    const qtyRegex = /(\d+[\d.,]*)\s*(lít|lit|l\b|kwh|kw\b|kg\b|m3)/i;
    const qMatch = combined.match(qtyRegex);
    if (qMatch) {
      quantity = normalizeQuantity(qMatch[1]);
    }

    // Tìm số hóa đơn: HD 001234, số 123456...
    let invoiceNo = '';
    const noRegex = /(?:hđ|hd|hóa đơn|hoa don|số|so)[\s#:_-]*(\d{4,8})/i;
    const nMatch = combined.match(noRegex);
    if (nMatch) {
      invoiceNo = nMatch[1];
    }

    // Tìm ngày tháng
    let invoiceDate = '';
    const dateMatch = combined.match(/(\d{1,2})[-/](\d{1,2})[-/](20\d{2})/) || combined.match(/(20\d{2})[-/](\d{1,2})[-/](\d{1,2})/);
    if (dateMatch) {
      invoiceDate = formatDateIso(dateMatch[0]);
    }

    // Tên đơn vị bán
    let seller = '';
    if (combined.toLowerCase().includes('petrolimex')) seller = 'Petrolimex';
    else if (combined.toLowerCase().includes('evn') || combined.toLowerCase().includes('điện lực')) seller = 'EVN';

    const docName = (seller ? seller + ' - ' : '') + (invoiceNo ? 'HĐ ' + invoiceNo : (fileName || 'Hóa đơn'));

    const itemObj = {
      name: matchedSrc.name,
      unit: matchedSrc.unit,
      quantity: quantity || 0,
      sourceId: matchedSrc.id,
      sourceName: matchedSrc.name,
      ef: matchedSrc.ef,
      efFactor: matchedSrc.efFactor,
      efUnit: matchedSrc.efUnit,
      unmatched: !!matchedSrc.unmatched
    };

    return {
      success: true,
      invoiceNo,
      sellerName: seller,
      invoiceDate: invoiceDate || new Date().toISOString().split('T')[0],
      documentName: docName,
      items: [itemObj],
      primaryItem: itemObj
    };
  }

  // Xuất API toàn cục
  window.InvoiceParser = {
    FACILITY_ENERGY_SOURCES,
    matchFacilitySource,
    parseInvoiceXML,
    parseInvoiceText,
    normalizeQuantity
  };

})(window);
