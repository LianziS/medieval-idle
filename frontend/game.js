/**
 * 中世纪雇佣兵 - 前端客户端
 * 
 * 职责：
 * - UI 渲染和动画
 * - 用户交互事件处理
 * - 通过 Socket.io 与后端通信
 * - 显示后端返回的游戏状态
 * 
 * 注意：所有游戏逻辑都在后端执行，前端只负责显示
 */

// ============ 全局状态 ============

let gameState = null;  // 从后端同步的游戏状态
let socket = null;     // Socket.io 连接
let animationFrame = null;
let lastActionStartTime = 0;

// DOM 元素缓存
const elements = {};

// ============ 配置数据（仅用于 UI 显示） ============

const CONFIG = {
    trees: [
        { id: 'pine', name: '青杉木', icon: '🌲', duration: 5000, exp: 3, reqLevel: 1, dropItem: 'pine', dropIcon: '🪵' },
        { id: 'iron_birch', name: '铁桦木', icon: '🌳', duration: 8000, exp: 5, reqLevel: 5, dropItem: 'iron_birch', dropIcon: '🪵' },
        { id: 'wind_tree', name: '风啸木', icon: '🌬️', duration: 12000, exp: 8, reqLevel: 10, dropItem: 'wind_tree', dropIcon: '🪵' },
        { id: 'flame_tree', name: '焰心木', icon: '🔥', duration: 18000, exp: 12, reqLevel: 20, dropItem: 'flame_tree', dropIcon: '🪵' },
        { id: 'frost_maple', name: '霜叶木', icon: '❄️', duration: 25000, exp: 18, reqLevel: 35, dropItem: 'frost_maple', dropIcon: '🪵' },
        { id: 'thunder_tree', name: '雷鸣木', icon: '⚡', duration: 35000, exp: 25, reqLevel: 50, dropItem: 'thunder_tree', dropIcon: '🪵' },
        { id: 'ancient_oak', name: '古橡木', icon: '🪴', duration: 50000, exp: 35, reqLevel: 65, dropItem: 'ancient_oak', dropIcon: '🪵' },
        { id: 'world_tree', name: '世界木', icon: '✨', duration: 80000, exp: 50, reqLevel: 80, dropItem: 'world_tree', dropIcon: '🪵' }
    ],
    ores: [
        { id: 'iron_ore', name: '铁矿', icon: '🪨', duration: 6000, exp: 4, reqLevel: 1, dropItem: 'iron_ore', dropIcon: '🪨' },
        { id: 'silver_ore', name: '银矿', icon: '⚪', duration: 10000, exp: 7, reqLevel: 5, dropItem: 'silver_ore', dropIcon: '🪨' },
        { id: 'gold_ore', name: '金矿', icon: '🟡', duration: 15000, exp: 10, reqLevel: 10, dropItem: 'gold_ore', dropIcon: '🪨' },
        { id: 'ruby_ore', name: '红宝石矿', icon: '🔴', duration: 22000, exp: 15, reqLevel: 20, dropItem: 'ruby_ore', dropIcon: '💎' },
        { id: 'emerald_ore', name: '绿宝石矿', icon: '🟢', duration: 30000, exp: 22, reqLevel: 35, dropItem: 'emerald_ore', dropIcon: '💎' },
        { id: 'diamond_ore', name: '钻石矿', icon: '💎', duration: 45000, exp: 30, reqLevel: 50, dropItem: 'diamond_ore', dropIcon: '💎' },
        { id: 'star_ore', name: '星辰矿', icon: '🌟', duration: 60000, exp: 45, reqLevel: 65, dropItem: 'star_ore', dropIcon: '🌟' },
        { id: 'void_ore', name: '虚空矿', icon: '🌀', duration: 90000, exp: 60, reqLevel: 80, dropItem: 'void_ore', dropIcon: '🌀' }
    ],
    gatheringLocations: [
        {
            id: 'forest_edge', name: '森林边缘', icon: '🌲', duration: 8000, exp: 5, reqLevel: 1,
            items: [
                { id: 'wild_herb', name: '野草', icon: '🌿', exp: 2, probability: 0.8 },
                { id: 'mushroom', name: '蘑菇', icon: '🍄', exp: 3, probability: 0.5 },
                { id: 'berry', name: '浆果', icon: '🫐', exp: 2, probability: 0.6 }
            ]
        },
        {
            id: 'deep_forest', name: '深林腹地', icon: '🌳', duration: 15000, exp: 10, reqLevel: 10,
            items: [
                { id: 'rare_herb', name: '稀有草药', icon: '🌱', exp: 5, probability: 0.4 },
                { id: 'forest_flower', name: '森林花', icon: '🌸', exp: 4, probability: 0.6 },
                { id: 'tree_resin', name: '树树脂', icon: '🍯', exp: 6, probability: 0.3 }
            ]
        }
    ],
    woodPlanks: [
        { id: 'pine_plank', name: '青杉木板', icon: '🪵', reqLevel: 1, duration: 6000, exp: 5, materials: { pine: 2 } },
        { id: 'iron_birch_plank', name: '铁桦木板', icon: '🪵', reqLevel: 10, duration: 8000, exp: 7.5, materials: { iron_birch: 2 } },
        { id: 'wind_tree_plank', name: '风啸木板', icon: '🪵', reqLevel: 20, duration: 10000, exp: 12.5, materials: { wind_tree: 2 } },
        { id: 'flame_tree_plank', name: '焰心木板', icon: '🪵', reqLevel: 35, duration: 12000, exp: 20, materials: { flame_tree: 2 } },
        { id: 'frost_maple_plank', name: '霜叶木板', icon: '🪵', reqLevel: 50, duration: 14000, exp: 30, materials: { frost_maple: 2 } },
        { id: 'thunder_tree_plank', name: '雷鸣木板', icon: '🪵', reqLevel: 65, duration: 16000, exp: 40, materials: { thunder_tree: 2 } },
        { id: 'ancient_oak_plank', name: '古橡木板', icon: '🪵', reqLevel: 80, duration: 18000, exp: 55, materials: { ancient_oak: 2 } },
        { id: 'world_tree_plank', name: '世界木板', icon: '🪵', reqLevel: 95, duration: 30000, exp: 73, materials: { world_tree: 2 } }
    ],
    ingots: [
        { id: 'iron_ingot', name: '铁锭', icon: '🔩', reqLevel: 1, duration: 8000, exp: 6, materials: { iron_ore: 3 } },
        { id: 'silver_ingot', name: '银锭', icon: '⚪', reqLevel: 5, duration: 12000, exp: 10, materials: { silver_ore: 3 } },
        { id: 'gold_ingot', name: '金锭', icon: '🟡', reqLevel: 10, duration: 18000, exp: 15, materials: { gold_ore: 3 } },
        { id: 'ruby_ingot', name: '红宝石锭', icon: '🔴', reqLevel: 20, duration: 25000, exp: 22, materials: { ruby_ore: 3 } },
        { id: 'emerald_ingot', name: '绿宝石锭', icon: '🟢', reqLevel: 35, duration: 35000, exp: 32, materials: { emerald_ore: 3 } },
        { id: 'diamond_ingot', name: '钻石锭', icon: '💎', reqLevel: 50, duration: 50000, exp: 45, materials: { diamond_ore: 3 } },
        { id: 'star_ingot', name: '星辰锭', icon: '🌟', reqLevel: 65, duration: 70000, exp: 60, materials: { star_ore: 3 } },
        { id: 'void_ingot', name: '虚空锭', icon: '🌀', reqLevel: 80, duration: 100000, exp: 80, materials: { void_ore: 3 } }
    ],
    buildings: [
        { id: 'tent', name: '帐篷', icon: '🏕️', baseCost: { gold: 0 }, maxLevel: 9, 
          levelNames: ['破帐篷', '简陋帐篷', '普通帐篷', '精致帐篷', '豪华帐篷', '行军帐篷', '营地', '军营', '城堡'] }
    ],
    tools: {
        axes: [
            { id: 'basic_axe', name: '基础斧', icon: '🔧', speedBonus: 0.1, reqCraftLevel: 1, reqEquipLevel: 1 },
            { id: 'iron_axe', name: '铁斧', icon: '🪓', speedBonus: 0.2, reqCraftLevel: 5, reqEquipLevel: 5 },
            { id: 'steel_axe', name: '钢斧', icon: '⚔️', speedBonus: 0.35, reqCraftLevel: 15, reqEquipLevel: 15 }
        ],
        pickaxes: [
            { id: 'basic_pickaxe', name: '基础镐', icon: '⛏️', speedBonus: 0.1, reqCraftLevel: 1, reqEquipLevel: 1 },
            { id: 'iron_pickaxe', name: '铁镐', icon: '⛏️', speedBonus: 0.2, reqCraftLevel: 5, reqEquipLevel: 5 },
            { id: 'steel_pickaxe', name: '钢镐', icon: '⛏️', speedBonus: 0.35, reqCraftLevel: 15, reqEquipLevel: 15 }
        ]
    }
};

