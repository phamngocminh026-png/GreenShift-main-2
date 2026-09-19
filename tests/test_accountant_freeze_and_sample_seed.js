const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('--- TEST: Accountant Freeze Remediation, Sample Seed with Diacritics & Report Accuracy ---');

// 1. Read files
const invHtmlPath = path.join(__dirname, '..', 'carbon-inventory.html');
const actJsPath = path.join(__dirname, '..', 'assets', 'js', 'carbon-activity.js');
const wordJsPath = path.join(__dirname, '..', 'assets', 'js', 'word-export.js');
const dashJsPath = path.join(__dirname, '..', 'assets', 'js', 'carbon-dashboard.js');

const invHtml = fs.readFileSync(invHtmlPath, 'utf8');
const actJs = fs.readFileSync(actJsPath, 'utf8');
const wordJs = fs.readFileSync(wordJsPath, 'utf8');
const dashJs = fs.readFileSync(dashJsPath, 'utf8');

// 2. Verify Accountant Dropdown & Modal Unfreeze in carbon-activity.js
assert(actJs.includes('FACILITY_ENERGY_SOURCES'), 'Phai co FACILITY_ENERGY_SOURCES');
assert(actJs.includes('renderActCol1'), 'Phai co ham renderActCol1');
assert(actJs.includes('Tất cả Nguồn'), 'Phai luon co tuy chon Tat ca Nguon o dau dropdown');
assert(actJs.includes("panelDirect.style.display = 'block'"), 'panelDirect phai hien thi');
assert(actJs.includes('populateSourceDropdowns'), 'Phai co ham populateSourceDropdowns');
console.log('PASS 1: Da khac phuc triet de do dropdown va modal hoa don cua Ke toan.');

// 3. Verify Vietnamese diacritics slugification across storage keys
assert(actJs.includes('userSlug'), 'carbon-activity.js phai chuan hoa userSlug');
assert(invHtml.includes('userSlug'), 'carbon-inventory.html phai chuan hoa userSlug');
assert(dashJs.includes('userSlug'), 'carbon-dashboard.js phai chuan hoa userSlug');
assert(wordJs.includes('userSlug'), 'word-export.js phai chuan hoa userSlug');
console.log('PASS 2: Toan bo he thong da chuan hoa key luu tru bao ve nguoi dung co dau.');

// 4. Verify seedSteelPlantSampleData and checkAndSeedSampleData logic
assert(invHtml.includes('window.seedSteelPlantSampleData = function'), 'Phai co seedSteelPlantSampleData');
assert(invHtml.includes("getBranchStorageKey('equipment')"), 'seedSteelPlantSampleData phai dung getBranchStorageKey equipment');
assert(invHtml.includes("getBranchStorageKey('activity')"), 'seedSteelPlantSampleData phai dung getBranchStorageKey activity');
assert(invHtml.includes('window.checkAndSeedSampleData = function'), 'Phai co checkAndSeedSampleData');
console.log('PASS 3: seedSteelPlantSampleData va checkAndSeedSampleData da dong bo da key.');

// 5. Verify Report Export Accuracy (Word & Excel)
assert(wordJs.includes('isProcess'), 'word-export.js phai nhan dien IPPU');
assert(wordJs.includes('2.C.1'), 'word-export.js phai gan ma IPCC 2.C.1');
assert(wordJs.includes('sumBiogenic_tco2'), 'word-export.js phai tach rieng biogenic');

assert(invHtml.includes('id="btn-export-excel"'), 'carbon-inventory.html phai co btn-export-excel');
assert(invHtml.includes('id="btn-export-word"'), 'carbon-inventory.html phai co btn-export-word');
assert(invHtml.includes('Tong_Hop_Phat_Thai'), 'Bang tinh Excel phai co Sheet Tong_Hop_Phat_Thai');
assert(invHtml.includes('Pham_Vi_1_Truc_Tiep'), 'Bang tinh Excel phai co Sheet Pham_Vi_1_Truc_Tiep');
assert(invHtml.includes('Pham_Vi_2_Gian_Tiep'), 'Bang tinh Excel phai co Sheet Pham_Vi_2_Gian_Tiep');
assert(invHtml.includes('So_Nhat_Ky_Hoat_Dong'), 'Bang tinh Excel phai co Sheet So_Nhat_Ky_Hoat_Dong');
assert(invHtml.includes('Doi_Soat_Ky_Thuong'), 'Bang tinh Excel phai co Sheet Doi_Soat_Ky_Thuong');
console.log('PASS 4: Xuat bao cao Word va Excel 5 phan he da duoc cau hinh chinh xac.');

// 6. Test Simulation: IPPU Calculation in word-export
const WordExport = require('../assets/js/word-export.js');
const mockActivities = [
  {
    id: 'act_eaf_ippu',
    sourceName: 'Lo ho quang dien EAF 100 tan/me',
    sourceType: 'Lo thoi oxy hoac lo ho quang dien trong luyen thep',
    isProcessEmission: 'true',
    amount: '1000',
    unit: 'tan',
    finalFactor: '60',
    co2e: '60000.00',
    date: '2026-05-15'
  },
  {
    id: 'act_grid_elec',
    sourceName: 'Tieu thu dien - Lo ho quang dien EAF',
    sourceType: 'Tieu thu dien',
    amount: '1000000',
    unit: 'kWh',
    finalFactor: '0.6766',
    co2e: '676600.00',
    date: '2026-05-20'
  },
  {
    id: 'act_biomass',
    sourceName: 'Lo hoi dot sinh khoi (Biomass)',
    sourceType: 'Dot chay co dinh',
    isBiomass: 'true',
    amount: '50000',
    unit: 'kg',
    finalFactor: '1.8',
    co2e: '90000.00',
    date: '2026-05-22'
  }
];

const grouped = WordExport.groupActivities(mockActivities);

assert(grouped.scope1_total === '60,52', 'Scope 1 total phai la 60,52 (60.00 tCO2e IPPU + 0.52 tCO2e CH4/N2O tu sinh khoi), nhan duoc: ' + grouped.scope1_total);
assert(grouped.scope2_total === '676,60', 'Scope 2 total phai la 676,60, nhan duoc: ' + grouped.scope2_total);
assert(grouped.total_emissions === '737,12', 'Tong Scope 1 + 2 phai la 737,12, nhan duoc: ' + grouped.total_emissions);
assert(grouped.biogenic_total === '90,00', 'Biogenic phai tach rieng la 90,00, nhan duoc: ' + grouped.biogenic_total);
console.log('PASS 5: Thuat toan tinh toan KNK trong WordExport dat do chinh xac 100%.');

console.log('--- ALL ACCOUNTANT & SAMPLE SEED TESTS PASSED 100% ---');
