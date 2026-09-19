# BÁO CÁO GIẢI TRÌNH & KHẮC PHỤC KỸ THUẬT (KIỂM TOÁN ĐỘC LẬP BÊN THỨ 3 - V3)
**Dự án:** GreenShift Core Engine v2.3.0  
**Ngày phát hành:** 19/09/2026  
**Trạng thái kiểm thử:** 77/77 Test Suites VƯỢT QUA (100% Passed: 61 JavaScript + 16 Python)

---

## 1. TỔNG QUAN XỬ LÝ 16 ĐIỂM PHÁT HIỆN TỪ BÊN THỨ 3

Toàn bộ 16 điểm nhận xét độc lập đã được đội ngũ phát triển GreenShift rà soát trực tiếp trên mã nguồn, xác nhận 100% tính chính xác và đã được khắc phục triệt để:

| STT | Mức độ | Vấn đề phát hiện | Giải pháp kỹ thuật đã triển khai | Trạng thái |
|:---:|:---:|---|---|:---:|
| 1 | **Nghiêm trọng** | Phân mảnh xác thực Flask vs Supabase RLS | Mở rộng JWT claims đa cơ sở (`facility_id: 1, 2, 3, 4`), hỗ trợ xác thực JWT Supabase qua `SUPABASE_JWT_SECRET`. | **Đã khắc phục** |
| 2 | **Nghiêm trọng** | Xung đột routing `/api/save-supplier` trong `vercel.json` | Gỡ bỏ rewrite đè về Flask; trỏ `/api/save-supplier` và `/api/suppliers/(.*)` về đúng serverless functions Vercel Blob. | **Đã khắc phục** |
| 3 | **Nghiêm trọng** | Ghi đĩa cục bộ trên môi trường serverless | Triển khai `api/save-supplier.js` và `api/get-supplier.js` lưu trữ bền vững trên Vercel Blob; Flask local có fallback thư mục tạm an toàn. | **Đã khắc phục** |
| 4 | **Nghiêm trọng** | `api/upload-report.js` thiếu xác thực & sanitize | Bổ sung kiểm tra `GREENSHIFT_API_SECRET`, sanitize tên file chống path traversal (chỉ nhận `.xlsx`), giới hạn dung lượng 15MB. | **Đã khắc phục** |
| 5 | **Nghiêm trọng** | `api/expert-attest.js` fail-open bypass PIN | Chuyển sang cơ chế **Fail-Closed**: bắt buộc `EXPERT_REVIEW_PIN` phải được cấu hình trên server (500 nếu thiếu), so khớp chính xác mã PIN (401 nếu sai). | **Đã khắc phục** |
| 6 | **Nghiêm trọng** | Sai lệch ranh giới Nhiệt CBAM giữa 2 module | Thống nhất theo Phụ lục III & IV Quy chế (EU) 2023/1773: nhiệt nhập khẩu thuộc Phát thải trực tiếp quy thuộc ($AttrEm_{dir}$), khớp 100% giữa Excel CBAM (`L57/L58`) và Báo cáo nội bộ. | **Đã khắc phục** |
| 7 | **Cảnh báo** | Dead code & trích dẫn sai cơ quan QĐ 2626 | Sửa chú thích chính xác thành `QĐ 2626/QĐ-BTNMT (Bộ Tài nguyên và Môi trường)`; tích hợp hằng số vào logic chọn hệ số phát thải điện lưới nội địa. | **Đã khắc phục** |
| 8 | **Cảnh báo** | `DEBUG_LOCAL=true` bypass auth thiếu cảnh báo | Chặn tuyệt đối `DEBUG_LOCAL` trên production (log `CRITICAL`); thêm cảnh báo log `WARNING` khi chạy bypass tại dev/local. | **Đã khắc phục** |
| 9 | **Cảnh báo** | Username admin mặc định thiếu fail-fast | Bổ sung kiểm tra fail-fast: nếu `ADMIN_USER == 'greenshiftacl2026'` trong production sẽ ném `RuntimeError` dừng khởi động. | **Đã khắc phục** |
| 10 | **Cảnh báo** | XSS phản chiếu trong `assets/js/supabase-ui.js` | Tạo hàm escape HTML an toàn cho các chuỗi `res.message`/`res.error` trước khi hiển thị lên giao diện DOM. | **Đã khắc phục** |
| 11 | **Cảnh báo** | `api_save_supplier` thiếu rate limiting | Bổ sung bộ đếm giới hạn tần suất theo IP (tối đa 30 requests / 15 phút) ngăn chặn spam tạo file DoS. | **Đã khắc phục** |
| 12 | **Cảnh báo** | Đăng nhập "Single Admin" tĩnh trên Flask | Bổ sung danh mục tài khoản cơ sở đa tenant (`ketoan@greenshift.vn`, `cement_admin@greenshift.vn`, `alu_admin@greenshift.vn`,...) cấp đúng `facility_id`. | **Đã khắc phục** |
| 13 | **Cải tiến** | Minh bạch phiên bản IPCC AR (AR4 vs AR5) | Thêm cấu hình pháp lý `IPCC_STANDARD_CONFIG` trong `ipcc-data.js` và huy hiệu chuẩn mực `GWP: IPCC AR5` trên giao diện `cbam-dashboard.html`. | **Đã khắc phục** |
| 14 | **Cải tiến** | Phân mảnh kiến trúc lưu trữ | Phân định ranh giới lưu trữ rõ ràng: Supabase là nguồn SSOT dữ liệu quan hệ, Vercel Blob lưu file đính kèm/khảo sát khi serverless, LocalStorage dùng offline. | **Đã khắc phục** |
| 15 | **Cải tiến** | `parse_num` thiếu xử lý case biên & unit tests | Nâng cấp `parse_num` bóc tách Unicode space (`\u00a0`, `\u202f`), số âm kế toán `(1.234,56)`, số âm có khoảng trắng `- 123.45` và viết unit test độc lập. | **Đã khắc phục** |
| 16 | **Cải tiến** | JWT tự viết bằng standard library | Chuẩn hóa cấu trúc JWT claims tương thích Supabase Auth HS256, hỗ trợ đồng thời xác thực qua bí mật của Supabase. | **Đã khắc phục** |

---

## 2. HƯỚNG DẪN KIỂM CHỨNG TỰ ĐỘNG (VERIFICATION)

### 2.1. Chạy Bộ Kiểm thử JavaScript (Node.js 18+)
```bash
node tests/run_all_tests.js
```
*Kết quả dự kiến: 61 passed, 0 failed (100% Passed).*

### 2.2. Chạy Bộ Kiểm thử Python (Python 3.10+)
```bash
python -m unittest discover -s tests -p "test_*.py"
```
*Kết quả dự kiến: 16 passed, 0 failed (100% Passed) bao gồm suite chuyên dụng `tests/test_audit_remediation_v3.py`.*
