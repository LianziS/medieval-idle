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
let actionCompleteTimeout = null; // 超时保护定时器ID

// DOM 元素缓存
const elements = {};

// 配置数据从后端 /api/config 加载

/**
 * 获取工具类型键名（统一转换函数）
 * @param {string} slotType - 装备槽位类型 (axe, pickaxe, chisel, needle, scythe, hammer, tongs, rod)
 * @returns {string} 工具库存键名 (axes, pickaxes, chisels, needles, scythes, hammers, tongs, rods)
 */
function getToolsKey(slotType) {
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
    return map[slotType] || `${slotType}s`;
}

// ============ 初始化 ============

document.addEventListener('DOMContentLoaded', init);

async function init() {
    cacheElements();
    await loadConfig();
    setupSocket();
    setupEventListeners();
    setupNavigation();
    setVersionTime();
}

/**
 * 设置版本更新时间
 */
function setVersionTime() {
    const versionEl = document.getElementById('version-value');
    if (versionEl) {
        // 使用固定的版本号（与 CSS/JS 文件版本号同步）
        // 格式：MMDD HH:MM
        versionEl.textContent = '0410 14:52';
    }
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

    // 连接错误处理
    socket.on('connect_error', (error) => {
        console.error('连接失败:', error);
        showToast('⚠️ 网络连接失败，正在重新连接...');
    });

    // 断开连接处理
    socket.on('disconnect', (reason) => {
        console.log('连接断开:', reason);
        if (reason === 'transport error' || reason === 'ping timeout') {
            showToast('⚠️ 网络不稳定，正在重新连接...');
        }
    });

    // 重连成功
    socket.on('connect', () => {
        console.log('已连接到服务器');
        showToast('✅ 已重新连接服务器');
        // 重新认证
        const token = localStorage.getItem('medieval_token');
        if (token) {
            socket.emit('auth', { token });
        }
    });

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

    // 离线收益弹窗
    socket.on('offline_rewards', (data) => {
        showOfflineRewardsModal(data);
    });

    // 认证结果
    socket.on('auth_result', (data) => {
        if (data.success) {
            console.log('认证成功');
            showToast('✅ 已连接服务器');
        } else {
            console.error('认证失败:', data.error);
            // 清除无效的 token
            localStorage.removeItem('medieval_token');
            localStorage.removeItem('medieval_auto_login');
            // 移除 loading
            const loadingEl = document.getElementById('loading');
            if (loadingEl) loadingEl.remove();
            // 显示错误信息后跳转
            if (data.needRelogin && data.error) {
                alert(data.error);
            }
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
        const prevAction = gameState?.activeAction;
        const prevStartTime = gameState?.actionStartTime;
        gameState = state;

        // 如果收到更新时 action 已完成，重置标志
        if (!state.activeAction) {
            completingAction = false;
            if (actionCompleteTimeout) {
                clearTimeout(actionCompleteTimeout);
                actionCompleteTimeout = null;
            }
        }

        // 检测新行动开始：id 变化 或 startTime 变化（队列自动开始同类型行动）
        if (state.activeAction) {
            const newStartTime = state.actionStartTime;
            const isNewAction = !prevAction ||
                                prevAction.id !== state.activeAction.id ||
                                (prevStartTime && newStartTime && prevStartTime !== newStartTime);

            if (isNewAction) {
                lastActionStartTime = Date.now();
                completingAction = false;
                console.log(`🔄 新行动开始: ${state.activeAction.id}`);
            }
        }

        updateUI();
        renderEquipmentSlots(); // 实时更新装备栏
        renderInventories(); // 实时更新物品栏
        
        // 实时更新物品详情卡片
        document.querySelectorAll('.item-tooltip').forEach(tooltip => {
            const itemId = tooltip.dataset.tooltipItemId;
            const itemType = tooltip.dataset.tooltipItemType;
            
            if (itemId) {
                let ownedCount = 0;
                if (itemType === 'WOOD') {
                    ownedCount = gameState?.woodcuttingInventory?.[itemId] || 0;
                } else if (itemType === 'TOKEN') {
                    ownedCount = gameState?.tokensInventory?.[itemId] || 0;
                } else if (itemType === 'ORE') {
                    ownedCount = gameState?.miningInventory?.[itemId] || 0;
                } else if (itemType === 'GATHERING') {
                    ownedCount = gameState?.gatheringInventory?.[itemId] || 0;
                } else if (itemType === 'PLANK') {
                    ownedCount = gameState?.planksInventory?.[itemId] || 0;
                } else if (itemType === 'INGOT') {
                    ownedCount = gameState?.ingotsInventory?.[itemId] || 0;
                } else if (itemType === 'FABRIC') {
                    ownedCount = gameState?.fabricsInventory?.[itemId] || 0;
                } else if (itemType === 'POTION') {
                    ownedCount = gameState?.potionsInventory?.[itemId] || 0;
                } else if (itemType === 'BREW') {
                    ownedCount = gameState?.brewsInventory?.[itemId] || 0;
                }
                
                const countEl = tooltip.querySelector('.item-count-value');
                if (countEl) {
                    countEl.textContent = ownedCount;
                }
            }
        });

        // 如果强化页面打开，更新锻造经验条
        const enhancePage = document.getElementById('page-enhance');
        if (enhancePage && enhancePage.classList.contains('active')) {
            updateEnhanceForgingExp();
            // 更新队列按钮文本
            const queueBtn = document.getElementById('enhance-queue-btn');
            if (queueBtn) {
                const queueLength = state?.actionQueue?.length || 0;
                queueBtn.textContent = queueLength > 0 ? `添加到队列 #${queueLength + 1}` : '添加到队列';
            }
            // 更新当前行动页
            updateCurrentActionPage();
        }

        // 如果队列面板打开，检查队列状态
        const popover = document.getElementById('queue-popover');
        if (popover && popover.style.display === 'block') {
            const queue = state?.actionQueue || [];
            if (queue.length === 0) {
                // 队列空了自动关闭
                hideQueuePopover();
            } else {
                // 刷新队列面板
                showQueuePopover();
            }
        }

        // 如果商人面板打开，刷新任务列表
        const merchantModal = document.querySelector('.merchant-modal.active');
        if (merchantModal) {
            const merchantId = merchantModal.dataset?.merchantId;
            if (merchantId) {
                // 重新获取商人数据并刷新面板
                socket.emit('get_merchant', { merchantId });
            }
        }
    });

    // 行动结果
    socket.on('action_result', (result) => {
        if (result.success) {
            // 只有真正开始行动时才重置时间戳，加入队列时不重置
            if (!result.queued) {
                lastActionStartTime = Date.now();
                completingAction = false;
            }
            if (result.queued) {
                showToast(`📋 已加入队列 (#${result.queueLength})`);
            }
        } else {
            showToast(`❌ ${result.reason}`);
        }
    });

    // 行动完成结果
    socket.on('action_complete_result', (result) => {
        // 检查 result 是否存在
        if (!result) {
            console.warn('⚠️ action_complete_result 收到 null');
            return;
        }

        console.log(`📥 action_complete_result:`, result.success ? '成功' : result.reason);

        // 清除超时定时器
        if (actionCompleteTimeout) {
            clearTimeout(actionCompleteTimeout);
            actionCompleteTimeout = null;
        }

        if (result.success) {
            completingAction = false;

            // 处理锻造结果
            if (result.tool) {
                showToast(`✅ 锻造成功: ${result.tool.name}`);
            } else if (result.rewards) {
                showRewards(result.rewards);
            }

            // 只有在行动全部完成或有下一个行动时才显示提示
            if (result.completed && !result.nextAction) {
                showToast('✅ 行动全部完成');
            } else if (result.completed && result.nextAction) {
                showToast(`📋 自动开始队列行动: ${result.nextAction.name}`);
            }

            // 还有剩余次数时重置时间戳（开始下一次进度）
            // 行动全部完成且有队列时，由 game_state_update 检测新行动并重置
            // 行动全部完成且没有队列时，不重置（进入休息状态）
            if (!result.completed) {
                lastActionStartTime = Date.now();
            }
        } else {
            completingAction = false;
            if (result.reason) {
                showToast(`❌ ${result.reason}`);
            }
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
        const oldModal = document.querySelector('.merchant-modal.active');
        
        // 如果已有弹窗且是同一个商人，只更新数据，不重新渲染
        if (oldModal && oldModal.dataset.merchantId === data.merchantId) {
            // 更新库存卡片数据
            const inventoryGrid = oldModal.querySelector('#merchant-inventory-grid');
            if (inventoryGrid) {
                // 构建新的物品列表
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
                
                // 更新每个物品卡片的数据
                itemTypes.forEach(({ key, type, config, idField }) => {
                    const inventory = data.data[key] || {};
                    Object.entries(inventory).forEach(([itemId, count]) => {
                        if (count > 0) {
                            const card = inventoryGrid.querySelector(`.inventory-card[data-item-id="${itemId}"]`);
                            if (card) {
                                // 更新数量显示和数据
                                card.dataset.count = count;
                                const countEl = card.querySelector('.inventory-count');
                                if (countEl) {
                                    countEl.textContent = count;
                                }
                                // 如果是当前选中的卡片，也要更新弹出卡片的数据
                                if (card.classList.contains('selected')) {
                                    const popup = oldModal.querySelector('.item-sell-popup');
                                    if (popup) {
                                        const popupCountEl = popup.querySelector('.popup-count');
                                        if (popupCountEl) {
                                            popupCountEl.textContent = `持有: ${count}`;
                                        }
                                        // 更新输入框最大值
                                        const inputEl = popup.querySelector('.popup-input');
                                        if (inputEl) {
                                            inputEl.max = count;
                                            // 如果当前值超过最大值，调整
                                            if (parseInt(inputEl.value) > count) {
                                                inputEl.value = count;
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    });
                });
            }
            
            // 更新好感度
            const favorPercent = Math.floor((data.data.favorability || 0) * 100);
            const fillEl = oldModal.querySelector('.reputation-fill');
            if (fillEl) {
                fillEl.style.width = `${favorPercent}%`;
            }
            const valueEl = oldModal.querySelector('.reputation-value');
            if (valueEl) {
                valueEl.textContent = `${favorPercent}%`;
            }
            
            // 不重新渲染，直接返回
            return;
        }
        
        // 不同商人或没有弹窗，重新渲染
        let activeTab = 'trade';
        let savedPendingSellItems = [];
        let savedPopupItem = null;
        let savedPopupInputValue = 1;
        let savedConfirmState = false;
        
        if (oldModal) {
            const activeTabEl = oldModal.querySelector('.merchant-tab.active');
            if (activeTabEl) {
                activeTab = activeTabEl.dataset.tab;
            }
            // 保存待售列表数据
            const previewGrid = oldModal.querySelector('#sell-preview-grid');
            if (previewGrid) {
                previewGrid.querySelectorAll('.preview-card').forEach(card => {
                    savedPendingSellItems.push({
                        type: card.dataset.itemType,
                        id: card.dataset.itemId,
                        icon: card.querySelector('.preview-icon')?.textContent || '❓',
                        count: parseInt(card.querySelector('.preview-count')?.textContent) || 1
                    });
                });
            }
            // 保存弹出卡片
            const openPopup = oldModal.querySelector('.item-sell-popup');
            if (openPopup) {
                const inventoryCard = oldModal.querySelector('.inventory-card.selected');
                if (inventoryCard) {
                    savedPopupItem = {
                        type: inventoryCard.dataset.itemType,
                        id: inventoryCard.dataset.itemId,
                        count: parseInt(inventoryCard.dataset.count) || 1,
                        name: inventoryCard.dataset.name,
                        icon: inventoryCard.dataset.icon,
                        price: parseInt(inventoryCard.dataset.price) || 1
                    };
                    const inputEl = openPopup.querySelector('.popup-input');
                    if (inputEl) {
                        savedPopupInputValue = parseInt(inputEl.value) || 1;
                    }
                }
            }
            // 保存确认状态
            const sellBtn = oldModal.querySelector('#merchant-sell-btn');
            if (sellBtn && sellBtn.classList.contains('confirm-ready')) {
                savedConfirmState = true;
            }
            oldModal.remove();
        }
        
        renderMerchantPanel(data.merchantId, data.data, activeTab, savedPendingSellItems, savedPopupItem, savedPopupInputValue, savedConfirmState);
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
            showToast(`✅ 已装备`);
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

    // ============ 强化系统事件 ============

    socket.on('enhance_preview', (data) => {
        if (!data.success) {
            showToast(data.reason || '获取预览失败');
            return;
        }

        // 更新成功率
        const rateEl = document.getElementById('enhance-success-rate');
        if (rateEl) {
            const ratePercent = data.successRate * 100;
            rateEl.textContent = `${ratePercent.toFixed(0)}%`;

            // 根据成功率设置颜色类
            rateEl.classList.remove('rate-low', 'rate-medium', 'rate-high');
            if (ratePercent < 30) {
                rateEl.classList.add('rate-low');
            } else if (ratePercent <= 60) {
                rateEl.classList.add('rate-medium');
            } else {
                rateEl.classList.add('rate-high');
            }
        }

        // 更新经验
        const expEl = document.getElementById('enhance-exp');
        if (expEl) {
            expEl.textContent = `${data.exp || 0} exp`;
        }

        // 更新费用列表
        const feesListEl = document.getElementById('enhance-fees-list');
        if (feesListEl && data.materials) {
            const m = data.materials;
            const goldHave = gameState.gold || 0;

            // 材料中文名称映射
            const materialNames = {
                'cyan_ingot': '青闪锭', 'red_copper_ingot': '赤铜锭', 'feather_ingot': '羽铁锭',
                'white_silver_ingot': '白银锭', 'hell_steel_ingot': '狱炎钢锭', 'thunder_steel_ingot': '雷鸣钢锭',
                'brilliant_crystal': '璀璨晶', 'star_crystal': '星辉晶',
                'cyan_ore': '青闪矿', 'red_iron': '赤铁矿', 'feather_ore': '羽石矿',
                'hell_ore': '白鸠矿', 'white_ore': '狱炎矿', 'thunder_ore': '雷鸣矿',
                'brilliant': '璀璨矿', 'star_ore': '星辉矿',
                'pine_plank': '青杉木板', 'iron_birch_plank': '铁桦木板', 'wind_tree_plank': '风啸木板',
                'flame_tree_plank': '焰心木板', 'frost_maple_plank': '霜叶枫木板', 'thunder_tree_plank': '雷鸣木板',
                'ancient_oak_plank': '古橡木板', 'world_tree_plank': '世界树木板'
            };

            let html = `
                <div class="fee-item" data-material="gold" data-count="${goldHave}">
                    <span class="fee-icon">🪙</span>
                    <span class="fee-name">金币</span>
                    <span class="fee-count ${goldHave < m.gold ? 'insufficient' : ''}">${goldHave} / ${m.gold}</span>
                </div>
            `;

            if (m.ingot) {
                const have = gameState.ingotsInventory?.[m.ingot] || 0;
                const name = materialNames[m.ingot] || m.ingot;
                html += `
                    <div class="fee-item clickable" data-material="${m.ingot}" data-count="${have}" data-type="ingot">
                        <span class="fee-icon">🔩</span>
                        <span class="fee-name">${name}</span>
                        <span class="fee-count ${have < m.ingotCount ? 'insufficient' : ''}">${have} / ${m.ingotCount}</span>
                    </div>
                `;
            }

            if (m.ore) {
                const have = gameState.miningInventory?.[m.ore] || 0;
                const name = materialNames[m.ore] || m.ore;
                html += `
                    <div class="fee-item clickable" data-material="${m.ore}" data-count="${have}" data-type="ore">
                        <span class="fee-icon">💎</span>
                        <span class="fee-name">${name}</span>
                        <span class="fee-count ${have < m.oreCount ? 'insufficient' : ''}">${have} / ${m.oreCount}</span>
                    </div>
                `;
            }

            if (m.plank) {
                const have = gameState.planksInventory?.[m.plank] || 0;
                const name = materialNames[m.plank] || m.plank;
                html += `
                    <div class="fee-item clickable" data-material="${m.plank}" data-count="${have}" data-type="plank">
                        <span class="fee-icon">🪵</span>
                        <span class="fee-name">${name}</span>
                        <span class="fee-count ${have < m.plankCount ? 'insufficient' : ''}">${have} / ${m.plankCount}</span>
                    </div>
                `;
            }

            feesListEl.innerHTML = html;

            // 添加点击事件显示物品详情卡片
            feesListEl.querySelectorAll('.fee-item.clickable').forEach(item => {
                item.onclick = (e) => {
                    e.stopPropagation();
                    showMaterialPopover(item);
                };
            });
        }

        // 更新产出预览
        const outputBox = document.getElementById('enhance-output');
        const outputIconEl = document.getElementById('enhance-output-icon');
        const outputBadgeEl = document.getElementById('enhance-output-badge');

        // 存储工具信息用于 tooltip
        if (outputBox) {
            outputBox.dataset.toolId = data.toolId || '';
            outputBox.dataset.toolName = data.toolName || '';
            outputBox.dataset.toolIcon = data.toolIcon || '';
            outputBox.dataset.targetLevel = data.targetLevel || 0;
            outputBox.dataset.tier = data.tier || 1;

            // 添加悬浮和点击事件（只绑定一次）
            if (!outputBox.dataset.initialized) {
                outputBox.dataset.initialized = 'true';
                outputBox.addEventListener('mouseenter', showOutputTooltip);
                outputBox.addEventListener('mouseleave', hideOutputTooltip);
                outputBox.addEventListener('click', showOutputTooltip);
            }
        }

        if (outputIconEl) {
            outputIconEl.textContent = data.toolIcon || '-';
        }
        if (outputBadgeEl) {
            if (data.targetLevel > 0) {
                outputBadgeEl.style.display = 'block';
                outputBadgeEl.textContent = `+${data.targetLevel}`;
            } else {
                outputBadgeEl.style.display = 'none';
            }
        }

        // 更新保护垫选项
        const protectionSlot = document.getElementById('enhance-protection-slot');
        const protectionStartInput = document.getElementById('enhance-protection-start');
        const protectionCount = data.protectionTools ? data.protectionTools.length : 0;

        if (protectionSlot) {
            if (enhanceState.protection !== null && enhanceState.protectionIcon) {
                // 选中了保护垫，显示图标和数量
                protectionSlot.innerHTML = `
                    <span class="selected-icon">${enhanceState.protectionIcon}</span>
                    <span class="protection-count">${protectionCount}</span>
                `;
            } else {
                // 未选择保护垫，只显示+号，不显示数量
                protectionSlot.innerHTML = `<span class="ph-icon">+</span>`;
            }
        }
        if (protectionStartInput) {
            protectionStartInput.disabled = !(data.protectionTools && data.protectionTools.length > 0);
        }

        // 更新按钮状态
        const startBtn = document.getElementById('enhance-start-btn');
        const queueBtn = document.getElementById('enhance-queue-btn');
        const canEnhance = data.canEnhance && data.currentLevel < 20;

        if (startBtn) startBtn.disabled = !canEnhance;
        if (queueBtn) queueBtn.disabled = !canEnhance;
    });

    socket.on('enhance_result', (result) => {
        console.log('📥 enhance_result:', result);
        if (result.success) {
            if (result.queued) {
                const queueLen = result.queueLength || 1;
                showToast(`📋 已加入队列 #${queueLen}`);
                // 更新按钮文本
                const queueBtn = document.getElementById('enhance-queue-btn');
                if (queueBtn) {
                    queueBtn.textContent = `添加到队列 #${queueLen + 1}`;
                }
            } else {
                showToast('⬆️ 开始强化...');
            }
        } else {
            showToast(`❌ ${result.reason || '未知错误'}`);
        }
    });

    // 监听队列下一个行动
    socket.on('queue_next', (data) => {
        console.log('📋 队列下一个行动:', data);
        if (data.type === 'ENHANCE') {
            showToast('⬆️ 开始队列中的强化任务');
        }
    });

    socket.on('enhance_complete_result', (result) => {
        if (result.enhanceSuccess) {
            showToast(`✅ ${result.message}`);
            // 显示获得的物品
            if (result.toolName && result.newLevel) {
                showEnhanceReward(result.toolIcon, result.toolName, result.newLevel, result.exp);
            }
        } else if (result.broken) {
            showToast(`💔 ${result.message}`);
        } else {
            showToast(`⚠️ ${result.message}`);
        }

        // 更新装备显示
        if (enhanceState.selectedTool) {
            updateEnhanceToolDisplay();
            updateEnhancePreview();
        }

        // 更新当前行动页
        updateCurrentActionPage();
    });

    // 停止强化结果
    socket.on('stop_enhance_result', (result) => {
        if (result.success) {
            showToast(`🛑 ${result.message}`);
        } else {
            showToast(`❌ ${result.message || '停止失败'}`);
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
    // 侧边栏展开/收起按钮
    const sidebarToggle = document.getElementById('sidebar-toggle');
    const sidebar = document.getElementById('sidebar');
    if (sidebarToggle && sidebar) {
        // 根据屏幕宽度自动展开/收起
        const updateSidebarByWidth = () => {
            const isWide = window.innerWidth >= 768;
            if (isWide) {
                // PC端：恢复上次状态或默认展开
                const saved = localStorage.getItem('sidebarExpanded');
                if (saved === null) {
                    // 首次访问，默认展开
                    sidebar.classList.add('expanded');
                    localStorage.setItem('sidebarExpanded', 'true');
                } else if (saved === 'true') {
                    // 用户上次保持展开，恢复展开
                    sidebar.classList.add('expanded');
                } else {
                    // 用户上次保持收起，保持收起
                    sidebar.classList.remove('expanded');
                }
            } else {
                // 移动端：强制收起
                sidebar.classList.remove('expanded');
            }
        };

        // 初始化
        updateSidebarByWidth();

        // 监听窗口大小变化
        window.addEventListener('resize', updateSidebarByWidth);

        // 点击切换
        sidebarToggle.addEventListener('click', () => {
            sidebar.classList.toggle('expanded');
            // 只在PC端保存状态
            if (window.innerWidth >= 768) {
                localStorage.setItem('sidebarExpanded', sidebar.classList.contains('expanded'));
            }
        });
    }

    // 取消行动按钮
    if (elements.actionCancelBtn) {
        elements.actionCancelBtn.addEventListener('click', () => {
            const currentAction = gameState?.activeAction;
            const queue = gameState?.actionQueue || [];

            if (currentAction) {
                // 有行动进行中，停止并开始队列第一项
                socket.emit('action_cancel');
            }
            // 没有行动时按钮显示"休息中"，点击无效果
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

    // 我的物品/装备栏 切换
    document.querySelectorAll('.storage-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            const tabName = tab.dataset.tab;

            // 切换 tab 激活状态
            document.querySelectorAll('.storage-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            // 切换内容
            document.querySelectorAll('.storage-tab-content').forEach(content => {
                content.classList.remove('active');
            });
            const targetContent = document.getElementById(`storage-tab-${tabName}`);
            if (targetContent) {
                targetContent.classList.add('active');
            }

            // 如果是装备栏，渲染装备
            if (tabName === 'equipment') {
                renderEquipmentSlots();
            }
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

    // 根据页面重新渲染对应内容
    if (gameState && CONFIG) {
        switch(pageId) {
            case 'gathering':
                renderGathering();
                break;
            case 'crafting':
                renderCrafting();
                break;
            case 'tailoring':
                renderTailoring();
                break;
            case 'forging':
                renderForging();
                break;
            case 'alchemy':
                renderAlchemy();
                break;
            case 'brewing':
                renderBrewing();
                break;
            case 'enhance':
                renderEnhance();
                break;
            case 'settings':
                renderSettings();
                break;
        }
    }

    // 移动端点击导航后自动收起侧边栏
    const sidebar = document.getElementById('sidebar');
    if (sidebar) {
        sidebar.classList.remove('expanded');
    }
}

// ============ 渲染函数 ============

/**
 * 渲染设置页面
 */
function renderSettings() {
    const usernameEl = document.getElementById('settings-username');
    if (usernameEl) {
        // 从localStorage获取用户名
        const token = localStorage.getItem('medieval_token');
        if (token) {
            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                usernameEl.textContent = payload.username || '未知用户';
            } catch (e) {
                usernameEl.textContent = '未知用户';
            }
        }
    }

    // 退出登录按钮
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.onclick = () => {
            if (confirm('确定要退出登录吗？')) {
                // 清除本地存储
                localStorage.removeItem('medieval_token');
                localStorage.removeItem('medieval_auto_login');

                // 断开socket连接
                if (socket) {
                    socket.disconnect();
                }

                // 跳转到登录页
                window.location.href = '/login';
            }
        };
    }
}

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
    renderEnhance();
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

        const equippedData = gameState.equipment[slot.id];
        if (equippedData && CONFIG.tools) {
            // 兼容旧格式（字符串）和新格式（对象）
            let equippedId, enhanceLevel;
            if (typeof equippedData === 'string') {
                equippedId = equippedData;
                enhanceLevel = 0;
            } else if (typeof equippedData === 'object') {
                equippedId = equippedData.id;
                enhanceLevel = equippedData.enhanceLevel || 0;
            }

            const toolType = getToolsKey(slot.id);
            const tools = CONFIG.tools[toolType] || [];
            const tool = tools.find(t => t.id === equippedId);

            if (tool) {
                slotEl.innerHTML = tool.icon;
                // 显示名称，强化工具显示 +X
                nameEl.textContent = enhanceLevel > 0 ? `${tool.name} +${enhanceLevel}` : tool.name;
                cardEl?.classList.add('equipped');

                // 点击卸下装备 - 使用弹出式卡片
                if (cardEl) {
                    const displayName = enhanceLevel > 0 ? `${tool.name} +${enhanceLevel}` : tool.name;
                    cardEl.onclick = () => showUnequipConfirm(slot.id, displayName);
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
 * 显示卸下装备确认卡片
 */
function showUnequipConfirm(slotId, toolName) {
    const modal = document.createElement('div');
    modal.className = 'action-modal-overlay';
    modal.innerHTML = `
        <div class="confirm-dialog">
            <div class="confirm-dialog-title">⚠️ 卸下装备</div>
            <div class="confirm-dialog-content">
                <div style="text-align: center; padding: 10px;">
                    确定要卸下 <strong>${toolName}</strong> 吗？
                </div>
            </div>
            <div class="confirm-dialog-footer">
                <button class="dialog-btn secondary" id="unequip-cancel">取消</button>
                <button class="dialog-btn danger" id="unequip-confirm">确认卸下</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    modal.querySelector('#unequip-cancel').addEventListener('click', () => modal.remove());
    modal.querySelector('#unequip-confirm').addEventListener('click', () => {
        socket.emit('unequip_tool', { slotType: slotId });
        modal.remove();
    });
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove();
    });
}

/**
 * 打开装备选择模态框
 */
function openEquipModal(slotType) {
    const toolType = getToolsKey(slotType);
    const tools = CONFIG.tools?.[toolType] || [];
    const inventory = gameState?.toolsInventory?.[toolType] || [];

    if (inventory.length === 0) {
        showToast('背包中没有可装备的工具');
        return;
    }

    // 堆叠相同ID和等级的工具
    const stackedItems = [];
    const stackMap = {};

    inventory.forEach((tool, index) => {
        const toolId = typeof tool === 'string' ? tool : tool.id;
        const enhanceLevel = typeof tool === 'object' && tool ? (tool.enhanceLevel || 0) : 0;
        const stackKey = `${toolId}_${enhanceLevel}`;

        if (!stackMap[stackKey]) {
            stackMap[stackKey] = {
                toolId,
                enhanceLevel,
                indices: [index],
                count: 1
            };
        } else {
            stackMap[stackKey].indices.push(index);
            stackMap[stackKey].count++;
        }
    });

    Object.values(stackMap).forEach(item => stackedItems.push(item));

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
                    ${stackedItems.map(item => {
                        const tool = tools.find(t => t.id === item.toolId);
                        if (!tool) return '';

                        const baseBonus = tool.speedBonus || 0;
                        const enhanceBonus = item.enhanceLevel > 0 && CONFIG.enhanceConfig?.bonusTable
                            ? CONFIG.enhanceConfig.bonusTable[item.enhanceLevel] || 0
                            : 0;
                        const totalBonus = baseBonus * (1 + enhanceBonus);
                        const displayName = item.enhanceLevel > 0 ? `${tool.name} +${item.enhanceLevel}` : tool.name;

                        return `
                            <div class="equip-item" data-tool-id="${item.toolId}" data-tool-index="${item.indices[0]}" data-enhance="${item.enhanceLevel}">
                                <span class="equip-icon">${tool.icon}</span>
                                <div class="equip-info">
                                    <div class="equip-name">${displayName}${item.count > 1 ? ` ×${item.count}` : ''}</div>
                                    <div class="equip-bonus">+${Math.round(totalBonus * 100)}% 速度</div>
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
            const item = btn.closest('.equip-item');
            const toolId = item.dataset.toolId;
            const toolIndex = parseInt(item.dataset.toolIndex);
            socket.emit('equip_tool', { slotType, toolId, toolIndex });
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
    // 技能页面内的等级显示 + 经验值信息
    const skills = [
        { key: 'woodcuttingLevel', expKey: 'woodcuttingExp', element: 'woodcutting-level', expInfo: 'woodcutting-exp-info', expFill: 'woodcutting-exp-fill' },
        { key: 'miningLevel', expKey: 'miningExp', element: 'mining-level', expInfo: 'mining-exp-info', expFill: 'mining-exp-fill' },
        { key: 'gatheringLevel', expKey: 'gatheringExp', element: 'gathering-level', expInfo: 'gathering-exp-info', expFill: 'gathering-exp-fill' },
        { key: 'craftingLevel', expKey: 'craftingExp', element: 'crafting-level', expInfo: 'crafting-exp-info', expFill: 'crafting-exp-fill' },
        { key: 'forgingLevel', expKey: 'forgingExp', element: 'forging-level', expInfo: 'forging-exp-info', expFill: 'forging-exp-fill' },
        { key: 'tailoringLevel', expKey: 'tailoringExp', element: 'tailoring-level', expInfo: 'tailoring-exp-info', expFill: 'tailoring-exp-fill' },
        { key: 'brewingLevel', expKey: 'brewingExp', element: 'brewing-level', expInfo: 'brewing-exp-info', expFill: 'brewing-exp-fill' },
        { key: 'alchemyLevel', expKey: 'alchemyExp', element: 'alchemy-level', expInfo: 'alchemy-exp-info', expFill: 'alchemy-exp-fill' }
    ];

    // 计算升级所需经验（与后端一致）
    // 使用更合理的经验曲线，避免高级别经验过高
    // 公式：100 * level * (1 + 0.3 * (level - 1))
    // 1级: 100, 10级: 3700, 50级: 75100, 100级: 300100
    function getExpForLevel(level) {
        const baseExp = 100;
        const exp = baseExp * level * (1 + 0.3 * Math.max(0, level - 1));
        return Math.floor(exp);
    }

    skills.forEach(skill => {
        const levelEl = document.getElementById(skill.element);
        const expInfoEl = document.getElementById(skill.expInfo);
        const expFillEl = document.getElementById(skill.expFill);

        const level = gameState[skill.key] || 1;
        const exp = gameState[skill.expKey] || 0;

        // 升级所需经验
        const expForCurrentLevel = getExpForLevel(level);  // 当前等级升到下一级需要的经验

        // 更新等级显示
        if (levelEl) {
            levelEl.textContent = `Lv.${level}`;
        }

        // 更新经验值信息 [当前/升级所需]
        if (expInfoEl) {
            expInfoEl.textContent = `[${Math.floor(exp)}/${expForCurrentLevel}]`;
        }

        // 更新经验条
        if (expFillEl) {
            const progress = Math.min(100, Math.max(0, (exp / expForCurrentLevel) * 100));
            expFillEl.style.width = `${progress}%`;
        }
    });

    // 侧边栏技能等级显示
    const sidebarSkills = [
        { key: 'woodcuttingLevel', element: 'nav-woodcutting-lvl' },
        { key: 'miningLevel', element: 'nav-mining-lvl' },
        { key: 'gatheringLevel', element: 'nav-gathering-lvl' },
        { key: 'craftingLevel', element: 'nav-crafting-lvl' },
        { key: 'forgingLevel', element: 'nav-forging-lvl' },
        { key: 'tailoringLevel', element: 'nav-tailoring-lvl' },
        { key: 'alchemyLevel', element: 'nav-alchemy-lvl' },
        { key: 'brewingLevel', element: 'nav-brewing-lvl' },
        { key: 'forgingLevel', element: 'nav-enhance-lvl' } // 强化使用锻造等级
    ];

    sidebarSkills.forEach(skill => {
        const el = document.getElementById(skill.element);
        if (el) {
            const level = gameState[skill.key] || 1;
            el.textContent = `lv ${level}`;
        }
    });

    // 顶部等级显示：所有技能等级之和
    const topLevelEl = document.getElementById('top-level');
    if (topLevelEl) {
        const totalLevel = sidebarSkills.reduce((sum, skill) => {
            return sum + (gameState[skill.key] || 1);
        }, 0);
        topLevelEl.textContent = totalLevel;
    }

    // 更新侧边栏经验条
    updateSidebarExpBars();
}

/**
 * 更新侧边栏经验条
 */
function updateSidebarExpBars() {
    // 计算升级所需经验（与后端一致）
    // 使用更合理的经验曲线，避免高级别经验过高
    // 公式：100 * level * (1 + 0.3 * (level - 1))
    function getExpForLevel(level) {
        const baseExp = 100;
        const exp = baseExp * level * (1 + 0.3 * Math.max(0, level - 1));
        return Math.floor(exp);
    }

    const skills = [
        { key: 'woodcuttingExp', levelKey: 'woodcuttingLevel', element: 'nav-woodcutting-exp' },
        { key: 'miningExp', levelKey: 'miningLevel', element: 'nav-mining-exp' },
        { key: 'gatheringExp', levelKey: 'gatheringLevel', element: 'nav-gathering-exp' },
        { key: 'craftingExp', levelKey: 'craftingLevel', element: 'nav-crafting-exp' },
        { key: 'forgingExp', levelKey: 'forgingLevel', element: 'nav-forging-exp' },
        { key: 'tailoringExp', levelKey: 'tailoringLevel', element: 'nav-tailoring-exp' },
        { key: 'alchemyExp', levelKey: 'alchemyLevel', element: 'nav-alchemy-exp' },
        { key: 'brewingExp', levelKey: 'brewingLevel', element: 'nav-brewing-exp' },
        { key: 'forgingExp', levelKey: 'forgingLevel', element: 'nav-enhance-exp' } // 强化使用锻造经验
    ];

    skills.forEach(skill => {
        const el = document.getElementById(skill.element);
        if (el) {
            const level = gameState[skill.levelKey] || 1;
            const exp = gameState[skill.key] || 0;
            const expForCurrentLevel = getExpForLevel(level);
            const progress = Math.min(100, Math.max(0, (exp / expForCurrentLevel) * 100));
            el.style.width = `${progress}%`;
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
        if (elements.actionStatusIcon) elements.actionStatusIcon.textContent = '💤';
        if (elements.actionStatusName) elements.actionStatusName.textContent = '休息中';
        if (elements.actionStatusCount) elements.actionStatusCount.textContent = '';
        if (elements.actionProgressFill) elements.actionProgressFill.style.width = '0%';
        if (elements.actionProgressTime) elements.actionProgressTime.textContent = '-';

        // 隐藏停止按钮
        if (elements.actionCancelBtn) {
            elements.actionCancelBtn.style.display = 'none';
        }
        return;
    }

    // 有行动，显示停止按钮
    if (elements.actionCancelBtn) {
        elements.actionCancelBtn.style.display = '';
    }

    const action = gameState.activeAction;
    const isInfinite = action.isInfinite || action.count === Infinity;
    const totalCount = isInfinite ? Infinity : (action.count || gameState.actionCount || 1);
    const remaining = action.remaining || 0;
    const current = isInfinite ? 0 : (totalCount - remaining + 1); // 当前是第几次（无限模式不显示）

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
        if (isInfinite) {
            elements.actionStatusCount.textContent = '[∞]';
        } else {
            elements.actionStatusCount.textContent = `[${current}/${totalCount}]`;
        }
    }

    // 更新停止按钮
    if (elements.actionCancelBtn) {
        elements.actionCancelBtn.textContent = '停止';
        elements.actionCancelBtn.classList.remove('idle');
        elements.actionCancelBtn.disabled = false;
    }

    // 计算进度（使用前端记录的开始时间，确保从0%开始）
    const elapsed = Date.now() - (lastActionStartTime || Date.now());
    const duration = gameState.actionDuration || 5000;
    const progress = Math.min(Math.max(elapsed / duration, 0), 1); // 限制在0-1之间

    if (elements.actionProgressFill) {
        elements.actionProgressFill.style.width = `${progress * 100}%`;
    }
    if (elements.actionProgressTime) {
        // 显示实际时间（精确到0.1秒），体现装备加成效果
        const totalSeconds = (duration / 1000).toFixed(1);
        elements.actionProgressTime.textContent = `${totalSeconds}s`;
    }

    // 进度完成时不发送完成事件（由后端定时器处理）
    // 后端每500ms检查一次，完成时自动发送 action_complete_result
    // 前端只负责显示进度，不主动触发完成

    // 更新队列按钮
    updateQueueButton();
}

/**
 * 获取行动配置
 */
function getActionConfig(actionType, actionId) {
    // 特殊处理锻造行动
    if (actionType === 'FORGING') {
        // 锻造工具: actionId 格式为 forge_{toolType}_{toolIndex}
        if (actionId.startsWith('forge_')) {
            const parts = actionId.split('_');
            if (parts.length >= 3) {
                const toolType = parts[1];
                const toolIndex = parseInt(parts[2]);
                const toolsKey = {
                    'axe': 'axes',
                    'pickaxe': 'pickaxes',
                    'chisel': 'chisels',
                    'needle': 'needles',
                    'scythe': 'scythes',
                    'hammer': 'hammers',
                    'tongs': 'tongs',
                    'rod': 'rods'
                }[toolType] || toolType + 's';
                const tool = CONFIG.tools?.[toolsKey]?.[toolIndex];
                return tool ? { ...tool, duration: tool.duration || 6000 } : null;
            }
        }
        // 锻造矿锭: 从 ingots 配置获取
        const ingot = CONFIG.ingots?.find(c => c.id === actionId);
        return ingot || null;
    }

    // 特殊处理强化行动
    if (actionType === 'ENHANCE') {
        // 从 action 对象获取工具信息
        // actionId 格式为 enhance_{toolType}_{toolIndex}
        // 需要从全局 gameState.activeAction 获取更多信息
        const activeAction = gameState?.activeAction;
        if (activeAction && activeAction.toolId) {
            // 查找工具配置
            const toolType = activeAction.toolType;
            const toolsKey = getToolsKey(toolType);
            const tool = CONFIG.tools?.[toolsKey]?.find(t => t.id === activeAction.toolId);
            const toolName = tool?.name || activeAction.toolId;
            const enhanceLevel = activeAction.currentLevel || 0;
            return {
                id: actionId,
                name: enhanceLevel > 0 ? `强化 ${toolName} +${enhanceLevel}` : `强化 ${toolName}`,
                icon: tool?.icon || '⬆️',
                duration: 12000
            };
        }
        return {
            id: actionId,
            name: '强化',
            icon: '⬆️',
            duration: 12000
        };
    }

    // 特殊处理采集行动：如果有 itemId，显示物品名而不是地点名
    if (actionType === 'GATHERING') {
        const activeAction = gameState?.activeAction;
        const itemId = activeAction?.itemId;
        
        if (itemId && itemId !== 'all') {
            // 找到地点配置
            const location = CONFIG.gatheringLocations?.find(loc => loc.id === actionId);
            // 在地点中找到具体物品
            const itemConfig = location?.items?.find(i => i.id === itemId);
            if (itemConfig) {
                return {
                    id: itemId,
                    name: itemConfig.name,
                    icon: itemConfig.icon,
                    duration: location?.duration || 6000
                };
            }
        }
        // 全采集或没有 itemId，显示地点名
        const location = CONFIG.gatheringLocations?.find(loc => loc.id === actionId);
        return location || null;
    }

    const configMaps = {
        WOODCUTTING: CONFIG.trees,
        MINING: CONFIG.ores,
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

    queueList.innerHTML = queue.map((item, index) => {
        // 获取行动名称和图标
        let name = item.name || '行动';
        let icon = item.icon || '🔧';

        // 处理强化行动
        if (item.type === 'ENHANCE') {
            const toolsKey = getToolsKey(item.toolType);
            const toolConfig = CONFIG.tools?.[toolsKey]?.find(t => t.id === item.toolId);
            name = toolConfig?.name ? `强化 ${toolConfig.name}` : '强化';
            icon = toolConfig?.icon || '⬆️';
        }
        
        // 处理采集行动：如果有 itemId，显示物品名而不是地点名
        if (item.type === 'GATHERING' && item.itemId && item.itemId !== 'all') {
            const location = CONFIG.gatheringLocations?.find(loc => loc.id === item.id);
            const itemConfig = location?.items?.find(i => i.id === item.itemId);
            if (itemConfig) {
                name = itemConfig.name;
                icon = itemConfig.icon;
            }
        }

        return `
            <div class="queue-item" data-index="${index}">
                <span class="queue-item-icon">${icon}</span>
                <span class="queue-item-name">${name}</span>
                <span class="queue-item-count">${item.count === -1 || item.count === Infinity ? '∞' : '×' + (item.count || 1)}</span>
                <div class="queue-item-actions">
                    ${index === 0 ? `<button class="queue-item-btn replace" data-action="up" data-index="${index}" title="替换当前行动">⏫</button>` : ''}
                    ${index > 0 ? `<button class="queue-item-btn" data-action="top" data-index="${index}" title="置顶">⏫</button>` : ''}
                    ${index > 0 ? `<button class="queue-item-btn" data-action="up" data-index="${index}" title="上移">▲</button>` : ''}
                    ${index < queueLength - 1 ? `<button class="queue-item-btn" data-action="down" data-index="${index}" title="下移">▼</button>` : ''}
                    <button class="queue-item-remove" data-index="${index}" title="移除">×</button>
                </div>
            </div>
        `;
    }).join('') || '<div class="queue-empty">队列为空</div>';

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
    
    // 获取队列项名称和图标
    let replaceName = queueItem?.name || '新行动';
    let replaceIcon = queueItem?.icon || '🔧';
    
    // 处理采集行动的队列项
    if (queueItem?.type === 'GATHERING' && queueItem?.itemId && queueItem?.itemId !== 'all') {
        const location = CONFIG.gatheringLocations?.find(loc => loc.id === queueItem.id);
        const itemConfig = location?.items?.find(i => i.id === queueItem.itemId);
        if (itemConfig) {
            replaceName = itemConfig.name;
            replaceIcon = itemConfig.icon;
        }
    }

    const modal = document.createElement('div');
    modal.className = 'action-modal-overlay';
    modal.innerHTML = `
        <div class="confirm-dialog">
            <div class="confirm-dialog-title">⚠️ 替换当前行动</div>
            <div class="confirm-dialog-content">
                <div class="confirm-dialog-compare">
                    <div class="confirm-dialog-item">
                        <span class="confirm-dialog-icon" style="opacity: 0.5;">${actionConfig?.icon || '🔧'}</span>
                        <span class="confirm-dialog-name" style="opacity: 0.5;">${currentName}</span>
                    </div>
                    <span class="confirm-dialog-arrow">→</span>
                    <div class="confirm-dialog-item">
                        <span class="confirm-dialog-icon">${replaceIcon}</span>
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
        socket.emit('queue_replace_current', { index });
        modal.remove();
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

    // 过滤掉不需要显示的建筑（伐木场、矿洞、草药园）
    const hiddenBuildings = ['lumber', 'mine', 'farm'];

    elements.buildingsList.innerHTML = CONFIG.buildings.filter(b => !hiddenBuildings.includes(b.id)).map(b => {
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
        const costText = formatCost(cost, ' ');

        return `
            <div class="building-card ${isUnlocked ? '' : 'locked'}" data-id="${b.id}">
                <div class="building-icon">${b.icon}</div>
                <div class="building-name">${displayName}</div>
                ${level > 0 ? `<div class="building-level">LV.${level}</div>` : '<div class="building-level">未建造</div>'}
                ${isMaxLevel ? '<div class="building-cost">已满级</div>' :
                  isUnlocked ? `<div class="building-cost">${costText}</div>` :
                  `<div class="building-cost">需要帐篷 Lv.${b.unlockReq?.tentLevel || 1}</div>`}
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

    const nextLevelName = buildingConfig.levelNames?.[level + 1] || `${buildingConfig.name} Lv.${level + 1}`;

    // 使用自定义弹窗
    const modal = document.createElement('div');
    modal.className = 'action-modal-overlay';
    modal.innerHTML = `
        <div class="action-modal">
            <div class="action-modal-header">
                <span class="action-modal-icon">${buildingConfig.icon}</span>
                <span class="action-modal-title">升级 ${buildingConfig.name}</span>
                <button class="action-modal-close">&times;</button>
            </div>
            <div class="action-modal-body">
                <div class="upgrade-info">
                    <div class="upgrade-arrow">
                        <span class="upgrade-from">${buildingConfig.name} Lv.${level}</span>
                        <span class="arrow">→</span>
                        <span class="upgrade-to">${nextLevelName}</span>
                    </div>
                </div>
                <div class="upgrade-cost">
                    <h4>所需材料</h4>
                    <div class="cost-list">
                        ${Object.entries(cost).map(([resource, amount]) => {
                            const resourceName = getResourceName(resource);
                            const owned = getResourceCount(resource);
                            const enough = owned >= amount;
                            return `
                                <div class="cost-item ${enough ? '' : 'not-enough'}">
                                    <span class="cost-name">${resourceName}</span>
                                    <span class="cost-amount">${owned} / ${amount}</span>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            </div>
            <div class="action-modal-footer">
                <button class="action-btn secondary" id="upgrade-cancel">取消</button>
                <button class="action-btn primary" id="upgrade-confirm">确认升级</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // 绑定事件
    modal.querySelector('.action-modal-close').addEventListener('click', () => modal.remove());
    modal.querySelector('#upgrade-cancel').addEventListener('click', () => modal.remove());
    modal.querySelector('#upgrade-confirm').addEventListener('click', () => {
        socket.emit('upgrade_building', { buildingId });
        modal.remove();
    });
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove();
    });
}

/**
 * 获取代币掉落概率（根据物品所需等级计算）
 */
function getTokenChance(actionType, reqLevel) {
    // 从后端配置获取概率表
    const tokenDropRates = CONFIG?.tokenDropRates || {
        standard: [0.017, 0.024, 0.037, 0.053, 0.071, 0.092, 0.149, 0.210],
        tool: [0.017, 0.033, 0.061, 0.110, 0.196, 0.343, 0.590, 0.990],
        tailoring: [0.017, 0.032, 0.053, 0.078, 0.126, 0.195],
        brewing: [0.022, 0.023, 0.024, 0.028, 0.029, 0.033, 0.033, 0.033]
    };
    
    // 行动类型到概率表的映射
    const rateTableMap = {
        WOODCUTTING: 'standard',
        MINING: 'standard',
        GATHERING: 'standard',
        CRAFTING: 'standard',
        FORGING: 'standard',
        TAILORING: 'tailoring',
        ALCHEMY: 'standard',
        BREWING: 'brewing'
    };
    
    const rateTable = tokenDropRates[rateTableMap[actionType]] || tokenDropRates.standard;
    
    // 根据物品所需等级获取概率（每10级一个区间）
    const itemReqLevel = reqLevel || 1;
    const levelIndex = Math.min(Math.floor((itemReqLevel - 1) / 10), rateTable.length - 1);
    const dropRate = rateTable[levelIndex];
    
    // 转换为百分比显示
    return Math.round(dropRate * 1000) / 10;
}

/**
 * 获取资源中文名称
 */
function getResourceName(resourceId) {
    const names = {
        // 金币
        'gold': '金币',

        // 木材类
        'pine': '青杉木',
        'iron_birch': '铁桦木',
        'wind_tree': '风啸木',
        'flame_tree': '焰心木',
        'frost_maple': '霜叶枫木',
        'thunder_tree': '雷鸣木',
        'ancient_oak': '古橡木',
        'world_tree': '世界树枝',

        // 木板类
        'pine_plank': '青杉木板',
        'iron_birch_plank': '铁桦木板',
        'wind_tree_plank': '风啸木板',
        'flame_tree_plank': '焰心木板',
        'frost_maple_plank': '霜叶枫木板',
        'thunder_tree_plank': '雷鸣木板',
        'ancient_oak_plank': '古橡木板',
        'world_tree_plank': '世界树木板',

        // 矿石类
        'cyan_ore': '青闪石',
        'red_iron': '赤铁石',
        'feather_ore': '羽石',
        'hell_ore': '白鸠石',
        'white_ore': '狱炎石',
        'thunder_ore': '雷鸣石',
        'brilliant': '璀璨原石',
        'star_ore': '星辉原石',

        // 矿锭类
        'cyan_ingot': '青闪锭',
        'red_copper_ingot': '赤铜锭',
        'feather_ingot': '羽石锭',
        'white_silver_ingot': '白银锭',
        'hell_steel_ingot': '白鸠钢锭',
        'thunder_steel_ingot': '雷鸣钢锭',
        'brilliant_crystal': '璀璨水晶',
        'star_crystal': '星辉水晶',

        // 布料类
        'jute_cloth': '黄麻布料',
        'linen_cloth': '亚麻布料',
        'wool_cloth': '羊毛布料',
        'silk_cloth': '丝绸布料',
        'wind_silk': '风丝绸',
        'dream_cloth': '梦幻布料',

        // 采集物类
        'sweet_berry': '甜浆果',
        'wild_mint': '野薄荷',
        'honey': '蜂蜜',
        'blood_rose': '血蔷薇',
        'jute': '黄麻',
        'wheat': '小麦',
        'pine_needle': '松针',
        'star_dew_herb': '星露草',
        'flax': '亚麻',
        'feather': '羽毛',
        'hops': '啤酒花',
        'vanilla': '香草',
        'blossom_honey': '花蜜',
        'red_serpent_fruit': '红蛇果',
        'jade_feather': '翡翠羽',
        'apple': '苹果',
        'sage': '鼠尾草',
        'moonlight_mushroom': '月光菇',
        'wool': '羊毛',
        'falcon_tail_feather': '隼尾羽',
        'silk': '丝绸原料',

        // 更多采集物
        'chili': '辣椒',
        'mist_flower': '雾菱花',
        'four_leaf_clover': '四叶草',
        'grape': '葡萄',
        'soul_herb': '灵魂草',
        'moonlight_honey': '月光蜜',
        'rye': '黑麦',
        'wild_heart': '原野之心',
        'wind_velvet': '风语绒',
        'rainbow_feather': '虹羽',
        'dragon_blood_fruit': '龙血果',
        'life_fiber': '生命纤维',
        'star_blossom': '星辰花',
        'mist_fruit': '雾果',
        'rock_rose_honey': '岩玫瑰蜜',
        'bewitch_berry': '迷心浆果',
        'harpy_feather': '鹰身人的羽毛',

        // 药水类
        'hp_potion_1': '小型生命药水',
        'mp_potion_1': '小型魔力药水',
        'hp_potion_2': '中型生命药水',
        'mp_potion_2': '中型魔力药水',
        'hp_potion_3': '大型生命药水',
        'mp_potion_3': '大型魔力药水',
        'hp_potion_4': '超级生命药水',
        'mp_potion_4': '超级魔力药水',

        // 代币类
        'wood_token': '伐木代币',
        'mining_token': '挖矿代币',
        'gathering_token': '采集代币',
        'crafting_token': '制作代币',
        'forging_token': '锻造代币',
        'tailoring_token': '缝制代币',
        'alchemy_token': '炼金代币',
        'brewing_token': '酿造代币',

        // 精华类
        'mint_essence': '薄荷精华',
        'pine_essence': '松木精华',
        'vanilla_essence': '香草精华',
        'sage_essence': '鼠尾草精华'
    };
    return names[resourceId] || resourceId;
}

/**
 * 获取物品配置信息（图标、名称等）
 */
function getItemConfig(itemId) {
    // 检查所有配置类型
    const allConfigs = [
        ...(CONFIG.trees || []),
        ...(CONFIG.ores || []),
        ...(CONFIG.woodPlanks || []),
        ...(CONFIG.ingots || []),
        ...(CONFIG.fabrics || []),
        ...(CONFIG.potions || []),
        ...(CONFIG.brews || []),
        ...(CONFIG.essences || []),
        ...((CONFIG.gatheringLocations || []).flatMap(loc => loc.items || []))
    ];
    
    return allConfigs.find(item => item.id === itemId || item.dropId === itemId);
}

/**
 * 获取资源数量
 */
function getResourceCount(resourceId) {
    // 定义所有木材类型
    const woodTypes = ['pine', 'iron_birch', 'wind_tree', 'flame_tree', 'frost_maple', 'thunder_tree', 'ancient_oak', 'world_tree'];
    // 定义所有矿石类型
    const oreTypes = ['cyan_ore', 'red_iron', 'feather_ore', 'hell_ore', 'white_ore', 'thunder_ore', 'brilliant', 'star_ore'];
    // 定义布料类型
    const fabricTypes = ['jute_cloth', 'linen_cloth', 'wool_cloth', 'silk_cloth', 'wind_silk', 'shadow_cloth', 'dragon_silk', 'celestial_cloth'];
    // 定义采集物类型
    const gatheringTypes = ['sweet_berry', 'wild_mint', 'honey', 'blood_rose', 'jute', 'flax', 'wool', 'silk', 'wind_silk_raw', 'shadow_thread', 'dragon_fiber', 'celestial_lotus'];

    let count = 0;

    // 检查木材
    if (woodTypes.includes(resourceId)) {
        count = gameState.woodcuttingInventory?.[resourceId] || 0;
    }
    // 检查矿石
    else if (oreTypes.includes(resourceId)) {
        count = gameState.miningInventory?.[resourceId] || 0;
    }
    // 检查木板
    else if (resourceId.endsWith('_plank')) {
        count = gameState.planksInventory?.[resourceId] || 0;
    }
    // 检查矿锭
    else if (resourceId.endsWith('_ingot')) {
        count = gameState.ingotsInventory?.[resourceId] || 0;
    }
    // 检查布料
    else if (fabricTypes.includes(resourceId) || resourceId.endsWith('_cloth')) {
        count = gameState.fabricsInventory?.[resourceId] || 0;
    }
    // 检查采集物
    else if (gatheringTypes.includes(resourceId)) {
        count = gameState.gatheringInventory?.[resourceId] || 0;
    }
    // 检查药水
    else if (resourceId.endsWith('_potion') || resourceId.includes('potion')) {
        count = gameState.potionsInventory?.[resourceId] || 0;
    }
    // 检查金币
    else if (resourceId === 'gold') {
        count = gameState.gold || 0;
    }
    // 检查代币
    else if (resourceId.endsWith('_token')) {
        count = gameState.tokensInventory?.[resourceId] || 0;
    }
    // 检查精华
    else if (resourceId.endsWith('_essence')) {
        count = gameState.essencesInventory?.[resourceId] || 0;
    }
    // 默认：尝试从所有库存查找
    else {
        count = gameState.woodcuttingInventory?.[resourceId] ||
               gameState.miningInventory?.[resourceId] ||
               gameState.gatheringInventory?.[resourceId] ||
               gameState.planksInventory?.[resourceId] ||
               gameState.ingotsInventory?.[resourceId] ||
               gameState.fabricsInventory?.[resourceId] ||
               gameState.potionsInventory?.[resourceId] ||
               gameState.tokensInventory?.[resourceId] ||
               gameState.essencesInventory?.[resourceId] || 0;
    }

    return count;
}

/**
 * 获取采集品的最大掉落数量
 */
function getGatheringItemMaxCount(itemId) {
    // 四种蜜：1-7个
    const honeyItems = ['honey', 'blossom_honey', 'moonlight_honey', 'rock_rose_honey'];
    if (honeyItems.includes(itemId)) return 7;
    
    // 甜浆果、小麦、啤酒花、苹果、葡萄、黑麦、雾果、龙血果：1-5个
    const berryItems = ['sweet_berry', 'wheat', 'hops', 'apple', 'grape', 'rye', 'mist_fruit', 'dragon_blood_fruit'];
    if (berryItems.includes(itemId)) return 5;
    
    // 血蔷薇、黄麻、星露草、亚麻、赤炼蛇果、月光菇、羊毛、蚕丝、灵魂草、风语绒、原野之心、迷心浆果、生命纤维、星辰花：1-3个
    const herbItems = ['blood_rose', 'jute', 'star_dew_herb', 'flax', 'red_serpent_fruit', 
                      'moonlight_mushroom', 'wool', 'silk', 'soul_herb', 'wind_velvet',
                      'wild_heart', 'bewitch_berry', 'life_fiber', 'star_blossom'];
    if (herbItems.includes(itemId)) return 3;
    
    return 1; // 默认
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
            <div class="action-card-square ${unlocked ? '' : 'locked'} ${isActive ? 'active' : ''}"
                 data-action="woodcutting" data-id="${tree.id}" data-unlocked="${unlocked}">
                <div class="card-name">${tree.name}</div>
                <div class="card-icon">${tree.icon}</div>
            </div>
        `;
    }).join('');

    // 绑定点击事件（所有卡片都可以点击）
    elements.woodcuttingList.querySelectorAll('.action-card-square').forEach(card => {
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
            <div class="action-card-square ${unlocked ? '' : 'locked'} ${isActive ? 'active' : ''}"
                 data-action="mining" data-id="${ore.id}" data-unlocked="${unlocked}">
                <div class="card-name">${ore.name}</div>
                <div class="card-icon">${ore.icon}</div>
            </div>
        `;
    }).join('');

    // 绑定点击事件（所有卡片都可以点击）
    elements.miningList.querySelectorAll('.action-card-square').forEach(card => {
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
    if (!gameState) return;
    if (!CONFIG || !CONFIG.gatheringLocations) {
        console.warn('renderGathering: CONFIG.gatheringLocations 未加载');
        return;
    }

    const level = gameState.gatheringLevel || 1;
    const tabsContainer = document.getElementById('gathering-tabs');
    const contentContainer = document.getElementById('gathering-items-list');

    if (!tabsContainer || !contentContainer) return;

    // 生成标签页
    const tabs = CONFIG.gatheringLocations.map((loc, index) => `
        <button class="gathering-tab ${index === 0 ? 'active' : ''}" data-loc-id="${loc.id}">
            ${loc.name}
        </button>
    `).join('');

    tabsContainer.innerHTML = tabs;

    // 默认显示第一个区域
    if (CONFIG.gatheringLocations.length > 0) {
        renderGatheringLocation(CONFIG.gatheringLocations[0].id, level);
    }

    // 绑定标签点击事件
    tabsContainer.querySelectorAll('.gathering-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            tabsContainer.querySelectorAll('.gathering-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            renderGatheringLocation(tab.dataset.locId, level);
        });
    });
}

/**
 * 渲染指定采集区域的内容
 */
function renderGatheringLocation(locId, level) {
    const container = document.getElementById('gathering-items-list');
    if (!container) return;

    const loc = CONFIG.gatheringLocations.find(l => l.id === locId);
    if (!loc) return;

    const unlocked = level >= loc.reqLevel;
    const items = loc.items || [];
    const isActive = gameState.activeAction?.type === 'GATHERING' && gameState.activeAction?.id === loc.id;

    // 生成采集品卡片（简洁方形样式）- 每个都是可采集的行动
    const itemCards = items.map(item => {
        const itemIsActive = gameState.activeAction?.type === 'GATHERING' && 
                            gameState.activeAction?.id === loc.id && 
                            gameState.activeAction?.itemId === item.id;
        return `
            <div class="action-card-square ${unlocked ? '' : 'locked'} ${itemIsActive ? 'active' : ''}"
                 data-action="gathering-item" data-loc-id="${loc.id}" data-item-id="${item.id}">
                <div class="card-name">${item.name}</div>
                <div class="card-icon">${item.icon}</div>
            </div>
        `;
    }).join('');

    // 区域采集点卡片（简洁方形样式）
    const regionCard = `
        <div class="action-card-square ${unlocked ? '' : 'locked'} ${isActive ? 'active' : ''}"
             data-action="gathering" data-id="${loc.id}" data-unlocked="${unlocked}">
            <div class="card-name">${loc.name}</div>
            <div class="card-icon">${loc.icon}</div>
        </div>
    `;

    container.innerHTML = `
        <div class="gathering-items-grid">
            ${itemCards}
        </div>
        <div class="gathering-region-divider">
            <span>区域采集</span>
        </div>
        ${regionCard}
    `;

    // 绑定采集品点击事件（弹出行动选择弹窗）
    container.querySelectorAll('.action-card-square[data-action="gathering-item"]').forEach(card => {
        card.addEventListener('click', () => {
            const locId = card.dataset.locId;
            const itemId = card.dataset.itemId;
            openGatheringItemModal(locId, itemId);
        });
    });

    // 绑定区域采集点击事件
    container.querySelectorAll('.action-card-square[data-action="gathering"]').forEach(card => {
        card.addEventListener('click', () => {
            openActionModal('GATHERING', card.dataset.id);
        });
    });
}

/**
 * 打开采集品选择模态框
 */
function openGatheringItemModal(locId, itemId) {
    const loc = CONFIG.gatheringLocations.find(l => l.id === locId);
    const item = loc?.items?.find(i => i.id === itemId);
    if (!loc || !item) return;

    console.log('🌿 打开采集品弹窗:', { locId, itemId, locName: loc.name, itemName: item.name });

    // 设置 pendingAction 并使用统一的 showActionModal
    pendingAction = { type: 'GATHERING', id: locId, name: item.name, icon: item.icon, itemId: itemId };
    
    // 构建一个类似 config 的对象传给 showActionModal
    // 注意：采集品的 reqLevel 使用 loc.reqLevel（区域的等级要求）
    const config = {
        id: item.id,
        name: item.name,
        icon: item.icon,
        reqLevel: loc.reqLevel,  // 使用区域的等级要求
        duration: loc.duration,
        exp: item.exp,
    };
    
    showActionModal(config);
}

/**
 * 渲染制作列表
 */
function renderCrafting() {
    if (!elements.craftingList || !gameState) return;
    if (!CONFIG || !CONFIG.woodPlanks) {
        console.warn('renderCrafting: CONFIG.woodPlanks 未加载');
        return;
    }

    const level = gameState.craftingLevel || 1;

    elements.craftingList.innerHTML = CONFIG.woodPlanks.map(plank => {
        const unlocked = level >= plank.reqLevel;
        const isActive = gameState.activeAction?.type === 'CRAFTING' && gameState.activeAction?.id === plank.id;

        return `
            <div class="action-card-square ${unlocked ? '' : 'locked'} ${isActive ? 'active' : ''}"
                 data-action="crafting" data-id="${plank.id}">
                <div class="card-name">${plank.name}</div>
                <div class="card-icon">${plank.icon}</div>
            </div>
        `;
    }).join('');

    // 添加横行布局容器
    elements.craftingList.classList.add('cards-grid');

    elements.craftingList.querySelectorAll('.action-card-square').forEach(card => {
        card.addEventListener('click', () => {
            const plankId = card.dataset.id;
            openActionModal('CRAFTING', plankId);
        });
    });
}

/**
 * 渲染锻造列表（矿锭）
 */
function renderForging() {
    if (!elements.forgingList || !gameState) return;

    const level = gameState.forgingLevel || 1;

    elements.forgingList.innerHTML = CONFIG.ingots.map(ingot => {
        const unlocked = level >= ingot.reqLevel;
        const isActive = gameState.activeAction?.type === 'FORGING' && gameState.activeAction?.id === ingot.id;

        return `
            <div class="action-card-square ${unlocked ? '' : 'locked'} ${isActive ? 'active' : ''}"
                 data-action="forging" data-id="${ingot.id}">
                <div class="card-name">${ingot.name}</div>
                <div class="card-icon">${ingot.icon}</div>
            </div>
        `;
    }).join('');

    // 添加横行布局容器
    elements.forgingList.classList.add('cards-grid');

    elements.forgingList.querySelectorAll('.action-card-square').forEach(card => {
        card.addEventListener('click', () => {
            const ingotId = card.dataset.id;
            openActionModal('FORGING', ingotId);
        });
    });

    // 初始化锻造标签切换
    initForgingTabs();
    
    // 初始渲染工具列表（虽然可能隐藏）
    renderToolForge();
}

/**
 * 初始化锻造标签切换
 */
function initForgingTabs() {
    const tabsContainer = document.getElementById('forging-tabs');
    if (!tabsContainer) return;

    const tabs = tabsContainer.querySelectorAll('.gathering-tab');
    const ingotsList = document.getElementById('forging-ingots-list');
    const toolsList = document.getElementById('forging-tools-list');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            const tabName = tab.dataset.tab;

            // 切换显示
            if (ingotsList) ingotsList.classList.remove('active');
            if (toolsList) toolsList.classList.remove('active');

            if (tabName === 'ingots' && ingotsList) {
                ingotsList.classList.add('active');
            } else if (tabName === 'tools' && toolsList) {
                toolsList.classList.add('active');
                renderToolForge(); // 渲染工具列表
            }
        });
    });
}

/**
 * 渲染缝制列表
 */
function renderTailoring() {
    if (!elements.tailoringList || !gameState) return;
    if (!CONFIG || !CONFIG.fabrics) {
        console.warn('renderTailoring: CONFIG.fabrics 未加载');
        return;
    }

    const level = gameState.tailoringLevel || 1;

    elements.tailoringList.innerHTML = CONFIG.fabrics.map(fabric => {
        const unlocked = level >= fabric.reqLevel;
        const isActive = gameState.activeAction?.type === 'TAILORING' && gameState.activeAction?.id === fabric.id;

        return `
            <div class="action-card-square ${unlocked ? '' : 'locked'} ${isActive ? 'active' : ''}"
                 data-action="tailoring" data-id="${fabric.id}">
                <div class="card-name">${fabric.name}</div>
                <div class="card-icon">${fabric.icon}</div>
            </div>
        `;
    }).join('');

    // 添加横行布局容器
    elements.tailoringList.classList.add('cards-grid');

    elements.tailoringList.querySelectorAll('.action-card-square').forEach(card => {
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
        const isActive = gameState.activeAction?.type === 'BREWING' && gameState.activeAction?.id === brew.id;

        return `
            <div class="action-card-square ${unlocked ? '' : 'locked'} ${isActive ? 'active' : ''}"
                 data-action="brewing" data-id="${brew.id}">
                <div class="card-name">${brew.name}</div>
                <div class="card-icon">${brew.icon}</div>
            </div>
        `;
    }).join('');

    // 添加横行布局容器
    elements.brewingList.classList.add('cards-grid');

    elements.brewingList.querySelectorAll('.action-card-square').forEach(card => {
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
        const isActive = gameState.activeAction?.type === 'ALCHEMY' && gameState.activeAction?.id === potion.id;

        return `
            <div class="action-card-square ${unlocked ? '' : 'locked'} ${isActive ? 'active' : ''}"
                 data-action="alchemy" data-id="${potion.id}">
                <div class="card-name">${potion.name}</div>
                <div class="card-icon">${potion.icon}</div>
            </div>
        `;
    }).join('');

    // 添加横行布局容器
    elements.alchemyList.classList.add('cards-grid');

    elements.alchemyList.querySelectorAll('.action-card-square').forEach(card => {
        card.addEventListener('click', () => {
            const potionId = card.dataset.id;
            openActionModal('ALCHEMY', potionId);
        });
    });

    // 渲染提炼列表
    renderAlchemyEssences();

    // 绑定炼金标签切换
    const alchemyTabs = document.getElementById('alchemy-tabs');
    if (alchemyTabs) {
        alchemyTabs.querySelectorAll('.gathering-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                // 切换标签激活状态
                alchemyTabs.querySelectorAll('.gathering-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');

                // 切换列表显示
                const tabName = tab.dataset.tab;
                const potionsList = document.getElementById('alchemy-potions-list');
                const essencesList = document.getElementById('alchemy-essences-list');

                if (potionsList) potionsList.classList.toggle('active', tabName === 'potions');
                if (essencesList) essencesList.classList.toggle('active', tabName === 'essences');
            });
        });
    }
}

/**
 * 渲染提炼列表
 */
function renderAlchemyEssences() {
    const container = document.getElementById('alchemy-essences-list');
    if (!container || !gameState || !CONFIG.essences) return;

    // 提炼使用采集等级
    const level = gameState.gatheringLevel || 1;

    container.innerHTML = CONFIG.essences.map(essence => {
        const unlocked = level >= essence.reqLevel;
        const isActive = gameState.activeAction?.type === 'ESSENCE' && gameState.activeAction?.id === essence.id;

        return `
            <div class="action-card-square ${unlocked ? '' : 'locked'} ${isActive ? 'active' : ''}"
                 data-action="ESSENCE" data-id="${essence.id}">
                <div class="card-name">${essence.name}</div>
                <div class="card-icon">${essence.icon}</div>
            </div>
        `;
    }).join('');

    // 添加横行布局容器
    container.classList.add('cards-grid');

    container.querySelectorAll('.action-card-square').forEach(card => {
        card.addEventListener('click', () => {
            const essenceId = card.dataset.id;
            openActionModal('ESSENCE', essenceId);
        });
    });
}

/**
 * 渲染工具锻造列表
 */
function renderToolForge() {
    const container = document.getElementById('forging-tools-list');
    if (!container || !gameState || !CONFIG.tools) return;

    const forgingLevel = gameState.forgingLevel || 1;

    // 收集所有工具并按等级排序
    const allTools = [];
    const toolTypeNames = {
        'axes': '斧',
        'pickaxes': '镐',
        'chisels': '凿',
        'needles': '针',
        'scythes': '镰',
        'hammers': '锤',
        'tongs': '桶',
        'rods': '棒'
    };

    for (let seriesIndex = 0; seriesIndex < 8; seriesIndex++) {
        Object.entries(CONFIG.tools).forEach(([toolType, tools]) => {
            if (tools[seriesIndex]) {
                const tool = tools[seriesIndex];
                allTools.push({
                    tool: tool,
                    toolType: toolType,
                    toolIndex: seriesIndex,
                    reqLevel: tool.reqForgeLevel || (seriesIndex * 10 + 2)
                });
            }
        });
    }

    // 按等级排序
    allTools.sort((a, b) => a.reqLevel - b.reqLevel);

    container.innerHTML = allTools.map(({ tool, toolType, toolIndex, reqLevel }) => {
        const unlocked = forgingLevel >= reqLevel;
        const owned = (gameState.toolsInventory?.[toolType] || []).some(t => 
            (typeof t === 'string' ? t : t.id) === tool.id
        );

        return `
            <div class="action-card-square ${unlocked ? '' : 'locked'} ${owned ? 'owned' : ''}"
                 data-tool-type="${toolType}" data-tool-index="${toolIndex}">
                <div class="card-name">${tool.name}</div>
                <div class="card-icon">${tool.icon}</div>
            </div>
        `;
    }).join('');

    // 添加横行布局
    container.classList.add('cards-grid');

    container.querySelectorAll('.action-card-square').forEach(card => {
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

    // 检查队列状态
    const currentQueue = gameState?.actionQueue || [];
    const maxQueueSize = 2;
    const currentAction = gameState?.activeAction;
    const queueAvailable = currentQueue.length < maxQueueSize;
    const queuePosition = currentQueue.length + 1;

    // 根据 toolIndex 确定具体材料
    const ingotId = CONFIG.ingotIdMapping?.[toolIndex];
    const plankId = CONFIG.plankIdMapping?.[toolIndex];
    const oreId = CONFIG.ingotOreMapping?.[ingotId];

    // 获取材料名称
    const ore = CONFIG.ores?.find(o => o.id === oreId);
    const ingot = CONFIG.ingots?.find(i => i.id === ingotId);
    const plank = CONFIG.woodPlanks?.find(p => p.id === plankId);
    const prevTool = materials.prevTool ? CONFIG.tools[toolType].find(t => t.id === materials.prevTool) : null;

    // 获取库存数量
    const miningInv = gameState.miningInventory || {};
    const ingotsInv = gameState.ingotsInventory || {};
    const planksInv = gameState.planksInventory || {};

    const oreCount = miningInv[oreId] || 0;
    const ingotCount = ingotsInv[ingotId] || 0;
    const plankCount = planksInv[plankId] || 0;
    const prevToolCount = materials.prevTool ? (gameState.toolsInventory?.[toolType] || []).filter(id => id === materials.prevTool).length : 0;

    // 计算最大可锻造次数
    let maxByOre = Infinity, maxByIngot = Infinity, maxByPlank = Infinity, maxByPrevTool = Infinity;
    if (materials.ore) maxByOre = Math.floor(oreCount / materials.ore);
    if (materials.ingot) maxByIngot = Math.floor(ingotCount / materials.ingot);
    if (materials.plank) maxByPlank = Math.floor(plankCount / materials.plank);
    if (materials.prevTool) maxByPrevTool = prevToolCount;
    const maxForgeCount = Math.min(maxByOre, maxByIngot, maxByPlank, maxByPrevTool);

    const canForge = maxForgeCount > 0;

    // 创建模态框
    const modal = document.createElement('div');
    modal.className = 'action-modal-overlay';
    modal.innerHTML = `
        <div class="action-modal">
            <div class="action-modal-header">
                <span class="action-modal-icon">${tool.icon}</span>
                <span class="action-modal-title">${tool.name}</span>
                <button class="action-modal-close">&times;</button>
            </div>
            <div class="action-modal-body">
                <div class="action-modal-info">
                    <span>⚡ +${Math.round(tool.speedBonus * 100)}% 速度</span>
                    <span>⏱️ ${formatTime(tool.duration || 6000)}</span>
                    <span>✨ ${tool.exp || 14} 经验</span>
                </div>
                <div class="forge-materials">
                    <h4>所需材料 (最多 ${maxForgeCount} 次):</h4>
                    ${materials.ore ? `<div class="${oreCount >= materials.ore ? '' : 'insufficient'}">${ore?.name || oreId} × ${materials.ore} <span class="count">(${oreCount})</span></div>` : ''}
                    ${materials.ingot ? `<div class="${ingotCount >= materials.ingot ? '' : 'insufficient'}">${ingot?.name || ingotId} × ${materials.ingot} <span class="count">(${ingotCount})</span></div>` : ''}
                    ${materials.plank ? `<div class="${plankCount >= materials.plank ? '' : 'insufficient'}">${plank?.name || plankId} × ${materials.plank} <span class="count">(${plankCount})</span></div>` : ''}
                    ${materials.prevTool ? `<div class="${prevToolCount >= 1 ? '' : 'insufficient'}">${prevTool?.name || materials.prevTool} × 1 <span class="count">(${prevToolCount})</span></div>` : ''}
                    ${!canForge ? '<div class="forge-warning">⚠️ 材料不足</div>' : ''}
                </div>
                <div class="action-modal-counts">
                    <button class="count-btn" data-count="1">1次</button>
                    <button class="count-btn" data-count="5">5次</button>
                    <button class="count-btn" data-count="10">10次</button>
                    <button class="count-btn" data-count="${maxForgeCount}">全部(${maxForgeCount})</button>
                </div>
                <div class="action-modal-custom">
                    <input type="text" id="custom-count" placeholder="自定义次数">
                </div>
            </div>
            <div class="action-modal-footer">
                <button class="action-btn secondary" id="action-cancel">取消</button>
                ${currentAction && queueAvailable ?
                    `<button class="action-btn queue" id="action-queue">加入队列 #${queuePosition}</button>` :
                    (!currentAction ? '' : `<button class="action-btn queue disabled" disabled>队列已满</button>`)}
                <button class="action-btn primary ${canForge ? '' : 'disabled'}" id="action-start" ${canForge ? '' : 'disabled'}>开始锻造</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // 绑定事件
    modal.querySelector('.action-modal-close').addEventListener('click', () => modal.remove());
    modal.querySelector('#action-cancel').addEventListener('click', () => modal.remove());

    // 快捷次数按钮
    modal.querySelectorAll('.count-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            modal.querySelectorAll('.count-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            modal.querySelector('#custom-count').value = btn.dataset.count;
        });
    });

    // 获取次数
    const getCount = () => {
        const val = modal.querySelector('#custom-count').value;
        const num = parseInt(val) || 1;
        return Math.min(num, maxForgeCount);
    };

    // 开始锻造
    modal.querySelector('#action-start').addEventListener('click', () => {
        const count = getCount();
        if (count <= 0) return;

        // 转换 toolType: axes -> axe, chisels -> chisel, tongs -> tongs (保持不变), rods -> rod
        const singularType = toolType === 'tongs' ? 'tongs' :
                            toolType.endsWith('s') ? toolType.slice(0, -1) : toolType;

        // 检查是否有行动进行中
        if (currentAction) {
            showForgeImmediatelyConfirm(toolType, toolIndex, tool, count, modal);
        } else {
            socket.emit('forge_tool', {
                toolType: singularType,
                toolIndex: toolIndex,
                count: count
            });
            modal.remove();
        }
    });

    // 加入队列
    const queueBtn = modal.querySelector('#action-queue');
    if (queueBtn && !queueBtn.disabled) {
        queueBtn.addEventListener('click', () => {
            const count = getCount();
            if (count <= 0) return;
            const singularType = toolType === 'tongs' ? 'tongs' :
                                toolType.endsWith('s') ? toolType.slice(0, -1) : toolType;
            socket.emit('forge_tool', {
                toolType: singularType,
                toolIndex: toolIndex,
                count: count
            });
            modal.remove();
        });
    }

    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove();
    });

    // 默认选中1次
    modal.querySelector('.count-btn[data-count="1"]').classList.add('active');
    modal.querySelector('#custom-count').value = 1;
}

/**
 * 显示锻造立即开始确认卡片
 */
function showForgeImmediatelyConfirm(toolType, toolIndex, tool, count, parentModal) {
    const currentAction = gameState?.activeAction;
    if (!currentAction) return;

    const actionConfig = getActionConfig(currentAction.type, currentAction.id);
    const currentName = actionConfig?.name || '当前行动';

    const modal = document.createElement('div');
    modal.className = 'action-modal-overlay';
    modal.innerHTML = `
        <div class="confirm-dialog">
            <div class="confirm-dialog-title">⚠️ 立即锻造将清空当前行动</div>
            <div class="confirm-dialog-content">
                <div class="confirm-dialog-compare">
                    <div class="confirm-dialog-item">
                        <span class="confirm-dialog-icon" style="opacity: 0.5;">${actionConfig?.icon || '🔧'}</span>
                        <span class="confirm-dialog-name" style="opacity: 0.5;">${currentName}</span>
                    </div>
                    <span class="confirm-dialog-arrow">→</span>
                    <div class="confirm-dialog-item">
                        <span class="confirm-dialog-icon">${tool.icon}</span>
                        <span class="confirm-dialog-name">${tool.name}</span>
                    </div>
                </div>
            </div>
            <div class="confirm-dialog-footer">
                <button class="dialog-btn secondary" id="forge-cancel">取消</button>
                <button class="dialog-btn danger" id="forge-confirm">确认锻造</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    modal.querySelector('#forge-cancel').addEventListener('click', () => modal.remove());

    modal.querySelector('#forge-confirm').addEventListener('click', () => {
        const singularType = toolType === 'tongs' ? 'tongs' :
                            toolType.endsWith('s') ? toolType.slice(0, -1) : toolType;
        socket.emit('forge_tool_immediately', {
            toolType: singularType,
            toolIndex: toolIndex,
            count: count
        });
        modal.remove();
        parentModal.remove();
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
function renderMerchantPanel(merchantId, merchantData, activeTab = 'trade', savedPendingSellItems = [], savedPopupItem = null, savedPopupInputValue = 1, savedConfirmState = false) {
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
                    <div class="inventory-card" data-item-type="${type}" data-item-id="${itemId}" data-count="${count}" data-name="${configItem.name}" data-icon="${configItem.icon}" data-price="${price}">
                        <span class="inventory-icon">${configItem.icon}</span>
                        <span class="inventory-count">${count}</span>
                    </div>
                `;
            }
        });
    });

    const modal = document.createElement('div');
    modal.className = 'merchant-modal active';
    modal.dataset.merchantId = merchantId;

    // 好感度百分比
    const favorPercent = Math.floor((merchantData.favorability || 0) * 100);

    // 生成商人出售区空格子（21个格子，暂不售出任何东西）
    const goodsSlots = [];
    for (let i = 0; i < 21; i++) {
        goodsSlots.push('<div class="goods-card empty-slot"></div>');
    }

    // 生成我的物品区（只显示有物品的格子）
    const inventorySlots = [];
    if (myItemsHtml) {
        inventorySlots.push(myItemsHtml);
    }

    modal.innerHTML = `
        <div class="merchant-modal-overlay"></div>
        <div class="merchant-modal-panel">
            <!-- 头部：商人信息 -->
            <div class="merchant-header">
                <div class="merchant-avatar">${merchantData.avatar}</div>
                <div class="merchant-info">
                    <div class="merchant-name">${merchantData.name}</div>
                    <div class="merchant-title">${merchantData.title}</div>
                    <div class="reputation-bar">
                        <span class="reputation-label">好感度</span>
                        <div class="reputation-track">
                            <div class="reputation-fill" style="width: ${favorPercent}%;"></div>
                        </div>
                        <span class="reputation-value">${favorPercent}%</span>
                    </div>
                </div>
                <button class="merchant-close-btn">×</button>
            </div>

            <!-- 标签切换 -->
            <div class="merchant-tabs">
                <button class="merchant-tab ${activeTab === 'trade' ? 'active' : ''}" data-tab="trade">⚖ 交易</button>
                <button class="merchant-tab ${activeTab === 'quest' ? 'active' : ''}" data-tab="quest">📜 任务</button>
            </div>

            <!-- 内容区域 -->
            <div class="merchant-content-area" id="merchant-trade-panel" style="display: ${activeTab === 'trade' ? 'flex' : 'none'};">
                <!-- 商人出售区 -->
                <div class="merchant-goods-section">
                    <div class="goods-grid">
                        ${goodsSlots.join('')}
                    </div>
                </div>

                <!-- 待售预览区 -->
                <div class="sell-preview-section" id="sell-preview-section">
                    <div class="section-header">
                        <span class="section-icon">📤</span>
                        <span class="section-title">待售</span>
                        <div class="section-divider"></div>
                    </div>
                    <div class="preview-grid" id="sell-preview-grid">
                        <!-- 待售物品 -->
                    </div>
                    <div class="sell-actions">
                        <button class="btn-sell-confirm" id="merchant-sell-btn">出售</button>
                        <div class="sell-total">
                            获得：<span class="sell-total-value" id="merchant-sell-total">🪙 0</span>
                        </div>
                    </div>
                </div>

                <!-- 我的物品 -->
                <div class="merchant-inventory-section">
                    <div class="section-header">
                        <span class="section-icon">🎒</span>
                        <span class="section-title">我的物品</span>
                        <div class="section-divider"></div>
                    </div>
                    <div class="inventory-grid" id="merchant-inventory-grid">
                        ${inventorySlots.join('')}
                    </div>
                </div>
            </div>

            <!-- 任务面板 -->
            <div class="merchant-quest-panel" id="merchant-quest-panel" style="display: ${activeTab === 'quest' ? 'block' : 'none'};">
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
                }).join('') || '<div class="quest-empty"><span class="quest-icon">📜</span><span class="quest-text">暂无任务</span></div>'}
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // 关闭函数（带动画）
    const closeModal = () => {
        modal.classList.remove('active');
        setTimeout(() => modal.remove(), 300);
    };

    // 绑定事件
    modal.querySelector('.merchant-close-btn').addEventListener('click', closeModal);
    modal.querySelector('.merchant-modal-overlay').addEventListener('click', closeModal);

    // 标签切换
    modal.querySelectorAll('.merchant-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            modal.querySelectorAll('.merchant-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            const tabId = tab.dataset.tab;
            // 切换显示交易/任务面板
            const tradePanel = modal.querySelector('#merchant-trade-panel');
            const questPanel = modal.querySelector('#merchant-quest-panel');
            if (tradePanel && questPanel) {
                tradePanel.style.display = tabId === 'trade' ? 'flex' : 'none';
                questPanel.style.display = tabId === 'quest' ? 'block' : 'none';
            }
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

    // 物品卡片点击事件 - 显示出售弹窗
    const sellPopupCards = new Map(); // 存储当前显示的弹窗

    // 待售列表数据（恢复之前保存的数据）
    const pendingSellItems = savedPendingSellItems.map(item => {
        // 从当前库存中获取价格信息
        const card = modal.querySelector(`.inventory-card[data-item-id="${item.id}"]`);
        const price = card ? parseInt(card.dataset.price) || 1 : 1;
        const name = card ? card.dataset.name || item.id : item.id;
        return { ...item, price, name, sellCount: item.count };
    });

    // 更新待售列表显示
    const updateSellPreview = () => {
        const previewGrid = modal.querySelector('#sell-preview-grid');
        if (!previewGrid) return;

        previewGrid.innerHTML = pendingSellItems.map(item => `
            <div class="preview-card" data-item-type="${item.type}" data-item-id="${item.id}">
                <span class="preview-icon">${item.icon}</span>
                <span class="preview-count">${item.sellCount}</span>
            </div>
        `).join('') || '<div class="preview-empty">点击物品添加到待售</div>';

        // 更新总计
        const totalGold = pendingSellItems.reduce((sum, item) => sum + item.price * item.sellCount, 0);
        const totalEl = modal.querySelector('#merchant-sell-total');
        if (totalEl) {
            totalEl.textContent = `💰 ${totalGold}`;
        }

        // 绑定待售卡片点击事件（移除）
        previewGrid.querySelectorAll('.preview-card').forEach(card => {
            card.addEventListener('click', () => {
                const itemType = card.dataset.itemType;
                const itemId = card.dataset.itemId;
                const index = pendingSellItems.findIndex(i => i.type === itemType && i.id === itemId);
                if (index > -1) {
                    pendingSellItems.splice(index, 1);
                    updateSellPreview();
                }
            });
        });
    };

    // 确认出售按钮
    const sellConfirmBtn = modal.querySelector('#merchant-sell-btn');
    if (sellConfirmBtn) {
        // 使用dataset存储确认状态，这样恢复时可以正确设置
        sellConfirmBtn.dataset.confirmState = savedConfirmState ? 'true' : 'false';
        if (savedConfirmState) {
            sellConfirmBtn.classList.add('confirm-ready');
            sellConfirmBtn.textContent = '确认出售';
        }

        sellConfirmBtn.addEventListener('click', () => {
            if (pendingSellItems.length === 0) {
                showToast('⚠️ 请先选择要出售的物品');
                return;
            }

            const currentState = sellConfirmBtn.dataset.confirmState === 'true';

            if (!currentState) {
                // 第一次点击：变成确认状态
                sellConfirmBtn.dataset.confirmState = 'true';
                sellConfirmBtn.classList.add('confirm-ready');
                sellConfirmBtn.textContent = '确认出售';
            } else {
                // 第二次点击：执行出售
                pendingSellItems.forEach(item => {
                    socket.emit('sell_item', { itemType: item.type, itemId: item.id, count: item.sellCount });
                    
                    // 更新对应物品卡片的数量
                    const card = modal.querySelector(`.inventory-card[data-item-id="${item.id}"]`);
                    if (card) {
                        const currentCount = parseInt(card.dataset.count) || 0;
                        const newCount = currentCount - item.sellCount;
                        card.dataset.count = newCount;
                        const countEl = card.querySelector('.inventory-count');
                        if (countEl) {
                            countEl.textContent = newCount;
                        }
                        // 如果数量为0，移除卡片
                        if (newCount <= 0) {
                            card.remove();
                        }
                    }
                });
                pendingSellItems.length = 0;
                updateSellPreview();
                sellConfirmBtn.dataset.confirmState = 'false';
                sellConfirmBtn.classList.remove('confirm-ready');
                sellConfirmBtn.textContent = '出售';
                showToast('✅ 出售成功');
            }
        });

        // 点击其他地方取消确认状态
        modal.addEventListener('click', (e) => {
            if (!e.target.closest('#merchant-sell-btn') && sellConfirmBtn.dataset.confirmState === 'true') {
                sellConfirmBtn.dataset.confirmState = 'false';
                sellConfirmBtn.classList.remove('confirm-ready');
                sellConfirmBtn.textContent = '出售';
            }
        });
    }

    // 物品卡片点击
    modal.querySelectorAll('.inventory-card:not(.empty-slot)').forEach(card => {
        card.addEventListener('click', (e) => {
            e.stopPropagation();

            // 移除其他卡片的selected标记，添加当前卡片的selected标记
            modal.querySelectorAll('.inventory-card.selected').forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');

            // 关闭其他弹窗
            sellPopupCards.forEach(popup => popup.remove());
            sellPopupCards.clear();

            const itemType = card.dataset.itemType;
            const itemId = card.dataset.itemId;
            const count = parseInt(card.dataset.count) || 1;
            const name = card.dataset.name || itemId;
            const icon = card.dataset.icon || '❓';
            const price = parseInt(card.dataset.price) || 1;

            // 创建弹出卡片
            const popup = document.createElement('div');
            popup.className = 'item-sell-popup';
            popup.innerHTML = `
                <div class="popup-header">
                    <span class="popup-icon">${icon}</span>
                    <span class="popup-name">${name}</span>
                </div>
                <div class="popup-info">
                    <span class="popup-count">持有: ${count}</span>
                    <span class="popup-price">单价: 💰${price}</span>
                </div>
                <div class="popup-input-row">
                    <input type="number" class="popup-input" min="1" max="${count}" value="1" placeholder="数量">
                    <button class="popup-all-btn">全部</button>
                </div>
                <button class="popup-sell-btn">加入待售</button>
                <button class="popup-direct-sell-btn" id="popup-direct-sell">出售</button>
            `;

            // 定位弹窗在卡片上方
            const rect = card.getBoundingClientRect();
            const modalRect = modal.querySelector('.merchant-modal-panel').getBoundingClientRect();
            popup.style.position = 'absolute';
            popup.style.left = `${rect.left - modalRect.left}px`;
            popup.style.bottom = `${modalRect.height - (rect.top - modalRect.top) + 5}px`;

            modal.querySelector('.merchant-modal-panel').appendChild(popup);
            sellPopupCards.set(itemId, popup);

            // 全部按钮
            popup.querySelector('.popup-all-btn').addEventListener('click', () => {
                popup.querySelector('.popup-input').value = count;
            });

            // 加入待售按钮
            popup.querySelector('.popup-sell-btn').addEventListener('click', () => {
                const sellCount = parseInt(popup.querySelector('.popup-input').value) || 1;
                const currentCount = parseInt(card.dataset.count) || 0;
                if (sellCount <= 0 || sellCount > currentCount) {
                    showToast('⚠️ 数量无效');
                    return;
                }

                // 检查是否已在待售列表
                const existing = pendingSellItems.find(i => i.type === itemType && i.id === itemId);
                if (existing) {
                    existing.sellCount = Math.min(existing.sellCount + sellCount, currentCount);
                } else {
                    pendingSellItems.push({
                        type: itemType,
                        id: itemId,
                        name,
                        icon,
                        price,
                        sellCount
                    });
                }

                updateSellPreview();
                popup.remove();
                sellPopupCards.delete(itemId);
                card.classList.remove('selected'); // 移除选中标记
            });

            // 直接出售按钮（两次确认）
            const directSellBtn = popup.querySelector('#popup-direct-sell');
            let directSellConfirm = false;
            directSellBtn.addEventListener('click', () => {
                const sellCount = parseInt(popup.querySelector('.popup-input').value) || 1;
                const currentCount = parseInt(card.dataset.count) || 0;
                if (sellCount <= 0 || sellCount > currentCount) {
                    showToast('⚠️ 数量无效');
                    return;
                }

                if (!directSellConfirm) {
                    // 第一次点击：变成确认状态
                    directSellConfirm = true;
                    directSellBtn.classList.add('confirm-ready');
                    directSellBtn.textContent = '再次出售';
                } else {
                    // 第二次点击：执行出售
                    socket.emit('sell_item', { itemType, itemId, count: sellCount });
                    
                    // 更新卡片数量
                    const newCount = currentCount - sellCount;
                    card.dataset.count = newCount;
                    const countEl = card.querySelector('.inventory-count');
                    if (countEl) {
                        countEl.textContent = newCount;
                    }
                    
                    // 如果数量为0，移除卡片
                    if (newCount <= 0) {
                        card.remove();
                    }
                    
                    popup.remove();
                    sellPopupCards.delete(itemId);
                    card.classList.remove('selected');
                    showToast(`✅ 出售成功: +${sellCount * price}💰`);
                }
            });

            // 点击其他地方关闭弹窗
            setTimeout(() => {
                document.addEventListener('click', closePopupHandler);
            }, 10);

            const closePopupHandler = (ev) => {
                if (!popup.contains(ev.target) && !card.contains(ev.target)) {
                    popup.remove();
                    sellPopupCards.delete(itemId);
                    card.classList.remove('selected'); // 移除选中标记
                    document.removeEventListener('click', closePopupHandler);
                }
            };
        });
    });

    // 初始化待售列表
    updateSellPreview();

    // 恢复弹出卡片（如果有保存的）
    if (savedPopupItem) {
        const targetCard = modal.querySelector(`.inventory-card[data-item-id="${savedPopupItem.id}"]`);
        if (targetCard) {
            // 添加选中标记
            targetCard.classList.add('selected');
            // 触发点击事件来显示弹出卡片
            setTimeout(() => {
                targetCard.click();
                // 设置输入框值
                setTimeout(() => {
                    const popup = modal.querySelector('.item-sell-popup');
                    if (popup) {
                        const inputEl = popup.querySelector('.popup-input');
                        if (inputEl) {
                            inputEl.value = savedPopupInputValue;
                        }
                    }
                }, 50);
            }, 100);
        }
    }
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

    // 锻造工具 - 显示所有工具（已装备的 + 背包中的）
    const allToolItems = [];
    const toolTypes = ['axes', 'pickaxes', 'chisels', 'needles', 'scythes', 'hammers', 'tongs', 'rods'];

    // 工具类型到槽位ID的映射
    const toolTypeToSlot = {
        'axes': 'axe',
        'pickaxes': 'pickaxe',
        'chisels': 'chisel',
        'needles': 'needle',
        'scythes': 'scythe',
        'hammers': 'hammer',
        'tongs': 'tongs',  // 小桶槽位ID是 tongs，不是 tong
        'rods': 'rod'
    };

    // 先添加已装备的工具（装备时会从背包移除，所以这里只显示已装备的）
    if (gameState.equipment) {
        toolTypes.forEach(toolType => {
            const slotId = toolTypeToSlot[toolType];
            const equippedId = gameState.equipment[slotId];
            if (equippedId) {
                const tools = CONFIG.tools?.[toolType] || [];
                const tool = tools.find(t => t.id === equippedId);
                if (tool) {
                    allToolItems.push({ id: equippedId, name: tool.name, icon: tool.icon, isEquipped: true, count: 1 });
                }
            }
        });
    }

    // 统计背包中的工具数量（装备时已从背包移除，所以这些都是未装备的）
    // 注意：工具可能是字符串（旧格式）或对象（新格式，包含 id 和 enhanceLevel）
    // 同ID同等级的工具堆叠显示
    const unequippedCounts = {};
    toolTypes.forEach(toolType => {
        const tools = CONFIG.tools?.[toolType] || [];
        const inventory = gameState.toolsInventory?.[toolType] || [];
        inventory.forEach((tool) => {
            // 兼容旧格式（字符串）和新格式（对象）
            const toolId = typeof tool === 'string' ? tool : tool.id;
            const enhanceLevel = typeof tool === 'object' && tool ? (tool.enhanceLevel || 0) : 0;
            const toolConfig = tools.find(t => t.id === toolId);

            // 使用 id+level 作为堆叠键
            const stackKey = `${toolId}_${enhanceLevel}`;

            if (!unequippedCounts[stackKey]) {
                const displayName = toolConfig?.name || toolId;
                unequippedCounts[stackKey] = {
                    id: toolId,
                    count: 0,
                    name: displayName,
                    icon: toolConfig?.icon || '❓',
                    isEquipped: false,
                    enhanceLevel,
                    displayName: enhanceLevel > 0 ? `${displayName} +${enhanceLevel}` : displayName
                };
            }
            unequippedCounts[stackKey].count++;
        });
    });

    // 添加未装备工具（同ID同等级堆叠）
    Object.values(unequippedCounts).forEach(data => {
        allToolItems.push(data);
    });

    // 渲染工具网格（已装备独立显示，未装备单独显示每个工具）
    const toolsElement = document.getElementById('storage-tools-items');
    if (toolsElement && allToolItems.length > 0) {
        const items = allToolItems.map(tool => {
            const desc = getItemDescription(tool.id, tool);
            const price = getItemSellPrice(tool.id); // 使用 ITEM_VALUES 获取价格
            const displayName = tool.displayName || tool.name;
            const enhanceLevel = tool.enhanceLevel || 0;
            return `
                <div class="inventory-item ${tool.isEquipped ? 'equipped' : ''}"
                     data-id="${tool.id}"
                     data-name="${tool.name}"
                     data-count="${tool.count || 1}"
                     data-price="${price}"
                     data-desc="${desc}"
                     data-icon="${tool.icon}"
                     data-enhance="${enhanceLevel}">
                    ${enhanceLevel > 0 ? `<span class="item-enhance-badge">+${enhanceLevel}</span>` : ''}
                    <span class="item-icon">${tool.icon}</span>
                    <span class="item-name">${displayName}</span>
                    ${tool.isEquipped ? '<span class="item-equipped-check">✓</span>' : (tool.count > 1 ? `<span class="item-count">${tool.count}</span>` : '')}
                </div>
            `;
        }).join('');
        toolsElement.innerHTML = items;

        // 绑定点击事件
        toolsElement.querySelectorAll('.inventory-item').forEach(item => {
            item.addEventListener('click', (e) => showItemTooltip(item, e));
        });
    } else if (toolsElement) {
        toolsElement.innerHTML = '';
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

    // 代币
    const tokenConfig = CONFIG.tokens || [
        { id: 'wood_token', name: '伐木代币', icon: '🪙' },
        { id: 'mining_token', name: '挖矿代币', icon: '🪙' },
        { id: 'gathering_token', name: '采集代币', icon: '🪙' },
        { id: 'crafting_token', name: '制作代币', icon: '🪙' },
        { id: 'forging_token', name: '锻造代币', icon: '🪙' },
        { id: 'tailoring_token', name: '缝制代币', icon: '🪙' },
        { id: 'alchemy_token', name: '炼金代币', icon: '🪙' },
        { id: 'brewing_token', name: '酿造代币', icon: '🪙' }
    ];
    renderInventoryGrid('storage-tokens-items', gameState.tokensInventory, tokenConfig);
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
 * 物品价值配置
 */
const ITEM_VALUES = {
    // 代币 - 全部50
    tokens: {
        wood_token: 50, mining_token: 50, gathering_token: 50, forging_token: 50,
        crafting_token: 50, alchemy_token: 50, tailoring_token: 50, brewing_token: 50
    },
    // 木材（伐木获得）- 按等级
    woods: {
        pine: 2, iron_birch: 4, wind_tree: 8, flame_tree: 12,
        frost_maple: 16, thunder_tree: 24, ancient_oak: 40, world_tree: 56
    },
    // 矿石（挖矿获得）- 按等级
    ores: {
        cyan_ore: 2, red_iron: 4, feather_ore: 8, hell_ore: 12,
        white_ore: 16, thunder_ore: 24, brilliant: 40, star_ore: 56
    },
    // 采集品
    gathering: {
        honey: 1, sweet_berry: 1, blood_rose: 2, jute: 2, wild_mint: 2,
        wheat: 3, star_dew_herb: 4, flax: 4, pine_needle: 4, feather: 4,
        blossom_honey: 4, hops: 5, red_serpent_fruit: 8, moonlight_mushroom: 8, vanilla: 8, jade_feather: 8,
        apple: 8, wool: 12, sage: 12, falcon_tail_feather: 12,
        moonlight_honey: 8, grape: 11, silk: 16, soul_herb: 16, chili: 16,
        wind_velvet: 24, wild_heart: 24, rye: 16, mist_flower: 24, rainbow_feather: 24,
        rock_rose_honey: 20, mist_fruit: 27, bewitch_berry: 40, harpy_feather: 40,
        dragon_blood_fruit: 37, life_fiber: 56, star_blossom: 56, four_leaf_clover: 56
    },
    // 木板
    planks: {
        pine_plank: 16, iron_birch_plank: 32, wind_tree_plank: 64, flame_tree_plank: 96,
        frost_maple_plank: 112, thunder_tree_plank: 154, ancient_oak_plank: 240, world_tree_plank: 314
    },
    // 矿锭
    ingots: {
        cyan_ingot: 16, red_copper_ingot: 32, feather_ingot: 64, white_silver_ingot: 96,
        hell_steel_ingot: 112, thunder_steel_ingot: 154, brilliant_crystal: 240, star_crystal: 314
    },
    // 布料
    fabrics: {
        jute_cloth: 16, linen_cloth: 32, wool_cloth: 96, silk_cloth: 112,
        wind_silk: 154, dream_cloth: 314
    },
    // 精华
    essences: {
        mint_essence: 16, pine_essence: 32, vanilla_essence: 64, sage_essence: 96,
        chili_essence: 128, mist_essence: 192, clover_essence: 392
    },
    // 药水
    potions: {
        hp_potion_1: 28, mp_potion_1: 36,
        hp_potion_2: 44, mp_potion_2: 44,
        hp_potion_3: 116, mp_potion_3: 116,
        hp_potion_4: 128, mp_potion_4: 128,
        hp_potion_5: 235, mp_potion_5: 207,
        hp_potion_6: 230, mp_potion_6: 205,
        hp_potion_7: 441, mp_potion_7: 441,
        hp_potion_8: 440, mp_potion_8: 440
    },
    // 酒类
    brews: {
        woodcutting_wine: 118, gathering_ale: 126, mining_wine: 182, forging_ale: 190,
        crafting_ale: 318, tailoring_beer: 326, alchemy_beer: 454, brewing_wine: 466
    },
    // 工具（非锤子）
    tools_normal: {
        cyan_axe: 116, red_axe: 616, feather_axe: 2304, white_axe: 7128,
        hell_axe: 17470, thunder_axe: 37476, brilliant_axe: 77254, star_axe: 145624,
        cyan_pickaxe: 116, red_pickaxe: 616, feather_pickaxe: 2304, white_pickaxe: 7128,
        hell_pickaxe: 17470, thunder_pickaxe: 37476, brilliant_pickaxe: 77254, star_pickaxe: 145624,
        cyan_chisel: 116, red_chisel: 616, feather_chisel: 2304, white_chisel: 7128,
        hell_chisel: 17470, thunder_chisel: 37476, brilliant_chisel: 77254, star_chisel: 145624,
        cyan_needle: 116, red_needle: 616, feather_needle: 2304, white_needle: 7128,
        hell_needle: 17470, thunder_needle: 37476, brilliant_needle: 77254, star_needle: 145624,
        cyan_scythe: 116, red_scythe: 616, feather_scythe: 2304, white_scythe: 7128,
        hell_scythe: 17470, thunder_scythe: 37476, brilliant_scythe: 77254, star_scythe: 145624,
        cyan_tongs: 116, red_tongs: 616, feather_tongs: 2304, white_tongs: 7128,
        hell_tongs: 17470, thunder_tongs: 37476, brilliant_tongs: 77254, star_tongs: 145624,
        cyan_rod: 116, red_rod: 616, feather_rod: 2304, white_rod: 7128,
        hell_rod: 17470, thunder_rod: 37476, brilliant_rod: 77254, star_rod: 145624
    },
    // 锤子
    hammers: {
        cyan_hammer: 160, red_hammer: 832, feather_hammer: 3072, white_hammer: 9408,
        hell_hammer: 22758, thunder_hammer: 48271, brilliant_hammer: 98087, star_hammer: 182224
    }
};

/**
 * 获取物品售价
 */
function getItemSellPrice(itemId) {
    // 检查所有类型
    for (const category of Object.values(ITEM_VALUES)) {
        if (category[itemId]) {
            return category[itemId];
        }
    }
    return 0; // 未找到则返回0（不可出售）
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
            const price = configItem.price || getItemSellPrice(id); // 优先使用配置价格，否则使用 ITEM_VALUES
            const desc = configItem.desc || configItem.description || getItemDescription(id, configItem);
            return `
                <div class="inventory-item"
                     data-id="${id}"
                     data-name="${configItem.name}"
                     data-count="${count}"
                     data-price="${price}"
                     data-desc="${desc}"
                     data-icon="${configItem.icon}">
                    <span class="item-icon">${configItem.icon}</span>
                    <span class="item-name">${configItem.name}</span>
                    <span class="item-count">${count}</span>
                </div>
            `;
        }).join('');

    element.innerHTML = items || ''; // 暂无物品时不显示任何内容

    // 绑定点击和悬浮事件
    element.querySelectorAll('.inventory-item').forEach(item => {
        item.addEventListener('click', (e) => showItemTooltip(item, e));
        // 悬浮显示
        item.addEventListener('mouseenter', (e) => showItemTooltip(item, e));
    });
}

/**
 * 获取物品描述
 */
function getItemDescription(id, configItem) {
    // 根据物品类型返回默认描述
    if (id.includes('_token')) return '用于兑换特殊奖励';
    if (id.includes('axe')) return '伐木工具，提升伐木速度';
    if (id.includes('pickaxe')) return '挖矿工具，提升挖矿速度';
    if (id.includes('chisel')) return '制作工具，提升制作速度';
    if (id.includes('needle')) return '缝制工具，提升缝制速度';
    if (id.includes('scythe')) return '采集工具，提升采集速度';
    if (id.includes('hammer')) return '锻造工具，提升锻造速度';
    if (id.includes('tongs')) return '酿造工具，提升酿造速度';
    if (id.includes('rod')) return '炼金工具，提升炼金速度';
    return '材料物品';
}

/**
 * 显示物品详情弹出卡片
 */
function showItemTooltip(item, event) {
    // 先移除已有的弹出卡片
    document.querySelectorAll('.item-tooltip').forEach(t => t.remove());

    const name = item.dataset.name;
    const count = item.dataset.count;
    const price = item.dataset.price;
    const desc = item.dataset.desc;
    const icon = item.dataset.icon;
    const id = item.dataset.id;
    const enhanceLevel = parseInt(item.dataset.enhance) || 0;

    // 检查是否是工具
    const isTool = id && (id.includes('axe') || id.includes('pickaxe') || id.includes('chisel') ||
                          id.includes('needle') || id.includes('scythe') || id.includes('hammer') ||
                          id.includes('tongs') || id.includes('rod'));

    // 检查是否已装备（通过 item 的 CSS 类判断，而不是遍历 equipment）
    const isEquipped = item.classList.contains('equipped');

    // 获取装备槽位（用于卸下）
    let equipSlot = null;
    if (isEquipped && isTool) {
        if (id.includes('axe')) equipSlot = 'axe';
        else if (id.includes('pickaxe')) equipSlot = 'pickaxe';
        else if (id.includes('chisel')) equipSlot = 'chisel';
        else if (id.includes('needle')) equipSlot = 'needle';
        else if (id.includes('scythe')) equipSlot = 'scythe';
        else if (id.includes('hammer')) equipSlot = 'hammer';
        else if (id.includes('tongs')) equipSlot = 'tongs';
        else if (id.includes('rod')) equipSlot = 'rod';
    }

    // 计算工具效果
    let toolEffect = '';
    if (isTool) {
        const toolTypes = ['axes', 'pickaxes', 'chisels', 'needles', 'scythes', 'hammers', 'tongs', 'rods'];
        for (const toolType of toolTypes) {
            const toolConfig = CONFIG.tools?.[toolType]?.find(t => t.id === id);
            if (toolConfig && toolConfig.speedBonus) {
                const baseBonus = toolConfig.speedBonus;
                let totalBonus = baseBonus;

                if (enhanceLevel > 0 && CONFIG.enhanceConfig?.bonusTable) {
                    const enhanceBonus = CONFIG.enhanceConfig.bonusTable[enhanceLevel] || 0;
                    totalBonus = baseBonus * (1 + enhanceBonus);
                }

                toolEffect = `速度 +${Math.round(totalBonus * 100)}%`;
                if (enhanceLevel > 0) {
                    toolEffect += ` (基础${Math.round(baseBonus * 100)}% + 强化${Math.round((totalBonus - baseBonus) * 100)}%)`;
                }
                break;
            }
        }
    }

    // 构建显示名称
    const displayName = enhanceLevel > 0 ? `${name} +${enhanceLevel}` : name;

    const tooltip = document.createElement('div');
    tooltip.className = 'item-tooltip';
    tooltip.innerHTML = `
        <div class="item-tooltip-name">${icon} ${displayName}</div>
        ${enhanceLevel > 0 ? `<div class="item-tooltip-row item-tooltip-enhance"><span>强化等级</span><span class="enhance-level">+${enhanceLevel}</span></div>` : ''}
        ${toolEffect ? `<div class="item-tooltip-row item-tooltip-effect"><span>效果</span><span class="tool-effect">${toolEffect}</span></div>` : ''}
        <div class="item-tooltip-row"><span>数量</span><span class="item-count-value">${count}</span></div>
        <div class="item-tooltip-row"><span>单价</span><span class="item-price-value">${price > 0 ? price : '不可出售'}</span></div>
        <div class="item-tooltip-desc">${desc}</div>
        ${isTool && !isEquipped ? `<button class="item-equip-btn" data-id="${id}">装备</button>` : ''}
        ${isEquipped ? `<button class="item-unequip-btn" data-slot="${equipSlot}">卸下</button>` : ''}
    `;

    document.body.appendChild(tooltip);

    // 计算位置：显示在物品卡片上方
    const rect = item.getBoundingClientRect();
    const tooltipRect = tooltip.getBoundingClientRect();

    let left = rect.left + rect.width / 2 - tooltipRect.width / 2;
    let top = rect.top - tooltipRect.height - 8;

    // 如果上方空间不足，显示在下方
    if (top < 10) {
        top = rect.bottom + 8;
    }

    // 如果左侧超出屏幕
    if (left < 10) {
        left = 10;
    }

    // 如果右侧超出屏幕
    if (left + tooltipRect.width > window.innerWidth - 10) {
        left = window.innerWidth - tooltipRect.width - 10;
    }

    tooltip.style.left = left + 'px';
    tooltip.style.top = top + 'px';

    // 点击其他地方关闭
    const closeTooltip = (e) => {
        if (!tooltip.contains(e.target) && !item.contains(e.target)) {
            tooltip.remove();
            document.removeEventListener('click', closeTooltip);
            document.removeEventListener('mouseleave', closeTooltip);
        }
    };
    
    // 鼠标离开物品时关闭（用于悬浮显示）
    const closeOnLeave = (e) => {
        // 检查鼠标是否离开了物品和tooltip
        if (!item.contains(e.relatedTarget) && !tooltip.contains(e.relatedTarget)) {
            tooltip.remove();
            item.removeEventListener('mouseleave', closeOnLeave);
            document.removeEventListener('click', closeTooltip);
        }
    };
    
    setTimeout(() => {
        document.addEventListener('click', closeTooltip);
        // 监听鼠标离开物品
        item.addEventListener('mouseleave', closeOnLeave);
    }, 10);

    // 绑定装备按钮
    const equipBtn = tooltip.querySelector('.item-equip-btn');
    if (equipBtn) {
        equipBtn.addEventListener('click', () => {
            // 确定装备槽位
            let slotType = null;
            if (id.includes('axe')) slotType = 'axe';
            else if (id.includes('pickaxe')) slotType = 'pickaxe';
            else if (id.includes('chisel')) slotType = 'chisel';
            else if (id.includes('needle')) slotType = 'needle';
            else if (id.includes('scythe')) slotType = 'scythe';
            else if (id.includes('hammer')) slotType = 'hammer';
            else if (id.includes('tongs')) slotType = 'tongs';
            else if (id.includes('rod')) slotType = 'rod';

            if (slotType) {
                // 关闭提示卡片，打开装备选择弹窗
                // openEquipModal 已经正确处理工具索引和堆叠
                tooltip.remove();
                openEquipModal(slotType);
            }
        });
    }

    // 绑定卸下按钮
    const unequipBtn = tooltip.querySelector('.item-unequip-btn');
    if (unequipBtn) {
        unequipBtn.addEventListener('click', () => {
            const slotType = unequipBtn.dataset.slot;
            if (slotType) {
                socket.emit('unequip_tool', { slotType });
                tooltip.remove();
            }
        });
    }
}

/**
 * 显示装备替换确认卡片
 */
function showEquipReplaceConfirm(slotType, newToolId, newToolName, currentToolName) {
    const modal = document.createElement('div');
    modal.className = 'action-modal-overlay';
    modal.innerHTML = `
        <div class="confirm-dialog">
            <div class="confirm-dialog-title">⚠️ 替换装备</div>
            <div class="confirm-dialog-content">
                <div style="text-align: center; padding: 10px;">
                    <div style="margin-bottom: 8px; color: #A0B2C0;">当前装备：<strong style="color: #E8C57F;">${currentToolName}</strong></div>
                    <div style="margin-bottom: 8px;">↓</div>
                    <div style="color: #A0B2C0;">替换为：<strong style="color: #4CAF50;">${newToolName}</strong></div>
                </div>
            </div>
            <div class="confirm-dialog-footer">
                <button class="dialog-btn secondary" id="equip-cancel">取消</button>
                <button class="dialog-btn primary" id="equip-confirm">确认替换</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    modal.querySelector('#equip-cancel').addEventListener('click', () => modal.remove());
    modal.querySelector('#equip-confirm').addEventListener('click', () => {
        socket.emit('equip_tool', { slotType, toolId: newToolId });
        modal.remove();
    });
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove();
    });
}

