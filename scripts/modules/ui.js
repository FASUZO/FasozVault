/**
 * scripts/modules/ui.js
 * 通用 UI 组件库：提取自原版 assets.js，保持样式和交互完全一致
 */

// SVG 图标（复用原版）
export const Icons = {
    EDIT: `<svg viewBox="0 0 1024 1024" width="24" height="24"><path d="M252.3 743.3l235.8-42.4-147.8-179.1zM365.2 501.4l148.2 178.8L868.3 389 720.2 210.2zM958 259.7l-92.6-111.9c-15.1-18.4-43.7-20.3-63.7-4.2l-53.9 44 148.1 179.1 53.9-44c19.6-16.1 23.3-44.6 8.2-63z" fill="#2867CE"></path><path d="M770.1 893.7H259.6c-93.1 0-168.5-75.5-168.5-168.5V345.4c0-93.1 75.5-168.5 168.5-168.5h49.6c26.6 0 48.1 21.5 48.1 48.1s-21.5 48.1-48.1 48.1h-49.6c-40 0-72.4 32.4-72.4 72.4v379.8c0 40 32.4 72.4 72.4 72.4h510.5c40 0 72.4-32.4 72.4-72.4v-132c0-26.6 21.5-48.1 48.1-48.1s48.1 21.5 48.1 48.1v132c-0.1 93-75.5 168.4-168.6 168.4z" fill="#BDD2EF"></path></svg>`,
    VIEW: `<svg viewBox="0 0 1024 1024" width="20" height="20"><path d="M743.367111 544.711111a227.555556 227.555556 0 0 1 179.996445 366.762667l62.805333 62.862222a28.444444 28.444444 0 0 1-40.277333 40.220444l-62.691556-62.748444a227.555556 227.555556 0 1 1-139.832889-407.096889z m15.075556-516.323555A151.722667 151.722667 0 0 1 910.222222 180.110222l-1.820444 360.448a284.444444 284.444444 0 0 0-342.584889 453.973334l-356.522667-0.113778A151.722667 151.722667 0 0 1 57.457778 842.752V180.110222A151.722667 151.722667 0 0 1 209.237333 28.387556h549.205334z m-102.456889 600.120888c-52.167111 17.066667-94.890667 83.512889-94.890667 137.784889 0 61.952 50.801778 131.242667 112.412445 133.233778-40.504889-27.192889-67.356444-89.770667-67.356445-137.614222 0-49.152 13.710222-109.397333 49.834667-133.404445zM361.528889 682.666667H198.371556a28.444444 28.444444 0 0 0-5.12 56.433777l5.12 0.455112h163.157333a28.444444 28.444444 0 1 0 0-56.888889zM475.591111 455.111111H198.371556a28.444444 28.444444 0 0 0-5.12 56.433778l5.12 0.455111H475.591111a28.444444 28.444444 0 1 0 0-56.888889z m292.408889-227.555555H198.371556a28.444444 28.444444 0 0 0-5.12 56.433777l5.12 0.455111H768a28.444444 28.444444 0 1 0 0-56.888888z" fill="#8598C4"></path></svg>`
};

/**
 * 创建顶部开关栏 (保持原版 DOM 结构和类名)
 * @param {Array} items - 配置项数组
 * @returns {HTMLElement}
 */
export function createSwitchBar(items) {
    // 移除旧的（防止重复）
    const oldBar = document.querySelector('.switch-bar');
    if (oldBar) oldBar.remove();

    const switchBar = document.createElement('div');
    switchBar.className = 'switch-bar';
    document.body.appendChild(switchBar);

    // 辅助：创建图标按钮
    const addBtn = (icon, title, onClick) => {
        const btn = document.createElement('button');
        btn.className = 'icon-btn';
        btn.textContent = icon;
        if (title) btn.title = title;
        if (onClick) btn.addEventListener('click', onClick);
        switchBar.appendChild(btn);
        return btn;
    };

    // 1. 折叠按钮 (始终第一个)
    const toggleBtn = addBtn('⏴', '折叠/展开', () => {
        const collapsed = switchBar.classList.toggle('collapsed');
        toggleBtn.textContent = collapsed ? '⏵' : '⏴';
    });
    toggleBtn.classList.add('toggle-btn');

    // 2. 添加其他项
    items.forEach(item => {
        if (item.element) {
            // 自定义 DOM 元素 (如搜索框)
            switchBar.appendChild(item.element);
        } else {
            // 标准按钮
            const btn = addBtn(item.icon, item.title, item.onClick);
            if (item.onInit) item.onInit(btn);
        }
    });

    return switchBar;
}

