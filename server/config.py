import os

# Base paths
SERVER_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(SERVER_DIR, '..'))

# Templates
TEMPLATES_DIR = os.path.join(PROJECT_ROOT, 'templates')
EXCEL_TEMPLATES_DIR = os.path.join(TEMPLATES_DIR, 'excel')
WORD_TEMPLATES_DIR = os.path.join(TEMPLATES_DIR, 'word')

DEFAULT_CBAM_TEMPLATE = os.path.join(
    EXCEL_TEMPLATES_DIR, 
    'CBAM Communication template for installations_en_20241213.xlsx'
)

# Reference Data
DATA_DIR = os.path.join(PROJECT_ROOT, 'data', 'reference')
DV_FILE_PATH = os.path.join(DATA_DIR, 'DV correcting act_final update_06.08.xlsx')

# Assets
ASSETS_DIR = os.path.join(PROJECT_ROOT, 'assets')