// ============ 初始化 ============

document.addEventListener('DOMContentLoaded', init);

function init() {
    cacheElements();
    setupSocket();
    setupEventListeners();
    setupNavigation();
}

/**
 * 缓存 DOM 元素
 */
function cacheElements() {
    elements.sidebar = document.getElementById('sidebar');
    elements.navItems = document.querySelectorAll('.nav-item');
    elements.pages = document.querySelectorAll('.page');
    
    // 状态显示
    elements.level = document.getElementById('level');
    elements.storageGold = document.getElementById('storage-gold');
    
    // 行动状态栏
    elements.actionStatusBar = document.getElementById('action-status-bar');
    elements.actionStatusIcon = document.getElementById('action-status-icon');
    elements.actionStatusName = document.getElementById('action-status-name');
    elements.actionStatusCount = document.getElementById('action-status-count');
    elements.actionProgressFill = document.getElementById('action-progress-fill');
    elements.actionProgressTime = document.getElementById('action-progress-time');
    elements.actionCancelBtn = document.getElementById('action-cancel-btn');
    elements.actionQueueBtn = document.getElementById('action-queue-btn');
    
    // 列表容器
    elements.buildingsList = document.getElementById('buildings-list');
    elements.woodcuttingList = document.getElementById('woodcutting-list');
    elements.miningList = document.getElementById('mining-list');
    elements.gatheringList = document.getElementById('gathering-list');
    elements.craftingList = document.getElementById('crafting-list');
    elements.forgingList = document.getElementById('forging-list');
    
    // 库存显示
    elements.storageWoodcuttingItems = document.getElementById('storage-woodcutting-items');
    elements.storageMiningItems = document.getElementById('storage-mining-items');
    elements.storageGatheringItems = document.getElementById('storage-gathering-items');
    elements.storagePlanksItems = document.getElementById('storage-planks-items');
    elements.storageIngotsItems = document.getElementById('storage-ingots-items');
}

