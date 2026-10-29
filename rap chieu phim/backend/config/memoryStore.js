// In-memory mock fallback data store
// Used when MySQL server is offline so the application can run seamlessly out-of-the-box

const roles = [
  { id: 1, name: 'admin', description: 'Quản trị viên toàn quyền hệ thống' },
  { id: 2, name: 'manager', description: 'Quản lý vận hành rạp chiếu phim' },
  { id: 3, name: 'staff', description: 'Nhân viên vận hành phòng chiếu & rạp' },
  { id: 4, name: 'technician', description: 'Kỹ thuật viên sửa chữa & bảo trì thiết bị' },
  { id: 5, name: 'customer', description: 'Khách hàng đặt vé xem phim' },
];

const users = [
  { id: 1, username: 'admin', password: 'password123', role_id: 1, status: 'active', created_at: '2026-09-14 08:00:00' },
  { id: 2, username: 'manager1', password: 'password123', role_id: 2, status: 'active', created_at: '2026-09-14 08:00:00' },
  { id: 3, username: 'staff1', password: 'password123', role_id: 3, status: 'active', created_at: '2026-09-14 08:00:00' },
  { id: 4, username: 'staff2', password: 'password123', role_id: 3, status: 'active', created_at: '2026-09-14 08:00:00' },
  { id: 5, username: 'tech1', password: 'password123', role_id: 4, status: 'active', created_at: '2026-09-14 08:00:00' },
  { id: 6, username: 'tech2', password: 'password123', role_id: 4, status: 'active', created_at: '2026-09-14 08:00:00' },
  { id: 7, username: 'customer1', password: 'password123', role_id: 5, status: 'active', created_at: '2026-09-14 08:00:00' },
  { id: 8, username: 'customer2', password: 'password123', role_id: 5, status: 'active', created_at: '2026-09-14 08:00:00' },
];

const customers = [
  { id: 1, user_id: 7, name: 'Nguyễn Văn An', email: 'nguyenvanan@gmail.com', phone: '0901234567', membership_level: 'gold', created_at: '2026-09-14 08:00:00' },
  { id: 2, user_id: 8, name: 'Trần Thị Mai', email: 'tranthimai@gmail.com', phone: '0912345678', membership_level: 'platinum', created_at: '2026-09-14 08:00:00' },
];

const employees = [
  { id: 1, user_id: 1, name: 'Hồ Quốc Bảo (Admin)', phone: '0909000001', email: 'admin@cinema.vn', position: 'Giám Đốc Hệ Thống', department: 'Ban Giám Đốc', status: 'active' },
  { id: 2, user_id: 2, name: 'Phạm Minh Đức', phone: '0909000002', email: 'duc.pm@cinema.vn', position: 'Trưởng Quản Lý Rạp', department: 'Vận Hành Rạp', status: 'active' },
  { id: 4, user_id: 3, name: 'Nguyễn Thu Trang', phone: '0909000003', email: 'trang.nt@cinema.vn', position: 'Nhân Viên Soát Vé', department: 'Vận Hành Rạp', status: 'active' },
  { id: 5, user_id: 4, name: 'Đỗ Tuấn Kiệt', phone: '0909000004', email: 'kiet.dt@cinema.vn', position: 'Nhân Viên Kiểm Tra Phòng', department: 'Vận Hành Rạp', status: 'active' },
  { id: 6, user_id: 5, name: 'Võ Minh Quân', phone: '0909000005', email: 'quan.vm@cinema.vn', position: 'Kỹ Thuật Viên Trưởng', department: 'Kỹ Thuật & Bảo Trì', status: 'active' },
  { id: 7, user_id: 6, name: 'Lý Quốc Hùng', phone: '0909000006', email: 'hung.lq@cinema.vn', position: 'Kỹ Thuật Viên Máy Chiếu', department: 'Kỹ Thuật & Bảo Trì', status: 'active' },
];

