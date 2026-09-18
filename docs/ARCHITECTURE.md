# 🏗️ Kiến Trúc Hệ Thống (System Architecture)

> Tài liệu mô tả kiến trúc kỹ thuật của nền tảng **GreenShift**.

---

## 1. Sơ Đồ Tổng Thể Hệ Thống

```mermaid
graph TB
    subgraph Client [Trình Duyệt Người Dùng - Client Layer]
        UI[Giao diện Multi-Page Web App]
        CalcEngine[Lõi Tính toán Client-Side: carbon-activity.js]
        EFMaster[Kho Dữ liệu Hệ số: ef-master.js]
        Storage[Bộ nhớ LocalStorage & Session]
        DocxGen[Thư viện Docxtemplater: word-export.js]
    end

    subgraph Serverless [Đám Mây Vercel - Serverless Edge Layer]
        FnUpload[api/upload-report.js]
        FnSupplier[api/save-supplier.js]
        FnCompany[api/save-company.js]
        FnAnnual[api/save-annual-data.js]
        FnAttest[api/expert-attest.js]
    end

    subgraph Backend [Máy Chủ Xử Lý - Python Flask Server]
        FlaskRouter[server/app.py & app.py]
        CBAMService[server/services/cbam_service.py]
        LookupService[server/services/lookup_service.py]
        ExcelEngine[OpenPyXL Template Engine]
    end

    subgraph StorageLayer [Kho Lưu Trữ Mẫu & CSDL]
        TemplatesExcel[templates/excel/ Phôi Mẫu 8 Ngành EU CBAM]
        TemplatesWord[templates/word/ Phôi Mẫu Nghị định 06]
        RefDB[data/reference/ DV Correcting Act & Supabase SQL]
    end

    UI --> CalcEngine
    CalcEngine --> EFMaster
    CalcEngine --> Storage
    CalcEngine --> DocxGen
    
    UI -- "Gửi dữ liệu báo cáo" --> FlaskRouter
    FlaskRouter --> CBAMService
    FlaskRouter --> LookupService
    CBAMService --> ExcelEngine
    ExcelEngine --> TemplatesExcel
    LookupService --> RefDB
    
    UI -- "API đám mây" --> Serverless
```

---

## 2. Các Phân Hệ Tính Toán Chính (Core Engines)

### 2.1. Phân hệ Tính toán Phát thải Nội địa (Scope 1 - 2 - 3)
- **Vị trí file**: `assets/js/carbon-activity.js`, `assets/js/ef-master.js`, `assets/js/ipcc-data.js`.
- **Cơ chế**:
  - Không cần máy chủ backend để tính toán (Zero Server Round-trip).
  - Tự động tra cứu NCV (Net Calorific Value) và Emission Factors từ cơ sở dữ liệu Bộ TN&MT.
  - Phân loại phát thải theo đúng biểu mẫu phụ lục Thông tư 01/2022/TT-BTNMT và Nghị định 06/2022/NĐ-CP.

### 2.2. Phân hệ Báo cáo Thuế Carbon EU CBAM
- **Vị trí file**: `cbam-dashboard.html`, `server/services/cbam_service.py`, `templates/excel/`.
- **Cơ chế**:
  - Web client thu thập thông tin cơ sở, khối lượng sản xuất $AL$, điện năng tiêu thụ, nhiên liệu đốt, phát thải quy trình và tiền chất đã mua.
  - Client gửi JSON payload lên endpoint `/api/generate-report`.
  - Backend tự động chọn phôi tương ứng (`cement`, `steel`, `fertilizer`, `aluminum`, `hydrogen`), mở file phôi gốc bằng `openpyxl`, điền đúng các ô ô quy định tại sheet `A_InstData`, `B_EmInst`, `C_Goods`, `D_Processes`, giữ nguyên các macro và định dạng của Liên minh châu Âu, sau đó stream file nhị phân trả về cho người dùng tải xuống.

---

## 3. Quy Ước Đặt Tên & Cấu Trúc Mã Nguồn

| Thư mục | Mục đích | Quy tắc |
| :--- | :--- | :--- |
| `assets/css/` | Tệp định dạng CSS | Kebab-case, chuẩn hóa theo Design System |
| `assets/js/` | Mã logic JavaScript | Tách bạch giữa `core/` (tính toán) và `modules/` (tính năng) |
| `assets/images/` | Hình ảnh tĩnh | Viết thường, phân loại theo mục đích (`brand`, `team`, `blog`, `press`, `ui`) |
| `assets/vendor/` | Thư viện bên ngoài | Chỉ chứa các bản `.min.js` hoặc phông chữ cục bộ |
| `templates/` | Phôi báo cáo | Tách bạch `excel/` và `word/` |
| `data/` | CSDL tham chiếu | Chứa CSDL tĩnh cho hệ thống tra cứu |
| `server/` | Mã nguồn Flask | Kiến trúc Service Layer, không viết logic trực tiếp trong Route |
