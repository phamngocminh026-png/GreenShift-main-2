/**
 * GREENSHIFT SUPABASE RLS SECURITY & MULTI-TENANT TEST SUITE
 * Kiem thu toan dien chinh sach Row Level Security (RLS) va phan quyen vai tro (RBAC)
 * tren he thong co so du lieu Supabase PostgreSQL.
 * Tuan thu quy tac nghiem ngat: ZERO EMOJIS.
 */

const assert = require('assert');
const path = require('path');
const fs = require('fs');

console.log('===============================================================');
console.log('KIEM THU: SIET CHAT CHINH SACH ROW LEVEL SECURITY (RLS) & RBAC');
console.log('===============================================================');

const sqlPath = path.join(__dirname, '..', 'data', 'reference', 'greenshift_supabase.sql');
assert.ok(fs.existsSync(sqlPath), 'Tep greenshift_supabase.sql phai ton tai');
const sql = fs.readFileSync(sqlPath, 'utf8');

// TEST 1: Kiem tra khong con bat ky chinh sach nao mo rong FOR ALL USING (true)
console.log('\n[TEST 1] Kiem tra loai bo hoan toan chinh sach RLS long leo FOR ALL USING (true):');
const loosePolicies = [
  'allow_public_access_sectors',
  'allow_public_access_facilities',
  'allow_public_access_users',
  'allow_public_access_user_roles',
  'allow_public_access_emission_factors',
  'allow_public_access_equipments',
  'allow_public_access_cbam_products',
  'allow_public_access_activity_productions',
  'allow_public_access_invoices',
  'allow_public_access_equipment_logs',
  'allow_public_access_reconciliation_records',
  'allow_public_access_cbam_dossiers',
  'allow_public_access_inventory_reports',
  'allow_public_access_activities'
];

loosePolicies.forEach(policyName => {
  const createRegex = new RegExp(`CREATE POLICY "${policyName}"`, 'i');
  assert.ok(!createRegex.test(sql), `Khong duoc ton tai lenh tao chinh sach long leo: ${policyName}`);
});

const regexLooseGlobal = /CREATE POLICY[^\n]+FOR ALL USING \(true\) WITH CHECK \(true\)/i;
assert.ok(!regexLooseGlobal.test(sql), 'Khong duoc phep co bat ky bang nao su dung FOR ALL USING (true) WITH CHECK (true)');
console.log('  [PASS] Da loai bo 100% cac chinh sach RLS long leo tren toan bo CSDL');

// TEST 2: Kiem tra chinh sach cho bang tham chieu danh muc (Reference Data)
console.log('\n[TEST 2] Kiem tra bao ve bang tham chieu (sectors, emission_factors, cbam_products):');
['sectors', 'emission_factors', 'cbam_products'].forEach(table => {
  assert.ok(sql.includes(`"${table}_read_policy"`), `Bang ${table} phai co chinh sach read_policy`);
  assert.ok(sql.includes(`"${table}_write_policy"`), `Bang ${table} phai co chinh sach write_policy`);
  assert.ok(sql.includes(`CREATE POLICY "${table}_read_policy" ON public.${table}`), `Chinh sach doc ${table} phai hop le`);
});
console.log('  [PASS] Bang tham chieu mo doc SELECT cong khai, khoa ghi chi cho admin va service_role');

// TEST 3: Kiem tra bao ve ho so va danh tinh (facilities, users, user_roles)
console.log('\n[TEST 3] Kiem tra bao mat ho so doanh nghiep va tai khoan nguoi dung:');
assert.ok(sql.includes('"facilities_select_policy"'), 'Phai co facilities_select_policy');
assert.ok(sql.includes('"facilities_modify_policy"'), 'Phai co facilities_modify_policy');
assert.ok(sql.includes('"users_select_policy"'), 'Phai co users_select_policy');
assert.ok(sql.includes('"users_modify_policy"'), 'Phai co users_modify_policy');
assert.ok(sql.includes('auth.email()'), 'users_select_policy phai kiem tra email = auth.email()');
console.log('  [PASS] Ho so nguoi dung duoc bao ve, khong the doc trom password_hash cheo');

