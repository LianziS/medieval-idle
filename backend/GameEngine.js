/**
 * GameEngine.js - 后端游戏引擎
 * 所有游戏逻辑在后端执行，前端只负责UI渲染
 */

const { CONFIG, ITEM_TYPES, ACTION_TYPES } = require('./GameConfig');

class GameEngine {
    constructor(userId) {
        this.userId = userId;
        this.state = this.createInitialState();
        this.activeTimers = {};
    }
    
    /**
     * 创建初始游戏状态
     */
    createInitialState() {
        const state = {
            // 基础资源
            gold: 0,
            
            // 技能等级和经验
            level: 1,
            exp: 0,
            woodcuttingLevel: 1,
            woodcuttingExp: 0,
            miningLevel: 1,
            miningExp: 0,
            gatheringLevel: 1,
            gatheringExp: 0,
            craftingLevel: 1,
            craftingExp: 0,
            forgingLevel: 1,
            forgingExp: 0,
            tailoringLevel: 1,
            tailoringExp: 0,
            brewingLevel: 1,
            brewingExp: 0,
            alchemyLevel: 1,
            alchemyExp: 0,
            
            // 物品存储
            woodcuttingInventory: {},
            miningInventory: {},
            gatheringInventory: {},
            planksInventory: {},
            ingotsInventory: {},
            fabricsInventory: {},
            potionsInventory: {},
            essencesInventory: {},
            brewsInventory: {},
            tokensInventory: {
                wood_token: 0,
                mining_token: 0,
                gathering_token: 0,
                forging_token: 0,
                crafting_token: 0,
                alchemy_token: 0,
                tailoring_token: 0
            },
            
            // 建筑
            buildings: {},
            
            // 装备
            equipment: {
                axe: null,
                pickaxe: null,
                chisel: null,
                needle: null,
                scythe: null,
                hammer: null,
                tongs: null,
                rod: null
            },
            toolsInventory: {
                axes: [],
                pickaxes: [],
                chisels: [],
                needles: [],
                scythes: [],
                hammers: [],
                tongs: [],
                rods: []
            },
            
            // 当前行动状态
            activeAction: null,
            actionStartTime: 0,
            actionDuration: 0,
            actionRemaining: 0,
            actionCount: 0,
            
            // 行动队列
            actionQueue: [],
            maxQueueSize: 2,
            
            // 时间戳
            startTime: Date.now(),
            lastSave: Date.now()
        };
        
        // 初始化建筑
        CONFIG.buildings.forEach(b => {
            state.buildings[b.id] = { level: 0 };
        });
        
        return state;
    }
    
    /**
     * 获取物品数量
     */
    getItemCount(itemTypeKey, itemId) {
        const itemType = ITEM_TYPES[itemTypeKey];
        if (!itemType) return 0;
        const inventory = this.state[itemType.inventoryKey];
        return inventory[itemId] || 0;
    }
    
    /**
     * 添加物品
     */
    addItem(itemTypeKey, itemId, count = 1) {
        const itemType = ITEM_TYPES[itemTypeKey];
        if (!itemType) return;
        const inventory = this.state[itemType.inventoryKey];
        inventory[itemId] = (inventory[itemId] || 0) + count;
    }
    
    /**
     * 移除物品
     */
    removeItem(itemTypeKey, itemId, count = 1) {
        const itemType = ITEM_TYPES[itemTypeKey];
        if (!itemType) return false;
        const inventory = this.state[itemType.inventoryKey];
        const current = inventory[itemId] || 0;
        if (current < count) return false;
        inventory[itemId] = current - count;
        if (inventory[itemId] <= 0) {
            delete inventory[itemId];
        }
        return true;
    }
    
    /**
     * 获取技能等级
     */
    getSkillLevel(skillKey) {
        return this.state[skillKey] || 1;
    }
    
    /**
     * 添加技能经验
     */
    addSkillExp(skillKey, amount) {
        const currentLevel = this.state[skillKey];
        const currentExp = this.state[skillKey.replace('Level', 'Exp')] || 0;
        const newExp = currentExp + amount;
        
        // 计算升级
        const expNeeded = this.getExpForLevel(currentLevel + 1);
        if (newExp >= expNeeded) {
            this.state[skillKey] = currentLevel + 1;
            this.state[skillKey.replace('Level', 'Exp')] = newExp - expNeeded;
            return { leveledUp: true, newLevel: currentLevel + 1 };
        } else {
            this.state[skillKey.replace('Level', 'Exp')] = newExp;
            return { leveledUp: false };
        }
    }
    
