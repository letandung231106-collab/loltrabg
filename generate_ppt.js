const pptxgen = require("pptxgenjs");
const path = require("path");

const pres = new pptxgen();
pres.layout = "LAYOUT_16x9"; // 10.0 x 5.625 inches
pres.title = "Báo Cáo Đồ Án OOAD - Hệ Thống Quản Lý Vận Hành & Đặt Vé Rạp Chiếu Phim";
pres.author = "Nhóm Đồ Án OOAD";
pres.company = "Khoa Công Nghệ Thông Tin";

// ==========================================
// 🎨 BẢNG MÀU TƯƠI SÁNG, TRẺ TRUNG, NỀN TRẮNG
// ==========================================
const BG_PAGE = "F8FAFC";       // Nền trang sáng, trắng dịu mắt
const BG_WHITE = "FFFFFF";      // Thẻ trắng tinh khôi
const BG_SOFT_YELLOW = "FEF9C3"; // Vàng bơ nhạt
const BG_SOFT_BLUE = "E0F2FE";   // Xanh da trời nhạt
const BG_SOFT_GREEN = "DCFCE7";  // Xanh lá mint nhạt
const BG_SOFT_PINK = "FFE4E6";   // Hồng đào nhạt
const BG_SOFT_PURPLE = "F3E8FF"; // Tím lavender nhạt
const BG_CARD_LIGHT = "F1F5F9";  // Xám nhạt thanh lịch

// Màu nhấn vui tươi (Candy & Pop Colors)
const POP_CORAL = "FF4757";     // Đỏ san hô
const POP_SUNNY = "F59E0B";     // Vàng mặt trời
const POP_SKY = "0EA5E9";       // Xanh dương tươi sáng
const POP_MINT = "10B981";      // Xanh lá mint
const POP_PURPLE = "8B5CF6";    // Tím mộng mơ
const POP_INDIGO = "6366F1";    // Xanh chàm
const POP_TEAL = "14B8A6";      // Xanh ngọc

// Màu chữ
const TEXT_DARK = "0F172A";     // Chữ đen đậm nét
const TEXT_BODY = "334155";     // Chữ nội dung slate đậm, cực rõ
const TEXT_MUTED = "64748B";    // Chữ chú thích phụ

const FONT_HEADING = "Arial";
const FONT_BODY = "Arial";
const FONT_CODE = "Consolas";

// ==========================================
// 📐 HELPER: HEADER CHUẨN XÁC & ĐỒNG BỘ
// ==========================================
function addHeader(slide, title, category = "🎬 ĐỒ ÁN PHÂN TÍCH & THIẾT KẾ HƯỚNG ĐỐI TƯỢNG (OOAD)") {
  slide.background = { color: BG_PAGE };

  // Top header background bar
  slide.addShape(pres.ShapeType.rect, {
    x: 0, y: 0, w: 10.0, h: 1.05,
    fill: { color: BG_WHITE },
    line: { color: "E2E8F0", width: 1 }
  });

  // Rainbow top edge stripe
  slide.addShape(pres.ShapeType.rect, { x: 0, y: 0, w: 2.5, h: 0.06, fill: { color: POP_CORAL } });
  slide.addShape(pres.ShapeType.rect, { x: 2.5, y: 0, w: 2.5, h: 0.06, fill: { color: POP_SUNNY } });
  slide.addShape(pres.ShapeType.rect, { x: 5.0, y: 0, w: 2.5, h: 0.06, fill: { color: POP_MINT } });
  slide.addShape(pres.ShapeType.rect, { x: 7.5, y: 0, w: 2.5, h: 0.06, fill: { color: POP_SKY } });

  // Category Pill Badge
  slide.addShape(pres.ShapeType.roundRect, {
    x: 0.5, y: 0.15, w: 4.8, h: 0.26,
    fill: { color: BG_SOFT_YELLOW },
    line: { color: POP_SUNNY, width: 1 },
    rectRadius: 0.13
  });
  slide.addText(category, {
    x: 0.5, y: 0.15, w: 4.8, h: 0.26,
    fontSize: 7.8, bold: true, color: "B45309",
    align: "center", valign: "middle", fontFace: FONT_HEADING
  });

  // Slide Title
  slide.addText(title, {
    x: 0.5, y: 0.44, w: 7.2, h: 0.55,
    fontSize: 13.5, bold: true, color: TEXT_DARK,
    valign: "middle", fontFace: FONT_HEADING
  });

  // Top-right Cute Cinema Badge
  slide.addShape(pres.ShapeType.roundRect, {
    x: 7.85, y: 0.18, w: 1.65, h: 0.58,
    fill: { color: BG_SOFT_BLUE },
    line: { color: POP_SKY, width: 1 },
    rectRadius: 0.12
  });
  slide.addText("🍿 CINEMA OOAD\n★ UML 2.5 PRO ★", {
    x: 7.85, y: 0.18, w: 1.65, h: 0.58,
    fontSize: 7.5, bold: true, color: POP_SKY,
    align: "center", valign: "middle", fontFace: FONT_HEADING
  });

  // Footer bar
  slide.addShape(pres.ShapeType.line, {
    x: 0.5, y: 5.25, w: 9.0, h: 0,
    line: { color: "CBD5E1", width: 1 }
  });
  slide.addText("🌟 Đồ Án OOAD: Hệ Thống Quản Lý Vận Hành & Đặt Vé Rạp Chiếu Phim | Báo Cáo Bảo Vệ UML 2.5", {
    x: 0.5, y: 5.28, w: 9.0, h: 0.28,
    fontSize: 7.5, color: TEXT_MUTED, valign: "middle", fontFace: FONT_BODY
  });
}

// Helper: Vẽ hộp Class Diagram chuẩn UML 3 tầng
function drawUMLClassBox(slide, x, y, w, h, title, color, bg, attrs, methods) {
  // Main container
  slide.addShape(pres.ShapeType.roundRect, {
    x: x, y: y, w: w, h: h,
    fill: { color: BG_WHITE },
    line: { color: color, width: 1.2 },
    rectRadius: 0.08
  });

  // Class Name Header
  slide.addShape(pres.ShapeType.roundRect, {
    x: x, y: y, w: w, h: 0.32,
    fill: { color: bg },
    line: { color: color, width: 1 },
    rectRadius: 0.08
  });
  slide.addText(`<<entity>>\n${title}`, {
    x: x, y: y, w: w, h: 0.32,
    fontSize: 7.2, bold: true, color: color,
    align: "center", valign: "middle", fontFace: FONT_HEADING
  });

  const attrH = (h - 0.38) * 0.52;
  const methH = (h - 0.38) * 0.48;

  // Attributes area
  slide.addText(attrs.map(a => `+ ${a}`).join("\n"), {
    x: x + 0.08, y: y + 0.34, w: w - 0.16, h: attrH,
    fontSize: 6.2, color: TEXT_DARK, fontFace: FONT_CODE,
    lineSpacingMultiple: 1.05
  });

  // Divider line
  slide.addShape(pres.ShapeType.line, {
    x: x, y: y + 0.34 + attrH, w: w, h: 0,
    line: { color: "E2E8F0", width: 1 }
  });

  // Methods area
  slide.addText(methods.map(m => `+ ${m}`).join("\n"), {
    x: x + 0.08, y: y + 0.36 + attrH, w: w - 0.16, h: methH,
    fontSize: 6.2, color: "0369A1", fontFace: FONT_CODE,
    lineSpacingMultiple: 1.05
  });
}

// =============================================================
// SLIDE 1: Trang Bìa (Cute & Cheerful Cinema Marquee)
// =============================================================
{
  const slide = pres.addSlide();
  slide.background = { color: BG_PAGE };

  // Rainbow top edge stripe
  slide.addShape(pres.ShapeType.rect, { x: 0, y: 0, w: 2.5, h: 0.08, fill: { color: POP_CORAL } });
  slide.addShape(pres.ShapeType.rect, { x: 2.5, y: 0, w: 2.5, h: 0.08, fill: { color: POP_SUNNY } });
  slide.addShape(pres.ShapeType.rect, { x: 5.0, y: 0, w: 2.5, h: 0.08, fill: { color: POP_MINT } });
  slide.addShape(pres.ShapeType.rect, { x: 7.5, y: 0, w: 2.5, h: 0.08, fill: { color: POP_SKY } });

  // Giant Main Card (Centered: x = 0.5, w = 9.0, h = 4.85)
  slide.addShape(pres.ShapeType.roundRect, {
    x: 0.5, y: 0.38, w: 9.0, h: 4.85,
    fill: { color: BG_WHITE },
    line: { color: "E2E8F0", width: 1.5 },
    rectRadius: 0.2
  });

  // Top badge
  slide.addShape(pres.ShapeType.roundRect, {
    x: 2.8, y: 0.55, w: 4.4, h: 0.38,
    fill: { color: BG_SOFT_PINK },
    line: { color: POP_CORAL, width: 1.2 },
    rectRadius: 0.19
  });
  slide.addText("🍿 BÁO CÁO ĐỒ ÁN MÔN HỌC OOAD 🎬", {
    x: 2.8, y: 0.55, w: 4.4, h: 0.38,
    fontSize: 9.5, bold: true, color: POP_CORAL,
    align: "center", valign: "middle", fontFace: FONT_HEADING
  });

  // Big Cheerful Project Title
  slide.addText("HỆ THỐNG QUẢN LÝ VẬN HÀNH\nVÀ ĐẶT VÉ RẠP CHIẾU PHIM", {
    x: 0.8, y: 1.02, w: 8.4, h: 1.05,
    fontSize: 19.5, bold: true, color: TEXT_DARK,
    align: "center", lineSpacingMultiple: 1.15, fontFace: FONT_HEADING
  });

  // Subtitle
  slide.addText("✨ Thiết Kế Hướng Đối Tượng Chuẩn UML 2.5 • Sơ Đồ Use Case, Hoạt Động, Tuần Tự & Sơ Đồ Lớp ✨", {
    x: 0.8, y: 2.15, w: 8.4, h: 0.32,
    fontSize: 8.5, bold: true, color: POP_SKY,
    align: "center", fontFace: FONT_HEADING
  });

  // 4 Feature Pills
  const pills = [
    { text: "🎟️ Đặt Vé & Giữ 10p", color: POP_CORAL, bg: BG_SOFT_PINK, x: 0.8 },
    { text: "🛡️ Chống Trùng Ghế", color: POP_SUNNY, bg: BG_SOFT_YELLOW, x: 2.95 },
    { text: "🔧 Xử Lý Sự Cố Rạp", color: POP_MINT, bg: BG_SOFT_GREEN, x: 5.1 },
    { text: "📋 Checklist 9 Tiêu Chí", color: POP_PURPLE, bg: BG_SOFT_PURPLE, x: 7.25 }
  ];
  pills.forEach(p => {
    slide.addShape(pres.ShapeType.roundRect, {
      x: p.x, y: 2.55, w: 1.95, h: 0.36,
      fill: { color: p.bg },
      line: { color: p.color, width: 1 },
      rectRadius: 0.15
    });
    slide.addText(p.text, {
      x: p.x, y: 2.55, w: 1.95, h: 0.36,
      fontSize: 7.5, bold: true, color: p.color,
      align: "center", valign: "middle", fontFace: FONT_HEADING
    });
  });

  // Divider
  slide.addShape(pres.ShapeType.line, {
    x: 0.8, y: 3.05, w: 8.4, h: 0,
    line: { color: "E2E8F0", width: 1 }
  });

  // Info Column 1
  slide.addShape(pres.ShapeType.roundRect, {
    x: 0.8, y: 3.18, w: 4.1, h: 1.85,
    fill: { color: "F8FAFC" },
    line: { color: "CBD5E1", width: 1 },
    rectRadius: 0.12
  });
  slide.addText("📚 THÔNG TIN HỌC PHẦN", {
    x: 0.95, y: 3.28, w: 3.8, h: 0.25,
    fontSize: 8.8, bold: true, color: POP_INDIGO, fontFace: FONT_HEADING
  });
  slide.addText([
    { text: "• Môn học: ", options: { bold: true, color: TEXT_DARK } },
    { text: "Phân tích & Thiết kế Hướng Đối Tượng (OOAD)\n", options: { color: TEXT_BODY } },
    { text: "• Bộ chuẩn thiết kế: ", options: { bold: true, color: TEXT_DARK } },
    { text: "UML 2.5 (Use Case, Activity, Sequence, Class)\n", options: { color: TEXT_BODY } },
    { text: "• CSDL & Công nghệ: ", options: { bold: true, color: TEXT_DARK } },
    { text: "MySQL 8.0 InnoDB + Node.js Express + React 18\n", options: { color: TEXT_BODY } },
    { text: "• Giải pháp cốt lõi: ", options: { bold: true, color: TEXT_DARK } },
    { text: "Khóa ghế 10p, SELECT FOR UPDATE chống Race Condition", options: { color: POP_CORAL, bold: true } }
  ], {
    x: 0.95, y: 3.55, w: 3.8, h: 1.38,
    fontSize: 7.5, lineSpacingMultiple: 1.15, fontFace: FONT_BODY
  });

  // Info Column 2
  slide.addShape(pres.ShapeType.roundRect, {
    x: 5.1, y: 3.18, w: 4.1, h: 1.85,
    fill: { color: "F8FAFC" },
    line: { color: "CBD5E1", width: 1 },
    rectRadius: 0.12
  });
  slide.addText("👥 NHÓM TÁC GIẢ BÁO CÁO", {
    x: 5.25, y: 3.28, w: 3.8, h: 0.25,
    fontSize: 8.8, bold: true, color: POP_MINT, fontFace: FONT_HEADING
  });
  slide.addText([
    { text: "• Giảng viên hướng dẫn: ", options: { bold: true, color: TEXT_DARK } },
    { text: "Giảng viên bộ môn OOAD\n", options: { color: TEXT_BODY } },
    { text: "• Nhóm sinh viên thực hiện: ", options: { bold: true, color: TEXT_DARK } },
    { text: "Nhóm tác giả Đồ án Cinema\n", options: { color: TEXT_BODY } },
    { text: "• Nội dung báo cáo: ", options: { bold: true, color: TEXT_DARK } },
    { text: "Toàn bộ 4 mô hình UML + Cài đặt thực nghiệm\n", options: { color: TEXT_BODY } },
    { text: "• Tình trạng: ", options: { bold: true, color: TEXT_DARK } },
    { text: "✅ Hoàn chỉnh mã nguồn, sẵn sàng Demo Live", options: { bold: true, color: POP_MINT } }
  ], {
    x: 5.25, y: 3.55, w: 3.8, h: 1.38,
    fontSize: 7.5, lineSpacingMultiple: 1.15, fontFace: FONT_BODY
  });

  slide.addNotes("Kính chào Thầy Cô và các bạn. Hôm nay nhóm em xin trình bày đồ án OOAD: Hệ thống Quản lý Vận hành và Đặt vé Rạp chiếu phim với đầy đủ 4 mô hình UML cốt lõi: Use Case, Hoạt động, Tuần tự và Sơ đồ lớp.");
}

// =============================================================
// SLIDE 2: Đặt Vấn Đề & Mục Tiêu (Problem & Solution)
// =============================================================
{
  const slide = pres.addSlide();
  addHeader(slide, "1. ĐẶT VẤN ĐỀ & MỤC TIÊU CỦA ĐỒ ÁN", "TỔNG QUAN HỆ THỐNG");

  // Left Card: Thách thức
  slide.addShape(pres.ShapeType.roundRect, {
    x: 0.5, y: 1.15, w: 4.35, h: 3.95,
    fill: { color: BG_WHITE },
    line: { color: POP_CORAL, width: 1.5 },
    rectRadius: 0.15
  });
  slide.addShape(pres.ShapeType.roundRect, {
    x: 0.7, y: 1.3, w: 3.95, h: 0.35,
    fill: { color: BG_SOFT_PINK },
    line: { color: POP_CORAL, width: 1 },
    rectRadius: 0.1
  });
  slide.addText("🚨 THÁCH THỨC Ở RẠP TRUYỀN THỐNG", {
    x: 0.7, y: 1.3, w: 3.95, h: 0.35,
    fontSize: 8.8, bold: true, color: POP_CORAL,
    align: "center", valign: "middle", fontFace: FONT_HEADING
  });
  slide.addText([
    { text: "• Trùng ghế cao điểm (Race Condition): ", options: { bold: true, color: TEXT_DARK } },
    { text: "Nhiều khách cùng bấm 1 ghế trong tích tắc gây lỗi bán trùng vé, mất uy tín rạp.\n\n", options: { color: TEXT_BODY } },
    { text: "• Thiết bị hỏng xử lý chậm trễ: ", options: { bold: true, color: TEXT_DARK } },
    { text: "Máy chiếu, âm thanh hỏng nhưng báo cáo rời rạc qua Zalo/sổ tay, làm hủy suất chiếu.\n\n", options: { color: TEXT_BODY } },
    { text: "• Kiểm tra phòng thiếu chuẩn hóa: ", options: { bold: true, color: TEXT_DARK } },
    { text: "Ghi chép sổ sách thủ công, khó quy trách nhiệm ca trực và không lưu vết lịch sử.\n\n", options: { color: TEXT_BODY } },
    { text: "• Lập lịch chiếu dễ xung đột: ", options: { bold: true, color: TEXT_DARK } },
    { text: "Không tự động tính 15p dọn phòng hoặc phòng/thiết bị đang gặp sự cố kỹ thuật.", options: { color: TEXT_BODY } }
  ], {
    x: 0.7, y: 1.75, w: 3.95, h: 3.2,
    fontSize: 7.8, lineSpacingMultiple: 1.12, fontFace: FONT_BODY
  });

  // Right Card: Giải pháp
  slide.addShape(pres.ShapeType.roundRect, {
    x: 5.15, y: 1.15, w: 4.35, h: 3.95,
    fill: { color: BG_WHITE },
    line: { color: POP_MINT, width: 1.5 },
    rectRadius: 0.15
  });
  slide.addShape(pres.ShapeType.roundRect, {
    x: 5.35, y: 1.3, w: 3.95, h: 0.35,
    fill: { color: BG_SOFT_GREEN },
    line: { color: POP_MINT, width: 1 },
    rectRadius: 0.1
  });
  slide.addText("🌟 GIẢI PHÁP HƯỚNG ĐỐI TƯỢNG (OOAD)", {
    x: 5.35, y: 1.3, w: 3.95, h: 0.35,
    fontSize: 8.8, bold: true, color: POP_MINT,
    align: "center", valign: "middle", fontFace: FONT_HEADING
  });
  slide.addText([
    { text: "• Mô hình hóa OOAD & UML 2.5 toàn diện: ", options: { bold: true, color: TEXT_DARK } },
    { text: "Thiết kế 5 Actors, 22 Classes với quan hệ Composition / Aggregation chặt chẽ.\n\n", options: { color: TEXT_BODY } },
    { text: "• Khóa ghế 10p & Chống trùng ghế: ", options: { bold: true, color: TEXT_DARK } },
    { text: "Dùng MySQL Transaction + Row-Level Locking (SELECT FOR UPDATE) an toàn tuyệt đối.\n\n", options: { color: TEXT_BODY } },
    { text: "• Tự động giải phóng ghế (Hold Timeout): ", options: { bold: true, color: TEXT_DARK } },
    { text: "Worker chạy ngầm mỗi 30s tự động nhả ghế nếu quá 10 phút chưa thanh toán.\n\n", options: { color: TEXT_BODY } },
    { text: "• Vòng đời sự cố & Checklist 9 tiêu chí: ", options: { bold: true, color: TEXT_DARK } },
    { text: "Tự sinh sự cố khi kiểm tra phòng Fail, điều phối KTV và nghiệm thu minh bạch.", options: { color: TEXT_BODY } }
  ], {
    x: 5.35, y: 1.75, w: 3.95, h: 3.2,
    fontSize: 7.8, lineSpacingMultiple: 1.12, fontFace: FONT_BODY
  });

  slide.addNotes("Mục tiêu cốt lõi của đồ án là áp dụng triệt để phương pháp Phân tích Thiết kế Hướng Đối Tượng để giải quyết bài toán vận hành rạp và chống trùng ghế.");
}

