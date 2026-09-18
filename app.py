"""
GreenShift Application Launcher
Run this script to start the local backend server:
    python app.py
Access the platform at: http://localhost:5000
"""

import sys
import os

# Add project root to sys.path so server package can be imported reliably
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from server.app import app

if __name__ == '__main__':
    print("==================================================")
    print(" GreenShift Platform Server")
    print(" Running at: http://localhost:5000")
    print(" Press Ctrl+C to stop.")
    print("==================================================")
    debug_mode = os.environ.get('FLASK_DEBUG', 'False').lower() in ('true', '1', 't')
    app.run(host='0.0.0.0', port=5000, debug=debug_mode)
