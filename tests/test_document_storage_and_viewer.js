/**
 * GREENSHIFT DOCUMENT STORAGE & PROOF VIEWER TEST SUITE
 * Kiem thu toan dien co che luu tru tep chung tu vat ly (PDF, XML, Anh)
 * va giao dien xem / tai chung tu phat thai.
 * Tuan thu quy tac: ZERO EMOJIS.
 */

const assert = require('assert');
const path = require('path');
const fs = require('fs');

console.log('===============================================================');
console.log('KIEM THU: LUU TRU TEP CHUNG TU VAT LY VA PROOF VIEWER ENGINE');
console.log('===============================================================');

// Mock browser environment
const localStorageMock = (function() {
  let store = {};
  return {
    getItem(key) { return store[key] || null; },
    setItem(key, value) { store[key] = String(value); },
    removeItem(key) { delete store[key]; },
    clear() { store = {}; }
  };
})();

global.window = global;
global.localStorage = localStorageMock;

// 1. Kiem tra tep document-storage.js
console.log('\n[TEST 1] Kiem tra tep va module document-storage.js:');
const docStoragePath = path.join(__dirname, '..', 'assets', 'js', 'document-storage.js');
assert.ok(fs.existsSync(docStoragePath), 'Tep assets/js/document-storage.js phai ton tai');

require(docStoragePath);
assert.ok(window.DocumentStorage, 'window.DocumentStorage phai duoc dang ky toan cuc');
assert.strictEqual(typeof window.DocumentStorage.saveDocument, 'function', 'saveDocument phai la function');
assert.strictEqual(typeof window.DocumentStorage.getDocument, 'function', 'getDocument phai la function');
assert.strictEqual(typeof window.DocumentStorage.openViewer, 'function', 'openViewer phai la function');
assert.strictEqual(typeof window.DocumentStorage.closeViewer, 'function', 'closeViewer phai la function');
console.log('  [PASS] Module DocumentStorage duoc nap va dinh nghia day du phuong thuc');

