/**
 * 中世纪雇佣兵 - 放置游戏（侧边栏版本）
 */

// 经验值表 (1-200 级)
const EXP_TABLE = {
    1: 0, 2: 33, 3: 76, 4: 132, 5: 202, 6: 286, 7: 386, 8: 503, 9: 637, 10: 791,
    11: 964, 12: 1159, 13: 1377, 14: 1620, 15: 1891, 16: 2192, 17: 2525, 18: 2893, 19: 3300, 20: 3750,
    21: 4247, 22: 4795, 23: 5400, 24: 6068, 25: 6805, 26: 7618, 27: 8517, 28: 9508, 29: 10604, 30: 11814,
    31: 13151, 32: 14629, 33: 16262, 34: 18068, 35: 20064, 36: 22271, 37: 24712, 38: 27411, 39: 30396, 40: 33697,
    41: 37346, 42: 41381, 43: 45842, 44: 50773, 45: 56222, 46: 62243, 47: 68895, 48: 76242, 49: 84355, 50: 93311,
    51: 103195, 52: 114100, 53: 126127, 54: 139390, 55: 154009, 56: 170118, 57: 187863, 58: 207403, 59: 228914, 60: 252584,
    61: 278623, 62: 307256, 63: 338731, 64: 373318, 65: 411311, 66: 453030, 67: 498824, 68: 549074, 69: 604193, 70: 664632,
    71: 730881, 72: 803472, 73: 882985, 74: 970050, 75: 1065351, 76: 1169633, 77: 1283701, 78: 1408433, 79: 1544780, 80: 1693774,
    81: 1856536, 82: 2034279, 83: 2228321, 84: 2440088, 85: 2671127, 86: 2923113, 87: 3197861, 88: 3497335, 89: 3823663, 90: 4179145,
    91: 4566274, 92: 4987741, 93: 5446463, 94: 5945587, 95: 6488521, 96: 7078945, 97: 7720834, 98: 8418485, 99: 9176537, 100: 80000000,
    101: 9123981, 102: 10323654, 103: 11611520, 104: 12993664, 105: 14476562, 106: 16067109, 107: 17772646, 108: 19600984, 109: 21560432, 110: 23659830,
    111: 25908577, 112: 28316670, 113: 30894736, 114: 33654067, 115: 36606666, 116: 39765282, 117: 43143462, 118: 46755591, 119: 50616943, 120: 54743736,
    121: 59153183, 122: 63863552, 123: 68894226, 124: 74265915, 125: 80000000,
    126: 91504904, 127: 104096315, 128: 117857724, 129: 132918094, 130: 149401942,
    131: 167438216, 132: 187163614, 133: 208722829, 134: 232269650, 135: 257967222, 136: 285989350, 137: 316521996, 138: 349764842, 139: 385932842, 140: 425257842,
    141: 467989226, 142: 514395388, 143: 564765226, 144: 619409642, 145: 678663074, 146: 742886059, 147: 812467777, 148: 887827585, 149: 969417578, 150: 1057724278,
    151: 1153270378, 152: 1256617512, 153: 1368368154, 154: 1489168414, 155: 1619710978, 156: 1760738070, 157: 1913044430, 158: 2077480294, 159: 2254954454, 160: 2446437334,
    161: 2652964134, 162: 2875638934, 163: 3115638790, 164: 3374218934, 165: 3652716934, 166: 3952556934, 167: 4275254934, 168: 4622423734, 169: 4995777334, 170: 5397137734,
    171: 5828442934, 172: 6291754134, 173: 6789262934, 174: 7323298934, 175: 7896338934, 176: 8511018934, 177: 9170142934, 178: 9876694934, 179: 10633854934, 180: 11445014934,
    181: 12313794934, 182: 13244062934, 183: 14239950934, 184: 15305982934, 185: 16447102934, 186: 17668702934, 187: 18976654934, 188: 20377342934, 189: 21877694934, 190: 23485214934,
    191: 25208014934, 192: 27054862934, 193: 29035214934, 194: 31159262934, 195: 33437982934, 196: 35883182934, 197: 38507582934, 198: 41324894934, 199: 44349894934, 200: 80000000000
};

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
    // 树木配置
    trees: [
        { id: 'pine', name: '青杉', icon: '🌲', reqLevel: 1, duration: 6000, drop: '青杉木', dropIcon: '🪵', exp: 2 },
        { id: 'iron_birch', name: '铁桦', icon: '🌳', reqLevel: 10, duration: 8000, drop: '铁桦木', dropIcon: '🪵', exp: 3 },
        { id: 'wind_tree', name: '风啸树', icon: '🌴', reqLevel: 20, duration: 10000, drop: '风啸木', dropIcon: '🪵', exp: 4 },
        { id: 'flame_tree', name: '焰心树', icon: '🔥', reqLevel: 35, duration: 12000, drop: '焰心木', dropIcon: '🪵', exp: 5 },
        { id: 'frost_maple', name: '霜叶枫', icon: '❄️', reqLevel: 50, duration: 14000, drop: '霜叶枫木', dropIcon: '🪵', exp: 6 },
        { id: 'thunder_tree', name: '雷鸣树', icon: '⚡', reqLevel: 65, duration: 16000, drop: '雷鸣木', dropIcon: '🪵', exp: 7 },
        { id: 'ancient_oak', name: '古橡', icon: '🌳', reqLevel: 80, duration: 18000, drop: '古橡木', dropIcon: '🪵', exp: 8 },
        { id: 'world_tree', name: '世界树', icon: '🌍', reqLevel: 95, duration: 30000, drop: '世界树枝', dropIcon: '🌿', exp: 10 }
    ],
    // 矿石配置
    ores: [
        { id: 'cyan_ore', name: '青闪矿', icon: '💎', reqLevel: 1, duration: 6000, drop: '青闪石', dropIcon: '💎', exp: 2 },
        { id: 'red_iron', name: '赤铁矿', icon: '🔴', reqLevel: 10, duration: 8000, drop: '赤铁石', dropIcon: '🪨', exp: 3 },
        { id: 'feather_ore', name: '羽石矿', icon: '🪶', reqLevel: 20, duration: 10000, drop: '羽石', dropIcon: '🪨', exp: 4 },
        { id: 'hell_ore', name: '狱炎矿', icon: '🔥', reqLevel: 35, duration: 12000, drop: '狱炎石', dropIcon: '🪨', exp: 5 },
        { id: 'white_ore', name: '白鸠矿', icon: '⚪', reqLevel: 50, duration: 14000, drop: '白鸠石', dropIcon: '🪨', exp: 6 },
        { id: 'thunder_ore', name: '雷鸣矿', icon: '⚡', reqLevel: 65, duration: 16000, drop: '雷鸣石', dropIcon: '🪨', exp: 7 },
        { id: 'brilliant', name: '璀璨原石', icon: '✨', reqLevel: 80, duration: 18000, drop: '璀璨水晶', dropIcon: '💎', exp: 8 },
        { id: 'star_ore', name: '星辉原石', icon: '⭐', reqLevel: 95, duration: 30000, drop: '星辉水晶', dropIcon: '💎', exp: 10 }
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
    ],
    // 商人配置
    merchants: [
        { 
            id: 'architect', 
            name: '建筑师', 
            title: '建筑大师',
            avatar: '🏗️', 
            favorability: 0,
            goods: [{ id: 'architect_scroll', name: '建筑大师卷轴', icon: '📜', price: 1000, currency: 'gold' }],
            quests: [
                { id: 'architect_quest_1', name: '初级建筑材料', desc: '提交 50 木材和 30 石头', reward: { gold: 200, favorability: 0.5 }, requirement: { wood: 50, stone: 30 } }
            ]
        },
        { 
            id: 'armorsmith', 
            name: '铸甲师', 
            title: '锻造大师',
            avatar: '⚒️', 
            favorability: 0,
            goods: [{ id: 'armorsmith_scroll', name: '锻造大师卷轴', icon: '📜', price: 1000, currency: 'gold' }],
            quests: [
                { id: 'armorsmith_quest_1', name: '金属收集', desc: '提交 40 石头', reward: { gold: 150, favorability: 0.5 }, requirement: { stone: 40 } }
            ]
        },
        { 
            id: 'tailor', 
            name: '缝缀师', 
            title: '裁缝大师',
            avatar: '🧵', 
            favorability: 0,
            goods: [{ id: 'tailor_scroll', name: '裁缝大师卷轴', icon: '📜', price: 1000, currency: 'gold' }],
            quests: [
                { id: 'tailor_quest_1', name: '布料准备', desc: '提交 30 木材', reward: { gold: 120, favorability: 0.5 }, requirement: { wood: 30 } }
            ]
        },
        { 
            id: 'alchemist', 
            name: '药剂师', 
            title: '炼金大师',
            avatar: '⚗️', 
            favorability: 0,
            goods: [{ id: 'alchemist_scroll', name: '药剂大师卷轴', icon: '📜', price: 1000, currency: 'gold' }],
            quests: [
                { id: 'alchemist_quest_1', name: '草药采集', desc: '提交 25 草药', reward: { gold: 100, favorability: 0.5 }, requirement: { herb: 25 } }
            ]
        }
    ],
    // 资源出售价格
    resourcePrices: {
        wood: 2,
        stone: 3,
        herb: 5
    }
};

