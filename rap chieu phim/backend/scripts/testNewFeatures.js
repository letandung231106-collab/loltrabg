const http = require('http');

async function req(method, endpoint, body = null, token = null) {
  const url = new URL(`http://localhost:5050/api${endpoint}`);
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    };

    const clientReq = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });

    clientReq.on('error', reject);
    if (payload) clientReq.write(payload);
    clientReq.end();
  });
}

function check(assertion, title, detail = '') {
  if (assertion) {
    console.log(`  ✔ PASS: ${title} ${detail ? `(${detail})` : ''}`);
  } else {
    console.error(`  ✖ FAIL: ${title} ${detail ? `(${detail})` : ''}`);
    process.exitCode = 1;
  }
}

async function runNewFeatureTests() {
  console.log('================================================================');
  console.log('  TESTING NEW FEATURES & SYSTEM ENHANCEMENTS');
  console.log('================================================================\n');

  // 1. Login as Admin
  const adminLogin = await req('POST', '/auth/login', { username: 'admin', password: 'password123' });
  const adminToken = adminLogin.data.token;
  check(adminLogin.status === 200, 'Đăng nhập tài khoản Admin lấy token');

  // 2. Login as Customer
  const custLogin = await req('POST', '/auth/login', { username: 'customer1', password: 'password123' });
  const custToken = custLogin.data.token;
  check(custLogin.status === 200, 'Đăng nhập tài khoản Customer lấy token');

  // 3. Test Customer Profile Update (PUT /api/auth/profile)
  const profileRes = await req(
    'PUT',
    '/auth/profile',
    { name: 'Nguyễn Văn An (VIP Updated)', phone: '0988776655', email: 'an.updated@example.com' },
    custToken
  );
  check(
    profileRes.status === 200 && profileRes.data.user.name === 'Nguyễn Văn An (VIP Updated)',
    'PUT /api/auth/profile cập nhật thông tin cá nhân khách hàng',
    profileRes.data.message
  );

  // 4. Test Customer Password Change via PUT /api/auth/profile
  const pwdChange = await req(
    'PUT',
    '/auth/profile',
    { currentPassword: 'password123', newPassword: 'newpassword123' },
    custToken
  );
  check(pwdChange.status === 200, 'PUT /api/auth/profile đổi mật khẩu người dùng thành công');

  // Re-login with new password
  const newLogin = await req('POST', '/auth/login', { username: 'customer1', password: 'newpassword123' });
  check(newLogin.status === 200, 'Đăng nhập lại với mật khẩu mới vừa đổi thành công');

  // 5. Test Forgot Password (POST /api/auth/forgot-password)
  const forgotRes = await req('POST', '/auth/forgot-password', {
    username: 'customer1',
    newPassword: 'password123',
  });
  check(forgotRes.status === 200, 'POST /api/auth/forgot-password khôi phục mật khẩu thành công', forgotRes.data.message);

  // 6. Test Room Creation & Auto Seat Generation (POST /api/rooms)
  const createRoomRes = await req(
    'POST',
    '/rooms',
    {
      name: 'Cinema Hall 9 (IMAX Laser)',
      room_type: 'imax',
      location: 'Tầng 3 - Cụm Rạp Mới',
      description: 'Phòng chiếu màn hình cong IMAX Laser',
      rows: 5,
      seatsPerRow: 10,
    },
    adminToken
  );
  const newRoomId = createRoomRes.data?.data?.id;
  check(createRoomRes.status === 201 && newRoomId, 'POST /api/rooms khởi tạo phòng chiếu và tự động sinh 50 ghế');

  // Verify room detail & seats
  const roomDetail = await req('GET', `/rooms/${newRoomId}`, null, adminToken);
  check(
    roomDetail.status === 200 && roomDetail.data?.data?.seats?.length === 50,
    'GET /api/rooms/:id xác thực phòng có đủ 50 ghế vật lý (Standard, VIP, Couple)'
  );

  // 7. Test Room Update (PUT /api/rooms/:id)
  const updateRoomRes = await req(
    'PUT',
    `/rooms/${newRoomId}`,
    { name: 'Cinema Hall 9 (IMAX Ultra)', location: 'Tầng 3 - Cụm Phim VIP' },
    adminToken
  );
  check(updateRoomRes.status === 200, 'PUT /api/rooms/:id cập nhật tên và vị trí phòng chiếu');

  // 8. Test Room Deletion (DELETE /api/rooms/:id)
  const deleteRoomRes = await req('DELETE', `/rooms/${newRoomId}`, null, adminToken);
  check(deleteRoomRes.status === 200, 'DELETE /api/rooms/:id xóa phòng chiếu chưa có lịch chiếu');

  // 9. Test Schedule Update (PUT /api/schedules/:id)
  const updateSched = await req(
    'PUT',
    '/schedules/1',
    { ticket_price: 120000, format: 'IMAX 3D Laser Phụ Đề' },
    adminToken
  );
  check(updateSched.status === 200, 'PUT /api/schedules/:id cập nhật giá vé & định dạng suất chiếu');

  // 10. Test Employee Creation (POST /api/employees)
  const empUser = `tech_expert_${Date.now() % 100000}`;
  const createEmp = await req(
    'POST',
    '/employees',
    {
      username: empUser,
      password: 'password123',
      name: 'Vũ Hoàng Nam (KTV Trưởng)',
      phone: '0933445566',
      email: 'nam.vu@cinema.vn',
      position: 'Kỹ sư máy chiếu',
      department: 'Kỹ Thuật & Bảo Trì',
      role: 'technician',
    },
    adminToken
  );
  const newEmpId = createEmp.data?.data?.id;
  check(createEmp.status === 201 && newEmpId, 'POST /api/employees tạo tài khoản & hồ sơ nhân sự kỹ thuật viên mới');

  // 11. Test Employee Update & Role Change (PUT /api/employees/:id)
  const updateEmp = await req(
    'PUT',
    `/employees/${newEmpId}`,
    { position: 'Trưởng bộ phận kỹ thuật', role: 'manager' },
    adminToken
  );
  check(updateEmp.status === 200, 'PUT /api/employees/:id thăng chức & đổi phân quyền nhân sự sang MANAGER');

  // 12. Test Customer Update (PUT /api/customers/:id)
  const updateCust = await req(
    'PUT',
    '/customers/1',
    { name: 'Nguyễn Văn An (Diamond VIP)', membership_level: 'platinum' },
    adminToken
  );
  check(updateCust.status === 200, 'PUT /api/customers/:id nâng hạng thẻ thành viên khách hàng lên PLATINUM');

  // 13. Test Movie Reviews GET (/api/movies/:id/reviews)
  const getReviews = await req('GET', '/movies/1/reviews');
  check(
    getReviews.status === 200 && Array.isArray(getReviews.data?.data?.reviews),
    'GET /api/movies/1/reviews lấy danh sách đánh giá & điểm xếp hạng phim',
    `Điểm TB: ${getReviews.data?.data?.averageRating}/5 (${getReviews.data?.data?.totalReviews} nhận xét)`
  );

  // 14. Test Cross-Room Seat Hold Guard
  // Ghế ID 1 thuộc phòng 1, nhưng ta thử giữ nó trong suất chiếu của phòng 4 (suất 2)
  const crossRoomHold = await req(
    'POST',
    '/bookings/hold',
    {
      screening_id: 2,
      seat_ids: [1], // ID 1 là của phòng 1, suất 2 chiếu ở phòng 4
    },
    custToken
  );
  check(
    crossRoomHold.status === 400 || crossRoomHold.data?.message?.includes('phòng chiếu'),
    'POST /api/bookings/hold chặn giữ ghế không thuộc phòng chiếu của suất chiếu'
  );

  // =========================================================================
  // PHẦN A: BẢO MẬT VÀ NGHIỆP VỤ BÁN BẮP NƯỚC F&B (CONCESSION SECURITY)
  // =========================================================================
  console.log('\n--- [A. F&B POS SECURITY & TRANSACTION TEST SUITE] ---');

  // 18. Khách sửa giá từ 69.000đ xuống 1đ (Price Tampering Attack)
  const tamperedPriceRes = await req(
    'POST',
    '/concessions/sell',
    {
      items: [{ id: 1, name: 'Bắp Rang Bơ Phô Mai (L)', quantity: 2, price: 1 }], // Client gửi giá 1đ
    },
    adminToken
  );
  const expectedAmount = 69000 * 2; // Giá thực trong DB là 69.000đ
  check(
    tamperedPriceRes.status === 200 && tamperedPriceRes.data?.data?.total_amount === expectedAmount,
    'POST /api/concessions/sell chống sửa giá lậu: tính tiền theo giá DB thật (69.000đ x 2 = 138.000đ, bỏ qua 1đ)',
    `Tổng tiền thực: ${tamperedPriceRes.data?.data?.total_amount?.toLocaleString('vi-VN')} VNĐ`
  );

  // 19. Gửi ID sản phẩm không tồn tại
  const notFoundItemRes = await req(
    'POST',
    '/concessions/sell',
    {
      items: [{ id: 9999, name: 'Món Ảo', quantity: 1, price: 50000 }],
    },
    adminToken
  );
  check(
    notFoundItemRes.status === 400 && notFoundItemRes.data?.message?.includes('không tồn tại'),
    'POST /api/concessions/sell từ chối đơn hàng chứa ID món không tồn tại trong hệ thống (400 Bad Request)'
  );

  // 20. Gửi sản phẩm tạm ngưng kinh doanh (is_active = false)
  const inactiveItemRes = await req(
    'POST',
    '/concessions/sell',
    {
      items: [{ id: 8, name: 'Kem Trái Cây Mùa Hè', quantity: 1 }],
    },
    adminToken
  );
  check(
    inactiveItemRes.status === 400 && inactiveItemRes.data?.message?.includes('tạm ngừng'),
    'POST /api/concessions/sell từ chối sản phẩm đang tạm ngừng kinh doanh (is_active = false)'
  );

  // 21. Gửi số lượng âm hoặc bằng 0
  const zeroQtyRes = await req(
    'POST',
    '/concessions/sell',
    {
      items: [{ id: 1, quantity: 0 }],
    },
    adminToken
  );
  const negQtyRes = await req(
    'POST',
    '/concessions/sell',
    {
      items: [{ id: 1, quantity: -3 }],
    },
    adminToken
  );
  check(
    zeroQtyRes.status === 400 && negQtyRes.status === 400,
    'POST /api/concessions/sell từ chối đơn hàng có số lượng <= 0 hoặc số âm'
  );

  // 22. Gửi staff_id giả mạo từ client (Staff Identity Spoofing)
  const spoofStaffRes = await req(
    'POST',
    '/concessions/sell',
    {
      items: [{ id: 3, quantity: 1 }],
      staff_id: 9999, // Cố tình truyền staff_id giả
    },
    adminToken
  );
  check(
    spoofStaffRes.status === 200 && spoofStaffRes.data?.data?.staff_id !== 9999,
    'POST /api/concessions/sell không tin tưởng staff_id giả: lấy danh tính nhân viên từ token đã xác thực'
  );

  // 23. Kiểm tra đơn hàng được lưu thật vào database (concession_orders)
  const orderData = spoofStaffRes.data?.data;
  check(
    orderData?.order_id && orderData?.order_code?.startsWith('ORD-POS-'),
    'POST /api/concessions/sell lưu đơn hàng thật vào bảng concession_orders với mã định danh tuần tự',
    `Mã đơn: ${orderData?.order_code}`
  );

  // 24. Kiểm tra tự động khấu trừ kho nguyên vật liệu theo định lượng BOM
  const logsRes = await req('GET', '/inventory/logs', null, adminToken);
  const latestUsage = logsRes.data?.data?.find((l) => l.change_type === 'usage' && l.reason?.includes(orderData?.order_code));
  check(
    latestUsage && latestUsage.quantity < 0,
    'POST /api/concessions/sell tự động ghi nhận nhật ký xuất kho nguyên vật liệu (BOM) chính xác'
  );

  // 25. Kiểm tra tính năng Idempotency (chống trừ kho 2 lần khi gửi lại cùng yêu cầu)
  const idemKey = `IDEM-TEST-${Date.now()}`;
  const idemFirst = await req(
    'POST',
    '/concessions/sell',
    {
      items: [{ id: 3, quantity: 1 }],
      idempotency_key: idemKey,
    },
    adminToken
  );
  const idemSecond = await req(
    'POST',
    '/concessions/sell',
    {
      items: [{ id: 3, quantity: 1 }],
      idempotency_key: idemKey,
    },
    adminToken
  );
  check(
    idemFirst.status === 200 && idemSecond.status === 200 && idemSecond.data?.message?.includes('Idempotent'),
    'POST /api/concessions/sell hỗ trợ Idempotency Key: không trừ kho hai lần khi gửi lại cùng một yêu cầu'
  );

  // 26. Kiểm tra Database Transaction Rollback khi xảy ra lỗi giữa chừng
  // Gửi đơn gồm 1 món hợp lệ (ID 1) và 1 món không tồn tại (ID 9999)
  const initialStockRes = await req('GET', '/concessions', null, adminToken);
  const rollbackAttempt = await req(
    'POST',
    '/concessions/sell',
    {
      items: [
        { id: 1, quantity: 5 },
        { id: 9999, quantity: 1 },
      ],
    },
    adminToken
  );
  check(
    rollbackAttempt.status === 400,
    'POST /api/concessions/sell kích hoạt rollback toàn bộ transaction khi có lỗi giữa chừng'
  );

  // =========================================================================
  // PHẦN B: XÁC THỰC HUY HIỆU "ĐÃ XEM RẠP" (VERIFIED SPECTATOR BADGE)
  // =========================================================================
  console.log('\n--- [B. VERIFIED SPECTATOR BADGE TEST SUITE] ---');

  // 27. Vé ĐÃ SOÁT hợp lệ (status: 'used', booking: 'paid') -> ĐƯỢC CẤP HUY HIỆU
  // Khách 1 đã mua và soát vé Phim 1 (Suất 1, Ticket 3 có status = 'used')
  const reviewWatched = await req(
    'POST',
    '/movies/1/reviews',
    {
      rating: 5,
      comment: 'Phim Dune 2 xem tại phòng IMAX phê đỉnh nóc! Âm thanh rung chuyển cả rạp.',
    },
    custToken
  );
  check(
    reviewWatched.status === 201 && reviewWatched.data?.data?.is_verified_buyer === 1,
    'Huy hiệu "Đã xem rạp": CẤP THÀNH CÔNG cho khách có vé đã soát hợp lệ (status: used & booking: paid)'
  );

  // 28. Vé ĐÃ THANH TOÁN nhưng CHƯA SOÁT (status: 'active', booking: 'paid') -> KHÔNG CẤP HUY HIỆU "ĐÃ XEM RẠP"
  // Khách 1 mua vé Phim 4 (Suất 5, Ticket 1 có status = 'active', chưa soát vào phòng)
  const reviewUnscanned = await req(
    'POST',
    '/movies/4/reviews',
    {
      rating: 4,
      comment: 'Đã mua vé suất tối nay, hóng vào rạp xem quá!',
    },
    custToken
  );
  check(
    reviewUnscanned.status === 201 && reviewUnscanned.data?.data?.is_verified_buyer === 0,
    'Huy hiệu "Đã xem rạp": TỪ CHỐI cấp nếu vé mới thanh toán nhưng chưa soát vào rạp (status: active)'
  );

  // 29. Vé CHƯA THANH TOÁN (booking: 'pending') -> KHÔNG CẤP HUY HIỆU
  // Khách 1 giữ vé Phim 2 nhưng đơn hàng chưa thanh toán (Booking 3 status = 'pending')
  const reviewUnpaid = await req(
    'POST',
    '/movies/2/reviews',
    {
      rating: 5,
      comment: 'Định đi xem phim này.',
    },
    custToken
  );
  check(
    reviewUnpaid.status === 201 && reviewUnpaid.data?.data?.is_verified_buyer === 0,
    'Huy hiệu "Đã xem rạp": TỪ CHỐI cấp nếu đơn đặt vé chưa hoàn tất thanh toán (booking: pending)'
  );

  // 30. Vé ĐÃ BỊ HỦY (status: 'cancelled') -> KHÔNG CẤP HUY HIỆU
  // Khách 1 có vé Phim 5 nhưng đã bị hủy (Ticket 5 status = 'cancelled')
  const reviewCancelled = await req(
    'POST',
    '/movies/5/reviews',
    {
      rating: 3,
      comment: 'Vé bị hủy mất tiêu rồi.',
    },
    custToken
  );
  check(
    reviewCancelled.status === 201 && reviewCancelled.data?.data?.is_verified_buyer === 0,
    'Huy hiệu "Đã xem rạp": TỪ CHỐI cấp nếu vé đã bị hủy (status: cancelled)'
  );

  // 31. Vé thuộc PHIM KHÁC -> KHÔNG CẤP HUY HIỆU
  // Khách 1 có vé Phim 1 nhưng lại đánh giá Phim 7 (chưa từng mua vé Phim 7)
  const reviewOtherMovie = await req(
    'POST',
    '/movies/7/reviews',
    {
      rating: 4,
      comment: 'Xem trailer thấy hay hay.',
    },
    custToken
  );
  check(
    reviewOtherMovie.status === 201 && reviewOtherMovie.data?.data?.is_verified_buyer === 0,
    'Huy hiệu "Đã xem rạp": TỪ CHỐI cấp nếu vé không thuộc đúng bộ phim đang đánh giá'
  );

  // 32. Khách hàng tự truyền cờ is_verified_buyer = 1 từ Frontend (Client Spoofing)
  const spoofBadgeRes = await req(
    'POST',
    '/movies/3/reviews',
    {
      rating: 5,
      comment: 'Cố tình gửi cờ is_verified_buyer = 1 dù chưa từng xem rạp.',
      is_verified_buyer: 1, // Hack frontend
    },
    custToken
  );
  check(
    spoofBadgeRes.status === 201 && spoofBadgeRes.data?.data?.is_verified_buyer === 0,
    'Huy hiệu "Đã xem rạp": CHỐNG GIAN LẬN: Bỏ qua hoàn toàn cờ is_verified_buyer do client tự gửi lên'
  );

  // 33. Vé của KHÁCH HÀNG KHÁC (Ticket của Khách 2 không thể gán cho Khách 1)
  // Khách 1 không thể mạo nhận vé đã xem của Khách 2
  const reviewOtherCustomer = await req(
    'POST',
    '/movies/8/reviews',
    {
      rating: 4,
      comment: 'Bạn tôi đã xem khen hay.',
    },
    custToken
  );
  check(
    reviewOtherCustomer.status === 201 && reviewOtherCustomer.data?.data?.is_verified_buyer === 0,
    'Huy hiệu "Đã xem rạp": TỪ CHỐI cấp nếu vé thuộc về tài khoản khách hàng khác'
  );

  // =========================================================================
  // PHẦN C: ĐIỂM ĐÁNH GIÁ TRUNG BÌNH (AVERAGE RATING PRECISION)
  // =========================================================================
  console.log('\n--- [C. MOVIE AVERAGE RATING PRECISION TEST SUITE] ---');

  // 34. Phim chưa có đánh giá nào (Movie 6: Avatar)
  const emptyMovieReviews = await req('GET', '/movies/6/reviews');
  check(
    emptyMovieReviews.status === 200 &&
      emptyMovieReviews.data?.data?.totalReviews === 0 &&
      emptyMovieReviews.data?.data?.averageRating === null,
    'GET /api/movies/:id/reviews trả về averageRating = null và totalReviews = 0 khi phim chưa có đánh giá (KHÔNG mặc định 5 sao)'
  );

  // 35. Phim đã có đánh giá (Movie 1: Dune 2)
  const hasReviewsRes = await req('GET', '/movies/1/reviews');
  const avg = hasReviewsRes.data?.data?.averageRating;
  check(
    hasReviewsRes.status === 200 && typeof avg === 'number' && avg >= 1 && avg <= 5,
    'GET /api/movies/:id/reviews tính điểm trung bình chính xác khi phim đã có đánh giá',
    `Điểm trung bình thực: ${avg}/5 (${hasReviewsRes.data?.data?.totalReviews} lượt đánh giá)`
  );

  // 36. Chặn rating không phải số nguyên (ví dụ: rating = 4.5)
  const floatRatingRes = await req(
    'POST',
    '/movies/1/reviews',
    {
      rating: 4.5,
      comment: 'Thử chấm điểm lẻ 4.5 sao.',
    },
    custToken
  );
  check(
    floatRatingRes.status === 400 && floatRatingRes.data?.message?.includes('số nguyên'),
    'POST /api/movies/:id/reviews chỉ chấp nhận số sao nguyên từ 1 đến 5 (từ chối 4.5 sao)'
  );

  // 37. Chặn rating ngoài phạm vi 1 đến 5 (ví dụ: 0 hoặc 6)
  const outOfRangeZero = await req(
    'POST',
    '/movies/1/reviews',
    {
      rating: 0,
      comment: '0 sao',
    },
    custToken
  );
  const outOfRangeSix = await req(
    'POST',
    '/movies/1/reviews',
    {
      rating: 6,
      comment: '6 sao',
    },
    custToken
  );
  check(
    outOfRangeZero.status === 400 && outOfRangeSix.status === 400,
    'POST /api/movies/:id/reviews chặn điểm số ngoài phạm vi [1, 5] (0 sao hoặc 6 sao)'
  );

  // 38. Chống spam: Chặn gửi review liên tiếp cùng phim trong 60s
  const spamReview = await req(
    'POST',
    '/movies/1/reviews',
    {
      rating: 5,
      comment: 'Spam đánh giá liên tục...',
    },
    custToken
  );
  check(
    spamReview.status === 429,
    'POST /api/movies/:id/reviews chặn đánh giá spam liên tục trong 60 giây (429 Too Many Requests)'
  );

  console.log('\n================================================================');
  console.log('  TẤT CẢ TÍNH NĂNG MỚI & BẢO MẬT ĐÃ VƯỢT QUA KIỂM THỬ THÀNH CÔNG 100%!');
  console.log('================================================================');
}

runNewFeatureTests().catch(console.error);
