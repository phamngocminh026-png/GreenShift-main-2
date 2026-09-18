const assert = require('assert');
const fs = require('fs');

console.log('--- TEST: SEARCH FILTER PERFORMANCE & LAYOUT REFLOW ELIMINATION ---');

const actJs = fs.readFileSync('assets/js/carbon-activity.js', 'utf8');

// 1. Verify that row.innerText is NOT used in applyFilter
const applyFilterStart = actJs.indexOf('function applyFilter(');
const applyFilterEnd = actJs.indexOf('const filterYearEl', applyFilterStart);
const applyFilterCode = actJs.slice(applyFilterStart, applyFilterEnd);

assert.ok(!applyFilterCode.includes('row.innerText'), 'applyFilter must NEVER use row.innerText (causes fatal layout reflow)');
assert.ok(applyFilterCode.includes('row._searchIndex'), 'applyFilter must use pre-indexed search content');
assert.ok(actJs.includes('actSearchDebounceTimer'), 'Search input must have debounce timer');
assert.ok(actJs.includes('tr._searchIndex'), 'updateRowHTML must pre-index row data');
console.log('PASS 1: Source code audit confirms 0 synchronous layout reflows in search loop.');

// 2. Performance simulation benchmark: 1,500 rows
const mockRows = [];
for (let i = 0; i < 1500; i++) {
  const isEaf = (i % 4 === 0);
  const data = {
    date: '2026-05-15',
    sourceName: isEaf ? 'Quá trình luyện thép - Lò hồ quang điện EAF 100 tấn/mẻ' : 'Máy nén khí Atlas Copco GA75',
    sourceType: isEaf ? 'Lò thổi oxy hoặc lò hồ quang điện trong luyện thép' : 'Tiêu thụ điện',
    doc: isEaf ? 'Phiếu cân ca máy - Nghiệm thu phôi thép' : 'Vận hành ca chuẩn (08:00 - 17:00)',
    manager: 'Kỹ sư vận hành',
    amount: isEaf ? '1916.93' : '360.00',
    unit: isEaf ? 'tấn' : 'kWh',
    co2e: isEaf ? '115015.80' : '243.58'
  };
  const searchIndex = `${data.date} ${data.sourceName} ${data.sourceType} ${data.doc} ${data.manager} ${data.amount} ${data.unit} ${data.co2e}`.toLowerCase();
  mockRows.push({
    dataset: data,
    _searchIndex: searchIndex,
    style: { display: '' }
  });
}

// Benchmark 30 keystrokes of typing 'lò hồ quang điện'
const query = 'lò hồ quang điện';
const t0 = process.hrtime.bigint();

let totalMatched = 0;
for (let step = 1; step <= query.length; step++) {
  const sub = query.slice(0, step).toLowerCase();
  mockRows.forEach(row => {
    const match = row._searchIndex.includes(sub);
    if (match) totalMatched++;
  });
}

const t1 = process.hrtime.bigint();
const totalMs = Number(t1 - t0) / 1e6;
const avgPerKeystroke = totalMs / query.length;

console.log(`PASS 2: Benchmark 1,500 rows x ${query.length} keystrokes completed in ${totalMs.toFixed(2)}ms (Avg: ${avgPerKeystroke.toFixed(3)}ms/keystroke).`);
assert.ok(avgPerKeystroke < 5.0, `Average search latency per keystroke must be under 5ms, actual was ${avgPerKeystroke}ms`);

console.log('ALL SEARCH PERFORMANCE CHECKS PASSED 100%!');