const movies = [
  {
    id: 1,
    name: 'Dune: Hành Tinh Cát - Phần 2',
    genre: 'Khoa học viễn tưởng, Hành động',
    director: 'Denis Villeneuve',
    actors: 'Timothée Chalamet, Zendaya, Rebecca Ferguson, Javier Bardem',
    duration: 166,
    release_date: '2026-03-01',
    end_date: '2026-05-30',
    age_rating: 'T16',
    language: 'Tiếng Anh - Phụ đề Tiếng Việt',
    format: 'IMAX 2D, 2D Digital',
    description: 'Hành trình huyền thoại của Paul Atreides khi anh hợp nhất với Chani và người Fremen trên con đường trả thù những kẻ đã hủy diệt gia tộc mình.',
    poster: 'https://image.tmdb.org/t/p/w780/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg',
    trailer: 'https://www.youtube.com/watch?v=Way9Dexny3w',
    status: 'now_showing',
  },
  {
    id: 2,
    name: 'Oppenheimer',
    genre: 'Tiểu sử, Lịch sử, Kịch tính',
    director: 'Christopher Nolan',
    actors: 'Cillian Murphy, Emily Blunt, Matt Damon, Robert Downey Jr.',
    duration: 180,
    release_date: '2026-02-15',
    end_date: '2026-05-15',
    age_rating: 'T18',
    language: 'Tiếng Anh - Phụ đề Tiếng Việt',
    format: 'IMAX 2D, 2D Digital',
    description: 'Câu chuyện về nhà vật lý lý thuyết J. Robert Oppenheimer, người lãnh đạo Dự án Manhattan phát triển vũ khí hạt nhân đầu tiên.',
    poster: 'https://image.tmdb.org/t/p/w780/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg',
    trailer: 'https://www.youtube.com/watch?v=uYPbbksJxIg',
    status: 'now_showing',
  },
  {
    id: 3,
    name: 'Mai',
    genre: 'Tâm lý, Tình cảm',
    director: 'Trấn Thành',
    actors: 'Phương Anh Đào, Tuấn Trần, Trấn Thành, Hồng Đào',
    duration: 131,
    release_date: '2026-02-10',
    end_date: '2026-04-30',
    age_rating: 'T18',
    language: 'Tiếng Việt',
    format: '2D Digital',
    description: 'Mai là một người phụ nữ làm nghề massage đối mặt với những định kiến xã hội và tìm kiếm hạnh phúc đích thực bên chàng nhạc công trẻ Dương.',
    poster: 'https://image.tmdb.org/t/p/w780/uFsn8qBEzbeJCqH0LsViwPom5ww.jpg',
    trailer: 'https://www.youtube.com/watch?v=0h6Qz0k0Q_0',
    status: 'now_showing',
  },
  {
    id: 4,
    name: 'Lật Mặt 7: Một Điều Ước',
    genre: 'Gia đình, Tâm lý, Hài',
    director: 'Lý Hải',
    actors: 'Thanh Hiền, Trương Minh Cường, Đinh Y Nhung',
    duration: 138,
    release_date: '2026-04-26',
    end_date: '2026-06-30',
    age_rating: 'K',
    language: 'Tiếng Việt',
    format: '2D Digital',
    description: 'Câu chuyện đầy xúc động về tình mẫu tử của bà Hai 73 tuổi cùng 5 người con đã trưởng thành.',
    poster: 'https://image.tmdb.org/t/p/w780/1K7pHhCZprfDXB7LkCquIK62yCb.jpg',
    trailer: 'https://www.youtube.com/watch?v=r0X6qZ1_yT0',
    status: 'now_showing',
  },
  {
    id: 5,
    name: 'Deadpool & Wolverine',
    genre: 'Hành động, Hài hước',
    director: 'Shawn Levy',
    actors: 'Ryan Reynolds, Hugh Jackman',
    duration: 127,
    release_date: '2026-07-26',
    end_date: '2026-09-30',
    age_rating: 'T18',
    language: 'Tiếng Anh - Phụ đề',
    format: '3D, 4DX, 2D Digital',
    description: 'Cặp đôi lầy lội Deadpool và Wolverine cùng hợp sức trong chuyến phiêu lưu đa vũ trụ bùng nổ.',
    poster: 'https://image.tmdb.org/t/p/w780/8cdWjvZQUExUUTzyp4t6EDMubfO.jpg',
    trailer: 'https://www.youtube.com/watch?v=73_1biulkYk',
    status: 'now_showing',
  },
  {
    id: 6,
    name: 'Godzilla x Kong: Đế Chế Mới',
    genre: 'Hành động, Viễn tưởng',
    director: 'Adam Wingard',
    actors: 'Rebecca Hall, Brian Tyree Henry',
    duration: 115,
    release_date: '2026-03-29',
    end_date: '2026-05-20',
    age_rating: 'T13',
    language: 'Tiếng Anh - Phụ đề',
    format: '3D, 4DX, IMAX 2D',
    description: 'Hai quái thú khổng lồ Godzilla và Kong cùng chống lại một mối đe dọa tiềm ẩn tại Trái Đất Rỗng.',
    poster: 'https://image.tmdb.org/t/p/w780/z1p34vh7dEOnLDmyCrlUVLuoDzd.jpg',
    trailer: 'https://www.youtube.com/watch?v=lV1OOlGwExM',
    status: 'now_showing',
  },
  {
    id: 7,
    name: 'Inside Out 2: Những Mảnh Ghép Cảm Xúc 2',
    genre: 'Hoạt hình, Gia đình',
    director: 'Kelsey Mann',
    actors: 'Amy Poehler, Maya Hawke',
    duration: 96,
    release_date: '2026-06-14',
    end_date: '2026-08-30',
    age_rating: 'P',
    language: 'Lồng tiếng Tiếng Việt',
    format: '2D Digital, 3D',
    description: 'Riley bước vào tuổi dậy thì và trung tâm chỉ huy cảm xúc đón nhận những thành viên mới đầy rắc rối: Lo Âu, Ghen Tị...',
    poster: 'https://image.tmdb.org/t/p/w780/vpnVM9B6NMmQpWeZvzLvDESb2QY.jpg',
    trailer: 'https://www.youtube.com/watch?v=LEjhY15eCx0',
    status: 'now_showing',
  },
  {
    id: 8,
    name: 'Kung Fu Panda 4',
    genre: 'Hoạt hình, Võ thuật, Hài hước',
    director: 'Mike Mitchell',
    actors: 'Jack Black, Awkwafina, Viola Davis',
    duration: 94,
    release_date: '2026-03-08',
    end_date: '2026-05-15',
    age_rating: 'P',
    language: 'Lồng tiếng Tiếng Việt',
    format: '2D Digital, 3D',
    description: 'Po chuẩn bị trở thành Thủ lĩnh Tinh thần của Thung lũng Bình Yên và phải tìm kiếm một Thần Long Đại Hiệp kế cận trước kẻ thù Tắc Kè Bông.',
    poster: 'https://image.tmdb.org/t/p/w780/kDp1vUBnMpe8ak4rjgl3cLELqjU.jpg',
    trailer: 'https://www.youtube.com/watch?v=_inKs4eeHiI',
    status: 'now_showing',
  },
  {
    id: 9,
    name: 'Quật Mộ Trùng Ma (Exhuma)',
    genre: 'Kinh dị, Bí ẩn, Giật gân',
    director: 'Jang Jae-hyun',
    actors: 'Choi Min-sik, Kim Go-eun, Yoo Hae-jin, Lee Do-hyun',
    duration: 134,
    release_date: '2026-03-15',
    end_date: '2026-05-10',
    age_rating: 'T18',
    language: 'Tiếng Hàn - Phụ đề Tiếng Việt',
    format: '2D Digital',
    description: 'Hai pháp sư, một chuyên gia phong thủy và một nhân viên tang lễ khai quật một ngôi mộ bí ẩn để rồi giải phóng một thực thể tà ác.',
    poster: 'https://image.tmdb.org/t/p/w780/tw0i3kkmOTjDjGFZTLHKhoeXVvA.jpg',
    trailer: 'https://www.youtube.com/watch?v=q6D9YVw6x4M',
    status: 'now_showing',
  },
  {
    id: 10,
    name: 'Thám Tử Lừng Danh Conan: Ngôi Sao 5 Cánh 1 Triệu Đô',
    genre: 'Hoạt hình, Trinh thám, Hành động',
    director: 'Chika Nagaoka',
    actors: 'Minami Takayama, Wakana Yamazaki, Kappei Yamaguchi',
    duration: 110,
    release_date: '2026-08-02',
    end_date: '2026-10-15',
    age_rating: 'K',
    language: 'Lồng tiếng & Phụ đề Tiếng Việt',
    format: '2D Digital, IMAX 2D',
    description: 'Siêu đạo chích Kid nhắm vào một thanh kiếm Nhật cổ tại Hakodate, dẫn đến cuộc đối đầu nghẹt thở giữa Conan, Heiji và Kid.',
    poster: 'https://image.tmdb.org/t/p/w780/4TMkOnI6rCYxqD059aeeQSBv5mc.jpg',
    trailer: 'https://www.youtube.com/watch?v=n7z5z_9yq4k',
    status: 'now_showing',
  },
  {
    id: 11,
    name: 'Kẻ Trộm Mặt Trăng 4 (Despicable Me 4)',
    genre: 'Hoạt hình, Hài hước',
    director: 'Chris Renaud',
    actors: 'Steve Carell, Kristen Wiig, Will Ferrell',
    duration: 95,
    release_date: '2026-07-05',
    end_date: '2026-09-10',
    age_rating: 'P',
    language: 'Lồng tiếng Tiếng Việt',
    format: '2D Digital, 3D',
    description: 'Gia đình Gru chào đón thành viên mới Gru Jr. và đối đầu với kẻ thù Maxime Le Mal vừa trốn thoát khỏi nhà tù siêu cấp.',
    poster: 'https://image.tmdb.org/t/p/w780/lWVwWRLqpS1OaNg7KT0ZecSW0PK.jpg',
    trailer: 'https://www.youtube.com/watch?v=qQlr9-rF32A',
    status: 'now_showing',
  },
  {
    id: 12,
    name: 'Transformers One',
    genre: 'Hoạt hình, Hành động, Viễn tưởng',
    director: 'Josh Cooley',
    actors: 'Chris Hemsworth, Brian Tyree Henry, Scarlett Johansson',
    duration: 104,
    release_date: '2026-09-20',
    end_date: '2026-11-15',
    age_rating: 'K',
    language: 'Lồng tiếng & Phụ đề Tiếng Việt',
    format: '2D Digital, 3D',
    description: 'Câu chuyện chưa kể về nguồn gốc mối quan hệ từ bạn chí cốt thành kẻ thù truyền kiếp giữa Orion Pax và D-16.',
    poster: 'https://image.tmdb.org/t/p/w780/qbkAqmmEIZfrCO8ZQAuIuVMlWoV.jpg',
    trailer: 'https://www.youtube.com/watch?v=u2NuURum_bE',
    status: 'coming_soon',
  },
  {
    id: 13,
    name: 'Furiosa: Câu Chuyện Từ Max Điên',
    genre: 'Hành động, Hậu tận thế',
    director: 'George Miller',
    actors: 'Anya Taylor-Joy, Chris Hemsworth, Tom Burke',
    duration: 148,
    release_date: '2026-05-24',
    end_date: '2026-07-30',
    age_rating: 'T18',
    language: 'Tiếng Anh - Phụ đề Tiếng Việt',
    format: 'IMAX 2D, 4DX',
    description: 'Hành trình thời trẻ của nữ chiến binh Furiosa khi bị bắt cóc khỏi Vùng Xanh và tìm đường trở về nhà qua Vùng Đất Chết.',
    poster: 'https://image.tmdb.org/t/p/w780/iADOJ8Zymht2JPMoy3R7xceZprc.jpg',
    trailer: 'https://www.youtube.com/watch?v=XJMuhwVlca4',
    status: 'coming_soon',
  },
  {
    id: 14,
    name: 'Spider-Man: Beyond the Spider-Verse',
    genre: 'Hoạt hình, Hành động',
    director: 'Joaquim Dos Santos',
    actors: 'Shameik Moore, Hailee Steinfeld, Oscar Isaac',
    duration: 140,
    release_date: '2026-11-20',
    end_date: '2027-01-30',
    age_rating: 'T13',
    language: 'Tiếng Anh - Phụ đề',
    format: 'IMAX 2D, 3D, 4DX',
    description: 'Hồi kết hoành tráng trong hành trình cứu lấy đa vũ trụ của người nhện Miles Morales.',
    poster: 'https://image.tmdb.org/t/p/w780/5cAuJOfd5tuuFBz2yQmBCtVBaj0.jpg',
    trailer: 'https://www.youtube.com/watch?v=shW9i6k8cB0',
    status: 'coming_soon',
  },
  {
    id: 15,
    name: 'Avatar: Fire and Ash (Phần 3)',
    genre: 'Khoa học viễn tưởng, Hành động',
    director: 'James Cameron',
    actors: 'Sam Worthington, Zoe Saldana, Sigourney Weaver',
    duration: 190,
    release_date: '2026-12-19',
    end_date: '2027-03-31',
    age_rating: 'T13',
    language: 'Tiếng Anh - Phụ đề Tiếng Việt',
    format: 'IMAX 3D, 4DX 3D',
    description: 'Cuộc chạm trán giữa gia đình Jake Sully và Bộ tộc Tro Tàn - những người Na vi hung hãn trên hành tinh Pandora.',
    poster: 'https://image.tmdb.org/t/p/w780/cf7hE1ifY4UNbS25tGnaTyyDrI2.jpg',
    trailer: 'https://www.youtube.com/watch?v=d9MyW72ELq0',
    status: 'coming_soon',
  },
  {
    id: 16,
    name: 'Interstellar (Tái Chiếu Kỷ Niệm 10 Năm)',
    genre: 'Khoa học viễn tưởng, Kịch tính',
    director: 'Christopher Nolan',
    actors: 'Matthew McConaughey, Anne Hathaway, Jessica Chastain',
    duration: 169,
    release_date: '2026-09-27',
    end_date: '2026-10-30',
    age_rating: 'T13',
    language: 'Tiếng Anh - Phụ đề Tiếng Việt',
    format: 'IMAX 2D 70mm',
    description: 'Một nhóm các nhà thám hiểm du hành qua hố sâu không gian để tìm kiếm hành tinh mới có thể duy trì sự sống cho nhân loại.',
    poster: 'https://image.tmdb.org/t/p/w780/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg',
    trailer: 'https://www.youtube.com/watch?v=zSWdZVtXT7E',
    status: 'now_showing',
  },
];

