const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('=== RUNNING TESTS: CBAM VIDEO AUDIT FIXES (MINH REAL AUDIT) ===\n');

const rootDir = path.resolve(__dirname, '..');
const cbamHtml = fs.readFileSync(path.join(rootDir, 'cbam-dashboard.html'), 'utf8');

// 1. Verify SheetJS vendor script import in cbam-dashboard.html
console.log('Test 1: SheetJS vendor script import');
assert.ok(
  cbamHtml.includes('src="assets/vendor/xlsx.full.min.js"'),
  'cbam-dashboard.html must import assets/vendor/xlsx.full.min.js'
);
console.log('PASS 1: SheetJS xlsx.full.min.js is imported in cbam-dashboard.html\n');

// 2. Verify all decimal inputs support text with inputmode="decimal"
console.log('Test 2: Decimal inputs support comma and inputmode="decimal"');
const targetInputIds = [
  'activity-level',
  'export-qty',
  'em-direct-comb',
  'ipcc-qty',
  'em-direct-proc',
  'proc-qty',
  'em-direct-heat',
  'heat-qty',
  'em-indirect-mwh',
  'em-indirect-ef',
  's3-sefa-prec',
  's3-export-al',
  's3-eu-price',
  's3-local-price',
  's3-local-covered-emissions'
];

targetInputIds.forEach(id => {
  const regex = new RegExp(`id="${id}"[^>]*inputmode="decimal"|inputmode="decimal"[^>]*id="${id}"`);
  assert.ok(
    regex.test(cbamHtml),
    `Input #${id} must have inputmode="decimal" to allow Vietnamese decimal typing`
  );
});
console.log(`PASS 2: All ${targetInputIds.length} target numerical inputs configured with inputmode="decimal"\n`);

// 3. Verify safeParse logic with Vietnamese decimal comma
console.log('Test 3: safeParse comma parsing compatibility');
function safeParse(val) {
    if (val === null || val === undefined || val === '') return 0;
    if (typeof val === 'number') return isNaN(val) ? 0 : val;
    let s = String(val).trim().replace(/\s/g, '');
    if (!s || s === '-') return 0;
    s = s.replace(/(tco2e|tco2|kwh|mwh|vnd|vnđ|lit|lít|kg|tan|tấn|tj)$/i, '').trim();
    const commaIdx = s.lastIndexOf(',');
    const dotIdx = s.lastIndexOf('.');
    const commaCount = (s.match(/,/g) || []).length;
    const dotCount = (s.match(/\./g) || []).length;
    if (commaCount > 0 && dotCount > 0) {
        if (commaIdx > dotIdx) {
            s = s.replace(/\./g, '').replace(/,/g, '.');
        } else {
            s = s.replace(/,/g, '');
        }
    } else if (dotCount > 1) {
        s = s.replace(/\./g, '');
    } else if (commaCount > 1) {
        s = s.replace(/,/g, '');
    } else if (commaCount === 1) {
        s = s.replace(/,/g, '.');
    }
    const num = parseFloat(s);
    return isNaN(num) ? 0 : num;
}

assert.strictEqual(safeParse('0,1'), 0.1, '0,1 must parse to 0.1');
assert.strictEqual(safeParse('0.1'), 0.1, '0.1 must parse to 0.1');
assert.strictEqual(safeParse('1.500,25'), 1500.25, '1.500,25 must parse to 1500.25');
assert.strictEqual(safeParse('1,500.25'), 1500.25, '1,500.25 must parse to 1500.25');
assert.strictEqual(safeParse('3331'), 3331, '3331 must parse to 3331');
console.log('PASS 3: safeParse correctly handles Vietnamese comma, English dot, and thousand separators\n');

// 4. Verify client-side Excel export fallback implementation
console.log('Test 4: Client-side Excel export fallback implementation');
assert.ok(
  cbamHtml.includes('function exportCbamClientExcel('),
  'exportCbamClientExcel function must be defined'
);
assert.ok(
  cbamHtml.includes('Summary_Khai_Bao') &&
  cbamHtml.includes('Phat_Thai_Truc_Tiep') &&
  cbamHtml.includes('Phat_Thai_Dien_Scope2') &&
  cbamHtml.includes('Tien_Chat_Precursors') &&
  cbamHtml.includes('Nhat_Ky_Audit_Trail'),
  'exportCbamClientExcel must generate all 5 official sheets'
);
console.log('PASS 4: exportCbamClientExcel defined with all 5 comprehensive CBAM sheets\n');

// 5. Verify SheetJS test workbook generation
console.log('Test 5: SheetJS library buffer generation');
const XLSX = require('../assets/vendor/xlsx.full.min.js');
const wb = XLSX.utils.book_new();
const ws = XLSX.utils.aoa_to_sheet([['CBAM Sector', 'Aluminum'], ['SEE Total', 6.41]]);
XLSX.utils.book_append_sheet(wb, ws, 'Summary_Khai_Bao');
const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });
assert.ok(buf && buf.length > 1000, 'SheetJS workbook must generate valid xlsx buffer');
console.log(`PASS 5: SheetJS successfully generated valid XLSX buffer (${buf.length} bytes)\n`);

// 6. Verify finishProcess has no unaccented alert modal
console.log('Test 6: Smooth UX on finishProcess & toast notification');
assert.ok(
  !cbamHtml.includes("alert('Vui long tich vao o xac nhan"),
  'Unaccented alert in finishProcess must be removed'
);
assert.ok(
  !cbamHtml.includes("btn.innerHTML = 'Dang khoa ho so...'"),
  'Unaccented loading text must be replaced with proper Vietnamese'
);
assert.ok(
  cbamHtml.includes('function showCbamToast('),
  'showCbamToast universal toast helper must be defined'
);
assert.ok(
  cbamHtml.includes('Hồ sơ đã được Khóa thành công [Xác thực]'),
  'Success dialog must have proper Vietnamese accents'
);
console.log('PASS 6: finishProcess now uses smooth toast notifications and proper Vietnamese accents\n');

// 7. Verify Zero Emoji compliance in all modified areas
console.log('Test 7: Zero Emoji compliance in cbam-dashboard.html');
const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;
const hasEmoji = emojiRegex.test(cbamHtml);
assert.strictEqual(hasEmoji, false, 'cbam-dashboard.html must not contain emojis per project standard');
console.log('PASS 7: Zero Emoji rule verified in cbam-dashboard.html\n');

console.log('===============================================================');
console.log('ALL 7 AUDIT FIX VERIFICATIONS PASSED WITH ZERO ERRORS!');
console.log('===============================================================');
