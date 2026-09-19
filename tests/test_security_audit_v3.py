import os
import sys
import unittest
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from server.app import app
from server.services.cbam_service import map_to_ec_fuel_label, map_to_ec_process_label

class TestSecurityAuditV3(unittest.TestCase):
    def setUp(self):
        self.client = app.test_client()

    def test_static_file_exposure_blocked(self):
        """Khẳng định các tệp mã nguồn, CSDL, cấu hình và tài liệu bị chặn 403 hoàn toàn"""
        blocked_paths = [
            '/server/app.py',
            '/server/config.py',
            '/data/reference/greenshift_supabase.sql',
            '/docs/PROJECT_BRIEF.md',
            '/.env',
            '/package.json',
            '/requirements.txt',
            '/scratch/test.py'
        ]
        for path in blocked_paths:
            res = self.client.get(path)
            self.assertEqual(
                res.status_code, 403,
                f"Đường dẫn nhạy cảm {path} phải trả về 403 Forbidden, nhưng nhận {res.status_code}"
            )

    def test_allowed_pages_accessible(self):
        """Khẳng định các trang ứng dụng hợp lệ vẫn truy cập bình thường (200)"""
        allowed = ['/', '/index.html', '/carbon-inventory.html', '/cbam-dashboard.html', '/login.html']
        for path in allowed:
            res = self.client.get(path)
            self.assertEqual(res.status_code, 200, f"Trang hợp lệ {path} phải trả về 200")

    def test_unregistered_root_files_404(self):
        """Khẳng định tệp lạ ngoài danh sách whitelist trả về 404"""
        res = self.client.get('/arbitrary_file.txt')
        self.assertEqual(res.status_code, 404)

    def test_login_backdoor_eliminated(self):
        """Khẳng định cửa hậu hardcoded đã bị gỡ bỏ hoàn toàn"""
        old_user = os.environ.get('GREENSHIFT_ADMIN_USER')
        old_pass = os.environ.get('GREENSHIFT_ADMIN_PASS')
        try:
            os.environ['GREENSHIFT_ADMIN_USER'] = 'valid_admin_2026'
            os.environ['GREENSHIFT_ADMIN_PASS'] = 'SuperSecretPass@999'

            # Tài khoản hardcoded cũ phải bị từ chối 401
            res_old = self.client.post('/api/login', json={'username': 'greenshiftacl2026', 'password': '1234'})
            self.assertEqual(res_old.status_code, 401, "Cửa hậu cũ phải bị từ chối 401 Unauthorized")

            # Tài khoản theo biến môi trường phải đăng nhập thành công 200
            res_valid = self.client.post('/api/login', json={'username': 'valid_admin_2026', 'password': 'SuperSecretPass@999'})
            self.assertEqual(res_valid.status_code, 200, "Thông tin quản trị hợp lệ phải được 200 OK")
        finally:
            if old_user is not None:
                os.environ['GREENSHIFT_ADMIN_USER'] = old_user
            else:
                os.environ.pop('GREENSHIFT_ADMIN_USER', None)
            if old_pass is not None:
                os.environ['GREENSHIFT_ADMIN_PASS'] = old_pass
            else:
                os.environ.pop('GREENSHIFT_ADMIN_PASS', None)

    def test_ec_label_mapping(self):
        """Khẳng định nhãn nhiên liệu và nguyên liệu được ánh xạ đúng chuẩn EU"""
        self.assertEqual(map_to_ec_fuel_label('Dầu Diesel DO 0.05S'), 'Gas / Diesel Oil')
        self.assertEqual(map_to_ec_fuel_label('Dầu FO đốt lò'), 'Heavy Fuel Oil')
        self.assertEqual(map_to_ec_fuel_label('Khí dầu mỏ hóa lỏng LPG'), 'Liquefied Petroleum Gas (LPG)')
        self.assertEqual(map_to_ec_fuel_label('Khí tự nhiên LNG'), 'Natural Gas')
        self.assertEqual(map_to_ec_fuel_label('Than mỡ bituminous'), 'Other Bituminous Coal')
        self.assertEqual(map_to_ec_fuel_label('Than Antraxit'), 'Anthracite')
        
        self.assertEqual(map_to_ec_process_label('Đá vôi CaCO3 lò nung'), 'Limestone and other carbonates')
        self.assertEqual(map_to_ec_process_label('Quặng Đô-lô-mít'), 'Dolomite')
        self.assertEqual(map_to_ec_process_label('Anot than cực âm'), 'Carbon electrodes / anodes')

if __name__ == '__main__':
    unittest.main()
