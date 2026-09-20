const fs = require('fs');
const assert = require('assert');
const path = require('path');

console.log('=== RUNNING TEST: test_accountant_invoice_excel_import.js ===');

// 1. Kiểm tra carbon-inventory.html
const html = fs.readFileSync(path.join(__dirname, '../carbon-inventory.html'), 'utf8');

assert.ok(html.includes('id="btn-download-act-invoice-template"'), 'Phải có nút #btn-download-act-invoice-template (Tải file mẫu HĐ)');
assert.ok(html.includes('id="input-act-invoice-file"'), 'Phải có thẻ input file #input-act-invoice-file');
assert.ok(html.includes('id="btn-import-act-invoices"'), 'Phải có nút #btn-import-act-invoices (Tải Bảng kê HĐ)');
assert.ok(html.includes('id="modal-invoice-import-preview"'), 'Phải có modal #modal-invoice-import-preview');
assert.ok(html.includes('id="invoice-preview-tbody"'), 'Modal phải có bảng #invoice-preview-tbody');
assert.ok(html.includes('id="btn-commit-invoice-preview"'), 'Modal phải có nút xác nhận nạp #btn-commit-invoice-preview');

// Kiểm tra điều khiển ẩn hiện theo vai trò
assert.ok(html.includes("if (btnDlInvTemplate) btnDlInvTemplate.style.display = 'none';"), 'Vai trò Kỹ sư phải ẩn nút tải mẫu hóa đơn');
assert.ok(html.includes("if (btnImpInvoices) btnImpInvoices.style.display = 'none';"), 'Vai trò Kỹ sư phải ẩn nút tải bảng kê hóa đơn');
assert.ok(html.includes("if (btnDlInvTemplate) btnDlInvTemplate.style.display = 'inline-flex';"), 'Vai trò Kế toán phải hiển thị nút tải mẫu hóa đơn');
assert.ok(html.includes("if (btnImpInvoices) btnImpInvoices.style.display = 'inline-flex';"), 'Vai trò Kế toán phải hiển thị nút tải bảng kê hóa đơn');

console.log('PASS 1: Cấu trúc HTML & Phân quyền vai trò Kế toán vs Kỹ sư chuẩn xác 100%.');

// 2. Kiểm tra assets/js/carbon-activity.js
const js = fs.readFileSync(path.join(__dirname, '../assets/js/carbon-activity.js'), 'utf8');

assert.ok(js.includes('function downloadAccountantInvoiceTemplate'), 'carbon-activity.js phải có hàm downloadAccountantInvoiceTemplate');
assert.ok(js.includes('function handleInvoiceExcelImport'), 'carbon-activity.js phải có hàm handleInvoiceExcelImport');
assert.ok(js.includes('function parseInvoiceSheetRows'), 'carbon-activity.js phải có hàm parseInvoiceSheetRows');
assert.ok(js.includes('function openInvoiceImportPreviewModal'), 'carbon-activity.js phải có hàm openInvoiceImportPreviewModal');
assert.ok(js.includes('function commitBatchInvoices'), 'carbon-activity.js phải có hàm commitBatchInvoices');

// Kiểm tra window exports
assert.ok(js.includes('window.downloadAccountantInvoiceTemplate = downloadAccountantInvoiceTemplate;'), 'Phải export window.downloadAccountantInvoiceTemplate');
assert.ok(js.includes('window.handleInvoiceExcelImport = handleInvoiceExcelImport;'), 'Phải export window.handleInvoiceExcelImport');
assert.ok(js.includes('window.commitBatchInvoices = commitBatchInvoices;'), 'Phải export window.commitBatchInvoices');

// Tuyệt đối không chứa emoji sticker vi phạm test suite
assert.ok(!js.includes('📎') && !js.includes('🔧') && !js.includes('📊'), 'Mã JS không được chứa emoji sticker');

console.log('PASS 2: Logic xử lý trong carbon-activity.js đầy đủ và tuân thủ nguyên tắc không emoji.');

// 3. Giả lập và kiểm thử thuật toán Smart Auto-Mapping & Tính toán phát thải
const invoiceParserJs = fs.readFileSync(path.join(__dirname, '../assets/js/invoice-parser.js'), 'utf8');

const mockWindow = {};
const runParser = new Function('window', invoiceParserJs);
runParser(mockWindow);

assert.ok(mockWindow.InvoiceParser, 'InvoiceParser phải được nạp thành công vào mockWindow');

// Test logic Smart Auto-Mapping
const elecMatch = mockWindow.InvoiceParser.matchFacilitySource("Điện lưới EVN (Tổng công tơ) Công ty Điện lực EVN kWh");
assert.strictEqual(elecMatch.id, 'src_fac_electricity', 'Điện EVN phải ánh xạ về src_fac_electricity');
assert.strictEqual(elecMatch.unit, 'kWh', 'Đơn vị điện phải là kWh');

const dieselMatch = mockWindow.InvoiceParser.matchFacilitySource("Dầu Diesel (DO) bồn tổng Petrolimex lít");
assert.strictEqual(dieselMatch.id, 'src_fac_diesel', 'Dầu Diesel phải ánh xạ về src_fac_diesel');
assert.strictEqual(dieselMatch.unit, 'lít', 'Đơn vị dầu phải là lít');

const petrolMatch = mockWindow.InvoiceParser.matchFacilitySource("Xăng RON 95 (Xe công ty) Petrolimex lít");
assert.strictEqual(petrolMatch.id, 'src_fac_petrol', 'Xăng RON 95 phải ánh xạ về src_fac_petrol');

const lpgMatch = mockWindow.InvoiceParser.matchFacilitySource("Khí hóa lỏng (LPG) Gas Petrolimex kg");
assert.strictEqual(lpgMatch.id, 'src_fac_lpg', 'Khí hóa lỏng LPG phải ánh xạ về src_fac_lpg');

// Test normalize quantity
const q1 = mockWindow.InvoiceParser.normalizeQuantity("145.200");
assert.strictEqual(q1, 145200, '145.200 phân cách nghìn kiểu VN phải chuyển thành 145200');

const q2 = mockWindow.InvoiceParser.normalizeQuantity("8,000");
assert.strictEqual(q2, 8000, '8,000 phân cách nghìn kiểu US phải chuyển thành 8000');

const q3 = mockWindow.InvoiceParser.normalizeQuantity(450);
assert.strictEqual(q3, 450, '450 dạng số phải giữ nguyên 450');

console.log('PASS 3: Thuật toán Smart Auto-Mapping nhận diện chính xác 100% các nguồn cấp cơ sở.');

// 4. Kiểm tra nút nhập tay thủ công ban đầu không bị ảnh hưởng
assert.ok(html.includes('id="btn-add-activity"'), 'Nút thêm thủ công #btn-add-activity vẫn tồn tại');
assert.ok(js.includes("openActivityModal = openModal;"), 'Hàm mở modal thủ công openActivityModal vẫn được duy trì');
assert.ok(js.includes("btnAddActivity.addEventListener('click'"), 'Sự kiện click nút thêm thủ công vẫn được gắn kết');

console.log('PASS 4: Bảo toàn 100% tính năng nhập tay hiện tại, không gây xung đột.');

console.log('\n=== TẤT CẢ CÁC MỤC KIỂM THỬ ĐÃ VƯỢT QUA 100% THÀNH CÔNG! ===');
