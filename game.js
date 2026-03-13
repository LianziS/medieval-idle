/**
 * 中世纪雇佣兵 - 放置游戏（侧边栏版本）
 */

// ============ 游戏配置 ============
const CONFIG = {
    resources: ['gold', 'wood', 'stone', 'herb'],
    
    buildings: [
        { id: 'tent', name: '简陋帐篷', icon: '⛺', baseCost: { wood: 10 }, production: {}, unlockReq: null },
        { id: 'lumber', name: '伐木场', icon: '🪓', baseCost: { wood: 50, stone: 20 }, production: { wood: 1 }, unlockReq: null },
        { id: 'mine', name: '矿洞', icon: '⛏️', baseCost: { wood: 100, stone: 50 }, production: { stone: 1 }, unlockReq: { buildings: { tent: 1 } } },
        { id: 'smithy', name: '锻造屋', icon: '🔨', baseCost: { wood: 200, stone: 150 }, production: {}, unlockReq: { buildings: { mine: 1 } } },
        { id: 'workshop', name: '木工坊', icon: '🪵', baseCost: { wood: 300, stone: 100 }, production: {}, unlockReq: { buildings: { lumber: 2 } } },
        { id: 'tailor', name: '裁缝铺', icon: '🧵', baseCost: { wood: 250, stone: 100, gold: 500 }, production: {}, unlockReq: { buildings: { workshop: 1 } } },
        { id: 'alchemy', name: '炼金小屋', icon: '⚗️', baseCost: { wood: 300, stone: 200, herb: 100 }, production: {}, unlockReq: { buildings: { smithy: 1 } } },
        { id: 'farm', name: '草药园', icon: '🌿', baseCost: { wood: 150, stone: 50 }, production: { herb: 1 }, unlockReq: { buildings: { tent: 1 } } }
    ],
    
    gatherActions: [
        { id: 'chop', name: '伐木', icon: '🪓', desc: '+5 木材', duration: 3000, reward: { wood: 5 }, exp: 2 },
        { id: 'mine_action', name: '挖矿', icon: '⛏️', desc: '+3 石头', duration: 4000, reward: { stone: 3 }, exp: 3 },
        { id: 'herb', name: '采药', icon: '🌿', desc: '+4 草药', duration: 3500, reward: { herb: 4 }, exp: 2 },
        { id: 'quest', name: '小任务', icon: '📜', desc: '+10 金币', duration: 5000, reward: { gold: 10 }, exp: 5 }
    ],
    
    craftRecipes: [
        { id: 'iron_sword', name: '铁剑', icon: '🗡️', desc: '攻击 +5', cost: { wood: 20, stone: 30 }, reqBuilding: 'smithy', exp: 10 },
        { id: 'wood_bow', name: '木弓', icon: '🏹', desc: '攻击 +3', cost: { wood: 40 }, reqBuilding: 'workshop', exp: 8 },
        { id: 'health_potion', name: '生命药水', icon: '🧪', desc: '战斗恢复', cost: { herb: 15 }, reqBuilding: 'alchemy', exp: 5 }
    ],
    
    combatZones: [
        { id: 'forest', name: '迷雾森林', icon: '🌲', difficulty: 1, duration: 10000, rewards: [{ item: 'gold', min: 15, max: 30 }, { item: 'wood', min: 5, max: 15 }], reqLevel: 1 },
        { id: 'cave', name: '哥布林洞穴', icon: '🕳️', difficulty: 2, duration: 15000, rewards: [{ item: 'gold', min: 30, max: 60 }, { item: 'stone', min: 10, max: 20 }], reqLevel: 3 },
        { id: 'ruins', name: '古代废墟', icon: '🏛️', difficulty: 3, duration: 20000, rewards: [{ item: 'gold', min: 60, max: 120 }, { item: 'herb', min: 10, max: 25 }], reqLevel: 5 },
        { id: 'dragon_lair', name: '龙之巢穴', icon: '🐉', difficulty: 5, duration: 30000, rewards: [{ item: 'gold', min: 150, max: 300 }, { item: 'stone', min: 50, max: 100 }], reqLevel: 10 }
    ]
};

// ============ 游戏状态 ============
let gameState = {
    resources: { gold: 0, wood: 0, stone: 0, herb: 0 },
    buildings: {},
    level: 1,
    exp: 0,
    expToNext: 100,
    startTime: Date.now(),
    activeActions: {},
    combat: { active: false, zoneId: null, endTime: 0 },
    currentZoneIndex: 0,
    currentPage: 'home',
    lastSave: Date.now()
};

