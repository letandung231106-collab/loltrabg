const fs = require('fs');
const path = require('path');
const https = require('https');

const VERCEL_TOKEN = process.env.VERCEL_TOKEN || '';
const TEAM_ID = 'team_ijiA50Uot8pCYNt9t3Ov4eZV';
const PROJECT_NAME = 'night-movie';

function getAllFiles(dirPath, arrayOfFiles = [], baseDir = dirPath) {
  const files = fs.readdirSync(dirPath);

  files.forEach((file) => {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      getAllFiles(fullPath, arrayOfFiles, baseDir);
    } else {
      const relativePath = path.relative(baseDir, fullPath).replace(/\\/g, '/');
      arrayOfFiles.push({
        fullPath,
        file: relativePath,
      });
    }
  });

  return arrayOfFiles;
}

async function deploy() {
  console.log('--- Đang chuẩn bị các tệp để deploy toàn diện lên Vercel ---');
  const distDir = path.resolve(__dirname, '../../frontend/dist');
  if (!fs.existsSync(distDir)) {
    throw new Error(`Thư mục dist không tồn tại: ${distDir}`);
  }

  const fileList = getAllFiles(distDir);
  console.log(`Tìm thấy ${fileList.length} tệp frontend trong thư mục dist.`);

  const deploymentFiles = fileList.map((item) => {
    const buffer = fs.readFileSync(item.fullPath);
    return {
      file: item.file,
      data: buffer.toString('base64'),
      encoding: 'base64',
    };
  });

  // Bundle backend serverless nếu chưa có hoặc mới cập nhật
  const serverlessPath = path.resolve(__dirname, '../dist/serverless.js');
  if (fs.existsSync(serverlessPath)) {
    const serverlessBuffer = fs.readFileSync(serverlessPath);
    deploymentFiles.push({
      file: 'api/index.js',
      data: serverlessBuffer.toString('base64'),
      encoding: 'base64',
    });
    console.log(`Đã đóng gói backend Serverless Function: api/index.js (${(serverlessBuffer.length / (1024 * 1024)).toFixed(2)} MB)`);
  }

  // Cấu hình Rewrite trong vercel.json
  const vercelConfig = {
    rewrites: [
      { source: '/api/(.*)', destination: '/api/index.js' },
      { source: '/(.*)', destination: '/index.html' },
    ],
  };
  deploymentFiles.push({
    file: 'vercel.json',
    data: Buffer.from(JSON.stringify(vercelConfig, null, 2)).toString('base64'),
    encoding: 'base64',
  });

  console.log(`Tổng số tệp gửi lên Vercel: ${deploymentFiles.length}`);

  const payload = JSON.stringify({
    name: PROJECT_NAME,
    project: PROJECT_NAME,
    target: 'production',
    files: deploymentFiles,
  });

  console.log(`Dung lượng payload: ${(payload.length / (1024 * 1024)).toFixed(2)} MB. Đang gửi lên Vercel API...`);

  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.vercel.com',
      port: 443,
      path: `/v13/deployments?teamId=${TEAM_ID}`,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${VERCEL_TOKEN}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });

    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

deploy().then((res) => {
  console.log('Kết quả Deploy Vercel (HTTP Status:', res.status, '):');
  if (res.data?.url) {
    console.log('Deployment URL:', `https://${res.data.url}`);
  }
  if (res.data?.alias && res.data.alias.length > 0) {
    console.log('Production Domain:', res.data.alias.map((a) => `https://${a}`).join(', '));
  }
  if (res.data?.readyState) {
    console.log('Trạng thái:', res.data.readyState);
  }
  if (res.data?.error) {
    console.error('Lỗi Vercel:', res.data.error);
  }
}).catch((err) => {
  console.error('Lỗi thực thi:', err);
});
