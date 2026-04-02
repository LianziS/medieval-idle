/**
 * GameEngine.js - 后端游戏引擎
 * 所有游戏逻辑在后端执行，前端只负责UI渲染
 */

// ============ 配置数据（从前端迁移） ============

const CONFIG = {
    // 树木配置
    trees: [
        { id: 'pine', name: '青杉木', icon: '🌲', duration: 5000, exp: 3, reqLevel: 1, dropItem: 'pine', dropIcon: '🪵', dropExp: 2 },
        { id: 'iron_birch', name: '铁桦木', icon: '🌳', duration: 8000, exp: 5, reqLevel: 5, dropItem: 'iron_birch', dropIcon: '🪵', dropExp: 4 },
        { id: 'wind_tree', name: '风啸木', icon: '🌬️', duration: 12000, exp: 8, reqLevel: 10, dropItem: 'wind_tree', dropIcon: '🪵', dropExp: 6 },
        { id: 'flame_tree', name: '焰心木', icon: '🔥', duration: 18000, exp: 12, reqLevel: 20, dropItem: 'flame_tree', dropIcon: '🪵', dropExp: 10 },
        { id: 'frost_maple', name: '霜叶木', icon: '❄️', duration: 25000, exp: 18, reqLevel: 35, dropItem: 'frost_maple', dropIcon: '🪵', dropExp: 15 },
        { id: 'thunder_tree', name: '雷鸣木', icon: '⚡', duration: 35000, exp: 25, reqLevel: 50, dropItem: 'thunder_tree', dropIcon: '🪵', dropExp: 20 },
        { id: 'ancient_oak', name: '古橡木', icon: '🪴', duration: 50000, exp: 35, reqLevel: 65, dropItem: 'ancient_oak', dropIcon: '🪵', dropExp: 28 },
        { id: 'world_tree', name: '世界木', icon: '✨', duration: 80000, exp: 50, reqLevel: 80, dropItem: 'world_tree', dropIcon: '🪵', dropExp: 40 }
    ],
    
    // 矿石配置
    ores: [
        { id: 'iron_ore', name: '铁矿', icon: '🪨', duration: 6000, exp: 4, reqLevel: 1, dropItem: 'iron_ore', dropIcon: '🪨', dropExp: 3 },
        { id: 'silver_ore', name: '银矿', icon: '⚪', duration: 10000, exp: 7, reqLevel: 5, dropItem: 'silver_ore', dropIcon: '🪨', dropExp: 5 },
        { id: 'gold_ore', name: '金矿', icon: '🟡', duration: 15000, exp: 10, reqLevel: 10, dropItem: 'gold_ore', dropIcon: '🪨', dropExp: 8 },
        { id: 'ruby_ore', name: '红宝石矿', icon: '🔴', duration: 22000, exp: 15, reqLevel: 20, dropItem: 'ruby_ore', dropIcon: '💎', dropExp: 12 },
        { id: 'emerald_ore', name: '绿宝石矿', icon: '🟢', duration: 30000, exp: 22, reqLevel: 35, dropItem: 'emerald_ore', dropIcon: '💎', dropExp: 18 },
        { id: 'diamond_ore', name: '钻石矿', icon: '💎', duration: 45000, exp: 30, reqLevel: 50, dropItem: 'diamond_ore', dropIcon: '💎', dropExp: 25 },
        { id: 'star_ore', name: '星辰矿', icon: '🌟', duration: 60000, exp: 45, reqLevel: 65, dropItem: 'star_ore', dropIcon: '🌟', dropExp: 35 },
        { id: 'void_ore', name: '虚空矿', icon: '🌀', duration: 90000, exp: 60, reqLevel: 80, dropItem: 'void_ore', dropIcon: '🌀', dropExp: 50 }
    ],
    
    // 采集地点配置
    gatheringLocations: [
        {
            id: 'forest_edge',
            name: '森林边缘',
            icon: '🌲',
            duration: 8000,
            exp: 5,
            reqLevel: 1,
            items: [
                { id: 'wild_herb', name: '野草', icon: '🌿', exp: 2, probability: 0.8 },
                { id: 'mushroom', name: '蘑菇', icon: '🍄', exp: 3, probability: 0.5 },
                { id: 'berry', name: '浆果', icon: '🫐', exp: 2, probability: 0.6 }
            ]
        },
        {
            id: 'deep_forest',
            name: '深林腹地',
            icon: '🌳',
            duration: 15000,
            exp: 10,
            reqLevel: 10,
            items: [
                { id: 'rare_herb', name: '稀有草药', icon: '🌱', exp: 5, probability: 0.4 },
                { id: 'forest_flower', name: '森林花', icon: '🌸', exp: 4, probability: 0.6 },
                { id: 'tree_resin', name: '树树脂', icon: '🍯', exp: 6, probability: 0.3 }
            ]
        }
    ],
    
    // 木板配置
    woodPlanks: [
        { id: 'pine_plank', name: '青杉木板', icon: '🪵', reqLevel: 1, duration: 6000, exp: 5, materials: { pine: 2 } },
        { id: 'iron_birch_plank', name: '铁桦木板', icon: '🪵', reqLevel: 10, duration: 8000, exp: 7.5, materials: { iron_birch: 2 } }
    ],
    
    // 矿锭配置
    ingots: [
        { id: 'iron_ingot', name: '铁锭', icon: '🔩', reqLevel: 1, duration: 8000, exp: 6, materials: { iron_ore: 3 } },
        { id: 'silver_ingot', name: '银锭', icon: '⚪', reqLevel: 5, duration: 12000, exp: 10, materials: { silver_ore: 3 } }
    ],
    
    // 建筑配置
    buildings: [
        { id: 'tent', name: '帐篷', icon: '🏕️', baseCost: { gold: 0 }, maxLevel: 9, unlockReq: null, levelNames: ['破帐篷', '简陋帐篷', '普通帐篷', '精致帐篷', '豪华帐篷', '行军帐篷', '营地', '军营', '城堡'] }
    ],
    
    // 工具配置
    tools: {
        axes: [
            { id: 'basic_axe', name: '基础斧', icon: '🔧', speedBonus: 0.1, reqCraftLevel: 1, reqEquipLevel: 1 }
        ],
        pickaxes: [
            { id: 'basic_pickaxe', name: '基础镐', icon: '⛏️', speedBonus: 0.1, reqCraftLevel: 1, reqEquipLevel: 1 }
        ]
    }
};

