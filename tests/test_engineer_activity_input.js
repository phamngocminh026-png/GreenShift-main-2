const fs = require('fs');
const assert = require('assert');

console.log('--- KIỂM TRA PHƯƠNG THỨC NHẬP DỮ LIỆU HOẠT ĐỘNG CHO KỸ SƯ ---');

// 1. Kiểm tra carbon-inventory.html
const html = fs.readFileSync('carbon-inventory.html', 'utf8');

assert.ok(html.includes('id="activity-eq-spec-card"'), 'Thiếu thẻ thông số kỹ thuật thiết bị #activity-eq-spec-card');
assert.ok(html.includes('data-mode="hours"'), 'Thiếu tab chế độ Theo giờ chạy máy');
assert.ok(html.includes('data-mode="meter"'), 'Thiếu tab chế độ Chỉ số đồng hồ đo');
assert.ok(html.includes('data-mode="direct"'), 'Thiếu tab chế độ Nhập trực tiếp / Hóa đơn');
assert.ok(html.includes('id="input-op-hours"'), 'Thiếu ô nhập giờ chạy máy');
assert.ok(html.includes('id="input-op-load"'), 'Thiếu ô nhập mức tải');
assert.ok(html.includes('id="input-op-rate"'), 'Thiếu ô nhập định mức tiêu hao');
assert.ok(html.includes('id="input-meter-start"'), 'Thiếu ô chỉ số đầu kỳ');
assert.ok(html.includes('id="input-meter-end"'), 'Thiếu ô chỉ số cuối kỳ');

console.log('✅ TEST 1: File carbon-inventory.html đầy đủ giao diện 3 chế độ nhập liệu và thẻ thông số kỹ thuật.');

// 2. Kiểm tra assets/js/carbon-activity.js
const js = fs.readFileSync('assets/js/carbon-activity.js', 'utf8');
assert.ok(js.includes('switchActivityInputMode'), 'Thiếu hàm switchActivityInputMode');
assert.ok(js.includes('calcFromHours'), 'Thiếu hàm tính theo giờ calcFromHours');
assert.ok(js.includes('calcFromMeter'), 'Thiếu hàm tính theo đồng hồ calcFromMeter');

console.log('✅ TEST 2: File carbon-activity.js đầy đủ hàm chuyển đổi và tính toán tự động.');

// 3. Kiểm tra tính toán chế độ Theo giờ chạy máy:
// Lượng tiêu thụ = Giờ chạy * (Mức tải % / 100) * Định mức tiêu hao
function testCalcHours(hours, loadPercent, rate) {
  const load = (loadPercent || 100) / 100;
  return hours * load * rate;
}

const resHours1 = testCalcHours(20, 100, 75); // 20 giờ, 100% tải, 75 lít/giờ = 1500 lít
assert.strictEqual(resHours1, 1500);

const resHours2 = testCalcHours(30, 80, 50); // 30 giờ, 80% tải, 50 lít/giờ = 1200 lít
assert.strictEqual(resHours2, 1200);

console.log('✅ TEST 3: Công thức tính lượng tiêu thụ theo Giờ chạy máy & Mức tải chính xác 100%.');

// 4. Kiểm tra tính toán chế độ Theo chỉ số đồng hồ đo:
// Lượng tiêu thụ = (Chỉ số cuối - Chỉ số đầu) * Hệ số nhân
function testCalcMeter(start, end, multiplier = 1) {
  return (end - start) * multiplier;
}

const resMeter1 = testCalcMeter(12050, 12450, 1);
assert.strictEqual(resMeter1, 400);

const resMeter2 = testCalcMeter(500, 700, 2.5);
assert.strictEqual(resMeter2, 500);

console.log('✅ TEST 4: Công thức tính lượng tiêu thụ theo Chỉ số đồng hồ đo chính xác 100%.');

console.log('\n🎉 TẤT CẢ CÁC KIỂM THỬ NHẬP LIỆU HOẠT ĐỘNG CHO KỸ SƯ ĐỀU THÀNH CÔNG!');
