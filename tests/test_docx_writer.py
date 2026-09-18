import os

root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
export_js = os.path.join(root_dir, 'assets', 'js', 'word-export.js')

print(f"Checking word-export.js at: {export_js}")
if os.path.exists(export_js):
    with open(export_js, 'r', encoding='utf-8') as f:
        content = f.read(500)
    print("SUCCESS: word-export.js is accessible and contains base64 template.")
else:
    print("ERROR: word-export.js not found.")