/**
 * 创建通用模态框 (复用原版 DOM 结构)
 * @param {string} title 标题
 * @param {string} width 宽度 (如 '600px')
 * @returns {Object} { overlay, modal, body, close() }
 */
export function createModal(title, width = '600px') {
    const overlay = document.createElement('div');
    overlay.className = 'overlay';
    
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.width = width;
    modal.style.maxHeight = '90vh';
    modal.style.overflowY = 'auto'; // 保持原版滚动行为

    const h3 = document.createElement('h3');
    h3.textContent = title;
    modal.appendChild(h3);

    const body = document.createElement('div');
    body.className = 'modal-body'; // 保持原版类名
    modal.appendChild(body);

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    const close = () => {
        if (document.body.contains(overlay)) {
            document.body.removeChild(overlay);
        }
    };

    // 点击遮罩关闭 (可选，原版似乎有的有有的没有，这里加上增加便利性)
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) close();
    });

    return { overlay, modal, body, close };
}

/**
 * 显示右键菜单 (逻辑优化版，处理边界溢出)
 */
export function showContextMenu(event, items) {
    // 移除旧菜单
    const old = document.querySelector('.context-menu');
    if (old) old.remove();

    const menu = document.createElement('div');
    menu.className = 'context-menu';

    items.forEach(item => {
        if (item.divider) {
            const div = document.createElement('div');
            div.style.cssText = 'height: 1px; background: #e0e0e0; margin: 4px 0;';
            menu.appendChild(div);
            return;
        }

        const div = document.createElement('div');
        div.className = 'context-menu-item';
        div.textContent = (item.icon ? item.icon + ' ' : '') + item.text;
        div.style.cssText = 'padding: 8px 16px; cursor: pointer; user-select: none;';
        
        div.addEventListener('mouseenter', () => div.style.backgroundColor = '#f5f5f5');
        div.addEventListener('mouseleave', () => div.style.backgroundColor = '');
        
        div.addEventListener('click', (e) => {
            e.stopPropagation();
            menu.remove();
            if (item.onClick) item.onClick();
        });
        menu.appendChild(div);
    });

    // 定位逻辑
    let left = event.clientX;
    let top = event.clientY;
    if (event.touches && event.touches[0]) {
        left = event.touches[0].clientX;
        top = event.touches[0].clientY;
    }

    // 防止溢出屏幕
    if (left + 150 > window.innerWidth) left = window.innerWidth - 160;
    if (top + items.length * 40 > window.innerHeight) top = window.innerHeight - items.length * 40;

    menu.style.cssText += `position: fixed; left: ${left}px; top: ${top}px; z-index: 2000;`;
    
    // 暗黑模式适配 (简单处理，主要样式在 main.css)
    if (document.body.classList.contains('dark')) {
        menu.style.background = '#2a2a2a';
        menu.style.borderColor = '#444';
        menu.style.color = '#e0e0e0';
    }

    document.body.appendChild(menu);

    // 点击外部关闭
    setTimeout(() => {
        const closer = () => {
            if (document.body.contains(menu)) menu.remove();
            document.removeEventListener('click', closer);
        };
        document.addEventListener('click', closer);
    }, 100);
}

/**
 * Toast 提示封装
 */
export function showToast(msg) {
    if (window.showToast) window.showToast(msg);
    else alert(msg); // 降级处理
}