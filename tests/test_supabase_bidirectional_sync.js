/**
 * GREENSHIFT SUPABASE BI-DIRECTIONAL SYNC TEST SUITE
 * Kiem thu toan dien co che dong bo hai chieu (Pull / Push / Merge / Conflict Resolution)
 * giua Supabase Cloud Database va LocalStorage.
 * Tuan thu quy tac nghiem ngat: ZERO EMOJIS.
 */

const assert = require('assert');
const path = require('path');
const fs = require('fs');

console.log('===============================================================');
console.log('KIEM THU: DONG BO HAI CHIEU SUPABASE CLOUD VA LOCALSTORAGE');
console.log('===============================================================');

// Mock browser environment
const localStorageMock = (function() {
  let store = {};
  return {
    getItem(key) { return store[key] || null; },
    setItem(key, value) { store[key] = String(value); },
    removeItem(key) { delete store[key]; },
    clear() { store = {}; }
  };
})();

let lastDispatchedEvent = null;
global.window = {
  dispatchEvent(evt) {
    lastDispatchedEvent = evt;
  }
};
global.localStorage = localStorageMock;
global.CustomEvent = class CustomEvent {
  constructor(type, init) {
    this.type = type;
    this.detail = init ? init.detail : null;
  }
};

// 1. Kiem tra dinh nghia Module supabase-client.js
console.log('\n[TEST 1] Kiem tra phuong thuc dong bo hai chieu trong supabase-client.js:');
const clientPath = path.join(__dirname, '..', 'assets', 'js', 'supabase-client.js');
assert.ok(fs.existsSync(clientPath), 'Tep assets/js/supabase-client.js phai ton tai');

require(clientPath);
const db = window.GreenShiftDB;
assert.ok(db, 'window.GreenShiftDB phai ton tai');
assert.strictEqual(typeof db.generateActivityId, 'function', 'generateActivityId phai la function');
assert.strictEqual(typeof db.mergeActivities, 'function', 'mergeActivities phai la function');
assert.strictEqual(typeof db.pullActivities, 'function', 'pullActivities phai la function');
assert.strictEqual(typeof db.pullCompanyProfile, 'function', 'pullCompanyProfile phai la function');
assert.strictEqual(typeof db.pushActivities, 'function', 'pushActivities phai la function');
assert.strictEqual(typeof db.pullAll, 'function', 'pullAll phai la function');
assert.strictEqual(typeof db.syncAll, 'function', 'syncAll phai la function');
console.log('  [PASS] Day du 7 phuong thuc dong bo hai chieu tren GreenShiftDB');

// 2. Kiem tra generateActivityId
console.log('\n[TEST 2] Kiem tra tinh dinh danh on dinh cua generateActivityId:');
const actSample1 = {
  date: '2026-01-15',
  sourceId: 'src_grid',
  amount: '8000',
  entryMode: 'direct'
};
const id1 = db.generateActivityId(actSample1, 'main');
const id2 = db.generateActivityId(actSample1, 'main');
assert.strictEqual(id1, id2, 'ID phai mang tinh on dinh tuyet doi giua cac lan goi');
assert.ok(id1.includes('20260115'), 'ID phai bao gom ngay thang');
assert.ok(id1.includes('src_grid') || id1.includes('srcgrid'), 'ID phai bao gom ma nguon phat thai');

// Uu tien docId neu co
const actWithDoc = { ...actSample1, docId: 'doc_9999' };
assert.strictEqual(db.generateActivityId(actWithDoc), 'act_doc_9999', 'Phai su dung docId lam khoa dinh danh neu ton tai');
console.log('  [PASS] generateActivityId tao ID nhat quan va chuan xac');

// 3. Kiem tra thuat toan mergeActivities (Conflict Resolution & Last-Write-Wins)
console.log('\n[TEST 3] Kiem tra thuat toan hop nhat 2 chieu (mergeActivities):');

const localData = [
  {
    id: 'act_1',
    date: '2026-01-10',
    sourceName: 'Dau Diesel DO',
    amount: '1000',
    updatedAt: '2026-01-10T10:00:00.000Z'
  },
  {
    id: 'act_local_only',
    date: '2026-01-12',
    sourceName: 'Khi LPG',
    amount: '500',
    updatedAt: '2026-01-12T08:00:00.000Z'
  }
];

