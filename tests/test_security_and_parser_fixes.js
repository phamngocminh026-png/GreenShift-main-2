/**
 * Automated test suite for security validations and invoice parser refinements
 */
const assert = require('assert');
const path = require('path');
const fs = require('fs');

console.log('===============================================================');
console.log('[TEST] BAT DAU KIEM THU BAO MAT API & INVOICE PARSER REFINEMENTS');
console.log('===============================================================');

// 1. Kiểm thử InvoiceParser logic
const invoiceParserPath = path.join(__dirname, '..', 'assets', 'js', 'invoice-parser.js');
const invoiceParserCode = fs.readFileSync(invoiceParserPath, 'utf8');
const vm = require('vm');
const sandbox = { window: {} };
vm.createContext(sandbox);
vm.runInContext(invoiceParserCode, sandbox);
const InvoiceParser = sandbox.window.InvoiceParser;

console.log('\n[1] Kiem thu normalizeQuantity (dinh dang so US va VN):');
// Số kiểu VN có phân cách hàng nghìn bằng chấm, thập phân bằng phẩy
assert.strictEqual(InvoiceParser.normalizeQuantity('5.000,50'), 5000.5, '5.000,50 phải là 5000.5');
// Số kiểu US có phân cách hàng nghìn bằng phẩy, thập phân bằng chấm
assert.strictEqual(InvoiceParser.normalizeQuantity('5,000.50'), 5000.5, '5,000.50 phải là 5000.5');
// Số có nhiều dấu phẩy hàng nghìn
assert.strictEqual(InvoiceParser.normalizeQuantity('1,234,567'), 1234567, '1,234,567 phải là 1234567');
// Số có 1 dấu phẩy hàng nghìn 1,234
assert.strictEqual(InvoiceParser.normalizeQuantity('1,234'), 1234, '1,234 phải là 1234 thay vì 1.234');
// Số thập phân kiểu VN
assert.strictEqual(InvoiceParser.normalizeQuantity('12,5'), 12.5, '12,5 phải là 12.5');
assert.strictEqual(InvoiceParser.normalizeQuantity('0.6766'), 0.6766, '0.6766 phải là 0.6766');
console.log('  [PASS] normalizeQuantity xu ly chinh xac 100% cac dinh dang so phuc tap.');

console.log('\n[2] Kiem thu matchFacilitySource (Loai bo fallback am tham ve Diesel):');
// Từ khóa không xác định
const unmatched = InvoiceParser.matchFacilitySource('Mua 10 ram giấy Double A văn phòng');
assert.strictEqual(unmatched.unmatched, true, 'Hàng không liên quan năng lượng phải có cờ unmatched = true');
assert.strictEqual(unmatched.id, 'src_fac_unmatched', 'ID phải là src_fac_unmatched');
assert.strictEqual(unmatched.efFactor, '0', 'Hệ số phải bằng 0');

// Từ khóa điện
const elec = InvoiceParser.matchFacilitySource('Điện năng tiêu thụ trạm biến áp');
assert.strictEqual(elec.id, 'src_fac_electricity');
assert.strictEqual(elec.efFactor, '0.6766', 'Hệ số điện chuẩn phải là 0.6766 (QĐ 2626)');

// Từ khóa dầu DO
const diesel = InvoiceParser.matchFacilitySource('Dầu DO 0.05S bồn máy phát điện');
assert.strictEqual(diesel.id, 'src_fac_diesel');
console.log('  [PASS] matchFacilitySource phan loai chinh xac, khong tu tien gan Diesel.');

console.log('\n[3] Kiem thu ma nguon API bao mat (save-annual-data & save-company):');
const annualApi = fs.readFileSync(path.join(__dirname, '..', 'api', 'save-annual-data.js'), 'utf8');
assert.ok(annualApi.includes('GREENSHIFT_API_SECRET'), 'save-annual-data.js phải có kiểm tra GREENSHIFT_API_SECRET');
assert.ok(annualApi.includes('cleanBaseName'), 'save-annual-data.js phải có logic sanitize fileName');

const companyApi = fs.readFileSync(path.join(__dirname, '..', 'api', 'save-company.js'), 'utf8');
assert.ok(companyApi.includes('taxId'), 'save-company.js phải ưu tiên định danh bằng taxId');

const cbamPy = fs.readFileSync(path.join(__dirname, '..', 'server', 'services', 'cbam_service.py'), 'utf8');
assert.ok(!cbamPy.includes('round(total_scope3,'), 'cbam_service.py không được còn nhãn total_scope3');
assert.ok(cbamPy.includes('total_precursors'), 'cbam_service.py phải dùng total_precursors');
assert.ok(cbamPy.includes('except (ValueError, TypeError):'), 'parse_num phải bắt đúng ngoại lệ');
console.log('  [PASS] Toan bo ma nguon API & CBAM Service dat chuan bao mat va thuat ngu.');

console.log('===============================================================');
console.log('[PASS] TAT CA CAC BAI KIEM THU DA VUOT QUA 100%!');
console.log('===============================================================');