/**
 * 隐藏物品详情弹出卡片
 */
function hideItemTooltip(item) {
    const tooltip = document.querySelector('.item-tooltip');
    if (tooltip) tooltip.remove();
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
 * 显示行动弹窗中的物品详情卡片
 */
function showActionItemTooltip(item, event, modal) {
    // 移除已有的弹出卡片
    document.querySelectorAll('.item-tooltip').forEach(t => t.remove());
    
    const itemId = item.dataset.itemId;
    const itemType = item.dataset.itemType;
    const itemName = item.dataset.itemName;
    const itemIcon = item.dataset.itemIcon;
    
    // 获取已拥有数量
    let ownedCount = 0;
    if (itemType === 'WOOD') {
        ownedCount = gameState?.woodcuttingInventory?.[itemId] || 0;
    } else if (itemType === 'TOKEN') {
        ownedCount = gameState?.tokensInventory?.[itemId] || 0;
    } else if (itemType === 'ORE') {
        ownedCount = gameState?.miningInventory?.[itemId] || 0;
    } else if (itemType === 'GATHERING') {
        ownedCount = gameState?.gatheringInventory?.[itemId] || 0;
    } else if (itemType === 'PLANK') {
        ownedCount = gameState?.planksInventory?.[itemId] || 0;
    } else if (itemType === 'INGOT') {
        ownedCount = gameState?.ingotsInventory?.[itemId] || 0;
    } else if (itemType === 'FABRIC') {
        ownedCount = gameState?.fabricsInventory?.[itemId] || 0;
    } else if (itemType === 'POTION') {
        ownedCount = gameState?.potionsInventory?.[itemId] || 0;
    } else if (itemType === 'BREW') {
        ownedCount = gameState?.brewsInventory?.[itemId] || 0;
    }
    
    // 获取单价（代币固定50）
    let price = 0;
    if (itemType === 'TOKEN') {
        price = 50;
    } else {
        price = getItemSellPrice(itemId);
    }
    
    const tooltip = document.createElement('div');
    tooltip.className = 'item-tooltip';
    tooltip.style.position = 'fixed';
    tooltip.dataset.tooltipItemId = itemId;
    tooltip.dataset.tooltipItemType = itemType;
    tooltip.innerHTML = `
        <div class="item-tooltip-name">${itemIcon} ${itemName}</div>
        <div class="item-tooltip-row"><span>数量</span><span class="item-count-value">${ownedCount}</span></div>
        <div class="item-tooltip-row"><span>单价</span><span class="item-price-value">${price}</span></div>
    `;
    
    document.body.appendChild(tooltip);
    
    // 获取尺寸后定位
    const itemRect = item.getBoundingClientRect();
    const tooltipRect = tooltip.getBoundingClientRect();
    
    // 水平居中于物品
    let left = itemRect.left + (itemRect.width / 2) - (tooltipRect.width / 2);
    // 垂直在物品上方
    let top = itemRect.top - tooltipRect.height - 8;
    
    // 边界检查
    left = Math.max(10, Math.min(left, window.innerWidth - tooltipRect.width - 10));
    if (top < 10) top = itemRect.bottom + 8;
    
    tooltip.style.left = `${left}px`;
    tooltip.style.top = `${top}px`;
    
    // 存储关联的元素引用，用于实时更新
    tooltip._sourceItem = item;
    
    // 鼠标离开时关闭
    const closeTooltip = (e) => {
        if (!item.contains(e.relatedTarget) && !tooltip.contains(e.relatedTarget)) {
            tooltip.remove();
            item.removeEventListener('mouseleave', closeTooltip);
            document.removeEventListener('click', closeTooltip);
        }
    };
    
    item.addEventListener('mouseleave', closeTooltip);
    setTimeout(() => document.addEventListener('click', closeTooltip), 10);
}

/**
 * 显示行动选择模态框（新样式）
 */
function showActionModal(config) {
    // 检查队列状态
    const currentQueue = gameState?.actionQueue || [];
    const maxQueueSize = 2;
    const currentAction = gameState?.activeAction;
    const queueAvailable = currentQueue.length < maxQueueSize;
    const queuePosition = currentQueue.length + 1;

    // 检查等级是否足够
    const levelKey = {
        WOODCUTTING: 'woodcuttingLevel',
        MINING: 'miningLevel',
        GATHERING: 'gatheringLevel',
        CRAFTING: 'craftingLevel',
        FORGING: 'forgingLevel',
        TAILORING: 'tailoringLevel',
        ALCHEMY: 'alchemyLevel',
        BREWING: 'brewingLevel',
        ESSENCE: 'alchemyLevel'
    }[pendingAction?.type] || 'woodcuttingLevel';
    const currentLevel = gameState?.[levelKey] || 1;
    const levelEnough = currentLevel >= (config.reqLevel || 1);

    // 获取行动类型信息
    const typeInfo = {
        WOODCUTTING: { icon: '🪓', name: '伐木' },
        MINING: { icon: '⛏️', name: '挖矿' },
        GATHERING: { icon: '🌿', name: '采集' },
        CRAFTING: { icon: '🪵', name: '制作' },
        FORGING: { icon: '🔨', name: '锻造' },
        TAILORING: { icon: '🧵', name: '缝制' },
        BREWING: { icon: '⚗️', name: '酿造' },
        ALCHEMY: { icon: '🔮', name: '炼金' },
        ESSENCE: { icon: '✨', name: '提炼' }
    };
    const actionType = typeInfo[pendingAction?.type] || { icon: '⚔️', name: '行动' };

    // 创建模态框
    const modal = document.createElement('div');
    modal.className = 'action-detail-overlay';
    modal.innerHTML = `
        <div class="action-detail-popup">
            <button class="popup-close-btn">✕</button>
            
            <!-- 标题行 -->
            <div class="popup-header-row">
                <div class="popup-icon-large">${config.icon}</div>
                <div class="popup-name-large">${config.name}</div>
            </div>
            
            <div class="popup-divider"></div>
            
            <!-- 信息区 -->
            <div class="popup-info-rows">
                ${config.reqLevel ? `
                <div class="popup-info-row">
                    <div class="popup-info-label"><span class="lbl-icon">🔓</span>需要</div>
                    <div class="popup-info-val">
                        <span class="popup-badge level ${levelEnough ? '' : 'insufficient'}">Lv.${config.reqLevel} ${actionType.icon}</span>
                        ${!levelEnough ? `<span class="level-warning">（当前 Lv.${currentLevel}）</span>` : ''}
                    </div>
                </div>
                ${config.materials ? Object.entries(config.materials).map(([matId, amount]) => {
                    const matName = getResourceName(matId);
                    const matConfig = getItemConfig(matId);
                    const matIcon = matConfig?.icon || '📦';
                    const have = getResourceCount(matId);
                    const enough = have >= amount;
                    return `
                    <div class="popup-info-row">
                        <div class="popup-info-label"></div>
                        <div class="popup-info-val">
                            <span class="popup-mat-count ${enough ? '' : 'insufficient'}">[${have}/${amount}]</span>
                            <span class="popup-badge material ${enough ? '' : 'insufficient'} item-hover-card" data-item-id="${matId}" data-item-type="WOOD" data-item-name="${matName}" data-item-icon="${matIcon}">${matIcon} ${matName}</span>
                        </div>
                    </div>`;
                }).join('') : ''}
                ` : config.materials ? Object.entries(config.materials).map(([matId, amount]) => {
                    const matName = getResourceName(matId);
                    const matConfig = getItemConfig(matId);
                    const matIcon = matConfig?.icon || '📦';
                    const have = getResourceCount(matId);
                    const enough = have >= amount;
                    return `
                    <div class="popup-info-row">
                        <div class="popup-info-label"><span class="lbl-icon">📦</span>材料</div>
                        <div class="popup-info-val">
                            <span class="popup-mat-count ${enough ? '' : 'insufficient'}">[${have}/${amount}]</span>
                            <span class="popup-badge material ${enough ? '' : 'insufficient'} item-hover-card" data-item-id="${matId}" data-item-type="WOOD" data-item-name="${matName}" data-item-icon="${matIcon}">${matIcon} ${matName}</span>
                        </div>
                    </div>`;
                }).join('') : ''}
                
                <div class="popup-info-row">
                    <div class="popup-info-label"><span class="lbl-icon">📦</span>产出</div>
                    <div class="popup-info-val">
                        ${config.exp ? `<span class="popup-exp-val">${config.exp} exp</span>` : ''}
                        ${pendingAction?.itemId ? (() => {
                            // 采集单个物品
                            const maxCount = getGatheringItemMaxCount(pendingAction.itemId);
                            const dropRange = maxCount === 1 ? '1' : `1-${maxCount}`;
                            return `<br><span class="popup-drop-prefix">${dropRange}</span> <span class="popup-badge drop item-hover-card" data-item-id="${pendingAction.itemId}" data-item-type="GATHERING" data-item-name="${config.name}" data-item-icon="${config.icon}">${config.icon} ${config.name}</span>`;
                        })() : pendingAction?.type === 'GATHERING' && config.items ? (() => {
                            // 区域采集：显示所有可能的物品（每个物品独立30%概率获得）
                            return '<br>' + config.items.map(item => {
                                const maxCount = getGatheringItemMaxCount(item.id);
                                const dropRange = maxCount === 1 ? '1' : `1-${maxCount}`;
                                return `<span class="popup-drop-prefix">${dropRange}</span> <span class="popup-badge drop item-hover-card" data-item-id="${item.id}" data-item-type="GATHERING" data-item-name="${item.name}" data-item-icon="${item.icon}">${item.icon} ${item.name}</span> <span class="popup-drop-prob">30%</span>`;
                            }).join('<br>');
                        })() : ['CRAFTING', 'FORGING', 'TAILORING', 'BREWING', 'ALCHEMY', 'ESSENCE'].includes(pendingAction?.type) ? (() => {
                            // 制作类行动：产出固定物品（数量为1）
                            const itemTypeMap = {CRAFTING:'PLANK',FORGING:'INGOT',TAILORING:'FABRIC',BREWING:'BREW',ALCHEMY:'POTION',ESSENCE:'ESSENCE'};
                            const productIcon = config.icon || '📦';
                            const productName = config.name || pendingAction.id;
                            return `<br><span class="popup-drop-prefix">1</span> <span class="popup-badge drop item-hover-card" data-item-id="${pendingAction.id}" data-item-type="${itemTypeMap[pendingAction.type]}" data-item-name="${productName}" data-item-icon="${productIcon}">${productIcon} ${productName}</span>`;
                        })() : config.dropId ? (() => {
                            const maxCount = config.dropMax || 3;
                            const dropRange = maxCount === 1 ? '1' : `1-${maxCount}`;
                            const itemTypeMap = {WOODCUTTING:'WOOD',MINING:'ORE',GATHERING:'GATHERING',CRAFTING:'PLANK',FORGING:'INGOT',TAILORING:'FABRIC',ALCHEMY:'POTION',BREWING:'BREW'};
                            return `<br><span class="popup-drop-prefix">${dropRange}</span> <span class="popup-badge drop item-hover-card" data-item-id="${config.dropId}" data-item-type="${itemTypeMap[pendingAction?.type] || 'WOOD'}" data-item-name="${getResourceName(config.dropId)}" data-item-icon="${config.dropIcon || '📦'}">${config.dropIcon || '📦'} ${getResourceName(config.dropId)}</span>`;
                        })() : ''}
                    </div>
                </div>
                
                ${['WOODCUTTING', 'MINING', 'GATHERING', 'CRAFTING', 'FORGING', 'TAILORING', 'ALCHEMY', 'BREWING', 'ESSENCE'].includes(pendingAction?.type) ? `
                <div class="popup-info-row">
                    <div class="popup-info-label"><span class="lbl-icon">🪙</span>代币</div>
                    <div class="popup-info-val">
                        <span class="popup-token-prefix">1</span> 
                        <span class="popup-badge token item-hover-card" data-item-id="${{WOODCUTTING:'wood_token',MINING:'mining_token',GATHERING:'gathering_token',CRAFTING:'crafting_token',FORGING:'forging_token',TAILORING:'tailoring_token',ALCHEMY:'alchemy_token',BREWING:'brewing_token',ESSENCE:'gathering_token'}[pendingAction.type]}" data-item-type="TOKEN" data-item-name="${actionType.name}代币" data-item-icon="🪙">${actionType.icon} ${actionType.name}代币</span>
                        <span class="popup-token-prob">~${getTokenChance(pendingAction?.type, config.reqLevel)}%</span>
                    </div>
                </div>
                ` : ''}
                
                ${config.duration ? `
                <div class="popup-info-row">
                    <div class="popup-info-label"><span class="lbl-icon">⏱️</span>持续时间</div>
                    <div class="popup-info-val">
                        <span class="popup-highlight">${formatTime(config.duration)}</span>
                    </div>
                </div>
                ` : ''}
            </div>
            
            <div class="popup-divider"></div>
            
            <!-- 次数选择 -->
            <div class="popup-count-section">
                <div class="popup-count-label">${actionType.icon} ${actionType.name}</div>
                <div class="popup-count-row">
                    <input class="popup-count-input" type="text" value="∞" placeholder="次数" onclick="this.select();">
                    <div class="popup-count-btns">
                        <button class="popup-count-btn" data-count="1">1</button>
                        <button class="popup-count-btn" data-count="10">10</button>
                        <button class="popup-count-btn" data-count="100">100</button>
                        <button class="popup-count-btn inf selected" data-count="infinity">∞</button>
                    </div>
                </div>
            </div>
            
            <!-- 操作按钮 -->
            <div class="popup-actions-row">
                <button class="popup-btn cancel" id="action-cancel">取消</button>
                ${queueAvailable ?
                    `<button class="popup-btn queue" id="action-queue">加入队列 #${queuePosition}</button>` :
                    `<button class="popup-btn queue disabled" id="action-queue" disabled>队列已满</button>`}
                ${levelEnough ?
                    `<button class="popup-btn start" id="action-start">立即开始</button>` :
                    `<button class="popup-btn start disabled" id="action-start" disabled>等级不足</button>`}
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // 关闭函数
    const closeModal = () => {
        modal.remove();
        pendingAction = null;
    };

    // 绑定关闭事件
    modal.querySelector('.popup-close-btn').addEventListener('click', closeModal);
    modal.querySelector('#action-cancel').addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });

    // 次数选择按钮
    modal.querySelectorAll('.popup-count-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            modal.querySelectorAll('.popup-count-btn').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            const countVal = btn.dataset.count;
            const input = modal.querySelector('.popup-count-input');
            if (countVal === 'infinity') {
                input.value = '∞';
            } else {
                input.value = countVal;
            }
        });
    });

    // 输入框事件
    const countInput = modal.querySelector('.popup-count-input');
    countInput.addEventListener('input', () => {
        let val = countInput.value;
        
        // 只允许数字和∞
        if (val !== '∞' && val !== '') {
            // 移除非数字字符
            val = val.replace(/[^0-9]/g, '');
            countInput.value = val;
        }
        
        modal.querySelectorAll('.popup-count-btn').forEach(b => b.classList.remove('selected'));
        if (val === '∞') {
            modal.querySelector('.popup-count-btn[data-count="infinity"]').classList.add('selected');
        } else {
            const num = parseInt(val);
            if ([1, 10, 100].includes(num)) {
                modal.querySelector(`.popup-count-btn[data-count="${num}"]`)?.classList.add('selected');
            }
        }
    });

    // 获取次数
    const getCount = () => {
        const val = countInput.value;
        if (val === '∞' || val === '-1' || val === '') return -1;
        return parseInt(val) || 1;
    };

    // 加入队列按钮
    const queueBtn = modal.querySelector('#action-queue');
    if (queueBtn && !queueBtn.disabled) {
        queueBtn.addEventListener('click', () => {
            if (pendingAction) {
                console.log('📤 加入队列:', { type: pendingAction.type, id: pendingAction.id, itemId: pendingAction.itemId, count: getCount() });
                socket.emit('action_start', {
                    type: pendingAction.type,
                    id: pendingAction.id,
                    count: getCount(),
                    itemId: pendingAction.itemId  // 采集品需要 itemId
                });
            }
            closeModal();
        });
    }

    // 立即开始按钮
    modal.querySelector('#action-start').addEventListener('click', () => {
        const count = getCount();

        // 检查是否有正在进行的行动
        if (currentAction) {
            // 显示确认替换卡片
            showStartImmediatelyConfirm(pendingAction, count, currentAction, currentQueue);
        } else {
            // 没有正在进行的行动，直接开始
            if (pendingAction) {
                console.log('📤 立即开始:', { type: pendingAction.type, id: pendingAction.id, itemId: pendingAction.itemId, count: count });
                socket.emit('action_start', {
                    type: pendingAction.type,
                    id: pendingAction.id,
                    count: count,
                    itemId: pendingAction.itemId  // 采集品需要 itemId
                });
            }
            closeModal();
        }
    });
    
    // 为产出和代币绑定悬浮/点击事件显示详情卡片
    modal.querySelectorAll('.item-hover-card').forEach(item => {
        item.addEventListener('mouseenter', (e) => showActionItemTooltip(item, e, modal));
        item.addEventListener('click', (e) => {
            e.stopPropagation();
            showActionItemTooltip(item, e, modal);
        });
    });
}