const rooms = [
  { id: 1, name: 'Cinema Hall 1 (Standard Dolby)', room_type: 'standard', capacity: 72, location: 'Tầng 3 - Cánh Trái', status: 'active', description: 'Phòng chiếu Dolby Atmos 7.1' },
  { id: 2, name: 'Cinema Hall 2 (Standard Dolby)', room_type: 'standard', capacity: 72, location: 'Tầng 3 - Cánh Trái', status: 'active', description: 'Phòng chiếu Laser 4K' },
  { id: 3, name: 'Cinema Hall 3 (VIP Prime Lounge)', room_type: 'vip', capacity: 48, location: 'Tầng 3 - Khu Trung Tâm', status: 'active', description: 'Phòng chiếu ghế da chỉnh điện' },
  { id: 4, name: 'Cinema Hall 4 (IMAX Laser Theater)', room_type: 'imax', capacity: 96, location: 'Tầng 4 - Đại Sảnh IMAX', status: 'active', description: 'Màn hình 22m x 16m chuẩn IMAX Laser' },
  { id: 5, name: 'Cinema Hall 5 (4DX Motion World)', room_type: '4dx', capacity: 60, location: 'Tầng 4 - Cánh Phải', status: 'active', description: 'Hiệu ứng rung lắc, gió, mưa, mùi hương' },
  { id: 6, name: 'Cinema Hall 6 (Gold Class Luxury)', room_type: 'vip', capacity: 36, location: 'Tầng 4 - Cánh Phải', status: 'maintenance', description: 'Phòng hạng sang - Đang bảo dưỡng' },
  { id: 7, name: 'Cinema Hall 7 (Standard Dolby)', room_type: 'standard', capacity: 72, location: 'Tầng 5 - Cánh Trái', status: 'active', description: 'Phòng chiếu gia đình' },
  { id: 8, name: 'Cinema Hall 8 (Studio Premiere)', room_type: 'standard', capacity: 72, location: 'Tầng 5 - Cánh Phải', status: 'incident', description: 'Đang xử lý sự cố điều hòa' },
];

