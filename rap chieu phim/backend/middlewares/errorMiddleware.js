function errorHandler(err, req, res, next) {
  console.error('[Error Occurred]:', err);

  const statusCode = res.statusCode !== 200 ? res.statusCode : 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Lỗi hệ thống máy chủ. Vui lòng thử lại sau.',
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
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