// 2. Kiem tra saveDocument va getDocument voi Fallback LocalStorage
console.log('\n[TEST 2] Kiem tra saveDocument va getDocument voi fallback:');
(async () => {
  const mockFile = {
    name: 'hoadon_dien_t1_2026.pdf',
    type: 'application/pdf',
    size: 245000
  };

  const savedRecord = await window.DocumentStorage.saveDocument(mockFile);
  assert.ok(savedRecord, 'Ket qua luu tru phai ton tai');
  assert.ok(savedRecord.docId && savedRecord.docId.startsWith('doc_'), 'docId phai co tien to doc_');
  assert.strictEqual(savedRecord.fileName, 'hoadon_dien_t1_2026.pdf', 'fileName phai khop');
  assert.strictEqual(savedRecord.fileType, 'application/pdf', 'fileType phai la application/pdf');
  assert.strictEqual(savedRecord.fileSize, 245000, 'fileSize phai khop');

  const retrieved = await window.DocumentStorage.getDocument(savedRecord.docId);
  assert.ok(retrieved, 'Phai tim thay chung tu vua luu theo docId');
  assert.strictEqual(retrieved.fileName, 'hoadon_dien_t1_2026.pdf', 'Tep doc lai phai co fileName chinh xac');
  console.log('  [PASS] saveDocument va getDocument hoat dong chinh xac, luu giu dung docId va metadata');

  // 3. Kiem tra openViewer voi cac dinh dang khac nhau
  console.log('\n[TEST 3] Kiem tra giao dien Proof Viewer voi cac dinh dang:');
  
  // Mock DOM elements
  const mockDom = {
    elements: {},
    getElementById(id) {
      if (!this.elements[id]) {
        this.elements[id] = {
          id,
          style: {},
          innerText: '',
          innerHTML: '',
          href: '',
          download: ''
        };
      }
      return this.elements[id];
    }
  };
  global.document = mockDom;

  // 3.1: Hinh anh
  await window.DocumentStorage.openViewer({
    fileName: 'phieu_can_thep.png',
    fileType: 'image/png',
    fileData: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
  });
  const bodyEl = mockDom.getElementById('proof-viewer-body');
  assert.ok(bodyEl.innerHTML.includes('<img'), 'Dinh dang anh phai tao the img trong viewer body');
  assert.ok(mockDom.getElementById('proof-viewer-info').innerText.includes('Hình ảnh'), 'Info phai ghi nhan Hinh anh');
  console.log('  [PASS] Proof Viewer render anh dung tieu chuan');

  // 3.2: PDF
  await window.DocumentStorage.openViewer({
    fileName: 'hoa_don_xang_dau.pdf',
    fileType: 'application/pdf',
    fileData: 'data:application/pdf;base64,JVBERi0xLjQK...'
  });
  assert.ok(bodyEl.innerHTML.includes('<iframe'), 'Dinh dang PDF phai tao the iframe trong viewer body');
  assert.ok(mockDom.getElementById('proof-viewer-info').innerText.includes('PDF'), 'Info phai ghi nhan PDF');
  console.log('  [PASS] Proof Viewer render PDF dung tieu chuan');

  // 3.3: XML
  await window.DocumentStorage.openViewer({
    fileName: 'hoa_don_dien_tu.xml',
    fileType: 'application/xml',
    fileData: 'data:application/xml;charset=utf-8,<HDon><DLHDon></DLHDon></HDon>'
  });
  assert.ok(bodyEl.innerHTML.includes('<pre'), 'Dinh dang XML phai tao khoi pre xem ma nguon');
  assert.ok(mockDom.getElementById('proof-viewer-info').innerText.includes('XML'), 'Info phai ghi nhan XML');
  console.log('  [PASS] Proof Viewer render XML hoa don dien tu dung tieu chuan');

  // 3.4: Ban ghi cu / Mock Record
  await window.DocumentStorage.openViewer({
    fileName: 'chung_tu_ke_toan_t2.pdf'
  });
  assert.ok(bodyEl.innerHTML.includes('Hồ sơ Chứng từ Điện tử Đã Xác thực'), 'Chung tu cu phai render Chung chi Kiem toan GreenShift');
  assert.ok(mockDom.getElementById('btn-download-proof').href.includes('data:'), 'Phai sinh link tai ve chung tu xac thuc');
  console.log('  [PASS] Proof Viewer tao chung chi xac thuc kiem toan dien tu cho ban ghi mock');

  // 4. Kiem tra tich hop carbon-inventory.html
  console.log('\n[TEST 4] Kiem tra carbon-inventory.html chua du Modal va Script:');
  const invHtml = fs.readFileSync(path.join(__dirname, '..', 'carbon-inventory.html'), 'utf8');
  assert.ok(invHtml.includes('assets/js/document-storage.js'), 'carbon-inventory.html phai include document-storage.js');
  assert.ok(invHtml.includes('id="proof-viewer-modal"'), 'carbon-inventory.html phai chua #proof-viewer-modal');
  assert.ok(invHtml.includes('id="proof-viewer-title"'), 'Modal phai chua #proof-viewer-title');
  assert.ok(invHtml.includes('id="proof-viewer-body"'), 'Modal phai chua #proof-viewer-body');
  assert.ok(invHtml.includes('id="btn-download-proof"'), 'Modal phai chua #btn-download-proof');
  console.log('  [PASS] carbon-inventory.html tich hop hoan hao modal va script');

  // 5. Kiem tra tich hop carbon-activity.js
  console.log('\n[TEST 5] Kiem tra carbon-activity.js ho tro DocumentStorage va nut bam xem chung tu:');
  const actJs = fs.readFileSync(path.join(__dirname, '..', 'assets', 'js', 'carbon-activity.js'), 'utf8');
  assert.ok(actJs.includes('DocumentStorage.saveDocument'), 'carbon-activity.js phai goi DocumentStorage.saveDocument');
  assert.ok(actJs.includes('DocumentStorage.openViewer'), 'carbon-activity.js phai goi DocumentStorage.openViewer');
  assert.ok(actJs.includes('btn-view-proof'), 'carbon-activity.js phai render nut .btn-view-proof o Cot 9');
  assert.ok(actJs.includes('docId') && actJs.includes('fileUrl') && actJs.includes('fileType'), 'carbon-activity.js phai luu tru docId, fileUrl, fileType vao dataset');
  console.log('  [PASS] carbon-activity.js luu tru tep vat ly va hien thi nut xem chung tu o Cot 9');

  // 6. Kiem tra CSDL greenshift_supabase.sql
  console.log('\n[TEST 6] Kiem tra SQL schema cho Storage Bucket:');
  const sqlContent = fs.readFileSync(path.join(__dirname, '..', 'data', 'reference', 'greenshift_supabase.sql'), 'utf8');
  assert.ok(sqlContent.includes("'invoice_documents'"), 'greenshift_supabase.sql phai khoi tao bucket invoice_documents');
  assert.ok(sqlContent.includes('storage.buckets'), 'greenshift_supabase.sql phai co lenh insert storage.buckets');
  assert.ok(sqlContent.includes('allow_public_read_invoice_documents'), 'greenshift_supabase.sql phai co RLS policy cho invoice_documents');
  console.log('  [PASS] greenshift_supabase.sql co bucket invoice_documents va chinh sach RLS storage');

  // 7. Kiem tra supabase-client.js
  console.log('\n[TEST 7] Kiem tra uploadDocument trong supabase-client.js:');
  const sbClientJs = fs.readFileSync(path.join(__dirname, '..', 'assets', 'js', 'supabase-client.js'), 'utf8');
  assert.ok(sbClientJs.includes('uploadDocument('), 'supabase-client.js phai dinh nghia phuong thuc uploadDocument');
  assert.ok(sbClientJs.includes("'invoice_documents'"), 'uploadDocument phai tai len bucket invoice_documents');
  console.log('  [PASS] supabase-client.js tich hop uploadDocument len Supabase Storage');

  console.log('\n===============================================================');
  console.log('TAT CA CAC KIEM THU CHO MUC 2 (LUU TRU TEP CHUNG TU VAT LY) DA QUA!');
  console.log('===============================================================');
})();