CONFIG.buildings.forEach(b => { gameState.buildings[b.id] = { level: 0 }; });

// ============ DOM 元素 ============
const elements = {
    sidebar: document.getElementById('sidebar'),
    navItems: document.querySelectorAll('.nav-item'),
    pages: document.querySelectorAll('.page'),
    
    level: document.getElementById('level'),
    topLevel: document.getElementById('top-level'),

    
    storageGold: document.getElementById('storage-gold'),
    storageWood: document.getElementById('storage-wood'),
    storageStone: document.getElementById('storage-stone'),
    storageHerb: document.getElementById('storage-herb'),
    
    combatLocation: document.getElementById('combat-location'),
    combatTimer: document.getElementById('combat-timer'),
    combatBtn: document.getElementById('combat-btn'),
    combatRewards: document.getElementById('combat-rewards'),
    combatZones: document.getElementById('combat-zones'),
    
    buildingsList: document.getElementById('buildings-list'),
    gatherActions: document.getElementById('gather-actions'),
    craftActions: document.getElementById('craft-actions'),
    
    playTime: document.getElementById('play-time'),
    modal: document.getElementById('modal'),
    modalBody: document.getElementById('modal-body'),
    modalClose: document.querySelector('.modal-close'),
    resetBtn: document.getElementById('reset-btn')
};

// ============ 初始化 ============
function init() {
    loadGame();
    setupSidebar();
    setupNavigation();
    renderBuildings();
    renderGatherActions();
    renderCraftActions();
    renderCombatZones();
    setupEventListeners();
    startGameLoop();
    updateUI();
    console.log('⚔️ 中世纪雇佣兵 已启动!');
}

// ============ 侧边栏 ============
function setupSidebar() {
    // 切换按钮
    const toggleBtn = document.getElementById('sidebar-toggle');
    toggleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        elements.sidebar.classList.toggle('expanded');
    });
    
    // 点击导航项切换页面
    elements.navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.stopPropagation();
            const page = item.dataset.page;
            
            // 如果已经展开且点击的是当前页面，则收起
            if (elements.sidebar.classList.contains('expanded') && 
                elements.sidebar.querySelector(`.nav-item.active`) === item) {
                elements.sidebar.classList.remove('expanded');
            } else {
                // 否则展开并切换页面
                elements.sidebar.classList.add('expanded');
                switchPage(page);
            }
        });
    });
    
    // 点击展开内容栏的导航项
    elements.navItems.forEach(item => {
        item.addEventListener('click', () => {
            const page = item.dataset.page;
            switchPage(page);
            
            // 更新图标按钮激活状态
            elements.iconBtns.forEach(btn => {
                btn.classList.toggle('active', btn.dataset.page === page);
            });
        });
    });
    
    // 点击主内容区域收起侧边栏
    document.querySelector('.game-container').addEventListener('click', () => {
        elements.sidebar.classList.remove('expanded');
    });
}

// ============ 页面导航 ============
function setupNavigation() {
    // 已在 setupSidebar 中处理
}

function switchPage(pageId) {
    gameState.currentPage = pageId;
    
    // 更新导航项激活状态
    elements.navItems.forEach(item => {
        item.classList.toggle('active', item.dataset.page === pageId);
    });
    
    elements.pages.forEach(page => {
        page.classList.toggle('active', page.id === `page-${pageId}`);
    });
}

// ============ 事件监听 ============
function setupEventListeners() {
    elements.combatBtn.addEventListener('click', toggleCombat);
    elements.resetBtn.addEventListener('click', resetGame);
    elements.modalClose.addEventListener('click', () => elements.modal.classList.remove('show'));
    elements.modal.addEventListener('click', (e) => {
        if (e.target === elements.modal) elements.modal.classList.remove('show');
    });
}

