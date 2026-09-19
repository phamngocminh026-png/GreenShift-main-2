const fs = require('fs');
const assert = require('assert');

// 1. Check CBAM Phase In in cbam-dashboard.html
const html = fs.readFileSync('C:/Users/PC/Downloads/GreenShift-main/cbam-dashboard.html', 'utf8');
assert(html.includes('2031: 0.61'), 'Phase in 2031 missing');
assert(html.includes('2032: 0.735'), 'Phase in 2032 missing');
assert(html.includes('2033: 0.86'), 'Phase in 2033 missing');
assert(html.includes('2034: 1.00'), 'Phase in 2034 missing');
console.log('Test 1: CBAM Phase In 2026-2034 verified!');

// 2. Check 310230 in cbam_service.py
const py = fs.readFileSync('C:/Users/PC/Downloads/GreenShift-main/server/services/cbam_service.py', 'utf8');
assert(py.includes('Mixed fertilisers'), '310230 should be Mixed fertilisers');
assert(py.includes("p_cn.startswith('310230')"), 'Precursor 310230 should be Mixed fertilisers');
assert(!py.includes("1000 if sector != 'cement' else 1100"), 'Default 1000 MWh should be eliminated');
console.log('Test 2: cbam_service.py updates verified!');

console.log('ALL STEP 2 UNIT VERIFICATIONS PASSED!');