// =============================================================
// SLIDE 3: 5 Actors & Phân Quyền RBAC
// =============================================================
{
  const slide = pres.addSlide();
  addHeader(slide, "2. NĂM TÁC NHÂN HỆ THỐNG (5 ACTORS) & PHÂN QUYỀN RBAC", "PHÂN TÍCH YÊU CẦU");

  const actors = [
    { emoji: "👑", title: "Quản Trị Viên (Admin)", bg: BG_SOFT_PINK, border: POP_CORAL, desc: "Toàn quyền quản trị: Quản lý Users, Phân quyền Role RBAC, Danh mục phim, Phòng chiếu, Lịch chiếu & Báo cáo Dashboard." },
    { emoji: "👔", title: "Quản Lý Rạp (Manager)", bg: BG_SOFT_YELLOW, border: POP_SUNNY, desc: "Lập lịch chiếu (kiểm tra xung đột BR01), tiếp nhận sự cố, phân công Kỹ thuật viên, lập lịch bảo trì định kỳ & nghiệm thu đóng phiếu." },
    { emoji: "📋", title: "Nhân Viên (Staff)", bg: BG_SOFT_BLUE, border: POP_SKY, desc: "Kiểm tra phòng 9 tiêu chuẩn (Daily Checklist), phát hiện và tạo báo cáo sự cố, điểm danh ca làm việc, soát vé điện tử mã QR." },
    { emoji: "🔧", title: "Kỹ Thuật Viên (Technician)", bg: BG_SOFT_PURPLE, border: POP_PURPLE, desc: "Tiếp nhận phiếu sự cố & bảo trì được giao, khảo sát hiện trường, sửa chữa thiết bị, ghi nhận linh kiện thay thế và chi phí thực tế." },
    { emoji: "🍿", title: "Khách Hàng (Customer)", bg: BG_SOFT_GREEN, border: POP_MINT, desc: "Duyệt danh mục phim, chọn suất chiếu, xem sơ đồ ghế thời gian thực, giữ ghế 10 phút, thanh toán và nhận vé QR Code." }
  ];

  actors.forEach((act, idx) => {
    const yPos = 1.15 + idx * 0.78;
    slide.addShape(pres.ShapeType.roundRect, {
      x: 0.5, y: yPos, w: 9.0, h: 0.68,
      fill: { color: BG_WHITE },
      line: { color: act.border, width: 1.2 },
      rectRadius: 0.12
    });

    slide.addShape(pres.ShapeType.roundRect, {
      x: 0.65, y: yPos + 0.1, w: 2.7, h: 0.48,
      fill: { color: act.bg },
      line: { color: act.border, width: 1 },
      rectRadius: 0.1
    });
    slide.addText(`${act.emoji} ${act.title}`, {
      x: 0.65, y: yPos + 0.1, w: 2.7, h: 0.48,
      fontSize: 8.5, bold: true, color: act.border,
      align: "center", valign: "middle", fontFace: FONT_HEADING
    });

    slide.addText(act.desc, {
      x: 3.5, y: yPos + 0.08, w: 5.85, h: 0.52,
      fontSize: 7.8, color: TEXT_BODY,
      valign: "middle", fontFace: FONT_BODY
    });
  });

  slide.addNotes("Hệ thống có 5 Actors được phân quyền theo mô hình Role-Based Access Control (RBAC).");
}

// =============================================================
// SLIDE 4: Sơ Đồ Use Case Tổng Quan (System Boundary & 4 Subsystems)
// =============================================================
{
  const slide = pres.addSlide();
  addHeader(slide, "3. SƠ ĐỒ USE CASE TỔNG QUAN TOÀN HỆ THỐNG", "MÔ HÌNH HÓA USE CASE");

  // System boundary container
  slide.addShape(pres.ShapeType.roundRect, {
    x: 0.5, y: 1.15, w: 9.0, h: 3.95,
    fill: { color: "FAFAFA" },
    line: { color: POP_INDIGO, width: 1.5 },
    rectRadius: 0.15
  });

  // System boundary title
  slide.addShape(pres.ShapeType.roundRect, {
    x: 2.2, y: 1.2, w: 5.6, h: 0.3,
    fill: { color: BG_SOFT_PURPLE },
    line: { color: POP_INDIGO, width: 1 },
    rectRadius: 0.1
  });
  slide.addText("🎬 HỆ THỐNG QUẢN LÝ VẬN HÀNH & ĐẶT VÉ RẠP PHIM (SYSTEM BOUNDARY)", {
    x: 2.2, y: 1.2, w: 5.6, h: 0.3,
    fontSize: 7.8, bold: true, color: POP_INDIGO,
    align: "center", valign: "middle", fontFace: FONT_HEADING
  });

  // 4 Subsystem Boxes
  const subBoxes = [
    {
      actor: "👤 Khách Hàng (Customer)",
      title: "🎟️ PHÂN HỆ ĐẶT VÉ",
      color: POP_CORAL, bg: BG_SOFT_PINK,
      x: 0.7, y: 1.58, w: 4.1, h: 1.65,
      cases: [
        "UC01: Tra cứu phim & Xem lịch chiếu",
        "UC02: Chọn ghế sơ đồ động & Khóa giữ 10p",
        "UC03: Thanh toán đơn hàng & Nhận vé QR",
        "UC04: Quản lý lịch sử vé xem phim & Phản hồi"
      ]
    },
    {
      actor: "👔 Staff & 🔧 Technician",
      title: "🔧 PHÂN HỆ VẬN HÀNH & KỸ THUẬT",
      color: POP_PURPLE, bg: BG_SOFT_PURPLE,
      x: 5.2, y: 1.58, w: 4.1, h: 1.65,
      cases: [
        "UC05: Kiểm tra phòng chiếu theo 9 tiêu chí",
        "UC06: Báo cáo sự cố phòng & thiết bị tức thì",
        "UC07: Tiếp nhận phiếu sửa chữa & Bảo trì",
        "UC08: Cập nhật linh kiện thay thế & Chi phí"
      ]
    },
    {
      actor: "💼 Quản Lý Rạp (Manager)",
      title: "💼 PHÂN HỆ QUẢN LÝ RẠP",
      color: POP_SUNNY, bg: BG_SOFT_YELLOW,
      x: 0.7, y: 3.32, w: 4.1, h: 1.65,
      cases: [
        "UC09: Lập lịch chiếu & Check xung đột (BR01)",
        "UC10: Phân công Kỹ thuật viên xử lý sự cố",
        "UC11: Lập kế hoạch bảo trì thiết bị định kỳ",
        "UC12: Nghiệm thu kết quả & Đóng phiếu sự cố"
      ]
    },
    {
      actor: "👑 Quản Trị Viên (Admin)",
      title: "👑 PHÂN HỆ QUẢN TRỊ & BẢO MẬT",
      color: POP_SKY, bg: BG_SOFT_BLUE,
      x: 5.2, y: 3.32, w: 4.1, h: 1.65,
      cases: [
        "UC13: Đăng nhập & Xác thực bảo mật JWT Token",
        "UC14: Quản lý tài khoản User & Phân quyền Role",
        "UC15: Quản lý hạ tầng Phòng chiếu, Ghế, Thiết bị",
        "UC16: Báo cáo thống kê Dashboard & Doanh thu"
      ]
    }
  ];

  subBoxes.forEach(sb => {
    slide.addShape(pres.ShapeType.roundRect, {
      x: sb.x, y: sb.y, w: sb.w, h: sb.h,
      fill: { color: BG_WHITE },
      line: { color: sb.color, width: 1.2 },
      rectRadius: 0.1
    });

    // Subsystem Header
    slide.addShape(pres.ShapeType.roundRect, {
      x: sb.x + 0.1, y: sb.y + 0.08, w: sb.w - 0.2, h: 0.28,
      fill: { color: sb.bg },
      line: { color: sb.color, width: 1 },
      rectRadius: 0.06
    });
    slide.addText(`${sb.title}  |  ${sb.actor}`, {
      x: sb.x + 0.1, y: sb.y + 0.08, w: sb.w - 0.2, h: 0.28,
      fontSize: 7.2, bold: true, color: sb.color,
      align: "center", valign: "middle", fontFace: FONT_HEADING
    });

    const items = sb.cases.map(c => ({ text: `• ${c}\n`, options: { color: TEXT_BODY } }));
    slide.addText(items, {
      x: sb.x + 0.15, y: sb.y + 0.38, w: sb.w - 0.3, h: sb.h - 0.42,
      fontSize: 7.2, lineSpacingMultiple: 1.15, fontFace: FONT_BODY
    });
  });

  slide.addNotes("Sơ đồ Use Case tổng quan thể hiện rõ 5 Tác nhân tương tác với 4 phân hệ chính bên trong System Boundary.");
}

// =============================================================
// SLIDE 5: Sơ Đồ Use Case Phân Hệ Đặt Vé (Customer Subsystem)
// =============================================================
{
  const slide = pres.addSlide();
  addHeader(slide, "4. SƠ ĐỒ USE CASE: PHÂN HỆ ĐẶT VÉ & KHÁCH HÀNG (CUSTOMER)", "MÔ HÌNH HÓA USE CASE");

  // Left Actor Box
  slide.addShape(pres.ShapeType.roundRect, {
    x: 0.5, y: 1.15, w: 2.2, h: 3.95,
    fill: { color: BG_WHITE },
    line: { color: POP_CORAL, width: 1.5 },
    rectRadius: 0.15
  });
  slide.addShape(pres.ShapeType.ellipse, {
    x: 1.25, y: 1.4, w: 0.7, h: 0.7,
    fill: { color: BG_SOFT_PINK },
    line: { color: POP_CORAL, width: 1.5 }
  });
  slide.addText("👤", {
    x: 1.25, y: 1.4, w: 0.7, h: 0.7,
    fontSize: 18, align: "center", valign: "middle"
  });
  slide.addText("ACTOR:\nKHÁCH HÀNG\n(Customer)", {
    x: 0.6, y: 2.2, w: 2.0, h: 0.7,
    fontSize: 8.5, bold: true, color: POP_CORAL,
    align: "center", fontFace: FONT_HEADING
  });
  slide.addText([
    { text: "Vai trò:\n", options: { bold: true, color: TEXT_DARK } },
    { text: "• Khách vãng lai / Thành viên\n• Chọn phim, suất chiếu & ghế\n• Thanh toán trực tuyến\n• Nhận vé mã QR xem phim", options: { color: TEXT_BODY } }
  ], {
    x: 0.6, y: 3.0, w: 2.0, h: 1.9,
    fontSize: 7.2, lineSpacingMultiple: 1.15, fontFace: FONT_BODY
  });

  // Right: Diagram with Use Case Ovals & Relationships
  slide.addShape(pres.ShapeType.roundRect, {
    x: 2.9, y: 1.15, w: 6.6, h: 3.95,
    fill: { color: BG_WHITE },
    line: { color: "CBD5E1", width: 1.5 },
    rectRadius: 0.15
  });

  // Top sub-header
  slide.addShape(pres.ShapeType.roundRect, {
    x: 3.05, y: 1.25, w: 6.3, h: 0.3,
    fill: { color: BG_SOFT_PINK },
    line: { color: POP_CORAL, width: 1 },
    rectRadius: 0.08
  });
  slide.addText("🎟️ CÁC USE CASE KHÁCH HÀNG & QUAN HỆ <<INCLUDE>> / <<EXTEND>>", {
    x: 3.05, y: 1.25, w: 6.3, h: 0.3,
    fontSize: 7.8, bold: true, color: POP_CORAL,
    align: "center", valign: "middle", fontFace: FONT_HEADING
  });

  // 6 Use Case Ovals (2 Columns x 3 Rows)
  const customerUCs = [
    { name: "UC01: Xem Phim & Lịch Chiếu", tag: "Core", x: 3.1, y: 1.68, w: 2.9, h: 0.68, color: POP_SKY, bg: BG_SOFT_BLUE },
    { name: "UC02: Chọn & Khóa Ghế 10 Phút", tag: "Locking", x: 3.1, y: 2.48, w: 2.9, h: 0.68, color: POP_CORAL, bg: BG_SOFT_PINK },
    { name: "UC03: Thanh Toán Đơn Hàng", tag: "Payment", x: 3.1, y: 3.28, w: 2.9, h: 0.68, color: POP_SUNNY, bg: BG_SOFT_YELLOW },
    { name: "UC04: Xem & Quản Lý Vé QR", tag: "Ticket", x: 6.35, y: 1.68, w: 2.9, h: 0.68, color: POP_MINT, bg: BG_SOFT_GREEN },
    { name: "<<include>> Xác Thực / Session", tag: "Include", x: 6.35, y: 2.48, w: 2.9, h: 0.68, color: POP_INDIGO, bg: BG_SOFT_PURPLE },
    { name: "<<extend>> Áp Mã Giảm Giá", tag: "Extend", x: 6.35, y: 3.28, w: 2.9, h: 0.68, color: POP_PURPLE, bg: BG_SOFT_PURPLE }
  ];

  customerUCs.forEach(uc => {
    slide.addShape(pres.ShapeType.ellipse, {
      x: uc.x, y: uc.y, w: uc.w, h: uc.h,
      fill: { color: uc.bg },
      line: { color: uc.color, width: 1.2 }
    });
    slide.addText(uc.name, {
      x: uc.x + 0.1, y: uc.y, w: uc.w - 0.2, h: uc.h,
      fontSize: 7.2, bold: true, color: uc.color,
      align: "center", valign: "middle", fontFace: FONT_HEADING
    });
  });

  // Bottom relationship explanation bar
  slide.addShape(pres.ShapeType.roundRect, {
    x: 3.1, y: 4.08, w: 6.2, h: 0.88,
    fill: { color: "F8FAFC" },
    line: { color: "CBD5E1", width: 1 },
    rectRadius: 0.08
  });
  slide.addText([
    { text: "🔗 Mối quan hệ UML giữa các Use Case:\n", options: { bold: true, color: TEXT_DARK } },
    { text: "• ", options: { color: POP_CORAL, bold: true } },
    { text: "UC03 (Thanh Toán) ", options: { bold: true, color: TEXT_DARK } },
    { text: "--<<include>>--> ", options: { bold: true, color: POP_INDIGO } },
    { text: "UC02 (Khóa Ghế 10p): Bắt buộc phải khóa ghế trước khi tiến hành thanh toán.\n", options: { color: TEXT_BODY } },
    { text: "• ", options: { color: POP_PURPLE, bold: true } },
    { text: "<<extend>> Áp Mã Giảm Giá ", options: { bold: true, color: TEXT_DARK } },
    { text: "--<<extend>>--> ", options: { bold: true, color: POP_PURPLE } },
    { text: "UC03: Tùy chọn mở rộng khi khách hàng có Voucher/Mã khuyến mãi.", options: { color: TEXT_BODY } }
  ], {
    x: 3.25, y: 4.12, w: 5.9, h: 0.8,
    fontSize: 6.8, lineSpacingMultiple: 1.1, fontFace: FONT_BODY
  });

  slide.addNotes("Sơ đồ Use Case phân hệ Đặt vé thể hiện rõ luồng chính từ Chọn phim, Khóa ghế 10p, Thanh toán đến Nhận vé QR, kèm quan hệ include/extend.");
}

