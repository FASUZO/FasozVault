/**
 * FasozVault - 管理页面脚本
 * 功能：资产分类管理、购入渠道管理、标签管理、列管理、数据导入/导出
 * UI：已同步 Assets 页面的 Switch-Bar 风格和暗黑模式
 * * 使用页面：pages/management.html
 */

import { logDebug, logInfo } from '../utils/debug.js';

// ---------- SVG Icons ----------
const ICON_SHOW = `<svg viewBox="0 0 1365 1024" width="20" height="20"><path d="M1294.784853 471.466667C1153.13152 157.866667 938.944853 0 651.712853 0 364.480853 0 150.464853 157.866667 8.726187 471.637333a98.986667 98.986667 0 0 0 0 80.896C150.37952 866.133333 364.566187 1024 651.712853 1024c287.317333 0 501.333333-157.866667 643.072-471.637333a98.986667 98.986667 0 0 0 0-80.896z m-643.072 439.466666c-241.066667 0-417.536-128.512-542.122666-398.933333 124.586667-270.506667 301.056-398.933333 542.122666-398.933333 241.152 0 417.621333 128.512 542.122667 398.933333-124.330667 270.506667-300.885333 398.933333-542.122667 398.933333z m-5.973333-675.328C500.502187 235.52 382.742187 359.253333 382.742187 512s117.76 276.48 262.997333 276.48C791.14752 788.48 908.90752 664.576 908.90752 512c0-152.661333-117.76-276.48-263.082667-276.48z m0 452.266667C553.238187 687.872 478.400853 609.28 478.400853 512c0-97.28 74.837333-175.872 167.338667-175.872 92.586667 0 167.424 78.677333 167.424 175.872 0 97.28-74.837333 175.872-167.424 175.872z" fill="#666666"></path></svg>`;
const ICON_HIDE = `<svg viewBox="0 0 1102 1024" width="20" height="20"><path d="M1095.510609 500.629845l-0.146273-0.146273-0.146273-0.146273c-46.075952-101.805913-101.147685-184.157535-165.288335-246.98173l-64.067514 67.43179c55.218006 53.389595 103.049232 124.478207 144.225043 213.704653-105.316461 228.770758-254.661055 337.451495-458.784836 337.451496-64.872015 0-124.331934-11.043601-178.526029-33.350213l-69.187064 72.624477c74.014069 37.445853 156.438827 56.315052 247.713093 56.315052 243.105499 0 424.191303-133.473988 544.061915-398.812962 9.727145-21.502111 9.727145-46.441634 0.146273-68.090017zM1014.548579 59.470889l-53.609004-56.315052a9.800282 9.800282 0 0 0-14.334741 0l-147.735592 155.049235c-73.794659-37.665262-156.219418-56.534462-247.566821-56.534462C308.270059 101.743747 127.257391 235.144598 7.313643 500.483572c-9.727145 21.648384-9.727145 46.880453 0 68.528836 46.075952 101.879049 101.147685 184.157535 165.288336 247.128003L45.271451 949.614398a11.043601 11.043601 0 0 0 0 14.992969l53.609005 56.315052a9.800282 9.800282 0 0 0 14.261604 0L1014.548579 74.317585a10.897328 10.897328 0 0 0 0-14.846696zM408.247561 568.35418a156.438827 156.438827 0 0 1-3.656821-33.715895c0-82.205349 63.409286-148.759502 141.665268-148.759501 10.970465 0 21.940929 1.316456 32.180029 3.87623L408.247561 568.35418z m233.305217-245.007045a213.924062 213.924062 0 0 0-95.29677-22.452885c-122.869205 0-222.554161 104.585097-222.554162 233.744035 0 35.836851 7.679325 69.699019 21.355838 100.123775l-108.241919 113.654015c-55.218006-53.389595-103.122369-124.40507-144.298179-213.704653C197.98032 305.940664 347.39805 197.333063 551.302421 197.333063c64.872015 0 124.331934 10.970465 178.599166 33.350213L641.625914 323.347135zM546.329144 683.324651c-8.045007 0-16.090015-0.658228-23.76934-2.120957l-64.579469 67.870609c27.06048 12.360057 57.046417 19.088609 88.348809 19.088608 122.869205 0 222.554161-104.585097 222.554161-233.670899 0-32.911394-6.436006-64.36006-18.210971-92.883268l-64.579469 67.943745c1.243319 8.045007 1.974684 16.455697 1.974683 24.866387-0.073136 82.424758-63.482423 148.905775-141.738404 148.905775z" fill="#666666"></path></svg>`;
const ICON_HANDLE = `<svg viewBox="0 0 1106 1024" width="20" height="20"><path d="M1021.238317 0.001202a84.160991 84.160991 0 0 1 84.581796 84.581796v64.383158a84.160991 84.160991 0 0 1-84.581796 84.581796H84.586605A84.160991 84.160991 0 0 1 0.004809 148.966156V84.582998A84.160991 84.160991 0 0 1 84.586605 0.001202z m0 395.195967a84.160991 84.160991 0 0 1 84.581796 84.581796v64.383158a84.160991 84.160991 0 0 1-84.581796 84.64191H84.586605A84.160991 84.160991 0 0 1 0.004809 544.222238V479.83908a84.160991 84.160991 0 0 1 84.581796-84.581796z m0 395.195967a84.160991 84.160991 0 0 1 84.581796 84.581795v64.383158a84.160991 84.160991 0 0 1-84.581796 84.581796H84.586605A84.160991 84.160991 0 0 1 0.004809 939.358089v-64.383158a84.160991 84.160991 0 0 1 84.581796-84.581795z" fill="#1D85ED"></path></svg>`;