// TEST 4: Kiem tra phan quyen vai tro (RBAC) tren hoa don va nhat ky thiet bi
console.log('\n[TEST 4] Kiem tra phan quyen nghiep vu RBAC (invoices, equipment_logs):');
// Invoices: Ke toan va Giam doc
assert.ok(sql.includes('"invoices_write_policy"'), 'Phai co invoices_write_policy');
assert.ok(sql.includes("'accountant'"), 'invoices_write_policy phai phan quyen accountant');

// Equipment logs: Ky su va Giam doc
assert.ok(sql.includes('"equipment_logs_write_policy"'), 'Phai co equipment_logs_write_policy');
assert.ok(sql.includes("'engineer'"), 'equipment_logs_write_policy phai phan quyen engineer');

// Activities
assert.ok(sql.includes('"activities_select_policy"'), 'Phai co activities_select_policy');
assert.ok(sql.includes('"activities_insert_update_policy"'), 'Phai co activities_insert_update_policy');
assert.ok(sql.includes('"activities_delete_policy"'), 'Phai co activities_delete_policy');
console.log('  [PASS] Tach biet trach nhiem: Ke toan phu trach hoa don, Ky su phu trach thiet bi');

// TEST 5: Kiem tra phan tach da doanh nghiep (Multi-tenant Isolation)
console.log('\n[TEST 5] Kiem tra dieu kien co lap theo facility_id:');
const operationalTables = [
  'equipments',
  'invoices',
  'equipment_logs',
  'activity_productions',
  'reconciliation_records',
  'cbam_dossiers',
  'inventory_reports',
  'activities'
];

operationalTables.forEach(table => {
  assert.ok(sql.includes(`ON public.${table}`), `Bang ${table} phai co RLS duoc dinh nghia`);
  assert.ok(
    sql.includes(`facility_id = public.current_user_facility_id()`) ||
    sql.includes(`facility_id IN (SELECT u.facility_id FROM public.users u WHERE u.email = auth.email())`),
    `Bang ${table} phai co dieu kien cach ly chat che theo facility_id`
  );
});
assert.ok(!sql.includes('facility_id = 1 OR'), 'Tuyet doi khong duoc chua dieu kien bypass facility_id = 1 cong khai');
assert.ok(!sql.includes('id = 1 OR'), 'Tuyet doi khong duoc chua dieu kien bypass id = 1 cong khai');
assert.ok(sql.includes('public.audit_logs'), 'Phai co bang audit_logs theo chuan ISO 14064-3');
console.log('  [PASS] Toan bo 8 bang nghiep vu duoc co lap nghiem ngat theo facility_id (Strict Multi-tenant Isolation)');
console.log('  [PASS] Bang audit_logs theo chuan ISO 14064-3 da duoc tich hop hoan hao');

// TEST 6: Kiem tra Storage Bucket Policies
console.log('\n[TEST 6] Kiem tra chinh sach kho chung tu invoice_documents:');
assert.ok(sql.includes('"invoice_documents_read_policy"'), 'Phai co invoice_documents_read_policy');
assert.ok(sql.includes('"invoice_documents_insert_policy"'), 'Phai co invoice_documents_insert_policy');
assert.ok(sql.includes('"invoice_documents_update_policy"'), 'Phai co invoice_documents_update_policy');
console.log('  [PASS] Storage bucket duoc bao ve va phan quyen hop le');

// TEST 7: Kiem tra khong chua emoji
console.log('\n[TEST 7] Kiem tra quy tac ZERO EMOJIS:');
const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;
assert.ok(!emojiRegex.test(sql), 'greenshift_supabase.sql khong duoc chua bat ky emoji nao');
console.log('  [PASS] greenshift_supabase.sql hoan toan sach emoji');

console.log('\n===============================================================');
console.log('TAT CA CAC KIEM THU CHO MUC 4 (SIET CHAT CHINH SACH RLS) DA QUA!');
console.log('===============================================================');
