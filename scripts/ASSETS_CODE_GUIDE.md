# FasozVault 资产管理系统代码使用指南

> 本文档专注于资产管理系统（assets.js）的代码使用说明和修改指南。
> 完整的文件夹结构说明请查看：[scripts/README.md](README.md)

## 📁 相关文件结构

```
scripts/
├── pages/
│   └── assets.js                # 资产列表页面主文件
├── utils/
│   ├── assets-utils.js          # 工具函数模块
│   └── debug.js                 # 调试工具
└── modules/
    ├── composite-assets.js      # 组合资产管理模块
    ├── filter.js                # 搜索筛选模块
    └── attachment.js            # 附件管理模块
```

## 🔧 模块说明

### 1. utils/assets-utils.js - 工具函数模块
**功能**：提供通用的工具函数

**主要函数**：
- `formatTwoDecimal(val)` - 金额格式化，保留两位小数
- `generateUniqueId(existingIds)` - 生成唯一ID
- `formatDate(dateStr)` - 日期格式化（YYYY-MM-DD → YYMMDD）
- `debounce(func, delay)` - 防抖函数

**使用示例**：
```javascript
import { formatTwoDecimal, generateUniqueId } from '../utils/assets-utils.js';

// 格式化金额
const amount = formatTwoDecimal("12.5"); // 返回 "12.50"

// 生成ID
const newId = generateUniqueId(existingIds);
```

---

### 2. modules/composite-assets.js - 组合资产管理模块
**功能**：处理组合资产相关的逻辑

**主要函数**：
- `isComponentAsset(asset, allAssetsData)` - 检查是否为子资产
- `calculateCompositeAmount(compositeAsset, allAssetsData, formatTwoDecimal)` - 计算组合资产总金额
- `mergeCompositeTags(compositeAsset, allAssetsData)` - 合并标签
- `getComponentDetails(compositeAsset, field, allAssetsData)` - 获取子资产详情

**使用示例**：
```javascript
import { calculateCompositeAmount } from '../modules/composite-assets.js';

// 计算组合资产金额
const totalAmount = calculateCompositeAmount(compositeAsset, allAssetsData, formatTwoDecimal);
```

---

### 3. modules/filter.js - 搜索筛选模块
**功能**：提供资产搜索和筛选功能

**主要函数**：
- `filterAsset(asset, options)` - 资产过滤函数
- `syncAssetsDataFromTable(tableBody)` - 同步表格数据

**使用示例**：
```javascript
import { filterAsset } from '../modules/filter.js';

// 筛选资产
const filtered = allAssets.filter(asset => 
  filterAsset(asset, {
    searchKeyword: '相机',
    filterCriteria: { category: '设备' },
    showComponentAssets: true,
    isComponentAsset: (asset) => isComponentAsset(asset, allAssetsData)
  })
);
```

---

### 4. modules/attachment.js - 附件管理模块
**功能**：处理附件的显示、上传、预览

**主要函数**：
- `buildImageCell(prefill, updateAssetFromRow, triggerAutoSave, logDebug)` - 创建附件单元格
- `buildAttachmentPart(container, asset, row, readonly, ...)` - 创建附件预览区域

**特性**：
- ✅ 懒加载：有附件时显示图标，点击才加载图片
- ✅ 点击查看：点击图标或图片查看大图
- ✅ 长按替换：长按图片可以替换附件

---

## 📝 assets.js 主文件结构

### 1. 初始化部分（第1-100行）
```javascript
// 读取配置
const envCfg = await fetch('/api/env').then(r => r.json());

// 加载服务器数据
const serverData = await fetch('/api/data').then(r => r.json());

// 初始化变量
let autoSaveEnabled = localStorage.getItem('autoSave') === 'true';
let allAssetsData = [...storedData];
```

### 2. 表格相关（第100-500行）
- **表头构建**：`headerTr` - 创建表格表头
- **隐藏列处理**：`applyHiddenColumns()` - 应用隐藏列样式
- **列宽调整**：支持拖拽调整列宽

### 3. 数据渲染（第500-1000行）
- **createRow(prefill)** - 创建表格行
  - 处理各种类型的单元格（文本、日期、标签、附件等）
  - 支持组合资产的特殊显示
  
### 4. 搜索筛选（第300-400行）
- **filterAsset(asset)** - 资产过滤函数
- **applyFiltersAndRender()** - 应用筛选并重新渲染

### 5. 模态框（第1200-2000行）
- **openAssetModal()** - 打开资产编辑窗口
- **openFilterModal()** - 打开筛选窗口
- **openSettingsModal()** - 打开设置窗口

### 6. 数据保存（第1200-1300行）
- **saveTableToServer()** - 保存数据到服务器
- **triggerAutoSave()** - 触发自动保存（防抖）

---

## 🛠️ 如何修改代码

### 修改表格列
**位置**：第73-87行
```javascript
const columnsMeta = [
  { key:'name', label:'名称' },
  { key:'category', label:'分类' },
  // 在这里添加新列
  { key:'newField', label:'新字段' }
];
```

### 修改默认分类/渠道
**位置**：第66-70行
```javascript
const DEFAULT_CATEGORIES = ['股票', '基金', '债券', '不动产', '现金', '其他'];
const DEFAULT_CHANNELS = ['证券账户', '银行', '支付宝', '微信', '其他'];
```

### 修改自动保存延迟时间
**位置**：第42-49行
```javascript
function triggerAutoSave(){
  // 修改这里的 800 为其他值（单位：毫秒）
  autoSaveTimer = setTimeout(()=>{
    saveTableToServer(false);
  }, 800); // 改为 1000 就是1秒后保存
}
```

### 添加新的筛选条件
**位置**：第303-350行 `filterAsset()` 函数
```javascript
function filterAsset(asset) {
  // ... 现有筛选条件 ...
  
  // 添加新筛选条件
  if (filterCriteria.newField && asset.newField !== filterCriteria.newField) {
    return false;
  }
  
  return true;
}
```

### 修改附件上传限制
**位置**：第566行
```javascript
fileInput.accept = 'image/*'; // 只允许图片
// 改为允许所有文件：
// fileInput.accept = '*/*';
```

---

## 🐛 常见问题

### Q: 如何添加新的资产字段？
1. 在 `columnsMeta` 中添加列定义
2. 在 `createRow()` 函数中添加单元格创建逻辑
3. 在 `getTableData()` 函数中添加数据读取逻辑

### Q: 如何修改日期格式？
查找 `formatDate()` 函数（在 `utils/assets-utils.js` 中），修改格式化逻辑。

### Q: 如何禁用某个功能？
查找对应的函数，注释掉或添加 `return` 语句。

---

## 📚 代码注释说明

### 函数注释格式
```javascript
/**
 * 函数功能说明
 * @param {类型} 参数名 - 参数说明
 * @returns {类型} 返回值说明
 * 
 * 使用示例：
 * functionName(param1, param2);
 */
```

### 代码块注释
```javascript
// 单行注释：说明这一行代码的作用

/* 
 * 多行注释：说明一段代码的功能
 * 可以写多行说明
 */
```

---

## 🔄 代码优化建议

1. **减少重复代码**：将重复的逻辑提取为函数
2. **使用模块化**：将相关功能拆分到独立模块
3. **添加注释**：为复杂逻辑添加说明
4. **错误处理**：添加 try-catch 处理异常

---

## 📞 需要帮助？

如果遇到问题：
1. 查看浏览器控制台的错误信息
2. 检查函数参数是否正确
3. 查看相关模块的注释说明
4. 参考本文档的使用示例

