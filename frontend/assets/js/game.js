/**
 * Idle Game - 前端游戏逻辑
 */

// 游戏状态
const gameState = {
    gold: 0,
    gems: 0,
    totalGold: 0,
    totalClicks: 0,
    startTime: Date.now(),
    buildings: {
        mine: { level: 0, cost: 100, production: 0 },
        farm: { level: 0, cost: 50, production: 0 },
        factory: { level: 0, cost: 200, production: 0 }
    }
};

// 配置
const CONFIG = {
    autoSaveInterval: 5000, // 5 秒自动保存
    goldPerClick: 1
};

// DOM 元素
const elements = {
    gold: document.getElementById('gold'),
    gems: document.getElementById('gems'),
    totalGold: document.getElementById('total-gold'),
    totalClicks: document.getElementById('total-clicks'),
    playTime: document.getElementById('play-time'),
    clickBtn: document.getElementById('click-btn')
};

// 初始化游戏
function initGame() {
    loadGame();
    setupEventListeners();
    startGameLoop();
    updateUI();
    console.log('🎮 Idle Game 已启动!');
}

// 设置事件监听
function setupEventListeners() {
    // 点击挖矿按钮
    elements.clickBtn.addEventListener('click', handleClick);

    // 升级按钮
    document.querySelectorAll('.upgrade-btn').forEach(btn => {
        btn.addEventListener('click', handleUpgrade);
    });
}

// 点击事件处理
function handleClick() {
    gameState.gold += CONFIG.goldPerClick;
    gameState.totalGold += CONFIG.goldPerClick;
    gameState.totalClicks++;
    
    // 点击动画效果
    elements.clickBtn.style.transform = 'scale(0.95)';
    setTimeout(() => {
        elements.clickBtn.style.transform = 'scale(1)';
    }, 100);
    
    updateUI();
}

// 升级建筑处理
function handleUpgrade(e) {
    const btn = e.target;
    const buildingType = btn.dataset.type;
    const cost = parseInt(btn.dataset.cost);
    
    if (gameState.gold >= cost) {
        gameState.gold -= cost;
        gameState.buildings[buildingType].level++;
        gameState.buildings[buildingType].production += getProductionRate(buildingType);
        
        // 更新建筑成本 (每次升级增加 50%)
        gameState.buildings[buildingType].cost = Math.floor(cost * 1.5);
        
        // 更新按钮文本
        btn.dataset.cost = gameState.buildings[buildingType].cost;
        btn.textContent = `升级 (${gameState.buildings[buildingType].cost} 金币)`;
        
        updateUI();
        saveGame();
    } else {
        // 金币不足提示
        btn.style.animation = 'shake 0.5s';
        setTimeout(() => {
            btn.style.animation = '';
        }, 500);
    }
}

// 获取建筑产出率
function getProductionRate(type) {
    const rates = {
        mine: 1,
        farm: 0.5,
        factory: 2
    };
    return rates[type] || 0;
}

// 游戏主循环 (每秒执行)
function startGameLoop() {
    setInterval(() => {
        // 计算被动收入
        let income = 0;
        for (const [type, building] of Object.entries(gameState.buildings)) {
            income += building.production;
        }
        
        if (income > 0) {
            gameState.gold += income;
            gameState.totalGold += income;
            updateUI();
        }
        
        // 更新游戏时间
        updatePlayTime();
        
        // 检查升级按钮状态
        updateUpgradeButtons();
    }, 1000);
    
    // 自动保存
    setInterval(saveGame, CONFIG.autoSaveInterval);
}

// 更新 UI
function updateUI() {
    elements.gold.textContent = Math.floor(gameState.gold);
    elements.gems.textContent = gameState.gems;
    elements.totalGold.textContent = Math.floor(gameState.totalGold);
    elements.totalClicks.textContent = gameState.totalClicks;
    
    // 更新建筑信息
    for (const [type, building] of Object.entries(gameState.buildings)) {
        document.getElementById(`${type}-level`).textContent = building.level;
        document.getElementById(`${type}-production`).textContent = building.production;
    }
    
    // 更新页面标题
    document.title = `💰 ${Math.floor(gameState.gold)} 金币 - Idle Game`;
}

// 更新升级按钮状态
function updateUpgradeButtons() {
    document.querySelectorAll('.upgrade-btn').forEach(btn => {
        const cost = parseInt(btn.dataset.cost);
        btn.disabled = gameState.gold < cost;
        btn.style.opacity = gameState.gold < cost ? '0.5' : '1';
    });
}

// 更新游戏时间显示
function updatePlayTime() {
    const elapsed = Math.floor((Date.now() - gameState.startTime) / 1000);
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    elements.playTime.textContent = 
        `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

// 保存游戏到 localStorage
function saveGame() {
    localStorage.setItem('idleGameSave', JSON.stringify(gameState));
    console.log('💾 游戏已保存');
}

// 从 localStorage 加载游戏
function loadGame() {
    const saved = localStorage.getItem('idleGameSave');
    if (saved) {
        try {
            const loaded = JSON.parse(saved);
            Object.assign(gameState, loaded);
            gameState.startTime = Date.now(); // 重置开始时间
            
            // 更新升级按钮文本
            for (const [type, building] of Object.entries(gameState.buildings)) {
                const btn = document.querySelector(`.upgrade-btn[data-type="${type}"]`);
                if (btn) {
                    btn.dataset.cost = building.cost;
                    btn.textContent = `升级 (${building.cost} 金币)`;
                }
            }
            
            console.log('📂 游戏已加载');
        } catch (e) {
            console.error('加载游戏失败:', e);
        }
    }
}

// 启动游戏
window.addEventListener('DOMContentLoaded', initGame);

// 页面关闭前保存
window.addEventListener('beforeunload', saveGame);

// 添加摇晃动画 CSS
const style = document.createElement('style');
style.textContent = `
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-5px); }
        75% { transform: translateX(5px); }
    }
`;
document.head.appendChild(style);
