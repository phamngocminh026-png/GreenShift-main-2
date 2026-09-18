# 🌿 Tài Liệu Dự Án & Tầm Nhìn Phát Triển (Project Brief)

> **GreenShift** | Nền tảng Tự động hóa Báo cáo Khí Nhà Kính & Báo cáo Carbon Thông Minh

---

## 1. GreenShift Là Gì & Tại Sao Dự Án Này Ra Đời?

Từ năm **2026**, các doanh nghiệp tại Việt Nam bắt đầu đối mặt với áp lực kép về chuyển đổi xanh:
1. **Áp lực Pháp lý Nội địa**: Chính phủ yêu cầu các cơ sở phát thải lớn và doanh nghiệp niêm yết phải thực hiện kiểm kê phát thải khí nhà kính (theo Nghị định 06/2022/NĐ-CP và Quyết định 42/2026/QĐ-TTg).
2. **Áp lực Thương mại Quốc tế**: Cơ chế điều chỉnh biên giới carbon của châu Âu (**EU CBAM**) chính thức vận hành giai đoạn thu thuế từ 2026, buộc các doanh nghiệp xuất khẩu (thép, xi măng, nhôm, phân bón) phải khai trình báo cáo phát thải carbon cho từng lô hàng xuất sang EU.

### Nỗi Đau Của Doanh Nghiệp (Pain Points)
- Kế toán và kỹ sư môi trường đang phải xử lý thủ công trên các file Excel khổng lồ, phức tạp và dễ sai sót.
- Chi phí thuê các đơn vị tư vấn bên ngoài quá đắt đỏ (từ hàng chục đến hàng trăm triệu đồng cho một bản báo cáo dùng một lần).
- Thiếu nhân sự am hiểu cả về quy định kỹ thuật lẫn tiêu chuẩn quốc tế (ISO 14064, IPCC, EU CBAM).

### Giải Pháp Của GreenShift
Một nền tảng phần mềm dạng **SaaS (Software as a Service)** chuyên nghiệp, tự động hóa toàn diện từ bước thu thập dữ liệu thô (hóa đơn điện, xăng dầu, gas) đến tính toán và tự động xuất ra bản báo cáo theo chuẩn mẫu của Nhà nước và Liên minh châu Âu.

---

## 2. Bản Chất Nghiệp Vụ Kỹ Thuật (Domain Knowledge for Devs)

Hệ thống tính toán phát thải tuân theo nguyên lý cốt lõi:
$$\text{Phát thải } (tCO_2e) = \text{Dữ liệu hoạt động } (Activity Data) \times \text{Hệ số phát thải } (Emission Factor)$$

1. **Phát thải Phạm vi 1 (Scope 1 - Trực tiếp)**:
   - Đốt cháy nhiên liệu cố định: Lò hơi, máy phát điện (xăng, dầu DO, khí LPG, than).
   - Đốt cháy di động: Xe cộ doanh nghiệp.
   - Rò rỉ môi chất lạnh: Điều hòa, kho lạnh (gas R22, R410A, R32...).
2. **Phát thải Phạm vi 2 (Scope 2 - Gián tiếp từ năng lượng)**:
   - Điện năng tiêu thụ từ lưới điện quốc gia (áp dụng hệ số phát thải lưới điện Việt Nam do Cục Biến đổi khí hậu công bố).
3. **Phát thải Phạm vi 3 (Scope 3 - Chuỗi cung ứng)**:
   - Thu thập phát thải từ nhà cung cấp thông qua cổng Supplier Portal.
4. **Báo cáo Thuế Carbon EU CBAM**:
   - Phân tích phát thải trực tiếp (Direct SEE) và gián tiếp (Indirect SEE) trên từng đơn vị sản phẩm (Specific Embedded Emissions - tCO2e/tấn).
   - Tự động đối soát và điền vào các Sheet chuẩn của EC: `A_InstData`, `B_EmInst`, `C_Goods`, `D_Processes`.

---

## 3. Lộ Trình Phát Triển Tiếp Theo (Product Roadmap)
- **Tự động hóa đọc file ERP/Kế toán**: Kết nối đọc dữ liệu bảng kê khấu hao và hóa đơn đầu vào từ MISA/FAST.
- **AI OCR Hóa đơn**: Tích hợp Vision AI (Gemini Flash / OpenAI) để tự động nhận diện và trích xuất chỉ số kWh điện từ hóa đơn EVN.
- **Tối ưu trải nghiệm SaaS**: Quản lý đa người dùng theo vai trò (RBAC), thanh toán gói thuê bao doanh nghiệp và kết nối API chữ ký số.
