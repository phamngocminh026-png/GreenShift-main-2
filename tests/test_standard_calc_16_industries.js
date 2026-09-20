const fs = require('fs');
const path = require('path');

global.window = {};
require('../assets/js/industry-catalog-16.js');

const c = global.window.INDUSTRY_16_CATALOG;

function calculateEquipmentStandard(eq) {
  const cap = parseFloat(eq['Công suất định mức']) || 0;
  const unit = (eq['Đơn vị công suất'] || '').trim();
  const fuel = (eq['Loại năng lượng sử dụng (Điện / Nhiên liệu đốt)'] || '').trim();
  const cat = (eq['Nguồn phát thải'] || '').trim();
  const load = (parseFloat(eq['Mức tải TB (%)']) || 80) / 100;
  const hoursDay = parseFloat(eq['Giờ làm việc bình thường (h/ngày)']) || 16;
  const daysWeek = parseFloat(eq['Số ngày chạy/tuần']) || 6;
  const type = (eq['Loại thiết bị'] || '').trim();
  const name = (eq['Tên thiết bị'] || '').trim();
  const code = (eq['Số tài sản'] || '').trim();

  const isFugitive = cat.includes('rò rỉ') || cat.includes('thất thoát') || fuel.includes('R-') || fuel.includes('HFC') || type.toLowerCase().includes('chiller') || name.toLowerCase().includes('kho lạnh');
  const isWastewater = cat.includes('nước thải') || cat.includes('chất thải') || fuel.includes('nước thải') || unit.includes('m3/ngày');
  const isElectric = cat.includes('Điện') || cat.includes('điện') || fuel.includes('Điện');

  let hourlyRate = 0;
  let annualQty = 0;
  let efFactor = 0.6766;
  let qtyUnit = unit;

  if (isFugitive) {
    hourlyRate = 0;
    qtyUnit = 'kg';
    let leakRate = 0.03; // Default 3% / year
    if (name.toLowerCase().includes('chữa cháy') || name.toLowerCase().includes('pccc') || fuel.includes('HFC-227ea') || fuel.includes('FM200') || fuel.includes('CO2')) {
      leakRate = 0.02; // 2% for fire suppression
    } else if (code.includes('REEFER')) {
      leakRate = 0.05; // 5% for reefer transport
    }

    if (fuel.includes('R-410A')) efFactor = 2088;
    else if (fuel.includes('R-134a')) efFactor = 1430;
    else if (fuel.includes('R-404A')) efFactor = 3922;
    else if (fuel.includes('HFC-227ea')) efFactor = 3220;
    else if (fuel.includes('CO2')) efFactor = 1.0;
    else if (fuel.includes('NH3') || fuel.includes('R-717') || fuel.includes('Amoniac')) efFactor = 0; // Ammonia GWP = 0
    else efFactor = 2088;

    annualQty = Math.round(cap * leakRate * 100) / 100;
  } else if (unit.includes('/năm')) {
    // Annual quota (mobile combustion, vehicles)
    annualQty = Math.round(cap * load);
    const annualDays = Math.min(312, Math.round(daysWeek * 52));
    const dailyQty = annualQty / (annualDays || 300);
    hourlyRate = Math.round((dailyQty / (hoursDay || 8)) * 100) / 100;
    qtyUnit = unit.replace('/năm', '').trim();
    if (fuel.includes('Diesel') || fuel.includes('DO')) efFactor = 2.6853;
    else if (fuel.includes('Xăng')) efFactor = 2.27;
  } else if (unit.includes('/tháng')) {
    // Monthly quota (canteen gas, etc.)
    annualQty = Math.round(cap * 12 * load);
    const annualDays = Math.min(312, Math.round(daysWeek * 52));
    const dailyQty = annualQty / (annualDays || 300);
    hourlyRate = Math.round((dailyQty / (hoursDay || 8)) * 100) / 100;
    qtyUnit = unit.replace('/tháng', '').trim();
    if (fuel.includes('LPG')) efFactor = 1.61;
  } else if (isWastewater) {
    // Wastewater in m3/day
    const dailyQty = Math.round(cap * load * 100) / 100;
    hourlyRate = Math.round((dailyQty / 24) * 100) / 100;
    const annualDays = 300; // standard working days for WWTP
    annualQty = Math.round(dailyQty * annualDays);
    qtyUnit = 'm3';
    efFactor = 0.42; // standard wastewater kgCO2e/m3
  } else if (unit === 'kW' && (fuel.includes('Diesel') || fuel.includes('DO'))) {
    // Standby diesel generator or diesel fire pump rated in kW
    // BSFC = 0.25 L/kWh
    const electricKwhPerHour = cap * load;
    hourlyRate = Math.round(electricKwhPerHour * 0.25 * 100) / 100;
    annualQty = Math.round(hourlyRate * hoursDay * daysWeek * 52);
    qtyUnit = 'lít';
    efFactor = 2.6853;
  } else {
    // Standard hourly equipment (kW for electric, kg/h or lít/h or Nm3/h for fuel)
    hourlyRate = Math.round(cap * load * 100) / 100;
    annualQty = Math.round(hourlyRate * hoursDay * daysWeek * 52);
    if (isElectric) {
      qtyUnit = 'kWh';
      efFactor = 0.6766;
    } else if (fuel.includes('Diesel') || fuel.includes('DO')) {
      qtyUnit = 'lít';
      efFactor = 2.6853;
    } else if (fuel.includes('FO') || fuel.includes('Fuel Oil')) {
      qtyUnit = 'kg';
      efFactor = 3.127;
    } else if (fuel.includes('Than')) {
      qtyUnit = 'kg';
      efFactor = 2.45;
    } else if (fuel.includes('LPG')) {
      qtyUnit = 'kg';
      efFactor = 1.61;
    } else if (fuel.includes('LNG') || fuel.includes('Khí tự nhiên')) {
      qtyUnit = 'Nm3';
      efFactor = 2.16;
    } else if (fuel.includes('Biogas') || fuel.includes('sinh học')) {
      qtyUnit = 'Nm3';
      efFactor = 0.05; // Biogenic
    }
  }

  const annualEmissions = Math.round((annualQty * efFactor / 1000) * 100) / 100;

  return {
    hourlyRate,
    annualQty,
    qtyUnit,
    efFactor,
    annualEmissions
  };
}

let grandTotalEmissions = 0;
let anomalousCount = 0;

for (const [ind, eqs] of Object.entries(c)) {
  console.log(`\n=== INDUSTRY: ${ind} (${eqs.length} equipments) ===`);
  let indEmissions = 0;
  eqs.forEach(eq => {
    const res = calculateEquipmentStandard(eq);
    indEmissions += res.annualEmissions;
    if (res.annualEmissions > 50000) {
      console.log(`  [HIGH] ${eq['Số tài sản']} (${eq['Tên thiết bị']}): cap=${eq['Công suất định mức']} ${eq['Đơn vị công suất']} -> annualQty=${res.annualQty} ${res.qtyUnit}, tCO2e=${res.annualEmissions}`);
    }
  });
  console.log(`  Total estimated Scope 1 & 2 for sample plant in ${ind}: ${Math.round(indEmissions).toLocaleString('vi-VN')} tCO2e/year`);
  grandTotalEmissions += indEmissions;
}

console.log('\nAll 16 industries simulated successfully!');