// =============================================================
// SLIDE 6: Sơ Đồ Use Case Phân Hệ Vận Hành & Kỹ Thuật (Staff & Tech)
// =============================================================
{
  const slide = pres.addSlide();
  addHeader(slide, "5. SƠ ĐỒ USE CASE: PHÂN HỆ VẬN HÀNH & KỸ THUẬT (STAFF / TECH)", "MÔ HÌNH HÓA USE CASE");

  // Left: 2 Actor Cards (Staff & Tech)
  slide.addShape(pres.ShapeType.roundRect, {
    x: 0.5, y: 1.15, w: 2.2, h: 1.9,
    fill: { color: BG_WHITE },
    line: { color: POP_SKY, width: 1.5 },
    rectRadius: 0.12
  });
  slide.addShape(pres.ShapeType.ellipse, {
    x: 1.35, y: 1.25, w: 0.5, h: 0.5,
    fill: { color: BG_SOFT_BLUE },
    line: { color: POP_SKY, width: 1.2 }
  });
  slide.addText("👔", { x: 1.35, y: 1.25, w: 0.5, h: 0.5, fontSize: 14, align: "center", valign: "middle" });
  slide.addText("ACTOR: NHÂN VIÊN (Staff)", {
    x: 0.6, y: 1.8, w: 2.0, h: 0.25,
    fontSize: 7.5, bold: true, color: POP_SKY, align: "center", fontFace: FONT_HEADING
  });
  slide.addText("• Trực ca theo lịch phân công\n• Kiểm tra phòng 9 tiêu chí\n• Báo cáo sự cố phòng/thiết bị", {
    x: 0.6, y: 2.08, w: 2.0, h: 0.9,
    fontSize: 6.8, color: TEXT_BODY, lineSpacingMultiple: 1.1, fontFace: FONT_BODY
  });

  slide.addShape(pres.ShapeType.roundRect, {
    x: 0.5, y: 3.18, w: 2.2, h: 1.9,
    fill: { color: BG_WHITE },
    line: { color: POP_PURPLE, width: 1.5 },
    rectRadius: 0.12
  });
  slide.addShape(pres.ShapeType.ellipse, {
    x: 1.35, y: 3.28, w: 0.5, h: 0.5,
    fill: { color: BG_SOFT_PURPLE },
    line: { color: POP_PURPLE, width: 1.2 }
  });
  slide.addText("🔧", { x: 1.35, y: 3.28, w: 0.5, h: 0.5, fontSize: 14, align: "center", valign: "middle" });
  slide.addText("ACTOR: KỸ THUẬT VIÊN (Tech)", {
    x: 0.6, y: 3.82, w: 2.0, h: 0.25,
    fontSize: 7.5, bold: true, color: POP_PURPLE, align: "center", fontFace: FONT_HEADING
  });
  slide.addText("• Tiếp nhận phiếu sự cố được giao\n• Sửa chữa & Khảo sát thiết bị\n• Ghi nhận linh kiện thay & chi phí", {
    x: 0.6, y: 4.1, w: 2.0, h: 0.9,
    fontSize: 6.8, color: TEXT_BODY, lineSpacingMultiple: 1.1, fontFace: FONT_BODY
  });

  // Right Card: Use Case Ovals & Business Rules
  slide.addShape(pres.ShapeType.roundRect, {
    x: 2.9, y: 1.15, w: 6.6, h: 3.95,
    fill: { color: BG_WHITE },
    line: { color: "CBD5E1", width: 1.5 },
    rectRadius: 0.15
  });

  slide.addShape(pres.ShapeType.roundRect, {
    x: 3.05, y: 1.25, w: 6.3, h: 0.3,
    fill: { color: BG_SOFT_PURPLE },
    line: { color: POP_PURPLE, width: 1 },
    rectRadius: 0.08
  });
  slide.addText("🔧 CÁC USE CASE VẬN HÀNH & QUY TRÌNH XỬ LÝ SỰ CỐ KHÉP KÍN", {
    x: 3.05, y: 1.25, w: 6.3, h: 0.3,
    fontSize: 7.8, bold: true, color: POP_PURPLE,
    align: "center", valign: "middle", fontFace: FONT_HEADING
  });

  // 6 Use Cases
  const opUCs = [
    { name: "UC05: Kiểm Tra Phòng 9 Tiêu Chí", x: 3.1, y: 1.68, w: 2.9, h: 0.68, color: POP_SKY, bg: BG_SOFT_BLUE },
    { name: "UC06: Báo Cáo Sự Cố Tức Thì", x: 3.1, y: 2.48, w: 2.9, h: 0.68, color: POP_CORAL, bg: BG_SOFT_PINK },
    { name: "UC07: Tiếp Nhận & Sửa Chữa", x: 3.1, y: 3.28, w: 2.9, h: 0.68, color: POP_PURPLE, bg: BG_SOFT_PURPLE },
    { name: "<<extend>> Tự Sinh Incident khi Fail", x: 6.35, y: 1.68, w: 2.9, h: 0.68, color: POP_CORAL, bg: BG_SOFT_PINK },
    { name: "<<include>> Ghi Linh Kiện & Chi Phí", x: 6.35, y: 2.48, w: 2.9, h: 0.68, color: POP_SUNNY, bg: BG_SOFT_YELLOW },
    { name: "UC08: Bảo Trì Thiết Bị Định Kỳ", x: 6.35, y: 3.28, w: 2.9, h: 0.68, color: POP_MINT, bg: BG_SOFT_GREEN }
  ];

  opUCs.forEach(uc => {
    slide.addShape(pres.ShapeType.ellipse, {
      x: uc.x, y: uc.y, w: uc.w, h: uc.h,
      fill: { color: uc.bg },
      line: { color: uc.color, width: 1.2 }
    });
    slide.addText(uc.name, {
      x: uc.x + 0.1, y: uc.y, w: uc.w - 0.2, h: uc.h,
      fontSize: 7.2, bold: true, color: uc.color,
      align: "center", valign: "middle", fontFace: FONT_HEADING
    });
  });

  // Bottom Note
  slide.addShape(pres.ShapeType.roundRect, {
    x: 3.1, y: 4.08, w: 6.2, h: 0.88,
    fill: { color: "F8FAFC" },
    line: { color: "CBD5E1", width: 1 },
    rectRadius: 0.08
  });
  slide.addText([
    { text: "⚡ Điểm sáng thiết kế Vận hành rạp:\n", options: { bold: true, color: TEXT_DARK } },
    { text: "• ", options: { color: POP_CORAL, bold: true } },
    { text: "Checklist 9 tiêu chuẩn: ", options: { bold: true, color: TEXT_DARK } },
    { text: "Nếu có mục Fail (Máy chiếu, Âm thanh, PCCC) -> Hệ thống tự động kích hoạt tạo 1 Incident mới (BR16).\n", options: { color: TEXT_BODY } },
    { text: "• ", options: { color: POP_MINT, bold: true } },
    { text: "Lưu vết Audit Log: ", options: { bold: true, color: TEXT_DARK } },
    { text: "Mọi thay đổi linh kiện, chi phí và biên bản bàn giao đều lưu vào bảng incident_histories.", options: { color: TEXT_BODY } }
  ], {
    x: 3.25, y: 4.12, w: 5.9, h: 0.8,
    fontSize: 6.8, lineSpacingMultiple: 1.1, fontFace: FONT_BODY
  });

  slide.addNotes("Sơ đồ Use Case Vận hành & Kỹ thuật thể hiện vòng đời sự cố từ Daily Checklist phát hiện lỗi đến phân công sửa chữa và bảo trì.");
}

// =============================================================
// SLIDE 7: Sơ Đồ Use Case Phân Hệ Quản Lý & Quản Trị (Manager & Admin)
// =============================================================
{
  const slide = pres.addSlide();
  addHeader(slide, "6. SƠ ĐỒ USE CASE: PHÂN HỆ QUẢN LÝ & QUẢN TRỊ (MANAGER / ADMIN)", "MÔ HÌNH HÓA USE CASE");

  // Left: 2 Actors
  slide.addShape(pres.ShapeType.roundRect, {
    x: 0.5, y: 1.15, w: 2.2, h: 1.9,
    fill: { color: BG_WHITE },
    line: { color: POP_SUNNY, width: 1.5 },
    rectRadius: 0.12
  });
  slide.addShape(pres.ShapeType.ellipse, {
    x: 1.35, y: 1.25, w: 0.5, h: 0.5,
    fill: { color: BG_SOFT_YELLOW },
    line: { color: POP_SUNNY, width: 1.2 }
  });
  slide.addText("💼", { x: 1.35, y: 1.25, w: 0.5, h: 0.5, fontSize: 14, align: "center", valign: "middle" });
  slide.addText("ACTOR: QUẢN LÝ RẠP (Manager)", {
    x: 0.6, y: 1.8, w: 2.0, h: 0.25,
    fontSize: 7.5, bold: true, color: POP_SUNNY, align: "center", fontFace: FONT_HEADING
  });
  slide.addText("• Lập lịch chiếu (Check xung đột)\n• Phân công KTV xử lý sự cố\n• Nghiệm thu & Đóng phiếu", {
    x: 0.6, y: 2.08, w: 2.0, h: 0.9,
    fontSize: 6.8, color: TEXT_BODY, lineSpacingMultiple: 1.1, fontFace: FONT_BODY
  });

  slide.addShape(pres.ShapeType.roundRect, {
    x: 0.5, y: 3.18, w: 2.2, h: 1.9,
    fill: { color: BG_WHITE },
    line: { color: POP_CORAL, width: 1.5 },
    rectRadius: 0.12
  });
  slide.addShape(pres.ShapeType.ellipse, {
    x: 1.35, y: 3.28, w: 0.5, h: 0.5,
    fill: { color: BG_SOFT_PINK },
    line: { color: POP_CORAL, width: 1.2 }
  });
  slide.addText("👑", { x: 1.35, y: 3.28, w: 0.5, h: 0.5, fontSize: 14, align: "center", valign: "middle" });
  slide.addText("ACTOR: QUẢN TRỊ VIÊN (Admin)", {
    x: 0.6, y: 3.82, w: 2.0, h: 0.25,
    fontSize: 7.5, bold: true, color: POP_CORAL, align: "center", fontFace: FONT_HEADING
  });
  slide.addText("• Quản lý Users & Phân quyền RBAC\n• Quản lý hạ tầng Phòng & Thiết bị\n• Xem Dashboard & Báo cáo tài chính", {
    x: 0.6, y: 4.1, w: 2.0, h: 0.9,
    fontSize: 6.8, color: TEXT_BODY, lineSpacingMultiple: 1.1, fontFace: FONT_BODY
  });

  // Right Card: Use Cases
  slide.addShape(pres.ShapeType.roundRect, {
    x: 2.9, y: 1.15, w: 6.6, h: 3.95,
    fill: { color: BG_WHITE },
    line: { color: "CBD5E1", width: 1.5 },
    rectRadius: 0.15
  });

  slide.addShape(pres.ShapeType.roundRect, {
    x: 3.05, y: 1.25, w: 6.3, h: 0.3,
    fill: { color: BG_SOFT_YELLOW },
    line: { color: POP_SUNNY, width: 1 },
    rectRadius: 0.08
  });
  slide.addText("💼 CÁC USE CASE QUẢN LÝ RẠP, ĐIỀU PHỐI & QUẢN TRỊ HỆ THỐNG", {
    x: 3.05, y: 1.25, w: 6.3, h: 0.3,
    fontSize: 7.8, bold: true, color: "B45309",
    align: "center", valign: "middle", fontFace: FONT_HEADING
  });

  // 6 Use Cases
  const mgmtUCs = [
    { name: "UC09: Lập Lịch Chiếu (Check BR01)", x: 3.1, y: 1.68, w: 2.9, h: 0.68, color: POP_SUNNY, bg: BG_SOFT_YELLOW },
    { name: "UC10: Phân Công KTV Sửa Chữa", x: 3.1, y: 2.48, w: 2.9, h: 0.68, color: POP_PURPLE, bg: BG_SOFT_PURPLE },
    { name: "UC11: Nghiệm Thu & Đóng Sự Cố", x: 3.1, y: 3.28, w: 2.9, h: 0.68, color: POP_MINT, bg: BG_SOFT_GREEN },
    { name: "<<include>> Check Ràng Buộc BR02/03", x: 6.35, y: 1.68, w: 2.9, h: 0.68, color: POP_CORAL, bg: BG_SOFT_PINK },
    { name: "UC14: Quản Lý Người Dùng & RBAC", x: 6.35, y: 2.48, w: 2.9, h: 0.68, color: POP_SKY, bg: BG_SOFT_BLUE },
    { name: "UC16: Dashboard Thống Kê & Doanh Thu", x: 6.35, y: 3.28, w: 2.9, h: 0.68, color: POP_INDIGO, bg: BG_SOFT_PURPLE }
  ];

  mgmtUCs.forEach(uc => {
    slide.addShape(pres.ShapeType.ellipse, {
      x: uc.x, y: uc.y, w: uc.w, h: uc.h,
      fill: { color: uc.bg },
      line: { color: uc.color, width: 1.2 }
    });
    slide.addText(uc.name, {
      x: uc.x + 0.1, y: uc.y, w: uc.w - 0.2, h: uc.h,
      fontSize: 7.2, bold: true, color: uc.color,
      align: "center", valign: "middle", fontFace: FONT_HEADING
    });
  });

  // Bottom Note
  slide.addShape(pres.ShapeType.roundRect, {
    x: 3.1, y: 4.08, w: 6.2, h: 0.88,
    fill: { color: "F8FAFC" },
    line: { color: "CBD5E1", width: 1 },
    rectRadius: 0.08
  });
  slide.addText([
    { text: "🔒 Ràng buộc nghiệp vụ quản trị:\n", options: { bold: true, color: TEXT_DARK } },
    { text: "• ", options: { color: POP_SUNNY, bold: true } },
    { text: "BR01 - Tránh trùng lịch: ", options: { bold: true, color: TEXT_DARK } },
    { text: "Tự động cộng thêm 15 phút dọn phòng vệ sinh; chặn hoàn toàn xung đột khung giờ.\n", options: { color: TEXT_BODY } },
    { text: "• ", options: { color: POP_CORAL, bold: true } },
    { text: "BR14 - Thẩm quyền đóng phiếu: ", options: { bold: true, color: TEXT_DARK } },
    { text: "Chỉ Manager/Admin mới có quyền nghiệm thu và đóng sự cố sang trạng thái 'closed'.", options: { color: TEXT_BODY } }
  ], {
    x: 3.25, y: 4.12, w: 5.9, h: 0.8,
    fontSize: 6.8, lineSpacingMultiple: 1.1, fontFace: FONT_BODY
  });

  slide.addNotes("Sơ đồ Use Case Quản lý & Quản trị mô tả các chức năng cốt lõi của Manager và Admin trong việc vận hành rạp và bảo vệ an ninh hệ thống.");
}

// =============================================================
// SLIDE 8: Bảng Đặc Tả Chi Tiết 3 Use Case Cốt Lõi (Specification Table)
// =============================================================
{
  const slide = pres.addSlide();
  addHeader(slide, "7. ĐẶC TẢ CHI TIẾT CÁC USE CASE CỐT LÕI (USE CASE SPECIFICATIONS)", "MÔ HÌNH HÓA USE CASE");

  const specRows = [
    [
      { text: "Mã & Tên Use Case", options: { bold: true, color: TEXT_DARK, fill: BG_SOFT_YELLOW } },
      { text: "Tác Nhân", options: { bold: true, color: TEXT_DARK, fill: BG_SOFT_YELLOW } },
      { text: "Tiền Điều Kiện", options: { bold: true, color: TEXT_DARK, fill: BG_SOFT_YELLOW } },
      { text: "Luồng Sự Kiện Chính (Main Flow)", options: { bold: true, color: TEXT_DARK, fill: BG_SOFT_YELLOW } },
      { text: "Hậu Điều Kiện", options: { bold: true, color: TEXT_DARK, fill: BG_SOFT_YELLOW } }
    ],
    [
      { text: "UC-HOLD\nChọn & Khóa Giữ Ghế 10 Phút", options: { bold: true, color: POP_CORAL } },
      { text: "🍿 Khách Hàng (Customer)", options: { bold: true, color: POP_CORAL } },
      { text: "Khách đã chọn phim & suất chiếu hợp lệ trong tương lai.", options: { color: TEXT_BODY } },
      { text: "1. Khách click chọn ghế.\n2. Server mở Transaction & Row Lock (SELECT FOR UPDATE).\n3. Ghi nhận 'holding' + hạn 10 phút.\n4. Client kích hoạt đếm ngược 10:00.", options: { color: TEXT_BODY } },
      { text: "Ghế bị khóa với người khác (🔵). Tự động nhả nếu quá 10 phút.", options: { bold: true, color: TEXT_DARK } }
    ],
    [
      { text: "UC-CHK\nKiểm Tra Phòng 9 Tiêu Chí", options: { bold: true, color: POP_SKY } },
      { text: "📋 Nhân Viên (Staff)", options: { bold: true, color: POP_SKY } },
      { text: "Nhân viên nhận ca trực, kiểm tra phòng trước giờ mở cửa.", options: { color: TEXT_BODY } },
      { text: "1. Staff mở Checklist 9 hạng mục.\n2. Đánh giá Pass / Fail từng mục.\n3. Nếu có mục Fail -> Tự động sinh Incident.\n4. Lưu phiếu kiểm tra phòng.", options: { color: TEXT_BODY } },
      { text: "Bản ghi lưu vết đầy đủ. Manager nhận thông báo tức thì.", options: { bold: true, color: TEXT_DARK } }
    ],
    [
      { text: "UC-INC\nPhân Công & Xử Lý Sự Cố", options: { bold: true, color: POP_PURPLE } },
      { text: "👔 Manager &\n🔧 Technician", options: { bold: true, color: POP_PURPLE } },
      { text: "Hệ thống ghi nhận sự cố mới (status = 'new').", options: { color: TEXT_BODY } },
      { text: "1. Manager gán KTV phụ trách.\n2. KTV khảo sát & sửa chữa thiết bị.\n3. KTV cập nhật linh kiện và chi phí.\n4. Manager nghiệm thu & đóng sự cố.", options: { color: TEXT_BODY } },
      { text: "Sự cố chuyển 'closed'. Phòng & thiết bị trở lại 'active'.", options: { bold: true, color: TEXT_DARK } }
    ]
  ];

  slide.addTable(specRows, {
    x: 0.5, y: 1.15, w: 9.0,
    colW: [1.8, 1.3, 1.8, 2.5, 1.6],
    fontSize: 7.5,
    border: { pt: 0.8, color: "CBD5E1" },
    fill: BG_WHITE,
    margin: 0.05,
    valign: "middle"
  });

  slide.addNotes("Bảng đặc tả Use Case chuẩn hóa rõ ràng các luồng sự kiện chính, tác nhân, tiền điều kiện và hậu điều kiện.");
}

