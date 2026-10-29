# HỆ THỐNG QUẢN LÝ VẬN HÀNH VÀ ĐẶT VÉ RẠP PHIM
## ĐỒ ÁN MÔN HỌC: PHÂN TÍCH VÀ THIẾT KẾ HƯỚNG ĐỐI TƯỢNG (OOAD)

---

## 🌟 TỔNG QUAN HỆ THỐNG

Dự án là một hệ sinh thái Web App hoàn chỉnh phục vụ báo cáo và bảo vệ đồ án môn **Phân tích và Thiết kế Hướng Đối Tượng (OOAD)**. Hệ thống kết hợp 2 phân hệ cốt lõi:
1. **Quản lý Vận hành Rạp chiếu phim:** Quản lý phòng chiếu, trang thiết bị rạp (máy chiếu, âm thanh, điều hòa,...), quy trình kiểm tra phòng 9 tiêu chí (Checklist), tiếp nhận và phân công sự cố (Incident Lifecycle), bảo trì định kỳ/đột xuất (Maintenance), phân ca làm việc (Work Shift) và báo cáo tài chính/vận hành.
2. **Quản lý Lịch chiếu & Đặt vé thông minh:** Sơ đồ ghế động theo suất chiếu (`screening_schedule + seat`), cơ chế giữ ghế tạm thời 10 phút, chống đặt trùng ghế (MySQL Transaction & Row-Level Locking `SELECT FOR UPDATE`), thanh toán mô phỏng đa kênh, phát hành vé điện tử mã QR Code và soát vé tại cửa khán phòng.

---

## 🛠️ CÔNG NGHỆ BẮT BUỘC

* **Frontend:** React (Vite, TailwindCSS, Lucide Icons, Recharts, Canvas Confetti, QRCode.react)
* **Backend:** Node.js + Express.js REST API
* **Database:** **MySQL 8.0 (InnoDB Engine)** hỗ trợ Transactions, Foreign Keys & Locking
* **Database Management:** **MySQL Workbench**, Navicat, phpMyAdmin hoặc MySQL CLI
* **Authentication & Authorization:** JWT (JSON Web Token) & Role-Based Access Control (RBAC)

---

## 👥 5 ACTORS & TÀI KHOẢN TRUY CẬP MẪU

> [!TIP]
> Hệ thống tích hợp tính năng **⚡ 1-Click Fast Role Switcher** trên thanh Header của giao diện để giảng viên và sinh viên có thể chuyển đổi tức thì giữa 5 vai trò khi bảo vệ đồ án!

| STT | Vai Trò (Actor) | Tên Đăng Nhập | Mật Khẩu | Quyền Hạn Chính |
|---|---|---|---|---|
| 1 | 👑 **Admin** | `admin` | `password123` | Toàn quyền quản trị hệ thống, tài khoản, phim, phòng, lịch chiếu, báo cáo |
| 2 | 👔 **Manager** | `manager1` | `password123` | Lập lịch chiếu, phân công KTV xử lý sự cố, kế hoạch bảo trì, nghiệm thu |
| 3 | 📋 **Staff** | `staff1` | `password123` | Thực hiện checklist 9 tiêu chí phòng, báo cáo sự cố, điểm danh ca, soát vé QR |
| 4 | 🔧 **Technician** | `tech1` | `password123` | Tiếp nhận sự cố, chẩn đoán, cập nhật linh kiện/chi phí sửa chữa, bảo trì |
| 5 | 🍿 **Customer** | `customer1` | `password123` | Duyệt phim, xem lịch chiếu, chọn ghế, giữ ghế 10p, thanh toán, xem vé QR |

---

## 🗄️ HƯỚNG DẪN CÀI ĐẶT CƠ SỞ DỮ LIỆU MYSQL

Database bắt buộc có tên: **`cinema_management`** và engine **InnoDB**.

### Cách 1: Import trực tiếp bằng MySQL Workbench (Khuyên dùng)
1. Mở **MySQL Workbench** và kết nối tới Local MySQL Server.
2. Chọn menu **File** ➔ **Open SQL Script...** (hoặc `Ctrl + Shift + O`).
3. Chọn file **[`cinema_management.sql`](./cinema_management.sql)** tại thư mục gốc của đồ án.
4. Nhấn biểu tượng **Tia sét ⚡ (Execute)** để thực thi toàn bộ script tạo 22 bảng và nạp dữ liệu mẫu (Seed Data).

### Cách 2: Sử dụng script tự động qua Node.js
1. Đảm bảo dịch vụ MySQL đang chạy trên máy (port `3306`).
2. Mở terminal tại thư mục `backend`:
   ```bash
   cd backend
   npm run db:setup
   ```

---

## 🚀 HƯỚNG DẪN KHỞI CHẠY ỨNG DỤNG

### Bước 1: Khởi động Backend (Node.js/Express)
1. Mở terminal thứ nhất:
   ```bash
   cd backend
   npm install
   npm start
   ```
2. Backend REST API sẽ chạy tại: **`http://localhost:5000`**
3. Kiểm tra trạng thái máy chủ: **`http://localhost:5000/api/health`**

### Bước 2: Khởi động Frontend (React SPA)
1. Mở terminal thứ hai:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
2. Mở trình duyệt tại địa chỉ hiển thị (thường là: **`http://localhost:5173`**).

---

## 📐 TÀI LIỆU PHÂN TÍCH & THIẾT KẾ OOAD