    /**
     * 计算升级所需经验
     */
    getExpForLevel(level) {
        return Math.floor(100 * Math.pow(1.5, level - 1));
    }
    
    /**
     * 检查是否满足行动要求
     */
    canDoAction(actionTypeKey, actionId) {
        const actionType = ACTION_TYPES[actionTypeKey];
        if (!actionType) return { canDo: false, reason: '未知行动类型' };
        
        const config = CONFIG[actionType.configKey];
        const item = config.find(c => c.id === actionId);
        if (!item) return { canDo: false, reason: '未知行动目标' };
        
        // 检查等级要求
        const skillLevel = this.getSkillLevel(actionType.skillKey);
        if (item.reqLevel && skillLevel < item.reqLevel) {
            return { canDo: false, reason: `需要 ${actionType.name} Lv.${item.reqLevel}` };
        }
        
        // 检查材料
        if (actionType.needsMaterials && item.materials) {
            for (const [matId, count] of Object.entries(item.materials)) {
                const owned = this.getItemCount(actionType.dropType || 'WOOD', matId);
                if (owned < count) {
                    return { canDo: false, reason: `材料不足: 需要 ${matId} ${count}, 拥有 ${owned}` };
                }
            }
        }
        
        return { canDo: true };
    }
    
    /**
     * 开始行动
     */
    startAction(actionTypeKey, actionId, count = 1) {
        // 检查是否可以执行
        const check = this.canDoAction(actionTypeKey, actionId);
        if (!check.canDo) {
            return { success: false, reason: check.reason };
        }
        
        // 检查是否已有行动进行中
        if (this.state.activeAction) {
            // 加入队列
            if (this.state.actionQueue.length < this.state.maxQueueSize) {
                const actionType = ACTION_TYPES[actionTypeKey];
                const config = CONFIG[actionType.configKey];
                const item = config.find(c => c.id === actionId);
                
                this.state.actionQueue.push({
                    type: actionTypeKey,
                    id: actionId,
                    count: count,
                    name: item.name,
                    icon: item.icon
                });
                
                return { success: true, queued: true, queueLength: this.state.actionQueue.length };
            } else {
                return { success: false, reason: '队列已满' };
            }
        }
        
        // 计算实际可执行次数
        const actionType = ACTION_TYPES[actionTypeKey];
        const config = CONFIG[actionType.configKey];
        const item = config.find(c => c.id === actionId);
        
        let actualCount = count;
        if (actionType.needsMaterials && item.materials) {
            actualCount = this.calculateMaxCount(actionTypeKey, actionId, count);
            if (actualCount <= 0) {
                return { success: false, reason: '材料不足' };
            }
        }
        
        // 设置行动状态
        this.state.activeAction = {
            type: actionTypeKey,
            id: actionId,
            count: actualCount,
            remaining: actualCount
        };
        
        // 计算行动时长（考虑装备加成）
        const duration = this.calculateDuration(actionTypeKey, actionId);
        this.state.actionStartTime = Date.now();
        this.state.actionDuration = duration;
        this.state.actionRemaining = actualCount;
        this.state.actionCount = actualCount;
        
        return {
            success: true,
            action: {
                type: actionTypeKey,
                id: actionId,
                name: item.name,
                icon: item.icon,
                duration: duration,
                count: actualCount,
                remaining: actualCount
            }
        };
    }
    
    /**
     * 计算最大可执行次数
     */
    calculateMaxCount(actionTypeKey, actionId, requestedCount) {
        const actionType = ACTION_TYPES[actionTypeKey];
        const config = CONFIG[actionType.configKey];
        const item = config.find(c => c.id === actionId);
        
        if (!item.materials) return requestedCount;
        
        let maxCount = requestedCount;
        for (const [matId, count] of Object.entries(item.materials)) {
            const owned = this.getItemCount(actionType.dropType || 'WOOD', matId);
            const possible = Math.floor(owned / count);
            maxCount = Math.min(maxCount, possible);
        }
        
        return maxCount;
    }
    
    /**
     * 计算行动时长（考虑装备加成）
     */
    calculateDuration(actionTypeKey, actionId) {
        const actionType = ACTION_TYPES[actionTypeKey];
        const config = CONFIG[actionType.configKey];
        const item = config.find(c => c.id === actionId);
        
        let duration = item.duration;
        
        // 装备加成
        const bonus = this.getEquipmentBonus(actionType.id);
        duration = Math.floor(duration / (1 + bonus));
        
        return duration;
    }
    
