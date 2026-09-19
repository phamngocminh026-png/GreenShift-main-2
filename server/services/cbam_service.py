import os
import openpyxl
import logging
from io import BytesIO
from server.config import EXCEL_TEMPLATES_DIR, DEFAULT_CBAM_TEMPLATE

import re

logger = logging.getLogger(__name__)

# Hệ số phát thải lưới điện Việt Nam chuẩn
VN_GRID_EF_QD2626 = 0.6766       # Quyết định 2626/QĐ-BTNMT (Bộ Tài nguyên và Môi trường - Kiểm kê KNK nội địa)
VN_GRID_EF_CBAM_DEFAULT = 0.7221 # Giá trị mặc định EC CBAM theo Công văn 263/BĐKH (Báo cáo CBAM chính thức)

# Hệ số tham chiếu nhiệt chuẩn theo Annex IV CBAM Implementing Regulation (EU) 2023/1773 & EU ETS benchmark
DEFAULT_HEAT_EF_BENCHMARK = 82.9 # tCO2/TJ (hơi nước công nghiệp / nhiệt đo đếm được)

def parse_num(val, default=0.0):
    if val is None or val == '':
        return float(default)
    if isinstance(val, (int, float)):
        return float(val)
    
    # Chuẩn hóa khoảng trắng bao gồm cả Unicode space (\u00a0, \u200b, \u202f, \s)
    s = re.sub(r'[\s\u00a0\u200b\u202f]+', '', str(val).strip())
    if not s or s == '-':
        return float(default)
    
    is_negative = False
    # Xử lý định dạng số âm kế toán trong ngoặc đơn (ví dụ: (1,234.56) hoặc (12.5))
    if s.startswith('(') and s.endswith(')'):
        is_negative = True
        s = s[1:-1].strip()
    elif s.startswith('-'):
        is_negative = True
        s = s[1:].strip()
    elif s.startswith('+'):
        s = s[1:].strip()
    
    if not s:
        return float(default)

    # Bóc tách các hậu tố đơn vị phổ biến nếu có
    s = re.sub(r'(?i)(tco2e|tco2|kwh|mwh|vnd|vnđ|lit|lít|kg|tan|tấn|tj)$', '', s).strip()
    if not s:
        return float(default)
    
    comma_idx = s.rfind(',')
    dot_idx = s.rfind('.')
    dot_count = s.count('.')
    comma_count = s.count(',')
    
    if comma_count > 0 and dot_count > 0:
        if comma_idx > dot_idx:
            # Định dạng VN / EU: 1.234.567,89 -> 1234567.89
            s = s.replace('.', '').replace(',', '.')
        else:
            # Định dạng US / UK: 1,234,567.89 -> 1234567.89
            s = s.replace(',', '')
    elif dot_count > 1:
        # Nhiều dấu chấm: phân cách hàng nghìn kiểu Việt Nam (vd: 1.234.567)
        s = s.replace('.', '')
    elif comma_count > 1:
        # Nhiều dấu phẩy: phân cách hàng nghìn kiểu US (vd: 1,234,567)
        s = s.replace(',', '')
    elif comma_count == 1:
        # Dấu phẩy đơn: phân cách thập phân kiểu Việt Nam (vd: 12,5)
        s = s.replace(',', '.')
        
    try:
        res = float(s)
        return -res if is_negative else res
    except (ValueError, TypeError):
        return float(default)

def validate_cbam_input_data(data: dict) -> tuple[bool, str]:
    if not isinstance(data, dict):
        return False, "Dữ liệu đầu vào phải là một đối tượng JSON hợp lệ."
    if not data:
        return False, "Dữ liệu báo cáo không được để trống."
    return True, ""


def map_to_ec_fuel_label(raw_name: str) -> str:
    """
    Ánh xạ tên nhiên liệu người dùng nhập sang nhãn chuẩn của EC trong Parameters_Constants
    """
    if not raw_name:
        return 'Other fuel'
    name_low = str(raw_name).lower().strip()
    if any(k in name_low for k in ('diesel', 'do', 'gas oil', 'dầu do', 'dau do')):
        return 'Gas / Diesel Oil'
    elif any(k in name_low for k in ('fo', 'fuel oil', 'mazut', 'dầu fo', 'dau fo')):
        return 'Heavy Fuel Oil'
    elif any(k in name_low for k in ('lpg', 'gas lpg', 'propane', 'butane', 'khí dầu mỏ')):
        return 'Liquefied Petroleum Gas (LPG)'
    elif any(k in name_low for k in ('tự nhiên', 'natural gas', 'cng', 'lng', 'metan', 'methane')):
        return 'Natural Gas'
    elif any(k in name_low for k in ('antraxit', 'anthracite')):
        return 'Anthracite'
    elif any(k in name_low for k in ('than mỡ', 'than mo', 'bituminous', 'than nâu', 'than đá', 'than da')):
        return 'Other Bituminous Coal'
    elif any(k in name_low for k in ('cốc', 'coke')):
        return 'Coke Oven Coke'
    elif any(k in name_low for k in ('sinh khối', 'biomass', 'trấu', 'mùn cưa', 'củi', 'wood', 'pellet')):
        return 'Solid biomass (wood, pellets, etc.)'
    elif any(k in name_low for k in ('lò cao', 'blast furnace')):
        return 'Blast Furnace Gas'
    elif any(k in name_low for k in ('lò cốc', 'coke oven')):
        return 'Coke Oven Gas'
    return str(raw_name).strip()


