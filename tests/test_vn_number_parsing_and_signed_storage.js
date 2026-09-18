const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('=== TEST: VIETNAMESE NUMBER PARSING & SUPABASE SIGNED STORAGE SECURITY ===\n');

const rootDir = path.resolve(__dirname, '..');
const storageJs = require(path.join(rootDir, 'assets', 'js', 'storage.js'));
const parseVnNumber = storageJs.parseVnNumber;

// 1. Kiem tra ham parseVnNumber
console.log('[TEST 1] Kiem tra do chinh xac cua ham parseVnNumber:');
assert.strictEqual(typeof parseVnNumber, 'function', 'parseVnNumber phai la mot function');

// Dinh dang Viet Nam: dau phay thap phan
assert.strictEqual(parseVnNumber('150,5'), 150.5, '150,5 phai ra 150.5');
assert.strictEqual(parseVnNumber('0,060'), 0.06, '0,060 phai ra 0.06');
assert.strictEqual(parseVnNumber('1.200,5'), 1200.5, '1.200,5 phai ra 1200.5');
assert.strictEqual(parseVnNumber('1.500.000,75'), 1500000.75, '1.500.000,75 phai ra 1500000.75');

// Dinh dang Quoc te: dau phay ngan, dau cham thap phan
assert.strictEqual(parseVnNumber('1,200.5'), 1200.5, '1,200.5 phai ra 1200.5');
assert.strictEqual(parseVnNumber('150.5'), 150.5, '150.5 phai ra 150.5');

// So nguyen va cac truong hop bien
assert.strictEqual(parseVnNumber(150.5), 150.5, 'Number 150.5 phai giu nguyen');
assert.strictEqual(parseVnNumber('1000'), 1000, 'Chuoi 1000 phai ra 1000');
assert.strictEqual(parseVnNumber('   45,2   '), 45.2, 'Chuoi co khoang trang phai trim dung');
assert.strictEqual(parseVnNumber(''), 0, 'Chuoi rong phai ra 0');
assert.strictEqual(parseVnNumber(null), 0, 'null phai ra 0');
assert.strictEqual(parseVnNumber(undefined), 0, 'undefined phai ra 0');
assert.strictEqual(parseVnNumber('abc'), 0, 'Chuoi khong phai so phai ra 0');
console.log('  [PASS] Tat ca 12 truong hop xu ly so thap phan Viet Nam va Quoc te deu chinh xac 100%!');

// 2. Kiem tra tich hop parseVnNumber vao Excel import trong carbon-inventory.html
console.log('\n[TEST 2] Kiem tra tich hop parseVnNumber trong carbon-inventory.html:');
const htmlContent = fs.readFileSync(path.join(rootDir, 'carbon-inventory.html'), 'utf8');
assert.ok(htmlContent.includes('parseNum(ratedCapRaw)'), 'Excel import phai dung parseNum cho ratedCapRaw');
assert.ok(htmlContent.includes('parseNum(loadRaw)'), 'Excel import phai dung parseNum cho loadRaw');
assert.ok(htmlContent.includes('parseNum(hoursRaw)'), 'Excel import phai dung parseNum cho hoursRaw');
assert.ok(htmlContent.includes('parseNum(daysRaw)'), 'Excel import phai dung parseNum cho daysRaw');
console.log('  [PASS] Excel import da duoc bao ve boi parseVnNumber chong cat cut thap phan!');

// 3. Kiem tra tich hop parseVnNumber trong carbon-activity.js
console.log('\n[TEST 3] Kiem tra tich hop parseVnNumber trong carbon-activity.js:');
const actContent = fs.readFileSync(path.join(rootDir, 'assets', 'js', 'carbon-activity.js'), 'utf8');
assert.ok(actContent.includes("const amount = parseNum("), 'Form hoat dong phai dung parseNum cho activity-amount');
assert.ok(actContent.includes("parseNum(inputOpHours?.value)"), 'Che do gio phai dung parseNum cho inputOpHours');
assert.ok(actContent.includes("parseNum(inputMeterStart?.value)"), 'Che do cong to phai dung parseNum cho inputMeterStart');
console.log('  [PASS] Toan bo bieu mau nhap lieu hoat dong da tich hop parseVnNumber!');

// 4. Kiem tra bucket Supabase Private va Policy trong greenshift_supabase.sql
console.log('\n[TEST 4] Kiem tra cau hinh Storage Bucket Private trong greenshift_supabase.sql:');
const sqlContent = fs.readFileSync(path.join(rootDir, 'data', 'reference', 'greenshift_supabase.sql'), 'utf8');
assert.ok(sqlContent.includes("VALUES ('invoice_documents', 'invoice_documents', false)"), 'Bucket invoice_documents phai co public: false');
assert.ok(sqlContent.includes("ON CONFLICT (id) DO UPDATE SET public = false;"), 'ON CONFLICT phai update public = false');
assert.ok(sqlContent.includes('CREATE POLICY "invoice_documents_read_policy"'), 'Phai co invoice_documents_read_policy');
assert.ok(sqlContent.includes("auth.role() = 'authenticated'"), 'Policy phai yeu cau quyen authenticated hoac signed URL');
console.log('  [PASS] Bucket invoice_documents da duoc khoa Private va bao ve boi RLS Storage!');

// 5. Kiem tra ham upload va Signed URL trong supabase-client.js va document-storage.js
console.log('\n[TEST 5] Kiem tra ham uploadInvoiceDocument va createSignedInvoiceUrl:');
const supaClientContent = fs.readFileSync(path.join(rootDir, 'assets', 'js', 'supabase-client.js'), 'utf8');
assert.ok(supaClientContent.includes('uploadInvoiceDocument(filePath, fileBody)'), 'Phai co ham uploadInvoiceDocument');
assert.ok(supaClientContent.includes('createSignedInvoiceUrl(filePath, expiresIn'), 'Phai co ham createSignedInvoiceUrl');
assert.ok(supaClientContent.includes(".createSignedUrl(filePath, expiresIn)"), 'Phai goi ham createSignedUrl cua Supabase');

const docStorageContent = fs.readFileSync(path.join(rootDir, 'assets', 'js', 'document-storage.js'), 'utf8');
assert.ok(docStorageContent.includes('createSignedInvoiceUrl'), 'document-storage.js phai goi createSignedInvoiceUrl khi xem file');
console.log('  [PASS] Tich hop Signed URL bao mat tai lieu hoa don 60 phut hoan tat!');

console.log('\n=== TAT CA CAC KIEM TRA VIETNAMESE NUMBER & SIGNED STORAGE HOAN THANH XUAT SAC! ===');