// ============ UI 更新 ============
function updateUI() {
    // 等级
    elements.level.textContent = gameState.level;
    if (elements.topLevel) {
        elements.topLevel.textContent = gameState.level;
    }
    
    // 仓库资源
    elements.storageGold.textContent = formatNumber(Math.floor(gameState.resources.gold));
    elements.storageWood.textContent = formatNumber(Math.floor(gameState.resources.wood));
    elements.storageStone.textContent = formatNumber(Math.floor(gameState.resources.stone));
    elements.storageHerb.textContent = formatNumber(Math.floor(gameState.resources.herb));
    
    // 游戏时间
    const elapsed = Math.floor((Date.now() - gameState.startTime) / 1000);
    const hours = Math.floor(elapsed / 3600);
    const minutes = Math.floor((elapsed % 3600) / 60);
    const seconds = elapsed % 60;
    elements.playTime.textContent = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    
    updateCombatUI();
    renderBuildings();
    renderGatherActions();
    renderCraftActions();
    renderCombatZones();
}

function formatNumber(num) {
    if (num >= 1000000) return (num / 1000000).toFixed(2) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return Math.floor(num).toString();
}

function checkUnlock(req) {
    if (!req) return true;
    if (req.buildings) {
        for (const [id, level] of Object.entries(req.buildings)) {
            if (!gameState.buildings[id] || gameState.buildings[id].level < level) return false;
        }
    }
    return true;
}

function canAfford(cost) {
    for (const [res, amount] of Object.entries(cost)) {
        if (gameState.resources[res] < amount) return false;
    }
    return true;
}

function payCost(cost) {
    for (const [res, amount] of Object.entries(cost)) {
        gameState.resources[res] -= amount;
    }
}

function addExp(amount) {
    gameState.exp += amount;
    while (gameState.exp >= gameState.expToNext) {
        gameState.exp -= gameState.expToNext;
        gameState.level++;
        gameState.expToNext = Math.floor(gameState.expToNext * 1.5);
        gameState.resources.gold += 50;
        showToast(`🎉 升级了！当前等级：${gameState.level}`);
    }
}

// ============ 建筑系统 ============
function renderBuildings() {
    if (!elements.buildingsList) return;
    
    elements.buildingsList.innerHTML = CONFIG.buildings.map(b => {
        const building = gameState.buildings[b.id];
        const unlocked = checkUnlock(b.unlockReq);
        
        return `
            <div class="building-card ${unlocked ? '' : 'locked'}" data-id="${b.id}">
                <div class="building-icon">${b.icon}</div>
                <div class="building-name">${b.name}</div>
                <div class="building-level">LV.${building.level}</div>
                ${!unlocked ? '<div class="building-cost">🔒 未解锁</div>' : `<div class="building-cost">${formatCost(b.baseCost)}</div>`}
            </div>
        `;
    }).join('');
    
    elements.buildingsList.querySelectorAll('.building-card').forEach(card => {
        card.addEventListener('click', () => {
            const buildingId = card.dataset.id;
            const building = CONFIG.buildings.find(b => b.id === buildingId);
            
            if (!checkUnlock(building.unlockReq)) {
                showToast('🔒 需要先解锁前置建筑');
                return;
            }
            
            if (canAfford(building.baseCost)) {
                buildBuilding(buildingId);
            } else {
                showToast('❌ 资源不足');
            }
        });
    });
}

function formatCost(cost) {
    const icons = { gold: '💰', wood: '🪵', stone: '🪨', herb: '🌿' };
    return Object.entries(cost).map(([res, amount]) => `${icons[res] || res} ${amount}`).join(' ');
}

function buildBuilding(buildingId) {
    const building = CONFIG.buildings.find(b => b.id === buildingId);
    payCost(building.baseCost);
    gameState.buildings[buildingId].level++;
    
    for (const res in building.baseCost) {
        building.baseCost[res] = Math.floor(building.baseCost[res] * 1.5);
    }
    
    addExp(10);
    updateUI();
    saveGame();
    showToast(`✅ 建造了 ${building.name}`);
}

// ============ 采集系统 ============
function renderGatherActions() {
    if (!elements.gatherActions) return;
    
    elements.gatherActions.innerHTML = CONFIG.gatherActions.map(action => {
        const isActive = gameState.activeActions[action.id];
        
        return `
            <div class="action-item ${isActive ? 'active' : ''}" data-id="${action.id}">
                <div class="action-icon">${action.icon}</div>
                <div class="action-info">
                    <div class="action-name">${action.name}</div>
                    <div class="action-desc">${action.desc} | +${action.exp} EXP</div>
                </div>
                ${isActive ? '<div class="action-timer">进行中...</div>' : ''}
            </div>
        `;
    }).join('');
    
    elements.gatherActions.querySelectorAll('.action-item').forEach(item => {
        item.addEventListener('click', () => {
            const actionId = item.dataset.id;
            startAction(actionId);
        });
    });
}

