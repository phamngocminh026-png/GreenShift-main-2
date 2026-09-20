const fs = require('fs');
const path = require('path');

global.window = {};
require('../assets/js/industry-catalog-16.js');

const c = global.window.INDUSTRY_16_CATALOG;
const results = [];
for (const [ind, eqs] of Object.entries(c)) {
  eqs.forEach(eq => {
    results.push({
      industry: ind,
      code: eq['Số tài sản'],
      name: eq['Tên thiết bị'],
      cat: eq['Nguồn phát thải'],
      fuel: eq['Loại năng lượng sử dụng (Điện / Nhiên liệu đốt)'],
      cap: eq['Công suất định mức'],
      unit: eq['Đơn vị công suất'],
      load: eq['Mức tải TB (%)'],
      hoursDay: eq['Giờ làm việc bình thường (h/ngày)'],
      daysWeek: eq['Số ngày chạy/tuần']
    });
  });
}

console.log('Total equipments:', results.length);
console.log('Unique units:', Array.from(new Set(results.map(r => r.unit))));

const timeBased = results.filter(r => (r.unit||'').includes('/năm') || (r.unit||'').includes('/tháng') || (r.unit||'').includes('/ngày'));
console.log('\n=== TIME-BASED UNITS (TOTAL: ' + timeBased.length + ') ===');

timeBased.forEach(r => {
  console.log(`[${r.industry}] ${r.code} (${r.name}): cap=${r.cap} ${r.unit}, fuel=${r.fuel}, cat=${r.cat}`);
});

const gensetsAndPumps = results.filter(r => (r.code||'').includes('GENSET') || (r.code||'').includes('FIRE-PUMP') || (r.name||'').toLowerCase().includes('phát điện') || (r.name||'').toLowerCase().includes('cứu hỏa'));
console.log('\n=== GENSETS & FIRE PUMPS (TOTAL: ' + gensetsAndPumps.length + ') ===');
gensetsAndPumps.forEach(r => {
  console.log(`[${r.industry}] ${r.code} (${r.name}): cap=${r.cap} ${r.unit}, fuel=${r.fuel}, hoursDay=${r.hoursDay}, daysWeek=${r.daysWeek}`);
});


const wastewater = results.filter(r => (r.cat||'').toLowerCase().includes('nước thải') || (r.fuel||'').toLowerCase().includes('nước thải') || (r.name||'').toLowerCase().includes('nước thải'));
console.log('\n=== WASTEWATER EQUIPMENTS (TOTAL: ' + wastewater.length + ') ===');
wastewater.forEach(r => {
  console.log(`[${r.industry}] ${r.code} (${r.name}): cap=${r.cap} ${r.unit}, fuel=${r.fuel}, cat=${r.cat}`);
});
