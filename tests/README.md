# 🧪 Hướng Dẫn Kiểm Thử (Tests Guide)

Thư mục này chứa các kịch bản kiểm thử tự động cho hệ thống **GreenShift**.

---

## 1. Kiểm thử Backend Python (CBAM & Excel Mapping)

Yêu cầu đã cài đặt `requirements.txt`:
```bash
pip install -r requirements.txt
```

Chạy kiểm thử khả năng mapping dữ liệu vào phôi Excel:
```bash
python tests/test_mapping.py
```

Chạy kiểm thử ghi file Word:
```bash
python tests/test_docx_writer.py
```

---

## 2. Kiểm thử Frontend & Docxtemplater (Node.js)

Kiểm thử khả năng nạp và render template Word bằng JavaScript:
```bash
node tests/test_docx.js
```

> **Lưu ý**: Các file kết quả tạo ra trong quá trình kiểm thử (`*.xlsx`, `*.docx`) đã được cấu hình trong `.gitignore` để không bị lưu vào lịch sử commit git.