let gameState = {
    resources: { gold: 0, wood: 0, stone: 0, herb: 0 },
    buildings: {},
    level: 1, exp: 0,
    startTime: Date.now(),
    activeActions: {},
    activeWoodcutting: null,
    activeMining: null,
    combat: { active: false, zoneId: null, endTime: 0 },
    currentZoneIndex: 0,
    currentPage: 'home',
    lastSave: Date.now(),
    // 各技能独立等级和经验
    woodcuttingLevel: 1,
    woodcuttingExp: 0,
    miningLevel: 1,
    miningExp: 0,
    gatheringLevel: 1,
    gatheringExp: 0,
    craftingLevel: 1,
    craftingExp: 0,
    combatLevel: 1,
    combatExp: 0,
    // 全局行动状态
    currentAction: null,
    actionStartTime: 0,
    actionDuration: 0,
    // 商人系统状态
    merchantData: {},
    activeQuests: {},
    warehouseSelection: [],
    isSelectMode: false,
    sellConfirming: false
};

CONFIG.buildings.forEach(b => { gameState.buildings[b.id] = { level: 0 }; });

// 初始化商人数据
CONFIG.merchants.forEach(m => {
    gameState.merchantData[m.id] = {
        favorability: m.favorability,
        completedQuests: []
    };
});

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
    woodcuttingList: document.getElementById('woodcutting-list'),
    woodcuttingExpFill: document.getElementById('woodcutting-exp-fill'),
    woodcuttingLevel: document.getElementById('woodcutting-level'),
    miningList: document.getElementById('mining-list'),
    miningExpFill: document.getElementById('mining-exp-fill'),
    miningLevel: document.getElementById('mining-level'),
    playTime: document.getElementById('play-time'),
    modal: document.getElementById('modal'),
    modalBody: document.getElementById('modal-body'),
    modalClose: document.querySelector('.modal-close'),
    resetBtn: document.getElementById('reset-btn'),
    // 侧边栏技能经验条
    navWoodcuttingExp: document.getElementById('nav-woodcutting-exp'),
    navWoodcuttingLvl: document.getElementById('nav-woodcutting-lvl'),
    navMiningExp: document.getElementById('nav-mining-exp'),
    navMiningLvl: document.getElementById('nav-mining-lvl'),
    navGatherExp: document.getElementById('nav-gather-exp'),
    navGatherLvl: document.getElementById('nav-gather-lvl'),
    navCraftExp: document.getElementById('nav-craft-exp'),
    navCraftLvl: document.getElementById('nav-craft-lvl'),
    navCombatExp: document.getElementById('nav-combat-exp'),
    navCombatLvl: document.getElementById('nav-combat-lvl'),
    // 顶部行动状态栏
    actionStatusBar: document.getElementById('action-status-bar'),
    actionStatusIcon: document.getElementById('action-status-icon'),
    actionStatusName: document.getElementById('action-status-name'),
    actionProgressFill: document.getElementById('action-progress-fill'),
    actionProgressTime: document.getElementById('action-progress-time'),
    actionCancelBtn: document.getElementById('action-cancel-btn'),
    actionRewards: document.getElementById('action-rewards'),
    // 商人系统
    merchantList: document.getElementById('merchant-list'),
    merchantModal: document.getElementById('merchant-modal'),
    merchantModalOverlay: document.getElementById('merchant-modal-overlay'),
    merchantModalClose: document.getElementById('merchant-modal-close'),
    merchantModalAvatar: document.getElementById('merchant-modal-avatar'),
    merchantModalName: document.getElementById('merchant-modal-name'),
    merchantModalFavorability: document.getElementById('merchant-modal-favorability'),
    merchantTabs: document.querySelectorAll('.merchant-tab'),
    merchantTabTrade: document.getElementById('merchant-tab-trade'),
    merchantTabQuest: document.getElementById('merchant-tab-quest'),
    merchantGoodsList: document.getElementById('merchant-goods-list'),
    merchantQuestList: document.getElementById('merchant-quest-list'),
    merchantWarehouseGrid: document.getElementById('merchant-warehouse-grid'),
    merchantSelectBtn: document.getElementById('merchant-select-btn'),
    merchantSellBar: document.getElementById('merchant-sell-bar'),
    merchantSellTotal: document.getElementById('merchant-sell-total'),
    merchantSellBtn: document.getElementById('merchant-sell-btn'),
    // 行动次数选择弹窗
    actionModal: document.getElementById('action-modal'),
    actionModalTitle: document.getElementById('action-modal-title'),
    actionModalClose: document.getElementById('action-modal-close'),
    actionModalCancel: document.getElementById('action-modal-cancel'),
    actionModalConfirm: document.getElementById('action-modal-confirm'),
    actionCountInput: document.getElementById('action-count-input'),
    // 替换行动确认弹窗
    replaceModal: document.getElementById('replace-modal'),
    replaceModalClose: document.getElementById('replace-modal-close'),
    replaceModalCancel: document.getElementById('replace-modal-cancel'),
    replaceModalConfirm: document.getElementById('replace-modal-confirm')
};

// 临时存储待执行的行动
let pendingAction = null;

function init() {
    loadGame();
    setupSidebar();
    setupNavigation();
    renderBuildings();
    renderGatherActions();
    renderCraftActions();
    renderWoodcutting();
    renderMining();
    renderCombatZones();
    renderMerchants();
    setupEventListeners();
    setupMerchantListeners();
    startGameLoop();
    updateUI();
    
    // 修复刷新页面后进度条异常：如果有进行中的行动，重置进度条和开始时间
    if (gameState.currentAction) {
        // 重置进度条为 0
        if (elements.actionProgressFill) {
            elements.actionProgressFill.style.width = '0%';
        }
        // 重置 actionStartTime 为当前时间，避免进度条计算错误
        gameState.actionStartTime = Date.now();
        // 启动进度条动画
        if (animationFrame) cancelAnimationFrame(animationFrame);
        lastActionStartTime = gameState.actionStartTime;
        animationFrame = requestAnimationFrame(updateActionStatusBarSmooth);
    }
    
    console.log('⚔️ 中世纪雇佣兵 已启动!');
}

