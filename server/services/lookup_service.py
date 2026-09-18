import os
import pandas as pd
from server.config import DV_FILE_PATH

# In-memory caching for high performance
_DV_EXCEL_CACHE = None
_SHEETS_CACHE = {}

def get_dv_excel():
    global _DV_EXCEL_CACHE
    if _DV_EXCEL_CACHE is None and os.path.exists(DV_FILE_PATH):
        _DV_EXCEL_CACHE = pd.ExcelFile(DV_FILE_PATH)
    return _DV_EXCEL_CACHE

def get_parsed_sheet(xl, sheet_name):
    global _SHEETS_CACHE
    if sheet_name not in _SHEETS_CACHE:
        _SHEETS_CACHE[sheet_name] = xl.parse(sheet_name)
    return _SHEETS_CACHE[sheet_name]

def lookup_default_factor(cn_code, country='Viet Nam'):
    """
    Looks up EU default emission factors (direct and indirect)
    from the official DV correcting act Excel database (with in-memory caching).
    """
    if country == 'VN':
        country = 'Viet Nam'
        
    cn_code = (cn_code or '').strip()
    if not cn_code:
        return {'error': 'Missing CN Code'}, 400
        
    if not os.path.exists(DV_FILE_PATH):
        return {'error': f'Database not found at {DV_FILE_PATH}'}, 500
        
    try:
        clean_input_cn = cn_code.replace(" ", "")
        xl = get_dv_excel()
        if not xl:
            return {'error': 'Unable to load Excel database'}, 500
        
        def parse_num(val):
            if val is None or pd.isna(val):
                return 0.0
            if isinstance(val, (int, float)):
                return float(val)
            s = str(val).strip().replace(' ', '')
            if s == '-' or not s:
                return 0.0
            comma_idx = s.rfind(',')
            dot_idx = s.rfind('.')
            if comma_idx != -1 and dot_idx != -1:
                if comma_idx > dot_idx:
                    s = s.replace('.', '').replace(',', '.')
                else:
                    s = s.replace(',', '')
            elif comma_idx != -1:
                s = s.replace(',', '.')
            try:
                return float(s)
            except (ValueError, TypeError):
                return 0.0

        def search_in_df(df):
            if df is None or df.shape[1] < 4:
                return 0.0, 0.0
                
            # 1. Khop chinh xac (Exact match - uu tien cao nhat)
            for _, row in df.iterrows():
                if len(row) < 4:
                    continue
                row_cn = str(row.iloc[0]).replace(" ", "").strip()
                if clean_input_cn == row_cn:
                    p_dir = parse_num(row.iloc[2])
                    p_indir = parse_num(row.iloc[3])
                    if p_dir > 0 or p_indir > 0:
                        return p_dir, p_indir
            
            # 2. Khop tien to (Prefix match: yeu cau do dai toi thieu 4 ky tu)
            best_match = None
            best_len = 0
            for _, row in df.iterrows():
                if len(row) < 4:
                    continue
                row_cn = str(row.iloc[0]).replace(" ", "").strip()
                # Chi chap nhan khop tien to neu row_cn du dai (>= 4 ky tu)
                if len(row_cn) >= 4 and clean_input_cn.startswith(row_cn):
                    p_dir = parse_num(row.iloc[2])
                    p_indir = parse_num(row.iloc[3])
                    matched_len = len(row_cn)
                    if (p_dir > 0 or p_indir > 0) and matched_len > best_len:
                        best_len = matched_len
                        best_match = (p_dir, p_indir)
            
            if best_match:
                return best_match
            return 0.0, 0.0

        # Uu tien 1: Tim trong Sheet Quoc gia chi dinh (mac dinh Viet Nam)
        dir_val, indir_val = 0.0, 0.0
        target_sheet = None
        matched_sheet = 'Viet Nam'
        for s in xl.sheet_names:
            if country.lower() in s.lower() or 'viet' in s.lower():
                target_sheet = s
                break
                
        if target_sheet:
            df = get_parsed_sheet(xl, target_sheet)
            dir_val, indir_val = search_in_df(df)
            if dir_val > 0 or indir_val > 0:
                matched_sheet = target_sheet
            
        # Uu tien 2: Neu khong co trong sheet quoc gia (vi du xi mang VN), tra sheet _Other Countries and Territorie
        if dir_val == 0.0 and indir_val == 0.0:
            for fallback_name in ['_Other Countries and Territorie', 'Annex IV']:
                for s in xl.sheet_names:
                    if fallback_name.lower() in s.lower():
                        df = get_parsed_sheet(xl, s)
                        d, i = search_in_df(df)
                        if d > 0 or i > 0:
                            dir_val, indir_val = d, i
                            matched_sheet = s
                            break
                if dir_val > 0 or indir_val > 0:
                    break

        # Uu tien 3: Quet cac sheet quoc gia con lai (bo qua Overview, Version History)
        if dir_val == 0.0 and indir_val == 0.0:
            for s in xl.sheet_names:
                if s in ['Overview', 'Version History', target_sheet]:
                    continue
                df = get_parsed_sheet(xl, s)
                if df.shape[1] >= 4:
                    d, i = search_in_df(df)
                    if d > 0 or i > 0:
                        dir_val, indir_val = d, i
                        matched_sheet = s
                        break
                        
        is_fallback = not (target_sheet and matched_sheet == target_sheet)
        return {
            'success': True,
            'cnCode': cn_code,
            'dir': dir_val,
            'directDefault': dir_val,
            'indir': indir_val,
            'indirectDefault': indir_val,
            'total': round(dir_val + indir_val, 4),
            'matchedSheet': matched_sheet,
            'isFallback': is_fallback,
            'source': 'Official EU Default Values (DV Correcting Act)'
        }, 200
        
    except Exception as e:
        return {'error': f'Lookup failed: {str(e)}'}, 500
