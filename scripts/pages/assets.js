/**
 * FasozVault - 资产管理系统主文件
 * 
 * 功能说明：
 * - 资产列表展示和管理
 * - 搜索和筛选功能
 * - 组合资产管理
 * - 附件上传和管理
 * - 数据自动保存
 * 
 * 代码结构：
 * 1. 初始化配置和数据加载
 * 2. 表格构建和渲染
 * 3. 搜索筛选功能
 * 4. 模态框（编辑、设置、筛选）
 * 5. 数据保存和同步
 * 
 * 详细说明请查看：scripts/ASSETS_CODE_GUIDE.md
 */

import { logInfo, logDebug } from '../utils/debug.js';
// 导入工具函数模块
import { formatTwoDecimal, generateUniqueId, formatDate } from '../utils/assets-utils.js';
// 导入组合资产模块
import { 
  isComponentAsset, 
  calculateCompositeAmount, 
  mergeCompositeTags, 
  getComponentDetails 
} from '../modules/composite-assets.js';
// 导入筛选模块
import { filterAsset, syncAssetsDataFromTable } from '../modules/filter.js';
// 导入附件模块
import { buildImageCell as buildImageCellModule, buildAttachmentPart } from '../modules/attachment.js';

(async function () {
  /* ========== 1. 初始化配置和数据加载 ========== */
  
  // 读取运行时配置（主题、自动保存等设置）
  let envCfg = {};
  try {
    const r = await fetch('/api/env');
    if(r.ok) envCfg = await r.json();
  } catch(e) { console.warn('无法获取 /api/env', e); }

  /* ---------- SVG Icons (global) ---------- */
  if(typeof ICON_EDIT==='undefined'){
    var ICON_EDIT = `<svg viewBox="0 0 1024 1024" width="24" height="24"><path d="M252.3 743.3l235.8-42.4-147.8-179.1zM365.2 501.4l148.2 178.8L868.3 389 720.2 210.2zM958 259.7l-92.6-111.9c-15.1-18.4-43.7-20.3-63.7-4.2l-53.9 44 148.1 179.1 53.9-44c19.6-16.1 23.3-44.6 8.2-63z" fill="#2867CE"></path><path d="M770.1 893.7H259.6c-93.1 0-168.5-75.5-168.5-168.5V345.4c0-93.1 75.5-168.5 168.5-168.5h49.6c26.6 0 48.1 21.5 48.1 48.1s-21.5 48.1-48.1 48.1h-49.6c-40 0-72.4 32.4-72.4 72.4v379.8c0 40 32.4 72.4 72.4 72.4h510.5c40 0 72.4-32.4 72.4-72.4v-132c0-26.6 21.5-48.1 48.1-48.1s48.1 21.5 48.1 48.1v132c-0.1 93-75.5 168.4-168.6 168.4z" fill="#BDD2EF"></path></svg>`;
    var ICON_VIEW = `<svg viewBox="0 0 1024 1024" width="20" height="20"><path d="M743.367111 544.711111a227.555556 227.555556 0 0 1 179.996445 366.762667l62.805333 62.862222a28.444444 28.444444 0 0 1-40.277333 40.220444l-62.691556-62.748444a227.555556 227.555556 0 1 1-139.832889-407.096889z m15.075556-516.323555A151.722667 151.722667 0 0 1 910.222222 180.110222l-1.820444 360.448a284.444444 284.444444 0 0 0-342.584889 453.973334l-356.522667-0.113778A151.722667 151.722667 0 0 1 57.457778 842.752V180.110222A151.722667 151.722667 0 0 1 209.237333 28.387556h549.205334z m-102.456889 600.120888c-52.167111 17.066667-94.890667 83.512889-94.890667 137.784889 0 61.952 50.801778 131.242667 112.412445 133.233778-40.504889-27.192889-67.356444-89.770667-67.356445-137.614222 0-49.152 13.710222-109.397333 49.834667-133.404445zM361.528889 682.666667H198.371556a28.444444 28.444444 0 0 0-5.12 56.433777l5.12 0.455112h163.157333a28.444444 28.444444 0 1 0 0-56.888889zM475.591111 455.111111H198.371556a28.444444 28.444444 0 0 0-5.12 56.433778l5.12 0.455111H475.591111a28.444444 28.444444 0 1 0 0-56.888889z m292.408889-227.555555H198.371556a28.444444 28.444444 0 0 0-5.12 56.433777l5.12 0.455111H768a28.444444 28.444444 0 1 0 0-56.888888z" fill="#8598C4"></path></svg>`;
  }

  // 应用默认主题 / 自动保存 / 调试开关
  if(localStorage.getItem('autoSave') === null && typeof envCfg.defaultAutoSave === 'boolean'){
    localStorage.setItem('autoSave', envCfg.defaultAutoSave);
  }
  if(localStorage.getItem('theme') === null && typeof envCfg.defaultDark === 'boolean'){
    localStorage.setItem('theme', envCfg.defaultDark ? 'dark' : 'light');
  }
  if(envCfg.debug){ window.debug = true; }
  if(envCfg.fontUrl){ const link=document.createElement('link'); link.rel='stylesheet'; link.href=envCfg.fontUrl; document.head.appendChild(link); }
  // 注意：主区域宽度设置已在 common.js 中统一处理，此处无需重复设置

  // 拉取服务器数据
  const resp = await fetch('/api/data');
  const serverData = await resp.json();
  logDebug('加载 serverData', serverData);

  // 检测自动保存偏好
  let autoSaveEnabled = localStorage.getItem('autoSave') === 'true';
  logInfo('AutoSave status (assets page):', autoSaveEnabled);
  
  // 固定为查看模式（不再支持编辑模式切换）
  const editMode = false;

  let autoSaveTimer = null;
  // 列宽正在调整标志
  window.__colResizing = false;
  function triggerAutoSave(){
    if(!autoSaveEnabled) return;
    if(autoSaveTimer) clearTimeout(autoSaveTimer);
    autoSaveTimer = setTimeout(()=>{
      logDebug('AutoSave - debounced save');
      saveTableToServer(false);
    }, 800); // 800ms 无操作后保存
  }

  /* ========== 2. 数据配置和初始化 ========== */
  
  // 注意：formatTwoDecimal 已从 utils/assets-utils.js 导入，无需重复定义

  const DEFAULT_CATEGORIES = ['股票', '基金', '债券', '不动产', '现金', '其他'];
  const DEFAULT_CHANNELS = ['证券账户', '银行', '支付宝', '微信', '其他'];

  const categories = serverData.categories || DEFAULT_CATEGORIES;
  const channels = serverData.channels || DEFAULT_CHANNELS;
  const tags = serverData.tags || [];

  const columnsMeta = Array.isArray(serverData.columns) && serverData.columns.length ? serverData.columns : [
    { key:'name', label:'名称' },
    { key:'category', label:'分类' },
    { key:'subcategory', label:'标签' },
    { key:'amount', label:'金额' },
    { key:'date', label:'时间' },
    { key:'channel', label:'购入渠道' },
    { key:'image', label:'附件' },
    { key:'note', label:'备注' }
  ];
  const labelMap = { name:'名称', category:'分类', subcategory:'标签' };
  columnsMeta.forEach(c=>{ if(labelMap[c.key]) c.label = labelMap[c.key]; });
  // 从columnOrder中移除action列
  let columnOrder = Array.isArray(serverData.columnOrder) && serverData.columnOrder.length ? serverData.columnOrder : columnsMeta.map(c=>c.key);
  columnOrder = columnOrder.filter(key => key !== 'action');

  const storedData = serverData.assets || [];
  
  // 维护所有资产数据的数组（用于搜索和筛选）
  let allAssetsData = [...storedData];

  // 构建ID集合和生成器（用于生成唯一ID）
  // 注意：generateUniqueId 已从 utils/assets-utils.js 导入
  const existingIds = new Set(storedData.map(a=>a.originId).filter(Boolean));
  // 创建ID生成函数的包装器，绑定existingIds
  const generateId = () => generateUniqueId(existingIds);

  // 打开标签选择弹窗
  function openTagPicker(current, onSelect){
    const overlay=document.createElement('div'); overlay.className='overlay';
    const modal=document.createElement('div'); modal.className='modal'; modal.style.width='300px';
    modal.innerHTML = '<h3>选择标签</h3>';
    const body=document.createElement('div'); body.className='modal-body'; body.style.display='flex'; body.style.flexWrap='wrap'; body.style.gap='6px'; modal.appendChild(body);
    const addChip=(label,val)=>{ const c=document.createElement('span'); c.className='chip'; c.textContent=label; if(val===current) c.style.background='rgba(25,118,210,0.25)';
      c.addEventListener('click',()=>{ onSelect(val); document.body.removeChild(overlay);} ); body.appendChild(c);} ;
    addChip('(无)','');
    tags.forEach(t=> addChip(t,t));
    const cancel=document.createElement('button'); cancel.textContent='取消'; cancel.className='btn-like btn-small btn-danger'; cancel.style.marginTop='10px'; cancel.style.alignSelf='center'; cancel.onclick=()=>document.body.removeChild(overlay);
    modal.appendChild(cancel);
    overlay.appendChild(modal); document.body.appendChild(overlay);
  }

  const addRowBtn = document.getElementById('addRowBtn');
  const tableBody = document.querySelector('#assetsTable tbody');

  const columnLabels = {}; columnsMeta.forEach(c=>{ columnLabels[c.key]=c.label; });
  // 移除操作列相关代码

  // 处理隐藏列（需要在表头构建之前定义）
  const hiddenColumns = serverData.hiddenColumns || [];
  function applyHiddenColumns() {
    logDebug('applyHiddenColumns', hiddenColumns);
    columnOrder.forEach((key, idx) => {
      const hide = hiddenColumns.includes(key);
      const th = document.querySelector(`#assetsTable thead th:nth-child(${idx+1})`);
      if(th) th.classList.toggle('hidden-col', hide);
      document.querySelectorAll(`#assetsTable tbody tr`).forEach(row=>{
        const cell = row.cells[idx];
        if(cell) cell.classList.toggle('hidden-col', hide);
      });
    });
  }

  // 重新构建表头（在列标签确定之后）
  const headerTr = document.querySelector('#assetsTable thead tr');
  const assetsTable = document.getElementById('assetsTable');
  headerTr.innerHTML = '';
  columnOrder.forEach(key=>{
    const th=document.createElement('th');
    th.textContent = columnLabels[key] || key;
    if(key==='note') th.classList.add('note-col');
    if(key==='date') th.classList.add('date-col');
    if(key==='subcategory') th.classList.add('tag-col');
    // 移除操作列相关代码
    // 应用初始宽度
    const colDef = columnsMeta.find(c=>c.key===key) || {};
    if(colDef.width){ th.style.width = colDef.width + 'px'; }
    // 拖拽调整列宽
    const handle=document.createElement('span'); handle.className='col-resize-handle'; th.appendChild(handle);
    handle.addEventListener('mousedown', e=>{
      e.preventDefault(); e.stopPropagation();
      const startX = e.clientX;
      const startW = th.offsetWidth;
      let moved=false;
      function onMove(ev){
        const diff = ev.clientX - startX;
        const newW = Math.max(60, startW + diff);
        colDef.width = newW;
        // 立即更新当前列的宽度，使拖拽效果实时可见
        th.style.width = newW + 'px';
        applyColumnWidths();
        if(Math.abs(diff)>2){ moved=true; window.__colResizing=true; }
      }
      function onUp(){
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
        triggerAutoSave();
        if(moved){
          window.__colResizing=true;
          setTimeout(()=>{ window.__colResizing=false; },150);
        }
      }
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    });
    headerTr.appendChild(th);
  });
  // 不再添加操作列
  
  // 初始应用隐藏列样式
  applyHiddenColumns();

  // 用于索引映射
  let idxMap = {};
  function updateIdxMap(){ idxMap = {}; columnOrder.forEach((k,i)=> idxMap[k]=i); }
  updateIdxMap();

  /* ---------- 表格排序状态 ---------- */
  // 先声明变量，避免后续函数提前访问时报 TDZ
  let sortStatus = {};

  /* ---------- 搜索和筛选状态 ---------- */
  let searchKeyword = '';
  let filterCriteria = {
    category: '',      // 分类筛选
    channel: '',       // 渠道筛选
    tag: '',          // 标签筛选
    dateFrom: '',     // 日期范围：开始
    dateTo: '',       // 日期范围：结束
    amountMin: '',    // 金额范围：最小值
    amountMax: ''     // 金额范围：最大值
  };

  /* ---------- 组合资产设置 ---------- */
  let showComponentAssets = localStorage.getItem('showComponentAssets') !== 'false'; // 默认显示

  /* ========== 3. 组合资产辅助函数 ========== */
  // 注意：以下函数已从 modules/composite-assets.js 导入
  // 创建包装函数，绑定 allAssetsData 和 formatTwoDecimal
  
  /**
   * 检查资产是否是某个组合资产的子资产
   * @param {Object} asset - 资产对象
   * @returns {boolean} 是否为子资产
   */
  const checkIsComponentAsset = (asset) => isComponentAsset(asset, allAssetsData);
  
  /**
   * 计算组合资产的总金额
   * @param {Object} compositeAsset - 组合资产对象
   * @returns {string} 格式化后的总金额
   */
  const calcCompositeAmount = (compositeAsset) => 
    calculateCompositeAmount(compositeAsset, allAssetsData, formatTwoDecimal);
  
  /**
   * 合并组合资产的标签
   * @param {Object} compositeAsset - 组合资产对象
   * @returns {Array<string>} 合并后的标签数组
   */
  const mergeTags = (compositeAsset) => 
    mergeCompositeTags(compositeAsset, allAssetsData);
  
  /**
   * 获取组合资产的子资产详情
   * @param {Object} compositeAsset - 组合资产对象
   * @param {string} field - 字段名（'date' 或 'channel'）
   * @returns {Array<Object>} 子资产详情数组
   */
  const getDetails = (compositeAsset, field) => 
    getComponentDetails(compositeAsset, field, allAssetsData);

  /* ========== 4. 搜索和筛选功能 ========== */
  // 注意：filterAsset 已从 modules/filter.js 导入
  // 创建包装函数，绑定筛选选项
  
  /**
   * 资产过滤函数（包装导入的filterAsset）
   * @param {Object} asset - 资产对象
   * @returns {boolean} 是否通过筛选
   */
  const filterAssetWrapper = (asset) => filterAsset(asset, {
    searchKeyword,
    filterCriteria,
    showComponentAssets,
    isComponentAsset: checkIsComponentAsset
  });
  // 注意：syncAssetsDataFromTable 已从 modules/filter.js 导入
  // 创建包装函数，绑定 tableBody 并更新 allAssetsData
  // 重要：只更新表格中显示的资产数据，保留被过滤掉的资产（如子资产）
  // 这样可以确保即使子资产不在表格中显示，它们的数据仍然保留在 allAssetsData 中
  const syncTableData = () => {
    const tableAssets = syncAssetsDataFromTable(tableBody);
    // 创建表格资产的映射表（以 originId 为键）
    const tableAssetMap = new Map(tableAssets.map(a => [a.originId, a]));
    
    // 如果 allAssetsData 为空或未初始化，从表格数据初始化（这种情况不应该发生，但为了安全起见）
    if (!allAssetsData || allAssetsData.length === 0) {
      logDebug('警告：allAssetsData 为空，从表格数据初始化');
      allAssetsData = [...tableAssets];
      return;
    }
    
    // 记录同步前的资产数量
    const beforeCount = allAssetsData.length;
    
    // 更新 allAssetsData：对于表格中存在的资产，更新其数据；对于不在表格中的资产，保留原数据
    const updatedAssets = allAssetsData.map(asset => {
      const tableAsset = tableAssetMap.get(asset.originId);
      // 如果资产在表格中，使用表格中的数据（可能被用户修改过）
      if (tableAsset) {
        return tableAsset;
      }
      // 如果资产不在表格中（可能被过滤掉了），保留原数据
      return asset;
    });
    
    // 添加表格中新出现的资产（理论上不应该发生，但为了安全起见）
    tableAssets.forEach(tableAsset => {
      if (!updatedAssets.find(a => a.originId === tableAsset.originId)) {
        updatedAssets.push(tableAsset);
      }
    });
    
    allAssetsData = updatedAssets;
    
    // 记录同步后的资产数量
    const afterCount = allAssetsData.length;
    logDebug(`同步表格数据：同步前 ${beforeCount} 个资产，表格中 ${tableAssets.length} 个资产，同步后 ${afterCount} 个资产`);
  };

  /* ========== 5. 表格渲染和更新 ========== */
  
  /**
   * 应用过滤并重新渲染表格
   * 功能：
   * 1. 同步表格数据到 allAssetsData（如果表格已有数据）
   * 2. 应用搜索和筛选条件
   * 3. 按置顶状态排序
   * 4. 重新渲染表格
   * 5. 应用隐藏列和列宽设置
   */
  function applyFiltersAndRender() {
    // 先同步当前表格数据（在清空前）
    // 注意：只有在表格已有数据时才同步，避免首次加载时清空数据
    const existingRows = tableBody.querySelectorAll('tr');
    if (existingRows.length > 0) {
      syncTableData();
    }
    
    // 清空表格
    tableBody.innerHTML = '';

    // 应用过滤（使用包装后的过滤函数）
    const filteredAssets = allAssetsData.filter(filterAssetWrapper);

    // 按置顶状态排序
    const sortedData = filteredAssets.sort((a, b) => {
      const aPinned = a.pinned === true;
      const bPinned = b.pinned === true;
      
      if(aPinned && !bPinned) return -1;
      if(!aPinned && bPinned) return 1;
      if(aPinned && bPinned) {
        return (b.pinnedTime || 0) - (a.pinnedTime || 0);
      }
      return 0;
    });
    
    // 重新渲染
    sortedData.forEach(data => createRow(data));
    
    // 应用隐藏列样式
    applyHiddenColumns();
    
    // 应用列宽
    applyColumnWidths();
    
    logDebug('应用过滤，显示', sortedData.length, '条记录');
  }

  // 渲染已有数据
  if (storedData.length) {
    applyFiltersAndRender();
  }
  // 不再自动创建空行，改为点击新增按钮时直接弹出编辑窗口

  // 初次应用列宽
  applyColumnWidths();

  // 渲染结束后，如存在排序偏好则应用（需在排序函数定义完后调用，见下方）

    // 创建行，可传入数据进行填充
  function createRow(prefill = {}) {
    logDebug('createRow 调用', prefill);
    const tr = document.createElement('tr');
    // 将完整对象保存在行上，供后续编辑使用
    if(!prefill.originId){ prefill.originId = generateId(); }
    // 初始化组合资产字段
    if(prefill.isComposite === undefined) prefill.isComposite = false;
    if(!prefill.components) prefill.components = [];
    tr.dataset.extra = JSON.stringify(prefill || {});
    
    // 检查是否是组合资产（需要在创建单元格前确定）
    const isComposite = prefill.isComposite === true;

    // 资产分类 下拉提前生成，其他同理
    const selectTd_category = document.createElement('td');
    const span_category = document.createElement('span');
    span_category.textContent = prefill.category || '';
    selectTd_category.appendChild(span_category);

    // 购入渠道 下拉
    const channelTd = document.createElement('td');
    // 如果是组合资产，显示"-----"并添加悬停提示
    if(isComposite){
      const span = document.createElement('span');
      span.textContent = '-----';
      span.style.cursor = 'help';
      span.style.color = '#999';
      
      // 添加悬停提示
      let tooltip = null;
      span.addEventListener('mouseenter', () => {
        const details = getDetails(prefill, 'channel');
        if(details.length > 0){
          tooltip = document.createElement('div');
          tooltip.className = 'composite-tooltip';
          tooltip.style.cssText = 'position: absolute; background: rgba(0,0,0,0.9); color: #fff; padding: 8px; border-radius: 4px; z-index: 10000; white-space: pre-line; font-size: 12px; max-width: 300px;';
          tooltip.textContent = details.map(d => `${d.name}: ${d.value}`).join('\n');
          document.body.appendChild(tooltip);
          
          const rect = span.getBoundingClientRect();
          tooltip.style.left = rect.left + 'px';
          tooltip.style.top = (rect.bottom + 5) + 'px';
        }
      });
      span.addEventListener('mouseleave', () => {
        if(tooltip && tooltip.parentNode){
          tooltip.parentNode.removeChild(tooltip);
          tooltip = null;
        }
      });
      
      channelTd.appendChild(span);
    } else {
      const span = document.createElement('span');
      span.textContent = prefill.channel || '';
      channelTd.appendChild(span);
    }

    // 附件单元格构造函数（使用导入的模块函数）
    const buildImageCell = () => {
      return buildImageCellModule(
        prefill, 
        updateAssetFromRow, 
        triggerAutoSave, 
        logDebug
      );
    };
    
    // 注意：原实现代码已迁移到 modules/attachment.js，以下代码可删除
    // 临时保留以兼容现有调用
    const buildImageCellOld = () => {
      const imgTd = document.createElement('td');
      imgTd.style.cssText = 'position: relative; min-width: 60px;';
      
      // 图片元素（懒加载，初始不设置src）
      const img = document.createElement('img');
      img.style.cssText = 'max-height: 40px; max-width: 60px; cursor: pointer; display: none; object-fit: contain; border-radius: 4px;';
      img.loading = 'lazy'; // 浏览器原生懒加载
      
      // 占位符容器
      const placeholder = document.createElement('div');
      placeholder.style.cssText = 'display: flex; align-items: center; justify-content: center; min-height: 40px; cursor: pointer;';
      
      if (prefill.image) {
        // 有附件：显示图标占位符，点击或悬停时加载
        const icon = document.createElement('span');
        icon.textContent = '🖼️';
        icon.style.cssText = 'font-size: 20px; opacity: 0.6;';
        icon.title = '点击查看附件';
        placeholder.appendChild(icon);
        
        // 存储图片URL，但不立即加载
        img.dataset.src = prefill.image;
        img.dataset.loaded = 'false';
        
        // 点击占位符加载并显示图片
        let imageLoaded = false;
        const loadImage = () => {
          if (imageLoaded || !img.dataset.src) return;
          imageLoaded = true;
          img.src = img.dataset.src;
          img.style.display = 'block';
          placeholder.style.display = 'none';
        };
        
        // 点击查看
        placeholder.addEventListener('click', (e) => {
          e.stopPropagation();
          if (!imageLoaded) {
            loadImage();
            // 延迟一下再显示预览，确保图片已加载
            setTimeout(() => viewImage(), 100);
          } else {
            viewImage();
          }
        });
        
        // 悬停时预加载（可选）
        let hoverTimer = null;
        placeholder.addEventListener('mouseenter', () => {
          hoverTimer = setTimeout(() => {
            if (!imageLoaded) loadImage();
          }, 500); // 悬停500ms后预加载
        });
        placeholder.addEventListener('mouseleave', () => {
          if (hoverTimer) {
            clearTimeout(hoverTimer);
            hoverTimer = null;
          }
        });
      } else {
        // 无附件：显示"无"文本
        const noImageText = document.createElement('span');
        noImageText.textContent = '无';
        noImageText.style.cssText = 'color: #999; font-size: 12px;';
        placeholder.appendChild(noImageText);
      }

      const fileInput = document.createElement('input');
      fileInput.type = 'file';
      fileInput.accept = 'image/*';
      fileInput.style.display = 'none';

      const openPicker = () => fileInput.click();
      if (!prefill.image) {
        placeholder.addEventListener('click', openPicker);
      }

      let pressTimer = null;
      const viewImage = () => {
        if (!img.src && img.dataset.src) {
          img.src = img.dataset.src;
        }
        if (!img.src) return;
        
        const win = window.open('about:blank');
        if(win){
          win.document.write('<title>附件预览</title>');
          win.document.write('<style>body{margin:0;padding:20px;background:#f5f5f5;display:flex;justify-content:center;align-items:center;min-height:100vh;}</style>');
          win.document.write('<img src="'+img.src+'" style="max-width:90vw;max-height:90vh;object-fit:contain;border-radius:8px;box-shadow:0 4px 12px rgba(0,0,0,0.15);">');
        }
      };

      // 图片点击事件：短按查看，长按替换
      img.addEventListener('mousedown', (e)=>{
        e.stopPropagation();
        pressTimer = setTimeout(()=>{ 
          openPicker(); 
          pressTimer=null; 
        }, 600);
      });
      img.addEventListener('mouseup', (e)=>{
        e.stopPropagation();
        if(pressTimer){ 
          clearTimeout(pressTimer); 
          viewImage(); 
        }
      });
      img.addEventListener('mouseleave', ()=>{ 
        if(pressTimer) clearTimeout(pressTimer); 
      });
      img.addEventListener('touchstart', (e)=>{
        e.stopPropagation();
        pressTimer=setTimeout(()=>{ 
          openPicker(); 
          pressTimer=null; 
        }, 600);
      });
      img.addEventListener('touchend', (e)=>{
        e.stopPropagation();
        if(pressTimer){ 
          clearTimeout(pressTimer); 
          viewImage(); 
        }
      });

      fileInput.addEventListener('change', ()=>{
        if(fileInput.files[0]){
          const reader = new FileReader();
          reader.onload = e=>{
            img.src = e.target.result;
            img.dataset.src = e.target.result;
            img.dataset.loaded = 'true';
            img.style.display='block';
            placeholder.style.display='none';
            logDebug('上传附件，大小:', e.target.result.length, '字符');
            // 更新表格数据并立即保存
            const row = img.closest('tr');
            if(row){ updateAssetFromRow(row); triggerAutoSave(); }
          };
          reader.readAsDataURL(fileInput.files[0]);
        }
      });

      imgTd.appendChild(placeholder);
      imgTd.appendChild(img);
      imgTd.appendChild(fileInput);
      return imgTd;
    };

    // 日期单元格：显示 YYMMDD
    const buildDateCell = (initialVal) => {
      const td = document.createElement('td'); td.classList.add('date-cell');
      const fmt = (str) => {
        if(!str || !/\d{4}-\d{2}-\d{2}/.test(str)) return '';
        const [y,m,d] = str.split('-');
        return y.slice(-2) + m + d;
      };
      
      // 如果是组合资产，显示"-----"并添加悬停提示
      if(isComposite){
        const span = document.createElement('span');
        span.textContent = '-----';
        span.style.cursor = 'help';
        span.style.color = '#999';
        
        // 添加悬停提示
        let tooltip = null;
        span.addEventListener('mouseenter', () => {
          const details = getDetails(prefill, 'date');
          if(details.length > 0){
            tooltip = document.createElement('div');
            tooltip.className = 'composite-tooltip';
            tooltip.style.cssText = 'position: absolute; background: rgba(0,0,0,0.9); color: #fff; padding: 8px; border-radius: 4px; z-index: 10000; white-space: pre-line; font-size: 12px; max-width: 300px;';
            tooltip.textContent = details.map(d => `${d.name}: ${fmt(d.value)}`).join('\n');
            document.body.appendChild(tooltip);
            
            const rect = span.getBoundingClientRect();
            tooltip.style.left = rect.left + 'px';
            tooltip.style.top = (rect.bottom + 5) + 'px';
          }
        });
        span.addEventListener('mouseleave', () => {
          if(tooltip && tooltip.parentNode){
            tooltip.parentNode.removeChild(tooltip);
            tooltip = null;
          }
        });
        
        td.appendChild(span);
        return td;
      }
      
      const span = document.createElement('span');
      span.textContent = fmt(initialVal || '');
      td.appendChild(span);
      return td;
    };

    const specialFactories = {
      category: () => selectTd_category,
      channel: () => channelTd,
      image: () => buildImageCell(),
      date: () => buildDateCell(prefill.purchaseDate || prefill.date),
      subcategory: () => {
        const td=document.createElement('td');
        td.classList.add('tag-cell');
        // 支持数组，如果旧数据是字符串则转换
        let tagArr = Array.isArray(prefill.subcategory)? [...prefill.subcategory]
          : (typeof prefill.subcategory === 'string' && prefill.subcategory.trim()) ? prefill.subcategory.split(',').map(s=>s.trim()).filter(Boolean) : [];
        td.dataset.tags = JSON.stringify(tagArr);

        const render = ()=>{
          td.innerHTML='';
          tagArr.forEach(t=>{
            const chip=document.createElement('span'); chip.className='chip'; chip.textContent=t;
            let timer=null;
            let isRightClick = false;
            
            // 检测右键点击
            chip.addEventListener('contextmenu', (e) => {
              isRightClick = true;
              e.preventDefault(); // 阻止默认浏览器菜单
              // 不阻止冒泡，让事件冒泡到tr显示自定义菜单
            });
            
            chip.addEventListener('mousedown',(e)=>{
              // 如果是右键点击，不处理
              if(e.button === 2 || isRightClick){
                isRightClick = false;
                return;
              }
              timer=setTimeout(()=>{ removeTag(t); timer=null; },600);
            });
            chip.addEventListener('mouseup',(e)=>{
              // 如果是右键点击，不处理
              if(e.button === 2 || isRightClick){
                isRightClick = false;
                return;
              }
              if(timer){ clearTimeout(timer); timer=null; openPicker(); }
            });
            chip.addEventListener('mouseleave',()=>{ 
              if(timer){ clearTimeout(timer); timer=null;} 
              isRightClick = false;
            });
            td.appendChild(chip);
          });
          // 仅在没有标签时显示"＋"
          if(tagArr.length===0){
            const plus=document.createElement('span'); plus.className='chip plus'; plus.textContent='＋';
            let isRightClickPlus = false;
            plus.addEventListener('contextmenu', (e) => {
              isRightClickPlus = true;
              e.preventDefault(); // 阻止默认浏览器菜单
              // 不阻止冒泡，让事件冒泡到tr显示自定义菜单
            });
            plus.addEventListener('click',(e)=>{
              if(!isRightClickPlus){
                openPicker();
              }
              isRightClickPlus = false;
            });
            td.appendChild(plus);
          }
        };

        function openPicker(){
          openTagPicker('', (val)=>{ if(!val) return; if(tagArr.includes(val)){ alert('已存在该标签'); return;} tagArr.push(val); update(); logInfo('add tag', val); logDebug('current tags', tagArr); });
        }

        function removeTag(target){ tagArr = tagArr.filter(x=>x!==target); update(); logInfo('remove tag', target); }

        function update(){ td.dataset.tags = JSON.stringify(tagArr); render();
          const row=td.closest('tr'); if(row){ updateAssetFromRow(row); triggerAutoSave();} }

        render();
        return td;
      }
    };

    // 移除操作列，改用右键菜单

    const getCellByKey = (key)=>{
       if(specialFactories[key]) return specialFactories[key]();
       const colDef = columnsMeta.find(c=>c.key===key) || {type:'text'};
       const type = colDef.type || 'text';
       const td=document.createElement('td');
       if(key==='note') td.classList.add('note-cell');
       switch(type){
         case 'text':
           addInputCellDesp(td,'text',prefill[key]||''); break;
         case 'number':
           addInputCellDesp(td,'number',prefill[key]||''); break;
        case 'date':
          // date字段对应prefill中的purchaseDate
          return buildDateCell(prefill.purchaseDate || prefill[key] || '');
         case 'boolean': {
           const cb=document.createElement('input'); cb.type='checkbox'; cb.checked= !!prefill[key]; td.appendChild(cb); attachSaveListener(cb); break; }
         case 'image':
           return buildImageCell();
         default:
           addInputCellDesp(td,'text',prefill[key]||'');
       }
       return td;
    };

    columnOrder.forEach(key=>{
      const cell = getCellByKey(key);
      if(cell) tr.appendChild(cell);
    });

    // 应用列宽到新行
    applyColumnWidths();

    // 添加右键菜单功能（支持桌面端右键和移动端长按）
    let longPressTimer = null;
    let isLongPress = false;
    let touchStartTime = 0;
    let touchStartPos = { x: 0, y: 0 };
    
    // 检测是否为移动设备
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
                     ('ontouchstart' in window) || 
                     (navigator.maxTouchPoints > 0);
    
    // 右键菜单（桌面端）
    tr.addEventListener('contextmenu', (e) => {
      const target = e.target;
      
      // 如果点击的是输入框、选择框或按钮，不显示右键菜单
      if(target.tagName === 'INPUT' || target.tagName === 'SELECT' || target.tagName === 'BUTTON' || target.closest('button')){
        return; // 允许默认行为
      }
      
      // 如果是标签单元格的chip，阻止默认行为，显示表格菜单
      if(target.classList.contains('chip') || target.closest('.chip')){
        e.preventDefault();
        showContextMenu(e, tr);
        return;
      }
      
      // 确保即使点击的是空白单元格（td本身或td内的空白区域）也能响应
      const td = target.closest('td');
      if(td){
        // 检查td内是否有可交互元素
        const interactiveElements = td.querySelectorAll('input, select, button');
        // 如果点击的是td本身，或者td内没有可交互元素，或者点击的是空白区域
        if(target === td || target.tagName === 'TD' || interactiveElements.length === 0){
          e.preventDefault();
          showContextMenu(e, tr);
          return;
        }
        // 如果点击的是span（可能是空白文本或view模式下的文本），也显示菜单
        if(target.tagName === 'SPAN' && !target.classList.contains('chip')){
          // 检查这个span是否在可交互元素内
          const isInInput = target.closest('input, select, button');
          if(!isInInput){
            e.preventDefault();
            showContextMenu(e, tr);
            return;
          }
        }
      }
      
      e.preventDefault();
      showContextMenu(e, tr);
    });
    
    // 移动端：长按显示菜单，短按在编辑模式下打开编辑窗口
    if(isMobile){
      tr.addEventListener('touchstart', (e) => {
        const target = e.target;
        // 如果点击的是输入框、选择框或按钮，不处理
        if(target.tagName === 'INPUT' || target.tagName === 'SELECT' || target.tagName === 'BUTTON' || target.closest('button')){
          return;
        }
        
        // 如果是chip元素，也允许长按显示菜单
        // chip的点击事件会在touchend时处理
        
        touchStartTime = Date.now();
        const touch = e.touches[0];
        touchStartPos = { x: touch.clientX, y: touch.clientY };
        
        isLongPress = false;
        longPressTimer = setTimeout(() => {
          isLongPress = true;
          const fakeEvent = {
            clientX: touch.clientX,
            clientY: touch.clientY,
            preventDefault: () => {},
            target: target,
            touches: [touch]
          };
          showContextMenu(fakeEvent, tr);
          // 添加触觉反馈（如果支持）
          if(navigator.vibrate){
            navigator.vibrate(50);
          }
        }, 500); // 500ms长按
      });
      
      tr.addEventListener('touchend', (e) => {
        const target = e.target;
        // 如果点击的是输入框、选择框或按钮，不处理
        if(target.tagName === 'INPUT' || target.tagName === 'SELECT' || target.tagName === 'BUTTON' || target.closest('button')){
          if(longPressTimer){
            clearTimeout(longPressTimer);
            longPressTimer = null;
          }
          return;
        }
        
        // 如果是chip元素且是长按，不处理chip的点击事件（让右键菜单显示）
        if(isLongPress && (target.classList.contains('chip') || target.closest('.chip'))){
          isLongPress = false;
          return;
        }
        
        if(longPressTimer){
          clearTimeout(longPressTimer);
          longPressTimer = null;
        }
        
        // 如果是短按（不是长按），打开编辑窗口
        // 但如果是chip元素，不触发编辑窗口（让chip的点击事件处理）
        if(!isLongPress && !target.classList.contains('chip') && !target.closest('.chip')){
          const touchEndTime = Date.now();
          const touch = e.changedTouches[0];
          const touchEndPos = { x: touch.clientX, y: touch.clientY };
          
          // 检查是否移动（如果移动距离超过10px，认为是滑动，不触发点击）
          const moveDistance = Math.sqrt(
            Math.pow(touchEndPos.x - touchStartPos.x, 2) + 
            Math.pow(touchEndPos.y - touchStartPos.y, 2)
          );
          
          // 短按且移动距离小，打开编辑窗口
          if(touchEndTime - touchStartTime < 500 && moveDistance < 10){
            e.preventDefault();
            openAssetModal(tr, false);
          }
        }
        
        isLongPress = false;
      });
      
      tr.addEventListener('touchmove', (e) => {
        if(longPressTimer){
          clearTimeout(longPressTimer);
          longPressTimer = null;
        }
      });
    }
    
    // 如果是置顶资产，在名称列添加置顶标识
    if(prefill.pinned === true){
      // 延迟添加，确保nameCell已经创建
      setTimeout(() => {
        updatePinBadge(tr, true);
      }, 0);
    }
    
    // 如果是组合资产，计算合并后的金额和标签
    if(isComposite){
      // 计算合并后的金额
      const compositeAmount = calcCompositeAmount(prefill);
      if(compositeAmount && !prefill.amount){
        prefill.amount = compositeAmount;
      }
      
      // 合并标签
      const mergedTags = mergeTags(prefill);
      if(mergedTags.length > 0){
        prefill.subcategory = mergedTags;
      }
    }
    
    // 如果是组合资产，在名称列添加标识
    if(isComposite){
      const nameIdx = idxMap['name'];
      if(nameIdx !== undefined){
        const nameCell = tr.cells[nameIdx];
        if(nameCell){
          // 查看模式：使用span元素
          const nameElement = nameCell.querySelector('span');
          if(nameElement){
            // 方案1: 使用小圆点徽章，hover时显示详细信息（推荐）
            const compositeBadge = document.createElement('span');
            compositeBadge.className = 'composite-badge';
            compositeBadge.innerHTML = '<span class="badge-dot"></span>';
            compositeBadge.title = '组合资产（点击查看详情）';
            
            // 添加hover效果显示子资产数量
            const components = prefill.components || [];
            const componentCount = components.length;
            let tooltip = null;
            compositeBadge.addEventListener('mouseenter', (e) => {
              tooltip = document.createElement('div');
              tooltip.className = 'composite-tooltip';
              tooltip.textContent = `组合资产 (${componentCount}个子资产)`;
              compositeBadge.appendChild(tooltip);
            });
            compositeBadge.addEventListener('mouseleave', () => {
              if(tooltip && tooltip.parentNode) {
                tooltip.parentNode.removeChild(tooltip);
              }
            });
            
            compositeBadge.addEventListener('click', (e) => {
              e.stopPropagation();
              const assetData = JSON.parse(tr.dataset.extra || '{}');
              openCompositeDetailsModal(assetData, tr);
            });
            
            // 查看模式：直接添加到span后面，紧贴文本
            nameElement.style.display = 'inline';
            nameElement.style.whiteSpace = 'nowrap';
            nameElement.style.verticalAlign = 'baseline';
            
            // 将徽章添加到nameElement后面
            if(nameElement.nextSibling){
              nameCell.insertBefore(compositeBadge, nameElement.nextSibling);
            } else {
              nameCell.appendChild(compositeBadge);
            }
          }
        }
      }
    }

    // 将生成的行插入到 tbody
    tableBody.appendChild(tr);

    function addInputCellDesp(td,type,val=''){
      // 查看模式：创建文本显示
      const span=document.createElement('span');
      span.textContent = val || '';
      // 如果td是name列且可能有置顶标识，使用inline以便在同一行
      const isNameCell = td === tr.cells[idxMap['name']];
      span.style.display = isNameCell ? 'inline' : 'inline-block';
      td.appendChild(span);
    }

    logDebug('行已添加', tr);
  }

  function attachSaveListener(el, key) {
    // 当表格单元发生变化时，同步到行 dataset.extra，实现双向数据更新
    ['change','input'].forEach(evt=>{
      el.addEventListener(evt, ()=>{
        const row = el.closest('tr');
        if(!row) return;
        updateAssetFromRow(row, {} /* no asset provided, will pull current */);
        triggerAutoSave();
      });
    });
  }

  function getTableData() {
    return Array.from(tableBody.querySelectorAll('tr'))
      .map(row => {
        const cells = row.cells;
        const getVal = (key) => {
          const idx = idxMap[key];
          if(idx === undefined) return '';
          const cell = cells[idx];
          if(!cell) return '';
          switch(key){
            case 'category':
            case 'channel':
              const span_cat = cell.querySelector('span');
              return span_cat ? span_cat.textContent.trim() : '';
            case 'date':
              // 查看模式下，span只显示格式化后的日期，需要从dataset.extra获取原始值
              const rowExtra = JSON.parse(row.dataset.extra || '{}');
              return rowExtra.purchaseDate || '';
            case 'image':
              const img = cell.querySelector('img');
              if(img){
                // 优先使用dataset.src（懒加载的URL），如果已加载则使用src
                return img.dataset.src || (img.style.display!=='none' ? img.src : '');
              }
              return '';
            case 'boolean':
              return cell.querySelector('input') ? cell.querySelector('input').checked : false;
            case 'subcategory':
              return cell.dataset.tags ? JSON.parse(cell.dataset.tags) : [];
            default: {
              const span_default = cell.querySelector('span');
              if(span_default) return span_default.textContent.trim();
              return cell.textContent.trim();
            }
          }
        };
        const rowObj = {};
        columnOrder.forEach(k=>{ rowObj[k]=getVal(k); });
        // 合并保存在行上的完整对象，确保额外字段不会丢失
        let extra = {};
        try{ extra = JSON.parse(row.dataset.extra||'{}'); }catch(e){}
        return { ...extra, ...rowObj };
      })
      .filter(item => item.name);
  }

  // ----------- 列排序（带持久化） -----------
  // 读取本地排序偏好 { key: 'columnKey', asc: true/false }
  sortStatus = (()=>{
    try{ return JSON.parse(localStorage.getItem('assetSort')||'{}'); }
    catch(e){ return {}; }
  })();

  // 根据列索引执行排序（置顶资产不参与排序，始终在最前面）
  function sortRowsByIdx(idx, asc=true){
    const rows = Array.from(tableBody.querySelectorAll('tr'));
    
    // 分离置顶和非置顶的行
    const pinnedRows = [];
    const unpinnedRows = [];
    
    rows.forEach(row => {
      try {
        const extra = JSON.parse(row.dataset.extra || '{}');
        if(extra.pinned === true){
          pinnedRows.push(row);
        } else {
          unpinnedRows.push(row);
        }
      } catch(e) {
        unpinnedRows.push(row);
      }
    });
    
    // 对置顶行按置顶时间倒序排序（最新置顶的在最前面）
    pinnedRows.sort((a, b) => {
      try {
        const aExtra = JSON.parse(a.dataset.extra || '{}');
        const bExtra = JSON.parse(b.dataset.extra || '{}');
        return (bExtra.pinnedTime || 0) - (aExtra.pinnedTime || 0);
      } catch(e) {
        return 0;
      }
    });
    
    // 对非置顶行按指定列排序
    unpinnedRows.sort((a,b)=>{
      const aVal = getCellValue(a, idx);
      const bVal = getCellValue(b, idx);
      const cmp = isNaN(aVal) || isNaN(bVal) ? aVal.localeCompare(bVal) : Number(aVal) - Number(bVal);
      return asc ? cmp : -cmp;
    });
    
    // 合并：置顶行在前，非置顶行在后
    const sortedRows = [...pinnedRows, ...unpinnedRows];
    
    tableBody.innerHTML = '';
    sortedRows.forEach(r=>tableBody.appendChild(r));
    // 排序可能改变首行内容影响列自动宽度，重新计算一次
    applyColumnWidths();
  }

  // 应用已保存的排序（在渲染完行后调用）
  function applyStoredSorting(){
    if(!sortStatus.key) return;
    const idx = idxMap[sortStatus.key];
    if(idx === undefined) return;
    sortRowsByIdx(idx, sortStatus.asc);
  }

  // 绑定表头点击事件，更新排序并写入 localStorage（忽略无效列如“操作”列）
  headerTr.querySelectorAll('th').forEach((th, index)=>{
    const colKey = columnOrder[index];
    if(!colKey) return; // 跳过非数据列
    th.addEventListener('click', ()=>{
      if(window.__colResizing) return;
      const newAsc = (sortStatus.key === colKey) ? !sortStatus.asc : true; // 同列则翻转，否则默认升序
      sortRowsByIdx(index, newAsc);
      sortStatus = { key: colKey, asc: newAsc };
      localStorage.setItem('assetSort', JSON.stringify(sortStatus));
    });
  });

  // 调用一次以应用初始排序
  applyStoredSorting();

  function getCellValue(row, idx) {
    const cell = row.cells[idx];
    if(!cell) return '';
    
    // 编辑模式：从input或select获取值
    if(editMode){
      const el = cell.querySelector('input, select');
      return el ? el.value : cell.textContent.trim();
    } else {
      // 查看模式：从span或直接textContent获取值
      const span = cell.querySelector('span');
      return span ? span.textContent.trim() : cell.textContent.trim();
    }
  }

  addRowBtn.addEventListener('click', () => {
    console.log('点击新增行');
    // 创建一个临时行用于编辑，但不立即显示在表格中
    const tempRow = document.createElement('tr');
    const newAsset = {
      originId: generateId(),
      isComposite: false,
      components: []
    };
    tempRow.dataset.extra = JSON.stringify(newAsset);
    tempRow.style.display = 'none'; // 临时隐藏，保存成功后再显示
    tableBody.appendChild(tempRow);
    // 直接打开编辑窗口
    openAssetModal(tempRow, false, true); // 第三个参数表示是新资产
  });

  function saveTableToServer(showAlert=true){
    const payload = {
      categories,
      channels,
      tags,
      assets: getTableData(),
      hiddenColumns: serverData.hiddenColumns || [],
      columnOrder,
      columns: columnsMeta
    };
    logInfo('保存资产，条目:', payload.assets.length, 'payload大小:', JSON.stringify(payload).length);
    fetch('/api/data', {
      method: 'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload)
    })
    .then(r=>r.json()).then(()=>{
       if(showAlert) window.showToast('数据已保存！');
       // 自动保存完成后，同步服务器数据，避免重复上传 base64 图片
       if(!showAlert){
         fetch('/api/data')
          .then(res=>res.json())
          .then(syncServerAssets)
          .catch(console.error);
       }
    })
    .catch(console.error);
  }

  function syncServerAssets(fresh){
     if(!Array.isArray(fresh.assets)) return;
     const map = new Map(fresh.assets.map(a=>[a.originId, a.image]));
     document.querySelectorAll('#assetsTable tbody tr').forEach(tr=>{
        try{
          const extra = JSON.parse(tr.dataset.extra||'{}');
          if(extra.originId && map.has(extra.originId)){
            const url = map.get(extra.originId);
            if(url && !url.startsWith('data:image')){
               extra.image = url;
               tr.dataset.extra = JSON.stringify(extra);
               // 更新单元格展示
               const imgEl = tr.querySelector('td img');
               if(imgEl){
                  // 只影响同一图片单元格内的占位符，避免误隐藏其他列的 span（如标签 chip）
                  imgEl.src = url;
                  imgEl.style.display='block';
                  const imgTd = imgEl.closest('td');
                  const ph = imgTd ? imgTd.querySelector('span') : null;
                  if(ph) ph.style.display='none';
               }
            }
          }
        }catch(e){}
     });
  }

  const saveBtn = document.getElementById('saveDataBtn');
  if(saveBtn){ saveBtn.remove(); }
  // 顶部图标栏已包含保存按钮

  // 应用隐藏列样式（函数已在前面定义）
  applyHiddenColumns();

  /* -------------------- 资产编辑模态框 -------------------- */
  function openAssetModal(row, readonly=false, isNew=false){
    let asset = {};
    try{ asset = JSON.parse(row.dataset.extra||'{}'); }catch(e){}

    const overlay=document.createElement('div'); overlay.className='overlay';
    const modal=document.createElement('div'); modal.className='modal'; modal.style.maxHeight='90vh'; modal.style.overflowY='auto';
    const title=document.createElement('h3'); title.textContent = readonly ? '查看资产' : (isNew ? '新增资产' : '编辑资产');

    // 内容滚动容器，保持 modal 圆角
    const bodyWrap=document.createElement('div'); bodyWrap.className='modal-body';
    modal.appendChild(title);

    const sections=[
      { title:'编辑详情', fields:[
        {label:'名称※', key:'name', required:true},
        {label:'分类', key:'category'},
        {label:'标签', key:'subcategory'},
        {label:'说明', key:'description'},
        {label:'序列号', key:'serialNumber'},
        {label:'型号', key:'model'},
        {label:'制造商', key:'manufacturer'},
        {label:'原始ID', key:'originId'}
      ]},
      { title:'组合资产', custom: buildCompositeAssetPart },
      { title:'附件', custom: buildAttachmentPart },
      { title:'购买详情', fields:[
        {label:'购买地址', key:'purchaseAddress'},
        {label:'购买价格', key:'purchasePrice', type:'number'},
        {label:'购买日期', key:'purchaseDate', type:'date'}
      ]},
      { title:'保修详情', fields:[
        {label:'保修时间', key:'warrantyPeriod', type:'date'},
        {label:'保修详情', key:'warrantyDetails'}
      ]},
      { title:'售出详情', fields:[
        {label:'售出对象', key:'saleTarget'},
        {label:'售出价格', key:'salePrice', type:'number'},
        {label:'售出日期', key:'saleDate', type:'date'}
      ]}
    ];

    const fieldRefs=[]; // {key,input}

    sections.forEach(sec=>{
      const secWrap=document.createElement('div');
      secWrap.className = 'modal-section';
      const h4=document.createElement('h4'); h4.textContent=sec.title; h4.style.margin='8px 0 4px';
      secWrap.appendChild(h4);
      if(sec.custom){ sec.custom(secWrap); }
      if(sec.fields){
        sec.fields.forEach(f=>{
          const wrap=document.createElement('div'); wrap.style.display='flex'; wrap.style.alignItems='center'; wrap.style.gap='8px'; wrap.style.margin='4px 0';
          const label=document.createElement('label'); 
          // 处理必填项标签，将※号显示为红色
          if(f.label.includes('※')){
            const labelText = f.label.replace('※', '');
            label.textContent = labelText;
            const asterisk = document.createElement('span');
            asterisk.textContent = '※';
            asterisk.style.color = '#d32f2f';
            asterisk.style.marginLeft = '2px';
            label.appendChild(asterisk);
          } else {
            label.textContent = f.label;
          }
          label.style.flex='0 0 100px';
          let input;
          if(f.key==='category'){
            input=document.createElement('select');
            categories.forEach(c=>{ const opt=document.createElement('option'); opt.value=c; opt.textContent=c; if(asset.category===c) opt.selected=true; input.appendChild(opt); });
          }else if(f.key==='subcategory'){
            // 创建自定义 chip UI 作为标签选择
            let tagArr = Array.isArray(asset.subcategory)? [...asset.subcategory]
              : (typeof asset.subcategory==='string' && asset.subcategory.trim()) ? asset.subcategory.split(',').map(s=>s.trim()).filter(Boolean) : [];
            const wrapChipContainer=()=>{
              tagSpanContainer.innerHTML='';
              tagArr.forEach(t=>{ const c=document.createElement('span'); c.className='chip'; c.textContent=t;
                let timer=null;
                c.addEventListener('mousedown',()=>{ timer=setTimeout(()=>{ removeTag(t); timer=null; },600);} );
                c.addEventListener('mouseup',()=>{ if(timer){ clearTimeout(timer); timer=null; openAdd(); } });
                c.addEventListener('mouseleave',()=>{ if(timer){ clearTimeout(timer); timer=null;} });
                tagSpanContainer.appendChild(c);
              });
              // 若无标签，显示"＋"
              if(tagArr.length===0){
                const plus=document.createElement('span'); plus.className='chip plus'; plus.textContent='＋'; plus.addEventListener('click',openAdd);
                tagSpanContainer.appendChild(plus);
              }

              function openAdd(){
                openTagPicker('', val=>{ if(!val|| tagArr.includes(val)) return; tagArr.push(val); wrapChipContainer(); logInfo('add tag (modal)', val);} );
              }
            };

            const tagSpanContainer=document.createElement('div'); tagSpanContainer.style.display='flex'; tagSpanContainer.style.gap='4px';
            // 初始化 dataset
            tagSpanContainer.dataset.tags = JSON.stringify(tagArr);
            const removeTag=(val)=>{ tagArr = tagArr.filter(x=>x!==val); wrapChipContainer(); logInfo('remove tag(modal)', val);} ;
            wrapChipContainer();
            input=tagSpanContainer;
          }else if(f.type==='date'){
            input=document.createElement('input'); input.type='date';
          }else if(f.type==='number'){
            input=document.createElement('input'); input.type='number'; input.step='0.01';
            // 数值初始化为两位小数
            if(asset[f.key]) asset[f.key] = formatTwoDecimal(asset[f.key]);
          }else{
            input=document.createElement('input'); input.type='text';
            if(f.key==='originId'){
              if(!asset.originId){ asset.originId = generateId(); }
              input.disabled=true;
            }
          }
          input.value = asset[f.key] || '';
          input.style.flex='1';
          if(readonly) input.disabled=true;
          // 失焦时统一格式化
          input.addEventListener('blur',()=>{ if(input.value!==undefined) input.value = formatTwoDecimal(input.value); });
          wrap.appendChild(label); wrap.appendChild(input);
          secWrap.appendChild(wrap);
          fieldRefs.push({key:f.key, input});
        });
      }
      bodyWrap.appendChild(secWrap);
    });

    function buildCompositeAssetPart(container){
      // 初始化组合资产字段
      if(!asset.isComposite) asset.isComposite = false;
      if(!asset.components) asset.components = [];
      
      const checkboxWrap = document.createElement('div');
      checkboxWrap.style.display = 'flex';
      checkboxWrap.style.alignItems = 'center';
      checkboxWrap.style.gap = '8px';
      checkboxWrap.style.marginBottom = '12px';
      
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.id = 'isCompositeCheck';
      checkbox.checked = asset.isComposite;
      if(readonly) checkbox.disabled = true;
      
      const checkboxLabel = document.createElement('label');
      checkboxLabel.htmlFor = 'isCompositeCheck';
      checkboxLabel.textContent = '这是一个组合资产（由其他资产组成）';
      checkboxLabel.style.cursor = readonly ? 'default' : 'pointer';
      
      checkboxWrap.appendChild(checkbox);
      checkboxWrap.appendChild(checkboxLabel);
      container.appendChild(checkboxWrap);
      
      const componentsContainer = document.createElement('div');
      componentsContainer.style.display = asset.isComposite ? 'block' : 'none';
      componentsContainer.style.marginTop = '12px';
      componentsContainer.style.padding = '12px';
      componentsContainer.style.border = '1px solid #ddd';
      componentsContainer.style.borderRadius = '4px';
      componentsContainer.style.backgroundColor = '#f9f9f9';
      
      const componentsTitle = document.createElement('h5');
      componentsTitle.textContent = '子资产列表';
      componentsTitle.style.margin = '0 0 8px 0';
      componentsTitle.style.fontSize = '14px';
      componentsContainer.appendChild(componentsTitle);
      
      const componentsList = document.createElement('div');
      componentsList.className = 'components-list';
      componentsList.style.display = 'flex';
      componentsList.style.flexDirection = 'column';
      componentsList.style.gap = '6px';
      
      function renderComponentsList(){
        componentsList.innerHTML = '';
        if(asset.components.length === 0){
          const emptyMsg = document.createElement('div');
          emptyMsg.textContent = '暂无子资产，点击下方按钮添加';
          emptyMsg.style.color = '#888';
          emptyMsg.style.fontSize = '12px';
          componentsList.appendChild(emptyMsg);
        } else {
          // 先同步表格数据，确保 allAssetsData 包含最新的数据
          // 注意：新的 syncTableData 会保留被过滤掉的资产（如子资产），所以不会丢失数据
          syncTableData();
          // 获取所有资产用于显示名称（使用完整的allAssetsData，而不是过滤后的表格数据）
          // 这样即使子资产在列表中隐藏，也能正确显示其名称
          const assetMap = new Map(allAssetsData.map(a => [a.originId, a]));
          
          asset.components.forEach((compId, index) => {
            const compAsset = assetMap.get(compId);
            const compName = compAsset ? compAsset.name : `未知资产 (${compId})`;
            
            const compItem = document.createElement('div');
            compItem.style.display = 'flex';
            compItem.style.alignItems = 'center';
            compItem.style.justifyContent = 'space-between';
            compItem.style.padding = '6px 8px';
            compItem.style.backgroundColor = '#fff';
            compItem.style.borderRadius = '4px';
            compItem.style.border = '1px solid #e0e0e0';
            
            const compNameSpan = document.createElement('span');
            compNameSpan.textContent = `${index + 1}. ${compName}`;
            compNameSpan.style.flex = '1';
            
            if(!readonly){
              const removeBtn = document.createElement('button');
              removeBtn.textContent = '移除';
              removeBtn.className = 'btn-like btn-danger btn-small';
              removeBtn.style.fontSize = '12px';
              removeBtn.style.padding = '2px 8px';
              removeBtn.onclick = () => {
                asset.components.splice(index, 1);
                renderComponentsList();
              };
              compItem.appendChild(compNameSpan);
              compItem.appendChild(removeBtn);
            } else {
              compItem.appendChild(compNameSpan);
            }
            
            componentsList.appendChild(compItem);
          });
        }
      }
      
      renderComponentsList();
      componentsContainer.appendChild(componentsList);
      
      if(!readonly){
        const addBtnWrap = document.createElement('div');
        addBtnWrap.style.marginTop = '8px';
        addBtnWrap.style.display = 'flex';
        addBtnWrap.style.gap = '8px';
        
        const addBtn = document.createElement('button');
        addBtn.textContent = '添加子资产';
        addBtn.className = 'btn-like btn-small';
        
        const viewDetailsBtn = document.createElement('button');
        viewDetailsBtn.textContent = '查看详细配置';
        viewDetailsBtn.className = 'btn-like btn-small';
        viewDetailsBtn.style.display = asset.components.length > 0 ? 'block' : 'none';
        viewDetailsBtn.onclick = () => {
          openCompositeDetailsModal(asset, row);
        };
        
        addBtn.onclick = () => {
          openComponentPicker((selectedId) => {
            if(asset.components.includes(selectedId)){
              window.showToast('该资产已在子资产列表中', 2000);
              return;
            }
            asset.components.push(selectedId);
            renderComponentsList();
            // 更新后显示查看详细配置按钮
            viewDetailsBtn.style.display = asset.components.length > 0 ? 'block' : 'none';
          });
        };
        
        addBtnWrap.appendChild(addBtn);
        addBtnWrap.appendChild(viewDetailsBtn);
        componentsContainer.appendChild(addBtnWrap);
        
        // 更新 renderComponentsList 函数以在移除时更新按钮显示
        const originalRender = renderComponentsList;
        renderComponentsList = function(){
          originalRender();
          if(viewDetailsBtn){
            viewDetailsBtn.style.display = asset.components.length > 0 ? 'block' : 'none';
          }
        };
        renderComponentsList();
      }
      
      container.appendChild(componentsContainer);
      
      checkbox.addEventListener('change', () => {
        asset.isComposite = checkbox.checked;
        componentsContainer.style.display = asset.isComposite ? 'block' : 'none';
        if(!asset.isComposite){
          asset.components = [];
          renderComponentsList();
        }
      });
    }
    
    function openComponentPicker(onSelect){
      const overlay = document.createElement('div');
      overlay.className = 'overlay';
      
      const modal = document.createElement('div');
      modal.className = 'modal';
      modal.style.width = '500px';
      modal.style.maxHeight = '80vh';
      
      const title = document.createElement('h3');
      title.textContent = '选择子资产';
      modal.appendChild(title);
      
      const body = document.createElement('div');
      body.className = 'modal-body';
      body.style.maxHeight = '60vh';
      body.style.overflowY = 'auto';
      
      // 先同步表格数据到allAssetsData，确保数据是最新的
      syncTableData();
      const currentAssetId = asset.originId;
      
      // 过滤掉当前资产本身，使用完整的allAssetsData以便可以选择所有资产（包括被隐藏的子资产）
      const availableAssets = allAssetsData.filter(a => a.originId !== currentAssetId);
      
      if(availableAssets.length === 0){
        const emptyMsg = document.createElement('div');
        emptyMsg.textContent = '没有可用的资产';
        emptyMsg.style.padding = '20px';
        emptyMsg.style.textAlign = 'center';
        emptyMsg.style.color = '#888';
        body.appendChild(emptyMsg);
      } else {
        availableAssets.forEach(a => {
          const item = document.createElement('div');
          item.style.display = 'flex';
          item.style.justifyContent = 'space-between';
          item.style.alignItems = 'center';
          item.style.padding = '8px 12px';
          item.style.borderBottom = '1px solid #eee';
          item.style.cursor = 'pointer';
          
          item.addEventListener('mouseenter', () => {
            item.style.backgroundColor = '#f5f5f5';
          });
          item.addEventListener('mouseleave', () => {
            item.style.backgroundColor = '';
          });
          
          const nameSpan = document.createElement('span');
          nameSpan.textContent = `${a.name || '未命名'} (${a.category || '未分类'})`;
          
          const idSpan = document.createElement('span');
          idSpan.textContent = a.originId;
          idSpan.style.fontSize = '11px';
          idSpan.style.color = '#888';
          idSpan.style.fontFamily = 'monospace';
          
          item.appendChild(nameSpan);
          item.appendChild(idSpan);
          
          item.addEventListener('click', () => {
            onSelect(a.originId);
            document.body.removeChild(overlay);
          });
          
          body.appendChild(item);
        });
      }
      
      modal.appendChild(body);
      
      const actions = document.createElement('div');
      actions.className = 'actions';
      const cancelBtn = document.createElement('button');
      cancelBtn.textContent = '取消';
      cancelBtn.className = 'btn-like btn-small btn-danger';
      cancelBtn.onclick = () => document.body.removeChild(overlay);
      actions.appendChild(cancelBtn);
      modal.appendChild(actions);
      
      overlay.appendChild(modal);
      document.body.appendChild(overlay);
    }
    
    function buildAttachmentPart(container){
      const img=document.createElement('img'); 
      img.style.cssText = 'max-width: 100%; max-height: 400px; object-fit: contain; border-radius: 8px; display: none; cursor: pointer;';
      img.loading = 'lazy';
      
      // 占位符容器
      const placeholder=document.createElement('div'); 
      placeholder.style.cssText = 'padding: 40px; text-align: center; border: 2px dashed #ddd; border-radius: 8px; background: #f9f9f9;';
      
      if(asset.image){
        // 有附件：显示预览按钮，点击时加载
        placeholder.innerHTML = '<div style="color: #666; margin-bottom: 10px;">📎 已上传附件</div><button type="button" style="padding: 8px 16px; background: #1976d2; color: white; border: none; border-radius: 4px; cursor: pointer;">点击预览</button>';
        img.dataset.src = asset.image;
        img.dataset.loaded = 'false';
        
        // 点击预览按钮加载图片
        const previewBtn = placeholder.querySelector('button');
        previewBtn.addEventListener('click', () => {
          if(img.dataset.loaded === 'false'){
            img.src = img.dataset.src;
            img.dataset.loaded = 'true';
          }
          img.style.display = 'block';
          placeholder.style.display = 'none';
        });
        
        // 图片点击查看大图
        img.addEventListener('click', () => {
          const win = window.open('about:blank');
          if(win){
            win.document.write('<title>附件预览</title>');
            win.document.write('<style>body{margin:0;padding:20px;background:#f5f5f5;display:flex;justify-content:center;align-items:center;min-height:100vh;}</style>');
            win.document.write('<img src="'+img.src+'" style="max-width:90vw;max-height:90vh;object-fit:contain;border-radius:8px;box-shadow:0 4px 12px rgba(0,0,0,0.15);">');
          }
        });
      } else {
        placeholder.innerHTML = '<div style="color: #888;">无附件</div>';
      }
      
      const fileInput=document.createElement('input'); 
      fileInput.type='file'; 
      fileInput.accept='image/*'; 
      fileInput.style.display='none'; 
      if(readonly) fileInput.disabled=true;
      
      // 点击占位符区域选择文件（仅当无附件时）
      if(!asset.image){
        placeholder.style.cursor = 'pointer';
        placeholder.addEventListener('click', () => fileInput.click());
      }
      
      fileInput.addEventListener('change',()=>{
        if(fileInput.files[0]){
          const reader=new FileReader();
          reader.onload=e=>{ 
            asset.image=e.target.result; 
            img.src=asset.image; 
            img.dataset.src = e.target.result;
            img.dataset.loaded = 'true';
            img.style.display='block'; 
            placeholder.style.display='none';
          };
          reader.readAsDataURL(fileInput.files[0]);
        }
      });
      container.appendChild(img); container.appendChild(placeholder);
      if(!readonly){
        const btnWrap=document.createElement('div'); btnWrap.style.marginTop='8px';
        btnWrap.style.display='flex'; btnWrap.style.gap='8px';
        btnWrap.style.alignItems='center';

        const uploadBtn=document.createElement('button'); uploadBtn.textContent='上传附件'; uploadBtn.className='btn-like btn-small';
        uploadBtn.onclick=()=> fileInput.click();

        const delBtn=document.createElement('button'); delBtn.textContent='删除附件'; delBtn.className='btn-like btn-danger btn-small';
        delBtn.onclick=()=>{
          asset.image='';
          img.src='';
          img.dataset.src='';
          img.dataset.loaded='false';
          img.style.display='none';
          placeholder.innerHTML = '<div style="color: #888;">无附件</div>';
          placeholder.style.cursor = 'pointer';
          placeholder.onclick = () => fileInput.click();
          // 清空文件输入的值，避免意外提交
          fileInput.value='';
          // 立即同步到表格行并自动保存
          if(row){
            updateRowFromAsset(row, asset);
            row.dataset.extra = JSON.stringify(asset);
            triggerAutoSave();
          }
        };

        btnWrap.appendChild(uploadBtn);
        btnWrap.appendChild(delBtn);
        container.appendChild(btnWrap);
        container.appendChild(fileInput);
      }
    }

    const actions=document.createElement('div'); actions.className='actions';
    const closeBtn=document.createElement('button'); closeBtn.textContent='关闭'; closeBtn.className='btn-like btn-small';
    closeBtn.onclick=()=> document.body.removeChild(overlay);
    actions.appendChild(closeBtn);
    if(!readonly){
      const saveBtn=document.createElement('button'); saveBtn.textContent='保存'; saveBtn.className='btn-like';
      saveBtn.onclick=()=>{
        // 更新 asset 对象
        fieldRefs.forEach(r=>{
          let val;
          if(r.key==='subcategory'){
            // 对应标签容器
            val = r.input.dataset.tags ? JSON.parse(r.input.dataset.tags) : [];
          }else{
            val = (typeof r.input.value === 'string') ? r.input.value.trim() : r.input.value;
          }
          // 数值字段保存时统一两位小数
          if(r.input.type === 'number'){
            val = formatTwoDecimal(val);
          }
          asset[r.key] = val;
        });
        
        // 校验必填项
        const requiredFields = sections
          .flatMap(sec => sec.fields || [])
          .filter(f => f.required);
        
        const missingFields = [];
        requiredFields.forEach(f => {
          const value = asset[f.key];
          if(!value || (typeof value === 'string' && value.trim() === '')){
            missingFields.push(f.label.replace('※', '').trim());
          }
        });
        
        if(missingFields.length > 0){
          window.showToast(`请填写必填项：${missingFields.join('、')}`, 3000);
          return; // 阻止保存
        }
        
        // 确保组合资产字段被保存
        if(!asset.isComposite) asset.isComposite = false;
        if(!asset.components) asset.components = [];
        
        // 如果是新资产，需要创建真正的行
        if(isNew){
          // 先移除临时行
          if(row.parentNode) row.parentNode.removeChild(row);
          // 创建新行
          createRow(asset);
          applyHiddenColumns();
          // 更新allAssetsData
          allAssetsData.push(asset);
        } else {
          // 同步到行
          updateRowFromAsset(row, asset);
          row.dataset.extra = JSON.stringify(asset);
          // 更新allAssetsData中对应的资产
          const index = allAssetsData.findIndex(a => a.originId === asset.originId);
          if (index >= 0) {
            allAssetsData[index] = asset;
          }
        }
        
        document.body.removeChild(overlay);
        saveTableToServer(false);
        // 重新应用过滤
        applyFiltersAndRender();
      };
      actions.appendChild(saveBtn);
    }
    
    // 如果是新资产，关闭时删除临时行
    if(isNew && !readonly){
      const originalClose = closeBtn.onclick;
      closeBtn.onclick = () => {
        if(row.parentNode) row.parentNode.removeChild(row);
        document.body.removeChild(overlay);
      };
    }
    modal.appendChild(bodyWrap);
    modal.appendChild(actions);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
  }

  /* -------------------- 组合资产详细配置模态框 -------------------- */
  function openCompositeDetailsModal(compositeAsset, row){
    const overlay = document.createElement('div');
    overlay.className = 'overlay';
    
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.width = '800px';
    modal.style.maxHeight = '90vh';
    modal.style.overflowY = 'auto';
    
    const title = document.createElement('h3');
    title.textContent = `组合资产详细配置: ${compositeAsset.name || '未命名'}`;
    modal.appendChild(title);
    
    const body = document.createElement('div');
    body.className = 'modal-body';
    
    // 显示主资产信息
    const mainInfoSection = document.createElement('div');
    mainInfoSection.className = 'modal-section';
    mainInfoSection.style.marginBottom = '20px';
    mainInfoSection.style.padding = '12px';
    mainInfoSection.style.backgroundColor = '#f9f9f9';
    mainInfoSection.style.borderRadius = '4px';
    
    const mainInfoTitle = document.createElement('h4');
    mainInfoTitle.textContent = '主资产信息';
    mainInfoTitle.style.margin = '0 0 8px 0';
    mainInfoSection.appendChild(mainInfoTitle);
    
    const mainInfoGrid = document.createElement('div');
    mainInfoGrid.style.display = 'grid';
    mainInfoGrid.style.gridTemplateColumns = 'repeat(2, 1fr)';
    mainInfoGrid.style.gap = '8px';
    mainInfoGrid.style.fontSize = '14px';
    
    const infoFields = [
      { label: '名称', key: 'name' },
      { label: '分类', key: 'category' },
      { label: '型号', key: 'model' },
      { label: '制造商', key: 'manufacturer' },
      { label: '序列号', key: 'serialNumber' },
      { label: '购买价格', key: 'purchasePrice' }
    ];
    
    infoFields.forEach(field => {
      const infoItem = document.createElement('div');
      infoItem.style.display = 'flex';
      infoItem.style.gap = '8px';
      
      const label = document.createElement('span');
      label.textContent = `${field.label}:`;
      label.style.fontWeight = '500';
      label.style.color = '#666';
      
      const value = document.createElement('span');
      const val = compositeAsset[field.key];
      value.textContent = val || '未设置';
      value.style.color = val ? '#000' : '#999';
      
      infoItem.appendChild(label);
      infoItem.appendChild(value);
      mainInfoGrid.appendChild(infoItem);
    });
    
    mainInfoSection.appendChild(mainInfoGrid);
    body.appendChild(mainInfoSection);
    
    // 显示子资产列表
    const componentsSection = document.createElement('div');
    componentsSection.className = 'modal-section';
    
    const componentsTitle = document.createElement('h4');
    componentsTitle.textContent = '子资产列表';
    componentsTitle.style.margin = '0 0 12px 0';
    componentsSection.appendChild(componentsTitle);
    
    const componentsList = document.createElement('div');
    componentsList.style.display = 'flex';
    componentsList.style.flexDirection = 'column';
    componentsList.style.gap = '12px';
    
    // 先同步表格数据，确保 allAssetsData 包含最新的数据
    // 注意：新的 syncTableData 会保留被过滤掉的资产（如子资产），所以不会丢失数据
    syncTableData();
    // 使用完整的allAssetsData，而不是过滤后的表格数据
    // 这样即使子资产在列表中隐藏，也能正确显示其信息
    const assetMap = new Map(allAssetsData.map(a => [a.originId, a]));
    const components = compositeAsset.components || [];
    
    if(components.length === 0){
      const emptyMsg = document.createElement('div');
      emptyMsg.textContent = '暂无子资产';
      emptyMsg.style.padding = '20px';
      emptyMsg.style.textAlign = 'center';
      emptyMsg.style.color = '#888';
      componentsList.appendChild(emptyMsg);
    } else {
      components.forEach((compId, index) => {
        const compAsset = assetMap.get(compId);
        if(!compAsset){
          const notFoundItem = document.createElement('div');
          notFoundItem.style.padding = '12px';
          notFoundItem.style.border = '1px solid #ffcccc';
          notFoundItem.style.borderRadius = '4px';
          notFoundItem.style.backgroundColor = '#fff5f5';
          notFoundItem.textContent = `⚠️ 子资产 ${index + 1}: 未找到资产 (ID: ${compId})`;
          notFoundItem.style.color = '#d32f2f';
          componentsList.appendChild(notFoundItem);
          return;
        }
        
        const compCard = document.createElement('div');
        compCard.style.padding = '12px';
        compCard.style.border = '1px solid #e0e0e0';
        compCard.style.borderRadius = '4px';
        compCard.style.backgroundColor = '#fff';
        
        const compHeader = document.createElement('div');
        compHeader.style.display = 'flex';
        compHeader.style.justifyContent = 'space-between';
        compHeader.style.alignItems = 'center';
        compHeader.style.marginBottom = '8px';
        
        const compName = document.createElement('h5');
        compName.textContent = `${index + 1}. ${compAsset.name || '未命名'}`;
        compName.style.margin = '0';
        compName.style.fontSize = '16px';
        
        const compActions = document.createElement('div');
        compActions.style.display = 'flex';
        compActions.style.gap = '6px';
        
        const viewCompBtn = document.createElement('button');
        viewCompBtn.textContent = '查看';
        viewCompBtn.className = 'btn-like btn-small';
        viewCompBtn.style.fontSize = '12px';
        viewCompBtn.onclick = () => {
          // 找到对应的行并打开查看模态框
          const compRow = Array.from(tableBody.querySelectorAll('tr')).find(r => {
            try {
              const data = JSON.parse(r.dataset.extra || '{}');
              return data.originId === compId;
            } catch(e) {
              return false;
            }
          });
          if(compRow){
            document.body.removeChild(overlay);
            openAssetModal(compRow, true);
          } else {
            window.showToast('未找到对应的资产行', 2000);
          }
        };
        
        const editCompBtn = document.createElement('button');
        editCompBtn.textContent = '编辑';
        editCompBtn.className = 'btn-like btn-small';
        editCompBtn.style.fontSize = '12px';
        editCompBtn.onclick = () => {
          // 找到对应的行并打开编辑模态框
          const compRow = Array.from(tableBody.querySelectorAll('tr')).find(r => {
            try {
              const data = JSON.parse(r.dataset.extra || '{}');
              return data.originId === compId;
            } catch(e) {
              return false;
            }
          });
          if(compRow){
            document.body.removeChild(overlay);
            openAssetModal(compRow, false);
          } else {
            window.showToast('未找到对应的资产行', 2000);
          }
        };
        
        compActions.appendChild(viewCompBtn);
        compActions.appendChild(editCompBtn);
        compHeader.appendChild(compName);
        compHeader.appendChild(compActions);
        
        const compDetails = document.createElement('div');
        compDetails.style.display = 'grid';
        compDetails.style.gridTemplateColumns = 'repeat(2, 1fr)';
        compDetails.style.gap = '8px';
        compDetails.style.fontSize = '13px';
        compDetails.style.color = '#666';
        
        const compInfoFields = [
          { label: '分类', key: 'category' },
          { label: '型号', key: 'model' },
          { label: '制造商', key: 'manufacturer' },
          { label: '购买价格', key: 'purchasePrice' }
        ];
        
        compInfoFields.forEach(field => {
          const infoItem = document.createElement('div');
          const val = compAsset[field.key];
          infoItem.textContent = `${field.label}: ${val || '未设置'}`;
          compDetails.appendChild(infoItem);
        });
        
        compCard.appendChild(compHeader);
        compCard.appendChild(compDetails);
        componentsList.appendChild(compCard);
      });
    }
    
    componentsSection.appendChild(componentsList);
    body.appendChild(componentsSection);
    
    modal.appendChild(body);
    
    const actions = document.createElement('div');
    actions.className = 'actions';
    const closeBtn = document.createElement('button');
    closeBtn.textContent = '关闭';
    closeBtn.className = 'btn-like btn-small';
    closeBtn.onclick = () => document.body.removeChild(overlay);
    actions.appendChild(closeBtn);
    
    const editMainBtn = document.createElement('button');
    editMainBtn.textContent = '编辑主资产';
    editMainBtn.className = 'btn-like';
    editMainBtn.onclick = () => {
      document.body.removeChild(overlay);
      openAssetModal(row, false);
    };
    actions.appendChild(editMainBtn);
    
    modal.appendChild(actions);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
  }

  // 根据 asset 内容同步更新表格行
  function updateRowFromAsset(row, asset){
    const map={
      name:'name',
      category:'category',
      purchasePrice:'amount',
      purchaseDate:'date',
      purchaseAddress:'channel',
      description:'note',
      image:'image'
    };
    Object.entries(map).forEach(([assetKey,colKey])=>{
      const colIdx = idxMap[colKey];
      if(colIdx===undefined) return;
      const cell = row.cells[colIdx];
      if(!cell) return;
      switch(colKey){
        case 'category':
        case 'channel':
          const sel=cell.querySelector('select'); if(sel) sel.value = asset[assetKey] || '';
          break;
        case 'image':{
          const img=cell.querySelector('img');
          const placeholder=cell.querySelector('div');
          if(asset.image){
            // 更新图片URL（懒加载，不立即加载）
            if(img){ 
              img.dataset.src = asset.image;
              img.dataset.loaded = 'false';
              // 如果图片已经加载过，则更新src并显示
              if(img.dataset.loaded === 'true' || img.src){
                img.src = asset.image;
                img.style.display = 'block';
                if(placeholder) placeholder.style.display = 'none';
              } else {
                img.style.display = 'none';
                if(placeholder){
                  placeholder.innerHTML = '';
                  const icon = document.createElement('span');
                  icon.textContent = '🖼️';
                  icon.style.cssText = 'font-size: 20px; opacity: 0.6;';
                  icon.title = '点击查看附件';
                  placeholder.appendChild(icon);
                  placeholder.style.display = 'flex';
                }
              }
            }
          }else{
            // 清空附件
            if(img){ 
              img.src = ''; 
              img.dataset.src = '';
              img.dataset.loaded = 'false';
              img.style.display = 'none'; 
            }
            if(placeholder){
              placeholder.innerHTML = '';
              const noImageText = document.createElement('span');
              noImageText.textContent = '无';
              noImageText.style.cssText = 'color: #999; font-size: 12px;';
              placeholder.appendChild(noImageText);
              placeholder.style.display = 'flex';
            }
          }
          break; }
        case 'date':{
          const dateInput=cell.querySelector('input[type="date"]'); const span=cell.querySelector('span');
          if(dateInput){ dateInput.value = asset[assetKey] || ''; if(span){ const v=dateInput.value; const fmt=v? v.slice(2,4)+v.slice(5,7)+v.slice(8,10):''; span.textContent=fmt; } }
          break; }
        case 'subcategory':{
          const newTags = Array.isArray(asset[assetKey])? asset[assetKey] : (asset[assetKey]? [asset[assetKey]]:[]);
          cell.dataset.tags = JSON.stringify(newTags);
          // 重新渲染 cell
          cell.innerHTML='';
          newTags.forEach(t=>{
            const chip=document.createElement('span'); chip.className='chip'; chip.textContent=t;
            cell.appendChild(chip);
          });
          if(newTags.length===0){
            const plus=document.createElement('span'); plus.className='chip plus'; plus.textContent='＋';
            cell.appendChild(plus);
          }
          break;}
        default:{
          const inp=cell.querySelector('input');
          if(inp){
            // 若为数字输入，自动补足两位小数
            if(inp.type==='number') inp.value = formatTwoDecimal(asset[assetKey] || '');
            else inp.value = asset[assetKey] || '';
          }
        }
      }
    });
  }

  // 从表格单元反推 asset 并写入 row.dataset.extra
  function updateAssetFromRow(row){
    const tableToAsset={
      name:'name',
      category:'category',
      subcategory:'subcategory',
      amount:'purchasePrice',
      date:'purchaseDate',
      channel:'purchaseAddress',
      note:'description',
      image:'image'
    };
    const asset={};
    Object.entries(tableToAsset).forEach(([tableKey,assetKey])=>{
      const idx=idxMap[tableKey]; if(idx===undefined) return;
      const cell=row.cells[idx]; if(!cell) return;
      let val='';
      switch(tableKey){
        case 'category':
        case 'channel': 
          if(editMode){
            val=cell.querySelector('select').value; 
          } else {
            const span = cell.querySelector('span');
            val = span ? span.textContent.trim() : '';
          }
          break;
        case 'date':
          // 日期字段特殊处理：编辑模式从input[type="date"]获取，查看模式从dataset.extra获取
          if(editMode){
            const dateInput = cell.querySelector('input[type="date"]');
            val = dateInput ? dateInput.value : '';
          } else {
            // 查看模式下，从dataset.extra获取原始值（因为span只显示格式化后的日期）
            const rowExtra = JSON.parse(row.dataset.extra || '{}');
            val = rowExtra.purchaseDate || '';
          }
          break;
        case 'image':{
          const img=cell.querySelector('img'); 
          if(img){
            // 优先使用dataset.src（懒加载的URL），如果已加载则使用src
            val = img.dataset.src || (img.style.display!=='none' ? img.src : '');
          } else {
            val = '';
          }
          break;}
        case 'subcategory': {
          val = cell.dataset.tags ? JSON.parse(cell.dataset.tags) : [];
          break;
        }
        default: {
          if(editMode){
            const inp = cell.querySelector('input');
            val = inp ? inp.value.trim() : '';
          } else {
            const span = cell.querySelector('span');
            val = span ? span.textContent.trim() : '';
          }
        }
      }
      asset[assetKey]=val;
    });
    row.dataset.extra=JSON.stringify({...JSON.parse(row.dataset.extra||'{}'), ...asset});
  }

  function applyColumnWidths(){
    let hasCustom=false;
    const total = columnOrder.reduce((acc,key)=>{
      const def=columnsMeta.find(c=>c.key===key)||{};
      if(def.width){ hasCustom=true; acc += def.width; }
      else{ acc += 0; }
      return acc;
    },0); // 移除操作列宽度

    const wrapper = assetsTable.closest('.table-wrapper');
    if(wrapper){
      const wrapW = wrapper.clientWidth;
      if(hasCustom && total > wrapW){ assetsTable.style.minWidth = total + 'px'; }
      else{ assetsTable.style.minWidth = ''; }
    }
  }

  /* ---------- 右键菜单功能 ---------- */
  let contextMenu = null;
  
  function showContextMenu(e, row){
    // 移除已存在的菜单
    closeContextMenu();
    
    // 创建右键菜单
    contextMenu = document.createElement('div');
    contextMenu.className = 'context-menu';
    
    // 计算菜单位置，确保不超出屏幕
    const menuWidth = 140;
    const menuHeight = 120;
    let left = e.clientX || 0;
    let top = e.clientY || 0;
    
    // 如果是触摸事件，使用触摸坐标
    if(e.touches && e.touches.length > 0){
      left = e.touches[0].clientX;
      top = e.touches[0].clientY;
    } else if(e.changedTouches && e.changedTouches.length > 0){
      left = e.changedTouches[0].clientX;
      top = e.changedTouches[0].clientY;
    }
    
    // 如果超出右边界，向左调整
    if(left + menuWidth > window.innerWidth){
      left = window.innerWidth - menuWidth - 10;
    }
    // 如果超出下边界，向上调整
    if(top + menuHeight > window.innerHeight){
      top = window.innerHeight - menuHeight - 10;
    }
    
    contextMenu.style.cssText = `
      position: fixed;
      left: ${left}px;
      top: ${top}px;
      z-index: 2000;
    `;
    
    // 编辑选项
    const editItem = document.createElement('div');
    editItem.className = 'context-menu-item';
    editItem.textContent = '✏️ 编辑';
    editItem.style.cssText = 'padding: 8px 16px; cursor: pointer; user-select: none; touch-action: manipulation;';
    editItem.addEventListener('mouseenter', () => editItem.style.backgroundColor = '#f5f5f5');
    editItem.addEventListener('mouseleave', () => editItem.style.backgroundColor = '');
    editItem.addEventListener('click', (ev) => {
      ev.stopPropagation();
      closeContextMenu();
      // 延迟打开模态框，确保菜单已关闭
      setTimeout(() => {
        openAssetModal(row, false);
      }, 50);
    });
    editItem.addEventListener('touchend', (ev) => {
      ev.stopPropagation();
      ev.preventDefault();
      closeContextMenu();
      setTimeout(() => {
        openAssetModal(row, false);
      }, 50);
    });
    contextMenu.appendChild(editItem);
    
    // 查看选项
    const viewItem = document.createElement('div');
    viewItem.className = 'context-menu-item';
    viewItem.textContent = '👁️ 查看';
    viewItem.style.cssText = 'padding: 8px 16px; cursor: pointer; user-select: none; touch-action: manipulation;';
    viewItem.addEventListener('mouseenter', () => viewItem.style.backgroundColor = '#f5f5f5');
    viewItem.addEventListener('mouseleave', () => viewItem.style.backgroundColor = '');
    viewItem.addEventListener('click', (ev) => {
      ev.stopPropagation();
      closeContextMenu();
      setTimeout(() => {
        openAssetModal(row, true);
      }, 50);
    });
    viewItem.addEventListener('touchend', (ev) => {
      ev.stopPropagation();
      ev.preventDefault();
      closeContextMenu();
      setTimeout(() => {
        openAssetModal(row, true);
      }, 50);
    });
    contextMenu.appendChild(viewItem);
    
    // 分隔线
    const divider = document.createElement('div');
    divider.style.cssText = 'height: 1px; background: #e0e0e0; margin: 4px 0;';
    contextMenu.appendChild(divider);
    
    // 置顶/取消置顶选项
    try {
      const rowExtra = JSON.parse(row.dataset.extra || '{}');
      const isPinned = rowExtra.pinned === true;
      
      const pinItem = document.createElement('div');
      pinItem.className = 'context-menu-item';
      pinItem.textContent = isPinned ? '📌 取消置顶' : '📌 置顶';
      pinItem.style.cssText = 'padding: 8px 16px; cursor: pointer; user-select: none; touch-action: manipulation;';
      pinItem.addEventListener('mouseenter', () => pinItem.style.backgroundColor = '#f5f5f5');
      pinItem.addEventListener('mouseleave', () => pinItem.style.backgroundColor = '');
      pinItem.addEventListener('click', (ev) => {
        ev.stopPropagation();
        closeContextMenu();
        setTimeout(() => {
          if(isPinned){
            unpinRow(row);
          } else {
            pinRowToTop(row);
          }
        }, 50);
      });
      pinItem.addEventListener('touchend', (ev) => {
        ev.stopPropagation();
        ev.preventDefault();
        closeContextMenu();
        setTimeout(() => {
          if(isPinned){
            unpinRow(row);
          } else {
            pinRowToTop(row);
          }
        }, 50);
      });
      contextMenu.appendChild(pinItem);
    } catch(e) {
      console.warn('获取置顶状态失败', e);
    }
    
    // 添加到页面
    document.body.appendChild(contextMenu);
    
    // 点击其他地方关闭菜单
    setupMenuCloseHandlers();
  }
  
  // 关闭右键菜单的统一函数
  function closeContextMenu(){
    if(contextMenu){
      try {
        document.body.removeChild(contextMenu);
      } catch(e) {
        // 菜单可能已经被移除
      }
      contextMenu = null;
    }
  }
  
  // 设置菜单关闭处理器
  let menuCloseHandlers = [];
  function setupMenuCloseHandlers(){
    // 清除之前的处理器
    menuCloseHandlers.forEach(handler => {
      document.removeEventListener('click', handler);
      document.removeEventListener('contextmenu', handler);
      document.removeEventListener('touchstart', handler);
    });
    menuCloseHandlers = [];
    
    const closeMenu = (event) => {
      if(contextMenu && !contextMenu.contains(event.target)){
        closeContextMenu();
        // 移除所有事件监听器
        menuCloseHandlers.forEach(handler => {
          document.removeEventListener('click', handler);
          document.removeEventListener('contextmenu', handler);
          document.removeEventListener('touchstart', handler);
        });
        menuCloseHandlers = [];
      }
    };
    
    menuCloseHandlers.push(closeMenu);
    
    // 延迟添加事件监听，避免立即触发
    setTimeout(() => {
      document.addEventListener('click', closeMenu, { once: true });
      document.addEventListener('contextmenu', closeMenu, { once: true });
      document.addEventListener('touchstart', closeMenu, { once: true });
    }, 100);
  }
  
  // 置顶功能：将行置顶
  function pinRowToTop(row){
    if(!row || !row.parentNode) return;
    
    try {
      const extra = JSON.parse(row.dataset.extra || '{}');
      // 设置置顶标志和置顶时间
      extra.pinned = true;
      extra.pinnedTime = Date.now();
      row.dataset.extra = JSON.stringify(extra);
      
      // 更新行显示（添加置顶标识）
      updatePinBadge(row, true);
      
      // 重新排序：置顶的在前，按置顶时间倒序；非置顶的在后
      const rows = Array.from(tableBody.querySelectorAll('tr'));
      rows.sort((a, b) => {
        try {
          const aExtra = JSON.parse(a.dataset.extra || '{}');
          const bExtra = JSON.parse(b.dataset.extra || '{}');
          const aPinned = aExtra.pinned === true;
          const bPinned = bExtra.pinned === true;
          
          if(aPinned && !bPinned) return -1;
          if(!aPinned && bPinned) return 1;
          if(aPinned && bPinned) {
            // 都置顶，按置顶时间倒序
            return (bExtra.pinnedTime || 0) - (aExtra.pinnedTime || 0);
          }
          return 0; // 都不置顶，保持原顺序
        } catch(e) {
          return 0;
        }
      });
      
      // 在重新排序前，先同步所有行的数据到dataset.extra
      rows.forEach(r => {
        updateAssetFromRow(r);
      });
      
      tableBody.innerHTML = '';
      rows.forEach(r => tableBody.appendChild(r));
      
      // 保存数据
      saveTableToServer(false);
      window.showToast('已置顶', 1500);
    } catch(e) {
      console.warn('置顶失败', e);
    }
  }
  
  // 取消置顶功能
  function unpinRow(row){
    if(!row || !row.parentNode) return;
    
    try {
      const extra = JSON.parse(row.dataset.extra || '{}');
      // 移除置顶标志
      extra.pinned = false;
      delete extra.pinnedTime;
      row.dataset.extra = JSON.stringify(extra);
      
      // 更新行显示（移除置顶标识）
      updatePinBadge(row, false);
      
      // 重新排序：置顶的在前，非置顶的在后
      const rows = Array.from(tableBody.querySelectorAll('tr'));
      rows.sort((a, b) => {
        try {
          const aExtra = JSON.parse(a.dataset.extra || '{}');
          const bExtra = JSON.parse(b.dataset.extra || '{}');
          const aPinned = aExtra.pinned === true;
          const bPinned = bExtra.pinned === true;
          
          if(aPinned && !bPinned) return -1;
          if(!aPinned && bPinned) return 1;
          if(aPinned && bPinned) {
            return (bExtra.pinnedTime || 0) - (aExtra.pinnedTime || 0);
          }
          return 0;
        } catch(e) {
          return 0;
        }
      });
      
      // 在重新排序前，先同步所有行的数据到dataset.extra
      rows.forEach(r => {
        updateAssetFromRow(r);
      });
      
      tableBody.innerHTML = '';
      rows.forEach(r => tableBody.appendChild(r));
      
      // 保存数据
      saveTableToServer(false);
      window.showToast('已取消置顶', 1500);
    } catch(e) {
      console.warn('取消置顶失败', e);
    }
  }
  
  // 更新置顶标识
  function updatePinBadge(row, isPinned){
    const nameIdx = idxMap['name'];
    if(nameIdx === undefined) return;
    
    const nameCell = row.cells[nameIdx];
    if(!nameCell) return;
    
    // 移除旧的置顶标识
    const oldBadge = nameCell.querySelector('.pin-badge');
    if(oldBadge) {
      oldBadge.remove();
    }
    
    // 如果需要显示置顶标识
    if(isPinned){
      const nameElement = editMode ? nameCell.querySelector('input') : nameCell.querySelector('span');
      if(nameElement){
        const pinBadge = document.createElement('span');
        pinBadge.className = 'pin-badge';
        pinBadge.textContent = '📌';
        pinBadge.title = '已置顶（右键可取消置顶）';
        pinBadge.style.cssText = 'display: inline; margin-left: 4px; cursor: pointer; font-size: 14px; color: #ff9800; white-space: nowrap; border: none; outline: none; box-shadow: none; background: transparent; vertical-align: baseline; line-height: inherit;';
        
        // 使用inline布局，避免flex造成的视觉边界
        // 将pinBadge直接添加到nameElement后面
        if(editMode){
          // 编辑模式：将pinBadge添加到input后面
          if(nameElement.parentNode === nameCell){
            // input直接是td的子元素，直接添加pinBadge
            nameCell.appendChild(pinBadge);
          } else {
            // input有父容器，添加到父容器
            const parent = nameElement.parentNode;
            parent.appendChild(pinBadge);
          }
        } else {
          // 查看模式：将pinBadge添加到span后面
          nameElement.style.display = 'inline';
          nameElement.style.whiteSpace = 'nowrap';
          nameElement.style.verticalAlign = 'baseline';
          
          // 将pinBadge添加到nameElement后面
          if(nameElement.nextSibling){
            nameCell.insertBefore(pinBadge, nameElement.nextSibling);
          } else {
            nameCell.appendChild(pinBadge);
          }
        }
      }
    } else {
      // 如果取消置顶，恢复nameElement的样式
      // 但保留组合资产的flex布局
      const hasCompositeBadge = nameCell.querySelector('.composite-badge');
      if(!hasCompositeBadge){
        const nameElement = nameCell.querySelector('span');
        if(nameElement){
          // 查看模式下，恢复span的display样式
          nameElement.style.display = 'inline-block';
          nameElement.style.whiteSpace = '';
          nameElement.style.verticalAlign = '';
        }
      }
    }
  }


  /* ---------- 顶部图标按钮栏 ---------- */
  initTopBar();

  function initTopBar(){
    /* 创建/获取 switch-bar 容器 */
    let switchBar = document.querySelector('.switch-bar');
    if(!switchBar){ switchBar=document.createElement('div'); switchBar.className='switch-bar'; document.body.appendChild(switchBar); }

    const addIconButton=(icon,title,onClick)=>{
      const btn=document.createElement('button'); btn.className='icon-btn'; btn.textContent=icon; btn.title=title; btn.addEventListener('click', onClick); switchBar.appendChild(btn); return btn;
    };

    /* 折叠/展开按钮 */
    const toggleBtn=addIconButton('⏴','折叠/展开',()=>{
      const collapsed = switchBar.classList.toggle('collapsed');
      toggleBtn.textContent = collapsed ? '⏵' : '⏴';
    });
    toggleBtn.classList.add('toggle-btn');


    /* 保存按钮 */
    addIconButton('💾','保存数据',()=>{ saveTableToServer(true); });

    /* 自动保存按钮 */
    const autoBtn=addIconButton('', '自动保存开关', ()=>{
      autoSaveEnabled = !autoSaveEnabled;
      localStorage.setItem('autoSave', autoSaveEnabled);
      updateAutoIcon();
      logInfo('AutoSave toggled (assets page)', autoSaveEnabled);
    });
    function updateAutoIcon(){ autoBtn.textContent = autoSaveEnabled ? '🟢' : '🔴'; autoBtn.classList.toggle('active', autoSaveEnabled); }
    updateAutoIcon();

    /* 暗黑模式切换 */
    const isDark = document.body.classList.contains('dark');
    let dark = isDark;
    const darkBtn=addIconButton(isDark ? '🌙':'🌕','暗黑模式',()=>{
      dark = !dark; document.body.classList.toggle('dark', dark); localStorage.setItem('theme', dark ? 'dark':'light'); darkBtn.textContent = dark ? '🌙' : '🌕';
    });

    /* 设置弹窗 / 站点调整 */
    addIconButton('⚙️','设置',openSettingsModal);
    
    /* 操作注意事项 */
    addIconButton('❓','操作说明',openHelpModal);

    /* 搜索框 */
    const searchContainer = document.createElement('div');
    searchContainer.style.cssText = 'display: flex; align-items: center; margin-left: 8px; gap: 4px;';
    const searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.placeholder = '搜索...';
    searchInput.style.cssText = 'padding: 4px 8px; border: 1px solid #ccc; border-radius: 4px; font-size: 14px; min-width: 150px;';
    searchInput.value = searchKeyword;
    // 清除搜索按钮
    const clearSearchBtn = document.createElement('button');
    clearSearchBtn.textContent = '✕';
    clearSearchBtn.className = 'icon-btn';
    clearSearchBtn.title = '清除搜索';
    clearSearchBtn.style.cssText = 'padding: 2px 6px; font-size: 12px; min-width: auto; display: none;';
    clearSearchBtn.addEventListener('click', () => {
      searchInput.value = '';
      searchKeyword = '';
      clearSearchBtn.style.display = 'none';
      applyFiltersAndRender();
    });
    
    searchInput.addEventListener('input', (e) => {
      searchKeyword = e.target.value.trim();
      clearSearchBtn.style.display = searchKeyword ? 'block' : 'none';
      applyFiltersAndRender();
    });
    
    searchContainer.appendChild(searchInput);
    searchContainer.appendChild(clearSearchBtn);
    if (searchKeyword) clearSearchBtn.style.display = 'block';
    switchBar.appendChild(searchContainer);

    /* 筛选按钮 */
    const filterBtn = addIconButton('🔍','筛选',openFilterModal);
    function updateFilterIcon() {
      const hasActiveFilter = Object.values(filterCriteria).some(v => v !== '') || searchKeyword !== '';
      filterBtn.classList.toggle('active', hasActiveFilter);
      filterBtn.textContent = hasActiveFilter ? '🔍' : '🔍';
    }
    updateFilterIcon();

    function openFilterModal() {
      const overlay = document.createElement('div');
      overlay.className = 'overlay';
      const modal = document.createElement('div');
      modal.className = 'modal';
      modal.style.width = '400px';
      modal.style.maxHeight = '90vh';
      modal.style.overflowY = 'auto';
      
      const title = document.createElement('h3');
      title.textContent = '筛选条件';
      modal.appendChild(title);
      
      const form = document.createElement('div');
      form.style.display = 'flex';
      form.style.flexDirection = 'column';
      form.style.gap = '16px';
      form.style.padding = '16px 0';

      // 分类筛选
      const categoryRow = document.createElement('div');
      categoryRow.style.display = 'flex';
      categoryRow.style.alignItems = 'center';
      categoryRow.style.justifyContent = 'space-between';
      const categoryLabel = document.createElement('label');
      categoryLabel.textContent = '分类：';
      categoryLabel.style.minWidth = '80px';
      const categorySelect = document.createElement('select');
      categorySelect.style.flex = '1';
      categorySelect.style.padding = '4px 8px';
      categorySelect.innerHTML = '<option value="">全部</option>' + categories.map(c => `<option value="${c}" ${filterCriteria.category === c ? 'selected' : ''}>${c}</option>`).join('');
      categoryRow.appendChild(categoryLabel);
      categoryRow.appendChild(categorySelect);
      form.appendChild(categoryRow);

      // 渠道筛选
      const channelRow = document.createElement('div');
      channelRow.style.display = 'flex';
      channelRow.style.alignItems = 'center';
      channelRow.style.justifyContent = 'space-between';
      const channelLabel = document.createElement('label');
      channelLabel.textContent = '渠道：';
      channelLabel.style.minWidth = '80px';
      const channelSelect = document.createElement('select');
      channelSelect.style.flex = '1';
      channelSelect.style.padding = '4px 8px';
      channelSelect.innerHTML = '<option value="">全部</option>' + channels.map(c => `<option value="${c}" ${filterCriteria.channel === c ? 'selected' : ''}>${c}</option>`).join('');
      channelRow.appendChild(channelLabel);
      channelRow.appendChild(channelSelect);
      form.appendChild(channelRow);

      // 标签筛选
      const tagRow = document.createElement('div');
      tagRow.style.display = 'flex';
      tagRow.style.alignItems = 'center';
      tagRow.style.justifyContent = 'space-between';
      const tagLabel = document.createElement('label');
      tagLabel.textContent = '标签：';
      tagLabel.style.minWidth = '80px';
      const tagSelect = document.createElement('select');
      tagSelect.style.flex = '1';
      tagSelect.style.padding = '4px 8px';
      tagSelect.innerHTML = '<option value="">全部</option>' + tags.map(t => `<option value="${t}" ${filterCriteria.tag === t ? 'selected' : ''}>${t}</option>`).join('');
      tagRow.appendChild(tagLabel);
      tagRow.appendChild(tagSelect);
      form.appendChild(tagRow);

      // 日期范围
      const dateFromRow = document.createElement('div');
      dateFromRow.style.display = 'flex';
      dateFromRow.style.alignItems = 'center';
      dateFromRow.style.justifyContent = 'space-between';
      const dateFromLabel = document.createElement('label');
      dateFromLabel.textContent = '开始日期：';
      dateFromLabel.style.minWidth = '80px';
      const dateFromInput = document.createElement('input');
      dateFromInput.type = 'date';
      dateFromInput.style.flex = '1';
      dateFromInput.style.padding = '4px 8px';
      dateFromInput.value = filterCriteria.dateFrom;
      dateFromRow.appendChild(dateFromLabel);
      dateFromRow.appendChild(dateFromInput);
      form.appendChild(dateFromRow);

      const dateToRow = document.createElement('div');
      dateToRow.style.display = 'flex';
      dateToRow.style.alignItems = 'center';
      dateToRow.style.justifyContent = 'space-between';
      const dateToLabel = document.createElement('label');
      dateToLabel.textContent = '结束日期：';
      dateToLabel.style.minWidth = '80px';
      const dateToInput = document.createElement('input');
      dateToInput.type = 'date';
      dateToInput.style.flex = '1';
      dateToInput.style.padding = '4px 8px';
      dateToInput.value = filterCriteria.dateTo;
      dateToRow.appendChild(dateToLabel);
      dateToRow.appendChild(dateToInput);
      form.appendChild(dateToRow);

      // 金额范围
      const amountMinRow = document.createElement('div');
      amountMinRow.style.display = 'flex';
      amountMinRow.style.alignItems = 'center';
      amountMinRow.style.justifyContent = 'space-between';
      const amountMinLabel = document.createElement('label');
      amountMinLabel.textContent = '最小金额：';
      amountMinLabel.style.minWidth = '80px';
      const amountMinInput = document.createElement('input');
      amountMinInput.type = 'number';
      amountMinInput.step = '0.01';
      amountMinInput.style.flex = '1';
      amountMinInput.style.padding = '4px 8px';
      amountMinInput.value = filterCriteria.amountMin;
      amountMinRow.appendChild(amountMinLabel);
      amountMinRow.appendChild(amountMinInput);
      form.appendChild(amountMinRow);

      const amountMaxRow = document.createElement('div');
      amountMaxRow.style.display = 'flex';
      amountMaxRow.style.alignItems = 'center';
      amountMaxRow.style.justifyContent = 'space-between';
      const amountMaxLabel = document.createElement('label');
      amountMaxLabel.textContent = '最大金额：';
      amountMaxLabel.style.minWidth = '80px';
      const amountMaxInput = document.createElement('input');
      amountMaxInput.type = 'number';
      amountMaxInput.step = '0.01';
      amountMaxInput.style.flex = '1';
      amountMaxInput.style.padding = '4px 8px';
      amountMaxInput.value = filterCriteria.amountMax;
      amountMaxRow.appendChild(amountMaxLabel);
      amountMaxRow.appendChild(amountMaxInput);
      form.appendChild(amountMaxRow);

      modal.appendChild(form);

      // 按钮组
      const btnGroup = document.createElement('div');
      btnGroup.style.display = 'flex';
      btnGroup.style.gap = '8px';
      btnGroup.style.justifyContent = 'flex-end';
      btnGroup.style.marginTop = '16px';

      const applyBtn = document.createElement('button');
      applyBtn.textContent = '应用';
      applyBtn.className = 'btn-like';
      applyBtn.onclick = () => {
        filterCriteria.category = categorySelect.value;
        filterCriteria.channel = channelSelect.value;
        filterCriteria.tag = tagSelect.value;
        filterCriteria.dateFrom = dateFromInput.value;
        filterCriteria.dateTo = dateToInput.value;
        filterCriteria.amountMin = amountMinInput.value;
        filterCriteria.amountMax = amountMaxInput.value;
        applyFiltersAndRender();
        updateFilterIcon();
        document.body.removeChild(overlay);
      };

      const clearBtn = document.createElement('button');
      clearBtn.textContent = '清除';
      clearBtn.className = 'btn-like btn-small btn-danger';
      clearBtn.onclick = () => {
        filterCriteria.category = '';
        filterCriteria.channel = '';
        filterCriteria.tag = '';
        filterCriteria.dateFrom = '';
        filterCriteria.dateTo = '';
        filterCriteria.amountMin = '';
        filterCriteria.amountMax = '';
        categorySelect.value = '';
        channelSelect.value = '';
        tagSelect.value = '';
        dateFromInput.value = '';
        dateToInput.value = '';
        amountMinInput.value = '';
        amountMaxInput.value = '';
        applyFiltersAndRender();
        updateFilterIcon();
      };

      const cancelBtn = document.createElement('button');
      cancelBtn.textContent = '取消';
      cancelBtn.className = 'btn-like btn-small';
      cancelBtn.onclick = () => document.body.removeChild(overlay);

      btnGroup.appendChild(clearBtn);
      btnGroup.appendChild(cancelBtn);
      btnGroup.appendChild(applyBtn);
      modal.appendChild(btnGroup);

      overlay.appendChild(modal);
      document.body.appendChild(overlay);
    }

    function openSettingsModal(){
      const overlay=document.createElement('div'); overlay.className='overlay';
      const modal=document.createElement('div'); modal.className='modal'; modal.style.width='300px';
      const title=document.createElement('h3'); title.textContent='界面设置'; modal.appendChild(title);
      const form=document.createElement('div'); form.style.display='flex'; form.style.flexDirection='column'; form.style.gap='12px';

      /* 主区域宽度 */
      const wLabel=document.createElement('label'); wLabel.textContent='主区域宽度(px)'; wLabel.style.display='flex'; wLabel.style.alignItems='center'; wLabel.style.justifyContent='space-between';
      const widthInput=document.createElement('input'); widthInput.type='number'; widthInput.min=600; widthInput.max=2400; widthInput.step=100; widthInput.style.width='100px'; widthInput.style.marginLeft='12px';
      widthInput.value=parseInt(localStorage.getItem('mainWidth')||'1200',10);
      wLabel.appendChild(widthInput); form.appendChild(wLabel);

      /* 字体缩放 */
      const zoomWrap=document.createElement('label'); zoomWrap.textContent='字体缩放(%)'; zoomWrap.style.display='flex'; zoomWrap.style.alignItems='center'; zoomWrap.style.justifyContent='space-between';
      const zoomInp=document.createElement('input'); zoomInp.type='number'; zoomInp.min=80; zoomInp.max=150; zoomInp.step=10; zoomInp.style.width='100px'; zoomInp.style.marginLeft='12px';
      zoomInp.value=parseInt(localStorage.getItem('siteZoom')||'100',10); zoomWrap.appendChild(zoomInp); form.appendChild(zoomWrap);

      /* 列宽自适应 */
      const fitLabel=document.createElement('label'); fitLabel.textContent='列宽自适应'; fitLabel.style.display='flex'; fitLabel.style.alignItems='center'; fitLabel.style.justifyContent='space-between';
      const fitBtn=document.createElement('button'); fitBtn.textContent='重置'; fitBtn.className='btn-like btn-small';
      fitBtn.onclick=()=>{ columnsMeta.forEach(c=>{ delete c.width; }); applyColumnWidths(); saveTableToServer(false); window.showToast('已重置列宽'); };
      fitLabel.appendChild(fitBtn); form.appendChild(fitLabel);

      /* 显示组合资产的子资产 */
      const showComponentsLabel=document.createElement('label'); 
      showComponentsLabel.textContent='在列表显示组合资产的子资产'; 
      showComponentsLabel.style.display='flex'; 
      showComponentsLabel.style.alignItems='center'; 
      showComponentsLabel.style.justifyContent='space-between';
      const showComponentsCheck=document.createElement('input'); 
      showComponentsCheck.type='checkbox'; 
      showComponentsCheck.checked=showComponentAssets;
      showComponentsCheck.style.marginLeft='12px';
      showComponentsLabel.appendChild(showComponentsCheck); 
      form.appendChild(showComponentsLabel);

      modal.appendChild(form);
      const actions=document.createElement('div'); actions.className='actions';
      const ok=document.createElement('button'); ok.textContent='应用'; ok.className='btn-like';
      const cancel=document.createElement('button'); cancel.textContent='取消'; cancel.className='btn-like btn-danger btn-small';
      ok.onclick=()=>{
        const w=parseInt(widthInput.value,10);
        if(!isNaN(w)&&w>=600&&w<=2400){ localStorage.setItem('mainWidth',w); document.documentElement.style.setProperty('--main-max-width', w+'px'); }
        const pct=parseInt(zoomInp.value,10);
        if(!isNaN(pct)&&pct>=80&&pct<=150){ localStorage.setItem('siteZoom',pct); document.documentElement.style.setProperty('--site-zoom', pct+'%'); }
        // 更新显示子资产设置
        showComponentAssets = showComponentsCheck.checked;
        localStorage.setItem('showComponentAssets', showComponentAssets);
        // 重新应用过滤和渲染
        applyFiltersAndRender();
        document.body.removeChild(overlay);
      };
      cancel.onclick=()=> document.body.removeChild(overlay);
      actions.appendChild(ok); actions.appendChild(cancel); modal.appendChild(actions);
      overlay.appendChild(modal); document.body.appendChild(overlay);
    }
    
    function openHelpModal(){
      const overlay=document.createElement('div'); overlay.className='overlay';
      const modal=document.createElement('div'); modal.className='modal'; modal.style.width='500px'; modal.style.maxWidth='90vw';
      const title=document.createElement('h3'); title.textContent='操作说明'; modal.appendChild(title);
      
      const content=document.createElement('div'); 
      content.style.cssText='padding: 16px; line-height: 1.8; max-height: 70vh; overflow-y: auto;';
      
      const helpText = `
        <h4 style="margin-top: 0; color: #1976d2;">📋 基本操作</h4>
        <ul style="margin: 8px 0; padding-left: 24px;">
          <li><strong>添加资产：</strong>点击右下角的"＋"按钮，在弹出的编辑窗口中填写信息</li>
          <li><strong>编辑资产：</strong>右键点击表格行，选择"编辑"；移动端长按表格行显示菜单</li>
          <li><strong>查看资产：</strong>右键点击表格行，选择"查看"；移动端长按表格行显示菜单</li>
          <li><strong>置顶资产：</strong>右键点击表格行，选择"置顶"</li>
        </ul>
        
        <h4 style="margin-top: 16px; color: #1976d2;">🖥️ 桌面端操作</h4>
        <ul style="margin: 8px 0; padding-left: 24px;">
          <li><strong>右键菜单：</strong>在表格行上右键点击显示操作菜单</li>
          <li><strong>编辑模式：</strong>点击右上角"✏️"切换到编辑模式，可直接在表格中编辑</li>
          <li><strong>查看模式：</strong>点击右上角"👁️"切换到查看模式，表格显示为只读文本</li>
          <li><strong>列宽调整：</strong>拖拽表头右侧边缘调整列宽</li>
        </ul>
        
        <h4 style="margin-top: 16px; color: #1976d2;">📱 移动端操作</h4>
        <ul style="margin: 8px 0; padding-left: 24px;">
          <li><strong>长按菜单：</strong>长按表格行（500ms）显示操作菜单</li>
          <li><strong>快速编辑：</strong>在编辑模式下，短按表格行直接打开编辑窗口</li>
          <li><strong>滑动操作：</strong>滑动时不会触发点击事件，避免误操作</li>
        </ul>
        
        <h4 style="margin-top: 16px; color: #1976d2;">🔗 组合资产</h4>
        <ul style="margin: 8px 0; padding-left: 24px;">
          <li><strong>创建组合资产：</strong>在编辑资产时，勾选"组合资产"选项</li>
          <li><strong>添加组件：</strong>点击"添加组件"按钮，选择已有的资产作为组件</li>
          <li><strong>查看详情：</strong>点击名称列的小圆点徽章查看组合资产的详细配置</li>
        </ul>
        
        <h4 style="margin-top: 16px; color: #1976d2;">💾 数据保存</h4>
        <ul style="margin: 8px 0; padding-left: 24px;">
          <li><strong>自动保存：</strong>开启自动保存后，修改会自动保存到服务器</li>
          <li><strong>手动保存：</strong>点击右上角"💾"按钮手动保存数据</li>
          <li><strong>必填项：</strong>名称字段标记有"※"号，为必填项</li>
        </ul>
        
        <h4 style="margin-top: 16px; color: #1976d2;">⚙️ 其他功能</h4>
        <ul style="margin: 8px 0; padding-left: 24px;">
          <li><strong>暗黑模式：</strong>点击右上角"🌙/🌕"切换主题</li>
          <li><strong>字体缩放：</strong>在设置中调整字体大小（80%-150%）</li>
          <li><strong>列宽重置：</strong>在设置中点击"重置"恢复默认列宽</li>
        </ul>
      `;
      
      content.innerHTML = helpText;
      modal.appendChild(content);
      
      const actions=document.createElement('div'); actions.className='actions';
      const close=document.createElement('button'); close.textContent='知道了'; close.className='btn-like';
      close.onclick=()=>{ document.body.removeChild(overlay); };
      actions.appendChild(close); 
      modal.appendChild(actions);
      overlay.appendChild(modal); 
      overlay.onclick=(e)=>{ if(e.target===overlay) document.body.removeChild(overlay); };
      document.body.appendChild(overlay);
    }
  }
})(); 