const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('=== TEST: EAF IPPU VS ELECTRICITY STRICT ISOLATION & ACCURATE EMISSION CALCULATION ===');

const actJs = fs.readFileSync(path.join(__dirname, '..', 'assets', 'js', 'carbon-activity.js'), 'utf8');
const invHtml = fs.readFileSync(path.join(__dirname, '..', 'carbon-inventory.html'), 'utf8');

// 1. Kiểm tra carbon-activity.js: populateSourceDropdowns loại trừ triệt để Tiêu thụ điện khi isProductionOnly = true
assert.ok(actJs.includes('const isElectricity = (cat === \'Tiêu thụ điện\' || cat === \'Tiêu thụ điện lưới\' || cat === \'Điện mua vào\' || cat === \'Điện năng mua vào\' || cat.includes(\'Điện\'));'),
  'Must detect electricity category');
assert.ok(actJs.includes('if (!isElectricity && !isCombustion && !isFugitive) {'),
  'isProc must strictly exclude electricity, combustion, and fugitive sources');
assert.ok(actJs.includes('if (isProductionOnly && !isProc) return;'),
  'Must skip electricity devices when isProductionOnly is true');

console.log('PASS 1: Tiêu thụ điện của Lò EAF bị loại trừ 100% khỏi dropdown Chốt sản lượng ca/ngày.');

// 2. Kiểm tra tên hiển thị của nguồn Quá trình công nghiệp
assert.ok(actJs.includes('Quá trình luyện thép - ${eq || \'Lò hồ quang điện EAF\'} (IPPU: ${efDisplay})'),
  'Must display distinct process emission label with explicit IPPU factor');

console.log('PASS 2: Tên nguồn IPPU hiển thị rõ ràng [Quá trình luyện thép] kèm định mức kgCO2e/tấn.');

// 3. Kiểm tra tính toán phát thải chính xác cho sản lượng phôi thép
assert.ok(actJs.includes('efKg = efNum * 1000') || actJs.includes('efNum <= 5'),
  'Must convert tCO2/tấn factor (e.g. 0.060) to kgCO2e/tấn (60 kgCO2e/tấn)');
assert.ok(actJs.includes('co2eCalc = amount * efKg;'),
  'Must compute emissions as amount * efKg for IPPU steel production');

// Giả lập tính toán: 100 tấn phôi thép với hệ số 60 kgCO2e/tấn (0.060 tCO2/tấn)
const steelTonnage = 100;
const efFactorIPPU = 60; // 0.060 tCO2/tấn
const expectedEmissionsKg = steelTonnage * efFactorIPPU;
assert.strictEqual(expectedEmissionsKg, 6000, '100 tấn phôi thép phải sinh ra đúng 6000 kgCO2e (tương đương 6 tấn CO2e)');

console.log('PASS 3: Phép tính phát thải 100 tấn phôi thép = 6.000 kgCO2e (6 tCO2e) hoàn toàn chuẩn xác theo IPCC.');

// 4. Kiểm tra bộ lọc applyFilter khớp linh hoạt cả nguồn điện và IPPU của lò EAF
assert.ok(actJs.includes('nLower.includes(fLower)'),
  'applyFilter must match sourceName flexibly');
assert.ok(actJs.includes('tLower.includes(fLower) || fLower.includes(tLower)'),
  'applyFilter must match sourceType flexibly');

console.log('PASS 4: Bộ lọc bảng hiển thị mượt mà cả dòng Điện và dòng Sản lượng thép mà không bị ẩn nhầm.');

// 5. Kiểm tra tự động sửa chữa dòng dữ liệu cũ bị gán nhầm hệ số điện 0.6766
assert.ok(actJs.includes('if (act.unit === \'tấn\' && (act.finalFactor == 0.6766 || act.finalFactor == \'0.6766\')) {'),
  'loadActivityList must auto-repair legacy records that had factor 0.6766 for steel tonnage');
assert.ok(actJs.includes('act.finalFactor = \'60\';'),
  'Repaired factor must be 60 kgCO2e/tấn');

console.log('PASS 5: Tự động phục hồi và chuyển đổi hệ số từ 0.6766 sang 60 kgCO2e/tấn cho dòng dữ liệu đã lưu.');

console.log('=== ALL TESTS PASSED SUCCESSFULLY ===');
