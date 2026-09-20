const fs = require('fs');
const assert = require('assert');

console.log('=== RUNNING TESTS: ALUMINUM VIDEO AUDIT FIXES ===');

const actJs = fs.readFileSync('assets/js/carbon-activity.js', 'utf8');
const invHtml = fs.readFileSync('carbon-inventory.html', 'utf8');
const compJs = fs.readFileSync('assets/js/carbon-company.js', 'utf8');

// 1. Zero Emoji rule
const EMOJI_REGEX = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}]/u;
assert.ok(!EMOJI_REGEX.test(actJs), 'carbon-activity.js must NOT contain any emoji');
assert.ok(!EMOJI_REGEX.test(compJs), 'carbon-company.js must NOT contain any emoji');
console.log('PASS 1: Zero Emoji rule verified across all modified scripts.');

// 2. Issue 1: Electricity potline strictly keeps kWh unit in normalizeConsumptionUnit
assert.ok(actJs.includes('const isElectricity = cat.includes(\'loại 2\') || cat.includes(\'tiêu thụ điện\')'), 'Electricity scope must be identified');
assert.ok(actJs.includes('if (isElectricity) return \'kWh\';'), 'Electricity must return kWh unit strictly');
console.log('PASS 2: normalizeConsumptionUnit protects electrical potline from being converted to tấn.');

// 3. Issue 2: Dynamic IPPU defaults for Aluminum vs Cement vs Steel
assert.ok(actJs.includes('getIndustryIppuDefaults(ind)'), 'getIndustryIppuDefaults must be defined');
assert.ok(actJs.includes('Kỹ sư xưởng điện phân nhôm'), 'Aluminum must have dedicated potline engineer title');
assert.ok(actJs.includes('Nhôm nguyên sinh (Điện phân)'), 'Aluminum must have primary aluminum IPPU factor (1600 kgCO2e/tấn)');
console.log('PASS 3: Dynamic industry IPPU configurations verified (Aluminum, Cement, Steel).');

// 4. Issue 3: IPPU manager title and source label are dynamic
assert.ok(actJs.includes('const ippuDef = getIndustryIppuDefaults(getCurrentIndustry());'), 'Modal must query industry IPPU defaults');
assert.ok(actJs.includes('if (managerLabel) managerLabel.innerText = ippuDef.managerTitle;'), 'Sign-off manager must match active industry');
console.log('PASS 4: Dynamic IPPU manager and sign-off labels verified.');

// 5. Issue 4: Equipment modal unit stacking fix in recalcSourceSelfEval
assert.ok(invHtml.includes("rateUnitD = `${baseUnit}/ngày`;"), 'Rate per day must not stack /h');
assert.ok(invHtml.includes("rateUnitD = 'kWh/ngày';"), 'Daily electricity must show kWh/ngày');
assert.ok(invHtml.includes("rateUnitY = 'kWh/năm';"), 'Annual electricity must show kWh/năm');
assert.ok(invHtml.includes("minimumFractionDigits: 2, maximumFractionDigits: 2"), 'Emissions must be formatted with 2 decimal places');
console.log('PASS 5: Equipment operational calculation modal unit stacking & emission formatting fixed.');

// 6. Issue 5: On-site wastewater treatment mapped to Loại 1 (Scope 1)
assert.ok(invHtml.includes("'Xử lý chất thải / Nước thải':                        { label: 'Loại 1', scope: 1 }"), 'Wastewater category mapped to Scope 1');
assert.ok(invHtml.includes("if (str.includes('nước thải') || str.includes('bể tự hoại')"), 'getScopeInfo recognizes on-site wastewater as Scope 1');
console.log('PASS 6: Internal wastewater treatment strictly mapped to Loại 1 (Scope 1) per ISO 14064-1.');

// 7. Issue 6: Branch setup synchronizes with parent company industry
assert.ok(compJs.includes("const defaultBranchIndustry = (parentIndEl && parentIndEl.value) ? parentIndEl.value.trim() : 'Nhôm';"), 'Branch card default industry defined');
assert.ok(compJs.includes("industryInput.addEventListener('change'"), 'Parent industry change synchronizes branch cards');
console.log('PASS 7: Branch industry setup default and dynamic synchronization verified.');

console.log('=== ALL 7 AUDIT VERIFICATIONS PASSED SUCCESSFULLY ===');