/**
 * 设置 Socket.io 连接
 */
function setupSocket() {
    socket = io();
    
    // 认证
    const token = localStorage.getItem('medieval_token');
    if (token) {
        socket.emit('auth', { token });
    }
    
    // 认证结果
    socket.on('auth_result', (data) => {
        if (data.success) {
            console.log('认证成功');
            showToast('✅ 已连接服务器');
        } else {
            console.error('认证失败:', data.error);
            window.location.href = '/login';
        }
    });
    
    // 接收游戏状态
    socket.on('game_state', (state) => {
        gameState = state;
        renderAll();
        console.log('游戏状态已同步');
    });
    
    // 状态更新
    socket.on('game_state_update', (state) => {
        gameState = state;
        updateUI();
    });
    
    // 行动结果
    socket.on('action_result', (result) => {
        if (result.success) {
            if (result.queued) {
                showToast(`📋 已加入队列 (#${result.queueLength + 1})`);
            }
            startActionAnimation();
        } else {
            showToast(`❌ ${result.reason}`);
        }
    });
    
    // 行动完成结果
    socket.on('action_complete_result', (result) => {
        if (result.success && result.rewards) {
            showRewards(result.rewards);
            if (result.completed) {
                showToast('✅ 行动完成');
            }
        }
    });
    
    // 队列下一个
    socket.on('queue_next', (nextAction) => {
        showToast(`📋 开始: ${nextAction.name}`);
    });
    
    // 错误处理
    socket.on('error', (data) => {
        showToast(`❌ ${data.message}`);
    });
}