const remoteData = [
  // Ban ghi act_1 bi sua tren Cloud voi timestamp moi hon
  {
    id: 'act_1',
    date: '2026-01-10',
    sourceName: 'Dau Diesel DO',
    amount: '1200', // Kế toán điều chỉnh lên 1200
    updated_at: '2026-01-10T15:00:00.000Z' // Mới hơn 10:00
  },
  // Ban ghi moi duoc nhap tu may khac tren Cloud
  {
    id: 'act_remote_new',
    date: '2026-01-14',
    sourceName: 'Dien luoi EVN',
    amount: '8000000',
    updated_at: '2026-01-14T09:00:00.000Z'
  }
];

const merged = db.mergeActivities(localData, remoteData);
assert.strictEqual(merged.length, 3, 'Danh sach sau hop nhat phai chua du 3 ban ghi');

// Kiem tra ban ghi act_1 nhan gia tri moi hon tu Cloud
const mergedAct1 = merged.find(x => x.id === 'act_1');
assert.strictEqual(mergedAct1.amount, '1200', 'Ban ghi xung dot phai nhan gia tri moi hon (1200 tu Cloud)');

// Kiem tra ban ghi local_only duoc bao toan
const mergedLocalOnly = merged.find(x => x.id === 'act_local_only');
assert.ok(mergedLocalOnly, 'Ban ghi tren Local phai duoc bao toan de day len Cloud');

// Kiem tra ban ghi remote_new duoc them vao Local
const mergedRemoteNew = merged.find(x => x.id === 'act_remote_new');
assert.ok(mergedRemoteNew, 'Ban ghi moi tren Cloud phai duoc bo sung vao Local');

// Kiem tra thu tu sap xep thoi gian
assert.strictEqual(merged[0].id, 'act_1');
assert.strictEqual(merged[1].id, 'act_local_only');
assert.strictEqual(merged[2].id, 'act_remote_new');
console.log('  [PASS] Thuat toan Last-Write-Wins va bo sung 2 chieu hoat dong hoan hao');

