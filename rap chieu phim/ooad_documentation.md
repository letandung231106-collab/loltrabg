# TÀI LIỆU PHÂN TÍCH VÀ THIẾT KẾ HƯỚNG ĐỐI TƯỢNG (OOAD)
## ĐỒ ÁN: HỆ THỐNG QUẢN LÝ VẬN HÀNH VÀ ĐẶT VÉ RẠP PHIM

---

## MỤC LỤC
1. [Tổng quan hệ thống & Actors](#1-tổng-quan-hệ-thống--actors)
2. [Use Case Diagram](#2-use-case-diagram)
3. [Activity Diagrams](#3-activity-diagrams)
   - 3.1. Đặt vé xem phim
   - 3.2. Chọn và Giữ ghế tạm thời (10 phút)
   - 3.3. Thanh toán đơn hàng & Xuất vé
   - 3.4. Báo cáo sự cố rạp chiếu
   - 3.5. Xử lý & Khắc phục sự cố kỹ thuật
   - 3.6. Lập kế hoạch & Thực hiện bảo trì thiết bị
   - 3.7. Kiểm tra phòng chiếu (Daily Checklist)
   - 3.8. Lập lịch chiếu phim (Kiểm tra xung đột)
4. [Sequence Diagrams](#4-sequence-diagrams)
   - 4.1. Đăng nhập & Xác thực JWT
   - 4.2. Đặt vé & Giữ ghế đồng thời (Chống trùng ghế)
   - 4.3. Giải phóng ghế tự động sau 10 phút (Hold Timeout)
   - 4.4. Thanh toán & Khởi tạo vé điện tử
   - 4.5. Nhân viên báo cáo sự cố phòng chiếu
   - 4.6. Quản lý phân công sự cố cho Kỹ thuật viên
   - 4.7. Kỹ thuật viên xử lý sự cố và ghi nhận chi phí
   - 4.8. Kế hoạch bảo trì thiết bị định kỳ
   - 4.9. Lập lịch chiếu với kiểm tra ràng buộc phòng & thiết bị
5. [Class Diagram](#5-class-diagram)
6. [Business Rules (Quy tắc nghiệp vụ cốt lõi)](#6-business-rules)
7. [Định hướng mở rộng & Phát triển tương lai (Future Roadmap)](#7-định-hướng-mở-rộng--phát-triển-tương-lai)

---

## 1. TỔNG QUAN HỆ THỐNG & ACTORS

Hệ thống có 5 Actor chính:
- **Khách hàng (Customer):** Đăng ký/đăng nhập, duyệt danh mục phim, tra cứu lịch chiếu, chọn ghế theo thời gian thực, giữ ghế 10 phút, thanh toán trực tuyến, quản lý vé và yêu cầu hủy vé/gửi phản hồi.
- **Quản trị viên (Admin):** Toàn quyền quản trị hệ thống (Người dùng, Phân quyền Role, Phim, Phòng, Thiết bị, Lịch chiếu, Báo cáo tài chính, Cấu hình).
- **Quản lý rạp (Manager):** Quản lý lịch chiếu, theo dõi tình trạng phòng chiếu/thiết bị, tiếp nhận sự cố, phân công nhân viên & kỹ thuật viên, theo dõi bảo trì, duyệt doanh thu và báo cáo.
- **Nhân viên vận hành (Staff):** Xem ca làm việc, thực hiện checklist kiểm tra 9 hạng mục phòng chiếu, phát hiện & tạo báo cáo sự cố, soát vé và hỗ trợ khách hàng.
- **Kỹ thuật viên (Technician):** Tiếp nhận sự cố & kế hoạch bảo trì được phân công, khảo sát nguyên nhân, cập nhật phương án sửa chữa, chi phí, linh kiện thay thế và nghiệm thu thiết bị.

---

## 2. USE CASE DIAGRAM

```mermaid
flowchart TB
    %% Actors
    subgraph Actors [TÁC NHÂN HỆ THỐNG]
        Customer["👤 Khách Hàng (Customer)"]
        Staff["👔 Nhân Viên (Staff)"]
        Tech["🔧 Kỹ Thuật Viên (Technician)"]
        Manager["💼 Quản Lý Rạp (Manager)"]
        Admin["👑 Quản Trị Viên (Admin)"]
    end

    %% Use Cases
    subgraph CinemaSystem ["HỆ THỐNG QUẢN LÝ VẬN HÀNH & ĐẶT VÉ RẠP PHIM"]
        %% Module Auth
        UC_Auth([Đăng nhập / Đăng ký / Xác thực JWT])
        
        %% Module Khách hàng
        UC_ViewMovies([Xem thông tin phim & Lịch chiếu])
        UC_HoldSeat([Chọn & Giữ ghế 10 phút])
        UC_Pay([Thanh toán đơn hàng])
        UC_MyTickets([Xem & Quản lý vé của tôi])
        UC_Feedback([Gửi phản hồi & Hỗ trợ])
        
        %% Module Vận hành & Kỹ thuật
        UC_Checklist([Kiểm tra phòng chiếu 9 tiêu chí])
        UC_ReportIncident([Báo cáo sự cố phòng/thiết bị])
        UC_AssignTask([Phân công sự cố & Bảo trì])
        UC_ResolveIncident([Tiếp nhận & Xử lý sự cố])
        UC_Maintenance([Thực hiện bảo trì thiết bị])
        
        %% Module Quản lý rạp
        UC_ManageSchedule([Lập lịch chiếu & Check xung đột])
        UC_ManageRoom([Quản lý phòng chiếu & Ghế])
        UC_ManageEquip([Quản lý thiết bị rạp])
        UC_ManageShift([Quản lý ca làm việc & Nhân sự])
        UC_Dashboard([Xem Dashboard & Thống kê doanh thu])
        
        %% Module Admin
        UC_ManageUser([Quản lý tài khoản & Phân quyền])
        UC_SystemConfig([Cấu hình hệ thống])
    end

    %% Connections
    Customer --> UC_Auth
    Customer --> UC_ViewMovies
    Customer --> UC_HoldSeat
    Customer --> UC_Pay
    Customer --> UC_MyTickets
    Customer --> UC_Feedback

    Staff --> UC_Auth
    Staff --> UC_Checklist
    Staff --> UC_ReportIncident
    Staff --> UC_MyTickets

    Tech --> UC_Auth
    Tech --> UC_ResolveIncident
    Tech --> UC_Maintenance

    Manager --> UC_Auth
    Manager --> UC_ManageSchedule
    Manager --> UC_ManageRoom
    Manager --> UC_ManageEquip
    Manager --> UC_AssignTask
    Manager --> UC_ManageShift
    Manager --> UC_Dashboard

    Admin --> UC_Auth
    Admin --> UC_ManageUser
    Admin --> UC_SystemConfig
    Admin --> UC_Dashboard
    Admin --> UC_ManageRoom
    Admin --> UC_ManageSchedule
```

---

## 3. ACTIVITY DIAGRAMS

### 3.1. Đặt vé xem phim
```mermaid
stateDiagram-v2
    [*] --> ChonPhim: Khách duyệt phim
    ChonPhim --> ChonNgayVaSuat: Chọn ngày & Suất chiếu
    ChonNgayVaSuat --> TaiSoDoGhe: Tải sơ đồ ghế & giá vé
    TaiSoDoGhe --> ChonGhe: Chọn ghế mong muốn
    ChonGhe --> KiemTraTrangThai: Gửi yêu cầu giữ ghế
    
    state KiemTraTrangThai <<choice>>
    KiemTraTrangThai --> ThongBaoDaGiu: Ghế đang bị giữ / đã đặt
    ThongBaoDaGiu --> TaiSoDoGhe: Chọn lại ghế khác
    
    KiemTraTrangThai --> KhoaGhe10Phut: Ghế còn trống (MySQL Row Lock)
    KhoaGhe10Phut --> DemNguoc10Phut: Bắt đầu đếm ngược 10:00
    DemNguoc10Phut --> ChonPhuongThucTT: Xác nhận đơn hàng & Chọn thanh toán
    
    state KiemTraThanhToan <<choice>>
    ChonPhuongThucTT --> KiemTraThanhToan: Tiến hành thanh toán
    KiemTraThanhToan --> XuatVe: Thanh toán thành công (Trước 10p)
    KiemTraThanhToan --> GiaiPhongGhe: Thanh toán thất bại / Hủy bỏ / Hết 10p
    
    GiaiPhongGhe --> TaiSoDoGhe: Ghế mở lại cho người khác
    XuatVe --> [*]: Nhận mã vé & Mã QR Code
```

### 3.2. Chọn và Giữ ghế tạm thời (10 phút)
```mermaid
stateDiagram-v2
    [*] --> RequestHold: Client gửi danh sách seat_ids & screening_id
    RequestHold --> StartTransaction: Backend mở MySQL Transaction
    StartTransaction --> LockRows: SELECT * FROM booking_seats FOR UPDATE
    
    state CheckAvailability <<choice>>
    LockRows --> CheckAvailability: Ghế có đang được giữ hoặc đã bán?
    CheckAvailability --> ConflictError: Có ghế đang active
    CheckAvailability --> CreateBooking: Tất cả ghế hợp lệ
    
    ConflictError --> Rollback: ROLLBACK
    Rollback --> [*]: Trả về 409 Conflict: Ghế này vừa được người khác giữ
    
    CreateBooking --> InsertHoldSeats: Tạo Booking (pending) & BookingSeats (holding, expire = NOW() + 10m)
    InsertHoldSeats --> Commit: COMMIT
    Commit --> StartTimer: Client bật đồng hồ đếm ngược 10:00
    StartTimer --> [*]: Hiển thị trạng thái ghế Đang Giữ (🔵)
```

### 3.3. Thanh toán đơn hàng & Xuất vé
```mermaid
stateDiagram-v2
    [*] --> SubmitPayment: Khách gửi thông tin thanh toán (VNPAY/Momo/Banking)
    SubmitPayment --> CheckExpiry: Backend kiểm tra thời hạn giữ ghế
    
    state CheckHoldValid <<choice>>
    CheckHoldValid --> ExpiredError: Đã quá 10 phút (hold_expire < NOW())
    CheckHoldValid --> ProcessPayment: Đơn còn hiệu lực
    
    ExpiredError --> ReleaseSeats: Hủy đơn & Mở lại ghế
    ReleaseSeats --> [*]: Báo lỗi hết hạn giữ ghế
    
    ProcessPayment --> VerifyGateway: Gọi Payment Simulator / Gateway
    state GatewayResult <<choice>>
    VerifyGateway --> GatewayResult: Kết quả thanh toán
    GatewayResult --> PaymentFailed: Thất bại
    GatewayResult --> PaymentSuccess: Thành công
    
    PaymentFailed --> UpdatePaymentStatus: Ghi nhận payments (status=failed)
    UpdatePaymentStatus --> [*]: Báo lỗi thanh toán
    
    PaymentSuccess --> UpdateBookingAndSeats: Booking -> paid, BookingSeats -> booked
    UpdateBookingAndSeats --> GenerateTickets: Sinh mã vé TCK-xxx & QR Code
    GenerateTickets --> SendNotification: Gửi thông báo đến tài khoản khách
    SendNotification --> [*]: Khách xem vé trong "Vé Của Tôi"
```

### 3.4. Báo cáo sự cố rạp chiếu (Incident Reporting)
```mermaid
stateDiagram-v2
    [*] --> PhatHienSuCo: Nhân viên (Staff) kiểm tra phòng hoặc khách phản ánh
    PhatHienSuCo --> NhapThongTin: Điền tiêu đề, mô tả, phòng, thiết bị, mức độ (Low/Medium/High/Critical)
    NhapThongTin --> GuiBaoCao: Submit form báo cáo
    GuiBaoCao --> LuuIncident: Backend lưu vào bảng incidents (status=new)
    LuuIncident --> BanThongBao: Tạo notification gửi đến Manager
    BanThongBao --> [*]: Hiển thị sự cố mới trên Dashboard Manager
```

### 3.5. Xử lý & Khắc phục sự cố kỹ thuật
```mermaid
stateDiagram-v2
    [*] --> ManagerTiepNhan: Manager xem danh sách sự cố mới
    ManagerTiepNhan --> PhanCongTech: Chọn Kỹ thuật viên & Tạo Assignment
    PhanCongTech --> TechNhanThongBao: Technician nhận thông báo & Xem chi tiết
    TechNhanThongBao --> TechKhaoSat: Tiếp nhận (status=accepted) & Khảo sát thiết bị
    TechKhaoSat --> TienHanhSuaChua: Sửa chữa (status=in_progress)
    TienHanhSuaChua --> CapNhatLichSu: Cập nhật nguyên nhân, linh kiện thay thế, chi phí
    CapNhatLichSu --> BaoHoanThanh: Báo cáo đã xử lý (status=resolved)
    BaoHoanThanh --> ManagerKiemTra: Manager nghiệm thu kết quả
    
    state VerifyFix <<choice>>
    ManagerKiemTra --> VerifyFix: Đạt tiêu chuẩn an toàn?
    VerifyFix --> DongSuCo: Đạt -> Đóng sự cố (status=closed) & Chuyển phòng về active
    VerifyFix --> YeuCauSuaLai: Chưa đạt -> Yêu cầu kiểm tra lại
    
    YeuCauSuaLai --> TienHanhSuaChua
    DongSuCo --> [*]
```

### 3.6. Lập kế hoạch & Thực hiện bảo trì thiết bị
```mermaid
stateDiagram-v2
    [*] --> LapKeHoach: Manager/Admin tạo phiếu bảo trì (Định kỳ/Đột xuất/Sửa chữa)
    LapKeHoach --> ChonThietBiVaNgay: Gán thiết bị, ngày dự kiến, kỹ thuật viên
    ChonThietBiVaNgay --> LuuMaintenances: Lưu vào CSDL (status=planned)
    LuuMaintenances --> DenNgayBaoTri: Đến hạn bảo dưỡng
    DenNgayBaoTri --> TechThucHien: Kỹ thuật viên tiến hành bảo trì (status=in_progress)
    TechThucHien --> GhiNhanKetQua: Ghi kết quả (success/partially/failed), chi phí, ghi chú
    GhiNhanKetQua --> CapNhatThietBi: Cập nhật ngày last_maintenance & next_maintenance
    CapNhatThietBi --> HoanTat: Maintenances (status=completed)
    HoanTat --> [*]
```

### 3.7. Kiểm tra phòng chiếu (Daily Checklist)
```mermaid
stateDiagram-v2
    [*] --> NhanCa: Nhân viên trực ca bắt đầu kiểm tra phòng
    NhanCa --> MoChecklist: Mở form kiểm tra 9 tiêu chí
    MoChecklist --> DanhGiaTungMuc: Đánh giá Máy chiếu, Âm thanh, Điều hòa, Đèn, Ghế, Màn hình, Thoát hiểm, Vệ sinh, PCCC
    
    state CheckAllPassed <<choice>>
    DanhGiaTungMuc --> CheckAllPassed: Có hạng mục nào Fail?
    CheckAllPassed --> LuuPass: Tất cả Đạt (pass)
    CheckAllPassed --> AutoTriggerIncident: Có hạng mục Không đạt (fail)
    
    AutoTriggerIncident --> TaoIncidentTuDong: Tự động khởi tạo Sự cố (Incident) gửi Manager
    TaoIncidentTuDong --> LuuFail: Lưu phiếu kiểm tra (status=fail / action_required)
    LuuPass --> [*]: Phòng sẵn sàng phục vụ suất chiếu
    LuuFail --> [*]: Cảnh báo phòng cần khắc phục
```

### 3.8. Lập lịch chiếu phim (Kiểm tra xung đột)
```mermaid
stateDiagram-v2
    [*] --> ChonPhimVaPhong: Manager chọn Phim, Phòng chiếu, Ngày giờ bắt đầu
    ChonPhimVaPhong --> TinhGioKetThuc: Tự động tính end_time = start_time + duration + 15p dọn phòng
    TinhGioKetThuc --> KiemTraRangBuoc: Backend kiểm tra Business Rules
    
    state CheckRules <<choice>>
    KiemTraRangBuoc --> CheckRules: Kiểm tra: Phòng active? Thiết bị hoạt động? Trùng lịch?
    CheckRules --> BaoLoiXungDot: Phòng đang bảo trì/sự cố hoặc trùng giờ chiếu khác
    CheckRules --> HopLe: Tất cả điều kiện hợp lệ
    
    BaoLoiXungDot --> [*]: Báo lỗi & Yêu cầu chọn khung giờ/phòng khác
    HopLe --> LuuLichChieu: Lưu vào screening_schedules (status=scheduled)
    LuuLichChieu --> [*]: Lịch chiếu xuất hiện trên trang đặt vé
```

---

## 4. SEQUENCE DIAGRAMS

### 4.1. Đăng nhập & Xác thực JWT
```mermaid
sequenceDiagram
    autonumber
    actor User as Người dùng (5 Actors)
    participant Client as React Client (AuthContext)
    participant API as Auth Controller (/api/auth/login)
    participant DB as MySQL Database

    User->>Client: Nhập username & password
    Client->>API: POST /api/auth/login { username, password }
    API->>DB: SELECT * FROM users JOIN roles ON users.role_id = roles.id WHERE username = ?
    DB-->>API: Trả về user info (password_hash, role)
    API->>API: So sánh bcrypt.compare(password, password_hash)
    alt Mật khẩu chính xác
        API->>API: Tạo JWT Token (userId, role, permissions, exp)
        API-->>Client: 200 OK { token, user: { id, name, role } }
        Client->>Client: Lưu token vào localStorage & cập nhật UI theo Role
        Client-->>User: Điều hướng tới Dashboard / Trang chủ phù hợp
    else Mật khẩu sai / Tài khoản bị khóa
        API-->>Client: 401 Unauthorized { message: 'Sai thông tin đăng nhập' }
        Client-->>User: Hiển thị thông báo lỗi
    end
```

### 4.2. Đặt vé & Giữ ghế đồng thời (Chống trùng ghế Concurrency)
```mermaid
sequenceDiagram
    autonumber
    actor CustA as Khách Hàng A
    actor CustB as Khách Hàng B
    participant ClientA as React UI A
    participant ClientB as React UI B
    participant API as Booking API (/api/bookings/hold)
    participant DB as MySQL Database (InnoDB)

    CustA->>ClientA: Chọn ghế C5 suất 19:00
    CustB->>ClientB: Chọn ghế C5 suất 19:00 (chậm hơn 0.1s)
    
    par Request Khách A
        ClientA->>API: POST /api/bookings/hold { screeningId, seatIds: [C5] }
        API->>DB: START TRANSACTION;
        API->>DB: SELECT * FROM booking_seats WHERE seat_id = C5 AND status IN ('holding', 'booked') FOR UPDATE;
        DB-->>API: Không có bản ghi active
        API->>DB: INSERT INTO bookings (customer_id, screening_id, status='pending');
        API->>DB: INSERT INTO booking_seats (booking_id, seat_id=C5, status='holding', hold_expire=NOW() + INTERVAL 10 MINUTE);
        API->>DB: COMMIT;
        API-->>ClientA: 200 OK { bookingId, holdExpiresAt, seats: [C5] }
        ClientA->>ClientA: Bắt đầu đếm ngược 10:00 (🔵 Đang giữ)
    and Request Khách B
        ClientB->>API: POST /api/bookings/hold { screeningId, seatIds: [C5] }
        API->>DB: START TRANSACTION;
        API->>DB: SELECT * FROM booking_seats WHERE seat_id = C5 AND status IN ('holding', 'booked') FOR UPDATE;
        DB-->>API: Tìm thấy bản ghi C5 status='holding' (expire > NOW())
        API->>DB: ROLLBACK;
        API-->>ClientB: 409 Conflict { message: 'Ghế C5 vừa được người khác giữ.' }
        ClientB-->>CustB: Hiển thị cảnh báo "Ghế C5 đang được người khác giữ"
    end
```

### 4.3. Giải phóng ghế tự động sau 10 phút (Hold Timeout)
```mermaid
sequenceDiagram
    autonumber
    participant Timer as Background Cleanup Service (Cron/Interval)
    participant API as Booking Service
    participant DB as MySQL Database
    participant Client as React Client (Polling/Sync)

    Timer->>API: Kích hoạt quét mỗi 30 giây
    API->>DB: START TRANSACTION;
    API->>DB: SELECT booking_id, seat_id FROM booking_seats WHERE status = 'holding' AND hold_expire < NOW() FOR UPDATE;
    DB-->>API: Danh sách ghế hết hạn (ví dụ: booking #123, seat C5)
    API->>DB: UPDATE booking_seats SET status = 'released' WHERE booking_id = 123;
    API->>DB: UPDATE bookings SET status = 'expired' WHERE id = 123;
    API->>DB: COMMIT;
    API-->>Timer: Đã giải phóng 1 ghế hết hạn
    Client->>API: GET /api/schedules/:id/seats (Khách khác tải lại sơ đồ)
    API->>DB: Lấy trạng thái ghế thời gian thực
    DB-->>API: Ghế C5 hiện tại là Trống (status=released)
    API-->>Client: 200 OK { seat C5: 'available' (🟢) }
    Client->>Client: Ghế C5 chuyển màu xanh có thể đặt lại
```

### 4.4. Thanh toán & Khởi tạo vé điện tử
```mermaid
sequenceDiagram
    autonumber
    actor Cust as Khách Hàng
    participant Client as React Checkout UI
    participant PayAPI as Payment API (/api/payments/process)
    participant BookAPI as Booking Service
    participant DB as MySQL Database

    Cust->>Client: Nhấn "Thanh Toán Đơn Hàng"
    Client->>PayAPI: POST /api/payments/process { bookingId, paymentMethod: 'vnpay', amount }
    PayAPI->>DB: START TRANSACTION;
    PayAPI->>DB: SELECT * FROM bookings WHERE id = ? AND status = 'pending' FOR UPDATE;
    DB-->>PayAPI: Booking thông tin hợp lệ
    PayAPI->>PayAPI: Kiểm tra cổng thanh toán mô phỏng -> Thành công
    PayAPI->>DB: INSERT INTO payments (booking_id, payment_method, amount, transaction_code, status='success');
    PayAPI->>DB: UPDATE bookings SET status = 'paid' WHERE id = ?;
    PayAPI->>DB: UPDATE booking_seats SET status = 'booked' WHERE booking_id = ?;
    loop Mỗi ghế trong đơn đặt
        PayAPI->>PayAPI: Sinh mã vé TCK-YYYYMMDD-ID và QR Code hash
        PayAPI->>DB: INSERT INTO tickets (booking_id, customer_id, screening_id, seat_id, ticket_code, qr_code, status='active');
    end
    PayAPI->>DB: INSERT INTO notifications (user_id, title='Đặt vé thành công', message=...);
    PayAPI->>DB: COMMIT;
    PayAPI-->>Client: 200 OK { success: true, bookingCode, tickets: [...] }
    Client-->>Cust: Hiển thị Màn hình Vé Điện Tử kèm QR Code
```

### 4.5. Nhân viên báo cáo sự cố phòng chiếu
```mermaid
sequenceDiagram
    autonumber
    actor Staff as Nhân Viên (Staff)
    participant Client as Staff App UI
    participant IncAPI as Incident API (/api/incidents)
    participant DB as MySQL Database

    Staff->>Client: Nhập form báo cáo (Phòng 8, Máy lạnh, Mức độ: High, Mô tả)
    Client->>IncAPI: POST /api/incidents { roomId: 8, equipmentId: 25, title, severity: 'high', description }
    IncAPI->>DB: INSERT INTO incidents (code, reporter_id, room_id, equipment_id, title, severity, status='new');
    IncAPI->>DB: UPDATE cinema_rooms SET status = 'incident' WHERE id = 8;
    IncAPI->>DB: INSERT INTO notifications (role='manager', title='Sự cố mới tại Phòng 8', ...);
    DB-->>IncAPI: Incident ID = 1 tạo thành công
    IncAPI-->>Client: 201 Created { incidentId, code: 'INC-20260914-001' }
    Client-->>Staff: Hiển thị "Báo cáo sự cố thành công"
```

### 4.6. Quản lý phân công sự cố cho Kỹ thuật viên
```mermaid
sequenceDiagram
    autonumber
    actor Manager as Quản Lý Rạp
    participant Client as Manager Dashboard
    participant API as Assignment API (/api/assignments)
    participant DB as MySQL Database

    Manager->>Client: Xem chi tiết sự cố INC-20260914-001
    Manager->>Client: Chọn Kỹ thuật viên (Võ Minh Quân) & Nhấn "Phân Công"
    Client->>API: POST /api/incidents/:id/assign { technicianId: 6 }
    API->>DB: INSERT INTO assignments (employee_id=6, incident_id=1, status='assigned');
    API->>DB: UPDATE incidents SET status = 'accepted' WHERE id = 1;
    API->>DB: INSERT INTO incident_histories (incident_id=1, employee_id=2, action='Phân công kỹ thuật viên', description='Gán cho KTV Võ Minh Quân');
    API->>DB: INSERT INTO notifications (user_id=6, title='Phân công sự cố mới', ...);
    DB-->>API: Ghi nhận thành công
    API-->>Client: 200 OK { message: 'Đã phân công thành công' }
    Client-->>Manager: Cập nhật trạng thái sang "Đã Tiếp Nhận"
```

### 4.7. Kỹ thuật viên xử lý sự cố và ghi nhận chi phí
```mermaid
sequenceDiagram
    autonumber
    actor Tech as Kỹ Thuật Viên
    participant Client as Tech Portal UI
    participant API as Incident API (/api/incidents/:id/resolve)
    participant DB as MySQL Database

    Tech->>Client: Tiếp nhận nhiệm vụ & Kiểm tra thiết bị thực tế
    Tech->>Client: Điền form xử lý: Nguyên nhân, Cách khắc phục, Linh kiện thay thế, Chi phí
    Client->>API: POST /api/incidents/:id/resolve { action, spareParts, cost: 350000, description }
    API->>DB: INSERT INTO incident_histories (incident_id=1, employee_id=6, action='Sửa chữa hoàn tất', description=..., spare_parts='Tụ ngậm 50uF', cost=350000);
    API->>DB: UPDATE incidents SET status = 'resolved' WHERE id = 1;
    API->>DB: UPDATE equipment SET status = 'good' WHERE id = 25;
    API->>DB: INSERT INTO notifications (role='manager', title='Sự cố đã được khắc phục', ...);
    DB-->>API: Ghi nhận thành công
    API-->>Client: 200 OK { message: 'Cập nhật xử lý thành công' }
    Client-->>Tech: Trạng thái chuyển sang "Đã Xử Lý"
```

### 4.8. Kế hoạch bảo trì thiết bị định kỳ
```mermaid
sequenceDiagram
    autonumber
    actor Manager as Quản Lý / Kỹ Thuật Trưởng
    participant Client as Maintenance Manager UI
    participant API as Maintenance API (/api/maintenances)
    participant DB as MySQL Database

    Manager->>Client: Tạo phiếu bảo trì định kỳ (Máy chiếu IMAX Laser P4, Ngày 20/09)
    Client->>API: POST /api/maintenances { equipmentId: 16, type: 'periodic', scheduledDate: '2026-09-20', description }
    API->>DB: INSERT INTO maintenances (code, equipment_id, type, scheduled_date, status='planned');
    DB-->>API: Tạo thành công
    API-->>Client: 201 Created { maintenanceId, code: 'MAINT-202609-002' }
    Client-->>Manager: Phiếu bảo trì hiển thị trên Lịch Vận Hành
```

### 4.9. Lập lịch chiếu với kiểm tra ràng buộc phòng & thiết bị
```mermaid
sequenceDiagram
    autonumber
    actor Manager as Quản Lý Lập Lịch
    participant Client as Schedule Builder UI
    participant API as Schedule API (/api/schedules)
    participant DB as MySQL Database

    Manager->>Client: Chọn Phim (Dune 2), Phòng (P4), Bắt đầu (18:00)
    Client->>API: POST /api/schedules { movieId: 1, roomId: 4, startTime: '2026-09-14 18:00:00', ticketPrice: 160000 }
    API->>DB: SELECT status FROM cinema_rooms WHERE id = 4;
    DB-->>API: status = 'active'
    API->>DB: SELECT COUNT(*) FROM equipment WHERE room_id = 4 AND status IN ('broken', 'repairing');
    DB-->>API: 0 thiết bị hỏng
    API->>DB: SELECT * FROM screening_schedules WHERE room_id = 4 AND (start_time < ? AND end_time > ?);
    DB-->>API: Không có suất trùng giờ
    API->>DB: INSERT INTO screening_schedules (movie_id, room_id, start_time, end_time, ticket_price, status='scheduled');
    DB-->>API: Schedule ID = 2 tạo thành công
    API-->>Client: 201 Created { scheduleId, startTime, endTime }
    Client-->>Manager: Hiển thị Suất chiếu trên Timeline rạp
```

---

## 5. CLASS DIAGRAM

```mermaid
classDiagram
    %% Core Users & Roles
    class User {
        +int id
        +string username
        +string password
        +int roleId
        +string status
        +DateTime createdAt
        +login(password) bool
        +changePassword(newPass) void
    }

    class Role {
        +int id
        +string name
        +string description
        +hasPermission(perm) bool
    }

    class Customer {
        +int id
        +int userId
        +string name
        +string email
        +string phone
        +string membershipLevel
        +DateTime createdAt
        +getBookingHistory() List~Booking~
    }

    class Employee {
        +int id
        +int userId
        +string name
        +string phone
        +string email
        +string position
        +string department
        +string status
        +getAssignedTasks() List~Assignment~
    }

    %% Movies & Cinema Infrastructure
    class Movie {
        +int id
        +string name
        +string genre
        +string director
        +string actors
        +int duration
        +Date releaseDate
        +Date endDate
        +string ageRating
        +string language
        +string format
        +string description
        +string poster
        +string trailer
        +string status
        +getSchedules(date) List~ScreeningSchedule~
    }

    class CinemaRoom {
        +int id
        +string name
        +string roomType
        +int capacity
        +string location
        +string status
        +string description
        +isAvailableForSchedule(startTime, endTime) bool
        +getSeats() List~Seat~
    }

    class Seat {
        +int id
        +int roomId
        +string rowNumber
        +int seatNumber
        +string seatType
        +string status
        +getSeatLabel() string
    }

    class ScreeningSchedule {
        +int id
        +int movieId
        +int roomId
        +DateTime startTime
        +DateTime endTime
        +string format
        +decimal ticketPrice
        +string status
        +getSeatStatusMap() Map
        +checkConflict() bool
    }

    %% Booking & Payment
    class Booking {
        +int id
        +int customerId
        +int screeningId
        +string bookingCode
        +DateTime bookingTime
        +decimal totalAmount
        +string status
        +calculateTotal() decimal
        +confirmPayment() bool
        +cancel() void
    }

    class BookingSeat {
        +int id
        +int bookingId
        +int seatId
        +decimal price
        +string status
        +DateTime holdStart
        +DateTime holdExpire
        +isExpired() bool
        +release() void
    }

    class Payment {
        +int id
        +int bookingId
        +string paymentMethod
        +decimal amount
        +string transactionCode
        +DateTime paymentTime
        +string status
        +process() bool
        +refund() bool
    }

    class Ticket {
        +int id
        +int bookingId
        +int customerId
        +int screeningId
        +int seatId
        +string ticketCode
        +string qrCode
        +string status
        +verify() bool
        +cancel() bool
    }

    %% Equipment & Operations
    class EquipmentType {
        +int id
        +string name
        +string description
    }

    class Equipment {
        +int id
        +int equipmentTypeId
        +int roomId
        +string name
        +string code
        +string manufacturer
        +Date purchaseDate
        +Date warrantyEnd
        +Date lastMaintenance
        +Date nextMaintenance
        +string status
        +checkHealth() string
    }

    class Incident {
        +int id
        +string code
        +int reporterId
        +int roomId
        +int equipmentId
        +string title
        +string description
        +string severity
        +string status
        +DateTime createdAt
        +assign(technicianId) void
        +resolve(solution, cost) void
        +close() void
    }

    class IncidentHistory {
        +int id
        +int incidentId
        +int employeeId
        +string action
        +string description
        +string spareParts
        +decimal cost
        +DateTime createdAt
    }

    class Maintenance {
        +int id
        +string code
        +int equipmentId
        +int employeeId
        +string type
        +string description
        +Date scheduledDate
        +Date completedDate
        +string result
        +decimal cost
        +string note
        +string status
        +complete(result, cost) void
    }

    class WorkShift {
        +int id
        +int employeeId
        +Date workDate
        +string shiftName
        +Time startTime
        +Time endTime
        +string position
        +int roomId
        +string status
        +checkIn() void
    }

    class Assignment {
        +int id
        +int employeeId
        +int incidentId
        +int maintenanceId
        +DateTime assignedAt
        +string status
        +accept() void
    }

    class RoomInspection {
        +int id
        +int roomId
        +int employeeId
        +DateTime inspectionDate
        +string status
        +string note
        +submitChecklist(details) void
    }

    class InspectionDetail {
        +int id
        +int inspectionId
        +string itemName
        +string status
        +string note
    }

    class Notification {
        +int id
        +int userId
        +string title
        +string message
        +string type
        +bool isRead
        +DateTime createdAt
        +markAsRead() void
    }

    %% Relationships
    User "1" <-- "1" Role : has role
    User "1" <-- "0..1" Customer : profile
    User "1" <-- "0..1" Employee : profile
    User "1" --> "*" Notification : receives

    CinemaRoom "1" *-- "*" Seat : contains
    CinemaRoom "1" --> "*" ScreeningSchedule : hosts
    CinemaRoom "1" o-- "*" Equipment : contains

    Movie "1" --> "*" ScreeningSchedule : scheduled in
    ScreeningSchedule "1" --> "*" Booking : creates
    Customer "1" --> "*" Booking : places

    Booking "1" *-- "1..*" BookingSeat : reserves
    Seat "1" <-- "1" BookingSeat : refers to
    Booking "1" -- "1" Payment : paid by
    Booking "1" *-- "1..*" Ticket : produces

    EquipmentType "1" <-- "*" Equipment : categorizes
    Equipment "1" --> "*" Incident : suffers from
    Equipment "1" --> "*" Maintenance : undergoes

    Incident "1" *-- "*" IncidentHistory : tracks
    Employee "1" --> "*" Incident : reported by
    Employee "1" --> "*" Assignment : assigned to
    Incident "1" o-- "*" Assignment : includes
    Maintenance "1" o-- "*" Assignment : includes

    Employee "1" --> "*" WorkShift : works in
    CinemaRoom "1" <-- "*" WorkShift : assigned room

    CinemaRoom "1" <-- "*" RoomInspection : inspected for
    Employee "1" --> "*" RoomInspection : inspected by
    RoomInspection "1" *-- "9" InspectionDetail : comprises
```

---

## 6. BUSINESS RULES (QUY TẮC NGHIỆP VỤ)

| Mã Quy Tắc | Tên Quy Tắc | Mô Tả Chi Tiết |
|---|---|---|
| **BR01** | Tránh xung đột lịch chiếu | Một phòng chiếu không được phép tồn tại 2 suất chiếu trùng nhau hoặc cách nhau dưới 15 phút dọn phòng. |
| **BR02** | Ràng buộc phòng chiếu | Không thể tạo lịch chiếu mới cho phòng đang trong trạng thái `maintenance` hoặc `incident`. |
| **BR03** | Ràng buộc thiết bị trọng yếu | Không mở bán vé hoặc chiếu phim nếu máy chiếu (`Projector`) hoặc âm thanh (`Sound System`) của phòng đang hỏng. |
| **BR04** | Độc quyền ghế trong suất chiếu | Một ghế chỉ được đặt hoặc giữ duy nhất 1 lần trong cùng 1 suất chiếu (`screening_schedule + seat`). |
| **BR05** | Khóa ghế đang giữ | Khi khách hàng chọn ghế, ghế lập tức chuyển sang trạng thái 🔵 `holding` và bị khóa với toàn bộ khách hàng khác. |
| **BR06** | Thời hạn giữ ghế 10 phút | Cơ chế giữ ghế mặc định kéo dài đúng 10 phút kể từ thời điểm `hold_start`. |
| **BR07** | Tự động giải phóng ghế | Hết 10 phút mà đơn hàng chưa thanh toán, backend tự động chuyển trạng thái ghế sang `released` và hủy `booking`. |
| **BR08** | Chuyển trạng thái khi thanh toán | Khi thanh toán thành công, ghế lập tức chuyển từ 🔵 `holding` sang 🔴 `booked` và sinh mã vé điện tử. |
| **BR09** | Xử lý thanh toán thất bại | Nếu khách hủy thanh toán hoặc thanh toán lỗi, ghế được mở lại trạng thái 🟢 `available` ngay lập tức. |
| **BR10** | Backend Concurrency Locking | Backend bắt buộc sử dụng MySQL Transaction & Row-Level Locking (`SELECT FOR UPDATE`) để ngăn Race Condition khi 2 khách cùng bấm chọn ghế cùng mili-giây. |
| **BR11** | Chặn đặt suất đã qua | Không cho phép đặt vé hoặc giữ ghế đối với suất chiếu có `start_time` trong quá khứ. |
| **BR12** | Phân quyền Kỹ thuật viên | Kỹ thuật viên chỉ có thể cập nhật kết quả xử lý đối với các sự cố/bảo trì được phân công cho mình. |
| **BR13** | Tính toàn vẹn sự cố đã đóng | Sự cố đã được chuyển sang `closed` sẽ bị khóa và không thể chỉnh sửa nội dung. |
| **BR14** | Thẩm quyền đóng sự cố | Chỉ có Manager hoặc Admin mới có quyền nghiệm thu và chuyển sự cố sang trạng thái `closed`. |
| **BR15** | Lưu vết lịch sử bảo trì & sự cố | Toàn bộ các thao tác thay đổi linh kiện, chi phí, giải pháp xử lý bắt buộc phải ghi log vào `incident_histories`. |
| **BR16** | Checklist kích hoạt sự cố tự động | Trong quá trình kiểm tra phòng 9 tiêu chí, nếu có bất kỳ hạng mục nào bị đánh dấu `fail`, hệ thống tự động sinh 1 bản ghi `incidents` tương ứng. |

---

## 7. ĐỊNH HƯỚNG MỞ RỘNG & PHÁT TRIỂN TƯƠNG LAI (FUTURE ROADMAP)

Dựa trên nền tảng kiến trúc vững chắc hiện tại của đồ án OOAD (đã hoàn thiện 22 lớp thực thể, phân quyền 5 Actors RBAC, giao dịch MySQL InnoDB Row-level Lock), hệ thống định hướng mở rộng thành một hệ sinh thái rạp chiếu phim thế hệ mới theo 5 trụ cột chiến lược:

### 7.1. Phân Hệ Trải Nghiệm Khách Hàng (Customer Experience 4.0)
1. **Sơ đồ ghế 3D góc nhìn thực tế (3D Seat View Simulation):**
   * Sử dụng thư viện WebGL / Three.js để mô phỏng không gian khán phòng 3D.
   * Khách hàng có thể nhấn vào từng ghế (Standard, VIP, Sweetbox) để "nhìn thử" góc nhìn thực tế tới màn chiếu, kiểm tra độ dốc và loại trừ các góc khuất.
2. **Đặt trước Combo Bắp Nước (F&B Express Fast-Track):**
   * Tích hợp giỏ hàng chọn bắp, nước, snack ngay sau bước chọn ghế.
   * Sinh mã QR nhận F&B riêng biệt; khi đến rạp, khách hàng đi vào luồng nhận nhanh "Fast Track" để nhận phần ăn mà không phải xếp hàng thanh toán.
3. **Vé động chống gian lận & Hỗ trợ Apple/Google Wallet:**
   * Tích hợp lưu thẻ vé xem phim trực tiếp vào Apple Wallet / Google Wallet.
   * Mã QR động (Dynamic QR / TOTP) làm mới mỗi 30 giây để ngăn chặn tình trạng chụp ảnh màn hình bán lại vé lậu.
4. **Chia tiền vé nhóm (Split-Bill & Group Booking):**
   * Một người đại diện giữ một cụm ghế và tạo link chia tiền; các thành viên trong nhóm có thời gian quy định (10–15 phút) để thanh toán phần ghế của mình.

### 7.2. Phân Hệ Tối Ưu Doanh Thu & Giá Động (Dynamic Pricing Engine)
1. **Thuật toán định giá động (Dynamic Pricing):**
   * Tự động điều chỉnh giá vé dựa trên nhu cầu thời gian thực: Tăng giá vé vào khung giờ cao điểm (tối thứ 6, cuối tuần), các vị trí ghế trung tâm đẹp của phim bom tấn; đồng thời tự động giảm giá sâu các suất sáng sớm/khuya muộn để kích cầu và tối ưu tỷ lệ lấp đầy phòng chiếu.
2. **Gói thành viên Cinema Pass (Subscription Model):**
   * Cung cấp gói thuê bao xem phim cố định theo tháng (tương tự AMC Stubs A-List), tích điểm đổi quà và các ưu đãi thành viên hạng VIP, Diamond.

### 7.3. Phân Hệ Vận Hành Thông Minh & Tự Động Hóa IoT (Smart Cinema & IoT)
1. **Tự động hóa phòng chiếu Green Cinema:**
   * Tích hợp bộ điều khiển phần cứng IoT (MQTT / Zigbee): Tự động bật máy lạnh phòng chiếu trước giờ phim 15 phút, tự động làm mờ đèn khán phòng khi phim bắt đầu chiếu và bật sáng đèn dọn dẹp khi hết phần credit.
   * Tự động tắt toàn bộ thiết bị phòng chiếu khi không có lịch chiếu kế tiếp, tiết kiệm tới 25% điện năng tiêu thụ.
2. **Bảo trì dự đoán (Predictive Maintenance):**
   * Lũy kế số giờ hoạt động thực tế của bóng đèn máy chiếu Laser, động cơ máy lạnh và màng loa âm thanh.
   * Đưa ra cảnh báo chủ động cho Kỹ thuật viên khi linh kiện đạt 80%–90% tuổi thọ khuyến nghị, ngăn ngừa sự cố gián đoạn suất chiếu.
3. **Bảng hiển thị số sảnh chờ (Digital Signage Real-time):**
   * Đồng bộ dữ liệu qua WebSocket: Màn hình lớn tại sảnh rạp tự động hiển thị tình trạng vé các suất sắp chiếu, quầy gọi số nhận bắp nước theo thời gian thực.

### 7.4. Phân Hệ Ứng Dụng AI & Xử Lý Ngôn Ngữ Tự Nhiên
1. **Trợ lý AI tư vấn phim (AI Movie Concierge):**
   * Chatbot AI tích hợp mô hình ngôn ngữ lớn (LLM): Hiểu câu hỏi tự nhiên của khách (*"Tìm giúp mình phim kinh dị hoặc trinh thám chiếu sau 20h tối nay cho 2 người ở phòng IMAX"*) và tự động gợi ý suất chiếu + chuyển thẳng sang màn hình chọn ghế.
2. **Hệ thống gợi ý phim cá nhân hóa (Recommendation Engine):**
   * Ứng dụng giải thuật lọc cộng tác (Collaborative Filtering) và lọc dựa trên nội dung (Content-based Filtering) dựa trên lịch sử mua vé và diễn viên/đạo diễn yêu thích của khách hàng.
3. **Phân tích cảm xúc phản hồi (Review Sentiment Analysis):**
   * Tự động quét và phân loại mức độ hài lòng của khán giả từ đánh giá văn bản (Positive, Neutral, Negative), giúp ban quản lý nhanh chóng phát hiện các phàn nàn về vệ sinh, máy lạnh hay phục vụ tại rạp.

### 7.5. Thiết Kế Mở Rộng Mô Hình OOAD (Proposed OOAD Extensions)
Để hiện thực hóa các định hướng trên, hệ thống có thể mở rộng thêm các lớp thực thể trong mô hình Class Diagram:
* **Gói F&B:** `FoodItem`, `ComboPackage`, `BookingFoodItem` (kết hợp với `Booking`).
* **Gói Dynamic Pricing:** `DynamicPricingRule`, `PriceModifier` (áp dụng chiến lược *Strategy Pattern* để tính giá linh hoạt).
* **Gói Khách Hàng VIP:** `MembershipTier`, `CinemaPassSubscription`, `RewardPoint`.
* **Gói IoT & Thiết Bị:** `IoTDeviceController`, `EquipmentTelemetryLog` (kế thừa hoặc liên kết với `Equipment`).
* **Gói AI & Đánh Giá:** `MovieRecommendation`, `MovieReview`, `SentimentLog`.