/**
 * 显示立即开始确认卡片
 */
function showStartImmediatelyConfirm(newAction, count, currentAction, currentQueue) {
    const actionConfig = getActionConfig(currentAction.type, currentAction.id);
    const currentName = actionConfig?.name || '当前行动';
    const newName = newAction?.name || '新行动';

    let queueInfo = '';
    if (currentQueue.length > 0) {
        queueInfo = `<p style="color: #A0B2C0; font-size: 0.8rem; margin-top: 10px;">⚠️ 队列中的 ${currentQueue.length} 个行动也将被清空</p>`;
    }

    const modal = document.createElement('div');
    modal.className = 'action-modal-overlay';
    modal.innerHTML = `
        <div class="confirm-dialog">
            <div class="confirm-dialog-title">⚠️ 立即开始将清空当前行动</div>
            <div class="confirm-dialog-content">
                <div class="confirm-dialog-compare">
                    <div class="confirm-dialog-item">
                        <span class="confirm-dialog-icon" style="opacity: 0.5;">${actionConfig?.icon || '🔧'}</span>
                        <span class="confirm-dialog-name" style="opacity: 0.5;">${currentName}</span>
                    </div>
                    <span class="confirm-dialog-arrow">→</span>
                    <div class="confirm-dialog-item">
                        <span class="confirm-dialog-icon">${newAction?.icon || '🔧'}</span>
                        <span class="confirm-dialog-name">${newName}</span>
                    </div>
                </div>
                ${queueInfo}
            </div>
            <div class="confirm-dialog-footer">
                <button class="dialog-btn secondary" id="start-cancel">取消</button>
                <button class="dialog-btn danger" id="start-confirm">确认开始</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    modal.querySelector('#start-cancel').addEventListener('click', () => {
        modal.remove();
    });

    modal.querySelector('#start-confirm').addEventListener('click', () => {
        if (newAction) {
            console.log('📤 立即开始确认:', { type: newAction.type, id: newAction.id, itemId: newAction.itemId, count: count });
            socket.emit('start_immediately', {
                type: newAction.type,
                id: newAction.id,
                count: count,
                itemId: newAction.itemId  // 采集品需要 itemId
            });
        }
        modal.remove();
        // 关闭行动选择卡片
        const actionModal = document.querySelector('.action-modal-overlay');
        if (actionModal) actionModal.remove();
        pendingAction = null;
    });

    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
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
        { label: '加青杉木板 100', command: 'add_item', args: { itemType: 'PLANK', itemId: 'pine_plank', count: 100 } },
        { label: '加青闪矿 100', command: 'add_item', args: { itemType: 'ORE', itemId: 'cyan_ore', count: 100 } },
        { label: '加青闪锭 100', command: 'add_item', args: { itemType: 'INGOT', itemId: 'cyan_ingot', count: 100 } },
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
 * 格式化花费（资源名称转中文）
 */
function formatCost(cost, separator = ' ') {
    const resourceNames = {
        // 金币
        'gold': '金币',

        // 木材类
        'pine': '青杉木',
        'iron_birch': '铁桦木',
        'wind_tree': '风啸木',
        'flame_tree': '焰心木',
        'frost_maple': '霜叶枫木',
        'thunder_tree': '雷鸣木',
        'ancient_oak': '古橡木',
        'world_tree': '世界树枝',

        // 木板类
        'pine_plank': '青杉木板',
        'iron_birch_plank': '铁桦木板',
        'wind_tree_plank': '风啸木板',
        'flame_tree_plank': '焰心木板',
        'frost_maple_plank': '霜叶枫木板',
        'thunder_tree_plank': '雷鸣木板',
        'ancient_oak_plank': '古橡木板',
        'world_tree_plank': '世界树木板',

        // 矿石类
        'cyan_ore': '青闪石',
        'red_iron': '赤铁石',
        'feather_ore': '羽石',
        'hell_ore': '白鸠石',
        'white_ore': '狱炎石',
        'thunder_ore': '雷鸣石',
        'brilliant': '璀璨原石',
        'star_ore': '星辉原石',

        // 矿锭类
        'cyan_ingot': '青闪锭',
        'red_copper_ingot': '赤铜锭',
        'feather_ingot': '羽石锭',
        'white_silver_ingot': '白银锭',
        'hell_steel_ingot': '白鸠钢锭',
        'thunder_steel_ingot': '雷鸣钢锭',
        'brilliant_crystal': '璀璨水晶',
        'star_crystal': '星辉水晶',

        // 布料类
        'jute_cloth': '黄麻布料',
        'linen_cloth': '亚麻布料',
        'wool_cloth': '羊毛布料',
        'silk_cloth': '丝绸布料',
        'wind_silk': '风丝绸',
        'dream_cloth': '梦幻布料',

        // 采集物类
        'sweet_berry': '甜浆果',
        'wild_mint': '野薄荷',
        'honey': '蜂蜜',
        'blood_rose': '血蔷薇',
        'jute': '黄麻',
        'wheat': '小麦',
        'pine_needle': '松针',
        'star_dew_herb': '星露草',
        'flax': '亚麻',
        'feather': '羽毛',
        'hops': '啤酒花',
        'vanilla': '香草',
        'blossom_honey': '花蜜',
        'red_serpent_fruit': '红蛇果',
        'jade_feather': '翡翠羽',
        'apple': '苹果',
        'sage': '鼠尾草',
        'moonlight_mushroom': '月光菇',
        'wool': '羊毛',
        'falcon_tail_feather': '隼尾羽',
        'silk': '丝绸原料'
    };

    return Object.entries(cost)
        .map(([res, amount]) => `${resourceNames[res] || res} × ${amount}`)
        .join(separator);
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

/**
 * 显示强化成功奖励
 */
function showEnhanceReward(icon, name, level, exp) {
    if (elements.actionRewards) {
        elements.actionRewards.innerHTML = `<span class="action-reward-item">${icon} ${name} +${level}</span>`;

        // 3秒后淡出
        setTimeout(() => {
            if (elements.actionRewards) {
                elements.actionRewards.innerHTML = '';
            }
        }, 3000);
    }

    // 显示经验
    if (exp) {
        showToast(`✨ +${exp} 锻造经验`);
    }
}

// ============ 游戏循环 ============

// ============ 产出预览工具提示 ============

let outputTooltipTimeout = null;

function showOutputTooltip(event) {
    const outputEl = event.target.closest('#enhance-output');
    if (!outputEl) return;

    const toolId = outputEl.dataset.toolId;
    if (!toolId || toolId === '') return;  // 没有选中工具则不显示

    clearTimeout(outputTooltipTimeout);

    const toolName = outputEl.dataset.toolName;
    const toolIcon = outputEl.dataset.toolIcon;
    const targetLevel = parseInt(outputEl.dataset.targetLevel) || 0;
    const tier = parseInt(outputEl.dataset.tier) || 1;

    // 获取工具配置
    const toolTypes = ['axes', 'pickaxes', 'chisels', 'needles', 'scythes', 'hammers', 'tongs', 'rods'];
    let toolConfig = null;
    let toolType = null;

    for (const type of toolTypes) {
        const config = CONFIG.tools?.[type]?.find(t => t.id === toolId);
        if (config) {
            toolConfig = config;
            toolType = type;
            break;
        }
    }

    if (!toolConfig) return;

    // 计算速度加成
    const baseBonus = toolConfig.speedBonus || 0;
    let totalBonus = baseBonus;

    if (targetLevel > 0 && CONFIG.enhanceConfig?.bonusTable) {
        const enhanceBonus = CONFIG.enhanceConfig.bonusTable[targetLevel] || 0;
        totalBonus = baseBonus * (1 + enhanceBonus);
    }

    // 移除已有的 tooltip
    document.querySelectorAll('.enhance-output-tooltip').forEach(t => t.remove());

    // 创建 tooltip
    const tooltip = document.createElement('div');
    tooltip.className = 'enhance-output-tooltip';
    tooltip.innerHTML = `
        <div class="enhance-output-tooltip-title">${toolIcon} ${toolName} ${targetLevel > 0 ? '+' + targetLevel : ''}</div>
        <div class="enhance-output-tooltip-row">
            <span class="label">品质等级</span>
            <span class="value">${tier}阶</span>
        </div>
        <div class="enhance-output-tooltip-row">
            <span class="label">速度加成</span>
            <span class="value">+${Math.round(totalBonus * 100)}%</span>
        </div>
        ${targetLevel > 0 ? `
        <div class="enhance-output-tooltip-row">
            <span class="label">强化加成</span>
            <span class="value">+${Math.round((totalBonus - baseBonus) * 100)}%</span>
        </div>
        ` : ''}
        ${toolConfig.reqEquipLevel ? `
        <div class="enhance-output-tooltip-row">
            <span class="label">需求等级</span>
            <span class="value">Lv.${toolConfig.reqEquipLevel}</span>
        </div>
        ` : ''}
    `;

    document.body.appendChild(tooltip);

    // 定位 tooltip - 在产出预览上方居中
    const rect = outputEl.getBoundingClientRect();
    const tooltipRect = tooltip.getBoundingClientRect();

    // 计算居中位置
    let left = rect.left + rect.width / 2 - tooltipRect.width / 2;
    let top = rect.top - tooltipRect.height - 8;

    // 边界检查
    if (left < 10) left = 10;
    if (left + tooltipRect.width > window.innerWidth - 10) {
        left = window.innerWidth - tooltipRect.width - 10;
    }
    if (top < 10) {
        // 上方空间不足，显示在下方
        top = rect.bottom + 8;
    }

    tooltip.style.left = `${left}px`;
    tooltip.style.top = `${top}px`;

    // 点击事件时，点击其他地方关闭
    if (event.type === 'click') {
        setTimeout(() => {
            document.addEventListener('click', function closeTooltip(e) {
                if (!tooltip.contains(e.target) && !outputEl.contains(e.target)) {
                    tooltip.remove();
                    document.removeEventListener('click', closeTooltip);
                }
            });
        }, 100);
    }
}

function hideOutputTooltip() {
    outputTooltipTimeout = setTimeout(() => {
        document.querySelectorAll('.enhance-output-tooltip').forEach(t => t.remove());
    }, 200);
}

function gameLoop() {
    if (gameState?.activeAction) {
        updateActionStatusBar();
        // 更新当前行动页进度
        const currentSubpage = document.getElementById('enhance-subpage-current-action');
        if (currentSubpage && currentSubpage.classList.contains('active')) {
            updateCurrentActionProgress();
        }
    }
    requestAnimationFrame(gameLoop);
}

// ============ 强化系统 ============

let enhanceState = {
    selectedTool: null,
    toolType: null,
    toolIndex: null,
    protection: null,
    protectionIcon: null,  // 保护垫图标
    protectionStartLevel: 2
};

/**
 * 渲染强化页面
 */
function renderEnhance() {
    const toolSelect = document.getElementById('enhance-tool-select');

    if (!toolSelect) return;

    // 更新锻造经验条（强化使用锻造技能）
    updateEnhanceForgingExp();

    // 初始化二级菜单
    initEnhanceTabs();

    // 如果没有选中工具，清空显示
    if (!enhanceState.selectedTool) {
        // 清空费用列表
        const feesListEl = document.getElementById('enhance-fees-list');
        if (feesListEl) {
            feesListEl.innerHTML = `
                <div class="fee-item">
                    <span class="fee-icon">🪙</span>
                    <span class="fee-name">金币</span>
                    <span class="fee-count">--</span>
                </div>
            `;
        }

        // 清空经验和成功率
        const expEl = document.getElementById('enhance-exp');
        const rateEl = document.getElementById('enhance-success-rate');
        if (expEl) expEl.textContent = '--';
        if (rateEl) {
            rateEl.textContent = '--%';
            rateEl.classList.remove('rate-low', 'rate-medium', 'rate-high');
        }

        // 清空产出预览
        const outputIconEl = document.getElementById('enhance-output-icon');
        const outputBadgeEl = document.getElementById('enhance-output-badge');
        if (outputIconEl) outputIconEl.textContent = '-';
        if (outputBadgeEl) outputBadgeEl.style.display = 'none';
    }

    // 自动选择装备逻辑（如果还没有选中）
    if (!enhanceState.selectedTool) {
        autoSelectEnhanceTool();
    }

    // 点击选择装备
    toolSelect.onclick = () => openEnhanceToolModal();

    // 目标等级输入
    const targetInput = document.getElementById('enhance-target-level');
    if (targetInput) {
        targetInput.oninput = () => updateEnhancePreview();
        // 点击时全选
        targetInput.onfocus = () => targetInput.select();
    }

    // 强化次数输入
    const countInput = document.getElementById('enhance-count');
    if (countInput) {
        countInput.oninput = () => {
            // 更新快捷按钮状态
            updateCountButtonsState(countInput.value);
            validateEnhanceButtons();
        };
        // 点击时全选
        countInput.onfocus = () => countInput.select();
    }

    // 强化次数快捷按钮
    const countBtns = document.querySelectorAll('.count-btn');
    countBtns.forEach(btn => {
        btn.onclick = () => {
            const val = btn.dataset.val;
            // 清除所有选中状态
            countBtns.forEach(b => b.classList.remove('selected', 'is-inf'));
            // 设置当前选中
            btn.classList.add('selected');
            if (val === 'inf') btn.classList.add('is-inf');
            // 更新输入框值
            countInput.value = (val === 'inf') ? '∞' : val;
            validateEnhanceButtons();
        };
    });

    // 保护起始等级输入
    const protectionStartInput = document.getElementById('enhance-protection-start');
    if (protectionStartInput) {
        protectionStartInput.oninput = () => {
            enhanceState.protectionStartLevel = parseInt(protectionStartInput.value) || 2;
            validateEnhanceButtons();
        };
        // 点击时全选
        protectionStartInput.onfocus = () => protectionStartInput.select();
    }

    // 保护垫选择
    const protectionSlot = document.getElementById('enhance-protection-slot');
    if (protectionSlot) {
        protectionSlot.onclick = () => openProtectionSelectModal();
    }

    // 问号符点击和悬停弹出卡片
    const helpIcon = document.getElementById('enhance-protection-help');
    if (helpIcon) {
        // 鼠标悬停显示
        helpIcon.addEventListener('mouseenter', (e) => {
            showProtectionHelpPopover(helpIcon, true);
        });
        // 鼠标离开时关闭（如果是hover模式）
        helpIcon.addEventListener('mouseleave', (e) => {
            const popover = document.getElementById('protection-help-popover');
            if (popover && popover.dataset.mode === 'hover') {
                // 延迟关闭，给用户时间移动到弹出卡片上
                setTimeout(() => {
                    if (!helpIcon.matches(':hover') && !popover.matches(':hover')) {
                        popover.remove();
                    }
                }, 100);
            }
        });
        // 点击显示（点击后需要再点击关闭）
        helpIcon.addEventListener('click', (e) => {
            e.stopPropagation();
            showProtectionHelpPopover(helpIcon, false);
        });
    }

    // 开始强化按钮
    const startBtn = document.getElementById('enhance-start-btn');
    if (startBtn) {
        startBtn.onclick = () => startEnhance();
    }

    // 添加到队列按钮
    const queueBtn = document.getElementById('enhance-queue-btn');
    if (queueBtn) {
        queueBtn.onclick = () => addToEnhanceQueue();
        // 更新按钮文本显示队列长度
        const queueLength = gameState?.actionQueue?.length || 0;
        queueBtn.textContent = queueLength > 0 ? `添加到队列 #${queueLength + 1}` : '添加到队列';
    }

    // 如果已有选中的工具，更新显示
    if (enhanceState.selectedTool) {
        updateEnhanceToolDisplay();
        updateEnhancePreview();
    }

    // 更新当前行动页面
    updateCurrentActionPage();

    // 停止按钮
    const stopBtn = document.getElementById('current-stop-btn');
    if (stopBtn) {
        stopBtn.onclick = () => stopEnhance();
    }
}