// 4. Kiem tra cac ham Pull / Push / Sync voi Mock Supabase Client
console.log('\n[TEST 4] Kiem tra Mock Supabase Client va su kien greenshift:sync-complete:');
(async () => {
  let upsertedActivities = [];
  let upsertedFacility = null;

  const mockClient = {
    from(tableName) {
      if (tableName === 'activities') {
        return {
          select() {
            return {
              eq() {
                return {
                  order() {
                    return Promise.resolve({
                      data: [
                        {
                          id: 'act_cloud_test_1',
                          activity_date: '2026-01-20',
                          source_name: 'Dien EVN',
                          amount: 50000,
                          unit: 'kWh',
                          co2e: 36055,
                          is_biomass: false,
                          created_at: '2026-01-20T10:00:00.000Z',
                          updated_at: '2026-01-20T10:00:00.000Z'
                        }
                      ],
                      error: null
                    });
                  }
                };
              }
            };
          },
          upsert(rows) {
            upsertedActivities = rows;
            return Promise.resolve({ error: null });
          }
        };
      }
      if (tableName === 'facilities') {
        return {
          select() {
            return {
              eq() {
                return {
                  single() {
                    return Promise.resolve({
                      data: {
                        id: 1,
                        name: 'Cong ty Thep Xanh GreenSteel',
                        sector_code: 'STEEL',
                        tax_id: '0201889988',
                        address: 'Dinh Vu, Hai Phong'
                      },
                      error: null
                    });
                  }
                };
              }
            };
          },
          upsert(payload) {
            upsertedFacility = payload;
            return Promise.resolve({ error: null });
          }
        };
      }
      if (tableName === 'inventory_reports') {
        return {
          upsert() { return Promise.resolve({ error: null }); }
        };
      }
      return {
        select() { return Promise.resolve({ data: [], error: null }); },
        upsert() { return Promise.resolve({ error: null }); }
      };
    }
  };

  // Mock getClient
  db.getClient = () => mockClient;

  // 4.1: Test pullActivities
  const pulled = await db.pullActivities('main');
  assert.strictEqual(pulled.length, 1);
  assert.strictEqual(pulled[0].id, 'act_cloud_test_1');
  assert.strictEqual(pulled[0].amount, '50000');
  console.log('  [PASS] pullActivities chuyen doi schema Cloud ve Local-First thanh cong');

  // 4.2: Test pullCompanyProfile
  const pulledProfile = await db.pullCompanyProfile();
  assert.ok(pulledProfile);
  assert.strictEqual(pulledProfile.name, 'Cong ty Thep Xanh GreenSteel');
  assert.strictEqual(JSON.parse(localStorage.getItem('gs_v2_company')).taxId, '0201889988');
  console.log('  [PASS] pullCompanyProfile cap nhat ho so doanh nghiep vao LocalStorage');

  // 4.3: Test syncAll (Two-Way Sync)
  localStorage.setItem('gs_data_guest_main_activity', JSON.stringify([
    {
      id: 'act_local_pre_sync',
      date: '2026-01-05',
      sourceName: 'Nhien lieu DO',
      amount: '3000'
    }
  ]));

  const syncResult = await db.syncAll();
  assert.strictEqual(syncResult.status, 'success');
  assert.strictEqual(syncResult.count, 2, 'Sau sync phai co 2 ban ghi (1 local + 1 cloud)');
  assert.ok(lastDispatchedEvent, 'Phai phat su kien greenshift:sync-complete');
  assert.strictEqual(lastDispatchedEvent.type, 'greenshift:sync-complete');
  console.log('  [PASS] syncAll hoan thanh quy trinh dong bo 2 chieu va ban su kien lam moi UI');

  // 5. Kiem tra SQL schema trong greenshift_supabase.sql
  console.log('\n[TEST 5] Kiem tra CSDL greenshift_supabase.sql co bang public.activities:');
  const sql = fs.readFileSync(path.join(__dirname, '..', 'data', 'reference', 'greenshift_supabase.sql'), 'utf8');
  assert.ok(sql.includes('CREATE TABLE IF NOT EXISTS public.activities'), 'Phai co bang public.activities');
  assert.ok(sql.includes('idx_activities_branch'), 'Phai co chi muc branch_key');
  assert.ok(sql.includes('idx_activities_date'), 'Phai co chi muc activity_date');
  assert.ok(sql.includes('allow_public_access_activities'), 'Phai co RLS policy cho activities');
  console.log('  [PASS] greenshift_supabase.sql chua day du cau truc bang activities va RLS');

  // 6. Kiem tra supabase-ui.js
  console.log('\n[TEST 6] Kiem tra giao dien modal trong supabase-ui.js:');
  const uiCode = fs.readFileSync(path.join(__dirname, '..', 'assets', 'js', 'supabase-ui.js'), 'utf8');
  assert.ok(uiCode.includes('pullFromCloudFromModal'), 'supabase-ui.js phai co ham pullFromCloudFromModal');
  assert.ok(uiCode.includes('Kéo từ Cloud'), 'Modal phai co nut Keo tu Cloud');
  assert.ok(uiCode.includes('Đồng Bộ 2 Chiều'), 'Modal phai co nut Dong Bo 2 Chieu');
  console.log('  [PASS] Giao dien modal tich hop nut bam keo du lieu va dong bo 2 chieu');

  // 7. Kiem tra khong co emoji
  console.log('\n[TEST 7] Kiem tra quy tac ZERO EMOJIS trong code moi:');
  const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;
  assert.ok(!emojiRegex.test(uiCode), 'supabase-ui.js khong duoc chua bat ky emoji nao');
  console.log('  [PASS] supabase-ui.js hoan toan sach emoji, su dung 100% CSS status dot va SVG');

  console.log('\n===============================================================');
  console.log('TAT CA CAC KIEM THU CHO MUC 3 (DONG BO 2 CHIEU SUPABASE) DA QUA!');
  console.log('===============================================================');
})();