// Generate seats for Rooms 1, 2, 3, 4, 5, 7
const seats = [];
let seatIdCounter = 1;
[1, 2, 3, 4, 5, 7].forEach((roomId) => {
  ['A', 'B', 'C', 'D', 'E', 'F'].forEach((row, rIdx) => {
    const maxNum = (roomId === 4) ? 14 : 12;
    for (let num = 1; num <= maxNum; num++) {
      let seatType = 'standard';
      if (rIdx >= 3 && rIdx <= 4) seatType = 'vip';
      if (rIdx === 5 && num <= Math.floor(maxNum / 2)) seatType = 'couple';
      seats.push({
        id: seatIdCounter++,
        room_id: roomId,
        row_number: row,
        seat_number: num,
        seat_type: seatType,
        status: 'active',
      });
    }
  });
});

const todayStr = new Date().toISOString().slice(0, 10);
const schedules = [
  { id: 1, movie_id: 1, room_id: 4, start_time: `${todayStr} 14:00:00`, end_time: `${todayStr} 16:50:00`, format: 'IMAX 2D Phụ đề', ticket_price: 150000, status: 'screening' },
  { id: 2, movie_id: 1, room_id: 4, start_time: `${todayStr} 18:00:00`, end_time: `${todayStr} 20:50:00`, format: 'IMAX 2D Phụ đề', ticket_price: 160000, status: 'scheduled' },
  { id: 3, movie_id: 5, room_id: 5, start_time: `${todayStr} 19:00:00`, end_time: `${todayStr} 21:10:00`, format: '4DX 3D Phụ đề', ticket_price: 180000, status: 'scheduled' },
  { id: 4, movie_id: 4, room_id: 1, start_time: `${todayStr} 15:00:00`, end_time: `${todayStr} 17:20:00`, format: '2D Tiếng Việt', ticket_price: 90000, status: 'screening' },
  { id: 5, movie_id: 4, room_id: 1, start_time: `${todayStr} 18:30:00`, end_time: `${todayStr} 20:50:00`, format: '2D Tiếng Việt', ticket_price: 100000, status: 'scheduled' },
  { id: 6, movie_id: 3, room_id: 2, start_time: `${todayStr} 19:30:00`, end_time: `${todayStr} 21:45:00`, format: '2D Tiếng Việt', ticket_price: 95000, status: 'scheduled' },
  { id: 7, movie_id: 2, room_id: 3, start_time: `${todayStr} 18:30:00`, end_time: `${todayStr} 21:30:00`, format: '2D VIP Phụ đề', ticket_price: 140000, status: 'scheduled' },
  { id: 8, movie_id: 6, room_id: 4, start_time: `${todayStr} 21:00:00`, end_time: `${todayStr} 23:00:00`, format: 'IMAX 3D Phụ đề', ticket_price: 170000, status: 'scheduled' },
  { id: 9, movie_id: 7, room_id: 1, start_time: `${todayStr} 16:30:00`, end_time: `${todayStr} 18:10:00`, format: '2D Lồng tiếng', ticket_price: 95000, status: 'scheduled' },
  { id: 10, movie_id: 8, room_id: 2, start_time: `${todayStr} 14:30:00`, end_time: `${todayStr} 16:10:00`, format: '2D Lồng tiếng', ticket_price: 90000, status: 'scheduled' },
  { id: 11, movie_id: 9, room_id: 3, start_time: `${todayStr} 21:30:00`, end_time: `${todayStr} 23:45:00`, format: '2D VIP Phụ đề', ticket_price: 130000, status: 'scheduled' },
  { id: 12, movie_id: 10, room_id: 5, start_time: `${todayStr} 16:00:00`, end_time: `${todayStr} 17:50:00`, format: '2D Lồng tiếng', ticket_price: 100000, status: 'scheduled' },
  { id: 13, movie_id: 11, room_id: 1, start_time: `${todayStr} 13:00:00`, end_time: `${todayStr} 14:40:00`, format: '2D Lồng tiếng', ticket_price: 90000, status: 'scheduled' },
  { id: 14, movie_id: 16, room_id: 4, start_time: `${todayStr} 10:00:00`, end_time: `${todayStr} 12:50:00`, format: 'IMAX 2D 70mm', ticket_price: 160000, status: 'scheduled' },
];

