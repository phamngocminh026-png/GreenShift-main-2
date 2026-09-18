const fs = require('fs');
const assert = require('assert');
const path = require('path');

// 1. Kiểm tra file invoice-parser.js tồn tại và không chứa emoji
const parserPath = path.join(__dirname, '..', 'assets', 'js', 'invoice-parser.js');
assert.ok(fs.existsSync(parserPath), 'File assets/js/invoice-parser.js phải tồn tại');
const parserCode = fs.readFileSync(parserPath, 'utf8');

const forbiddenEmojis = ['📎', '🔧', '📊', '👑', '➕', '⚙️', '🚀'];
forbiddenEmojis.forEach(emoji => {
  assert.ok(!parserCode.includes(emoji), `invoice-parser.js chứa emoji cấm: ${emoji}`);
});

// Giả lập window và DOMParser trong môi trường Node.js (hỗ trợ selector có dấu phẩy)
global.window = {};
global.DOMParser = class {
  parseFromString(xmlStr) {
    return {
      querySelector(selector) {
        const parts = selector.split(',').map(s => s.trim());
        for (const part of parts) {
          const tags = part.split(/[ >]+/);
          const lastTag = tags[tags.length - 1];
          const m = xmlStr.match(new RegExp(`<${lastTag}[^>]*>([\\s\\S]*?)<\\/${lastTag}>`, 'i'));
          if (m) return { textContent: m[1] };
        }
        return null;
      },
      querySelectorAll(selector) {
        const parts = selector.split(',').map(s => s.trim());
        const pattern = parts.map(p => `<${p}[^>]*>([\\s\\S]*?)<\\/${p}>`).join('|');
        const regex = new RegExp(pattern, 'gi');
        const matches = [...xmlStr.matchAll(regex)];
        return matches.map(m => {
          const innerXml = m.slice(1).find(x => x !== undefined) || '';
          return {
            querySelector(subTag) {
              const subParts = subTag.split(',').map(s => s.trim());
              for (const sp of subParts) {
                const sm = innerXml.match(new RegExp(`<${sp}[^>]*>([\\s\\S]*?)<\\/${sp}>`, 'i'));
                if (sm) return { textContent: sm[1] };
              }
              return null;
            }
          };
        });
      }
    };
  }
};

eval(parserCode);
const InvoiceParser = global.window.InvoiceParser;
assert.ok(InvoiceParser, 'InvoiceParser phải được gắn vào window');
assert.strictEqual(typeof InvoiceParser.parseInvoiceXML, 'function', 'Phải có hàm parseInvoiceXML');
assert.strictEqual(typeof InvoiceParser.parseInvoiceText, 'function', 'Phải có hàm parseInvoiceText');

// 2. Kiểm tra bóc tách XML Hóa đơn Điện tử Petrolimex (Chuẩn TT78)
const samplePetrolimexXml = `<?xml version="1.0" encoding="UTF-8"?>
<HDon>
  <TTChung>
    <KHMSHDon>1</KHMSHDon>
    <KHHDon>C26TAA</KHHDon>
    <SHDon>0012458</SHDon>
    <NLap>2026-01-15</NLap>
  </TTChung>
  <NDHDon>
    <NBan>
      <Ten>Tập đoàn Xăng dầu Việt Nam - Petrolimex</Ten>
      <MST>0100107624</MST>
    </NBan>
    <DSHHDVu>
      <HHDVu>
        <THHDichVu>Dầu Đi-ê-zen 0,05S-II (DO 0.05S-II)</THHDichVu>
        <DVTinh>lít</DVTinh>
        <SLuong>5000.00</SLuong>
        <DGia>19000.00</DGia>
        <ThTien>95000000.00</ThTien>
      </HHDVu>
    </DSHHDVu>
    <TToan>
      <TgTTMSOThue>104500000.00</TgTTMSOThue>
    </TToan>
  </NDHDon>
</HDon>`;

