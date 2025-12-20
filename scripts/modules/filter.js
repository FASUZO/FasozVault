/**
 * FasozVault - 搜索和筛选模块
 * 提供资产搜索、多条件筛选功能
 */

/**
 * 资产过滤函数：根据搜索关键词和筛选条件过滤资产
 * @param {Object} asset - 要过滤的资产对象
 * @param {Object} options - 筛选选项
 * @param {string} options.searchKeyword - 搜索关键词
 * @param {Object} options.filterCriteria - 筛选条件对象
 * @param {boolean} options.showComponentAssets - 是否显示组合资产的子资产
 * @param {Function} options.isComponentAsset - 检查是否为子资产的函数
 * @returns {boolean} 如果资产通过筛选返回true，否则返回false
 * 
 * 筛选条件包括：
 * - 搜索关键词：搜索名称、备注、标签、分类、渠道
 * - 分类筛选：精确匹配分类
 * - 渠道筛选：精确匹配渠道
 * - 标签筛选：标签数组中包含指定标签
 * - 日期范围：在指定日期范围内
 * - 金额范围：在指定金额范围内
 * - 组合资产子资产：根据设置决定是否显示
 */
export function filterAsset(asset, options) {
  const {
    searchKeyword,
    filterCriteria,
    showComponentAssets,
    isComponentAsset
  } = options;
  
  // 如果设置中关闭显示子资产，且当前资产是某个组合资产的子资产，则过滤掉
  if (!showComponentAssets && isComponentAsset(asset)) {
    return false;
  }
  
  // 搜索关键词过滤（搜索名称、备注、标签等文本字段）
  if (searchKeyword) {
    const keyword = searchKeyword.toLowerCase();
    const searchFields = [
      asset.name || '',
      asset.note || '',
      asset.subcategory || '',
      asset.category || '',
      asset.channel || ''
    ];
    const matchesSearch = searchFields.some(field => {
      // 处理数组类型的字段（如标签）
      if (Array.isArray(field)) {
        return field.some(tag => tag.toLowerCase().includes(keyword));
      }
      return field.toLowerCase().includes(keyword);
    });
    if (!matchesSearch) return false;
  }

  // 分类筛选
  if (filterCriteria.category && asset.category !== filterCriteria.category) {
    return false;
  }

  // 渠道筛选
  if (filterCriteria.channel && asset.channel !== filterCriteria.channel) {
    return false;
  }

  // 标签筛选
  if (filterCriteria.tag) {
    const assetTags = Array.isArray(asset.subcategory) 
      ? asset.subcategory 
      : (asset.subcategory ? [asset.subcategory] : []);
    if (!assetTags.includes(filterCriteria.tag)) {
      return false;
    }
  }

  // 日期范围筛选
  if (filterCriteria.dateFrom && asset.date) {
    if (asset.date < filterCriteria.dateFrom) return false;
  }
  if (filterCriteria.dateTo && asset.date) {
    if (asset.date > filterCriteria.dateTo) return false;
  }

  // 金额范围筛选
  if (filterCriteria.amountMin || filterCriteria.amountMax) {
    const amountStr = asset.amount || '0';
    // 提取数字部分（支持 "12.5/年" 格式）
    const numPart = amountStr.toString().split('/')[0].trim();
    const amount = parseFloat(numPart) || 0;
    
    if (filterCriteria.amountMin && amount < parseFloat(filterCriteria.amountMin)) {
      return false;
    }
    if (filterCriteria.amountMax && amount > parseFloat(filterCriteria.amountMax)) {
      return false;
    }
  }

  return true;
}

/**
 * 同步表格数据到资产数据数组
 * @param {HTMLElement} tableBody - 表格tbody元素
 * @returns {Array} 同步后的资产数据数组
 */
export function syncAssetsDataFromTable(tableBody) {
  const rows = Array.from(tableBody.querySelectorAll('tr'));
  const assetsData = [];
  rows.forEach(row => {
    try {
      const data = JSON.parse(row.dataset.extra || '{}');
      if (data.originId) assetsData.push(data);
    } catch(e) {
      console.warn('解析行数据失败:', e);
    }
  });
  return assetsData;
}

