const db = require('../config/database');

/**
 * Lấy danh sách khóa bản quyền phim KDM
 */
async function getKdmLicenses(req, res, next) {
  try {
    const licenses = await db.query(`SELECT * FROM kdm_licenses ORDER BY valid_until ASC`, []);
    return res.status(200).json({
      success: true,
      count: licenses.length,
      data: licenses,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Thêm / Nhập file khóa KDM mới
 */
async function createKdmLicense(req, res, next) {
  try {
    const { movie_id, movie_name, room_id, room_name, server_serial, valid_from, valid_until, key_file } = req.body;

    if (!movie_name || !room_name || !valid_from || !valid_until) {
      return res.status(400).json({
        success: false,
        message: 'Tên phim, phòng chiếu và thời hạn KDM là bắt buộc.',
      });
    }

    const result = await db.query(
      `INSERT INTO kdm_licenses (movie_id, movie_name, room_id, room_name, server_serial, valid_from, valid_until, status, key_file)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        parseInt(movie_id, 10) || 1,
        movie_name,
        parseInt(room_id, 10) || 1,
        room_name,
        server_serial || 'DCI-SRV-AUTO',
        valid_from,
        valid_until,
        new Date(valid_until) < new Date() ? 'expired' : 'active',
        key_file || 'KDM_KEY.xml',
      ]
    );

    return res.status(201).json({
      success: true,
      message: 'Nhập khóa bản quyền KDM thành công!',
      data: { id: result.insertId, ...req.body },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Xóa khóa KDM
 */
async function deleteKdmLicense(req, res, next) {
  try {
    const { id } = req.params;
    await db.query(`DELETE FROM kdm_licenses WHERE id = ?`, [id]);
    return res.status(200).json({
      success: true,
      message: 'Đã xóa file khóa KDM.',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Lấy tình trạng & số giờ chiếu bóng đèn máy chiếu
 */
async function getProjectorLamps(req, res, next) {
  try {
    const lamps = await db.query(`SELECT * FROM projector_lamp_logs`, []);
    return res.status(200).json({
      success: true,
      count: lamps.length,
      data: lamps,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Cập nhật giờ chiếu máy chiếu sau ca chiếu
 */
async function updateProjectorLamp(req, res, next) {
  try {
    const { id } = req.params;
    const { hours_used, temperature_celsius, status } = req.body;

    await db.query(
      `UPDATE projector_lamp_logs SET hours_used = ?, temperature_celsius = ?, status = ? WHERE id = ?`,
      [hours_used, temperature_celsius, status, id]
    );

    return res.status(200).json({
      success: true,
      message: 'Cập nhật thông số bóng đèn máy chiếu thành công!',
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getKdmLicenses,
  createKdmLicense,
  deleteKdmLicense,
  getProjectorLamps,
  updateProjectorLamp,
};