/**
 * 设置事件监听器
 */
function setupEventListeners() {
    // 取消行动按钮
    if (elements.actionCancelBtn) {
        elements.actionCancelBtn.addEventListener('click', () => {
            if (confirm('确定要取消当前行动吗？')) {
                socket.emit('action_cancel');
            }
        });
    }
}

/**
 * 设置导航
 */
function setupNavigation() {
    elements.navItems.forEach(item => {
        item.addEventListener('click', () => {
            const page = item.dataset.page;
            switchPage(page);
        });
    });
}

/**
 * 切换页面
 */
function switchPage(pageId) {
    elements.navItems.forEach(item => {
        item.classList.toggle('active', item.dataset.page === pageId);
    });
    elements.pages.forEach(page => {
        page.classList.toggle('active', page.id === `page-${pageId}`);
    });
}

// ============ 渲染函数 ============

/**
 * 渲染所有内容
 */
function renderAll() {
    if (!gameState) return;
    
    renderBuildings();
    renderWoodcutting();
    renderMining();
    renderGathering();
    renderCrafting();
    renderForging();
    renderInventories();
    updateUI();
}

/**
 * 更新 UI 状态
 */
function updateUI() {
    if (!gameState) return;
    
    // 更新等级显示
    if (elements.level) {
        elements.level.textContent = gameState.level || 1;
    }
    
    // 更新金币显示
    if (elements.storageGold) {
        elements.storageGold.textContent = formatNumber(gameState.gold || 0);
    }
    
    // 更新行动状态栏
    updateActionStatusBar();
}

/**
 * 更新行动状态栏
 */
function updateActionStatusBar() {
    if (!gameState || !gameState.activeAction) {
        // 没有行动进行中
        if (elements.actionStatusIcon) elements.actionStatusIcon.textContent = '∞';
        if (elements.actionStatusName) elements.actionStatusName.textContent = '休息中';
        if (elements.actionStatusCount) elements.actionStatusCount.textContent = '';
        if (elements.actionProgressFill) elements.actionProgressFill.style.width = '0%';
        if (elements.actionProgressTime) elements.actionProgressTime.textContent = '-';
        return;
    }
    
    const action = gameState.activeAction;
    const remaining = action.remaining || 0;
    
    // 计算进度
    const elapsed = Date.now() - (gameState.actionStartTime || Date.now());
    const duration = gameState.actionDuration || 5000;
    const progress = Math.min(elapsed / duration, 1);
    const remainingTime = Math.max(duration - elapsed, 0);
    
    if (elements.actionProgressFill) {
        elements.actionProgressFill.style.width = `${progress * 100}%`;
    }
    if (elements.actionProgressTime) {
        elements.actionProgressTime.textContent = formatTime(remainingTime);
    }
    if (elements.actionStatusCount) {
        elements.actionStatusCount.textContent = remaining > 0 ? `×${remaining}` : '';
    }
}

/**
 * 渲染建筑列表
 */
function renderBuildings() {
    if (!elements.buildingsList || !gameState) return;
    
    elements.buildingsList.innerHTML = CONFIG.buildings.map(b => {
        const building = gameState.buildings[b.id] || { level: 0 };
        const level = building.level;
        const isMaxLevel = b.maxLevel && level >= b.maxLevel;
        const displayName = b.levelNames && b.levelNames[level] ? b.levelNames[level] : b.name;
        
        return `
            <div class="building-card" data-id="${b.id}">
                <div class="building-icon">${b.icon}</div>
                <div class="building-name">${displayName}</div>
                ${level > 0 ? `<div class="building-level">LV.${level}</div>` : ''}
                ${isMaxLevel ? '<div class="building-cost">已满级</div>' : `<div class="building-cost">${formatCost(b.baseCost)}</div>`}
            </div>
        `;
    }).join('');
    
    // 绑定点击事件
    elements.buildingsList.querySelectorAll('.building-card').forEach(card => {
        card.addEventListener('click', () => {
            const buildingId = card.dataset.id;
            // TODO: 发送建筑升级请求到后端
            showToast('🏗️ 建筑系统待实现');
        });
    });
}