// =============================================================
// SLIDE 9: Activity Diagram 1 - Đặt Vé & Giữ Ghế 10 Phút
// =============================================================
{
  const slide = pres.addSlide();
  addHeader(slide, "8. ACTIVITY DIAGRAM: QUY TRÌNH ĐẶT VÉ & KHÓA GIỮ GHẾ 10 PHÚT", "MÔ HÌNH HÓA HOẠT ĐỘNG");

  // 5 Step cards perfectly filling 9.0 inches
  const steps = [
    { num: "01", title: "Duyệt & Chọn Suất", desc: "Khách chọn Phim, Rạp, Ngày & Khung giờ phù hợp trên giao diện", color: POP_SKY, bg: BG_SOFT_BLUE },
    { num: "02", title: "Tải Sơ Đồ Ghế", desc: "Tải sơ đồ ghế thời gian thực (🟢 Trống, 🔵 Đang giữ, 🔴 Đã bán)", color: POP_SKY, bg: BG_SOFT_BLUE },
    { num: "03", title: "Khóa Ghế 10 Phút", desc: "Gửi API giữ ghế -> Backend mở Transaction Lock -> Ghi nhận 🔵 Đang Giữ", color: POP_SUNNY, bg: BG_SOFT_YELLOW },
    { num: "04", title: "Đếm Ngược 10:00", desc: "Đồng hồ đếm ngược 10:00 bật. Khách chọn hình thức thanh toán", color: POP_PURPLE, bg: BG_SOFT_PURPLE },
    { num: "05", title: "Thanh Toán & Vé QR", desc: "Thành công -> Chuyển 🔴 Đã Đặt, sinh mã vé TCK & hiển thị QR Code", color: POP_MINT, bg: BG_SOFT_GREEN }
  ];

  steps.forEach((st, idx) => {
    const xPos = 0.5 + idx * 1.83;
    slide.addShape(pres.ShapeType.roundRect, {
      x: xPos, y: 1.15, w: 1.68, h: 2.95,
      fill: { color: BG_WHITE },
      line: { color: st.color, width: 1.5 },
      rectRadius: 0.15
    });

    slide.addShape(pres.ShapeType.roundRect, {
      x: xPos + 0.1, y: 1.25, w: 1.48, h: 0.38,
      fill: { color: st.bg },
      line: { color: st.color, width: 1 },
      rectRadius: 0.1
    });
    slide.addText(`BƯỚC ${st.num}`, {
      x: xPos + 0.1, y: 1.25, w: 1.48, h: 0.38,
      fontSize: 9, bold: true, color: st.color,
      align: "center", valign: "middle", fontFace: FONT_HEADING
    });

    slide.addText(st.title, {
      x: xPos + 0.08, y: 1.7, w: 1.52, h: 0.45,
      fontSize: 8.5, bold: true, color: TEXT_DARK,
      align: "center", fontFace: FONT_HEADING
    });

    slide.addText(st.desc, {
      x: xPos + 0.08, y: 2.2, w: 1.52, h: 1.8,
      fontSize: 7.2, color: TEXT_BODY,
      align: "center", lineSpacingMultiple: 1.15, fontFace: FONT_BODY
    });
  });

  // Bottom Exception Box
  slide.addShape(pres.ShapeType.roundRect, {
    x: 0.5, y: 4.25, w: 9.0, h: 0.85,
    fill: { color: BG_WHITE },
    line: { color: POP_CORAL, width: 1.2 },
    rectRadius: 0.12
  });
  slide.addShape(pres.ShapeType.roundRect, {
    x: 0.65, y: 4.33, w: 3.5, h: 0.25,
    fill: { color: BG_SOFT_PINK },
    line: { color: POP_CORAL, width: 1 },
    rectRadius: 0.08
  });
  slide.addText("⏰ NẾU QUÁ 10 PHÚT CHƯA THANH TOÁN THÌ SAO?", {
    x: 0.65, y: 4.33, w: 3.5, h: 0.25,
    fontSize: 7.2, bold: true, color: POP_CORAL,
    align: "center", valign: "middle", fontFace: FONT_HEADING
  });
  slide.addText("• Background Cleanup Worker quét ngầm mỗi 30s sẽ tự động đổi trạng thái ghế sang 'released' -> Mở lại trạng thái Trống (🟢) cho các khách hàng khác đặt vé ngay tức khắc mà không bị kẹt ghế!", {
    x: 0.65, y: 4.62, w: 8.7, h: 0.42,
    fontSize: 7.2, color: TEXT_BODY, fontFace: FONT_BODY
  });

  slide.addNotes("Biểu đồ hoạt động đặt vé làm rõ 5 bước cùng cơ chế giải phóng ghế tự động sau 10 phút.");
}

// =============================================================
// SLIDE 10: Activity Diagram 2 - Kiểm Tra Phòng & Vòng Đời Sự Cố (3 Làn Swimlanes)
// =============================================================
{
  const slide = pres.addSlide();
  addHeader(slide, "9. ACTIVITY DIAGRAM: KIỂM TRA PHÒNG & VÒNG ĐỜI SỰ CỐ (3 LÀN)", "MÔ HÌNH HÓA HOẠT ĐỘNG");

  const lanes = [
    {
      role: "📋 LÀN 1: NHÂN VIÊN (STAFF)",
      color: POP_SKY, bg: BG_SOFT_BLUE,
      x: 0.5, y: 1.15, w: 2.86, h: 3.95,
      steps: [
        "1. Bắt đầu ca trực tại phòng chiếu",
        "2. Mở Daily Checklist 9 hạng mục:\n  (Máy chiếu, Âm thanh, Điều hòa, Ghế ngồi, Đèn, Màn chiếu, Thoát hiểm, Vệ sinh, PCCC)",
        "3. Đánh giá từng mục: Pass / Fail",
        "4. Nếu có mục Fail -> Tự động tạo Báo cáo sự cố (Incident)",
        "5. Lưu kết quả kiểm tra phòng"
      ]
    },
    {
      role: "👔 LÀN 2: QUẢN LÝ RẠP (MANAGER)",
      color: POP_SUNNY, bg: BG_SOFT_YELLOW,
      x: 3.56, y: 1.15, w: 2.86, h: 3.95,
      steps: [
        "1. Nhận thông báo sự cố mới trên Dashboard",
        "2. Đánh giá mức độ: Low / Med / High / Critical",
        "3. Tạm dừng mở bán suất chiếu nếu thiết bị trọng yếu hỏng (BR03)",
        "4. Phân công Kỹ thuật viên phụ trách",
        "5. Kiểm tra sau khi sửa -> Nghiệm thu và Đóng sự cố (status = 'closed')"
      ]
    },
    {
      role: "🔧 LÀN 3: KỸ THUẬT VIÊN (TECH)",
      color: POP_PURPLE, bg: BG_SOFT_PURPLE,
      x: 6.62, y: 1.15, w: 2.86, h: 3.95,
      steps: [
        "1. Nhận thông báo nhiệm vụ sửa chữa",
        "2. Tiếp nhận phiếu (status = 'accepted')",
        "3. Khảo sát hiện trường & Thiết bị",
        "4. Tiến hành sửa chữa / Thay linh kiện",
        "5. Cập nhật kết quả: Nguyên nhân, linh kiện thay thế, chi phí (cost)",
        "6. Báo cáo hoàn tất (status = 'resolved')"
      ]
    }
  ];

  lanes.forEach(l => {
    slide.addShape(pres.ShapeType.roundRect, {
      x: l.x, y: l.y, w: l.w, h: l.h,
      fill: { color: BG_WHITE },
      line: { color: l.color, width: 1.5 },
      rectRadius: 0.15
    });

    slide.addShape(pres.ShapeType.roundRect, {
      x: l.x + 0.1, y: l.y + 0.1, w: l.w - 0.2, h: 0.32,
      fill: { color: l.bg },
      line: { color: l.color, width: 1 },
      rectRadius: 0.08
    });
    slide.addText(l.role, {
      x: l.x + 0.1, y: l.y + 0.1, w: l.w - 0.2, h: 0.32,
      fontSize: 8.0, bold: true, color: l.color,
      align: "center", valign: "middle", fontFace: FONT_HEADING
    });

    const items = l.steps.map(s => ({ text: `${s}\n\n`, options: { color: TEXT_BODY } }));
    slide.addText(items, {
      x: l.x + 0.15, y: l.y + 0.5, w: l.w - 0.3, h: l.h - 0.6,
      fontSize: 7.2, lineSpacingMultiple: 1.1, fontFace: FONT_BODY
    });
  });

  slide.addNotes("Mô hình 3 làn (Swimlanes) thể hiện sự phối hợp nhịp nhàng giữa Nhân viên, Quản lý rạp và Kỹ thuật viên.");
}

// =============================================================
// SLIDE 11: Activity Diagram 3 - Lập Lịch Chiếu & Check Xung Đột (BR01)
// =============================================================
{
  const slide = pres.addSlide();
  addHeader(slide, "10. ACTIVITY DIAGRAM: LẬP LỊCH CHIẾU & KIỂM TRA RÀNG BUỘC (BR01)", "MÔ HÌNH HÓA HOẠT ĐỘNG");

  const cards = [
    {
      num: "01", title: "CHỌN PHIM & PHÒNG", color: POP_SKY, bg: BG_SOFT_BLUE,
      desc: "Quản lý chọn Phim, Phòng chiếu, Ngày và Giờ bắt đầu (start_time).",
      x: 0.5, y: 1.15, w: 2.1, h: 2.3
    },
    {
      num: "02", title: "TÍNH END_TIME (+15P)", color: POP_SUNNY, bg: BG_SOFT_YELLOW,
      desc: "Hệ thống tự động tính:\nend_time = start_time + duration + 15 phút dọn phòng.",
      x: 2.8, y: 1.15, w: 2.1, h: 2.3
    },
    {
      num: "03", title: "KIỂM TRA 3 RÀNG BUỘC", color: POP_CORAL, bg: BG_SOFT_PINK,
      desc: "1. Phòng đang active?\n2. Máy chiếu/âm thanh Good?\n3. Không trùng giờ suất khác?",
      x: 5.1, y: 1.15, w: 2.1, h: 2.3
    },
    {
      num: "04", title: "XÁC NHẬN / BÁO LỖI", color: POP_MINT, bg: BG_SOFT_GREEN,
      desc: "• Hợp lệ: Lưu Schedule (🟢)\n• Vi phạm: Báo lỗi 400 và từ chối lưu lịch (⛔).",
      x: 7.4, y: 1.15, w: 2.1, h: 2.3
    }
  ];

  cards.forEach(c => {
    slide.addShape(pres.ShapeType.roundRect, {
      x: c.x, y: c.y, w: c.w, h: c.h,
      fill: { color: BG_WHITE },
      line: { color: c.color, width: 1.5 },
      rectRadius: 0.12
    });
    slide.addShape(pres.ShapeType.roundRect, {
      x: c.x + 0.1, y: c.y + 0.1, w: c.w - 0.2, h: 0.35,
      fill: { color: c.bg },
      line: { color: c.color, width: 1 },
      rectRadius: 0.08
    });
    slide.addText(`BƯỚC ${c.num}: ${c.title}`, {
      x: c.x + 0.1, y: c.y + 0.1, w: c.w - 0.2, h: 0.35,
      fontSize: 7.2, bold: true, color: c.color,
      align: "center", valign: "middle", fontFace: FONT_HEADING
    });
    slide.addText(c.desc, {
      x: c.x + 0.15, y: c.y + 0.55, w: c.w - 0.3, h: c.h - 0.65,
      fontSize: 7.5, color: TEXT_BODY,
      lineSpacingMultiple: 1.15, fontFace: FONT_BODY
    });
  });

  // Bottom Detail Logic Table
  const ruleRows = [
    [
      { text: "Ràng Buộc Nghiệp Vụ", options: { bold: true, color: TEXT_DARK, fill: BG_SOFT_YELLOW } },
      { text: "Điều Kiện Kiểm Tra Trong CSDL", options: { bold: true, color: TEXT_DARK, fill: BG_SOFT_YELLOW } },
      { text: "Hành Động Khi Vi Phạm", options: { bold: true, color: TEXT_DARK, fill: BG_SOFT_YELLOW } }
    ],
    [
      { text: "BR01: Tránh Xung Đột Khung Giờ", options: { bold: true, color: POP_CORAL } },
      { text: "WHERE room_id = ? AND (start_time < new_end AND end_time > new_start)", options: { fontFace: FONT_CODE, fontSize: 6.8, color: POP_SKY } },
      { text: "⛔ Báo lỗi: 'Phòng đã có suất chiếu trong khung giờ này (+15p dọn phòng)'.", options: { color: TEXT_BODY } }
    ],
    [
      { text: "BR02: Phòng Đang Sửa Chữa", options: { bold: true, color: POP_SUNNY } },
      { text: "SELECT status FROM cinema_rooms WHERE id = ? (status != 'active')", options: { fontFace: FONT_CODE, fontSize: 6.8, color: POP_SUNNY } },
      { text: "⛔ Báo lỗi: 'Phòng chiếu đang bảo trì hoặc gặp sự cố kỹ thuật'.", options: { color: TEXT_BODY } }
    ],
    [
      { text: "BR03: Thiết Bị Trọng Yếu Hỏng", options: { bold: true, color: POP_PURPLE } },
      { text: "SELECT * FROM equipment WHERE room_id = ? AND status IN ('broken', 'repairing')", options: { fontFace: FONT_CODE, fontSize: 6.8, color: POP_PURPLE } },
      { text: "⛔ Báo lỗi: 'Máy chiếu hoặc âm thanh phòng chiếu đang hỏng'.", options: { color: TEXT_BODY } }
    ]
  ];

  slide.addTable(ruleRows, {
    x: 0.5, y: 3.6, w: 9.0,
    colW: [2.5, 3.8, 2.7],
    fontSize: 7.0,
    border: { pt: 0.8, color: "CBD5E1" },
    fill: BG_WHITE,
    margin: 0.04,
    valign: "middle"
  });

  slide.addNotes("Quy trình lập lịch chiếu được bảo vệ nghiêm ngặt bởi 3 quy tắc nghiệp vụ BR01, BR02 và BR03.");
}

// =============================================================
// SLIDE 12: Activity Diagram 4 - Lập Kế Hoạch & Bảo Trì Thiết Bị
// =============================================================
{
  const slide = pres.addSlide();
  addHeader(slide, "11. ACTIVITY DIAGRAM: LẬP KẾ HOẠCH & BẢO TRÌ THIẾT BỊ ĐỊNH KỲ", "MÔ HÌNH HÓA HOẠT ĐỘNG");

  const maintSteps = [
    { num: "01", role: "Quản Lý Rạp", title: "Lập Kế Hoạch Bảo Trì", desc: "Tạo phiếu bảo trì (định kỳ/đột xuất), gán thiết bị, ngày dự kiến và KTV.", color: POP_SKY, bg: BG_SOFT_BLUE },
    { num: "02", role: "Hệ Thống", title: "Lưu Trạng Thái 'Planned'", desc: "Ghi nhận vào bảng `maintenances`, bắn notification cho Kỹ thuật viên.", color: POP_SUNNY, bg: BG_SOFT_YELLOW },
    { num: "03", role: "Kỹ Thuật Viên", title: "Tiến Hành Bảo Dưỡng", desc: "Chuyển 'in_progress', kiểm tra thiết bị: bóng đèn chiếu, lọc bụi, loa, âm li.", color: POP_PURPLE, bg: BG_SOFT_PURPLE },
    { num: "04", role: "Kỹ Thuật Viên", title: "Ghi Nhận Kết Quả", desc: "Đánh giá Good/Fair/Broken, ghi chi phí thực tế và linh kiện thay thế.", color: POP_CORAL, bg: BG_SOFT_PINK },
    { num: "05", role: "Hệ Thống", title: "Cập Nhật Next Date", desc: "Chuyển 'completed', tự động cập nhật last_maintenance và next_maintenance.", color: POP_MINT, bg: BG_SOFT_GREEN }
  ];

  maintSteps.forEach((ms, idx) => {
    const xPos = 0.5 + idx * 1.83;
    slide.addShape(pres.ShapeType.roundRect, {
      x: xPos, y: 1.15, w: 1.68, h: 2.95,
      fill: { color: BG_WHITE },
      line: { color: ms.color, width: 1.5 },
      rectRadius: 0.15
    });

    slide.addShape(pres.ShapeType.roundRect, {
      x: xPos + 0.1, y: 1.25, w: 1.48, h: 0.38,
      fill: { color: ms.bg },
      line: { color: ms.color, width: 1 },
      rectRadius: 0.1
    });
    slide.addText(`BƯỚC ${ms.num}`, {
      x: xPos + 0.1, y: 1.25, w: 1.48, h: 0.38,
      fontSize: 9, bold: true, color: ms.color,
      align: "center", valign: "middle", fontFace: FONT_HEADING
    });

    slide.addText(ms.title, {
      x: xPos + 0.08, y: 1.7, w: 1.52, h: 0.45,
      fontSize: 8.2, bold: true, color: TEXT_DARK,
      align: "center", fontFace: FONT_HEADING
    });

    slide.addText(ms.desc, {
      x: xPos + 0.08, y: 2.2, w: 1.52, h: 1.8,
      fontSize: 7.2, color: TEXT_BODY,
      align: "center", lineSpacingMultiple: 1.15, fontFace: FONT_BODY
    });
  });

  // Bottom Summary Box
  slide.addShape(pres.ShapeType.roundRect, {
    x: 0.5, y: 4.25, w: 9.0, h: 0.85,
    fill: { color: BG_WHITE },
    line: { color: POP_MINT, width: 1.2 },
    rectRadius: 0.12
  });
  slide.addShape(pres.ShapeType.roundRect, {
    x: 0.65, y: 4.33, w: 3.5, h: 0.25,
    fill: { color: BG_SOFT_GREEN },
    line: { color: POP_MINT, width: 1 },
    rectRadius: 0.08
  });
  slide.addText("🛡️ HIỆU QUẢ QUẢN TRỊ THIẾT BỊ RẠP", {
    x: 0.65, y: 4.33, w: 3.5, h: 0.25,
    fontSize: 7.2, bold: true, color: POP_MINT,
    align: "center", valign: "middle", fontFace: FONT_HEADING
  });
  slide.addText("• Giúp kéo dài tuổi thọ máy chiếu laser & hệ thống âm thanh vòm Dolby Atmos, giảm 90% sự cố đột xuất làm gián đoạn trải nghiệm của khán giả.", {
    x: 0.65, y: 4.62, w: 8.7, h: 0.42,
    fontSize: 7.2, color: TEXT_BODY, fontFace: FONT_BODY
  });

  slide.addNotes("Quy trình bảo trì định kỳ đảm bảo thiết bị rạp luôn đạt trạng thái hoạt động tốt nhất.");
}

