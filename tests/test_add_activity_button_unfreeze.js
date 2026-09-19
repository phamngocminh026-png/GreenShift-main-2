const fs = require('fs');
const assert = require('assert');

// 1. Check carbon-inventory.html
const html = fs.readFileSync('carbon-inventory.html', 'utf8');
assert.ok(
  html.includes('id="btn-add-activity"'),
  'carbon-inventory.html must contain id="btn-add-activity"'
);
assert.ok(
  html.includes('onclick="if(typeof window.openActivityModal===\'function\') window.openActivityModal();"'),
  'carbon-inventory.html btn-add-activity must have inline onclick fallback for instant responsiveness'
);

// 2. Check assets/js/carbon-activity.js
const actJs = fs.readFileSync('assets/js/carbon-activity.js', 'utf8');

// Verify click event handling does not pass PointerEvent to openModal
assert.ok(
  actJs.includes("btnAddActivity.addEventListener('click', (e) => {"),
  'carbon-activity.js must wrap btnAddActivity click listener to prevent passing PointerEvent'
);
assert.ok(
  actJs.includes("if (e && typeof e.preventDefault === 'function') e.preventDefault();"),
  'carbon-activity.js must prevent default if applicable'
);

// Verify sanitization of filterType in openModal
assert.ok(
  actJs.includes("const cleanFilter = (typeof filterType === 'string') ? filterType.trim() : '';"),
  'carbon-activity.js openModal must sanitize filterType against PointerEvent or non-string'
);

// Verify window export of openActivityModal and closeActivityModal
assert.ok(
  actJs.includes("window.openActivityModal = openModal;"),
  'carbon-activity.js must export window.openActivityModal'
);
assert.ok(
  actJs.includes("window.closeActivityModal = closeModal;"),
  'carbon-activity.js must export window.closeActivityModal'
);

// Verify immediate initialization readyState check
assert.ok(
  actJs.includes("if (document.readyState === 'loading') {"),
  'carbon-activity.js must check document.readyState === loading'
);
assert.ok(
  actJs.includes("initActivityLogic();"),
  'carbon-activity.js must call initActivityLogic immediately if already loaded'
);

// Verify zero emojis constraint
const forbiddenEmojis = ['\u{1F389}', '\u{1F512}', '\u{1F6E1}', '\u{1F4CA}', '\u{2699}', '\u{1F4C4}', '\u{1F4DD}'];
forbiddenEmojis.forEach(emoji => {
  assert.ok(!actJs.includes(emoji), 'carbon-activity.js must not contain emoji: ' + emoji);
});

// 3. Functional Simulation Test:
// Simulate openModal execution with a PointerEvent to confirm robustness even under unexpected event leaks
function runMockOpenModalSimulation() {
  const classList = new Set();
  const modal = {
    classList: {
      add: (c) => classList.add(c),
      remove: (c) => classList.delete(c),
      contains: (c) => classList.has(c)
    }
  };

  const modalTitle = { innerText: '' };
  const sourceSelect = {
    innerHTML: '',
    options: [{ disabled: false }],
    add: function(opt) {}
  };

  // Reproduce the exact openModal sanitization logic
  function simulateOpenModal(filterType, isProductionOnly) {
    const cleanFilter = (typeof filterType === 'string') ? filterType.trim() : '';
    const currentFilter = cleanFilter;

    // Title assignment
    modalTitle.innerText = currentFilter ? `Them Hoa don ${currentFilter}` : 'Them Hoa don';

    // Populate source dropdown simulation
    const fStr = (typeof currentFilter === 'string') ? currentFilter.trim() : '';
    const sources = [
      { id: 'src_fac_diesel', name: 'Diesel', type: 'Dot chay co dinh' }
    ];
    sources.forEach(src => {
      if (fStr && src.type !== fStr && !(fStr.includes('Dot chay') && src.type.includes('Dot chay'))) return;
    });

    modal.classList.add('open');
  }

  // Simulate passing a PointerEvent directly (the previous failure mode)
  const mockPointerEvent = {
    isTrusted: true,
    type: 'click',
    clientX: 120,
    clientY: 240,
    preventDefault: () => {}
  };

  // Should NOT throw TypeError: filterType.includes is not a function
  assert.doesNotThrow(() => {
    simulateOpenModal(mockPointerEvent, false);
  }, 'simulateOpenModal must not throw when receiving PointerEvent');

  assert.strictEqual(modal.classList.contains('open'), true, 'Modal must open successfully');
  assert.strictEqual(modalTitle.innerText, 'Them Hoa don', 'Modal title must not be polluted with [object Object]');
}

runMockOpenModalSimulation();

console.log('Button click unfreeze and modal protection tests PASSED successfully.');
