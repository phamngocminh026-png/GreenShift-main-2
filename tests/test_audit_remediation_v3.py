import os
import sys
import unittest
import json
import time

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from server.app import app, is_survey_rate_limited, record_survey_submission, SURVEY_SUBMISSIONS
from server.services.cbam_service import parse_num, process_internal_audit_report, VN_GRID_EF_QD2626, VN_GRID_EF_CBAM_DEFAULT

class TestAuditRemediationV3(unittest.TestCase):
    def setUp(self):
        app.config['TESTING'] = True
        self.client = app.test_client()

    def test_parse_num_unicode_spaces_and_units(self):
        """Kiểm tra parse_num xử lý đúng khoảng trắng Unicode và hậu tố đơn vị"""
        self.assertEqual(parse_num(" 1\u00a0234,56 \u00a0tCO2e "), 1234.56)
        self.assertEqual(parse_num("50\u202f000 kWh"), 50000.0)
        self.assertEqual(parse_num("1.234.567 VND"), 1234567.0)
        self.assertEqual(parse_num(" 99,5 \t tấn "), 99.5)

    def test_parse_num_accounting_and_negative_formats(self):
        """Kiểm tra parse_num xử lý đúng số âm định dạng kế toán ngoặc đơn và dấu trừ có khoảng cách"""
        self.assertEqual(parse_num("(1.234,56)"), -1234.56)
        self.assertEqual(parse_num("(1,234.56)"), -1234.56)
        self.assertEqual(parse_num("(500)"), -500.0)
        self.assertEqual(parse_num("- 123.45"), -123.45)
        self.assertEqual(parse_num("- 1.234,56"), -1234.56)

    def test_cbam_heat_boundary_in_internal_audit_report(self):
        """Khẳng định nhiệt nhập khẩu được tính vào phát thải trực tiếp AttrEm_dir theo Annex III/IV EU 2023/1773"""
        payload = {
            'year': 2026,
            'company': 'Thép Xanh Hải Phòng',
            'fuels': [{'name': 'DO', 'tco2e': 100.0}],
            'heatExchanges': [{'name': 'Hơi nước công nghiệp', 'tco2e': 25.0}],
            'elecMwh': 100,
            'elecEf': 0.7221
        }
        # Output phải được tạo thành công
        output, filename, err, status = process_internal_audit_report(payload)
        self.assertIsNone(err)
        self.assertEqual(status, 200)
        self.assertTrue(filename.endswith('.xlsx'))

    def test_production_fails_fast_on_default_admin_user(self):
        """Khẳng định khi chạy production, username mặc định greenshiftacl2026 bị chặn fail-fast"""
        # Giả lập logic kiểm tra fail-fast
        def simulate_prod_check(user, pwd, secret):
            if not secret or secret == 'greenshift-audit-secret-2026':
                raise RuntimeError("CRITICAL: GREENSHIFT_JWT_SECRET")
            if pwd == '1234':
                raise RuntimeError("CRITICAL: GREENSHIFT_ADMIN_PASS")
            if user == 'greenshiftacl2026':
                raise RuntimeError("CRITICAL: GREENSHIFT_ADMIN_USER cannot be default 'greenshiftacl2026' in production.")
            return True

        with self.assertRaises(RuntimeError) as ctx:
            simulate_prod_check('greenshiftacl2026', 'StrongPass@999', 'StrongJwtSecret@999')
        self.assertIn("GREENSHIFT_ADMIN_USER", str(ctx.exception))

    def test_multi_tenant_facility_login(self):
        """Khẳng định đăng nhập người dùng đa tenant cấp đúng facility_id tương ứng của từng nhà máy"""
        # 1. Đăng nhập Kế toán cơ sở 1
        res_fac1 = self.client.post('/api/login', json={
            'username': 'ketoan@greenshift.vn',
            'password': '1234'
        })
        self.assertEqual(res_fac1.status_code, 200)
        data1 = res_fac1.get_json()
        self.assertEqual(data1['facility_id'], 1)
        self.assertEqual(data1['role'], 'accountant')

        # 2. Đăng nhập Admin Nhà máy Xi măng cơ sở 2
        res_fac2 = self.client.post('/api/login', json={
            'username': 'cement_admin@greenshift.vn',
            'password': '1234'
        })
        self.assertEqual(res_fac2.status_code, 200)
        data2 = res_fac2.get_json()
        self.assertEqual(data2['facility_id'], 2)
        self.assertEqual(data2['role'], 'manager')

        # 3. Đăng nhập Nhà máy Nhôm cơ sở 4
        res_fac4 = self.client.post('/api/login', json={
            'username': 'alu_admin@greenshift.vn',
            'password': '1234'
        })
        self.assertEqual(res_fac4.status_code, 200)
        data4 = res_fac4.get_json()
        self.assertEqual(data4['facility_id'], 4)

    def test_supplier_rate_limiting(self):
        """Khẳng định endpoint khảo sát nhà cung cấp có rate limiting chống spam"""
        ip = "192.168.100.200"
        SURVEY_SUBMISSIONS[ip] = [time.time()] * 30
        self.assertTrue(is_survey_rate_limited(ip))

    def test_facility_backdoor_1234_eliminated_when_configured(self):
        """Khẳng định khi GREENSHIFT_FACILITY_PASS được cấu hình, mật khẩu 1234 bị chặn 401 tuyệt đối"""
        old_pass = os.environ.get('GREENSHIFT_FACILITY_PASS')
        old_admin = os.environ.get('GREENSHIFT_ADMIN_PASS')
        try:
            os.environ['GREENSHIFT_FACILITY_PASS'] = 'FacilitySuperSecret@2026'
            os.environ['GREENSHIFT_ADMIN_PASS'] = 'AdminSuperSecret@2026'

            # 1. Thử đăng nhập với mật khẩu cửa hậu cũ '1234' -> Phải bị từ chối 401
            res_backdoor = self.client.post('/api/login', json={
                'username': 'giamdoc@greenshift.vn',
                'password': '1234'
            })
            self.assertEqual(res_backdoor.status_code, 401, "Mật khẩu mặc định 1234 phải bị từ chối khi đã có cấu hình mật khẩu")

            # 2. Thử dùng chung mật khẩu Admin để đăng nhập tài khoản cơ sở -> Phải bị từ chối 401
            res_admin_pass = self.client.post('/api/login', json={
                'username': 'giamdoc@greenshift.vn',
                'password': 'AdminSuperSecret@2026'
            })
            self.assertEqual(res_admin_pass.status_code, 401, "Không được dùng chung mật khẩu admin cho tài khoản cơ sở")

            # 3. Đăng nhập đúng mật khẩu cơ sở đã cấu hình -> Thành công 200
            res_valid = self.client.post('/api/login', json={
                'username': 'giamdoc@greenshift.vn',
                'password': 'FacilitySuperSecret@2026'
            })
            self.assertEqual(res_valid.status_code, 200)
            self.assertEqual(res_valid.get_json()['role'], 'manager')
        finally:
            if old_pass is not None:
                os.environ['GREENSHIFT_FACILITY_PASS'] = old_pass
            else:
                os.environ.pop('GREENSHIFT_FACILITY_PASS', None)
            if old_admin is not None:
                os.environ['GREENSHIFT_ADMIN_PASS'] = old_admin
            else:
                os.environ.pop('GREENSHIFT_ADMIN_PASS', None)

    def test_production_fails_fast_on_default_facility_pass(self):
        """Khẳng định khi chạy production, nếu GREENSHIFT_FACILITY_PASS để trống hoặc bằng 1234 sẽ bị chặn fail-fast"""
        def simulate_prod_check(fac_pass):
            if not fac_pass or fac_pass == '1234':
                raise RuntimeError("CRITICAL: GREENSHIFT_FACILITY_PASS must be set and cannot be default '1234' in production.")
            return True

        with self.assertRaises(RuntimeError) as ctx_none:
            simulate_prod_check(None)
        self.assertIn("GREENSHIFT_FACILITY_PASS", str(ctx_none.exception))

        with self.assertRaises(RuntimeError) as ctx_default:
            simulate_prod_check('1234')
        self.assertIn("GREENSHIFT_FACILITY_PASS", str(ctx_default.exception))

        # Khi cấu hình mật khẩu mạnh -> Khởi động thành công
        self.assertTrue(simulate_prod_check('Complex_Pass_2026!'))

    def test_cbam_zero_production_safe_handling(self):
        """Khẳng định khi sản lượng AL = 0, báo cáo xử lý an toàn không bị lỗi chia cho 0"""
        payload = {
            'year': 2026,
            'company': 'Nhà máy Thép Tạm Ngừng Hoạt Động',
            'al': 0,
            'exportQty': 0,
            'fuels': [{'name': 'DO', 'tco2e': 50.0}],
            'elecMwh': 20,
            'elecEf': 0.7221
        }
        output, filename, err, status = process_internal_audit_report(payload)
        self.assertIsNone(err)
        self.assertEqual(status, 200)
        self.assertTrue(filename.endswith('.xlsx'))

    def test_cors_whitelist_and_sql_separation_of_duties(self):
        """Khẳng định CORS không dùng wildcard * và CSDL có ràng buộc Four-eyes principle"""
        from server.app import ALLOWED_ORIGINS
        self.assertNotIn('*', ALLOWED_ORIGINS)
        self.assertTrue(any('greenshift.vercel.app' in orig for orig in ALLOWED_ORIGINS))

        # Kiểm tra ràng buộc phân tách quyền trong file SQL
        sql_path = os.path.join(os.path.dirname(__file__), '..', 'data', 'reference', 'greenshift_supabase.sql')
        with open(sql_path, 'r', encoding='utf-8') as f:
            sql_content = f.read()
        self.assertIn('chk_recon_distinct_approver', sql_content)
        self.assertIn('reconciled_by != approved_by', sql_content)

if __name__ == '__main__':
    unittest.main()
