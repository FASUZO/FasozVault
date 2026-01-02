/****
 * FasozVault API Server (Express)
 * ----------------------------------
 * 环境变量一览（全部可选）：
 *   PORT               监听端口（默认 3000）
 *   LOG_LEVEL          日志级别：debug | info | error （默认 info）
 *   JSON_LIMIT         最大请求体大小（如 "100mb"，默认 50mb）
 *   DATA_DIR           数据目录，支持绝对路径或相对项目根目录（默认 "data"）
 *   DEFAULT_DARK       前端默认暗黑模式："true" | "false"
 *   DEFAULT_AUTO_SAVE  前端默认自动保存："true" | "false"
 *   DEFAULT_DEBUG      前端默认开启调试输出："true" | "false"
 *   FONT_URL           供前端动态加载的字体样式链接
 *
 * 提示：可在根目录创建 .env 文件来持久化配置；运行 `npm run setup` 会自动生成 .env（第一次使用）。
 ****/
/****
 * FasozVault API Server (Express) - Optimized
 * ----------------------------------
 * 优化点：
 * 1. 使用原子写入 (Atomic Write) 保护 data.json 数据完整性
 * 2. 优化文件操作为异步，避免阻塞事件循环
 ****/
require('dotenv').config();
const fs = require('fs');
const fsPromises = require('fs').promises; // 引入 Promise 版 fs
const path = require('path');
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

// 可配置参数
const LOG_LEVEL   = process.env.LOG_LEVEL   || 'info';
const JSON_LIMIT  = process.env.JSON_LIMIT  || '50mb';
const DATA_DIR_ENV= process.env.DATA_DIR    || 'data';

// 前端默认行为配置
const DEFAULT_DARK        = process.env.DEFAULT_DARK   === 'true';
const DEFAULT_AUTO_SAVE   = process.env.DEFAULT_AUTO_SAVE === 'true';
const DEFAULT_DEBUG_FRONT = process.env.DEFAULT_DEBUG  === 'true';
let FONT_URL            = process.env.FONT_URL || '';

// 项目根目录
const ROOT_DIR = path.join(__dirname, '..');