// =============================================================
// SLIDE 13: Sequence Diagram 1 - Concurrency Chống Trùng Ghế
// =============================================================
{
  const slide = pres.addSlide();
  addHeader(slide, "12. SEQUENCE DIAGRAM: GIẢI THUẬT CHỐNG TRÙNG GHẾ ĐA LUỒNG", "MÔ HÌNH HÓA TƯƠNG TÁC");

  // Left card: Tình huống
  slide.addShape(pres.ShapeType.roundRect, {
    x: 0.5, y: 1.15, w: 3.5, h: 3.95,
    fill: { color: BG_WHITE },
    line: { color: POP_CORAL, width: 1.5 },
    rectRadius: 0.15
  });
  slide.addShape(pres.ShapeType.roundRect, {
    x: 0.65, y: 1.25, w: 3.2, h: 0.32,
    fill: { color: BG_SOFT_PINK },
    line: { color: POP_CORAL, width: 1 },
    rectRadius: 0.08
  });
  slide.addText("⚡ TÌNH HUỐNG TRANH CHẤP GHẾ", {
    x: 0.65, y: 1.25, w: 3.2, h: 0.32,
    fontSize: 8.2, bold: true, color: POP_CORAL,
    align: "center", valign: "middle", fontFace: FONT_HEADING
  });
  slide.addText([
    { text: "Hai bạn Khách A & Khách B cùng click chọn ghế ", options: { color: TEXT_BODY } },
    { text: "C5", options: { bold: true, color: POP_CORAL } },
    { text: " trong cùng 1 mili-giây.\n\n", options: { color: TEXT_BODY } },
    { text: "🛡️ GIẢI PHÁP BACKEND:\n", options: { bold: true, color: POP_SKY } },
    { text: "1. Mở MySQL Transaction.\n", options: { color: TEXT_BODY } },
    { text: "2. Khóa dòng dữ liệu (Row-Level Lock):\n", options: { color: TEXT_BODY } },
    { text: "   SELECT * FROM booking_seats\n   WHERE seat_id = C5 FOR UPDATE;\n", options: { fontFace: FONT_CODE, fontSize: 6.8, color: POP_MINT, bold: true } },
    { text: "3. Khách A đến trước (0.01s): Giữ ghế thành công (200 OK).\n", options: { color: TEXT_BODY } },
    { text: "4. Khách B đến sau: Phát hiện C5 bị khóa -> Rollback và báo 409 Conflict.", options: { color: TEXT_BODY } }
  ], {
    x: 0.65, y: 1.65, w: 3.2, h: 3.3,
    fontSize: 7.2, lineSpacingMultiple: 1.15, fontFace: FONT_BODY
  });

  // Right card: Sequence Steps Table
  slide.addShape(pres.ShapeType.roundRect, {
    x: 4.2, y: 1.15, w: 5.3, h: 3.95,
    fill: { color: BG_WHITE },
    line: { color: POP_SKY, width: 1.5 },
    rectRadius: 0.15
  });
  slide.addShape(pres.ShapeType.roundRect, {
    x: 4.35, y: 1.25, w: 5.0, h: 0.32,
    fill: { color: BG_SOFT_BLUE },
    line: { color: POP_SKY, width: 1 },
    rectRadius: 0.08
  });
  slide.addText("📊 TRÌNH TỰ TƯƠNG TÁC (SEQUENCE FLOW)", {
    x: 4.35, y: 1.25, w: 5.0, h: 0.32,
    fontSize: 8.2, bold: true, color: POP_SKY,
    align: "center", valign: "middle", fontFace: FONT_HEADING
  });

  const seqSteps = [
    { step: "1", from: "Khách A", to: "API", action: "POST /hold { seat: 'C5' }", result: "Request A" },
    { step: "2", from: "API", to: "MySQL", action: "START TRANSACTION -> SELECT FOR UPDATE", result: "Khóa C5" },
    { step: "3", from: "MySQL", to: "API", action: "C5 trống -> INSERT 'holding' 10p", result: "Commit" },
    { step: "4", from: "API", to: "Khách A", action: "200 OK -> Bắt đầu đếm ngược 10:00", result: "✅ Thành công" },
    { step: "5", from: "Khách B", to: "API", action: "POST /hold { seat: 'C5' } (+0.05s)", result: "Request B" },
    { step: "6", from: "API", to: "MySQL", action: "SELECT FOR UPDATE -> Thấy C5 đang giữ", result: "Rollback" },
    { step: "7", from: "API", to: "Khách B", action: "409 Conflict: 'Ghế vừa có người giữ'", result: "⛔ Từ chối" }
  ];

  const seqRows = [
    [
      { text: "STT", options: { bold: true, color: TEXT_DARK, fill: BG_SOFT_YELLOW } },
      { text: "Từ -> Đến", options: { bold: true, color: TEXT_DARK, fill: BG_SOFT_YELLOW } },
      { text: "Thông điệp (Message / SQL)", options: { bold: true, color: TEXT_DARK, fill: BG_SOFT_YELLOW } },
      { text: "Kết quả", options: { bold: true, color: TEXT_DARK, fill: BG_SOFT_YELLOW } }
    ],
    ...seqSteps.map(s => [
      { text: s.step, options: { bold: true, color: TEXT_DARK } },
      { text: `${s.from} -> ${s.to}`, options: { color: POP_SKY, fontSize: 6.8 } },
      { text: s.action, options: { color: TEXT_BODY, fontSize: 6.8 } },
      { text: s.result, options: { bold: true, color: s.result.includes("Từ chối") ? POP_CORAL : POP_MINT, fontSize: 6.8 } }
    ])
  ];

  slide.addTable(seqRows, {
    x: 4.35, y: 1.65, w: 5.0,
    colW: [0.4, 1.4, 2.2, 1.0],
    fontSize: 6.8,
    border: { pt: 0.8, color: "CBD5E1" },
    fill: BG_WHITE,
    margin: 0.04,
    valign: "middle"
  });

  slide.addNotes("Biểu đồ Sequence chứng minh giải pháp chống trùng ghế bằng MySQL InnoDB Row-Level Locking.");
}

// =============================================================
// SLIDE 14: Sequence Diagram 2 - Thanh Toán & Xuất Vé QR
// =============================================================
{
  const slide = pres.addSlide();
  addHeader(slide, "13. SEQUENCE DIAGRAM: THANH TOÁN & XUẤT VÉ ĐIỆN TỬ QR", "MÔ HÌNH HÓA TƯƠNG TÁC");

  const cards = [
    {
      title: "1. KIỂM TRA HẠN 10 PHÚT",
      color: POP_SUNNY, bg: BG_SOFT_YELLOW,
      desc: "Client gửi bookingId.\nServer kiểm tra: hold_expire >= NOW().\nNếu hết hạn: Báo lỗi & hủy đơn.",
      x: 0.5, y: 1.15, w: 2.86, h: 1.9
    },
    {
      title: "2. THANH TOÁN MÔ PHỎNG",
      color: POP_SKY, bg: BG_SOFT_BLUE,
      desc: "Mô phỏng VNPAY / MoMo / Thẻ.\nGhi nhận vào `payments` với trạng thái 'success' và mã giao dịch.",
      x: 3.56, y: 1.15, w: 2.86, h: 1.9
    },
    {
      title: "3. CHUYỂN TRẠNG THÁI 'BOOKED'",
      color: POP_PURPLE, bg: BG_SOFT_PURPLE,
      desc: "Transaction cập nhật đồng thời:\n• `bookings.status` -> 'paid'\n• `booking_seats.status` -> 'booked'",
      x: 6.62, y: 1.15, w: 2.86, h: 1.9
    },
    {
      title: "4. SINH MÃ VÉ TCK-xxx & QR CODE",
      color: POP_MINT, bg: BG_SOFT_GREEN,
      desc: "Tạo bản ghi `tickets` cho từng ghế.\nSinh mã định danh TCK-YYYYMMDD-ID kèm chuỗi hash mã QR Code bảo mật.",
      x: 0.5, y: 3.2, w: 4.35, h: 1.9
    },
    {
      title: "5. BẮN PHÁO HOA & HIỂN THỊ VÉ ĐIỆN TỬ",
      color: POP_CORAL, bg: BG_SOFT_PINK,
      desc: "Client nhận 200 OK -> Hiệu ứng Canvas Confetti chúc mừng -> Hiển thị Modal Vé QR để khách quét mã khi vào rạp.",
      x: 5.15, y: 3.2, w: 4.35, h: 1.9
    }
  ];

  cards.forEach(c => {
    slide.addShape(pres.ShapeType.roundRect, {
      x: c.x, y: c.y, w: c.w, h: c.h,
      fill: { color: BG_WHITE },
      line: { color: c.color, width: 1.5 },
      rectRadius: 0.15
    });

    slide.addShape(pres.ShapeType.roundRect, {
      x: c.x + 0.1, y: c.y + 0.1, w: c.w - 0.2, h: 0.32,
      fill: { color: c.bg },
      line: { color: c.color, width: 1 },
      rectRadius: 0.08
    });
    slide.addText(c.title, {
      x: c.x + 0.1, y: c.y + 0.1, w: c.w - 0.2, h: 0.32,
      fontSize: 8.2, bold: true, color: c.color,
      align: "center", valign: "middle", fontFace: FONT_HEADING
    });

    slide.addText(c.desc, {
      x: c.x + 0.15, y: c.y + 0.48, w: c.w - 0.3, h: c.h - 0.55,
      fontSize: 7.5, color: TEXT_BODY,
      lineSpacingMultiple: 1.15, fontFace: FONT_BODY
    });
  });

  slide.addNotes("Quy trình thanh toán và phát hành vé điện tử mã QR Code.");
}

// =============================================================
// SLIDE 15: Sequence Diagram 3 - Quét & Giải Phóng Ghế Tự Động (Hold Timeout)
// =============================================================
{
  const slide = pres.addSlide();
  addHeader(slide, "14. SEQUENCE DIAGRAM: CƠ CHẾ GIẢI PHÓNG GHẾ HẾT HẠN (HOLD TIMEOUT)", "MÔ HÌNH HÓA TƯƠNG TÁC");

  // 4 Lifelines Table
  const timeSteps = [
    { no: "1", from: "Timer Worker", to: "Booking API", msg: "Kích hoạt định kỳ mỗi 30 giây (Interval Cleanup)", type: "Trigger" },
    { no: "2", from: "Booking API", to: "MySQL DB", msg: "START TRANSACTION -> SELECT * FROM booking_seats WHERE status='holding' AND hold_expire < NOW() FOR UPDATE", type: "Scan Expired" },
    { no: "3", from: "MySQL DB", to: "Booking API", msg: "Trả về danh sách các ghế quá 10 phút chưa thanh toán", type: "Result" },
    { no: "4", from: "Booking API", to: "MySQL DB", msg: "UPDATE booking_seats SET status='released'; UPDATE bookings SET status='expired';", type: "Release & Expire" },
    { no: "5", from: "MySQL DB", to: "Booking API", msg: "COMMIT TRANSACTION", type: "Commit" },
    { no: "6", from: "Khách khác (Client)", to: "Booking API", msg: "GET /api/schedules/:id/seats (Tải lại sơ đồ ghế)", type: "Refresh Seatmap" },
    { no: "7", from: "Booking API", to: "Client", msg: "Ghế chuyển trạng thái 🟢 Trống (available) sẵn sàng đặt lại!", type: "Available" }
  ];

  const timeRows = [
    [
      { text: "#", options: { bold: true, color: TEXT_DARK, fill: BG_SOFT_YELLOW } },
      { text: "Từ -> Đến", options: { bold: true, color: TEXT_DARK, fill: BG_SOFT_YELLOW } },
      { text: "Thông Điệp Xử Lý (Message Flow)", options: { bold: true, color: TEXT_DARK, fill: BG_SOFT_YELLOW } },
      { text: "Ý Nghĩa", options: { bold: true, color: TEXT_DARK, fill: BG_SOFT_YELLOW } }
    ],
    ...timeSteps.map(s => [
      { text: s.no, options: { bold: true, color: TEXT_DARK } },
      { text: s.from + " -> " + s.to, options: { color: POP_SKY, fontSize: 7.0 } },
      { text: s.msg, options: { color: TEXT_BODY, fontSize: 7.0, fontFace: s.msg.includes("SELECT") ? FONT_CODE : FONT_BODY } },
      { text: s.type, options: { bold: true, color: POP_MINT, fontSize: 7.0 } }
    ])
  ];

  slide.addTable(timeRows, {
    x: 0.5, y: 1.15, w: 9.0,
    colW: [0.4, 2.3, 4.8, 1.5],
    fontSize: 7.2,
    border: { pt: 0.8, color: "CBD5E1" },
    fill: BG_WHITE,
    margin: 0.04,
    valign: "middle"
  });

  // Bottom Explanatory Card
  slide.addShape(pres.ShapeType.roundRect, {
    x: 0.5, y: 4.15, w: 9.0, h: 0.95,
    fill: { color: BG_WHITE },
    line: { color: POP_SUNNY, width: 1.2 },
    rectRadius: 0.1
  });
  slide.addText([
    { text: "💡 Ưu điểm giải thuật Tự động giải phóng ghế (Hold Timeout):\n", options: { bold: true, color: POP_SUNNY } },
    { text: "• Hoàn toàn tự động, không phụ thuộc vào việc người dùng có đóng trình duyệt hay mất kết nối mạng.\n• Tối đa hóa tỷ lệ lấp đầy rạp chiếu, đảm bảo ghế không bị giữ ảo (Phantom Holding) làm thất thu doanh thu của rạp.", options: { color: TEXT_BODY } }
  ], {
    x: 0.65, y: 4.2, w: 8.7, h: 0.85,
    fontSize: 7.2, lineSpacingMultiple: 1.15, fontFace: FONT_BODY
  });

  slide.addNotes("Cơ chế quét ngầm 30 giây giải phóng ghế hết hạn giải quyết triệt để vấn đề giữ ghế ảo.");
}

// =============================================================
// SLIDE 16: Sequence Diagram 4 - Phân Công, Xử Lý Sự Cố & Nghiệm Thu
// =============================================================
{
  const slide = pres.addSlide();
  addHeader(slide, "15. SEQUENCE DIAGRAM: PHÂN CÔNG, XỬ LÝ SỰ CỐ & NGHIỆM THU", "MÔ HÌNH HÓA TƯƠNG TÁC");

  const incSteps = [
    { no: "1", from: "Staff (Nhân viên)", to: "Incident API", msg: "POST /incidents { roomId: 8, severity: 'high', equipId: 25 }", res: "Tạo Incident (new)" },
    { no: "2", from: "Incident API", to: "Manager", msg: "Gửi Notification cảnh báo sự cố phòng 8 đến Quản lý", res: "Báo động" },
    { no: "3", from: "Manager (Quản lý)", to: "Assignment API", msg: "POST /incidents/1/assign { techId: 6 (KTV Võ Minh Quân) }", res: "Gán KTV (accepted)" },
    { no: "4", from: "Assignment API", to: "Technician", msg: "Bắn thông báo nhiệm vụ sửa chữa cho KTV", res: "Nhận việc" },
    { no: "5", from: "Technician (KTV)", to: "Incident API", msg: "POST /incidents/1/resolve { spareParts: 'Tụ 50uF', cost: 350000 }", res: "Báo xong (resolved)" },
    { no: "6", from: "Manager (Quản lý)", to: "Incident API", msg: "POST /incidents/1/close -> Nghiệm thu đạt chuẩn an toàn", res: "Đóng phiếu (closed)" },
    { no: "7", from: "Incident API", to: "MySQL DB", msg: "UPDATE cinema_rooms SET status='active'; Khóa vĩnh viễn phiếu.", res: "Phòng mở lại (🟢)" }
  ];

  const incRows = [
    [
      { text: "#", options: { bold: true, color: TEXT_DARK, fill: BG_SOFT_YELLOW } },
      { text: "Từ -> Đến", options: { bold: true, color: TEXT_DARK, fill: BG_SOFT_YELLOW } },
      { text: "Thông Điệp (Message / API Call)", options: { bold: true, color: TEXT_DARK, fill: BG_SOFT_YELLOW } },
      { text: "Trạng Thái", options: { bold: true, color: TEXT_DARK, fill: BG_SOFT_YELLOW } }
    ],
    ...incSteps.map(s => [
      { text: s.no, options: { bold: true, color: TEXT_DARK } },
      { text: s.from + " -> " + s.to, options: { color: POP_PURPLE, fontSize: 7.0 } },
      { text: s.msg, options: { color: TEXT_BODY, fontSize: 7.0, fontFace: s.msg.includes("POST") ? FONT_CODE : FONT_BODY } },
      { text: s.res, options: { bold: true, color: s.res.includes("closed") || s.res.includes("mở lại") ? POP_MINT : POP_CORAL, fontSize: 7.0 } }
    ])
  ];

  slide.addTable(incRows, {
    x: 0.5, y: 1.15, w: 9.0,
    colW: [0.4, 2.4, 4.7, 1.5],
    fontSize: 7.2,
    border: { pt: 0.8, color: "CBD5E1" },
    fill: BG_WHITE,
    margin: 0.04,
    valign: "middle"
  });

  // Bottom Explanatory Card
  slide.addShape(pres.ShapeType.roundRect, {
    x: 0.5, y: 4.15, w: 9.0, h: 0.95,
    fill: { color: BG_WHITE },
    line: { color: POP_PURPLE, width: 1.2 },
    rectRadius: 0.1
  });
  slide.addText([
    { text: "🔒 Tính toàn vẹn và minh bạch dữ liệu bảo trì:\n", options: { bold: true, color: POP_PURPLE } },
    { text: "• Quy tắc BR13 & BR14: Khi sự cố chuyển sang 'closed', toàn bộ dữ liệu bị khóa chống chỉnh sửa.\n• Bảng `incident_histories` ghi nhận rõ ràng từng bước ai làm, thay linh kiện gì và chi phí bao nhiêu.", options: { color: TEXT_BODY } }
  ], {
    x: 0.65, y: 4.2, w: 8.7, h: 0.85,
    fontSize: 7.2, lineSpacingMultiple: 1.15, fontFace: FONT_BODY
  });

  slide.addNotes("Sơ đồ tuần tự xử lý sự cố mô tả quy trình khép kín giữa Nhân viên, Quản lý và Kỹ thuật viên.");
}

