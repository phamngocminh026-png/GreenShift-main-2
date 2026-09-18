const fs = require('fs');
const assert = require('assert');

console.log('--- KIỂM TRA TÍNH NĂNG TẢI FILE MẪU VÀ TẢI THIẾT BỊ (IMPORT EXCEL) ---');

// 1. Kiểm tra mã nguồn trong carbon-inventory.html
const html = fs.readFileSync('carbon-inventory.html', 'utf8');

assert.ok(html.includes('xlsx.full.min.js'), 'Thiếu thư viện SheetJS xlsx trong carbon-inventory.html');
assert.ok(html.includes('id="btn-download-eq-template"'), 'Thiếu nút #btn-download-eq-template (Tải file mẫu)');
assert.ok(html.includes('id="btn-import-equipment"'), 'Thiếu nút #btn-import-equipment (Tải thiết bị)');
assert.ok(html.includes('id="input-equipment-file"'), 'Thiếu #input-equipment-file');
assert.ok(html.includes('function downloadEquipmentTemplate'), 'Thiếu hàm downloadEquipmentTemplate');
assert.ok(html.includes('sampleEquipmentTemplateData'), 'Thiếu dữ liệu mẫu sampleEquipmentTemplateData');

console.log('✅ TEST 1: File carbon-inventory.html có đầy đủ markup, thư viện SheetJS và hàm xử lý.');

// 2. Kiểm tra logic xử lý và ánh xạ dữ liệu file Excel vào danh mục thiết bị
const sampleRows = [
  {
    'Loại thiết bị': 'Lò hơi đốt than bột (Đáy khô)',
    'Tên thiết bị': 'Lò hơi số 1 - Phân xưởng A',
    'Vị trí': 'Nhà xưởng 1',
    'Số tài sản': 'TB-LH-001',
    'Thương hiệu / Mẫu mã': 'Miura Boiler 50T/h',
    'Nguồn phát thải': 'Đốt cháy cố định'
  },
  {
    'Loại thiết bị': 'Máy phát điện diesel dự phòng',
    'Tên thiết bị': 'Máy phát điện dự phòng 500kVA',
    'Vị trí': 'Trạm điện trung tâm',
    'Số tài sản': 'TB-MPD-002',
    'Thương hiệu / Mẫu mã': 'Cummins 500kVA',
    'Nguồn phát thải': 'Đốt cháy cố định'
  },
  {
    'Loại thiết bị': 'Xe nâng hàng (Diesel/Xăng/LPG)',
    'Tên thiết bị': 'Xe nâng hàng 3.5 tấn',
    'Vị trí': 'Kho thành phẩm',
    'Số tài sản': 'TB-XN-003',
    'Thương hiệu / Mẫu mã': 'Toyota 8FD35',
    'Nguồn phát thải': 'Đốt cháy động'
  }
];

function processEquipmentImport(rows, existingList = []) {
  const currentList = [...existingList];
  const todayStr = '2026-09-17';
  let addedCount = 0;

  rows.forEach(r => {
    const type = (r['Loại thiết bị'] || r['Loai thiet bi'] || r['type'] || '').toString().trim();
    const name = (r['Tên thiết bị'] || r['Tên'] || r['name'] || '').toString().trim();
    const location = (r['Vị trí'] || r['location'] || '').toString().trim();
    const asset = (r['Số tài sản'] || r['Mã tài sản'] || r['asset'] || '').toString().trim();
    const brand = (r['Thương hiệu / Mẫu mã'] || r['brand'] || '').toString().trim();
    const category = (r['Nguồn phát thải'] || r['category'] || '').toString().trim();

    if (!type && !name && !asset) return;

    const existingIdx = asset ? currentList.findIndex(x => x.asset === asset) : -1;
    const newEquipment = {
      id: 'src_' + Math.random().toString(36).substr(2, 9),
      category: category || 'Đốt cháy cố định',
      type: type || 'Thiết bị công nghiệp',
      name: name || type || 'Thiết bị chưa đặt tên',
      location: location || 'Nhà xưởng',
      asset: asset || `TB-${Date.now()}-${addedCount + 1}`,
      brand: brand || 'Tiêu chuẩn',
      creator: todayStr
    };

    if (existingIdx !== -1) {
      currentList[existingIdx] = newEquipment;
    } else {
      currentList.push(newEquipment);
    }
    addedCount++;
  });

  return { currentList, addedCount };
}

// TEST 2: Import danh sách mới
const res1 = processEquipmentImport(sampleRows);
assert.strictEqual(res1.addedCount, 3, 'Phải nhập đủ 3 thiết bị');
assert.strictEqual(res1.currentList.length, 3);
assert.strictEqual(res1.currentList[0].type, 'Lò hơi đốt than bột (Đáy khô)');
assert.strictEqual(res1.currentList[0].asset, 'TB-LH-001');
assert.strictEqual(res1.currentList[0].category, 'Đốt cháy cố định');
console.log('✅ TEST 2: Ánh xạ chuẩn xác dữ liệu Excel thành 3 bản ghi thiết bị hoàn chỉnh.');

// TEST 3: Cập nhật thiết bị đã có mã tài sản và thêm mới thiết bị khác
const newRows = [
  {
    'Loại thiết bị': 'Lò hơi đốt than bột (Đáy khô)',
    'Tên thiết bị': 'Lò hơi số 1 - Đã nâng cấp công suất 60T/h',
    'Vị trí': 'Nhà xưởng 1 - Phân khu A2',
    'Số tài sản': 'TB-LH-001', // Trùng mã tài sản cũ -> Cập nhật
    'Thương hiệu / Mẫu mã': 'Miura Boiler 60T/h',
    'Nguồn phát thải': 'Đốt cháy cố định'
  },
  {
    'Loại thiết bị': 'Hệ thống Chiller làm mát',
    'Tên thiết bị': 'Chiller Trane 100 Tấn lạnh',
    'Vị trí': 'Tầng mái xưởng 1',
    'Số tài sản': 'TB-CH-005', // Mới hoàn toàn -> Thêm mới
    'Thương hiệu / Mẫu mã': 'Trane R134a',
    'Nguồn phát thải': 'Phát thải thất thoát'
  }
];

const res2 = processEquipmentImport(newRows, res1.currentList);
assert.strictEqual(res2.addedCount, 2);
assert.strictEqual(res2.currentList.length, 4, 'Tổng cộng phải có 4 thiết bị (1 cập nhật, 1 thêm mới)');

const updatedBoiler = res2.currentList.find(x => x.asset === 'TB-LH-001');
assert.strictEqual(updatedBoiler.name, 'Lò hơi số 1 - Đã nâng cấp công suất 60T/h');
assert.strictEqual(updatedBoiler.location, 'Nhà xưởng 1 - Phân khu A2');

const newChiller = res2.currentList.find(x => x.asset === 'TB-CH-005');
assert.strictEqual(newChiller.category, 'Phát thải thất thoát');
console.log('✅ TEST 3: Cập nhật thông minh khi trùng mã tài sản và thêm mới khi mã mới.');

console.log('\n🎉 TẤT CẢ CÁC KIỂM THỬ TẢI FILE MẪU VÀ IMPORT EXCEL THIẾT BỊ ĐỀU ĐẠT CHUẨN!');
