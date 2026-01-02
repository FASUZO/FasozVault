/**
 * scripts/pages/assets.js
 * 资产管理页面 - 视图层 (View) - 最终修复版 (UI/UX 优化)
 * * 修复：下拉框文字对齐
 * * 修复：暗黑模式适配
 * * 修复：组合资产勾选框垂直居中对齐，文字修改为“组合资产”
 */

import { logInfo, logDebug } from '../utils/debug.js';
import { formatTwoDecimal, generateUniqueId } from '../utils/assets-utils.js';
import { filterAsset } from '../modules/filter.js';
import { isComponentAsset, getComponentDetails } from '../modules/composite-assets.js';
import { assetStore } from '../modules/store.js';

// --- CSS 样式注入 ---
const STYLE_INJECTION = `
<style>
    /* 下拉框文字对齐修正 */
    .modal-body select {
        height: 34px; 
        line-height: normal; 
        padding: 0 8px; 
    }
    
    /* 链接芯片 */
    .link-chip {
        font-size: 11px;
        margin-left: 6px;
        background: #e3f2fd;
        color: #1565c0;
        border-radius: 4px;
        padding: 2px 6px;
        cursor: help;
        display: inline-block;
        vertical-align: middle;
    }

    /* 标签编辑器容器 */
    .tag-editor-container {
        flex: 1;
        border: 1px solid #ccc;
        border-radius: 4px;
        padding: 4px;
        min-height: 34px;
        display: flex;
        flex-wrap: wrap;
        gap: 4px;
        background: #fff;
    }

    /* 暗黑模式适配 */
    body.dark .modal { background: #2d2d2d; color: #e0e0e0; border: 1px solid #444; }
    body.dark .modal h3 { color: #fff; border-bottom-color: #444; }
    body.dark .modal-body { color: #ccc; }
    
    body.dark .modal input, 
    body.dark .modal select, 
    body.dark .tag-editor-container {
        background-color: #333 !important;
        color: #eee !important;
        border-color: #555 !important;
    }
    
    body.dark .link-chip { background: #1a3c5a; color: #90caf9; }
    
    body.dark .context-menu {
        background: #2d2d2d !important;
        border: 1px solid #444 !important;
        box-shadow: 0 4px 12px rgba(0,0,0,0.5) !important;
    }
    body.dark .context-menu-item { color: #eee; }
    body.dark .context-menu-item:hover { background-color: #3d3d3d !important; }
    body.dark .context-menu hr { background: #444; }

    body.dark tr[data-used="true"] { background-color: #333 !important; color: #999 !important; }
    
    body.dark .btn-tab { color: #999; }
    body.dark .btn-tab.active { color: #64b5f6 !important; border-bottom-color: #64b5f6 !important; }

    body.dark .comp-list-container { background: #333 !important; border-color: #444 !important; }
    body.dark .comp-list-row { border-bottom-color: #444 !important; }
    body.dark .comp-list-header { border-bottom-color: #444 !important; color: #aaa !important; }
</style>
`;

// --- 配置区域 ---
const COMPONENT_DISPLAY_FIELDS = [
    { key: 'purchasePrice', label: '价格', width: '80px', align: 'right' },
    { key: 'channel', label: '渠道', width: '80px', align: 'center' }
];