/**
 * 渲染伐木列表
 */
function renderWoodcutting() {
    if (!elements.woodcuttingList || !gameState) return;
    
    const level = gameState.woodcuttingLevel || 1;
    
    elements.woodcuttingList.innerHTML = CONFIG.trees.map(tree => {
        const unlocked = level >= tree.reqLevel;
        const isActive = gameState.activeAction?.type === 'WOODCUTTING' && gameState.activeAction?.id === tree.id;
        
        return `
            <div class="action-card ${unlocked ? '' : 'locked'} ${isActive ? 'active' : ''}" 
                 data-action="woodcutting" data-id="${tree.id}">
                <div class="action-icon">${tree.icon}</div>
                <div class="action-info">
                    <div class="action-name">${tree.name}</div>
                    <div class="action-details">
                        <span>⏱️ ${formatTime(tree.duration)}</span>
                        <span>✨ ${tree.exp}</span>
                    </div>
                </div>
                ${!unlocked ? `<div class="locked-overlay">🔒 Lv.${tree.reqLevel}</div>` : ''}
            </div>
        `;
    }).join('');
    
    // 绑定点击事件
    elements.woodcuttingList.querySelectorAll('.action-card:not(.locked)').forEach(card => {
        card.addEventListener('click', () => {
            const treeId = card.dataset.id;
            openActionModal('WOODCUTTING', treeId);
        });
    });
}

/**
 * 渲染挖矿列表
 */
function renderMining() {
    if (!elements.miningList || !gameState) return;
    
    const level = gameState.miningLevel || 1;
    
    elements.miningList.innerHTML = CONFIG.ores.map(ore => {
        const unlocked = level >= ore.reqLevel;
        const isActive = gameState.activeAction?.type === 'MINING' && gameState.activeAction?.id === ore.id;
        
        return `
            <div class="action-card ${unlocked ? '' : 'locked'} ${isActive ? 'active' : ''}" 
                 data-action="mining" data-id="${ore.id}">
                <div class="action-icon">${ore.icon}</div>
                <div class="action-info">
                    <div class="action-name">${ore.name}</div>
                    <div class="action-details">
                        <span>⏱️ ${formatTime(ore.duration)}</span>
                        <span>✨ ${ore.exp}</span>
                    </div>
                </div>
                ${!unlocked ? `<div class="locked-overlay">🔒 Lv.${ore.reqLevel}</div>` : ''}
            </div>
        `;
    }).join('');
    
    elements.miningList.querySelectorAll('.action-card:not(.locked)').forEach(card => {
        card.addEventListener('click', () => {
            const oreId = card.dataset.id;
            openActionModal('MINING', oreId);
        });
    });
}

/**
 * 渲染采集列表
 */
function renderGathering() {
    if (!elements.gatheringList || !gameState) return;
    
    const level = gameState.gatheringLevel || 1;
    
    elements.gatheringList.innerHTML = CONFIG.gatheringLocations.map(loc => {
        const unlocked = level >= loc.reqLevel;
        
        return `
            <div class="action-card ${unlocked ? '' : 'locked'}" 
                 data-action="gathering" data-id="${loc.id}">
                <div class="action-icon">${loc.icon}</div>
                <div class="action-info">
                    <div class="action-name">${loc.name}</div>
                    <div class="action-details">
                        <span>⏱️ ${formatTime(loc.duration)}</span>
                        <span>✨ ${loc.exp}</span>
                    </div>
                </div>
                ${!unlocked ? `<div class="locked-overlay">🔒 Lv.${loc.reqLevel}</div>` : ''}
            </div>
        `;
    }).join('');
    
    elements.gatheringList.querySelectorAll('.action-card:not(.locked)').forEach(card => {
        card.addEventListener('click', () => {
            const locId = card.dataset.id;
            openActionModal('GATHERING', locId);
        });
    });
}