const bookings = [
  { id: 1, customer_id: 1, screening_id: 5, booking_code: 'BK-20260914-001', booking_time: `${todayStr} 10:15:00`, total_amount: 220000, status: 'paid' },
];

const booking_seats = [
  { id: 1, booking_id: 1, seat_id: 41, price: 110000, status: 'booked', hold_start: `${todayStr} 10:15:00`, hold_expire: `${todayStr} 10:25:00` },
  { id: 2, booking_id: 1, seat_id: 42, price: 110000, status: 'booked', hold_start: `${todayStr} 10:15:00`, hold_expire: `${todayStr} 10:25:00` },
];

const tickets = [
  { id: 1, booking_id: 1, customer_id: 1, screening_id: 5, seat_id: 41, ticket_code: 'TCK-20260914-5-D5', status: 'active', created_at: `${todayStr} 10:18:22` },
  { id: 2, booking_id: 1, customer_id: 1, screening_id: 5, seat_id: 42, ticket_code: 'TCK-20260914-5-D6', status: 'active', created_at: `${todayStr} 10:18:22` },
];

const equipment_types = [
  { id: 1, name: 'Máy chiếu (Projector)', description: 'Máy chiếu kỹ thuật số Laser 4K, IMAX Laser' },
  { id: 2, name: 'Hệ thống âm thanh (Sound System)', description: 'Dolby Atmos 7.1, loa surround, Subwoofer' },
  { id: 3, name: 'Hệ thống điều hòa (HVAC & AC)', description: 'Điều hòa Chiller trung tâm làm mát khán phòng' },
  { id: 4, name: 'Hệ thống chiếu sáng (Lighting)', description: 'Đèn dimming, LED bậc thang và đèn exit' },
  { id: 5, name: 'Màn hình chiếu (Cinema Screen)', description: 'Màn bạc Harkness, màn cong IMAX' },
  { id: 6, name: 'Thiết bị hiệu ứng 4DX (4DX Dynamic)', description: 'Mô-tơ ghế rung lắc, quạt gió bão, khói tuyết' },
  { id: 7, name: 'Camera an ninh (CCTV Camera)', description: 'Camera hồng ngoại an ninh phòng chiếu' },
  { id: 8, name: 'Thiết bị mạng & Server', description: 'Máy chủ phát phim DCP Server Dolby Doremi' },
];

const equipment = [
  { id: 1, equipment_type_id: 1, room_id: 1, name: 'Máy chiếu Laser Christie CP4420-RGB 4K', code: 'EQ-P1-PRJ01', manufacturer: 'Christie Digital (Mỹ)', purchase_date: '2023-01-15', warranty_end: '2028-01-15', last_maintenance: '2026-01-10', next_maintenance: '2026-07-10', status: 'good' },
  { id: 2, equipment_type_id: 2, room_id: 1, name: 'Bộ giải mã âm thanh Dolby Atmos CP950', code: 'EQ-P1-SND01', manufacturer: 'Dolby Laboratories', purchase_date: '2023-01-15', warranty_end: '2028-01-15', last_maintenance: '2026-02-12', next_maintenance: '2026-08-12', status: 'good' },
  { id: 3, equipment_type_id: 3, room_id: 1, name: 'Điều hòa trung tâm Daikin VRV X 18HP', code: 'EQ-P1-AC01', manufacturer: 'Daikin (Nhật Bản)', purchase_date: '2023-02-01', warranty_end: '2027-02-01', last_maintenance: '2026-03-01', next_maintenance: '2026-06-01', status: 'good' },
  { id: 16, equipment_type_id: 1, room_id: 4, name: 'Hệ thống máy chiếu kép IMAX Laser Dual 4K', code: 'EQ-P4-PRJ01', manufacturer: 'IMAX Corporation', purchase_date: '2023-08-15', warranty_end: '2033-08-15', last_maintenance: '2026-03-10', next_maintenance: '2026-09-20', status: 'good' },
  { id: 24, equipment_type_id: 2, room_id: 6, name: 'Bộ giải mã âm thanh Dolby CP850 bị lỗi', code: 'EQ-P6-SND01', manufacturer: 'Dolby Labs', purchase_date: '2022-11-20', warranty_end: '2027-11-20', last_maintenance: '2026-03-12', next_maintenance: '2026-03-20', status: 'repairing' },
  { id: 25, equipment_type_id: 3, room_id: 8, name: 'Máy nén dàn lạnh điều hòa Trane Chiller Block B', code: 'EQ-P8-AC01', manufacturer: 'Trane', purchase_date: '2022-05-15', warranty_end: '2026-05-15', last_maintenance: '2025-11-10', next_maintenance: '2026-02-10', status: 'broken' },
];

const incidents = [
  { id: 1, code: 'INC-20260914-001', reporter_id: 4, room_id: 8, equipment_id: 25, title: 'Điều hòa phòng 8 bị ngắt block làm lạnh đột ngột', description: 'Nhiệt độ phòng tăng lên 29 độ C, máy nén Chiller Block B báo lỗi quá tải E4.', severity: 'high', status: 'in_progress', created_at: `${todayStr} 09:30:00` },
  { id: 2, code: 'INC-20260913-002', reporter_id: 5, room_id: 6, equipment_id: 24, title: 'Loa Surround vách phải phòng 6 phát tiếng rè ngắt quãng', description: 'Kênh surround phải bị méo tiếng khi âm lượng phim vượt 80dB.', severity: 'medium', status: 'accepted', created_at: '2026-09-13 14:15:00' },
];

