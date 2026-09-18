import os
import sys
from io import BytesIO
from flask import Flask, request, send_file, send_from_directory, jsonify, abort
from flask_cors import CORS

from server.config import PROJECT_ROOT, ASSETS_DIR
from server.services.cbam_service import process_cbam_excel_report, process_internal_audit_report
from server.services.lookup_service import lookup_default_factor

# Initialize Flask application
app = Flask(__name__)
CORS(app)


# ============================================================================
# AUTHENTICATION APIS
# ============================================================================

@app.route('/api/register', methods=['POST'])
def api_register():
    return jsonify({
        "success": False, 
        "message": "Tính năng đăng ký tạm thời bị đóng. Vui lòng dùng tài khoản hệ thống."
    })

@app.route('/api/login', methods=['POST'])
def api_login():
    data = request.json or {}
    username = data.get('username', '').strip()
    password = data.get('password', '').strip()
    
    if not username or not password:
        return jsonify({"success": False, "message": "Vui lòng nhập tài khoản và mật khẩu."}), 400

    admin_user = os.environ.get('GREENSHIFT_ADMIN_USER')
    admin_pass = os.environ.get('GREENSHIFT_ADMIN_PASS')
    if admin_user and admin_pass and username == admin_user and password == admin_pass:
        return jsonify({"success": True, "company": "GreenShift Enterprise", "role": "admin"})
        
    return jsonify({
        "success": False, 
        "message": "Xác thực đăng nhập qua Supabase Cloud Auth. Vui lòng sử dụng thông tin đăng nhập đã được cấp."
    }), 401


# ============================================================================
# CBAM & INTERNAL AUDIT REPORT APIS
# ============================================================================

@app.route('/api/generate-report', methods=['POST'])
def api_generate_report():
    data = request.json or {}
    output, filename, error, status = process_cbam_excel_report(data)
    if error:
        return jsonify({"error": error}), status
        
    return send_file(
        output,
        download_name=filename,
        as_attachment=True,
        mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    )

@app.route('/api/generate-internal-report', methods=['POST'])
def api_generate_internal_report():
    data = request.json or {}
    output, filename, error, status = process_internal_audit_report(data)
    if error:
        return jsonify({"error": error}), status
        
    return send_file(
        output,
        download_name=filename,
        as_attachment=True,
        mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    )

@app.route('/api/lookup-default', methods=['POST'])
def api_lookup_default():
    data = request.json or {}
    cn_code = data.get('cnCode')
    country = data.get('country', 'Viet Nam')
    result, status = lookup_default_factor(cn_code, country)
    return jsonify(result), status

@app.route('/api/save-supplier', methods=['POST'])
def api_save_supplier():
    data = request.json or {}
    token = data.get('token', 'public-survey')
    supplier = data.get('supplier', {})
    if not supplier or not supplier.get('companyName'):
        return jsonify({"success": False, "message": "Thiếu thông tin nhà cung cấp"}), 400
    return jsonify({
        "success": True,
        "message": "Đã lưu bản ghi khảo sát nhà cung cấp.",
        "url": f"/mock-suppliers/{token}.json"
    })


# ============================================================================
# STATIC PAGES & BACKWARD-COMPATIBLE ASSET SERVING
# ============================================================================

@app.route('/')
def index():
    return send_from_directory(PROJECT_ROOT, 'index.html')

# Backward compatibility: redirect or serve legacy paths transparently
@app.route('/css/<path:filename>')
def serve_legacy_css(filename):
    return send_from_directory(os.path.join(ASSETS_DIR, 'css'), filename)

@app.route('/js/<path:filename>')
def serve_legacy_js(filename):
    return send_from_directory(os.path.join(ASSETS_DIR, 'js'), filename)

@app.route('/Images/<path:filename>')
def serve_legacy_images(filename):
    return send_from_directory(os.path.join(ASSETS_DIR, 'images'), filename)

@app.route('/libs/<path:filename>')
def serve_legacy_libs(filename):
    return send_from_directory(os.path.join(ASSETS_DIR, 'vendor'), filename)

FORBIDDEN_PREFIXES = ('.env', 'data/', 'server/', 'scratch/', 'tests/', '.git', 'node_modules/')
ALLOWED_EXTENSIONS = ('.html', '.css', '.js', '.png', '.jpg', '.jpeg', '.svg', '.ico', '.woff', '.woff2', '.ttf', '.json', '.xlsx', '.docx')

@app.route('/')
def serve_index():
    return send_from_directory(PROJECT_ROOT, 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    normalized = path.replace('\\', '/').lstrip('/')
    for forbidden in FORBIDDEN_PREFIXES:
        if normalized == forbidden or normalized.startswith(forbidden):
            abort(403)
    # Block any hidden file or path component starting with dot (e.g. .env, .git)
    if any(segment.startswith('.') for segment in normalized.split('/')):
        abort(403)
    
    full_path = os.path.abspath(os.path.join(PROJECT_ROOT, normalized))
    if not full_path.startswith(PROJECT_ROOT):
        abort(403)
    if not os.path.isfile(full_path):
        abort(404)
    if not any(normalized.lower().endswith(ext) for ext in ALLOWED_EXTENSIONS):
        abort(403)
    return send_from_directory(PROJECT_ROOT, normalized)


if __name__ == '__main__':
    debug_mode = os.environ.get('FLASK_DEBUG', 'False').lower() in ('true', '1', 't')
    port = int(os.environ.get('PORT', 5000))
    print(f"Starting GreenShift Server on http://localhost:{port} (debug={debug_mode})")
    app.run(host='0.0.0.0', port=port, debug=debug_mode)