/**
 * 渲染制作列表
 */
function renderCrafting() {
    if (!elements.craftingList || !gameState) return;
    
    const level = gameState.craftingLevel || 1;
    
    elements.craftingList.innerHTML = CONFIG.woodPlanks.map(plank => {
        const unlocked = level >= plank.reqLevel;
        
        return `
            <div class="action-card ${unlocked ? '' : 'locked'}" 
                 data-action="crafting" data-id="${plank.id}">
                <div class="action-icon">${plank.icon}</div>
                <div class="action-info">
                    <div class="action-name">${plank.name}</div>
                    <div class="action-details">
                        <span>⏱️ ${formatTime(plank.duration)}</span>
                        <span>✨ ${plank.exp}</span>
                    </div>
                </div>
                ${!unlocked ? `<div class="locked-overlay">🔒 Lv.${plank.reqLevel}</div>` : ''}
            </div>
        `;
    }).join('');
    
    elements.craftingList.querySelectorAll('.action-card:not(.locked)').forEach(card => {
        card.addEventListener('click', () => {
            const plankId = card.dataset.id;
            openActionModal('CRAFTING', plankId);
        });
    });
}

/**
 * 渲染锻造列表
 */
function renderForging() {
    if (!elements.forgingList || !gameState) return;
    
    const level = gameState.forgingLevel || 1;
    
    elements.forgingList.innerHTML = CONFIG.ingots.map(ingot => {
        const unlocked = level >= ingot.reqLevel;
        
        return `
            <div class="action-card ${unlocked ? '' : 'locked'}" 
                 data-action="forging" data-id="${ingot.id}">
                <div class="action-icon">${ingot.icon}</div>
                <div class="action-info">
                    <div class="action-name">${ingot.name}</div>
                    <div class="action-details">
                        <span>⏱️ ${formatTime(ingot.duration)}</span>
                        <span>✨ ${ingot.exp}</span>
                    </div>
                </div>
                ${!unlocked ? `<div class="locked-overlay">🔒 Lv.${ingot.reqLevel}</div>` : ''}
            </div>
        `;
    }).join('');
    
    elements.forgingList.querySelectorAll('.action-card:not(.locked)').forEach(card => {
        card.addEventListener('click', () => {
            const ingotId = card.dataset.id;
            openActionModal('FORGING', ingotId);
        });
    });
}

/**
 * 渲染库存
 */
function renderInventories() {
    if (!gameState) return;
    
    // 伐木物品
    renderInventoryGrid('storage-woodcutting-items', gameState.woodcuttingInventory, CONFIG.trees, 'dropItem');
    
    // 挖矿物品
    renderInventoryGrid('storage-mining-items', gameState.miningInventory, CONFIG.ores, 'dropItem');
    
    // 木板
    renderInventoryGrid('storage-planks-items', gameState.planksInventory, CONFIG.woodPlanks);
    
    // 矿锭
    renderInventoryGrid('storage-ingots-items', gameState.ingotsInventory, CONFIG.ingots);
}

/**
 * 渲染库存网格
 */
function renderInventoryGrid(elementId, inventory, config, idField = 'id') {
    const element = document.getElementById(elementId);
    if (!element || !inventory) return;
    
    const items = Object.entries(inventory)
        .filter(([id, count]) => count > 0)
        .map(([id, count]) => {
            const configItem = config.find(c => c[idField] === id) || { name: id, icon: '❓' };
            return `
                <div class="inventory-item">
                    <span class="item-icon">${configItem.icon}</span>
                    <span class="item-name">${configItem.name}</span>
                    <span class="item-count">×${count}</span>
                </div>
            `;
        }).join('');
    
    element.innerHTML = items || '<div class="empty-message">暂无物品</div>';
}

// ============ 行动模态框 ============

let pendingAction = null;

/**
 * 打开行动模态框
 */