/**
 * 初始化强化二级菜单
 */
function initEnhanceTabs() {
    const tabs = document.querySelectorAll('.enhance-tab');
    tabs.forEach(tab => {
        tab.onclick = () => {
            // 切换标签激活状态
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            // 切换子页面
            const tabName = tab.dataset.tab;
            document.querySelectorAll('.enhance-subpage').forEach(page => {
                page.classList.remove('active');
            });
            const subpage = document.getElementById(`enhance-subpage-${tabName}`);
            if (subpage) {
                subpage.classList.add('active');
            }

            // 如果切换到当前行动页，更新内容
            if (tabName === 'current-action') {
                updateCurrentActionPage();
            }
        };
    });
}

/**
 * 更新当前行动页面
 */
function updateCurrentActionPage() {
    const emptyEl = document.getElementById('current-action-empty');
    const contentEl = document.getElementById('current-action-content');

    if (!emptyEl || !contentEl) return;

    const activeAction = gameState?.activeAction;

    if (!activeAction || activeAction.type !== 'ENHANCE') {
        // 没有强化行动
        emptyEl.style.display = 'flex';
        contentEl.style.display = 'none';
        return;
    }

    // 有强化行动，显示详细信息
    emptyEl.style.display = 'none';
    contentEl.style.display = 'block';

    // 获取工具信息
    const toolType = activeAction.toolType;
    const toolIndex = activeAction.toolIndex;
    const toolsKey = getToolsKey(toolType);
    const tools = gameState.toolsInventory?.[toolsKey] || [];

    let toolConfig = null;
    let currentLevel = 0;
    let toolId = null;

    if (toolIndex >= 0 && toolIndex < tools.length) {
        const tool = tools[toolIndex];
        toolId = typeof tool === 'string' ? tool : tool.id;
        currentLevel = typeof tool === 'object' && tool ? (tool.enhanceLevel || 0) : 0;
        toolConfig = CONFIG.tools[toolsKey]?.find(t => t.id === toolId);

        // 显示工具图标和等级
        const iconEl = document.getElementById('current-tool-icon');
        const badgeEl = document.getElementById('current-tool-level-badge');
        if (iconEl) {
            iconEl.textContent = toolConfig?.icon || '🔧';
            iconEl.style.display = 'flex';
        }
        if (badgeEl) {
            badgeEl.textContent = currentLevel > 0 ? `+${currentLevel}` : '';
            badgeEl.style.display = currentLevel > 0 ? 'block' : 'none';
        }
    }

    // 目标等级（显示当前目标等级，即当前等级+1）
    const targetLevelEl = document.getElementById('current-target-level');
    if (targetLevelEl) {
        targetLevelEl.textContent = activeAction.targetLevel ? `+${activeAction.targetLevel}` : '--';
    }

    // 剩余次数
    const remainingEl = document.getElementById('current-remaining');
    if (remainingEl) {
        const remaining = activeAction.remaining || activeAction.count || 1;
        const isInfinite = activeAction.isInfinite || remaining < 0;
        remainingEl.textContent = isInfinite ? '∞' : remaining;
    }

    // 成功率（使用当前等级计算）
    const rateEl = document.getElementById('current-success-rate');
    if (rateEl) {
        const successRate = getEnhanceSuccessRate(currentLevel);
        rateEl.textContent = `${(successRate * 100).toFixed(0)}%`;

        // 设置颜色
        rateEl.classList.remove('rate-low', 'rate-medium', 'rate-high');
        const ratePercent = successRate * 100;
        if (ratePercent < 30) {
            rateEl.classList.add('rate-low');
        } else if (ratePercent <= 60) {
            rateEl.classList.add('rate-medium');
        } else {
            rateEl.classList.add('rate-high');
        }
    }

    // 产出预览（显示当前等级+1）
    const outputIconEl = document.getElementById('current-output-icon');
    const outputBadgeEl = document.getElementById('current-output-badge');
    if (outputIconEl && toolConfig) {
        outputIconEl.textContent = toolConfig.icon || '-';
    }
    if (outputBadgeEl) {
        // 产出预览显示当前等级+1
        const nextLevel = currentLevel + 1;
        outputBadgeEl.style.display = 'block';
        outputBadgeEl.textContent = `+${nextLevel}`;
    }

    // 更新费用显示
    updateCurrentFees(toolId, toolType);

    // 更新进度条
    updateCurrentActionProgress();
}

