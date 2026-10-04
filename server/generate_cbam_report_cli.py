"""
Command-line interface to generate official EU CBAM Excel report.
Called by server_node.js or directly by CLI.
"""
import sys
import os
import json

# Ensure project root is in sys.path
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from server.services.cbam_service import process_cbam_excel_report

def main():
    if len(sys.argv) > 1 and os.path.exists(sys.argv[1]):
        with open(sys.argv[1], 'r', encoding='utf-8') as f:
            data = json.load(f)
    else:
        # Read from stdin
        raw = sys.stdin.read()
        data = json.loads(raw) if raw else {}

    output, filename, error, status = process_cbam_excel_report(data)
    if error:
        sys.stderr.write(f"ERROR ({status}): {error}\n")
        sys.exit(1)

    output_path = sys.argv[2] if len(sys.argv) > 2 else None
    if output_path:
        with open(output_path, 'wb') as f:
            f.write(output.read())
        print(f"SUCCESS:{output_path}")
    else:
        # Write binary to stdout
        if sys.platform == "win32":
            import msvcrt
            msvcrt.setmode(sys.stdout.fileno(), os.O_BINARY)
        sys.stdout.buffer.write(output.read())

if __name__ == '__main__':
    main()
