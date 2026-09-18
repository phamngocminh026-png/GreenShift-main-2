"""
GreenShift API Endpoints Test Suite
Verifies Flask server routes and data processing logic.
"""

import unittest
import json
import os
import sys

# Ensure project root is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from server.app import app

class GreenShiftAPITestCase(unittest.TestCase):
    def setUp(self):
        app.config['TESTING'] = True
        self.client = app.test_client()

    def test_lookup_default_factor(self):
        """Kiểm tra API tra cứu hệ số phát thải mặc định EU CBAM"""
        res = self.client.post('/api/lookup-default', json={
            'cnCode': '72071114',
            'country': 'Viet Nam'
        })
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data.get('success'))
        self.assertEqual(data.get('cnCode'), '72071114')
        self.assertIn('directDefault', data)
        self.assertIn('indirectDefault', data)

    def test_generate_internal_report(self):
        """Kiểm tra API tạo báo cáo kiểm toán nội bộ Excel"""
        payload = {
            'year': 2026,
            'company': 'Công ty TNHH Thép Xanh Hải Phòng',
            'totalScope1': 1500.5,
            'totalScope2': 320.8
        }
        res = self.client.post('/api/generate-internal-report', json=payload)
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.mimetype, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
        self.assertGreater(len(res.data), 1000)

    def test_generate_cbam_report(self):
        """Kiểm tra API tạo báo cáo CBAM Excel chính thức"""
        payload = {
            'sector': 'Cement',
            'installation_name': 'Nhà máy Xi măng Sông Lam Eco',
            'reporting_year': 2026,
            'routes': {
                'clinker': {
                    'ad': 10000,
                    'calc_em': 1100,
                    'dir_see': 0.75,
                    'indir_see': 0.12
                }
            }
        }
        res = self.client.post('/api/generate-report', json=payload)
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.mimetype, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
        self.assertGreater(len(res.data), 10000)

    def test_save_supplier(self):
        """Kiểm tra API lưu khảo sát nhà cung cấp"""
        payload = {
            'token': 'test-token-123',
            'supplier': {
                'companyName': 'Công ty Cung ứng Vật tư Thép Phú Mỹ',
                'electricity': 50000,
                'fuel': 1200
            }
        }
        res = self.client.post('/api/save-supplier', json=payload)
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data.get('success'))

    def test_auth_endpoints_status(self):
        """Kiểm tra hiện trạng endpoint Auth mẫu trên Flask"""
        reg_res = self.client.post('/api/register', json={'username': 'test'})
        self.assertEqual(reg_res.status_code, 200)
        self.assertFalse(reg_res.get_json().get('success'))

        import os
        os.environ['GREENSHIFT_ADMIN_USER'] = 'testadmin'
        os.environ['GREENSHIFT_ADMIN_PASS'] = 'SecretTest123!'
        login_res = self.client.post('/api/login', json={
            'username': 'testadmin',
            'password': 'SecretTest123!'
        })
        self.assertEqual(login_res.status_code, 200)
        self.assertTrue(login_res.get_json().get('success'))
        # Kiem tra chan truy cap voi credentials sai (401)
        fail_res = self.client.post('/api/login', json={
            'username': 'testadmin',
            'password': 'WrongPassword'
        })
        self.assertEqual(fail_res.status_code, 401)

if __name__ == '__main__':
    unittest.main()