Tài liệu chi tiết kèm mã nguồn Mermaid render trực quan đã được biên soạn trong file **[`ooad_documentation.md`](./ooad_documentation.md)** bao gồm:
1. **Use Case Diagram:** Thể hiện phân quyền 5 Actor.
2. **8 Activity Diagrams:**
   - Đặt vé xem phim
   - Chọn & Giữ ghế 10 phút (Hold Seat Locking)
   - Thanh toán & Xuất vé
   - Báo cáo sự cố phòng chiếu
   - Xử lý sự cố kỹ thuật
   - Kế hoạch & Thực hiện bảo trì thiết bị
   - Kiểm tra phòng chiếu (9 Tiêu chí Checklist)
   - Lập lịch chiếu (Kiểm tra xung đột)
3. **9 Sequence Diagrams:** Luồng tương tác tuần tự giữa Customer/Staff/Manager/Technician ➔ React ➔ Express API ➔ MySQL Transaction Lock.
4. **Class Diagram:** Thể hiện đầy đủ 22 lớp thực thể, thuộc tính, phương thức, quan hệ Association, Aggregation, Composition và Multiplicity.
5. **Bảng 16 Business Rules (BR01 - BR16).**

---

## 📁 CẤU TRÚC THƯ MỤC DỰ ÁN

```
rap-chieu-phim/
├── cinema_management.sql          # File DDL + Seed Data nhập MySQL Workbench
├── ooad_documentation.md          # Toàn bộ biểu đồ và tài liệu phân tích thiết kế OOAD
├── README.md                      # Hướng dẫn cài đặt và vận hành hệ thống
├── backend/                       # REST API Server (Node.js + Express + MySQL)
│   ├── config/database.js         # Pool kết nối MySQL & Transaction locking helpers
│   ├── controllers/               # 16 Controller nghiệp vụ
│   ├── middlewares/               # JWT Auth, Role RBAC, Central Error Handlers
│   ├── routes/                    # REST API Endpoints
│   ├── services/
│   │   └── holdSeatCleanupService.js # Worker tự động giải phóng ghế sau 10 phút
│   ├── scripts/setupDb.js         # Script nạp CSDL tự động
│   ├── .env                       # Cấu hình cổng, DB, JWT
│   └── server.js                  # Entry point Backend Express
└── frontend/                      # Web App Giao Diện Điện Ảnh (React + Vite + Tailwind)
    ├── src/
    │   ├── components/
    │   │   ├── common/            # Header, LoginModal, NotificationDropdown, Footer
    │   │   └── customer/          # SeatMap, PaymentModal, TicketCard, TrailerModal
    │   ├── context/
    │   │   ├── AuthContext.jsx    # User session, JWT, 1-Click Fast Role Switcher
    │   │   └── BookingContext.jsx # 10-Minute Countdown Timer & Seat Hold Sync
    │   ├── pages/
    │   │   ├── customer/          # HomePage, MoviesPage, SchedulesPage, BookingFlowPage, MyTicketsPage
    │   │   └── admin/             # Dashboard, Movies, Rooms, Schedules, Tickets, Equipment, Incidents, Maintenance, Inspections, Shifts, Employees, Customers, Reports
    │   ├── services/api.js        # API Client kết nối Backend
    │   ├── App.jsx                # Router & Điều hướng giao diện
    │   └── index.css              # Dark Cinema Theme, Curved Screen Effect, Glassmorphism
    └── tailwind.config.js
```

---

## 🏆 CÁC QUY TRÌNH NGHIỆP VỤ DEMO TIÊU BIỂU

1. **Workflow 1 – Đặt vé & Giữ ghế 10 phút:**
   - Đăng nhập tài khoản `customer1` hoặc chuyển vai trò Customer.
   - Chọn phim ➔ Chọn suất chiếu ➔ Vào sơ đồ ghế phòng chiếu.
   - Bấm chọn ghế (ví dụ D5, D6) ➔ Đồng hồ đếm ngược 10:00 kích hoạt, ghế chuyển màu 🔵 **Đang giữ**.
   - Bấm Thanh toán ➔ Chọn phương thức thanh toán mô phỏng ➔ Bắn pháo hoa Confetti ➔ Vé điện tử mã QR Code được phát hành.
2. **Workflow 2 – Chống đặt trùng ghế (Concurrency Control):**
   - Mở 2 cửa sổ ẩn danh cùng vào 1 suất chiếu.
   - Cửa sổ A chọn ghế C5 ➔ C5 chuyển sang 🔵 Đang giữ.
   - Cửa sổ B chọn ghế C5 ➔ Backend từ chối với thông báo: *"Ghế C5 vừa được người khác giữ"*.
3. **Workflow 3 – Báo cáo sự cố & Xử lý kỹ thuật:**
   - Chuyển vai trò 📋 **Staff** ➔ Vào *Kiểm tra phòng* ➔ Điền checklist 9 mục, đánh dấu *Điều hòa* "Fail" ➔ Hệ thống tự động tạo Sự cố.
   - Chuyển vai trò 👔 **Manager** ➔ Vào *Quản lý sự cố* ➔ Bấm *Phân công KTV* cho `Võ Minh Quân`.
   - Chuyển vai trò 🔧 **Technician** ➔ Vào *Quản lý sự cố* ➔ Cập nhật nguyên nhân, linh kiện thay thế và chi phí.
   - Chuyển lại 👔 **Manager** ➔ Bấm *Nghiệm thu & Đóng sự cố* ➔ Phòng chuyển lại trạng thái hoạt động bình thường!
