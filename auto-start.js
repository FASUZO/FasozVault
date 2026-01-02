/**
 * 自动启动脚本
 * 检查是否已构建，如果未构建则先构建，然后启动服务器
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT_DIR = __dirname;
const DIST_DIR = path.join(ROOT_DIR, 'dist');

// 检查dist目录是否存在
if (!fs.existsSync(DIST_DIR)) {
  console.log('检测到未构建，正在构建...');
  try {
    execSync('npm run build', { stdio: 'inherit', cwd: ROOT_DIR });
    console.log('构建完成！');
  } catch (error) {
    console.error('构建失败:', error.message);
    process.exit(1);
  }
} else {
  console.log('已检测到构建文件，直接启动服务器');
}

// 启动服务器
console.log('启动服务器...');
require('./server/server.js');

