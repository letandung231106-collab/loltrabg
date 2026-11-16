const https = require('https');

const VERCEL_TOKEN = process.env.VERCEL_TOKEN || '';
const TEAM_ID = 'team_ijiA50Uot8pCYNt9t3Ov4eZV';
const PROJECT_ID = 'prj_c9ZTlnxYZy5OitG1WeOZN4OJCD8b';

const envVars = [
  { key: 'JWT_SECRET', value: 'cinema_ooad_secret_jwt_key_2026_super_secure', type: 'encrypted', target: ['production', 'preview', 'development'] },
  { key: 'MOMO_PARTNER_CODE', value: 'MOMO', type: 'plain', target: ['production', 'preview', 'development'] },
  { key: 'MOMO_ACCESS_KEY', value: 'F8BBA842ECF85', type: 'plain', target: ['production', 'preview', 'development'] },
  { key: 'MOMO_SECRET_KEY', value: 'K951B6PE1waDMi640xX08PD3vg6EkVlz', type: 'encrypted', target: ['production', 'preview', 'development'] },
  { key: 'SEPAY_ACCOUNT_NUMBER', value: '8813341949', type: 'plain', target: ['production', 'preview', 'development'] },
  { key: 'SEPAY_BANK_NAME', value: 'BIDV', type: 'plain', target: ['production', 'preview', 'development'] },
  { key: 'SEPAY_ACCOUNT_HOLDER', value: 'LE TAN DUNG', type: 'plain', target: ['production', 'preview', 'development'] },
  { key: 'ENABLE_IN_MEMORY_DEMO', value: 'true', type: 'plain', target: ['production', 'preview', 'development'] },
  { key: 'NODE_ENV', value: 'production', type: 'plain', target: ['production', 'preview', 'development'] },
];

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
