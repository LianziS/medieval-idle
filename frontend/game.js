/**
 * 放置矿工 - 游戏逻辑
 */

// 游戏配置
const CONFIG = {
    goldPerClick: 1,
    autoSaveInterval: 5000, // 5 秒自动保存
    buildings: [
        {
            id: 'cursor',
            name: '👆 光标',
            icon: '👆',
            baseCost: 15,
            baseProduction: 0.1
        },
        {
            id: 'mine',
            name: '⛏️ 矿场',
            icon: '⛏️',
            baseCost: 100,
            baseProduction: 1
        },
        {
            id: 'farm',
            name: '🌾 农场',
            icon: '🌾',
            baseCost: 500,
            baseProduction: 4
        },
        {
            id: 'factory',
            name: '🏭 工厂',
            icon: '🏭',
            baseCost: 2000,
            baseProduction: 10
        },
        {
            id: 'bank',
            name: '🏦 银行',
            icon: '🏦',
            baseCost: 10000,
            baseProduction: 40
        },
        {
            id: 'temple',
            name: '⛩️ 神庙',
            icon: '⛩️',
            baseCost: 50000,
            baseProduction: 100
        }
    ]
};

// 游戏状态
let gameState = {
    gold: 0,
    totalGold: 0,
    totalClicks: 0,
    startTime: Date.now(),
    buildings: {}
};

// 初始化建筑数据
CONFIG.buildings.forEach(b => {
    gameState.buildings[b.id] = {
        level: 0,
        cost: b.baseCost
    };
});

// DOM 元素
const elements = {
    gold: document.getElementById('gold'),
    income: document.getElementById('income'),
    totalGold: document.getElementById('total-gold'),
    totalClicks: document.getElementById('total-clicks'),
    playTime: document.getElementById('play-time'),
    clickBtn: document.getElementById('click-btn'),
    clickFeedback: document.getElementById('click-feedback'),
    buildingsList: document.getElementById('buildings-list'),
    resetBtn: document.getElementById('reset-btn')
};

// 初始化游戏
function init() {
    loadGame();
    renderBuildings();
    setupEventListeners();
    startGameLoop();
    updateUI();
    console.log('🎮 放置矿工 已启动!');
}

// 设置事件监听
function setupEventListeners() {
    elements.clickBtn.addEventListener('click', handleClick);
    elements.resetBtn.addEventListener('click', handleReset);
}

// 点击事件
function handleClick(e) {
    // 添加金币
    addGold(CONFIG.goldPerClick);
    gameState.totalClicks++;
    
    // 显示反馈动画
    showClickFeedback(e);
    
    // 按钮动画
    elements.clickBtn.style.transform = 'scale(0.95)';
    setTimeout(() => {
        elements.clickBtn.style.transform = 'scale(1)';
    }, 50);
    
    updateUI();
}

// 显示点击反馈
function showClickFeedback(e) {
    const rect = elements.clickBtn.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    elements.clickFeedback.textContent = `+${CONFIG.goldPerClick}`;
    elements.clickFeedback.style.left = `${x}px`;
    elements.clickFeedback.style.top = `${y}px`;
    elements.clickFeedback.classList.add('show');
    
    setTimeout(() => {
        elements.clickFeedback.classList.remove('show');
    }, 800);
}

// 添加金币
function addGold(amount) {
    gameState.gold += amount;
    gameState.totalGold += amount;
}

// 计算每秒收入
function calculateIncome() {
    let income = 0;
    CONFIG.buildings.forEach(b => {
        const building = gameState.buildings[b.id];
        income += building.level * b.baseProduction;
    });
    return income;
}

// 计算建筑成本
function calculateCost(baseCost, level) {
    return Math.floor(baseCost * Math.pow(1.15, level));
}

// 购买建筑
function buyBuilding(buildingId) {
    const building = CONFIG.buildings.find(b => b.id === buildingId);
    const playerBuilding = gameState.buildings[buildingId];
    
    if (gameState.gold >= playerBuilding.cost) {
        gameState.gold -= playerBuilding.cost;
        playerBuilding.level++;
        playerBuilding.cost = calculateCost(building.baseCost, playerBuilding.level);
        
        updateUI();
        renderBuildings();
        saveGame();
    }
}

// 渲染建筑列表
function renderBuildings() {
    elements.buildingsList.innerHTML = CONFIG.buildings.map(b => {
        const playerBuilding = gameState.buildings[b.id];
        const canAfford = gameState.gold >= playerBuilding.cost;
        
        return `
            <div class="building-card">
                <div class="building-icon">${b.icon}</div>
                <div class="building-info">
                    <div class="building-name">${b.name}</div>
                    <div class="building-level">等级：${playerBuilding.level}</div>
                    <div class="building-production">+${b.baseProduction} 金币/秒</div>
                </div>
                <button 
                    class="building-btn" 
                    data-id="${b.id}"
                    ${!canAfford ? 'disabled' : ''}
                >
                    购买 (${formatNumber(playerBuilding.cost)})
                </button>
            </div>
        `;
    }).join('');
    
    // 绑定购买事件
    elements.buildingsList.querySelectorAll('.building-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            buyBuilding(btn.dataset.id);
        });
    });
}

// 更新 UI
function updateUI() {
    const income = calculateIncome();
    
    elements.gold.textContent = formatNumber(Math.floor(gameState.gold));
    elements.income.textContent = formatNumber(income);
    elements.totalGold.textContent = formatNumber(Math.floor(gameState.totalGold));
    elements.totalClicks.textContent = formatNumber(gameState.totalClicks);
    
    // 更新游戏时间
    const elapsed = Math.floor((Date.now() - gameState.startTime) / 1000);
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    elements.playTime.textContent = 
        `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    
    // 更新页面标题
    document.title = `💰 ${formatNumber(Math.floor(gameState.gold))} 金币 - 放置矿工`;
    
    // 重新渲染建筑（更新按钮状态）
    renderBuildings();
}

// 游戏主循环
function startGameLoop() {
    // 每秒增加收入
    setInterval(() => {
        const income = calculateIncome();
        if (income > 0) {
            addGold(income);
            updateUI();
        }
    }, 1000);
    
    // 自动保存
    setInterval(saveGame, CONFIG.autoSaveInterval);
}

// 保存游戏
function saveGame() {
    localStorage.setItem('idleMinerSave', JSON.stringify(gameState));
}

// 加载游戏
function loadGame() {
    const saved = localStorage.getItem('idleMinerSave');
    if (saved) {
        try {
            const loaded = JSON.parse(saved);
            // 合并保存的数据，确保新字段不会丢失
            gameState = { ...gameState, ...loaded };
            
            // 重新计算建筑成本（防止版本更新后成本错误）
            CONFIG.buildings.forEach(b => {
                const playerBuilding = gameState.buildings[b.id];
                if (playerBuilding) {
                    playerBuilding.cost = calculateCost(b.baseCost, playerBuilding.level);
                }
            });
            
            console.log('💾 游戏已加载');
        } catch (e) {
            console.error('加载游戏失败:', e);
        }
    }
}

// 重置游戏
function handleReset() {
    if (confirm('确定要重置所有进度吗？此操作不可恢复！')) {
        localStorage.removeItem('idleMinerSave');
        location.reload();
    }
}

// 格式化数字
function formatNumber(num) {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(2) + 'M';
    }
    if (num >= 1000) {
        return (num / 1000).toFixed(2) + 'K';
    }
    return num.toString();
}

// 启动游戏
window.addEventListener('DOMContentLoaded', init);

// 页面关闭前保存
window.addEventListener('beforeunload', saveGame);