/**
 * 更新当前行动的费用显示
 */
function updateCurrentFees(toolId, toolType) {
    const feesListEl = document.getElementById('current-fees-list');
    if (!feesListEl || !toolId) return;

    // 获取强化配置
    const enhanceConfig = CONFIG?.enhanceConfig || {};
    const tier = getToolTier(toolId);

    // 获取剩余次数
    const activeAction = gameState?.activeAction;
    const remaining = activeAction?.remaining || 1;
    const isInfinite = activeAction?.isInfinite || remaining < 0;

    // 计算金币消耗（使用goldCost配置）
    const goldCostPerAction = enhanceConfig.goldCost?.[tier] || 20;
    const goldCostTotal = isInfinite ? goldCostPerAction : goldCostPerAction * remaining;

    // 构建费用列表
    let html = `
        <div class="fee-item">
            <span class="fee-icon">🪙</span>
            <span class="fee-name">金币</span>
            <span class="fee-count">${isInfinite ? goldCostPerAction : `${goldCostTotal} / ${goldCostPerAction}`}</span>
        </div>
    `;

    // 检查是否是锤子（hammer/tongs使用矿锭）
    const isHammer = toolType === 'hammer' || toolType === 'tongs';

    // 材料中文名称映射
    const materialNames = {
        'cyan_ingot': '青闪锭', 'red_copper_ingot': '赤铜锭', 'feather_ingot': '羽铁锭',
        'white_silver_ingot': '白银锭', 'hell_steel_ingot': '狱炎钢锭', 'thunder_steel_ingot': '雷鸣钢锭',
        'cyan_ore': '青闪矿', 'red_iron': '赤铁矿', 'feather_ore': '羽石矿',
        'pine_plank': '青杉木板', 'iron_birch_plank': '铁桦木板', 'wind_tree_plank': '风啸木板'
    };

    if (isHammer) {
        // 锤子使用矿锭
        const hammerCost = enhanceConfig.hammerMaterialCost?.[tier];
        if (hammerCost?.ingot) {
            // 根据tier确定矿锭类型
            const ingotTypes = {
                1: 'cyan_ingot', 2: 'red_copper_ingot', 3: 'feather_ingot',
                4: 'white_silver_ingot', 5: 'hell_steel_ingot', 6: 'thunder_steel_ingot',
                7: 'brilliant_crystal', 8: 'star_crystal'
            };
            const ingotType = ingotTypes[tier] || 'cyan_ingot';
            const name = materialNames[ingotType] || ingotType;
            const costPer = hammerCost.ingot;
            const costTotal = isInfinite ? costPer : costPer * remaining;
            html += `
                <div class="fee-item">
                    <span class="fee-icon">🔩</span>
                    <span class="fee-name">${name}</span>
                    <span class="fee-count">${isInfinite ? costPer : `${costTotal} / ${costPer}`}</span>
                </div>
            `;
        }
    } else {
        // 非锤子使用矿石和木板
        const materialCost = enhanceConfig.materialCost?.[tier];
        if (materialCost) {
            // 矿石
            if (materialCost.ore) {
                // 根据tier确定矿石类型
                const oreTypes = {
                    1: 'cyan_ore', 2: 'red_iron', 3: 'feather_ore',
                    4: 'white_ore', 5: 'hell_ore', 6: 'thunder_ore',
                    7: 'brilliant', 8: 'star_ore'
                };
                const oreType = oreTypes[tier] || 'cyan_ore';
                const name = materialNames[oreType] || oreType;
                const costPer = materialCost.ore;
                const costTotal = isInfinite ? costPer : costPer * remaining;
                html += `
                    <div class="fee-item">
                        <span class="fee-icon">💎</span>
                        <span class="fee-name">${name}</span>
                        <span class="fee-count">${isInfinite ? costPer : `${costTotal} / ${costPer}`}</span>
                    </div>
                `;
            }
            // 木板
            if (materialCost.plank) {
                // 根据tier确定木板类型
                const plankTypes = {
                    1: 'pine_plank', 2: 'iron_birch_plank', 3: 'wind_tree_plank',
                    4: 'flame_tree_plank', 5: 'frost_maple_plank', 6: 'thunder_tree_plank',
                    7: 'ancient_oak_plank', 8: 'world_tree_plank'
                };
                const plankType = plankTypes[tier] || 'pine_plank';
                const name = materialNames[plankType] || plankType;
                const costPer = materialCost.plank;
                const costTotal = isInfinite ? costPer : costPer * remaining;
                html += `
                    <div class="fee-item">
                        <span class="fee-icon">🪵</span>
                        <span class="fee-name">${name}</span>
                        <span class="fee-count">${isInfinite ? costPer : `${costTotal} / ${costPer}`}</span>
                    </div>
                `;
            }
        }
    }

    feesListEl.innerHTML = html;
}

