const db = require('../config/database');

/**
 * Lấy danh sách phim có bộ lọc
 */
async function getMovies(req, res, next) {
  try {
    const { status, genre, search, limit = 50 } = req.query;

    let sql = `SELECT * FROM movies WHERE 1=1`;
    const params = [];

    if (status && status !== 'all') {
      sql += ` AND status = ?`;
      params.push(status);
    }

    if (genre && genre !== 'all') {
      sql += ` AND genre LIKE ?`;
      params.push(`%${genre}%`);
    }

    if (search) {
      sql += ` AND (name LIKE ? OR director LIKE ? OR actors LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    sql += ` ORDER BY release_date DESC LIMIT ?`;
    params.push(parseInt(limit, 10));

    const movies = await db.query(sql, params);

    return res.status(200).json({
      success: true,
      count: movies.length,
      data: movies,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Chi tiết phim theo ID
 */
async function getMovieById(req, res, next) {
  try {
    const { id } = req.params;
    const movies = await db.query(`SELECT * FROM movies WHERE id = ?`, [id]);

    if (!movies || movies.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy phim với ID này.',
      });
    }

    // Lấy các lịch chiếu sắp tới của phim
    const schedules = await db.query(
      `SELECT s.*, r.name AS room_name, r.room_type, r.capacity
       FROM screening_schedules s
       JOIN cinema_rooms r ON s.room_id = r.id
       WHERE s.movie_id = ? AND s.status IN ('scheduled', 'screening')
       ORDER BY s.start_time ASC`,
      [id]
    );

    return res.status(200).json({
      success: true,
      data: {
        ...movies[0],
        schedules,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Thêm mới phim (Admin / Manager)
 */
async function createMovie(req, res, next) {
  try {
    const {
      name,
      genre,
      director,
      actors,
      duration,
      release_date,
      end_date,
      age_rating = 'P',
      language = 'Tiếng Việt - Phụ đề',
      format = '2D Digital',
      description,
      poster,
      trailer,
      status = 'now_showing',
    } = req.body;

    if (!name || !duration || !release_date || !end_date) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng điền các thông tin bắt buộc của phim.',
      });
    }

    const result = await db.query(
      `INSERT INTO movies (name, genre, director, actors, duration, release_date, end_date, age_rating, language, format, description, poster, trailer, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name,
        genre || 'Hành động',
        director || 'Đang cập nhật',
        actors || 'Đang cập nhật',
        duration,
        release_date,
        end_date,
        age_rating,
        language,
        format,
        description || '',
        poster || 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=800',
        trailer || '',
        status,
      ]
    );

    return res.status(201).json({
      success: true,
      message: 'Thêm phim mới thành công!',
      data: { id: result.insertId, ...req.body },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Cập nhật thông tin phim
 */
async function updateMovie(req, res, next) {
  try {
    const { id } = req.params;
    const {
      name,
      genre,
      director,
      actors,
      duration,
      release_date,
      end_date,
      age_rating,
      language,
      format,
      description,
      poster,
      trailer,
      status,
    } = req.body;

    await db.query(
      `UPDATE movies SET 
        name = COALESCE(?, name),
        genre = COALESCE(?, genre),
        director = COALESCE(?, director),
        actors = COALESCE(?, actors),
        duration = COALESCE(?, duration),
        release_date = COALESCE(?, release_date),
        end_date = COALESCE(?, end_date),
        age_rating = COALESCE(?, age_rating),
        language = COALESCE(?, language),
        format = COALESCE(?, format),
        description = COALESCE(?, description),
        poster = COALESCE(?, poster),
        trailer = COALESCE(?, trailer),
        status = COALESCE(?, status)
       WHERE id = ?`,
      [
        name,
        genre,
        director,
        actors,
        duration,
        release_date,
        end_date,
        age_rating,
        language,
        format,
        description,
        poster,
        trailer,
        status,
        id,
      ]
    );

    return res.status(200).json({
      success: true,
      message: 'Cập nhật thông tin phim thành công!',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Xóa phim (Admin)
 */
async function deleteMovie(req, res, next) {
  try {
    const { id } = req.params;

    // Kiểm tra xem phim có lịch chiếu đang active không
    const schedules = await db.query(
      `SELECT id FROM screening_schedules WHERE movie_id = ? AND status IN ('scheduled', 'screening')`,
      [id]
    );

    if (schedules.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Không thể xóa phim đang có lịch chiếu hoạt động. Vui lòng hủy các lịch chiếu trước.',
      });
    }

    await db.query(`DELETE FROM movies WHERE id = ?`, [id]);

    return res.status(200).json({
      success: true,
      message: 'Đã xóa phim khỏi hệ thống.',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Lấy danh sách đánh giá & điểm xếp hạng của phim
 */
async function getMovieReviews(req, res, next) {
  try {
    const { id } = req.params;
    const reviews = await db.query(
      `SELECT * FROM movie_reviews WHERE movie_id = ? ORDER BY created_at DESC`,
      [id]
    );

    const totalReviews = reviews.length;
    const averageRating =
      totalReviews > 0
        ? Math.round((reviews.reduce((acc, r) => acc + Number(r.rating || 0), 0) / totalReviews) * 10) / 10
        : null;

    return res.status(200).json({
      success: true,
      data: {
        reviews,
        totalReviews,
        averageRating,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Gửi đánh giá & bình luận phim mới (Khách hàng đã đăng nhập)
 */
async function addMovieReview(req, res, next) {
  try {
    const { id } = req.params;
    const { rating, comment } = req.body;
    const userId = req.user?.id;
    const userName = req.user?.name || req.user?.username || 'Khách hàng';

    // Chỉ chấp nhận rating là số nguyên từ 1 đến 5 sao
    const numRating = Number(rating);
    if (!Number.isInteger(numRating) || numRating < 1 || numRating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Điểm đánh giá phải là số nguyên từ 1 đến 5 sao.',
      });
    }

    if (!comment || typeof comment !== 'string' || comment.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập nội dung nhận xét phim.',
      });
    }

    // Làm sạch comment, loại bỏ thẻ HTML tiềm ẩn mã độc XSS
    const cleanComment = comment.replace(/<[^>]*>?/gm, '').trim();
    if (!cleanComment) {
      return res.status(400).json({
        success: false,
        message: 'Nội dung nhận xét phim chứa ký tự không hợp lệ.',
      });
    }

    // Chống spam: Kiểm tra xem người dùng có vừa gửi đánh giá cho phim này trong vòng 60s không
    const recentReviews = await db.query(
      `SELECT id, created_at FROM movie_reviews WHERE movie_id = ? AND user_id = ? ORDER BY created_at DESC LIMIT 1`,
      [id, userId]
    );
    if (recentReviews && recentReviews.length > 0) {
      const lastCreated = new Date(recentReviews[0].created_at).getTime();
      if (!isNaN(lastCreated) && Date.now() - lastCreated < 60000) {
        return res.status(429).json({
          success: false,
          message: 'Bạn vừa gửi đánh giá cho phim này. Vui lòng chờ 1 phút trước khi gửi lại.',
        });
      }
    }

    // Xác thực nghiêm ngặt: Huy hiệu "Đã xem rạp" (is_verified_buyer = 1)
    // CHỈ ĐƯỢC CẤP KHI:
    // 1. Vé thuộc đúng khách hàng và đúng phim đang đánh giá
    // 2. Giao dịch đặt vé đã thanh toán thành công (b.status = 'paid')
    // 3. Vé đã được sử dụng/soát vào rạp hợp lệ (t.status = 'used')
    // Tuyệt đối không tin tưởng bất kỳ cờ is_verified_buyer nào truyền lên từ client
    const customerId = req.user?.customerId || req.user?.id;
    const ticketCheck = await db.query(
      `SELECT t.id FROM tickets t 
       JOIN screening_schedules s ON t.screening_id = s.id 
       JOIN bookings b ON t.booking_id = b.id 
       WHERE s.movie_id = ? 
         AND (b.customer_id = ? OR t.customer_id = ? OR b.customer_id = ? OR t.customer_id = ?) 
         AND b.status = 'paid' 
         AND t.status = 'used'
       LIMIT 1`,
      [id, customerId, customerId, userId, userId]
    );
    const isVerifiedBuyer = ticketCheck && ticketCheck.length > 0 ? 1 : 0;

    const result = await db.query(
      `INSERT INTO movie_reviews (movie_id, user_id, user_name, rating, comment, is_verified_buyer) VALUES (?, ?, ?, ?, ?, ?)`,
      [id, userId, userName, numRating, cleanComment, isVerifiedBuyer]
    );

    return res.status(201).json({
      success: true,
      message: 'Cảm ơn bạn đã gửi đánh giá phim!',
      data: {
        id: result?.insertId,
        movie_id: parseInt(id, 10),
        user_id: userId,
        user_name: userName,
        rating: numRating,
        comment: cleanComment,
        is_verified_buyer: isVerifiedBuyer,
        created_at: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getMovies,
  getMovieById,
  createMovie,
  updateMovie,
  deleteMovie,
  getMovieReviews,
  addMovieReview,
};