function setupSidebar() {
    const toggleBtn = document.getElementById('sidebar-toggle');
    toggleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        elements.sidebar.classList.toggle('expanded');
    });
    
    elements.navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.stopPropagation();
            const page = item.dataset.page;
            const isExpanded = elements.sidebar.classList.contains('expanded');
            const isWideScreen = window.innerWidth >= 1200;
            
            // 只有在非宽屏且侧边栏展开时才关闭
            if (isExpanded && !isWideScreen) {
                elements.sidebar.classList.remove('expanded');
            }
            // 如果侧边栏是关闭的，直接跳转不展开
            switchPage(page);
        });
    });
    
    document.querySelector('.game-container').addEventListener('click', () => {
        const isWideScreen = window.innerWidth >= 1200;
        if (!isWideScreen) {
            elements.sidebar.classList.remove('expanded');
        }
    });
    
    // 根据页面宽度自动展开/收起侧边栏
    function checkSidebarWidth() {
        if (!elements.sidebar) return;
        const width = window.innerWidth;
        const isExpanded = elements.sidebar.classList.contains('expanded');
        const shouldExpand = width >= 1200; // 足够宽时自动展开
        
        if (shouldExpand && !isExpanded) {
            elements.sidebar.classList.add('expanded');
        } else if (!shouldExpand && isExpanded) {
            elements.sidebar.classList.remove('expanded');
        }
    }
    
    window.addEventListener('resize', checkSidebarWidth);
    checkSidebarWidth(); // 初始化检查
}

function setupNavigation() {}

// ============ 商人系统 ============

let currentMerchantId = null;