    /**
     * 获取装备加成
     */
    getEquipmentBonus(actionId) {
        const equipMap = {
            woodcutting: 'axe',
            mining: 'pickaxe',
            crafting: 'chisel',
            tailoring: 'needle',
            gathering: 'scythe',
            forging: 'hammer',
            brewing: 'tongs',
            alchemy: 'rod'
        };
        
        const equipSlot = equipMap[actionId];
        if (!equipSlot) return 0;
        
        const equippedId = this.state.equipment[equipSlot];
        if (!equippedId) return 0;
        
        // 查找工具配置
        const toolsKey = equipSlot === 'axe' ? 'axes' : 
                        equipSlot === 'pickaxe' ? 'pickaxes' :
                        equipSlot === 'chisel' ? 'chisels' :
                        equipSlot === 'needle' ? 'needles' :
                        equipSlot === 'scythe' ? 'scythes' :
                        equipSlot === 'hammer' ? 'hammers' :
                        equipSlot === 'tongs' ? 'tongs' : 'rods';
        
        const tool = CONFIG.tools[toolsKey]?.find(t => t.id === equippedId);
        return tool?.speedBonus || 0;
    }
    
    /**
     * 完成一次行动
     */
    completeActionOnce(extraParams = null) {
        if (!this.state.activeAction) {
            return { success: false, reason: '没有进行中的行动' };
        }
        
        const action = this.state.activeAction;
        const actionType = ACTION_TYPES[action.type];
        const config = CONFIG[actionType.configKey];
        const item = config.find(c => c.id === action.id);
        
        let rewards = [];
        
        // 处理不同行动类型
        if (actionType.needsMaterials) {
            // 制作类行动：消耗材料，添加产物
            if (item.materials) {
                const materialType = actionType.materialType || 'WOOD';
                for (const [matId, count] of Object.entries(item.materials)) {
                    this.removeItem(materialType, matId, count);
                }
            }
            // 添加产物
            this.addItem(actionType.resultType, action.id, 1);
            rewards.push({ type: actionType.resultType, id: action.id, name: item.name, icon: item.icon, count: 1 });
        } else {
            // 采集类行动
            if (action.type === 'GATHERING') {
                // 采集有随机掉落
                const location = item;
                const selectedItemId = extraParams?.itemId || action.itemId;
                
                if (selectedItemId && selectedItemId !== 'all') {
                    // 采集单个物品
                    const itemConfig = location.items.find(i => i.id === selectedItemId);
                    if (itemConfig) {
                        this.addItem('GATHERING', selectedItemId, 1);
                        rewards.push({ 
                            type: 'GATHERING', 
                            id: selectedItemId, 
                            name: itemConfig.name, 
                            icon: itemConfig.icon, 
                            count: 1 
                        });
                    }
                } else {
                    // 全采集：每个物品30%概率获得
                    let drops = [];
                    location.items.forEach(itemConfig => {
                        if (Math.random() < 0.3) {
                            this.addItem('GATHERING', itemConfig.id, 1);
                            drops.push({ name: itemConfig.name, icon: itemConfig.icon, count: 1 });
                        }
                    });
                    // 保底：至少获得一个
                    if (drops.length === 0 && location.items.length > 0) {
                        const randomItem = location.items[Math.floor(Math.random() * location.items.length)];
                        this.addItem('GATHERING', randomItem.id, 1);
                        drops.push({ name: randomItem.name, icon: randomItem.icon, count: 1 });
                    }
                    rewards.push(...drops.map(d => ({ type: 'GATHERING', ...d })));
                }
            } else {
                // 伐木/挖矿：添加掉落物
                const dropId = item.dropId || action.id;
                const dropName = item.drop || item.name;
                const dropIcon = item.dropIcon || item.icon;
                
                this.addItem(actionType.dropType, dropId, 1);
                rewards.push({ 
                    type: actionType.dropType, 
                    id: dropId, 
                    name: dropName, 
                    icon: dropIcon, 
                    count: 1 
                });
            }
        }
        
        // 添加经验
        const expResult = this.addSkillExp(actionType.skillKey, item.exp);
        rewards.push({ 
            type: 'exp', 
            skill: actionType.name, 
            amount: item.exp, 
            leveledUp: expResult.leveledUp, 
            newLevel: expResult.newLevel 
        });
        
        // 尝试获取代币
        if (Math.random() < 0.05) {
            const tokenId = `${actionType.id}_token`;
            if (!this.state.tokensInventory) {
                this.state.tokensInventory = {};
            }
            this.state.tokensInventory[tokenId] = (this.state.tokensInventory[tokenId] || 0) + 1;
            rewards.push({ type: 'TOKEN', id: tokenId, name: `${actionType.name}代币`, icon: '🪙', count: 1 });
        }
        
        // 更新剩余次数
        action.remaining--;
        this.state.actionRemaining = action.remaining;
        
        // 检查是否完成所有次数
        if (action.remaining <= 0) {
            this.state.activeAction = null;
            
            // 检查队列
            if (this.state.actionQueue.length > 0) {
                const nextAction = this.state.actionQueue.shift();
                return {
                    success: true,
                    completed: true,
                    rewards: rewards,
                    nextAction: nextAction
                };
            }
            
            return { success: true, completed: true, rewards: rewards };
        }
        
        return { success: true, rewards: rewards, remaining: action.remaining };
    }
    
