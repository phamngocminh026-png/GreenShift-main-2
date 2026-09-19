/**
 * GREENSHIFT STANDARD EQUIPMENT DATABASE (FROM SUPABASE MASTER SCHEMA)
 * Bao gồm 92 thiết bị công nghiệp chuẩn theo 4 ngành CBAM và Thiết bị dùng chung
 */
window.EQUIPMENT_MASTER = [
  {
    "id": 1,
    "code": "STEEL-EAF-01",
    "name": "Lò hồ quang điện EAF (Electric Arc Furnace)",
    "sector": "STEEL",
    "stage": "Nấu luyện phôi thép",
    "energyType": "ELECTRICITY",
    "ratedCapacity": 45000,
    "capacityUnit": "kW",
    "defaultLoadFactor": 0.82,
    "scopeType": "SCOPE_2",
    "isCommon": false,
    "description": "Nấu chảy thép phế liệu công suất 100 tấn/mẻ"
  },
  {
    "id": 2,
    "code": "STEEL-LRF-01",
    "name": "Lò tinh luyện thùng LRF (Ladle Refining Furnace)",
    "sector": "STEEL",
    "stage": "Tinh luyện thép lỏng",
    "energyType": "ELECTRICITY",
    "ratedCapacity": 12000,
    "capacityUnit": "kW",
    "defaultLoadFactor": 0.7,
    "scopeType": "SCOPE_2",
    "isCommon": false,
    "description": "Khử khí, điều chỉnh thành phần hợp kim hóa"
  },
  {
    "id": 3,
    "code": "STEEL-CCM-01",
    "name": "Máy đúc phôi liên tục CCM (Continuous Caster)",
    "sector": "STEEL",
    "stage": "Đúc phôi thép",
    "energyType": "ELECTRICITY",
    "ratedCapacity": 1500,
    "capacityUnit": "kW",
    "defaultLoadFactor": 0.85,
    "scopeType": "SCOPE_2",
    "isCommon": false,
    "description": "Đúc phôi vuông billets 130x130, 150x150 mm"
  },
  {
    "id": 4,
    "code": "STEEL-FURN-01",
    "name": "Lò nung lại phôi cán (Billet Reheating Furnace)",
    "sector": "STEEL",
    "stage": "Gia nhiệt trước khi cán",
    "energyType": "FUEL_OIL",
    "ratedCapacity": 3500,
    "capacityUnit": "kg/h",
    "defaultLoadFactor": 0.8,
    "scopeType": "SCOPE_1",
    "isCommon": false,
    "description": "Lò nung đẩy phôi lên 1150°C đốt dầu FO/LPG"
  },
  {
    "id": 5,
    "code": "STEEL-ROLL-HOT",
    "name": "Dây chuyền cán thép cuộn cán nóng HRC",
    "sector": "STEEL",
    "stage": "Cán nóng thành phẩm",
    "energyType": "ELECTRICITY",
    "ratedCapacity": 28000,
    "capacityUnit": "kW",
    "defaultLoadFactor": 0.78,
    "scopeType": "SCOPE_2",
    "isCommon": false,
    "description": "Cán dải thép tấm cuộn khổ 1250-1500 mm"
  },
  {
    "id": 6,
    "code": "STEEL-ROLL-COLD",
    "name": "Dây chuyền cán nguội đảo chiều 4-Hi/6-Hi (CRC)",
    "sector": "STEEL",
    "stage": "Cán nguội tinh chế",
    "energyType": "ELECTRICITY",
    "ratedCapacity": 8500,
    "capacityUnit": "kW",
    "defaultLoadFactor": 0.72,
    "scopeType": "SCOPE_2",
    "isCommon": false,
    "description": "Cán mỏng thép lá độ chính xác cao"
  },
  {
    "id": 7,
    "code": "STEEL-PICKLING",
    "name": "Dây chuyền tẩy gỉ axit liên tục (CPL)",
    "sector": "STEEL",
    "stage": "Xử lý bề mặt thép",
    "energyType": "ELECTRICITY",
    "ratedCapacity": 1800,
    "capacityUnit": "kW",
    "defaultLoadFactor": 0.75,
    "scopeType": "SCOPE_2",
    "isCommon": false,
    "description": "Tẩy oxit sắt bằng dung dịch HCl tuần hoàn"
  },
  {
    "id": 8,
    "code": "STEEL-GALV-01",
    "name": "Dây chuyền mạ kẽm nhúng nóng liên tục (CGL)",
    "sector": "STEEL",
    "stage": "Mạ bảo vệ chống ăn mòn",
    "energyType": "ELECTRICITY",
    "ratedCapacity": 4200,
    "capacityUnit": "kW",
    "defaultLoadFactor": 0.8,
    "scopeType": "SCOPE_2",
    "isCommon": false,
    "description": "Mạ kẽm cuộn thép tôn lợp và phụ tùng ô tô"
  },
  {
    "id": 9,
    "code": "STEEL-ROLL-ROD",
    "name": "Dây chuyền cán thép thanh & dây cuộn (Wire Rod)",
    "sector": "STEEL",
    "stage": "Cán thép xây dựng",
    "energyType": "ELECTRICITY",
    "ratedCapacity": 6500,
    "capacityUnit": "kW",
    "defaultLoadFactor": 0.75,
    "scopeType": "SCOPE_2",
    "isCommon": false,
    "description": "Cán thép thanh vằn D10-D32 và cuộn phi 6-8"
  },
  {
    "id": 10,
    "code": "STEEL-TUBE-01",
    "name": "Máy định hình & hàn cao tần ống thép (ERW)",
    "sector": "STEEL",
    "stage": "Chế tạo ống thép",
    "energyType": "ELECTRICITY",
    "ratedCapacity": 1200,
    "capacityUnit": "kW",
    "defaultLoadFactor": 0.65,
    "scopeType": "SCOPE_2",
    "isCommon": false,
    "description": "Sản xuất ống hộp vuông mạ kẽm và ống tròn"
  },
  {
    "id": 11,
    "code": "STEEL-FAST-01",
    "name": "Cụm máy dập nguội bu lông ốc vít (Cold Heading)",
    "sector": "STEEL",
    "stage": "Cơ khí chính xác phụ trợ",
    "energyType": "ELECTRICITY",
    "ratedCapacity": 450,
    "capacityUnit": "kW",
    "defaultLoadFactor": 0.68,
    "scopeType": "SCOPE_2",
    "isCommon": false,
    "description": "Dập đầu bu lông và cán ren cường độ cao"
  },
  {
    "id": 12,
    "code": "STEEL-CRANE-01",
    "name": "Hệ thống cầu trục gian lò & bãi liệu xưởng thép",
    "sector": "STEEL",
    "stage": "Vận chuyển nội bộ gian lò",
    "energyType": "ELECTRICITY",
    "ratedCapacity": 950,
    "capacityUnit": "kW",
    "defaultLoadFactor": 0.45,
    "scopeType": "SCOPE_2",
    "isCommon": false,
    "description": "Cầu trục 150 tấn rót thép lỏng an toàn"
  },
  {
    "id": 13,
    "code": "CEM-CRUSH-01",
    "name": "Máy đập búa đá vôi sơ cấp tại mỏ",
    "sector": "CEMENT",
    "stage": "Khai thác & nghiền thô",
    "energyType": "ELECTRICITY",
    "ratedCapacity": 1200,
    "capacityUnit": "kW",
    "defaultLoadFactor": 0.75,
    "scopeType": "SCOPE_2",
    "isCommon": false,
    "description": "Đập đá vôi kích thước lớn về cỡ hạt < 70mm"
  },
  {
    "id": 14,
    "code": "CEM-CRUSH-02",
    "name": "Máy đập sét & phụ gia thứ cấp",
    "sector": "CEMENT",
    "stage": "Khai thác & nghiền thô",
    "energyType": "ELECTRICITY",
    "ratedCapacity": 450,
    "capacityUnit": "kW",
    "defaultLoadFactor": 0.7,
    "scopeType": "SCOPE_2",
    "isCommon": false,
    "description": "Xử lý nguyên liệu phụ trợ sét, quặng sắt"
  },
  {
    "id": 15,
    "code": "CEM-VRM-RAW",
    "name": "Máy nghiền đứng bột liệu sống (VRM Raw Mill)",
    "sector": "CEMENT",
    "stage": "Nghiền bột liệu sống",
    "energyType": "ELECTRICITY",
    "ratedCapacity": 3200,
    "capacityUnit": "kW",
    "defaultLoadFactor": 0.82,
    "scopeType": "SCOPE_2",
    "isCommon": false,
    "description": "Nghiền sấy đồng thời bột liệu sống đạt độ mịn"
  },
  {
    "id": 16,
    "code": "CEM-FAN-ID-RAW",
    "name": "Quạt hút hệ thống nghiền liệu & lọc bụi tĩnh điện",
    "sector": "CEMENT",
    "stage": "Hệ thống khí nghiền liệu",
    "energyType": "ELECTRICITY",
    "ratedCapacity": 1800,
    "capacityUnit": "kW",
    "defaultLoadFactor": 0.85,
    "scopeType": "SCOPE_2",
    "isCommon": false,
    "description": "Vận chuyển dòng khí nóng mang bột liệu"
  },
  {
    "id": 17,
    "code": "CEM-PREHEAT-01",
    "name": "Tháp trao đổi nhiệt 5 tầng Cyclone (Preheater)",
    "sector": "CEMENT",
    "stage": "Nung sơ bộ bột liệu",
    "energyType": "ELECTRICITY",
    "ratedCapacity": 350,
    "capacityUnit": "kW",
    "defaultLoadFactor": 0.9,
    "scopeType": "SCOPE_2",
    "isCommon": false,
    "description": "Sấy nóng và phân hủy Canxi cacbonat đến 90%"
  },
  {
    "id": 18,
    "code": "CEM-CALCINER",
    "name": "Buồng phân hủy Calciner đốt than mịn",
    "sector": "CEMENT",
    "stage": "Phân hủy cacbonat CaCO3",
    "energyType": "COAL",
    "ratedCapacity": 18.5,
    "capacityUnit": "tấn/h",
    "defaultLoadFactor": 0.88,
    "scopeType": "SCOPE_1",
    "isCommon": false,
    "description": "Đốt 60% tổng lượng than của nhà máy xi măng"
  },
  {
    "id": 19,
    "code": "CEM-KILN-ROTARY",
    "name": "Lò quay Clinker xi măng (Rotary Kiln 5000 t/d)",
    "sector": "CEMENT",
    "stage": "Nung kết Clinker 1450°C",
    "energyType": "COAL",
    "ratedCapacity": 12.5,
    "capacityUnit": "tấn/h",
    "defaultLoadFactor": 0.92,
    "scopeType": "SCOPE_1",
    "isCommon": false,
    "description": "Đốt 40% than tại vòi phun than chính đầu lò"
  },
  {
    "id": 20,
    "code": "CEM-KILN-DRIVE",
    "name": "Hệ thống động cơ truyền động quay lò",
    "sector": "CEMENT",
    "stage": "Vận hành cơ khí lò quay",
    "energyType": "ELECTRICITY",
    "ratedCapacity": 630,
    "capacityUnit": "kW",
    "defaultLoadFactor": 0.85,
    "scopeType": "SCOPE_2",
    "isCommon": false,
    "description": "Động cơ chính điều tần tốc độ quay của lò clinker"
  },
  {
    "id": 21,
    "code": "CEM-ID-FAN-KILN",
    "name": "Quạt hút khí thải đuôi lò chính (Kiln ID Fan)",
    "sector": "CEMENT",
    "stage": "Hệ thống khí thải lò nung",
    "energyType": "ELECTRICITY",
    "ratedCapacity": 2400,
    "capacityUnit": "kW",
    "defaultLoadFactor": 0.88,
    "scopeType": "SCOPE_2",
    "isCommon": false,
    "description": "Quạt hút công suất lớn duy trì áp suất âm lò"
  },
  {
    "id": 22,
    "code": "CEM-COOLER-GRATE",
    "name": "Giàn làm nguội ghi Clinker kiểu sục khí (Cooler)",
    "sector": "CEMENT",
    "stage": "Làm nguội sốc Clinker",
    "energyType": "ELECTRICITY",
    "ratedCapacity": 850,
    "capacityUnit": "kW",
    "defaultLoadFactor": 0.8,
    "scopeType": "SCOPE_2",
    "isCommon": false,
    "description": "Làm nguội clinker từ 1400°C về 100°C"
  },
  {
    "id": 23,
    "code": "CEM-COOLER-FAN",
    "name": "Cụm quạt gió thổi làm nguội đáy ghi",
    "sector": "CEMENT",
    "stage": "Làm nguội sốc Clinker",
    "energyType": "ELECTRICITY",
    "ratedCapacity": 1600,
    "capacityUnit": "kW",
    "defaultLoadFactor": 0.82,
    "scopeType": "SCOPE_2",
    "isCommon": false,
    "description": "Cụm 12 quạt thổi khí lạnh thu hồi khí nóng"
  },
  {
    "id": 24,
    "code": "CEM-CRUSH-CLINK",
    "name": "Máy đập clinker tảng đầu ra giàn làm nguội",
    "sector": "CEMENT",
    "stage": "Nghiền sơ bộ Clinker",
    "energyType": "ELECTRICITY",
    "ratedCapacity": 250,
    "capacityUnit": "kW",
    "defaultLoadFactor": 0.7,
    "scopeType": "SCOPE_2",
    "isCommon": false,
    "description": "Đập vỡ clinker tảng trước khi vào silo chứa"
  },
  {
    "id": 25,
    "code": "CEM-SILO-CLINK",
    "name": "Hệ thống cấp liệu & vận chuyển silo Clinker",
    "sector": "CEMENT",
    "stage": "Tồn trữ & trung chuyển",
    "energyType": "ELECTRICITY",
    "ratedCapacity": 320,
    "capacityUnit": "kW",
    "defaultLoadFactor": 0.65,
    "scopeType": "SCOPE_2",
    "isCommon": false,
    "description": "Băng tải gầu nâng clinker vào silo 50.000 tấn"
  },
  {
    "id": 26,
    "code": "CEM-MILL-COAL",
    "name": "Máy nghiền than mịn phục vụ vòi đốt lò",
    "sector": "CEMENT",
    "stage": "Chuẩn bị nhiên liệu than",
    "energyType": "ELECTRICITY",
    "ratedCapacity": 750,
    "capacityUnit": "kW",
    "defaultLoadFactor": 0.78,
    "scopeType": "SCOPE_2",
    "isCommon": false,
    "description": "Nghiền than cám thành bột than mịn cấp vòi đốt"
  },
  {
    "id": 27,
    "code": "CEM-MILL-BALL-01",
    "name": "Máy nghiền bi xi măng mạch kín 1 (Ball Mill)",
    "sector": "CEMENT",
    "stage": "Nghiền xi măng thành phẩm",
    "energyType": "ELECTRICITY",
    "ratedCapacity": 4200,
    "capacityUnit": "kW",
    "defaultLoadFactor": 0.85,
    "scopeType": "SCOPE_2",
    "isCommon": false,
    "description": "Nghiền hỗn hợp Clinker + Thạch cao + Phụ gia"
  },
  {
    "id": 28,
    "code": "CEM-MILL-BALL-02",
    "name": "Máy nghiền bi xi măng mạch kín 2",
    "sector": "CEMENT",
    "stage": "Nghiền xi măng thành phẩm",
    "energyType": "ELECTRICITY",
    "ratedCapacity": 4200,
    "capacityUnit": "kW",
    "defaultLoadFactor": 0.85,
    "scopeType": "SCOPE_2",
    "isCommon": false,
    "description": "Dây chuyền nghiền xi măng Portland PCB40"
  },
  {
    "id": 29,
    "code": "CEM-SEP-DYNAMIC",
    "name": "Máy phân ly hiệu suất cao O-Sepa",
    "sector": "CEMENT",
    "stage": "Phân loại độ mịn xi măng",
    "energyType": "ELECTRICITY",
    "ratedCapacity": 315,
    "capacityUnit": "kW",
    "defaultLoadFactor": 0.8,
    "scopeType": "SCOPE_2",
    "isCommon": false,
    "description": "Tách hạt mịn đạt tiêu chuẩn TCVN 6260"
  },
  {
    "id": 30,
    "code": "CEM-BAG-FILTER",
    "name": "Hệ thống lọc bụi túi vải thu hồi xi măng",
    "sector": "CEMENT",
    "stage": "Lọc bụi & bảo vệ môi trường",
    "energyType": "ELECTRICITY",
    "ratedCapacity": 450,
    "capacityUnit": "kW",
    "defaultLoadFactor": 0.8,
    "scopeType": "SCOPE_2",
    "isCommon": false,
    "description": "Thu hồi 99.9% bụi mịn xi măng về silo"
  },
  {
    "id": 31,
    "code": "CEM-PACK-AUTO-01",
    "name": "Máy đóng bao xi măng quay 8 vòi tự động 1",
    "sector": "CEMENT",
    "stage": "Đóng gói & xuất hàng",
    "energyType": "ELECTRICITY",
    "ratedCapacity": 120,
    "capacityUnit": "kW",
    "defaultLoadFactor": 0.7,
    "scopeType": "SCOPE_2",
    "isCommon": false,
    "description": "Năng suất đóng bao 120 tấn/giờ"
  },
  {
    "id": 32,
    "code": "CEM-PACK-AUTO-02",
    "name": "Máy đóng bao xi măng quay 8 vòi tự động 2",
    "sector": "CEMENT",
    "stage": "Đóng gói & xuất hàng",
    "energyType": "ELECTRICITY",
    "ratedCapacity": 120,
    "capacityUnit": "kW",
    "defaultLoadFactor": 0.7,
    "scopeType": "SCOPE_2",
    "isCommon": false,
    "description": "Đóng bao xi măng 50kg xuất khẩu"
  },
  {
    "id": 33,
    "code": "CEM-DISPATCH-BULK",
    "name": "Hệ thống máng xuất xi măng rời xe bồn",
    "sector": "CEMENT",
    "stage": "Xuất hàng xi măng rời",
    "energyType": "ELECTRICITY",
    "ratedCapacity": 95,
    "capacityUnit": "kW",
    "defaultLoadFactor": 0.6,
    "scopeType": "SCOPE_2",
    "isCommon": false,
    "description": "Bơm xi măng bột trực tiếp lên xe téc chuyên dụng"
  },
  {
    "id": 34,
    "code": "CEM-WHR-TURBINE",
    "name": "Tua bin phát điện nhiệt dư WHR (Waste Heat Recovery)",
    "sector": "CEMENT",
    "stage": "Thu hồi nhiệt dư phát điện",
    "energyType": "ELECTRICITY",
    "ratedCapacity": 7500,
    "capacityUnit": "kW",
    "defaultLoadFactor": 0.9,
    "scopeType": "SCOPE_2",
    "isCommon": false,
    "description": "Tự sản xuất 30% tổng điện năng tiêu thụ nhà máy"
  },
  {
    "id": 35,
    "code": "CEM-WHR-BOILER-SP",
    "name": "Nồi hơi thu hồi nhiệt tháp trao đổi nhiệt SP",
    "sector": "CEMENT",
    "stage": "Thu hồi nhiệt dư",
    "energyType": "ELECTRICITY",
    "ratedCapacity": 150,
    "capacityUnit": "kW",
    "defaultLoadFactor": 0.85,
    "scopeType": "SCOPE_2",
    "isCommon": false,
    "description": "Tận dụng khí nóng 320°C từ tháp preheater"
  },
  {
    "id": 36,
    "code": "CEM-WHR-BOILER-AQC",
    "name": "Nồi hơi thu hồi nhiệt giàn làm nguội AQC",
    "sector": "CEMENT",
    "stage": "Thu hồi nhiệt dư",
    "energyType": "ELECTRICITY",
    "ratedCapacity": 180,
    "capacityUnit": "kW",
    "defaultLoadFactor": 0.85,
    "scopeType": "SCOPE_2",
    "isCommon": false,
    "description": "Tận dụng khí nóng 360°C từ clinker cooler"
  },
  {
    "id": 37,
    "code": "CEM-WATER-COOL",
    "name": "Trạm bơm nước làm mát tuần hoàn nhà máy",
    "sector": "CEMENT",
    "stage": "Tiện ích làm mát thiết bị",
    "energyType": "ELECTRICITY",
    "ratedCapacity": 380,
    "capacityUnit": "kW",
    "defaultLoadFactor": 0.75,
    "scopeType": "SCOPE_2",
    "isCommon": false,
    "description": "Cung cấp nước làm mát gối trục lò và máy nghiền"
  },
  {
    "id": 38,
    "code": "CEM-LAB-ROBOT",
    "name": "Hệ thống robot lấy mẫu & phân tích X-ray tự động",
    "sector": "CEMENT",
    "stage": "KCS & kiểm soát chất lượng",
    "energyType": "ELECTRICITY",
    "ratedCapacity": 65,
    "capacityUnit": "kW",
    "defaultLoadFactor": 0.5,
    "scopeType": "SCOPE_2",
    "isCommon": false,
    "description": "Phân tích thành phần oxit CaO, SiO2 liên tục"
  },
  {
    "id": 39,
    "code": "CEM-AIR-COMP",
    "name": "Trạm máy nén khí trung tâm nhà máy xi măng",
    "sector": "CEMENT",
    "stage": "Khí nén điều khiển khí cụ",
    "energyType": "ELECTRICITY",
    "ratedCapacity": 550,
    "capacityUnit": "kW",
    "defaultLoadFactor": 0.75,
    "scopeType": "SCOPE_2",
    "isCommon": false,
    "description": "Cấp khí nén cho van khí nén và sục khí silo"
  },
  {
    "id": 40,
    "code": "FERT-REF-PRIM",
    "name": "Lò Reforming sơ cấp đốt khí tự nhiên (Primary Reformer)",
    "sector": "FERTILIZER",
    "stage": "Sản xuất khí tổng hợp NH3",
    "energyType": "NATURAL_GAS",
    "ratedCapacity": 4200,
    "capacityUnit": "1000 Sm3/h",
    "defaultLoadFactor": 0.88,
    "scopeType": "SCOPE_1",
    "isCommon": false,
    "description": "Phản ứng CH4 + H2O tạo H2 và CO tại 800°C đốt khí"
  },
  {
    "id": 41,
    "code": "FERT-REF-SEC",
    "name": "Lò Reforming thứ cấp (Secondary Reformer)",
    "sector": "FERTILIZER",
    "stage": "Phản ứng khí tổng hợp",
    "energyType": "NATURAL_GAS",
    "ratedCapacity": 1500,
    "capacityUnit": "1000 Sm3/h",
    "defaultLoadFactor": 0.9,
    "scopeType": "SCOPE_1",
    "isCommon": false,
    "description": "Thổi không khí cung cấp N2 vào hỗn hợp"
  },
  {
    "id": 42,
    "code": "FERT-HTS-CONV",
    "name": "Thiết bị chuyển hóa CO nhiệt độ cao HTS",
    "sector": "FERTILIZER",
    "stage": "Chuyển hóa khí CO",
    "energyType": "ELECTRICITY",
    "ratedCapacity": 120,
    "capacityUnit": "kW",
    "defaultLoadFactor": 0.85,
    "scopeType": "SCOPE_2",
    "isCommon": false,
    "description": "Xúc tác sắt biến CO + H2O thành CO2 + H2"
  },
  {
    "id": 43,
    "code": "FERT-LTS-CONV",
    "name": "Thiết bị chuyển hóa CO nhiệt độ thấp LTS",
    "sector": "FERTILIZER",
    "stage": "Chuyển hóa khí CO",
    "energyType": "ELECTRICITY",
    "ratedCapacity": 110,
    "capacityUnit": "kW",
    "defaultLoadFactor": 0.85,
    "scopeType": "SCOPE_2",
    "isCommon": false,
    "description": "Xúc tác đồng giảm hàm lượng CO xuống < 0.2%"
  },
  {
    "id": 44,
    "code": "FERT-CO2-ABS",
    "name": "Tháp hấp thụ CO2 dung dịch aMDEA",
    "sector": "FERTILIZER",
    "stage": "Tách & thu hồi CO2",
    "energyType": "ELECTRICITY",
    "ratedCapacity": 1200,
    "capacityUnit": "kW",
    "defaultLoadFactor": 0.85,
    "scopeType": "SCOPE_2",
    "isCommon": false,
    "description": "Tách CO2 tinh khiết cấp cho xưởng sản xuất Urê"
  },
  {
    "id": 45,
    "code": "FERT-CO2-STRIP",
    "name": "Tháp giải hấp CO2 (CO2 Stripper)",
    "sector": "FERTILIZER",
    "stage": "Tái sinh dung dịch hấp thụ",
    "energyType": "ELECTRICITY",
    "ratedCapacity": 850,
    "capacityUnit": "kW",
    "defaultLoadFactor": 0.82,
    "scopeType": "SCOPE_2",
    "isCommon": false,
    "description": "Tái sinh dung dịch dung môi amin bằng hơi nhiệt"
  },
  {
    "id": 46,
    "code": "FERT-METHANATOR",
    "name": "Thiết bị Metan hóa (Methanator)",
    "sector": "FERTILIZER",
    "stage": "Làm sạch vết oxit cacbon",
    "energyType": "ELECTRICITY",
    "ratedCapacity": 95,
    "capacityUnit": "kW",
    "defaultLoadFactor": 0.8,
    "scopeType": "SCOPE_2",
    "isCommon": false,
    "description": "Khử sạch CO và CO2 còn sót lại bảo vệ xúc tác NH3"
  },
  {
    "id": 47,
    "code": "FERT-COMP-SYN",
    "name": "Máy nén khí tổng hợp NH3 áp suất cao (Syngas Compressor)",
    "sector": "FERTILIZER",
    "stage": "Nén khí tổng hợp 150 bar",
    "energyType": "ELECTRICITY",
    "ratedCapacity": 20000,
    "capacityUnit": "kW",
    "defaultLoadFactor": 0.9,
    "scopeType": "SCOPE_2",
    "isCommon": false,
    "description": "Máy nén tuabin hơi/điện công suất siêu lớn"
  },
  {
    "id": 48,
    "code": "FERT-NH3-REACT",
    "name": "Tháp tổng hợp Amoniac (Ammonia Converter Loop)",
    "sector": "FERTILIZER",
    "stage": "Tổng hợp NH3",
    "energyType": "ELECTRICITY",
    "ratedCapacity": 450,
    "capacityUnit": "kW",
    "defaultLoadFactor": 0.92,
    "scopeType": "SCOPE_2",
    "isCommon": false,
    "description": "Phản ứng N2 + 3H2 tạo NH3 lỏng ở 150-200 bar"
  },
  {
    "id": 49,
    "code": "FERT-NH3-REF",
    "name": "Hệ thống làm lạnh & hóa lỏng Amoniac",
    "sector": "FERTILIZER",
    "stage": "Hóa lỏng & ngưng tụ NH3",
    "energyType": "ELECTRICITY",
    "ratedCapacity": 3200,
    "capacityUnit": "kW",
    "defaultLoadFactor": 0.85,
    "scopeType": "SCOPE_2",
    "isCommon": false,
    "description": "Làm lạnh amoniac về -33°C bảo quản silo áp suất thường"
  },
  {
    "id": 50,
    "code": "FERT-NH3-TANK",
    "name": "Bồn cầu chứa Amoniac lỏng áp lực",
    "sector": "FERTILIZER",
    "stage": "Tồn trữ hóa chất NH3",
    "energyType": "ELECTRICITY",
    "ratedCapacity": 180,
    "capacityUnit": "kW",
    "defaultLoadFactor": 0.7,
    "scopeType": "SCOPE_2",
    "isCommon": false,
    "description": "Bơm luân chuyển và bảo ôn an toàn amoniac"
  },
  {
    "id": 51,
    "code": "FERT-CO2-COMP",
    "name": "Máy nén khí CO2 lên 160 bar xưởng Urê",
    "sector": "FERTILIZER",
    "stage": "Nén nguyên liệu Urê",
    "energyType": "ELECTRICITY",
    "ratedCapacity": 6800,
    "capacityUnit": "kW",
    "defaultLoadFactor": 0.88,
    "scopeType": "SCOPE_2",
    "isCommon": false,
    "description": "Nén CO2 thu hồi từ xưởng NH3 cấp cho lò phản ứng Urê"
  },
  {
    "id": 52,
    "code": "FERT-CARB-PUMP",
    "name": "Bơm cao áp Amoniac & Carbamate",
    "sector": "FERTILIZER",
    "stage": "Cấp nguyên liệu áp lực cao",
    "energyType": "ELECTRICITY",
    "ratedCapacity": 2200,
    "capacityUnit": "kW",
    "defaultLoadFactor": 0.85,
    "scopeType": "SCOPE_2",
    "isCommon": false,
    "description": "Bơm piston áp suất siêu cao 160 bar vào lò Urê"
  },
  {
    "id": 53,
    "code": "FERT-UREA-REACT",
    "name": "Tháp tổng hợp Urê áp suất cao (Urea Reactor)",
    "sector": "FERTILIZER",
    "stage": "Tổng hợp Urê",
    "energyType": "ELECTRICITY",
    "ratedCapacity": 320,
    "capacityUnit": "kW",
    "defaultLoadFactor": 0.9,
    "scopeType": "SCOPE_2",
    "isCommon": false,
    "description": "Tạo amoni carbamate và mất nước thành Urê lỏng"
  },
  {
    "id": 54,
    "code": "FERT-UREA-STRIP",
    "name": "Thiết bị Stripper xưởng Urê",
    "sector": "FERTILIZER",
    "stage": "Tách thu hồi khí dư",
    "energyType": "ELECTRICITY",
    "ratedCapacity": 450,
    "capacityUnit": "kW",
    "defaultLoadFactor": 0.85,
    "scopeType": "SCOPE_2",
    "isCommon": false,
    "description": "Phân hủy carbamate chưa phản ứng bằng CO2 nóng"
  },
  {
    "id": 55,
    "code": "FERT-UREA-VAC",
    "name": "Hệ thống cô đặc chân không Urê 2 cấp",
    "sector": "FERTILIZER",
    "stage": "Nâng nồng độ dịch Urê",
    "energyType": "ELECTRICITY",
    "ratedCapacity": 850,
    "capacityUnit": "kW",
    "defaultLoadFactor": 0.82,
    "scopeType": "SCOPE_2",
    "isCommon": false,
    "description": "Cô đặc dung dịch Urê lên nồng độ nóng chảy 99.7%"
  },
  {
    "id": 56,
    "code": "FERT-PRIL-TOWER",
    "name": "Tháp tạo hạt Urê kiểu Prilling cao 80m",
    "sector": "FERTILIZER",
    "stage": "Tạo hạt thành phẩm Urê",
    "energyType": "ELECTRICITY",
    "ratedCapacity": 1100,
    "capacityUnit": "kW",
    "defaultLoadFactor": 0.85,
    "scopeType": "SCOPE_2",
    "isCommon": false,
    "description": "Phun sương hạt Urê rơi tự do ngược chiều quạt hút"
  },
  {
    "id": 57,
    "code": "FERT-UREA-COOL",
    "name": "Thiết bị làm nguội hạt Urê tầng sôi (Fluid Bed Cooler)",
    "sector": "FERTILIZER",
    "stage": "Làm nguội hạt đóng bao",
    "energyType": "ELECTRICITY",
    "ratedCapacity": 480,
    "capacityUnit": "kW",
    "defaultLoadFactor": 0.8,
    "scopeType": "SCOPE_2",
    "isCommon": false,
    "description": "Hạ nhiệt độ hạt Urê chống vón cục trước đóng bao"
  },
  {
    "id": 58,
    "code": "FERT-OSTWALD-01",
    "name": "Lò đốt Amoniac xúc tác lưới bạch kim (Ostwald Burner)",
    "sector": "FERTILIZER",
    "stage": "Sản xuất Axit Nitric",
    "energyType": "INDUSTRIAL_PROCESS",
    "ratedCapacity": 250,
    "capacityUnit": "kW",
    "defaultLoadFactor": 0.9,
    "scopeType": "SCOPE_1",
    "isCommon": false,
    "description": "Oxy hóa 4NH3 + 5O2 tạo NO tại 900°C (Phát thải N2O)"
  },
  {
    "id": 59,
    "code": "FERT-N2O-ABATE",
    "name": "Hệ thống khử xúc tác phát thải N2O thứ cấp/tam cấp",
    "sector": "FERTILIZER",
    "stage": "Giảm thiểu KNK nhà kính N2O",
    "energyType": "ELECTRICITY",
    "ratedCapacity": 120,
    "capacityUnit": "kW",
    "defaultLoadFactor": 0.85,
    "scopeType": "SCOPE_2",
    "isCommon": false,
    "description": "Xúc tác phân hủy N2O thành N2 và O2 giảm 98% GWP"
  },
  {
    "id": 60,
    "code": "FERT-NOX-ABS",
    "name": "Tháp hấp thụ khí NOx tạo Axit Nitric HNO3",
    "sector": "FERTILIZER",
    "stage": "Sản xuất Axit Nitric 60%",
    "energyType": "ELECTRICITY",
    "ratedCapacity": 750,
    "capacityUnit": "kW",
    "defaultLoadFactor": 0.85,
    "scopeType": "SCOPE_2",
    "isCommon": false,
    "description": "Hấp thụ NO2 vào nước tạo axit nitric công nghiệp"
  },
  {
    "id": 61,
    "code": "FERT-NPK-TOWER",
    "name": "Tháp tạo hạt NPK cao tầng (High Tower Granulator)",
    "sector": "FERTILIZER",
    "stage": "Tạo hạt NPK cao cấp",
    "energyType": "ELECTRICITY",
    "ratedCapacity": 1850,
    "capacityUnit": "kW",
    "defaultLoadFactor": 0.8,
    "scopeType": "SCOPE_2",
    "isCommon": false,
    "description": "Dây chuyền tạo hạt phân bón phức hợp tháp cao 110m"
  },
  {
    "id": 62,
    "code": "FERT-NPK-DRUM",
    "name": "Thùng quay tạo hạt NPK bằng hơi nước (Granulation Drum)",
    "sector": "FERTILIZER",
    "stage": "Tạo hạt NPK truyền thống",
    "energyType": "ELECTRICITY",
    "ratedCapacity": 320,
    "capacityUnit": "kW",
    "defaultLoadFactor": 0.75,
    "scopeType": "SCOPE_2",
    "isCommon": false,
    "description": "Tạo hạt phân NPK các công thức 16-16-8, 20-20-15"
  },
  {
    "id": 63,
    "code": "FERT-NPK-DRYER",
    "name": "Lò sấy thùng quay NPK đốt than/dầu",
    "sector": "FERTILIZER",
    "stage": "Sấy khô hạt NPK",
    "energyType": "COAL",
    "ratedCapacity": 1.8,
    "capacityUnit": "tấn/h",
    "defaultLoadFactor": 0.78,
    "scopeType": "SCOPE_1",
    "isCommon": false,
    "description": "Sấy hạt phân bón đạt độ ẩm tiêu chuẩn < 1.5%"
  },
  {
    "id": 64,
    "code": "FERT-NPK-COOL",
    "name": "Thùng quay làm nguội hạt NPK",
    "sector": "FERTILIZER",
    "stage": "Làm nguội hạt NPK",
    "energyType": "ELECTRICITY",
    "ratedCapacity": 280,
    "capacityUnit": "kW",
    "defaultLoadFactor": 0.75,
    "scopeType": "SCOPE_2",
    "isCommon": false,
    "description": "Làm nguội hạt trước khi sàng phân loại kích thước"
  },
  {
    "id": 65,
    "code": "FERT-NPK-SCREEN",
    "name": "Cụm sàng phân loại hạt NPK 2 tầng",
    "sector": "FERTILIZER",
    "stage": "Phân loại cỡ hạt",
    "energyType": "ELECTRICITY",
    "ratedCapacity": 150,
    "capacityUnit": "kW",
    "defaultLoadFactor": 0.7,
    "scopeType": "SCOPE_2",
    "isCommon": false,
    "description": "Tách hạt đạt kích thước 2-4 mm, hạt to hồi lưu nghiền"
  },
  {
    "id": 66,
    "code": "FERT-NPK-COAT",
    "name": "Hệ thống bọc áo dầu chống ẩm hạt NPK (Coating Drum)",
    "sector": "FERTILIZER",
    "stage": "Chống vón cục phân bón",
    "energyType": "ELECTRICITY",
    "ratedCapacity": 95,
    "capacityUnit": "kW",
    "defaultLoadFactor": 0.65,
    "scopeType": "SCOPE_2",
    "isCommon": false,
    "description": "Phun dầu chống vón và bột khoáng phủ bóng bề mặt"
  },
  {
    "id": 67,
    "code": "FERT-DAP-REACT",
    "name": "Thiết bị phản ứng ống tạo muối DAP/MAP",
    "sector": "FERTILIZER",
    "stage": "Sản xuất phân lân DAP",
    "energyType": "ELECTRICITY",
    "ratedCapacity": 380,
    "capacityUnit": "kW",
    "defaultLoadFactor": 0.85,
    "scopeType": "SCOPE_2",
    "isCommon": false,
    "description": "Phản ứng trung hòa NH3 với Axit Photphoric H3PO4"
  },
  {
    "id": 68,
    "code": "FERT-DAP-GRAN",
    "name": "Thùng tạo hạt DAP chuyên dụng",
    "sector": "FERTILIZER",
    "stage": "Tạo hạt DAP 18-46-0",
    "energyType": "ELECTRICITY",
    "ratedCapacity": 290,
    "capacityUnit": "kW",
    "defaultLoadFactor": 0.78,
    "scopeType": "SCOPE_2",
    "isCommon": false,
    "description": "Tạo hạt phân bón Diamoni photphat chất lượng cao"
  },
  {
    "id": 69,
    "code": "FERT-BOILER-01",
    "name": "Lò hơi công nghiệp đốt than cấp nhiệt nhà máy",
    "sector": "FERTILIZER",
    "stage": "Cung cấp hơi công nghệ",
    "energyType": "COAL",
    "ratedCapacity": 6.5,
    "capacityUnit": "tấn/h",
    "defaultLoadFactor": 0.82,
    "scopeType": "SCOPE_1",
    "isCommon": false,
    "description": "Cung cấp hơi cao áp cho tua bin và sấy phân bón"
  },
  {
    "id": 70,
    "code": "FERT-BOILER-GAS",
    "name": "Lò hơi đốt khí tự nhiên dự phòng",
    "sector": "FERTILIZER",
    "stage": "Cung cấp hơi công nghệ",
    "energyType": "NATURAL_GAS",
    "ratedCapacity": 850,
    "capacityUnit": "1000 Sm3/h",
    "defaultLoadFactor": 0.75,
    "scopeType": "SCOPE_1",
    "isCommon": false,
    "description": "Khởi động lạnh và dự phòng hơi sạch cho nhà máy"
  },
  {
    "id": 71,
    "code": "FERT-RO-WATER",
    "name": "Hệ thống khử khoáng xử lý nước cấp lò hơi (Demin Water)",
    "sector": "FERTILIZER",
    "stage": "Tiện ích nước tinh khiết",
    "energyType": "ELECTRICITY",
    "ratedCapacity": 420,
    "capacityUnit": "kW",
    "defaultLoadFactor": 0.8,
    "scopeType": "SCOPE_2",
    "isCommon": false,
    "description": "Lọc màng thẩm thấu ngược RO sản xuất nước siêu sạch"
  },
  {
    "id": 72,
    "code": "FERT-BAG-UREA",
    "name": "Dây chuyền đóng bao & may miệng bao Urê tự động",
    "sector": "FERTILIZER",
    "stage": "Đóng gói sản phẩm",
    "energyType": "ELECTRICITY",
    "ratedCapacity": 180,
    "capacityUnit": "kW",
    "defaultLoadFactor": 0.7,
    "scopeType": "SCOPE_2",
    "isCommon": false,
    "description": "Đóng gói bao 50kg và bốc xếp tự động lên xe tải"
  },
  {
    "id": 73,
    "code": "FERT-BAG-NPK",
    "name": "Dây chuyền đóng bao NPK tốc độ cao",
    "sector": "FERTILIZER",
    "stage": "Đóng gói sản phẩm",
    "energyType": "ELECTRICITY",
    "ratedCapacity": 160,
    "capacityUnit": "kW",
    "defaultLoadFactor": 0.7,
    "scopeType": "SCOPE_2",
    "isCommon": false,
    "description": "Cân đóng bao điện tử độ chính xác cao"
  },
  {
    "id": 74,
    "code": "FERT-SCRUBBER",
    "name": "Hệ thống tháp rửa khí Scrubber thu hồi bụi & NH3",
    "sector": "FERTILIZER",
    "stage": "Xử lý khí thải môi trường",
    "energyType": "ELECTRICITY",
    "ratedCapacity": 520,
    "capacityUnit": "kW",
    "defaultLoadFactor": 0.85,
    "scopeType": "SCOPE_2",
    "isCommon": false,
    "description": "Thu hồi amoniac tự do và rửa sạch bụi khí xả"
  },
  {
    "id": 75,
    "code": "ALU-POT-HALL",
    "name": "Dãy bể điện phân Hall-Héroult (13.5 MWh/tấn nhôm)",
    "sector": "ALUMINIUM",
    "stage": "Điện phân nhôm sơ cấp",
    "energyType": "ELECTRICITY",
    "ratedCapacity": 180000,
    "capacityUnit": "kW",
    "defaultLoadFactor": 0.95,
    "scopeType": "SCOPE_2",
    "isCommon": false,
    "description": "Bể điện phân dòng điện một chiều 400 kA (Phát thải khí PFCs: CF4, C2F6)"
  },
  {
    "id": 76,
    "code": "ALU-ANODE-BAKE",
    "name": "Lò nung cực Anode Carbon đốt dầu FO/Khí",
    "sector": "ALUMINIUM",
    "stage": "Nung cực than Anode",
    "energyType": "FUEL_OIL",
    "ratedCapacity": 1200,
    "capacityUnit": "kg/h",
    "defaultLoadFactor": 0.85,
    "scopeType": "SCOPE_1",
    "isCommon": false,
    "description": "Nung khối than cốc dầu mỏ và hắc ín ở 1150°C"
  },
  {
    "id": 77,
    "code": "ALU-MELT-SEC",
    "name": "Lò nấu chảy nhôm tái chế kiểu buồng đôi (Re-melting)",
    "sector": "ALUMINIUM",
    "stage": "Nấu luyện nhôm phế liệu",
    "energyType": "NATURAL_GAS",
    "ratedCapacity": 650,
    "capacityUnit": "1000 Sm3/h",
    "defaultLoadFactor": 0.78,
    "scopeType": "SCOPE_1",
    "isCommon": false,
    "description": "Nấu chảy nhôm phế liệu tiêu thụ chỉ bằng 5% điện phân"
  },
  {
    "id": 78,
    "code": "ALU-EXTRUSION",
    "name": "Máy ép đùn nhôm định hình thủy lực 1800 tấn",
    "sector": "ALUMINIUM",
    "stage": "Ép đùn thanh nhôm định hình",
    "energyType": "ELECTRICITY",
    "ratedCapacity": 1100,
    "capacityUnit": "kW",
    "defaultLoadFactor": 0.75,
    "scopeType": "SCOPE_2",
    "isCommon": false,
    "description": "Ép thanh billet nóng thành nhôm thanh xây dựng & pin mặt trời"
  },
  {
    "id": 79,
    "code": "ALU-HOMOGEN",
    "name": "Lò ủ đồng đều hóa nhôm Billet (Homogenizing Furnace)",
    "sector": "ALUMINIUM",
    "stage": "Nhiệt luyện phôi nhôm",
    "energyType": "ELECTRICITY",
    "ratedCapacity": 850,
    "capacityUnit": "kW",
    "defaultLoadFactor": 0.7,
    "scopeType": "SCOPE_2",
    "isCommon": false,
    "description": "Khử ứng suất dư và làm đều cấu trúc hạt hợp kim"
  },
  {
    "id": 80,
    "code": "ALU-CAST-INGOT",
    "name": "Dây chuyền đúc thỏi nhôm liên tục (Ingot Casting)",
    "sector": "ALUMINIUM",
    "stage": "Đúc thỏi thành phẩm",
    "energyType": "ELECTRICITY",
    "ratedCapacity": 450,
    "capacityUnit": "kW",
    "defaultLoadFactor": 0.72,
    "scopeType": "SCOPE_2",
    "isCommon": false,
    "description": "Đúc nhôm lỏng thành thỏi chuẩn 20kg thương mại"
  },
  {
    "id": 81,
    "code": "ALU-DROSS-REC",
    "name": "Lò thu hồi nhôm từ xỉ xỉ nhiệt (Dross Recovery Furnace)",
    "sector": "ALUMINIUM",
    "stage": "Thu hồi kim loại từ xỉ",
    "energyType": "ELECTRICITY",
    "ratedCapacity": 320,
    "capacityUnit": "kW",
    "defaultLoadFactor": 0.65,
    "scopeType": "SCOPE_2",
    "isCommon": false,
    "description": "Tách kim loại nhôm sạch khỏi xỉ oxit nhôm"
  },
  {
    "id": 82,
    "code": "ALU-ANODIZE",
    "name": "Dây chuyền xử lý bề mặt Anodized nhôm thanh",
    "sector": "ALUMINIUM",
    "stage": "Gia công bề mặt chống oxy hóa",
    "energyType": "ELECTRICITY",
    "ratedCapacity": 1500,
    "capacityUnit": "kW",
    "defaultLoadFactor": 0.75,
    "scopeType": "SCOPE_2",
    "isCommon": false,
    "description": "Tạo lớp màng oxit nhôm bảo vệ trong bể điện hóa"
  },
  {
    "id": 83,
    "code": "ALU-FUME-TREAT",
    "name": "Hệ thống xử lý khí khô thu hồi Flo & bụi Al2O3 (FTP)",
    "sector": "ALUMINIUM",
    "stage": "Bảo vệ môi trường & thu hồi",
    "energyType": "ELECTRICITY",
    "ratedCapacity": 2200,
    "capacityUnit": "kW",
    "defaultLoadFactor": 0.9,
    "scopeType": "SCOPE_2",
    "isCommon": false,
    "description": "Hấp phụ khí HF bằng bột alumina bảo vệ môi trường"
  },
  {
    "id": 84,
    "code": "GEN-CHILLER-CENT",
    "name": "Hệ thống làm lạnh Chiller trung tâm làm mát văn phòng/xưởng",
    "sector": null,
    "stage": "Điều hòa không khí & Chiller",
    "energyType": "REFRIGERANT",
    "ratedCapacity": 525,
    "capacityUnit": "kW",
    "defaultLoadFactor": 0.65,
    "scopeType": "SCOPE_1",
    "isCommon": true,
    "description": "Hệ Chiller nạp gas R410A/R123 phát thải rò rỉ môi chất lạnh"
  },
  {
    "id": 85,
    "code": "GEN-GENSET-DIESEL",
    "name": "Máy phát điện dự phòng Diesel tự động (Genset)",
    "sector": null,
    "stage": "Nguồn điện khẩn cấp",
    "energyType": "DIESEL",
    "ratedCapacity": 850,
    "capacityUnit": "kVA",
    "defaultLoadFactor": 0.2,
    "scopeType": "SCOPE_1",
    "isCommon": true,
    "description": "Đốt dầu DO chạy thử định kỳ và khi mất lưới điện EVN"
  },
  {
    "id": 86,
    "code": "GEN-FORKLIFT-FLEET",
    "name": "Đội xe nâng hàng nội bộ kho bãi (Xe dầu DO & Xe điện)",
    "sector": null,
    "stage": "Bốc xếp & vận chuyển hàng hóa",
    "energyType": "DIESEL",
    "ratedCapacity": 87600,
    "capacityUnit": "lít/năm",
    "defaultLoadFactor": 0.7,
    "scopeType": "SCOPE_1",
    "isCommon": true,
    "description": "Đội xe nâng hàng tiêu thụ dầu DO (Khớp số liệu kiểm kê thực tế)"
  },
  {
    "id": 87,
    "code": "GEN-CANTEEN-GAS",
    "name": "Hệ thống bếp ăn tập thể cán bộ công nhân viên",
    "sector": null,
    "stage": "Dịch vụ đời sống nhà ăn",
    "energyType": "LPG",
    "ratedCapacity": 450,
    "capacityUnit": "kg/tháng",
    "defaultLoadFactor": 0.5,
    "scopeType": "SCOPE_1",
    "isCommon": true,
    "description": "Đốt bình gas công nghiệp LPG 45kg phục vụ 200-500 suất ăn"
  },
  {
    "id": 88,
    "code": "GEN-SEPTIC-TANK",
    "name": "Hệ thống bể tự hoại & trạm xử lý nước thải sinh hoạt",
    "sector": null,
    "stage": "Xử lý nước thải công nhân",
    "energyType": "WASTEWATER",
    "ratedCapacity": 45,
    "capacityUnit": "kW",
    "defaultLoadFactor": 0.6,
    "scopeType": "SCOPE_1",
    "isCommon": true,
    "description": "Phát thải khí CH4 và N2O từ phân hủy hữu cơ BOD công nhân viên"
  },
  {
    "id": 89,
    "code": "GEN-FIRE-PUMP",
    "name": "Cụm máy bơm chữa cháy PCCC động cơ Diesel & điện",
    "sector": null,
    "stage": "An toàn phòng cháy chữa cháy",
    "energyType": "DIESEL",
    "ratedCapacity": 110,
    "capacityUnit": "kW",
    "defaultLoadFactor": 0.05,
    "scopeType": "SCOPE_1",
    "isCommon": true,
    "description": "Máy bơm cứu hỏa xịt thử áp suất định kỳ hằng tháng"
  },
  {
    "id": 90,
    "code": "GEN-SERVER-IT",
    "name": "Trung tâm máy chủ Server Room & hệ thống CNTT",
    "sector": null,
    "stage": "Hạ tầng số & điều khiển DCS",
    "energyType": "ELECTRICITY",
    "ratedCapacity": 75,
    "capacityUnit": "kW",
    "defaultLoadFactor": 0.9,
    "scopeType": "SCOPE_2",
    "isCommon": true,
    "description": "Hệ thống máy chủ điều khiển DCS/SCADA vận hành liên tục 24/7"
  },
  {
    "id": 91,
    "code": "GEN-AIR-COMP-CENT",
    "name": "Trạm máy nén khí trục vít trung tâm nhà máy",
    "sector": null,
    "stage": "Cung cấp khí nén công nghiệp",
    "energyType": "ELECTRICITY",
    "ratedCapacity": 315,
    "capacityUnit": "kW",
    "defaultLoadFactor": 0.75,
    "scopeType": "SCOPE_2",
    "isCommon": true,
    "description": "Cung ứng khí nén sạch cho các van điều khiển tự động hóa toàn xưởng"
  },
  {
    "id": 92,
    "code": "GEN-FIRE-EXT-CO2",
    "name": "Hệ thống bình chữa cháy CO2 xách tay PCCC (MT3, MT5)",
    "sector": null,
    "stage": "An toàn PCCC & Ứng phó sự cố",
    "energyType": "CO2_GAS",
    "ratedCapacity": 45,
    "capacityUnit": "kg CO2",
    "defaultLoadFactor": 0.05,
    "scopeType": "SCOPE_1",
    "isCommon": true,
    "description": "Trang bị 15 bình chữa cháy CO2 loại MT3 tại trạm biến áp và gian lò, phát thải rò rỉ khí định mức 5%/năm"
  }
];

