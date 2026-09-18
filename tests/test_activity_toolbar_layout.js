const fs = require('fs');
const assert = require('assert');

console.log('Running test_activity_toolbar_layout.js...');

const html = fs.readFileSync('carbon-inventory.html', 'utf8');

// 1. Check that content-ci has overflow-x: hidden
assert(html.includes('overflow-x: hidden;'), '.content-ci must have overflow-x: hidden to prevent page-level scrollbars');

// 2. Check that custom-select-dropdown has max-width
assert(html.includes('max-width: min(560px'), '.custom-select-dropdown must have max-width constraint');

// 3. Check that btn-add-activity is inside the 2nd row action toolbar
assert(html.includes('id="btn-add-activity"'), 'btn-add-activity must exist');
assert(html.includes('id="btn-reset-test-data"'), 'btn-reset-test-data must exist');

// Verify 2-tier layout comments/structure
assert(html.includes('DÒNG 1: BỘ LỌC DỮ LIỆU'), 'Must have distinct filter row');
assert(html.includes('DÒNG 2: THAO TÁC & NÚT HÀNH ĐỘNG CHÍNH'), 'Must have distinct action row');

console.log('PASSED: test_activity_toolbar_layout.js');
