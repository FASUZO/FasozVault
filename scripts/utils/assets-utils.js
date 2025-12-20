/**
 * FasozVault - 工具函数模块
 * 提供通用的工具函数，如格式化、ID生成等
 */

/**
 * 金额格式化：统一保留两位小数
 * @param {string|number} val - 要格式化的值
 * @returns {string} 格式化后的字符串，如 "12.50" 或 "12.50/年"
 * 
 * 示例：
 * - formatTwoDecimal("12.5") => "12.50"
 * - formatTwoDecimal("99/月") => "99.00/月"
 * - formatTwoDecimal("abc") => "abc" (无法解析时保持原样)
 */
export function formatTwoDecimal(val) {
  if (val === undefined || val === null) return '';
  if (typeof val !== 'string') val = String(val);
  val = val.trim();
  if (val === '') return '';
  
  // 支持诸如 "12.5/年"、"99/月" 的格式
  const slashIdx = val.indexOf('/');
  const numPart = slashIdx >= 0 ? val.slice(0, slashIdx).trim() : val;
  const unitPart = slashIdx >= 0 ? val.slice(slashIdx) : '';
  const num = Number(numPart);
  
  // 若无法解析数字，保持原样
  if (Number.isNaN(num)) return val;
  
  return num.toFixed(2) + unitPart;
}

/**
 * 生成唯一的资产ID
 * @param {Set<string>} existingIds - 已存在的ID集合
 * @returns {string} 新的唯一ID，格式：ID_时间戳_随机字符串
 * 
 * 示例：ID_la3k9j2_p6pf
 */
export function generateUniqueId(existingIds) {
  let id;
  do {
    id = 'ID_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 6);
  } while (existingIds.has(id));
  existingIds.add(id);
  return id;
}

/**
 * 日期格式化：将 YYYY-MM-DD 格式转换为 YYMMDD
 * @param {string} dateStr - 日期字符串，格式：YYYY-MM-DD
 * @returns {string} 格式化后的日期，格式：YYMMDD
 * 
 * 示例：
 * - formatDate("2025-01-15") => "250115"
 * - formatDate("") => ""
 */
export function formatDate(dateStr) {
  if (!dateStr) return '';
  return dateStr.slice(2, 4) + dateStr.slice(5, 7) + dateStr.slice(8, 10);
}

/**
 * 防抖函数：延迟执行，如果短时间内多次调用，只执行最后一次
 * @param {Function} func - 要执行的函数
 * @param {number} delay - 延迟时间（毫秒）
 * @returns {Function} 防抖后的函数
 * 
 * 示例：
 * const debouncedSave = debounce(() => save(), 800);
 * debouncedSave(); // 800ms后执行
 * debouncedSave(); // 取消上一次，重新计时800ms
 */
export function debounce(func, delay) {
  let timer = null;
  return function (...args) {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      func.apply(this, args);
    }, delay);
  };
}

/**
 * 深拷贝对象
 * @param {any} obj - 要拷贝的对象
 * @returns {any} 拷贝后的新对象
 */
export function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

