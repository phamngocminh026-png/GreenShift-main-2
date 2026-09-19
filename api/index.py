import os
import sys

# Add project root to sys.path so server module is resolvable on serverless runtime
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(CURRENT_DIR, '..'))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from server.app import app

# Vercel WSGI entry point
handler = app