    /**
     * 取消当前行动
     */
    cancelAction() {
        if (!this.state.activeAction) {
            return { success: false, reason: '没有进行中的行动' };
        }
        
        const action = this.state.activeAction;
        this.state.activeAction = null;
        this.state.actionRemaining = 0;
        
        return { success: true, cancelledAction: action };
    }
    
    /**
     * 获取完整状态（用于同步到前端）
     */
    getFullState() {
        return {
            ...this.state,
            activeActionInfo: this.state.activeAction ? {
                ...this.state.activeAction,
                startTime: this.state.actionStartTime,
                duration: this.state.actionDuration
            } : null
        };
    }
    
    /**
     * 装备工具
     */
    equipTool(slotType, toolId) {
        // 检查是否拥有该工具
        const toolsKey = this.getToolsKey(slotType);
        const inventory = this.state.toolsInventory[toolsKey] || [];
        
        if (!inventory.includes(toolId)) {
            return { success: false, reason: '没有该工具' };
        }
        
        // 检查装备等级需求
        const tool = CONFIG.tools[toolsKey]?.find(t => t.id === toolId);
        if (tool && tool.reqEquipLevel) {
            const skillKey = this.getSkillKeyFromSlot(slotType);
            const skillLevel = this.getSkillLevel(skillKey);
            if (skillLevel < tool.reqEquipLevel) {
                return { success: false, reason: `需要 ${skillKey} Lv.${tool.reqEquipLevel}` };
            }
        }
        
        // 如果已装备其他工具，先卸下
        const currentEquipped = this.state.equipment[slotType];
        if (currentEquipped && currentEquipped !== toolId) {
            // 将原装备放回背包
            inventory.push(currentEquipped);
        }
        
        // 装备新工具
        this.state.equipment[slotType] = toolId;
        
        // 从背包移除
        const idx = inventory.indexOf(toolId);
        if (idx > -1) {
            inventory.splice(idx, 1);
        }
        
        return { success: true, equipped: toolId, slot: slotType };
    }
    
    /**
     * 卸下装备
     */
    unequipTool(slotType) {
        const equippedId = this.state.equipment[slotType];
        if (!equippedId) {
            return { success: false, reason: '该槽位没有装备' };
        }
        
        const toolsKey = this.getToolsKey(slotType);
        this.state.toolsInventory[toolsKey].push(equippedId);
        this.state.equipment[slotType] = null;
        
        return { success: true, unequipped: equippedId };
    }
    
    /**
     * 辅助方法
     */
    getToolsKey(slotType) {
        const map = {
            axe: 'axes',
            pickaxe: 'pickaxes',
            chisel: 'chisels',
            needle: 'needles',
            scythe: 'scythes',
            hammer: 'hammers',
            tongs: 'tongs',
            rod: 'rods'
        };
        return map[slotType] || slotType;
    }
    
    getSkillKeyFromSlot(slotType) {
        const map = {
            axe: 'woodcuttingLevel',
            pickaxe: 'miningLevel',
            chisel: 'craftingLevel',
            needle: 'tailoringLevel',
            scythe: 'gatheringLevel',
            hammer: 'forgingLevel',
            tongs: 'brewingLevel',
            rod: 'alchemyLevel'
        };
        return map[slotType] || 'level';
    }
}

module.exports = { GameEngine, CONFIG, ACTION_TYPES, ITEM_TYPES };