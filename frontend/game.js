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
let CONFIG = null;     // 从后端获取的配置数据
let socket = null;     // Socket.io 连接
let animationFrame = null;
let lastActionStartTime = 0;

// DOM 元素缓存
const elements = {};

// 配置数据从后端 /api/config 加载


// ============ 初始化 ============

document.addEventListener('DOMContentLoaded', init);

async function init() {
    cacheElements();
    await loadConfig();
    setupSocket();
    setupEventListeners();
    setupNavigation();
}

/**
 * 从后端加载游戏配置
 */
async function loadConfig() {
    try {
        const response = await fetch('/api/config');
        CONFIG = await response.json();
        console.log('游戏配置已加载');
    } catch (error) {
        console.error('加载配置失败:', error);
        showToast('❌ 加载游戏配置失败');
    }
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