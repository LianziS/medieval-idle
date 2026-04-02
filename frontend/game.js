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
let completingAction = false; // 防止重复发送完成事件

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
    elements.actionRewards = document.getElementById('action-rewards');
    
    // 列表容器
    elements.buildingsList = document.getElementById('buildings-list');
    elements.woodcuttingList = document.getElementById('woodcutting-list');
    elements.miningList = document.getElementById('mining-list');
    elements.gatheringList = document.getElementById('gathering-items-list');
    elements.craftingList = document.getElementById('crafting-planks-list');
    elements.forgingList = document.getElementById('forging-ingots-list');
    elements.tailoringList = document.getElementById('tailoring-fabrics-list');
    elements.alchemyList = document.getElementById('alchemy-potions-list');
    elements.brewingList = document.getElementById('brewing-brews-list');
    elements.essenceList = document.getElementById('alchemy-essences-list');
    
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
    
    // 设置超时：5秒后强制隐藏 loading
    setTimeout(() => {
        const loadingEl = document.getElementById('loading');
        if (loadingEl) {
            loadingEl.remove(); // 完全移除元素
            console.log('Loading 元素已移除');
        }
    }, 5000);
    
    // 认证
    const token = localStorage.getItem('medieval_token');
    if (token) {
        socket.emit('auth', { token });
    } else {
        // 没有 token，直接跳转登录页
        window.location.href = '/login';
    }
    
    // 强制移除 loading（3秒超时）
    setTimeout(() => {
        const loadingEl = document.getElementById('loading');
        if (loadingEl) {
            loadingEl.remove();
            console.log('Loading 超时移除');
        }
    }, 3000);
    
    // 认证结果
    socket.on('auth_result', (data) => {
        if (data.success) {
            console.log('认证成功');
            showToast('✅ 已连接服务器');
        } else {
            console.error('认证失败:', data.error);
            // 移除 loading，跳转到登录页
            const loadingEl = document.getElementById('loading');
            if (loadingEl) loadingEl.remove();
            window.location.href = '/login';
        }
    });
    
    // 接收游戏状态
    socket.on('game_state', (state) => {
        gameState = state;
        lastActionStartTime = Date.now(); // 初始化时间戳
        renderAll();
        console.log('游戏状态已同步');
        
        // 移除 loading 元素
        const loadingEl = document.getElementById('loading');
        if (loadingEl) {
            loadingEl.remove();
        }
    });
    
    // 状态更新
    socket.on('game_state_update', (state) => {
        gameState = state;
        // 如果收到更新时 action 已完成，重置标志
        if (!state.activeAction) {
            completingAction = false;
        }
        updateUI();
        
        // 如果队列面板打开，实时刷新
        const popover = document.getElementById('queue-popover');
        if (popover && popover.style.display === 'block') {
            showQueuePopover();
        }
    });
    
    // 行动结果
    socket.on('action_result', (result) => {
        if (result.success) {
            lastActionStartTime = Date.now(); // 更新时间戳
            completingAction = false; // 重置标志
            if (result.queued) {
                showToast(`📋 已加入队列 (#${result.queueLength + 1})`);
            }
        } else {
            showToast(`❌ ${result.reason}`);
        }
    });
    
    // 行动完成结果
    socket.on('action_complete_result', (result) => {
        if (result.success && result.rewards) {
            showRewards(result.rewards);
            if (result.completed) {
                showToast('✅ 行动全部完成');
                completingAction = false;
            } else if (result.remaining > 0) {
                // 还有剩余次数，重置开始时间
                lastActionStartTime = Date.now();
                completingAction = false;
            }
        } else {
            completingAction = false;
        }
    });
    
    // 锻造结果
    socket.on('forge_result', (result) => {
        if (result.success) {
            showToast(`✅ 锻造成功: ${result.tool.name}`);
        } else {
            showToast(`❌ ${result.reason}`);
        }
    });
    
    // 商人系统事件
    socket.on('merchant_data', (data) => {
        renderMerchantPanel(data.merchantId, data.data);
    });
    
    socket.on('buy_result', (result) => {
        if (result.success) {
            showToast(`✅ 购买成功: ${result.goods.name}`);
        } else {
            showToast(`❌ ${result.reason}`);
        }
    });
    
    socket.on('quest_result', (result) => {
        if (result.success) {
            showToast(`✅ 任务完成: +${result.reward.gold}金币`);
        } else {
            showToast(`❌ ${result.reason}`);
        }
    });
    
    socket.on('sell_result', (result) => {
        if (result.success) {
            showToast(`✅ 出售成功: +${result.gold}金币`);
        } else {
            showToast(`❌ ${result.reason}`);
        }
    });
    
    // 建筑升级结果
    socket.on('upgrade_result', (result) => {
        if (result.success) {
            showToast(`✅ 建筑升级成功: ${result.building.name} Lv.${result.building.level}`);
            renderBuildings(); // 重新渲染建筑列表
        } else {
            showToast(`❌ ${result.reason}`);
        }
    });
    
    // 装备结果
    socket.on('equip_result', (result) => {
        if (result.success) {
            showToast(`✅ 已装备 ${result.tool?.name || ''}`);
            renderEquipmentSlots();
        } else {
            showToast(`❌ ${result.reason}`);
        }
    });
    
    // 卸下装备结果
    socket.on('unequip_result', (result) => {
        if (result.success) {
            showToast(`✅ 已卸下装备`);
            renderEquipmentSlots();
        } else {
            showToast(`❌ ${result.reason}`);
        }
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
    
    // 队列按钮
    if (elements.actionQueueBtn) {
        elements.actionQueueBtn.addEventListener('click', () => {
            showQueuePopover();
        });
    }
    
    // 队列面板关闭按钮
    const queuePopoverClose = document.getElementById('queue-popover-close');
    if (queuePopoverClose) {
        queuePopoverClose.addEventListener('click', () => {
            hideQueuePopover();
        });
    }
    
    // 清空队列按钮
    const queueClearBtn = document.getElementById('queue-clear-btn');
    if (queueClearBtn) {
        queueClearBtn.addEventListener('click', () => {
            showClearQueueConfirm();
        });
    }
}

/**
 * 显示清空队列确认卡片
 */
function showClearQueueConfirm() {
    const modal = document.createElement('div');
    modal.className = 'action-modal-overlay';
    modal.innerHTML = `
        <div class="action-modal" style="min-width: 280px;">
            <div class="action-modal-header">
                <span class="action-modal-title">⚠️ 确认清空队列</span>
            </div>
            <div class="action-modal-body" style="text-align: center; padding: 20px;">
                <p style="color: #A0B2C0; margin-bottom: 20px;">确定要清空所有队列中的行动吗？</p>
            </div>
            <div class="action-modal-footer" style="justify-content: center;">
                <button class="action-btn secondary" id="clear-cancel">取消</button>
                <button class="action-btn danger" id="clear-confirm">确认清空</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    modal.querySelector('#clear-cancel').addEventListener('click', () => {
        modal.remove();
    });
    
    modal.querySelector('#clear-confirm').addEventListener('click', () => {
        socket.emit('queue_clear');
        modal.remove();
        hideQueuePopover();
    });
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
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
    renderTailoring();
    renderBrewing();
    renderAlchemy();
    renderToolForge();
    renderInventories();
    renderEquipmentSlots();
    renderMerchants();
    updateUI();
}

/**
 * 渲染装备槽位
 */
function renderEquipmentSlots() {
    if (!gameState || !gameState.equipment) return;
    
    const slots = CONFIG.equipmentSlots || [
        { id: 'axe', name: '斧头', icon: '🪓' },
        { id: 'pickaxe', name: '镐子', icon: '⛏️' },
        { id: 'chisel', name: '凿子', icon: '🔨' },
        { id: 'needle', name: '针', icon: '🪡' },
        { id: 'scythe', name: '镰刀', icon: '🗡️' },
        { id: 'hammer', name: '锤子', icon: '🔨' },
        { id: 'tongs', name: '小桶', icon: '🪣' },
        { id: 'rod', name: '搅拌棒', icon: '🥄' }
    ];
    
    slots.forEach(slot => {
        const slotEl = document.getElementById(`equipment-slot-${slot.id}`);
        const nameEl = document.getElementById(`equipment-slot-${slot.id}-name`);
        const cardEl = slotEl?.closest('.equipment-slot');
        
        if (!slotEl || !nameEl) return;
        
        // 清除旧事件
        if (cardEl) {
            cardEl.onclick = null;
            cardEl.style.cursor = 'pointer';
        }
        
        const equippedId = gameState.equipment[slot.id];
        if (equippedId && CONFIG.tools) {
            const toolType = slot.id === 'tongs' ? 'tongs' : 
                            slot.id === 'rod' ? 'rods' : `${slot.id}s`;
            const tools = CONFIG.tools[toolType] || [];
            const tool = tools.find(t => t.id === equippedId);
            
            if (tool) {
                slotEl.innerHTML = `${tool.icon} ✓`;
                nameEl.textContent = tool.name;
                cardEl?.classList.add('equipped');
                
                // 点击卸下装备
                if (cardEl) {
                    cardEl.onclick = () => {
                        if (confirm(`卸下 ${tool.name}?`)) {
                            socket.emit('unequip_tool', { slotType: slot.id });
                        }
                    };
                }
            } else {
                slotEl.innerHTML = slot.icon;
                nameEl.textContent = '未知';
                cardEl?.classList.remove('equipped');
            }
        } else {
            slotEl.innerHTML = slot.icon;
            nameEl.textContent = '空';
            cardEl?.classList.remove('equipped');
            
            // 点击选择装备
            if (cardEl) {
                cardEl.onclick = () => openEquipModal(slot.id);
            }
        }
    });
}

/**
 * 打开装备选择模态框
 */
function openEquipModal(slotType) {
    const toolType = slotType === 'tongs' ? 'tongs' : 
                     slotType === 'rod' ? 'rods' : `${slotType}s`;
    const tools = CONFIG.tools?.[toolType] || [];
    const inventory = gameState?.toolsInventory?.[toolType] || [];
    
    if (inventory.length === 0) {
        showToast('背包中没有可装备的工具');
        return;
    }
    
    const modal = document.createElement('div');
    modal.className = 'action-modal-overlay';
    modal.innerHTML = `
        <div class="action-modal">
            <div class="action-modal-header">
                <span class="action-modal-title">选择装备</span>
                <button class="action-modal-close">&times;</button>
            </div>
            <div class="action-modal-body">
                <div class="equip-list">
                    ${inventory.map(toolId => {
                        const tool = tools.find(t => t.id === toolId);
                        if (!tool) return '';
                        return `
                            <div class="equip-item" data-tool-id="${toolId}">
                                <span class="equip-icon">${tool.icon}</span>
                                <div class="equip-info">
                                    <div class="equip-name">${tool.name}</div>
                                    <div class="equip-bonus">+${Math.round(tool.speedBonus * 100)}% 速度</div>
                                </div>
                                <button class="equip-btn">装备</button>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    modal.querySelector('.action-modal-close').addEventListener('click', () => modal.remove());
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });
    
    modal.querySelectorAll('.equip-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const toolId = btn.closest('.equip-item').dataset.toolId;
            socket.emit('equip_tool', { slotType, toolId });
            modal.remove();
        });
    });
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
    
    // 更新技能等级显示（如果有）
    updateSkillDisplay();
    
    // 更新行动状态栏
    updateActionStatusBar();
}

/**
 * 更新技能等级显示
 */
function updateSkillDisplay() {
    const skills = [
        { key: 'woodcuttingLevel', name: '伐木', element: 'woodcutting-level' },
        { key: 'miningLevel', name: '挖矿', element: 'mining-level' },
        { key: 'gatheringLevel', name: '采集', element: 'gathering-level' },
        { key: 'craftingLevel', name: '制作', element: 'crafting-level' },
        { key: 'forgingLevel', name: '锻造', element: 'forging-level' },
        { key: 'tailoringLevel', name: '缝制', element: 'tailoring-level' },
        { key: 'brewingLevel', name: '酿造', element: 'brewing-level' },
        { key: 'alchemyLevel', name: '炼金', element: 'alchemy-level' }
    ];
    
    skills.forEach(skill => {
        const el = document.getElementById(skill.element);
        if (el && gameState[skill.key]) {
            el.textContent = `Lv.${gameState[skill.key]}`;
        }
    });
}

/**
 * 更新行动状态栏
 */
function updateActionStatusBar() {
    if (!gameState) return;
    
    if (!gameState.activeAction) {
        // 没有行动进行中
        if (elements.actionStatusIcon) elements.actionStatusIcon.textContent = '∞';
        if (elements.actionStatusName) elements.actionStatusName.textContent = '休息中';
        if (elements.actionStatusCount) elements.actionStatusCount.textContent = '';
        if (elements.actionProgressFill) elements.actionProgressFill.style.width = '0%';
        if (elements.actionProgressTime) elements.actionProgressTime.textContent = '-';
        
        // 更新队列按钮
        updateQueueButton();
        return;
    }
    
    const action = gameState.activeAction;
    const totalCount = action.count || gameState.actionCount || 1;
    const remaining = action.remaining || 0;
    const current = totalCount - remaining + 1; // 当前是第几次
    
    // 获取行动信息
    const actionType = action.type;
    const actionId = action.id;
    const config = getActionConfig(actionType, actionId);
    
    // 显示图标 + 行动名 + [当前/总数]
    if (elements.actionStatusIcon) {
        elements.actionStatusIcon.textContent = config?.icon || '🔧';
    }
    if (elements.actionStatusName) {
        elements.actionStatusName.textContent = config?.name || actionId;
    }
    if (elements.actionStatusCount) {
        if (totalCount >= 999) {
            elements.actionStatusCount.textContent = '[∞]';
        } else {
            elements.actionStatusCount.textContent = `[${current}/${totalCount}]`;
        }
    }
    
    // 计算进度
    const elapsed = Date.now() - (gameState.actionStartTime || Date.now());
    const duration = gameState.actionDuration || 5000;
    const progress = Math.min(elapsed / duration, 1);
    
    if (elements.actionProgressFill) {
        elements.actionProgressFill.style.width = `${progress * 100}%`;
    }
    if (elements.actionProgressTime) {
        // 显示实际时间，不是倒计时
        const totalSeconds = Math.ceil(duration / 1000);
        elements.actionProgressTime.textContent = `${totalSeconds}s`;
    }
    
    // 进度完成时自动发送完成事件（防止重复发送）
    if (progress >= 1 && gameState.activeAction && !completingAction) {
        // 检查是否等待了足够时间（至少 duration 的 80%）
        const minWaitTime = (gameState.actionDuration || 5000) * 0.8;
        const timeSinceLastStart = Date.now() - lastActionStartTime;
        
        if (timeSinceLastStart >= minWaitTime) {
            completingAction = true;
            lastActionStartTime = Date.now(); // 更新时间戳
            socket.emit('action_complete');
        }
    }
    
    // 更新队列按钮
    updateQueueButton();
}

/**
 * 获取行动配置
 */
function getActionConfig(actionType, actionId) {
    const configMaps = {
        WOODCUTTING: CONFIG.trees,
        MINING: CONFIG.ores,
        GATHERING: CONFIG.gatheringLocations,
        CRAFTING: CONFIG.woodPlanks,
        FORGING: CONFIG.ingots,
        TAILORING: CONFIG.fabrics,
        BREWING: CONFIG.brews,
        ALCHEMY: CONFIG.potions,
        ESSENCE: CONFIG.essences
    };
    const config = configMaps[actionType];
    return config?.find(c => c.id === actionId);
}

/**
 * 更新队列按钮
 */
function updateQueueButton() {
    if (!elements.actionQueueBtn) return;
    
    const queue = gameState?.actionQueue || [];
    if (queue.length > 0) {
        elements.actionQueueBtn.style.display = 'inline-block';
        elements.actionQueueBtn.textContent = `+${queue.length}`;
    } else {
        elements.actionQueueBtn.style.display = 'none';
    }
}

/**
 * 显示队列面板
 */
function showQueuePopover() {
    const popover = document.getElementById('queue-popover');
    const queueList = document.getElementById('queue-list');
    
    if (!popover || !queueList) return;
    
    const queue = gameState?.actionQueue || [];
    const queueLength = queue.length;
    
    queueList.innerHTML = queue.map((item, index) => `
        <div class="queue-item" data-index="${index}">
            <span class="queue-item-icon">${item.icon}</span>
            <span class="queue-item-name">${item.name}</span>
            <span class="queue-item-count">×${item.count}</span>
            <div class="queue-item-actions">
                ${index === 0 ? `<button class="queue-item-btn replace" data-action="up" data-index="${index}" title="替换当前行动">⏫</button>` : ''}
                ${index > 0 ? `<button class="queue-item-btn" data-action="top" data-index="${index}" title="置顶">⏫</button>` : ''}
                ${index > 0 ? `<button class="queue-item-btn" data-action="up" data-index="${index}" title="上移">▲</button>` : ''}
                ${index < queueLength - 1 ? `<button class="queue-item-btn" data-action="down" data-index="${index}" title="下移">▼</button>` : ''}
                <button class="queue-item-remove" data-index="${index}" title="移除">×</button>
            </div>
        </div>
    `).join('') || '<div class="queue-empty">队列为空</div>';
    
    // 定位在队列按钮下方居中
    const btn = elements.actionQueueBtn;
    if (btn) {
        const btnRect = btn.getBoundingClientRect();
        const popoverWidth = 320;
        const popoverHeight = popover.offsetHeight || 200;
        
        // 水平居中于按钮
        let left = btnRect.left + btnRect.width / 2 - popoverWidth / 2;
        // 确保不超出屏幕
        left = Math.max(10, Math.min(left, window.innerWidth - popoverWidth - 10));
        
        // 垂直位置在按钮上方
        let top = btnRect.top - popoverHeight - 10;
        // 如果上方空间不够，则显示在下方
        if (top < 10) {
            top = btnRect.bottom + 10;
        }
        
        popover.style.left = `${left}px`;
        popover.style.top = `${top}px`;
    }
    
    popover.style.display = 'block';
    
    // 绑定操作事件
    queueList.querySelectorAll('.queue-item-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const index = parseInt(btn.dataset.index);
            const action = btn.dataset.action;
            
            // 第一个项点击上移（替换按钮），或第二项上移到第一位
            if ((action === 'up' && index === 0) || (action === 'up' && index === 1) || (action === 'top' && index > 0)) {
                const currentAction = gameState?.activeAction;
                if (currentAction) {
                    showReplaceActionConfirm(index, action, queue[index]);
                    return;
                }
            }
            
            socket.emit('queue_move', { index, action });
        });
    });
    
    // 绑定移除事件
    queueList.querySelectorAll('.queue-item-remove').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const index = parseInt(btn.dataset.index);
            socket.emit('queue_remove', { index });
        });
    });
    
    // 点击其他地方关闭
    const closePopover = (e) => {
        if (!popover.contains(e.target) && !elements.actionQueueBtn?.contains(e.target)) {
            hideQueuePopover();
            document.removeEventListener('click', closePopover);
        }
    };
    setTimeout(() => {
        document.addEventListener('click', closePopover);
    }, 100);
}

/**
 * 显示替换行动确认卡片
 */
function showReplaceActionConfirm(index, action, queueItem) {
    const currentAction = gameState?.activeAction;
    if (!currentAction) return;
    
    const actionConfig = getActionConfig(currentAction.type, currentAction.id);
    const currentName = actionConfig?.name || '当前行动';
    const replaceName = queueItem?.name || '新行动';
    
    const modal = document.createElement('div');
    modal.className = 'action-modal-overlay';
    modal.innerHTML = `
        <div class="confirm-dialog">
            <div class="confirm-dialog-title">⚠️ 替换当前行动</div>
            <div class="confirm-dialog-content">
                <div class="confirm-dialog-compare">
                    <div class="confirm-dialog-item">
                        <span class="confirm-dialog-icon">${actionConfig?.icon || '🔧'}</span>
                        <span class="confirm-dialog-name">${currentName}</span>
                    </div>
                    <span class="confirm-dialog-arrow">→</span>
                    <div class="confirm-dialog-item">
                        <span class="confirm-dialog-icon">${queueItem?.icon || '🔧'}</span>
                        <span class="confirm-dialog-name">${replaceName}</span>
                    </div>
                </div>
            </div>
            <div class="confirm-dialog-footer">
                <button class="dialog-btn secondary" id="replace-cancel">取消</button>
                <button class="dialog-btn danger" id="replace-confirm">确认</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    modal.querySelector('#replace-cancel').addEventListener('click', () => {
        modal.remove();
    });
    
    modal.querySelector('#replace-confirm').addEventListener('click', () => {
        socket.emit('queue_replace_current', { index, action });
        modal.remove();
        hideQueuePopover();
    });
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
}

/**
 * 隐藏队列面板
 */
function hideQueuePopover() {
    const popover = document.getElementById('queue-popover');
    if (popover) popover.style.display = 'none';
}

/**
 * 渲染建筑列表
 */
function renderBuildings() {
    if (!elements.buildingsList || !gameState) return;
    
    elements.buildingsList.innerHTML = CONFIG.buildings.map(b => {
        const building = gameState.buildings?.[b.id] || { level: 0 };
        const level = building.level;
        const isMaxLevel = b.maxLevel && level >= b.maxLevel;
        const displayName = b.levelNames && b.levelNames[level] ? b.levelNames[level] : b.name;
        
        // 计算升级费用
        const costMultiplier = level + 1;
        const cost = {};
        if (b.baseCost) {
            for (const [resource, amount] of Object.entries(b.baseCost)) {
                cost[resource] = amount * costMultiplier;
            }
        }
        
        // 检查是否可以升级
        const tentLevel = gameState.buildings?.tent?.level || 0;
        const isUnlocked = !b.unlockReq || !b.unlockReq.tentLevel || tentLevel >= b.unlockReq.tentLevel;
        
        // 检查资源是否足够
        let canUpgrade = isUnlocked && !isMaxLevel;
        const costText = Object.entries(cost).map(([r, a]) => `${r}×${a}`).join(' ');
        
        return `
            <div class="building-card ${isUnlocked ? '' : 'locked'}" data-id="${b.id}">
                <div class="building-icon">${b.icon}</div>
                <div class="building-name">${displayName}</div>
                ${level > 0 ? `<div class="building-level">LV.${level}</div>` : '<div class="building-level">未建造</div>'}
                ${isMaxLevel ? '<div class="building-cost">已满级</div>' : 
                  isUnlocked ? `<div class="building-cost">${costText}</div>` : 
                  `<div class="building-cost">需要帐篷 Lv.${(b.unlockReq?.tentLevel || 0) + 1}</div>`}
            </div>
        `;
    }).join('');
    
    // 绑定点击事件
    elements.buildingsList.querySelectorAll('.building-card:not(.locked)').forEach(card => {
        card.addEventListener('click', () => {
            const buildingId = card.dataset.id;
            openUpgradeModal(buildingId);
        });
    });
}

/**
 * 打开建筑升级模态框
 */
function openUpgradeModal(buildingId) {
    const buildingConfig = CONFIG.buildings.find(b => b.id === buildingId);
    if (!buildingConfig) return;
    
    const building = gameState.buildings?.[buildingId] || { level: 0 };
    const level = building.level;
    const isMaxLevel = buildingConfig.maxLevel && level >= buildingConfig.maxLevel;
    
    if (isMaxLevel) {
        showToast('✅ 已达最大等级');
        return;
    }
    
    // 计算升级费用
    const costMultiplier = level + 1;
    const cost = {};
    if (buildingConfig.baseCost) {
        for (const [resource, amount] of Object.entries(buildingConfig.baseCost)) {
            cost[resource] = amount * costMultiplier;
        }
    }
    
    const costText = Object.entries(cost).map(([r, a]) => `${r} × ${a}`).join('\n');
    const nextLevelName = buildingConfig.levelNames?.[level + 1] || `${buildingConfig.name} Lv.${level + 1}`;
    
    if (confirm(`升级到 ${nextLevelName}?\n\n需要:\n${costText}`)) {
        socket.emit('upgrade_building', { buildingId });
    }
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
 * 渲染缝制列表
 */
function renderTailoring() {
    if (!elements.tailoringList || !gameState || !CONFIG.fabrics) return;
    
    const level = gameState.tailoringLevel || 1;
    
    elements.tailoringList.innerHTML = CONFIG.fabrics.map(fabric => {
        const unlocked = level >= fabric.reqLevel;
        
        return `
            <div class="action-card ${unlocked ? '' : 'locked'}" 
                 data-action="tailoring" data-id="${fabric.id}">
                <div class="action-icon">${fabric.icon}</div>
                <div class="action-info">
                    <div class="action-name">${fabric.name}</div>
                    <div class="action-details">
                        <span>⏱️ ${formatTime(fabric.duration)}</span>
                        <span>✨ ${fabric.exp}</span>
                    </div>
                </div>
                ${!unlocked ? `<div class="locked-overlay">🔒 Lv.${fabric.reqLevel}</div>` : ''}
            </div>
        `;
    }).join('');
    
    elements.tailoringList.querySelectorAll('.action-card:not(.locked)').forEach(card => {
        card.addEventListener('click', () => {
            const fabricId = card.dataset.id;
            openActionModal('TAILORING', fabricId);
        });
    });
}

/**
 * 渲染酿造列表
 */
function renderBrewing() {
    if (!elements.brewingList || !gameState || !CONFIG.brews) return;
    
    const level = gameState.brewingLevel || 1;
    
    elements.brewingList.innerHTML = CONFIG.brews.map(brew => {
        const unlocked = level >= brew.reqLevel;
        
        return `
            <div class="action-card ${unlocked ? '' : 'locked'}" 
                 data-action="brewing" data-id="${brew.id}">
                <div class="action-icon">${brew.icon}</div>
                <div class="action-info">
                    <div class="action-name">${brew.name}</div>
                    <div class="action-details">
                        <span>⏱️ ${formatTime(brew.duration)}</span>
                        <span>✨ ${brew.exp}</span>
                    </div>
                </div>
                ${!unlocked ? `<div class="locked-overlay">🔒 Lv.${brew.reqLevel}</div>` : ''}
            </div>
        `;
    }).join('');
    
    elements.brewingList.querySelectorAll('.action-card:not(.locked)').forEach(card => {
        card.addEventListener('click', () => {
            const brewId = card.dataset.id;
            openActionModal('BREWING', brewId);
        });
    });
}

/**
 * 渲染炼金列表
 */
function renderAlchemy() {
    if (!elements.alchemyList || !gameState || !CONFIG.potions) return;
    
    const level = gameState.alchemyLevel || 1;
    
    elements.alchemyList.innerHTML = CONFIG.potions.map(potion => {
        const unlocked = level >= potion.reqLevel;
        
        return `
            <div class="action-card ${unlocked ? '' : 'locked'}" 
                 data-action="alchemy" data-id="${potion.id}">
                <div class="action-icon">${potion.icon}</div>
                <div class="action-info">
                    <div class="action-name">${potion.name}</div>
                    <div class="action-details">
                        <span>⏱️ ${formatTime(potion.duration)}</span>
                        <span>✨ ${potion.exp}</span>
                    </div>
                </div>
                ${!unlocked ? `<div class="locked-overlay">🔒 Lv.${potion.reqLevel}</div>` : ''}
            </div>
        `;
    }).join('');
    
    elements.alchemyList.querySelectorAll('.action-card:not(.locked)').forEach(card => {
        card.addEventListener('click', () => {
            const potionId = card.dataset.id;
            openActionModal('ALCHEMY', potionId);
        });
    });
}

/**
 * 渲染工具锻造列表
 */
function renderToolForge() {
    const container = document.getElementById('tool-forge-list');
    if (!container || !gameState || !CONFIG.tools) return;
    
    const forgingLevel = gameState.forgingLevel || 1;
    
    let html = '';
    
    // 遍历所有工具类型
    const toolTypes = ['axes', 'pickaxes', 'chisels', 'needles', 'scythes', 'hammers', 'tongs', 'rods'];
    
    toolTypes.forEach(toolType => {
        const tools = CONFIG.tools[toolType];
        if (!tools || tools.length === 0) return;
        
        const typeNames = {
            axes: '🪓 斧头',
            pickaxes: '⛏️ 镐子',
            chisels: '🔨 凿子',
            needles: '🪡 针',
            scythes: '🗡️ 镰刀',
            hammers: '🔨 锤子',
            tongs: '🪣 小桶',
            rods: '🥄 搅拌棒'
        };
        
        html += `<div class="tool-type-section">
            <h4 class="tool-type-title">${typeNames[toolType] || toolType}</h4>
            <div class="tool-list">`;
        
        tools.forEach((tool, index) => {
            const unlocked = forgingLevel >= tool.reqEquipLevel;
            const owned = (gameState.toolsInventory?.[toolType] || []).includes(tool.id);
            const materials = CONFIG.toolCraftingMaterials?.[toolType]?.[index];
            
            html += `
                <div class="tool-card ${unlocked ? '' : 'locked'} ${owned ? 'owned' : ''}" 
                     data-tool-type="${toolType}" data-tool-index="${index}">
                    <div class="tool-icon">${tool.icon}</div>
                    <div class="tool-info">
                        <div class="tool-name">${tool.name}</div>
                        <div class="tool-bonus">+${Math.round(tool.speedBonus * 100)}% 速度</div>
                        ${owned ? '<div class="tool-owned">✓ 已拥有</div>' : ''}
                    </div>
                    ${!unlocked ? `<div class="locked-overlay">🔒 Lv.${tool.reqEquipLevel}</div>` : ''}
                </div>
            `;
        });
        
        html += '</div></div>';
    });
    
    container.innerHTML = html;
    
    // 绑定点击事件
    container.querySelectorAll('.tool-card:not(.locked):not(.owned)').forEach(card => {
        card.addEventListener('click', () => {
            const toolType = card.dataset.toolType;
            const toolIndex = parseInt(card.dataset.toolIndex);
            openToolForgeModal(toolType, toolIndex);
        });
    });
}

/**
 * 打开工具锻造模态框
 */
function openToolForgeModal(toolType, toolIndex) {
    const tools = CONFIG.tools[toolType];
    const tool = tools[toolIndex];
    const materials = CONFIG.toolCraftingMaterials?.[toolType]?.[toolIndex];
    
    if (!tool || !materials) return;
    
    // 获取用户拥有的矿锭和木板
    const ingots = Object.entries(gameState.ingotsInventory || {})
        .filter(([id, count]) => count > 0);
    const planks = Object.entries(gameState.planksInventory || {})
        .filter(([id, count]) => count > 0);
    
    // 创建模态框
    const modal = document.createElement('div');
    modal.className = 'action-modal-overlay';
    modal.innerHTML = `
        <div class="action-modal">
            <div class="action-modal-header">
                <span class="action-modal-icon">${tool.icon}</span>
                <span class="action-modal-title">锻造 ${tool.name}</span>
                <button class="action-modal-close">&times;</button>
            </div>
            <div class="action-modal-body">
                <div class="action-modal-info">
                    <span>⚡ +${Math.round(tool.speedBonus * 100)}% 速度加成</span>
                </div>
                <div class="forge-materials">
                    <h4>所需材料:</h4>
                    ${materials.ore ? `<div>矿锭 × ${materials.ore}</div>` : ''}
                    ${materials.plank ? `<div>木板 × ${materials.plank}</div>` : ''}
                    ${materials.ingot ? `<div>矿锭 × ${materials.ingot}</div>` : ''}
                    ${materials.prevTool ? `<div>前置工具: ${CONFIG.tools[toolType].find(t => t.id === materials.prevTool)?.name || materials.prevTool}</div>` : ''}
                </div>
                <div class="forge-select">
                    <label>选择矿锭:</label>
                    <select id="forge-ingot">
                        ${ingots.map(([id, count]) => {
                            const ingot = CONFIG.ingots.find(i => i.id === id);
                            return `<option value="${id}">${ingot?.name || id} (${count})</option>`;
                        }).join('')}
                    </select>
                </div>
                ${materials.plank ? `
                <div class="forge-select">
                    <label>选择木板:</label>
                    <select id="forge-plank">
                        ${planks.map(([id, count]) => {
                            const plank = CONFIG.woodPlanks.find(p => p.id === id);
                            return `<option value="${id}">${plank?.name || id} (${count})</option>`;
                        }).join('')}
                    </select>
                </div>
                ` : ''}
            </div>
            <div class="action-modal-footer">
                <button class="action-btn secondary" id="action-cancel">取消</button>
                <button class="action-btn primary" id="action-confirm">锻造</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // 绑定事件
    modal.querySelector('.action-modal-close').addEventListener('click', () => modal.remove());
    modal.querySelector('#action-cancel').addEventListener('click', () => modal.remove());
    
    modal.querySelector('#action-confirm').addEventListener('click', () => {
        const ingotSelect = modal.querySelector('#forge-ingot');
        const plankSelect = modal.querySelector('#forge-plank');
        
        socket.emit('forge_tool', {
            toolType: toolType.replace('s', ''), // 'axes' -> 'axe'
            toolIndex: toolIndex,
            ingotId: ingotSelect?.value,
            plankId: plankSelect?.value
        });
        
        modal.remove();
    });
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove();
    });
}

/**
 * 打开商人面板
 */
function openMerchantPanel(merchantId) {
    socket.emit('get_merchant', { merchantId });
}

/**
 * 渲染商人面板
 */
function renderMerchantPanel(merchantId, merchantData) {
    if (!merchantData) return;
    
    // 构建我的物品列表（网格显示）
    let myItemsHtml = '';
    const itemTypes = [
        { key: 'woodcuttingInventory', type: 'WOOD', config: CONFIG.trees, idField: 'dropId' },
        { key: 'miningInventory', type: 'ORE', config: CONFIG.ores, idField: 'dropId' },
        { key: 'gatheringInventory', type: 'GATHERING', config: CONFIG.gatheringLocations?.flatMap(l => l.items || []) || [], idField: 'id' },
        { key: 'planksInventory', type: 'PLANK', config: CONFIG.woodPlanks, idField: 'id' },
        { key: 'ingotsInventory', type: 'INGOT', config: CONFIG.ingots, idField: 'id' },
        { key: 'fabricsInventory', type: 'FABRIC', config: CONFIG.fabrics || [], idField: 'id' },
        { key: 'potionsInventory', type: 'POTION', config: CONFIG.potions || [], idField: 'id' },
        { key: 'brewsInventory', type: 'BREW', config: CONFIG.brews || [], idField: 'id' },
        { key: 'essencesInventory', type: 'ESSENCE', config: CONFIG.essences || [], idField: 'id' }
    ];
    
    itemTypes.forEach(({ key, type, config, idField }) => {
        const inventory = gameState[key] || {};
        Object.entries(inventory).forEach(([itemId, count]) => {
            if (count > 0) {
                const configItem = config.find(c => c[idField] === itemId) || { name: itemId, icon: '❓' };
                const price = Math.floor((CONFIG.resourcePrices?.[type.toLowerCase()] || 1) * 2);
                myItemsHtml += `
                    <div class="item-card" data-item-type="${type}" data-item-id="${itemId}" data-count="${count}">
                        <span class="item-icon">${configItem.icon}</span>
                        <span class="item-name">${configItem.name}</span>
                        <span class="item-count">×${count}</span>
                        <span class="item-price">${price}💰</span>
                        <button class="sell-btn">出售</button>
                    </div>
                `;
            }
        });
    });
    
    const modal = document.createElement('div');
    modal.className = 'merchant-modal active';
    modal.innerHTML = `
        <div class="merchant-modal-overlay"></div>
        <div class="merchant-modal-panel">
            <div class="merchant-modal-header">
                <span class="merchant-modal-avatar">${merchantData.avatar}</span>
                <div class="merchant-modal-info">
                    <h3>${merchantData.name}</h3>
                    <p class="merchant-modal-title">${merchantData.title}</p>
                    <p class="merchant-favor">好感度: ${Math.floor((merchantData.favorability || 0) * 100)}%</p>
                </div>
                <button class="merchant-modal-close">&times;</button>
            </div>
            <div class="merchant-tabs">
                <button class="merchant-tab active" data-tab="trade">交易</button>
                <button class="merchant-tab" data-tab="quest">任务</button>
            </div>
            <div class="merchant-modal-body">
                <div class="merchant-tab-content active" id="merchant-tab-trade">
                    <div class="merchant-section">
                        <h4>商品</h4>
                        <div class="goods-grid">
                            ${merchantData.goods?.map(goods => `
                                <div class="goods-card" data-goods-id="${goods.id}">
                                    <span class="goods-icon">${goods.icon}</span>
                                    <span class="goods-name">${goods.name}</span>
                                    <span class="goods-price">${goods.price} ${goods.currency === 'gold' ? '💰' : '🪙'}</span>
                                    <button class="buy-btn" data-goods-id="${goods.id}">购买</button>
                                </div>
                            `).join('') || '<div class="empty">暂无商品</div>'}
                        </div>
                    </div>
                    <div class="merchant-section">
                        <h4>我的物品</h4>
                        <div class="my-items-grid">
                            ${myItemsHtml || '<div class="empty">暂无可出售物品</div>'}
                        </div>
                    </div>
                </div>
                <div class="merchant-tab-content" id="merchant-tab-quest">
                    <div class="quest-list">
                        ${merchantData.quests?.map(quest => {
                            const completed = merchantData.completedQuests?.includes(quest.id);
                            const accepted = merchantData.acceptedQuests?.includes(quest.id);
                            return `
                                <div class="quest-card ${completed ? 'completed' : ''}" data-quest-id="${quest.id}">
                                    <div class="quest-header">
                                        <span class="quest-name">${quest.name}</span>
                                        ${completed ? '<span class="quest-badge completed">✓ 已完成</span>' : 
                                          accepted ? '<span class="quest-badge accepted">进行中</span>' : ''}
                                    </div>
                                    <div class="quest-desc">${quest.desc}</div>
                                    <div class="quest-reward">奖励: ${quest.reward.gold}💰 ${quest.reward.favorability ? `+${Math.floor(quest.reward.favorability * 100)}%好感` : ''}</div>
                                    <div class="quest-actions">
                                        ${completed ? '' : 
                                          accepted ? `<button class="submit-quest-btn" data-quest-id="${quest.id}">提交</button>` :
                                          `<button class="accept-quest-btn" data-quest-id="${quest.id}">领取</button>`}
                                    </div>
                                </div>
                            `;
                        }).join('') || '<div class="empty">暂无任务</div>'}
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // 绑定事件
    modal.querySelector('.merchant-modal-close').addEventListener('click', () => modal.remove());
    modal.querySelector('.merchant-modal-overlay').addEventListener('click', () => modal.remove());
    
    // 标签切换
    modal.querySelectorAll('.merchant-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            modal.querySelectorAll('.merchant-tab').forEach(t => t.classList.remove('active'));
            modal.querySelectorAll('.merchant-tab-content').forEach(c => c.classList.remove('active'));
            tab.classList.add('active');
            const tabId = tab.dataset.tab;
            modal.querySelector(`#merchant-tab-${tabId}`)?.classList.add('active');
        });
    });
    
    // 购买按钮
    modal.querySelectorAll('.buy-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const goodsId = btn.dataset.goodsId;
            socket.emit('buy_goods', { merchantId, goodsId, count: 1 });
        });
    });
    
    // 领取任务按钮
    modal.querySelectorAll('.accept-quest-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const questId = btn.dataset.questId;
            socket.emit('accept_quest', { merchantId, questId });
        });
    });
    
    // 提交任务按钮
    modal.querySelectorAll('.submit-quest-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const questId = btn.dataset.questId;
            socket.emit('submit_quest', { merchantId, questId });
        });
    });
    
    // 出售按钮
    modal.querySelectorAll('.sell-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const card = btn.closest('.item-card');
            const itemType = card.dataset.itemType;
            const itemId = card.dataset.itemId;
            const count = parseInt(card.dataset.count) || 1;
            socket.emit('sell_item', { itemType, itemId, count });
        });
    });
}

