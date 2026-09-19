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

ALLOWED_ORIGINS = os.environ.get(
    'ALLOWED_ORIGINS',
    'http://localhost:5000,http://127.0.0.1:5000,http://localhost:3000,https://greenshift.vercel.app'
).split(',')
CORS(app, origins=ALLOWED_ORIGINS if os.environ.get('ENVIRONMENT') == 'production' else '*')

ENVIRONMENT = os.environ.get('ENVIRONMENT', 'development').lower()
JWT_SECRET = os.environ.get('GREENSHIFT_JWT_SECRET')
ADMIN_USER = os.environ.get('GREENSHIFT_ADMIN_USER', 'greenshiftacl2026')
ADMIN_PASS = os.environ.get('GREENSHIFT_ADMIN_PASS', '1234')

# Fail-fast validation in production
if ENVIRONMENT == 'production':
    if not JWT_SECRET or JWT_SECRET == 'greenshift-audit-secret-2026':
        raise RuntimeError("CRITICAL: GREENSHIFT_JWT_SECRET must be set and cannot use the default hardcoded secret in production.")
    if ADMIN_PASS == '1234':
        raise RuntimeError("CRITICAL: GREENSHIFT_ADMIN_PASS cannot be default '1234' in production.")
else:
    if not JWT_SECRET:
        JWT_SECRET = 'greenshift-audit-secret-2026'

# Brute-force protection for login
LOGIN_ATTEMPTS = {}
MAX_FAILED_ATTEMPTS = 5
LOCKOUT_WINDOW_SECONDS = 900

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
        expected_sig = hmac.new(JWT_SECRET.encode('utf-8'), message, hashlib.sha256).digest()
        provided_sig = b64url_decode(sig_b64)
        if not hmac.compare_digest(expected_sig, provided_sig):
            return None
        payload = json.loads(b64url_decode(payload_b64).decode('utf-8'))
        if 'exp' in payload and payload['exp'] < time.time():
            return None
        return payload
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
        # Chỉ cho phép bypass khi có cờ DEBUG_LOCAL=true rõ ràng hoặc đang chạy suite test cho phép anon.
        is_debug_local = os.environ.get('DEBUG_LOCAL', '').lower() in ('true', '1') or (
            app.config.get('TESTING', False) and app.config.get('TESTING_ALLOW_ANON', True)
        )
        
        if not user_data:
            if is_debug_local:
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
    
    admin_u = os.environ.get('GREENSHIFT_ADMIN_USER', ADMIN_USER)
    admin_p = os.environ.get('GREENSHIFT_ADMIN_PASS', ADMIN_PASS)
    if username and password and username == admin_u and password == admin_p:
        clear_failed_login(rate_key)
        token = create_jwt({
            'sub': username,
            'role': 'SYSTEM_ADMIN',
            'facility_id': 1,
            'facility_name': 'Công ty TNHH Thép Xanh Hải Phòng (GreenSteel)',
            'exp': int(time.time()) + (86400 * 7)
        })
        return jsonify({
            'success': True, 
            'company': 'GreenShift ACL',
            'token': token,
            'facility_id': 1,
            'role': 'SYSTEM_ADMIN'
        })
        
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
    data = request.json or {}
    raw_token = data.get('token')
    supplier = data.get('supplier', {})
    if not supplier or not supplier.get('companyName'):
        return jsonify({'success': False, 'message': 'Thiếu thông tin nhà cung cấp'}), 400
    
    import uuid
    if raw_token and str(raw_token).strip() != 'public-survey':
        safe = re.sub(r'[^a-zA-Z0-9_-]', '', str(raw_token).strip())[:64]
    else:
        safe = uuid.uuid4().hex
        
    if not safe or len(safe) < 6:
        safe = uuid.uuid4().hex
        
    suppliers_dir = os.path.join(PROJECT_ROOT, 'data', 'suppliers')
    os.makedirs(suppliers_dir, exist_ok=True)
    file_path = os.path.join(suppliers_dir, f'{safe}.json')
    
    import datetime
    payload = {
        **supplier,
        'token': safe,
        'submittedAt': datetime.datetime.utcnow().isoformat()
    }
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