const incident_histories = [
  { id: 1, incident_id: 1, employee_id: 6, action: 'Khảo sát và chẩn đoán', description: 'Kỹ thuật viên Quân kiểm tra áp suất gas R410A, phát hiện tụ khởi động bị chập.', spare_parts: 'Tụ ngậm 50uF / 450V Daikin', cost: 350000, created_at: `${todayStr} 10:00:00` },
  { id: 2, incident_id: 2, employee_id: 7, action: 'Tiếp nhận sự cố', description: 'Kỹ thuật viên Hùng đo tín hiệu ngõ ra DSP bo mạch Dolby.', spare_parts: 'Bo DAC Dolby CP850', cost: 2500000, created_at: '2026-09-13 16:00:00' },
];

const maintenances = [
  { id: 1, code: 'MAINT-202609-001', equipment_id: 1, employee_id: 6, type: 'periodic', description: 'Bảo dưỡng định kỳ máy chiếu Christie Laser 4K Phòng 1: Vệ sinh lọc bụi, đo quang thông Lumen.', scheduled_date: `${todayStr}`, completed_date: `${todayStr}`, result: 'success', cost: 1200000, note: 'Quang thông đạt 98% chuẩn DCI', status: 'completed' },
  { id: 2, code: 'MAINT-202609-002', equipment_id: 16, employee_id: 6, type: 'periodic', description: 'Bảo dưỡng hệ thống làm mát bằng chất lỏng cụm Laser IMAX Phòng 4', scheduled_date: '2026-09-20', completed_date: null, result: 'pending', cost: 4500000, note: 'Phối hợp chuyên gia IMAX', status: 'planned' },
];

const work_shifts = [
  { id: 1, employee_id: 4, work_date: todayStr, shift_name: 'morning', start_time: '08:00:00', end_time: '16:00:00', position: 'Soát vé & Điều phối', room_id: 1, status: 'completed' },
  { id: 2, employee_id: 5, work_date: todayStr, shift_name: 'afternoon', start_time: '15:30:00', end_time: '23:30:00', position: 'Kiểm tra phòng & Hỗ trợ khách', room_id: 4, status: 'checked_in' },
  { id: 3, employee_id: 6, work_date: todayStr, shift_name: 'morning', start_time: '08:00:00', end_time: '16:00:00', position: 'Trực Kỹ thuật âm thanh - hình ảnh', room_id: null, status: 'completed' },
  { id: 4, employee_id: 7, work_date: todayStr, shift_name: 'afternoon', start_time: '15:30:00', end_time: '23:30:00', position: 'Trực Sửa chữa & Xử lý sự cố', room_id: null, status: 'checked_in' },
];

const assignments = [
  { id: 1, employee_id: 6, incident_id: 1, maintenance_id: null, assigned_at: `${todayStr} 09:40:00`, status: 'in_progress' },
  { id: 2, employee_id: 7, incident_id: 2, maintenance_id: null, assigned_at: '2026-09-13 14:30:00', status: 'accepted' },
];

const room_inspections = [
  { id: 1, room_id: 1, employee_id: 4, inspection_date: `${todayStr} 08:30:00`, status: 'pass', note: 'Tất cả 9 hạng mục vận hành đạt chuẩn trước ca chiếu sáng' },
  { id: 2, room_id: 8, employee_id: 5, inspection_date: `${todayStr} 09:15:00`, status: 'fail', note: 'Điều hòa không mát, nhiệt độ phòng quá cao' },
];

const inspection_details = [
  { id: 1, inspection_id: 1, item_name: 'Máy chiếu', status: 'pass', note: 'Hình ảnh sắc nét' },
  { id: 2, inspection_id: 1, item_name: 'Âm thanh', status: 'pass', note: 'Hoạt động tốt' },
  { id: 3, inspection_id: 1, item_name: 'Điều hòa', status: 'pass', note: '22°C' },
  { id: 4, inspection_id: 1, item_name: 'Đèn', status: 'pass', note: 'Chuẩn' },
  { id: 5, inspection_id: 1, item_name: 'Ghế', status: 'pass', note: 'Sạch' },
  { id: 6, inspection_id: 1, item_name: 'Màn hình', status: 'pass', note: 'Tốt' },
  { id: 7, inspection_id: 1, item_name: 'Cửa thoát hiểm', status: 'pass', note: 'Khóa nhạy' },
  { id: 8, inspection_id: 1, item_name: 'Vệ sinh', status: 'pass', note: 'Sạch' },
  { id: 9, inspection_id: 1, item_name: 'PCCC', status: 'pass', note: 'Đầy đủ' },
  { id: 10, inspection_id: 2, item_name: 'Điều hòa', status: 'fail', note: 'Lỗi E4 Chiller' },
];

const notifications = [
  { id: 1, user_id: 2, title: 'Sự cố mới tại Phòng 8', message: 'Nhân viên Đỗ Tuấn Kiệt vừa báo cáo sự cố điều hòa phòng 8. Vui lòng phân công kỹ thuật viên.', type: 'incident', is_read: false, created_at: `${todayStr} 09:30:00` },
  { id: 2, user_id: 5, title: 'Phân công xử lý sự cố', message: 'Quản lý Phạm Minh Đức đã phân công bạn xử lý sự cố INC-20260914-001 (Điều hòa Phòng 8).', type: 'incident', is_read: false, created_at: `${todayStr} 09:40:00` },
  { id: 3, user_id: 7, title: 'Đặt vé thành công', message: 'Bạn đã đặt thành công 2 vé xem phim Lật Mặt 7 suất 18:30 hôm nay.', type: 'booking', is_read: true, created_at: `${todayStr} 10:18:25` },
];