function startAction(actionId) {
    if (gameState.activeActions[actionId]) return;
    
    const action = CONFIG.gatherActions.find(a => a.id === actionId);
    gameState.activeActions[actionId] = Date.now() + action.duration;
    
    renderGatherActions();
    
    setTimeout(() => completeAction(actionId), action.duration);
}

function completeAction(actionId) {
    const action = CONFIG.gatherActions.find(a => a.id === actionId);
    
    for (const [res, amount] of Object.entries(action.reward)) {
        gameState.resources[res] += amount;
    }
    
    addExp(action.exp);
    delete gameState.activeActions[actionId];
    
    updateUI();
    saveGame();
    showToast(`✅ 完成 ${action.name}：${action.desc}`);
}

// ============ 制作系统 ============
function renderCraftActions() {
    if (!elements.craftActions) return;
    
    elements.craftActions.innerHTML = CONFIG.craftRecipes.map(recipe => {
        const building = gameState.buildings[recipe.reqBuilding];
        const unlocked = building && building.level > 0;
        const canCraft = unlocked && canAfford(recipe.cost);
        
        return `
            <div class="action-item ${!unlocked ? 'locked' : ''}" data-id="${recipe.id}">
                <div class="action-icon">${recipe.icon}</div>
                <div class="action-info">
                    <div class="action-name">${recipe.name}</div>
                    <div class="action-desc">${recipe.desc} | +${recipe.exp} EXP</div>
                </div>
                <div class="action-timer">${formatCost(recipe.cost)}</div>
            </div>
        `;
    }).join('');
    
    elements.craftActions.querySelectorAll('.action-item').forEach(item => {
        item.addEventListener('click', () => craftItem(item.dataset.id));
    });
}

function craftItem(recipeId) {
    const recipe = CONFIG.craftRecipes.find(r => r.id === recipeId);
    const building = gameState.buildings[recipe.reqBuilding];
    
    if (!building || building.level === 0) {
        showToast(`🔒 需要 ${CONFIG.buildings.find(b => b.id === recipe.reqBuilding).name}`);
        return;
    }
    
    if (!canAfford(recipe.cost)) {
        showToast('❌ 资源不足');
        return;
    }
    
    payCost(recipe.cost);
    addExp(recipe.exp);
    gameState.resources.gold += recipe.exp * 2;
    
    updateUI();
    saveGame();
    showToast(`✅ 制作了 ${recipe.name}`);
}

// ============ 战斗系统 ============
function renderCombatZones() {
    if (!elements.combatZones) return;
    
    elements.combatZones.innerHTML = CONFIG.combatZones.map((zone, index) => {
        const isActive = gameState.combat.active && gameState.combat.zoneId === zone.id;
        const isLocked = gameState.level < zone.reqLevel;
        
        return `
            <div class="zone-item ${isActive ? 'active' : ''} ${isLocked ? 'locked' : ''}" data-index="${index}">
                <div class="zone-icon">${zone.icon}</div>
                <div class="zone-info">
                    <div class="zone-name">${zone.name}</div>
                    <div class="zone-req">等级要求：${zone.reqLevel} | ${zone.duration/1000}秒</div>
                    <div class="zone-rewards">掉落：金币、资源</div>
                </div>
            </div>
        `;
    }).join('');
    
    elements.combatZones.querySelectorAll('.zone-item').forEach(item => {
        item.addEventListener('click', () => {
            const index = parseInt(item.dataset.index);
            if (gameState.level < CONFIG.combatZones[index].reqLevel) {
                showToast(`❌ 需要等级 ${CONFIG.combatZones[index].reqLevel}`);
                return;
            }
            gameState.currentZoneIndex = index;
            renderCombatZones();
            updateCombatUI();
        });
    });
}

function updateCombatUI() {
    const now = Date.now();
    const zone = CONFIG.combatZones[gameState.currentZoneIndex];
    
    if (gameState.combat.active) {
        const remaining = Math.max(0, gameState.combat.endTime - now);
        const seconds = Math.ceil(remaining / 1000);
        
        elements.combatLocation.textContent = CONFIG.combatZones.find(z => z.id === gameState.combat.zoneId)?.name || '战斗中';
        elements.combatTimer.textContent = `剩余：${seconds}秒`;
        elements.combatBtn.textContent = '战斗中...';
        elements.combatBtn.disabled = true;
    } else {
        elements.combatLocation.textContent = `${zone.icon} ${zone.name}`;
        elements.combatTimer.textContent = `预计：${zone.duration/1000}秒 | 等级要求：${zone.reqLevel}`;
        elements.combatBtn.textContent = '出征';
        elements.combatBtn.disabled = gameState.level < zone.reqLevel;
    }
}