// =============================================================
// SLIDE 17: Class Diagram Tổng Thể 22 Lớp Đối Tượng (3 Packages)
// =============================================================
{
  const slide = pres.addSlide();
  addHeader(slide, "16. CLASS DIAGRAM: MÔ HÌNH HÓA CẤU TRÚC 22 LỚP THỰC THỂ", "THIẾT KẾ HƯỚNG ĐỐI TƯỢNG");

  const packages = [
    {
      name: "📦 GÓI 1: USER & PHÂN QUYỀN",
      color: POP_CORAL, bg: BG_SOFT_PINK,
      x: 0.5, y: 1.15, w: 2.86, h: 3.95,
      classes: [
        "User (id, username, password, roleId)",
        "Role (id, name, description)",
        "Customer (id, userId, name, email)",
        "Employee (id, userId, name, position)",
        "WorkShift (id, employeeId, workDate)",
        "Notification (id, userId, title, isRead)"
      ],
      relations: "• User 1 - 1 Role\n• User 1 - 0..1 Customer / Employee\n• Employee 1 - * WorkShift"
    },
    {
      name: "📦 GÓI 2: PHÒNG, THIẾT BỊ & SỰ CỐ",
      color: POP_SUNNY, bg: BG_SOFT_YELLOW,
      x: 3.56, y: 1.15, w: 2.86, h: 3.95,
      classes: [
        "CinemaRoom (id, name, type, capacity)",
        "Seat (id, roomId, rowNum, seatNum)",
        "Equipment (id, typeId, roomId, code)",
        "EquipmentType (id, name, desc)",
        "Incident (id, code, roomId, equipId)",
        "IncidentHistory (id, incidentId, cost)",
        "Maintenance (id, equipmentId, date)",
        "RoomInspection & Detail (9 tiêu chí)"
      ],
      relations: "• Room 1 - * Seat (Composition)\n• Room 1 - * Equipment (Aggregation)\n• Incident 1 - * History (Composition)"
    },
    {
      name: "📦 GÓI 3: PHIM, LỊCH CHIẾU & VÉ",
      color: POP_MINT, bg: BG_SOFT_GREEN,
      x: 6.62, y: 1.15, w: 2.86, h: 3.95,
      classes: [
        "Movie (id, name, genre, duration)",
        "ScreeningSchedule (id, movieId, time)",
        "Booking (id, customerId, total, status)",
        "BookingSeat (id, bookingId, seatId)",
        "Payment (id, bookingId, method)",
        "Ticket (id, bookingId, ticketCode, qr)"
      ],
      relations: "• Movie 1 - * ScreeningSchedule\n• Schedule 1 - * Booking\n• Booking 1 - 1..* BookingSeat\n• Booking 1 - 1..* Ticket"
    }
  ];

  packages.forEach(p => {
    slide.addShape(pres.ShapeType.roundRect, {
      x: p.x, y: p.y, w: p.w, h: p.h,
      fill: { color: BG_WHITE },
      line: { color: p.color, width: 1.5 },
      rectRadius: 0.15
    });

    slide.addShape(pres.ShapeType.roundRect, {
      x: p.x + 0.1, y: p.y + 0.1, w: p.w - 0.2, h: 0.32,
      fill: { color: p.bg },
      line: { color: p.color, width: 1 },
      rectRadius: 0.08
    });
    slide.addText(p.name, {
      x: p.x + 0.1, y: p.y + 0.1, w: p.w - 0.2, h: 0.32,
      fontSize: 7.8, bold: true, color: p.color,
      align: "center", valign: "middle", fontFace: FONT_HEADING
    });

    const clsText = p.classes.map(c => `📄 ${c}`).join("\n");
    slide.addText(clsText, {
      x: p.x + 0.1, y: p.y + 0.48, w: p.w - 0.2, h: 2.35,
      fontSize: 6.8, color: TEXT_DARK,
      lineSpacingMultiple: 1.15, fontFace: FONT_BODY
    });

    // Sub box for relationships
    slide.addShape(pres.ShapeType.roundRect, {
      x: p.x + 0.1, y: p.y + 2.9, w: p.w - 0.2, h: 0.95,
      fill: { color: "F8FAFC" },
      line: { color: "CBD5E1", width: 1 },
      rectRadius: 0.08
    });
    slide.addText("🔗 Mối quan hệ chính:", {
      x: p.x + 0.15, y: p.y + 2.95, w: p.w - 0.3, h: 0.2,
      fontSize: 7.2, bold: true, color: p.color, fontFace: FONT_HEADING
    });
    slide.addText(p.relations, {
      x: p.x + 0.15, y: p.y + 3.18, w: p.w - 0.3, h: 0.62,
      fontSize: 6.8, color: TEXT_BODY, fontFace: FONT_BODY
    });
  });

  slide.addNotes("Class Diagram gồm 22 lớp thực thể phân bố trong 3 gói logic.");
}

// =============================================================
// SLIDE 18: Class Diagram Chi Tiết: Gói Phim, Lịch Chiếu, Đặt Vé & Vé QR
// =============================================================
{
  const slide = pres.addSlide();
  addHeader(slide, "17. CLASS DIAGRAM CHI TIẾT: GÓI ĐẶT VÉ, LỊCH CHIẾU & THANH TOÁN", "THIẾT KẾ HƯỚNG ĐỐI TƯỢNG");

  // Draw 6 detailed UML Class Boxes (3 Columns x 2 Rows)
  // Row 1: Movie, ScreeningSchedule, Booking
  drawUMLClassBox(slide, 0.5, 1.15, 2.86, 1.9, "Movie", POP_CORAL, BG_SOFT_PINK,
    ["id: int", "name: string", "duration: int", "ageRating: string", "status: string"],
    ["getSchedules(date): List", "isActive(): bool"]
  );

  drawUMLClassBox(slide, 3.56, 1.15, 2.86, 1.9, "ScreeningSchedule", POP_SUNNY, BG_SOFT_YELLOW,
    ["id: int", "movieId: int", "roomId: int", "startTime: DateTime", "endTime: DateTime", "ticketPrice: decimal"],
    ["checkConflict(): bool", "getSeatMap(): Map"]
  );

  drawUMLClassBox(slide, 6.62, 1.15, 2.86, 1.9, "Booking", POP_PURPLE, BG_SOFT_PURPLE,
    ["id: int", "customerId: int", "screeningId: int", "bookingCode: string", "totalAmount: decimal", "status: string"],
    ["calculateTotal(): decimal", "confirmPayment(): bool", "cancel(): void"]
  );

  // Row 2: BookingSeat, Payment, Ticket
  drawUMLClassBox(slide, 0.5, 3.18, 2.86, 1.9, "BookingSeat", POP_SUNNY, BG_SOFT_YELLOW,
    ["id: int", "bookingId: int", "seatId: int", "price: decimal", "status: string", "holdExpire: DateTime"],
    ["isExpired(): bool", "release(): void", "lock(duration): void"]
  );

  drawUMLClassBox(slide, 3.56, 3.18, 2.86, 1.9, "Payment", POP_SKY, BG_SOFT_BLUE,
    ["id: int", "bookingId: int", "paymentMethod: string", "amount: decimal", "transactionCode: string", "status: string"],
    ["process(): bool", "refund(): bool", "verifyTransaction(): bool"]
  );

  drawUMLClassBox(slide, 6.62, 3.18, 2.86, 1.9, "Ticket", POP_MINT, BG_SOFT_GREEN,
    ["id: int", "bookingId: int", "seatId: int", "ticketCode: string", "qrCode: string", "status: string"],
    ["verifyQR(code): bool", "checkIn(): void", "cancelTicket(): bool"]
  );

  slide.addNotes("Chi tiết các thuộc tính và phương thức của các lớp nghiệp vụ trong gói Đặt vé và Thanh toán.");
}

// =============================================================
// SLIDE 19: Class Diagram Chi Tiết: Gói Phòng Chiếu, Thiết Bị & Sự Cố
// =============================================================
{
  const slide = pres.addSlide();
  addHeader(slide, "18. CLASS DIAGRAM CHI TIẾT: GÓI PHÒNG CHIẾU, THIẾT BỊ & SỰ CỐ", "THIẾT KẾ HƯỚNG ĐỐI TƯỢNG");

  // Row 1: CinemaRoom, Seat, Equipment
  drawUMLClassBox(slide, 0.5, 1.15, 2.86, 1.9, "CinemaRoom", POP_SKY, BG_SOFT_BLUE,
    ["id: int", "name: string", "roomType: string", "capacity: int", "status: string"],
    ["isAvailable(start, end): bool", "getSeats(): List<Seat>", "getEquipment(): List"]
  );

  drawUMLClassBox(slide, 3.56, 1.15, 2.86, 1.9, "Seat", POP_SUNNY, BG_SOFT_YELLOW,
    ["id: int", "roomId: int", "rowNum: string", "seatNum: int", "seatType: string", "status: string"],
    ["getSeatLabel(): string", "isVIP(): bool", "isCouple(): bool"]
  );

  drawUMLClassBox(slide, 6.62, 1.15, 2.86, 1.9, "Equipment", POP_PURPLE, BG_SOFT_PURPLE,
    ["id: int", "typeId: int", "roomId: int", "name: string", "code: string", "lastMaintenance: Date"],
    ["checkHealth(): string", "scheduleMaintenance(date): void"]
  );

  // Row 2: Incident, IncidentHistory, RoomInspection
  drawUMLClassBox(slide, 0.5, 3.18, 2.86, 1.9, "Incident", POP_CORAL, BG_SOFT_PINK,
    ["id: int", "code: string", "roomId: int", "equipId: int", "severity: string", "status: string"],
    ["assign(techId): void", "resolve(cost, parts): void", "close(): void"]
  );

  drawUMLClassBox(slide, 3.56, 3.18, 2.86, 1.9, "IncidentHistory", POP_INDIGO, BG_SOFT_PURPLE,
    ["id: int", "incidentId: int", "employeeId: int", "action: string", "spareParts: string", "cost: decimal"],
    ["logAction(empId, act, cost): void", "getAuditLog(): string"]
  );

  drawUMLClassBox(slide, 6.62, 3.18, 2.86, 1.9, "RoomInspection", POP_MINT, BG_SOFT_GREEN,
    ["id: int", "roomId: int", "employeeId: int", "inspectionDate: DateTime", "status: string"],
    ["submit9Checklist(details): void", "autoTriggerIncident(): bool"]
  );

  slide.addNotes("Chi tiết các lớp và phương thức quản lý phòng chiếu, thiết bị, quy trình kiểm tra 9 tiêu chí và lưu vết sự cố.");
}

// =============================================================
// SLIDE 20: Ma Trận Chuyển Đổi OOAD: Từ Class Sang CSDL MySQL InnoDB
// =============================================================
{
  const slide = pres.addSlide();
  addHeader(slide, "19. MA TRẬN CHUYỂN ĐỔI OOAD: TỪ CLASS DIAGRAM SANG CSDL MYSQL INNODB", "HIỆN THỰC HÓA HỆ THỐNG");

  const mappingRows = [
    [
      { text: "Lớp Hướng Đối Tượng (Class)", options: { bold: true, color: TEXT_DARK, fill: BG_SOFT_YELLOW } },
      { text: "Bảng CSDL MySQL Tương Ứng", options: { bold: true, color: TEXT_DARK, fill: BG_SOFT_YELLOW } },
      { text: "Khóa Chính (PK) & Khóa Ngoại (FK)", options: { bold: true, color: TEXT_DARK, fill: BG_SOFT_YELLOW } },
      { text: "Cơ Chế Ràng Buộc & Transaction", options: { bold: true, color: TEXT_DARK, fill: BG_SOFT_YELLOW } }
    ],
    [
      { text: "CinemaRoom & Seat", options: { bold: true, color: POP_SKY } },
      { text: "cinema_rooms\nseats", options: { fontFace: FONT_CODE, color: POP_SKY } },
      { text: "PK: id\nFK: seats.room_id -> cinema_rooms.id", options: { color: TEXT_BODY } },
      { text: "ON DELETE CASCADE (Composition: Xóa phòng tự động xóa ghế).", options: { color: TEXT_BODY } }
    ],
    [
      { text: "Booking & BookingSeat", options: { bold: true, color: POP_CORAL } },
      { text: "bookings\nbooking_seats", options: { fontFace: FONT_CODE, color: POP_CORAL } },
      { text: "PK: id\nFK: booking_seats.booking_id -> bookings.id", options: { color: TEXT_BODY } },
      { text: "SELECT FOR UPDATE + InnoDB Row Lock (Chống Race Condition).", options: { bold: true, color: POP_CORAL } }
    ],
    [
      { text: "Incident & History", options: { bold: true, color: POP_PURPLE } },
      { text: "incidents\nincident_histories", options: { fontFace: FONT_CODE, color: POP_PURPLE } },
      { text: "PK: id\nFK: incident_histories.incident_id -> incidents.id", options: { color: TEXT_BODY } },
      { text: "Immutable Audit Log: Khóa chỉnh sửa khi chuyển status 'closed'.", options: { color: TEXT_BODY } }
    ],
    [
      { text: "RoomInspection & Detail", options: { bold: true, color: POP_MINT } },
      { text: "room_inspections\ninspection_details", options: { fontFace: FONT_CODE, color: POP_MINT } },
      { text: "PK: id\nFK: inspection_details.inspection_id", options: { color: TEXT_BODY } },
      { text: "9 Tiêu chí an toàn: Tự động trigger tạo Incident nếu có item 'fail'.", options: { color: TEXT_BODY } }
    ]
  ];

  slide.addTable(mappingRows, {
    x: 0.5, y: 1.15, w: 9.0,
    colW: [2.0, 1.8, 2.6, 2.6],
    fontSize: 7.0,
    border: { pt: 0.8, color: "CBD5E1" },
    fill: BG_WHITE,
    margin: 0.04,
    valign: "middle"
  });

  slide.addNotes("Ma trận chuyển đổi chứng minh tính nhất quán giữa mô hình Class Diagram hướng đối tượng và CSDL quan hệ MySQL InnoDB.");
}

// =============================================================
// SLIDE 21: 16 Quy Tắc Nghiệp Vụ (BR01 - BR16)
// =============================================================
{
  const slide = pres.addSlide();
  addHeader(slide, "20. QUY TẮC NGHIỆP VỤ CỐT LÕI (BUSINESS RULES BR01 - BR16)", "THIẾT KẾ LOGIC HỆ THỐNG");

  const rulesCol1 = [
    { code: "BR01", title: "Tránh Xung Đột Lịch", desc: "Không cho 2 suất chiếu trùng giờ hoặc cách nhau dưới 15p dọn phòng." },
    { code: "BR02", title: "Ràng Buộc Phòng", desc: "Không xếp lịch cho phòng đang 'maintenance' hoặc 'incident'." },
    { code: "BR03", title: "Ràng Buộc Thiết Bị", desc: "Tạm ngưng mở bán nếu máy chiếu hoặc âm thanh bị hỏng." },
    { code: "BR04", title: "Độc Quyền Ghế", desc: "Một ghế chỉ được đặt hoặc giữ 1 lần trong cùng 1 suất chiếu." },
    { code: "BR05", title: "Khóa Ghế Realtime", desc: "Khi khách chọn ghế -> Đổi sang 🔵 'holding' và khóa với khách khác." },
    { code: "BR06", title: "Thời Hạn Giữ 10p", desc: "Cơ chế giữ ghế mặc định kéo dài đúng 10 phút từ hold_start." },
    { code: "BR07", title: "Tự Giải Phóng Ghế", desc: "Hết 10 phút chưa thanh toán -> Worker đổi 'released' và hủy đơn." },
    { code: "BR08", title: "Chuyển Đổi Khi Trả", desc: "Thanh toán thành công -> Đổi sang 🔴 'booked' và sinh mã vé QR." }
  ];

  const rulesCol2 = [
    { code: "BR09", title: "Thanh Toán Lỗi", desc: "Khách hủy hoặc lỗi -> Ghế mở lại 🟢 'available' tức thì." },
    { code: "BR10", title: "Concurrency Lock", desc: "Dùng MySQL Transaction & SELECT FOR UPDATE chặn Race Condition." },
    { code: "BR11", title: "Chặn Suất Đã Qua", desc: "Không cho đặt vé đối với suất chiếu có start_time trong quá khứ." },
    { code: "BR12", title: "Phân Quyền KTV", desc: "KTV chỉ cập nhật kết quả sự cố/bảo trì được phân công cho mình." },
    { code: "BR13", title: "Khóa Sự Cố Đóng", desc: "Sự cố chuyển sang 'closed' sẽ bị khóa vĩnh viễn không thể sửa." },
    { code: "BR14", title: "Quyền Đóng Sự Cố", desc: "Chỉ Quản lý (Manager) hoặc Admin mới có quyền đóng 'closed'." },
    { code: "BR15", title: "Audit Log Lịch Sử", desc: "Mọi thay đổi linh kiện, chi phí đều ghi log vào incident_histories." },
    { code: "BR16", title: "Checklist Tự Động", desc: "Kiểm tra 9 tiêu chí có mục 'fail' -> Tự sinh 1 Incident mới." }
  ];

  function renderRuleList(rules, x, y, w) {
    rules.forEach((r, idx) => {
      const yPos = y + idx * 0.48;
      slide.addShape(pres.ShapeType.roundRect, {
        x: x, y: yPos, w: w, h: 0.44,
        fill: { color: BG_WHITE },
        line: { color: "CBD5E1", width: 1 },
        rectRadius: 0.08
      });

      slide.addShape(pres.ShapeType.roundRect, {
        x: x + 0.08, y: yPos + 0.07, w: 0.65, h: 0.3,
        fill: { color: BG_SOFT_YELLOW },
        line: { color: POP_SUNNY, width: 1 },
        rectRadius: 0.06
      });
      slide.addText(r.code, {
        x: x + 0.08, y: yPos + 0.07, w: 0.65, h: 0.3,
        fontSize: 7.2, bold: true, color: POP_SUNNY,
        align: "center", valign: "middle", fontFace: FONT_HEADING
      });

      slide.addText([
        { text: `${r.title}: `, options: { bold: true, color: TEXT_DARK } },
        { text: r.desc, options: { color: TEXT_MUTED } }
      ], {
        x: x + 0.8, y: yPos + 0.04, w: w - 0.88, h: 0.36,
        fontSize: 6.8, lineSpacingMultiple: 1.05, fontFace: FONT_BODY
      });
    });
  }

  renderRuleList(rulesCol1, 0.5, 1.15, 4.35);
  renderRuleList(rulesCol2, 5.15, 1.15, 4.35);

  slide.addNotes("16 Quy tắc nghiệp vụ từ BR01 đến BR16 là kim chỉ nam cho logic hệ thống.");
}

