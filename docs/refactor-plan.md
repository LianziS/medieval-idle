# Idle 游戏重构方案

## 一、重复模式分析

### 1. 行动函数模式（每个行动类型重复）

| 函数 | 伐木 | 挖矿 | 采集 | 制作 | 锻造工具 | 缝制 | 酿造 | 炼金 |
|------|------|------|------|------|----------|------|------|------|
| startWithCount | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| schedule | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| completeOnce | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |

### 2. 每个函数的重复逻辑

**startWithCount**:
```javascript
gameState.activeXxx = id;
gameState.xxxCount = count;
gameState.xxxRemaining = count;
const bonus = getEquipmentBonus(skill);
const actualDuration = Math.floor(config.duration / (1 + bonus));
setActionState({ name, icon }, actualDuration, count, count);
setTimeout(() => { completeXxxOnce(); scheduleXxx(); }, actualDuration);
```

**completeOnce**:
```javascript
const dropCount = Math.floor(Math.random() * 3) + 1;
inventory[id] += dropCount;
const token = tryGetToken(tokenType, index, rateType);
addExp(config.exp);
addSkillExp(skill, config.exp);
updateUI(); saveGame();
showRewards(dropCount, config, token);
```

---

## 二、抽象设计方案

### 1. 物品类型定义（ItemType）

```javascript
const ITEM_TYPES = {
    WOOD: {
        id: 'wood',
        inventoryKey: 'woodcuttingInventory',
        skillKey: 'woodcutting',
        configKey: 'trees',
        tokenType: 'wood_token',
        getDropCount: () => Math.floor(Math.random() * 3) + 1
    },
    ORE: {
        id: 'ore',
        inventoryKey: 'miningInventory',
        skillKey: 'mining',
        configKey: 'ores',
        tokenType: 'mining_token',
        getDropCount: () => Math.floor(Math.random() * 3) + 1
    },
    // ... 其他类型
};
```

### 2. 行动管理器（ActionManager）

```javascript
class ActionManager {
    constructor(itemType) {
        this.itemType = itemType;
        this.stateKeys = {
            active: `active${capitalize(itemType.skillKey)}`,
            count: `${itemType.skillKey}Count`,
            remaining: `${itemType.skillKey}Remaining`
        };
    }
    
    start(id, count) {
        const config = CONFIG[this.itemType.configKey].find(c => c.id === id);
        const bonus = getEquipmentBonus(this.itemType.skillKey);
        const duration = Math.floor(config.duration / (1 + bonus));
        
        gameState[this.stateKeys.active] = id;
        gameState[this.stateKeys.count] = count;
        gameState[this.stateKeys.remaining] = count;
        
        setActionState({ name: config.name, icon: config.icon }, duration, count, count);
        
        gameState.actionTimerId = setTimeout(() => {
            this.complete(id);
            this.schedule(id);
        }, duration);
    }
    
    complete(id) {
        const config = CONFIG[this.itemType.configKey].find(c => c.id === id);
        const index = CONFIG[this.itemType.configKey].findIndex(c => c.id === id);
        const dropCount = this.itemType.getDropCount();
        
        if (!gameState[this.itemType.inventoryKey][id]) {
            gameState[this.itemType.inventoryKey][id] = 0;
        }
        gameState[this.itemType.inventoryKey][id] += dropCount;
        
        const token = tryGetToken(this.itemType.tokenType, index, 'standard');
        addExp(config.exp);
        addSkillExp(this.itemType.skillKey, config.exp);
        
        updateUI();
        saveGame();
        this.showRewards(dropCount, config, token);
    }
    
    schedule(id) {
        // 递归调度逻辑
    }
}

// 使用
const woodcuttingManager = new ActionManager(ITEM_TYPES.WOOD);
const miningManager = new ActionManager(ITEM_TYPES.ORE);
```

### 3. 统一入口函数

```javascript
function startAction(itemType, id, count, extra = {}) {
    const manager = ACTION_MANAGERS[itemType];
    if (!manager) {
        console.error(`Unknown action type: ${itemType}`);
        return;
    }
    manager.start(id, count, extra);
}

function completeActionOnce(itemType, id, extra = {}) {
    const manager = ACTION_MANAGERS[itemType];
    manager?.complete(id, extra);
}
```

---

## 三、重构步骤

### Phase 1: 定义抽象层（不修改现有代码）
1. 创建 `ItemType` 定义
2. 创建 `ActionManager` 类
3. 创建实例映射

### Phase 2: 逐步迁移
1. 先迁移伐木（最简单）
2. 测试通过后迁移挖矿
3. 逐个迁移其他类型

### Phase 3: 清理
1. 删除旧函数
2. 更新所有调用点

---

## 四、风险评估

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| 引入新 bug | 高 | 每个类型独立迁移，充分测试 |
| 破坏存档兼容性 | 中 | 保持 gameState 结构不变 |
| 代码量变化 | 小 | 抽象后代码量减少约 30% |

---

## 五、是否执行？

**建议**：
- ✅ 如果计划长期维护、添加更多行动类型 → 重构
- ❌ 如果只是修复 bug、短期维护 → 不重构

**Skill 最佳实践提醒**：
> "Three similar lines of code is better than a premature abstraction."
> 
> 不要过早抽象，除非确实需要减少重复或便于扩展。

请确认是否执行此重构？