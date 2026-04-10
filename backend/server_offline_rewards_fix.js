// 新的离线收益计算函数 - 用于替换原函数

/**
 * 计算离线收益
 * 基于用户退出时正在进行的行动计算具体收益，并自动处理队列中的行动
 */
function calculateOfflineRewards(gameEngine, offlineMinutes) {
    const state = gameEngine.state;
    const { CONFIG, ITEM_TYPES, ACTION_TYPES } = require('./GameConfig');
    
    const rewards = {
        offlineMinutes,
        items: [],
        experience: null,
        skillName: null,
        skillIcon: null,
        gold: 0,
        actionCompleted: false,
        completions: 0,
        queueActionsProcessed: 0 // 记录队列处理的行动数
    };
    
    const maxMinutes = 720;
    const effectiveMinutes = Math.min(offlineMinutes, maxMinutes);
    let remainingMs = effectiveMinutes * 60 * 1000;
    let totalExpAccum = 0; // 累计所有行动的经验
    
    // 技能映射
    const skillMap = {
        WOODCUTTING: { name: '伐木', icon: '🪓', levelKey: 'woodcuttingLevel', tokenId: 'wood_token' },
        MINING: { name: '挖矿', icon: '⛏️', levelKey: 'miningLevel', tokenId: 'mining_token' },
        GATHERING: { name: '采集', icon: '🌿', levelKey: 'gatheringLevel', tokenId: 'gathering_token' },
        CRAFTING: { name: '制作', icon: '🔨', levelKey: 'craftingLevel', tokenId: 'crafting_token' },
        FORGING: { name: '锻造', icon: '⚒️', levelKey: 'forgingLevel', tokenId: 'forging_token' },
        TAILORING: { name: '裁缝', icon: '🧵', levelKey: 'tailoringLevel', tokenId: 'tailoring_token' },
        BREWING: { name: '酿造', icon: '🍺', levelKey: 'brewingLevel', tokenId: 'brewing_token' },
        ALCHEMY: { name: '炼金', icon: '⚗️', levelKey: 'alchemyLevel', tokenId: 'alchemy_token' },
        ESSENCE: { name: '提炼', icon: '💎', levelKey: 'gatheringLevel', tokenId: 'gathering_token' },
        ENHANCE: { name: '强化', icon: '⭐', levelKey: 'forgingLevel', tokenId: 'forging_token' }
    };
    
    // 循环处理当前行动和队列中的行动
    while (remainingMs > 0 && (state.activeAction || state.actionQueue.length > 0)) {
        // 如果没有当前行动但有队列，自动开始队列中的第一个
        if (!state.activeAction && state.actionQueue.length > 0) {
            const queueItem = state.actionQueue.shift();
            
            // 根据队列项类型开始行动
            if (queueItem.type === 'FORGING' && queueItem.toolType !== undefined) {
                gameEngine.startForgeAction(queueItem.toolType, queueItem.toolIndex, queueItem.count);
            } else if (queueItem.type === 'ENHANCE') {
                gameEngine.startEnhanceAction(
                    queueItem.toolType,
                    queueItem.toolIndex,
                    queueItem.targetLevel,
                    queueItem.count,
                    queueItem.protection,
                    queueItem.protectionStartLevel
                );
            } else {
                gameEngine.startAction(queueItem.type, queueItem.id, queueItem.count, { itemId: queueItem.itemId });
            }
            rewards.queueActionsProcessed++;
            console.log(`📌 离线收益：自动开始队列行动 ${queueItem.type}`);
        }
        
        const activeAction = state.activeAction;
        
        if (!activeAction) {
            // 队列空了或行动无法开始（可能是强化），计算剩余时间的休息金币
            const restMinutes = Math.floor(remainingMs / 60000);
            if (restMinutes > 0) {
                const baseGoldPerMinute = state.level * 0.5;
                rewards.gold += Math.floor(baseGoldPerMinute * restMinutes);
                state.gold += Math.floor(baseGoldPerMinute * restMinutes);
            }
            if (!rewards.skillName) {
                rewards.skillName = '休息';
                rewards.skillIcon = '💤';
            }
            break;
        }
        
        const actionType = activeAction.type;
        const actionId = activeAction.id;
        const duration = state.actionDuration || 6000;
        
        // 计算当前行动在剩余时间内能完成多少次
        const possibleCompletions = Math.floor(remainingMs / duration);
        
        if (possibleCompletions <= 0) {
            // 时间不够完成一次行动，跳出循环
            break;
        }
        
        // 计算实际可完成次数
        const remaining = activeAction.remaining || Infinity;
        const isInfinite = activeAction.isInfinite || false;
        let actualCompletions = isInfinite ? possibleCompletions : Math.min(possibleCompletions, remaining);
        
        // 记录处理次数
        rewards.completions += actualCompletions;
        
        // 更新技能显示（优先显示第一个行动的技能）
        const skill = skillMap[actionType];
        if (skill && !rewards.skillName) {
            rewards.skillName = skill.name;
            rewards.skillIcon = skill.icon;
        }
        
        let totalExp = 0;
        const tokenDrops = {};
        
        // 根据行动类型计算收益
        if (actionType === 'GATHERING') {
            const location = CONFIG.gatheringLocations?.find(l => l.id === actionId);
            if (location && location.items) {
                location.items.forEach(item => {
                    const expectedCount = Math.floor(actualCompletions * item.probability);
                    if (expectedCount > 0) {
                        rewards.items.push({ id: item.id, name: item.name, icon: item.icon, count: expectedCount });
                        gameEngine.addItem('GATHERING', item.id, expectedCount);
                        totalExp += expectedCount * item.exp;
                    }
                });
                totalExp += actualCompletions * location.exp;
            }
            addTokenDrops(tokenDrops, 'gathering_token', actualCompletions, state.gatheringLevel || 1, 'standard');
            
        } else if (actionType === 'WOODCUTTING') {
            const tree = CONFIG.trees?.find(t => t.id === actionId);
            if (tree) {
                rewards.items.push({ id: tree.dropId, name: tree.drop, icon: tree.dropIcon, count: actualCompletions });
                gameEngine.addItem('WOOD', tree.dropId, actualCompletions);
                totalExp = actualCompletions * tree.exp;
            }
            addTokenDrops(tokenDrops, 'wood_token', actualCompletions, state.woodcuttingLevel || 1, 'standard');
            
        } else if (actionType === 'MINING') {
            const ore = CONFIG.ores?.find(o => o.id === actionId);
            if (ore) {
                rewards.items.push({ id: ore.dropId, name: ore.drop, icon: ore.dropIcon, count: actualCompletions });
                gameEngine.addItem('ORE', ore.dropId, actualCompletions);
                totalExp = actualCompletions * ore.exp;
            }
            addTokenDrops(tokenDrops, 'mining_token', actualCompletions, state.miningLevel || 1, 'standard');
            
        } else if (actionType === 'CRAFTING') {
            const plank = CONFIG.woodPlanks?.find(p => p.id === actionId);
            if (plank && plank.materials) {
                const materialType = 'WOOD';
                let possibleCount = actualCompletions;
                
                for (const [matId, count] of Object.entries(plank.materials)) {
                    const have = gameEngine.getItemCount(materialType, matId);
                    const need = count * actualCompletions;
                    if (have < need) {
                        possibleCount = Math.floor(have / count);
                    }
                }
                
                if (possibleCount > 0) {
                    for (const [matId, count] of Object.entries(plank.materials)) {
                        gameEngine.removeItem(materialType, matId, count * possibleCount);
                    }
                    rewards.items.push({ id: actionId, name: plank.name, icon: plank.icon, count: possibleCount });
                    gameEngine.addItem('PLANK', actionId, possibleCount);
                    totalExp = possibleCount * plank.exp;
                    actualCompletions = possibleCount;
                }
            }
            addTokenDrops(tokenDrops, 'crafting_token', actualCompletions, state.craftingLevel || 1, 'standard');
            
        } else if (actionType === 'FORGING') {
            // 锻造矿锭或工具
            if (activeAction.toolType !== undefined) {
                // 锻造工具：特殊处理，离线期间不完成（逻辑复杂）
                totalExp = 0;
                actualCompletions = 0;
            } else {
                // 锻造矿锭
                const ingot = CONFIG.ingots?.find(i => i.id === actionId);
                if (ingot && ingot.materials) {
                    const materialType = 'ORE';
                    let possibleCount = actualCompletions;
                    
                    for (const [matId, count] of Object.entries(ingot.materials)) {
                        const have = gameEngine.getItemCount(materialType, matId);
                        const need = count * actualCompletions;
                        if (have < need) {
                            possibleCount = Math.floor(have / count);
                        }
                    }
                    
                    if (possibleCount > 0) {
                        for (const [matId, count] of Object.entries(ingot.materials)) {
                            gameEngine.removeItem(materialType, matId, count * possibleCount);
                        }
                        rewards.items.push({ id: actionId, name: ingot.name, icon: ingot.icon, count: possibleCount });
                        gameEngine.addItem('INGOT', actionId, possibleCount);
                        totalExp = possibleCount * ingot.exp;
                        actualCompletions = possibleCount;
                    }
                }
            }
            addTokenDrops(tokenDrops, 'forging_token', actualCompletions, state.forgingLevel || 1, 'standard');
            
        } else if (actionType === 'TAILORING') {
            const fabric = CONFIG.fabrics?.find(f => f.id === actionId);
            if (fabric && fabric.materials) {
                const materialType = 'GATHERING';
                let possibleCount = actualCompletions;
                
                for (const [matId, count] of Object.entries(fabric.materials)) {
                    const have = gameEngine.getItemCount(materialType, matId);
                    const need = count * actualCompletions;
                    if (have < need) {
                        possibleCount = Math.floor(have / count);
                    }
                }
                
                if (possibleCount > 0) {
                    for (const [matId, count] of Object.entries(fabric.materials)) {
                        gameEngine.removeItem(materialType, matId, count * possibleCount);
                    }
                    rewards.items.push({ id: actionId, name: fabric.name, icon: fabric.icon, count: possibleCount });
                    gameEngine.addItem('FABRIC', actionId, possibleCount);
                    totalExp = possibleCount * fabric.exp;
                    actualCompletions = possibleCount;
                }
            }
            addTokenDrops(tokenDrops, 'tailoring_token', actualCompletions, state.tailoringLevel || 1, 'tailoring');
            
        } else if (actionType === 'BREWING') {
            const brew = CONFIG.brews?.find(b => b.id === actionId);
            if (brew && brew.materials) {
                const materialType = 'GATHERING';
                let possibleCount = actualCompletions;
                
                for (const [matId, count] of Object.entries(brew.materials)) {
                    const have = gameEngine.getItemCount(materialType, matId);
                    const need = count * actualCompletions;
                    if (have < need) {
                        possibleCount = Math.floor(have / count);
                    }
                }
                
                if (possibleCount > 0) {
                    for (const [matId, count] of Object.entries(brew.materials)) {
                        gameEngine.removeItem(materialType, matId, count * possibleCount);
                    }
                    rewards.items.push({ id: actionId, name: brew.name, icon: brew.icon, count: possibleCount });
                    gameEngine.addItem('BREW', actionId, possibleCount);
                    totalExp = possibleCount * brew.exp;
                    actualCompletions = possibleCount;
                }
            }
            addTokenDrops(tokenDrops, 'brewing_token', actualCompletions, state.brewingLevel || 1, 'brewing');
            
        } else if (actionType === 'ALCHEMY') {
            const potion = CONFIG.potions?.find(p => p.id === actionId);
            if (potion && potion.materials) {
                const materialType = 'GATHERING';
                let possibleCount = actualCompletions;
                
                for (const [matId, count] of Object.entries(potion.materials)) {
                    const have = gameEngine.getItemCount(materialType, matId);
                    const need = count * actualCompletions;
                    if (have < need) {
                        possibleCount = Math.floor(have / count);
                    }
                }
                
                if (possibleCount > 0) {
                    for (const [matId, count] of Object.entries(potion.materials)) {
                        gameEngine.removeItem(materialType, matId, count * possibleCount);
                    }
                    rewards.items.push({ id: actionId, name: potion.name, icon: potion.icon, count: possibleCount });
                    gameEngine.addItem('POTION', actionId, possibleCount);
                    totalExp = possibleCount * potion.exp;
                    actualCompletions = possibleCount;
                }
            }
            addTokenDrops(tokenDrops, 'alchemy_token', actualCompletions, state.alchemyLevel || 1, 'standard');
            
        } else if (actionType === 'ESSENCE') {
            const essence = CONFIG.essences?.find(e => e.id === actionId);
            if (essence && essence.materials) {
                const materialType = 'GATHERING';
                let possibleCount = actualCompletions;
                
                for (const [matId, count] of Object.entries(essence.materials)) {
                    const have = gameEngine.getItemCount(materialType, matId);
                    const need = count * actualCompletions;
                    if (have < need) {
                        possibleCount = Math.floor(have / count);
                    }
                }
                
                if (possibleCount > 0) {
                    for (const [matId, count] of Object.entries(essence.materials)) {
                        gameEngine.removeItem(materialType, matId, count * possibleCount);
                    }
                    rewards.items.push({ id: actionId, name: essence.name, icon: essence.icon, count: possibleCount });
                    gameEngine.addItem('ESSENCE', actionId, possibleCount);
                    totalExp = possibleCount * essence.exp;
                    actualCompletions = possibleCount;
                }
            }
            addTokenDrops(tokenDrops, 'gathering_token', actualCompletions, state.gatheringLevel || 1, 'standard');
            
        } else if (actionType === 'ENHANCE') {
            // 强化行动：特殊处理，离线期间不完成强化（逻辑复杂，跳过）
            totalExp = 0;
            actualCompletions = 0;
        }
        
        // 添加代币到库存
        for (const [tokenId, count] of Object.entries(tokenDrops)) {
            if (count > 0) {
                rewards.items.push({ id: tokenId, name: getTokenName(tokenId), icon: '🪙', count: count });
                if (!state.tokensInventory) state.tokensInventory = {};
                state.tokensInventory[tokenId] = (state.tokensInventory[tokenId] || 0) + count;
            }
        }
        
        // 添加经验
        if (skill && totalExp > 0) {
            gameEngine.addSkillExp(skill.levelKey, totalExp);
            totalExpAccum += totalExp;
        }
        
        // 扣除消耗的时间
        remainingMs -= actualCompletions * duration;
        
        // 更新行动剩余次数
        if (!isInfinite && actualCompletions > 0) {
            activeAction.remaining = remaining - actualCompletions;
            state.actionRemaining = activeAction.remaining;
            
            if (activeAction.remaining <= 0) {
                state.activeAction = null;
                state.actionStartTime = 0;
                state.actionDuration = 0;
                state.actionRemaining = 0;
                rewards.actionCompleted = true;
                console.log(`📌 离线收益：当前行动完成，剩余时间 ${remainingMs}ms，队列长度 ${state.actionQueue.length}`);
            }
        }
    }
    
    // 最终汇总经验
    if (totalExpAccum > 0) {
        rewards.experience = Math.floor(totalExpAccum);
    }
    
    console.log(`📌 离线收益计算完成：总完成次数 ${rewards.completions}，队列处理数 ${rewards.queueActionsProcessed}`);
    
    return rewards;
}