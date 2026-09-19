/**
 * GreenShift v2.3
 * GHG Calculation Engine
 *
 * Main emission factors:
 *   - EF_MASTER.VN
 *   - EF_MASTER.INTL
 *   - EF_MASTER.CALC
 *
 * PDF requirements:
 *   - Type 1: Direct emissions
 *   - Type 2: Purchased energy
 *   - Type 3: Transport
 *   - Type 4: Purchased products/services
 *   - Type 5: Use/end-of-life of sold products
 *   - Type 6: Other indirect emissions
 */

const Calculator = {

  // // =========================================================
  // HELPERS
  // // =========================================================

  num(value, allowNegative = false) {
    const n = parseFloat(value);
    if (!Number.isFinite(n)) return 0;
    return allowNegative ? n : (n < 0 ? 0 : n);
  },

  round(value, digits = 4) {
    return Number(Number(value || 0).toFixed(digits));
  },

  addBreakdown(arr, item) {
    if (item && item.emission > 0) {
      arr.push(item);
    }
  },

  addCategory(byCat, category, emission) {
    if (!emission || emission <= 0) return;
    byCat[category] = (byCat[category] || 0) + emission;
  },

  // // =========================================================
  // SCOPE 1
  // // =========================================================

  calcScope1(inputs, companyData = {}) {

    let total = 0;
    const breakdown = [];

    // Resolve GWP based on company IPCC AR configuration
    const arVer = (companyData && (companyData.ipccAR || companyData.arVersion)) ? (companyData.ipccAR || companyData.arVersion) : 'AR5';
    const getGwpVal = (gas) => (EF_MASTER.CALC && EF_MASTER.CALC.getGWP ? EF_MASTER.CALC.getGWP(gas, arVer) : (EF_MASTER.INTL.gwp[gas] || 1));

    // -------------------------------------------------------
    // 1. Fixed combustion
    // -------------------------------------------------------

    const fuels = EF_MASTER.VN.fuels || {};

    Object.entries(fuels).forEach(([fuelId, fuel]) => {

      const quantity = this.num(inputs[`s1_${fuelId}`]);

      if (quantity <= 0) return;

      const emission =
        this.num(
          EF_MASTER.CALC.calculateScope1Fuel(fuelId, quantity)
        );

      total += emission;

      this.addBreakdown(breakdown, {
        source: fuel.name,
        quantity,
        unit: fuel.unit,
        emission,
        scope: 1,
        sourceGroup: 'Đốt nhiên liệu cố định'
      });

    });

    // -------------------------------------------------------
    // 2. Mobile combustion
    //
    // PDF requires:
    // road vehicles, ships, rail, aircraft,
    // forklifts and non-road equipment.
    //
    // If no dedicated factor exists in EF_MASTER,
    // allow user to enter calculated tCO2e directly.
    // -------------------------------------------------------

    const mobileEmission = this.num(inputs.s1_mobile_direct_tco2e);

    if (mobileEmission > 0) {

      total += mobileEmission;

      this.addBreakdown(breakdown, {
        source: 'Đốt nhiên liệu di động',
        quantity: mobileEmission,
        unit: 'tCO₂e nhập trực tiếp',
        emission: mobileEmission,
        scope: 1,
        sourceGroup: 'Đốt nhiên liệu di động'
      });

    }

    // -------------------------------------------------------
    // 3. Fugitive refrigerants
    // -------------------------------------------------------

    const refrigerants =
      EF_MASTER.INTL.refrigerants || {};

    Object.entries(refrigerants).forEach(([gasId, gas]) => {

      const quantity =
        this.num(inputs[`s1_${gasId}`]);

      if (quantity <= 0) return;

      const dynamicGwp = getGwpVal(gasId) || this.num(gas.gwp);
      const emission =
        (quantity * dynamicGwp) / 1000;

      total += emission;

      this.addBreakdown(breakdown, {
        source: gas.name,
        quantity,
        unit: gas.unit || 'kg',
        emission,
        scope: 1,
        sourceGroup: 'Phát thải rò rỉ'
      });

    });

    // -------------------------------------------------------
    // SF6
    // -------------------------------------------------------

    const sf6Kg = this.num(inputs.s1_sf6);

    if (sf6Kg > 0) {

      const gwp = this.num(
        getGwpVal('SF6')
      );

      const emission = (sf6Kg * gwp) / 1000;

      total += emission;

      this.addBreakdown(breakdown, {
        source: 'SF6 - thiết bị điện cao áp/GIS',
        quantity: sf6Kg,
        unit: 'kg SF6',
        emission,
        scope: 1,
        sourceGroup: 'Phát thải rò rỉ'
      });

    }

    // -------------------------------------------------------
    // FM-200
    // -------------------------------------------------------

    const fm200Kg = this.num(inputs.s1_fm200);

    if (fm200Kg > 0) {

      const gwp = this.num(
        getGwpVal('FM200')
      );

      const emission = (fm200Kg * gwp) / 1000;

      total += emission;

      this.addBreakdown(breakdown, {
        source: 'FM-200 / HFC-227ea - PCCC',
        quantity: fm200Kg,
        unit: 'kg',
        emission,
        scope: 1,
        sourceGroup: 'Phát thải rò rỉ'
      });

    }

    // -------------------------------------------------------
    // CO2 PCCC
    // -------------------------------------------------------

    const co2Used = this.num(inputs.s1_co2_pccc_used);
    const co2Cap = this.num(inputs.s1_co2_pccc_capacity);
    // Phương pháp cân bằng khối lượng (IPCC Tier 1 Mass Balance):
    // Ưu tiên sử dụng lượng CO2 nạp bổ sung thực tế trong năm (co2Used).
    // Nếu không có số liệu nạp bổ sung mà chỉ có dung tích lắp đặt, ước tính tỷ lệ rò rỉ 5%/năm.
    const FUGITIVE_LEAK_RATE_PCCC = 0.05;
    const co2Total = co2Used > 0 ? co2Used : (co2Cap * FUGITIVE_LEAK_RATE_PCCC);

    if (co2Total > 0) {
      const emission = co2Total / 1000; // tCO2e (GWP = 1)
      total += emission;
      this.addBreakdown(breakdown, {
        source: 'Bình chữa cháy CO2',
        quantity: co2Total,
        unit: 'kg',
        emission,
        scope: 1,
        sourceGroup: 'Phát thải rò rỉ'
      });
    }

    // -------------------------------------------------------
    // Wastewater (TOW)
    // -------------------------------------------------------

    const wwTow = this.num(inputs.s1_ww_tow);
    if (wwTow > 0) {
      // Công thức IPCC 2006/2019: CH4 = [(TOW - S) * EF] - R
      const wwS = this.num(inputs.s1_ww_s); // Lượng bùn thải (S)
      const wwR = this.num(inputs.s1_ww_r); // Mê-tan thu hồi (R)
      
      // Ánh xạ MCF theo loại công trình xử lý nước thải
      let mcf = 0.3;
      const treatStr = String(companyData.wwTreatment || '').toLowerCase();
      if (treatStr.includes('hiếu khí') || treatStr.includes('aerotank')) mcf = 0.0;
      else if (treatStr.includes('kỵ khí') || treatStr.includes('biogas') || treatStr.includes('uasb')) mcf = 0.8;
      else if (treatStr.includes('tự hoại') || treatStr.includes('septic')) mcf = 0.3;
      else if (treatStr.includes('hồ sinh học') || treatStr.includes('lagoon')) mcf = 0.2;
      else if (this.num(companyData.wwTreatment) > 0) mcf = this.num(companyData.wwTreatment);

      // Phân biệt nước thải sinh hoạt (BOD, B0 = 0.6) và công nghiệp (COD, B0 = 0.25)
      const isIndustrialWW = treatStr.includes('công nghiệp') || String(inputs.s1_ww_unit || '').toLowerCase().includes('cod');
      const b0 = isIndustrialWW ? 0.25 : 0.6;
      const ef_ww = b0 * mcf; // EF = B0 * MCF
      
      let ch4Emission = ((wwTow - wwS) * ef_ww) - wwR;
      if (ch4Emission < 0) ch4Emission = 0;

      const gwp_ch4 = getGwpVal('CH4') || ((companyData && companyData.ipccAR === 'AR6-100') ? 27.9 : 28);
      const emission = (ch4Emission * gwp_ch4) / 1000; // tCO2e
      
      total += emission;
      this.addBreakdown(breakdown, {
        source: `Xử lý nước thải ${isIndustrialWW ? 'công nghiệp (COD)' : 'sinh hoạt (BOD)'} (MCF=${mcf})`,
        quantity: wwTow,
        unit: isIndustrialWW ? 'kg COD' : 'kg BOD',
        emission,
        scope: 1,
        sourceGroup: 'Xử lý chất thải'
      });
    }

    // -------------------------------------------------------
    // 4. Industrial process
    // -------------------------------------------------------

    const processes =
      EF_MASTER.VN.industrial_processes || {};

    Object.entries(processes).forEach(([processId, process]) => {

      const quantity =
        this.num(inputs[`s1_process_${processId}`]);

      if (quantity <= 0) return;

      let emission = 0;

      /*
       * The EF_MASTER contains mixed units:
       * tCO2/tấn, kgN2O/tấn, etc.
       *
       * For tCO2/tấn:
       */
      if (
        process.unit &&
        process.unit.startsWith('tCO2')
      ) {
        emission = quantity * process.factor;
      }

      /*
       * For kgN2O/tấn HNO3:
       * convert N2O → CO2e using GWP.
       */
      else if (
        process.unit &&
        process.unit.includes('kgN2O')
      ) {

        const n2oKg =
          quantity * process.factor;

        emission =
          (n2oKg *
            this.num(getGwpVal('N2O'))) /
          1000;

      }

      if (emission <= 0) return;

      total += emission;

      this.addBreakdown(breakdown, {
        source: process.name,
        quantity,
        unit: process.unit,
        emission,
        scope: 1,
        sourceGroup: 'Quá trình công nghiệp'
      });

    });

    // -------------------------------------------------------
    // 5. Agriculture / LULUCF
    // -------------------------------------------------------

    const agriculture =
      EF_MASTER.VN.agriculture || {};

    Object.entries(agriculture).forEach(([id, item]) => {

      const quantity =
        this.num(inputs[`s1_agri_${id}`]);

      if (quantity <= 0) return;

      /*
       * These factors are provided as CH4 or N2O.
       * Convert to CO2e where appropriate.
       */

      let emission = 0;

      if (
        item.unit &&
        item.unit.includes('kgCH4')
      ) {

        const ch4Kg =
          quantity * item.factor;

        emission =
          (ch4Kg *
            this.num(getGwpVal('CH4'))) /
          1000;

      } else if (
        item.unit &&
        item.unit.includes('kgN2O-N')
      ) {

        const n2oN =
          quantity * item.factor;

        const n2o =
          n2oN * (44 / 28);

        emission =
          (n2o *
            this.num(getGwpVal('N2O'))) /
          1000;
      }

      if (emission <= 0) return;

      total += emission;

      this.addBreakdown(breakdown, {
        source: item.name,
        quantity,
        unit: item.unit,
        emission,
        scope: 1,
        sourceGroup: 'Nông nghiệp'
      });

    });

    // -------------------------------------------------------
    // LULUCF
    //
    // PDF requires:
    // - biological absorption/emission
    // - organizational plantation forests
    // - artificial wetlands
    //
    // No dedicated EF is supplied in EF_MASTER,
    // therefore these are entered as calculated tCO2e.
    // -------------------------------------------------------

    const lulucf = this.num(
      inputs.s1_lulucf_tco2e
    );

    if (lulucf !== 0) {

      total += lulucf;

      breakdown.push({
        source: 'LULUCF',
        quantity: Math.abs(lulucf),
        unit: 'tCO₂e',
        emission: lulucf,
        scope: 1,
        sourceGroup:
          'Sử dụng đất, thay đổi sử dụng đất và lâm nghiệp'
      });

    }

    return {
      total: this.round(total),
      breakdown
    };
  },

  // // =========================================================
  // SCOPE 2
  // // =========================================================

  calcScope2(inputs) {

    let total = 0;
    const breakdown = [];

    // -------------------------------------------------------
    // Purchased electricity
    // -------------------------------------------------------

    const kwh =
      this.num(inputs.s2_grid_kwh);

    const efYear =
      inputs.s2_ef_year ||
      'grid_kwh';

    let electricityEF =
      EF_MASTER.VN.electricity[efYear];

    /*
     * Support old values or fallbacks used by the application.
     */
    if (!electricityEF) {
      if (efYear === 'vietnam_grid_2023') {
        electricityEF = {
          factor: 0.6592,
          unit: 'kgCO2e/kWh',
          name: 'Điện lưới Việt Nam (2023)'
        };
      } else if (efYear === 'vietnam_grid_2022' || efYear === 'qd_2626') {
        electricityEF = {
          factor: 0.6766,
          unit: 'kgCO2e/kWh',
          name: 'Điện lưới Việt Nam (QĐ 2626/QĐ-BTNMT)'
        };
      } else if (EF_MASTER?.VN?.electricity?.grid_kwh) {
        electricityEF = EF_MASTER.VN.electricity.grid_kwh;
      } else {
        electricityEF = {
          factor: 0.6766,
          unit: 'kgCO2e/kWh',
          name: 'Điện lưới Việt Nam (QĐ 2626/QĐ-BTNMT)'
        };
      }
    }

    if (kwh > 0 && electricityEF) {

      const factor =
        this.num(electricityEF.factor);

      const emission =
        (kwh * factor) / 1000;

      total += emission;

      breakdown.push({
        source:
          electricityEF.name ||
          'Điện lưới mua vào',
        quantity: kwh,
        unit: 'kWh',
        emission,
        scope: 2,
        sourceGroup: 'Điện mua vào',
        ef: factor
      });

    }

    // -------------------------------------------------------
    // Purchased steam / heat / cooling
    // -------------------------------------------------------

    const steam =
      this.num(inputs.s2_steam_kg);

    const steamType =
      inputs.s2_steam_type ||
      'coal_fired';

    const steamEF =
      EF_MASTER.INTL.purchased_steam?.[steamType];

    if (steam > 0 && steamEF) {

      const emission =
        (steam * this.num(steamEF.factor)) /
        1000;

      total += emission;

      breakdown.push({
        source: steamEF.name,
        quantity: steam,
        unit: 'kg hơi',
        emission,
        scope: 2,
        sourceGroup:
          'Năng lượng nhiệt/hơi/làm mát mua ngoài'
      });

    }

    // Market-based Scope 2 calculation
    const recKwh = this.num(inputs.s2_rec_kwh || inputs.s2_irec_kwh);
    const ppaKwh = this.num(inputs.s2_ppa_kwh || inputs.s2_dppa_kwh);
    const greenKwh = Math.min(kwh, recKwh + ppaKwh);
    const remainingKwh = Math.max(0, kwh - greenKwh);
    const residualFactor = this.num(inputs.s2_residual_mix_ef || (electricityEF ? electricityEF.factor : 0.6766));
    const greenFactor = this.num(inputs.s2_green_ef || 0);
    const marketElecEm = ((remainingKwh * residualFactor) + (greenKwh * greenFactor)) / 1000;
    const steamEm = (steam > 0 && steamEF) ? (steam * this.num(steamEF.factor)) / 1000 : 0;
    const marketTotal = marketElecEm + steamEm;

    return {
      total: this.round(total),
      locationBased: this.round(total),
      marketBased: this.round(marketTotal),
      breakdown
    };
  },

  // // =========================================================
  // SCOPE 3
  // // =========================================================

  calcScope3(inputs, companyData = {}) {

    let total = 0;

    const breakdown = [];

    const byCat = {};

    const arVer = (companyData && (companyData.ipccAR || companyData.arVersion)) ? (companyData.ipccAR || companyData.arVersion) : 'AR5';
    const getGwpVal = (gas) => (EF_MASTER.CALC && EF_MASTER.CALC.getGWP ? EF_MASTER.CALC.getGWP(gas, arVer) : (EF_MASTER.INTL.gwp[gas] || 1));

    // -------------------------------------------------------
    // Cat.1 Purchased goods/services
    // -------------------------------------------------------

    const materials =
      EF_MASTER.INTL.raw_materials || {};

    Object.entries(materials).forEach(
      ([id, material]) => {

        const qty =
          this.num(inputs[`s3c1_${id}`]);

        if (qty <= 0) return;

        const emission =
          (qty * this.num(material.factor)) /
          1000;

        total += emission;

        this.addCategory(byCat, 1, emission);

        breakdown.push({
          source: material.name,
          category: 1,
          quantity: qty,
          unit: material.unit,
          emission
        });

      }
    );

    // Spend-based fallback / EEIO method cho Cat.1
    const spendVnd = this.num(inputs.s3c1_spend_million_vnd || inputs.s3c1_spend_amount);
    const spendEf = this.num(inputs.s3c1_spend_ef || 0.45); // ~0.45 tCO2e / trieu VND
    if (spendVnd > 0 && spendEf > 0) {
      const spendEmission = spendVnd * spendEf;
      total += spendEmission;
      this.addCategory(byCat, 1, spendEmission);
      breakdown.push({
        source: 'Hàng hóa mua vào (Dựa trên chi tiêu EEIO)',
        category: 1,
        quantity: spendVnd,
        unit: 'Triệu VNĐ',
        emission: this.round(spendEmission)
      });
    }

    total += this.addDirectCategory(
      inputs,
      breakdown,
      byCat,
      1,
      's3c1_direct_tco2e',
      'Hàng hóa và dịch vụ mua vào'
    );

    // -------------------------------------------------------
    // Cat.2 Capital goods
    //
    // PDF identifies capital equipment purchased.
    // No dedicated EF is supplied in EF_MASTER.
    // Therefore user enters calculated tCO2e.
    // -------------------------------------------------------

    total += this.addActivityOrDirectCategory(
      inputs,
      breakdown,
      byCat,
      2,
      'Hàng hóa vốn mua vào'
    );

    // -------------------------------------------------------
    // Cat.3 Fuel & energy related activities (T&D Losses & WTT Fuels)
    // -------------------------------------------------------

    const cat3Factors = EF_MASTER.INTL.fuel_energy_activities_cat3 || {};
    const tdFactor = cat3Factors.evn_grid_td_loss?.factor || 0.0406;
    const gridKwhCat3 = this.num(inputs.s3c3_grid_kwh || inputs.s3c3_electricity_kwh || inputs.s2_grid_kwh || 0);
    if (gridKwhCat3 > 0) {
      const tdEm = (gridKwhCat3 * tdFactor) / 1000;
      total += tdEm;
      this.addCategory(byCat, 3, tdEm);
      breakdown.push({
        source: 'Tổn thất truyền tải & phân phối điện lưới EVN (Scope 3 Cat.3)',
        category: 3,
        quantity: gridKwhCat3,
        unit: 'kWh',
        emission: tdEm
      });
    }

    const wttDieselQty = this.num(inputs.s3c3_diesel_liters);
    if (wttDieselQty > 0) {
      const wttEm = (wttDieselQty * (cat3Factors.wtt_diesel?.factor || 0.608)) / 1000;
      total += wttEm;
      this.addCategory(byCat, 3, wttEm);
      breakdown.push({
        source: 'WTT Khai thác & chế biến Dầu Diesel (Cat.3)',
        category: 3,
        quantity: wttDieselQty,
        unit: 'lít',
        emission: wttEm
      });
    }

    const wttPetrolQty = this.num(inputs.s3c3_petrol_liters);
    if (wttPetrolQty > 0) {
      const wttEm = (wttPetrolQty * (cat3Factors.wtt_petrol?.factor || 0.584)) / 1000;
      total += wttEm;
      this.addCategory(byCat, 3, wttEm);
      breakdown.push({
        source: 'WTT Khai thác & chế biến Xăng (Cat.3)',
        category: 3,
        quantity: wttPetrolQty,
        unit: 'lít',
        emission: wttEm
      });
    }

    const wttCoalQty = this.num(inputs.s3c3_coal_kg);
    if (wttCoalQty > 0) {
      const wttEm = (wttCoalQty * (cat3Factors.wtt_coal?.factor || 0.350)) / 1000;
      total += wttEm;
      this.addCategory(byCat, 3, wttEm);
      breakdown.push({
        source: 'WTT Khai thác & vận chuyển Than đá (Cat.3)',
        category: 3,
        quantity: wttCoalQty,
        unit: 'kg',
        emission: wttEm
      });
    }

    total += this.addActivityOrDirectCategory(
      inputs,
      breakdown,
      byCat,
      3,
      'Hoạt động liên quan nhiên liệu và năng lượng'
    );

    // -------------------------------------------------------
    // Cat.4 Upstream transport
    // -------------------------------------------------------

    total += this.calculateTransportCategory(
      inputs,
      breakdown,
      byCat,
      4,
      's3c4'
    );

    // -------------------------------------------------------
    // Cat.5 Waste
    // -------------------------------------------------------

    const waste =
      (EF_MASTER.VN && EF_MASTER.VN.waste_and_wastewater) ||
      EF_MASTER.INTL.waste_and_wastewater ||
      {};

    const wasteMappings = [
      [
        's3c5_composting_kg',
        'composting_ch4',
        'Ủ phân compost'
      ],
      [
        's3c5_open_burning_ton',
        'open_burning_ch4',
        'Đốt rác lộ thiên'
      ]
    ];

    wasteMappings.forEach(
      ([inputId, factorId, label]) => {

        const qty =
          this.num(inputs[inputId]);

        const factor =
          waste[factorId];

        if (qty <= 0 || !factor) return;

        const ch4 =
          qty * factor.factor;

        const emission =
          (ch4 *
            this.num(getGwpVal('CH4'))) /
          1000;

        total += emission;

        this.addCategory(
          byCat,
          5,
          emission
        );

        breakdown.push({
          source: label,
          category: 5,
          quantity: qty,
          unit: factor.unit,
          emission
        });

      }
    );

    total += this.addDirectCategory(
      inputs,
      breakdown,
      byCat,
      5,
      's3c5_direct_tco2e',
      'Xử lý chất thải'
    );

    // -------------------------------------------------------
    // Cat.6 Business travel
    // -------------------------------------------------------

    const logistics =
      EF_MASTER.INTL.logistics || {};

    const domesticFlight =
      this.num(inputs.s3c6_domestic_flight);

    if (domesticFlight > 0) {

      const ef =
        logistics.domestic_flight.factor;

      const emission =
        (domesticFlight * ef) / 1000;

      total += emission;

      this.addCategory(byCat, 6, emission);

      breakdown.push({
        source: 'Bay công tác nội địa',
        category: 6,
        quantity: domesticFlight,
        unit: 'hành khách.km',
        emission
      });

    }

    const intlFlight =
      this.num(inputs.s3c6_international_flight);

    if (intlFlight > 0) {

      const ef =
        logistics.international_flight.factor;

      const emission =
        (intlFlight * ef) / 1000;

      total += emission;

      this.addCategory(byCat, 6, emission);

      breakdown.push({
        source: 'Bay công tác quốc tế',
        category: 6,
        quantity: intlFlight,
        unit: 'hành khách.km',
        emission
      });

    }

    const carTravel =
      this.num(inputs.s3c6_passenger_car);

    if (carTravel > 0) {

      const ef =
        logistics.passenger_car.factor;

      const emission =
        (carTravel * ef) / 1000;

      total += emission;

      this.addCategory(byCat, 6, emission);

      breakdown.push({
        source: 'Ô tô / Taxi / Grab công tác',
        category: 6,
        quantity: carTravel,
        unit: 'km',
        emission
      });

    }

    // -------------------------------------------------------
    // Cat.7 Employee commuting
    // -------------------------------------------------------

    const commuting =
      this.num(inputs.s3c7_commuting_km);

    if (commuting > 0) {

      const ef =
        this.num(
          inputs.s3c7_commuting_ef ||
          0.170
        );

      const emission =
        (commuting * ef) / 1000;

      total += emission;

      this.addCategory(byCat, 7, emission);

      breakdown.push({
        source:
          'Đi lại hàng ngày của nhân viên',
        category: 7,
        quantity: commuting,
        unit: 'km',
        emission
      });

    }

    // -------------------------------------------------------
    // Cat.8 Leased assets
    // -------------------------------------------------------

    total += this.addActivityOrDirectCategory(
      inputs,
      breakdown,
      byCat,
      8,
      'Tài sản thuê'
    );

    // -------------------------------------------------------
    // Cat.9 Downstream transport
    // -------------------------------------------------------

    total += this.calculateTransportCategory(
      inputs,
      breakdown,
      byCat,
      9,
      's3c9'
    );

    // -------------------------------------------------------
    // Cat.10 Processing of sold products
    // -------------------------------------------------------

    total += this.addActivityOrDirectCategory(
      inputs,
      breakdown,
      byCat,
      10,
      'Gia công/chế biến sản phẩm đã bán'
    );

    // -------------------------------------------------------
    // Cat.11 Use of sold products
    // -------------------------------------------------------

    total += this.addActivityOrDirectCategory(
      inputs,
      breakdown,
      byCat,
      11,
      'Sử dụng sản phẩm bán ra'
    );
    // -------------------------------------------------------
    // Cat.12 End of life
    // -------------------------------------------------------

    total += this.addActivityOrDirectCategory(
      inputs,
      breakdown,
      byCat,
      12,
      'Xử lý cuối vòng đời sản phẩm'
    );

    // -------------------------------------------------------
    // Cat.13 Downstream leased assets
    // -------------------------------------------------------

    total += this.addActivityOrDirectCategory(
      inputs,
      breakdown,
      byCat,
      13,
      'Tài sản cho thuê hạ nguồn'
    );

    // -------------------------------------------------------
    // Cat.14 Franchises
    // -------------------------------------------------------

    total += this.addActivityOrDirectCategory(
      inputs,
      breakdown,
      byCat,
      14,
      'Nhượng quyền'
    );

    // -------------------------------------------------------
    // Cat.15 Investments
    // -------------------------------------------------------

    total += this.addActivityOrDirectCategory(
      inputs,
      breakdown,
      byCat,
      15,
      'Đầu tư'
    );

    // -------------------------------------------------------
    // Other indirect emissions
    // -------------------------------------------------------

    total += this.addDirectCategory(
      inputs,
      breakdown,
      byCat,
      99,
      's3c99_direct_tco2e',
      'Phát thải gián tiếp khác'
    );

    return {
      total: this.round(total),
      breakdown,
      byCat
    };
  },

  // // =========================================================
  // DIRECT CATEGORY HELPER
  // // =========================================================

  addDirectCategory(
    inputs,
    breakdown,
    byCat,
    category,
    inputId,
    label
  ) {

    const emission =
      this.num(inputs[inputId]);

    if (emission <= 0) return 0;

    this.addCategory(
      byCat,
      category,
      emission
    );

    breakdown.push({
      source: label,
      category,
      quantity: emission,
      unit: 'tCO₂e',
      emission
    });

    return emission;
  },


  // Activity Data × EF / 1000. Direct tCO2e is fallback only.
  addActivityOrDirectCategory(inputs, breakdown, byCat, category, label) {
    const activity = this.num(inputs[`s3c${category}_activity`]);
    const ef = this.num(inputs[`s3c${category}_ef`]);
    if (activity > 0 && ef > 0) {
      const emission = (activity * ef) / 1000;
      this.addCategory(byCat, category, emission);
      breakdown.push({ source: label, category, quantity: activity, unit: 'Activity Data', ef, emission });
      return emission;
    }
    return this.addDirectCategory(inputs, breakdown, byCat, category, `s3c${category}_direct_tco2e`, label);
  },

  // // =========================================================
  // TRANSPORT HELPER
  // // =========================================================

  calculateTransportCategory(
    inputs,
    breakdown,
    byCat,
    category,
    prefix
  ) {

    const tons =
      this.num(inputs[`${prefix}_ton`]);

    const km =
      this.num(inputs[`${prefix}_km`]);

    const mode =
      inputs[`${prefix}_mode`] ||
      'heavy_truck';

    const modes =
      EF_MASTER.INTL.logistics || {};

    const transport =
      modes[mode];

    if (
      tons <= 0 ||
      km <= 0 ||
      !transport
    ) {
      return 0;
    }

    const emission =
      (tons *
        km *
        this.num(transport.factor)) /
      1000;

    this.addCategory(
      byCat,
      category,
      emission
    );

    breakdown.push({
      source:
        `${category === 4
          ? 'Vận chuyển thượng nguồn'
          : 'Vận chuyển hạ nguồn'} - ${transport.name}`,
      category,
      quantity: tons * km,
      unit: 'tấn.km',
      emission
    });

    return emission;
  },

  // // =========================================================
  // UNCERTAINTY CALCULATION
  // // =========================================================
  
  calcUncertainty(breakdown, totalGHG) {
    if (!totalGHG || totalGHG === 0) return 0;
    
    let sumSquares = 0;
    breakdown.forEach(item => {
        let uAD = 0.10;
        let uEF_CO2 = 0.05, uEF_CH4 = 0.50, uEF_N2O = 0.50;
        
        if (item.uAD !== undefined) uAD = item.uAD;
        if (item.uEF !== undefined) {
            uEF_CO2 = item.uEF; uEF_CH4 = item.uEF; uEF_N2O = item.uEF;
        }

        // Error propagation for the source
        // U_source = sqrt(U_AD^2 + U_EF^2)
        // Since we don't always have gas breakdown in the old dashboard, we use a simplified U_EF for the dashboard.
        const uEF_avg = uEF_CO2; 
        
        const uSource = Math.sqrt(Math.pow(uAD, 2) + Math.pow(uEF_avg, 2));
        sumSquares += Math.pow((item.emission / totalGHG) * uSource, 2);
    });
    
    return Math.sqrt(sumSquares);
  },

  // // =========================================================
  // ALL CALCULATIONS
  // // =========================================================

  calcAll(inputs, companyData) {

    inputs = inputs || {};
    companyData = companyData || {};

    const s1 =
      this.calcScope1(inputs, companyData);

    const s2 =
      this.calcScope2(inputs, companyData);

    const s3 =
      this.calcScope3(inputs, companyData);

    // Áp dụng Tỷ lệ sở hữu (Equity Share) khi phương pháp hợp nhất là equity_share
    const isEquityShare = (companyData.consolidation_approach === 'EQUITY_SHARE' || 
                           companyData.consolidationApproach === 'EQUITY_SHARE' ||
                           companyData.consolidation_approach === 'equity_share' || 
                           companyData.consolidationApproach === 'equity_share');
    const equityPct = this.num(companyData.equity_share_pct || companyData.equitySharePct || 100);
    const equityFactor = (isEquityShare && equityPct > 0 && equityPct <= 100) ? (equityPct / 100) : 1;

    if (equityFactor < 1) {
      s1.total = this.round(s1.total * equityFactor);
      s2.total = this.round(s2.total * equityFactor);
      if (s2.locationBased !== undefined) s2.locationBased = this.round(s2.locationBased * equityFactor);
      if (s2.marketBased !== undefined) s2.marketBased = this.round(s2.marketBased * equityFactor);
      s3.total = this.round(s3.total * equityFactor);
      s1.breakdown.forEach(b => { b.emission = this.round(b.emission * equityFactor); });
      s2.breakdown.forEach(b => { b.emission = this.round(b.emission * equityFactor); });
      s3.breakdown.forEach(b => { b.emission = this.round(b.emission * equityFactor); });
      if (s3.byCat) {
        Object.keys(s3.byCat).forEach(k => { s3.byCat[k] = this.round(s3.byCat[k] * equityFactor); });
      }
    }

    const totalGHG =
      s1.total +
      s2.total +
      s3.total;

    const allBreakdown = [
      ...s1.breakdown,
      ...s2.breakdown,
      ...s3.breakdown
    ];

    const production =
      this.num(
        companyData.production_output
      );

    const revenue =
      this.num(
        companyData.revenue_million_usd
      );

    const employees =
      this.num(
        companyData.employees
      );

    const intensityPerTon =
      production > 0
        ? totalGHG / production
        : null;

    const intensityPerRevenue =
      revenue > 0
        ? totalGHG / (revenue * 1000)
        : null;

    const intensityPerEmployee =
      employees > 0
        ? totalGHG / employees
        : null;

        const totalUncertainty = this.calcUncertainty(allBreakdown, totalGHG);

    return {
      scope1: this.round(s1.total),
      scope2: this.round(s2.total),
      scope2_location_based: this.round(s2.locationBased !== undefined ? s2.locationBased : s2.total),
      scope2_market_based: this.round(s2.marketBased !== undefined ? s2.marketBased : s2.total),
      marketBasedScope2: this.round(s2.marketBased !== undefined ? s2.marketBased : s2.total),
      scope3: this.round(s3.total),
      total: this.round(totalGHG),
      equityShareApplied: equityFactor < 1 ? equityPct : 100,
      uncertainty: totalUncertainty,
      breakdown: allBreakdown,
      scope3ByCat: s3.byCat,

      intensity: {

        per_ton:
          intensityPerTon !== null
            ? this.round(intensityPerTon, 3)
            : null,

        per_revenue:
          intensityPerRevenue !== null
            ? this.round(intensityPerRevenue, 4)
            : null,

        per_employee:
          intensityPerEmployee !== null
            ? this.round(intensityPerEmployee, 3)
            : null
      }
    };
  },

  // // =========================================================
  // BENCHMARK
  // // =========================================================
// ============================================

  getBenchmarkStatus(
    industryId,
    results
  ) {

    const industry =
      INDUSTRIES[industryId];

    if (
      !industry ||
      !industry.benchmarks
    ) {
      return [];
    }

    const bench =
      industry.benchmarks;

    const statuses = [];

    if (
      bench.intensity_per_ton &&
      results.intensity.per_ton !== null
    ) {

      const ratio =
        results.intensity.per_ton /
        bench.intensity_per_ton.value;

      statuses.push({

        metric:
          bench.intensity_per_ton.label,

        actual:
          results.intensity.per_ton,

        benchmark:
          bench.intensity_per_ton.value,

        unit:
          bench.intensity_per_ton.unit,

        ratio,

        status:
          ratio <= 0.8
            ? 'excellent'
            : ratio <= 1
              ? 'good'
              : ratio <= 1.3
                ? 'warning'
                : 'critical'

      });

    }

    if (
      bench.intensity_per_employee &&
      results.intensity.per_employee !== null
    ) {

      const ratio =
        results.intensity.per_employee /
        bench.intensity_per_employee.value;

      statuses.push({

        metric:
          bench.intensity_per_employee.label,

        actual:
          results.intensity.per_employee,

        benchmark:
          bench.intensity_per_employee.value,

        unit:
          bench.intensity_per_employee.unit,

        ratio,

        status:
          ratio <= 0.8
            ? 'excellent'
            : ratio <= 1
              ? 'good'
              : ratio <= 1.3
                ? 'warning'
                : 'critical'

      });

    }

    return statuses;
  },

  // // =========================================================
  // IMPROVEMENT RECOMMENDATIONS
  // // =========================================================

  getImprovements(
    industryId,
    results
  ) {

    const improvements = [];

    const s2Pct =
      results.total > 0
        ? results.scope2 /
          results.total *
          100
        : 0;

    const s1Pct =
      results.total > 0
        ? results.scope1 /
          results.total *
          100
        : 0;

    if (s2Pct > 40) {

      improvements.push({

        priority: 'high',

        title:
          'Lắp điện mặt trời áp mái',

        saving:
          'Giảm phát thải Scope 2',

        cost:
          'Đánh giá theo quy mô hệ thống',

        payback:
          'Đánh giá theo sản lượng điện',

        trainingRole:
          'Kỹ thuật viên Solar PV',

        trainingHours:
          40,

        co2Saving:
          this.round(
            results.scope2 * 0.6,
            2
          )

      });

    }

    if (s2Pct > 30) {

      improvements.push({

        priority: 'medium',

        title:
          'Tối ưu động cơ, bơm và quạt',

        saving:
          'Giảm điện năng tiêu thụ',

        cost:
          'Đánh giá theo thiết bị',

        payback:
          'Đánh giá theo mức tiết kiệm',

        trainingRole:
          'Kỹ thuật viên Điện công nghiệp',

        trainingHours:
          24,

        co2Saving:
          this.round(
            results.scope2 * 0.15,
            2
          )

      });

    }

    if (s1Pct > 25) {

      improvements.push({

        priority: 'high',

        title:
          'Chuyển phương tiện sử dụng nhiên liệu hóa thạch sang phương tiện điện',

        saving:
          'Giảm phát thải Scope 1',

        cost:
          'Đánh giá theo phương tiện',

        payback:
          'Đánh giá theo mức sử dụng',

        trainingRole:
          'Vận hành phương tiện điện',

        trainingHours:
          16,

        co2Saving:
          this.round(
            results.scope1 * 0.2,
            2
          )

      });

    }

    improvements.push({

      priority: 'medium',

      title:
        'Kiểm toán năng lượng toàn diện',

      saving:
        'Xác định các nguồn tiêu thụ và phát thải lớn',

      cost:
        'Đánh giá theo quy mô doanh nghiệp',

      payback:
        'Theo kế hoạch tiết kiệm',

      trainingRole:
        'Kiểm toán viên năng lượng nội bộ',

      trainingHours:
        60,

      co2Saving:
        this.round(
          results.total * 0.1,
          2
        )

    });

    return improvements.sort(
      (a, b) => {

        const order = {
          high: 0,
          medium: 1,
          low: 2
        };

        return (
          order[a.priority] -
          order[b.priority]
        );

      }
    );

  }

};

if (typeof window !== 'undefined') {
  window.Calculator = Calculator;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Calculator;
}