def map_to_ec_process_label(raw_name: str) -> str:
    """
    Ánh xạ tên nguyên vật liệu/tiền chất sang danh mục chuẩn EU
    """
    if not raw_name:
        return 'Other process material'
    name_low = str(raw_name).lower().replace('-', ' ').strip()
    if any(k in name_low for k in ('đá vôi', 'da voi', 'limestone', 'caco3', 'vôi sống', 'voi song')):
        return 'Limestone and other carbonates'
    elif any(k in name_low for k in ('dolomite', 'dolomit', 'đô lô mít', 'do lo mit')):
        return 'Dolomite'
    elif any(k in name_low for k in ('soda', 'na2co3', 'soda ash')):
        return 'Sodium carbonate (soda ash)'
    elif any(k in name_low for k in ('anot', 'anode', 'điện cực', 'dien cuc', 'carbon anode')):
        return 'Carbon electrodes / anodes'
    elif any(k in name_low for k in ('phế liệu', 'phe lieu', 'scrap', 'thép phế', 'thep phe')):
        return 'Steel scrap'
    return str(raw_name).strip()


CBAM_SECTOR_GOODS_MAP = {
    'steel': {
        'default': "Iron or steel products",
        'prefixes': [
            ('2601', "Sintered Ore"),
            ('7201', "Pig iron"),
            ('7202', "Alloys (FeMn, FeCr, FeNi)"),
            ('7203', "Direct reduced iron"),
            ('7206', "Crude steel"),
            ('7207', "Crude steel"),
            ('7218', "Crude steel"),
            ('7224', "Crude steel")
        ]
    },
    'aluminum': {
        'default': "Aluminium products",
        'prefixes': [
            ('7601', "Unwrought aluminium")
        ]
    },
    'fertilizer': {
        'default': "Mixed fertilisers",
        'prefixes': [
            ('2814', "Ammonia"),
            ('2808', "Nitric acid"),
            ('310210', "Urea"),
            ('310230', "Mixed fertilisers"),
            ('3105', "Mixed fertilisers")
        ]
    },
    'hydrogen': {
        'default': "Hydrogen",
        'prefixes': []
    },
    'electricity': {
        'default': "Electricity (export to EU)",
        'prefixes': []
    },
    'cement': {
        'default': "Cement",
        'prefixes': [
            ('25231000', "Cement clinker"),
            ('25070080', "Calcined clays "),
            ('25233000', "Aluminous cement")
        ]
    }
}

def get_cbam_goods_category(sector: str, cn_code: str, trade_name: str = '') -> str:
    sec = (sector or '').lower().strip()
    cn = str(cn_code or '').strip()
    tname = str(trade_name or '').lower().strip()
    
    mapping = CBAM_SECTOR_GOODS_MAP.get(sec)
    if not mapping:
        return "Iron or steel products"
        
    if sec == 'cement':
        if cn.startswith('25231000') or 'clinker' in tname:
            return "Cement clinker"
        if cn.startswith('25070080') or 'sét' in tname or 'clay' in tname:
            return "Calcined clays "
        if cn.startswith('25233000'):
            return "Aluminous cement"
            
    for prefix, cat_name in mapping.get('prefixes', []):
        if cn.startswith(prefix):
            return cat_name
            
    return mapping.get('default', "Iron or steel products")


