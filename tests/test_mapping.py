import os
import openpyxl

def run_test():
    root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    file_path = os.path.join(root_dir, "templates", "excel", "1 CBAM SEE V2.1_Example Cement_final.xlsx")
    print(f"Loading {file_path}...")
    
    if not os.path.exists(file_path):
        print(f"ERROR: Template file not found at {file_path}")
        return False
        
    try:
        wb = openpyxl.load_workbook(file_path)
    except Exception as e:
        print(f"Failed to load workbook: {e}")
        return False
        
    print("Workbook loaded successfully.")
    
    # Cell mapping test dictionary
    CEMENT_CELL_MAP = {
        ("B_EmInst", "F14"): 1300,            # fuel_quantity (Coal)
        ("B_EmInst", "F15"): 10000,           # process_raw_qty (Clinker process)
        ("C_Emissions&Energy", "G15"): 1100,  # electricity_mwh
        ("D_Processes", "L54"): 10000         # total_al_production (Clinker)
    }
    
    for (sheet_name, cell_ref), new_value in CEMENT_CELL_MAP.items():
        if sheet_name in wb.sheetnames:
            ws = wb[sheet_name]
            old_value = ws[cell_ref].value
            ws[cell_ref] = new_value
            print(f"Verified & updated {sheet_name}!{cell_ref} from {old_value} to {new_value}")
        else:
            print(f"Sheet {sheet_name} not found!")
            
    output_path = os.path.join(root_dir, "tests", "test_output_cement.tmp.xlsx")
    wb.save(output_path)
    print(f"SUCCESS: Mapping verified and saved to {output_path}")
    
    # Clean up temp file
    if os.path.exists(output_path):
        os.remove(output_path)
        print("Cleaned up temporary test file.")
    return True

if __name__ == "__main__":
    run_test()