let lastProgressStartTime = 0;

/**
 * 更新当前行动进度
 */
function updateCurrentActionProgress() {
    const progressFill = document.getElementById('current-progress-fill');
    const progressTime = document.getElementById('current-progress-time');

    if (!progressFill || !progressTime) return;

    const activeAction = gameState?.activeAction;
    if (!activeAction || activeAction.type !== 'ENHANCE') return;

    const startTime = parseInt(gameState.actionStartTime) || 0;
    const duration = parseInt(gameState.actionDuration) || 12000;

    // 检测是否是新的强化周期（startTime变化了）
    if (startTime !== lastProgressStartTime) {
        lastProgressStartTime = startTime;
        progressFill.style.transition = 'none';
        progressFill.style.width = '0%';
        // 强制重绘
        void progressFill.offsetWidth;
        progressFill.style.transition = 'width 0.3s ease';
    }

    if (startTime > 0 && duration > 0) {
        const now = Date.now();
        const elapsed = now - startTime;
        const remaining = Math.max(0, duration - elapsed);
        const progress = Math.min(100, Math.max(0, (elapsed / duration) * 100));

        progressFill.style.width = `${progress}%`;
        progressTime.textContent = `${(remaining / 1000).toFixed(1)}s`;
    } else {
        progressFill.style.width = '0%';
        progressTime.textContent = '0s';
    }
}

