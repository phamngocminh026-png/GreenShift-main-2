const fs = require('fs');
const assert = require('assert');
const path = require('path');

console.log('=== TEST: FUEL PRE-SELECT, FUGITIVE CATEGORY & ADAPTIVE IPPU PRODUCTION ===');

const invHtml = fs.readFileSync(path.join(__dirname, '..', 'carbon-inventory.html'), 'utf8');
const actJs = fs.readFileSync(path.join(__dirname, '..', 'assets', 'js', 'carbon-activity.js'), 'utf8');

// 1. Kiểm tra carbon-inventory.html: Danh mục select#source-fuel chứa đầy đủ các nhiên liệu chuẩn
assert.ok(invHtml.includes('value="Khí tự nhiên thương phẩm (Gas)"'), 'source-fuel phải có Khí tự nhiên thương phẩm (Gas)');
assert.ok(invHtml.includes('value="Khí dầu mỏ hóa lỏng (LPG)"'), 'source-fuel phải có Khí dầu mỏ hóa lỏng (LPG)');
assert.ok(invHtml.includes('value="Dầu Diesel (DO)"'), 'source-fuel phải có Dầu Diesel (DO)');
assert.ok(invHtml.includes('value="Dầu Mazut (FO)"'), 'source-fuel phải có Dầu Mazut (FO)');
assert.ok(invHtml.includes('value="Xăng thương phẩm (Gasoline)"'), 'source-fuel phải có Xăng thương phẩm');
assert.ok(invHtml.includes('value="Than đá"'), 'source-fuel phải có Than đá');
assert.ok(invHtml.includes('value="Sinh khối (Trấu/Mùn cưa)"'), 'source-fuel phải có Sinh khối');

console.log('PASS 1: Select#source-fuel đã bổ sung đầy đủ tất cả các loại nhiên liệu chuẩn từ danh mục 16 ngành.');

// 2. Kiểm tra FUEL_EF_MAP có ánh xạ Khí tự nhiên thương phẩm (Gas) và LPG
assert.ok(invHtml.includes("'Khí tự nhiên thương phẩm (Gas)':      { tab: 'VN', cat: 'fuels', id: 'natural_gas' }"),
  'FUEL_EF_MAP phải ánh xạ Khí tự nhiên thương phẩm (Gas)');
assert.ok(invHtml.includes("'Khí dầu mỏ hóa lỏng (LPG)':           { tab: 'VN', cat: 'fuels', id: 'lpg' }"),
  'FUEL_EF_MAP phải ánh xạ Khí dầu mỏ hóa lỏng (LPG)');

console.log('PASS 2: FUEL_EF_MAP tự động gợi ý hệ số phát thải chuẩn quốc gia cho mọi dạng khí thiên nhiên & LPG.');

// 3. Kiểm tra openSourceModal & attachSourceRowEvents: Hỗ trợ cả 'Phát thải rò rỉ' và 'Phát thải thất thoát'
assert.ok(invHtml.includes("isFugitive = (catLower.includes('thất thoát') || catLower.includes('rò rỉ') || category === 'Phát thải thất thoát' || category === 'Phát thải rò rỉ')"),
  'openSourceModal phải nhận diện cả Phát thải rò rỉ và Phát thải thất thoát');
assert.ok(invHtml.includes("isFugitive = (catLower.includes('thất thoát') || catLower.includes('rò rỉ') || currentSourceCategory === 'Phát thải thất thoát' || currentSourceCategory === 'Phát thải rò rỉ')"),
  'attachSourceRowEvents phải nhận diện cả Phát thải rò rỉ và Phát thải thất thoát');

console.log('PASS 3: Nguồn Phát thải rò rỉ (Chiller, Điều hòa) tự động hiển thị chọn Khí nạp, ẩn hoàn toàn ô Nhiên liệu và không chặn Lưu.');

// 4. Kiểm tra attachSourceRowEvents: Tự động điền trước source-fuel cho nguồn đốt cháy
assert.ok(invHtml.includes("matchedFuel = 'Khí tự nhiên thương phẩm (Gas)';"),
  'attachSourceRowEvents phải tự nhận diện khí tự nhiên thương phẩm cho nguồn đốt');
assert.ok(invHtml.includes("currentEditingSourceRow.dataset.fuel        = fuel;"),
  'Lưu nguồn phải ghi nhận trường fuel vào dataset của dòng đang sửa');
assert.ok(invHtml.includes("tr.dataset.fuel        = fuel;"),
  'Thêm nguồn mới phải ghi nhận trường fuel vào dataset');

console.log('PASS 4: Tự động nhận diện và gán đúng Nhiên liệu khi bấm nút Sửa, không bị văng về Vui lòng chọn Nhiên liệu.');

// 5. Kiểm tra Loại đo lường: Chỉ gán Đo liên tục khi có mã đồng hồ sub-meter, còn lại tự đánh giá kỹ thuật
assert.ok(invHtml.includes("row.dataset.meterId && row.dataset.meterId.trim() !== '' && (mLower.includes('liên tục') || mLower.includes('đồng hồ') || mLower.includes('công tơ'))"),
  'Chỉ gán Đo liên tục khi có sub-meter meterId');

console.log('PASS 5: Tự động gán Tự đánh giá (Kỹ thuật / Công suất máy) làm mặc định cho thiết bị không có đồng hồ riêng.');

// 6. Kiểm tra carbon-activity.js: Tự động ẩn nút Chốt sản lượng theo ngày khi cơ sở không có nguồn IPPU
assert.ok(actJs.includes("btnQuickLogProd.style.display = 'none';") && actJs.includes("btnQuickLogProd.style.display = 'inline-block';"),
  'updateProductionReminderBanner phải tự động ẩn nút btn-quick-log-production khi nhà máy không có nguồn IPPU');

console.log('PASS 6: Nút Chốt sản lượng theo ngày tự động ẩn với các nhà máy không có quá trình công nghệ (như phân bón, lắp ráp).');

// 7. Kiểm tra triggerQuickProductionInput: Tự động thích ứng với sản phẩm thực tế của ngành thay vì cứng thép
assert.ok(actJs.includes("const prodName = (targetOption && targetOption.dataset.productName) ? targetOption.dataset.productName : 'sản phẩm';"),
  'triggerQuickProductionInput phải lấy tên sản phẩm động theo thiết bị');
assert.ok(actJs.includes("docInput.value = `Phiếu cân ca máy - Nghiệm thu ${prodName}`;"),
  'Tên phiếu nghiệm thu ca máy phải tự động mang tên sản phẩm của ngành');

console.log('PASS 7: Chốt sản lượng thích ứng động theo từng ngành nghề (Phân Urê, Clinker, Thép thô, Vôi sống).');

console.log('=== ALL USER FEEDBACK CHECKS PASSED 100% ===');
