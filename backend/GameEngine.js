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
     * 添加技能经验（支持连续升级）
     */
    addSkillExp(skillKey, amount) {
        let currentLevel = this.state[skillKey];
        let currentExp = this.state[skillKey.replace('Level', 'Exp')] || 0;
        currentExp += amount;
        
        // 循环检查升级（支持连续升级）
        let leveledUp = false;
        let totalLevelGain = 0;
        
        // getExpForLevel(N) = 从 Lv.N 升到 Lv.N+1 所需的增量经验
        while (currentExp >= this.getExpForLevel(currentLevel)) {
            const expNeeded = this.getExpForLevel(currentLevel);
            currentExp -= expNeeded;
            currentLevel++;
            totalLevelGain++;
            leveledUp = true;
        }
        
        this.state[skillKey] = currentLevel;
        this.state[skillKey.replace('Level', 'Exp')] = currentExp;
        
        return { leveledUp, newLevel: currentLevel, levelGain: totalLevelGain };
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
                const owned = this.getItemCount(actionType.materialType || 'WOOD', matId);
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
    startAction(actionTypeKey, actionId, count = 1, extraParams = null) {
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
                    icon: item.icon,
                    itemId: extraParams?.itemId
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
        
        // 无限模式：count 为 Infinity 或 -1
        const isInfinite = count === Infinity || count === -1 || count >= 999;
        
        let actualCount = count;
        if (!isInfinite && actionType.needsMaterials && item.materials) {
            actualCount = this.calculateMaxCount(actionTypeKey, actionId, count);
            if (actualCount <= 0) {
                return { success: false, reason: '材料不足' };
            }
        }
        
        // 设置行动状态
        this.state.activeAction = {
            type: actionTypeKey,
            id: actionId,
            count: isInfinite ? Infinity : actualCount,
            remaining: isInfinite ? Infinity : actualCount,
            isInfinite: isInfinite,  // 标记是否为无限模式
            itemId: extraParams?.itemId
        };
        
        // 计算行动时长（考虑装备加成）
        const duration = this.calculateDuration(actionTypeKey, actionId);
        this.state.actionStartTime = Date.now();
        this.state.actionDuration = duration;
        this.state.actionRemaining = isInfinite ? Infinity : actualCount;
        this.state.actionCount = isInfinite ? Infinity : actualCount;
        
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
            const owned = this.getItemCount(actionType.materialType || 'WOOD', matId);
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
        
        // 更新剩余次数（无限模式不递减）
        if (!action.isInfinite) {
            action.remaining--;
            this.state.actionRemaining = action.remaining;
        }
        
        // 检查是否完成所有次数（无限模式永远不会完成）
        if (!action.isInfinite && action.remaining <= 0) {
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
        
        // 还有剩余次数（或无限模式），重置开始时间
        this.state.actionStartTime = Date.now();
        
        return { success: true, rewards: rewards, remaining: action.remaining, isInfinite: action.isInfinite };
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
        
        // 检查队列，自动开始第一个
        let nextAction = null;
        if (this.state.actionQueue.length > 0) {
            const queueItem = this.state.actionQueue.shift();
            this.startAction(queueItem.type, queueItem.id, queueItem.count);
            nextAction = queueItem;
        }
        
        return { success: true, cancelledAction: action, nextAction: nextAction };
    }
    
    /**
     * 移除队列中的行动
     */
    removeQueueItem(index) {
        if (index >= 0 && index < this.state.actionQueue.length) {
            const removed = this.state.actionQueue.splice(index, 1);
            return { success: true, removed: removed[0] };
        }
        return { success: false, reason: '索引无效' };
    }
    
    /**
     * 移动队列中的行动
     */
    moveQueueItem(index, action) {
        const queue = this.state.actionQueue;
        if (index < 0 || index >= queue.length) {
            return { success: false, reason: '索引无效' };
        }
        
        const item = queue[index];
        
        switch (action) {
            case 'up':
                if (index > 0) {
                    queue.splice(index, 1);
                    queue.splice(index - 1, 0, item);
                }
                break;
            case 'down':
                if (index < queue.length - 1) {
                    queue.splice(index, 1);
                    queue.splice(index + 1, 0, item);
                }
                break;
            case 'top':
                queue.splice(index, 1);
                queue.unshift(item);
                break;
            case 'bottom':
                queue.splice(index, 1);
                queue.push(item);
                break;
        }
        
        return { success: true };
    }
    
    /**
     * 用队列项替换当前行动
     */
    replaceCurrentWithQueue(index) {
        const queue = this.state.actionQueue;
        
        if (index < 0 || index >= queue.length) {
            return { success: false, reason: '索引无效' };
        }
        
        if (!this.state.activeAction) {
            return { success: false, reason: '没有进行中的行动' };
        }
        
        // 获取当前行动信息
        const currentAction = this.state.activeAction;
        const actionType = ACTION_TYPES[currentAction.type];
        const config = CONFIG[actionType.configKey];
        const item = config.find(c => c.id === currentAction.id);
        
        // 保存当前行动（剩余次数）
        const savedAction = {
            type: currentAction.type,
            id: currentAction.id,
            count: currentAction.remaining,
            remaining: currentAction.remaining,
            name: item?.name || currentAction.id,
            icon: item?.icon || '🔧'
        };
        
        // 获取要执行的队列项
        const queueItem = queue[index];
        
        // 移除被选中的队列项
        queue.splice(index, 1);
        
        // 当前行动放到队列第一位
        queue.unshift(savedAction);
        
        // 关键：先清除当前行动，这样 startAction 才会直接开始
        this.state.activeAction = null;
        
        // 开始新的行动
        return this.startAction(queueItem.type, queueItem.id, queueItem.count);
    }
    
    /**
     * 立即开始新行动（清空当前行动和队列）
     */
    startImmediately(actionTypeKey, actionId, count = 1) {
        // 清空当前行动
        this.state.activeAction = null;
        this.state.actionRemaining = 0;
        
        // 清空队列
        this.state.actionQueue = [];
        
        // 开始新行动
        return this.startAction(actionTypeKey, actionId, count);
    }
    
    /**
     * 清空队列
     */
    clearQueue() {
        this.state.actionQueue = [];
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
     * 锻造工具
     */
    forgeTool(toolType, toolIndex, ingotId, plankId) {
        const toolsKey = this.getToolsKey(toolType);
        const tools = CONFIG.tools[toolsKey];
        const tool = tools?.[toolIndex];
        
        if (!tool) {
            return { success: false, reason: '工具不存在' };
        }
        
        // 检查等级要求
        const forgingLevel = this.state.forgingLevel || 1;
        if (forgingLevel < tool.reqEquipLevel) {
            return { success: false, reason: `需要锻造 Lv.${tool.reqEquipLevel}` };
        }
        
        // 获取材料需求
        const materials = CONFIG.toolCraftingMaterials?.[toolsKey]?.[toolIndex];
        if (!materials) {
            return { success: false, reason: '材料配置错误' };
        }
        
        // 检查材料
        const ingots = this.state.ingotsInventory || {};
        const planks = this.state.planksInventory || {};
        
        if (materials.ore && (ingots[ingotId] || 0) < materials.ore) {
            return { success: false, reason: `矿锭不足: 需要 ${materials.ore}` };
        }
        
        if (materials.plank && (planks[plankId] || 0) < materials.plank) {
            return { success: false, reason: `木板不足: 需要 ${materials.plank}` };
        }
        
        if (materials.ingot && (ingots[ingotId] || 0) < materials.ingot) {
            return { success: false, reason: `矿锭不足: 需要 ${materials.ingot}` };
        }
        
        // 检查前置工具
        if (materials.prevTool) {
            const prevTools = this.state.toolsInventory[toolsKey] || [];
            const prevIndex = prevTools.indexOf(materials.prevTool);
            if (prevIndex === -1) {
                return { success: false, reason: '需要前置工具' };
            }
            // 消耗前置工具
            prevTools.splice(prevIndex, 1);
        }
        
        // 消耗材料
        if (materials.ore) {
            ingots[ingotId] = (ingots[ingotId] || 0) - materials.ore;
            if (ingots[ingotId] <= 0) delete ingots[ingotId];
        }
        
        if (materials.plank) {
            planks[plankId] = (planks[plankId] || 0) - materials.plank;
            if (planks[plankId] <= 0) delete planks[plankId];
        }
        
        if (materials.ingot) {
            ingots[ingotId] = (ingots[ingotId] || 0) - materials.ingot;
            if (ingots[ingotId] <= 0) delete ingots[ingotId];
        }
        
        // 添加工具到背包
        if (!this.state.toolsInventory[toolsKey]) {
            this.state.toolsInventory[toolsKey] = [];
        }
        this.state.toolsInventory[toolsKey].push(tool.id);
        
        // 添加经验
        const exp = toolIndex * 20 + 10;
        this.addSkillExp('forgingLevel', exp);
        
        return { 
            success: true, 
            tool: tool,
            exp: exp
        };
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
    
    /**
     * 商人系统方法
     */
    
    // 获取商人数据
    getMerchantData(merchantId) {
        const merchant = CONFIG.merchants.find(m => m.id === merchantId);
        if (!merchant) return null;
        
        // 从用户状态获取好感度、已完成任务、已领取任务
        const userMerchantData = this.state.merchantData?.[merchantId] || {
            favorability: merchant.favorability || 0,
            completedQuests: [],
            acceptedQuests: []
        };
        
        return {
            ...merchant,
            ...userMerchantData
        };
    }
    
    // 领取任务
    acceptQuest(merchantId, questId) {
        const merchant = CONFIG.merchants.find(m => m.id === merchantId);
        if (!merchant) return { success: false, reason: '商人不存在' };
        
        const quest = merchant.quests?.find(q => q.id === questId);
        if (!quest) return { success: false, reason: '任务不存在' };
        
        // 初始化商人数据
        if (!this.state.merchantData) this.state.merchantData = {};
        if (!this.state.merchantData[merchantId]) {
            this.state.merchantData[merchantId] = {
                favorability: 0,
                completedQuests: [],
                acceptedQuests: []
            };
        }
        
        const merchantData = this.state.merchantData[merchantId];
        
        // 检查是否已完成
        if (merchantData.completedQuests?.includes(questId)) {
            return { success: false, reason: '任务已完成' };
        }
        
        // 检查是否已领取
        if (merchantData.acceptedQuests?.includes(questId)) {
            return { success: false, reason: '任务已领取' };
        }
        
        // 添加到已领取列表
        if (!merchantData.acceptedQuests) merchantData.acceptedQuests = [];
        merchantData.acceptedQuests.push(questId);
        
        return { success: true, quest: quest };
    }
    
    // 购买商品
    buyGoods(merchantId, goodsId, count = 1) {
        const merchant = CONFIG.merchants.find(m => m.id === merchantId);
        if (!merchant) return { success: false, reason: '商人不存在' };
        
        const goods = merchant.goods?.find(g => g.id === goodsId);
        if (!goods) return { success: false, reason: '商品不存在' };
        
        const totalCost = goods.price * count;
        
        if (goods.currency === 'gold') {
            if ((this.state.gold || 0) < totalCost) {
                return { success: false, reason: '金币不足' };
            }
            this.state.gold -= totalCost;
        } else {
            // 代币支付
            const tokens = this.state.tokensInventory || {};
            if ((tokens[goods.currency] || 0) < totalCost) {
                return { success: false, reason: '代币不足' };
            }
            tokens[goods.currency] -= totalCost;
        }
        
        // 添加商品到背包（这里简化处理，添加到采集物品）
        // 实际应该根据商品类型决定存储位置
        if (!this.state.gatheringInventory) {
            this.state.gatheringInventory = {};
        }
        this.state.gatheringInventory[goodsId] = (this.state.gatheringInventory[goodsId] || 0) + count;
        
        return { success: true, goods: goods, count: count };
    }
    
    // 提交任务
    submitQuest(merchantId, questId) {
        const merchant = CONFIG.merchants.find(m => m.id === merchantId);
        if (!merchant) return { success: false, reason: '商人不存在' };
        
        const quest = merchant.quests?.find(q => q.id === questId);
        if (!quest) return { success: false, reason: '任务不存在' };
        
        // 初始化商人数据
        if (!this.state.merchantData) this.state.merchantData = {};
        if (!this.state.merchantData[merchantId]) {
            this.state.merchantData[merchantId] = { favorability: 0, completedQuests: [], acceptedQuests: [] };
        }
        
        const merchantData = this.state.merchantData[merchantId];
        
        // 检查是否已完成
        if (merchantData.completedQuests?.includes(questId)) {
            return { success: false, reason: '任务已完成' };
        }
        
        // 检查是否已领取
        if (!merchantData.acceptedQuests?.includes(questId)) {
            return { success: false, reason: '请先领取任务' };
        }
        
        // 检查材料
        const req = quest.requirement;
        const itemType = ITEM_TYPES[req.type];
        if (!itemType) return { success: false, reason: '物品类型错误' };
        
        const inventory = this.state[itemType.inventoryKey] || {};
        if ((inventory[req.id] || 0) < req.count) {
            return { success: false, reason: `材料不足: 需要 ${req.count} 个` };
        }
        
        // 消耗材料
        inventory[req.id] -= req.count;
        if (inventory[req.id] <= 0) delete inventory[req.id];
        
        // 发放奖励
        if (quest.reward.gold) {
            this.state.gold = (this.state.gold || 0) + quest.reward.gold;
        }
        
        // 更新好感度
        if (quest.reward.favorability) {
            merchantData.favorability = (merchantData.favorability || 0) + quest.reward.favorability;
        }
        
        // 添加到已完成列表
        merchantData.completedQuests.push(questId);
        
        // 从已领取列表移除
        merchantData.acceptedQuests = merchantData.acceptedQuests.filter(id => id !== questId);
        
        return { 
            success: true, 
            quest: quest,
            reward: quest.reward
        };
    }
    
    // 出售物品
    sellItem(itemTypeKey, itemId, count = 1) {
        const itemType = ITEM_TYPES[itemTypeKey];
        if (!itemType) return { success: false, reason: '物品类型错误' };
        
        const inventory = this.state[itemType.inventoryKey] || {};
        if ((inventory[itemId] || 0) < count) {
            return { success: false, reason: '物品数量不足' };
        }
        
        // 获取价格（简化：按类型定价）
        const basePrice = CONFIG.resourcePrices?.[itemTypeKey.toLowerCase()] || 1;
        const totalPrice = basePrice * count;
        
        // 扣除物品，增加金币
        inventory[itemId] -= count;
        if (inventory[itemId] <= 0) delete inventory[itemId];
        this.state.gold = (this.state.gold || 0) + totalPrice;
        
        return { 
            success: true, 
            sold: { type: itemTypeKey, id: itemId, count: count },
            gold: totalPrice
        };
    }
    
    /**
     * 建筑升级
     */
    upgradeBuilding(buildingId) {
        const buildingConfig = CONFIG.buildings.find(b => b.id === buildingId);
        if (!buildingConfig) return { success: false, reason: '建筑不存在' };
        
        // 检查是否已解锁
        if (buildingConfig.unlockReq) {
            const tentLevel = this.state.buildings?.tent?.level || 0;
            if (buildingConfig.unlockReq.tentLevel !== undefined && tentLevel < buildingConfig.unlockReq.tentLevel) {
                return { success: false, reason: `需要帐篷 Lv.${buildingConfig.unlockReq.tentLevel + 1}` };
            }
        }
        
        // 获取当前等级
        if (!this.state.buildings) this.state.buildings = {};
        if (!this.state.buildings[buildingId]) this.state.buildings[buildingId] = { level: 0 };
        
        const currentLevel = this.state.buildings[buildingId].level;
        
        // 检查是否已达最大等级
        if (buildingConfig.maxLevel && currentLevel >= buildingConfig.maxLevel) {
            return { success: false, reason: '已达最大等级' };
        }
        
        // 计算升级费用（基础费用 × (等级 + 1)）
        const costMultiplier = currentLevel + 1;
        const cost = {};
        
        if (buildingConfig.baseCost) {
            for (const [resource, amount] of Object.entries(buildingConfig.baseCost)) {
                cost[resource] = amount * costMultiplier;
            }
        }
        
        // 检查资源 - 使用 ITEM_TYPES 确定库存位置
        const woodcuttingInv = this.state.woodcuttingInventory || {};
        const miningInv = this.state.miningInventory || {};
        const gatheringInv = this.state.gatheringInventory || {};
        const planksInv = this.state.planksInventory || {};
        const ingotsInv = this.state.ingotsInventory || {};
        const fabricsInv = this.state.fabricsInventory || {};
        
        // 定义所有木材类型
        const woodTypes = ['pine', 'iron_birch', 'wind_tree', 'flame_tree', 'frost_maple', 'thunder_tree', 'ancient_oak', 'world_tree'];
        // 定义所有矿石类型
        const oreTypes = ['cyan_ore', 'red_iron', 'feather_ore', 'hell_ore', 'white_ore', 'thunder_ore', 'brilliant', 'star_ore'];
        
        for (const [resource, amount] of Object.entries(cost)) {
            let available = 0;
            
            // 检查木材
            if (woodTypes.includes(resource)) {
                available = woodcuttingInv[resource] || 0;
            }
            // 检查矿石
            else if (oreTypes.includes(resource)) {
                available = miningInv[resource] || 0;
            }
            // 检查木板
            else if (resource.endsWith('_plank')) {
                available = planksInv[resource] || 0;
            }
            // 检查矿锭
            else if (resource.endsWith('_ingot')) {
                available = ingotsInv[resource] || 0;
            }
            // 检查布料
            else if (resource.endsWith('_cloth') || ['jute_cloth', 'linen_cloth', 'wool_cloth', 'silk_cloth', 'wind_silk', 'shadow_cloth', 'dragon_silk', 'celestial_cloth'].includes(resource)) {
                available = fabricsInv[resource] || 0;
            }
            // 检查采集物（草药、蜂蜜等）
            else if (['sweet_berry', 'wild_mint', 'honey', 'blood_rose', 'jute', 'flax', 'wool', 'silk', 'wind_silk_raw', 'shadow_thread', 'dragon_fiber', 'celestial_lotus'].includes(resource)) {
                available = gatheringInv[resource] || 0;
            }
            // 检查金币
            else if (resource === 'gold') {
                available = this.state.gold || 0;
            }
            // 默认：尝试从各库存查找
            else {
                available = woodcuttingInv[resource] || miningInv[resource] || gatheringInv[resource] || planksInv[resource] || ingotsInv[resource] || fabricsInv[resource] || 0;
            }
            
            if (available < amount) {
                return { success: false, reason: `${resource} 不足: 需要 ${amount}, 拥有 ${available}` };
            }
        }
        
        // 扣除资源
        for (const [resource, amount] of Object.entries(cost)) {
            if (woodTypes.includes(resource)) {
                woodcuttingInv[resource] = (woodcuttingInv[resource] || 0) - amount;
                if (woodcuttingInv[resource] <= 0) delete woodcuttingInv[resource];
            }
            else if (oreTypes.includes(resource)) {
                miningInv[resource] = (miningInv[resource] || 0) - amount;
                if (miningInv[resource] <= 0) delete miningInv[resource];
            }
            else if (resource.endsWith('_plank')) {
                planksInv[resource] = (planksInv[resource] || 0) - amount;
                if (planksInv[resource] <= 0) delete planksInv[resource];
            }
            else if (resource.endsWith('_ingot')) {
                ingotsInv[resource] = (ingotsInv[resource] || 0) - amount;
                if (ingotsInv[resource] <= 0) delete ingotsInv[resource];
            }
            else if (resource.endsWith('_cloth') || ['jute_cloth', 'linen_cloth', 'wool_cloth', 'silk_cloth', 'wind_silk', 'shadow_cloth', 'dragon_silk', 'celestial_cloth'].includes(resource)) {
                fabricsInv[resource] = (fabricsInv[resource] || 0) - amount;
                if (fabricsInv[resource] <= 0) delete fabricsInv[resource];
            }
            else if (['sweet_berry', 'wild_mint', 'honey', 'blood_rose', 'jute', 'flax', 'wool', 'silk', 'wind_silk_raw', 'shadow_thread', 'dragon_fiber', 'celestial_lotus'].includes(resource)) {
                gatheringInv[resource] = (gatheringInv[resource] || 0) - amount;
                if (gatheringInv[resource] <= 0) delete gatheringInv[resource];
            }
            else if (resource === 'gold') {
                this.state.gold = (this.state.gold || 0) - amount;
            }
            else {
                // 尝试从各库存扣除
                if (woodcuttingInv[resource]) {
                    woodcuttingInv[resource] -= amount;
                    if (woodcuttingInv[resource] <= 0) delete woodcuttingInv[resource];
                } else if (miningInv[resource]) {
                    miningInv[resource] -= amount;
                    if (miningInv[resource] <= 0) delete miningInv[resource];
                } else if (gatheringInv[resource]) {
                    gatheringInv[resource] -= amount;
                    if (gatheringInv[resource] <= 0) delete gatheringInv[resource];
                }
            }
        }
        
        // 升级建筑
        this.state.buildings[buildingId].level = currentLevel + 1;
        
        // 获取新名称
        let newName = buildingConfig.name;
        if (buildingConfig.levelNames && buildingConfig.levelNames[currentLevel + 1]) {
            newName = buildingConfig.levelNames[currentLevel + 1];
        }
        
        return { 
            success: true, 
            building: {
                id: buildingId,
                level: currentLevel + 1,
                name: newName
            },
            cost: cost
        };
    }
}

module.exports = { GameEngine, CONFIG, ACTION_TYPES, ITEM_TYPES };