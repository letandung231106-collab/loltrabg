function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);

  // Body JSON hỏng / quá lớn (do express.json) -> 400/413 thay vì 500
  let status = err.status || err.statusCode;
  let message = err.message;
  if (err.type === 'entity.parse.failed') {
    status = 400;
    message = 'Dữ liệu gửi lên không phải JSON hợp lệ.';
  } else if (err.type === 'entity.too.large') {
    status = 413;
    message = 'Dữ liệu gửi lên quá lớn.';
  }

  if (!Number.isInteger(status) || status < 400 || status > 599) {
    status = res.statusCode >= 400 ? res.statusCode : 500;
  }

  const isServerError = status >= 500;
  if (isServerError) console.error('[Error Occurred]:', err);

  const isProd = process.env.NODE_ENV === 'production';
  res.status(status).json({
    success: false,
    // Với lỗi 5xx ở production không lộ chi tiết nội bộ
    message: isServerError && isProd && !err.expose
      ? 'Lỗi hệ thống máy chủ. Vui lòng thử lại sau.'
      : message || 'Lỗi hệ thống máy chủ. Vui lòng thử lại sau.',
    // Stack chỉ hiển thị khi dev và là lỗi hệ thống
    stack: isServerError && !isProd ? err.stack : undefined,
  });
}

function notFoundHandler(req, res, next) {
  res.status(404).json({
    success: false,
    message: `Không tìm thấy endpoint API: ${req.method} ${req.originalUrl}`,
  });
}

module.exports = {
  errorHandler,
  notFoundHandler,
};
