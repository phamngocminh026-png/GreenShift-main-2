import os
import sys
import time
import json
import re
import hmac
import hashlib
import base64
from functools import wraps
from io import BytesIO
from flask import Flask, request, send_file, send_from_directory, jsonify
from flask_cors import CORS

from server.config import PROJECT_ROOT, ASSETS_DIR
from server.services.cbam_service import process_cbam_excel_report, process_internal_audit_report
from server.services.lookup_service import lookup_default_factor

# Initialize Flask application without implicit static folder on root
app = Flask(__name__, static_folder=None)

@app.before_request
def block_sensitive_requests():
    # Chặn truy cập trực tiếp file cấu hình, mã nguồn, CSDL và tài liệu nhạy cảm
    path = request.path.lstrip('/')
    sensitive_prefixes = (
        '.env', 'data/', 'server/', 'scratch/', 'tests/', '.git',
        'docs/', '__pycache__', 'package.json', 'package-lock.json',
        'requirements.txt', 'vercel.json', '.vscode', '.github'
    )
    if any(path.startswith(p) for p in sensitive_prefixes) or path.endswith('.py') or path.endswith('.sql') or path.endswith('.md'):
        return jsonify({'error': 'Forbidden'}), 403

ALLOWED_ORIGINS = [
    orig.strip() for orig in os.environ.get(
        'ALLOWED_ORIGINS',
        'http://localhost:5000,http://127.0.0.1:5000,http://localhost:3000,http://127.0.0.1:3000,https://greenshift.vercel.app'
    ).split(',') if orig.strip()
]
CORS(app, origins=ALLOWED_ORIGINS)

ENVIRONMENT = os.environ.get('ENVIRONMENT', 'development').lower()
JWT_SECRET = os.environ.get('GREENSHIFT_JWT_SECRET')
ADMIN_USER = os.environ.get('GREENSHIFT_ADMIN_USER', 'greenshiftacl2026')
ADMIN_PASS = os.environ.get('GREENSHIFT_ADMIN_PASS', '1234')
FACILITY_PASS = os.environ.get('GREENSHIFT_FACILITY_PASS')

# Fail-fast validation in production
if ENVIRONMENT == 'production':
    if not JWT_SECRET or JWT_SECRET == 'greenshift-audit-secret-2026':
        raise RuntimeError("CRITICAL: GREENSHIFT_JWT_SECRET must be set and cannot use the default hardcoded secret in production.")
    if ADMIN_PASS == '1234':
        raise RuntimeError("CRITICAL: GREENSHIFT_ADMIN_PASS cannot be default '1234' in production.")
    if ADMIN_USER == 'greenshiftacl2026':
        raise RuntimeError("CRITICAL: GREENSHIFT_ADMIN_USER cannot be default 'greenshiftacl2026' in production.")
    if not FACILITY_PASS or FACILITY_PASS == '1234':
        raise RuntimeError("CRITICAL: GREENSHIFT_FACILITY_PASS must be set and cannot be default '1234' in production.")
else:
    if not JWT_SECRET:
        JWT_SECRET = 'greenshift-audit-secret-2026'

# Brute-force protection for login
LOGIN_ATTEMPTS = {}
MAX_FAILED_ATTEMPTS = 5
LOCKOUT_WINDOW_SECONDS = 900

# Rate limiting for public survey submissions
SURVEY_SUBMISSIONS = {}
MAX_SURVEY_ATTEMPTS = 30
SURVEY_WINDOW_SECONDS = 900

def is_login_rate_limited(identifier: str) -> bool:
    now = time.time()
    attempts = LOGIN_ATTEMPTS.get(identifier, [])
    recent = [t for t in attempts if now - t < LOCKOUT_WINDOW_SECONDS]
    LOGIN_ATTEMPTS[identifier] = recent
    return len(recent) >= MAX_FAILED_ATTEMPTS

def record_failed_login(identifier: str):
    now = time.time()
    if identifier not in LOGIN_ATTEMPTS:
        LOGIN_ATTEMPTS[identifier] = []
    LOGIN_ATTEMPTS[identifier].append(now)

def clear_failed_login(identifier: str):
    LOGIN_ATTEMPTS.pop(identifier, None)

def is_survey_rate_limited(identifier: str) -> bool:
    now = time.time()
    attempts = SURVEY_SUBMISSIONS.get(identifier, [])
    recent = [t for t in attempts if now - t < SURVEY_WINDOW_SECONDS]
    SURVEY_SUBMISSIONS[identifier] = recent
    return len(recent) >= MAX_SURVEY_ATTEMPTS