(async function () {
    // --- 0. 注入样式 ---
    document.head.insertAdjacentHTML('beforeend', STYLE_INJECTION);

    // --- 1. 全局引用 ---
    const tableBody = document.querySelector('#assetsTable tbody');
    const tableHead = document.querySelector('#assetsTable thead tr');
    const assetsTable = document.getElementById('assetsTable');
    const addRowBtn = document.getElementById('addRowBtn');

    // --- 2. 状态管理 ---
    let currentTab = localStorage.getItem('assetsLastTab') || 'composite'; 
    let showUsedComponents = localStorage.getItem('showUsedComponents') === 'true';

    let searchKeyword = '';
    let filterCriteria = {
        category: '', channel: '', tag: '',
        dateFrom: '', dateTo: '', amountMin: '', amountMax: ''
    };
    let sortStatus = JSON.parse(localStorage.getItem('assetSort') || '{}');
    let autoSaveEnabled = localStorage.getItem('autoSave') === 'true';

    // --- 3. 初始化 ---
    try {
        await assetStore.init();
        setupUI();
        renderTable();
        
        assetStore.subscribe(() => {
            logDebug('Store updated, re-rendering table...');
            renderTable();
        });
    } catch (e) {
        console.error('Initialization failed:', e);
        if(window.showToast) window.showToast('数据加载失败，请刷新页面');
    }

    function setupUI() {
        initTopBar();
        initTabs(); 
        setupTableHeaders();
        
        if(addRowBtn) {
            addRowBtn.addEventListener('click', () => openAssetModal(null));
        }
        
        document.addEventListener('click', closeContextMenu);
        document.addEventListener('contextmenu', (e) => {
            if (!e.target.closest('tr')) closeContextMenu();
        });
    }

    // --- 4. Tab 切换逻辑 ---
    function initTabs() {
        const wrapper = document.querySelector('.table-wrapper') || assetsTable.parentNode;
        let tabContainer = document.querySelector('.asset-tabs');
        if(!tabContainer) {
            tabContainer = document.createElement('div');
            tabContainer.className = 'asset-tabs';
            tabContainer.style.cssText = 'display:flex; gap:10px; margin-bottom:15px; border-bottom:1px solid #ddd; padding-bottom:0;';
            wrapper.insertBefore(tabContainer, assetsTable);
        }
        
        tabContainer.innerHTML = '';
        
        const createTab = (key, label, icon) => {
            const btn = document.createElement('button');
            btn.innerHTML = `${icon} ${label}`;
            const isActive = currentTab === key;
            btn.className = isActive ? 'btn-tab active' : 'btn-tab';
            btn.style.cssText = `
                padding: 10px 20px; 
                background: transparent; 
                border: none; 
                border-bottom: 3px solid ${isActive ? '#1976d2' : 'transparent'};
                color: ${isActive ? '#1976d2' : '#666'};
                font-weight: ${isActive ? 'bold' : 'normal'};
                cursor: pointer;
                font-size: 15px;
                transition: all 0.2s;
            `;
            btn.onclick = () => {
                currentTab = key;
                localStorage.setItem('assetsLastTab', key);
                initTabs(); 
                initTopBar(); 
                renderTable();
            };
            tabContainer.appendChild(btn);
        };

        createTab('composite', '组合资产 (成品)', '📦');
        createTab('individual', '零散资产 (零件)', '🔩');
    }

    // --- 5. 核心渲染逻辑 ---
    function renderTable() {
        tableBody.innerHTML = '';
        const allAssets = assetStore.getAssets(); 

        // 5.1 第一层过滤：Tab 分组
        let filtered = allAssets.filter(asset => {
            if (currentTab === 'composite') {
                return asset.isComposite === true;
            } else {
                if (asset.isComposite) return false;
                if (!showUsedComponents) {
                    const isUsed = isComponentAsset(asset, allAssets);
                    if (isUsed) return false;
                }
                return true;
            }
        });

        // 5.2 第二层过滤
        filtered = filtered.filter(asset => filterAsset(asset, {
            searchKeyword,
            filterCriteria,
            showComponentAssets: true, 
            isComponentAsset: () => false 
        }));

        // 5.3 排序
        filtered.sort((a, b) => {
            if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
            if (a.pinned) return (b.pinnedTime || 0) - (a.pinnedTime || 0);

            if (sortStatus.key) {
                const valA = a[sortStatus.key] || '';
                const valB = b[sortStatus.key] || '';
                const cmp = (!isNaN(parseFloat(valA)) && !isNaN(parseFloat(valB)))
                    ? parseFloat(valA) - parseFloat(valB)
                    : String(valA).localeCompare(String(valB));
                return sortStatus.asc ? cmp : -cmp;
            }
            return 0;
        });

        // 5.4 渲染
        if (filtered.length === 0) {
            const emptyTr = document.createElement('tr');
            emptyTr.innerHTML = `<td colspan="10" style="text-align:center; padding:30px; color:#999;">
                ${currentTab==='composite' ? '没有组合资产，请点击右上角新增' : '没有符合条件的零散资产'}
            </td>`;
            tableBody.appendChild(emptyTr);
        } else {
            filtered.forEach(asset => {
                const tr = createRow(asset);
                tableBody.appendChild(tr);
            });
        }

        applyColumnStyles(); 
    }

    // --- 6. 表头逻辑 ---
    function setupTableHeaders() {
        tableHead.innerHTML = '';
        const columns = assetStore.state.columnOrder;
        const meta = assetStore.state.columnsMeta;
        const labelMap = { name:'名称', category:'分类', subcategory:'标签', amount:'金额', date:'时间', channel:'购入渠道', image:'附件', note:'备注' };

        columns.forEach(key => {
            if(key === 'action') return;
            const th = document.createElement('th');
            const colDef = meta.find(c => c.key === key) || {};
            
            let label = labelMap[key] || colDef.label || key;
            if (key === 'amount' && currentTab === 'composite') label = '总价 (自动)';
            
            th.textContent = label;
            if (colDef.width) th.style.width = colDef.width + 'px';
            
            th.addEventListener('click', () => {
                if (window.__colResizing) return;
                const newAsc = (sortStatus.key === key) ? !sortStatus.asc : true;
                sortStatus = { key, asc: newAsc };
                localStorage.setItem('assetSort', JSON.stringify(sortStatus));
                renderTable();
            });

            const handle = document.createElement('span');
            handle.className = 'col-resize-handle';
            handle.addEventListener('mousedown', (e) => handleResize(e, th, key));
            th.appendChild(handle);
            tableHead.appendChild(th);
        });
        applyColumnWidths();
    }
    
    function handleResize(e, th, key) {
        e.preventDefault(); e.stopPropagation();
        const startX = e.clientX;
        const startW = th.offsetWidth;
        let moved = false;
        const onMove = (ev) => {
            const diff = ev.clientX - startX;
            th.style.width = Math.max(60, startW + diff) + 'px';
            if (Math.abs(diff) > 2) { moved = true; window.__colResizing = true; }
        };
        const onUp = () => {
            document.removeEventListener('mousemove', onMove);
            document.removeEventListener('mouseup', onUp);
            if (moved) {
                const meta = assetStore.state.columnsMeta;
                const col = meta.find(c => c.key === key);
                if(col) {
                    col.width = parseInt(th.style.width);
                    assetStore.saveToServer(true);
                }
                setTimeout(() => { window.__colResizing = false; }, 150);
            }
        };
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
    }
    
    function applyColumnWidths() {
        let hasCustom = false;
        const total = assetStore.state.columnOrder.reduce((acc,key)=>{
            if(key === 'action') return acc;
            const def = assetStore.state.columnsMeta.find(c=>c.key===key)||{};
            if(def.width){ hasCustom=true; acc += def.width; }
            return acc;
        },0);
        const wrapper = assetsTable.closest('.table-wrapper');
        if(wrapper && hasCustom && total > wrapper.clientWidth) assetsTable.style.minWidth = total + 'px'; 
        else assetsTable.style.minWidth = ''; 
    }

    function applyColumnStyles() {
        const hidden = assetStore.state.hiddenColumns || [];
        const columns = assetStore.state.columnOrder.filter(k => k !== 'action');
        columns.forEach((key, idx) => {
            const isHidden = hidden.includes(key);
            const th = tableHead.children[idx];
            if(th) th.classList.toggle('hidden-col', isHidden);
            const cells = tableBody.querySelectorAll(`tr td:nth-child(${idx + 1})`);
            cells.forEach(td => td.classList.toggle('hidden-col', isHidden));
        });
    }

    // --- 7. 行渲染 ---
    function createRow(asset) {
        const tr = document.createElement('tr');
        tr.dataset.id = asset.originId;
        bindContextMenu(tr, asset);
        setupMobileLongPress(tr, asset);

        // 检查占用情况
        const allAssets = assetStore.getAssets();
        const parentComposite = currentTab === 'individual' ? allAssets.find(p => p.isComposite && p.components.includes(asset.originId)) : null;

        if (parentComposite) {
            tr.style.backgroundColor = '#f4f6f8';
            tr.style.color = '#666';
            tr.dataset.used = "true"; 
        }

        const columns = assetStore.state.columnOrder.filter(k => k !== 'action');
        columns.forEach(key => {
            const td = document.createElement('td');
            switch (key) {
                case 'name': 
                    renderNameCell(td, asset, parentComposite); 
                    break;
                case 'image': renderImageCell(td, asset); break;
                case 'subcategory': renderTagsCell(td, asset); break;
                case 'date': 
                    if(asset.isComposite) {
                        td.innerHTML = '<span style="color:#999;cursor:help;">-----</span>';
                        addCompositeTooltip(td.querySelector('span'), asset, 'date');
                    } else {
                        td.textContent = asset.date ? asset.date.replace(/-/g, '').slice(2) : '';
                        td.classList.add('date-cell');
                    }
                    break;
                case 'channel':
                    if(asset.isComposite) {
                        td.innerHTML = '<span style="color:#999;cursor:help;">-----</span>';
                        addCompositeTooltip(td.querySelector('span'), asset, 'channel');
                    } else {
                        td.textContent = asset.channel || '';
                    }
                    break;
                case 'amount':
                case 'purchasePrice':
                    td.textContent = asset[key] || '';
                    if (asset.isComposite && key === 'amount') {
                        td.style.fontWeight = 'bold';
                        td.style.color = '#d32f2f';
                    }
                    break;
                case 'boolean':
                    const cb = document.createElement('input'); 
                    cb.type = 'checkbox'; cb.checked = !!asset[key]; cb.disabled = true;
                    td.appendChild(cb);
                    break;
                default:
                    td.textContent = asset[key] || '';
            }
            tr.appendChild(td);
        });
        return tr;
    }

    function renderNameCell(td, asset, parentComposite) {
        const span = document.createElement('span');
        span.textContent = asset.name;
        td.appendChild(span);

        if (parentComposite) {
            const link = document.createElement('span');
            link.className = 'link-chip'; 
            link.textContent = `🔗 ${parentComposite.name}`;
            link.title = `此零件属于组合资产: ${parentComposite.name}`;
            td.appendChild(link);
        }

        if (asset.pinned) {
            const pin = document.createElement('span');
            pin.textContent = '📌';
            pin.className = 'pin-badge';
            pin.style.cssText = 'margin-left:4px; color:#ff9800; cursor:pointer;';
            pin.title = '已置顶';
            pin.onclick = (e) => { e.stopPropagation(); assetStore.togglePin(asset.originId); };
            td.appendChild(pin);
        }

        if (asset.isComposite) {
            const badge = document.createElement('span');
            badge.className = 'composite-badge';
            badge.innerHTML = '<span class="badge-dot"></span>';
            badge.title = `组合资产 (${asset.components.length}个子资产)`;
            badge.onclick = (e) => { e.stopPropagation(); openCompositeDetailsModal(asset); };
            td.appendChild(badge);
        }
    }

    function renderImageCell(td, asset) {
        if (!asset.image) {
            td.innerHTML = '<span style="color:#ccc;font-size:12px">无</span>';
            return;
        }
        const img = document.createElement('img');
        img.src = asset.image;
        img.style.cssText = 'max-height:40px; max-width:60px; border-radius:4px; cursor:pointer; display:block;';
        img.onclick = (e) => { e.stopPropagation(); viewImage(asset.image); };
        td.appendChild(img);
    }

    function renderTagsCell(td, asset) {
        td.className = 'tag-cell';
        const tags = asset.subcategory || [];
        tags.forEach(t => {
            const chip = document.createElement('span');
            chip.className = 'chip';
            chip.textContent = t;
            td.appendChild(chip);
        });
    }

    function addCompositeTooltip(element, asset, field) {
        if(!element) return;
        element.addEventListener('mouseenter', () => {
            const allAssets = assetStore.getAssets();
            const details = getComponentDetails(asset, field, allAssets);
            if (!details.length) return;

            const tooltip = document.createElement('div');
            tooltip.className = 'composite-tooltip';
            tooltip.style.cssText = 'position:fixed; background:rgba(0,0,0,0.9); color:#fff; padding:8px; border-radius:4px; z-index:10000; font-size:12px; pointer-events:none; white-space:pre-line; box-shadow: 0 2px 8px rgba(0,0,0,0.2);';
            tooltip.textContent = details.map(d => `${d.name}: ${field === 'date' && d.value ? d.value.replace(/-/g, '').slice(2) : d.value}`).join('\n');
            const rect = element.getBoundingClientRect();
            tooltip.style.left = rect.left + 'px';
            tooltip.style.top = (rect.bottom + 5) + 'px';
            document.body.appendChild(tooltip);
            element._tooltip = tooltip;
        });
        element.addEventListener('mouseleave', () => {
            if (element._tooltip) { element._tooltip.remove(); element._tooltip = null; }
        });
    }

    // --- 8. 右键菜单 ---
    let contextMenu = null;
    function bindContextMenu(tr, asset) {
        tr.addEventListener('contextmenu', (e) => {
            if(['INPUT','SELECT','BUTTON'].includes(e.target.tagName)) return;
            e.preventDefault();
            showContextMenu(e, asset);
        });
    }

    function showContextMenu(e, asset) {
        closeContextMenu();
        contextMenu = document.createElement('div');
        contextMenu.className = 'context-menu'; 
        
        const addItem = (icon, text, onClick) => {
            const div = document.createElement('div');
            div.className = 'context-menu-item';
            div.textContent = `${icon} ${text}`;
            div.style.cssText = 'padding: 8px 16px; cursor: pointer; user-select: none;';
            div.onclick = (ev) => { ev.stopPropagation(); closeContextMenu(); onClick(); };
            contextMenu.appendChild(div);
        };

        addItem('✏️', '编辑', () => openAssetModal(asset.originId));
        addItem('👁️', '查看', () => openAssetModal(asset.originId, true));
        const hr = document.createElement('hr');
        hr.style.cssText = 'border:0; height:1px; background:#eee; margin:4px 0;';
        contextMenu.appendChild(hr);
        addItem('📌', asset.pinned ? '取消置顶' : '置顶', () => assetStore.togglePin(asset.originId));
        
        let left = e.clientX, top = e.clientY;
        if(left + 150 > window.innerWidth) left = window.innerWidth - 160;
        if(top + 150 > window.innerHeight) top = window.innerHeight - 160;

        contextMenu.style.cssText += `position:fixed; left:${left}px; top:${top}px; z-index:2000; background:white; box-shadow:0 2px 10px rgba(0,0,0,0.2); border-radius:4px; padding:4px 0; min-width:140px; border:1px solid #eee;`;
        document.body.appendChild(contextMenu);
    }

    function closeContextMenu() {
        if (contextMenu) { contextMenu.remove(); contextMenu = null; }
    }

    function setupMobileLongPress(element, asset) {
        let timer = null;
        const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
        if(!isMobile) return;
        element.addEventListener('touchstart', (e) => {
            timer = setTimeout(() => {
                const touch = e.touches[0];
                showContextMenu({ clientX: touch.clientX, clientY: touch.clientY }, asset);
            }, 500);
        });
        element.addEventListener('touchend', () => { if(timer) clearTimeout(timer); });
        element.addEventListener('touchmove', () => { if(timer) clearTimeout(timer); });
    }

    // --- 9. 顶部 Switch-Bar ---
    function initTopBar() {
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

        const toggleBtn = addBtn('⏴', '折叠/展开', () => {
            const collapsed = switchBar.classList.toggle('collapsed');
            toggleBtn.textContent = collapsed ? '⏵' : '⏴';
        });
        toggleBtn.classList.add('toggle-btn');
        
        if (currentTab === 'individual') {
            const showUsedBtn = document.createElement('button');
            showUsedBtn.className = showUsedComponents ? 'icon-btn active' : 'icon-btn';
            showUsedBtn.textContent = showUsedComponents ? '🐵' : '🙈'; 
            showUsedBtn.title = showUsedComponents ? '隐藏已组装的零件' : '显示已组装的零件';
            showUsedBtn.style.marginRight = '8px';
            showUsedBtn.onclick = () => {
                showUsedComponents = !showUsedComponents;
                localStorage.setItem('showUsedComponents', showUsedComponents);
                showUsedBtn.textContent = showUsedComponents ? '🐵' : '🙈';
                showUsedBtn.classList.toggle('active', showUsedComponents);
                showUsedBtn.title = showUsedComponents ? '隐藏已组装的零件' : '显示已组装的零件';
                renderTable(); 
            };
            switchBar.appendChild(showUsedBtn);
        }

        addBtn('💾', '保存', () => assetStore.saveToServer());
        const autoBtn = addBtn(autoSaveEnabled ? '🟢' : '🔴', '自动保存', () => {
            autoSaveEnabled = !autoSaveEnabled;
            localStorage.setItem('autoSave', autoSaveEnabled);
            autoBtn.textContent = autoSaveEnabled ? '🟢' : '🔴';
            autoBtn.classList.toggle('active', autoSaveEnabled);
            if(window.showToast) window.showToast(`自动保存已${autoSaveEnabled ? '开启' : '关闭'}`);
        });
        if(autoSaveEnabled) autoBtn.classList.add('active');

        let isDark = document.body.classList.contains('dark');
        const darkBtn = addBtn(isDark ? '🌙' : '🌕', '主题', () => {
            isDark = !isDark;
            document.body.classList.toggle('dark', isDark);
            localStorage.setItem('theme', isDark ? 'dark' : 'light');
            darkBtn.textContent = isDark ? '🌙' : '🌕';
        });

        addBtn('⚙️', '设置', openSettingsModal);
        
        const searchDiv = document.createElement('div');
        searchDiv.style.cssText = 'display:flex; align-items:center; margin-left:8px; gap:4px;';
        const searchInput = document.createElement('input');
        searchInput.placeholder = '搜索...';
        searchInput.style.cssText = 'padding:4px 8px; border:1px solid #ccc; border-radius:4px; font-size:14px; width:120px;';
        searchInput.addEventListener('input', (e) => {
            searchKeyword = e.target.value.trim();
            renderTable();
        });
        searchDiv.appendChild(searchInput);
        switchBar.appendChild(searchDiv);

        const filterBtn = addBtn('🔍', '筛选', openFilterModal);
        filterBtn.updateStatus = () => {
             const hasFilter = Object.values(filterCriteria).some(v => v) || searchKeyword;
             filterBtn.classList.toggle('active', !!hasFilter);
        };
    }

    // --- 10. 模态框逻辑 ---
    function openAssetModal(assetId, readonly = false) {
        let assetData;
        if (assetId) {
            assetData = assetStore.getAssetById(assetId);
            if (!assetData) return window.showToast ? window.showToast('资产未找到') : alert('资产未找到');
        } else {
            assetData = { 
                originId: generateUniqueId(new Set()), 
                category: '默认', channel: '默认', subcategory: [], components: [], 
                isComposite: currentTab === 'composite' 
            };
        }

        const isNew = !assetId;
        const overlay = document.createElement('div'); overlay.className = 'overlay';
        const modal = document.createElement('div'); modal.className = 'modal';
        
        modal.innerHTML = `<h3>${readonly ? '查看' : (isNew ? '新增' : '编辑')}资产</h3>`;
        const body = document.createElement('div'); body.className = 'modal-body';
        
        const formContainer = buildAssetForm(assetData, readonly, isNew, overlay);
        body.appendChild(formContainer);
        
        modal.appendChild(body);
        overlay.appendChild(modal);
        document.body.appendChild(overlay);
    }

    function buildAssetForm(assetData, readonly, isNew, overlay) {
        const container = document.createElement('div');
        const ROW_STYLE = 'margin-bottom:12px; display:flex; align-items:center;';
        const LABEL_STYLE = 'width:80px; font-weight:500; color:#555;';
        const INPUT_STYLE = 'flex:1; padding:6px 8px; border:1px solid #ccc; border-radius:4px; font-size:14px;';
        
        const createInput = (label, key, type='text') => {
            const row = document.createElement('div');
            row.style.cssText = ROW_STYLE;
            const lbl = document.createElement('label');
            lbl.textContent = label;
            lbl.style.cssText = LABEL_STYLE;
            
            let input;
            if(key === 'category' || key === 'channel') {
                input = document.createElement('select');
                input.style.cssText = INPUT_STYLE;
                const list = key === 'category' ? assetStore.state.categories : assetStore.state.channels;
                list.forEach(item => {
                    const opt = document.createElement('option');
                    opt.value = opt.textContent = item;
                    if(item === assetData[key]) opt.selected = true;
                    input.appendChild(opt);
                });
                if(!readonly) input.addEventListener('change', e => assetData[key] = e.target.value);
            } else if(key === 'subcategory') {
                input = document.createElement('div');
                input.className = 'tag-editor-container'; 
                const renderTags = () => {
                    input.innerHTML = '';
                    assetData.subcategory.forEach(tag => {
                        const chip = document.createElement('span');
                        chip.textContent = tag;
                        chip.className = 'chip';
                        if(!readonly) {
                            chip.style.cursor = 'pointer';
                            chip.title = '删除';
                            chip.onclick = () => {
                                assetData.subcategory = assetData.subcategory.filter(t => t !== tag);
                                renderTags();
                            };
                        }
                        input.appendChild(chip);
                    });
                    if(!readonly) {
                        const addBtn = document.createElement('span');
                        addBtn.className = 'chip plus';
                        addBtn.textContent = '＋';
                        addBtn.onclick = () => openTagPicker(assetData.subcategory, (newTag) => {
                            if(newTag && !assetData.subcategory.includes(newTag)) {
                                assetData.subcategory.push(newTag);
                                renderTags();
                            }
                        });
                        input.appendChild(addBtn);
                    }
                };
                renderTags();
            } else {
                input = document.createElement('input');
                input.type = type;
                input.style.cssText = INPUT_STYLE;
                input.value = assetData[key] || '';
                
                if (key === 'purchasePrice' && assetData.isComposite) {
                    input.disabled = true;
                    input.title = "组合资产价格由子资产自动累加";
                    input.style.background = "#f0f0f0";
                    input.placeholder = "自动计算...";
                }

                if(!readonly && !input.disabled) input.addEventListener('input', e => assetData[key] = e.target.value);
            }
            
            if(readonly && key !== 'subcategory') input.disabled = true;
            row.appendChild(lbl);
            row.appendChild(input);
            container.appendChild(row);
        };

        createInput('名称', 'name');
        createInput('分类', 'category');
        createInput('标签', 'subcategory');
        createInput('金额', 'purchasePrice', 'number');
        createInput('日期', 'purchaseDate', 'date');
        createInput('渠道', 'channel');
        createInput('备注', 'description');

        // --- 组合资产 (修正布局：Flex 居中) ---
        const compDiv = document.createElement('div');
        // 修正 1: 这里只负责垂直间距，不设 display:flex，以免影响下方的 listDiv
        compDiv.style.margin = '15px 0';

        // 新增: 一个专门的行容器，用于包裹 Checkbox 和 Label
        const checkboxRow = document.createElement('div');
        checkboxRow.style.cssText = 'display: flex; align-items: center; margin-bottom: 5px;';
        
        const cb = document.createElement('input'); cb.type='checkbox'; cb.id='isComp';
        cb.checked = assetData.isComposite;
        if(readonly) cb.disabled=true;
        
        const lb = document.createElement('label'); lb.htmlFor='isComp'; 
        lb.textContent=' 组合资产'; // 修正 2: 文字修改
        lb.style.cursor = 'pointer';
        
        checkboxRow.appendChild(cb);
        checkboxRow.appendChild(lb);
        compDiv.appendChild(checkboxRow);

        // 状态联动
        cb.addEventListener('change', e => {
            assetData.isComposite = e.target.checked;
            listDiv.style.display = e.target.checked ? 'block' : 'none';
            const priceInput = container.querySelector('input[type="number"]');
            if(priceInput) {
                priceInput.disabled = e.target.checked;
                priceInput.style.background = e.target.checked ? "#f0f0f0" : "";
            }
        });

        // 列表区域保持不变，但现在是添加在 compDiv 内部，位于 checkboxRow 下方
        const listDiv = document.createElement('div');
        listDiv.className = 'comp-list-container'; 
        listDiv.style.cssText = `border:1px solid #ddd; background:#f9f9f9; padding:10px; border-radius:4px; display:${assetData.isComposite?'block':'none'}`;
        
        const renderComps = () => {
            listDiv.innerHTML = '';
            // 表头
            const header = document.createElement('div');
            header.className = 'comp-list-header'; 
            header.style.cssText = 'display:flex; align-items:center; padding-bottom:6px; border-bottom:1px solid #eee; margin-bottom:6px; font-size:12px; color:#888;';
            const idxCol = document.createElement('div'); idxCol.textContent = '#'; idxCol.style.width = '30px';
            header.appendChild(idxCol);
            const nameCol = document.createElement('div'); nameCol.textContent = '资产名称'; nameCol.style.flex = '1';
            header.appendChild(nameCol);
            COMPONENT_DISPLAY_FIELDS.forEach(field => {
                const col = document.createElement('div'); 
                col.textContent = field.label;
                col.style.width = field.width || '80px';
                if(field.align) col.style.textAlign = field.align;
                header.appendChild(col);
            });
            const opCol = document.createElement('div'); opCol.textContent = ''; opCol.style.width = '30px';
            header.appendChild(opCol);
            listDiv.appendChild(header);

            if(assetData.components.length===0) {
                const empty = document.createElement('div');
                empty.textContent = '暂无子资产';
                empty.style.cssText = 'padding:10px; text-align:center; color:#999; font-size:13px;';
                listDiv.appendChild(empty);
            }
            
            assetData.components.forEach((cid, idx) => {
                const child = assetStore.getAssetById(cid) || { name: '未知资产(已删除)' };
                const row = document.createElement('div');
                row.className = 'comp-list-row'; 
                row.style.cssText = 'display:flex; align-items:center; padding:6px 0; border-bottom:1px dashed #eee; font-size:13px;';
                
                const idxCell = document.createElement('div'); idxCell.textContent = idx+1; idxCell.style.width = '30px';
                row.appendChild(idxCell);
                const nameCell = document.createElement('div'); nameCell.textContent = child.name; nameCell.style.flex = '1';
                row.appendChild(nameCell);
                COMPONENT_DISPLAY_FIELDS.forEach(field => {
                    const cell = document.createElement('div'); 
                    cell.textContent = child[field.key] || '-';
                    cell.style.width = field.width || '80px';
                    if(field.align) cell.style.textAlign = field.align;
                    cell.style.color = '#666';
                    row.appendChild(cell);
                });
                
                const opCell = document.createElement('div'); opCell.style.width = '30px'; opCell.style.textAlign='right';
                if(!readonly) {
                    const del = document.createElement('button'); del.textContent='×';
                    del.className = 'btn-like btn-danger btn-small';
                    del.style.padding = '0 5px';
                    del.onclick = () => { assetData.components.splice(idx,1); renderComps(); };
                    opCell.appendChild(del);
                }
                row.appendChild(opCell);
                listDiv.appendChild(row);
            });
            
            if(!readonly) {
                const addDiv = document.createElement('div');
                addDiv.style.marginTop = '10px';
                const add = document.createElement('button'); add.textContent='+ 添加子资产';
                add.className = 'btn-like btn-small';
                add.onclick = () => openComponentPicker(assetData, (id) => {
                    if(!assetData.components.includes(id)) {
                        assetData.components.push(id);
                        renderComps();
                    }
                });
                addDiv.appendChild(add);
                listDiv.appendChild(addDiv);
            }
        };
        renderComps();
        
        compDiv.appendChild(listDiv); // 修正 3: listDiv 也是 compDiv 的子元素，但排在 checkboxRow 后面
        container.appendChild(compDiv);

        // 底部按钮
        const actions = document.createElement('div');
        actions.className = 'actions';
        actions.style.marginTop = '15px';
        const closeBtn = document.createElement('button');
        closeBtn.textContent = '关闭';
        closeBtn.className = 'btn-like btn-small';
        closeBtn.onclick = () => overlay.remove();
        actions.appendChild(closeBtn);

        if(!readonly) {
            const saveBtn = document.createElement('button');
            saveBtn.textContent = '保存';
            saveBtn.className = 'btn-like';
            saveBtn.onclick = () => {
                if(!assetData.name) return alert('名称不能为空');
                assetStore.updateAsset(assetData, isNew);
                overlay.remove();
            };
            actions.appendChild(saveBtn);
            
            if(!isNew) {
                const delBtn = document.createElement('button');
                delBtn.textContent = '删除';
                delBtn.className = 'btn-like btn-danger btn-small';
                delBtn.style.marginLeft = 'auto';
                delBtn.onclick = () => {
                    if(confirm('确定删除此资产吗？')) {
                        assetStore.deleteAsset(assetData.originId);
                        overlay.remove();
                    }
                };
                actions.appendChild(delBtn);
            }
        }
        
        container.appendChild(actions);
        return container;
    }

    function openTagPicker(currentTags, onSelect) {
        const overlay = document.createElement('div'); overlay.className = 'overlay';
        const modal = document.createElement('div'); modal.className = 'modal';
        modal.innerHTML = '<h3>选择或输入标签</h3>';
        const body = document.createElement('div'); body.className = 'modal-body';
        const inputRow = document.createElement('div');
        inputRow.style.cssText = 'display:flex; gap:8px; margin-bottom:15px;';
        const input = document.createElement('input');
        input.placeholder = '输入新标签...';
        input.style.cssText = 'flex:1; padding:6px; border:1px solid #ddd; border-radius:4px;';
        const addBtn = document.createElement('button');
        addBtn.textContent = '添加';
        addBtn.className = 'btn-like btn-small';
        const handleAdd = () => { const val = input.value.trim(); if(val) { onSelect(val); overlay.remove(); } };
        addBtn.onclick = handleAdd;
        input.addEventListener('keydown', e => { if(e.key === 'Enter') handleAdd(); });
        inputRow.appendChild(input); inputRow.appendChild(addBtn);
        body.appendChild(inputRow);
        
        const tagList = document.createElement('div');
        tagList.style.cssText = 'display:flex; flex-wrap:wrap; gap:6px;';
        const allTags = assetStore.state.tags; 
        if(allTags.length) {
            allTags.forEach(t => {
                const chip = document.createElement('span');
                chip.className = 'chip'; chip.textContent = t;
                if(currentTags.includes(t)) { chip.style.background = '#e3f2fd'; chip.style.borderColor = '#2196f3'; }
                chip.onclick = () => { onSelect(t); overlay.remove(); };
                tagList.appendChild(chip);
            });
        } else tagList.innerHTML = '<div style="color:#999; font-size:12px;">暂无历史标签</div>';
        
        body.appendChild(tagList);
        const closeBtn = document.createElement('button');
        closeBtn.textContent = '取消'; closeBtn.className = 'btn-like btn-small btn-danger'; closeBtn.style.marginTop = '15px';
        closeBtn.onclick = () => overlay.remove();
        modal.appendChild(body); modal.appendChild(closeBtn);
        overlay.appendChild(modal); document.body.appendChild(overlay);
        input.focus();
    }

    function openComponentPicker(current, onSelect) {
        const overlay = document.createElement('div'); overlay.className = 'overlay';
        const modal = document.createElement('div'); modal.className = 'modal';
        modal.innerHTML = '<h3>选择子资产</h3>';
        const list = document.createElement('div');
        list.className = 'modal-body'; list.style.height = '300px'; list.style.overflowY = 'auto';
        
        const all = assetStore.getAssets();
        const available = all.filter(a => a.originId !== current.originId && !current.components.includes(a.originId));
        available.forEach(a => {
            const div = document.createElement('div');
            const isUsed = all.some(p => p.isComposite && p.originId !== current.originId && p.components.includes(a.originId));
            const color = isUsed ? '#999' : '';
            div.textContent = `${a.name} [${a.category}]${isUsed?' (已用)':''}`;
            div.style.cssText = `padding:8px; border-bottom:1px solid #eee; cursor:pointer; color:${color};`;
            div.onclick = () => { onSelect(a.originId); overlay.remove(); };
            div.onmouseover = () => div.style.background = '#f5f5f5';
            div.onmouseout = () => div.style.background = '';
            list.appendChild(div);
        });
        
        const cancel = document.createElement('button'); cancel.textContent = '取消'; cancel.className = 'btn-like btn-small'; cancel.style.marginTop = '10px';
        cancel.onclick = () => overlay.remove();
        modal.appendChild(list); modal.appendChild(cancel);
        overlay.appendChild(modal); document.body.appendChild(overlay);
    }

    // --- 11. 辅助 ---
    function viewImage(src) {
        const win = window.open('about:blank');
        if(win) win.document.write(`<img src="${src}" style="max-width:100%;" />`);
    }
    function openCompositeDetailsModal(asset) { openAssetModal(asset.originId, true); }
    function openSettingsModal() { alert('设置功能：此处可添加修改全局配置的逻辑'); }
    function openFilterModal() {
        const cat = prompt('输入筛选分类 (留空取消):', filterCriteria.category);
        if(cat !== null) { filterCriteria.category = cat; renderTable(); }
    }
    function openHelpModal() { alert('资产管理系统 v3.1'); }

})();