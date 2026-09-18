-- ====================================================================
-- GREENSHIFT ENTERPRISE DATABASE - UPGRADE PATCH: GHG PROTOCOL & IPCC 2006/2019
-- Compatible with: PostgreSQL 13, 14, 15, 16 / Supabase SQL Editor
-- Purpose: Safely upgrade existing GreenShift schema to full compliance
--          with ISO 14064-1, GHG Protocol Corporate Standard, IPCC AR5/AR6,
--          Nghị định 06/2022/NĐ-CP, and EU CBAM Regulation (EU) 2023/956.
-- ====================================================================

-- 1. BẢNG FACILITIES: Bổ sung ranh giới kiểm kê, năm cơ sở và định danh pháp lý
ALTER TABLE public.facilities 
    ADD COLUMN IF NOT EXISTS consolidation_approach VARCHAR(50) DEFAULT 'OPERATIONAL_CONTROL' 
        CHECK (consolidation_approach IN ('OPERATIONAL_CONTROL', 'FINANCIAL_CONTROL', 'EQUITY_SHARE')),
    ADD COLUMN IF NOT EXISTS equity_share_pct DOUBLE PRECISION DEFAULT 100.0,
    ADD COLUMN IF NOT EXISTS base_year INT DEFAULT 2023,
    ADD COLUMN IF NOT EXISTS base_year_policy TEXT,
    ADD COLUMN IF NOT EXISTS facility_code_gov VARCHAR(100),
    ADD COLUMN IF NOT EXISTS un_locode VARCHAR(20),
    ADD COLUMN IF NOT EXISTS gps_coordinates VARCHAR(100);

-- 2. BẢNG EMISSION_FACTORS: Bổ sung Tier level, phiên bản GWP, sai số và cờ phát thải sinh học
ALTER TABLE public.emission_factors 
    ADD COLUMN IF NOT EXISTS tier_level VARCHAR(10) DEFAULT 'TIER_2' 
        CHECK (tier_level IN ('TIER_1', 'TIER_2', 'TIER_3')),
    ADD COLUMN IF NOT EXISTS gwp_version VARCHAR(20) DEFAULT 'AR5' 
        CHECK (gwp_version IN ('SAR', 'AR4', 'AR5', 'AR6')),
    ADD COLUMN IF NOT EXISTS uncertainty_pct DOUBLE PRECISION DEFAULT 5.0,
    ADD COLUMN IF NOT EXISTS is_biogenic BOOLEAN DEFAULT FALSE;

-- Cập nhật cờ phát thải sinh học cho viên nén mùn cưa / sinh khối
UPDATE public.emission_factors 
SET is_biogenic = TRUE, uncertainty_pct = 30.0 
WHERE fuel_code = 'BIOMASS_PELLETS';

-- Bổ sung hệ số cho khí SF6 (Trạm biến áp cao thế) và NF3 (Công nghệ cao)
INSERT INTO public.emission_factors 
    ("fuel_code", "fuel_name", "category", "ef_total_tco2e_per_unit", "unit", "gwp_value", "tier_level", "gwp_version", "uncertainty_pct", "is_biogenic", "source", "note")
VALUES 
    ('FUGITIVE_SF6', 'Khí Sulfur Hexafluoride (SF6 - Thiết bị đóng cắt trạm biến áp cao thế)', 'INDUSTRIAL_PROCESS', 23500.0, 'tấn SF6', 23500.0, 'TIER_2', 'AR5', 10.0, FALSE, 'IPCC AR5 / QĐ 2626/QĐ-BTNMT', 'Phát thải rò rỉ khí SF6 từ trạm biến áp trung/cao thế 110kV-220kV của nhà máy (định mức rò rỉ 0.5%/năm)'),
    ('FUGITIVE_NF3', 'Khí Nitrogen Trifluoride (NF3)', 'INDUSTRIAL_PROCESS', 16100.0, 'tấn NF3', 16100.0, 'TIER_1', 'AR5', 10.0, FALSE, 'IPCC AR5 / GHG Protocol', 'Sản xuất công nghệ cao, bán dẫn và pin quang điện')
ON CONFLICT (fuel_code) DO NOTHING;

-- 3. BẢNG INVOICES: Bổ sung mã đồng hồ đo / trạm cân và cấp chính xác thiết bị
ALTER TABLE public.invoices 
    ADD COLUMN IF NOT EXISTS meter_id VARCHAR(100),
    ADD COLUMN IF NOT EXISTS uncertainty_activity_pct DOUBLE PRECISION DEFAULT 1.0;

-- 4. BẢNG INVENTORY_REPORTS: Bổ sung Scope 2 kép (Location/Market), CO2 sinh học, SF6 và NF3
ALTER TABLE public.inventory_reports 
    ADD COLUMN IF NOT EXISTS scope2_location_based_tco2e DOUBLE PRECISION,
    ADD COLUMN IF NOT EXISTS scope2_market_based_tco2e DOUBLE PRECISION,
    ADD COLUMN IF NOT EXISTS biogenic_co2_tco2e DOUBLE PRECISION DEFAULT 0.0,
    ADD COLUMN IF NOT EXISTS sf6_mass_ton DOUBLE PRECISION DEFAULT 0.0,
    ADD COLUMN IF NOT EXISTS sf6_converted_tco2e DOUBLE PRECISION DEFAULT 0.0,
    ADD COLUMN IF NOT EXISTS nf3_mass_ton DOUBLE PRECISION DEFAULT 0.0,
    ADD COLUMN IF NOT EXISTS nf3_converted_tco2e DOUBLE PRECISION DEFAULT 0.0;

-- Đồng bộ giá trị mặc định cho các báo cáo hiện có
UPDATE public.inventory_reports 
SET 
    scope2_location_based_tco2e = COALESCE(scope2_location_based_tco2e, scope2_electricity_tco2e),
    scope2_market_based_tco2e = COALESCE(scope2_market_based_tco2e, scope2_electricity_tco2e)
WHERE scope2_location_based_tco2e IS NULL;

-- 5. BẢNG CBAM_DOSSIERS: Bổ sung khấu trừ thuế / giá carbon đã nộp tại Việt Nam (Điều 9 CBAM)
ALTER TABLE public.cbam_dossiers 
    ADD COLUMN IF NOT EXISTS carbon_price_paid_vnd DOUBLE PRECISION DEFAULT 0.0,
    ADD COLUMN IF NOT EXISTS carbon_price_deducted_eur DOUBLE PRECISION DEFAULT 0.0;
