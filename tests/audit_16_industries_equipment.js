const fs = require('fs');
const path = require('path');

// Mock window
global.window = {};
require('../assets/js/industry-catalog-16.js');

const catalog = global.window.INDUSTRY_16_CATALOG;
console.log('Total industries:', Object.keys(catalog).length);

const categories = new Set();
const fuels = new Set();
const units = new Set();
const fugitiveEqs = [];
const fuelEqs = [];
const elecEqs = [];
const processEqs = [];
const otherEqs = [];

let totalCount = 0;

Object.entries(catalog).forEach(([ind, eqs]) => {
  eqs.forEach(eq => {
    totalCount++;
    const cat = eq['Nguồn phát thải'] || '';
    const fuel = eq['Loại năng lượng sử dụng (Điện / Nhiên liệu đốt)'] || '';
    const unit = eq['Đơn vị công suất'] || '';
    const cap = eq['Công suất định mức'];
    const type = eq['Loại thiết bị'] || '';
    const name = eq['Tên thiết bị'] || '';

    categories.add(cat);
    fuels.add(fuel);
    units.add(unit);

    const item = { ind, cat, fuel, unit, cap, type, name, asset: eq['Số tài sản'] };

    if (cat.includes('thất thoát') || cat.includes('rò rỉ') || type.toLowerCase().includes('chiller') || fuel.includes('R-') || fuel.includes('HFC')) {
      fugitiveEqs.push(item);
    } else if (cat.includes('Đốt cháy cố định') || cat.includes('Đốt cháy động') || cat.includes('Đốt')) {
      fuelEqs.push(item);
    } else if (cat.includes('Tiêu thụ điện') || cat.includes('Điện')) {
      elecEqs.push(item);
    } else if (cat.includes('công nghệ') || cat.includes('Quá trình')) {
      processEqs.push(item);
    } else {
      otherEqs.push(item);
    }
  });
});

console.log('Total equipments:', totalCount);
console.log('\nCategories:', Array.from(categories));
console.log('\nPower/Capacity Units:', Array.from(units));
console.log('\nFugitive equipments count:', fugitiveEqs.length);
console.log('Fuel burning equipments count:', fuelEqs.length);
console.log('Electricity equipments count:', elecEqs.length);
console.log('Process (IPPU) equipments count:', processEqs.length);
console.log('Other equipments count:', otherEqs.length);

console.log('\n=== ALL FUGITIVE EQUIPMENTS ===');
fugitiveEqs.forEach(eq => {
  console.log(`[${eq.ind}] ${eq.name} (${eq.asset}): cat="${eq.cat}", fuel="${eq.fuel}", cap=${eq.cap} ${eq.unit}`);
});

console.log('\n=== SAMPLE FUEL EQUIPMENTS (First 15) ===');
fuelEqs.slice(0, 15).forEach(eq => {
  console.log(`[${eq.ind}] ${eq.name} (${eq.asset}): cat="${eq.cat}", fuel="${eq.fuel}", cap=${eq.cap} ${eq.unit}`);
});

console.log('\n=== ALL PROCESS EQUIPMENTS ===');
processEqs.forEach(eq => {
  console.log(`[${eq.ind}] ${eq.name} (${eq.asset}): cat="${eq.cat}", fuel="${eq.fuel}", cap=${eq.cap} ${eq.unit}`);
});

console.log('\n=== ALL OTHER EQUIPMENTS ===');
otherEqs.forEach(eq => {
  console.log(`[${eq.ind}] ${eq.name} (${eq.asset}): cat="${eq.cat}", fuel="${eq.fuel}", cap=${eq.cap} ${eq.unit}`);
});