// --- 样式注入 (保持与 Assets 页面一致) ---
const STYLE_INJECTION = `
<style>
    /* --- Switch Bar (顶栏) --- */
    .switch-bar {
        position: fixed;
        top: 10px;
        right: 20px;
        z-index: 2000;
        background: #fff;
        border-radius: 20px; 
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        display: flex;
        align-items: center;
        padding: 4px;
        height: 40px; 
        overflow: hidden; /* 关键修复：收缩时隐藏子元素 */
        max-width: 600px;
        transition: max-width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
    
    .switch-bar.collapsed {
        max-width: 40px; 
    }
    
    .switch-bar.collapsed > *:not(.toggle-btn) {
        opacity: 0;
        pointer-events: none;
        width: 0;
        margin: 0;
        padding: 0;
    }

    .switch-bar .icon-btn {
        border: none;
        background: transparent;
        font-size: 18px;
        cursor: pointer;
        padding: 0;
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        flex-shrink: 0;
        color: #555;
        transition: background 0.2s;
    }
    .switch-bar .icon-btn:hover { background: #f0f0f0; }
    .switch-bar .icon-btn.active { color: #4caf50; }

    /* --- 模态框与暗黑模式 --- */
    body.dark { background-color: #1e1e1e; color: #e0e0e0; }
    body.dark .switch-bar { background: #333; box-shadow: 0 2px 10px rgba(0,0,0,0.5); }
    body.dark .switch-bar .icon-btn { color: #bbb; }
    body.dark .switch-bar .icon-btn:hover { background: #444; }

    body.dark .modal { background: #2d2d2d; color: #e0e0e0; border: 1px solid #444; }
    body.dark .modal h3 { color: #fff; border-bottom-color: #444; }
    body.dark input, body.dark select, body.dark textarea { 
        background-color: #333 !important; 
        color: #eee !important; 
        border: 1px solid #555 !important; 
    }
    
    /* 覆盖管理页面的特定容器 */
    body.dark .column-toggle-item { background: #2d2d2d; border-color: #444; }
    body.dark .list-group-item { background: #2d2d2d; border-color: #444; }
</style>
`;