// 若设置了 FONT_URL，但文件不存在，则自动禁用
if(FONT_URL){
  try{
    if(!/^https?:\/\//i.test(FONT_URL)){
      const abs = path.isAbsolute(FONT_URL) ? FONT_URL : path.join(ROOT_DIR, FONT_URL.replace(/^\//, ''));
      if(!fs.existsSync(abs)){
        console.log('[INFO ] FONT_URL 指向的文件不存在，已忽略:', FONT_URL);
        FONT_URL = '';
      }
    }
  }catch(e){ FONT_URL=''; }
}

// 简易日志封装
const logger = {
  debug: (...args)=> { if(LOG_LEVEL === 'debug') console.log('[DEBUG]', ...args); },
  info : (...args)=> { if(['debug','info'].includes(LOG_LEVEL)) console.log('[INFO ]', ...args); },
  error: (...args)=> console.error('[ERROR]', ...args)
};

// ----------------- 初始数据常量 -----------------
const DEFAULT_DATA = {
  categories: ['设备', '软件', '零件', '其他'],
  channels: ['淘宝', '京东', '拼多多', '闲鱼', '其他'],
  tags: [],
  assets: []
};

// 若存在 Vite 打包后的 dist 目录，则优先使用
const STATIC_DIR = fs.existsSync(path.join(ROOT_DIR, 'dist'))
  ? path.join(ROOT_DIR, 'dist')
  : ROOT_DIR;

// 数据目录及文件路径
const DATA_DIR = path.isAbsolute(DATA_DIR_ENV) ? DATA_DIR_ENV : path.join(ROOT_DIR, DATA_DIR_ENV);
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
const DATA_PATH = path.join(DATA_DIR, 'data.json');

// -------- 备份与设置 --------
const BACKUP_DIR = path.join(DATA_DIR,'backups');
if(!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true });

const SETTINGS_PATH = path.join(DATA_DIR, 'settings.json');

function loadSettings(){
  try{
    if(fs.existsSync(SETTINGS_PATH)) return JSON.parse(fs.readFileSync(SETTINGS_PATH,'utf-8'));
  }catch(e){ logger.error('读取设置失败',e); }
  return { backupIntervalDays:7, lastBackupAt:0 };
}
function saveSettings(obj){
  try{ fs.writeFileSync(SETTINGS_PATH, JSON.stringify(obj,null,2)); }
  catch(e){ logger.error('保存设置失败',e); }
}
let settings = loadSettings();

// 安全原子写入函数 (新增优化)
async function safeWriteJson(filepath, data) {
  const tempPath = `${filepath}.tmp-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  try {
    // 1. 写入临时文件
    await fsPromises.writeFile(tempPath, JSON.stringify(data, null, 2), 'utf8');
    // 2. 原子重命名
    await fsPromises.rename(tempPath, filepath);
  } catch (err) {
    // 清理临时文件
    if (fs.existsSync(tempPath)) await fsPromises.unlink(tempPath).catch(()=>{});
    throw err;
  }
}

function createBackup(){
  try{
    const ts = new Date();
    const name = `backup_${ts.getFullYear()}${String(ts.getMonth()+1).padStart(2,'0')}${String(ts.getDate()).padStart(2,'0')}_${String(ts.getHours()).padStart(2,'0')}${String(ts.getMinutes()).padStart(2,'0')}${String(ts.getSeconds()).padStart(2,'0')}.json`;
    const dest = path.join(BACKUP_DIR, name);
    // 使用同步拷贝保证备份即时完成，或者也可以改为异步
    fs.copyFileSync(DATA_PATH, dest);
    settings.lastBackupAt = Date.now();
    saveSettings(settings);
    logger.info('数据已备份至', dest);
    return name;
  }catch(e){ logger.error('备份失败', e); throw e; }
}

function maybeAutoBackup(){
  const days = settings.backupIntervalDays || 0;
  if(days<=0) return;
  const due = (Date.now() - (settings.lastBackupAt||0)) >= days*24*60*60*1000;
  if(due) createBackup();
}

// 图片上传目录
const UPLOAD_DIR = path.join(DATA_DIR, 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// 初始化数据文件
if (!fs.existsSync(DATA_PATH)) {
  fs.writeFileSync(DATA_PATH, JSON.stringify(DEFAULT_DATA, null, 2));
}

app.use(express.json({ limit: JSON_LIMIT }));

// 请求日志
app.use((req, res, next) => {
  if (LOG_LEVEL === 'debug') {
    logger.debug(`${req.method} ${req.path}`);
  }
  next();
});

// 错误处理
app.use((err, req, res, next) => {
  if (err.type === 'entity.too.large') {
    console.error('Payload too large:', err.length);
    return res.status(413).json({ ok: false, message: 'Payload too large', max: JSON_LIMIT });
  }
  return next(err);
});

// --- API ---

app.get('/api/env', (_,res)=>{
  res.json({
    defaultDark: DEFAULT_DARK,
    defaultAutoSave: DEFAULT_AUTO_SAVE,
    debug: DEFAULT_DEBUG_FRONT,
    fontUrl: FONT_URL
  });
});

app.get('/api/data', (_, res) => {
  try {
    if (!fs.existsSync(DATA_PATH)) {
      // 如果数据文件不存在，创建默认数据
      fs.writeFileSync(DATA_PATH, JSON.stringify(DEFAULT_DATA, null, 2));
    }
    res.sendFile(DATA_PATH);
  } catch (err) {
    logger.error('读取数据文件失败', err);
    res.status(500).json({ ok: false, err: err.message });
  }
});

// 保存数据 - 优化为异步 + 原子写入
app.post('/api/data', async (req, res) => {
  const bodySize = Buffer.byteLength(JSON.stringify(req.body));
  logger.info('Saving data, size:', bodySize, 'bytes');

  try {
    const newData = req.body;

    // ---------- 数据验证 ----------
    if (!newData || typeof newData !== 'object') {
      return res.status(400).json({ ok: false, err: '无效的数据格式' });
    }

    // 确保必要字段存在
    if (!Array.isArray(newData.categories)) newData.categories = DEFAULT_DATA.categories;
    if (!Array.isArray(newData.channels)) newData.channels = DEFAULT_DATA.channels;
    if (!Array.isArray(newData.tags)) newData.tags = [];
    if (!Array.isArray(newData.assets)) newData.assets = [];

    // ---------- 图片处理 (同步写入图片文件，保持逻辑简单) ----------
    if(Array.isArray(newData.assets)){
      newData.assets = newData.assets.map(a=>{
        if(a.image && a.image.startsWith('data:image')){
          try{
            const match = a.image.match(/^data:image\/(\w+);base64,(.+)$/);
            if(match){
              const ext = match[1];
              const b64 = match[2];
              // 使用更唯一的文件名，避免冲突
              const timestamp = Date.now();
              const random = Math.random().toString(36).slice(2, 10);
              const fileName = `img_${timestamp}_${random}.${ext}`;
              const filePath = path.join(UPLOAD_DIR, fileName);
              fs.writeFileSync(filePath, Buffer.from(b64, 'base64'));
              a.image = `/uploads/${fileName}`;
            }
          }catch(e){ console.error('保存图片失败', e); }
        }
        return a;
      });
    }

    // ---------- 图片清理逻辑 (可选：可改为异步) ----------
    // 为了性能，可以考虑暂时保留清理逻辑或将其移至独立任务
    // 这里保持原逻辑以确保功能一致性
    let oldImages = [];
    try{
      if(fs.existsSync(DATA_PATH)){
        const prev = JSON.parse(fs.readFileSync(DATA_PATH, 'utf-8'));
        if(Array.isArray(prev.assets)){
          oldImages = prev.assets
            .map(a=>a.image)
            .filter(img=> typeof img === 'string' && img.startsWith('/uploads/'));
        }
      }
    }catch(e){ logger.error('读取旧数据时出错', e); }

    const newImages = (newData.assets||[])
      .map(a=>a.image)
      .filter(img=> typeof img === 'string' && img.startsWith('/uploads/'));

    const toDelete = oldImages.filter(img=> !newImages.includes(img));
    toDelete.forEach(relPath=>{
      try{
        const abs = path.join(ROOT_DIR, relPath.replace(/^\//, ''));
        if(fs.existsSync(abs)){
          fs.unlinkSync(abs); // 既然是删除无用文件，同步删除也没问题
          logger.info('已删除未使用的图片文件:', abs);
        }
      }catch(e){ logger.error('删除图片失败', e); }
    });

    // ---------- 核心优化：原子写入数据 ----------
    await safeWriteJson(DATA_PATH, newData);

    // 自动备份检查
    maybeAutoBackup();
    res.json({ ok: true });

  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, err: err.message });
  }
});

app.post('/api/reset', async (req, res) => {
  try {
    await safeWriteJson(DATA_PATH, DEFAULT_DATA);
    res.json({ ok: true });
  } catch (err) {
    logger.error('重置数据失败', err);
    res.status(500).json({ ok: false, err: err.message });
  }
});

app.post('/api/fix', (req, res) => {
  // ... (fix 逻辑保持不变)
  try{
    const data = JSON.parse(fs.readFileSync(DATA_PATH, 'utf-8'));
    if(!Array.isArray(data.assets)) data.assets = [];
    const referenced = new Set();
    let cleaned = 0;
    data.assets.forEach(a=>{
      if(a.image && typeof a.image === 'string' && a.image.includes('/uploads/')){
        const filename = path.basename(a.image);
        const abs = path.join(UPLOAD_DIR, filename);
        if(fs.existsSync(abs)) referenced.add(filename);
        else { a.image = ''; cleaned++; }
      }
    });
    let deleted = 0;
    fs.readdirSync(UPLOAD_DIR).forEach(fname=>{
      if(!referenced.has(fname)){
        try{ fs.unlinkSync(path.join(UPLOAD_DIR, fname)); deleted++; }
        catch(e){ logger.error('删除文件失败', e); }
      }
    });
    fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2));
    res.json({ ok:true, cleaned, deleted });
  }catch(err){
    logger.error('修复数据失败', err);
    res.status(500).json({ ok:false, message:err.message });
  }
});

app.post('/api/backup', (req,res)=>{
  try{
    const file = createBackup();
    res.json({ ok:true, file });
  }catch(e){ res.status(500).json({ ok:false, message:e.message }); }
});

app.get('/api/backup-config', (_,res)=>{
  res.json({ days: settings.backupIntervalDays||0 });
});

app.post('/api/backup-config', (req,res)=>{
  const days = parseInt(req.body.days,10);
  if(isNaN(days) || days<0) return res.status(400).json({ ok:false, message:'invalid days' });
  settings.backupIntervalDays = days;
  saveSettings(settings);
  res.json({ ok:true });
});

app.use('/uploads', express.static(UPLOAD_DIR));

// 静态文件服务
logger.info(`Static directory: ${STATIC_DIR}`);
app.use(express.static(STATIC_DIR, {
  index: 'index.html',
  extensions: ['html', 'htm']
}));

app.listen(PORT, () => {
  logger.info(`Server running at http://localhost:${PORT}`);
  logger.info(`Data directory: ${DATA_DIR}`);
});