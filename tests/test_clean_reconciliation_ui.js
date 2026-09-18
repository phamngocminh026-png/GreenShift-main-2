const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('=== TEST: RECONCILIATION CARD SIMPLIFICATION & CLEANUP ===');

const html = fs.readFileSync(path.join(__dirname, '..', 'carbon-inventory.html'), 'utf8');
const js = fs.readFileSync(path.join(__dirname, '..', 'assets', 'js', 'carbon-activity.js'), 'utf8');

// 1. Check title is simplified to 'Đối soát'
const cardStart = html.indexOf('<div id="reconciliation-card"');
const cardEnd = html.indexOf('</table>', cardStart) + 8;
const cardHTML = html.substring(cardStart, cardEnd);

assert.ok(cardHTML.includes('<h3 style="margin: 0; font-size: 0.95rem; font-weight: 600; color: var(--color-text-primary);">\n                  Đối soát\n                </h3>') || cardHTML.includes('Đối soát\n                </h3>'), 'Title must be simply Đối soát');
console.log('PASS 1: Title is shortened to Đối soát.');

// 2. Check no Supabase in reconciliation card
assert.strictEqual(cardHTML.includes('Supabase'), false, 'Reconciliation card must not mention Supabase');
assert.strictEqual(cardHTML.includes('recon-global-badge'), false, 'recon-global-badge must be removed');
console.log('PASS 2: Supabase mentions and badge completely removed.');

// 3. Check period buttons are clean
assert.ok(cardHTML.includes('Theo Tháng\n                  </button>'), 'Period month button must say Theo Tháng');
assert.ok(cardHTML.includes('Cả Năm\n                  </button>'), 'Period year button must say Cả Năm');
console.log('PASS 3: Period buttons are cleanly named Theo Tháng and Cả Năm.');

// 4. Check table column headers are concise
assert.ok(cardHTML.includes('<th>Loại năng lượng</th>') || cardHTML.includes('<th style="padding: 0.5rem 0.6rem;">Loại năng lượng</th>'), 'Must have Loại năng lượng header');
assert.ok(cardHTML.includes('Hóa đơn Kế toán</th>'), 'Header must be Hóa đơn Kế toán without (Q_invoice)');
assert.ok(cardHTML.includes('Kỹ thuật Ước tính</th>'), 'Header must be Kỹ thuật Ước tính without (Q_equipment)');
assert.ok(cardHTML.includes('Chênh lệch</th>'), 'Header must be Chênh lệch without (Delta Q)');
assert.ok(cardHTML.includes('Trạng thái</th>'), 'Header must be Trạng thái without đối soát');
console.log('PASS 4: Column headers are concise without code jargon.');

// 5. Check JS generated categories and statuses
assert.ok(js.includes("'Điện năng (kWh)'"), 'JS must generate concise label Điện năng (kWh)');
assert.ok(js.includes("'Nhiên liệu đốt (lít / kg)'"), 'JS must generate concise label Nhiên liệu đốt');
assert.ok(js.includes("'Khớp'") && js.includes("'Lệch > 5%'") && js.includes("'Lệch > 10% (Cảnh báo)'"), 'JS must use clean 3-tier status tags Khớp / Lệch > 5% / Lệch > 10%');
console.log('PASS 5: JS row labels and statuses are clean and concise.');

console.log('\nALL RECONCILIATION CLEANUP CHECKS PASSED 100%!');