// =============================================================
// SLIDE 22: Thiết Kế Cơ Sở Dữ Liệu MySQL (22 Bảng InnoDB)
// =============================================================
{
  const slide = pres.addSlide();
  addHeader(slide, "21. THIẾT KẾ CƠ SỞ DỮ LIỆU MYSQL (INNODB STORAGE ENGINE)", "THIẾT KẾ DỮ LIỆU");

  // 4 metric cards on top
  const metrics = [
    { label: "BẢNG CƠ SỞ DỮ LIỆU", val: "22 Bảng", color: POP_CORAL, bg: BG_SOFT_PINK, x: 0.5 },
    { label: "STORAGE ENGINE", val: "MySQL InnoDB", color: POP_SKY, bg: BG_SOFT_BLUE, x: 2.8 },
    { label: "RÀNG BUỘC TOÀN VẸN", val: "Foreign Keys (FK)", color: POP_MINT, bg: BG_SOFT_GREEN, x: 5.1 },
    { label: "BẢO TOÀN GIAO DỊCH", val: "ACID Compliant", color: POP_PURPLE, bg: BG_SOFT_PURPLE, x: 7.4 }
  ];

  metrics.forEach(m => {
    slide.addShape(pres.ShapeType.roundRect, {
      x: m.x, y: 1.15, w: 2.1, h: 0.85,
      fill: { color: BG_WHITE },
      line: { color: m.color, width: 1.2 },
      rectRadius: 0.12
    });
    slide.addText(m.label, {
      x: m.x + 0.05, y: 1.22, w: 2.0, h: 0.22,
      fontSize: 7.2, bold: true, color: m.color, align: "center", fontFace: FONT_HEADING
    });
    slide.addText(m.val, {
      x: m.x + 0.05, y: 1.46, w: 2.0, h: 0.45,
      fontSize: 12, bold: true, color: TEXT_DARK, align: "center", fontFace: FONT_HEADING
    });
  });

  // Main DB Schema Highlight Table
  const tableRows = [
    [
      { text: "Nhóm Bảng", options: { bold: true, color: TEXT_DARK, fill: BG_SOFT_YELLOW } },
      { text: "Danh Sách Các Bảng CSDL", options: { bold: true, color: TEXT_DARK, fill: BG_SOFT_YELLOW } },
      { text: "Khóa Ngoại & Tính Năng Trọng Tâm", options: { bold: true, color: TEXT_DARK, fill: BG_SOFT_YELLOW } }
    ],
    [
      { text: "1. Xác thực & Nhân sự", options: { bold: true, color: POP_CORAL } },
      { text: "users, roles, customers, employees, work_shifts, notifications", options: { color: POP_SKY, bold: true } },
      { text: "RBAC 5 roles, liên kết 1-1 với user_id, lịch ca trực nhân viên theo ngày.", options: { color: TEXT_BODY } }
    ],
    [
      { text: "2. Phòng chiếu & Ghế", options: { bold: true, color: POP_SUNNY } },
      { text: "cinema_rooms, seats, equipment_types, equipment", options: { color: POP_SUNNY, bold: true } },
      { text: "Sơ đồ ghế động (Regular, VIP, Couple), theo dõi thiết bị & bảo trì định kỳ.", options: { color: TEXT_BODY } }
    ],
    [
      { text: "3. Sự cố & Bảo trì", options: { bold: true, color: POP_PURPLE } },
      { text: "incidents, incident_histories, maintenances, room_inspections, details", options: { color: POP_PURPLE, bold: true } },
      { text: "Lưu vết 1-N lịch sử sửa chữa, 9 tiêu chí checklist kiểm tra an toàn phòng.", options: { color: TEXT_BODY } }
    ],
    [
      { text: "4. Lịch chiếu & Đặt vé", options: { bold: true, color: POP_MINT } },
      { text: "movies, screening_schedules, bookings, booking_seats, payments, tickets", options: { color: POP_MINT, bold: true } },
      { text: "Trạng thái ghế theo suất chiếu (holding, booked, released), Transaction Locking.", options: { color: TEXT_BODY } }
    ]
  ];

  slide.addTable(tableRows, {
    x: 0.5, y: 2.15, w: 9.0,
    colW: [2.0, 3.3, 3.7],
    fontSize: 7.5,
    border: { pt: 0.8, color: "CBD5E1" },
    fill: BG_WHITE,
    margin: 0.05,
    valign: "middle"
  });

  slide.addNotes("CSDL gồm 22 bảng được thiết kế chuẩn hóa trên engine InnoDB.");
}

// =============================================================
// SLIDE 23: Kiến Trúc 3 Tầng Công Nghệ (3-Tier Architecture)
// =============================================================
{
  const slide = pres.addSlide();
  addHeader(slide, "22. KIẾN TRÚC CÔNG NGHỆ & MÔ HÌNH 3 LỚP (3-TIER ARCHITECTURE)", "HIỆN THỰC HÓA HỆ THỐNG");

  const tiers = [
    {
      name: "TẦNG GIAO DIỆN (PRESENTATION)",
      tech: "React 18 + Vite + TailwindCSS",
      color: POP_SKY, bg: BG_SOFT_BLUE,
      desc: "• Single Page Application (SPA) phản hồi tức thì.\n• Giao diện Cinema hiện đại, Sơ đồ ghế vòm 3D trực quan.\n• Lucide Icons, Recharts biểu đồ thống kê doanh thu.\n• Canvas Confetti hiệu ứng pháo hoa khi đặt vé.\n• QRCode.react hiển thị mã vé điện tử quét tại quầy.\n• 1-Click Fast Role Switcher chuyển đổi 5 Actor.",
      x: 0.5, y: 1.15, w: 2.86, h: 3.95
    },
    {
      name: "TẦNG ỨNG DỤNG (APPLICATION)",
      tech: "Node.js + Express.js REST API",
      color: POP_SUNNY, bg: BG_SOFT_YELLOW,
      desc: "• 16 Controllers nghiệp vụ phân tách độc lập.\n• Middleware xác thực JWT & Phân quyền Role RBAC.\n• Background Worker quét giải phóng ghế hết hạn (30s).\n• MySQL Connection Pool tối ưu hiệu năng chịu tải.\n• Transaction & Row-Level Lock helper methods.\n• Centralized Error Handling & Audit Log.",
      x: 3.56, y: 1.15, w: 2.86, h: 3.95
    },
    {
      name: "TẦNG DỮ LIỆU (DATA TIER)",
      tech: "MySQL 8.0 (InnoDB Engine)",
      color: POP_MINT, bg: BG_SOFT_GREEN,
      desc: "• 22 Bảng quan hệ với khóa ngoại FK nghiêm ngặt.\n• Đảm bảo tính toàn vẹn dữ liệu ACID tuyệt đối.\n• Hỗ trợ Transaction & Row-Level Locking (SELECT FOR UPDATE).\n• Seed Data phong phú: 6 phòng chiếu, 10 phim bom tấn.\n• Dễ dàng quản lý qua MySQL Workbench.",
      x: 6.62, y: 1.15, w: 2.86, h: 3.95
    }
  ];

  tiers.forEach(t => {
    slide.addShape(pres.ShapeType.roundRect, {
      x: t.x, y: t.y, w: t.w, h: t.h,
      fill: { color: BG_WHITE },
      line: { color: t.color, width: 1.5 },
      rectRadius: 0.15
    });

    slide.addShape(pres.ShapeType.roundRect, {
      x: t.x + 0.1, y: t.y + 0.1, w: t.w - 0.2, h: 0.32,
      fill: { color: t.bg },
      line: { color: t.color, width: 1 },
      rectRadius: 0.08
    });
    slide.addText(t.name, {
      x: t.x + 0.1, y: t.y + 0.1, w: t.w - 0.2, h: 0.32,
      fontSize: 7.5, bold: true, color: t.color,
      align: "center", valign: "middle", fontFace: FONT_HEADING
    });

    slide.addShape(pres.ShapeType.roundRect, {
      x: t.x + 0.1, y: t.y + 0.48, w: t.w - 0.2, h: 0.3,
      fill: { color: "F8FAFC" },
      line: { color: t.color, width: 1 },
      rectRadius: 0.06
    });
    slide.addText(t.tech, {
      x: t.x + 0.1, y: t.y + 0.48, w: t.w - 0.2, h: 0.3,
      fontSize: 7.2, bold: true, color: TEXT_DARK,
      align: "center", valign: "middle", fontFace: FONT_HEADING
    });

    slide.addText(t.desc, {
      x: t.x + 0.15, y: t.y + 0.85, w: t.w - 0.3, h: 3.0,
      fontSize: 7.2, color: TEXT_BODY,
      lineSpacingMultiple: 1.18, fontFace: FONT_BODY
    });
  });

  slide.addNotes("Hệ thống tuân thủ kiến trúc 3 tầng chuẩn.");
}

// =============================================================
// SLIDE 24: Thực Nghiệm Hệ Thống - 3 Workflow Demo
// =============================================================
{
  const slide = pres.addSlide();
  addHeader(slide, "23. THỰC NGHIỆM HỆ THỐNG: 3 WORKFLOW DEMO TIÊU BIỂU", "KẾT QUẢ ĐẠT ĐƯỢC");

  const workflows = [
    {
      title: "🎬 WORKFLOW 1: ĐẶT VÉ & GIỮ 10P",
      color: POP_MINT, bg: BG_SOFT_GREEN,
      x: 0.5, y: 1.15, w: 2.86, h: 3.95,
      steps: [
        "1. Chuyển vai trò Customer / Chọn phim Dune 2",
        "2. Chọn suất chiếu 19:00 tại Phòng IMAX Laser",
        "3. Click chọn ghế F5, F6 -> Ghế lập tức đổi màu 🔵 Đang giữ",
        "4. Đồng hồ đếm ngược 10:00 kích hoạt",
        "5. Thanh toán mô phỏng -> Hiệu ứng pháo hoa",
        "6. Vé điện tử kèm mã QR Code phát hành tức thì."
      ]
    },
    {
      title: "⚡ WORKFLOW 2: TEST RACE CONDITION",
      color: POP_CORAL, bg: BG_SOFT_PINK,
      x: 3.56, y: 1.15, w: 2.86, h: 3.95,
      steps: [
        "1. Mở 2 cửa sổ ẩn danh song song (Khách A & B)",
        "2. Cùng vào xem suất chiếu 19:00",
        "3. Khách A chọn ghế C5 -> Giữ thành công (🔵)",
        "4. Khách B chọn ghế C5 chậm hơn 0.1s",
        "5. Backend từ chối Khách B với thông báo: 'Ghế C5 vừa được người khác giữ'",
        "6. Không bao giờ xảy ra lỗi trùng vé!"
      ]
    },
    {
      title: "🔧 WORKFLOW 3: CHECKLIST -> SỰ CỐ",
      color: POP_SUNNY, bg: BG_SOFT_YELLOW,
      x: 6.62, y: 1.15, w: 2.86, h: 3.95,
      steps: [
        "1. Staff kiểm tra phòng 8 -> Đánh dấu 'Máy lạnh' Fail",
        "2. Hệ thống tự động tạo Sự cố INC-202609-001",
        "3. Manager nhận cảnh báo -> Gán KTV Võ Minh Quân",
        "4. Technician tiếp nhận, sửa chữa và nhập chi phí",
        "5. Manager kiểm tra -> Nghiệm thu & Đóng sự cố",
        "6. Phòng 8 trở lại hoạt động bình thường!"
      ]
    }
  ];

  workflows.forEach(w => {
    slide.addShape(pres.ShapeType.roundRect, {
      x: w.x, y: w.y, w: w.w, h: w.h,
      fill: { color: BG_WHITE },
      line: { color: w.color, width: 1.5 },
      rectRadius: 0.15
    });

    slide.addShape(pres.ShapeType.roundRect, {
      x: w.x + 0.1, y: w.y + 0.1, w: w.w - 0.2, h: 0.35,
      fill: { color: w.bg },
      line: { color: w.color, width: 1 },
      rectRadius: 0.08
    });
    slide.addText(w.title, {
      x: w.x + 0.1, y: w.y + 0.1, w: w.w - 0.2, h: 0.35,
      fontSize: 7.8, bold: true, color: w.color,
      align: "center", valign: "middle", fontFace: FONT_HEADING
    });

    const items = w.steps.map(s => ({ text: `• ${s}\n\n`, options: { color: TEXT_BODY } }));
    slide.addText(items, {
      x: w.x + 0.15, y: w.y + 0.55, w: w.w - 0.3, h: w.h - 0.65,
      fontSize: 7.2, lineSpacingMultiple: 1.1, fontFace: FONT_BODY
    });
  });

  slide.addNotes("3 Workflow này dùng để demo trực tiếp.");
}

// =============================================================
// =============================================================
// SLIDE 25: Đánh Giá Đồ Án & 4 Điểm Sáng Kỹ Thuật
// =============================================================
{
  const slide = pres.addSlide();
  addHeader(slide, "24. ĐÁNH GIÁ ĐỒ ÁN & 4 ĐIỂM SÁNG KỸ THUẬT", "TỔNG KẾT ĐỒ ÁN");

  // Left card: Điểm sáng kỹ thuật
  slide.addShape(pres.ShapeType.roundRect, {
    x: 0.5, y: 1.15, w: 4.35, h: 3.95,
    fill: { color: BG_WHITE },
    line: { color: POP_SUNNY, width: 1.5 },
    rectRadius: 0.15
  });
  slide.addShape(pres.ShapeType.roundRect, {
    x: 0.7, y: 1.3, w: 3.95, h: 0.35,
    fill: { color: BG_SOFT_YELLOW },
    line: { color: POP_SUNNY, width: 1 },
    rectRadius: 0.08
  });
  slide.addText("⭐ 4 ĐIỂM SÁNG KỸ THUẬT NỔI BẬT", {
    x: 0.7, y: 1.3, w: 3.95, h: 0.35,
    fontSize: 8.8, bold: true, color: "B45309",
    align: "center", valign: "middle", fontFace: FONT_HEADING
  });
  slide.addText([
    { text: "1. Mô hình hóa OOAD toàn diện: ", options: { bold: true, color: TEXT_DARK } },
    { text: "Đầy đủ 4 sơ đồ Use Case, 4 sơ đồ Hoạt động, 4 sơ đồ Tuần tự chi tiết và 22 lớp thực thể chuẩn UML 2.5.\n\n", options: { color: TEXT_BODY } },
    { text: "2. Chống trùng ghế Concurrency: ", options: { bold: true, color: TEXT_DARK } },
    { text: "Dùng MySQL Transaction & Row-Level Lock (SELECT FOR UPDATE) chặn triệt để Race Condition.\n\n", options: { color: TEXT_BODY } },
    { text: "3. Tự động giải phóng ghế (Hold Timeout): ", options: { bold: true, color: TEXT_DARK } },
    { text: "Worker chạy ngầm định kỳ 30s giải phóng ghế hết hạn, tối đa hóa tỷ lệ lấp đầy phòng chiếu.\n\n", options: { color: TEXT_BODY } },
    { text: "4. 1-Click Fast Role Switcher: ", options: { bold: true, color: TEXT_DARK } },
    { text: "Thanh chuyển đổi nhanh 5 Roles giúp hội đồng kiểm thử toàn bộ nghiệp vụ ngay lập tức.", options: { color: TEXT_BODY } }
  ], {
    x: 0.7, y: 1.75, w: 3.95, h: 3.2,
    fontSize: 7.2, lineSpacingMultiple: 1.12, fontFace: FONT_BODY
  });

  // Right card: Đóng góp & Hiệu năng
  slide.addShape(pres.ShapeType.roundRect, {
    x: 5.15, y: 1.15, w: 4.35, h: 3.95,
    fill: { color: BG_WHITE },
    line: { color: POP_SKY, width: 1.5 },
    rectRadius: 0.15
  });
  slide.addShape(pres.ShapeType.roundRect, {
    x: 5.35, y: 1.3, w: 3.95, h: 0.35,
    fill: { color: BG_SOFT_BLUE },
    line: { color: POP_SKY, width: 1 },
    rectRadius: 0.08
  });
  slide.addText("🏆 HIỆU NĂNG VẬN HÀNH & BẢO MẬT", {
    x: 5.35, y: 1.3, w: 3.95, h: 0.35,
    fontSize: 8.8, bold: true, color: POP_SKY,
    align: "center", valign: "middle", fontFace: FONT_HEADING
  });
  slide.addText([
    { text: "• Toàn vẹn dữ liệu tuyệt đối (100% ACID):\n", options: { bold: true, color: TEXT_DARK } },
    { text: "  Cơ chế khóa hàng (Row-level Lock) đảm bảo không có bất kỳ xung đột vé nào dù hàng trăm người dùng bấm cùng lúc.\n\n", options: { color: TEXT_BODY } },
    { text: "• Tự động hóa vòng đời sự cố (Zero Human Delay):\n", options: { bold: true, color: TEXT_DARK } },
    { text: "  Checklist 9 tiêu chí tự động sinh Incident, phân công KTV và theo dõi vật tư minh bạch.\n\n", options: { color: TEXT_BODY } },
    { text: "• Bảo mật phân quyền chặt chẽ (RBAC + JWT):\n", options: { bold: true, color: TEXT_DARK } },
    { text: "  5 Actors được phân tách quyền hạn rõ ràng, chống truy cập trái phép API.", options: { color: TEXT_BODY } }
  ], {
    x: 5.35, y: 1.75, w: 3.95, h: 3.2,
    fontSize: 7.2, lineSpacingMultiple: 1.12, fontFace: FONT_BODY
  });

  slide.addNotes("Slide đánh giá 4 điểm sáng kỹ thuật nổi bật của đồ án và hiệu năng vận hành.");
}

