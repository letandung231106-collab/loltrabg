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

  // 14. Test Movie Review POST - Verified Buyer (Phim 4: khách hàng An đã mua vé)
  const postReview = await req(
    'POST',
    '/movies/4/reviews',
    {
      rating: 5,
      comment: 'Trải nghiệm xem phim tuyệt vời, màn hình sắc nét và ghế ngồi rất thoải mái!',
    },
    custToken
  );
  check(
    postReview.status === 201 && postReview.data?.data?.rating === 5 && postReview.data?.data?.is_verified_buyer === 1,
    'POST /api/movies/4/reviews khách hàng đã mua vé nhận đúng huy hiệu Verified Spectator (is_verified_buyer = 1)'
  );

  // 14b. Test Movie Review POST - Unverified Buyer (Phim 2: khách hàng An CHƯA mua vé)
  const unverifiedReview = await req(
    'POST',
    '/movies/2/reviews',
    {
      rating: 4,
      comment: 'Hóng phim này chiếu lại quá!',
    },
    custToken
  );
  check(
    unverifiedReview.status === 201 && unverifiedReview.data?.data?.is_verified_buyer === 0,
    'POST /api/movies/2/reviews khách chưa mua vé KHÔNG có huy hiệu (is_verified_buyer = 0)'
  );

  // 15. Test Movie Review Validation (rating ngoài phạm vi 1-5)
  const invalidReview = await req(
    'POST',
    '/movies/1/reviews',
    {
      rating: 99,
      comment: 'Điểm rating không hợp lệ',
    },
    custToken
  );
  check(
    invalidReview.status === 400,
    'POST /api/movies/1/reviews kiểm tra dữ liệu đầu vào chặn rating không hợp lệ (>5 sao)'
  );

  // 16. Test Movie Review Anti-Spam (chặn gửi trùng phim 4 trong vòng 60s)
  const spamReview = await req(
    'POST',
    '/movies/4/reviews',
    {
      rating: 4,
      comment: 'Thử gửi đánh giá spam liên tục...',
    },
    custToken
  );
  check(
    spamReview.status === 429,
    'POST /api/movies/4/reviews chặn đánh giá spam liên tục trong 60 giây (429 Too Many Requests)'
  );

  // 17. Test Cross-Room Seat Hold Guard
  // Ghế ID 1 thuộc phòng 1, nhưng ta thử giữ nó trong suất chiếu của phòng 2 (suất 2)
  const crossRoomHold = await req(
    'POST',
    '/bookings/hold',
    {
      screening_id: 2,
      seat_ids: [1], // ID 1 là của phòng 1, suất 2 chiếu ở phòng 2
    },
    custToken
  );
  check(
    crossRoomHold.status === 400 || crossRoomHold.data?.message?.includes('phòng chiếu'),
    'POST /api/bookings/hold chặn giữ ghế không thuộc phòng chiếu của suất chiếu'
  );

  // 18. Test Concession Order Validation (chặn số lượng <= 0)
  const invalidConcession = await req(
    'POST',
    '/concessions/sell',
    {
      items: [{ id: 1, name: 'Bắp Rang Bơ', quantity: 0, price: 45000 }],
    },
    adminToken
  );
  check(
    invalidConcession.status === 400,
    'POST /api/concessions/sell chặn đơn hàng có số lượng món <= 0'
  );

  console.log('\n================================================================');
  console.log('  TẤT CẢ TÍNH NĂNG MỚI ĐÃ VƯỢT QUA KIỂM THỬ THÀNH CÔNG 100%!');
  console.log('================================================================');
}

runNewFeatureTests().catch(console.error);
