const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

async function setupDatabase() {
  console.log('--- KHỞI TẠO CƠ SỞ DỮ LIỆU MYSQL CINEMA MANAGEMENT ---');
  
  const host = process.env.DB_HOST || 'localhost';
  const port = parseInt(process.env.DB_PORT || '3306', 10);
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASSWORD || '';
  
  console.log(`Đang kết nối tới MySQL Server tại ${host}:${port} với user '${user}'...`);

  let connection;
  try {
    connection = await mysql.createConnection({
      host,
      port,
      user,
      password,
      multipleStatements: true,
    });
    console.log('Kết nối thành công đến MySQL Server!');
  } catch (err) {
    console.error('Không thể kết nối tới MySQL:', err.message);
    console.error('Vui lòng kiểm tra lại dịch vụ MySQL (XAMPP / MySQL Service / Docker).');
    process.exit(1);
  }

  try {
    const sqlFilePath = path.join(__dirname, '..', '..', 'cinema_management.sql');
    if (!fs.existsSync(sqlFilePath)) {
      throw new Error(`Không tìm thấy file SQL tại ${sqlFilePath}`);
    }

    console.log(`Đang đọc file SQL: ${sqlFilePath}...`);
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');

    console.log('Đang thực thi các lệnh tạo bảng và nạp dữ liệu mẫu (Seed Data)...');
    await connection.query(sqlContent);

    console.log('====================================================');
    console.log('THÀNH CÔNG! Đã tạo CSDL cinema_management và nạp dữ liệu mẫu hoàn chỉnh.');
    console.log('Bạn cũng có thể mở MySQL Workbench để kiểm tra trực tiếp.');
    console.log('====================================================');
  } catch (err) {
    console.error('Lỗi khi thực thi file SQL:', err.message);
  } finally {
    if (connection) await connection.end();
  }
}

setupDatabase();
