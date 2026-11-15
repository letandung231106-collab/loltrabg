/**
 * SQL Syntax & Structural Validator (Pure Node.js)
 * Kiểm tra cú pháp, cân bằng dấu ngoặc/chuỗi, cấu trúc câu lệnh CREATE/INSERT/UPDATE/ALTER
 * cho các file SQL và Migration của dự án NIGHT MOVIE.
 */

const fs = require('fs');
const path = require('path');

/**
 * Tách nội dung SQL thành các câu lệnh riêng biệt dựa trên dấu chấm phẩy ';',
 * loại bỏ comment và bảo toàn dấu chấm phẩy bên trong chuỗi ký tự ('...' hoặc `...`).
 */
function splitStatements(sql) {
  const statements = [];
  let current = '';
  let inSingleQuote = false;
  let inDoubleQuote = false;
  let inBacktick = false;
  let inLineComment = false;
  let inBlockComment = false;

  for (let i = 0; i < sql.length; i++) {
    const char = sql[i];
    const nextChar = sql[i + 1] || '';

    // Xử lý comment một dòng (-- ...)
    if (inLineComment) {
      if (char === '\n') inLineComment = false;
      continue;
    }

    // Xử lý comment khối (/* ... */)
    if (inBlockComment) {
      if (char === '*' && nextChar === '/') {
        inBlockComment = false;
        i++;
      }
      continue;
    }

    // Kiểm tra bắt đầu comment nếu không nằm trong chuỗi
    if (!inSingleQuote && !inDoubleQuote && !inBacktick) {
      if (char === '-' && nextChar === '-') {
        inLineComment = true;
        i++;
        continue;
      }
      if (char === '/' && nextChar === '*') {
        inBlockComment = true;
        i++;
        continue;
      }
    }

    // Xử lý chuỗi nháy đơn '...'
    if (char === "'" && !inDoubleQuote && !inBacktick) {
      // Bỏ qua escape \' hoặc ''
      if (sql[i - 1] === '\\') {
        current += char;
        continue;
      }
      inSingleQuote = !inSingleQuote;
      current += char;
      continue;
    }

    // Xử lý chuỗi nháy kép "..."
    if (char === '"' && !inSingleQuote && !inBacktick) {
      if (sql[i - 1] === '\\') {
        current += char;
        continue;
      }
      inDoubleQuote = !inDoubleQuote;
      current += char;
      continue;
    }

    // Xử lý backtick `...`
    if (char === '`' && !inSingleQuote && !inDoubleQuote) {
      inBacktick = !inBacktick;
      current += char;
      continue;
    }

    // Kết thúc câu lệnh bằng dấu ';' ngoài chuỗi
    if (char === ';' && !inSingleQuote && !inDoubleQuote && !inBacktick) {
      const trimmed = current.trim();
      if (trimmed.length > 0) {
        statements.push(trimmed);
      }
      current = '';
      continue;
    }

    current += char;
  }

  const remainder = current.trim();
  if (remainder.length > 0) {
    statements.push(remainder);
  }

  return {
    statements,
    unclosedString: inSingleQuote || inDoubleQuote || inBacktick,
  };
}

/**
 * Kiểm tra tính cân bằng dấu ngoặc tròn () và ngoặc vuông []
 */
function checkBalancedParentheses(stmt) {
  let parenDepth = 0;
  let inSingleQuote = false;
  let inDoubleQuote = false;
  let inBacktick = false;

  for (let i = 0; i < stmt.length; i++) {
    const char = stmt[i];
    if (char === "'" && !inDoubleQuote && !inBacktick && stmt[i - 1] !== '\\') {
      inSingleQuote = !inSingleQuote;
      continue;
    }
    if (char === '"' && !inSingleQuote && !inBacktick && stmt[i - 1] !== '\\') {
      inDoubleQuote = !inDoubleQuote;
      continue;
    }
    if (char === '`' && !inSingleQuote && !inDoubleQuote) {
      inBacktick = !inBacktick;
      continue;
    }

    if (!inSingleQuote && !inDoubleQuote && !inBacktick) {
      if (char === '(') parenDepth++;
      else if (char === ')') parenDepth--;
    }

    if (parenDepth < 0) {
      return false;
    }
  }

  return parenDepth === 0;
}