window.EQUIPMENT_ALIASES = {
  'STEEL-EAF-01': ['eaf', 'lo ho quang', 'lo dien ho quang', 'electric arc furnace', 'luyen thep eaf', 'lo nau thep phe', 'lo luyen eaf', 'ho quang dien', 'nau luyen thep'],
  'STEEL-LRF-01': ['lrf', 'lo tinh luyen', 'ladle refining', 'tinh luyen thung', 'thung tinh luyen', 'tinh luyen thep'],
  'STEEL-CCM-01': ['ccm', 'duc phoi lien tuc', 'continuous caster', 'may duc phoi', 'day chuyen duc lien tuc', 'duc phoi thep'],
  'STEEL-FURN-01': ['lo nung phoi', 'reheating furnace', 'lo gia nhiet phoi', 'lo nung lai', 'lo dot fo', 'lo nung can', 'lo nung nhiet luyen', 'gia nhiet phoi can'],
  'STEEL-ROLL-HOT': ['can nong', 'hot rolling', 'hrc', 'day chuyen can nong', 'may can nong', 'can thep tam cuon'],
  'STEEL-ROLL-COLD': ['can nguoi', 'cold rolling', 'crc', 'day chuyen can nguoi', 'may can nguoi', 'can thep la'],
  'STEEL-PICKLING': ['tay gi', 'cpl', 'pickling', 'tay axit', 'day chuyen tay ri', 'xu ly be mat thep'],
  'STEEL-GALV-01': ['ma kem', 'cgl', 'galvanizing', 'nhung nong', 'ma ton', 'day chuyen ma', 'ton ma kem'],
  'STEEL-ROLL-ROD': ['wire rod', 'can day', 'thep thanh', 'thanh cuon', 'can thep xay dung', 'thep van'],
  'STEEL-TUBE-01': ['han ong', 'erw', 'ong thep', 'ong hop', 'dinh hinh ong', 'ong thep hop', 'che tao ong thep'],
  'STEEL-FAST-01': ['dap bu long', 'cold heading', 'oc vit', 'co khi bu long', 'dap nguoi', 'dap dau bu long'],
  'STEEL-CRANE-01': ['cau truc', 'crane', 'gian lo', 'can truc', 'cau truc 150', 'rot thep long'],

  'CEM-CRUSH-01': ['dap da voi', 'crusher', 'may dap bua', 'khai thac da', 'dap so cap', 'da voi'],
  'CEM-CRUSH-02': ['dap set', 'phu gia thu cap', 'nghien tho'],
  'CEM-VRM-RAW': ['nghien lieu', 'vrm raw', 'nghien dung', 'raw mill', 'bot lieu song', 'may nghien dung'],
  'CEM-PREHEAT-01': ['preheater', 'trao doi nhiet', 'thap cyclone', 'nung so bo', 'thap 5 tang'],
  'CEM-CALCINER': ['calciner', 'buong phan huy', 'calcination', 'phan huy caco3', 'buong calciner'],
  'CEM-KILN-ROTARY': ['lo quay', 'rotary kiln', 'nung clinker', 'lo nung clinker', 'lo clinker', 'lo quay clinker'],
  'CEM-COOLER-GRATE': ['cooler', 'lam nguoi clinker', 'gian cooler', 'ghi lam nguoi', 'gian lam nguoi'],
  'CEM-MILL-BALL-01': ['may nghien bi', 'ball mill', 'nghien xi mang', 'day chuyen nghien xi mang', 'nghien bi'],
  'CEM-WHR-TURBINE': ['whr', 'nhiet du', 'phat dien nhiet du', 'waste heat recovery', 'tua bin whr', 'thu hoi nhiet du'],

  'FERT-REF-PRIM': ['primary reformer', 'reforming so cap', 'lo reforming', 'reformer', 'khi tong hop nh3'],
  'FERT-CO2-ABS': ['hap thu co2', 'co2 absorber', 'thap amdea', 'tach co2', 'thu hoi co2'],
  'FERT-COMP-SYN': ['may nen khi syngas', 'syngas compressor', 'may nen tong hop', 'nen syngas'],
  'FERT-NH3-REACT': ['thap amoniac', 'tong hop nh3', 'ammonia converter', 'thap nh3', 'amoniac long'],
  'FERT-CO2-COMP': ['may nen co2', 'co2 compressor', 'nen co2 xuong ure', 'nen co2 160 bar'],
  'FERT-UREA-REACT': ['lo ure', 'urea reactor', 'thap tong hop ure', 'phan ung ure', 'tong hop ure'],
  'FERT-PRIL-TOWER': ['thap prilling', 'tao hat ure', 'prilling tower', 'thap tao hat', 'hat ure'],
  'FERT-OSTWALD-01': ['lo ostwald', 'axit nitric', 'luoi bach kim', 'dot amoniac', 'nitric acid', 'ostwald burner'],
  'FERT-NPK-TOWER': ['thap npk', 'tao hat npk', 'phan bon npk', 'npk tower', 'npk cao tang'],
  'FERT-BOILER-01': ['lo hoi than', 'noi hoi cong nghiep', 'cung cap hoi', 'boiler', 'noi hoi'],

  'ALU-POT-HALL': ['hall heroult', 'dien phan nhom', 'be dien phan', 'be hall', 'smelter', 'potline', 'be hall heroult'],
  'ALU-ANODE-BAKE': ['nung anode', 'anode bake', 'nung cuc than', 'cuc than anode', 'lo nung anode'],
  'ALU-MELT-SEC': ['nau chay nhom', 'nhom tai che', 're-melting', 'lo nau nhom phe', 'lo buong doi'],
  'ALU-EXTRUSION': ['ep dun', 'nhom dinh hinh', 'extrusion', 'may ep dun', 'ep dun nhom'],
  'ALU-CAST-INGOT': ['duc thoi', 'ingot casting', 'thoi nhom', 'duc nhom', 'thoi 20kg'],

  'GEN-CHILLER-CENT': ['chiller', 'may lam lanh', 'dieu hoa trung tam', 'vrv', 'nuoc lanh', 'daikin', 'trane', 'carrier', 'chillers', 'may lanh', 'hvac', 'dieu hoa xuong', 'lam mat van phong'],
  'GEN-GENSET-DIESEL': ['may phat dien', 'genset', 'cummins', 'may den', 'phat dien du phong', 'diesel generator', 'caterpillar', 'may phat', 'may no', 'phat dien diesel', 'dau do'],
  'GEN-FORKLIFT-FLEET': ['xe nang', 'forklift', 'xe nang hang', 'xe boc do', 'xe nang dau', 'xe nang dien', 'toyota forklift', 'doi xe nang', 'boc xep hang hoa'],
  'GEN-CANTEEN-GAS': ['bep an', 'bep gas', 'nha an', 'canteen', 'lpg bep', 'nau an cong nghiep', 'bep an tap the'],
  'GEN-SEPTIC-TANK': ['be tu hoai', 'nuoc thai sinh hoat', 'be phot', 'septic', 'xu ly nuoc thai cong nhan', 'be tu hoai nuoc thai'],
  'GEN-FIRE-PUMP': ['bom chua chay', 'pccc', 'bom cuu hoa', 'fire pump', 'may bom diesel pccc', 'chua chay'],
  'GEN-SERVER-IT': ['phong server', 'may chu', 'server room', 'cntt', 'datacenter', 'scada', 'dcs', 'trung tam may chu'],
  'GEN-AIR-COMP-CENT': ['may nen khi', 'khi nen', 'air compressor', 'truc vit', 'atlas copco', 'tram khi nen', 'may nen khi trung tam'],
  'GEN-FIRE-EXT-CO2': ['binh chua chay', 'binh co2', 'binh cuu hoa', 'mt3', 'mt5', 'pccc xach tay', 'chua chay co2'],

  // 1. Bao bì & Giấy (PAPER)
  'PAPER-BOILER-BIO': ['lo hoi sinh khoi', 'lo hoi biomass', 'lo hoi dot mun cua', 'lo hoi tang soi', 'noi hoi giay', 'biomass boiler', 'lo hoi vo cay', 'noi hoi tang soi', 'dot vo cay', 'noi hoi dot vo cay', 'lo hoi tang soi dot sinh khoi'],
  'PAPER-DIGEST-01': ['noi nau bot giay', 'digester', 'nau bot giay', 'nau dam go', 'continuous digester', 'noi nau lien tuc'],
  'PAPER-YANKEE-01': ['yankee', 'lo say yankee', 'say giay', 'may say yankee', 'say giay tissue', 'yankee dryer', 'lo say tráng guong'],
  'PAPER-MACHINE-01': ['may xeo', 'xeo giay', 'may xeo giay', 'paper machine', 'fourdrinier', 'day chuyen xeo giay', 'xeo giay toc do cao'],
  'PAPER-PULPER-01': ['may nghiền thuy luc', 'pulper', 'hydrapulper', 'danh bot giay', 'nghien bot tai che', 'danh thung carton'],
  'PAPER-WWTP-AERO': ['xu ly nuoc thai giay', 'aerotank', 'tram nuoc thai', 'suc khi aerotank', 'be hieu khi', 'tram xu ly nuoc thai bot giay'],

  // 2. Dệt may (TEXTILE)
  'TEX-BOILER-ST': ['noi hoi det', 'lo hoi nhuom', 'noi hoi giat', 'lo hoi dot cui', 'lo hoi biomass det', 'lo hoi dot trau', 'noi hoi ong nuoc'],
  'TEX-STENTER-01': ['stenter', 'may dinh hinh', 'may cang kim', 'dinh hinh nhiet', 'say dinh hinh', 'stenter frame', 'dinh hinh vai'],
  'TEX-DYE-JET': ['may nhuom cao ap', 'jet dyeing', 'may nhuom', 'nhuom vai', 'nhuom jet', 'may nhuom khi', 'nhuom polyester'],
  'TEX-WEAVE-LINE': ['may det thoi', 'air jet loom', 'det thoi', 'day chuyen det', 'gian may det', 'det khi nen'],
  'TEX-SEW-PLANT': ['xuong may', 'may may cong nghiep', 'to hop may', 'day chuyen may rap', 'may 1 kim', 'may may dien tu'],
  'TEX-DRYER-TUMB': ['may say long quay', 'say vai', 'may say cong nghiep', 'say quan ao', 'say vat kho'],

  // 3. Da giày (FOOTWEAR)
  'SHOE-MOLD-EVA': ['may ep de', 'ep de eva', 'hot press molding', 'ep eva', 'may ep phylon', 'ep khuon de nhiet'],
  'SHOE-GLUE-DRY': ['buong say keo', 'say keo giay', 'quyet keo', 'dan de giay', 'say vocs', 'kich hoat nhiet keo', 'ham say keo', 'say keo eva', 'de giay', 'de giay the thao', 'say keo eva de giay'],
  'SHOE-SEW-HIGH': ['may may da', 'may may de', 'may cao tan', 'may mu giay', 'may may da tu dong'],
  'SHOE-CUT-AUTO': ['may cat laser da', 'cat cnc da', 'may cat da tu dong', 'cat phoi da', 'cat da nhan tao'],
  'SHOE-VULCAN-01': ['lo luu hoa', 'luu hoa cao su', 'autoclave', 'noi luu hoa de', 'luu hoa hoi nuoc'],

  // 4. Thực phẩm & Đồ uống (FOOD_BEVERAGE)
  'FOOD-BOILER-UHT': ['noi hoi uht', 'tiet trung uht', 'thanh trung', 'noi nau thanh trung', 'uht boiler', 'tiet trung thuc pham', 'tiet trung uht thanh trung', 'he thong tiet trung uht'],
  'FOOD-IQF-FREEZE': ['iqf', 'cap dong nhanh', 'kho cap dong', 'ham cap dong', 'cap dong iqf', 'freezer iqf', 'cap dong sieu toc'],
  'FOOD-SPRAY-DRY': ['thap say phun', 'spray dryer', 'say phun sua', 'say bot ca phe', 'say tao bot', 'say phun tinh bot'],
  'FOOD-OVEN-LPG': ['lo nuong lpg', 'lo nuong banh', 'tunnel oven', 'lo nuong bang chuyen', 'nuong banh biscuit', 'lo nuong gas'],
  'FOOD-BOTTLING': ['chiet rot', 'dong lon', 'dong chai', 'chiet rot vo trung', 'bottling line', 'day chuyen dong chai', 'chiet rot lon'],

  // 5. Cơ khí chế tạo (MECHANICAL)
  'MECH-HEAT-IND': ['lo toi cao tan', 'nhiet luyen', 'induction hardening', 'toi truc', 'toi banh rang', 'gia nhiet cam ung', 'lo toi ram tham carbon', 'tham carbon nhiet luyen'],
  'MECH-CNC-LASER': ['cat laser', 'fiber laser', 'laser cnc', 'may cat fiber', 'plasma cnc', 'cat thep laser', 'cat kim loai cnc'],
  'MECH-PAINT-LINE': ['son tinh dien', 'buong son', 'say son', 'phun son bot', 'powder coating', 'son tinh dien cong nghiep'],
  'MECH-PRESS-HYD': ['may ep thuy luc', 'may dap', 'hydraulic press', 'dap 500 tan', 'dap vuot sau', 'may dap thuy luc'],
  'MECH-WELD-ROBOT': ['robot han', 'han co2', 'han argon', 'han ho quang', 'welding robot', 'robot han cong nghiep'],

  // 6. Nhựa & Hóa chất (PLASTICS_CHEMICALS)
  'PLAST-INJECT-01': ['may ep nhua', 'injection', 'ep phun', 'ep hat nhua', 'may duc nhua', 'injection molding', 'may ep phun', 'ep phun nhua thuy luc'],
  'PLAST-EXTRUD-01': ['may dun mang', 'dun mang thoi', 'blown film', 'dun mang pe', 'may thoi tui', 'dun mang 3 lop'],
  'CHEM-REACT-POLY': ['thap phan ung', 'polyme hoa', 'noi phan ung', 'reactor', 'khuay tron polyme', 'trung hop nhu tuong'],
  'PLAST-COOL-TOWER': ['thap giai nhiet', 'cooling tower', 'giai nhiet khuon', 'lam mat dau', 'thap nuoc xuỏng nhua'],
  'CHEM-MIX-HIGH': ['may khuay cao toc', 'may phan tan', 'disperser', 'khuay son', 'khuay hoa chat', 'phan tan cao toc'],

  // 7. Gỗ & Nội thất (WOOD_FURNITURE)
  'WOOD-KILN-BIO': ['lo say go', 'ham say go', 'say go mun cua', 'lo say biomass', 'say go tu nhien', 'lo say go cong nghiep', 'lo say go cong nghiep bang hoi nuoc', 'say kho go'],
  'WOOD-SAW-MULTI': ['may cua xe', 'cua da luoi', 'xe go', 'cua rong', 'may xe phoi go', 'cua xe tu dong'],
  'WOOD-SPRAY-PU': ['buong son pu', 'son pu mang nuoc', 'phun son go', 'phun bong', 'buong son mang nuoc', 'son phong go'],
  'WOOD-DUST-CYCLO': ['hut bui go', 'loc bui cyclone', 'tui vai loc bui', 'hut bui trung tam', 'silo bui', 'loc bui go'],
  'WOOD-CNC-ROUTER': ['cnc go', 'cnc 5 truc', 'cham khac go', 'phay go cnc', 'router cnc', 'cham khac noi that'],

  // 8. Điện tử (ELECTRONICS)
  'ELEC-HVAC-CLEAN': ['phong sach', 'cleanroom', 'hvac phong sach', 'ahu hepa', 'dieu hoa phong sach', 'phong sach class 1000'],
  'ELEC-SMT-LINE': ['smt', 'dan chip', 'gan linh kien', 'pick and place', 'may smt', 'smt line', 'dan chip smd'],
  'ELEC-REFLOW-01': ['lo han song', 'reflow', 'reflow soldering', 'han nito', 'lo han reflow', 'han doi luu', 'lo han hoi luu smt', 'reflow oven'],
  'ELEC-UPW-PLANT': ['nuoc sieu tinh khiet', 'upw', 'ro edi', 'loc nuoc ban dan', 'nuoc upw', 'tram nuoc sieu sach'],
  'ELEC-AUTO-TEST': ['may aoi', 'kiem tra quang hoc', 'soc nhiet', 'buong thu nhiet', 'aoi test', 'kiem tra moi han'],

  // 9. Nhiệt điện / Điện lực (POWER_THERMAL)
  'POW-BOILER-PC': ['lo hoi than', 'lo than min', 'pulverized coal', 'noi hoi nhiet dien', 'pc boiler', 'noi hoi sieu toi han'],
  'POW-TURBINE-600': ['tua bin 600mw', 'tua bin hoi', 'steam turbine', 'may phat 600mw', 'to may phat dien', 'tua bin nhiet dien', 'tua bin hoi nuoc phat dien'],
  'POW-FGD-SULF': ['khu luu huynh', 'fgd', 'khu so2', 'loc luu huynh', 'thap fgd', 'khu luu huynh bang da voi'],
  'POW-ESP-DUST': ['loc bui tinh dien', 'esp', 'loc tro bay', 'tinh dien 4 truong', 'esp filter', 'loc bui esp'],
  'POW-CW-PUMP': ['bom tuan hoan', 'bom nuoc ngung', 'cooling water pump', 'giai nhiet binh ngung', 'bom nuoc lam mat'],

  // 10. Hydrogen (HYDROGEN)
  'HYD-ELEC-ALK': ['dien phan hydro', 'alkaline electrolyzer', 'dien phan kiem', 'san xuat h2', 'green hydrogen', 'dien phan koh', 'dien phan nuoc', 'hydrogen xanh', 'san xuat hydrogen', 'san xuat khi hydrogen'],
  'HYD-COMP-700': ['may nen hydro', 'nen h2 700 bar', 'nen hydrogen', 'may nen cao ap hydro', 'may nen 350 bar'],
  'HYD-DEOXO-DRY': ['khu oxy hydro', 'deoxo', 'say hydro', 'tinh che h2', 'khu deoxo'],

  // 11. Nông nghiệp (AGRICULTURE)
  'AGRI-FEED-MILL': ['may nghiền thuc an', 'ep vien thuc an', 'feed mill', 'nghien cam', 'san xuat thuc an chan nuoi', 'ep vien cam'],
  'AGRI-BARN-VENT': ['quat thong gio chuong', 'lam mat chuong trai', 'cooling pad', 'quat hut trang trai', 'thong gio chuong trai'],
  'AGRI-PUMP-IRR': ['bom tuoi tieu', 'tram bom nong nghiep', 'bom canh dong', 'tuoi tieu', 'tram bom thuy loi'],
  'AGRI-DRYER-GRAIN': ['may say lua', 'say nong san', 'say thap', 'say lua gao', 'say nong san dang thap', 'thap say lua', 'may say lua thap say nong san'],

  // 12. Vận tải & Logistics (LOGISTICS)
  'LOG-TRUCK-HEAVY': ['xe dau keo', 'xe container', 'xe tai nang', 'xe hang nang', 'truck container', 'dau keo container'],
  'LOG-COLD-STOR': ['kho lanh logistics', 'kho bao quan dong lanh', 'kho lanh thuc pham', 'cold storage', 'kho cap dong hang hoa']
};

