/**
 * Lỗi nghiệp vụ có kèm HTTP status code.
 * Ném bằng: throw new HttpError(404, 'Không tìm thấy ...')
 * errorMiddleware sẽ tự trả đúng status (thay vì 500 chung chung).
 */
class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.statusCode = status;
    this.expose = true;
  }
}

const badRequest = (msg) => new HttpError(400, msg);
const forbidden = (msg) => new HttpError(403, msg);
const notFound = (msg) => new HttpError(404, msg);
const conflict = (msg) => new HttpError(409, msg);

module.exports = { HttpError, badRequest, forbidden, notFound, conflict };

