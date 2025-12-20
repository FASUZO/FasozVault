/**
 * FasozVault - 全站通用脚本
 * 功能：导航栏生成、首页时钟、主题切换、字体缩放、全局右键菜单
 * 
 * 使用页面：所有页面（index.html、pages/*.html）
 */

const navItems = [
  { href: '/index.html', label: '首页' },
  { href: '/pages/assets.html', label: '资产' },
  { href: '/pages/planning.html', label: '规划' },
  { href: '/pages/management.html', label: '管理' }
];

function buildNav() {
  let nav = document.querySelector('nav');
  if (!nav) {
    nav = document.createElement('nav');
    document.body.appendChild(nav);
  }
  // 读取主题
  const isDark = localStorage.getItem('theme') === 'dark';
  document.body.classList.toggle('dark', isDark);
  console.debug('[common] apply theme', isDark ? 'dark' : 'light');
  const currentPath = location.pathname.replace(/\\/g, '/'); // 兼容 Windows 路径
  nav.innerHTML = navItems
    .map(item => {
      const active = currentPath === item.href || currentPath.endsWith(item.href.replace(/^\//, ''));
      return `<a href="${item.href}" ${active ? 'aria-current="page" class="active"' : ''}>${item.label}</a>`;
    })
    .join('');
}

function setupClock() {
  const clockEl = document.getElementById('clock');
  const dateEl = document.getElementById('date');
  if (!clockEl || !dateEl) return; // 只有首页才有时钟元素

  const pad = n => n.toString().padStart(2, '0');
  const cnWeek = ['日', '一', '二', '三', '四', '五', '六'];
  const update = () => {
    const now = new Date();
    clockEl.textContent = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
    dateEl.textContent = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} 星期${cnWeek[now.getDay()]}`;
  };
  update();
  setInterval(update, 1000);
}

/* ---------- 立即应用全站设置（避免页面闪烁） ---------- */
// 这些设置可以在脚本加载时立即应用，不需要等待 DOM 加载完成
(function applyGlobalSettings() {
  /* 全站字体缩放 */
  const ZOOM_KEY = 'siteZoom';
  const storedZoom = parseInt(localStorage.getItem(ZOOM_KEY) || '100', 10);
  if (!isNaN(storedZoom) && storedZoom >= 80 && storedZoom <= 150) {
    document.documentElement.style.setProperty('--site-zoom', storedZoom + '%');
  }
  
  /* 全站主区域宽度 */
  const MAIN_WIDTH_KEY = 'mainWidth';
  const storedWidth = localStorage.getItem(MAIN_WIDTH_KEY);
  if(storedWidth){
    const width = parseInt(storedWidth, 10);
    if(!isNaN(width) && width >= 600 && width <= 2400){
      document.documentElement.style.setProperty('--main-max-width', width + 'px');
      console.debug('[common] apply main width', width + 'px');
    }
  }
})();

document.addEventListener('DOMContentLoaded', () => {
  buildNav();
  setupClock();

  if(!window.setFontScale){
    window.setFontScale = function(pct){
      pct = parseInt(pct,10);
      if(isNaN(pct)) return; pct = Math.max(80, Math.min(150, pct));
      localStorage.setItem(ZOOM_KEY, pct);
      document.documentElement.style.setProperty('--site-zoom', pct + '%');
      console.info('Site zoom set', pct);
    };
  }
  
  /* ---------- 全局右键菜单（方案选择） ---------- */
  initGlobalContextMenu();
});

/* ---------- 全局右键菜单初始化 ---------- */
function initGlobalContextMenu(){
  // 方案选择：从localStorage读取用户选择的方案，默认为方案1
  const menuType = localStorage.getItem('globalContextMenuType') || '1';
  
  switch(menuType){
    case '1':
      // 方案1：完全禁用浏览器右键菜单（最简单）
      document.addEventListener('contextmenu', (e) => {
        e.preventDefault();
      });
      break;
      
    case '2':
      // 方案2：自定义全局右键菜单（基础功能）
      setupGlobalContextMenu(['refresh', 'settings', 'theme']);
      break;
      
    case '3':
      // 方案3：自定义全局右键菜单（完整功能）
      setupGlobalContextMenu(['refresh', 'settings', 'theme', 'zoom', 'about']);
      break;
      
    case '4':
      // 方案4：智能右键菜单（表格区域显示表格菜单，其他区域显示全局菜单）
      setupSmartContextMenu();
      break;
      
    default:
      // 默认：完全禁用
      document.addEventListener('contextmenu', (e) => {
        e.preventDefault();
      });
  }
}

/* ---------- 方案2/3：自定义全局右键菜单 ---------- */
function setupGlobalContextMenu(features = []){
  let globalMenu = null;
  
  document.addEventListener('contextmenu', (e) => {
    // 如果点击的是输入框、选择框、按钮或已有自定义菜单的元素，不处理
    const target = e.target;
    if(target.tagName === 'INPUT' || target.tagName === 'SELECT' || 
       target.tagName === 'BUTTON' || target.closest('button') ||
       target.closest('.context-menu') || target.closest('table tbody tr')){
      return; // 允许默认行为或让其他菜单处理
    }
    
    e.preventDefault();
    showGlobalContextMenu(e, features);
  });
  
  function showGlobalContextMenu(e, features){
    // 移除已存在的菜单
    if(globalMenu){
      document.body.removeChild(globalMenu);
      globalMenu = null;
    }
    
    // 创建菜单
    globalMenu = document.createElement('div');
    globalMenu.className = 'context-menu global-context-menu';
    
    // 计算位置
    const menuWidth = 160;
    const menuHeight = features.length * 40 + 20;
    let left = e.clientX;
    let top = e.clientY;
    
    if(left + menuWidth > window.innerWidth) left = window.innerWidth - menuWidth - 10;
    if(top + menuHeight > window.innerHeight) top = window.innerHeight - menuHeight - 10;
    
    globalMenu.style.cssText = `position: fixed; left: ${left}px; top: ${top}px; z-index: 2000;`;
    
    // 根据功能添加菜单项
    if(features.includes('refresh')){
      const item = createMenuItem('🔄 刷新页面', () => {
        location.reload();
      });
      globalMenu.appendChild(item);
    }
    
    if(features.includes('settings')){
      const item = createMenuItem('⚙️ 设置', () => {
        // 触发设置弹窗（如果存在）
        const settingsBtn = document.querySelector('.switch-bar .icon-btn[title="设置"]');
        if(settingsBtn) settingsBtn.click();
        closeMenu();
      });
      globalMenu.appendChild(item);
    }
    
    if(features.includes('theme')){
      const item = createMenuItem(document.body.classList.contains('dark') ? '🌕 浅色模式' : '🌙 暗黑模式', () => {
        const isDark = document.body.classList.contains('dark');
        document.body.classList.toggle('dark', !isDark);
        localStorage.setItem('theme', !isDark ? 'dark' : 'light');
        closeMenu();
      });
      globalMenu.appendChild(item);
    }
    
    if(features.includes('zoom')){
      const zoomWrap = document.createElement('div');
      zoomWrap.className = 'context-menu-item';
      zoomWrap.style.cssText = 'padding: 8px 16px; display: flex; align-items: center; justify-content: space-between;';
      
      const zoomLabel = document.createElement('span');
      zoomLabel.textContent = '🔍 字体缩放';
      
      const zoomControls = document.createElement('div');
      zoomControls.style.cssText = 'display: flex; gap: 4px; align-items: center;';
      
      const zoomOut = document.createElement('button');
      zoomOut.textContent = '-';
      zoomOut.style.cssText = 'width: 20px; height: 20px; border: 1px solid #ddd; background: #fff; border-radius: 2px; cursor: pointer;';
      zoomOut.onclick = (e) => {
        e.stopPropagation();
        const current = parseInt(localStorage.getItem('siteZoom') || '100', 10);
        const newZoom = Math.max(80, current - 10);
        localStorage.setItem('siteZoom', newZoom);
        document.documentElement.style.setProperty('--site-zoom', newZoom + '%');
      };
      
      const zoomIn = document.createElement('button');
      zoomIn.textContent = '+';
      zoomIn.style.cssText = 'width: 20px; height: 20px; border: 1px solid #ddd; background: #fff; border-radius: 2px; cursor: pointer;';
      zoomIn.onclick = (e) => {
        e.stopPropagation();
        const current = parseInt(localStorage.getItem('siteZoom') || '100', 10);
        const newZoom = Math.min(150, current + 10);
        localStorage.setItem('siteZoom', newZoom);
        document.documentElement.style.setProperty('--site-zoom', newZoom + '%');
      };
      
      zoomControls.appendChild(zoomOut);
      zoomControls.appendChild(zoomIn);
      zoomWrap.appendChild(zoomLabel);
      zoomWrap.appendChild(zoomControls);
      globalMenu.appendChild(zoomWrap);
    }
    
    if(features.includes('about')){
      const divider = document.createElement('div');
      divider.style.cssText = 'height: 1px; background: #e0e0e0; margin: 4px 0;';
      globalMenu.appendChild(divider);
      
      const item = createMenuItem('ℹ️ 关于', () => {
        alert('资产管理系统\n\n版本: 1.0\n作者: Your Name');
        closeMenu();
      });
      globalMenu.appendChild(item);
    }
    
    document.body.appendChild(globalMenu);
    
    function createMenuItem(text, onClick){
      const item = document.createElement('div');
      item.className = 'context-menu-item';
      item.textContent = text;
      item.style.cssText = 'padding: 8px 16px; cursor: pointer; user-select: none;';
      item.addEventListener('mouseenter', () => item.style.backgroundColor = '#f5f5f5');
      item.addEventListener('mouseleave', () => item.style.backgroundColor = '');
      item.addEventListener('click', () => {
        onClick();
        closeMenu();
      });
      return item;
    }
    
    function closeMenu(){
      if(globalMenu){
        document.body.removeChild(globalMenu);
        globalMenu = null;
      }
    }
    
    // 点击其他地方关闭
    setTimeout(() => {
      const closeHandler = (event) => {
        if(globalMenu && !globalMenu.contains(event.target)){
          closeMenu();
          document.removeEventListener('click', closeHandler);
          document.removeEventListener('contextmenu', closeHandler);
        }
      };
      document.addEventListener('click', closeHandler);
      document.addEventListener('contextmenu', closeHandler);
    }, 100);
  }
}

/* ---------- 方案4：智能右键菜单（表格区域显示表格菜单，其他区域显示全局菜单） ---------- */
function setupSmartContextMenu(){
  let globalMenu = null;
  
  document.addEventListener('contextmenu', (e) => {
    const target = e.target;
    
    // 如果点击的是输入框、选择框、按钮，不处理
    if(target.tagName === 'INPUT' || target.tagName === 'SELECT' || 
       target.tagName === 'BUTTON' || target.closest('button') ||
       target.closest('.context-menu')){
      return;
    }
    
    // 如果点击的是表格行，让表格的右键菜单处理
    if(target.closest('table tbody tr')){
      return; // 不阻止，让表格的右键菜单处理
    }
    
    e.preventDefault();
    
    // 显示全局右键菜单
    showGlobalContextMenu(e, ['refresh', 'settings', 'theme', 'zoom']);
  });
  
  function showGlobalContextMenu(e, features){
    // 移除已存在的菜单
    if(globalMenu){
      document.body.removeChild(globalMenu);
      globalMenu = null;
    }
    
    // 创建菜单（复用方案2/3的代码）
    globalMenu = document.createElement('div');
    globalMenu.className = 'context-menu global-context-menu';
    
    const menuWidth = 160;
    const menuHeight = features.length * 40 + 20;
    let left = e.clientX;
    let top = e.clientY;
    
    if(left + menuWidth > window.innerWidth) left = window.innerWidth - menuWidth - 10;
    if(top + menuHeight > window.innerHeight) top = window.innerHeight - menuHeight - 10;
    
    globalMenu.style.cssText = `position: fixed; left: ${left}px; top: ${top}px; z-index: 2000;`;
    
    // 添加菜单项（简化版）
    if(features.includes('refresh')){
      const item = document.createElement('div');
      item.className = 'context-menu-item';
      item.textContent = '🔄 刷新页面';
      item.style.cssText = 'padding: 8px 16px; cursor: pointer; user-select: none;';
      item.addEventListener('mouseenter', () => item.style.backgroundColor = '#f5f5f5');
      item.addEventListener('mouseleave', () => item.style.backgroundColor = '');
      item.addEventListener('click', () => {
        location.reload();
        closeMenu();
      });
      globalMenu.appendChild(item);
    }
    
    if(features.includes('settings')){
      const item = document.createElement('div');
      item.className = 'context-menu-item';
      item.textContent = '⚙️ 设置';
      item.style.cssText = 'padding: 8px 16px; cursor: pointer; user-select: none;';
      item.addEventListener('mouseenter', () => item.style.backgroundColor = '#f5f5f5');
      item.addEventListener('mouseleave', () => item.style.backgroundColor = '');
      item.addEventListener('click', () => {
        const settingsBtn = document.querySelector('.switch-bar .icon-btn[title="设置"]');
        if(settingsBtn) settingsBtn.click();
        closeMenu();
      });
      globalMenu.appendChild(item);
    }
    
    if(features.includes('theme')){
      const item = document.createElement('div');
      item.className = 'context-menu-item';
      item.textContent = document.body.classList.contains('dark') ? '🌕 浅色模式' : '🌙 暗黑模式';
      item.style.cssText = 'padding: 8px 16px; cursor: pointer; user-select: none;';
      item.addEventListener('mouseenter', () => item.style.backgroundColor = '#f5f5f5');
      item.addEventListener('mouseleave', () => item.style.backgroundColor = '');
      item.addEventListener('click', () => {
        const isDark = document.body.classList.contains('dark');
        document.body.classList.toggle('dark', !isDark);
        localStorage.setItem('theme', !isDark ? 'dark' : 'light');
        closeMenu();
      });
      globalMenu.appendChild(item);
    }
    
    document.body.appendChild(globalMenu);
    
    function closeMenu(){
      if(globalMenu){
        document.body.removeChild(globalMenu);
        globalMenu = null;
      }
    }
    
    setTimeout(() => {
      const closeHandler = (event) => {
        if(globalMenu && !globalMenu.contains(event.target)){
          closeMenu();
          document.removeEventListener('click', closeHandler);
          document.removeEventListener('contextmenu', closeHandler);
        }
      };
      document.addEventListener('click', closeHandler);
      document.addEventListener('contextmenu', closeHandler);
    }, 100);
  }
}

/* -------- 轻量级全局提示 -------- */
if(!window.showToast){
  window.showToast = function(msg,duration=2000){
    const el=document.createElement('div');
    el.className='toast';
    if(document.body.classList.contains('dark')) el.classList.add('dark');
    el.textContent=msg;
    document.body.appendChild(el);
    // 触发过渡
    requestAnimationFrame(()=> el.classList.add('show'));
    setTimeout(()=>{
      el.classList.remove('show');
      setTimeout(()=> el.remove(),300);
    }, duration);
  };
} 