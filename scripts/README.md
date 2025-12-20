# 📁 scripts 文件夹结构说明

## 📂 目录结构

```
scripts/
├── pages/                    # 页面级脚本（每个页面对应的主要脚本）
│   ├── assets.js            # 资产列表页面脚本（主要功能：资产管理、搜索筛选、组合资产）
│   ├── management.js        # 管理页面脚本（分类、渠道、标签、列管理）
│   ├── planning.js          # 规划页面脚本（待办清单功能）
│   └── common.js            # 全站通用脚本（导航栏、首页时钟、主题切换）
│
├── modules/                  # 功能模块（可复用的业务逻辑模块）
│   ├── attachment.js        # 附件管理模块（图片上传、预览、懒加载）
│   ├── composite-assets.js  # 组合资产管理模块（子资产检查、金额计算、标签合并）
│   └── filter.js            # 搜索筛选模块（资产过滤、数据同步）
│
├── utils/                    # 工具函数（通用的辅助函数）
│   ├── assets-utils.js      # 资产相关工具函数（格式化、ID生成、日期处理）
│   └── debug.js             # 调试工具（日志输出、调试模式控制）
│
├── ASSETS_CODE_GUIDE.md     # 资产管理系统详细代码说明文档
└── README.md                # 本文件（scripts 文件夹总体说明）
```

## 📋 文件说明

### 📄 pages/ - 页面级脚本

#### `pages/assets.js`
**功能**：资产列表页面的主要脚本
- 资产列表展示和管理
- 搜索和筛选功能
- 组合资产管理
- 附件上传和管理
- 数据自动保存
- 表格构建和渲染
- 模态框（编辑、设置、筛选）

**依赖**：
- `../utils/debug.js` - 调试工具
- `../utils/assets-utils.js` - 工具函数
- `../modules/composite-assets.js` - 组合资产模块
- `../modules/filter.js` - 筛选模块
- `../modules/attachment.js` - 附件模块

**使用页面**：`pages/assets.html`

---

#### `pages/management.js`
**功能**：管理页面的脚本
- 资产分类管理
- 购入渠道管理
- 标签管理
- 列管理（显示/隐藏、排序）
- 数据导入/导出

**依赖**：
- `../utils/debug.js` - 调试工具

**使用页面**：`pages/management.html`

---

#### `pages/planning.js`
**功能**：规划/待办清单页面的脚本
- 待办任务添加
- 任务列表展示
- 任务完成/删除
- 任务数据持久化（localStorage）

**依赖**：
- `../utils/debug.js` - 调试工具

**使用页面**：`pages/planning.html`

---

#### `pages/common.js`
**功能**：全站通用脚本
- 导航栏生成和激活状态
- 首页时钟显示
- 主题切换（暗黑模式）
- 字体缩放功能
- 全局右键菜单
- 全局提示（toast）

**使用页面**：所有页面（`index.html`、`pages/*.html`）

---

### 📦 modules/ - 功能模块

#### `modules/attachment.js`
**功能**：附件管理模块
- 图片上传功能
- 图片预览（懒加载）
- 图片替换功能
- 附件单元格构建
- 附件预览区域构建

**主要函数**：
- `buildImageCell()` - 创建附件单元格
- `buildAttachmentPart()` - 创建附件预览区域

**特性**：
- ✅ 懒加载：有附件时显示图标，点击才加载图片
- ✅ 点击查看：点击图标或图片查看大图
- ✅ 长按替换：长按图片可以替换附件

---

#### `modules/composite-assets.js`
**功能**：组合资产管理模块
- 检查是否为子资产
- 计算组合资产总金额
- 合并子资产标签
- 获取子资产详情

**主要函数**：
- `isComponentAsset()` - 检查是否为子资产
- `calculateCompositeAmount()` - 计算组合资产总金额
- `mergeCompositeTags()` - 合并标签
- `getComponentDetails()` - 获取子资产详情

---