window.INDUSTRY_SECTOR_MAP = {
  'Sắt Thép': 'STEEL',
  'Thép': 'STEEL',
  'STEEL': 'STEEL',
  'Nhôm': 'ALUMINIUM',
  'Xi măng': 'CEMENT',
  'Phân bón': 'FERTILIZER',
  'Nhiệt điện / Điện lực': 'POWER_THERMAL',
  'Nhiệt điện': 'POWER_THERMAL',
  'Điện lực': 'POWER_THERMAL',
  'POWER_THERMAL': 'POWER_THERMAL',
  'Hydrogen': 'HYDROGEN',
  'HYDROGEN': 'HYDROGEN',
  'Bao bì & Giấy': 'PAPER',
  'Giấy & Bột giấy': 'PAPER',
  'Giấy': 'PAPER',
  'Bột giấy': 'PAPER',
  'PAPER': 'PAPER',
  'Dệt may': 'TEXTILE',
  'Dệt': 'TEXTILE',
  'May mặc': 'TEXTILE',
  'TEXTILE': 'TEXTILE',
  'Da giày': 'FOOTWEAR',
  'Giày dép': 'FOOTWEAR',
  'FOOTWEAR': 'FOOTWEAR',
  'Nhựa & Hóa chất': 'PLASTICS_CHEMICALS',
  'Nhựa': 'PLASTICS_CHEMICALS',
  'Hóa chất': 'PLASTICS_CHEMICALS',
  'PLASTICS_CHEMICALS': 'PLASTICS_CHEMICALS',
  'Thực phẩm & Đồ uống': 'FOOD_BEVERAGE',
  'Chế biến thực phẩm': 'FOOD_BEVERAGE',
  'Thực phẩm': 'FOOD_BEVERAGE',
  'Đồ uống': 'FOOD_BEVERAGE',
  'FOOD_BEVERAGE': 'FOOD_BEVERAGE',
  'Cơ khí chế tạo': 'MECHANICAL',
  'Cơ khí': 'MECHANICAL',
  'MECHANICAL': 'MECHANICAL',
  'Nông nghiệp': 'AGRICULTURE',
  'AGRICULTURE': 'AGRICULTURE',
  'Vận tải & Logistics': 'LOGISTICS',
  'Logistics': 'LOGISTICS',
  'Vận tải': 'LOGISTICS',
  'LOGISTICS': 'LOGISTICS',
  'Gỗ & Nội thất': 'WOOD_FURNITURE',
  'Gỗ': 'WOOD_FURNITURE',
  'Chế biến gỗ': 'WOOD_FURNITURE',
  'WOOD_FURNITURE': 'WOOD_FURNITURE',
  'Điện tử': 'ELECTRONICS',
  'ELECTRONICS': 'ELECTRONICS'
};

