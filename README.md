# 🌱 GreenShift | Carbon Intelligence & ESG Platform for Vietnamese Enterprises

[![Platform](https://img.shields.io/badge/Platform-Web%20%7C%20SaaS-10b981.svg)](#)
[![Python](https://img.shields.io/badge/Python-3.10%2B-blue.svg)](https://www.python.org/)
[![Flask](https://img.shields.io/badge/Backend-Flask%203.0-lightgrey.svg)](https://flask.palletsprojects.com/)
[![Deployment](https://img.shields.io/badge/Deploy-Vercel-black.svg)](https://vercel.com/)
[![Standard](https://img.shields.io/badge/Compliance-EU%20CBAM%20%7C%20ISO%2014064%20%7C%20NĐ06-emerald.svg)](#)

> **GreenShift** là nền tảng quản trị ESG, tự động hóa kiểm kê khí nhà kính (KNK) nội địa theo Nghị định 06/2022/NĐ-CP và lập báo cáo thuế Carbon châu Âu (**EU CBAM**) dành cho doanh nghiệp sản xuất & xuất khẩu Việt Nam.

---

## ✨ Tính Năng Nổi Bật (Key Features)

- 🏭 **Kiểm Kê Phát Thải KNK Nội Địa (Scope 1, 2, 3)**:
  - Quản lý danh mục thiết bị và dây chuyền (lò hơi, máy phát điện, điều hòa, kho lạnh).
  - Tra cứu tự động hệ số phát thải từ thư viện chuẩn của Bộ Tài nguyên & Môi trường và IPCC.
  - Tự động xuất báo cáo kiểm kê chuẩn file Word theo mẫu quy định tại Nghị định 06/2022/NĐ-CP.
- 🇪🇺 **Báo Cáo Thuế Carbon EU CBAM (European Carbon Border Adjustment Mechanism)**:
  - Chu trình khai báo 4 bước chuẩn châu Âu cho 6 ngành xuất khẩu trọng yếu: Thép, Xi măng, Nhôm, Phân bón, Hydrogen, Điện.
  - Tự động tính toán phát thải suất riêng trực tiếp và gián tiếp (Direct/Indirect Specific Embedded Emissions - SEE).
  - Điền tự động vào phôi Excel chính thức của Ủy ban châu Âu (EC Master Template).
- 🔍 **Tra Cứu Pháp Lý Quyết Định 42/2026/QĐ-TTg**:
  - Công cụ tìm kiếm tức thì danh mục các cơ sở phát thải phải thực hiện kiểm kê khí nhà kính bắt buộc.
- 🤝 **Cổng Khảo Sát Nhà Cung Cấp (Supplier Scope 3 Portal)**:
  - Cho phép doanh nghiệp gửi biểu mẫu trực tuyến cho các nhà cung cấp đầu vào để thu thập dữ liệu phát thải Scope 3 Category 1.

---

## 🏛️ Cấu Trúc Dự Án (Repository Structure)

```
GreenShift/
├── assets/                             # Toàn bộ tài nguyên tĩnh Frontend
│   ├── css/                            # Stylesheet & Hệ thống Design System (style.css, print.css)
│   ├── js/                             # Bộ não tính toán (carbon-activity.js, ef-master.js, ...)
│   ├── images/                         # Hình ảnh nhận diện, ảnh bài viết, icon giao diện
│   └── vendor/                         # Thư viện offline (Chart.js, SheetJS, jsPDF, fonts)
│
├── server/                             # Máy chủ Backend (Python Flask dạng module)
│   ├── app.py                          # Khởi tạo Flask routes và static routing
│   ├── config.py                       # Cấu hình đường dẫn templates, data và assets
│   └── services/                       # Nghiệp vụ backend
│       ├── cbam_service.py             # Xử lý mapping và sinh file Excel CBAM
│       └── lookup_service.py           # Tra cứu hệ số mặc định EU theo mã CN Code
│
├── api/                                # Serverless Functions khi triển khai Vercel Cloud
│   ├── expert-attest.js                # Ký số chuyên gia
│   ├── save-annual-data.js             # Lưu trữ dữ liệu hàng năm
│   ├── save-company.js                 # Lưu thông tin hồ sơ doanh nghiệp
│   ├── save-supplier.js                # Nhận số liệu từ nhà cung ứng
│   └── upload-report.js                # Tải báo cáo lên Vercel Blob
│
├── templates/                          # Tập trung toàn bộ phôi mẫu báo cáo chuẩn
│   ├── excel/                          # 8 phôi Excel chuẩn chính thức của EU CBAM
│   └── word/                           # Phôi Word chuẩn Nghị định 06/2022/NĐ-CP
│
├── data/                               # Cơ sở dữ liệu đối soát và tài liệu mẫu
│   ├── reference/                      # CSDL đối soát mặc định EU (DV Correcting Act) & Supabase SQL
│   └── sme-kit/                        # Bộ công cụ khảo sát nhanh cho SME (Checklist, Excel template)
│
├── docs/                               # Thư viện tài liệu dành cho Lập trình viên
│   ├── ONBOARDING.md                   # Hướng dẫn làm quen nhanh dự án trong 5 phút
│   ├── ARCHITECTURE.md                 # Sơ đồ kiến trúc luồng dữ liệu và phân hệ
│   ├── PROJECT_BRIEF.md                # Bản mô tả tầm nhìn sản phẩm và bài toán nghiệp vụ
│   └── 42-2026-qd-ttg-danh-muc-kiem-ke-knk.pdf # Văn bản pháp lý phục vụ tải về
│
├── tests/                              # Bộ kịch bản kiểm thử tự động
│   ├── test_docx_writer.py             # Kiểm thử xuất file Word
│   ├── test_mapping.py                 # Kiểm thử mapping dữ liệu Excel CBAM
│   └── test_docx.js                    # Kiểm thử render Docxtemplater phía Node
│
├── [HTML Pages]                        # Các trang giao diện ứng dụng (root level)
│   ├── index.html                      # Trang chủ giới thiệu nền tảng
│   ├── login.html                      # Cổng đăng nhập hệ thống
│   ├── setup.html                      # Thiết lập thông tin doanh nghiệp & chi nhánh
│   ├── carbon-inventory.html           # Ứng dụng Kiểm kê KNK nội địa (Scope 1, 2, 3)
│   ├── cbam-dashboard.html             # Ứng dụng Báo cáo Thuế EU CBAM
│   └── supplier.html                   # Cổng khảo sát Scope 3 nhà cung ứng
│
├── app.py                              # Wrapper khởi chạy Flask Server (`python app.py`)
├── requirements.txt                    # Danh sách thư viện Python phụ thuộc
├── package.json                        # Khai báo phụ thuộc Node.js
├── vercel.json                         # Cấu hình định tuyến và tối ưu khi deploy Vercel
└── .gitignore                          # Cấu hình loại bỏ file rác, cache và output test
```

---

## 🚀 Hướng Dẫn Cài Đặt & Chạy Cục Bộ (Quick Start)

### 1. Chạy Frontend bằng Live Server (Nhanh nhất)
1. Mở thư mục dự án trong VS Code hoặc Cursor.
2. Chuột phải vào file `index.html` hoặc `carbon-inventory.html` và chọn **"Open with Live Server"**.
3. Ứng dụng sẽ mở tại địa chỉ `http://127.0.0.1:5501` và hoạt động đầy đủ chức năng tính toán trực tiếp trên trình duyệt.

### 2. Chạy Fullstack cùng Backend Server (Python Flask)
1. Cài đặt các thư viện cần thiết:
   ```bash
   pip install -r requirements.txt
   ```
2. Khởi chạy server:
   ```bash
   python app.py
   ```
3. Mở trình duyệt truy cập: `http://localhost:5000`

---

## 🔐 Tài Khoản Đăng Nhập Mẫu (Demo Credentials)

| Mục | Thông tin |
| :--- | :--- |
| **Tài khoản (Username)** | `greenshiftacl2026` |
| **Mật khẩu (Password)** | `1234` |
| **Doanh nghiệp mẫu** | GreenShift ACL Enterprise |

---

## 📖 Tài Liệu Bổ Trợ Dành Cho Dev

- [Hướng dẫn Onboarding Dev trong 5 phút](file:///docs/ONBOARDING.md)
- [Chi tiết Kiến trúc Hệ thống & Luồng Dữ liệu](file:///docs/ARCHITECTURE.md)
- [Bản mô tả Dự án & Bài toán Nghiệp vụ](file:///docs/PROJECT_BRIEF.md)
- [Hướng dẫn Kiểm thử Tự động](file:///tests/README.md)

---

## 📄 Bản Quyền & Giấy Phép

Copyright © 2026 GreenShift Team. All Rights Reserved.
