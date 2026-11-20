/**
 * SePay Automated Bank Transfer Gateway Configuration
 * Ngân hàng thụ hưởng: BIDV - Số tài khoản: 8813341949 - Chủ TK: LE TAN DUNG
 */
const sepayConfig = {
  accountNumber: process.env.SEPAY_ACCOUNT_NUMBER || '8813341949',
  bank: process.env.SEPAY_BANK_NAME || 'BIDV',
  accountHolder: process.env.SEPAY_ACCOUNT_HOLDER || 'LE TAN DUNG',
  apiKey: process.env.SEPAY_API_KEY || '',
  webhookUrl: process.env.SEPAY_WEBHOOK_URL || '/api/sepay/webhook',
};

/**
 * Sinh link tạo mã VietQR chuẩn của cổng SePay
 */
function getSepayQrUrl({ amount = 0, des = '' }) {
  const safeAmount = Math.max(0, parseInt(amount, 10) || 0);
  const cleanDes = (des || '').trim();

  if (safeAmount > 0 && cleanDes) {
    return `https://qr.sepay.vn/img?acc=${sepayConfig.accountNumber}&bank=${sepayConfig.bank}&amount=${safeAmount}&des=${encodeURIComponent(cleanDes)}`;
  }
  return '/images/bidv-qr.jpg';
}

module.exports = {
  sepayConfig,
  getSepayQrUrl,
};