def process_cbam_excel_report(data):
    """
    Fills EU CBAM Communication Master Excel Template with installation,
    emissions, goods, and precursor data.
    Returns (BytesIO, filename, error_message, status_code)
    """
    sector = data.get('sector', '').lower()
    
    master_path = DEFAULT_CBAM_TEMPLATE
    
    cement_master = os.path.join(EXCEL_TEMPLATES_DIR, "1 CBAM SEE V2.1_Example Cement_final.xlsx")
    steel_master = os.path.join(EXCEL_TEMPLATES_DIR, "4 CBAM SEE V2.1_Example Steel 3 Screws and nuts_final.xlsx")
    fertilizer_master = os.path.join(EXCEL_TEMPLATES_DIR, "5 CBAM SEE V2.1_Example Fertilizer_final.xlsx")
    aluminum_master = os.path.join(EXCEL_TEMPLATES_DIR, "6 CBAM SEE V2.1_Example Aluminium_final.xlsx")
    hydrogen_master = os.path.join(EXCEL_TEMPLATES_DIR, "7 CBAM SEE V2.1_Example Hydrogen 2 processes_final.xlsx")
    
    if os.path.exists(cement_master) and sector == 'cement':
        master_path = cement_master
    elif os.path.exists(steel_master) and sector == 'steel':
        master_path = steel_master
    elif os.path.exists(fertilizer_master) and sector == 'fertilizer':
        master_path = fertilizer_master
    elif os.path.exists(aluminum_master) and sector == 'aluminum':
        master_path = aluminum_master
    elif os.path.exists(hydrogen_master) and sector == 'hydrogen':
        master_path = hydrogen_master
        
    logger.info(f"Using CBAM template: {master_path}")
    
    if not os.path.exists(master_path):
        return None, None, f"Template not found at {master_path}", 404
        
    try:
        wb = openpyxl.load_workbook(master_path, keep_vba=True if master_path.lower().endswith(".xlsm") else False)
        
        # Mapping logic based on Master Template Hack
        if 'A_InstData' in wb.sheetnames:
            ws_a = wb['A_InstData']
            install_name = data.get('installName', '')
            company_name = data.get('companyName') or install_name
            ws_a['I19'] = company_name
            ws_a['I20'] = install_name
            ws_a['I27'] = data.get('locode', '')
            ws_a['I28'] = data.get('gps', '')
            ws_a['I26'] = 'Viet Nam'
            
            sector_names = {
                'cement': 'Clinker and cement',
                'steel': 'Iron & steel production',
                'aluminum': 'Aluminium production',
                'fertilizer': 'Fertilisers',
                'hydrogen': 'Hydrogen production',
                'electricity': 'Electricity'
            }
            if sector in sector_names:
                ws_a['I22'] = sector_names[sector]
            
        # Variables that need to be scoped for all sectors
        cn_code = data.get('cnCode', '').replace(" ", "")
        trade_name = data.get('tradeName', '')
        route_vn = data.get('productionRoute', '')
        cat = ""
            
        # Dọn sạch và ghi B_EmInst chung cho tất cả các ngành
        if 'B_EmInst' in wb.sheetnames:
            ws_b = wb['B_EmInst']
            fuels = data.get('fuels', [])
            procs = data.get('procMaterials', [])
            for r in range(14, 36):
                for c in ['D', 'E', 'F', 'H', 'I']:
                    cell = ws_b[f'{c}{r}']
                    if not isinstance(cell, openpyxl.cell.cell.MergedCell):
                        cell.value = None

            row_idx = 14
            for f in fuels:
                if row_idx > 30: break
                ws_b[f'D{row_idx}'] = 'Combustion'
                raw_fuel_name = f.get('name') or f.get('fuel') or 'Fuel'
                ws_b[f'E{row_idx}'] = map_to_ec_fuel_label(raw_fuel_name)
                ws_b[f'F{row_idx}'] = parse_num(f.get('qty', f.get('amount', 0)))
                if 'ncv' in f and parse_num(f['ncv']) > 0:
                    ws_b[f'H{row_idx}'] = parse_num(f['ncv'])
                if 'ef' in f and parse_num(f['ef']) > 0:
                    ws_b[f'J{row_idx}'] = parse_num(f['ef'])
                row_idx += 1

            for pr in procs:
                if row_idx > 35: break
                ws_b[f'D{row_idx}'] = 'Process emissions'
                raw_proc_name = pr.get('name') or pr.get('material') or 'Process material'
                ws_b[f'E{row_idx}'] = map_to_ec_process_label(raw_proc_name)
                ws_b[f'F{row_idx}'] = parse_num(pr.get('qty', pr.get('amount', 0)))
                if 'ef' in pr and parse_num(pr['ef']) > 0:
                    ws_b[f'J{row_idx}'] = parse_num(pr['ef'])
                row_idx += 1

        # Phân loại Goods Category (cat) CHUẨN XÁC THEO 18 CỤM TỪ CỦA EU (Parameters_Constants!CONST_LIST_Goods)
        cat = get_cbam_goods_category(sector, cn_code, trade_name)
        if sector == 'cement':
            if not cn_code: cn_code = '25231000'
            if not trade_name: trade_name = 'Cement'
            if not route_vn: route_vn = 'Example process A'

        # COMMON WRITE BLOCK FOR ALL SECTORS
        if 'Summary_Products' in wb.sheetnames:
            ws_sum = wb['Summary_Products']
            
            # 1. Ghi sản phẩm thật của người dùng vào dòng 10 (Good #1 chuẩn EU, tương thích Summary_Communication)
            ws_sum['C10'] = 1
            ws_sum['D10'] = route_vn
            ws_sum['F10'] = cn_code
            ws_sum['H10'] = trade_name
            
            # Đảm bảo các công thức tự động của EU trên dòng 10 được kích hoạt đầy đủ:
            ws_sum['E10'] = '=IF(D10="","",INDEX(CNTR_List_ExistProdProc,MATCH(D10,CNTR_List_ExistProdProcNames,0)))'
            ws_sum['G10'] = '=IF(F10="","",INDEX(CNCodes_ListNames,MATCH(F10,CNCodes_ListKey,0)))'
            ws_sum['I10'] = '=IF(OR($D10="",$D10=CONST_NA),"",INDEX(InputOutput!$AK$71:$AK$80,MATCH($D10,InputOutput!$D$71:$D$80,0)))'
            ws_sum['J10'] = '=IF(OR($D10="",$D10=CONST_NA),"",INDEX(InputOutput!$AM$71:$AM$80,MATCH($D10,InputOutput!$D$71:$D$80,0)))'
            ws_sum['K10'] = '=IF(OR($D10="",$D10=CONST_NA),"",SUM(I10:J10))'
            ws_sum['L10'] = '=IF(E10="","",CONST_tCO2eq & "/" & INDEX(CONST_LIST_GoodsUnit,MATCH(E10,CONST_LIST_Goods,0)))'
            ws_sum['M10'] = '=IF($E10="","",INDEX(Summary_Processes!$AG$162:$AG$520,MATCH($D10,Summary_Processes!$D$162:$D$520,0)))'
            ws_sum['N10'] = '=IF(D10="","",INDEX(D_Processes!T:T,MATCH(CONST_CNTR_ElecEFMethod&D10,D_Processes!R:R,0)))'
            ws_sum['O10'] = '=IF(OR($D10="",$D10=CONST_NA),"",INDEX(InputOutput!$AO$71:$AO$80,MATCH($D10,InputOutput!$D$71:$D$80,0)))'

            # Dọn sạch các sản phẩm thừa từ dòng 11 đến 15 (nếu có dữ liệu mẫu từ các file example)
            for r_idx in range(11, 16):
                ws_sum[f'D{r_idx}'] = None
                ws_sum[f'F{r_idx}'] = None
                ws_sum[f'H{r_idx}'] = None
                for col_idx in range(16, 45):
                    cell = ws_sum.cell(row=r_idx, column=col_idx)
                    if not isinstance(cell, openpyxl.cell.cell.MergedCell):
                        cell.value = None

        if 'C_Emissions&Energy' in wb.sheetnames:
            ws_c = wb['C_Emissions&Energy']
            ws_c['G15'] = parse_num(data.get('elecMwh', 0))
            
        if 'D_Processes' in wb.sheetnames:
            ws_d = wb['D_Processes']
            # 1. Gán Tổng sản lượng (AL) từ Bước 1 vào ô L16 (thay thế công thức mẫu EU)
            ws_d['L16'] = parse_num(data.get('al', 0))
            ws_d['G11'] = route_vn
            ws_d['L11'] = cat

            # 2. Gán Tổng phát thải trực tiếp (Đốt nhiên liệu + Công nghệ) vào ô L54
            comb_em = parse_num(data.get('combEm', data.get('combustionEmissions', 0)))
            if comb_em == 0 and data.get('fuels'):
                comb_em = sum(parse_num(f.get('tco2e', 0)) for f in data.get('fuels'))

            proc_em = parse_num(data.get('procEm', data.get('processEmissions', 0)))
            if proc_em == 0 and data.get('procMaterials'):
                proc_em = sum(parse_num(m.get('tco2e', 0)) for m in data.get('procMaterials'))

            dir_em_total = comb_em + proc_em
            ws_d['L54'] = dir_em_total

            # 3. Map dữ liệu Trao đổi Nhiệt đo đếm được (Import/Export Measurable Heat)
            heat_tj = parse_num(data.get('heatTj', 0))
            heat_em = parse_num(data.get('heatEm', data.get('heatExchange', data.get('netHeat', 0))))
            heat_ef = parse_num(data.get('heatEf', DEFAULT_HEAT_EF_BENCHMARK))
            if heat_ef <= 0: heat_ef = DEFAULT_HEAT_EF_BENCHMARK

            if heat_tj == 0 and heat_em != 0:
                heat_tj = round(abs(heat_em) / heat_ef, 4)

            if heat_tj > 0 or heat_em != 0:
                ws_d['K50'] = True
                is_import = bool(data.get('heatImported', heat_em >= 0))
                if is_import:
                    # Nhap nhiet (Imported net measurable heat - thuoc phat thai truc tiep quy thuoc theo Annex IV)
                    ws_d['L57'] = heat_tj
                    ws_d['L58'] = heat_ef
                    ws_d['M57'] = 0
                    ws_d['M58'] = 0
                else:
                    # Xuat nhiet (Exported net measurable heat)
                    ws_d['M57'] = heat_tj
                    ws_d['M58'] = heat_ef
                    ws_d['L57'] = 0
                    ws_d['L58'] = 0
            else:
                ws_d['K50'] = False
                ws_d['L57'] = None
                ws_d['M57'] = None
                ws_d['L58'] = None
                ws_d['M58'] = None

            # 4. Gán Sản lượng điện và Hệ số phát thải điện vào D_Processes
            ws_d['L65'] = parse_num(data.get('elecMwh', 0))
            ws_d['L66'] = parse_num(data.get('elecEf', VN_GRID_EF_CBAM_DEFAULT))

        # 3. GHI TIỀN CHẤT VÀ DỌN SẠCH CÁC BLOCK TIỀN CHẤT MẪU CŨ Ở E_PURCHPREC
        precursors = data.get('precursors', [])
        if 'E_PurchPrec' in wb.sheetnames:
            ws_e = wb['E_PurchPrec']
            
            # Nếu là Hàng đơn giản: Tắt cờ và xóa sạch
            if not precursors:
                ws_e['Z14'] = True
                for r_idx in range(17, 180):
                    for col_idx in [5, 8, 12]:
                        cell = ws_e.cell(row=r_idx, column=col_idx)
                        if not isinstance(cell, openpyxl.cell.cell.MergedCell):
                            cell.value = None
            else:
                # Ghi các tiền chất người dùng nhập (hỗ trợ tối đa 10 khối tiền chất)
                for i, p in enumerate(precursors):
                    if i >= 10: break
                    base = 14 + (i * 44)
                    ws_e[f'Z{base}'] = False
                    
                    p_cn = str(p.get('cnCode', '')).strip().replace(" ", "")
                    p_name = str(p.get('name', '')).lower()
                    pn = 'Cement clinker'
                    if p_cn.startswith('252310') or 'clinker' in p_name: pn = 'Cement clinker'
                    elif p_cn.startswith('2523') or 'xi măng' in p_name or 'cement' in p_name: pn = 'Cement'
                    elif p_cn.startswith('2507') or 'sét' in p_name or 'clay' in p_name: pn = 'Calcined clays '
                    elif p_cn.startswith('7203') or 'dri' in p_name or 'sắt xốp' in p_name: pn = 'Direct reduced iron'
                    elif p_cn.startswith('7201') or 'pig iron' in p_name or 'gang' in p_name: pn = 'Pig iron'
                    elif p_cn.startswith('7202') or 'alloys' in p_name: pn = 'Alloys (FeMn, FeCr, FeNi)'
                    elif p_cn.startswith('2601') or 'sinter' in p_name or 'thiêu kết' in p_name: pn = 'Sintered Ore'
                    elif p_cn.startswith(('7206', '7207', '7218', '7224')) or 'phôi' in p_name or 'billet' in p_name or 'crude steel' in p_name: pn = 'Crude steel'
                    elif p_cn.startswith(('72', '73')) or 'thép' in p_name or 'sắt' in p_name or 'steel' in p_name: pn = 'Iron or steel products'
                    elif p_cn.startswith('7601') or 'thỏi nhôm' in p_name: pn = 'Unwrought aluminium'
                    elif p_cn.startswith('76') or 'nhôm' in p_name or 'aluminium' in p_name: pn = 'Aluminium products'
                    elif p_cn.startswith('2814') or 'amoniac' in p_name or 'ammonia' in p_name: pn = 'Ammonia'
                    elif p_cn.startswith('2808') or 'nitric' in p_name: pn = 'Nitric acid'
                    elif p_cn.startswith('310210') or 'urê' in p_name or 'urea' in p_name: pn = 'Urea'
                    elif p_cn.startswith('310230') or p_cn.startswith('3102') or p_cn.startswith('3105') or 'phân' in p_name: pn = 'Mixed fertilisers'
                    elif p_cn.startswith('280410') or 'hydro' in p_name: pn = 'Hydrogen'
                    
                    amt = parse_num(p.get('amount', 0))
                    ws_e[f'E{base+3}'] = pn
                    ws_e[f'H{base+3}'] = 'Unknown production routes'
                    ws_e[f'L{base+3}'] = amt
                    ws_e[f'E{base+14}'] = route_vn
                    ws_e[f'L{base+14}'] = amt
                    ws_e[f'E{base+27}'] = p.get('country', 'VN')
                    ws_e[f'L{base+35}'] = parse_num(p.get('seeDir', 0))
                    ws_e[f'M{base+35}'] = 'Other'
                    ws_e[f'L{base+36}'] = parse_num(p.get('seeIndir', 0))
                    ws_e[f'M{base+36}'] = 'Other'
                    ws_e[f'L{base+37}'] = 1.0
                    ws_e[f'M{base+37}'] = 'Other'

                # Dọn các block mẫu cũ còn lại nếu người dùng nhập ít hơn 10 block
                for empty_idx in range(len(precursors), 10):
                    empty_base = 14 + (empty_idx * 44)
                    if ws_e.max_row >= empty_base:
                        ws_e[f'Z{empty_base}'] = True
                        if not isinstance(ws_e.cell(row=empty_base, column=7), openpyxl.cell.cell.MergedCell):
                            ws_e.cell(row=empty_base, column=7, value=None)
                    if not isinstance(ws_e.cell(row=empty_base, column=12), openpyxl.cell.cell.MergedCell):
                        ws_e.cell(row=empty_base, column=12, value=None)
                    for r_sub in range(empty_base + 3, empty_base + 44):
                        for col_sub in [5, 8, 12]:
                            c_cell = ws_e.cell(row=r_sub, column=col_sub)
                            if not isinstance(c_cell, openpyxl.cell.cell.MergedCell):
                                c_cell.value = None
                
        from io import BytesIO
        output = BytesIO()
        wb.save(output)
        output.seek(0)
        
        ext = ".xlsm" if master_path.lower().endswith(".xlsm") else ".xlsx"
        filename = f"CBAM_Report_Filled_{data.get('year', 2026)}{ext}"
        return output, filename, None, 200

    except Exception as e:
        import traceback
        traceback.print_exc()
        return None, None, str(e), 500