function toggleCombat() {
    if (gameState.combat.active) return;
    
    const zone = CONFIG.combatZones[gameState.currentZoneIndex];
    
    if (gameState.level < zone.reqLevel) {
        showToast(`❌ 需要等级 ${zone.reqLevel}`);
        return;
    }
    
    gameState.combat.active = true;
    gameState.combat.zoneId = zone.id;
    gameState.combat.endTime = Date.now() + zone.duration;
    
    updateCombatUI();
    renderCombatZones();
    
    setTimeout(() => completeCombat(zone), zone.duration);
}

function completeCombat(zone) {
    gameState.combat.active = false;
    
    let rewards = [];
    zone.rewards.forEach(r => {
        const amount = Math.floor(Math.random() * (r.max - r.min + 1)) + r.min;
        gameState.resources[r.item] += amount;
        const icons = { gold: '💰', wood: '🪵', stone: '🪨', herb: '🌿' };
        rewards.push(`${icons[r.item]} +${amount}`);
    });
    
    const expReward = zone.difficulty * 10;
    addExp(expReward);
    
    elements.combatRewards.innerHTML = `🎉 战斗奖励：${rewards.join(' ')} | +${expReward} EXP`;
    
    gameState.currentZoneIndex = (gameState.currentZoneIndex + 1) % CONFIG.combatZones.length;
    
    updateUI();
    saveGame();
}

// ============ 工具函数 ============
function showToast(message) {
    const toast = document.createElement('div');
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed; top: 20px; left: 50%; transform: translateX(-50%);
        background: #e94560; color: white; padding: 12px 25px; border-radius: 8px;
        z-index: 3000; animation: toastFade 2s ease-out;
    `;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2000);
}

const style = document.createElement('style');
style.textContent = `@keyframes toastFade {
    0% { opacity: 0; transform: translateX(-50%) translateY(-20px); }
    10% { opacity: 1; transform: translateX(-50%) translateY(0); }
    90% { opacity: 1; transform: translateX(-50%) translateY(0); }
    100% { opacity: 0; transform: translateX(-50%) translateY(-20px); }
}`;
document.head.appendChild(style);

// ============ 存档系统 ============
function saveGame() {
    gameState.lastSave = Date.now();
    localStorage.setItem('medievalMercenarySave', JSON.stringify(gameState));
}

function loadGame() {
    const saved = localStorage.getItem('medievalMercenarySave');
    if (saved) {
        try {
            const loaded = JSON.parse(saved);
            gameState = { ...gameState, ...loaded };
            
            const now = Date.now();
            for (const [actionId, endTime] of Object.entries(gameState.activeActions)) {
                if (endTime > now) {
                    setTimeout(() => completeAction(actionId), endTime - now);
                } else {
                    delete gameState.activeActions[actionId];
                }
            }
            
            if (gameState.combat.active && gameState.combat.endTime > now) {
                setTimeout(() => completeCombat(CONFIG.combatZones.find(z => z.id === gameState.combat.zoneId)), gameState.combat.endTime - now);
            } else {
                gameState.combat.active = false;
            }
            
            console.log('💾 游戏已加载');
        } catch (e) {
            console.error('加载失败:', e);
        }
    }
}

function resetGame() {
    if (confirm('⚠️ 确定要重置所有进度吗？')) {
        localStorage.removeItem('medievalMercenarySave');
        location.reload();
    }
}

// ============ 游戏循环 ============
function startGameLoop() {
    setInterval(() => {
        CONFIG.buildings.forEach(b => {
            const building = gameState.buildings[b.id];
            if (building.level > 0 && b.production) {
                for (const [res, amount] of Object.entries(b.production)) {
                    gameState.resources[res] += amount * building.level;
                }
            }
        });
        updateUI();
    }, 1000);
    
    setInterval(saveGame, 5000);
}

window.addEventListener('DOMContentLoaded', init);
window.addEventListener('beforeunload', saveGame);
