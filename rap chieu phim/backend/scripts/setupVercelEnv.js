const https = require('https');

const VERCEL_TOKEN = process.env.VERCEL_TOKEN || '';
const TEAM_ID = process.env.VERCEL_TEAM_ID || '';
const PROJECT_ID = process.env.VERCEL_PROJECT_ID || '';

// Đọc tất cả giá trị nhạy cảm từ biến môi trường cục bộ, tuyệt đối không viết cứng secret trong source code
const envVars = [
  { key: 'JWT_SECRET', value: process.env.JWT_SECRET || '', type: 'encrypted', target: ['production', 'preview', 'development'] },
  { key: 'DATABASE_URL', value: process.env.DATABASE_URL || '', type: 'encrypted', target: ['production', 'preview', 'development'] },
  { key: 'SUPABASE_URL', value: process.env.SUPABASE_URL || '', type: 'plain', target: ['production', 'preview', 'development'] },
  { key: 'MOMO_PARTNER_CODE', value: process.env.MOMO_PARTNER_CODE || '', type: 'plain', target: ['production', 'preview', 'development'] },
  { key: 'MOMO_ACCESS_KEY', value: process.env.MOMO_ACCESS_KEY || '', type: 'plain', target: ['production', 'preview', 'development'] },
  { key: 'MOMO_SECRET_KEY', value: process.env.MOMO_SECRET_KEY || '', type: 'encrypted', target: ['production', 'preview', 'development'] },
  { key: 'NODE_ENV', value: 'production', type: 'plain', target: ['production', 'preview', 'development'] },
].filter((item) => Boolean(item.value));

function sendEnv(item) {
  return new Promise((resolve) => {
    const payload = JSON.stringify(item);
    const options = {
      hostname: 'api.vercel.com',
      port: 443,
      path: `/v10/projects/${PROJECT_ID}/env?teamId=${TEAM_ID}`,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${VERCEL_TOKEN}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (c) => data += c);
      res.on('end', () => {
        resolve({ key: item.key, status: res.statusCode, data });
      });
    });

    req.on('error', (err) => resolve({ key: item.key, error: err.message }));
    req.write(payload);
    req.end();
  });
}

async function run() {
  console.log('--- Đang cấu hình biến môi trường trên Vercel ---');
  for (const env of envVars) {
    const res = await sendEnv(env);
    console.log(`- ${env.key}: Status ${res.status}`);
  }
}

run();
