const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('--- TEST: Industry Template Download, Direct Import, and Activity Buttons ---');

const htmlPath = path.join(__dirname, '..', 'carbon-inventory.html');
const activityJsPath = path.join(__dirname, '..', 'assets', 'js', 'carbon-activity.js');

const htmlContent = fs.readFileSync(htmlPath, 'utf8');
const activityJs = fs.readFileSync(activityJsPath, 'utf8');

// 1. Verify dynamic button label update function exists in carbon-inventory.html
assert(htmlContent.includes('function updateEquipmentTemplateButtonLabel'), 'Must contain updateEquipmentTemplateButtonLabel');
assert(htmlContent.includes('Tải file mẫu (${ind})') || htmlContent.includes('Tải file mẫu (${industry})'), 'Label must show selected industry');

// 2. Verify downloadEquipmentTemplate prioritizes #ci-setup-industry
assert(htmlContent.includes("document.getElementById('ci-setup-industry')"), 'downloadEquipmentTemplate must check #ci-setup-industry');
assert(htmlContent.includes('Đang tải file mẫu thiết bị Excel cho ngành:'), 'downloadEquipmentTemplate must show toast with selected industry');

// 3. Verify equipment import does NOT block non-steel files with smart mapping modal
assert(!htmlContent.includes('if (!isStandardTemplate)'), 'Must not block import based on isStandardTemplate');
assert(htmlContent.includes('executeCommitImport(rows)'), 'Directly executes commit import');

// 4. Verify inline onclicks on activity toolbar and control buttons
assert(htmlContent.includes('id="btn-toggle-machine-table-height" onclick="if(typeof window.toggleMachineTableHeight===\'function\') window.toggleMachineTableHeight();"'), 'toggleMachineTableHeight inline onclick must exist');
assert(htmlContent.includes('id="btn-day-off-menu" onclick="if(typeof window.toggleDayOffMenu===\'function\') window.toggleDayOffMenu(event);"'), 'toggleDayOffMenu inline onclick must exist');
assert(htmlContent.includes('id="activity-custom-filter-input" onclick="if(typeof window.toggleActivityCustomFilter===\'function\') window.toggleActivityCustomFilter(event);"'), 'toggleActivityCustomFilter inline onclick must exist');
assert(htmlContent.includes('id="btn-toggle-table-height" onclick="if(typeof window.toggleActivityTableHeight===\'function\') window.toggleActivityTableHeight();"'), 'toggleActivityTableHeight inline onclick must exist');
assert(htmlContent.includes('id="btn-quick-log-production" onclick="if(typeof window.triggerQuickProductionInput===\'function\') window.triggerQuickProductionInput();"'), 'triggerQuickProductionInput inline onclick must exist');

// 5. Verify nav tab switch to view-activity reloads activity list and machine overview
assert(htmlContent.includes("target === 'view-activity'"), 'Must handle view-activity in nav tab switch');
assert(htmlContent.includes('window.loadActivityList()'), 'Must call window.loadActivityList on tab switch');
assert(htmlContent.includes('window.renderMachineOverview()'), 'Must call window.renderMachineOverview on tab switch');

// 6. Verify carbon-activity.js exports needed functions to window
assert(activityJs.includes('window.toggleActivityTableHeight ='), 'Must export toggleActivityTableHeight');
assert(activityJs.includes('window.toggleMachineTableHeight ='), 'Must export toggleMachineTableHeight');
assert(activityJs.includes('window.toggleDayOffMenu ='), 'Must export toggleDayOffMenu');
assert(activityJs.includes('window.toggleActivityCustomFilter ='), 'Must export toggleActivityCustomFilter');

// 7. Verify localStorage fallback for getDynamicTree
assert(activityJs.includes('if (sourceRows.length === 0) {'), 'Must check if sourceRows.length === 0');
assert(activityJs.includes('const list = JSON.parse(stored);'), 'Must parse stored sources from localStorage in getDynamicTree');

// 8. Verify applyRoleBasedNavigation default act-filter-role is all
assert(htmlContent.includes("filterRoleEl.value = '';"), 'Role filter should default to empty string (all) so machine entries are not hidden');

console.log('✅ ALL CHECKS PASSED: Industry Template & Activity Buttons integrity verified.');