function renderMerchants() {
    if (!elements.merchantList) return;
    
    const html = CONFIG.merchants.map(merchant => {
        const data = gameState.merchantData[merchant.id];
        const favorability = data ? data.favorability : 0;
        const level = getFavorabilityLevel(favorability);
        const progress = Math.min(100, (favorability % 1) * 100);
        
        return `
            <div class="merchant-card" data-merchant-id="${merchant.id}">
                <div class="merchant-card-header">
                    <div class="merchant-card-avatar">${merchant.avatar}</div>
                    <div class="merchant-card-info">
                        <div class="merchant-card-name">${merchant.name}</div>
                        <div class="merchant-card-title">${merchant.title}</div>
                    </div>
                </div>
                <div class="merchant-favorability-bar">
                    <div class="favorability-label">
                        <span>好感度</span>
                        <span class="favorability-level">${level}</span>
                    </div>
                    <div class="favorability-progress-bg">
                        <div class="favorability-progress-fill" style="width: ${progress}%"></div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    elements.merchantList.innerHTML = html;
    
    // 绑定点击事件
    elements.merchantList.querySelectorAll('.merchant-card').forEach(card => {
        card.addEventListener('click', function() {
            const merchantId = this.dataset.merchantId;
            openMerchantModal(merchantId);
        });
    });
}

function getFavorabilityLevel(favorability) {
    if (favorability >= 3) return '崇敬';
    if (favorability >= 2) return '尊敬';
    if (favorability >= 1) return '友好';
    if (favorability >= 0.5) return '中立';
    return '陌生';
}

function openMerchantModal(merchantId) {
    currentMerchantId = merchantId;
    const merchant = CONFIG.merchants.find(m => m.id === merchantId);
    if (!merchant) return;
    
    const data = gameState.merchantData[merchant.id];
    
    // 更新弹窗信息
    elements.merchantModalAvatar.textContent = merchant.avatar;
    elements.merchantModalName.textContent = merchant.name;
    elements.merchantModalFavorability.textContent = data.favorability.toFixed(2);
    
    // 重置状态
    gameState.warehouseSelection = [];
    gameState.isSelectMode = false;
    gameState.sellConfirming = false;
    
    // 渲染商品
    renderMerchantGoods(merchant);
    
    // 渲染任务
    renderMerchantQuests(merchant, data);
    
    // 渲染仓库
    renderMerchantWarehouse();
    
    // 显示弹窗
    elements.merchantModal.classList.add('active');
    
    // 默认显示交易栏
    switchMerchantTab('trade');
}

function closeMerchantModal() {
    elements.merchantModal.classList.remove('active');
    currentMerchantId = null;
}

function renderMerchantGoods(merchant) {
    if (!elements.merchantGoodsList) return;
    
    const html = merchant.goods.map(good => {
        const canAfford = gameState.resources[good.currency] >= good.price;
        return `
            <div class="merchant-goods-item">
                <div class="merchant-goods-icon">${good.icon}</div>
                <div class="merchant-goods-info">
                    <div class="merchant-goods-name">${good.name}</div>
                    <div class="merchant-goods-price">💰 ${good.price} 金币</div>
                </div>
                <button class="merchant-buy-btn" ${!canAfford ? 'disabled' : ''} data-good-id="${good.id}">
                    购买
                </button>
            </div>
        `;
    }).join('');
    
    elements.merchantGoodsList.innerHTML = html;
    
    // 绑定购买事件
    elements.merchantGoodsList.querySelectorAll('.merchant-buy-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const goodId = this.dataset.goodId;
            const good = merchant.goods.find(g => g.id === goodId);
            buyGood(merchant, good);
        });
    });
}

function buyGood(merchant, good) {
    const price = good.price;
    const currency = good.currency;
    
    if (gameState.resources[currency] >= price) {
        gameState.resources[currency] -= price;
        showToast(`✅ 购买了 ${good.name}`);
        updateUI();
        saveGame();
        
        // 重新渲染（更新按钮状态）
        renderMerchantGoods(merchant);
    } else {
        showToast('❌ 资源不足');
    }
}

function renderMerchantQuests(merchant, data) {
    if (!elements.merchantQuestList) return;
    
    const html = merchant.quests.map(quest => {
        const isCompleted = data.completedQuests.includes(quest.id);
        const activeQuest = gameState.activeQuests[quest.id];
        const isAccepted = !!activeQuest;
        
        let btnText = '领取任务';
        let btnClass = '';
        let canSubmit = false;
        
        if (isCompleted) {
            btnText = '已完成';
            btnClass = 'disabled';
        } else if (isAccepted) {
            btnText = '提交';
            btnClass = 'submit';
            canSubmit = canSubmitQuest(quest);
        }
        
        return `
            <div class="merchant-quest-item ${isCompleted ? 'completed' : ''}">
                <div class="merchant-quest-header">
                    <div class="merchant-quest-name">${quest.name}</div>
                    <div class="merchant-quest-reward">💰 ${quest.reward.gold} | ❤️ ${quest.reward.favorability}</div>
                </div>
                <div class="merchant-quest-desc">${quest.desc}</div>
                <button class="merchant-quest-btn ${btnClass}" 
                    ${isCompleted ? 'disabled' : ''} 
                    ${isAccepted && !canSubmit ? 'disabled' : ''}
                    data-quest-id="${quest.id}">
                    ${btnText}
                </button>
            </div>
        `;
    }).join('');
    
    elements.merchantQuestList.innerHTML = html;
    
    // 绑定事件
    elements.merchantQuestList.querySelectorAll('.merchant-quest-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const questId = this.dataset.questId;
            const quest = merchant.quests.find(q => q.id === questId);
            handleQuest(merchant, quest, data);
        });
    });
}

function canSubmitQuest(quest) {
    for (const [res, amount] of Object.entries(quest.requirement)) {
        if (gameState.resources[res] < amount) return false;
    }
    return true;
}

function handleQuest(merchant, quest, data) {
    const activeQuest = gameState.activeQuests[quest.id];
    
    if (activeQuest) {
        // 提交任务
        if (canSubmitQuest(quest)) {
            // 扣除资源
            for (const [res, amount] of Object.entries(quest.requirement)) {
                gameState.resources[res] -= amount;
            }
            
            // 发放奖励
            gameState.resources.gold += quest.reward.gold;
            gameState.merchantData[merchant.id].favorability += quest.reward.favorability;
            gameState.merchantData[merchant.id].completedQuests.push(quest.id);
            delete gameState.activeQuests[quest.id];
            
            showToast(`✅ 任务完成！+${quest.reward.gold} 金币，+${quest.reward.favorability} 好感度`);
            updateUI();
            saveGame();
            
            // 重新渲染
            renderMerchantQuests(merchant, gameState.merchantData[merchant.id]);
            elements.merchantModalFavorability.textContent = gameState.merchantData[merchant.id].favorability.toFixed(2);
        } else {
            showToast('❌ 资源不足，无法提交任务');
        }
    } else {
        // 领取任务
        gameState.activeQuests[quest.id] = {
            merchantId: merchant.id,
            questId: quest.id,
            acceptedAt: Date.now()
        };
        showToast(`📋 已领取任务：${quest.name}`);
        
        // 重新渲染
        renderMerchantQuests(merchant, data);
    }
}

function renderMerchantWarehouse() {
    if (!elements.merchantWarehouseGrid) return;
    
    const resources = CONFIG.resources.filter(r => r !== 'gold');
    const html = resources.map(res => {
        const count = gameState.resources[res];
        const isSelected = gameState.warehouseSelection.includes(res);
        const icons = { wood: '🪵', stone: '🪨', herb: '🌿' };
        const names = { wood: '木材', stone: '石头', herb: '草药' };
        
        return `
            <div class="merchant-warehouse-item ${isSelected ? 'selected' : ''}" 
                data-resource="${res}"
                ${!gameState.isSelectMode ? 'style="pointer-events: none;"' : ''}>
                <div class="merchant-warehouse-item-icon">${icons[res]}</div>
                <div class="merchant-warehouse-item-name">${names[res]}</div>
                <div class="merchant-warehouse-item-count">${count}</div>
            </div>
        `;
    }).join('');
    
    elements.merchantWarehouseGrid.innerHTML = html;
    
    // 绑定选择事件
    elements.merchantWarehouseGrid.querySelectorAll('.merchant-warehouse-item').forEach(item => {
        item.addEventListener('click', function() {
            const res = this.dataset.resource;
            toggleWarehouseSelection(res);
        });
    });
    
    // 更新出售按钮栏
    updateSellBar();
}

function toggleWarehouseSelection(resource) {
    const index = gameState.warehouseSelection.indexOf(resource);
    if (index > -1) {
        gameState.warehouseSelection.splice(index, 1);
    } else {
        gameState.warehouseSelection.push(resource);
    }
    renderMerchantWarehouse();
}

function updateSellBar() {
    if (!elements.merchantSellBar || !elements.merchantSellTotal) return;
    
    if (gameState.warehouseSelection.length === 0) {
        elements.merchantSellBar.style.display = 'none';
        return;
    }
    
    let total = 0;
    gameState.warehouseSelection.forEach(res => {
        total += gameState.resources[res] * CONFIG.resourcePrices[res];
    });
    
    elements.merchantSellTotal.textContent = total;
    elements.merchantSellBar.style.display = 'flex';
    
    if (gameState.sellConfirming) {
        elements.merchantSellBtn.textContent = '确认出售';
        elements.merchantSellBtn.classList.add('confirming');
    } else {
        elements.merchantSellBtn.textContent = '出售';
        elements.merchantSellBtn.classList.remove('confirming');
    }
}

function switchMerchantTab(tab) {
    elements.merchantTabs.forEach(t => {
        t.classList.toggle('active', t.dataset.tab === tab);
    });
    
    elements.merchantTabTrade.classList.toggle('active', tab === 'trade');
    elements.merchantTabQuest.classList.toggle('active', tab === 'quest');
}

function setupMerchantListeners() {
    // 关闭弹窗
    if (elements.merchantModalClose) {
        elements.merchantModalClose.addEventListener('click', closeMerchantModal);
    }
    if (elements.merchantModalOverlay) {
        elements.merchantModalOverlay.addEventListener('click', closeMerchantModal);
    }
    
    // 切换标签
    elements.merchantTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            switchMerchantTab(this.dataset.tab);
        });
    });
    
    // 选择模式
    if (elements.merchantSelectBtn) {
        elements.merchantSelectBtn.addEventListener('click', function() {
            gameState.isSelectMode = !gameState.isSelectMode;
            gameState.warehouseSelection = [];
            gameState.sellConfirming = false;
            this.classList.toggle('active', gameState.isSelectMode);
            this.textContent = gameState.isSelectMode ? '取消' : '选择';
            renderMerchantWarehouse();
        });
    }
    
    // 出售按钮
    if (elements.merchantSellBtn) {
        elements.merchantSellBtn.addEventListener('click', function() {
            if (gameState.sellConfirming) {
                // 确认出售
                let total = 0;
                gameState.warehouseSelection.forEach(res => {
                    const count = gameState.resources[res];
                    total += count * CONFIG.resourcePrices[res];
                    gameState.resources[res] = 0;
                });
                gameState.resources.gold += total;
                
                showToast(`✅ 出售完成！获得 ${total} 金币`);
                
                // 重置状态
                gameState.warehouseSelection = [];
                gameState.isSelectMode = false;
                gameState.sellConfirming = false;
                elements.merchantSelectBtn.classList.remove('active');
                elements.merchantSelectBtn.textContent = '选择';
                
                updateUI();
                saveGame();
                renderMerchantWarehouse();
            } else {
                // 第一次点击，进入确认状态
                gameState.sellConfirming = true;
                updateSellBar();
            }
        });
    }
}

function switchPage(pageId) {
    gameState.currentPage = pageId;
    elements.navItems.forEach(item => {
        item.classList.toggle('active', item.dataset.page === pageId);
    });
    elements.pages.forEach(page => {
        page.classList.toggle('active', page.id === `page-${pageId}`);
    });
}

function setupEventListeners() {
    elements.combatBtn.addEventListener('click', toggleCombat);
    elements.resetBtn.addEventListener('click', resetGame);
    elements.modalClose.addEventListener('click', () => elements.modal.classList.remove('show'));
    elements.modal.addEventListener('click', (e) => {
        if (e.target === elements.modal) elements.modal.classList.remove('show');
    });
    elements.actionCancelBtn.addEventListener('click', cancelCurrentAction);
    
    // 行动次数选择弹窗事件
    if (elements.actionModalClose) {
        elements.actionModalClose.addEventListener('click', () => elements.actionModal.classList.remove('show'));
    }
    if (elements.actionModalCancel) {
        elements.actionModalCancel.addEventListener('click', () => elements.actionModal.classList.remove('show'));
    }
    if (elements.actionModal) {
        elements.actionModal.addEventListener('click', (e) => {
            if (e.target === elements.actionModal) elements.actionModal.classList.remove('show');
        });
    }
    if (elements.actionModalConfirm) {
        elements.actionModalConfirm.addEventListener('click', confirmActionCount);
    }
    
    // 选择次数选项
    document.querySelectorAll('.count-option').forEach(option => {
        option.addEventListener('click', function() {
            document.querySelectorAll('.count-option').forEach(o => o.classList.remove('selected'));
            this.classList.add('selected');
            // 不填充到文本框，让用户手动输入
        });
    });
    
    // 替换行动确认弹窗事件
    if (elements.replaceModalClose) {
        elements.replaceModalClose.addEventListener('click', () => {
            elements.replaceModal.classList.remove('show');
            pendingAction = null;
        });
    }
    if (elements.replaceModalCancel) {
        elements.replaceModalCancel.addEventListener('click', () => {
            elements.replaceModal.classList.remove('show');
            pendingAction = null;
        });
    }
    if (elements.replaceModalConfirm) {
        elements.replaceModalConfirm.addEventListener('click', () => {
            elements.replaceModal.classList.remove('show');
            if (pendingAction) {
                cancelCurrentAction();
                executePendingAction();
            }
        });
    }
    if (elements.replaceModal) {
        elements.replaceModal.addEventListener('click', (e) => {
            if (e.target === elements.replaceModal) {
                elements.replaceModal.classList.remove('show');
                pendingAction = null;
            }
        });
    }
}

function updateSkillNavExp(skill, expFillElem, levelElem) {
    if (!expFillElem || !levelElem) return;
    const currentExp = getSkillExpForLevel(gameState[skill + 'Level']);
    const nextExp = getSkillExpForLevel(gameState[skill + 'Level'] + 1);
    const expNeeded = nextExp - currentExp;
    const expProgress = gameState[skill + 'Exp'] - currentExp;
    const percentage = expNeeded > 0 ? (expProgress / expNeeded) * 100 : 0;
    expFillElem.style.width = `${Math.min(100, Math.max(0, percentage))}%`;
    levelElem.textContent = gameState[skill + 'Level'];
}

function openActionModal(type, id, name) {
    if (!elements.actionModal) return;
    const typeNames = { woodcutting: '伐木', mining: '挖矿' };
    elements.actionModalTitle.textContent = `选择${typeNames[type]}次数 - ${name}`;
    elements.actionCountInput.value = '';
    document.querySelectorAll('.count-option').forEach(o => o.classList.remove('selected'));
    pendingAction = { type, id, name };
    elements.actionModal.classList.add('show');
}

function confirmActionCount() {
    if (!pendingAction) return;
    
    // 检查是否有选中的选项
    const selectedOption = document.querySelector('.count-option.selected');
    let count = 1;
    
    if (selectedOption) {
        count = parseInt(selectedOption.dataset.count);
    } else if (elements.actionCountInput && elements.actionCountInput.value) {
        count = parseInt(elements.actionCountInput.value);
    }
    
    if (isNaN(count) || count < 1) {
        showToast('❌ 请输入或选择有效的次数');
        return;
    }
    
    pendingAction.count = count;
    elements.actionModal.classList.remove('show');
    
    // 检查是否有行动正在进行
    if (hasActiveAction()) {
        elements.replaceModal.classList.add('show');
    } else {
        executePendingAction();
    }
}

function executePendingAction() {
    if (!pendingAction) return;
    const { type, id, count } = pendingAction;
    
    if (type === 'woodcutting') {
        startWoodcuttingWithCount(id, count);
    } else if (type === 'mining') {
        startMiningWithCount(id, count);
    }
    
    pendingAction = null;
}

function startWoodcuttingWithCount(treeId, count) {
    const tree = CONFIG.trees.find(t => t.id === treeId);
    gameState.activeWoodcutting = treeId;
    gameState.woodcuttingCount = count;
    gameState.woodcuttingRemaining = count;
    // 重置进度条
    if (elements.actionProgressFill) {
        elements.actionProgressFill.style.width = '0%';
    }
    setActionState({ name: `采集${tree.name}`, icon: tree.icon }, tree.duration);
    renderWoodcutting();
    // 启动进度条动画
    if (animationFrame) cancelAnimationFrame(animationFrame);
    lastActionStartTime = gameState.actionStartTime;
    animationFrame = requestAnimationFrame(updateActionStatusBarSmooth);
    scheduleWoodcutting(treeId);
}

function scheduleWoodcutting(treeId) {
    const isInfinte = gameState.woodcuttingCount >= 99999;
    if (!gameState.activeWoodcutting || (!isInfinte && gameState.woodcuttingRemaining <= 0)) {
        gameState.activeWoodcutting = null;
        gameState.woodcuttingCount = 0;
        gameState.woodcuttingRemaining = 0;
        setActionState(null, 0);
        renderWoodcutting();
        return;
    }
    
    const tree = CONFIG.trees.find(t => t.id === treeId);
    if (!isInfinte) {
        gameState.woodcuttingRemaining--;
    }
    
    // 立即开始下一次行动
    if (gameState.activeWoodcutting === treeId) {
        // 重置行动开始时间为当前时间
        setActionState({ name: `采集${tree.name}`, icon: tree.icon }, tree.duration);
        // 重置进度条为 0
        if (elements.actionProgressFill) {
            elements.actionProgressFill.style.width = '0%';
        }
        updateActionStatusBar();
        renderWoodcutting();
        
        // 启动进度条动画
        if (animationFrame) cancelAnimationFrame(animationFrame);
        lastActionStartTime = gameState.actionStartTime;
        animationFrame = requestAnimationFrame(updateActionStatusBarSmooth);
        
        // 等待行动完成后继续
        setTimeout(() => {
            if (gameState.activeWoodcutting === treeId) {
                completeWoodcuttingOnce(treeId);
                // 递归调用继续下一次行动
                scheduleWoodcutting(treeId);
            }
        }, tree.duration);
    }
}

function completeWoodcuttingOnce(treeId) {
    const tree = CONFIG.trees.find(t => t.id === treeId);
    gameState.resources.wood += 1;
    addExp(tree.exp);
    addSkillExp('woodcutting', tree.exp);
    updateUI();
    saveGame();
    // 显示奖励
    if (elements.actionRewards) {
        elements.actionRewards.innerHTML = `<span class="action-reward-item">+1 ${tree.dropIcon} ${tree.drop}</span>`;
        setTimeout(() => { if (elements.actionRewards) elements.actionRewards.innerHTML = ''; }, 3000);
    }
}

function startMiningWithCount(oreId, count) {
    const ore = CONFIG.ores.find(o => o.id === oreId);
    gameState.activeMining = oreId;
    gameState.miningCount = count;
    gameState.miningRemaining = count;
    // 重置进度条
    if (elements.actionProgressFill) {
        elements.actionProgressFill.style.width = '0%';
    }
    setActionState({ name: `挖掘${ore.name}`, icon: ore.icon }, ore.duration);
    renderMining();
    // 启动进度条动画
    if (animationFrame) cancelAnimationFrame(animationFrame);
    lastActionStartTime = gameState.actionStartTime;
    animationFrame = requestAnimationFrame(updateActionStatusBarSmooth);
    scheduleMining(oreId);
}

function scheduleMining(oreId) {
    const isInfinte = gameState.miningCount >= 99999;
    if (!gameState.activeMining || (!isInfinte && gameState.miningRemaining <= 0)) {
        gameState.activeMining = null;
        gameState.miningCount = 0;
        gameState.miningRemaining = 0;
        setActionState(null, 0);
        renderMining();
        return;
    }
    
    const ore = CONFIG.ores.find(o => o.id === oreId);
    if (!isInfinte) {
        gameState.miningRemaining--;
    }
    
    // 立即开始下一次行动
    if (gameState.activeMining === oreId) {
        // 重置行动开始时间为当前时间
        setActionState({ name: `挖掘${ore.name}`, icon: ore.icon }, ore.duration);
        // 重置进度条为 0
        if (elements.actionProgressFill) {
            elements.actionProgressFill.style.width = '0%';
        }
        updateActionStatusBar();
        renderMining();
        
        // 启动进度条动画
        if (animationFrame) cancelAnimationFrame(animationFrame);
        lastActionStartTime = gameState.actionStartTime;
        animationFrame = requestAnimationFrame(updateActionStatusBarSmooth);
        
        // 等待行动完成后继续
        setTimeout(() => {
            if (gameState.activeMining === oreId) {
                completeMiningOnce(oreId);
                // 递归调用继续下一次行动
                scheduleMining(oreId);
            }
        }, ore.duration);
    }
}

function completeMiningOnce(oreId) {
    const ore = CONFIG.ores.find(o => o.id === oreId);
    gameState.resources.stone += 1;
    addExp(ore.exp);
    addSkillExp('mining', ore.exp);
    updateUI();
    saveGame();
    // 显示奖励
    if (elements.actionRewards) {
        elements.actionRewards.innerHTML = `<span class="action-reward-item">+1 ${ore.dropIcon} ${ore.drop}</span>`;
        setTimeout(() => { if (elements.actionRewards) elements.actionRewards.innerHTML = ''; }, 3000);
    }
}

function cancelCurrentAction() {
    if (!gameState.currentAction) return;
    
    // 清除所有进行中的行动，不给予奖励
    if (gameState.activeWoodcutting) {
        gameState.activeWoodcutting = null;
        gameState.woodcuttingCount = 0;
        gameState.woodcuttingRemaining = 0;
    }
    if (gameState.activeMining) {
        gameState.activeMining = null;
        gameState.miningCount = 0;
        gameState.miningRemaining = 0;
    }
    for (const actionId in gameState.activeActions) {
        delete gameState.activeActions[actionId];
    }
    if (gameState.combat.active) {
        gameState.combat.active = false;
    }
    
    // 清除奖励显示
    if (elements.actionRewards) {
        elements.actionRewards.innerHTML = '';
    }
    
    setActionState(null, 0);
    updateUI();
    renderWoodcutting();
    renderMining();
    renderGatherActions();
    renderCombatZones();
    showToast('❌ 已停止行动');
}

// 阻止点击停止按钮时触发其他事件
function setupCancelButton() {
    if (elements.actionCancelBtn) {
        elements.actionCancelBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            cancelCurrentAction();
        });
    }
}

let animationFrame = null;
let lastActionStartTime = 0;

function updateActionStatusBarSmooth() {
    if (!gameState.currentAction) return;
    
    const now = Date.now();
    const elapsed = now - gameState.actionStartTime;
    const progress = Math.min(100, (elapsed / gameState.actionDuration) * 100);
    
    elements.actionProgressFill.style.width = `${progress}%`;
    
    if (progress < 100) {
        animationFrame = requestAnimationFrame(updateActionStatusBarSmooth);
    }
    // 进度条完成后由 schedule 函数处理重置，这里不做任何操作
}

function formatTime(seconds) {
    if (seconds < 60) {
        return `${seconds.toFixed(1)}s`;
    } else if (seconds < 3600) {
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);
        return `${m}m${s}s`;
    } else {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        return `${h}h${m}m`;
    }
}

function updateActionStatusBar() {
    if (!elements.actionStatusBar) return;
    
    if (gameState.currentAction) {
        elements.actionStatusIcon.textContent = gameState.currentAction.icon;
        
        // 添加次数显示（从零往上增加）
        let countText = '';
        if (gameState.woodcuttingCount > 0 || gameState.miningCount > 0) {
            const total = gameState.woodcuttingCount || gameState.miningCount || 0;
            const remaining = gameState.woodcuttingRemaining || gameState.miningRemaining || 0;
            const completed = total - remaining;
            const countDisplay = total >= 99999 ? '∞' : `${completed}/${total}`;
            countText = ` (${countDisplay})`;
        }
        elements.actionStatusName.textContent = gameState.currentAction.name + countText;
        
        elements.actionProgressTime.textContent = formatTime(gameState.actionDuration / 1000);
        elements.actionCancelBtn.disabled = false;
        elements.actionCancelBtn.classList.add('visible');
        
        // 启动平滑动画
        if (animationFrame) cancelAnimationFrame(animationFrame);
        animationFrame = requestAnimationFrame(updateActionStatusBarSmooth);
    } else {
        if (animationFrame) cancelAnimationFrame(animationFrame);
        elements.actionStatusIcon.textContent = '∞';
        elements.actionStatusName.textContent = '休息中';
        elements.actionProgressFill.style.width = '0%';
        elements.actionProgressTime.textContent = '-';
        elements.actionCancelBtn.disabled = true;
        elements.actionCancelBtn.classList.remove('visible');
    }
}

function showActionReward(text) {
    if (!elements.actionRewards) return;
    const rewardItem = document.createElement('span');
    rewardItem.className = 'action-reward-item';
    rewardItem.textContent = text;
    elements.actionRewards.appendChild(rewardItem);
    // 3 秒后移除
    setTimeout(() => {
        if (rewardItem.parentNode) {
            rewardItem.parentNode.removeChild(rewardItem);
        }
    }, 3000);
}

function clearActionRewards() {
    if (elements.actionRewards) {
        elements.actionRewards.innerHTML = '';
    }
}

function updateUI() {
    const levelText = gameState.level.toString();
    if (elements.level) elements.level.textContent = levelText;
    if (elements.topLevel) elements.topLevel.textContent = levelText;
    
    if (elements.storageGold) elements.storageGold.textContent = formatNumber(Math.floor(gameState.resources.gold));
    if (elements.storageWood) elements.storageWood.textContent = formatNumber(Math.floor(gameState.resources.wood));
    if (elements.storageStone) elements.storageStone.textContent = formatNumber(Math.floor(gameState.resources.stone));
    if (elements.storageHerb) elements.storageHerb.textContent = formatNumber(Math.floor(gameState.resources.herb));
    
    const elapsed = Math.floor((Date.now() - gameState.startTime) / 1000);
    const hours = Math.floor(elapsed / 3600);
    const minutes = Math.floor((elapsed % 3600) / 60);
    const seconds = elapsed % 60;
    if (elements.playTime) elements.playTime.textContent = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    
    // 更新侧边栏技能经验条
    updateSkillNavExp('woodcutting', elements.navWoodcuttingExp, elements.navWoodcuttingLvl);
    updateSkillNavExp('mining', elements.navMiningExp, elements.navMiningLvl);
    updateSkillNavExp('gathering', elements.navGatherExp, elements.navGatherLvl);
    updateSkillNavExp('crafting', elements.navCraftExp, elements.navCraftLvl);
    updateSkillNavExp('combat', elements.navCombatExp, elements.navCombatLvl);
    
    // 更新顶部行动状态栏
    updateActionStatusBar();
    
    updateCombatUI();
    renderBuildings();
    renderGatherActions();
    renderCraftActions();
    renderWoodcutting();
    renderMining();
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

function getExpForLevel(level) {
    if (level >= 200) return EXP_TABLE[200];
    return EXP_TABLE[level] || 0;
}

function getExpToNextLevel() {
    const currentExp = getExpForLevel(gameState.level);
    const nextExp = getExpForLevel(gameState.level + 1);
    return nextExp - currentExp;
}

function addExp(amount) {
    gameState.exp += amount;
    let leveledUp = false;
    while (gameState.level < 200 && gameState.exp >= getExpForLevel(gameState.level + 1)) {
        gameState.level++;
        leveledUp = true;
        gameState.resources.gold += 50;
    }
    if (leveledUp) {
        showToast(`🎉 升级了！当前等级：${gameState.level}`);
    }
}

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
            if (!checkUnlock(building.unlockReq)) { showToast('🔒 需要先解锁前置建筑'); return; }
            if (canAfford(building.baseCost)) { buildBuilding(buildingId); }
            else { showToast('❌ 资源不足'); }
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
    for (const res in building.baseCost) { building.baseCost[res] = Math.floor(building.baseCost[res] * 1.5); }
    addExp(10);
    updateUI();
    saveGame();
    showToast(`✅ 建造了 ${building.name}`);
}

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
        item.addEventListener('click', () => startAction(item.dataset.id));
    });
}

function hasActiveAction() {
    return gameState.currentAction !== null;
}

function setActionState(action, duration) {
    if (action) {
        gameState.currentAction = action;
        gameState.actionStartTime = Date.now();
        gameState.actionDuration = duration;
    } else {
        gameState.currentAction = null;
        gameState.actionStartTime = 0;
        gameState.actionDuration = 0;
    }
}

function startAction(actionId) {
    if (gameState.activeActions[actionId]) return;
    if (hasActiveAction()) { showToast('⏳ 已有行动正在进行中'); return; }
    const action = CONFIG.gatherActions.find(a => a.id === actionId);
    gameState.activeActions[actionId] = Date.now() + action.duration;
    setActionState({ name: action.name, icon: action.icon }, action.duration);
    renderGatherActions();
    setTimeout(() => completeAction(actionId), action.duration);
}

function completeAction(actionId) {
    // 检查行动是否仍然有效（可能已被取消）
    if (!gameState.activeActions[actionId]) return;
    
    const action = CONFIG.gatherActions.find(a => a.id === actionId);
    let rewardHTML = '';
    for (const [res, amount] of Object.entries(action.reward)) {
        gameState.resources[res] += amount;
        const icons = { gold: '💰', wood: '🪵', stone: '🪨', herb: '🌿' };
        const names = { gold: '金币', wood: '木材', stone: '石头', herb: '草药' };
        rewardHTML += `<span class="action-reward-item">+${amount} ${icons[res]} ${names[res]}</span>`;
    }
    addExp(action.exp);
    addSkillExp('gathering', action.exp);
    delete gameState.activeActions[actionId];
    setActionState(null, 0);
    updateUI();
    saveGame();
    // 显示奖励
    if (elements.actionRewards) {
        elements.actionRewards.innerHTML = rewardHTML;
        setTimeout(() => { if (elements.actionRewards) elements.actionRewards.innerHTML = ''; }, 3000);
    }
}

function renderCraftActions() {
    if (!elements.craftActions) return;
    elements.craftActions.innerHTML = CONFIG.craftRecipes.map(recipe => {
        const building = gameState.buildings[recipe.reqBuilding];
        const unlocked = building && building.level > 0;
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

function getSkillExpForLevel(level) {
    if (level >= 200) return EXP_TABLE[200];
    return EXP_TABLE[level] || 0;
}

function renderWoodcutting() {
    if (!elements.woodcuttingList) return;
    
    // 更新伐木经验条
    if (elements.woodcuttingExpFill && elements.woodcuttingLevel) {
        const currentExp = getSkillExpForLevel(gameState.woodcuttingLevel);
        const nextExp = getSkillExpForLevel(gameState.woodcuttingLevel + 1);
        const expNeeded = nextExp - currentExp;
        const expProgress = gameState.woodcuttingExp - currentExp;
        const percentage = expNeeded > 0 ? (expProgress / expNeeded) * 100 : 0;
        elements.woodcuttingExpFill.style.width = `${Math.min(100, Math.max(0, percentage))}%`;
        elements.woodcuttingLevel.textContent = gameState.woodcuttingLevel;
    }
    
    elements.woodcuttingList.innerHTML = CONFIG.trees.map(tree => {
        const isActive = gameState.activeWoodcutting === tree.id;
        const isUnlocked = gameState.level >= tree.reqLevel;
        let actionStatus = '';
        if (isActive) {
            const remaining = gameState.woodcuttingRemaining || 0;
            const total = gameState.woodcuttingCount || 1;
            const countText = total >= 99999 ? '∞' : `${remaining}/${total}`;
            actionStatus = `<div class="action-timer">采集中... ${countText}</div>`;
        }
        return `
            <div class="tree-card ${!isUnlocked ? 'locked' : ''} ${isActive ? 'active' : ''}" data-id="${tree.id}">
                <div class="tree-icon">${tree.icon}</div>
                <div class="tree-info">
                    <div class="tree-name">${tree.name}</div>
                    <div class="tree-req">等级：${tree.reqLevel} | ${tree.duration/1000}秒</div>
                    <div class="tree-drop">${tree.dropIcon} ${tree.drop} | +${tree.exp} EXP</div>
                </div>
                ${actionStatus}
                ${!isUnlocked ? '<div class="tree-locked">🔒 等级不足</div>' : ''}
            </div>
        `;
    }).join('');
    
    elements.woodcuttingList.querySelectorAll('.tree-card').forEach(card => {
        card.addEventListener('click', () => {
            const treeId = card.dataset.id;
            const tree = CONFIG.trees.find(t => t.id === treeId);
            if (gameState.level < tree.reqLevel) { showToast(`❌ 需要等级 ${tree.reqLevel}`); return; }
            if (gameState.activeWoodcutting === treeId) { showToast('⏳ 正在采集中'); return; }
            // 打开行动次数选择弹窗
            openActionModal('woodcutting', treeId, tree.name);
        });
    });
}

function startWoodcutting(treeId) {
    if (hasActiveAction()) { showToast('⏳ 已有行动正在进行中'); return; }
    const tree = CONFIG.trees.find(t => t.id === treeId);
    gameState.activeWoodcutting = treeId;
    setActionState({ name: `采集${tree.name}`, icon: tree.icon }, tree.duration);
    renderWoodcutting();
    setTimeout(() => completeWoodcutting(treeId), tree.duration);
}

function addSkillExp(skill, amount) {
    const skillKey = skill + 'Exp';
    const levelKey = skill + 'Level';
    gameState[skillKey] += amount;
    
    let leveledUp = false;
    while (gameState[levelKey] < 200 && gameState[skillKey] >= getSkillExpForLevel(gameState[levelKey] + 1)) {
        gameState[levelKey]++;
        leveledUp = true;
    }
    
    if (leveledUp) {
        showToast(`🎉 ${skill === 'woodcutting' ? '伐木' : skill === 'mining' ? '挖矿' : '技能'}升级了！当前等级：${gameState[levelKey]}`);
    }
}

function completeWoodcutting(treeId) {
    // 检查行动是否仍然有效（可能已被取消）
    if (!gameState.activeWoodcutting) return;
    
    const tree = CONFIG.trees.find(t => t.id === treeId);
    const dropAmount = 1;
    gameState.resources.wood += dropAmount;
    addExp(tree.exp);
    addSkillExp('woodcutting', tree.exp);
    gameState.activeWoodcutting = null;
    setActionState(null, 0);
    updateUI();
    saveGame();
    // 显示奖励
    if (elements.actionRewards) {
        elements.actionRewards.innerHTML = `<span class="action-reward-item">+${dropAmount} ${tree.dropIcon} ${tree.drop}</span>`;
        setTimeout(() => { if (elements.actionRewards) elements.actionRewards.innerHTML = ''; }, 3000);
    }
}

function renderMining() {
    if (!elements.miningList) return;
    
    // 更新挖矿经验条
    if (elements.miningExpFill && elements.miningLevel) {
        const currentExp = getSkillExpForLevel(gameState.miningLevel);
        const nextExp = getSkillExpForLevel(gameState.miningLevel + 1);
        const expNeeded = nextExp - currentExp;
        const expProgress = gameState.miningExp - currentExp;
        const percentage = expNeeded > 0 ? (expProgress / expNeeded) * 100 : 0;
        elements.miningExpFill.style.width = `${Math.min(100, Math.max(0, percentage))}%`;
        elements.miningLevel.textContent = gameState.miningLevel;
    }
    
    elements.miningList.innerHTML = CONFIG.ores.map(ore => {
        const isActive = gameState.activeMining === ore.id;
        const isUnlocked = gameState.level >= ore.reqLevel;
        let actionStatus = '';
        if (isActive) {
            const remaining = gameState.miningRemaining || 0;
            const total = gameState.miningCount || 1;
            const countText = total >= 99999 ? '∞' : `${remaining}/${total}`;
            actionStatus = `<div class="action-timer">挖掘中... ${countText}</div>`;
        }
        return `
            <div class="ore-card ${!isUnlocked ? 'locked' : ''} ${isActive ? 'active' : ''}" data-id="${ore.id}">
                <div class="ore-icon">${ore.icon}</div>
                <div class="ore-info">
                    <div class="ore-name">${ore.name}</div>
                    <div class="ore-req">等级：${ore.reqLevel} | ${ore.duration/1000}秒</div>
                    <div class="ore-drop">${ore.dropIcon} ${ore.drop} | +${ore.exp} EXP</div>
                </div>
                ${actionStatus}
                ${!isUnlocked ? '<div class="ore-locked">🔒 等级不足</div>' : ''}
            </div>
        `;
    }).join('');
    
    elements.miningList.querySelectorAll('.ore-card').forEach(card => {
        card.addEventListener('click', () => {
            const oreId = card.dataset.id;
            const ore = CONFIG.ores.find(o => o.id === oreId);
            if (gameState.level < ore.reqLevel) { showToast(`❌ 需要等级 ${ore.reqLevel}`); return; }
            if (gameState.activeMining === oreId) { showToast('⏳ 正在挖掘中'); return; }
            // 打开行动次数选择弹窗
            openActionModal('mining', oreId, ore.name);
        });
    });
}

function startMining(oreId) {
    if (hasActiveAction()) { showToast('⏳ 已有行动正在进行中'); return; }
    const ore = CONFIG.ores.find(o => o.id === oreId);
    gameState.activeMining = oreId;
    setActionState({ name: `挖掘${ore.name}`, icon: ore.icon }, ore.duration);
    renderMining();
    setTimeout(() => completeMining(oreId), ore.duration);
}

function completeMining(oreId) {
    // 检查行动是否仍然有效（可能已被取消）
    if (!gameState.activeMining) return;
    
    const ore = CONFIG.ores.find(o => o.id === oreId);
    const dropAmount = 1;
    gameState.resources.stone += dropAmount;
    addExp(ore.exp);
    addSkillExp('mining', ore.exp);
    gameState.activeMining = null;
    setActionState(null, 0);
    updateUI();
    saveGame();
    // 显示奖励
    if (elements.actionRewards) {
        elements.actionRewards.innerHTML = `<span class="action-reward-item">+${dropAmount} ${ore.dropIcon} ${ore.drop}</span>`;
        setTimeout(() => { if (elements.actionRewards) elements.actionRewards.innerHTML = ''; }, 3000);
    }
}

function craftItem(recipeId) {
    const recipe = CONFIG.craftRecipes.find(r => r.id === recipeId);
    const building = gameState.buildings[recipe.reqBuilding];
    if (!building || building.level === 0) { showToast(`🔒 需要 ${CONFIG.buildings.find(b => b.id === recipe.reqBuilding).name}`); return; }
    if (!canAfford(recipe.cost)) { showToast('❌ 资源不足'); return; }
    payCost(recipe.cost);
    addExp(recipe.exp);
    addSkillExp('crafting', recipe.exp);
    gameState.resources.gold += recipe.exp * 2;
    updateUI();
    saveGame();
    showToast(`✅ 制作了 ${recipe.name}`);
}

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
            if (gameState.level < CONFIG.combatZones[index].reqLevel) { showToast(`❌ 需要等级 ${CONFIG.combatZones[index].reqLevel}`); return; }
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
        elements.combatLocation.textContent = CONFIG.combatZones.find(z => z.id === gameState.combat.zoneId)?.name || '战斗中';
        elements.combatTimer.textContent = `剩余：${Math.ceil(remaining / 1000)}秒`;
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
    if (hasActiveAction()) { showToast('⏳ 已有行动正在进行中'); return; }
    const zone = CONFIG.combatZones[gameState.currentZoneIndex];
    if (gameState.level < zone.reqLevel) { showToast(`❌ 需要等级 ${zone.reqLevel}`); return; }
    gameState.combat.active = true;
    gameState.combat.zoneId = zone.id;
    gameState.combat.endTime = Date.now() + zone.duration;
    setActionState({ name: `${zone.name}`, icon: zone.icon }, zone.duration);
    updateCombatUI();
    renderCombatZones();
    setTimeout(() => completeCombat(zone), zone.duration);
}

function completeCombat(zone) {
    // 检查行动是否仍然有效（可能已被取消）
    if (!gameState.combat.active) return;
    
    gameState.combat.active = false;
    setActionState(null, 0);
    let rewards = [];
    let rewardHTML = '';
    zone.rewards.forEach(r => {
        const amount = Math.floor(Math.random() * (r.max - r.min + 1)) + r.min;
        gameState.resources[r.item] += amount;
        const icons = { gold: '💰', wood: '🪵', stone: '🪨', herb: '🌿' };
        const name = r.item === 'gold' ? '金币' : r.item === 'wood' ? '木材' : r.item === 'stone' ? '石头' : '草药';
        rewards.push(`+${amount} ${icons[r.item]} ${name}`);
        rewardHTML += `<span class="action-reward-item">+${amount} ${icons[r.item]} ${name}</span>`;
    });
    const expReward = zone.difficulty * 10;
    addExp(expReward);
    addSkillExp('combat', expReward);
    elements.combatRewards.innerHTML = `🎉 战斗奖励：${rewards.join('  |  ')}`;
    // 显示奖励
    if (elements.actionRewards) {
        elements.actionRewards.innerHTML = rewardHTML;
        setTimeout(() => { if (elements.actionRewards) elements.actionRewards.innerHTML = ''; }, 3000);
    }
    gameState.currentZoneIndex = (gameState.currentZoneIndex + 1) % CONFIG.combatZones.length;
    updateUI();
    saveGame();
}

function showToast(message) {
    const toast = document.createElement('div');
    toast.textContent = message;
    toast.style.cssText = `position: fixed; top: 110px; left: 20px; background: rgba(139, 44, 45, 0.95); color: #fff; padding: 8px 14px; border-radius: 6px; z-index: 3000; animation: toastFade 3s ease-out; border: 1px solid rgba(139, 44, 45, 0.5); font-size: 0.85rem; text-align: left;`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

const style = document.createElement('style');
style.textContent = `@keyframes toastFade { 0% { opacity: 0; transform: translateX(-50%) translateY(-20px); } 10% { opacity: 1; transform: translateX(-50%) translateY(0); } 90% { opacity: 1; transform: translateX(-50%) translateY(0); } 100% { opacity: 0; transform: translateX(-50%) translateY(-20px); } }`;
document.head.appendChild(style);

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
                if (endTime > now) setTimeout(() => completeAction(actionId), endTime - now);
                else delete gameState.activeActions[actionId];
            }
            if (gameState.combat.active && gameState.combat.endTime > now) {
                setTimeout(() => completeCombat(CONFIG.combatZones.find(z => z.id === gameState.combat.zoneId)), gameState.combat.endTime - now);
            } else { gameState.combat.active = false; }
            if (gameState.activeWoodcutting) {
                gameState.activeWoodcutting = null;
            }
            if (gameState.activeMining) {
                gameState.activeMining = null;
            }
            console.log('💾 游戏已加载');
        } catch (e) { console.error('加载失败:', e); }
    }
}

function resetGame() {
    if (confirm('⚠️ 确定要重置所有进度吗？')) {
        localStorage.removeItem('medievalMercenarySave');
        location.reload();
    }
}

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

window.addEventListener('DOMContentLoaded', () => {
    const loading = document.getElementById('loading');
    if (loading) loading.style.display = 'none';
    init();
});
window.addEventListener('beforeunload', saveGame);