// =============================================================
// SLIDE 26: Định Hướng Mở Rộng: Trải Nghiệm Khách Hàng & Doanh Thu
// =============================================================
{
  const slide = pres.addSlide();
  addHeader(slide, "25. ĐỊNH HƯỚNG PHÁT TRIỂN: TRẢI NGHIỆM KHÁCH HÀNG & DOANH THU", "ĐỊNH HƯỚNG MỞ RỘNG");

  const cardsCX = [
    {
      title: "👓 SƠ ĐỒ GHẾ GÓC NHÌN 3D (SEAT PREVIEW)",
      badge: "TRẢI NGHIỆM", color: POP_SKY, bg: BG_SOFT_BLUE,
      x: 0.5, y: 1.15, w: 4.38, h: 1.95,
      points: [
        "Mô phỏng góc nhìn 3D/360° từ từng ghế tới màn chiếu (Three.js/WebGL).",
        "Trực quan hóa độ dốc, khoảng cách và loại trừ điểm mù trước khi thanh toán.",
        "Gia tăng tỷ lệ chốt đơn cho hàng ghế VIP, Sweetbox và phòng IMAX."
      ]
    },
    {
      title: "🍿 F&B EXPRESS & ĐẶT TRƯỚC BẮP NƯỚC",
      badge: "DOANH THU F&B", color: POP_SUNNY, bg: BG_SOFT_YELLOW,
      x: 5.12, y: 1.15, w: 4.38, h: 1.95,
      points: [
        "Tích hợp giỏ hàng combo bắp nước ngay trong luồng đặt vé xem phim.",
        "Làn nhận Fast Track tại quầy bằng mã QR riêng, cắt giảm 70% thời gian chờ đợi.",
        "Tự động trừ kho bắp/nước và thống kê doanh thu F&B độc lập theo suất."
      ]
    },
    {
      title: "📈 GIÁ VÉ ĐỘNG (DYNAMIC PRICING)",
      badge: "TỐI ƯU GIÁ", color: POP_MINT, bg: BG_SOFT_GREEN,
      x: 0.5, y: 3.22, w: 4.38, h: 1.95,
      points: [
        "Thuật toán điều chỉnh giá tự động theo giờ cao điểm, phim hot và vị trí ghế.",
        "Giảm giá kích cầu vào suất khuya hoặc ngày thường để tối đa tỷ lệ lấp đầy.",
        "Tích hợp gói vé thuê bao Cinema Pass (xem phim không giới hạn theo tháng)."
      ]
    },
    {
      title: "🛡️ VÉ ĐỘNG AN TOÀN & CHIA TIỀN NHÓM",
      badge: "TIỆN ÍCH", color: POP_PURPLE, bg: BG_SOFT_PURPLE,
      x: 5.12, y: 3.22, w: 4.38, h: 1.95,
      points: [
        "Lưu vé trực tiếp vào Apple Wallet / Google Wallet ngay sau khi thanh toán.",
        "Mã QR động xoay vòng 30 giây (Dynamic QR) chống chụp màn hình bán vé lậu.",
        "Tính năng Split-bill chia tiền tự động cho nhóm bạn cùng đi xem chung."
      ]
    }
  ];

  cardsCX.forEach(c => {
    slide.addShape(pres.ShapeType.roundRect, {
      x: c.x, y: c.y, w: c.w, h: c.h,
      fill: { color: BG_WHITE },
      line: { color: c.color, width: 1.5 },
      rectRadius: 0.12
    });

    slide.addShape(pres.ShapeType.roundRect, {
      x: c.x + 0.1, y: c.y + 0.1, w: c.w - 0.2, h: 0.32,
      fill: { color: c.bg },
      line: { color: c.color, width: 1 },
      rectRadius: 0.08
    });
    slide.addText(c.title, {
      x: c.x + 0.15, y: c.y + 0.1, w: c.w - 0.3, h: 0.32,
      fontSize: 8.2, bold: true, color: c.color,
      valign: "middle", fontFace: FONT_HEADING
    });

    const bulletItems = c.points.map(pt => ({
      text: "• " + pt + "\n",
      options: { color: TEXT_BODY }
    }));

    slide.addText(bulletItems, {
      x: c.x + 0.15, y: c.y + 0.48, w: c.w - 0.3, h: c.h - 0.55,
      fontSize: 7.2, lineSpacingMultiple: 1.15, fontFace: FONT_BODY
    });
  });

  slide.addNotes("Định hướng mở rộng các tính năng nâng cao trải nghiệm khách hàng và tối ưu doanh thu rạp chiếu.");
}

// =============================================================
// SLIDE 27: Định Hướng Mở Rộng: Vận Hành Thông Minh, IoT & AI
// =============================================================
{
  const slide = pres.addSlide();
  addHeader(slide, "26. ĐỊNH HƯỚNG PHÁT TRIỂN: VẬN HÀNH THÔNG MINH, IOT & AI", "ĐỊNH HƯỚNG MỞ RỘNG");

  const cardsTech = [
    {
      title: "🌿 IOT & GREEN CINEMA AUTOMATION",
      badge: "TỰ ĐỘNG HÓA", color: POP_MINT, bg: BG_SOFT_GREEN,
      x: 0.5, y: 1.15, w: 4.38, h: 1.95,
      points: [
        "Liên kết lịch chiếu với hệ thống IoT điều khiển nhiệt độ điều hòa trước 15p.",
        "Tự động điều chỉnh độ sáng đèn khán phòng và âm thanh theo tiến trình suất chiếu.",
        "Cắt giảm tới 25% điện năng tiêu thụ tại các phòng chiếu ngoài giờ hoạt động."
      ]
    },
    {
      title: "🔍 BẢO TRÌ DỰ ĐOÁN (PREDICTIVE MAINTENANCE)",
      badge: "VẬN HÀNH", color: POP_CORAL, bg: BG_SOFT_PINK,
      x: 5.12, y: 1.15, w: 4.38, h: 1.95,
      points: [
        "Theo dõi số giờ chiếu lũy kế của bóng đèn Laser, màng lọc HVAC, dàn loa âm thanh.",
        "Cảnh báo chủ động lịch bảo trì định kỳ trước khi thiết bị gặp sự cố bất ngờ.",
        "Loại bỏ 90% nguy cơ phải hủy suất chiếu hoặc bồi thường vé cho khách hàng."
      ]
    },
    {
      title: "🤖 TRỢ LÝ AI & GỢI Ý PHIM CÁ NHÂN HÓA",
      badge: "TRÍ TUỆ NHÂN TẠO", color: POP_SKY, bg: BG_SOFT_BLUE,
      x: 0.5, y: 3.22, w: 4.38, h: 1.95,
      points: [
        "AI Movie Concierge: Chatbot ngôn ngữ tự nhiên tư vấn phim theo cảm xúc & lịch rảnh.",
        "Thuật toán Recommendation Engine gợi ý phim theo sở thích và lịch sử xem vé.",
        "Sentiment Analysis phân tích cảm xúc từ review thực tế của khán giả sau khi xem."
      ]
    },
    {
      title: "📺 DIGITAL SIGNAGE & ĐẶT RẠP RIÊNG",
      badge: "DỊCH VỤ", color: POP_INDIGO, bg: BG_CARD_LIGHT,
      x: 5.12, y: 3.22, w: 4.38, h: 1.95,
      points: [
        "Màn hình sảnh (Signage) đồng bộ thời gian thực: Suất kế tiếp, vé còn/hết, gọi số F&B.",
        "Phân hệ Private Screening: Đặt trọn khán phòng tổ chức sinh nhật, hội thảo, giải E-Sports.",
        "Tự động tính bảng giá trọn gói theo khung giờ, số lượng khách và dịch vụ đi kèm."
      ]
    }
  ];

  cardsTech.forEach(c => {
    slide.addShape(pres.ShapeType.roundRect, {
      x: c.x, y: c.y, w: c.w, h: c.h,
      fill: { color: BG_WHITE },
      line: { color: c.color, width: 1.5 },
      rectRadius: 0.12
    });

    slide.addShape(pres.ShapeType.roundRect, {
      x: c.x + 0.1, y: c.y + 0.1, w: c.w - 0.2, h: 0.32,
      fill: { color: c.bg },
      line: { color: c.color, width: 1 },
      rectRadius: 0.08
    });
    slide.addText(c.title, {
      x: c.x + 0.15, y: c.y + 0.1, w: c.w - 0.3, h: 0.32,
      fontSize: 8.2, bold: true, color: c.color,
      valign: "middle", fontFace: FONT_HEADING
    });

    const bulletItems = c.points.map(pt => ({
      text: "• " + pt + "\n",
      options: { color: TEXT_BODY }
    }));

    slide.addText(bulletItems, {
      x: c.x + 0.15, y: c.y + 0.48, w: c.w - 0.3, h: c.h - 0.55,
      fontSize: 7.2, lineSpacingMultiple: 1.15, fontFace: FONT_BODY
    });
  });

  slide.addNotes("Định hướng mở rộng các công nghệ vận hành thông minh IoT, bảo trì dự đoán và trí tuệ nhân tạo AI.");
}

// =============================================================
// SLIDE 28: Kết Luận Đồ Án & Giá Trị Thực Tiễn
// =============================================================
{
  const slide = pres.addSlide();
  addHeader(slide, "27. KẾT LUẬN ĐỒ ÁN & GIÁ TRỊ THỰC TIỄN", "TỔNG KẾT ĐỒ ÁN");

  // Left card: Hoàn thành mục tiêu
  slide.addShape(pres.ShapeType.roundRect, {
    x: 0.5, y: 1.15, w: 4.35, h: 3.95,
    fill: { color: BG_WHITE },
    line: { color: POP_MINT, width: 1.5 },
    rectRadius: 0.15
  });
  slide.addShape(pres.ShapeType.roundRect, {
    x: 0.7, y: 1.3, w: 3.95, h: 0.35,
    fill: { color: BG_SOFT_GREEN },
    line: { color: POP_MINT, width: 1 },
    rectRadius: 0.08
  });
  slide.addText("🎯 HOÀN THÀNH TOÀN DIỆN MỤC TIÊU OOAD", {
    x: 0.7, y: 1.3, w: 3.95, h: 0.35,
    fontSize: 8.8, bold: true, color: POP_MINT,
    align: "center", valign: "middle", fontFace: FONT_HEADING
  });
  slide.addText([
    { text: "• Chuẩn mực mô hình hóa hướng đối tượng:\n", options: { bold: true, color: TEXT_DARK } },
    { text: "  Áp dụng chính xác quy trình OOAD từ Use Case, Activity, Sequence đến Class Diagram chuẩn UML 2.5.\n\n", options: { color: TEXT_BODY } },
    { text: "• Hiện thực hóa thành công sản phẩm thực tế:\n", options: { bold: true, color: TEXT_DARK } },
    { text: "  Không chỉ dừng ở lý thuyết, toàn bộ kiến trúc đã được cài đặt hoàn chỉnh và vận hành mượt mà trên React 18 + Node.js + MySQL 8.0 InnoDB.\n\n", options: { color: TEXT_BODY } },
    { text: "• Khả năng chịu tải và bảo mật tin cậy:\n", options: { bold: true, color: TEXT_DARK } },
    { text: "  Thuật toán khóa ghế Transaction khóa triệt để Race Condition; phân quyền 5 Roles RBAC chặt chẽ.", options: { color: TEXT_BODY } }
  ], {
    x: 0.7, y: 1.75, w: 3.95, h: 3.2,
    fontSize: 7.3, lineSpacingMultiple: 1.15, fontFace: FONT_BODY
  });

  // Right card: Giá trị thực tiễn
  slide.addShape(pres.ShapeType.roundRect, {
    x: 5.15, y: 1.15, w: 4.35, h: 3.95,
    fill: { color: BG_WHITE },
    line: { color: POP_CORAL, width: 1.5 },
    rectRadius: 0.15
  });
  slide.addShape(pres.ShapeType.roundRect, {
    x: 5.35, y: 1.3, w: 3.95, h: 0.35,
    fill: { color: BG_SOFT_PINK },
    line: { color: POP_CORAL, width: 1 },
    rectRadius: 0.08
  });
  slide.addText("🚀 GIÁ TRỊ ỨNG DỤNG & THƯƠNG MẠI HÓA", {
    x: 5.35, y: 1.3, w: 3.95, h: 0.35,
    fontSize: 8.8, bold: true, color: POP_CORAL,
    align: "center", valign: "middle", fontFace: FONT_HEADING
  });
  slide.addText([
    { text: "• Giải quyết trọn vẹn 2 bài toán song hành:\n", options: { bold: true, color: TEXT_DARK } },
    { text: "  Vừa tối ưu trải nghiệm khách hàng (đặt vé siêu tốc, giữ ghế công bằng) vừa quản lý cơ sở vật chất phòng máy chính xác.\n\n", options: { color: TEXT_BODY } },
    { text: "• Sẵn sàng tích hợp mở rộng hệ sinh thái:\n", options: { bold: true, color: TEXT_DARK } },
    { text: "  Cấu trúc module hóa cao, dễ dàng kết nối cổng thanh toán thật (VNPay, MoMo), cổng IoT rạp và mô hình AI tư vấn.\n\n", options: { color: TEXT_BODY } },
    { text: "• Tính khả thi triển khai cao:\n", options: { bold: true, color: TEXT_DARK } },
    { text: "  Có thể chuyển giao trực tiếp làm nền tảng quản lý cho các chuỗi rạp chiếu phim hiện đại.", options: { color: TEXT_BODY } }
  ], {
    x: 5.35, y: 1.75, w: 3.95, h: 3.2,
    fontSize: 7.3, lineSpacingMultiple: 1.15, fontFace: FONT_BODY
  });

  slide.addNotes("Tổng kết thành quả đạt được của đồ án và tiềm năng ứng dụng thực tế vào sản phẩm thương mại.");
}

// =============================================================
// SLIDE 26: Q&A & Cảm Ơn
// =============================================================
{
  const slide = pres.addSlide();
  slide.background = { color: BG_PAGE };

  // Rainbow top edge stripe
  slide.addShape(pres.ShapeType.rect, { x: 0, y: 0, w: 2.5, h: 0.08, fill: { color: POP_CORAL } });
  slide.addShape(pres.ShapeType.rect, { x: 2.5, y: 0, w: 2.5, h: 0.08, fill: { color: POP_SUNNY } });
  slide.addShape(pres.ShapeType.rect, { x: 5.0, y: 0, w: 2.5, h: 0.08, fill: { color: POP_MINT } });
  slide.addShape(pres.ShapeType.rect, { x: 7.5, y: 0, w: 2.5, h: 0.08, fill: { color: POP_SKY } });

  // Big Celebration Card
  slide.addShape(pres.ShapeType.roundRect, {
    x: 0.8, y: 0.55, w: 8.4, h: 4.5,
    fill: { color: BG_WHITE },
    line: { color: POP_SUNNY, width: 1.5 },
    rectRadius: 0.2
  });

  // Top emoji badge
  slide.addShape(pres.ShapeType.roundRect, {
    x: 3.2, y: 0.85, w: 3.6, h: 0.38,
    fill: { color: BG_SOFT_YELLOW },
    line: { color: POP_SUNNY, width: 1 },
    rectRadius: 0.19
  });
  slide.addText("🎉 HOÀN THÀNH BÁO CÁO 🎉", {
    x: 3.2, y: 0.85, w: 3.6, h: 0.38,
    fontSize: 9.5, bold: true, color: POP_SUNNY,
    align: "center", valign: "middle", fontFace: FONT_HEADING
  });

  slide.addText("CẢM ƠN THẦY CÔ VÀ HỘI ĐỒNG\nĐÃ LẮNG NGHE BÀI THUYẾT TRÌNH!", {
    x: 1.0, y: 1.45, w: 8.0, h: 1.2,
    fontSize: 18, bold: true, color: TEXT_DARK,
    align: "center", lineSpacingMultiple: 1.2, fontFace: FONT_HEADING
  });

  slide.addText("HỆ THỐNG QUẢN LÝ VẬN HÀNH VÀ ĐẶT VÉ RẠP CHIẾU PHIM\nĐồ Án Môn Học Phân Tích & Thiết Kế Hướng Đối Tượng (OOAD)", {
    x: 1.0, y: 2.8, w: 8.0, h: 0.55,
    fontSize: 9.5, bold: true, color: POP_SKY, align: "center", fontFace: FONT_HEADING
  });

  // Q&A button badge
  slide.addShape(pres.ShapeType.roundRect, {
    x: 2.8, y: 3.6, w: 4.4, h: 0.7,
    fill: { color: BG_SOFT_PINK },
    line: { color: POP_CORAL, width: 1.5 },
    rectRadius: 0.18
  });
  slide.addText("💬 HỎI & ĐÁP (Q & A)\nKính mời Quý Thầy/Cô đặt câu hỏi", {
    x: 2.8, y: 3.6, w: 4.4, h: 0.7,
    fontSize: 9.5, bold: true, color: POP_CORAL,
    align: "center", valign: "middle", fontFace: FONT_HEADING
  });

  slide.addNotes("Em xin chân thành cảm ơn Quý Thầy/Cô và các bạn đã chú ý lắng nghe.");
}

// =============================================================
// 💾 XUẤT FILE POWERPOINT (.PPTX)
// =============================================================
const outputPath = path.join(__dirname, "Bao_Cao_OOAD_Quan_Ly_Rap_Chieu_Phim.pptx");
const rootPptPath = path.join(__dirname, "ppt.pptx");

pres.writeFile({ fileName: outputPath })
  .then(() => {
    console.log(`✅ Xuất thành công: ${outputPath}`);
    return pres.writeFile({ fileName: rootPptPath });
  })
  .then(() => {
    console.log(`✅ Đồng bộ thành công: ${rootPptPath}`);
  })
  .catch(err => {
    console.error("❌ Lỗi khi xuất PPTX:", err);
  });
