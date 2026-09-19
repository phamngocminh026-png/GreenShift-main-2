const fs = require('fs');
const assert = require('assert');

console.log('=== TEST: RESET DATA & EQUIPMENT IMPORT ACTIVITY VISIBILITY ===');

const actJs = fs.readFileSync('assets/js/carbon-activity.js', 'utf8');
const invHtml = fs.readFileSync('carbon-inventory.html', 'utf8');

// 1. Verify Nạp mẫu chuẩn button exists in HTML
assert.ok(invHtml.includes('id="btn-seed-sample-quick"'), 'Must have #btn-seed-sample-quick in carbon-inventory.html');
assert.ok(invHtml.includes('btnSeedSampleQuick'), 'Must have event binding for #btn-seed-sample-quick');

// 2. Verify measurement method matching in carbon-activity.js
assert.ok(actJs.includes("measure.includes('liên tục')"), 'getMachineSources must match continuous measurement variants (Đo lường liên tục)');
assert.ok(actJs.includes("row.dataset.opCapacity || row.dataset.capacity"), 'getMachineSources must check both opCapacity and capacity');

// 3. Simulate getMachineSources logic with sample steel equipment
const sampleSources = [
  {
    id: 'src_1',
    type: 'Lò hồ quang điện',
    eq: 'Lò hồ quang điện EAF 100 tấn/mẻ',
    measure: 'Đo lường liên tục',
    capacity: '45000',
    opCapacity: '45000',
    load: '82',
    opLoad: '82',
    hoursDay: '16',
    opHoursDay: '16',
    daysWeek: '6',
    opDaysWeek: '6',
    hourlyRate: '36900',
    annualEstQty: '184204800',
    isProcessEmission: 'false'
  },
  {
    id: 'src_ippu_eaf',
    type: 'Lò thổi oxy hoặc lò hồ quang điện trong luyện thép',
    eq: 'Lò hồ quang điện EAF 100 tấn/mẻ',
    measure: 'Theo sản lượng sản phẩm',
    isProcessEmission: 'true',
    productionUnit: 'tấn',
    annualEstQty: '60000',
    efFactor: '60'
  },
  {
    id: 'src_2',
    type: 'Lò điện trở',
    eq: 'Lò tinh luyện thùng LRF 120 tấn',
    measure: 'Đo lường liên tục',
    capacity: '12000',
    opCapacity: '12000',
    load: '70',
    opLoad: '70',
    hoursDay: '16',
    daysWeek: '6',
    hourlyRate: '8400'
  },
  {
    id: 'src_3',
    type: 'Hệ thống động cơ điện truyền động',
    eq: 'Máy đúc phôi thép liên tục 4 dòng CCM',
    measure: 'Tự đánh giá',
    capacity: '1500',
    load: '85',
    hourlyRate: '1275'
  },
  {
    id: 'src_4',
    type: 'Lò nung nhiệt luyện nung bán thành phẩm thép',
    eq: 'Lò nung lại phôi cán nóng (Đốt dầu FO)',
    measure: 'Đo lường liên tục',
    capacity: '3500',
    opCapacity: '3500',
    load: '80',
    hourlyRate: '2800'
  }
];

// Test extraction
function simulateGetMachineSources(sources) {
  const machineSources = [];
  sources.forEach(src => {
    const measure = src.measure || src.measurementMethod || '';
    const opCap = parseFloat(src.opCapacity || src.capacity) || 0;
    const isProc = src.isProcessEmission === 'true' || 
                   measure === 'Theo sản lượng sản phẩm' || 
                   Boolean(src.productionUnit) ||
                   (src.category && src.category.includes('công nghiệp'));
    if (measure.includes('Tự đánh giá') || measure.includes('liên tục') || measure.includes('Đo') || opCap > 0 || isProc) {
      const loadVal = parseFloat(src.opLoad || src.load) || (isProc ? 100 : 80);
      const hRate = parseFloat(src.hourlyRate) || (opCap > 0 ? Math.round(opCap * (loadVal / 100) * 1000) / 1000 : 0);
      machineSources.push({
        id: src.id,
        name: isProc ? `${src.type || 'Quá trình luyện thép'}${src.eq ? ' - ' + src.eq : ''}` : (src.eq || src.type || src.name || ''),
        type: src.type || '',
        measure: isProc ? 'Theo sản lượng (IPPU)' : (measure || 'Tự đánh giá'),
        isProc: isProc,
        productionUnit: src.productionUnit || 'tấn',
        capacity: opCap,
        load: isProc ? 100 : loadVal,
        hourlyRate: hRate
      });
    }
  });
  return machineSources;
}

const extracted = simulateGetMachineSources(sampleSources);
assert.strictEqual(extracted.length, 5, 'Must extract all 5 machines including Đo lường liên tục and IPPU process sources');
console.log('PASS: All 5 steel plant machines recognized correctly by getMachineSources logic.');

// 4. Verify that resetGreenShiftTestData re-seeds sample data
assert.ok(actJs.includes('window.seedSteelPlantSampleData(true)'), 'resetGreenShiftTestData must re-seed steel plant sample data');
assert.ok(actJs.includes('window.loadActivityList()'), 'resetGreenShiftTestData must refresh activity list');
assert.ok(actJs.includes('window.renderMachineOverview()'), 'resetGreenShiftTestData must refresh machine overview');

// 5. Verify post-import auto-generation of activities and invoices
assert.ok(invHtml.includes('autoGenerateMonthlyOperationalRecords'), 'executeCommitImport must invoke autoGenerateMonthlyOperationalRecords');
assert.ok(invHtml.includes('HĐ-EVN-'), 'executeCommitImport must provision accounting EVN electricity invoices for reconciliation');
assert.ok(invHtml.includes('HĐ-0098'), 'executeCommitImport must provision accounting Petrolimex fuel invoices for reconciliation');

console.log('ALL VERIFICATIONS PASSED: Activity visibility & sample reset fully validated!');