/**
 * 渲染库存
 */
function renderInventories() {
    if (!gameState) return;
    
    // 伐木物品
    renderInventoryGrid('storage-woodcutting-items', gameState.woodcuttingInventory, CONFIG.trees, 'dropId');
    
    // 挖矿物品
    renderInventoryGrid('storage-mining-items', gameState.miningInventory, CONFIG.ores, 'dropId');
    
    // 采集物品
    if (CONFIG.gatheringLocations) {
        const allGatherItems = CONFIG.gatheringLocations.flatMap(loc => loc.items || []);
        renderInventoryGrid('storage-gathering-items', gameState.gatheringInventory, allGatherItems);
    }
    
    // 木板
    renderInventoryGrid('storage-planks-items', gameState.planksInventory, CONFIG.woodPlanks);
    
    // 矿锭
    renderInventoryGrid('storage-ingots-items', gameState.ingotsInventory, CONFIG.ingots);
    
    // 布料
    if (CONFIG.fabrics) {
        renderInventoryGrid('storage-fabrics-items', gameState.fabricsInventory, CONFIG.fabrics);
    }
    
    // 药水
    if (CONFIG.potions) {
        renderInventoryGrid('storage-potions-items', gameState.potionsInventory, CONFIG.potions);
    }
    
    // 酒类
    if (CONFIG.brews) {
        renderInventoryGrid('storage-brews-items', gameState.brewsInventory, CONFIG.brews);
    }
    
    // 精华
    if (CONFIG.essences) {
        renderInventoryGrid('storage-essences-items', gameState.essencesInventory, CONFIG.essences);
    }
}