/**
 * 停止强化
 */
function stopEnhance() {
    if (!gameState?.activeAction || gameState.activeAction.type !== 'ENHANCE') {
        return;
    }

    // 发送停止请求
    socket.emit('stop_enhance');
}

/**
 * 获取强化成功率（前端计算用，匹配后端配置）
 */
function getEnhanceSuccessRate(level) {
    const config = CONFIG?.enhanceConfig?.successRate;
    if (!config) {
        // 默认值
        return 0.5;
    }

    // 检查区间
    if (level <= 1) return config[1] || 0.5;
    if (level >= 2 && level <= 3) return config['2-3'] || 0.45;
    if (level >= 4 && level <= 6) return config['4-6'] || 0.40;
    if (level >= 7 && level <= 10) return config['7-10'] || 0.35;
    if (level >= 11 && level <= 20) return config['11-20'] || 0.30;

    return 0.3;
}

/**
 * 重置强化页面状态
 */
function resetEnhanceState() {
    enhanceState.selectedTool = null;
    enhanceState.toolType = null;
    enhanceState.toolIndex = null;
    enhanceState.protection = null;
    enhanceState.protectionIcon = null;
    enhanceState.protectionStartLevel = 2;

    // 重置UI显示
    const placeholder = document.getElementById('enhance-tool-placeholder');
    const badge = document.getElementById('enhance-tool-level-badge');
    const iconWrap = document.getElementById('enhance-tool-icon-wrap');

    if (placeholder) placeholder.style.display = 'flex';
    if (badge) badge.style.display = 'none';
    if (iconWrap) iconWrap.style.display = 'none';

    // 清空费用列表
    const feesListEl = document.getElementById('enhance-fees-list');
    if (feesListEl) {
        feesListEl.innerHTML = `
            <div class="fee-item">
                <span class="fee-icon">🪙</span>
                <span class="fee-name">金币</span>
                <span class="fee-count">--</span>
            </div>
        `;
    }

    // 清空经验和成功率
    const expEl = document.getElementById('enhance-exp');
    const rateEl = document.getElementById('enhance-success-rate');
    if (expEl) expEl.textContent = '--';
    if (rateEl) {
        rateEl.textContent = '--%';
        rateEl.classList.remove('rate-low', 'rate-medium', 'rate-high');
    }

    // 清空产出预览
    const outputIconEl = document.getElementById('enhance-output-icon');
    const outputBadgeEl = document.getElementById('enhance-output-badge');
    if (outputIconEl) outputIconEl.textContent = '-';
    if (outputBadgeEl) outputBadgeEl.style.display = 'none';

    // 重置输入框
    const targetInput = document.getElementById('enhance-target-level');
    const countInput = document.getElementById('enhance-count');
    const protectionStart = document.getElementById('enhance-protection-start');

    if (targetInput) targetInput.value = 1;
    if (countInput) {
        countInput.value = '∞';
        updateCountButtonsState('∞');
    }
    if (protectionStart) {
        protectionStart.value = 2;
        protectionStart.disabled = true;
    }

    // 重置保护垫槽
    const protectionSlot = document.getElementById('enhance-protection-slot');
    if (protectionSlot) {
        protectionSlot.innerHTML = '<span class="ph-icon">+</span>';
    }

    // 禁用按钮
    const startBtn = document.getElementById('enhance-start-btn');
    const queueBtn = document.getElementById('enhance-queue-btn');
    if (startBtn) startBtn.disabled = true;
    if (queueBtn) queueBtn.disabled = true;
}

/**
 * 更新强化次数快捷按钮状态
 */
function updateCountButtonsState(value) {
    const countBtns = document.querySelectorAll('.count-btn');
    countBtns.forEach(btn => {
        btn.classList.remove('selected', 'is-inf');
        const val = btn.dataset.val;
        if (val === 'inf' && (value === '∞' || value === '')) {
            btn.classList.add('selected', 'is-inf');
        } else if (val === value) {
            btn.classList.add('selected');
        }
    });
}

/**
 * 更新强化页面的锻造经验条
 */
function updateEnhanceForgingExp() {
    const levelEl = document.getElementById('enhance-forging-level');
    const expInfoEl = document.getElementById('enhance-forging-exp-info');
    const expFillEl = document.getElementById('enhance-forging-exp-fill');

    if (!levelEl || !expInfoEl || !expFillEl) return;

    const level = gameState.forgingLevel || 1;
    const exp = gameState.forgingExp || 0;

    // 升级所需经验（使用更合理的经验曲线）
    const expForCurrentLevel = Math.floor(100 * level * (1 + 0.3 * Math.max(0, level - 1)));

    // 更新等级显示
    levelEl.textContent = `Lv.${level}`;

    // 更新经验值信息 [当前/升级所需]
    expInfoEl.textContent = `[${Math.floor(exp)}/${expForCurrentLevel}]`;

    // 更新经验条
    const progress = Math.min(100, Math.max(0, (exp / expForCurrentLevel) * 100));
    expFillEl.style.width = `${progress}%`;
}

/**
 * 打开装备选择弹窗
 */
/**
 * 自动选择强化工具
 */
function autoSelectEnhanceTool() {
    // 获取所有可强化的工具
    const allTools = [];
    const toolTypes = ['axe', 'pickaxe', 'chisel', 'needle', 'scythe', 'hammer', 'tongs', 'rod'];

    toolTypes.forEach(toolType => {
        const toolsKey = getToolsKey(toolType);
        const tools = gameState.toolsInventory?.[toolsKey] || [];

        tools.forEach((tool, index) => {
            const toolId = typeof tool === 'string' ? tool : tool.id;
            const enhanceLevel = typeof tool === 'object' && tool ? (tool.enhanceLevel || 0) : 0;

            const toolConfig = CONFIG.tools[toolsKey]?.find(t => t.id === toolId);
            if (toolConfig) {
                allTools.push({
                    toolType,
                    index,
                    toolId,
                    enhanceLevel,
                    ...toolConfig
                });
            }
        });
    });

    if (allTools.length === 0) return;

    // 堆叠相同ID和等级的工具
    const stackedTools = {};
    allTools.forEach(tool => {
        const key = `${tool.toolId}_${tool.enhanceLevel}`;
        if (!stackedTools[key]) {
            stackedTools[key] = {
                ...tool,
                indices: [tool.index],
                count: 1
            };
        } else {
            stackedTools[key].indices.push(tool.index);
            stackedTools[key].count++;
        }
    });

    const displayTools = Object.values(stackedTools);

    // 如果只有一个工具组，自动选中
    if (displayTools.length === 1) {
        const tool = displayTools[0];
        enhanceState.toolType = tool.toolType;
        enhanceState.toolIndex = tool.indices[0];
        enhanceState.selectedTool = true;
        enhanceState.protection = null;
        updateEnhanceToolDisplay();
        updateEnhancePreview();
        return;
    }

    // 检查是否已装备了工具，优先选中已装备的
    const equippedTool = gameState.equipment;
    if (equippedTool) {
        const equipSlots = ['axe', 'pickaxe', 'chisel', 'needle', 'scythe', 'hammer', 'tongs', 'rod'];
        for (const slot of equipSlots) {
            const equippedId = equippedTool[slot];
            if (equippedId) {
                const foundTool = displayTools.find(t => t.toolId === equippedId && t.toolType === slot);
                if (foundTool) {
                    enhanceState.toolType = foundTool.toolType;
                    enhanceState.toolIndex = foundTool.indices[0];
                    enhanceState.selectedTool = true;
                    enhanceState.protection = null;
                    updateEnhanceToolDisplay();
                    updateEnhancePreview();
                    return;
                }
            }
        }
    }
}