def record_survey_submission(identifier: str):
    now = time.time()
    if identifier not in SURVEY_SUBMISSIONS:
        SURVEY_SUBMISSIONS[identifier] = []
    SURVEY_SUBMISSIONS[identifier].append(now)

def b64url_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).decode('utf-8').rstrip('=')

def b64url_decode(s: str) -> bytes:
    padding = '=' * (-len(s) % 4)
    return base64.urlsafe_b64decode(s + padding)

def create_jwt(payload: dict) -> str:
    header = {'alg': 'HS256', 'typ': 'JWT'}
    header_b64 = b64url_encode(json.dumps(header).encode('utf-8'))
    payload_b64 = b64url_encode(json.dumps(payload).encode('utf-8'))
    message = f'{header_b64}.{payload_b64}'.encode('utf-8')
    sig = hmac.new(JWT_SECRET.encode('utf-8'), message, hashlib.sha256).digest()
    sig_b64 = b64url_encode(sig)
    return f'{header_b64}.{payload_b64}.{sig_b64}'

def verify_jwt(token: str) -> dict:
    if not token or token.count('.') != 2:
        return None
    try:
        header_b64, payload_b64, sig_b64 = token.split('.')
        message = f'{header_b64}.{payload_b64}'.encode('utf-8')
        
        # 1. Xác thực với GREENSHIFT_JWT_SECRET
        expected_sig = hmac.new(JWT_SECRET.encode('utf-8'), message, hashlib.sha256).digest()
        provided_sig = b64url_decode(sig_b64)
        if hmac.compare_digest(expected_sig, provided_sig):
            payload = json.loads(b64url_decode(payload_b64).decode('utf-8'))
            if 'exp' in payload and payload['exp'] < time.time():
                return None
            return payload
            
        # 2. Hỗ trợ xác thực với SUPABASE_JWT_SECRET nếu được cấu hình
        supabase_secret = os.environ.get('SUPABASE_JWT_SECRET')
        if supabase_secret:
            sb_expected = hmac.new(supabase_secret.encode('utf-8'), message, hashlib.sha256).digest()
            if hmac.compare_digest(sb_expected, provided_sig):
                payload = json.loads(b64url_decode(payload_b64).decode('utf-8'))
                if 'exp' in payload and payload['exp'] < time.time():
                    return None
                if 'facility_id' not in payload:
                    user_meta = payload.get('user_metadata', {})
                    payload['facility_id'] = user_meta.get('facility_id', 1)
                    payload['role'] = user_meta.get('role', 'authenticated')
                return payload

        return None
    except Exception:
        return None