#### `modules/filter.js`
**功能**：搜索筛选模块
- 资产过滤功能
- 多条件筛选
- 表格数据同步

**主要函数**：
- `filterAsset()` - 资产过滤函数
- `syncAssetsDataFromTable()` - 同步表格数据

---

### 🛠️ utils/ - 工具函数

#### `utils/assets-utils.js`
**功能**：资产相关工具函数
- 金额格式化
- 唯一ID生成
- 日期格式化
- 防抖函数
- 深拷贝

**主要函数**：
- `formatTwoDecimal()` - 金额格式化，保留两位小数
- `generateUniqueId()` - 生成唯一ID
- `formatDate()` - 日期格式化（YYYY-MM-DD → YYMMDD）
- `debounce()` - 防抖函数
- `deepClone()` - 深拷贝对象

---

#### `utils/debug.js`
**功能**：调试工具
- 日志输出控制
- 调试模式开关
- 光标状态调试

**主要函数**：
- `logInfo()` - 信息日志（始终输出）
- `logDebug()` - 调试日志（仅在 debug=true 时输出）
- `enableCursorDebug()` - 启用光标状态调试

**使用方式**：
```javascript
// 在浏览器控制台执行
debug = true;   // 开启详细调试
debug = false;  // 关闭详细调试
```

---

## 🔗 文件依赖关系

```
pages/assets.js
  ├── utils/debug.js
  ├── utils/assets-utils.js
  ├── modules/composite-assets.js
  ├── modules/filter.js
  └── modules/attachment.js

pages/management.js
  └── utils/debug.js

pages/planning.js
  └── utils/debug.js

pages/common.js
  └── (无依赖，独立运行)
```

## 📝 代码组织原则

1. **页面脚本** (`pages/`)：每个页面有独立的脚本文件，负责页面的主要功能
2. **功能模块** (`modules/`)：可复用的业务逻辑，可以被多个页面共享
3. **工具函数** (`utils/`)：通用的辅助函数，不包含业务逻辑
4. **模块化**：使用 ES6 模块系统，便于代码组织和维护
5. **文档完善**：每个文件都有清晰的注释说明

## 🚀 如何添加新功能

### 添加新页面
1. 在 `pages/` 目录下创建新的脚本文件
2. 在对应的 HTML 文件中引用脚本
3. 如需要，从 `utils/` 或 `modules/` 导入工具函数或模块

### 添加新模块
1. 在 `modules/` 目录下创建新的模块文件
2. 导出需要使用的函数
3. 在需要使用该模块的页面脚本中导入

### 添加新工具函数
1. 在 `utils/` 目录下的相应文件中添加函数
2. 导出函数
3. 在需要使用的地方导入

## 📚 相关文档

- **资产管理系统详细说明**：`ASSETS_CODE_GUIDE.md`
- **项目总体说明**：`../README.md`
- **部署说明**：`../DEPLOYMENT.md`

## 🔍 常见问题

### Q: 如何修改资产列表的列？
**A**: 编辑 `pages/assets.js` 中的 `columnsMeta` 数组，添加或修改列定义。

### Q: 如何添加新的筛选条件？
**A**: 编辑 `modules/filter.js` 中的 `filterAsset()` 函数，添加新的筛选逻辑。

### Q: 如何修改日期格式？
**A**: 编辑 `utils/assets-utils.js` 中的 `formatDate()` 函数。

### Q: 如何启用调试模式？
**A**: 在浏览器控制台执行 `debug = true`，或在 `.env` 文件中设置 `DEFAULT_DEBUG=true`。

### Q: 如何修改导航栏？
**A**: 编辑 `pages/common.js` 中的 `navItems` 数组。

## 📞 需要帮助？

如果遇到问题：
1. 查看浏览器控制台的错误信息
2. 检查函数参数是否正确
3. 查看相关模块的注释说明
4. 参考本文档和 `ASSETS_CODE_GUIDE.md`