function openEnhanceToolModal() {
    // 获取所有可强化的工具
    const allTools = [];
    const toolTypes = ['axe', 'pickaxe', 'chisel', 'needle', 'scythe', 'hammer', 'tongs', 'rod'];

    // 获取正在强化的工具信息
    const activeAction = gameState?.activeAction;
    const enhancingToolType = activeAction?.type === 'ENHANCE' ? activeAction.toolType : null;
    const enhancingToolIndex = activeAction?.type === 'ENHANCE' ? activeAction.toolIndex : null;

    toolTypes.forEach(toolType => {
        const toolsKey = getToolsKey(toolType);
        const tools = gameState.toolsInventory?.[toolsKey] || [];

        tools.forEach((tool, index) => {
            // 排除正在强化的工具
            if (enhancingToolType === toolType && enhancingToolIndex === index) {
                return;
            }

            const toolId = typeof tool === 'string' ? tool : tool.id;
            const enhanceLevel = typeof tool === 'object' && tool ? (tool.enhanceLevel || 0) : 0;

            // 获取工具配置
            const toolConfig = CONFIG.tools[toolsKey]?.find(t => t.id === toolId);
            if (toolConfig) {
                allTools.push({
                    toolType,
                    index,
                    toolId,
                    enhanceLevel,
                    ...toolConfig
                });
            }
        });
    });

    // 堆叠相同ID和等级的工具
    const stackedTools = {};
    allTools.forEach(tool => {
        const key = `${tool.toolId}_${tool.enhanceLevel}`;
        if (!stackedTools[key]) {
            stackedTools[key] = {
                ...tool,
                indices: [tool.index],
                count: 1
            };
        } else {
            stackedTools[key].indices.push(tool.index);
            stackedTools[key].count++;
        }
    });

    const displayTools = Object.values(stackedTools);

    // 如果只有一个工具组，自动选中
    if (displayTools.length === 1) {
        const tool = displayTools[0];
        enhanceState.toolType = tool.toolType;
        enhanceState.toolIndex = tool.indices[0];
        enhanceState.selectedTool = true;
        enhanceState.protection = null;
        updateEnhanceToolDisplay();
        updateEnhancePreview();
        return;
    }

    // 检查是否已装备了工具，如果有则优先选中已装备的
    const equippedTool = gameState.equipment;
    if (equippedTool && displayTools.length > 0) {
        // 遍历所有装备槽，找到已装备的工具
        const equipSlots = ['axe', 'pickaxe', 'chisel', 'needle', 'scythe', 'hammer', 'tongs', 'rod'];
        for (const slot of equipSlots) {
            const equippedId = equippedTool[slot];
            if (equippedId) {
                // 找到已装备工具对应的堆叠组
                const foundTool = displayTools.find(t => t.toolId === equippedId && t.toolType === slot);
                if (foundTool) {
                    enhanceState.toolType = foundTool.toolType;
                    enhanceState.toolIndex = foundTool.indices[0];
                    enhanceState.selectedTool = true;
                    enhanceState.protection = null;
                    updateEnhanceToolDisplay();
                    updateEnhancePreview();
                    return;
                }
            }
        }
    }

    // 创建弹窗（即使没有工具也显示）
    const modal = document.createElement('div');
    modal.className = 'enhance-tool-modal';

    const gridContent = displayTools.length > 0
        ? displayTools.map(tool => `
            <div class="enhance-tool-item" data-type="${tool.toolType}" data-index="${tool.indices[0]}" data-indices="${tool.indices.join(',')}">
                <div class="enhance-tool-item-icon">${tool.icon}${tool.count > 1 ? `<span class="tool-count-badge">${tool.count}</span>` : ''}</div>
                <div class="enhance-tool-item-name">${tool.name}</div>
                <div class="enhance-tool-item-level">+${tool.enhanceLevel}</div>
                <div class="enhance-tool-item-tier">${getToolTier(tool.toolId)}阶</div>
            </div>
        `).join('')
        : '<div style="color: #6B7A8A; text-align: center; padding: 40px; grid-column: 1 / -1;">没有可强化的装备</div>';

    modal.innerHTML = `
        <div class="enhance-tool-modal-content">
            <h3 class="enhance-tool-modal-title">选择要强化的装备</h3>
            <div class="enhance-tool-grid">
                ${gridContent}
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // 绑定点击事件
    modal.querySelectorAll('.enhance-tool-item').forEach(item => {
        item.onclick = () => {
            enhanceState.toolType = item.dataset.type;
            enhanceState.toolIndex = parseInt(item.dataset.index);
            enhanceState.selectedTool = true;
            enhanceState.protection = null;

            updateEnhanceToolDisplay();
            updateEnhancePreview();
            modal.remove();
        };
    });

    // 点击背景关闭
    modal.onclick = (e) => {
        if (e.target === modal) modal.remove();
    };
}

/**
 * 获取工具品质等级
 */
function getToolTier(toolId) {
    const tierMap = {
        'cyan': 1, 'red': 2, 'feather': 3, 'white': 4,
        'hell': 5, 'thunder': 6, 'brilliant': 7, 'star': 8
    };
    for (const [prefix, tier] of Object.entries(tierMap)) {
        if (toolId.startsWith(prefix)) return tier;
    }
    return 1;
}

/**
 * 更新装备显示
 */
function updateEnhanceToolDisplay() {
    const placeholderEl = document.getElementById('enhance-tool-placeholder');
    const badgeEl = document.getElementById('enhance-tool-level-badge');
    const iconWrapEl = document.getElementById('enhance-tool-icon-wrap');

    if (!enhanceState.selectedTool) {
        if (placeholderEl) placeholderEl.style.display = 'flex';
        if (badgeEl) badgeEl.style.display = 'none';
        if (iconWrapEl) iconWrapEl.style.display = 'none';
        return;
    }

    const { toolType, toolIndex } = enhanceState;
    const toolsKey = getToolsKey(toolType);
    const tools = gameState.toolsInventory?.[toolsKey] || [];

    if (toolIndex < 0 || toolIndex >= tools.length) return;

    const tool = tools[toolIndex];
    const toolId = typeof tool === 'string' ? tool : tool.id;
    const enhanceLevel = typeof tool === 'object' && tool ? (tool.enhanceLevel || 0) : 0;
    const toolConfig = CONFIG.tools[toolsKey]?.find(t => t.id === toolId);

    if (!toolConfig) return;

    // 隐藏占位符，显示图标和等级徽章
    if (placeholderEl) placeholderEl.style.display = 'none';
    if (badgeEl) {
        badgeEl.style.display = 'block';
        badgeEl.textContent = enhanceLevel > 0 ? `+${enhanceLevel}` : '';
    }
    if (iconWrapEl) {
        iconWrapEl.style.display = 'flex';
        iconWrapEl.textContent = toolConfig.icon;
    }

    // 更新目标等级默认值
    const targetInput = document.getElementById('enhance-target-level');
    if (targetInput) {
        targetInput.value = enhanceLevel + 1;
    }
}

/**
 * 更新强化预览
 */
function updateEnhancePreview() {
    if (!enhanceState.selectedTool) return;

    socket.emit('get_enhance_preview', {
        toolType: enhanceState.toolType,
        toolIndex: enhanceState.toolIndex
    });
}

/**
 * 显示素材详情弹出卡片
 */
function showMaterialPopover(triggerElement) {
    // 移除已有的弹出卡片
    const existingPopover = document.getElementById('material-popover');
    if (existingPopover) {
        existingPopover.remove();
        return;
    }

    const materialId = triggerElement.dataset.material;
    const materialType = triggerElement.dataset.type;
    const count = parseInt(triggerElement.dataset.count) || 0;

    // 获取素材信息
    const materialNames = {
        'cyan_ingot': '青闪锭', 'red_copper_ingot': '赤铜锭', 'feather_ingot': '羽铁锭',
        'white_silver_ingot': '白银锭', 'hell_steel_ingot': '狱炎钢锭', 'thunder_steel_ingot': '雷鸣钢锭',
        'brilliant_crystal': '璀璨晶', 'star_crystal': '星辉晶',
        'cyan_ore': '青闪矿', 'red_iron': '赤铁矿', 'feather_ore': '羽石矿',
        'white_ore': '白鸠矿', 'hell_ore': '狱炎矿', 'thunder_ore': '雷鸣矿',
        'brilliant': '璀璨矿', 'star_ore': '星辉矿',
        'pine_plank': '青杉木板', 'iron_birch_plank': '铁桦木板', 'wind_tree_plank': '风啸木板',
        'flame_tree_plank': '焰心木板', 'frost_maple_plank': '霜叶枫木板', 'thunder_tree_plank': '雷鸣木板',
        'ancient_oak_plank': '古橡木板', 'world_tree_plank': '世界树木板'
    };

    const materialIcons = {
        'ingot': '🔨', 'ore': '⛏️', 'plank': '🪵'
    };

    const name = materialNames[materialId] || materialId;
    const icon = materialIcons[materialType] || '📦';

    // 创建弹出卡片
    const popover = document.createElement('div');
    popover.id = 'material-popover';
    popover.className = 'material-popover';
    popover.innerHTML = `
        <div class="popover-header">
            <span class="popover-icon">${icon}</span>
            <span class="popover-name">${name}</span>
        </div>
        <div class="popover-content">
            <div class="popover-row">
                <span class="popover-label">拥有数量</span>
                <span class="popover-value">${count}</span>
            </div>
        </div>
    `;

    // 添加到页面
    document.body.appendChild(popover);

    // 定位弹出卡片在素材上方
    const triggerRect = triggerElement.getBoundingClientRect();
    const popoverHeight = popover.offsetHeight;
    popover.style.left = `${triggerRect.left}px`;
    popover.style.top = `${triggerRect.top - popoverHeight - 8}px`;

    // 点击其他地方关闭
    setTimeout(() => {
        document.addEventListener('click', closeMaterialPopoverOnOutsideClick, { once: true });
    }, 10);
}

function closeMaterialPopoverOnOutsideClick(e) {
    const popover = document.getElementById('material-popover');
    if (popover && !popover.contains(e.target) && !e.target.closest('.fee-item.clickable')) {
        popover.remove();
    }
}

/**
 * 显示强化保护帮助弹出卡片
 */
function showProtectionHelpPopover(triggerElement, isHover = false) {
    // 移除已有的弹出卡片
    const existingPopover = document.getElementById('protection-help-popover');
    if (existingPopover) {
        existingPopover.remove();
        if (!isHover) return; // 点击模式再次点击则关闭
    }

    // 创建弹出卡片
    const popover = document.createElement('div');
    popover.id = 'protection-help-popover';
    popover.className = 'protection-help-popover';
    popover.dataset.mode = isHover ? 'hover' : 'click';
    popover.innerHTML = `
        <div class="popover-header">强化保护</div>
        <div class="popover-content">
            <p>可选择保护道具，必须是同类型物品，强化失败时消耗一个以避免降级或跌至+5。</p>
            <p style="color: #FF6B6B; margin-top: 8px;">⚠️ 不可防止装备破碎。</p>
        </div>
    `;

    // 先设置样式让元素可测量
    popover.style.visibility = 'hidden';
    popover.style.position = 'fixed';

    // 添加到页面
    document.body.appendChild(popover);

    // 定位弹出卡片（在问号符上方）
    const triggerRect = triggerElement.getBoundingClientRect();
    const popoverRect = popover.getBoundingClientRect();

    // 计算位置：在问号符上方，居中对齐
    const left = triggerRect.left + triggerRect.width / 2 - popoverRect.width / 2;
    const top = triggerRect.top - popoverRect.height - 8;

    popover.style.left = `${Math.max(8, left)}px`;
    popover.style.top = `${Math.max(8, top)}px`;
    popover.style.visibility = 'visible';

    if (isHover) {
        // hover模式：鼠标离开弹出卡片时关闭
        popover.addEventListener('mouseleave', () => {
            setTimeout(() => {
                if (!triggerElement.matches(':hover') && !popover.matches(':hover')) {
                    popover.remove();
                }
            }, 100);
        });
    } else {
        // click模式：点击其他地方关闭
        setTimeout(() => {
            document.addEventListener('click', closePopoverOnOutsideClick, { once: true });
        }, 10);
    }
}

function closePopoverOnOutsideClick(e) {
    const popover = document.getElementById('protection-help-popover');
    if (popover && !popover.contains(e.target) && e.target.id !== 'enhance-protection-help') {
        popover.remove();
    }
}

/**
 * 打开保护垫选择弹窗
 */
function openProtectionSelectModal() {
    if (!enhanceState.selectedTool) {
        showToast('请先选择要强化的装备');
        return;
    }

    const toolType = enhanceState.toolType;
    const toolIndex = enhanceState.toolIndex;
    const toolsKey = getToolsKey(toolType);
    const tools = gameState.toolsInventory?.[toolsKey] || [];

    // 获取当前工具信息
    const tool = tools[toolIndex];
    if (!tool) {
        showToast('工具不存在');
        return;
    }

    const toolId = typeof tool === 'string' ? tool : tool.id;

    // 查找同名工具作为保护垫（不限等级，排除当前正在强化的那个）
    const protectionTools = tools
        .map((t, idx) => {
            if (idx === toolIndex) return null;
            const id = typeof t === 'string' ? t : t.id;
            const level = typeof t === 'object' && t ? (t.enhanceLevel || 0) : 0;
            if (id === toolId) {
                return { index: idx, id, enhanceLevel: level };
            }
            return null;
        })
        .filter(t => t !== null);

    if (protectionTools.length === 0) {
        showToast('没有可用的保护道具');
        return;
    }

    // 获取工具配置
    const toolConfig = CONFIG.tools?.[toolsKey]?.find(t => t.id === toolId);
    const toolName = toolConfig?.name || toolId;
    const toolIcon = toolConfig?.icon || '🔧';

    // 按等级分组统计
    const levelGroups = {};
    protectionTools.forEach(t => {
        const level = t.enhanceLevel;
        if (!levelGroups[level]) {
            levelGroups[level] = { level, indices: [], count: 0 };
        }
        levelGroups[level].indices.push(t.index);
        levelGroups[level].count++;
    });

    // 移除已有的弹窗
    document.querySelectorAll('.protection-select-modal').forEach(m => m.remove());

    // 创建小型弹窗
    const modal = document.createElement('div');
    modal.className = 'protection-select-modal';
    modal.style.position = 'fixed';
    modal.style.visibility = 'hidden';

    modal.innerHTML = Object.values(levelGroups).map(group => `
        <div class="protection-select-item" data-index="${group.indices[0]}">
            <span class="protection-select-icon">${toolIcon}</span>
            <div>
                <div class="protection-select-name">${toolName}${group.level > 0 ? ' +' + group.level : ''}</div>
                <div class="protection-select-count">×${group.count}</div>
            </div>
        </div>
    `).join('');

    document.body.appendChild(modal);

    // 定位到保护垫选择框上方居中
    const slot = document.getElementById('enhance-protection-slot');
    if (slot) {
        const rect = slot.getBoundingClientRect();
        const modalRect = modal.getBoundingClientRect();
        modal.style.left = `${rect.left + rect.width / 2 - modalRect.width / 2}px`;
        modal.style.top = `${rect.top - modalRect.height - 8}px`;
    }
    modal.style.visibility = 'visible';

    // 绑定点击事件
    modal.querySelectorAll('.protection-select-item').forEach(item => {
        item.addEventListener('click', () => {
            const idx = parseInt(item.dataset.index);
            enhanceState.protection = idx;
            enhanceState.protectionIcon = toolIcon;  // 存储图标

            // 更新保护垫选择框显示（图标 + 数量）
            const protectionSlot = document.getElementById('enhance-protection-slot');
            if (protectionSlot) {
                protectionSlot.innerHTML = `
                    <span class="selected-icon">${toolIcon}</span>
                    <span class="protection-count">${protectionTools.length}</span>
                `;
            }

            modal.remove();
        });
    });

    // 点击其他地方关闭
    setTimeout(() => {
        document.addEventListener('click', function closeOnOutside(e) {
            if (!modal.contains(e.target) && e.target !== slot) {
                modal.remove();
                document.removeEventListener('click', closeOnOutside);
            }
        });
    }, 100);
}

/**
 * 保护帮助tooltip
 */
function showProtectionHelpTooltip(event) {
    const helpIcon = event.target;

    // 移除已有的tooltip
    document.querySelectorAll('.protection-help-tooltip').forEach(t => t.remove());

    const tooltip = document.createElement('div');
    tooltip.className = 'protection-help-tooltip';
    tooltip.style.cssText = `
        position: absolute;
        background: linear-gradient(180deg, #2D3F52 0%, #1B2A3A 100%);
        border: 2px solid rgba(107, 79, 60, 0.5);
        border-radius: 8px;
        padding: 12px;
        max-width: 260px;
        z-index: 1000;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        font-size: 12px;
        line-height: 1.5;
        color: #A0B2C0;
    `;
    tooltip.innerHTML = `
        <div style="color: #D4A574; font-weight: bold; margin-bottom: 6px;">强化保护</div>
        <div>可选择保护道具，必须是同类型物品，强化失败时消耗一个以避免降级或跌至+5。</div>
        <div style="color: #E57373; margin-top: 6px;">⚠️ 不可防止装备破碎</div>
    `;

    document.body.appendChild(tooltip);

    // 定位在问号右边
    const rect = helpIcon.getBoundingClientRect();
    tooltip.style.left = `${rect.right + 8}px`;
    tooltip.style.top = `${rect.top}px`;

    // 点击时点击其他地方关闭
    if (event.type === 'click') {
        setTimeout(() => {
            document.addEventListener('click', function closeTooltip(e) {
                if (!tooltip.contains(e.target) && e.target !== helpIcon) {
                    tooltip.remove();
                    document.removeEventListener('click', closeTooltip);
                }
            });
        }, 100);
    }
}

function hideProtectionHelpTooltip() {
    setTimeout(() => {
        document.querySelectorAll('.protection-help-tooltip').forEach(t => t.remove());
    }, 200);
}

/**
 * 开始强化
 */
function startEnhance() {
    if (!enhanceState.selectedTool) {
        showToast('请先选择装备');
        return;
    }

    // 检查是否有正在进行的行动
    if (gameState?.activeAction) {
        const currentAction = gameState.activeAction;
        const currentConfig = getActionConfig(currentAction.type, currentAction.id);
        const currentName = currentConfig?.name || '当前行动';

        // 弹出确认对话框
        const modal = document.createElement('div');
        modal.className = 'action-modal-overlay';
        modal.innerHTML = `
            <div class="action-modal">
                <div class="action-modal-header">
                    <span class="action-modal-title">⚠️ 确认替换</span>
                    <button class="action-modal-close">&times;</button>
                </div>
                <div class="action-modal-body">
                    <p style="color: #D4A574; margin-bottom: 12px;">
                        当前正在进行: <strong>${currentName}</strong>
                    </p>
                    <p style="color: #A0B2C0;">
                        开始新的强化将取消当前行动，是否继续？
                    </p>
                </div>
                <div class="action-modal-footer">
                    <button class="action-btn secondary" id="cancel-replace">取消</button>
                    <button class="action-btn primary" id="confirm-replace">确认替换</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        modal.querySelector('.action-modal-close').addEventListener('click', () => modal.remove());
        modal.querySelector('#cancel-replace').addEventListener('click', () => modal.remove());
        modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });

        modal.querySelector('#confirm-replace').addEventListener('click', () => {
            // 先取消当前行动
            socket.emit('action_cancel');
            modal.remove();

            // 等待取消完成后再开始新行动
            // 监听取消结果
            const onCancelResult = (result) => {
                if (result.success) {
                    // 取消成功，开始新的强化
                    setTimeout(() => {
                        doStartEnhance();
                    }, 100);
                } else {
                    showToast(`取消失败: ${result.reason}`);
                }
                socket.off('action_cancel_result', onCancelResult);
            };
            socket.on('action_cancel_result', onCancelResult);
        });

        return;
    }

    // 没有正在进行的行动，直接开始
    doStartEnhance();
}

/**
 * 执行开始强化
 */
function doStartEnhance() {
    const targetLevel = parseInt(document.getElementById('enhance-target-level').value) || 1;
    const countInput = document.getElementById('enhance-count');

    let count;
    const inputVal = countInput?.value?.trim();

    // 判断是否无限模式
    if (inputVal === '∞' || inputVal === '' || inputVal === '-1') {
        count = -1; // -1 表示无限（实际执行时计算最大值）
    } else {
        count = parseInt(inputVal) || 1;
    }

    socket.emit('enhance_start', {
        toolType: enhanceState.toolType,
        toolIndex: enhanceState.toolIndex,
        targetLevel,
        count,
        protection: enhanceState.protection,
        protectionStartLevel: enhanceState.protectionStartLevel
    });

    // 开始强化后重置强化页状态
    resetEnhanceState();
}

/**
 * 添加到队列
 */
function addToEnhanceQueue() {
    if (!enhanceState.selectedTool) {
        showToast('请先选择装备');
        return;
    }

    const targetLevel = parseInt(document.getElementById('enhance-target-level').value) || 1;
    const countInput = document.getElementById('enhance-count');

    let count;
    const inputVal = countInput?.value?.trim();

    // 判断是否无限模式
    if (inputVal === '∞' || inputVal === '' || inputVal === '-1') {
        count = -1; // -1 表示无限
    } else {
        count = parseInt(inputVal) || 1;
    }

    // 直接加入队列，不检查当前行动
    socket.emit('enhance_queue', {
        toolType: enhanceState.toolType,
        toolIndex: enhanceState.toolIndex,
        targetLevel,
        count,
        protection: enhanceState.protection,
        protectionStartLevel: enhanceState.protectionStartLevel
    });
}

/**
 * 验证强化按钮状态
 */
function validateEnhanceButtons() {
    const startBtn = document.getElementById('enhance-start-btn');
    const queueBtn = document.getElementById('enhance-queue-btn');
    const targetInput = document.getElementById('enhance-target-level');
    const protectionStartInput = document.getElementById('enhance-protection-start');

    let canEnhance = enhanceState.selectedTool !== null;

    // 检查目标等级
    if (targetInput) {
        const target = parseInt(targetInput.value) || 1;
        if (target < 1 || target > 20) canEnhance = false;
    }

    // 检查保护起始等级
    if (protectionStartInput && !protectionStartInput.disabled) {
        const protStart = parseInt(protectionStartInput.value) || 2;
        if (protStart < 2 || protStart > 20) canEnhance = false;
    }

    if (startBtn) startBtn.disabled = !canEnhance;
    if (queueBtn) queueBtn.disabled = !canEnhance;
}

// 启动游戏循环
gameLoop();

console.log('🎮 中世纪雇佣兵 - 前端客户端已加载');
console.log('💡 按 Ctrl+F12 打开 GM 测试面板');

/**
 * 显示离线收益弹窗
 */
function showOfflineRewardsModal(data) {
    const modal = document.getElementById('offline-rewards-modal');
    const timeEl = document.getElementById('offline-time');
    const goldItemEl = document.getElementById('offline-gold-item');
    const goldEl = document.getElementById('offline-gold');
    const expLabelEl = document.getElementById('offline-exp-label');
    const expEl = document.getElementById('offline-exp');
    const confirmBtn = document.getElementById('offline-rewards-confirm');
    
    if (!modal) return;
    
    // 格式化离线时间
    const hours = Math.floor(data.offlineMinutes / 60);
    const minutes = data.offlineMinutes % 60;
    let timeText = '';
    if (hours > 0) {
        timeText = `${hours}小时${minutes}分钟`;
    } else {
        timeText = `${minutes}分钟`;
    }
    timeEl.textContent = timeText;
    
    // 显示金币（如果有）
    if (data.gold && data.gold > 0) {
        goldItemEl.style.display = 'flex';
        goldEl.textContent = `${data.gold} 💰`;
    } else {
        goldItemEl.style.display = 'none';
    }
    
    // 显示物品或经验
    if (data.items && data.items.length > 0) {
        expLabelEl.textContent = '获得物品：';
        const itemsText = data.items.map(item => `${item.icon} ${item.name}: ${item.count}`).join(', ');
        expEl.textContent = itemsText;
    } else if (data.experience && data.experience > 0) {
        expLabelEl.textContent = '获得经验：';
        expEl.textContent = `${data.skillIcon || '⭐'} ${data.skillName || '技能'}: ${data.experience} exp`;
    } else {
        expLabelEl.textContent = '获得物品：';
        expEl.textContent = '无';
    }
    
    // 显示弹窗
    modal.classList.add('show');
    
    // 点击确认按钮关闭
    confirmBtn.onclick = () => {
        modal.classList.remove('show');
    };
    
    // 点击弹窗外部关闭
    modal.onclick = (e) => {
        if (e.target === modal) {
            modal.classList.remove('show');
        }
    };
}