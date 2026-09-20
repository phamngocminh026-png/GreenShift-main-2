/**
 * TEST SUITE: test_invoice_proof_attachment_and_date_handling.js
 * Kiem thu tinh nang dinh kem chung tu hoa don (Anh / PDF / Scan) 
 * trong modal doi soat bang ke hoa don ke toan va xu ly ngay thang linh hoat.
 * Zero Emojis rule strictly enforced.
 */

const fs = require('fs');
const assert = require('assert');
const path = require('path');

console.log('=== RUNNING TEST: test_invoice_proof_attachment_and_date_handling.js ===');

// 1. Kiem tra carbon-inventory.html co nut dinh kem hang loat va cot chung tu goc
const html = fs.readFileSync(path.join(__dirname, '../carbon-inventory.html'), 'utf8');

assert.ok(html.includes('id="btn-batch-upload-proofs"'), 'Phai co nut dinh kem hang loat #btn-batch-upload-proofs');
assert.ok(html.includes('id="inv-batch-proof-files"'), 'Phai co input file hang loat #inv-batch-proof-files');
assert.ok(html.includes('>Chứng từ gốc</th>'), 'Bang doi soat phai co cot Chứng từ gốc');

console.log('PASS 1: Giao dien modal co day du nut dinh kem hang loat va cot chung tu goc.');

// 2. Kiem tra carbon-activity.js ho tro renderInvoiceProofCell, bindProofCellEvents va luu vao DocumentStorage
const js = fs.readFileSync(path.join(__dirname, '../assets/js/carbon-activity.js'), 'utf8');

assert.ok(js.includes('function renderInvoiceProofCell'), 'carbon-activity.js phai co ham renderInvoiceProofCell');
assert.ok(js.includes('function bindProofCellEvents'), 'carbon-activity.js phai co ham bindProofCellEvents');
assert.ok(js.includes('inv-row-proof-input'), 'carbon-activity.js phai co input inv-row-proof-input cho tung dong');
assert.ok(js.includes('inv-batch-proof-files'), 'carbon-activity.js phai xu ly input inv-batch-proof-files');
assert.ok(js.includes('DocumentStorage.saveDocument(item.attachedFile)'), 'commitBatchInvoices phai luu attachedFile vao DocumentStorage');

// Kiem tra zero emojis
assert.ok(!js.includes('📎') && !js.includes('🔧') && !js.includes('📊'), 'Ma JS khong duoc chua emoji sticker');

console.log('PASS 2: carbon-activity.js co day du logic dinh kem chung tu va ket noi DocumentStorage.');

// 3. Kiem thu thuat toan normalizeSheetDate voi cac dinh dang thang/ngay khac nhau
// Trich xuat ham normalizeSheetDate de kiem thu logic
const mockSandbox = {};
const extractNormalizeDateCode = `
${js.slice(js.indexOf('function normalizeSheetDate'), js.indexOf('function parseInvoiceSheetRows'))}
mockSandbox.normalizeSheetDate = normalizeSheetDate;
`;

try {
  const runner = new Function('mockSandbox', extractNormalizeDateCode);
  runner(mockSandbox);

  const norm = mockSandbox.normalizeSheetDate;
  assert.strictEqual(norm('2026-02-15'), '2026-02-15', 'Chuan ISO giu nguyen');
  assert.strictEqual(norm('15/02/2026'), '2026-02-15', 'DD/MM/YYYY phai chuyen ve YYYY-MM-DD');
  assert.strictEqual(norm('20.03.2026'), '2026-03-20', 'DD.MM.YYYY phai chuyen ve YYYY-MM-DD');
  assert.strictEqual(norm('03/2026'), '2026-03-01', 'MM/YYYY phai chuyen ve YYYY-MM-01');
  assert.strictEqual(norm('Tháng 4/2026'), '2026-04-01', 'Thang M/YYYY phai chuyen ve YYYY-MM-01');
  assert.strictEqual(norm('T5/2026'), '2026-05-01', 'T M/YYYY phai chuyen ve YYYY-MM-01');
  assert.strictEqual(norm('2026-06'), '2026-06-01', 'YYYY-MM phai chuyen ve YYYY-MM-01');

  console.log('PASS 3: normalizeSheetDate xu ly chinh xac 100% cac kieu ngay thang, khong bi bo hep vao Thang 2.');
} catch (e) {
  console.error('Loi test normalizeSheetDate:', e);
  throw e;
}

console.log('\n=== TAT CA KIEM THU CHUNG TU VA NGAY THANG HOAN TAT XUAT SAC! ===');