const parsedDiesel = InvoiceParser.parseInvoiceXML(samplePetrolimexXml);
assert.strictEqual(parsedDiesel.success, true, 'Bóc tách XML Petrolimex phải thành công');
assert.strictEqual(parsedDiesel.invoiceNo, '0012458', 'Số hóa đơn phải là 0012458');
assert.strictEqual(parsedDiesel.invoiceDate, '2026-01-15', 'Ngày hóa đơn phải là 2026-01-15');
assert.strictEqual(parsedDiesel.primaryItem.quantity, 5000, 'Số lượng dầu phải là 5000 lít');
assert.strictEqual(parsedDiesel.primaryItem.unit, 'lít', 'Đơn vị phải là lít');
assert.strictEqual(parsedDiesel.primaryItem.sourceId, 'src_fac_diesel', 'Phải tự động khớp vào nguồn Dầu Diesel cấp cơ sở');

// 3. Kiểm tra bóc tách XML Hóa đơn Điện lực EVN (Chuẩn TT78)
const sampleEvnXml = `<?xml version="1.0" encoding="UTF-8"?>
<HDon>
  <TTChung>
    <KHHDon>K26EVN</KHHDon>
    <SHDon>0089123</SHDon>
    <NLap>2026-01-31</NLap>
  </TTChung>
  <NDHDon>
    <NBan>
      <Ten>Tổng công ty Điện lực TP. Hà Nội - EVN HANOI</Ten>
    </NBan>
    <DSHHDVu>
      <HHDVu>
        <THHDichVu>Điện năng tiêu thụ kỳ 01/2026</THHDichVu>
        <DVTinh>kWh</DVTinh>
        <SLuong>80000.00</SLuong>
        <ThTien>160000000.00</ThTien>
      </HHDVu>
    </DSHHDVu>
  </NDHDon>
</HDon>`;

const parsedEvn = InvoiceParser.parseInvoiceXML(sampleEvnXml);
assert.strictEqual(parsedEvn.success, true, 'Bóc tách XML EVN phải thành công');
assert.strictEqual(parsedEvn.invoiceNo, '0089123', 'Số hóa đơn điện phải là 0089123');
assert.strictEqual(parsedEvn.primaryItem.quantity, 80000, 'Số lượng điện phải là 80000 kWh');
assert.strictEqual(parsedEvn.primaryItem.unit, 'kWh', 'Đơn vị điện phải là kWh');
assert.strictEqual(parsedEvn.primaryItem.sourceId, 'src_fac_electricity', 'Phải tự động khớp vào nguồn Điện lưới EVN mua ngoài');

// 4. Kiểm tra bóc tách từ tên file PDF hoặc text
const parsedPdf = InvoiceParser.parseInvoiceText('', 'HD_0045678_Petrolimex_Diesel_5000L.pdf');
assert.strictEqual(parsedPdf.success, true);
assert.strictEqual(parsedPdf.primaryItem.quantity, 5000);
assert.strictEqual(parsedPdf.primaryItem.sourceId, 'src_fac_diesel');

// 5. Kiểm tra mã nguồn carbon-activity.js đã tích hợp các hạng mục năng lượng cấp cơ sở
const actJs = fs.readFileSync(path.join(__dirname, '..', 'assets', 'js', 'carbon-activity.js'), 'utf8');
assert.ok(actJs.includes('src_fac_diesel'), 'carbon-activity.js phải chứa mã nguồn src_fac_diesel');
assert.ok(actJs.includes('src_fac_electricity'), 'carbon-activity.js phải chứa mã nguồn src_fac_electricity');
assert.ok(actJs.includes('invoice-parse-banner'), 'carbon-activity.js phải có mã xử lý invoice-parse-banner');

// 6. Kiểm tra carbon-inventory.html đã nạp file invoice-parser.js và có banner
const html = fs.readFileSync(path.join(__dirname, '..', 'carbon-inventory.html'), 'utf8');
assert.ok(html.includes('<script src="assets/js/invoice-parser.js"></script>'), 'carbon-inventory.html phải nạp script invoice-parser.js');
assert.ok(html.includes('id="invoice-parse-banner"'), 'carbon-inventory.html phải có id="invoice-parse-banner"');

console.log('Test test_smart_invoice_parser_and_reconciliation.js PASSED SUCCESSFULLY!');