window.INDUSTRY_EQUIPMENT_REGISTRY = [
  // 1. Bao bì & Giấy (PAPER)
  {
    code: 'PAPER-BOILER-BIO',
    name: 'Lò hơi tầng sôi đốt sinh khối mùn cưa / vỏ cây',
    sector: 'PAPER',
    stage: 'Cung cấp nhiệt hơi sấy',
    energyType: 'BIOMASS',
    ratedCapacity: 35000,
    capacityUnit: 'kg/h',
    defaultLoadFactor: 0.85,
    scopeType: 'SCOPE_1',
    isCommon: false,
    description: 'Cung cấp hơi bão hòa áp suất 10-16 bar cho hệ thống sấy giấy'
  },
  {
    code: 'PAPER-DIGEST-01',
    name: 'Nồi nấu bột giấy liên tục (Continuous Digester)',
    sector: 'PAPER',
    stage: 'Sản xuất bột giấy',
    energyType: 'ELECTRICITY',
    ratedCapacity: 850,
    capacityUnit: 'kW',
    defaultLoadFactor: 0.8,
    scopeType: 'SCOPE_2',
    isCommon: false,
    description: 'Nấu dăm gỗ thành bột giấy bằng hóa chất kiềm sulfate'
  },
  {
    code: 'PAPER-YANKEE-01',
    name: 'Máy sấy giấy Yankee Dryer (Lô sấy đường kính lớn)',
    sector: 'PAPER',
    stage: 'Xeo và sấy khô giấy',
    energyType: 'ELECTRICITY',
    ratedCapacity: 1200,
    capacityUnit: 'kW',
    defaultLoadFactor: 0.85,
    scopeType: 'SCOPE_2',
    isCommon: false,
    description: 'Lô sấy tráng gương gia nhiệt hơi nước sấy khô giấy tissue/kraft'
  },
  {
    code: 'PAPER-MACHINE-01',
    name: 'Dây chuyền máy xeo giấy tốc độ cao Fourdrinier',
    sector: 'PAPER',
    stage: 'Định hình và cuộn giấy',
    energyType: 'ELECTRICITY',
    ratedCapacity: 2500,
    capacityUnit: 'kW',
    defaultLoadFactor: 0.9,
    scopeType: 'SCOPE_2',
    isCommon: false,
    description: 'Máy xeo giấy hoàn thiện cuộn ép khổ 4.2m tốc độ 800m/phút'
  },
  {
    code: 'PAPER-PULPER-01',
    name: 'Máy nghiền thủy lực bột giấy tái chế (Hydrapulper)',
    sector: 'PAPER',
    stage: 'Tái chế bột giấy',
    energyType: 'ELECTRICITY',
    ratedCapacity: 450,
    capacityUnit: 'kW',
    defaultLoadFactor: 0.85,
    scopeType: 'SCOPE_2',
    isCommon: false,
    description: 'Đánh tan thùng carton cũ OCC thành bùn bột sợi tái chế'
  },
  {
    code: 'PAPER-WWTP-AERO',
    name: 'Trạm xử lý nước thải bột giấy sục khí sinh học Aerotank',
    sector: 'PAPER',
    stage: 'Xử lý môi trường',
    energyType: 'ELECTRICITY',
    ratedCapacity: 350,
    capacityUnit: 'kW',
    defaultLoadFactor: 0.95,
    scopeType: 'SCOPE_2',
    isCommon: false,
    description: 'Xử lý COD/BOD nước thải xeo giấy công suất 5000 m3/ngày'
  },

  // 2. Dệt may (TEXTILE)
  {
    code: 'TEX-BOILER-ST',
    name: 'Nồi hơi đốt biomass cấp nhiệt nhuộm & giặt tẩy',
    sector: 'TEXTILE',
    stage: 'Cung cấp nhiệt hơi',
    energyType: 'BIOMASS',
    ratedCapacity: 15000,
    capacityUnit: 'kg/h',
    defaultLoadFactor: 0.8,
    scopeType: 'SCOPE_1',
    isCommon: false,
    description: 'Nồi hơi ống nước đốt trấu/viên nén mùn cưa cấp hơi cho xưởng nhuộm'
  },
  {
    code: 'TEX-STENTER-01',
    name: 'Máy định hình nhiệt vải căng kim (Stenter Frame Dryer)',
    sector: 'TEXTILE',
    stage: 'Căng định hình và hoàn tất',
    energyType: 'ELECTRICITY',
    ratedCapacity: 450,
    capacityUnit: 'kW',
    defaultLoadFactor: 0.85,
    scopeType: 'SCOPE_2',
    isCommon: false,
    description: 'Định hình chiều khổ và ổn định kích thước vải dệt 8 khoang nhiệt'
  },
  {
    code: 'TEX-DYE-JET',
    name: 'Máy nhuộm cao áp Jet Dyeing Machine tự động',
    sector: 'TEXTILE',
    stage: 'Nhuộm màu sợi/vải',
    energyType: 'ELECTRICITY',
    ratedCapacity: 120,
    capacityUnit: 'kW',
    defaultLoadFactor: 0.75,
    scopeType: 'SCOPE_2',
    isCommon: false,
    description: 'Nhuộm vải polyester/cotton nhiệt độ cao 135°C áp suất 3 bar'
  },
  {
    code: 'TEX-WEAVE-LINE',
    name: 'Dây chuyền dệt thoi khí nén tự động Air-Jet Looms',
    sector: 'TEXTILE',
    stage: 'Dệt vải mộc',
    energyType: 'ELECTRICITY',
    ratedCapacity: 800,
    capacityUnit: 'kW',
    defaultLoadFactor: 0.9,
    scopeType: 'SCOPE_2',
    isCommon: false,
    description: 'Dàn 120 máy dệt thoi thổi khí nén tốc độ cao 900 rpm'
  },
  {
    code: 'TEX-SEW-PLANT',
    name: 'Xưởng máy may công nghiệp điện tử may ráp quần áo',
    sector: 'TEXTILE',
    stage: 'May ráp thành phẩm',
    energyType: 'ELECTRICITY',
    ratedCapacity: 200,
    capacityUnit: 'kW',
    defaultLoadFactor: 0.65,
    scopeType: 'SCOPE_2',
    isCommon: false,
    description: 'Tổ hợp 500 máy may 1 kim, vắt sổ và đính bọ điện tử tiết kiệm điện'
  },
  {
    code: 'TEX-DRYER-TUMB',
    name: 'Máy sấy lồng quay công nghiệp sấy khô sợi vải',
    sector: 'TEXTILE',
    stage: 'Sấy và hoàn tất',
    energyType: 'ELECTRICITY',
    ratedCapacity: 180,
    capacityUnit: 'kW',
    defaultLoadFactor: 0.75,
    scopeType: 'SCOPE_2',
    isCommon: false,
    description: 'Sấy vắt khô vải sau giặt nhuộm tải trọng 200kg/mẻ'
  },

  // 3. Da giày (FOOTWEAR)
  {
    code: 'SHOE-MOLD-EVA',
    name: 'Máy ép khuôn đế nhiệt EVA / Phylon (Hot-Press Molding)',
    sector: 'FOOTWEAR',
    stage: 'Ép định hình đế',
    energyType: 'ELECTRICITY',
    ratedCapacity: 280,
    capacityUnit: 'kW',
    defaultLoadFactor: 0.8,
    scopeType: 'SCOPE_2',
    isCommon: false,
    description: 'Gia nhiệt lưu hóa tạo hình đế giữa EVA giày thể thao'
  },
  {
    code: 'SHOE-GLUE-DRY',
    name: 'Buồng sấy keo dán đế và quét keo hoàn tất giày (VOCs)',
    sector: 'FOOTWEAR',
    stage: 'Gắn đế và dán keo',
    energyType: 'ELECTRICITY',
    ratedCapacity: 150,
    capacityUnit: 'kW',
    defaultLoadFactor: 0.75,
    scopeType: 'SCOPE_2',
    isCommon: false,
    description: 'Băng chuyền sấy kích hoạt nhiệt keo dán đế nhiệt độ 60-80°C'
  },
  {
    code: 'SHOE-SEW-HIGH',
    name: 'Dây chuyền máy may da và may đế cao tần tự động',
    sector: 'FOOTWEAR',
    stage: 'May mũ giày',
    energyType: 'ELECTRICITY',
    ratedCapacity: 160,
    capacityUnit: 'kW',
    defaultLoadFactor: 0.7,
    scopeType: 'SCOPE_2',
    isCommon: false,
    description: 'May ráp chi tiết da mũ giày và may viền đế'
  },
  {
    code: 'SHOE-CUT-AUTO',
    name: 'Máy cắt laser / dao tự động CNC nguyên liệu da nhân tạo',
    sector: 'FOOTWEAR',
    stage: 'Cắt phôi da',
    energyType: 'ELECTRICITY',
    ratedCapacity: 95,
    capacityUnit: 'kW',
    defaultLoadFactor: 0.8,
    scopeType: 'SCOPE_2',
    isCommon: false,
    description: 'Cắt tự động tối ưu hóa diện tích tấm da giảm hao hụt nguyên liệu'
  },
  {
    code: 'SHOE-VULCAN-01',
    name: 'Lò lưu hóa đế cao su giày vải (Rubber Vulcanizing Autoclave)',
    sector: 'FOOTWEAR',
    stage: 'Lưu hóa cao su',
    energyType: 'ELECTRICITY',
    ratedCapacity: 220,
    capacityUnit: 'kW',
    defaultLoadFactor: 0.8,
    scopeType: 'SCOPE_2',
    isCommon: false,
    description: 'Lưu hóa đế cao su bằng nhiệt hơi bão hòa áp suất cao'
  },

  // 4. Thực phẩm & Đồ uống (FOOD_BEVERAGE)
  {
    code: 'FOOD-BOILER-UHT',
    name: 'Nồi hơi tiệt trùng thực phẩm UHT và nấu thanh trùng',
    sector: 'FOOD_BEVERAGE',
    stage: 'Tiệt trùng và thanh trùng',
    energyType: 'NATURAL_GAS',
    ratedCapacity: 10000,
    capacityUnit: 'kg/h',
    defaultLoadFactor: 0.8,
    scopeType: 'SCOPE_1',
    isCommon: false,
    description: 'Cấp nhiệt cho hệ thống tiệt trùng UHT sữa và nước giải khát'
  },
  {
    code: 'FOOD-IQF-FREEZE',
    name: 'Hệ thống hầm cấp đông siêu tốc IQF (Gas NH3 / CO2 Cascade)',
    sector: 'FOOD_BEVERAGE',
    stage: 'Cấp đông nhanh thực phẩm',
    energyType: 'ELECTRICITY',
    ratedCapacity: 650,
    capacityUnit: 'kW',
    defaultLoadFactor: 0.85,
    scopeType: 'SCOPE_2',
    isCommon: false,
    description: 'Cấp đông cá, tôm, rau củ quả ở -40°C công suất 1.5 tấn/giờ'
  },
  {
    code: 'FOOD-SPRAY-DRY',
    name: 'Tháp sấy phun sữa bột / bột gia vị cà phê hòa tan',
    sector: 'FOOD_BEVERAGE',
    stage: 'Sấy tạo bột',
    energyType: 'ELECTRICITY',
    ratedCapacity: 420,
    capacityUnit: 'kW',
    defaultLoadFactor: 0.8,
    scopeType: 'SCOPE_2',
    isCommon: false,
    description: 'Phun sương dung dịch cô đặc thành hạt bột mịn trong luồng khí nóng'
  },
  {
    code: 'FOOD-OVEN-LPG',
    name: 'Lò nướng bánh công nghiệp nhiều tầng đốt LPG',
    sector: 'FOOD_BEVERAGE',
    stage: 'Nướng chín thành phẩm',
    energyType: 'LPG',
    ratedCapacity: 180,
    capacityUnit: 'kg/h',
    defaultLoadFactor: 0.75,
    scopeType: 'SCOPE_1',
    isCommon: false,
    description: 'Lò nướng liên tục dạng hầm Tunnel Oven nướng bánh biscuit/bánh mì'
  },
  {
    code: 'FOOD-BOTTLING',
    name: 'Dây chuyền chiết rót đóng lon vô trùng tự động tốc độ cao',
    sector: 'FOOD_BEVERAGE',
    stage: 'Chiết rót và đóng gói',
    energyType: 'ELECTRICITY',
    ratedCapacity: 320,
    capacityUnit: 'kW',
    defaultLoadFactor: 0.85,
    scopeType: 'SCOPE_2',
    isCommon: false,
    description: 'Chiết rót 36000 lon/giờ trong môi trường phòng sạch vô trùng'
  },

  // 5. Cơ khí chế tạo (MECHANICAL)
  {
    code: 'MECH-HEAT-IND',
    name: 'Lò tôi cao tần nhiệt luyện kim loại (Induction Hardening)',
    sector: 'MECHANICAL',
    stage: 'Nhiệt luyện tôi cứng',
    energyType: 'ELECTRICITY',
    ratedCapacity: 500,
    capacityUnit: 'kW',
    defaultLoadFactor: 0.75,
    scopeType: 'SCOPE_2',
    isCommon: false,
    description: 'Gia nhiệt cảm ứng điện từ tần số trung cao tôi cứng bề mặt trục, bánh răng'
  },
  {
    code: 'MECH-CNC-LASER',
    name: 'Máy cắt kim loại CNC sợi quang Fiber Laser 12kW',
    sector: 'MECHANICAL',
    stage: 'Gia công cắt gọt phôi',
    energyType: 'ELECTRICITY',
    ratedCapacity: 60,
    capacityUnit: 'kW',
    defaultLoadFactor: 0.8,
    scopeType: 'SCOPE_2',
    isCommon: false,
    description: 'Cắt thép tấm dày đến 30mm bằng tia laser sợi quang hỗ trợ khí N2/O2'
  },
  {
    code: 'MECH-PAINT-LINE',
    name: 'Buồng phun sấy sơn tĩnh điện công nghiệp và sấy nhiệt',
    sector: 'MECHANICAL',
    stage: 'Sơn phủ bề mặt',
    energyType: 'ELECTRICITY',
    ratedCapacity: 220,
    capacityUnit: 'kW',
    defaultLoadFactor: 0.75,
    scopeType: 'SCOPE_2',
    isCommon: false,
    description: 'Phun sơn bột tĩnh điện và sấy đóng rắn nhiệt độ 180-200°C'
  },
  {
    code: 'MECH-PRESS-HYD',
    name: 'Máy ép dập thủy lực 500 tấn (Hydraulic Deep Drawing Press)',
    sector: 'MECHANICAL',
    stage: 'Dập định hình kim loại',
    energyType: 'ELECTRICITY',
    ratedCapacity: 110,
    capacityUnit: 'kW',
    defaultLoadFactor: 0.7,
    scopeType: 'SCOPE_2',
    isCommon: false,
    description: 'Dập vuốt sâu định hình chi tiết kim loại tấm vỏ máy'
  },
  {
    code: 'MECH-WELD-ROBOT',
    name: 'Robot hàn hồ quang công nghiệp (CO2 / Argon Welding)',
    sector: 'MECHANICAL',
    stage: 'Hàn kết cấu khung máy',
    energyType: 'ELECTRICITY',
    ratedCapacity: 45,
    capacityUnit: 'kW',
    defaultLoadFactor: 0.65,
    scopeType: 'SCOPE_2',
    isCommon: false,
    description: 'Hàn tự động kết cấu khung dầm chịu lực bảo vệ bằng khí Argon'
  },

  // 6. Nhựa & Hóa chất (PLASTICS_CHEMICALS)
  {
    code: 'PLAST-INJECT-01',
    name: 'Máy ép phun định hình hạt nhựa (Injection Molding Machine)',
    sector: 'PLASTICS_CHEMICALS',
    stage: 'Ép đúc chi tiết nhựa',
    energyType: 'ELECTRICITY',
    ratedCapacity: 160,
    capacityUnit: 'kW',
    defaultLoadFactor: 0.8,
    scopeType: 'SCOPE_2',
    isCommon: false,
    description: 'Nung chảy và bơm ép hạt nhựa PP/ABS vào khuôn lực kẹp 350 tấn'
  },
  {
    code: 'PLAST-EXTRUD-01',
    name: 'Máy đùn màng thổi PE/PP (Blown Film Extrusion)',
    sector: 'PLASTICS_CHEMICALS',
    stage: 'Đùn màng bao bì',
    energyType: 'ELECTRICITY',
    ratedCapacity: 250,
    capacityUnit: 'kW',
    defaultLoadFactor: 0.85,
    scopeType: 'SCOPE_2',
    isCommon: false,
    description: 'Đùn màng co 3 lớp sản xuất bao bì thực phẩm và màng nông nghiệp'
  },
  {
    code: 'CHEM-REACT-POLY',
    name: 'Tháp phản ứng polyme hóa có cánh khuấy nhiệt và làm lạnh',
    sector: 'PLASTICS_CHEMICALS',
    stage: 'Phản ứng tổng hợp polyme',
    energyType: 'ELECTRICITY',
    ratedCapacity: 380,
    capacityUnit: 'kW',
    defaultLoadFactor: 0.8,
    scopeType: 'SCOPE_2',
    isCommon: false,
    description: 'Phản ứng trùng hợp nhũ tương tổng hợp keo và nhựa alkyd'
  },
  {
    code: 'PLAST-COOL-TOWER',
    name: 'Cụm tháp giải nhiệt trung tâm Cooling Tower xưởng nhựa',
    sector: 'PLASTICS_CHEMICALS',
    stage: 'Làm mát khuôn đúc',
    energyType: 'ELECTRICITY',
    ratedCapacity: 75,
    capacityUnit: 'kW',
    defaultLoadFactor: 0.85,
    scopeType: 'SCOPE_2',
    isCommon: false,
    description: 'Tuần hoàn làm mát dầu thủy lực và giải nhiệt khuôn ép nhựa'
  },
  {
    code: 'CHEM-MIX-HIGH',
    name: 'Máy khuấy trộn hóa chất phân tán cao tốc (High-Speed Disperser)',
    sector: 'PLASTICS_CHEMICALS',
    stage: 'Phối trộn hóa chất',
    energyType: 'ELECTRICITY',
    ratedCapacity: 90,
    capacityUnit: 'kW',
    defaultLoadFactor: 0.75,
    scopeType: 'SCOPE_2',
    isCommon: false,
    description: 'Nghiền mịn và phân tán bột màu, phụ gia trong dung môi lỏng'
  },

  // 7. Gỗ & Nội thất (WOOD_FURNITURE)
  {
    code: 'WOOD-KILN-BIO',
    name: 'Lò sấy gỗ công nghiệp đốt mùn cưa và củi vụn (Biomass Biogenic)',
    sector: 'WOOD_FURNITURE',
    stage: 'Sấy khô nguyên liệu gỗ',
    energyType: 'BIOMASS',
    ratedCapacity: 8000,
    capacityUnit: 'kg/h',
    defaultLoadFactor: 0.85,
    scopeType: 'SCOPE_1',
    isCommon: false,
    description: 'Hầm sấy hơi nước hạ độ ẩm gỗ xuống dưới 12% đốt phế liệu gỗ sinh khối'
  },
  {
    code: 'WOOD-SAW-MULTI',
    name: 'Dây chuyền cưa xẻ phôi gỗ tự động đa lưỡi CNC',
    sector: 'WOOD_FURNITURE',
    stage: 'Xẻ phôi thô',
    energyType: 'ELECTRICITY',
    ratedCapacity: 135,
    capacityUnit: 'kW',
    defaultLoadFactor: 0.75,
    scopeType: 'SCOPE_2',
    isCommon: false,
    description: 'Cưa xẻ gỗ tròn và rong cạnh gỗ xẻ thanh quy cách tự động'
  },
  {
    code: 'WOOD-SPRAY-PU',
    name: 'Buồng phun sơn PU vách màng nước chống cháy nổ',
    sector: 'WOOD_FURNITURE',
    stage: 'Sơn phủ hoàn thiện',
    energyType: 'ELECTRICITY',
    ratedCapacity: 90,
    capacityUnit: 'kW',
    defaultLoadFactor: 0.7,
    scopeType: 'SCOPE_2',
    isCommon: false,
    description: 'Sơn lót và sơn phủ bề mặt bàn ghế gỗ dập bụi sơn qua màng nước tuần hoàn'
  },
  {
    code: 'WOOD-DUST-CYCLO',
    name: 'Hệ thống hút lọc bụi gỗ trung tâm Cyclone & túi vải lọc',
    sector: 'WOOD_FURNITURE',
    stage: 'Thu hồi bụi và PCCC',
    energyType: 'ELECTRICITY',
    ratedCapacity: 110,
    capacityUnit: 'kW',
    defaultLoadFactor: 0.9,
    scopeType: 'SCOPE_2',
    isCommon: false,
    description: 'Hút bụi mùn cưa toàn bộ nhà máy gom vào silo chứa'
  },
  {
    code: 'WOOD-CNC-ROUTER',
    name: 'Trung tâm gia công gỗ CNC 5 trục chạm khắc hoa văn',
    sector: 'WOOD_FURNITURE',
    stage: 'Gia công chi tiết',
    energyType: 'ELECTRICITY',
    ratedCapacity: 45,
    capacityUnit: 'kW',
    defaultLoadFactor: 0.7,
    scopeType: 'SCOPE_2',
    isCommon: false,
    description: 'Chạm khắc phay khoan mộng gỗ nội thất tự động'
  },

  // 8. Điện tử (ELECTRONICS)
  {
    code: 'ELEC-HVAC-CLEAN',
    name: 'Hệ thống phòng sạch Cleanroom AHU/HEPA tiêu chuẩn Class 1000',
    sector: 'ELECTRONICS',
    stage: 'Kiểm soát môi trường phòng sạch',
    energyType: 'ELECTRICITY',
    ratedCapacity: 450,
    capacityUnit: 'kW',
    defaultLoadFactor: 0.95,
    scopeType: 'SCOPE_2',
    isCommon: false,
    description: 'Điều hòa nhiệt ẩm chính xác và lọc khí qua màng siêu sạch HEPA 24/7'
  },
  {
    code: 'ELEC-SMT-LINE',
    name: 'Dây chuyền máy gắn chip bề mặt tốc độ cao SMT Pick & Place',
    sector: 'ELECTRONICS',
    stage: 'Gắn linh kiện bo mạch',
    energyType: 'ELECTRICITY',
    ratedCapacity: 85,
    capacityUnit: 'kW',
    defaultLoadFactor: 0.8,
    scopeType: 'SCOPE_2',
    isCommon: false,
    description: 'Gắn IC vi mạch và linh kiện dán SMD tốc độ 60000 linh kiện/giờ'
  },
  {
    code: 'ELEC-REFLOW-01',
    name: 'Lò hàn sóng Reflow Soldering đối lưu khí Nitơ (N2)',
    sector: 'ELECTRONICS',
    stage: 'Hàn bo mạch điện tử',
    energyType: 'ELECTRICITY',
    ratedCapacity: 65,
    capacityUnit: 'kW',
    defaultLoadFactor: 0.75,
    scopeType: 'SCOPE_2',
    isCommon: false,
    description: 'Hàn đối lưu 10 vùng nhiệt độ môi trường bảo vệ khí N2 độ tinh khiết cao'
  },
  {
    code: 'ELEC-UPW-PLANT',
    name: 'Trạm lọc và xử lý nước siêu tinh khiết UPW (RO / EDI)',
    sector: 'ELECTRONICS',
    stage: 'Rửa bản mạch vi điện tử',
    energyType: 'ELECTRICITY',
    ratedCapacity: 140,
    capacityUnit: 'kW',
    defaultLoadFactor: 0.9,
    scopeType: 'SCOPE_2',
    isCommon: false,
    description: 'Sản xuất nước siêu tinh khiết không dẫn điện rửa bo mạch bán dẫn'
  },
  {
    code: 'ELEC-AUTO-TEST',
    name: 'Cụm máy kiểm tra quang học tự động AOI và buồng thử sốc nhiệt',
    sector: 'ELECTRONICS',
    stage: 'Kiểm tra chất lượng QA',
    energyType: 'ELECTRICITY',
    ratedCapacity: 50,
    capacityUnit: 'kW',
    defaultLoadFactor: 0.7,
    scopeType: 'SCOPE_2',
    isCommon: false,
    description: 'Kiểm tra mối hàn AOI 3D và thử nghiệm độ bền sốc nhiệt -40°C đến 125°C'
  },

  // 9. Nhiệt điện / Điện lực (POWER_THERMAL)
  {
    code: 'POW-BOILER-PC',
    name: 'Nồi hơi than siêu tới hạn Pulverized Coal Boiler 600MW',
    sector: 'POWER_THERMAL',
    stage: 'Sinh hơi áp suất cao',
    energyType: 'COAL',
    ratedCapacity: 180000,
    capacityUnit: 'kg/h',
    defaultLoadFactor: 0.88,
    scopeType: 'SCOPE_1',
    isCommon: false,
    description: 'Đốt than cám mịn sinh hơi siêu tới hạn 24 MPa, 566°C'
  },
  {
    code: 'POW-TURBINE-600',
    name: 'Tổ máy tua bin hơi phát điện đồng trục 600 MW',
    sector: 'POWER_THERMAL',
    stage: 'Phát điện hòa lưới',
    energyType: 'ELECTRICITY',
    ratedCapacity: 600000,
    capacityUnit: 'kW',
    defaultLoadFactor: 0.85,
    scopeType: 'SCOPE_2',
    isCommon: false,
    description: 'Tua bin hơi 3 cấp áp suất truyền động máy phát điện 3 pha hòa lưới quốc gia'
  },
  {
    code: 'POW-FGD-SULF',
    name: 'Hệ thống khử lưu huỳnh khí thải FGD bằng đá vôi ướt',
    sector: 'POWER_THERMAL',
    stage: 'Xử lý khí thải',
    energyType: 'ELECTRICITY',
    ratedCapacity: 4500,
    capacityUnit: 'kW',
    defaultLoadFactor: 0.9,
    scopeType: 'SCOPE_2',
    isCommon: false,
    description: 'Hấp thụ khí SO2 bằng huyền phù đá vôi CaCO3 đạt quy chuẩn môi trường'
  },
  {
    code: 'POW-ESP-DUST',
    name: 'Hệ thống lọc bụi tĩnh điện ESP công suất lớn 4 trường',
    sector: 'POWER_THERMAL',
    stage: 'Lọc tro bay khí thải',
    energyType: 'ELECTRICITY',
    ratedCapacity: 2800,
    capacityUnit: 'kW',
    defaultLoadFactor: 0.95,
    scopeType: 'SCOPE_2',
    isCommon: false,
    description: 'Ion hóa và giữ lại 99.8% tro bay trước khi xả ra ống khói'
  },
  {
    code: 'POW-CW-PUMP',
    name: 'Trạm bơm nước làm mát tuần hoàn bình ngưng Condenser',
    sector: 'POWER_THERMAL',
    stage: 'Làm mát ngưng tụ',
    energyType: 'ELECTRICITY',
    ratedCapacity: 3500,
    capacityUnit: 'kW',
    defaultLoadFactor: 0.9,
    scopeType: 'SCOPE_2',
    isCommon: false,
    description: 'Bơm nước làm mát giải nhiệt bình ngưng tua bin'
  },

  // 10. Hydrogen (HYDROGEN)
  {
    code: 'HYD-ELEC-ALK',
    name: 'Hệ thống điện phân nước kiềm sản xuất Green H2 (Alkaline Electrolyzer)',
    sector: 'HYDROGEN',
    stage: 'Điện phân tách khí hydro',
    energyType: 'ELECTRICITY',
    ratedCapacity: 5000,
    capacityUnit: 'kW',
    defaultLoadFactor: 0.9,
    scopeType: 'SCOPE_2',
    isCommon: false,
    description: 'Điện phân dung dịch KOH nồng độ 30% sinh khí Green Hydrogen'
  },
  {
    code: 'HYD-COMP-700',
    name: 'Trạm máy nén khí Hydrogen màng kim loại 350-700 bar',
    sector: 'HYDROGEN',
    stage: 'Nén và lưu trữ hydro',
    energyType: 'ELECTRICITY',
    ratedCapacity: 350,
    capacityUnit: 'kW',
    defaultLoadFactor: 0.8,
    scopeType: 'SCOPE_2',
    isCommon: false,
    description: 'Nén khí hydro độ tinh khiết cao nạp téc chứa áp lực'
  },
  {
    code: 'HYD-DEOXO-DRY',
    name: 'Cụm thiết bị khử oxy DeOxo và tháp sấy khô khí Hydro',
    sector: 'HYDROGEN',
    stage: 'Làm sạch tinh khiết',
    energyType: 'ELECTRICITY',
    ratedCapacity: 80,
    capacityUnit: 'kW',
    defaultLoadFactor: 0.85,
    scopeType: 'SCOPE_2',
    isCommon: false,
    description: 'Nâng độ tinh khiết khí Hydro lên 99.999% phục vụ pin nhiên liệu'
  },

  // 11. Nông nghiệp (AGRICULTURE)
  {
    code: 'AGRI-FEED-MILL',
    name: 'Dây chuyền nghiền và ép viên thức ăn chăn nuôi gia súc',
    sector: 'AGRICULTURE',
    stage: 'Sản xuất thức ăn chăn nuôi',
    energyType: 'ELECTRICITY',
    ratedCapacity: 320,
    capacityUnit: 'kW',
    defaultLoadFactor: 0.8,
    scopeType: 'SCOPE_2',
    isCommon: false,
    description: 'Nghiền ngô, khô đậu tương và ép viên thức ăn chăn nuôi'
  },
  {
    code: 'AGRI-BARN-VENT',
    name: 'Hệ thống quạt thông gió làm mát chuồng trại chăn nuôi tập trung',
    sector: 'AGRICULTURE',
    stage: 'Thông gió và làm mát chuồng trại',
    energyType: 'ELECTRICITY',
    ratedCapacity: 150,
    capacityUnit: 'kW',
    defaultLoadFactor: 0.85,
    scopeType: 'SCOPE_2',
    isCommon: false,
    description: 'Hệ thống quạt hút composite và tấm làm mát cooling pad'
  },
  {
    code: 'AGRI-PUMP-IRR',
    name: 'Trạm bơm tưới tiêu nông nghiệp cánh đồng mẫu lớn',
    sector: 'AGRICULTURE',
    stage: 'Bơm tưới tiêu thủy lợi',
    energyType: 'ELECTRICITY',
    ratedCapacity: 90,
    capacityUnit: 'kW',
    defaultLoadFactor: 0.7,
    scopeType: 'SCOPE_2',
    isCommon: false,
    description: 'Bơm nước tưới tiêu nông nghiệp tự động'
  },
  {
    code: 'AGRI-DRYER-GRAIN',
    name: 'Máy sấy lúa / nông sản dạng tháp tuần hoàn',
    sector: 'AGRICULTURE',
    stage: 'Sấy khô nông sản sau thu hoạch',
    energyType: 'BIOMASS',
    ratedCapacity: 30000,
    capacityUnit: 'kg/mẻ',
    defaultLoadFactor: 0.8,
    scopeType: 'SCOPE_1',
    isCommon: false,
    description: 'Sấy lúa, ngô, cà phê, hạt nông sản dạng tháp tuần hoàn đốt trấu hoặc củi'
  },

  // 12. Vận tải & Logistics (LOGISTICS)
  {
    code: 'LOG-TRUCK-HEAVY',
    name: 'Đội xe đầu kéo container vận tải đường dài (Heavy Duty Truck)',
    sector: 'LOGISTICS',
    stage: 'Vận tải hàng hóa đường bộ',
    energyType: 'DIESEL',
    ratedCapacity: 38,
    capacityUnit: 'lít/100km',
    defaultLoadFactor: 0.85,
    scopeType: 'SCOPE_1',
    isCommon: false,
    description: 'Đội xe kéo rơ-moóc chở container hàng hóa liên tỉnh'
  },
  {
    code: 'LOG-COLD-STOR',
    name: 'Hệ thống kho lạnh bảo quản hàng đông lạnh Logistics (Cold Storage)',
    sector: 'LOGISTICS',
    stage: 'Lưu kho đông lạnh',
    energyType: 'ELECTRICITY',
    ratedCapacity: 500,
    capacityUnit: 'kW',
    defaultLoadFactor: 0.9,
    scopeType: 'SCOPE_2',
    isCommon: false,
    description: 'Kho đông lạnh bảo quản thực phẩm -18°C đến -25°C'
  }
];

