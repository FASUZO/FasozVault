/**
 * FasozVault - 组合资产管理模块
 * 处理组合资产相关的逻辑：子资产检查、金额计算、标签合并等
 */

/**
 * 检查资产是否是某个组合资产的子资产
 * @param {Object} asset - 要检查的资产对象
 * @param {Array} allAssetsData - 所有资产数据数组
 * @returns {boolean} 如果是子资产返回true，否则返回false
 */
export function isComponentAsset(asset, allAssetsData) {
  if (!asset.originId) return false;
  return allAssetsData.some(a => 
    a.isComposite === true && 
    Array.isArray(a.components) && 
    a.components.includes(asset.originId)
  );
}

/**
 * 计算组合资产的总金额（合并所有子资产的金额）
 * @param {Object} compositeAsset - 组合资产对象
 * @param {Array} allAssetsData - 所有资产数据数组
 * @param {Function} formatTwoDecimal - 金额格式化函数
 * @returns {string} 格式化后的总金额
 * 
 * 示例：
 * 组合资产包含两个子资产：100.5 和 200.3
 * 返回："300.80"
 */
export function calculateCompositeAmount(compositeAsset, allAssetsData, formatTwoDecimal) {
  if (!compositeAsset.isComposite || !Array.isArray(compositeAsset.components)) {
    return compositeAsset.amount || '';
  }
  
  let totalAmount = 0;
  const assetMap = new Map(allAssetsData.map(a => [a.originId, a]));
  
  compositeAsset.components.forEach(compId => {
    const compAsset = assetMap.get(compId);
    if (compAsset && compAsset.amount) {
      const amountStr = compAsset.amount.toString();
      // 提取数字部分（支持 "12.5/年" 格式）
      const numPart = amountStr.split('/')[0].trim();
      const amount = parseFloat(numPart) || 0;
      totalAmount += amount;
    }
  });
  
  return totalAmount > 0 ? formatTwoDecimal(totalAmount.toString()) : '';
}

/**
 * 合并组合资产的标签（包含所有子资产的标签，去重）
 * @param {Object} compositeAsset - 组合资产对象
 * @param {Array} allAssetsData - 所有资产数据数组
 * @returns {Array<string>} 合并后的标签数组（去重）
 * 
 * 示例：
 * 组合资产标签：["标签1"]
 * 子资产1标签：["标签1", "标签2"]
 * 子资产2标签：["标签2", "标签3"]
 * 返回：["标签1", "标签2", "标签3"]
 */
export function mergeCompositeTags(compositeAsset, allAssetsData) {
  if (!compositeAsset.isComposite || !Array.isArray(compositeAsset.components)) {
    return compositeAsset.subcategory || [];
  }
  
  const tagSet = new Set();
  
  // 先添加组合资产自身的标签
  const ownTags = Array.isArray(compositeAsset.subcategory) 
    ? compositeAsset.subcategory 
    : (compositeAsset.subcategory ? [compositeAsset.subcategory] : []);
  ownTags.forEach(tag => tagSet.add(tag));
  
  // 添加所有子资产的标签
  const assetMap = new Map(allAssetsData.map(a => [a.originId, a]));
  compositeAsset.components.forEach(compId => {
    const compAsset = assetMap.get(compId);
    if (compAsset && compAsset.subcategory) {
      const compTags = Array.isArray(compAsset.subcategory)
        ? compAsset.subcategory
        : [compAsset.subcategory];
      compTags.forEach(tag => {
        if (tag && tag.trim()) tagSet.add(tag.trim());
      });
    }
  });
  
  return Array.from(tagSet);
}

/**
 * 获取组合资产的子资产详细信息（用于悬停提示）
 * @param {Object} compositeAsset - 组合资产对象
 * @param {string} field - 要获取的字段名（'date' 或 'channel'）
 * @param {Array} allAssetsData - 所有资产数据数组
 * @returns {Array<Object>} 子资产详情数组，格式：[{name: "资产名", value: "值"}, ...]
 * 
 * 示例：
 * getComponentDetails(compositeAsset, 'date', allAssetsData)
 * 返回：[{name: "子资产1", value: "2025-01-15"}, {name: "子资产2", value: "2025-02-20"}]
 */
export function getComponentDetails(compositeAsset, field, allAssetsData) {
  if (!compositeAsset.isComposite || !Array.isArray(compositeAsset.components)) {
    return [];
  }
  
  const assetMap = new Map(allAssetsData.map(a => [a.originId, a]));
  const details = [];
  
  compositeAsset.components.forEach(compId => {
    const compAsset = assetMap.get(compId);
    if (compAsset) {
      let value = '';
      if (field === 'date') {
        value = compAsset.purchaseDate || compAsset.date || '';
      } else if (field === 'channel') {
        value = compAsset.channel || '';
      }
      if (compAsset.name && value) {
        details.push({ name: compAsset.name, value: value });
      }
    }
  });
  
  return details;
}