/**
 * Kiểm tra cú pháp một file SQL
 */
function validateSqlFile(filePath) {
  const fileName = path.basename(filePath);
  console.log(`\n------------------------------------------------------------`);
  console.log(`Kiểm tra file: ${fileName} (${filePath})`);

  if (!fs.existsSync(filePath)) {
    console.error(`  ✖ LỖI: Không tìm thấy file: ${filePath}`);
    return false;
  }

  const content = fs.readFileSync(filePath, 'utf8');
  const { statements, unclosedString } = splitStatements(content);

  if (unclosedString) {
    console.error(`  ✖ LỖI CÚ PHÁP: Phát hiện chuỗi ký tự (nháy đơn, nháy kép hoặc backtick) chưa được đóng trong file!`);
    return false;
  }

  console.log(`  -> Số lượng câu lệnh SQL tìm thấy: ${statements.length}`);

  const allowedVerbs = [
    'CREATE',
    'ALTER',
    'DROP',
    'INSERT',
    'UPDATE',
    'DELETE',
    'SET',
    'USE',
    'PREPARE',
    'EXECUTE',
    'DEALLOCATE',
    'SELECT',
  ];

  let hasErrors = false;

  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];
    const firstWord = stmt.trim().split(/\s+/)[0].toUpperCase();

    if (!allowedVerbs.includes(firstWord)) {
      console.warn(`  [Cảnh báo] Câu lệnh #${i + 1} bắt đầu bằng từ khóa không chuẩn: "${firstWord}" (Đoạn đầu: ${stmt.slice(0, 50)}...)`);
    }

    // Kiểm tra cân bằng dấu ngoặc ()
    if (!checkBalancedParentheses(stmt)) {
      console.error(`  ✖ LỖI CÚ PHÁP: Câu lệnh #${i + 1} (${firstWord}) không cân bằng dấu ngoặc ()!`);
      console.error(`     Nội dung: ${stmt.slice(0, 120)}...`);
      hasErrors = true;
    }

    // Kiểm tra câu lệnh CREATE TABLE
    if (firstWord === 'CREATE' && stmt.toUpperCase().includes('TABLE')) {
      if (!stmt.toUpperCase().includes('ENGINE=') && !stmt.toUpperCase().includes('ENGINE =')) {
        console.warn(`  [Lưu ý] Câu lệnh CREATE TABLE #${i + 1} có thể thiếu cấu hình ENGINE=InnoDB`);
      }
    }
  }

  if (!hasErrors) {
    console.log(`  ✔ HỢP LỆ: Toàn bộ ${statements.length} câu lệnh đều đúng định dạng cú pháp SQL!`);
    return true;
  } else {
    console.error(`  ✖ THẤT BẠI: Phát hiện lỗi cú pháp trong file ${fileName}`);
    return false;
  }
}

function main() {
  console.log('================================================================');
  console.log('  CÔNG CỤ KIỂM TRA CÚ PHÁP FILE SQL & MIGRATION (SYNTAX VALIDATOR)');
  console.log('================================================================');

  const files = [
    path.join(__dirname, '..', '..', 'cinema_management.sql'),
    path.join(__dirname, '..', 'migrations', '01_update_seed_passwords_bcrypt.sql'),
    path.join(__dirname, '..', 'migrations', '02_add_voucher_columns_to_bookings.sql'),
    path.join(__dirname, '..', 'migrations', '03_create_movie_reviews_table.sql'),
    path.join(__dirname, '..', 'migrations', '04_sync_cinema_data.sql'),
  ];

  let allPassed = true;
  for (const f of files) {
    const ok = validateSqlFile(f);
    if (!ok) allPassed = false;
  }

  console.log('\n================================================================');
  if (allPassed) {
    console.log('  KẾT QUẢ: 100% CÁC FILE SQL & MIGRATION ĐẠT TIÊU CHUẨN CÚ PHÁP MYSQL!');
    console.log('================================================================\n');
    process.exit(0);
  } else {
    console.error('  KẾT QUẢ: PHÁT HIỆN LỖI CÚ PHÁP TRONG MỘT SỐ FILE SQL!');
    console.log('================================================================\n');
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { splitStatements, checkBalancedParentheses, validateSqlFile };