window.getAllEquipments = function() {
  const master = Array.isArray(window.EQUIPMENT_MASTER) ? window.EQUIPMENT_MASTER : [];
  const ext = Array.isArray(window.INDUSTRY_EQUIPMENT_REGISTRY) ? window.INDUSTRY_EQUIPMENT_REGISTRY : [];
  return [...master, ...ext];
};

window.getIndustryEquipments = function(industryOrSector) {
  const all = window.getAllEquipments();
  if (!industryOrSector) return all;
  let sectorCode = '';
  if (window.INDUSTRY_SECTOR_MAP && window.INDUSTRY_SECTOR_MAP[industryOrSector]) {
    sectorCode = window.INDUSTRY_SECTOR_MAP[industryOrSector];
  } else {
    const norm = (typeof window.removeVietnameseTones === 'function')
      ? window.removeVietnameseTones(industryOrSector)
      : industryOrSector.toLowerCase();
    for (const k in (window.INDUSTRY_SECTOR_MAP || {})) {
      const kNorm = (typeof window.removeVietnameseTones === 'function')
        ? window.removeVietnameseTones(k)
        : k.toLowerCase();
      if (norm.includes(kNorm) || kNorm.includes(norm)) {
        sectorCode = window.INDUSTRY_SECTOR_MAP[k];
        break;
      }
    }
    if (!sectorCode) sectorCode = industryOrSector.toUpperCase();
  }

  const sectorEqs = all.filter(eq => eq.sector && eq.sector.toUpperCase() === sectorCode);
  const commonEqs = all.filter(eq => eq.isCommon === true);
  return [...sectorEqs, ...commonEqs];
};