function openActionModal(type, id) {
    const configs = {
        WOODCUTTING: CONFIG.trees,
        MINING: CONFIG.ores,
        GATHERING: CONFIG.gatheringLocations,
        CRAFTING: CONFIG.woodPlanks,
        FORGING: CONFIG.ingots
    };
    
    const config = configs[type]?.find(c => c.id === id);
    if (!config) return;
    
    pendingAction = { type, id, name: config.name };
    
    // 简化版：直接询问次数
    const count = prompt(`请输入 ${config.name} 的执行次数：`, '1');
    if (count) {
        const countNum = parseInt(count) || 1;
        confirmAction(countNum);
    }
    
    pendingAction = null;
}

/**
 * 确认行动
 */
function confirmAction(count) {
    if (!pendingAction) return;
    
    socket.emit('action_start', {
        type: pendingAction.type,
        id: pendingAction.id,
        count: count
    });
}

/**
 * 开始行动动画
 */
function startActionAnimation() {
    lastActionStartTime = Date.now();
    
    if (animationFrame) {
        cancelAnimationFrame(animationFrame);
    }
    
    function animate() {
        updateActionStatusBar();
        
        if (gameState?.activeAction) {
            animationFrame = requestAnimationFrame(animate);
        }
    }
    
    animate();
}

// ============ GM 指令面板 ============

/**
 * 打开 GM 面板（测试用）
 */
function openGMPanel() {
    const commands = [
        { label: '加金币 10000', command: 'add_gold', args: { amount: 10000 } },
        { label: '加伐木经验 1000', command: 'add_exp', args: { skill: 'woodcutting', amount: 1000 } },
        { label: '伐木等级 50', command: 'set_level', args: { skill: 'woodcutting', level: 50 } },
        { label: '加青杉木 100', command: 'add_item', args: { itemType: 'WOOD', itemId: 'pine', count: 100 } }
    ];
    
    const panel = document.createElement('div');
    panel.className = 'gm-panel';
    panel.innerHTML = `
        <h3>🛠️ GM 测试面板</h3>
        <div class="gm-commands">
            ${commands.map(cmd => `
                <button class="gm-btn" data-command='${JSON.stringify({ command: cmd.command, ...cmd.args })}'>
                    ${cmd.label}
                </button>
            `).join('')}
        </div>
        <button class="gm-close">关闭</button>
    `;
    
    panel.querySelectorAll('.gm-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const data = JSON.parse(btn.dataset.command);
            socket.emit('gm_command', data);
            showToast(`🔧 执行: ${btn.textContent}`);
        });
    });
    
    panel.querySelector('.gm-close').addEventListener('click', () => {
        panel.remove();
    });
    
    document.body.appendChild(panel);
}

// 按键快捷方式
document.addEventListener('keydown', (e) => {
    if (e.key === 'F12' && e.ctrlKey) {
        openGMPanel();
    }
});

// ============ 工具函数 ============

/**
 * 格式化数字
 */
function formatNumber(num) {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
}

/**
 * 格式化时间
 */
function formatTime(ms) {
    if (ms < 1000) return '0s';
    const seconds = Math.floor(ms / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (minutes < 60) return `${minutes}m${secs}s`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h${mins}m`;
}

/**
 * 格式化花费
 */
function formatCost(cost) {
    return Object.entries(cost)
        .map(([res, amount]) => `${res} ${amount}`)
        .join(' ');
}

/**
 * 显示提示
 */
function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('fade-out');
        setTimeout(() => toast.remove(), 300);
    }, 2000);
}

/**
 * 显示奖励
 */
function showRewards(rewards) {
    const text = rewards.map(r => {
        if (r.type === 'exp') {
            return `✨ +${r.amount} ${r.skill}经验${r.leveledUp ? ' 🎉升级!' : ''}`;
        }
        return `${r.icon} ${r.name} ×${r.count}`;
    }).join(' | ');
    
    showToast(text);
}

// ============ 游戏循环 ============

function gameLoop() {
    if (gameState?.activeAction) {
        updateActionStatusBar();
    }
    requestAnimationFrame(gameLoop);
}

// 启动游戏循环
gameLoop();

console.log('🎮 中世纪雇佣兵 - 前端客户端已加载');
console.log('💡 按 Ctrl+F12 打开 GM 测试面板');