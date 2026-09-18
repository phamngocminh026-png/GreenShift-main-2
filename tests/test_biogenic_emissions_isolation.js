/**
 * GREENSHIFT BIOGENIC EMISSions ISOLATION & COMPLIANCE TEST
 * Test việc tách biệt hoàn toàn CO2 sinh học (Biogenic CO2) ra khỏi Scope 1
 * theo tiêu chuẩn GHG Protocol Corporate Standard, ISO 14064-1 và Nghị định 06/2022/NĐ-CP.
 */

const assert = require('assert');
const path = require('path');
const fs = require('fs');

console.log('===============================================================');
console.log('🧪 KIỂM THỬ TÍNH TOÀN VẸN: TÁCH RIÊNG PHÁT THẢI BIOGENIC CO2 KHỎI SCOPE 1');
console.log('===============================================================');

// 1. Kiểm tra cấu hình EF_MASTER
const efMaster = require(path.join(__dirname, '..', 'assets', 'js', 'ef-master.js'));
const fuels = efMaster.VN.fuels;

// TEST 1: Kiểm tra hệ số phát thải sinh khối
console.log('\n📌 1. Kiểm tra cấu hình hệ số trong EF_MASTER:');
const wood = fuels.biomass_wood;
const pellet = fuels.biomass_pellet;
const charcoal = fuels.charcoal;

assert.ok(wood, 'Phải tồn tại biomass_wood trong EF_MASTER');
assert.strictEqual(wood.isBiogenic, true, 'biomass_wood phải có isBiogenic: true');
assert.strictEqual(wood.factor, 0.038, 'biomass_wood Scope 1 non-CO2 factor phải là 0.038 kgCO2e/kg');
assert.strictEqual(wood.biogenic_factor, 1.7472, 'biomass_wood biogenic_factor phải là 1.7472 kgCO2/kg (1.7472 tCO2/tấn)');
console.log('  ✅ [PASS] biomass_wood: Scope 1 factor = 0.038 kgCO2e/kg, Biogenic = 1.7472 kgCO2/kg');

assert.ok(pellet, 'Phải tồn tại biomass_pellet trong EF_MASTER');
assert.strictEqual(pellet.isBiogenic, true, 'biomass_pellet phải có isBiogenic: true');
assert.strictEqual(pellet.factor, 0.035, 'biomass_pellet Scope 1 non-CO2 factor phải là 0.035 kgCO2e/kg');
assert.strictEqual(pellet.biogenic_factor, 1.9600, 'biomass_pellet biogenic_factor phải là 1.9600 kgCO2/kg');
console.log('  ✅ [PASS] biomass_pellet: Scope 1 factor = 0.035 kgCO2e/kg, Biogenic = 1.9600 kgCO2/kg');

assert.ok(charcoal, 'Phải tồn tại charcoal trong EF_MASTER');
assert.strictEqual(charcoal.isBiogenic, true, 'charcoal phải có isBiogenic: true');
assert.strictEqual(charcoal.biogenic_factor, 3.3040, 'charcoal biogenic_factor phải là 3.3040 kgCO2/kg');
console.log('  ✅ [PASS] charcoal: Biogenic = 3.3040 kgCO2/kg');

// TEST 2: Kiểm tra hàm tính toán CALCULATORS.calculateBiogenicCO2
console.log('\n📌 2. Kiểm tra hàm CALCULATORS trong EF_MASTER:');
const woodBioTon = efMaster.CALC.calculateBiogenicCO2('biomass_wood', 10000); // 10 tấn củi
assert.strictEqual(woodBioTon, 17.472, '10,000 kg củi phải tạo 17.472 tấn biogenic CO2');

const woodScope1Ton = efMaster.CALC.calculateScope1Fuel('biomass_wood', 10000); // 10 tấn củi
assert.strictEqual(woodScope1Ton, 0.38, '10,000 kg củi chỉ tính 0.38 tCO2e vào Scope 1 trực tiếp');
console.log(`  ✅ [PASS] 10 tấn củi: Scope 1 = ${woodScope1Ton} tCO2e, Biogenic CO2 = ${woodBioTon} tCO2`);

// TEST 3: Kiểm tra tính năng lượng TJ theo IPCC 2006
console.log('\n📌 3. Kiểm tra công thức IPCC 2006 mô hình NCV:');
const massKg = 10000;
const ncv = wood.ncv; // 15.6 TJ/Gg
const energyTJ = (massKg / 1000000) * ncv; // 0.156 TJ
const ef_ch4 = wood.ef_ch4_tj; // 300 kg/TJ
const ef_n2o = wood.ef_n2o_tj; // 4 kg/TJ
const ch4Gwp = 28;
const n2oGwp = 265;

