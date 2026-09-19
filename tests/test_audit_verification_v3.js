const fs = require('fs');
const assert = require('assert');

console.log('=== TEST: VERIFYING AUDIT V3 FIXES (JS & SQL INTEGRITY) ===');

global.window = global;

// 1. Load dependencies
const ef = require('../assets/js/ef-master.js');
global.EF_MASTER = ef;
const calc = require('../assets/js/calculator.js');
require('../assets/js/supabase-client.js');

// TEST 1: GWP Tra cứu động (Dynamic GWP) trong calculator.js
console.log('\n--- TEST 1: Dynamic GWP in calculator.js ---');

// Test 1.1: Nitric acid industrial process N2O
const n2o_ar5 = calc.calcScope1({ s1_process_nitric_acid_hno3: 100 }, { ipccAR: 'AR5' });
const n2o_ar6 = calc.calcScope1({ s1_process_nitric_acid_hno3: 100 }, { ipccAR: 'AR6' });
assert.strictEqual(n2o_ar5.total, 212, 'AR5: 100 * 8 * 265 / 1000 = 212 tCO2e');
assert.strictEqual(n2o_ar6.total, 218.4, 'AR6: 100 * 8 * 273 / 1000 = 218.4 tCO2e');
console.log('PASS: Nitric acid N2O correctly differentiates between AR5 (212 tCO2e) and AR6 (218.4 tCO2e)');

// Test 1.2: Scope 3 Cat 5 waste open burning CH4
const waste_ar5 = calc.calcScope3({ s3c5_open_burning_ton: 100 }, { ipccAR: 'AR5' });
const waste_ar4 = calc.calcScope3({ s3c5_open_burning_ton: 100 }, { ipccAR: 'AR4' });
assert(waste_ar5.total > 0, 'Waste emission must be greater than 0');
assert(waste_ar5.total !== waste_ar4.total, 'AR5 and AR4 must yield different CH4 emissions');
console.log('PASS: Scope 3 Waste CH4 correctly uses dynamic GWP based on IPCC AR configuration');

// TEST 2: Market-based Scope 2 and gasBreakdown in supabase-client.js
console.log('\n--- TEST 2: Market-based Scope 2 & gasBreakdown in supabase-client.js ---');

let capturedReport = null;
let capturedAuditLog = null;

const mockClient = {
  from: function (tableName) {
    return {
      upsert: async function (data, opts) {
        if (tableName === 'inventory_reports') {
          capturedReport = data;
        }
        return { error: null };
      },
      insert: async function (rows) {
        if (tableName === 'audit_logs') {
          capturedAuditLog = rows[0];
        }
        return { error: null };
      },
      select: function () {
        return {
          eq: function () {
            return {
              eq: function () {
                return {
                  maybeSingle: async function () {
                    return { data: null, error: null };
                  }
                };
              }
            };
          }
        };
      }
    };
  }
};

window.GreenShiftDB.getClient = () => mockClient;
window.GreenShiftDB.requireFacilityId = () => 1;

// Mock activities with regular electricity and REC/PPA green energy
const sampleActivities = [
  {
    id: 'act_1',
    date: '2026-03-15',
    sourceType: 'SCOPE_1',
    co2e: 100,
    efName: 'Dầu Diesel'
  },
  {
    id: 'act_2',
    date: '2026-03-15',
    sourceType: 'SCOPE_2',
    co2e: 200,
    efName: 'Điện lưới Việt Nam'
  },
  {
    id: 'act_3',
    date: '2026-03-15',
    sourceType: 'SCOPE_2',
    co2e: 50,
    efName: 'Điện mặt trời mái nhà (PPA/REC)',
    isRecPpa: true
  },
  {
    id: 'act_4',
    date: '2026-03-15',
    sourceType: 'SCOPE_3',
    co2e: 30,
    efName: 'Vận chuyển hàng hóa'
  }
];

// Run pushActivities
(async () => {
  const pushSuccess = await window.GreenShiftDB.pushActivities('main', sampleActivities);
  assert.strictEqual(pushSuccess, true, 'pushActivities must succeed');
  assert.ok(capturedReport, 'inventory_reports must be upserted');

  console.log('Location-based Scope 2:', capturedReport.scope2_location_based_tco2e);
  console.log('Market-based Scope 2:', capturedReport.scope2_market_based_tco2e);

  assert.strictEqual(capturedReport.scope2_location_based_tco2e, 250, 'Location-based Scope 2 must sum all electricity (200 + 50 = 250)');
  assert.strictEqual(capturedReport.scope2_market_based_tco2e, 200, 'Market-based Scope 2 must exclude REC/PPA green electricity (200)');
  assert.notStrictEqual(capturedReport.scope2_location_based_tco2e, capturedReport.scope2_market_based_tco2e, 'Market-based and Location-based must be differentiated!');
  console.log('PASS: Market-based Scope 2 is actively wired into pushActivities and passed to Supabase!');

  // TEST 3: Audit log recording
  console.log('\n--- TEST 3: Audit Trail in supabase-client.js ---');
  assert.ok(capturedAuditLog, 'audit_logs must record an entry');
  assert.strictEqual(capturedAuditLog.table_name, 'inventory_reports');
  assert.strictEqual(capturedAuditLog.action, 'UPSERT');
  assert.strictEqual(capturedAuditLog.facility_id, 1);
  console.log('PASS: Audit log automatically written to audit_logs on data synchronization!');

  // TEST 4: SQL Schema verification for triggers & is_locked
  console.log('\n--- TEST 4: SQL Schema Triggers & Lock Guard ---');
  const sql = fs.readFileSync('data/reference/greenshift_supabase.sql', 'utf8');

  assert.ok(sql.includes('CREATE OR REPLACE FUNCTION public.fn_audit_log_changes()'), 'SQL must define fn_audit_log_changes()');
  assert.ok(sql.includes('trg_audit_activities'), 'SQL must attach trg_audit_activities');
  assert.ok(sql.includes('trg_audit_inventory_reports'), 'SQL must attach trg_audit_inventory_reports');
  assert.ok(sql.includes('trg_audit_activity_productions'), 'SQL must attach trg_audit_activity_productions');
  assert.ok(sql.includes('trg_audit_equipment_logs'), 'SQL must attach trg_audit_equipment_logs');
  assert.ok(sql.includes('CREATE OR REPLACE FUNCTION public.fn_prevent_locked_modifications()'), 'SQL must define fn_prevent_locked_modifications()');
  assert.ok(sql.includes('trg_lock_activity_productions'), 'SQL must attach trg_lock_activity_productions');
  assert.ok(sql.includes('trg_lock_equipment_logs'), 'SQL must attach trg_lock_equipment_logs');
  console.log('PASS: PostgreSQL triggers for audit logging and period lock enforcement are verified in SQL schema!');

  console.log('\nALL AUDIT V3 CHECKS PASSED WITH 100% SUCCESS!');
})();