// --- 17. F&B Concession Menu Items ---
const concession_items = [
  { id: 1, name: 'Bắp Rang Bơ Phô Mai (L)', category: 'popcorn', price: 69000, cost_price: 18000, image: 'https://images.unsplash.com/photo-1578849278619-e73505e9610f?q=80&w=400', is_active: true, description: 'Bắp rang bơ giòn rụm phủ phô mai Cheddar hảo hạng size L 85oz' },
  { id: 2, name: 'Bắp Rang Caramen Ngọt (L)', category: 'popcorn', price: 69000, cost_price: 19000, image: 'https://images.unsplash.com/photo-1585647347384-2593bc35786b?q=80&w=400', is_active: true, description: 'Bắp rang bơ truyền thống bọc caramen đậm đà ngọt ngào' },
  { id: 3, name: 'Coca-Cola Tươi (32oz)', category: 'beverage', price: 39000, cost_price: 7000, image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?q=80&w=400', is_active: true, description: 'Nước ngọt Coca-Cola mát lạnh sảng khoái' },
  { id: 4, name: 'Sprite Tươi (32oz)', category: 'beverage', price: 39000, cost_price: 7000, image: 'https://images.unsplash.com/photo-1625772299848-391b6a87d7b3?q=80&w=400', is_active: true, description: 'Nước ngọt Sprite chanh tươi mát' },
  { id: 5, name: 'Combo Đơn (1 Bắp L + 1 Nước 32oz)', category: 'combo', price: 95000, cost_price: 25000, image: 'https://images.unsplash.com/photo-1505686994434-e3cc5abf1330?q=80&w=400', is_active: true, description: 'Tiết kiệm 13.000đ - 1 Bắp phô mai/ngọt + 1 Nước ngọt tự chọn' },
  { id: 6, name: 'Combo Đôi Night Movie (1 Bắp L + 2 Nước + 1 Snack)', category: 'combo', price: 145000, cost_price: 42000, image: 'https://images.unsplash.com/photo-1518173946687-a4c8a383392e?q=80&w=400', is_active: true, description: 'Bộ đôi xem phim hoàn hảo: 1 Bắp lớn 2 vị + 2 Nước lớn + 1 Snack khoai tây' },
  { id: 7, name: 'Xúc Xích Nướng Phô Mai', category: 'hot_food', price: 35000, cost_price: 12000, image: 'https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?q=80&w=400', is_active: true, description: 'Xúc xích bò nướng giòn kèm sốt mù tạt mật ong' },
];

// --- 18. Kho Nguyên Vật Liệu (Inventory Ingredients) ---
const inventory_ingredients = [
  { id: 1, code: 'ING-CORN-01', name: 'Hạt ngô Mỹ làm bắp rang (Mushroom/Butterfly)', unit: 'kg', stock_quantity: 185.5, min_threshold: 40.0, cost_per_unit: 45000, supplier: 'Cty Nông Sản Tân Bình' },
  { id: 2, code: 'ING-BUTTER-01', name: 'Bơ thực vật chuyên dụng nổ bắp (Gold Butter)', unit: 'kg', stock_quantity: 62.0, min_threshold: 15.0, cost_per_unit: 85000, supplier: 'Cty Thực Phẩm An Phát' },
  { id: 3, code: 'ING-CHEESE-01', name: 'Bột phô mai Cheddar rắc bắp', unit: 'kg', stock_quantity: 28.5, min_threshold: 8.0, cost_per_unit: 180000, supplier: 'Cty Gia Vị Á Châu' },
  { id: 4, code: 'ING-CARAMEL-01', name: 'Đường men Caramen nổ bắp', unit: 'kg', stock_quantity: 34.0, min_threshold: 10.0, cost_per_unit: 65000, supplier: 'Cty Thực Phẩm An Phát' },
  { id: 5, code: 'ING-COCA-SYRUP', name: 'Siro đậm đặc Coca-Cola BIB (Bag-in-Box 20L)', unit: 'lít', stock_quantity: 120.0, min_threshold: 30.0, cost_per_unit: 95000, supplier: 'Coca-Cola Beverages VN' },
  { id: 6, code: 'ING-SPRITE-SYRUP', name: 'Siro đậm đặc Sprite BIB 20L', unit: 'lít', stock_quantity: 80.0, min_threshold: 25.0, cost_per_unit: 95000, supplier: 'Coca-Cola Beverages VN' },
  { id: 7, code: 'ING-CUP-32OZ', name: 'Ly giấy Cinema 32oz Night Movie', unit: 'cái', stock_quantity: 1450, min_threshold: 300, cost_per_unit: 1800, supplier: 'Bao Bì Xanh Việt' },
  { id: 8, code: 'ING-BOX-L', name: 'Hộp bắp giấy Size L 85oz Night Movie', unit: 'cái', stock_quantity: 980, min_threshold: 200, cost_per_unit: 2800, supplier: 'Bao Bì Xanh Việt' },
  { id: 9, code: 'ING-LID-STRAW', name: 'Nắp ly & Ống hút giấy sinh học', unit: 'bộ', stock_quantity: 2100, min_threshold: 500, cost_per_unit: 600, supplier: 'Bao Bì Xanh Việt' },
];

// --- 19. Định Lượng Nguyên Vật Liệu (BOM - Recipe) ---
const concession_recipes = [
  { item_id: 1, ingredient_id: 1, quantity_used: 0.08, note: '80g hạt ngô' },
  { item_id: 1, ingredient_id: 2, quantity_used: 0.02, note: '20g bơ nổ bắp' },
  { item_id: 1, ingredient_id: 3, quantity_used: 0.025, note: '25g bột phô mai' },
  { item_id: 1, ingredient_id: 8, quantity_used: 1, note: '1 hộp bắp size L' },
  { item_id: 3, ingredient_id: 5, quantity_used: 0.05, note: '50ml siro Coca' },
  { item_id: 3, ingredient_id: 7, quantity_used: 1, note: '1 ly giấy 32oz' },
  { item_id: 3, ingredient_id: 9, quantity_used: 1, note: '1 nắp + ống hút' },
];

// --- 20. Lịch Sử Nhập / Xuất / Hao Hụt Kho (Inventory Logs) ---
const inventory_logs = [
  { id: 1, ingredient_id: 1, change_type: 'import', quantity: 100, reason: 'Nhập hàng định kỳ từ nhà cung cấp', employee_id: 2, created_at: `${todayStr} 07:30:00` },
  { id: 2, ingredient_id: 7, change_type: 'import', quantity: 1000, reason: 'Nhập lô ly giấy in logo Night Movie', employee_id: 2, created_at: `${todayStr} 07:45:00` },
  { id: 3, ingredient_id: 1, change_type: 'usage', quantity: -14.5, reason: 'Tiêu hao bán bắp trong ca sáng', employee_id: 4, created_at: `${todayStr} 12:00:00` },
  { id: 4, ingredient_id: 8, change_type: 'waste', quantity: -5, reason: 'Hộp giấy bị móp do rách kiện hàng', employee_id: 4, created_at: `${todayStr} 12:15:00` },
];

// --- 21. Bàn Giao Ca & Đối Soát Két Tiền (Shift Cash Handover) ---
const shift_handovers = [
  {
    id: 1,
    work_shift_id: 1,
    employee_id: 4,
    manager_id: 2,
    opening_float: 2000000, // 2 triệu tiền lẻ đầu ca
    cash_sales: 8450000,    // Doanh thu tiền mặt bán vé + bắp
    card_sales: 12600000,   // Quẹt thẻ POS
    qr_sales: 9800000,      // Chuyển khoản QR
    actual_cash_counted: 10450000, // Tiền kiểm đếm thực tế
    variance: 0, // Khớp 100%
    cash_dropped_to_safe: 8000000, // Nộp về két chính rạp
    next_shift_float: 2450000, // Để lại ca sau
    status: 'approved',
    notes: 'Ca sáng hoạt động ổn định, doanh thu bắp nước đạt 130% chỉ tiêu.',
    created_at: `${todayStr} 16:15:00`
  }
];

// --- 22. Quản Lý Khóa Bản Quyền KDM (KDM Licenses) ---
const kdm_licenses = [
  { id: 1, movie_id: 1, movie_name: 'Dune: Hành Tinh Cát 2', room_id: 1, room_name: 'Phòng 1 - IMAX Laser', server_serial: 'DCI-IMAX-98821', valid_from: '2026-03-01 00:00:00', valid_until: '2026-05-30 23:59:59', status: 'active', key_file: 'KDM_DUNE2_IMAX_98821.xml' },
  { id: 2, movie_id: 1, movie_name: 'Dune: Hành Tinh Cát 2', room_id: 2, room_name: 'Phòng 2 - Dolby Atmos', server_serial: 'DCI-SRV-20419', valid_from: '2026-03-01 00:00:00', valid_until: '2026-05-30 23:59:59', status: 'active', key_file: 'KDM_DUNE2_ROOM2_20419.xml' },
  { id: 3, movie_id: 2, movie_name: 'Oppenheimer', room_id: 3, room_name: 'Phòng 3 - Gold VIP', server_serial: 'DCI-SRV-33910', valid_from: '2026-02-15 00:00:00', valid_until: '2026-04-15 23:59:59', status: 'expiring_soon', key_file: 'KDM_OPPENHEIMER_R3.xml' },
  { id: 4, movie_id: 4, movie_name: 'Godzilla x Kong', room_id: 4, room_name: 'Phòng 4 - 4DX Dynamic', server_serial: 'DCI-4DX-44102', valid_from: '2026-01-01 00:00:00', valid_until: '2026-03-10 23:59:59', status: 'expired', key_file: 'KDM_GXK_4DX_44102.xml' },
];

// --- 23. Theo Dõi Tuổi Thọ Bóng Đèn Máy Chiếu (Projector Lamp Logs) ---
const projector_lamp_logs = [
  { id: 1, room_id: 1, room_name: 'Phòng 1 - IMAX Laser', projector_model: 'Barco DP4K-60L Laser', lamp_type: 'RGB Laser Module', hours_used: 1240, max_hours_recommended: 30000, health_percentage: 95.8, temperature_celsius: 21.5, status: 'good' },
  { id: 2, room_id: 2, room_name: 'Phòng 2 - Dolby Atmos', projector_model: 'Christie CP4325-RGB', lamp_type: 'Xenon Lamp 4.5kW', hours_used: 1890, max_hours_recommended: 2000, health_percentage: 18.5, temperature_celsius: 25.0, status: 'warning' },
  { id: 3, room_id: 3, room_name: 'Phòng 3 - Gold VIP', projector_model: 'NEC NC3541L Laser', lamp_type: 'Laser Phosphor', hours_used: 4320, max_hours_recommended: 20000, health_percentage: 78.4, temperature_celsius: 22.0, status: 'good' },
  { id: 4, room_id: 4, room_name: 'Phòng 4 - 4DX Dynamic', projector_model: 'Barco DP2K-20C', lamp_type: 'Xenon Lamp 3.0kW', hours_used: 2150, max_hours_recommended: 2000, health_percentage: 5.0, temperature_celsius: 28.5, status: 'critical' },
];

// --- 24. Checklist Dọn Rạp Giữa Suất Chiếu (Turnaround Checklists) ---
const turnaround_checklists = [
  { id: 1, schedule_id: 1, room_id: 1, room_name: 'Phòng 1 - IMAX Laser', cleaned_by_name: 'Nguyễn Thu Trang', target_minutes: 15, actual_minutes: 11, seats_checked: true, trash_cleared: true, spilled_liquid_cleaned: true, screen_undamaged: true, aircon_normal: true, status: 'ready', verified_at: `${todayStr} 12:45:00` },
  { id: 2, schedule_id: 4, room_id: 2, room_name: 'Phòng 2 - Dolby Atmos', cleaned_by_name: 'Đỗ Tuấn Kiệt', target_minutes: 12, actual_minutes: 10, seats_checked: true, trash_cleared: true, spilled_liquid_cleaned: true, screen_undamaged: true, aircon_normal: true, status: 'ready', verified_at: `${todayStr} 15:30:00` },
];

const payments = [
  { id: 1, booking_id: 1, payment_method: 'banking', amount: 220000, transaction_code: 'TXN-BANKING-001', status: 'success', payment_time: `${todayStr} 10:16:30` },
];

module.exports = {
  roles,
  users,
  customers,
  employees,
  movies,
  rooms,
  seats,
  schedules,
  bookings,
  booking_seats,
  tickets,
  payments,
  equipment_types,
  equipment,
  incidents,
  incident_histories,
  maintenances,
  work_shifts,
  assignments,
  room_inspections,
  inspection_details,
  notifications,
  concession_items,
  inventory_ingredients,
  concession_recipes,
  inventory_logs,
  shift_handovers,
  kdm_licenses,
  projector_lamp_logs,
  turnaround_checklists,
};