def require_auth(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get('Authorization', '')
        token = None
        if auth_header.startswith('Bearer '):
            token = auth_header[7:].strip()
        elif request.headers.get('x-access-token'):
            token = request.headers.get('x-access-token')
        
        user_data = verify_jwt(token) if token else None
        
        # Đảo ngược logic: mặc định luôn yêu cầu token hợp lệ.
        # Chặn tuyệt đối bypass trên môi trường production
        env_is_production = os.environ.get('ENVIRONMENT', 'development').lower() == 'production'
        raw_debug_local = os.environ.get('DEBUG_LOCAL', '').lower() in ('true', '1')
        
        if env_is_production and raw_debug_local:
            import logging
            logging.critical("SECURITY CRITICAL: DEBUG_LOCAL bypass is strictly prohibited in production environment!")
            raw_debug_local = False

        is_debug_local = raw_debug_local or (
            app.config.get('TESTING', False) and app.config.get('TESTING_ALLOW_ANON', True)
        )
        
        if not user_data:
            if is_debug_local:
                import logging
                logging.warning("SECURITY WARNING: require_auth bypassed via DEBUG_LOCAL/TESTING mode. Temporary LOCAL_ADMIN assigned.")
                request.user = {'role': 'LOCAL_ADMIN', 'facility_id': 1}
            else:
                return jsonify({'error': 'Unauthorized: Yêu cầu mã token xác thực hợp lệ để truy cập'}), 401
        else:
            request.user = user_data
            
        return f(*args, **kwargs)
    return decorated


# ============================================================================
# AUTHENTICATION APIS
# ============================================================================

@app.route('/api/register', methods=['POST'])
def api_register():
    return jsonify({
        'success': False, 
        'message': 'Tính năng đăng ký trực tiếp tạm đóng. Vui lòng liên hệ quản trị viên để được cấp tài khoản.'
    }), 200

@app.route('/api/login', methods=['POST'])
def api_login():
    data = request.json or {}
    username = data.get('username')
    password = data.get('password')
    
    client_ip = request.remote_addr or '127.0.0.1'
    rate_key = f"{client_ip}:{username or 'anon'}"
    if is_login_rate_limited(rate_key):
        return jsonify({
            'success': False,
            'message': 'Tài khoản hoặc địa chỉ IP tạm thời bị khóa do nhập sai quá nhiều lần. Vui lòng thử lại sau 15 phút.'
        }), 429
    
    # Danh mục tài khoản người dùng cơ sở (đồng bộ schema Supabase greenshift_supabase.sql)
    FACILITY_REGISTERED_USERS = {
        'ketoan@greenshift.vn': {'facility_id': 1, 'role': 'accountant', 'facility_name': 'Công ty TNHH Thép Xanh Hải Phòng (GreenSteel)'},
        'kythuat@greenshift.vn': {'facility_id': 1, 'role': 'engineer', 'facility_name': 'Công ty TNHH Thép Xanh Hải Phòng (GreenSteel)'},
        'giamdoc@greenshift.vn': {'facility_id': 1, 'role': 'manager', 'facility_name': 'Công ty TNHH Thép Xanh Hải Phòng (GreenSteel)'},
        'cement_admin@greenshift.vn': {'facility_id': 2, 'role': 'manager', 'facility_name': 'Nhà máy Xi măng Sông Lam Eco (Cement)'},
        'agri_admin@greenshift.vn': {'facility_id': 3, 'role': 'manager', 'facility_name': 'Tổng công ty Phân bón Hóa chất GreenAgri'},
        'alu_admin@greenshift.vn': {'facility_id': 4, 'role': 'manager', 'facility_name': 'Tập đoàn Nhôm Đúc Xuất khẩu Việt Á (VinaAlu)'},
    }

    admin_u = os.environ.get('GREENSHIFT_ADMIN_USER', ADMIN_USER)
    admin_p = os.environ.get('GREENSHIFT_ADMIN_PASS', ADMIN_PASS)
    
    # 1. Quản trị viên hệ thống (System Admin)
    if username and password and username == admin_u and hmac.compare_digest(password.encode('utf-8'), admin_p.encode('utf-8')):
        clear_failed_login(rate_key)
        target_fid = int(data.get('facility_id', 1))
        token = create_jwt({
            'sub': username,
            'role': 'SYSTEM_ADMIN',
            'facility_id': target_fid,
            'facility_name': 'GreenShift Enterprise Admin',
            'exp': int(time.time()) + (86400 * 7)
        })
        return jsonify({
            'success': True, 
            'company': 'GreenShift ACL',
            'token': token,
            'facility_id': target_fid,
            'role': 'SYSTEM_ADMIN'
        })

    # 2. Người dùng cơ sở đa khách hàng (Multi-tenant Facility User)
    if username and password and username in FACILITY_REGISTERED_USERS:
        u_info = FACILITY_REGISTERED_USERS[username]
        # Tra cứu mật khẩu cấu hình theo thứ tự ưu tiên:
        # a. PASS_<username> (mật khẩu riêng từng tài khoản)
        # b. GREENSHIFT_FACILITY_PASS (mật khẩu chung cho các cơ sở)
        # c. '1234' CHỈ KHI ở môi trường non-production và chưa cấu hình biến môi trường nào
        user_env_key = f"PASS_{username.replace('@', '_').replace('.', '_')}"
        configured_pass = os.environ.get(user_env_key) or os.environ.get('GREENSHIFT_FACILITY_PASS')
        
        current_env = os.environ.get('ENVIRONMENT', ENVIRONMENT).lower()
        if configured_pass:
            expected_pass = configured_pass
        elif current_env != 'production':
            expected_pass = '1234'
        else:
            expected_pass = None

        # Xác thực nghiêm ngặt với constant-time comparison chống Timing Attacks
        if expected_pass and hmac.compare_digest(password.encode('utf-8'), str(expected_pass).encode('utf-8')):
            clear_failed_login(rate_key)
            token = create_jwt({
                'sub': username,
                'role': u_info['role'],
                'facility_id': u_info['facility_id'],
                'facility_name': u_info['facility_name'],
                'exp': int(time.time()) + (86400 * 7)
            })
            return jsonify({
                'success': True,
                'company': u_info['facility_name'],
                'token': token,
                'facility_id': u_info['facility_id'],
                'role': u_info['role']
            })

    # 3. Xác thực động qua Supabase Auth API (khi SUPABASE_URL và SUPABASE_KEY được cấu hình)
    sb_url = os.environ.get('SUPABASE_URL')
    sb_anon_key = os.environ.get('SUPABASE_ANON_KEY') or os.environ.get('SUPABASE_KEY')
    if sb_url and sb_anon_key and username and password:
        try:
            import urllib.request
            auth_endpoint = f"{sb_url.rstrip('/')}/auth/v1/token?grant_type=password"
            req_payload = json.dumps({'email': username, 'password': password}).encode('utf-8')
            sb_headers = {
                'Content-Type': 'application/json',
                'apikey': sb_anon_key,
                'Authorization': f'Bearer {sb_anon_key}'
            }
            sb_req = urllib.request.Request(auth_endpoint, data=req_payload, headers=sb_headers, method='POST')
            with urllib.request.urlopen(sb_req, timeout=5) as sb_res:
                if sb_res.status == 200:
                    sb_data = json.loads(sb_res.read().decode('utf-8'))
                    sb_token = sb_data.get('access_token')
                    sb_user = sb_data.get('user', {})
                    user_meta = sb_user.get('user_metadata', {})
                    clear_failed_login(rate_key)
                    return jsonify({
                        'success': True,
                        'company': user_meta.get('facility_name', 'Cơ sở Supabase'),
                        'token': sb_token,
                        'facility_id': user_meta.get('facility_id', 1),
                        'role': user_meta.get('role', 'engineer')
                    })
        except Exception as sb_err:
            import logging
            logging.getLogger(__name__).warning(f"[api_login] Supabase Auth verification error: {sb_err}")
        
    record_failed_login(rate_key)
    return jsonify({'success': False, 'message': 'Sai tài khoản hoặc mật khẩu.'}), 401


# ============================================================================
# CBAM & INTERNAL AUDIT REPORT APIS
# ============================================================================

@app.route('/api/generate-report', methods=['POST'])
@require_auth
def api_generate_report():
    data = request.json or {}
    
    # IDOR check: Non-admin users cannot generate reports for other facilities
    user = getattr(request, 'user', {})
    user_role = user.get('role', '')
    user_facility = str(user.get('facility_id', ''))
    req_facility = str(data.get('facility_id', '')).strip()
    if req_facility and user_facility and user_role != 'SYSTEM_ADMIN' and req_facility != user_facility:
        return jsonify({'error': 'Forbidden: Bạn không có quyền truy cập dữ liệu của cơ sở này'}), 403

    output, filename, error, status = process_cbam_excel_report(data)
    if error:
        return jsonify({'error': error}), status
        
    return send_file(
        output,
        download_name=filename,
        as_attachment=True,
        mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    )

@app.route('/api/generate-internal-report', methods=['POST'])
@require_auth
def api_generate_internal_report():
    data = request.json or {}
    
    # IDOR check: Non-admin users cannot generate reports for other facilities
    user = getattr(request, 'user', {})
    user_role = user.get('role', '')
    user_facility = str(user.get('facility_id', ''))
    req_facility = str(data.get('facility_id', '')).strip()
    if req_facility and user_facility and user_role != 'SYSTEM_ADMIN' and req_facility != user_facility:
        return jsonify({'error': 'Forbidden: Bạn không có quyền truy cập dữ liệu của cơ sở này'}), 403

    output, filename, error, status = process_internal_audit_report(data)
    if error:
        return jsonify({'error': error}), status
        
    return send_file(
        output,
        download_name=filename,
        as_attachment=True,
        mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    )

@app.route('/api/lookup-default', methods=['POST'])
@require_auth
def api_lookup_default():
    data = request.json or {}
    cn_code = data.get('cnCode')
    country = data.get('country', 'Viet Nam')
    result, status = lookup_default_factor(cn_code, country)
    return jsonify(result), status

@app.route('/api/save-supplier', methods=['POST'])
def api_save_supplier():
    client_ip = request.remote_addr or '127.0.0.1'
    if is_survey_rate_limited(client_ip):
        return jsonify({
            'success': False,
            'message': 'Đã vượt quá giới hạn gửi khảo sát. Vui lòng thử lại sau 15 phút.'
        }), 429

    data = request.json or {}
    raw_token = data.get('token')
    supplier = data.get('supplier', {})
    if not supplier or not supplier.get('companyName'):
        return jsonify({'success': False, 'message': 'Thiếu thông tin nhà cung cấp'}), 400
    
    record_survey_submission(client_ip)
    
    import uuid
    if raw_token and str(raw_token).strip() != 'public-survey':
        safe = re.sub(r'[^a-zA-Z0-9_-]', '', str(raw_token).strip())[:64]
    else:
        safe = uuid.uuid4().hex
        
    if not safe or len(safe) < 6:
        safe = uuid.uuid4().hex
        
    import datetime
    payload = {
        **supplier,
        'token': safe,
        'submittedAt': datetime.datetime.utcnow().isoformat()
    }

    # Persistent or temp storage handling (safe for read-only serverless filesystem)
    suppliers_dir = os.path.join(PROJECT_ROOT, 'data', 'suppliers')
    try:
        os.makedirs(suppliers_dir, exist_ok=True)
        file_path = os.path.join(suppliers_dir, f'{safe}.json')
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(payload, f, ensure_ascii=False, indent=2)
    except (OSError, PermissionError):
        import tempfile
        tmp_dir = os.path.join(tempfile.gettempdir(), 'greenshift_suppliers')
        os.makedirs(tmp_dir, exist_ok=True)
        file_path = os.path.join(tmp_dir, f'{safe}.json')
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(payload, f, ensure_ascii=False, indent=2)
        
    return jsonify({
        'success': True,
        'message': 'Đã lưu bản ghi khảo sát nhà cung cấp vào cơ sở dữ liệu.',
        'token': safe,
        'url': f'/api/suppliers/{safe}'
    })

@app.route('/api/suppliers/<token>', methods=['GET'])
def api_get_supplier(token):
    safe = re.sub(r'[^a-zA-Z0-9_-]', '', str(token).strip())[:64]
    if not safe:
        return jsonify({'error': 'Token không hợp lệ'}), 400
    file_path = os.path.join(PROJECT_ROOT, 'data', 'suppliers', f'{safe}.json')
    if not os.path.exists(file_path):
        import tempfile
        tmp_path = os.path.join(tempfile.gettempdir(), 'greenshift_suppliers', f'{safe}.json')
        if os.path.exists(tmp_path):
            file_path = tmp_path
        else:
            return jsonify({'error': 'Không tìm thấy dữ liệu khảo sát'}), 404
    with open(file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    return jsonify({'success': True, 'supplier': data})


# ============================================================================
# STATIC PAGES & BACKWARD-COMPATIBLE ASSET SERVING
# ============================================================================

@app.route('/')
def index():
    return send_from_directory(PROJECT_ROOT, 'index.html')

# Static assets routing
@app.route('/assets/<path:filename>')
def serve_assets(filename):
    return send_from_directory(ASSETS_DIR, filename)

# Backward compatibility: redirect or serve legacy paths transparently
@app.route('/css/<path:filename>')
def serve_legacy_css(filename):
    return send_from_directory(os.path.join(ASSETS_DIR, 'css'), filename)

@app.route('/js/<path:filename>')
def serve_legacy_js(filename):
    return send_from_directory(os.path.join(ASSETS_DIR, 'js'), filename)

@app.route('/Images/<path:filename>')
@app.route('/images/<path:filename>')
def serve_legacy_images(filename):
    return send_from_directory(os.path.join(ASSETS_DIR, 'images'), filename)

@app.route('/libs/<path:filename>')
def serve_legacy_libs(filename):
    return send_from_directory(os.path.join(ASSETS_DIR, 'vendor'), filename)

ALLOWED_ROOT_FILES = {
    '', 'index.html', 'carbon-inventory.html', 'cbam-dashboard.html',
    'login.html', 'setup.html', 'supplier.html', 'about.html', 'favicon.ico'
}

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_static(path):
    clean_path = path.strip('/')
    if clean_path in ALLOWED_ROOT_FILES:
        filename = 'index.html' if clean_path == '' else clean_path
        return send_from_directory(PROJECT_ROOT, filename)
    return jsonify({'error': 'Not Found'}), 404


if __name__ == '__main__':
    debug_mode = os.environ.get('FLASK_DEBUG', 'False').lower() in ('true', '1', 't')
    port = int(os.environ.get('PORT', 5000))
    print(f'Starting GreenShift Server on http://localhost:{port} (debug={debug_mode})')
    app.run(host='0.0.0.0', port=port, debug=debug_mode)