(async function() {
  // 注入样式
  document.head.insertAdjacentHTML('beforeend', STYLE_INJECTION);

  // 读取运行时配置
  let envCfg = {};
  try {
    const r = await fetch('/api/env');
    if(r.ok) envCfg = await r.json();
  } catch(e){ console.warn('无法获取 /api/env', e); }

  // 应用默认设置
  if(localStorage.getItem('autoSave') === null && typeof envCfg.defaultAutoSave === 'boolean'){
    localStorage.setItem('autoSave', envCfg.defaultAutoSave);
  }
  if(localStorage.getItem('theme') === null && typeof envCfg.defaultDark === 'boolean'){
    localStorage.setItem('theme', envCfg.defaultDark ? 'dark' : 'light');
  }

  logDebug('管理页面脚本启动');
  const DEFAULT_CATEGORIES = ['设备', '软件', '零件', '其他'];
  const DEFAULT_CHANNELS = ['淘宝', '京东', '拼多多', '闲鱼', '其他'];

  let allColumns = [
    { key:'name', label:'资产名称' },
    { key:'category', label:'资产分类' },
    { key:'subcategory', label:'分类' },
    { key:'amount', label:'金额' },
    { key:'date', label:'时间' },
    { key:'channel', label:'购入渠道' },
    { key:'image', label:'附件' },
    { key:'note', label:'备注' },
    { key:'action', label:'操作' }
  ];

  let categories = [], channels = [], tags = [], assetsCache = [], hiddenColumns = [], columnOrder = [];

  // 获取数据
  await fetch('/api/data').then(r=>r.json()).then(d=>{
    categories = d.categories || DEFAULT_CATEGORIES.slice();
    channels = d.channels || DEFAULT_CHANNELS.slice();
    tags = d.tags || [];
    assetsCache = d.assets || [];
    hiddenColumns = d.hiddenColumns || [];
    if(Array.isArray(d.columns) && d.columns.length){ allColumns = d.columns; }
    if(!allColumns.find(c=>c.key==='action')) allColumns.push({key:'action', label:'操作'});
    columnOrder = Array.isArray(d.columnOrder) && d.columnOrder.length ? d.columnOrder : allColumns.map(c=>c.key);
    if(!columnOrder.includes('action')) columnOrder.push('action');
  });

  const labelMap = { name:'名称', category:'分类', subcategory:'标签' };
  allColumns.forEach(c=>{ if(labelMap[c.key]) c.label = labelMap[c.key]; });

  // DOM 引用
  const listEl = document.getElementById('categoryList');
  const addBtn = document.getElementById('addCategory');
  const exportBtn = document.getElementById('exportData');
  const editDataBtn = document.getElementById('editDataBtn');
  const importInput = document.getElementById('importFile');
  const channelListEl = document.getElementById('channelList');
  const addChannelBtn = document.getElementById('addChannel');
  const columnToggleBox = document.getElementById('columnToggles');
  const addColumnBtn = document.getElementById('addColumnBtn');
  const deleteColumnBtn = document.getElementById('deleteColumnBtn');
  const deleteCategoryBtn = document.getElementById('deleteCategoryBtn');
  const deleteChannelBtn = document.getElementById('deleteChannelBtn');
  const tagListEl = document.getElementById('tagList');
  const addTagBtn = document.getElementById('addTag');
  const deleteTagBtn = document.getElementById('deleteTagBtn');
  const viewDataBtn = document.getElementById('viewDataBtn');
  const resetDataBtn = document.getElementById('resetDataBtn');
  const fixDataBtn = document.getElementById('fixDataBtn');
  const backupDataBtn = document.getElementById('backupDataBtn');
  const autoBackupDaysInput = document.getElementById('autoBackupDays');

  let pendingChanges = false;
  let autoSaveEnabled = localStorage.getItem('autoSave') === 'true';
  let isDark = localStorage.getItem('theme') === 'dark';
  if(isDark){ document.body.classList.add('dark'); }

  // 初始化顶部开关栏 (使用 Assets 页面同款逻辑)
  function initToggles(){
    // 移除旧的 switch-bar（如果存在）
    const oldBar = document.querySelector('.switch-bar');
    if(oldBar) oldBar.remove();

    const switchBar = document.createElement('div');
    switchBar.className = 'switch-bar';
    document.body.appendChild(switchBar);

    const addBtn = (icon, title, onClick) => {
      const btn = document.createElement('button');
      btn.className = 'icon-btn';
      btn.textContent = icon;
      btn.title = title;
      btn.onclick = onClick;
      switchBar.appendChild(btn);
      return btn;
    };

    // 折叠按钮
    const toggleBtn = addBtn('⏴', '折叠/展开', () => {
      const collapsed = switchBar.classList.toggle('collapsed');
      toggleBtn.textContent = collapsed ? '⏵' : '⏴';
    });
    toggleBtn.classList.add('toggle-btn');

    // 保存按钮
    addBtn('💾', '保存数据', ()=>{
      syncToServer(true);
      window.showToast('数据已保存！');
    });

    // 自动保存开关
    const autoBtn = addBtn(autoSaveEnabled ? '🟢' : '🔴', '自动保存开关', () => {
      autoSaveEnabled = !autoSaveEnabled;
      localStorage.setItem('autoSave', autoSaveEnabled);
      autoBtn.textContent = autoSaveEnabled ? '🟢' : '🔴';
      autoBtn.classList.toggle('active', autoSaveEnabled);
      if(autoSaveEnabled && pendingChanges){
        syncToServer(true);
        window.showToast('已开启自动保存');
      }
    });
    if(autoSaveEnabled) autoBtn.classList.add('active');

    // 暗黑模式开关
    const darkBtn = addBtn(isDark ? '🌙' : '🌕', '切换主题', () => {
      isDark = !isDark;
      document.body.classList.toggle('dark', isDark);
      localStorage.setItem('theme', isDark ? 'dark' : 'light');
      darkBtn.textContent = isDark ? '🌙' : '🌕';
    });

    // 设置按钮
    addBtn('❓', '设置', openSettingsModal);
  }

  function openSettingsModal(){
    const overlay=document.createElement('div'); overlay.className='overlay';
    const modal=document.createElement('div'); modal.className='modal'; modal.style.width='300px';
    const title=document.createElement('h3'); title.textContent='界面设置'; modal.appendChild(title);

    const formWrap=document.createElement('div'); formWrap.style.display='flex'; formWrap.style.flexDirection='column'; formWrap.style.gap='12px';

    const zLabel=document.createElement('label'); zLabel.textContent='字体缩放(%)';
    zLabel.style.display='flex'; zLabel.style.alignItems='center'; zLabel.style.justifyContent='space-between';
    const zoomInput=document.createElement('input'); zoomInput.type='number'; zoomInput.min=80; zoomInput.max=150; zoomInput.step=10;
    zoomInput.style.width='100px'; zoomInput.style.marginLeft='12px';
    zoomInput.value=parseInt(localStorage.getItem('siteZoom')||'100',10);
    zLabel.appendChild(zoomInput);
    formWrap.appendChild(zLabel);

    modal.appendChild(formWrap);

    const actions=document.createElement('div'); actions.className='actions';
    const okBtn=document.createElement('button'); okBtn.textContent='应用'; okBtn.className='btn-like';
    const cancelBtn=document.createElement('button'); cancelBtn.textContent='取消'; cancelBtn.className='btn-like btn-danger btn-small';

    okBtn.onclick=()=>{
      const z=parseInt(zoomInput.value,10);
      if(!isNaN(z)&&z>=80&&z<=150){ 
        localStorage.setItem('siteZoom',z); 
        document.documentElement.style.setProperty('--site-zoom', z+'%'); 
      }
      document.body.removeChild(overlay);
    };
    cancelBtn.onclick=()=> document.body.removeChild(overlay);
    actions.appendChild(okBtn); actions.appendChild(cancelBtn); modal.appendChild(actions);
    overlay.appendChild(modal); document.body.appendChild(overlay);
  }

  // 立即初始化 Switch Bar
  initToggles();

  // 全局字体
  const storedScale = parseInt(localStorage.getItem('siteZoom') || '100', 10);
  document.documentElement.style.setProperty('--site-zoom', storedScale + '%');

  // 数据同步逻辑
  function syncToServer(force = false) {
    if(autoSaveEnabled) force = true;
    if(!force){ pendingChanges = true; return; }
    pendingChanges = false;
    const payload = { categories, channels, tags, assets: assetsCache, hiddenColumns, columnOrder, columns: allColumns };
    fetch('/api/data', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify(payload)
    })
    .then(()=> logDebug('Data saved OK'))
    .catch(err=> console.error('Save failed', err));
  }

  // --- 列管理渲染 ---
  function renderColumnToggles() {
    columnToggleBox.innerHTML = '';
    columnOrder.forEach((key, idx) => {
      const col = allColumns.find(c=>c.key===key);
      if(!col) return;

      const wrapper = document.createElement('div');
      wrapper.className = 'column-toggle-item'; // 方便 CSS 覆盖
      wrapper.style.display = 'flex';
      wrapper.style.alignItems = 'center';
      wrapper.style.marginBottom = '6px';
      wrapper.style.padding = '4px';
      wrapper.style.borderRadius = '4px';
      wrapper.style.border = '1px solid #eee';

      const handle = document.createElement('span');
      handle.innerHTML = ICON_HANDLE;
      handle.classList.add('drag-handle');
      handle.style.cursor = 'grab';
      handle.style.marginRight = '6px';

      const eye = document.createElement('span');
      const updateEye=()=>{ eye.innerHTML = cb.checked ? ICON_SHOW : ICON_HIDE; };
      const cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.checked = !hiddenColumns.includes(col.key);
      cb.style.display='none';
      cb.addEventListener('change', ()=>{
        if(cb.checked){ hiddenColumns = hiddenColumns.filter(k=>k!==col.key); }
        else{ if(!hiddenColumns.includes(col.key)) hiddenColumns.push(col.key); }
        updateEye(); syncToServer();
      });
      eye.style.cursor='pointer'; eye.style.marginRight='6px';
      eye.addEventListener('click', ()=>{ cb.checked = !cb.checked; cb.dispatchEvent(new Event('change')); });
      updateEye();

      const labelTxt=document.createElement('span'); labelTxt.textContent=col.label;

      wrapper.appendChild(handle); wrapper.appendChild(eye); wrapper.appendChild(cb); wrapper.appendChild(labelTxt);

      const widthInp=document.createElement('input');
      widthInp.type='number'; widthInp.placeholder='宽(px)'; widthInp.value = col.width || '';
      widthInp.className='column-width-input';
      widthInp.style.marginLeft='auto'; widthInp.style.width='60px'; widthInp.style.padding='2px';
      widthInp.addEventListener('change',()=>{
        const v=parseInt(widthInp.value,10);
        if(Number.isNaN(v)) delete col.width; else col.width = v;
        syncToServer();
      });
      wrapper.appendChild(widthInp);

      wrapper.dataset.index = idx;
      attachDrag(wrapper, columnOrder, renderColumnToggles);
      columnToggleBox.appendChild(wrapper);
    });
  }

  // --- 通用列表渲染 ---
  function renderList() {
    listEl.innerHTML = '';
    categories.forEach((cat, idx) => {
      const li = document.createElement('li');
      li.className = 'list-group-item'; // CSS Class
      li.style.cssText = 'padding:8px; border-bottom:1px solid #eee; display:flex; justify-content:space-between; cursor:grab;';
      li.textContent = cat; li.dataset.index = idx;
      listEl.appendChild(li);
      attachDrag(li, categories, renderList);
    });
  }

  function renderChannelList() {
    channelListEl.innerHTML = '';
    channels.forEach((ch, idx) => {
      const li = document.createElement('li');
      li.className = 'list-group-item';
      li.style.cssText = 'padding:8px; border-bottom:1px solid #eee; display:flex; justify-content:space-between; cursor:grab;';
      li.textContent = ch; li.dataset.index = idx;
      channelListEl.appendChild(li);
      attachDrag(li, channels, renderChannelList);
    });
  }

  function renderTagList() {
    tagListEl.innerHTML = '';
    tags.forEach((t, idx) => {
      const li = document.createElement('li');
      li.className = 'list-group-item';
      li.style.cssText = 'padding:8px; border-bottom:1px solid #eee; display:flex; justify-content:space-between; cursor:grab;';
      li.textContent = t; li.dataset.index = idx;
      tagListEl.appendChild(li);
      attachDrag(li, tags, renderTagList);
    });
  }

  // --- 拖拽逻辑 ---
  function attachDrag(li, arr, renderFn){
    li.draggable = true;
    const needHandle = !!li.querySelector('.drag-handle');
    let allowDrag = !needHandle;

    li.addEventListener('mousedown', (e)=>{
      if(!needHandle) return;
      allowDrag = !!e.target.closest('.drag-handle');
    });

    li.addEventListener('dragstart', (e)=>{
      if(!allowDrag){ e.preventDefault(); return; }
      li.classList.add('dragging');
      e.dataTransfer.effectAllowed='move';
      // 存储源索引
      e.dataTransfer.setData('text/plain', li.dataset.index);
    });

    li.addEventListener('dragover', (e)=>{ e.preventDefault(); e.dataTransfer.dropEffect='move'; });

    li.addEventListener('drop', (e)=>{
      e.preventDefault();
      const from = parseInt(e.dataTransfer.getData('text/plain'),10);
      const to = parseInt(li.dataset.index,10);
      if(isNaN(from)||isNaN(to)||from===to) return;
      const item = arr.splice(from,1)[0];
      arr.splice(to,0,item);
      renderFn();
      syncToServer();
    });

    li.addEventListener('dragend', ()=> li.classList.remove('dragging'));
  }

  // --- 事件监听 ---
  addBtn.addEventListener('click', () => {
    openAddModal('新增分类', '分类名称', (val)=>{
      if(categories.includes(val)){ alert('该分类已存在'); return; }
      categories.push(val); syncToServer(); renderList(); });
  });

  addChannelBtn.addEventListener('click', () => {
    openAddModal('新增渠道', '渠道名称', (val)=>{
      if(channels.includes(val)){ alert('该渠道已存在'); return; }
      channels.push(val); syncToServer(); renderChannelList(); });
  });

  addTagBtn.addEventListener('click', () => {
    openAddModal('新增标签', '标签名称', (val)=>{
      if(tags.includes(val)){ alert('该标签已存在'); return; }
      tags.push(val); syncToServer(); renderTagList(); });
  });

  // 模态框辅助
  function openAddModal(title, placeholder, onAdd){
    const overlay=document.createElement('div'); overlay.className='overlay';
    const modal=document.createElement('div'); modal.className='modal';
    const h3=document.createElement('h3'); h3.textContent=title; modal.appendChild(h3);
    const input=document.createElement('input'); input.placeholder=placeholder; input.style.width='100%'; modal.appendChild(input);
    const actions=document.createElement('div'); actions.className='actions';
    const okBtn=document.createElement('button'); okBtn.textContent='添加'; okBtn.className='btn-like btn-success';
    const cancelBtn=document.createElement('button'); cancelBtn.textContent='取消'; cancelBtn.className='btn-like btn-danger';
    okBtn.onclick=()=>{ const val=input.value.trim(); if(!val){ alert('内容不能为空'); return;} onAdd(val); document.body.removeChild(overlay);} ;
    cancelBtn.onclick=()=>document.body.removeChild(overlay);
    actions.appendChild(okBtn); actions.appendChild(cancelBtn); modal.appendChild(actions);
    overlay.appendChild(modal); document.body.appendChild(overlay);
    input.focus();
  }
  
  function openDeleteModal(list, onDelete){
    if(list.length===0){ alert('没有可删除项'); return; }
    const overlay=document.createElement('div'); overlay.className='overlay';
    const modal=document.createElement('div'); modal.className='modal';
    const title=document.createElement('h3'); title.textContent='请选择要删除的项'; modal.appendChild(title);
    const select=document.createElement('select'); select.style.width='100%';
    list.forEach(item=>{ const opt=document.createElement('option'); opt.value=item; opt.textContent=item; select.appendChild(opt); });
    const okBtn=document.createElement('button'); okBtn.textContent='删除'; okBtn.className='btn-like btn-danger';
    const cancelBtn=document.createElement('button'); cancelBtn.textContent='取消'; cancelBtn.className='btn-like'; cancelBtn.style.marginTop='6px';
    okBtn.onclick=()=>{ onDelete(select.value); document.body.removeChild(overlay); };
    cancelBtn.onclick=()=>{ document.body.removeChild(overlay); };
    modal.appendChild(select);
    modal.appendChild(okBtn); modal.appendChild(cancelBtn);
    overlay.appendChild(modal); document.body.appendChild(overlay);
  }

  deleteCategoryBtn.addEventListener('click', ()=>{
    openDeleteModal(categories, (val)=>{
      const idx=categories.indexOf(val);
      if(idx>-1){ categories.splice(idx,1); syncToServer(); renderList(); }
    });
  });

  deleteChannelBtn.addEventListener('click', ()=>{
    openDeleteModal(channels, (val)=>{
      const idx=channels.indexOf(val);
      if(idx>-1){ channels.splice(idx,1); syncToServer(); renderChannelList(); }
    });
  });

  deleteTagBtn.addEventListener('click', ()=>{
    openDeleteModal(tags, (val)=>{
      const idx=tags.indexOf(val);
      if(idx>-1){ tags.splice(idx,1); syncToServer(); renderTagList(); }
    });
  });

  // 导出/导入/查看/重置/修复/备份 保持原逻辑
  exportBtn.addEventListener('click', () => {
    const data = { categories, channels, tags, assets: assetsCache, hiddenColumns, columnOrder, columns: allColumns };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'assets_data.json';
    document.body.appendChild(a); a.click(); URL.revokeObjectURL(url); a.remove();
  });

  importInput.addEventListener('change', (e) => {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const obj = JSON.parse(reader.result);
        if (obj.categories) categories = obj.categories;
        if (obj.channels) channels = obj.channels;
        if (obj.tags) tags = obj.tags;
        if (obj.assets) assetsCache = obj.assets;
        if (obj.hiddenColumns) hiddenColumns = obj.hiddenColumns;
        if (obj.columnOrder) columnOrder = obj.columnOrder;
        if (obj.columns) allColumns = obj.columns;
        syncToServer(true);
        renderList(); renderChannelList(); renderTagList(); renderColumnToggles();
        alert('导入成功！');
      } catch (err) { alert('导入失败：格式错误'); }
    };
    reader.readAsText(file, 'utf-8');
  });

  viewDataBtn.addEventListener('click', ()=>{
    fetch('/api/data').then(r=>r.json()).then(d=>{
      const overlay=document.createElement('div'); overlay.className='overlay';
      const modal=document.createElement('div'); modal.className='modal'; modal.style.maxWidth='90%'; modal.style.width='600px';
      const pre=document.createElement('pre'); pre.style.maxHeight='70vh'; pre.style.overflow='auto'; pre.textContent=JSON.stringify(d,null,2);
      const btn=document.createElement('button'); btn.textContent='关闭'; btn.className='btn-like btn-small btn-danger'; btn.onclick=()=>document.body.removeChild(overlay);
      modal.appendChild(pre); modal.appendChild(btn); overlay.appendChild(modal); document.body.appendChild(overlay);
    });
  });

  resetDataBtn.addEventListener('click', ()=>{
    if(!confirm('确定重置？此操作不可撤销')) return;
    fetch('/api/reset', {method:'POST'}).then(r=>r.json()).then(()=>{ alert('已重置'); location.reload(); });
  });

  if(fixDataBtn){
    fixDataBtn.addEventListener('click', ()=>{
      if(!confirm('校验附件引用并删除无效文件？')) return;
      fetch('/api/fix',{method:'POST'}).then(r=>r.json()).then(d=>{
          alert(`修复完成：清理引用 ${d.cleaned||0}, 删除文件 ${d.deleted||0}`);
          location.reload();
      });
    });
  }

  if(backupDataBtn){
    backupDataBtn.addEventListener('click', ()=>{
      if(!confirm('立即备份？')) return;
      fetch('/api/backup',{method:'POST'}).then(r=>r.json()).then(d=>{
          alert(d.ok ? '备份成功: '+d.file : '失败: '+d.message);
      });
    });
  }
  
  if(autoBackupDaysInput){
    fetch('/api/backup-config').then(r=>r.json()).then(cfg=>{ autoBackupDaysInput.value = cfg.days||0; });
    const send = async()=>{
      let days = parseInt(autoBackupDaysInput.value,10);
      if(isNaN(days)||days<0) days=0;
      await fetch('/api/backup-config',{method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({days})});
    };
    autoBackupDaysInput.addEventListener('change', send);
  }

  // 列管理新增/删除
  addColumnBtn.addEventListener('click', ()=>{
    openAddModal('新增列', '列键名 (key)', (val)=>{
      const label = prompt('请输入列显示名称', val);
      if(!label) return;
      allColumns.push({key:val, label:label, type:'text'}); 
      columnOrder.push(val);
      syncToServer(); renderColumnToggles();
    });
  });

  deleteColumnBtn.addEventListener('click', ()=>{
     // 过滤掉基础列，防止误删核心数据
     const safeCols = allColumns.filter(c => !['name','category','amount','date','channel','subcategory','image','action'].includes(c.key));
     openDeleteModal(safeCols.map(c=>c.key), (key)=>{
        allColumns = allColumns.filter(c=>c.key!==key);
        columnOrder = columnOrder.filter(k=>k!==key);
        hiddenColumns = hiddenColumns.filter(k=>k!==key);
        syncToServer(); renderColumnToggles();
     });
  });

  // 初次渲染
  renderList();
  renderChannelList();
  renderTagList();
  renderColumnToggles();

})();