window.removeVietnameseTones = function(str) {
  if (!str) return '';
  str = String(str);
  str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, "a");
  str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, "e");
  str = str.replace(/ì|í|ị|ỉ|ĩ/g, "i");
  str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, "o");
  str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, "u");
  str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, "y");
  str = str.replace(/đ/g, "d");
  str = str.replace(/À|Á|Ạ|Ả|Ã|Â|Ầ|Ấ|Ậ|Ẩ|Ẫ|Ă|Ằ|Ắ|Ặ|Ẳ|Ẵ/g, "A");
  str = str.replace(/È|É|Ẹ|Ẻ|Ẽ|Ê|Ề|Ế|Ệ|Ể|Ễ/g, "E");
  str = str.replace(/Ì|Í|Ị|Ỉ|Ĩ/g, "I");
  str = str.replace(/Ò|Ó|Ọ|Ỏ|Õ|Ô|Ồ|Ố|Ộ|Ổ|Ỗ|Ơ|Ờ|Ớ|Ợ|Ở|Ỡ/g, "O");
  str = str.replace(/Ù|Ú|Ụ|Ủ|Ũ|Ư|Ừ|Ứ|Ự|Ử|Ữ/g, "U");
  str = str.replace(/Ỳ|Ý|Ỵ|Ỷ|Ỹ/g, "Y");
  str = str.replace(/Đ/g, "D");
  return str.toLowerCase().trim();
};