/**
 * 渲染商人列表
 */
function renderMerchants() {
    const merchantList = document.getElementById('merchant-list');
    if (!merchantList || !CONFIG.merchants) return;
    
    merchantList.innerHTML = CONFIG.merchants.map(merchant => {
        const merchantData = gameState.merchantData?.[merchant.id] || { favorability: 0 };
        const favorPercent = Math.floor(merchantData.favorability * 100);
        
        return `
            <div class="merchant-card" data-merchant-id="${merchant.id}">
                <div class="merchant-avatar">${merchant.avatar}</div>
                <div class="merchant-info">
                    <div class="merchant-name">${merchant.name}</div>
                    <div class="merchant-title">${merchant.title}</div>
                    <div class="merchant-favor">好感: ${favorPercent}%</div>
                </div>
            </div>
        `;
    }).join('');
    
    // 绑定点击事件
    merchantList.querySelectorAll('.merchant-card').forEach(card => {
        card.addEventListener('click', () => {
            const merchantId = card.dataset.merchantId;
            socket.emit('get_merchant', { merchantId });
        });
    });
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
        FORGING: CONFIG.ingots,
        TAILORING: CONFIG.fabrics,
        BREWING: CONFIG.brews,
        ALCHEMY: CONFIG.potions,
        ESSENCE: CONFIG.essences
    };
    
    const config = configs[type]?.find(c => c.id === id);
    if (!config) return;
    
    pendingAction = { type, id, name: config.name, icon: config.icon };
    
    // 显示行动选择模态框
    showActionModal(config);
}