def process_internal_audit_report(data):
    """
    Generates internal audit Excel report in-memory.
    Returns (BytesIO, filename, error_message, status_code)
    """
    try:
        wb = openpyxl.Workbook()
        ws = wb.active
        ws.title = "GreenShift_Internal_Audit"
        
        ws['A1'] = "GREENSHIFT INTERNAL AUDIT REPORT"
        ws.merge_cells('A1:F1')
        
        ws['A3'] = "Reporting Year & Period:"
        ws['B3'] = str(data.get('year', '2026')) + " - " + str(data.get('period', 'Cả năm'))
        ws['A4'] = "Installation Name:"
        ws['B4'] = data.get('installName', '')
        ws['A5'] = "UN/LOCODE:"
        ws['B5'] = data.get('locode', '')
        ws['A6'] = "GPS Coordinates:"
        ws['B6'] = data.get('gps', '')
        ws['A7'] = "CN Code:"
        ws['B7'] = data.get('cnCode', '')
        ws['A8'] = "Trade Name:"
        ws['B8'] = data.get('tradeName', '')
        ws['A9'] = "Production Route:"
        ws['B9'] = data.get('productionRoute', '')
        ws['A10'] = "Total Production AL (Tons):"
        ws['B10'] = parse_num(data.get('al', 0))
        ws['A11'] = "Exported to EU (Tons):"
        ws['B11'] = parse_num(data.get('exportQty', 0))
        ws['A12'] = "Specific Embedded Emissions (tCO2e/unit):"
        ws['B12'] = parse_num(data.get('seeTotal', 0))
        ws['A13'] = "Sector:"
        ws['B13'] = data.get('sector', '')
        
        ws['D3'] = "FINANCIAL SUMMARY"
        ws.merge_cells('D3:E3')
        ws['D4'] = "CBAM Certificates Needed:"
        ws['E4'] = parse_num(data.get('certCount', 0))
        ws['D5'] = "Gross CBAM Cost (EUR):"
        ws['E5'] = parse_num(data.get('grossCost', 0))
        ws['D6'] = "Local Carbon Tax Deduction:"
        ws['E6'] = parse_num(data.get('localDeduction', 0))
        ws['D7'] = "Total EU CBAM Cost (EUR):"
        ws['E7'] = parse_num(data.get('finalCost', 0))
        
        # TÍNH TOÁN PHÁT THẢI (CBAM BOUNDARY: DIRECT, INDIRECT & PRECURSORS)
        total_direct = 0.0
        total_indirect = 0.0
        total_precursors = 0.0
        
        fuels = data.get('fuels', [])
        procs = data.get('procMaterials', [])
        refrigerants = data.get('refrigerants', [])
        wastewater = data.get('wastewater', [])
        heats = data.get('heatExchanges', [])
        elecMwh = parse_num(data.get('elecMwh', 0))
        # Cập nhật hệ số lưới điện VN mới nhất (0.7221 theo CV 263/CBAM default hoặc 0.6766 theo QĐ 2626/QĐ-BTNMT)
        elec_method = data.get('elecMethod', 'cbam_default')
        default_ef = VN_GRID_EF_QD2626 if elec_method == 'domestic_qd2626' else VN_GRID_EF_CBAM_DEFAULT
        elecEf = parse_num(data.get('elecEf', default_ef)) 
        precursors = data.get('precursors', [])
        al_val = parse_num(data.get('al', 0))
        
        # Cộng dồn Phát thải trực tiếp (CBAM Direct Emissions - Nhiên liệu, Quá trình, Rò rỉ, Nước thải & Nhập nhiệt quy thuộc)
        for f in fuels: total_direct += parse_num(f.get('tco2e', 0))
        for p in procs: total_direct += parse_num(p.get('tco2e', 0))
        for r in refrigerants: total_direct += parse_num(r.get('tco2e', 0))
        for w in wastewater: total_direct += parse_num(w.get('tco2e', 0))
        
        # Trao đổi nhiệt đo đếm được (Theo Annex III & IV Quy chế (EU) 2023/1773:
        # Nhiệt đo đếm được nhập khẩu tính vào phát thải trực tiếp quy thuộc AttrEm_dir)
        total_heat_emissions = 0.0
        for h in heats: 
            h_val = parse_num(h.get('tco2e', 0))
            total_heat_emissions += h_val
        total_direct += total_heat_emissions
        
        # Cộng dồn Phát thải gián tiếp CBAM (CBAM Indirect Emissions - Tiêu thụ điện năng AttrEm_indir)
        total_indirect = (elecMwh * elecEf)

        # Hỗ trợ tương thích nếu payload dạng tổng hợp tóm tắt (không có mảng chi tiết)
        if total_direct == 0.0 and data.get('totalScope1'):
            total_direct = parse_num(data.get('totalScope1', 0))
        if total_indirect == 0.0 and data.get('totalScope2'):
            total_indirect = parse_num(data.get('totalScope2', 0))
        
        # Cộng dồn Phát thải tích luỹ tiền chất (Precursor Embedded Emissions)
        for prec in precursors:
            amt = parse_num(prec.get('amount', 0))
            cf = parse_num(prec.get('consumptionFactor', 0))
            if amt == 0 and cf > 0 and al_val > 0:
                amt = round(cf * al_val, 4)
            see_dir = parse_num(prec.get('seeDir', 0))
            see_indir = parse_num(prec.get('seeIndir', 0))
            total_precursors += amt * (see_dir + see_indir)
            
        total_emissions = total_direct + total_indirect + total_precursors

        # Guard clause: Tính toán Suất phát thải riêng (SEE) an toàn khi AL <= 0
        calculated_see = round(total_emissions / al_val, 4) if al_val > 0 else 0.0
        if not data.get('seeTotal'):
            ws['B12'] = calculated_see
        if al_val <= 0:
            ws['C10'] = "LƯU Ý: AL <= 0 (Ngừng hoạt động / Kỳ bảo dưỡng)"
            ws['B12'] = 0.0
        
        # --- BẢNG TỔNG HỢP ĐỐI SOÁT CBAM ---
        current_row = 15
        ws.cell(row=current_row, column=1, value="BẢNG TỔNG HỢP ĐỐI SOÁT CBAM / CBAM EMISSIONS SUMMARY")
        ws.merge_cells(start_row=current_row, start_column=1, end_row=current_row, end_column=6)
        current_row += 1
        ws.cell(row=current_row, column=1, value="Phân loại ranh giới / CBAM Boundary")
        ws.cell(row=current_row, column=2, value="Tổng phát thải / Total Emissions (tCO2e)")
        ws.cell(row=current_row, column=3, value="Tỷ trọng / Share (%)")
        current_row += 1
        
        def safe_pct(part, total):
            if total <= 0:
                return "0.0%"
            return f"{(part / total) * 100:.1f}%"
            
        ws.cell(row=current_row, column=1, value="Phát thải trực tiếp CBAM (Direct Emissions - Nhiên liệu, Công nghệ, Rò rỉ, Nhập nhiệt quy thuộc)")
        ws.cell(row=current_row, column=2, value=round(total_direct, 4))
        ws.cell(row=current_row, column=3, value=safe_pct(total_direct, total_emissions))
        current_row += 1
        ws.cell(row=current_row, column=1, value="Phát thải gián tiếp CBAM (Indirect Emissions - Điện lưới tiêu thụ)")
        ws.cell(row=current_row, column=2, value=round(total_indirect, 4))
        ws.cell(row=current_row, column=3, value=safe_pct(total_indirect, total_emissions))
        current_row += 1
        ws.cell(row=current_row, column=1, value="Phát thải tích luỹ Tiền chất (Precursor Embedded Emissions)")
        ws.cell(row=current_row, column=2, value=round(total_precursors, 4))
        ws.cell(row=current_row, column=3, value=safe_pct(total_precursors, total_emissions))
        current_row += 1
        ws.cell(row=current_row, column=1, value="TỔNG PHÁT THẢI TÍCH LUỸ (GROSS EMBEDDED EMISSIONS)")
        ws.cell(row=current_row, column=2, value=round(total_emissions, 4))
        ws.cell(row=current_row, column=3, value="100.0%" if total_emissions > 0 else "0.0%")
        current_row += 3
        
        # --- CHI TIẾT PHÁT THẢI TRỰC TIẾP ---
        ws.cell(row=current_row, column=1, value="CHI TIẾT PHÁT THẢI TRỰC TIẾP (DIRECT EMISSIONS)")
        ws.merge_cells(start_row=current_row, start_column=1, end_row=current_row, end_column=6)
        current_row += 1
        if fuels:
            ws.cell(row=current_row, column=1, value="- Đốt nhiên liệu (Combustion)")
            current_row += 1
            headers = ["Tên nhiên liệu", "Khối lượng", "Đơn vị", "NCV (TJ/Gg)", "Hệ số PT", "Phát thải (tCO2e)"]
            for col, header in enumerate(headers, 1): ws.cell(row=current_row, column=col, value=header)
            current_row += 1
            for fuel in fuels:
                ws.cell(row=current_row, column=1, value=fuel.get('name', ''))
                ws.cell(row=current_row, column=2, value=parse_num(fuel.get('qty', 0)))
                ws.cell(row=current_row, column=3, value=fuel.get('unit', ''))
                ws.cell(row=current_row, column=4, value=parse_num(fuel.get('ncv', 0)))
                ws.cell(row=current_row, column=5, value=parse_num(fuel.get('ef', 0)))
                ws.cell(row=current_row, column=6, value=parse_num(fuel.get('tco2e', 0)))
                current_row += 1
            current_row += 1
            
        if procs:
            ws.cell(row=current_row, column=1, value="- Quá trình công nghệ (Process Materials)")
            current_row += 1
            headers = ["Quá trình / Vật liệu", "Khối lượng", "Đơn vị", "Hệ số PT", "Ghi chú", "Phát thải (tCO2e)"]
            for col, header in enumerate(headers, 1): ws.cell(row=current_row, column=col, value=header)
            current_row += 1
            for proc in procs:
                ws.cell(row=current_row, column=1, value=proc.get('name', ''))
                ws.cell(row=current_row, column=2, value=parse_num(proc.get('qty', 0)))
                ws.cell(row=current_row, column=3, value=proc.get('unit', 'tấn'))
                ws.cell(row=current_row, column=4, value=parse_num(proc.get('ef', 0)))
                ws.cell(row=current_row, column=5, value=proc.get('note', ''))
                ws.cell(row=current_row, column=6, value=parse_num(proc.get('tco2e', 0)))
                current_row += 1
            current_row += 1
            
        if refrigerants:
            ws.cell(row=current_row, column=1, value="- Phát thải rò rỉ (Fugitive/Refrigerants)")
            current_row += 1
            headers = ["Loại Gas lạnh", "Khối lượng nạp", "Đơn vị", "GWP", "Tỷ lệ rò rỉ", "Phát thải (tCO2e)"]
            for col, header in enumerate(headers, 1): ws.cell(row=current_row, column=col, value=header)
            current_row += 1
            for ref in refrigerants:
                ws.cell(row=current_row, column=1, value=ref.get('name', ''))
                ws.cell(row=current_row, column=2, value=parse_num(ref.get('qty', 0)))
                ws.cell(row=current_row, column=3, value=ref.get('unit', 'kg'))
                ws.cell(row=current_row, column=4, value=parse_num(ref.get('gwp', 0)))
                ws.cell(row=current_row, column=5, value=ref.get('leakRate', ''))
                ws.cell(row=current_row, column=6, value=parse_num(ref.get('tco2e', 0)))
                current_row += 1
            current_row += 1
            
        if wastewater:
            ws.cell(row=current_row, column=1, value="- Nước thải & Xử lý chất thải (Wastewater & Waste)")
            current_row += 1
            headers = ["Nguồn phát sinh", "Khối lượng / Thể tích", "Đơn vị", "Hệ số phát thải", "Thu hồi CH4", "Phát thải (tCO2e)"]
            for col, header in enumerate(headers, 1): ws.cell(row=current_row, column=col, value=header)
            current_row += 1
            for w in wastewater:
                ws.cell(row=current_row, column=1, value=w.get('name', ''))
                ws.cell(row=current_row, column=2, value=parse_num(w.get('qty', 0)))
                ws.cell(row=current_row, column=3, value=w.get('unit', 'm3'))
                ws.cell(row=current_row, column=4, value=parse_num(w.get('ef', 0)))
                ws.cell(row=current_row, column=5, value=parse_num(w.get('recovered', 0)))
                ws.cell(row=current_row, column=6, value=parse_num(w.get('tco2e', 0)))
                current_row += 1
            current_row += 1
            
        # --- CHI TIẾT PHÁT THẢI GIÁN TIẾP ---
        current_row += 1
        ws.cell(row=current_row, column=1, value="CHI TIẾT PHÁT THẢI GIÁN TIẾP CBAM (INDIRECT EMISSIONS - ELECTRICITY)")
        ws.merge_cells(start_row=current_row, start_column=1, end_row=current_row, end_column=6)
        current_row += 1
        
        ws.cell(row=current_row, column=1, value="- Tiêu thụ Điện năng (Electricity)")
        current_row += 1
        ws.cell(row=current_row, column=1, value="Sản lượng điện (MWh)")
        ws.cell(row=current_row, column=2, value=elecMwh)
        current_row += 1
        ws.cell(row=current_row, column=1, value="Hệ số điện (tCO2/MWh)")
        ws.cell(row=current_row, column=2, value=elecEf)
        current_row += 1
        ws.cell(row=current_row, column=1, value="Phát thải Điện (tCO2e)")
        ws.cell(row=current_row, column=2, value=round(elecMwh * elecEf, 4))
        current_row += 2
        
        if heats:
            ws.cell(row=current_row, column=1, value="- Trao đổi Nhiệt đo đếm được (Measurable Heat - Tính vào AttrEm_dir theo Annex IV CBAM)")
            current_row += 1
            headers = ["Loại hình", "Lượng nhiệt (MWh/TJ)", "Đơn vị", "Hệ số phát thải", "Ranh giới quy chuẩn", "Phát thải (tCO2e)"]
            for col, header in enumerate(headers, 1): ws.cell(row=current_row, column=col, value=header)
            current_row += 1
            for heat in heats:
                tco2e = parse_num(heat.get('tco2e', 0))
                heat_type = "Nhập nhiệt (Imported Heat)" if tco2e >= 0 else "Xuất nhiệt (Exported Heat)"
                boundary_label = "CBAM Direct (Annex IV) / ISO Scope 2" if tco2e >= 0 else "CBAM Deduction"
                ws.cell(row=current_row, column=1, value=heat_type)
                ws.cell(row=current_row, column=2, value=parse_num(heat.get('qty', 0)))
                ws.cell(row=current_row, column=3, value=heat.get('unit', 'MWh'))
                ws.cell(row=current_row, column=4, value=parse_num(heat.get('ef', 0)))
                ws.cell(row=current_row, column=5, value=heat.get('boundary', boundary_label))
                ws.cell(row=current_row, column=6, value=tco2e)
                current_row += 1
            current_row += 1

        # --- CHI TIẾT TIỀN CHẤT ---
        current_row += 1
        ws.cell(row=current_row, column=1, value="CHI TIẾT TIỀN CHẤT (PURCHASED PRECURSORS EMBEDDED EMISSIONS)")
        ws.merge_cells(start_row=current_row, start_column=1, end_row=current_row, end_column=6)
        current_row += 1
        if precursors:
            ws.cell(row=current_row, column=1, value="- Tiền chất (Purchased Precursors)")
            current_row += 1
            headers = ["Tên Tiền chất", "Khối lượng", "Hệ số tiêu hao", "SEE Trực tiếp", "SEE Gián tiếp", "Tổng (tCO2e)"]
            for col, header in enumerate(headers, 1): ws.cell(row=current_row, column=col, value=header)
            current_row += 1
            for prec in precursors:
                amt = parse_num(prec.get('amount', 0))
                cf = parse_num(prec.get('consumptionFactor', 0))
                if amt == 0 and cf > 0 and al_val > 0:
                    amt = round(cf * al_val, 4)
                elif cf == 0 and amt > 0 and al_val > 0:
                    cf = round(amt / al_val, 4)
                see_dir = parse_num(prec.get('seeDir', 0))
                see_indir = parse_num(prec.get('seeIndir', 0))
                ws.cell(row=current_row, column=1, value=prec.get('name', ''))
                ws.cell(row=current_row, column=2, value=amt)
                ws.cell(row=current_row, column=3, value=cf)
                ws.cell(row=current_row, column=4, value=see_dir)
                ws.cell(row=current_row, column=5, value=see_indir)
                ws.cell(row=current_row, column=6, value=round(amt * (see_dir + see_indir), 4))
                current_row += 1

        output = BytesIO()
        wb.save(output)
        output.seek(0)
        
        filename = f"GreenShift_Internal_Audit_{data.get('year', 2026)}.xlsx"
        return output, filename, None, 200
    except Exception as e:
        logger.error("ERROR processing Internal Excel: %s", str(e), exc_info=True)
        return None, None, str(e), 500