window.tokenizeWords = function(str) {
  const norm = window.removeVietnameseTones(str);
  return norm.split(/[^a-z0-9]+/g).filter(w => w.length >= 2);
};

window.calcStringSimilarity = function(str1, str2) {
  const tokens1 = new Set(window.tokenizeWords(str1));
  const tokens2 = new Set(window.tokenizeWords(str2));
  if (tokens1.size === 0 || tokens2.size === 0) return 0;
  let inter = 0;
  tokens1.forEach(t => { if (tokens2.has(t)) inter++; });
  return (2 * inter) / (tokens1.size + tokens2.size);
};

window.findStandardEquipmentSmart = function(input) {
  if (!input) return { matched: null, equipment: null, score: 0, confidence: 0, matchType: 'NONE', matchReason: 'none', confidenceLabel: 'Không có dữ liệu' };

  let searchStr = '';
  let codeQuery = '';
  if (typeof input === 'string') {
    searchStr = input;
  } else if (typeof input === 'object') {
    codeQuery = (input.code || input.asset || '').toString().trim();
    searchStr = [input.name, input.type, input.brand, input.category].filter(Boolean).join(' ');
  }

  const cleanSearchStr = String(searchStr).trim();
  const normQuery = window.removeVietnameseTones(cleanSearchStr);
  const allEquipments = (typeof window.getAllEquipments === 'function') 
    ? window.getAllEquipments() 
    : (window.EQUIPMENT_MASTER || []);

  // 1. Kiểm tra khớp mã thiết bị chuẩn (Exact Code Match)
  if (codeQuery) {
    const codeMatch = allEquipments.find(eq => eq.code.toLowerCase() === codeQuery.toLowerCase());
    if (codeMatch) {
      return { matched: codeMatch, equipment: codeMatch, score: 1.0, confidence: 1.0, matchType: 'EXACT_CODE', matchReason: 'exact_code', confidenceLabel: 'Tuyệt đối (100%)' };
    }
  }

  // 2. Kiểm tra khớp tên tuyệt đối
  const exactMatch = allEquipments.find(eq => window.removeVietnameseTones(eq.name) === normQuery);
  if (exactMatch) {
    return { matched: exactMatch, equipment: exactMatch, score: 1.0, confidence: 1.0, matchType: 'EXACT_NAME', matchReason: 'exact_name', confidenceLabel: 'Tuyệt đối (100%)' };
  }

  // 3. Chấm điểm tương đồng đa chiều với toàn bộ danh mục thiết bị
  const scored = [];

  for (const eq of allEquipments) {
    let score = 0;
    let matchType = 'NONE';
    const normEqName = window.removeVietnameseTones(eq.name);
    const aliases = (window.EQUIPMENT_ALIASES && window.EQUIPMENT_ALIASES[eq.code]) || [];

    // So khớp chuỗi con
    if (normQuery.includes(normEqName) || normEqName.includes(normQuery)) {
      score = Math.max(score, 0.86);
      matchType = 'SUBSTRING';
    }

    // So khớp từ điển từ khóa mở rộng (Aliases)
    for (const alias of aliases) {
      const normAlias = window.removeVietnameseTones(alias);
      if (normQuery.includes(normAlias)) {
        const lenBonus = Math.min(0.06, (normAlias.length / 40) * 0.06);
        const aliasScore = 0.90 + lenBonus;
        if (aliasScore > score) {
          score = aliasScore;
          matchType = 'ALIAS';
        }
      } else {
        const sim = window.calcStringSimilarity(normQuery, normAlias);
        if (sim > 0.6) {
          const simScore = 0.78 + sim * 0.1;
          if (simScore > score) {
            score = simScore;
            matchType = 'ALIAS_FUZZY';
          }
        }
      }
    }

    // So khớp tương đồng âm tiết (Token similarity)
    const tokenSim = window.calcStringSimilarity(normQuery, normEqName);
    if (tokenSim > score) {
      score = tokenSim;
      matchType = 'FUZZY';
    }

    if (score > 0.4) {
      scored.push({ equipment: eq, score: Math.round(score * 100) / 100, matchType });
    }
  }

  scored.sort((a, b) => b.score - a.score);

  if (scored.length > 0 && scored[0].score >= 0.70) {
    const best = scored[0];
    return {
      matched: best.equipment,
      equipment: best.equipment,
      score: best.score,
      confidence: best.score,
      matchType: best.matchType,
      matchReason: best.matchType,
      confidenceLabel: `${Math.round(best.score * 100)}%`,
      candidateMatches: scored.slice(0, 4)
    };
  } else if (scored.length > 0) {
    return {
      matched: null,
      equipment: scored[0].equipment,
      suggested: scored[0].equipment,
      score: scored[0].score,
      confidence: scored[0].score,
      matchType: scored[0].matchType,
      matchReason: scored[0].matchType,
      confidenceLabel: `Chưa chắc chắn (${Math.round(scored[0].score * 100)}%)`,
      candidateMatches: scored.slice(0, 4)
    };
  }

  return { matched: null, equipment: null, score: 0, confidence: 0, matchType: 'NONE', matchReason: 'none', confidenceLabel: 'Không tìm thấy' };
};