// ============ 物品类型映射 ============

const ITEM_TYPES = {
    WOOD: { inventoryKey: 'woodcuttingInventory', name: '木材' },
    ORE: { inventoryKey: 'miningInventory', name: '矿石' },
    GATHERING: { inventoryKey: 'gatheringInventory', name: '采集物' },
    PLANK: { inventoryKey: 'planksInventory', name: '木板' },
    INGOT: { inventoryKey: 'ingotsInventory', name: '矿锭' },
    FABRIC: { inventoryKey: 'fabricsInventory', name: '布料' },
    POTION: { inventoryKey: 'potionsInventory', name: '药水' },
    ESSENCE: { inventoryKey: 'essencesInventory', name: '精华' },
    BREW: { inventoryKey: 'brewsInventory', name: '酒类' },
    TOKEN: { inventoryKey: 'tokensInventory', name: '代币' }
};

// ============ 行动类型配置 ============

const ACTION_TYPES = {
    WOODCUTTING: {
        id: 'woodcutting',
        name: '伐木',
        configKey: 'trees',
        skillKey: 'woodcuttingLevel',
        expKey: 'woodcuttingExp',
        inventoryKey: 'woodcuttingInventory',
        dropType: 'WOOD',
        needsMaterials: false
    },
    MINING: {
        id: 'mining',
        name: '挖矿',
        configKey: 'ores',
        skillKey: 'miningLevel',
        expKey: 'miningExp',
        inventoryKey: 'miningInventory',
        dropType: 'ORE',
        needsMaterials: false
    },
    GATHERING: {
        id: 'gathering',
        name: '采集',
        configKey: 'gatheringLocations',
        skillKey: 'gatheringLevel',
        expKey: 'gatheringExp',
        inventoryKey: 'gatheringInventory',
        dropType: 'GATHERING',
        needsMaterials: false
    },
    CRAFTING: {
        id: 'crafting',
        name: '制作',
        configKey: 'woodPlanks',
        skillKey: 'craftingLevel',
        expKey: 'craftingExp',
        inventoryKey: 'planksInventory',
        resultType: 'PLANK',
        needsMaterials: true
    },
    FORGING: {
        id: 'forging',
        name: '锻造',
        configKey: 'ingots',
        skillKey: 'forgingLevel',
        expKey: 'forgingExp',
        inventoryKey: 'ingotsInventory',
        resultType: 'INGOT',
        needsMaterials: true
    }
};

// ============ 游戏引擎类 ============

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
    completeActionOnce() {
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
            // 消耗材料
            if (item.materials) {
                for (const [matId, count] of Object.entries(item.materials)) {
                    this.removeItem(actionType.dropType || 'WOOD', matId, count);
                }
            }
            // 添加产物
            this.addItem(actionType.resultType, action.id, 1);
            rewards.push({ type: actionType.resultType, id: action.id, name: item.name, icon: item.icon, count: 1 });
        } else {
            // 采集类行动：添加掉落物
            if (actionType.dropType) {
                this.addItem(actionType.dropType, item.dropItem || action.id, 1);
                rewards.push({ 
                    type: actionType.dropType, 
                    id: item.dropItem || action.id, 
                    name: item.dropItem ? item.name : item.name, 
                    icon: item.dropIcon || item.icon, 
                    count: 1 
                });
            }
        }
        
        // 添加经验
        const expResult = this.addSkillExp(actionType.skillKey, item.exp);
        rewards.push({ type: 'exp', skill: actionType.name, amount: item.exp, leveledUp: expResult.leveledUp, newLevel: expResult.newLevel });
        
        // 更新剩余次数
        action.remaining--;
        this.state.actionRemaining = action.remaining;
        
        // 检查是否完成所有次数
        if (action.remaining <= 0) {
            this.state.activeAction = null;
            
            // 检查队列
            if (this.state.actionQueue.length > 0) {
                const nextAction = this.state.actionQueue.shift();
                // 自动开始下一个行动（返回信号让前端处理）
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