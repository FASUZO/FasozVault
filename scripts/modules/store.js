/**
 * scripts/modules/store.js
 * 核心数据仓库：负责管理所有资产数据、状态同步和业务逻辑
 * 实现了 Single Source of Truth (单一数据源) 模式
 */

import { deepClone, generateUniqueId, formatTwoDecimal } from '../utils/assets-utils.js';
import { calculateCompositeAmount, mergeCompositeTags } from './composite-assets.js';
import { logInfo, logDebug } from '../utils/debug.js';

class AssetStore {
    constructor() {
        this.state = {
            assets: [],
            categories: [],
            channels: [],
            tags: [],
            hiddenColumns: [],
            columnOrder: [],
            columnsMeta: []
        };
        this.subscribers = [];
        this.originalData = null; // 用于记录上次保存的状态，方便对比
    }

    /**
     * 初始化加载数据
     */
    async init() {
        try {
            const resp = await fetch('/api/data');
            if (!resp.ok) throw new Error('Failed to fetch data');
            const data = await resp.json();
            
            // 填充基础配置
            this.state.categories = data.categories || [];
            this.state.channels = data.channels || [];
            this.state.tags = data.tags || [];
            this.state.hiddenColumns = data.hiddenColumns || [];
            this.state.columnOrder = data.columnOrder || [];
            this.state.columnsMeta = data.columns || [];

            // 填充资产数据，确保每个资产都有必要的字段
            this.state.assets = (data.assets || []).map(this._normalizeAsset);
            
            this.originalData = deepClone(this.state);
            logInfo('Store initialized with', this.state.assets.length, 'assets');
            return this.state;
        } catch (e) {
            console.error('Store init error:', e);
            throw e;
        }
    }

    /**
     * 标准化资产对象，补全缺失字段
     */
    _normalizeAsset(asset) {
        return {
            originId: asset.originId || generateUniqueId(new Set()), // 注意：这里简化了ID生成，实际应传入所有ID集合
            name: asset.name || '',
            category: asset.category || '默认',
            subcategory: Array.isArray(asset.subcategory) ? asset.subcategory : [],
            amount: asset.amount || '',
            purchasePrice: asset.purchasePrice || '',
            date: asset.date || '',
            purchaseDate: asset.purchaseDate || '',
            channel: asset.channel || '',
            purchaseAddress: asset.purchaseAddress || '',
            image: asset.image || '',
            note: asset.note || '',
            description: asset.description || '',
            pinned: !!asset.pinned,
            pinnedTime: asset.pinnedTime || 0,
            isComposite: !!asset.isComposite,
            components: Array.isArray(asset.components) ? asset.components : [],
            // 保留其他可能的字段
            ...asset
        };
    }

    /**
     * 获取所有资产（返回副本以防外部直接修改）
     */
    getAssets() {
        return deepClone(this.state.assets);
    }

    /**
     * 根据ID获取单个资产（返回副本）
     */
    getAssetById(id) {
        const asset = this.state.assets.find(a => a.originId === id);
        return asset ? deepClone(asset) : null;
    }

    /**
     * 更新或添加资产
     * 核心逻辑：更新资产 -> 自动重算关联的组合资产 -> 通知UI更新
     * @param {Object} newAssetData - 编辑后的资产数据
     * @param {boolean} isNew - 是否是新增
     */
    updateAsset(newAssetData, isNew = false) {
        // 1. 数据清洗和标准化
        const asset = this._normalizeAsset(newAssetData);
        
        // 2. 如果是组合资产，先计算它自己的金额和标签
        if (asset.isComposite) {
            this._recalculateCompositeSelf(asset, this.state.assets); // 传入当前的 assets 列表供查找子资产
        }

        // 3. 更新主列表
        if (isNew) {
            this.state.assets.push(asset);
        } else {
            const idx = this.state.assets.findIndex(a => a.originId === asset.originId);
            if (idx !== -1) {
                this.state.assets[idx] = asset;
            } else {
                console.error('Asset not found for update:', asset.originId);
                return;
            }
        }

        // 4. 【关键】联动更新：查找所有包含此资产的“父级组合资产”，并更新它们
        // 注意：如果是新增资产，它暂时还没被任何组合资产包含，不需要反向更新
        if (!isNew) {
            this._updateParentComposites(asset.originId);
        }

        // 5. 触发保存和UI通知
        this.saveToServer();
        this._notify();
    }

    /**
     * 删除资产
     */
    deleteAsset(id) {
        const idx = this.state.assets.findIndex(a => a.originId === id);
        if (idx === -1) return;

        // 1. 从列表中移除
        this.state.assets.splice(idx, 1);

        // 2. 联动更新：如果有组合资产包含了这个被删除的资产，需要更新该组合资产
        // (通常需要从 components 数组中移除该 ID，并重新计算金额)
        this.state.assets.forEach(parent => {
            if (parent.isComposite && parent.components.includes(id)) {
                parent.components = parent.components.filter(cId => cId !== id);
                this._recalculateCompositeSelf(parent, this.state.assets);
            }
        });

        this.saveToServer();
        this._notify();
    }

    /**
     * 内部辅助：重新计算组合资产自身的属性（金额、标签）
     */
    _recalculateCompositeSelf(compositeAsset, allAssets) {
        // 计算金额
        const amount = calculateCompositeAmount(compositeAsset, allAssets, formatTwoDecimal);
        if (amount) {
            compositeAsset.amount = amount;
            compositeAsset.purchasePrice = amount; // 同步更新购买价格字段
        }
        
        // 合并标签
        const tags = mergeCompositeTags(compositeAsset, allAssets);
        compositeAsset.subcategory = tags;
    }

    /**
     * 内部辅助：找到所有包含特定子资产的父资产，并刷新它们
     */
    _updateParentComposites(childId) {
        let parentUpdated = false;
        this.state.assets.forEach(parent => {
            if (parent.isComposite && parent.components.includes(childId)) {
                // 重新计算该父资产
                this._recalculateCompositeSelf(parent, this.state.assets);
                parentUpdated = true;
                logDebug(`Auto-updated parent composite: ${parent.name}`);
            }
        });
        return parentUpdated;
    }

    /**
     * 置顶/取消置顶
     */
    togglePin(id) {
        const asset = this.state.assets.find(a => a.originId === id);
        if (asset) {
            asset.pinned = !asset.pinned;
            asset.pinnedTime = asset.pinned ? Date.now() : 0;
            this.saveToServer();
            this._notify();
        }
    }

    /**
     * 保存到服务器
     */
    async saveToServer(silent = false) {
        const payload = {
            categories: this.state.categories,
            channels: this.state.channels,
            tags: this.state.tags,
            assets: this.state.assets,
            hiddenColumns: this.state.hiddenColumns,
            columnOrder: this.state.columnOrder,
            columns: this.state.columnsMeta
        };

        try {
            await fetch('/api/data', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            logInfo('Data saved to server');
            if (!silent && window.showToast) window.showToast('数据已保存');
        } catch (e) {
            console.error('Save failed', e);
            if (window.showToast) window.showToast('保存失败！');
        }
    }

    // --- 订阅模式 ---
    subscribe(listener) {
        this.subscribers.push(listener);
        return () => {
            this.subscribers = this.subscribers.filter(l => l !== listener);
        };
    }

    _notify() {
        this.subscribers.forEach(cb => cb(this.state));
    }
}

// 导出单例
export const assetStore = new AssetStore();