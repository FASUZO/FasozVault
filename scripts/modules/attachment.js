/**
 * FasozVault - 附件管理模块
 * 处理资产附件的显示、上传、预览等功能
 * 采用懒加载机制，提升页面性能
 */

/**
 * 创建附件单元格（表格中使用）
 * @param {Object} prefill - 资产数据对象
 * @param {Function} updateAssetFromRow - 更新资产数据的回调函数
 * @param {Function} triggerAutoSave - 触发自动保存的回调函数
 * @param {Function} logDebug - 调试日志函数
 * @returns {HTMLElement} 附件单元格td元素
 * 
 * 功能说明：
 * - 懒加载：有附件时显示图标占位符，点击或悬停时才加载图片
 * - 点击查看：点击图标或图片查看大图
 * - 长按替换：长按图片可以替换附件
 * - 上传：点击"无"占位符可以上传附件
 */
export function buildImageCell(prefill, updateAssetFromRow, triggerAutoSave, logDebug) {
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
  
  /**
   * 查看图片大图
   */
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

  // 文件选择事件
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
        if(row){ 
          updateAssetFromRow(row); 
          triggerAutoSave(); 
        }
      };
      reader.readAsDataURL(fileInput.files[0]);
    }
  });

  imgTd.appendChild(placeholder);
  imgTd.appendChild(img);
  imgTd.appendChild(fileInput);
  return imgTd;
}

/**
 * 创建附件预览区域（编辑模态框中使用）
 * @param {HTMLElement} container - 容器元素
 * @param {Object} asset - 资产对象
 * @param {HTMLElement} row - 表格行元素
 * @param {boolean} readonly - 是否只读
 * @param {Function} updateRowFromAsset - 更新行的回调函数
 * @param {Function} triggerAutoSave - 触发自动保存的回调函数
 * 
 * 功能说明：
 * - 有附件时显示"点击预览"按钮，点击后才加载图片
 * - 无附件时显示上传区域
 * - 支持上传、删除附件
 */
export function buildAttachmentPart(container, asset, row, readonly, updateRowFromAsset, triggerAutoSave) {
  const img = document.createElement('img'); 
  img.style.cssText = 'max-width: 100%; max-height: 400px; object-fit: contain; border-radius: 8px; display: none; cursor: pointer;';
  img.loading = 'lazy';
  
  // 占位符容器
  const placeholder = document.createElement('div'); 
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
  
  const fileInput = document.createElement('input'); 
  fileInput.type = 'file'; 
  fileInput.accept = 'image/*'; 
  fileInput.style.display = 'none'; 
  if(readonly) fileInput.disabled = true;
  
  // 点击占位符区域选择文件（仅当无附件时）
  if(!asset.image){
    placeholder.style.cursor = 'pointer';
    placeholder.addEventListener('click', () => fileInput.click());
  }
  
  fileInput.addEventListener('change', ()=>{
    if(fileInput.files[0]){
      const reader = new FileReader();
      reader.onload = e=>{ 
        asset.image = e.target.result; 
        img.src = asset.image; 
        img.dataset.src = e.target.result;
        img.dataset.loaded = 'true';
        img.style.display = 'block'; 
        placeholder.style.display = 'none';
      };
      reader.readAsDataURL(fileInput.files[0]);
    }
  });
  
  container.appendChild(placeholder);
  container.appendChild(img);
  container.appendChild(fileInput);
  
  if(!readonly){
    const btnWrap = document.createElement('div'); 
    btnWrap.style.cssText = 'margin-top: 12px; display: flex; gap: 8px; align-items: center;';

    const uploadBtn = document.createElement('button'); 
    uploadBtn.textContent = '上传附件'; 
    uploadBtn.className = 'btn-like btn-small';
    uploadBtn.onclick = () => fileInput.click();

    const delBtn = document.createElement('button'); 
    delBtn.textContent = '删除附件'; 
    delBtn.className = 'btn-like btn-danger btn-small';
    delBtn.onclick = ()=>{
      asset.image = '';
      img.src = '';
      img.dataset.src = '';
      img.dataset.loaded = 'false';
      img.style.display = 'none';
      placeholder.innerHTML = '<div style="color: #888;">无附件</div>';
      placeholder.style.cursor = 'pointer';
      placeholder.onclick = () => fileInput.click();
      fileInput.value = '';
      // 立即同步到表格行并自动保存
      if(row){
        updateRowFromAsset(row, asset);
        row.dataset.extra = JSON.stringify(asset);
        triggerAutoSave();
      }
    };
    btnWrap.appendChild(uploadBtn);
    if(asset.image){
      btnWrap.appendChild(delBtn);
    }
    container.appendChild(btnWrap);
  }
}

