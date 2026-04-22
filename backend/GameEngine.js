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
            cleanedFeathersInventory: {},
            manuscriptsInventory: {},
            threadsInventory: {},
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
            
            // 笔装备库存（吟游诗人）
            pensInventory: [],
            
            // 靴子装备库存（吟游诗人）
            bootsInventory: [],
            
            // 乐器装备库存（吟游诗人）
            instrumentsInventory: [],
            
            // 回音石库存
            echoStoneInventory: 0,
            
            // 海螺墨库存
            conchInkInventory: 0,
            
            // 河铸钉库存
            riverNailInventory: 0,
            
            // 黑石库存
            blackstoneInventory: 0,
            
            // 酒箱库存
            wineBoxInventory: { basic_wine: 0, medium_wine: 0, premium_wine: 0 },
            
            // 乐谱库存
            sheetsInventory: {
                earth: { normal: 0, fine: 0, epic: 0 },
                craft: { normal: 0, fine: 0, epic: 0 },
                sublime: { normal: 0, fine: 0, epic: 0 }
            },
            
            // 吟游诗人系统
            bardLevel: 1,
            bardExp: 0,
            bardStatus: 'idle', // idle / traveling / performing
            bardTravelCount: 0,
            bardPerformCount: 0,
            bardSheetsTotal: 0,
            bardEpicSheets: 0,
            bardSelectedDest: null,
            bardSelectedWine: 'basic_wine',
            bardTravelStartTime: 0,
            bardTravelEndTime: 0,
            bardPerformStartTime: 0,
            bardPerformEndTime: 0,
            bardSelectedSheet: null,
            
            // 诗人装备（当前穿戴）
            bardEquipment: { pen: null, shoe: null, instrument: null },
            
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
        // 累计经验表：达到该等级所需的总经验
        const cumulativeExp = [
            0, 33, 76, 132, 202, 286, 386, 503, 637, 791,
            964, 1159, 1377, 1620, 1891, 2192, 2525, 2893, 3300, 3750,
            4247, 4795, 5400, 6068, 6805, 7618, 8517, 9508, 10604, 11814,
            13151, 14629, 16262, 18068, 20064, 22271, 24712, 27411, 30396, 33697,
            37346, 41381, 45842, 50773, 56222, 62243, 68895, 76242, 84355, 93311,
            103195, 114100, 126127, 139390, 154009, 170118, 187863, 207403, 228914, 252584,
            278623, 307256, 338731, 373318, 411311, 453030, 498824, 549074, 604193, 664632,
            730881, 803472, 882985, 970050, 1065351, 1169633, 1283701, 1408433, 1544780, 1693774,
            1856536, 2034279, 2228321, 2440088, 2671127, 2923113, 3197861, 3497335, 3823663, 4179145,
            4566274, 4987741, 5446463, 5945587, 6488521, 7078945, 7720834, 8418485, 9176537, 10000000,
            11404976, 12904567, 14514400, 16242080, 18095702, 20083886, 22215808, 24501230, 26950540, 29574787,
            32385721, 35395838, 38618420, 42067584, 45758332, 49706603, 53929328, 58444489, 63271179, 68429670,
            73941479, 79829440, 86117783, 92832214, 100000000, 114406130, 130118394, 147319656, 166147618, 186752428,
            209297771, 233962072, 260939787, 290442814, 322702028, 357968938, 396517495, 438646053, 484679494, 534971538,
            589907252, 649905763, 715423218, 786955977, 865044093, 950275074, 1043287971, 1144777804, 1255500373, 1376277458,
            1508002470, 1651646566, 1808265285, 1979005730, 2165114358, 2367945418, 2588970089, 2829786381, 3092129857, 3377885250,
            3689099031, 4027993033, 4396979184, 4798675471, 5235923207, 5711805728, 6229668624, 6793141628, 7406162301, 8073001662,
            8798291902, 9587056372, 10444742007, 11377254401, 12390995728, 13492905745, 14690506120, 15991948361, 17406065609, 18942428633,
            20611406335, 22424231139, 24393069640, 26531098945, 28852589138, 31372992363, 34109039054, 37078841860, 40302007875, 43799759843,
            47595067021, 51712786465, 56179815564, 61025256696, 66280594953, 71979889960, 78159982881, 84860719814, 92251928220, 100000000000
        ];
        
        // 从 Lv.level 升到 Lv.level+1 所需经验 = cumulativeExp[level] - cumulativeExp[level-1]
        const nextLevel = level + 1;
        if (nextLevel <= cumulativeExp.length - 1) {
            return cumulativeExp[nextLevel] - cumulativeExp[level];
        }
        // 超过200级
        return cumulativeExp[cumulativeExp.length - 1] - cumulativeExp[cumulativeExp.length - 2];
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
        
        // 判断是否允许无限模式（只有伐木、挖矿、采集可以）
        const canBeInfinite = !actionType.needsMaterials;
        const isInfiniteRequest = count === -1 || count === Infinity;
        
        // 只有允许无限的行动才能设置无限，否则计算实际次数
        const isInfinite = isInfiniteRequest && canBeInfinite;
        count = isInfinite ? Infinity : count;
        
        let actualCount = count;
        // 需要材料的行动，计算实际可执行次数
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
                count: isInfinite ? Infinity : actualCount,
                remaining: isInfinite ? Infinity : actualCount,
                isInfinite: isInfinite
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
        
        // 无限模式（-1 或 Infinity）时，初始值设为 Infinity，否则用请求的数量
        let maxCount = (requestedCount === -1 || requestedCount === Infinity) ? Infinity : requestedCount;
        
        for (const [matId, count] of Object.entries(item.materials)) {
            // 智能判断材料类型
            const matType = matId.endsWith('_token') ? 'TOKEN' : this.getMaterialType(matId);
            const owned = this.getItemCount(matType, matId);
            const possible = Math.floor(owned / count);
            maxCount = Math.min(maxCount, possible);
            
            // 调试日志
            console.log(`📊 材料检查: ${matId}, 类型=${matType}, 需要=${count}, 拥有=${owned}, 可执行=${possible}次`);
        }
        
        console.log(`📊 最大可执行次数: ${maxCount}`);
        return maxCount;
    }
    
    /**
     * 根据材料ID判断材料类型
     */
    getMaterialType(matId) {
        // 木材类型
        const woodTypes = ['pine', 'iron_birch', 'wind_tree', 'flame_tree', 'frost_maple', 'thunder_tree', 'ancient_oak', 'world_tree'];
        if (woodTypes.includes(matId)) return 'WOOD';
        
        // 矿石类型
        const oreTypes = ['cyan_ore', 'red_iron', 'feather_ore', 'hell_ore', 'white_ore', 'thunder_ore', 'brilliant', 'star_ore'];
        if (oreTypes.includes(matId)) return 'ORE';
        
        // 木板类型
        if (matId.endsWith('_plank')) return 'PLANK';
        
        // 手稿类型
        if (matId === 'manuscript') return 'MANUSCRIPT';
        
        // 丝线类型
        if (matId.endsWith('_thread')) return 'THREAD';
        
        // 矿锭类型
        const ingotTypes = ['cyan_ingot', 'red_copper_ingot', 'feather_ingot', 'white_silver_ingot', 'hell_steel_ingot', 'thunder_steel_ingot', 'brilliant_crystal', 'star_crystal'];
        if (ingotTypes.includes(matId) || matId.endsWith('_ingot')) return 'INGOT';
        
        // 布料类型
        const fabricTypes = ['jute_cloth', 'linen_cloth', 'wool_cloth', 'silk_cloth', 'wind_silk', 'dream_cloth', 'shadow_cloth', 'dragon_silk', 'celestial_cloth'];
        if (fabricTypes.includes(matId)) return 'FABRIC';
        
        // 精华类型
        if (matId.endsWith('_essence')) return 'ESSENCE';
        
        // 药水类型
        if (matId.startsWith('hp_potion') || matId.startsWith('mp_potion')) return 'POTION';
        
        // 酒类类型
        if (matId.endsWith('_wine') || matId.endsWith('_ale') || matId.endsWith('_beer') || matId.endsWith('_box')) return 'BREW';
        
        // 代币类型
        if (matId.endsWith('_token')) return 'TOKEN';
        
        // 默认为采集物
        return 'GATHERING';
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
        const originalDuration = duration;
        duration = Math.floor(duration / (1 + bonus));
        
        // 调试日志
        console.log(`⏱️ 计算时长: ${actionType.id} 原始=${originalDuration}ms, 装备加成=${(bonus*100).toFixed(0)}%, 实际=${duration}ms`);
        
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
        
        const equippedData = this.state.equipment[equipSlot];
        if (!equippedData) return 0;
        
        // 兼容旧格式（字符串）和新格式（对象）
        let equippedId, enhanceLevel;
        if (typeof equippedData === 'string') {
            equippedId = equippedData;
            enhanceLevel = 0;
        } else if (typeof equippedData === 'object') {
            equippedId = equippedData.id;
            enhanceLevel = equippedData.enhanceLevel || 0;
        } else {
            return 0;
        }
        
        // 查找工具配置 - 使用 getToolsKey 方法
        const toolsKey = this.getToolsKey(equipSlot);
        const tool = CONFIG.tools[toolsKey]?.find(t => t.id === equippedId);
        const baseBonus = tool?.speedBonus || 0;
        
        // 计算强化加成
        if (enhanceLevel > 0 && CONFIG.enhanceConfig?.bonusTable) {
            const enhanceBonus = CONFIG.enhanceConfig.bonusTable[enhanceLevel] || 0;
            return baseBonus * (1 + enhanceBonus);
        }
        
        return baseBonus;
    }
    
    /**
     * 完成一次行动
     */
    completeActionOnce(extraParams = null) {
        if (!this.state.activeAction) {
            return { success: false, reason: '没有进行中的行动' };
        }
        
        const action = this.state.activeAction;
        
        // 处理锻造行动
        if (action.type === 'FORGING') {
            // 区分锻造矿锭和锻造工具
            // 锻造工具有 toolType 和 toolIndex 属性
            if (action.toolType !== undefined && action.toolIndex !== undefined) {
                return this.completeForgeOnce();
            }
            // 否则是锻造矿锭，走正常生产流程
        }
        
        const actionType = ACTION_TYPES[action.type];
        const config = CONFIG[actionType.configKey];
        const item = config.find(c => c.id === action.id);
        
        let rewards = [];
        
        // 处理不同行动类型
        if (actionType.needsMaterials) {
            // 制作类行动：消耗材料，添加产物
            if (item.materials) {
                for (const [matId, count] of Object.entries(item.materials)) {
                    // 特殊处理代币类型（酿造需要代币作为材料）
                    if (matId.endsWith('_token')) {
                        this.removeItem('TOKEN', matId, count);
                    } else {
                        // 智能判断材料类型
                        const matType = this.getMaterialType(matId);
                        this.removeItem(matType, matId, count);
                    }
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
                        // 计算掉落数量
                        const category = this.getItemDropCategory(selectedItemId);
                        const count = this.calculateDropCount(category, selectedItemId);
                        this.addItem('GATHERING', selectedItemId, count);
                        rewards.push({ 
                            type: 'GATHERING', 
                            id: selectedItemId, 
                            name: itemConfig.name, 
                            icon: itemConfig.icon, 
                            count: count 
                        });
                    }
                } else {
                    // 全采集：先计算获得哪几个物品，再计算数量
                    let drops = [];
                    
                    // 第一步：确定获得哪些物品（每个30%概率）
                    const obtainedItems = [];
                    location.items.forEach(itemConfig => {
                        if (Math.random() < 0.3) {
                            obtainedItems.push(itemConfig);
                        }
                    });
                    
                    // 保底：至少获得一个
                    if (obtainedItems.length === 0 && location.items.length > 0) {
                        obtainedItems.push(location.items[Math.floor(Math.random() * location.items.length)]);
                    }
                    
                    // 第二步：对每个获得的物品计算数量
                    obtainedItems.forEach(itemConfig => {
                        const category = this.getItemDropCategory(itemConfig.id);
                        const count = this.calculateDropCount(category, itemConfig.id);
                        this.addItem('GATHERING', itemConfig.id, count);
                        drops.push({ name: itemConfig.name, icon: itemConfig.icon, count: count });
                    });
                    
                    rewards.push(...drops.map(d => ({ type: 'GATHERING', ...d })));
                }
            } else {
                // 伐木/挖矿：添加掉落物
                const dropId = item.dropId || action.id;
                const dropName = item.drop || item.name;
                const dropIcon = item.dropIcon || item.icon;
                
                // 计算掉落数量（伐木用wood，挖矿用ore）
                const category = action.type === 'WOODCUTTING' ? 'wood' : 'ore';
                const count = this.calculateDropCount(category, dropId);
                
                this.addItem(actionType.dropType, dropId, count);
                rewards.push({ 
                    type: actionType.dropType, 
                    id: dropId, 
                    name: dropName, 
                    icon: dropIcon, 
                    count: count 
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
        
        // 尝试获取代币（按等级段概率）
        const tokenDropRates = CONFIG.tokenDropRates || {
            standard: [0.017, 0.024, 0.037, 0.053, 0.071, 0.092, 0.149, 0.210],
            tool: [0.017, 0.033, 0.061, 0.110, 0.196, 0.343, 0.590, 0.990],
            tailoring: [0.017, 0.032, 0.053, 0.078, 0.126, 0.195],
            brewing: [0.022, 0.023, 0.024, 0.028, 0.029, 0.033, 0.033, 0.033]
        };
        
        // 根据行动类型选择概率表
        let rateTable = tokenDropRates.standard;
        if (actionType.id === 'tailoring') {
            rateTable = tokenDropRates.tailoring;
        } else if (actionType.id === 'brewing') {
            rateTable = tokenDropRates.brewing;
        }
        // 注意：锻造矿锭冶炼使用 standard 概率，锻造工具在 completeForgeOnce 中单独处理
        
        // 检查是否有固定代币掉落率（酒箱系列）
        const fixedTokenRate = item.tokenRate;
        let dropRate;
        
        if (fixedTokenRate !== undefined) {
            // 使用固定概率（酒箱）
            dropRate = fixedTokenRate;
        } else {
            // 根据等级获取概率（每10级一个区间）
            const skillKey = actionType.skillKey;
            const level = this.state[skillKey] || 1;
            const levelIndex = Math.min(Math.floor((level - 1) / 10), rateTable.length - 1);
            dropRate = rateTable[levelIndex];
        }
        
        if (Math.random() < dropRate) {
            // 代币ID映射
            const tokenIdMap = {
                'woodcutting': 'wood_token',
                'mining': 'mining_token',
                'gathering': 'gathering_token',
                'crafting': 'crafting_token',
                'forging': 'forging_token',
                'tailoring': 'tailoring_token',
                'alchemy': 'alchemy_token',
                'brewing': 'brewing_token',
                'essence': 'alchemy_token'  // 提炼精华也掉落炼金代币
            };
            const tokenId = tokenIdMap[actionType.id] || `${actionType.id}_token`;
            if (!this.state.tokensInventory) {
                this.state.tokensInventory = {};
            }
            this.state.tokensInventory[tokenId] = (this.state.tokensInventory[tokenId] || 0) + 1;
            rewards.push({ type: 'TOKEN', id: tokenId, name: `${actionType.name}代币`, icon: '🪙', count: 1 });
        }
        
        // 连击系统：计算连击概率并触发
        const comboResult = this.tryCombo(action, item, actionType);
        if (comboResult.triggered && comboResult.rewards) {
            // 连击触发！将额外奖励合并到原有奖励中
            for (const comboReward of comboResult.rewards) {
                // 查找是否已有相同类型的奖励
                const existingReward = rewards.find(r => 
                    r.type === comboReward.type && 
                    r.id === comboReward.id && 
                    r.type !== 'exp'
                );
                
                if (existingReward) {
                    // 已存在，增加数量
                    existingReward.count += comboReward.count;
                    existingReward.isCombo = true;
                } else {
                    // 不存在，添加新奖励
                    rewards.push({ ...comboReward });
                }
            }
            rewards.push({ type: 'COMBO', triggered: true, comboChance: comboResult.comboChance });
        }
        
        // 更新剩余次数（无限模式不递减）
        if (!action.isInfinite) {
            action.remaining--;
            this.state.actionRemaining = action.remaining;
        }
        
        // 检查是否完成所有次数（无限模式永远不会完成）
        if (!action.isInfinite && action.remaining <= 0) {
            this.state.activeAction = null;
            this.state.actionStartTime = null;
            this.state.actionDuration = null;
            this.state.actionRemaining = 0;
            this.state.actionCount = 0;
            
            // 检查队列，自动开始下一个
            let nextAction = null;
            if (this.state.actionQueue.length > 0) {
                const queueItem = this.state.actionQueue.shift();
                // 自动开始队列中的下一个行动
                let startResult;
                if (queueItem.type === 'FORGING') {
                    // 锻造行动使用 startForgeAction
                    startResult = this.startForgeAction(queueItem.toolType, queueItem.toolIndex, queueItem.count);
                } else if (queueItem.type === 'ENHANCE') {
                    // 强化行动使用 startEnhanceAction
                    startResult = this.startEnhanceAction(
                        queueItem.toolType,
                        queueItem.toolIndex,
                        queueItem.targetLevel,
                        queueItem.count,
                        queueItem.protection,
                        queueItem.protectionStartLevel
                    );
                } else {
                    startResult = this.startAction(queueItem.type, queueItem.id, queueItem.count, { itemId: queueItem.itemId });
                }
                if (startResult.success) {
                    nextAction = queueItem;
                }
            }
            
            return {
                success: true,
                completed: true,
                rewards: rewards,
                nextAction: nextAction
            };
        }
        
        // 还有剩余次数（或无限模式），重置开始时间并重新计算装备加成
        this.state.actionStartTime = Date.now();
        
        // 实时更新装备加成：重新计算行动时长
        const currentActionType = ACTION_TYPES[action.type];
        if (currentActionType) {
            const newDuration = this.calculateDuration(action.type, action.id);
            this.state.actionDuration = newDuration;
        }
        
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
        console.log(`🛑 取消行动: ${action.id}`);
        
        this.state.activeAction = null;
        this.state.actionStartTime = null;
        this.state.actionDuration = null;
        this.state.actionRemaining = 0;
        this.state.actionCount = 0;
        
        // 检查队列，自动开始第一个
        let nextAction = null;
        console.log(`📋 队列长度: ${this.state.actionQueue.length}`);
        
        if (this.state.actionQueue.length > 0) {
            const queueItem = this.state.actionQueue.shift();
            console.log(`📤 从队列取出:`, queueItem);
            
            // 区分锻造工具、强化和其他行动
            if (queueItem.type === 'FORGING' && queueItem.toolType !== undefined) {
                console.log(`🔨 开始锻造工具: ${queueItem.toolType} ${queueItem.toolIndex}`);
                this.startForgeAction(queueItem.toolType, queueItem.toolIndex, queueItem.count);
            } else if (queueItem.type === 'ENHANCE') {
                console.log(`⬆️ 开始强化: ${queueItem.toolType} ${queueItem.toolIndex}`);
                this.startEnhanceAction(
                    queueItem.toolType,
                    queueItem.toolIndex,
                    queueItem.targetLevel,
                    queueItem.count,
                    queueItem.protection,
                    queueItem.protectionStartLevel
                );
            } else {
                console.log(`▶️ 开始行动: ${queueItem.type} ${queueItem.id}`);
                this.startAction(queueItem.type, queueItem.id, queueItem.count, { itemId: queueItem.itemId });
            }
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
        
        // 保存当前行动（剩余次数）
        const savedAction = {
            type: currentAction.type,
            id: currentAction.id,
            toolType: currentAction.toolType,
            toolIndex: currentAction.toolIndex,
            toolId: currentAction.toolId,
            targetLevel: currentAction.targetLevel,
            count: currentAction.remaining || currentAction.count,
            remaining: currentAction.remaining,
            protection: currentAction.protection,
            protectionStartLevel: currentAction.protectionStartLevel,
            name: currentAction.name || '当前行动'
        };
        
        // 获取要执行的队列项
        const queueItem = queue[index];
        
        // 移除被选中的队列项
        queue.splice(index, 1);
        
        // 当前行动放到队列第一位
        queue.unshift(savedAction);
        
        // 关键：先清除当前行动，这样 start 才会直接开始
        this.state.activeAction = null;
        
        // 根据队列项类型开始新的行动
        if (queueItem.type === 'ENHANCE') {
            // 强化行动
            return this.startEnhanceAction(
                queueItem.toolType,
                queueItem.toolIndex,
                queueItem.targetLevel,
                queueItem.count,
                queueItem.protection,
                queueItem.protectionStartLevel
            );
        } else if (queueItem.type === 'FORGING' && queueItem.toolType !== undefined) {
            // 锻造工具
            return this.startForgeAction(queueItem.toolType, queueItem.toolIndex, queueItem.count);
        } else {
            // 普通行动
            return this.startAction(queueItem.type, queueItem.id, queueItem.count, { itemId: queueItem.itemId });
        }
    }
    
    /**
     * 立即开始新行动（清空当前行动和队列）
     */
    startImmediately(actionTypeKey, actionId, count = 1, extraParams = null) {
        // 清空当前行动
        this.state.activeAction = null;
        this.state.actionRemaining = 0;
        
        // 清空队列
        this.state.actionQueue = [];
        
        // 开始新行动
        return this.startAction(actionTypeKey, actionId, count, extraParams);
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
            // 确保这些字段在顶层，方便前端访问
            actionStartTime: this.state.actionStartTime,
            actionDuration: this.state.actionDuration,
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
    equipTool(slotType, toolId, toolIndex) {
        // 检查是否拥有该工具
        const toolsKey = this.getToolsKey(slotType);
        const inventory = this.state.toolsInventory[toolsKey] || [];
        
        // 如果提供了 toolIndex，使用索引查找
        let toolData = null;
        let idx = -1;
        
        if (toolIndex !== undefined && toolIndex >= 0 && toolIndex < inventory.length) {
            idx = toolIndex;
            toolData = inventory[idx];
        } else {
            // 兼容旧的 toolId 参数
            idx = inventory.findIndex(t => {
                const id = typeof t === 'string' ? t : t.id;
                return id === toolId;
            });
            if (idx === -1) {
                return { success: false, reason: '没有该工具' };
            }
            toolData = inventory[idx];
        }
        
        // 获取工具ID和强化等级
        const actualToolId = typeof toolData === 'string' ? toolData : toolData.id;
        const enhanceLevel = typeof toolData === 'object' && toolData ? (toolData.enhanceLevel || 0) : 0;
        
        // 检查装备等级需求
        const tool = CONFIG.tools[toolsKey]?.find(t => t.id === actualToolId);
        if (tool && tool.reqEquipLevel) {
            const skillKey = this.getSkillKeyFromSlot(slotType);
            const skillLevel = this.getSkillLevel(skillKey);
            if (skillLevel < tool.reqEquipLevel) {
                return { success: false, reason: `需要 ${skillKey} Lv.${tool.reqEquipLevel}` };
            }
        }
        
        // 如果已装备其他工具，先卸下
        const currentEquipped = this.state.equipment[slotType];
        if (currentEquipped) {
            // 将原装备放回背包
            inventory.push(currentEquipped);
        }
        
        // 装备新工具（保存完整数据，包括强化等级）
        if (enhanceLevel > 0) {
            this.state.equipment[slotType] = { id: actualToolId, enhanceLevel };
        } else {
            this.state.equipment[slotType] = actualToolId;
        }
        
        // 从背包移除
        inventory.splice(idx, 1);
        
        return { success: true, equipped: actualToolId, slot: slotType, enhanceLevel };
    }
    
    /**
     * 卸下装备
     */
    unequipTool(slotType) {
        const equippedData = this.state.equipment[slotType];
        if (!equippedData) {
            return { success: false, reason: '该槽位没有装备' };
        }
        
        const toolsKey = this.getToolsKey(slotType);
        // 将装备放回背包（保持原有格式）
        this.state.toolsInventory[toolsKey].push(equippedData);
        this.state.equipment[slotType] = null;
        
        return { success: true, unequipped: equippedData };
    }
    
    /**
     * 开始锻造工具行动
     */
    startForgeAction(toolType, toolIndex, count = 1) {
        const toolsKey = this.getToolsKey(toolType);
        const tools = CONFIG.tools[toolsKey];
        const tool = tools?.[toolIndex];
        
        if (!tool) {
            return { success: false, reason: '工具不存在' };
        }
        
        // 检查等级要求
        const forgingLevel = this.state.forgingLevel || 1;
        if (forgingLevel < tool.reqForgeLevel) {
            return { success: false, reason: `需要锻造 Lv.${tool.reqForgeLevel}` };
        }
        
        // 检查材料（只检查第一级，后续每完成一次再检查）
        const materials = CONFIG.toolCraftingMaterials?.[toolsKey]?.[toolIndex];
        if (!materials) {
            return { success: false, reason: '材料配置错误' };
        }
        
        // 计算实际可锻造次数
        let actualCount = this.calculateMaxForgeCount(toolType, toolIndex, count);
        if (actualCount <= 0) {
            return { success: false, reason: '材料不足' };
        }
        
        // 判断是否无限模式（锻造不允许无限）
        const isInfinite = count === -1 || count === Infinity;
        if (isInfinite) {
            actualCount = this.calculateMaxForgeCount(toolType, toolIndex, 999999);
        }
        
        // 检查是否有行动在进行中
        if (this.state.activeAction) {
            // 有行动在进行中，加入队列
            if (this.state.actionQueue.length < 2) {
                this.state.actionQueue.push({
                    type: 'FORGING',
                    toolType: toolType,
                    toolIndex: toolIndex,
                    count: actualCount,
                    name: tool.name,
                    icon: tool.icon
                });
                return { success: true, queued: true, queueLength: this.state.actionQueue.length };
            } else {
                return { success: false, reason: '队列已满' };
            }
        }
        
        // 设置行动状态
        this.state.activeAction = {
            type: 'FORGING',
            toolType: toolType,
            toolIndex: toolIndex,
            count: actualCount,
            remaining: actualCount,
            isInfinite: false,
            id: `forge_${toolType}_${toolIndex}`
        };
        
        // 计算时长
        const duration = tool.duration || 6000;
        this.state.actionStartTime = Date.now();
        this.state.actionDuration = duration;
        this.state.actionRemaining = actualCount;
        this.state.actionCount = actualCount;
        
        return {
            success: true,
            action: {
                type: 'FORGING',
                id: `forge_${toolType}_${toolIndex}`,
                name: tool.name,
                icon: tool.icon,
                duration: duration,
                count: actualCount,
                remaining: actualCount
            }
        };
    }
    
    /**
     * 完成一次锻造
     */
    completeForgeOnce() {
        const action = this.state.activeAction;
        if (!action || action.type !== 'FORGING') {
            return { success: false, reason: '没有进行中的锻造行动' };
        }
        
        const toolType = action.toolType;
        const toolIndex = action.toolIndex;
        const toolsKey = this.getToolsKey(toolType);
        const tools = CONFIG.tools[toolsKey];
        const tool = tools?.[toolIndex];
        
        if (!tool) {
            this.state.activeAction = null;
            return { success: false, reason: '工具不存在', stopped: true };
        }
        
        // 再次检查材料
        const materials = CONFIG.toolCraftingMaterials?.[toolsKey]?.[toolIndex];
        if (!materials) {
            this.state.activeAction = null;
            return { success: false, reason: '材料配置错误', stopped: true };
        }
        
        const ingotId = CONFIG.ingotIdMapping?.[toolIndex];
        const plankId = CONFIG.plankIdMapping?.[toolIndex];
        const oreId = CONFIG.ingotOreMapping?.[ingotId];
        
        const mining = this.state.miningInventory || {};
        const ingots = this.state.ingotsInventory || {};
        const planks = this.state.planksInventory || {};
        
        // 检查材料是否足够
        if (materials.ore && (mining[oreId] || 0) < materials.ore) {
            // 材料不足，停止行动
            this.state.activeAction = null;
            return { success: false, reason: '矿石不足', stopped: true };
        }
        if (materials.plank && (planks[plankId] || 0) < materials.plank) {
            this.state.activeAction = null;
            return { success: false, reason: '木板不足', stopped: true };
        }
        if (materials.ingot && (ingots[ingotId] || 0) < materials.ingot) {
            this.state.activeAction = null;
            return { success: false, reason: '矿锭不足', stopped: true };
        }
        if (materials.prevTool) {
            const prevTools = this.state.toolsInventory[toolsKey] || [];
            // 兼容对象格式的工具（强化过的工具）
            const hasPrevTool = prevTools.some(t => {
                const id = typeof t === 'string' ? t : t.id;
                return id === materials.prevTool;
            });
            if (!hasPrevTool) {
                this.state.activeAction = null;
                return { success: false, reason: '需要前置工具', stopped: true };
            }
        }
        
        // 消耗材料
        if (materials.ore) {
            mining[oreId] = (mining[oreId] || 0) - materials.ore;
            if (mining[oreId] <= 0) delete mining[oreId];
        }
        if (materials.plank) {
            planks[plankId] = (planks[plankId] || 0) - materials.plank;
            if (planks[plankId] <= 0) delete planks[plankId];
        }
        if (materials.ingot) {
            ingots[ingotId] = (ingots[ingotId] || 0) - materials.ingot;
            if (ingots[ingotId] <= 0) delete ingots[ingotId];
        }
        if (materials.prevTool) {
            const prevTools = this.state.toolsInventory[toolsKey] || [];
            // 兼容对象格式的工具（强化过的工具）
            const idx = prevTools.findIndex(t => {
                const id = typeof t === 'string' ? t : t.id;
                return id === materials.prevTool;
            });
            if (idx !== -1) prevTools.splice(idx, 1);
        }
        
        // 添加工具
        if (!this.state.toolsInventory[toolsKey]) {
            this.state.toolsInventory[toolsKey] = [];
        }
        this.state.toolsInventory[toolsKey].push(tool.id);
        
        // 添加经验
        const exp = tool.exp || (toolIndex * 20 + 10);
        this.addSkillExp('forgingLevel', exp);
        
        // 代币掉落（锻造工具使用 tool 概率表）
        const tokenDropRates = CONFIG.tokenDropRates || {
            tool: [0.017, 0.033, 0.061, 0.110, 0.196, 0.343, 0.590, 0.990]
        };
        const forgingLevel = this.state.forgingLevel || 1;
        const levelIndex = Math.min(Math.floor((forgingLevel - 1) / 10), tokenDropRates.tool.length - 1);
        const dropRate = tokenDropRates.tool[levelIndex];
        
        if (Math.random() < dropRate) {
            if (!this.state.tokensInventory) {
                this.state.tokensInventory = {};
            }
            this.state.tokensInventory['forging_token'] = (this.state.tokensInventory['forging_token'] || 0) + 1;
            // 代币奖励将在返回结果中体现
        }
        
        // 更新剩余次数
        action.remaining--;
        this.state.actionRemaining = action.remaining;
        
        // 检查是否完成
        if (action.remaining <= 0) {
            this.state.activeAction = null;
            this.state.actionStartTime = null;
            this.state.actionDuration = null;
            this.state.actionRemaining = 0;
            this.state.actionCount = 0;
            
            // 检查队列，自动开始下一个
            let nextAction = null;
            if (this.state.actionQueue.length > 0) {
                const queueItem = this.state.actionQueue.shift();
                // 自动开始队列中的下一个行动
                if (queueItem.type === 'FORGING' && queueItem.toolType !== undefined) {
                    // 锻造工具
                    this.startForgeAction(queueItem.toolType, queueItem.toolIndex, queueItem.count);
                    nextAction = queueItem;
                } else if (queueItem.type === 'ENHANCE') {
                    // 强化行动
                    this.startEnhanceAction(
                        queueItem.toolType,
                        queueItem.toolIndex,
                        queueItem.targetLevel,
                        queueItem.count,
                        queueItem.protection,
                        queueItem.protectionStartLevel
                    );
                    nextAction = queueItem;
                } else {
                    // 其他行动
                    this.startAction(queueItem.type, queueItem.id, queueItem.count, { itemId: queueItem.itemId });
                    nextAction = queueItem;
                }
            }
            
            return { 
                success: true, 
                tool: tool, 
                exp: exp,
                completed: true,
                nextAction: nextAction
            };
        }
        
        // 重置开始时间
        this.state.actionStartTime = Date.now();
        
        return { 
            success: true, 
            tool: tool, 
            exp: exp,
            remaining: action.remaining 
        };
    }
    
    /**
     * 计算最大可锻造次数
     */
    calculateMaxForgeCount(toolType, toolIndex, requestedCount) {
        const toolsKey = this.getToolsKey(toolType);
        const materials = CONFIG.toolCraftingMaterials?.[toolsKey]?.[toolIndex];
        if (!materials) return 0;
        
        const ingotId = CONFIG.ingotIdMapping?.[toolIndex];
        const plankId = CONFIG.plankIdMapping?.[toolIndex];
        const oreId = CONFIG.ingotOreMapping?.[ingotId];
        
        const mining = this.state.miningInventory || {};
        const ingots = this.state.ingotsInventory || {};
        const planks = this.state.planksInventory || {};
        
        let maxByOre = Infinity;
        let maxByIngot = Infinity;
        let maxByPlank = Infinity;
        let maxByPrevTool = Infinity;
        
        if (materials.ore) {
            maxByOre = Math.floor((mining[oreId] || 0) / materials.ore);
        }
        if (materials.ingot) {
            maxByIngot = Math.floor((ingots[ingotId] || 0) / materials.ingot);
        }
        if (materials.plank) {
            maxByPlank = Math.floor((planks[plankId] || 0) / materials.plank);
        }
        if (materials.prevTool) {
            const prevTools = this.state.toolsInventory[toolsKey] || [];
            // 兼容对象格式的工具（强化过的工具）
            const prevCount = prevTools.filter(t => {
                const id = typeof t === 'string' ? t : t.id;
                return id === materials.prevTool;
            }).length;
            maxByPrevTool = prevCount;
        }
        
        const maxPossible = Math.min(maxByOre, maxByIngot, maxByPlank, maxByPrevTool);
        return Math.min(maxPossible, requestedCount);
    }
    
    /**
     * 锻造工具（直接完成，用于向后兼容）
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
        
        // 获取库存
        const mining = this.state.miningInventory || {};
        const ingots = this.state.ingotsInventory || {};
        const planks = this.state.planksInventory || {};
        
        // 从矿锭ID反推矿石ID（用于 ore 配置）
        const oreId = CONFIG.ingotOreMapping?.[ingotId] || ingotId;
        
        // 检查材料（ore 用矿石，ingot 用矿锭）
        if (materials.ore && (mining[oreId] || 0) < materials.ore) {
            return { success: false, reason: `矿石不足: 需要 ${materials.ore}` };
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
            // 兼容对象格式的工具（强化过的工具）
            const prevIndex = prevTools.findIndex(t => {
                const id = typeof t === 'string' ? t : t.id;
                return id === materials.prevTool;
            });
            if (prevIndex === -1) {
                return { success: false, reason: '需要前置工具' };
            }
            // 消耗前置工具
            prevTools.splice(prevIndex, 1);
        }
        
        // 消耗材料（ore 用矿石，ingot 用矿锭）
        if (materials.ore) {
            mining[oreId] = (mining[oreId] || 0) - materials.ore;
            if (mining[oreId] <= 0) delete mining[oreId];
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
    
    /**
     * 开始锻造笔行动
     */
    startForgePenAction(penId, count = 1) {
        const pen = CONFIG.pens?.find(p => p.id === penId);
        if (!pen) {
            return { success: false, reason: '笔不存在' };
        }
        
        // 检查等级要求
        const forgingLevel = this.state.forgingLevel || 1;
        if (forgingLevel < pen.reqForgeLevel) {
            return { success: false, reason: `需要锻造 Lv.${pen.reqForgeLevel}` };
        }
        
        // 检查材料是否足够
        const feathersInv = this.state.cleanedFeathersInventory || {};
        const inkInv = this.state.conchInkInventory || 0;
        
        for (const [matId, matCount] of Object.entries(pen.materials)) {
            if (matId === 'conch_ink') {
                if (inkInv < matCount) {
                    return { success: false, reason: `海螺墨不足: 需要 ${matCount}` };
                }
            } else {
                if ((feathersInv[matId] || 0) < matCount) {
                    const matNames = {
                        cleaned_feather: '普通净羽',
                        jade_cleaned_feather: '翡翠净羽',
                        falcon_cleaned_feather: '猎隼的净尾羽',
                        rainbow_cleaned_feather: '虹光净羽',
                        harpy_cleaned_feather: '鹰身人的净羽'
                    };
                    return { success: false, reason: `${matNames[matId] || matId}不足: 需要 ${matCount}` };
                }
            }
        }
        
        // 消耗材料
        for (const [matId, matCount] of Object.entries(pen.materials)) {
            if (matId === 'conch_ink') {
                this.state.conchInkInventory -= matCount;
            } else {
                feathersInv[matId] = (feathersInv[matId] || 0) - matCount;
                if (feathersInv[matId] <= 0) delete feathersInv[matId];
            }
        }
        
        // 创建行动
        const action = {
            type: 'FORGE_PEN',
            id: penId,
            name: pen.name,
            icon: pen.icon,
            duration: pen.duration,
            exp: pen.exp,
            tokenRate: pen.tokenRate,
            count: count,
            startTime: Date.now()
        };
        
        // 设置行动状态
        this.state.activeAction = action;
        this.state.actionStartTime = Date.now();
        this.state.actionDuration = pen.duration;
        this.state.actionRemaining = pen.duration;
        this.state.actionCount = count;
        
        return { success: true, action };
    }
    
    /**
     * 完成一次锻造笔
     */
    completeForgePenOnce() {
        const action = this.state.activeAction;
        if (!action || action.type !== 'FORGE_PEN') {
            return null;
        }
        
        const pen = CONFIG.pens?.find(p => p.id === action.id);
        if (!pen) return null;
        
        // 添加笔到背包
        if (!this.state.pensInventory) {
            this.state.pensInventory = [];
        }
        this.state.pensInventory.push(pen.id);
        
        // 添加经验
        this.addSkillExp('forgingLevel', pen.exp);
        
        // 检查是否有锻造代币掉落
        const rewards = [];
        rewards.push({ type: 'PEN', id: pen.id, name: pen.name, icon: pen.icon, count: 1 });
        
        if (Math.random() < pen.tokenRate) {
            if (!this.state.tokensInventory) {
                this.state.tokensInventory = {};
            }
            this.state.tokensInventory.forging_token = (this.state.tokensInventory.forging_token || 0) + 1;
            rewards.push({ type: 'TOKEN', id: 'forging_token', name: '锻造代币', icon: '🪙', count: 1 });
        }
        
        // 连击系统：锻造等级超过需求等级时可能触发连击
        // 单次行动不能触发连击
        const forgingLevel = this.state.forgingLevel || 1;
        const levelDiff = Math.max(0, forgingLevel - pen.reqForgeLevel);
        const comboChance = Math.min(levelDiff, 100) / 100;
        
        // 只有剩余次数 > 1 或无限模式才能触发连击
        const remaining = this.state.actionCount >= 99999 ? Infinity : this.state.actionCount;
        const canCombo = (remaining > 1) || (remaining >= 99999);
        
        if (canCombo && Math.random() < comboChance) {
            // 连击触发！检查是否有足够材料再做一个
            const feathersInv = this.state.cleanedFeathersInventory || {};
            const inkInv = this.state.conchInkInventory || 0;
            
            let hasMaterials = true;
            for (const [matId, matCount] of Object.entries(pen.materials)) {
                if (matId === 'conch_ink') {
                    if (inkInv < matCount) hasMaterials = false;
                } else {
                    if ((feathersInv[matId] || 0) < matCount) hasMaterials = false;
                }
            }
            
            if (hasMaterials) {
                // 消耗额外材料
                for (const [matId, matCount] of Object.entries(pen.materials)) {
                    if (matId === 'conch_ink') {
                        this.state.conchInkInventory -= matCount;
                    } else {
                        feathersInv[matId] = (feathersInv[matId] || 0) - matCount;
                        if (feathersInv[matId] <= 0) delete feathersInv[matId];
                    }
                }
                
                // 添加额外笔
                this.state.pensInventory.push(pen.id);
                this.addSkillExp('forgingLevel', pen.exp);
                
                rewards.push({ type: 'PEN', id: pen.id, name: pen.name, icon: pen.icon, count: 1, isCombo: true });
                
                // 连击时进行第二次代币概率判定
                if (Math.random() < pen.tokenRate) {
                    this.state.tokensInventory.forging_token = (this.state.tokensInventory.forging_token || 0) + 1;
                    rewards.push({ type: 'TOKEN', id: 'forging_token', name: '锻造代币', icon: '🪙', count: 1, isCombo: true });
                }
                
                // 额外减少一次行动次数
                if (this.state.actionCount < 99999) {
                    this.state.actionCount--;
                }
                
                rewards.push({ type: 'COMBO', triggered: true, comboChance: comboChance });
            }
        }
        
        // 减少次数
        this.state.actionCount--;
        
        // 检查是否还有剩余次数且有足够材料继续
        if (this.state.actionCount > 0 && this.state.actionCount < 99999) {
            // 检查材料是否足够继续
            const feathersInv = this.state.cleanedFeathersInventory || {};
            const inkInv = this.state.conchInkInventory || 0;
            
            let hasMaterials = true;
            for (const [matId, matCount] of Object.entries(pen.materials)) {
                if (matId === 'conch_ink') {
                    if (inkInv < matCount) hasMaterials = false;
                } else {
                    if ((feathersInv[matId] || 0) < matCount) hasMaterials = false;
                }
            }
            
            if (hasMaterials) {
                // 消耗材料，继续锻造
                for (const [matId, matCount] of Object.entries(pen.materials)) {
                    if (matId === 'conch_ink') {
                        this.state.conchInkInventory -= matCount;
                    } else {
                        feathersInv[matId] = (feathersInv[matId] || 0) - matCount;
                        if (feathersInv[matId] <= 0) delete feathersInv[matId];
                    }
                }
                // 重置计时
                this.state.actionStartTime = Date.now();
                this.state.actionRemaining = pen.duration;
            } else {
                // 材料不足，停止锻造
                this.state.activeAction = null;
                this.state.actionCount = 0;
            }
        } else if (this.state.actionCount <= 0 || this.state.actionCount >= 99999) {
            // 无限模式或次数用完，检查材料继续
            const feathersInv = this.state.cleanedFeathersInventory || {};
            const inkInv = this.state.conchInkInventory || 0;
            
            let hasMaterials = true;
            for (const [matId, matCount] of Object.entries(pen.materials)) {
                if (matId === 'conch_ink') {
                    if (inkInv < matCount) hasMaterials = false;
                } else {
                    if ((feathersInv[matId] || 0) < matCount) hasMaterials = false;
                }
            }
            
            if (hasMaterials && this.state.actionCount >= 99999) {
                // 无限模式有材料，继续消耗并重置
                for (const [matId, matCount] of Object.entries(pen.materials)) {
                    if (matId === 'conch_ink') {
                        this.state.conchInkInventory -= matCount;
                    } else {
                        feathersInv[matId] = (feathersInv[matId] || 0) - matCount;
                        if (feathersInv[matId] <= 0) delete feathersInv[matId];
                    }
                }
                this.state.actionStartTime = Date.now();
                this.state.actionRemaining = pen.duration;
            } else {
                // 停止锻造
                this.state.activeAction = null;
                this.state.actionCount = 0;
            }
        }
        
        return { success: true, rewards, exp: pen.exp };
    }
    
    /**
     * 开始缝制靴子行动
     */
    startTailorBootAction(bootId, count = 1) {
        const boot = CONFIG.boots?.find(b => b.id === bootId);
        if (!boot) {
            return { success: false, reason: '靴子不存在' };
        }
        
        // 检查等级要求
        const tailoringLevel = this.state.tailoringLevel || 1;
        if (tailoringLevel < boot.reqTailorLevel) {
            return { success: false, reason: `需要缝制 Lv.${boot.reqTailorLevel}` };
        }
        
        // 检查材料是否足够
        const fabricsInv = this.state.fabricsInventory || {};
        const threadsInv = this.state.threadsInventory || {};
        const nailInv = this.state.riverNailInventory || 0;
        
        for (const [matId, matCount] of Object.entries(boot.materials)) {
            let have = 0;
            if (matId === 'river_nail') {
                have = nailInv;
            } else if (matId.includes('thread') || matId === 'wind_thread' || matId === 'dream_thread') {
                have = threadsInv[matId] || 0;
            } else {
                have = fabricsInv[matId] || 0;
            }
            
            if (have < matCount) {
                const matNames = {
                    jute_cloth: '黄麻布料', linen_cloth: '亚麻布料', wool_cloth: '羊毛布料',
                    silk_cloth: '丝绸布料', wind_silk: '风语丝绸', dream_cloth: '梦幻布料',
                    jute_thread: '黄麻线', linen_thread: '亚麻线', wool_thread: '羊毛线',
                    silk_thread: '蚕丝线', wind_thread: '风语丝线', dream_thread: '梦幻丝线',
                    river_nail: '河铸钉'
                };
                return { success: false, reason: `${matNames[matId] || matId}不足: 需要 ${matCount}` };
            }
        }
        
        // 消耗材料
        for (const [matId, matCount] of Object.entries(boot.materials)) {
            if (matId === 'river_nail') {
                this.state.riverNailInventory -= matCount;
            } else if (matId.includes('thread') || matId === 'wind_thread' || matId === 'dream_thread') {
                threadsInv[matId] = (threadsInv[matId] || 0) - matCount;
                if (threadsInv[matId] <= 0) delete threadsInv[matId];
            } else {
                fabricsInv[matId] = (fabricsInv[matId] || 0) - matCount;
                if (fabricsInv[matId] <= 0) delete fabricsInv[matId];
            }
        }
        
        // 创建行动
        const action = {
            type: 'TAILOR_BOOT',
            id: bootId,
            name: boot.name,
            icon: boot.icon,
            duration: boot.duration,
            exp: boot.exp,
            tokenRate: boot.tokenRate,
            count: count,
            startTime: Date.now()
        };
        
        this.state.activeAction = action;
        this.state.actionStartTime = Date.now();
        this.state.actionDuration = boot.duration;
        this.state.actionRemaining = boot.duration;
        this.state.actionCount = count;
        
        return { success: true, action };
    }
    
    /**
     * 完成一次缝制靴子
     */
    completeTailorBootOnce() {
        const action = this.state.activeAction;
        if (!action || action.type !== 'TAILOR_BOOT') {
            return null;
        }
        
        const boot = CONFIG.boots?.find(b => b.id === action.id);
        if (!boot) return null;
        
        // 添加靴子到背包
        if (!this.state.bootsInventory) {
            this.state.bootsInventory = [];
        }
        this.state.bootsInventory.push(boot.id);
        
        // 添加经验
        this.addSkillExp('tailoringLevel', boot.exp);
        
        // 检查是否有缝制代币掉落
        const rewards = [];
        rewards.push({ type: 'BOOT', id: boot.id, name: boot.name, icon: boot.icon, count: 1 });
        
        if (Math.random() < boot.tokenRate) {
            if (!this.state.tokensInventory) {
                this.state.tokensInventory = {};
            }
            this.state.tokensInventory.tailoring_token = (this.state.tokensInventory.tailoring_token || 0) + 1;
            rewards.push({ type: 'TOKEN', id: 'tailoring_token', name: '缝制代币', icon: '🪙', count: 1 });
        }
        
        // 连击系统：缝制等级超过需求等级时可能触发连击
        // 单次行动不能触发连击
        const tailoringLevel = this.state.tailoringLevel || 1;
        const levelDiff = Math.max(0, tailoringLevel - boot.reqTailorLevel);
        const comboChance = Math.min(levelDiff, 100) / 100;
        
        // 只有剩余次数 > 1 或无限模式才能触发连击
        const remaining = this.state.actionCount >= 99999 ? Infinity : this.state.actionCount;
        const canCombo = (remaining > 1) || (remaining >= 99999);
        
        if (canCombo && Math.random() < comboChance) {
            // 连击触发！检查是否有足够材料再做一个
            const fabricsInv = this.state.fabricsInventory || {};
            const threadsInv = this.state.threadsInventory || {};
            const nailInv = this.state.riverNailInventory || 0;
            
            let hasMaterials = true;
            for (const [matId, matCount] of Object.entries(boot.materials)) {
                let have = 0;
                if (matId === 'river_nail') {
                    have = nailInv;
                } else if (matId.includes('thread') || matId === 'wind_thread' || matId === 'dream_thread') {
                    have = threadsInv[matId] || 0;
                } else {
                    have = fabricsInv[matId] || 0;
                }
                if (have < matCount) hasMaterials = false;
            }
            
            if (hasMaterials) {
                // 消耗额外材料
                for (const [matId, matCount] of Object.entries(boot.materials)) {
                    if (matId === 'river_nail') {
                        this.state.riverNailInventory -= matCount;
                    } else if (matId.includes('thread') || matId === 'wind_thread' || matId === 'dream_thread') {
                        threadsInv[matId] = (threadsInv[matId] || 0) - matCount;
                        if (threadsInv[matId] <= 0) delete threadsInv[matId];
                    } else {
                        fabricsInv[matId] = (fabricsInv[matId] || 0) - matCount;
                        if (fabricsInv[matId] <= 0) delete fabricsInv[matId];
                    }
                }
                
                // 添加额外靴子
                this.state.bootsInventory.push(boot.id);
                this.addSkillExp('tailoringLevel', boot.exp);
                
                rewards.push({ type: 'BOOT', id: boot.id, name: boot.name, icon: boot.icon, count: 1, isCombo: true });
                
                // 连击时进行第二次代币概率判定
                if (Math.random() < boot.tokenRate) {
                    this.state.tokensInventory.tailoring_token = (this.state.tokensInventory.tailoring_token || 0) + 1;
                    rewards.push({ type: 'TOKEN', id: 'tailoring_token', name: '缝制代币', icon: '🪙', count: 1, isCombo: true });
                }
                
                // 额外减少一次行动次数
                if (this.state.actionCount < 99999) {
                    this.state.actionCount--;
                }
                
                rewards.push({ type: 'COMBO', triggered: true, comboChance: comboChance });
            }
        }
        
        // 减少次数
        this.state.actionCount--;
        
        // 检查是否继续
        if (this.state.actionCount > 0 || this.state.actionCount >= 99999) {
            const fabricsInv = this.state.fabricsInventory || {};
            const threadsInv = this.state.threadsInventory || {};
            const nailInv = this.state.riverNailInventory || 0;
            
            let hasMaterials = true;
            for (const [matId, matCount] of Object.entries(boot.materials)) {
                let have = 0;
                if (matId === 'river_nail') {
                    have = nailInv;
                } else if (matId.includes('thread') || matId === 'wind_thread' || matId === 'dream_thread') {
                    have = threadsInv[matId] || 0;
                } else {
                    have = fabricsInv[matId] || 0;
                }
                if (have < matCount) hasMaterials = false;
            }
            
            if (hasMaterials && this.state.actionCount >= 99999) {
                // 无限模式，继续消耗材料
                for (const [matId, matCount] of Object.entries(boot.materials)) {
                    if (matId === 'river_nail') {
                        this.state.riverNailInventory -= matCount;
                    } else if (matId.includes('thread') || matId === 'wind_thread' || matId === 'dream_thread') {
                        threadsInv[matId] = (threadsInv[matId] || 0) - matCount;
                        if (threadsInv[matId] <= 0) delete threadsInv[matId];
                    } else {
                        fabricsInv[matId] = (fabricsInv[matId] || 0) - matCount;
                        if (fabricsInv[matId] <= 0) delete fabricsInv[matId];
                    }
                }
                this.state.actionStartTime = Date.now();
                this.state.actionRemaining = boot.duration;
            } else {
                this.state.activeAction = null;
                this.state.actionCount = 0;
            }
        } else {
            this.state.activeAction = null;
            this.state.actionCount = 0;
        }
        
        return { success: true, rewards, exp: boot.exp };
    }
    
    /**
     * 开始制作乐器行动
     */
    startCraftInstrumentAction(instrumentId, count = 1) {
        const instrument = CONFIG.instruments?.find(i => i.id === instrumentId);
        if (!instrument) {
            return { success: false, reason: '乐器不存在' };
        }
        
        // 检查等级要求
        const craftingLevel = this.state.craftingLevel || 1;
        if (craftingLevel < instrument.reqCraftingLevel) {
            return { success: false, reason: `需要制作 Lv.${instrument.reqCraftingLevel}` };
        }
        
        // 检查材料是否足够
        const planksInv = this.state.planksInventory || {};
        const ingotsInv = this.state.ingotsInventory || {};
        const echoStoneInv = this.state.echoStoneInventory || 0;
        
        for (const [matId, matCount] of Object.entries(instrument.materials)) {
            let have = 0;
            if (matId === 'echo_stone') {
                have = echoStoneInv;
            } else if (matId.includes('_plank')) {
                have = planksInv[matId] || 0;
            } else if (matId.includes('_ingot') || matId.includes('_crystal') || matId.includes('_steel')) {
                have = ingotsInv[matId] || 0;
            }
            
            if (have < matCount) {
                const matNames = {
                    pine_plank: '青杉木板', iron_birch_plank: '铁桦木板', wind_tree_plank: '风啸木板',
                    flame_tree_plank: '焰心木板', frost_maple_plank: '霜叶木板', thunder_tree_plank: '雷鸣木板',
                    ancient_oak_plank: '古橡木板', world_tree_plank: '世界木板',
                    cyan_ingot: '青闪铁锭', red_copper_ingot: '赤铜锭', feather_ingot: '羽铁锭',
                    white_silver_ingot: '白银锭', hell_steel_ingot: '狱炎钢', thunder_steel_ingot: '雷鸣钢',
                    brilliant_crystal: '璀璨水晶', star_crystal: '星辉水晶',
                    echo_stone: '回音石'
                };
                return { success: false, reason: `${matNames[matId] || matId}不足: 需要 ${matCount}` };
            }
        }
        
        // 消耗材料
        for (const [matId, matCount] of Object.entries(instrument.materials)) {
            if (matId === 'echo_stone') {
                this.state.echoStoneInventory -= matCount;
            } else if (matId.includes('_plank')) {
                planksInv[matId] = (planksInv[matId] || 0) - matCount;
                if (planksInv[matId] <= 0) delete planksInv[matId];
            } else {
                ingotsInv[matId] = (ingotsInv[matId] || 0) - matCount;
                if (ingotsInv[matId] <= 0) delete ingotsInv[matId];
            }
        }
        
        // 创建行动
        const action = {
            type: 'CRAFT_INSTRUMENT',
            id: instrumentId,
            name: instrument.name,
            icon: instrument.icon,
            duration: instrument.duration,
            exp: instrument.exp,
            tokenRate: instrument.tokenRate,
            count: count,
            startTime: Date.now()
        };
        
        this.state.activeAction = action;
        this.state.actionStartTime = Date.now();
        this.state.actionDuration = instrument.duration;
        this.state.actionRemaining = instrument.duration;
        this.state.actionCount = count;
        
        return { success: true, action };
    }
    
    /**
     * 完成一次制作乐器
     */
    completeCraftInstrumentOnce() {
        const action = this.state.activeAction;
        if (!action || action.type !== 'CRAFT_INSTRUMENT') {
            return null;
        }
        
        const instrument = CONFIG.instruments?.find(i => i.id === action.id);
        if (!instrument) return null;
        
        // 添加乐器到背包
        if (!this.state.instrumentsInventory) {
            this.state.instrumentsInventory = [];
        }
        this.state.instrumentsInventory.push(instrument.id);
        
        // 添加经验
        this.addSkillExp('craftingLevel', instrument.exp);
        
        // 检查是否有制作代币掉落
        const rewards = [];
        rewards.push({ type: 'INSTRUMENT', id: instrument.id, name: instrument.name, icon: instrument.icon, count: 1 });
        
        if (Math.random() < instrument.tokenRate) {
            if (!this.state.tokensInventory) {
                this.state.tokensInventory = {};
            }
            this.state.tokensInventory.crafting_token = (this.state.tokensInventory.crafting_token || 0) + 1;
            rewards.push({ type: 'TOKEN', id: 'crafting_token', name: '制作代币', icon: '🪙', count: 1 });
        }
        
        // 连击系统：制作等级超过需求等级时可能触发连击
        // 单次行动不能触发连击
        const craftingLevel = this.state.craftingLevel || 1;
        const levelDiff = Math.max(0, craftingLevel - instrument.reqCraftingLevel);
        const comboChance = Math.min(levelDiff, 100) / 100;
        
        // 只有剩余次数 > 1 或无限模式才能触发连击
        const remaining = this.state.actionCount >= 99999 ? Infinity : this.state.actionCount;
        const canCombo = (remaining > 1) || (remaining >= 99999);
        
        if (canCombo && Math.random() < comboChance) {
            // 连击触发！检查是否有足够材料再做一个
            const planksInv = this.state.planksInventory || {};
            const ingotsInv = this.state.ingotsInventory || {};
            const echoStoneInv = this.state.echoStoneInventory || 0;
            
            let hasMaterials = true;
            for (const [matId, matCount] of Object.entries(instrument.materials)) {
                let have = 0;
                if (matId === 'echo_stone') {
                    have = echoStoneInv;
                } else if (matId.includes('_plank')) {
                    have = planksInv[matId] || 0;
                } else {
                    have = ingotsInv[matId] || 0;
                }
                if (have < matCount) hasMaterials = false;
            }
            
            if (hasMaterials) {
                // 消耗额外材料
                for (const [matId, matCount] of Object.entries(instrument.materials)) {
                    if (matId === 'echo_stone') {
                        this.state.echoStoneInventory -= matCount;
                    } else if (matId.includes('_plank')) {
                        planksInv[matId] = (planksInv[matId] || 0) - matCount;
                        if (planksInv[matId] <= 0) delete planksInv[matId];
                    } else {
                        ingotsInv[matId] = (ingotsInv[matId] || 0) - matCount;
                        if (ingotsInv[matId] <= 0) delete ingotsInv[matId];
                    }
                }
                
                // 添加额外乐器
                this.state.instrumentsInventory.push(instrument.id);
                this.addSkillExp('craftingLevel', instrument.exp);
                
                rewards.push({ type: 'INSTRUMENT', id: instrument.id, name: instrument.name, icon: instrument.icon, count: 1, isCombo: true });
                
                // 连击时进行第二次代币概率判定
                if (Math.random() < instrument.tokenRate) {
                    this.state.tokensInventory.crafting_token = (this.state.tokensInventory.crafting_token || 0) + 1;
                    rewards.push({ type: 'TOKEN', id: 'crafting_token', name: '制作代币', icon: '🪙', count: 1, isCombo: true });
                }
                
                // 额外减少一次行动次数
                if (this.state.actionCount < 99999) {
                    this.state.actionCount--;
                }
                
                rewards.push({ type: 'COMBO', triggered: true, comboChance: comboChance });
            }
        }
        
        // 减少次数
        this.state.actionCount--;
        
        // 检查是否继续
        if (this.state.actionCount > 0 || this.state.actionCount >= 99999) {
            const planksInv = this.state.planksInventory || {};
            const ingotsInv = this.state.ingotsInventory || {};
            const echoStoneInv = this.state.echoStoneInventory || 0;
            
            let hasMaterials = true;
            for (const [matId, matCount] of Object.entries(instrument.materials)) {
                let have = 0;
                if (matId === 'echo_stone') {
                    have = echoStoneInv;
                } else if (matId.includes('_plank')) {
                    have = planksInv[matId] || 0;
                } else {
                    have = ingotsInv[matId] || 0;
                }
                if (have < matCount) hasMaterials = false;
            }
            
            if (hasMaterials && this.state.actionCount >= 99999) {
                // 无限模式，继续消耗材料
                for (const [matId, matCount] of Object.entries(instrument.materials)) {
                    if (matId === 'echo_stone') {
                        this.state.echoStoneInventory -= matCount;
                    } else if (matId.includes('_plank')) {
                        planksInv[matId] = (planksInv[matId] || 0) - matCount;
                        if (planksInv[matId] <= 0) delete planksInv[matId];
                    } else {
                        ingotsInv[matId] = (ingotsInv[matId] || 0) - matCount;
                        if (ingotsInv[matId] <= 0) delete ingotsInv[matId];
                    }
                }
                this.state.actionStartTime = Date.now();
                this.state.actionRemaining = instrument.duration;
            } else {
                this.state.activeAction = null;
                this.state.actionCount = 0;
            }
        } else {
            this.state.activeAction = null;
            this.state.actionCount = 0;
        }
        
        return { success: true, rewards, exp: instrument.exp };
    }
    
    // ============ 吟游诗人系统方法 ============
    
    /**
     * 获取诗人等级信息
     */
    getBardLevelInfo() {
        const levels = CONFIG.bardLevels || [];
        const currentLevel = this.state.bardLevel || 1;
        const currentExp = this.state.bardExp || 0;
        
        const currentLevelData = levels.find(l => l.level === currentLevel) || levels[0];
        const nextLevelData = levels.find(l => l.level === currentLevel + 1);
        
        return {
            level: currentLevel,
            exp: currentExp,
            nextExp: nextLevelData ? nextLevelData.exp : 35000,
            progress: nextLevelData ? (currentExp / nextLevelData.exp) * 100 : 100,
            travelCount: this.state.bardTravelCount || 0,
            performCount: this.state.bardPerformCount || 0
        };
    }
    
    /**
     * 获取诗人状态
     */
    getBardStatus() {
        return this.state.bardStatus || 'idle';
    }
    
    /**
     * 获取诗人解锁的目的地列表
     */
    getUnlockedDestinations() {
        const currentLevel = this.state.bardLevel || 1;
        const destinations = CONFIG.bardDestinations || [];
        return destinations.filter(d => currentLevel >= d.reqLevel);
    }
    
    /**
     * 计算出游时长（考虑鞋子缩减）
     */
    calculateTravelDuration() {
        const baseDuration = CONFIG.baseTravelDuration || 720; // 12小时
        const equippedShoe = this.state.bardEquipment?.shoe;
        let reduction = 0;
        
        if (equippedShoe) {
            // 鞋子等级映射（每级缩减30分钟）
            const shoeLevels = {
                'traveler_boots': 1,      // -30min (11h30min)
                'lyre_boots': 2,          // -1h (11h)
                'witness_boots': 3,       // -1h30min (10h30min)
                'awaken_boots': 4,        // -2h (10h)
                'blaze_boots': 5,         // -2h30min (9h30min)
                'lionheart_boots': 6,     // -3h (9h)
                'echo_boots': 7,          // -3h30min (8h30min)
                'epic_boots': 8           // -4h (8h)
            };
            
            const shoeLevel = shoeLevels[equippedShoe] || 0;
            reduction = shoeLevel * 30; // 每级缩减30分钟
        }
        
        const finalDuration = baseDuration - reduction;
        return Math.max(finalDuration, 480); // 最少8小时
    }
    
    /**
     * 计算笔加成（乐谱品质概率）
     */
    calculatePenBonus() {
        const equippedPen = this.state.bardEquipment?.pen;
        if (!equippedPen) {
            return { fine: 0, epic: 0 };
        }
        
        // 笔等级映射（每级精良+3%，史诗+2%）
        const penLevels = {
            'traveler_pen': 1,      // 无加成
            'lyre_pen': 2,          // 精良+3%，史诗+2%
            'witness_pen': 3,       // 精良+6%，史诗+4%
            'awaken_pen': 4,        // 精良+9%，史诗+6%
            'blaze_pen': 5,         // 精良+12%，史诗+8%
            'lionheart_pen': 6,     // 精良+15%，史诗+10%
            'echo_pen': 7,          // 精良+18%，史诗+12%
            'epic_pen': 8           // 精良+21%，史诗+14%
        };
        
        const penLevel = penLevels[equippedPen] || 0;
        
        if (penLevel <= 1) {
            return { fine: 0, epic: 0 };
        }
        
        // 每级精良+3%，史诗+2%
        const fineBonus = (penLevel - 1) * 3;
        const epicBonus = (penLevel - 1) * 2;
        
        return { fine: fineBonus, epic: epicBonus };
    }
    
    /**
     * 开始诗人出游
     */
    startBardTravel(destId, wineId) {
        // 检查当前状态
        if (this.state.bardStatus !== 'idle') {
            return { success: false, reason: '诗人正在行动中' };
        }
        
        // 检查目的地是否解锁
        const dest = CONFIG.bardDestinations?.find(d => d.id === destId);
        if (!dest) {
            return { success: false, reason: '目的地不存在' };
        }
        
        const currentLevel = this.state.bardLevel || 1;
        if (currentLevel < dest.reqLevel) {
            return { success: false, reason: `需要诗人 Lv.${dest.reqLevel}` };
        }
        
        // 检查金币
        const goldCost = dest.cost.gold;
        if (this.state.gold < goldCost) {
            return { success: false, reason: `金币不足: 需要 ${goldCost}` };
        }
        
        // 检查手稿
        const scrollCost = dest.cost.scroll;
        const scrollCount = Object.values(this.state.manuscriptsInventory || {}).reduce((a, b) => a + b, 0);
        if (scrollCount < scrollCost) {
            return { success: false, reason: `手稿不足: 需要 ${scrollCost}` };
        }
        
        // 检查酒箱
        const wineStock = this.state.wineBoxInventory?.[wineId] || 0;
        if (wineStock < 1) {
            return { success: false, reason: '酒箱不足' };
        }
        
        // 消耗资源
        this.state.gold -= goldCost;
        // 消耗手稿（从库存中减去）
        let scrollsToRemove = scrollCost;
        const manuscriptsInv = this.state.manuscriptsInventory || {};
        for (const [matId, count] of Object.entries(manuscriptsInv)) {
            if (scrollsToRemove <= 0) break;
            const toRemove = Math.min(count, scrollsToRemove);
            manuscriptsInv[matId] = count - toRemove;
            if (manuscriptsInv[matId] <= 0) delete manuscriptsInv[matId];
            scrollsToRemove -= toRemove;
        }
        this.state.wineBoxInventory[wineId] = wineStock - 1;
        
        // 计算时长和经验
        const durationMinutes = this.calculateTravelDuration();
        const durationMs = durationMinutes * 60 * 1000;
        
        const wine = CONFIG.wineBoxes?.find(w => w.id === wineId);
        const expBonus = wine?.expBonus || 0;
        const baseExp = CONFIG.bardExp?.travel || 50;
        const finalExp = Math.round(baseExp * (1 + expBonus / 100));
        
        // 设置出游状态
        this.state.bardStatus = 'traveling';
        this.state.bardSelectedDest = destId;
        this.state.bardSelectedWine = wineId;
        this.state.bardTravelStartTime = Date.now();
        this.state.bardTravelEndTime = Date.now() + durationMs;
        
        return {
            success: true,
            destination: dest,
            duration: durationMinutes,
            exp: finalExp,
            endTime: this.state.bardTravelEndTime
        };
    }
    
    /**
     * 完成诗人出游
     */
    completeBardTravel() {
        if (this.state.bardStatus !== 'traveling') {
            return { success: false, reason: '诗人不在出游中' };
        }
        
        const dest = CONFIG.bardDestinations?.find(d => d.id === this.state.bardSelectedDest);
        if (!dest) {
            this.state.bardStatus = 'idle';
            return { success: false, reason: '目的地数据错误' };
        }
        
        // 计算经验（包含酒箱加成）
        const wine = CONFIG.wineBoxes?.find(w => w.id === this.state.bardSelectedWine);
        const expBonus = wine?.expBonus || 0;
        const baseExp = CONFIG.bardExp?.travel || 50;
        const finalExp = Math.round(baseExp * (1 + expBonus / 100));
        
        // 添加诗人经验
        this.addBardExp(finalExp);
        this.state.bardTravelCount = (this.state.bardTravelCount || 0) + 1;
        
        // 计算品质概率（包含笔加成）
        const penBonus = this.calculatePenBonus();
        const qualityRates = {
            normal: Math.max(0, dest.quality.normal - penBonus.fine - penBonus.epic),
            fine: dest.quality.fine + penBonus.fine,
            epic: dest.quality.epic + penBonus.epic
        };
        
        // 生成乐谱
        const rewards = this.generateTravelRewards(dest, qualityRates);
        
        // 检查额外乐谱概率（Lv.10+）
        const bardLevel = this.state.bardLevel || 1;
        let extraSheetChance = 0;
        if (bardLevel >= 10) extraSheetChance = 10;
        if (bardLevel >= 14) extraSheetChance = 13;
        if (bardLevel >= 16) extraSheetChance = 16;
        if (bardLevel >= 19) extraSheetChance = 20;
        
        if (Math.random() < extraSheetChance / 100) {
            // 额外获得一张随机乐谱
            const extraSheet = this.generateRandomSheet(qualityRates);
            if (extraSheet) {
                rewards.push(extraSheet);
            }
        }
        
        // 重置状态
        this.state.bardStatus = 'idle';
        this.state.bardSelectedDest = null;
        this.state.bardSelectedWine = null;
        
        return {
            success: true,
            exp: finalExp,
            rewards: rewards,
            travelCount: this.state.bardTravelCount
        };
    }
    
    /**
     * 生成出游奖励
     */
    generateTravelRewards(dest, qualityRates) {
        const rewards = [];
        
        // 掉落物
        const drops = dest.drops || [];
        for (const drop of drops) {
            if (Math.random() < drop.rate) {
                // 添加掉落物到库存
                this.addBardDrop(drop.id);
                rewards.push({
                    type: 'DROP',
                    id: drop.id,
                    name: drop.name,
                    icon: drop.icon,
                    count: 1
                });
                break; // 每次出游只获得一个掉落物
            }
        }
        
        // 生成乐谱
        const sheet = this.generateSheet(qualityRates);
        if (sheet) {
            rewards.push(sheet);
        }
        
        return rewards;
    }
    
    /**
     * 生成乐谱
     */
    generateSheet(qualityRates) {
        // 随机选择品质
        const rand = Math.random() * 100;
        let quality = 'normal';
        if (rand >= qualityRates.normal && rand < qualityRates.normal + qualityRates.fine) {
            quality = 'fine';
        } else if (rand >= qualityRates.normal + qualityRates.fine) {
            quality = 'epic';
        }
        
        // 随机选择类别
        const categories = Object.keys(CONFIG.sheets?.categories || {});
        if (categories.length === 0) return null;
        
        const category = categories[Math.floor(Math.random() * categories.length)];
        
        // 添加乐谱到库存
        if (!this.state.sheetsInventory) {
            this.state.sheetsInventory = {
                earth: { normal: 0, fine: 0, epic: 0 },
                craft: { normal: 0, fine: 0, epic: 0 },
                sublime: { normal: 0, fine: 0, epic: 0 }
            };
        }
        if (!this.state.sheetsInventory[category]) {
            this.state.sheetsInventory[category] = { normal: 0, fine: 0, epic: 0 };
        }
        this.state.sheetsInventory[category][quality]++;
        
        // 更新统计
        this.state.bardSheetsTotal = (this.state.bardSheetsTotal || 0) + 1;
        if (quality === 'epic') {
            this.state.bardEpicSheets = (this.state.bardEpicSheets || 0) + 1;
        }
        
        const catInfo = CONFIG.sheets?.categories?.[category];
        const qualityInfo = CONFIG.sheets?.qualities?.[quality];
        
        return {
            type: 'SHEET',
            category: category,
            quality: quality,
            name: `${catInfo?.name || category} ${qualityInfo?.name || quality}`,
            icon: catInfo?.icon || '📜',
            count: 1
        };
    }
    
    /**
     * 生成随机乐谱（额外乐谱）
     */
    generateRandomSheet(qualityRates) {
        return this.generateSheet(qualityRates);
    }
    
    /**
     * 添加诗人掉落物到库存
     */
    addBardDrop(dropId) {
        switch (dropId) {
            case 'conch_ink':
                this.state.conchInkInventory = (this.state.conchInkInventory || 0) + 1;
                break;
            case 'river_nail':
                this.state.riverNailInventory = (this.state.riverNailInventory || 0) + 1;
                break;
            case 'echo_stone':
                this.state.echoStoneInventory = (this.state.echoStoneInventory || 0) + 1;
                break;
            case 'blackstone':
                this.state.blackstoneInventory = (this.state.blackstoneInventory || 0) + 1;
                break;
        }
    }
    
    /**
     * 添加诗人经验
     */
    addBardExp(amount) {
        this.state.bardExp = (this.state.bardExp || 0) + amount;
        
        const levels = CONFIG.bardLevels || [];
        let leveledUp = false;
        let newLevel = this.state.bardLevel || 1;
        
        // 检查升级
        for (let i = newLevel; i < 20; i++) {
            const nextLevel = levels.find(l => l.level === i + 1);
            if (nextLevel && this.state.bardExp >= nextLevel.exp) {
                newLevel = i + 1;
                leveledUp = true;
            } else {
                break;
            }
        }
        
        if (leveledUp) {
            this.state.bardLevel = newLevel;
        }
        
        return { leveledUp, newLevel };
    }
    
    /**
     * 开始诗人演奏
     */
    startBardPerform(category, quality) {
        // 检查当前状态
        if (this.state.bardStatus !== 'idle') {
            return { success: false, reason: '诗人正在行动中' };
        }
        
        // 检查乐谱库存
        const sheetCount = this.state.sheetsInventory?.[category]?.[quality] || 0;
        if (sheetCount < 1) {
            return { success: false, reason: '乐谱不足' };
        }
        
        // 检查乐器要求（精良和史诗需要乐器）
        if (quality !== 'normal') {
            const equippedInstrument = this.state.bardEquipment?.instrument;
            if (!equippedInstrument) {
                return { success: false, reason: '需要装备乐器才能演奏高品质乐谱' };
            }
            
            // 根据乐器id判断可演奏的品质
            // recorder(竖笛,Lv.1)解锁精良, lyre(莱尔琴,Lv.2)及以上解锁史诗
            const instrumentLevels = {
                'recorder': 1,  // 解锁精良
                'lyre': 2,      // 解锁史诗
                'vielle': 3,    // Buff时长+5%
                'harp': 4,      // Buff时长+10%
                'lute': 5       // Buff时长+15%
            };
            
            const instrumentLevel = instrumentLevels[equippedInstrument] || 0;
            if (quality === 'fine' && instrumentLevel < 1) {
                return { success: false, reason: '乐器等级不足以演奏精良乐谱' };
            }
            if (quality === 'epic' && instrumentLevel < 2) {
                return { success: false, reason: '乐器等级不足以演奏史诗乐谱' };
            }
        }
        
        // 消耗乐谱
        this.state.sheetsInventory[category][quality]--;
        
        // 获取演奏时长
        const qualityInfo = CONFIG.sheets?.qualities?.[quality];
        const durationMinutes = qualityInfo?.duration || 30;
        const durationMs = durationMinutes * 60 * 1000;
        
        // 设置演奏状态
        this.state.bardStatus = 'performing';
        this.state.bardSelectedSheet = { category, quality };
        this.state.bardPerformStartTime = Date.now();
        this.state.bardPerformEndTime = Date.now() + durationMs;
        
        return {
            success: true,
            sheet: { category, quality },
            duration: durationMinutes,
            endTime: this.state.bardPerformEndTime
        };
    }
    
    /**
     * 完成诗人演奏
     */
    completeBardPerform() {
        if (this.state.bardStatus !== 'performing') {
            return { success: false, reason: '诗人不在演奏中' };
        }
        
        const sheet = this.state.bardSelectedSheet;
        if (!sheet) {
            this.state.bardStatus = 'idle';
            return { success: false, reason: '乐谱数据错误' };
        }
        
        // 添加经验
        const exp = CONFIG.bardExp?.perform || 15;
        this.addBardExp(exp);
        this.state.bardPerformCount = (this.state.bardPerformCount || 0) + 1;
        
        // 重置状态
        this.state.bardStatus = 'idle';
        this.state.bardSelectedSheet = null;
        
        return {
            success: true,
            exp: exp,
            sheet: sheet,
            performCount: this.state.bardPerformCount
        };
    }
    
    /**
     * 获取诗人出游进度
     */
    getBardTravelProgress() {
        if (this.state.bardStatus !== 'traveling') {
            return null;
        }
        
        const now = Date.now();
        const startTime = this.state.bardTravelStartTime;
        const endTime = this.state.bardTravelEndTime;
        const total = endTime - startTime;
        const elapsed = now - startTime;
        const remaining = Math.max(0, endTime - now);
        const progress = Math.min(100, (elapsed / total) * 100);
        
        return {
            startTime,
            endTime,
            remaining,
            progress,
            destination: this.state.bardSelectedDest,
            wine: this.state.bardSelectedWine
        };
    }
    
    /**
     * 获取诗人演奏进度
     */
    getBardPerformProgress() {
        if (this.state.bardStatus !== 'performing') {
            return null;
        }
        
        const now = Date.now();
        const startTime = this.state.bardPerformStartTime;
        const endTime = this.state.bardPerformEndTime;
        const total = endTime - startTime;
        const elapsed = now - startTime;
        const remaining = Math.max(0, endTime - now);
        const progress = Math.min(100, (elapsed / total) * 100);
        
        return {
            startTime,
            endTime,
            remaining,
            progress,
            sheet: this.state.bardSelectedSheet
        };
    }
    
    /**
     * 穿戴诗人装备
     */
    equipBardItem(slot, itemId) {
        // 检查库存
        let inventory = [];
        if (slot === 'pen') {
            inventory = this.state.pensInventory || [];
        } else if (slot === 'shoe') {
            inventory = this.state.bootsInventory || [];
        } else if (slot === 'instrument') {
            inventory = this.state.instrumentsInventory || [];
        }
        
        const hasItem = inventory.some(i => (typeof i === 'string' ? i : i.id) === itemId);
        if (!hasItem) {
            return { success: false, reason: '背包中无此装备' };
        }
        
        // 穿戴装备
        if (!this.state.bardEquipment) {
            this.state.bardEquipment = { pen: null, shoe: null, instrument: null };
        }
        this.state.bardEquipment[slot] = itemId;
        
        return { success: true, slot, itemId };
    }
    
    /**
     * 卸下诗人装备
     */
    unequipBardItem(slot) {
        if (!this.state.bardEquipment) {
            this.state.bardEquipment = { pen: null, shoe: null, instrument: null };
        }
        
        const oldItem = this.state.bardEquipment[slot];
        this.state.bardEquipment[slot] = null;
        
        return { success: true, slot, oldItem };
    }
    
    /**
     * 尝试触发连击
     * @param {Object} action - 当前行动
     * @param {Object} item - 行动物品配置
     * @param {Object} actionType - 行动类型配置
     * @returns {Object} { triggered: boolean, comboChance: number }
     */
    tryCombo(action, item, actionType) {
        // 强化功能不触发连击
        if (action.type === 'ENHANCE') {
            return { triggered: false, rewards: [], comboChance: 0 };
        }
        
        // 单次行动不能触发连击（只剩1次时不能触发）
        const remaining = action.isInfinite ? Infinity : (action.remaining || this.state.actionCount);
        if (!action.isInfinite && remaining <= 1) {
            return { triggered: false, rewards: [], comboChance: 0 };
        }
        
        // 获取玩家对应技能等级
        const skillKey = actionType.skillKey;
        const playerLevel = this.state[skillKey] || 1;
        
        // 获取需求等级
        const reqLevel = item.reqLevel || 1;
        
        // 计算连击概率（每超过需求等级1级获得1%，最大100%）
        const levelDiff = Math.max(0, playerLevel - reqLevel);
        const comboChance = Math.min(levelDiff, 100) / 100;
        
        // 判断是否触发连击
        const triggered = Math.random() < comboChance;
        
        if (!triggered) {
            return { triggered: false, rewards: [], comboChance: comboChance };
        }
        
        // 连击触发！立即获得额外奖励
        const comboRewards = [];
        
        // 处理不同行动类型的连击奖励
        if (actionType.needsMaterials) {
            // 制作类行动：连击时消耗额外材料，产出额外产物
            let hasEnoughMaterials = true;
            if (item.materials) {
                const materialType = actionType.materialType || 'WOOD';
                for (const [matId, count] of Object.entries(item.materials)) {
                    const have = this.getItemCount(materialType, matId);
                    if (have < count) {
                        hasEnoughMaterials = false;
                        break;
                    }
                }
            }
            
            if (hasEnoughMaterials) {
                // 消耗额外材料
                if (item.materials) {
                    const materialType = actionType.materialType || 'WOOD';
                    for (const [matId, count] of Object.entries(item.materials)) {
                        this.removeItem(materialType, matId, count);
                    }
                }
                // 添加额外产物
                this.addItem(actionType.resultType, action.id, 1);
                comboRewards.push({ 
                    type: actionType.resultType, 
                    id: action.id, 
                    name: item.name, 
                    icon: item.icon, 
                    count: 1,
                    isCombo: true 
                });
            }
        } else {
            // 采集类行动：伐木/挖矿/采集
            if (action.type === 'GATHERING') {
                const location = item;
                const selectedItemId = action.itemId;
                
                if (selectedItemId && selectedItemId !== 'all') {
                    const itemConfig = location.items.find(i => i.id === selectedItemId);
                    if (itemConfig) {
                        const category = this.getItemDropCategory(selectedItemId);
                        const count = this.calculateDropCount(category, selectedItemId);
                        this.addItem('GATHERING', selectedItemId, count);
                        comboRewards.push({ 
                            type: 'GATHERING', 
                            id: selectedItemId, 
                            name: itemConfig.name, 
                            icon: itemConfig.icon, 
                            count: count,
                            isCombo: true 
                        });
                    }
                } else {
                    // 全采集连击：随机获得一个物品
                    const randomItem = location.items[Math.floor(Math.random() * location.items.length)];
                    if (randomItem) {
                        const category = this.getItemDropCategory(randomItem.id);
                        const count = this.calculateDropCount(category, randomItem.id);
                        this.addItem('GATHERING', randomItem.id, count);
                        comboRewards.push({ 
                            type: 'GATHERING', 
                            id: randomItem.id, 
                            name: randomItem.name, 
                            icon: randomItem.icon, 
                            count: count,
                            isCombo: true 
                        });
                    }
                }
            } else {
                // 伐木/挖矿
                const dropId = item.dropId || action.id;
                const dropName = item.drop || item.name;
                const dropIcon = item.dropIcon || item.icon;
                const category = action.type === 'WOODCUTTING' ? 'wood' : 'ore';
                const count = this.calculateDropCount(category, dropId);
                
                this.addItem(actionType.dropType, dropId, count);
                comboRewards.push({ 
                    type: actionType.dropType, 
                    id: dropId, 
                    name: dropName, 
                    icon: dropIcon, 
                    count: count,
                    isCombo: true 
                });
            }
        }
        
        // 连击时获得额外经验
        this.addSkillExp(skillKey, item.exp);
        
        // 连击时进行第二次代币概率判定
        const tokenDropRates = CONFIG.tokenDropRates || {
            standard: [0.017, 0.024, 0.037, 0.053, 0.071, 0.092, 0.149, 0.210]
        };
        const levelIndex = Math.min(Math.floor((playerLevel - 1) / 10), tokenDropRates.standard.length - 1);
        if (Math.random() < tokenDropRates.standard[levelIndex]) {
            const tokenIdMap = {
                'woodcutting': 'wood_token',
                'mining': 'mining_token',
                'gathering': 'gathering_token',
                'crafting': 'crafting_token',
                'forging': 'forging_token',
                'tailoring': 'tailoring_token',
                'alchemy': 'alchemy_token',
                'brewing': 'brewing_token',
                'essence': 'alchemy_token'
            };
            const tokenId = tokenIdMap[actionType.id] || `${actionType.id}_token`;
            if (!this.state.tokensInventory) {
                this.state.tokensInventory = {};
            }
            this.state.tokensInventory[tokenId] = (this.state.tokensInventory[tokenId] || 0) + 1;
            comboRewards.push({ type: 'TOKEN', id: tokenId, name: `${actionType.name}代币`, icon: '🪙', count: 1, isCombo: true });
        }
        
        // 连击触发后，额外减少一次行动次数（一次行动完成了两次效果）
        if (!action.isInfinite) {
            this.state.actionCount--;
            action.remaining = this.state.actionCount;
            this.state.actionRemaining = this.state.actionCount;
        }
        
        return { triggered: true, rewards: comboRewards, comboChance: comboChance };
    }
    
    /**
     * 计算掉落数量
     * @param {string} category - 物品类别: 'wood', 'ore', 'honey', 'berry', 'herb', 'other'
     * @param {string} itemId - 物品ID（用于特殊判断）
     * @returns {number} 掉落数量
     */
    calculateDropCount(category, itemId) {
        // 数量概率表
        const dropTables = {
            // 伐木、挖矿：1-3个，各33.3%
            wood: { counts: [1, 2, 3], probabilities: [0.333, 0.333, 0.334] },
            ore: { counts: [1, 2, 3], probabilities: [0.333, 0.333, 0.334] },
            
            // 四种蜜：1-7个
            honey: { counts: [1, 2, 3, 4, 5, 6, 7], probabilities: [0.05, 0.10, 0.20, 0.30, 0.20, 0.10, 0.05] },
            
            // 甜浆果、小麦、啤酒花、苹果、葡萄、黑麦、雾果、龙血果：1-5个
            berry: { counts: [1, 2, 3, 4, 5], probabilities: [0.10, 0.20, 0.40, 0.20, 0.10] },
            
            // 血蔷薇等：1-3个，各33.3%
            herb: { counts: [1, 2, 3], probabilities: [0.333, 0.333, 0.334] },
            
            // 其他：固定1个
            other: { counts: [1], probabilities: [1.0] }
        };
        
        const table = dropTables[category] || dropTables.other;
        const rand = Math.random();
        let cumulative = 0;
        
        for (let i = 0; i < table.counts.length; i++) {
            cumulative += table.probabilities[i];
            if (rand < cumulative) {
                return table.counts[i];
            }
        }
        
        return table.counts[table.counts.length - 1];
    }
    
    /**
     * 获取物品的掉落类别
     * @param {string} itemId - 物品ID
     * @returns {string} 类别
     */
    getItemDropCategory(itemId) {
        // 四种蜜
        const honeyItems = ['honey', 'blossom_honey', 'moonlight_honey', 'rock_rose_honey'];
        if (honeyItems.includes(itemId)) return 'honey';
        
        // 甜浆果、小麦、啤酒花、苹果、葡萄、黑麦、雾果、龙血果
        const berryItems = ['sweet_berry', 'wheat', 'hops', 'apple', 'grape', 'rye', 'mist_fruit', 'dragon_blood_fruit'];
        if (berryItems.includes(itemId)) return 'berry';
        
        // 血蔷薇、黄麻、星露草、亚麻、赤炼蛇果、月光菇、羊毛、蚕丝、灵魂草、风语绒、原野之心、迷心浆果、生命纤维、星辰花
        const herbItems = ['blood_rose', 'jute', 'star_dew_herb', 'flax', 'red_serpent_fruit', 
                          'moonlight_mushroom', 'wool', 'silk', 'soul_herb', 'wind_velvet',
                          'wild_heart', 'bewitch_berry', 'life_fiber', 'star_blossom'];
        if (herbItems.includes(itemId)) return 'herb';
        
        return 'other';
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
    
    /**
     * ==================== 强化系统方法 ====================
     */
    
    /**
     * 获取工具的品质等级（T1-T8）
     */
    getToolTier(toolId) {
        if (!CONFIG.toolTierMap) return 1;
        for (const [prefix, tier] of Object.entries(CONFIG.toolTierMap)) {
            if (toolId.startsWith(prefix)) return tier;
        }
        return 1;
    }
    
    /**
     * 获取工具配置
     */
    getToolConfig(toolType, toolId) {
        const toolsKey = this.getToolsKey(toolType);
        const tools = CONFIG.tools[toolsKey];
        return tools?.find(t => t.id === toolId);
    }
    
    /**
     * 获取工具的强化等级
     * @param {string} toolType - 工具类型 (axe, pickaxe 等)
     * @param {number} toolIndex - 工具在背包中的索引
     */
    getToolEnhanceLevel(toolType, toolIndex) {
        const toolsKey = this.getToolsKey(toolType);
        const tools = this.state.toolsInventory[toolsKey] || [];
        if (toolIndex < 0 || toolIndex >= tools.length) return 0;
        
        const tool = tools[toolIndex];
        // 兼容旧数据格式（字符串）和新格式（对象）
        if (typeof tool === 'string') return 0;
        if (typeof tool === 'object' && tool !== null) return tool.enhanceLevel || 0;
        return 0;
    }
    
    /**
     * 计算强化成功率
     */
    getEnhanceSuccessRate(currentLevel) {
        const rates = CONFIG.enhanceConfig.successRate;
        if (currentLevel === 0) return rates[1];
        if (currentLevel >= 1 && currentLevel <= 3) return rates['2-3'];
        if (currentLevel >= 4 && currentLevel <= 6) return rates['4-6'];
        if (currentLevel >= 7 && currentLevel <= 10) return rates['7-10'];
        return rates['11-20'];
    }
    
    /**
     * 计算破碎概率
     */
    getBreakRate(currentLevel) {
        if (currentLevel < 13) return 0;
        return CONFIG.enhanceConfig.breakRate[currentLevel] || 0;
    }
    
    /**
     * 计算强化经验
     */
    calculateEnhanceExp(toolId, currentLevel) {
        const tier = this.getToolTier(toolId);
        const qualityMult = CONFIG.enhanceConfig.qualityMultiplier[tier] || 1;
        
        let levelMult = 1;
        if (currentLevel >= 16) levelMult = 8;
        else if (currentLevel >= 11) levelMult = 4;
        else if (currentLevel >= 6) levelMult = 2;
        
        return CONFIG.enhanceConfig.expBase * qualityMult * levelMult;
    }
    
    /**
     * 计算强化消耗
     */
    calculateEnhanceCost(toolId, toolType) {
        const tier = this.getToolTier(toolId);
        const goldCost = CONFIG.enhanceConfig.goldCost[tier] || 20;
        
        // 锤子使用矿锭，其他工具使用矿石+木板
        const isHammer = toolType === 'hammer';
        
        if (isHammer) {
            const materialCost = CONFIG.enhanceConfig.hammerMaterialCost[tier] || { ingot: 2 };
            const ingotId = CONFIG.ingotIdMapping[tier - 1] || 'cyan_ingot';
            return {
                gold: goldCost,
                ingot: ingotId,
                ingotCount: materialCost.ingot
            };
        } else {
            const materialCost = CONFIG.enhanceConfig.materialCost[tier] || { ore: 2, plank: 2 };
            const oreId = CONFIG.oreIdMapping[tier - 1] || 'cyan_ore';
            const plankId = CONFIG.plankIdMapping[tier - 1] || 'pine_plank';
            return {
                gold: goldCost,
                ore: oreId,
                oreCount: materialCost.ore,
                plank: plankId,
                plankCount: materialCost.plank
            };
        }
    }
    
    /**
     * 检查强化材料是否足够
     */
    checkEnhanceMaterials(toolId, toolType) {
        const cost = this.calculateEnhanceCost(toolId, toolType);
        const missing = [];
        
        // 检查金币
        if ((this.state.gold || 0) < cost.gold) {
            missing.push({ type: 'gold', need: cost.gold, have: this.state.gold || 0 });
        }
        
        if (cost.ingot) {
            // 锤子用矿锭
            const ingots = this.state.ingotsInventory || {};
            const have = ingots[cost.ingot] || 0;
            if (have < cost.ingotCount) {
                missing.push({ type: 'ingot', id: cost.ingot, need: cost.ingotCount, have });
            }
        } else {
            // 其他工具用矿石+木板
            const mining = this.state.miningInventory || {};
            const planks = this.state.planksInventory || {};
            
            const oreHave = mining[cost.ore] || 0;
            if (oreHave < cost.oreCount) {
                missing.push({ type: 'ore', id: cost.ore, need: cost.oreCount, have: oreHave });
            }
            
            const plankHave = planks[cost.plank] || 0;
            if (plankHave < cost.plankCount) {
                missing.push({ type: 'plank', id: cost.plank, need: cost.plankCount, have: plankHave });
            }
        }
        
        return { canEnhance: missing.length === 0, missing, cost };
    }
    
    /**
     * 消耗强化材料
     */
    consumeEnhanceMaterials(toolId, toolType) {
        const cost = this.calculateEnhanceCost(toolId, toolType);
        
        // 消耗金币
        this.state.gold = (this.state.gold || 0) - cost.gold;
        
        if (cost.ingot) {
            // 锤子用矿锭
            const ingots = this.state.ingotsInventory || {};
            ingots[cost.ingot] = (ingots[cost.ingot] || 0) - cost.ingotCount;
            if (ingots[cost.ingot] <= 0) delete ingots[cost.ingot];
        } else {
            // 其他工具用矿石+木板
            const mining = this.state.miningInventory || {};
            const planks = this.state.planksInventory || {};
            
            mining[cost.ore] = (mining[cost.ore] || 0) - cost.oreCount;
            if (mining[cost.ore] <= 0) delete mining[cost.ore];
            
            planks[cost.plank] = (planks[cost.plank] || 0) - cost.plankCount;
            if (planks[cost.plank] <= 0) delete planks[cost.plank];
        }
    }
    
    /**
     * 获取背包中所有同名工具（用于保护垫选择）
     * 保护垫只需要同名工具，不需要同等级
     */
    getSameToolsForProtection(toolType, toolId, enhanceLevel, excludeIndex) {
        const toolsKey = this.getToolsKey(toolType);
        const tools = this.state.toolsInventory[toolsKey] || [];
        
        return tools
            .map((tool, index) => {
                if (index === excludeIndex) return null;
                const id = typeof tool === 'string' ? tool : tool.id;
                const level = typeof tool === 'object' && tool ? (tool.enhanceLevel || 0) : 0;
                // 只检查同名，不检查等级
                if (id === toolId) {
                    return { index, id, enhanceLevel: level };
                }
                return null;
            })
            .filter(t => t !== null);
    }
    
    /**
     * 计算最大强化次数（基于材料）
     */
    calculateMaxEnhanceCount(toolId, toolType) {
        const cost = this.calculateEnhanceCost(toolId, toolType);
        
        // 计算基于金币的次数
        const gold = this.state.gold || 0;
        const goldCount = Math.floor(gold / cost.gold);
        
        if (cost.ingot) {
            // 锤子用矿锭
            const ingots = this.state.ingotsInventory || {};
            const have = ingots[cost.ingot] || 0;
            const materialCount = Math.floor(have / cost.ingotCount);
            return Math.min(goldCount, materialCount);
        } else {
            // 其他工具用矿石+木板
            const mining = this.state.miningInventory || {};
            const planks = this.state.planksInventory || {};
            
            const oreHave = mining[cost.ore] || 0;
            const plankHave = planks[cost.plank] || 0;
            
            const oreCount = Math.floor(oreHave / cost.oreCount);
            const plankCount = Math.floor(plankHave / cost.plankCount);
            
            return Math.min(goldCount, oreCount, plankCount);
        }
    }
    
    /**
     * 开始强化行动
     */
    startEnhanceAction(toolType, toolIndex, targetLevel, count = 1, protection = null, protectionStartLevel = 2) {
        // 验证参数
        const toolsKey = this.getToolsKey(toolType);
        const tools = this.state.toolsInventory[toolsKey] || [];
        
        if (toolIndex < 0 || toolIndex >= tools.length) {
            return { success: false, reason: '工具不存在' };
        }
        
        const tool = tools[toolIndex];
        const toolId = typeof tool === 'string' ? tool : tool.id;
        const currentLevel = typeof tool === 'object' && tool ? (tool.enhanceLevel || 0) : 0;
        
        // 检查目标等级
        if (targetLevel <= currentLevel) {
            return { success: false, reason: '目标等级必须大于当前等级' };
        }
        if (targetLevel > 20) {
            return { success: false, reason: '最高强化等级为+20' };
        }
        if (currentLevel >= 20) {
            return { success: false, reason: '已达到最高强化等级' };
        }
        
        // 检查材料
        const materialCheck = this.checkEnhanceMaterials(toolId, toolType);
        if (!materialCheck.canEnhance) {
            return { success: false, reason: '材料不足', missing: materialCheck.missing };
        }
        
        // 检查保护垫
        let protectionTool = null;
        if (protection !== null && protection >= 0) {
            const sameTools = this.getSameToolsForProtection(toolType, toolId, currentLevel, toolIndex);
            const protTool = sameTools.find(t => t.index === protection);
            if (!protTool) {
                return { success: false, reason: '保护垫必须是同名工具' };
            }
            protectionTool = protTool;
        }
        
        // 检查是否有行动在进行中
        if (this.state.activeAction) {
            // 不自动加入队列，返回错误让前端处理
            return { 
                success: false, 
                reason: '有行动正在进行中',
                hasActiveAction: true,
                currentAction: {
                    type: this.state.activeAction.type,
                    id: this.state.activeAction.id
                }
            };
        }
        
        // 处理无限模式：计算实际最大次数
        let actualCount = count;
        if (count === -1 || count === Infinity) {
            actualCount = this.calculateMaxEnhanceCount(toolId, toolType);
            if (actualCount <= 0) {
                return { success: false, reason: '材料不足以进行强化' };
            }
        }
        
        // 设置行动状态
        this.state.activeAction = {
            type: 'ENHANCE',
            toolType,
            toolIndex,
            toolId,
            currentLevel,
            targetLevel,
            count: actualCount,
            remaining: actualCount,
            protection: protectionTool ? protectionTool.index : null,
            protectionStartLevel,
            isInfinite: false, // 无限模式已转换为实际次数
            id: `enhance_${toolType}_${toolIndex}`
        };
        
        this.state.actionStartTime = Date.now();
        this.state.actionDuration = CONFIG.enhanceConfig.duration;
        
        return {
            success: true,
            action: {
                type: 'ENHANCE',
                toolId,
                toolType,
                currentLevel,
                targetLevel: currentLevel + 1,
                duration: CONFIG.enhanceConfig.duration,
                count
            }
        };
    }
    
    /**
     * 完成一次强化
     */
    completeEnhanceOnce() {
        const action = this.state.activeAction;
        if (!action || action.type !== 'ENHANCE') {
            return { success: false, reason: '没有进行中的强化行动' };
        }
        
        const { toolType, toolIndex, protection, protectionStartLevel } = action;
        const toolsKey = this.getToolsKey(toolType);
        const tools = this.state.toolsInventory[toolsKey] || [];
        
        // 再次验证工具存在
        if (toolIndex < 0 || toolIndex >= tools.length) {
            this.state.activeAction = null;
            return { success: false, reason: '工具不存在', stopped: true };
        }
        
        const tool = tools[toolIndex];
        const toolId = typeof tool === 'string' ? tool : tool.id;
        const currentLevel = typeof tool === 'object' && tool ? (tool.enhanceLevel || 0) : 0;
        
        // 检查材料
        const materialCheck = this.checkEnhanceMaterials(toolId, toolType);
        if (!materialCheck.canEnhance) {
            this.state.activeAction = null;
            return { success: false, reason: '材料不足', stopped: true, missing: materialCheck.missing };
        }
        
        // 消耗材料
        this.consumeEnhanceMaterials(toolId, toolType);
        
        // 计算成功率并判定
        const successRate = this.getEnhanceSuccessRate(currentLevel);
        const isSuccess = Math.random() < successRate;
        
        // 获取工具配置
        const toolConfig = this.getToolConfig(toolType, toolId);
        const toolName = toolConfig?.name || toolId;
        const toolIcon = toolConfig?.icon || '🔧';
        
        let result = {
            success: true,
            toolId,
            toolName,
            toolIcon,
            previousLevel: currentLevel
        };
        
        if (isSuccess) {
            // 强化成功
            const newLevel = currentLevel + 1;
            
            // 更新工具数据（转换为对象格式）
            if (typeof tools[toolIndex] === 'string') {
                tools[toolIndex] = { id: toolId, enhanceLevel: newLevel };
            } else {
                tools[toolIndex].enhanceLevel = newLevel;
            }
            
            // 更新 action 中的 currentLevel
            action.currentLevel = newLevel;
            
            result.enhanceSuccess = true;
            result.newLevel = newLevel;
            result.exp = this.calculateEnhanceExp(toolId, currentLevel);
            
            // 添加经验
            this.addSkillExp('forgingLevel', result.exp);
            
            // 检查是否达到目标等级
            if (newLevel >= action.targetLevel) {
                result.completed = true;
                result.message = `${toolIcon} ${toolName} +${newLevel}`;
                // 达到目标等级，停止强化
                this.state.activeAction = null;
                this.state.actionStartTime = null;
                this.state.actionDuration = null;
                this.state.actionRemaining = 0;
                this.state.actionCount = 0;
                result.allCompleted = true;
            } else {
                result.message = `${toolIcon} ${toolName} +${newLevel}`;
            }
        } else {
            // 强化失败
            result.enhanceSuccess = false;
            
            // 判定是否破碎（+13~+20）
            const breakRate = this.getBreakRate(currentLevel);
            const isBroken = breakRate > 0 && Math.random() < breakRate;
            
            if (isBroken) {
                // 装备破碎，从背包移除
                tools.splice(toolIndex, 1);
                result.broken = true;
                result.message = `${toolIcon} ${toolName} 破碎了！`;
                
                // 停止强化
                this.state.activeAction = null;
                result.stopped = true;
            } else {
                // 未破碎，处理等级惩罚
                const hasProtection = protection !== null && protection >= 0;
                const useProtection = hasProtection && currentLevel >= protectionStartLevel;
                
                let newLevel = currentLevel;
                
                if (useProtection) {
                    // 有保护垫
                    if (currentLevel >= 9) {
                        newLevel = currentLevel - 1;
                    }
                    // +1~+8 有保护垫等级不变
                    
                    // 消耗保护垫
                    const protTools = this.state.toolsInventory[toolsKey] || [];
                    if (protection < protTools.length) {
                        protTools.splice(protection, 1);
                    }
                    result.protectionUsed = true;
                } else {
                    // 无保护垫
                    if (currentLevel >= 9) {
                        newLevel = 5;
                    } else {
                        newLevel = Math.max(0, currentLevel - 1);
                    }
                }
                
                // 更新工具等级
                if (typeof tools[toolIndex] === 'string') {
                    tools[toolIndex] = { id: toolId, enhanceLevel: newLevel };
                } else {
                    tools[toolIndex].enhanceLevel = newLevel;
                }
                
                // 更新 action 中的 currentLevel
                action.currentLevel = newLevel;
                
                result.newLevel = newLevel;
                result.exp = this.calculateEnhanceExp(toolId, currentLevel);
                
                // 添加经验（失败也给经验）
                this.addSkillExp('forgingLevel', result.exp);
                
                result.message = `${toolIcon} ${toolName} 强化失败 → +${newLevel}`;
            }
        }
        
        // 更新剩余次数
        if (!action.isInfinite) {
            action.remaining--;
            this.state.actionRemaining = action.remaining;
        }
        
        // 检查是否完成所有次数
        if (!action.isInfinite && action.remaining <= 0) {
            this.state.activeAction = null;
            this.state.actionStartTime = null;
            this.state.actionDuration = null;
            this.state.actionRemaining = 0;
            this.state.actionCount = 0;
            result.allCompleted = true;
        } else if (!result.stopped && !result.allCompleted) {
            // 还没完成所有次数，重置开始时间，等待下一次强化
            this.state.actionStartTime = Date.now();
            this.state.actionDuration = CONFIG.enhanceConfig.duration;
        }
        
        // 检查是否需要停止（材料不足、保护垫耗尽等）
        if (!result.stopped && !result.allCompleted) {
            const nextCheck = this.checkEnhanceMaterials(toolId, toolType);
            if (!nextCheck.canEnhance) {
                this.state.activeAction = null;
                result.stopped = true;
                result.stopReason = '材料不足';
            }
        }
        
        // 检查队列，自动开始下一个行动
        if (!this.state.activeAction && this.state.actionQueue.length > 0) {
            const queueItem = this.state.actionQueue.shift();
            if (queueItem.type === 'ENHANCE') {
                // 队列中的强化行动
                this.startEnhanceAction(
                    queueItem.toolType,
                    queueItem.toolIndex,
                    queueItem.targetLevel,
                    queueItem.count,
                    queueItem.protection,
                    queueItem.protectionStartLevel
                );
                result.nextAction = queueItem;
                result.queueStarted = true;
            } else {
                // 其他行动
                this.startAction(queueItem.type, queueItem.id, queueItem.count, { itemId: queueItem.itemId });
                result.nextAction = queueItem;
            }
        }
        
        return result;
    }
    
    /**
     * 获取强化后的属性加成
     */
    getEnhancedBonus(toolId, enhanceLevel) {
        if (enhanceLevel <= 0) return 0;
        const toolConfig = CONFIG.tools;
        let baseBonus = 0;
        
        // 找到工具的基础加成
        for (const toolsKey of Object.keys(toolConfig)) {
            const tool = toolConfig[toolsKey]?.find(t => t.id === toolId);
            if (tool) {
                baseBonus = tool.speedBonus || 0;
                break;
            }
        }
        
        // 计算强化加成
        const enhanceBonus = CONFIG.enhanceConfig.bonusTable[enhanceLevel] || 0;
        
        return baseBonus * (1 + enhanceBonus);
    }
}

module.exports = { GameEngine, CONFIG, ACTION_TYPES, ITEM_TYPES };