/**
 * 显示行动选择模态框
 */
function showActionModal(config) {
    // 检查队列状态
    const currentQueue = gameState?.actionQueue || [];
    const maxQueueSize = 2;
    const currentAction = gameState?.activeAction;
    const queueAvailable = currentQueue.length < maxQueueSize;
    const queuePosition = currentQueue.length + 1;
    
    // 创建模态框
    const modal = document.createElement('div');
    modal.className = 'action-modal-overlay';
    modal.innerHTML = `
        <div class="action-modal">
            <div class="action-modal-header">
                <span class="action-modal-icon">${config.icon}</span>
                <span class="action-modal-title">${config.name}</span>
                <button class="action-modal-close">&times;</button>
            </div>
            <div class="action-modal-body">
                <div class="action-modal-info">
                    ${config.duration ? `<span>⏱️ ${formatTime(config.duration)}</span>` : ''}
                    ${config.exp ? `<span>✨ ${config.exp} 经验</span>` : ''}
                    ${config.reqLevel ? `<span>📋 需要 Lv.${config.reqLevel}</span>` : ''}
                </div>
                <div class="action-modal-counts">
                    <button class="count-btn" data-count="1">1次</button>
                    <button class="count-btn" data-count="5">5次</button>
                    <button class="count-btn" data-count="10">10次</button>
                    <button class="count-btn" data-count="50">50次</button>
                    <button class="count-btn" data-count="999">∞</button>
                </div>
                <div class="action-modal-custom">
                    <input type="number" id="custom-count" min="1" max="999" placeholder="自定义次数">
                </div>
            </div>
            <div class="action-modal-footer">
                <button class="action-btn secondary" id="action-cancel">取消</button>
                ${currentAction ? 
                  (queueAvailable ? 
                    `<button class="action-btn queue" id="action-queue">加入队列 #${queuePosition}</button>` : 
                    `<button class="action-btn queue disabled" id="action-queue" disabled>队列已满</button>`) : 
                  ''}
                <button class="action-btn primary" id="action-confirm">开始</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // 绑定事件
    modal.querySelector('.action-modal-close').addEventListener('click', () => {
        modal.remove();
        pendingAction = null;
    });
    
    modal.querySelector('#action-cancel').addEventListener('click', () => {
        modal.remove();
        pendingAction = null;
    });
    
    // 快捷次数按钮
    modal.querySelectorAll('.count-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            modal.querySelectorAll('.count-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            modal.querySelector('#custom-count').value = btn.dataset.count;
        });
    });
    
    // 确认按钮 - 开始行动
    modal.querySelector('#action-confirm').addEventListener('click', () => {
        const countInput = modal.querySelector('#custom-count');
        const count = parseInt(countInput.value) || 1;
        
        if (pendingAction) {
            socket.emit('action_start', {
                type: pendingAction.type,
                id: pendingAction.id,
                count: count
            });
        }
        
        modal.remove();
        pendingAction = null;
    });
    
    // 加入队列按钮
    const queueBtn = modal.querySelector('#action-queue');
    if (queueBtn && !queueBtn.disabled) {
        queueBtn.addEventListener('click', () => {
            const countInput = modal.querySelector('#custom-count');
            const count = parseInt(countInput.value) || 1;
            
            if (pendingAction) {
                socket.emit('action_start', {
                    type: pendingAction.type,
                    id: pendingAction.id,
                    count: count
                });
            }
            
            modal.remove();
            pendingAction = null;
        });
    }
    
    // 点击背景关闭
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
            pendingAction = null;
        }
    });
    
    // 默认选中1次
    modal.querySelector('.count-btn[data-count="1"]').classList.add('active');
    modal.querySelector('#custom-count').value = 1;
}

