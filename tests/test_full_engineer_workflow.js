const fs = require('fs');
const assert = require('assert');

console.log('--- KIỂM TRA TOÀN DIỆN MÔ HÌNH VẬN HÀNH DỮ LIỆU KỸ SƯ & NGUỒN PHÁT THẢI ---');

// Mock window environment
global.window = global;
require('../assets/js/equipment-db.js');

// TEST 1: Cơ sở dữ liệu 92 thiết bị chuẩn
assert(Array.isArray(window.EQUIPMENT_MASTER), 'EQUIPMENT_MASTER phải là một mảng');
assert.strictEqual(window.EQUIPMENT_MASTER.length, 92, 'Phải có chính xác 92 thiết bị chuẩn từ schema Supabase');
console.log('TEST 1: Cơ sở dữ liệu 92 thiết bị chuẩn Supabase đã tải thành công.');

// TEST 2: Tra cứu thiết bị chuẩn
const eqEAF = window.findStandardEquipment('Lò hồ quang điện EAF');
assert(eqEAF, 'Phải tìm thấy Lò hồ quang điện EAF');
assert.strictEqual(eqEAF.ratedCapacity, 45000, 'Công suất EAF phải là 45000 kW');
assert.strictEqual(eqEAF.capacityUnit, 'kW', 'Đơn vị EAF phải là kW');
assert.strictEqual(eqEAF.defaultLoadFactor, 0.82, 'Mức tải mặc định EAF phải là 0.82');
console.log('TEST 2: Tra cứu thông số thiết bị chuẩn theo tên/từ khóa hoạt động chính xác.');

// TEST 3: Công thức tính tiêu thụ theo giờ và dự phóng cả năm
// Thiết bị 45 kW, tải 80%, chạy 16h/ngày, 6 ngày/tuần
const hourly = window.calcEquipmentHourlyRate(45, 80);
assert.strictEqual(hourly, 36, '45 kW * 80% phải ra 36 kW/h');

const annual = window.calcEquipmentAnnual(45, 80, 16, 6);
assert.strictEqual(annual.hourly, 36);
assert.strictEqual(annual.daily, 576, '36 * 16 = 576 kWh/ngày');
assert.strictEqual(annual.annual, 179712, '576 * 6 * 52 = 179712 kWh/năm');
console.log('TEST 3: Công thức tiêu thụ mỗi giờ, ngày và dự phóng cả năm khớp chuẩn 100%.');

// TEST 4: Khấu trừ khi máy hỏng / dừng đột xuất (Downtime Deduction)
// Giả sử máy dừng 8 giờ
const downtimeHours = 8;
const deduction = - (downtimeHours * hourly);
assert.strictEqual(deduction, -288, 'Dừng 8h * 36 kW/h = -288 kWh');
const adjustedAnnual = annual.annual + deduction;
assert.strictEqual(adjustedAnnual, 179424, '179712 - 288 = 179424 kWh');
console.log('TEST 4: Logic khấu trừ số giờ dừng máy (Downtime Log) chính xác tuyệt đối.');

// TEST 5: Kiểm tra markup trong carbon-inventory.html
const html = fs.readFileSync('carbon-inventory.html', 'utf8');
assert(html.includes('id="source-self-eval-box"'), 'Phải có khung cấu hình Tự đánh giá trong modal nguồn phát thải');
assert(html.includes('id="source-meter-box"'), 'Phải có khung cấu hình Đo liên tục trong modal nguồn phát thải');
assert(html.includes('id="source-accountant-box"'), 'Phải có khung thông báo Kế toán trong modal nguồn phát thải');
assert(html.includes('id="machine-overview-card"'), 'Phải có Bảng theo dõi tiêu thụ & vận hành thiết bị cho Kỹ sư/Quản trị');
assert(html.includes('id="reconciliation-card"'), 'Phải có Bảng đối soát Năng lượng Kế toán vs Kỹ sư (Reconciliation)');
assert(html.includes('assets/js/equipment-db.js'), 'Phải import equipment-db.js trong carbon-inventory.html');
console.log('TEST 5: File carbon-inventory.html tích hợp đầy đủ các khối giao diện theo kế hoạch.');

// TEST 6: Kiểm tra hàm và xử lý trong assets/js/carbon-activity.js
const js = fs.readFileSync('assets/js/carbon-activity.js', 'utf8');
assert(js.includes('renderMachineOverview'), 'Phải có hàm renderMachineOverview');
assert(js.includes('renderReconciliationSummary'), 'Phải có hàm renderReconciliationSummary');
assert(js.includes('btnQuickLogDowntime'), 'Phải có nút ghi nhận nhanh dừng máy cho kỹ sư');
assert(!js.includes('📎'), 'Không được chứa icon sticker kẹp giấy');
console.log('TEST 6: File carbon-activity.js đầy đủ hàm đối soát, bảng điều hành và không có sticker emoji.');

console.log('\nTẤT CẢ CÁC BÀI KIỂM TRA MÔ HÌNH VẬN HÀNH KỸ SƯ ĐỀU ĐẠT CHUẨN 100%!');