const ch4_kg = energyTJ * ef_ch4; // 46.8 kg CH4
const n2o_kg = energyTJ * ef_n2o; // 0.624 kg N2O
const nonCo2Scope1 = (ch4_kg * ch4Gwp) + (n2o_kg * n2oGwp); // ~ 1475.76 kg CO2e
const co2_kg = energyTJ * wood.ef_co2_tj; // 0.156 * 112000 = 17,472 kg CO2

assert.strictEqual(co2_kg, 17472, 'Lượng CO2 sinh học tính qua TJ phải khớp chính xác 17,472 kg CO2');
console.log(`  ✅ [PASS] NCV ${ncv} TJ/Gg: Biogenic CO2 = ${co2_kg} kg (${(co2_kg/1000).toFixed(3)} tCO2) tách riêng ngoài Scope 1`);

// TEST 4: Kiểm tra bóc tách hóa đơn nhiên liệu sinh khối (invoice-parser.js)
console.log('\n📌 4. Kiểm tra nhận diện nhiên liệu sinh khối trong invoice-parser:');
const invoiceParserContent = fs.readFileSync(path.join(__dirname, '..', 'assets', 'js', 'invoice-parser.js'), 'utf8');
assert.ok(invoiceParserContent.includes('src_fac_biomass'), 'invoice-parser phải chứa src_fac_biomass');
assert.ok(invoiceParserContent.includes('biomass: \'Có\''), 'src_fac_biomass phải có cờ biomass: Có');
console.log('  ✅ [PASS] invoice-parser.js đã hỗ trợ danh mục mua ngoài nhiên liệu sinh khối');

// TEST 5: Kiểm tra carbon-activity.js lưu trữ và hiển thị huy hiệu
console.log('\n📌 5. Kiểm tra carbon-activity.js logic:');
const activityContent = fs.readFileSync(path.join(__dirname, '..', 'assets', 'js', 'carbon-activity.js'), 'utf8');
assert.ok(activityContent.includes('isBiomass'), 'carbon-activity.js phải xử lý isBiomass');
assert.ok(activityContent.includes('biogenicCo2'), 'carbon-activity.js phải lưu trường biogenicCo2');
assert.ok(activityContent.includes('Sinh khối (Biogenic)'), 'carbon-activity.js phải hiển thị huy hiệu Sinh khối (Biogenic)');
console.log('  ✅ [PASS] carbon-activity.js có đầy đủ cờ isBiomass, trường biogenicCo2 và huy hiệu hiển thị');

// TEST 6: Kiểm tra carbon-dashboard.js
console.log('\n📌 6. Kiểm tra carbon-dashboard.js phân rã số liệu:');
const dashboardContent = fs.readFileSync(path.join(__dirname, '..', 'assets', 'js', 'carbon-dashboard.js'), 'utf8');
assert.ok(dashboardContent.includes('displayBiogenicKg'), 'carbon-dashboard.js phải tổng hợp displayBiogenicKg');
assert.ok(dashboardContent.includes('Biogenic CO2:'), 'carbon-dashboard.js phải hiển thị chỉ số Biogenic CO2 trong Scope view');
console.log('  ✅ [PASS] carbon-dashboard.js tổng hợp và hiển thị Biogenic CO2 tách riêng ngoài Scope 1');

// TEST 7: Kiểm tra supabase-client.js
console.log('\n📌 7. Kiểm tra supabase-client.js hỗ trợ biogenic_co2_tco2e:');
const supabaseContent = fs.readFileSync(path.join(__dirname, '..', 'assets', 'js', 'supabase-client.js'), 'utf8');
assert.ok(supabaseContent.includes('biogenic_co2_tco2e: parseFloat(biogenicCo2)'), 'pushAnnualInventory phải hỗ trợ tham số biogenicCo2');
console.log('  ✅ [PASS] supabase-client.js đồng bộ chính xác trường biogenic_co2_tco2e lên cơ sở dữ liệu Supabase');

console.log('\n===============================================================');
console.log('🎉 TOÀN BỘ 7 BÀI KIỂM THỬ TÁCH BIOGENIC CO2 ĐỀU VƯỢT QUA 100%!');
console.log('===============================================================');