/**
 * 开始行动动画
 */
function startActionAnimation() {
    lastActionStartTime = Date.now();
    
    // 不需要单独的动画循环，gameLoop 已经在运行
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
        { label: '加青杉木 100', command: 'add_item', args: { itemType: 'WOOD', itemId: 'pine', count: 100 } },
        { label: '加青闪矿 100', command: 'add_item', args: { itemType: 'ORE', itemId: 'cyan_ore', count: 100 } },
        { label: '加青闪斧', command: 'add_tool', args: { toolType: 'axes', toolId: 'cyan_axe' } },
        { label: '加青闪镐', command: 'add_tool', args: { toolType: 'pickaxes', toolId: 'cyan_pickaxe' } },
        { label: '加全部技能等级', command: 'multi', args: {
            actions: [
                { command: 'set_level', args: { skill: 'woodcutting', level: 50 } },
                { command: 'set_level', args: { skill: 'mining', level: 50 } },
                { command: 'set_level', args: { skill: 'gathering', level: 50 } },
                { command: 'set_level', args: { skill: 'crafting', level: 50 } },
                { command: 'set_level', args: { skill: 'forging', level: 50 } },
                { command: 'set_level', args: { skill: 'tailoring', level: 50 } }
            ]
        }}
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
            
            // 处理 multi 命令
            if (data.command === 'multi' && data.actions) {
                data.actions.forEach(action => {
                    socket.emit('gm_command', action);
                });
                showToast(`🔧 执行: ${btn.textContent}`);
            } else {
                socket.emit('gm_command', data);
                showToast(`🔧 执行: ${btn.textContent}`);
            }
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
    // 过滤掉经验，只显示物品
    const itemRewards = rewards.filter(r => r.type !== 'exp');
    
    if (elements.actionRewards && itemRewards.length > 0) {
        // 显示获取的物品
        const itemsHtml = itemRewards.map(r => {
            return `<span class="action-reward-item">${r.icon} ${r.name} ×${r.count}</span>`;
        }).join('');
        
        elements.actionRewards.innerHTML = itemsHtml;
        
        // 3秒后淡出
        setTimeout(() => {
            if (elements.actionRewards) {
                elements.actionRewards.innerHTML = '';
            }
        }, 3000);
    }
    
    // 经验单独显示 toast
    const expRewards = rewards.filter(r => r.type === 'exp');
    if (expRewards.length > 0) {
        const expText = expRewards.map(r => {
            return `✨ +${r.amount} ${r.skill}经验${r.leveledUp ? ' 🎉升级!' : ''}`;
        }).join(' | ');
        showToast(expText);
    }
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