window.findStandardEquipment = function(nameOrKeyword) {
  if (!nameOrKeyword) return null;
  const res = window.findStandardEquipmentSmart(nameOrKeyword);
  if (res && res.matched) return res.matched;
  // Fallback chuỗi con cũ để đảm bảo tương thích tuyệt đối
  const q = String(nameOrKeyword).toLowerCase().trim();
  const allEquipments = (typeof window.getAllEquipments === 'function') 
    ? window.getAllEquipments() 
    : (window.EQUIPMENT_MASTER || []);
  return allEquipments.find(eq => 
    eq.name.toLowerCase() === q ||
    eq.code.toLowerCase() === q ||
    q.includes(eq.name.toLowerCase()) ||
    eq.name.toLowerCase().includes(q)
  ) || null;
};

window.calcEquipmentHourlyRate = function(capacity, loadFactor) {
  const cap = parseFloat(capacity) || 0;
  const load = (parseFloat(loadFactor) || 100) / 100;
  return Math.round(cap * load * 1000) / 1000;
};

window.calcEquipmentAnnual = function(capacity, loadFactor, hoursPerDay, daysPerWeek) {
  const hourly = window.calcEquipmentHourlyRate(capacity, loadFactor);
  const h = parseFloat(hoursPerDay) || 16;
  const d = parseFloat(daysPerWeek) || 6;
  const daily = Math.round(hourly * h * 1000) / 1000;
  const annual = Math.round(daily * d * 52 * 1000) / 1000;
  return { hourly, daily, annual };
};

// Hàm cung cấp Thương hiệu / Mẫu mã thực tế, chuẩn công nghiệp thay cho mô tả dài
window.getEquipmentBrandModel = function(eq) {
  if (!eq) return 'Tiêu chuẩn kỹ thuật';
  if (eq.brandModel && typeof eq.brandModel === 'string' && eq.brandModel.trim().length > 0) {
    return eq.brandModel.trim();
  }
  const code = (eq.code || '').toUpperCase();
  const name = (eq.name || '').toLowerCase();

  const codeMap = {
    // 1. Cơ khí chế tạo (MECHANICAL)
    'MECH-HEAT-IND': 'Inductoheat IH-500 / Mỹ',
    'MECH-CNC-LASER': 'Trumpf TruLaser 5030 / Đức',
    'MECH-PAINT-LINE': 'Wagner Powder Line Sprint / Đức',
    'MECH-PRESS-HYD': 'Komatsu H1F-500 / Nhật Bản',
    'MECH-WELD-ROBOT': 'Yaskawa Motoman AR2010 / Nhật Bản',

    // 2. Dệt may (TEXTILE)
    'TEX-BOILER-ST': 'Miura LX-200 / Nhật Bản',
    'TEX-STENTER-01': 'Monforts Montex 8500 / Đức',
    'TEX-DYE-JET': 'Thies iMaster H2O / Đức',
    'TEX-WEAVE-LINE': 'Tsudakoma ZAX9200i / Nhật Bản',
    'TEX-SEW-PLANT': 'Juki DDL-9000C / Nhật Bản',
    'TEX-DRYER-TUMB': 'Tongyang Tumbler 150 / Hàn Quốc',

    // 3. Da giày (FOOTWEAR)
    'SHOE-MOLD-EVA': 'Tien Kang TK-688 EVA / Đài Loan',
    'SHOE-GLUE-DRY': 'Desma Direct Soling / Đức',
    'SHOE-SEW-HIGH': 'Brother S-7300A / Nhật Bản',
    'SHOE-CUT-AUTO': 'Atom FlashCut 888 / Ý',
    'SHOE-VULCAN-01': 'Svit Vulcanizer 200 / CH Séc',

    // 4. Thực phẩm & Đồ uống (FOOD_BEVERAGE)
    'FOOD-BOILER-UHT': 'Tetra Pak VTIS / Thụy Điển',
    'FOOD-IQF-FREEZE': 'OctoFrost 1000 / Thụy Điển',
    'FOOD-SPRAY-DRY': 'GEA Niro Spray Dryer / Đan Mạch',
    'FOOD-OVEN-LPG': 'Miwe Roll-in e+ / Đức',
    'FOOD-BOTTLING': 'Krones Modulfill / Đức',

    // 5. Giấy & Bột giấy (PAPER)
    'PAPER-BOILER-BIO': 'Andritz PowerFluid / Áo',
    'PAPER-DIGEST-01': 'Valmet Continuous Digester / Phần Lan',
    'PAPER-YANKEE-01': 'Voith Steel Yankee / Đức',
    'PAPER-MACHINE-01': 'Valmet OptiConcept M / Phần Lan',
    'PAPER-PULPER-01': 'Kadant Black Clawson / Mỹ',
    'PAPER-WWTP-AERO': 'Veolia AnoxKaldnes / Pháp',

    // 6. Hóa chất & Nhựa (CHEMICAL_PLASTIC)
    'PLAST-INJECT-01': 'Engel Victory 500 / Áo',
    'PLAST-EXTRUD-01': 'KraussMaffei ZE-60 / Đức',
    'CHEM-REACT-POLY': 'Pfaudler Glasteel 10m3 / Mỹ',
    'PLAST-COOL-TOWER': 'Spig Cooling Tower / Ý',
    'CHEM-MIX-HIGH': 'IKA Ultra-Turrax / Đức',

    // 7. Gỗ & Chế biến gỗ (WOOD)
    'WOOD-KILN-BIO': 'Mahild Dry Kiln / Đức',
    'WOOD-SAW-MULTI': 'Weinig Profimat 50 / Đức',
    'WOOD-SPRAY-PU': 'Cefla Mito Automatic / Ý',
    'WOOD-DUST-CYCLO': 'Nederman FilterBox / Thụy Điển',
    'WOOD-CNC-ROUTER': 'Biesse Rover B / Ý',

    // 8. Điện tử & Bán dẫn (ELECTRONICS)
    'ELEC-HVAC-CLEAN': 'Daikin Cleanroom AHU / Nhật Bản',
    'ELEC-SMT-LINE': 'Panasonic NPM-D3 / Nhật Bản',
    'ELEC-REFLOW-01': 'Heller 1913 MK5 / Mỹ',
    'ELEC-UPW-PLANT': 'Kurita UPW System / Nhật Bản',
    'ELEC-AUTO-TEST': 'Keysight 3070 ICT / Mỹ',

    // 9. Nhiệt điện & Năng lượng (POWER)
    'POW-BOILER-PC': 'Mitsubishi Power Supercritical / Nhật Bản',
    'POW-TURBINE-600': 'GE D10 Steam Turbine / Mỹ',
    'POW-FGD-SULF': 'Andritz FGD Wet Scrubber / Áo',
    'POW-ESP-DUST': 'FLSmidth Coromax ESP / Đan Mạch',
    'POW-CW-PUMP': 'KSB SEZ Cooling Water / Đức',

    // 10. Sản xuất Hydro (HYDROGEN)
    'HYD-ELEC-ALK': 'Thyssenkrupp Nucera 20MW / Đức',
    'HYD-COMP-700': 'Howden Diaphragm Compressor / Anh',
    'HYD-DEOXO-DRY': 'Mahler AGS DeOxo Unit / Đức',
    'HYD-COOL-CHILL': 'Carrier AquaForce 30XW / Mỹ',
    'HYD-TRAILER-FILL': 'Hexagon Purus 500bar / Na Uy',

    // 11. Nông nghiệp (AGRICULTURE)
    'AGRI-FEED-MILL': 'Buhler AHPE 900 / Thụy Sĩ',
    'AGRI-BARN-VENT': 'Munters EM50 Fan / Thụy Điển',
    'AGRI-PUMP-IRR': 'Grundfos SP 95 / Đan Mạch',
    'AGRI-DRYER-GRAIN': 'Satake Circulating Dryer / Nhật Bản',

    // 12. Vận tải & Logistics (LOGISTICS)
    'LOG-TRUCK-HEAVY': 'Volvo FH16 540 / Thụy Điển',
    'LOG-COLD-STOR': 'Bitzer Screw Compressor / Đức',

    // 13. Sắt Thép (STEEL)
    'STEEL-EAF-01': 'Danieli FastArc 100T / Ý',
    'STEEL-LRF-01': 'Primetals LRF-120T / Áo',
    'STEEL-CCM-01': 'SMS Concast 4-Strand / Đức',
    'STEEL-FURN-01': 'Tenova Walking Beam / Ý',
    'STEEL-MILL-01': 'Mitsubishi HRC-1500 / Nhật Bản',
    'STEEL-COLD-01': 'Andritz Sundwig 6-Hi / Áo',
    'STEEL-PICKL-01': 'CMI Industry CPL-Line / Bỉ',
    'STEEL-GALV-01': 'Nippon Steel CGL-300 / Nhật Bản',
    'STEEL-WIRE-01': 'Morgan High-Speed Rod Mill / Mỹ',
    'STEEL-PIPE-01': 'Kusano ERW Tube Mill 100 / Nhật Bản',
    'STEEL-BOLT-01': 'National Machinery Cold Former / Mỹ',
    'STEEL-CRANE-01': 'Konecranes Heavy Duty 150T / Phần Lan',

    // 14. Xi măng (CEMENT)
    'CEM-KILN-ROTARY': 'FLSmidth Rotary Kiln / Đan Mạch',
    'CEM-MILL-RAW': 'Loesche Vertical Roller Mill / Đức',
    'CEM-COOL-GRATE': 'Claudius Peters Cross-Bar / Đức',
    'CEM-MILL-BALL': 'Polysius Ball Mill / Đức',

    // 15. Thiết bị phụ trợ dùng chung (COMMON)
    'BOILER-ST-01': 'Miura Boiler LX-200 / Nhật Bản',
    'COMP-AIR-01': 'Atlas Copco GA 315 VSD / Thụy Điển',
    'CHILL-AC-01': 'Daikin Water Chiller 160kW / Nhật Bản',
    'FORK-ELEC-01': 'Toyota 8FBE20 (2 tấn) / Nhật Bản',
    'FORK-DIESEL-01': 'Toyota 8FD50 (5 tấn) / Nhật Bản',
    'GENSET-DIESEL-01': 'Cummins Power Command 850kVA / Mỹ',
    'FIRE-PUMP-01': 'Ebara Fire Pump 75kW / Nhật Bản',
    'TRANSFORMER-01': 'ABB SafeRing 24kV / Thụy Sĩ',
    'SERVER-RACK-01': 'Dell PowerEdge R750 / Mỹ',
    'CANTEEN-GAS-01': 'Rinnai Industrial Commercial / Nhật Bản',
    'HVAC-OFFICE-01': 'Daikin VRV IV / Nhật Bản',
    'LIGHT-LED-01': 'Philips HighBay LED / Hà Lan'
  };

  if (code && codeMap[code]) {
    return codeMap[code];
  }

  // Keyword fallback
  if (name.includes('laser') || name.includes('cnc')) return 'Trumpf TruLaser / Đức';
  if (name.includes('cao tần') || name.includes('nhiệt luyện')) return 'Inductoheat / Mỹ';
  if (name.includes('sơn') || name.includes('phun')) return 'Wagner Powder Line / Đức';
  if (name.includes('ép') || name.includes('dập')) return 'Komatsu Press / Nhật Bản';
  if (name.includes('hàn') || name.includes('robot')) return 'Yaskawa Motoman / Nhật Bản';
  if (name.includes('lò hơi') || name.includes('boiler')) return 'Miura Boiler / Nhật Bản';
  if (name.includes('nén khí') || name.includes('compressor')) return 'Atlas Copco / Thụy Điển';
  if (name.includes('chiller') || name.includes('làm lạnh')) return 'Daikin Chiller / Nhật Bản';
  if (name.includes('nâng') || name.includes('forklift')) return 'Toyota Forklift / Nhật Bản';
  if (name.includes('phát điện') || name.includes('genset')) return 'Cummins Generator / Mỹ';
  if (name.includes('may') || name.includes('khâu')) return 'Juki Industrial / Nhật Bản';
  if (name.includes('dệt') || name.includes('loom')) return 'Tsudakoma Loom / Nhật Bản';
  if (name.includes('nhuộm') || name.includes('dye')) return 'Thies iMaster / Đức';
  if (name.includes('chiết') || name.includes('đóng chai') || name.includes('đóng lon')) return 'Krones Modulfill / Đức';
  if (name.includes('hồ quang') || name.includes('eaf')) return 'Danieli FastArc / Ý';
  if (name.includes('tinh luyện') || name.includes('lrf')) return 'Primetals LRF / Áo';
  if (name.includes('đúc phôi') || name.includes('ccm')) return 'SMS Concast / Đức';
  if (name.includes('nung') || name.includes('furnace')) return 'Tenova Walking Beam / Ý';

  const shortName = (eq.name || 'Thiết bị').split('(')[0].trim();
  return `${shortName} / Chuẩn Công nghiệp`;
};
