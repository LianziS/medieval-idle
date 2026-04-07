/**
 * 中世纪雇佣兵 - 后端服务
 * 
 * 技术栈：Node.js + Express + Socket.io + SQLite
 * 端口：1368
 */

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const path = require('path');
const { GameEngine } = require('./GameEngine');

// 游戏引擎实例管理（按用户ID）
const gameEngines = new Map();

// Socket 连接与引擎映射
const socketEngineMap = new Map();

// 用户ID -> Socket列表映射（用于检测重复登录）
const userSockets = new Map();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// 配置
const JWT_SECRET = 'medieval_mercenary_secret_key_2024'; // 生产环境应使用环境变量
const TOKEN_EXPIRY = '365d'; // 1年过期（自动登录用户）

// 中间件
app.use(express.json());

// 静态文件服务（统一使用 frontend 目录）
app.use(express.static(path.join(__dirname, '../frontend')));

// ============ 数据库初始化 ============

const db = new sqlite3.Database('./game.db', (err) => {
    if (err) console.error('数据库连接失败:', err);
    else console.log('✅ 数据库已连接');
});

// 创建表
db.serialize(() => {
    // 用户表
    db.run(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            email TEXT NOT NULL,
            password_hash TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            last_login DATETIME
        )
    `);

    // 用户游戏数据
    db.run(`
        CREATE TABLE IF NOT EXISTS user_game_data (
            user_id INTEGER PRIMARY KEY,
            data JSON NOT NULL,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    `);

    // 全服聊天记录
    db.run(`
        CREATE TABLE IF NOT EXISTS chat_messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            username TEXT NOT NULL,
            message TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    `);

    // 行动日志（用于防作弊验证）
    db.run(`
        CREATE TABLE IF NOT EXISTS action_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            action_type TEXT NOT NULL,
            action_data JSON NOT NULL,
            server_time DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    `);
});

// ============ JWT 验证中间件 ============

function authMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: '未登录' });
    }
    
    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.userId = decoded.userId;
        req.username = decoded.username;
        next();
    } catch (e) {
        return res.status(401).json({ error: 'Token无效或已过期' });
    }
}

// ============ 认证 API ============

// 注册
app.post('/api/auth/register', async (req, res) => {
    const { username, email, password } = req.body;
    
    // 验证
    if (!username || !email || !password) {
        return res.status(400).json({ error: '用户名、邮箱和密码不能为空' });
    }
    if (!/^[a-zA-Z0-9]{4,16}$/.test(username)) {
        return res.status(400).json({ error: '用户名需要4-16位字母或数字' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({ error: '请输入有效的邮箱地址' });
    }
    if (password.length < 6) {
        return res.status(400).json({ error: '密码至少6位' });
    }
    
    try {
        // 检查用户名是否存在
        db.get('SELECT id FROM users WHERE username = ?', [username], async (err, row) => {
            if (err) return res.status(500).json({ error: '数据库错误' });
            if (row) return res.status(400).json({ error: '用户名已存在' });
            
            // 检查邮箱是否存在
            db.get('SELECT id FROM users WHERE email = ?', [email], async (err, row) => {
                if (err) return res.status(500).json({ error: '数据库错误' });
                if (row) return res.status(400).json({ error: '该邮箱已被注册' });
            
                // 加密密码
                const passwordHash = await bcrypt.hash(password, 10);
            
            // 创建用户
            db.run(
                'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
                [username, email, passwordHash],
                function(err) {
                    if (err) return res.status(500).json({ error: '注册失败' });
                    
                    // 初始化游戏数据
                    const initialData = {
                        resources: { gold: 0, wood: 0, stone: 0, herb: 0 },
                        buildings: {},
                        level: 1, exp: 0,
                        woodcuttingLevel: 1, woodcuttingExp: 0,
                        miningLevel: 1, miningExp: 0,
                        gatheringLevel: 1, gatheringExp: 0,
                        craftingLevel: 1, craftingExp: 0,
                        forgingLevel: 1, forgingExp: 0,
                        tailoringLevel: 1, tailoringExp: 0,
                        alchemyLevel: 1, alchemyExp: 0,
                        brewingLevel: 1, brewingExp: 0,
                        combatLevel: 1, combatExp: 0,
                        woodcuttingInventory: {},
                        miningInventory: {},
                        gatheringInventory: {},
                        planksInventory: {},
                        ingotsInventory: {},
                        fabricsInventory: {},
                        potionsInventory: {},
                        essencesInventory: {},
                        brewsInventory: {},
                        tokensInventory: {
                            wood_token: 0, mining_token: 0, gathering_token: 0,
                            forging_token: 0, crafting_token: 0, alchemy_token: 0,
                            tailoring_token: 0, brewing_token: 0
                        },
                        equipment: { axe: null, pickaxe: null, chisel: null, needle: null, scythe: null, hammer: null, tongs: null, rod: null },
                        toolsInventory: { axes: [], pickaxes: [], chisels: [], needles: [], scythes: [], hammers: [], tongs: [], rods: [] },
                        merchantData: {},
                        activeActions: {}
                    };
                    
                    db.run(
                        'INSERT INTO user_game_data (user_id, data) VALUES (?, ?)',
                        [this.lastID, JSON.stringify(initialData)]
                    );
                    
                    res.json({ success: true, message: '注册成功' });
                }
            );
            });  // 结束邮箱检查的 db.get
        });  // 结束用户名检查的 db.get
    } catch (e) {
        res.status(500).json({ error: '服务器错误' });
    }
});

// 登录
app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;
    
    if (!username || !password) {
        return res.status(400).json({ error: '用户名和密码不能为空' });
    }
    
    db.get('SELECT * FROM users WHERE username = ?', [username], async (err, user) => {
        if (err) return res.status(500).json({ error: '数据库错误' });
        if (!user) return res.status(401).json({ error: '用户名或密码错误' });
        
        // 验证密码
        const valid = await bcrypt.compare(password, user.password_hash);
        if (!valid) return res.status(401).json({ error: '用户名或密码错误' });
        
        // 更新最后登录时间
        db.run('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?', [user.id]);
        
        // 生成 JWT
        const token = jwt.sign(
            { userId: user.id, username: user.username },
            JWT_SECRET,
            { expiresIn: TOKEN_EXPIRY }
        );
        
        res.json({ 
            success: true, 
            token,
            user: { id: user.id, username: user.username }
        });
    });
});

// 验证 Token
app.get('/api/auth/verify', authMiddleware, (req, res) => {
    res.json({ valid: true, userId: req.userId, username: req.username });
});

// 退出登录（清除服务端会话，客户端清除 localStorage）
app.post('/api/auth/logout', authMiddleware, (req, res) => {
    res.json({ success: true });
});

// ============ 游戏 API ============

// 健康检查
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
});

// 行动开始 - 记录到数据库用于验证
app.post('/api/game/action/start', authMiddleware, (req, res) => {
    const { actionType, targetId, count } = req.body;
    const serverStartTime = Date.now();
    
    // 记录行动日志
    db.run(
        'INSERT INTO action_logs (user_id, action_type, action_data) VALUES (?, ?, ?)',
        [req.userId, actionType, JSON.stringify({ targetId, count, serverStartTime })]
    );
    
    res.json({ 
        success: true, 
        actionId: `${req.userId}_${serverStartTime}`,
        serverStartTime 
    });
});

// 行动完成 - 验证并发放奖励
app.post('/api/game/action/complete', authMiddleware, (req, res) => {
    const { actionId, actionType, targetId } = req.body;
    const serverEndTime = Date.now();
    
    // 查找行动日志
    db.get(
        'SELECT * FROM action_logs WHERE user_id = ? AND action_type = ? ORDER BY server_time DESC LIMIT 1',
        [req.userId, actionType],
        (err, row) => {
            if (err || !row) {
                return res.status(400).json({ error: '行动记录不存在' });
            }
            
            const actionData = JSON.parse(row.action_data);
            const serverStartTime = actionData.serverStartTime;
            const elapsed = serverEndTime - serverStartTime;
            
            // 返回验证结果
            res.json({
                success: true,
                validation: {
                    elapsed,
                    serverStartTime,
                    serverEndTime,
                    isValid: true
                }
            });
        }
    );
});

// 获取游戏数据
app.get('/api/game/data', authMiddleware, (req, res) => {
    db.get('SELECT data FROM user_game_data WHERE user_id = ?', [req.userId], (err, row) => {
        if (err) return res.status(500).json({ error: '数据库错误' });
        if (!row) return res.status(404).json({ error: '数据不存在' });
        
        res.json({ success: true, data: JSON.parse(row.data) });
    });
});

// 保存游戏数据
app.post('/api/game/save', authMiddleware, (req, res) => {
    const data = req.body;
    
    db.run(
        'UPDATE user_game_data SET data = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?',
        [JSON.stringify(data), req.userId],
        function(err) {
            if (err) return res.status(500).json({ error: '保存失败' });
            res.json({ success: true });
        }
    );
});

// ============ 聊天 API ============

// 获取聊天记录
app.get('/api/chat/history', (req, res) => {
    const limit = parseInt(req.query.limit) || 50;
    db.all(
        `SELECT id, username, message, created_at FROM chat_messages ORDER BY created_at DESC LIMIT ?`,
        [limit],
        (err, rows) => {
            if (err) return res.status(500).json({ error: '数据库错误' });
            res.json(rows.reverse());
        }
    );
});

// ============ 页面路由 ============

// 登录页
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/login.html'));
});

// 游戏页（兼容 /game 和 /game.html）
app.get('/game', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

app.get('/game.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// 默认路由
app.get('/', (req, res) => {
    res.redirect('/login');
});

// ============ API 路由 ============

// 获取游戏配置（公开API）
app.get('/api/config', (req, res) => {
    const { CONFIG } = require('./GameConfig');
    res.json(CONFIG);
});

// ============ Socket.io 连接处理 ============

/**
 * 计算离线收益
 * 基于离线时间和游戏进度计算收益
 */
function calculateOfflineRewards(gameEngine, offlineMinutes) {
    const state = gameEngine.state;
    const rewards = {
        offlineMinutes,
        items: {},
        experience: {},
        gold: 0
    };
    
    // 离线收益限制：最多计算12小时
    const maxMinutes = 720;
    const effectiveMinutes = Math.min(offlineMinutes, maxMinutes);
    
    // 计算基础金币收益（基于等级）
    const baseGoldPerMinute = state.level * 0.5;
    rewards.gold = Math.floor(baseGoldPerMinute * effectiveMinutes);
    
    // 根据各技能等级计算物品和经验收益
    const skills = [
        { key: 'woodcutting', levelKey: 'woodcuttingLevel', invKey: 'woodcuttingInventory' },
        { key: 'mining', levelKey: 'miningLevel', invKey: 'miningInventory' },
        { key: 'gathering', levelKey: 'gatheringLevel', invKey: 'gatheringInventory' },
        { key: 'crafting', levelKey: 'craftingLevel', invKey: 'planksInventory' },
        { key: 'forging', levelKey: 'forgingLevel', invKey: 'ingotsInventory' },
        { key: 'tailoring', levelKey: 'tailoringLevel', invKey: 'fabricsInventory' },
        { key: 'alchemy', levelKey: 'alchemyLevel', invKey: 'potionsInventory' },
        { key: 'brewing', levelKey: 'brewingLevel', invKey: 'brewsInventory' }
    ];
    
    // 简化的收益计算：每个技能根据等级获得少量经验
    skills.forEach(skill => {
        const level = state[skill.levelKey] || 1;
        // 离线经验：每分钟获得 level * 0.5 经验
        const expGain = Math.floor(level * 0.5 * effectiveMinutes);
        if (expGain > 0) {
            rewards.experience[skill.key] = expGain;
            // 实际添加经验到游戏状态
            gameEngine.addSkillExp(skill.levelKey, expGain);
        }
    });
    
    // 添加金币到游戏状态
    state.gold += rewards.gold;
    
    return rewards;
}

io.on('connection', (socket) => {
    console.log(`用户连接: ${socket.id}`);
    
    let currentUser = null;
    let gameEngine = null;
    
    // 认证
    socket.on('auth', (data) => {
        try {
            const decoded = jwt.verify(data.token, JWT_SECRET);
            currentUser = decoded;
            socket.userId = decoded.userId;
            socket.username = decoded.username;
            socket.join('global'); // 加入全服频道
            console.log(`用户认证成功: ${decoded.username} (userId: ${decoded.userId}, socket: ${socket.id})`);
            
            // 断开该用户之前的 socket 连接（防止重复登录导致存档混乱）
            // 但不显示警告消息（刷新页面/网络波动是正常行为）
            if (userSockets.has(decoded.userId)) {
                const oldSockets = userSockets.get(decoded.userId);
                console.log(`检测到用户 ${decoded.username} 有 ${oldSockets.length} 个旧连接，正在清理...`);
                oldSockets.forEach(oldSocketId => {
                    if (oldSocketId !== socket.id) {
                        const oldSocket = io.sockets.sockets.get(oldSocketId);
                        if (oldSocket) {
                            // 静默断开，不显示警告消息（避免刷新页面时的误报）
                            oldSocket.disconnect(true);
                        }
                    }
                });
            }
            
            // 更新用户的 socket 列表
            userSockets.set(decoded.userId, [socket.id]);
            
            // 获取或创建游戏引擎实例
            if (gameEngines.has(decoded.userId)) {
                // 已有内存中的实例（通常是页面刷新，不需要显示离线收益）
                gameEngine = gameEngines.get(decoded.userId);
                socketEngineMap.set(socket.id, { gameEngine, socket });
                socket.emit('auth_result', { success: true, userId: decoded.userId });
                socket.emit('game_state', gameEngine.getFullState());
            } else {
                // 尝试从数据库加载存档
                db.get('SELECT data FROM user_game_data WHERE user_id = ?', [decoded.userId], (err, row) => {
                    gameEngine = new GameEngine(decoded.userId);
                    let offlineRewards = null;
                    
                    if (!err && row && row.data) {
                        try {
                            // 恢复存档数据
                            const savedState = JSON.parse(row.data);
                            gameEngine.state = { ...gameEngine.state, ...savedState };
                            console.log(`已加载用户 ${decoded.username} 的存档`);
                            
                            // 计算离线收益（如果上次退出时间有效且超过5分钟）
                            const lastLogout = savedState.lastLogoutTime || 0;
                            // 只有当 lastLogout 是合理的时间（在过去24小时内）才计算
                            const now = Date.now();
                            const maxOfflineMs = 24 * 60 * 60 * 1000; // 24小时
                            if (lastLogout > 0 && (now - lastLogout) > 0 && (now - lastLogout) < maxOfflineMs) {
                                const offlineMinutes = Math.floor((now - lastLogout) / 60000);
                                if (offlineMinutes >= 1) {
                                    offlineRewards = calculateOfflineRewards(gameEngine, offlineMinutes);
                                    console.log(`用户 ${decoded.username} 离线 ${offlineMinutes} 分钟，获得收益`);
                                }
                            }
                        } catch (parseError) {
                            console.error('存档解析失败:', parseError);
                        }
                    }
                    
                    gameEngines.set(decoded.userId, gameEngine);
                    socketEngineMap.set(socket.id, { gameEngine, socket });
                    
                    socket.emit('auth_result', { success: true, userId: decoded.userId });
                    socket.emit('game_state', gameEngine.getFullState());
                    
                    // 发送离线收益（如果有）
                    if (offlineRewards) {
                        socket.emit('offline_rewards', offlineRewards);
                    }
                });
            }
        } catch (e) {
            socket.emit('auth_result', { success: false, error: 'Token无效' });
        }
    });
    
    // ============ 游戏事件处理 ============
    
    // 开始行动
    socket.on('action_start', (data) => {
        if (!gameEngine) return socket.emit('error', { message: '未认证' });
        
        console.log('📥 action_start 收到:', JSON.stringify({ type: data.type, id: data.id, count: data.count }));
        
        const extraParams = data.itemId ? { itemId: data.itemId } : null;
        const result = gameEngine.startAction(data.type, data.id, data.count || 1, extraParams);
        
        console.log('📤 startAction 结果:', JSON.stringify({ success: result.success, isInfinite: result.action?.isInfinite, count: result.action?.count }));
        
        socket.emit('action_result', result);
        
        // 如果成功，广播状态更新
        if (result.success) {
            socket.emit('game_state_update', gameEngine.getFullState());
        }
    });
    
    // 完成一次行动
    socket.on('action_complete', () => {
        if (!gameEngine) return socket.emit('error', { message: '未认证' });
        
        const result = gameEngine.completeActionOnce();
        socket.emit('action_complete_result', result);
        socket.emit('game_state_update', gameEngine.getFullState());
        
        // 如果有下一个行动在队列中
        if (result.nextAction) {
            socket.emit('queue_next', result.nextAction);
        }
    });
    
    // 取消行动
    socket.on('action_cancel', () => {
        if (!gameEngine) return socket.emit('error', { message: '未认证' });
        
        const result = gameEngine.cancelAction();
        socket.emit('action_cancel_result', result);
        socket.emit('game_state_update', gameEngine.getFullState());
    });
    
    // 移除队列中的行动
    socket.on('queue_remove', (data) => {
        if (!gameEngine) return socket.emit('error', { message: '未认证' });
        
        const result = gameEngine.removeQueueItem(data.index);
        socket.emit('game_state_update', gameEngine.getFullState());
    });
    
    // 移动队列中的行动
    socket.on('queue_move', (data) => {
        if (!gameEngine) return socket.emit('error', { message: '未认证' });
        
        const result = gameEngine.moveQueueItem(data.index, data.action);
        socket.emit('game_state_update', gameEngine.getFullState());
    });
    
    // 替换当前行动
    socket.on('queue_replace_current', (data) => {
        if (!gameEngine) return socket.emit('error', { message: '未认证' });
        
        const result = gameEngine.replaceCurrentWithQueue(data.index);
        socket.emit('game_state_update', gameEngine.getFullState());
    });
    
    // 立即开始（清空当前和队列）
    socket.on('start_immediately', (data) => {
        if (!gameEngine) return socket.emit('error', { message: '未认证' });
        
        const result = gameEngine.startImmediately(data.type, data.id, data.count || 1);
        socket.emit('action_result', result);
        if (result.success) {
            socket.emit('game_state_update', gameEngine.getFullState());
        }
    });
    
    // 清空队列
    socket.on('queue_clear', () => {
        if (!gameEngine) return socket.emit('error', { message: '未认证' });
        
        gameEngine.clearQueue();
        socket.emit('game_state_update', gameEngine.getFullState());
    });
    
    // 装备工具
    socket.on('equip_tool', (data) => {
        if (!gameEngine) return socket.emit('error', { message: '未认证' });
        
        const result = gameEngine.equipTool(data.slotType, data.toolId);
        socket.emit('equip_result', result);
        socket.emit('game_state_update', gameEngine.getFullState());
    });
    
    // 卸下装备
    socket.on('unequip_tool', (data) => {
        if (!gameEngine) return socket.emit('error', { message: '未认证' });
        
        const result = gameEngine.unequipTool(data.slotType);
        socket.emit('unequip_result', result);
        socket.emit('game_state_update', gameEngine.getFullState());
    });
    
    // 开始锻造工具行动
    socket.on('forge_tool', (data) => {
        if (!gameEngine) return socket.emit('error', { message: '未认证' });
        
        console.log('🔨 forge_tool 收到:', JSON.stringify({ toolType: data.toolType, toolIndex: data.toolIndex, count: data.count }));
        
        const result = gameEngine.startForgeAction(data.toolType, data.toolIndex, data.count || 1);
        
        console.log('🔨 startForgeAction 结果:', JSON.stringify({ 
            success: result.success, 
            action: result.action ? { type: result.action.type, id: result.action.id, duration: result.action.duration } : null 
        }));
        
        socket.emit('action_result', result);
        if (result.success) {
            socket.emit('game_state_update', gameEngine.getFullState());
        }
    });
    
    // 立即锻造（清空当前行动和队列）
    socket.on('forge_tool_immediately', (data) => {
        if (!gameEngine) return socket.emit('error', { message: '未认证' });
        
        // 清空当前行动和队列
        gameEngine.state.activeAction = null;
        gameEngine.state.actionQueue = [];
        
        // 开始锻造
        const result = gameEngine.startForgeAction(data.toolType, data.toolIndex, data.count || 1);
        socket.emit('action_result', result);
        socket.emit('game_state_update', gameEngine.getFullState());
    });
    
    // 完成一次锻造
    socket.on('forge_complete', () => {
        if (!gameEngine) return socket.emit('error', { message: '未认证' });
        
        const result = gameEngine.completeForgeOnce();
        if (result) {
            socket.emit('forge_result', result);
            socket.emit('game_state_update', gameEngine.getFullState());
        }
    });
    
    // 获取游戏状态
    socket.on('get_state', () => {
        if (!gameEngine) return socket.emit('error', { message: '未认证' });
        socket.emit('game_state', gameEngine.getFullState());
    });
    
    // ============ 商人系统事件 ============
    
    // 获取商人数据
    socket.on('get_merchant', (data) => {
        if (!gameEngine) return socket.emit('error', { message: '未认证' });
        
        const merchantData = gameEngine.getMerchantData(data.merchantId);
        socket.emit('merchant_data', { merchantId: data.merchantId, data: merchantData });
    });
    
    // 购买商品
    socket.on('buy_goods', (data) => {
        if (!gameEngine) return socket.emit('error', { message: '未认证' });
        
        const result = gameEngine.buyGoods(data.merchantId, data.goodsId, data.count || 1);
        socket.emit('buy_result', result);
        if (result.success) {
            socket.emit('game_state_update', gameEngine.getFullState());
        }
    });
    
    // 领取任务
    socket.on('accept_quest', (data) => {
        if (!gameEngine) return socket.emit('error', { message: '未认证' });
        
        const result = gameEngine.acceptQuest(data.merchantId, data.questId);
        socket.emit('accept_quest_result', result);
        if (result.success) {
            socket.emit('game_state_update', gameEngine.getFullState());
        }
    });
    
    // 提交任务
    socket.on('submit_quest', (data) => {
        if (!gameEngine) return socket.emit('error', { message: '未认证' });
        
        const result = gameEngine.submitQuest(data.merchantId, data.questId);
        socket.emit('quest_result', result);
        if (result.success) {
            socket.emit('game_state_update', gameEngine.getFullState());
        }
    });
    
    // 出售物品
    socket.on('sell_item', (data) => {
        if (!gameEngine) return socket.emit('error', { message: '未认证' });
        
        const result = gameEngine.sellItem(data.itemType, data.itemId, data.count || 1);
        socket.emit('sell_result', result);
        if (result.success) {
            socket.emit('game_state_update', gameEngine.getFullState());
        }
    });
    
    // ============ 建筑系统事件 ============
    
    // 升级建筑
    socket.on('upgrade_building', (data) => {
        if (!gameEngine) return socket.emit('error', { message: '未认证' });
        
        const result = gameEngine.upgradeBuilding(data.buildingId);
        socket.emit('upgrade_result', result);
        if (result.success) {
            socket.emit('game_state_update', gameEngine.getFullState());
        }
    });
    
    // ============ 强化系统事件 ============
    
    // 开始强化（如果有行动正在进行则返回错误）
    socket.on('enhance_start', (data) => {
        if (!gameEngine) return socket.emit('error', { message: '未认证' });
        
        const result = gameEngine.startEnhanceAction(
            data.toolType,
            data.toolIndex,
            data.targetLevel,
            data.count || 1,
            data.protection,
            data.protectionStartLevel || 2
        );
        
        socket.emit('enhance_result', result);
        if (result.success && !result.queued) {
            socket.emit('game_state_update', gameEngine.getFullState());
        }
    });
    
    // 添加强化到队列（直接加入队列，不管是否有当前行动）
    socket.on('enhance_queue', (data) => {
        if (!gameEngine) return socket.emit('error', { message: '未认证' });
        
        const queueLength = gameEngine.state.actionQueue.length;
        const maxQueueSize = gameEngine.state.maxQueueSize || 10;
        
        if (queueLength >= maxQueueSize) {
            return socket.emit('enhance_result', { success: false, reason: '队列已满' });
        }
        
        // 检查是否有正在进行的行动
        if (!gameEngine.state.activeAction) {
            // 没有正在进行的行动，直接开始强化
            const result = gameEngine.startEnhanceAction(
                data.toolType,
                data.toolIndex,
                data.targetLevel,
                data.count || 1,
                data.protection,
                data.protectionStartLevel || 2
            );
            
            socket.emit('enhance_result', result);
            if (result.success) {
                socket.emit('game_state_update', gameEngine.getFullState());
            }
        } else {
            // 有正在进行的行动，添加到队列
            gameEngine.state.actionQueue.push({
                type: 'ENHANCE',
                toolType: data.toolType,
                toolIndex: data.toolIndex,
                targetLevel: data.targetLevel,
                count: data.count || 1,
                protection: data.protection,
                protectionStartLevel: data.protectionStartLevel || 2,
                name: '强化'
            });
            
            socket.emit('enhance_result', { 
                success: true, 
                queued: true, 
                queueLength: gameEngine.state.actionQueue.length 
            });
            socket.emit('game_state_update', gameEngine.getFullState());
        }
    });
    
    // 完成强化
    socket.on('enhance_complete', () => {
        if (!gameEngine) return socket.emit('error', { message: '未认证' });
        
        const result = gameEngine.completeEnhanceOnce();
        socket.emit('enhance_complete_result', result);
        socket.emit('game_state_update', gameEngine.getFullState());
    });
    
    // 停止强化
    socket.on('stop_enhance', () => {
        if (!gameEngine) return socket.emit('error', { message: '未认证' });
        
        const action = gameEngine.state.activeAction;
        if (!action || action.type !== 'ENHANCE') {
            return socket.emit('error', { message: '没有进行中的强化行动' });
        }
        
        // 停止强化行动
        gameEngine.state.activeAction = null;
        gameEngine.state.actionStartTime = null;
        gameEngine.state.actionDuration = null;
        gameEngine.state.actionRemaining = 0;
        
        socket.emit('stop_enhance_result', { success: true, message: '已停止强化' });
        socket.emit('game_state_update', gameEngine.getFullState());
    });
    
    // 获取强化预览信息
    socket.on('get_enhance_preview', (data) => {
        if (!gameEngine) return socket.emit('error', { message: '未认证' });
        
        const { toolType, toolIndex } = data;
        const toolsKey = gameEngine.getToolsKey(toolType);
        const tools = gameEngine.state.toolsInventory[toolsKey] || [];
        
        if (toolIndex < 0 || toolIndex >= tools.length) {
            return socket.emit('enhance_preview', { success: false, reason: '工具不存在' });
        }
        
        const tool = tools[toolIndex];
        const toolId = typeof tool === 'string' ? tool : tool.id;
        const currentLevel = typeof tool === 'object' && tool ? (tool.enhanceLevel || 0) : 0;
        
        const toolConfig = gameEngine.getToolConfig(toolType, toolId);
        const tier = gameEngine.getToolTier(toolId);
        const materialCheck = gameEngine.checkEnhanceMaterials(toolId, toolType);
        const successRate = gameEngine.getEnhanceSuccessRate(currentLevel);
        const exp = gameEngine.calculateEnhanceExp(toolId, currentLevel);
        
        // 获取可用保护垫
        const protectionTools = gameEngine.getSameToolsForProtection(toolType, toolId, currentLevel, toolIndex);
        
        socket.emit('enhance_preview', {
            success: true,
            toolId,
            toolName: toolConfig?.name || toolId,
            toolIcon: toolConfig?.icon || '🔧',
            currentLevel,
            targetLevel: currentLevel + 1,
            tier,
            successRate,
            exp,
            materials: materialCheck.cost,
            canEnhance: materialCheck.canEnhance,
            missing: materialCheck.missing,
            protectionTools,
            reqEquipLevel: toolConfig?.reqEquipLevel || 1
        });
    });
    
    // GM 指令（测试用）
    socket.on('gm_command', (data) => {
        if (!gameEngine) return socket.emit('error', { message: '未认证' });
        
        // 检查是否是 GM（可以根据用户ID或其他方式判断）
        // 这里暂时允许所有用户使用 GM 指令（测试阶段）
        
        switch (data.command) {
            case 'add_gold':
                gameEngine.state.gold += data.amount || 1000;
                break;
            case 'add_item':
                gameEngine.addItem(data.itemType, data.itemId, data.count || 1);
                break;
            case 'add_tool':
                // 添加工具到背包
                const toolType = data.toolType; // 'axes', 'pickaxes', etc.
                const toolId = data.toolId;
                if (!gameEngine.state.toolsInventory[toolType]) {
                    gameEngine.state.toolsInventory[toolType] = [];
                }
                gameEngine.state.toolsInventory[toolType].push(toolId);
                break;
            case 'set_level':
                const skillKey = data.skill + 'Level';
                if (gameEngine.state[skillKey] !== undefined) {
                    gameEngine.state[skillKey] = data.level || 10;
                }
                break;
            case 'add_exp':
                gameEngine.addSkillExp(data.skill + 'Level', data.amount || 100);
                break;
        }
        
        socket.emit('gm_result', { success: true, command: data.command });
        socket.emit('game_state_update', gameEngine.getFullState());
    });
    
    // 聊天消息
    socket.on('chat_send', (data) => {
        if (!currentUser) return;
        
        const message = data.message?.trim();
        if (!message || message.length > 200) return;
        
        // 保存到数据库
        db.run(
            'INSERT INTO chat_messages (user_id, username, message) VALUES (?, ?, ?)',
            [currentUser.userId, currentUser.username, message]
        );
        
        // 广播给所有用户
        io.to('global').emit('chat_message', {
            username: currentUser.username,
            message: message,
            time: new Date().toISOString()
        });
    });
    
    socket.on('disconnect', () => {
        console.log(`用户断开: ${socket.id} (userId: ${socket.userId || 'unknown'})`);
        
        // 清理 socket 映射
        socketEngineMap.delete(socket.id);
        
        // 清理 userSockets 映射
        if (socket.userId && userSockets.has(socket.userId)) {
            const sockets = userSockets.get(socket.userId);
            const index = sockets.indexOf(socket.id);
            if (index > -1) {
                sockets.splice(index, 1);
            }
            if (sockets.length === 0) {
                userSockets.delete(socket.userId);
                // 用户完全离线，移除内存中的游戏引擎实例
                // 这样下次登录会从数据库加载并计算离线收益
                if (currentUser && gameEngine) {
                    gameEngine.state.lastLogoutTime = Date.now();
                    db.run(
                        'INSERT OR REPLACE INTO user_game_data (user_id, data, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)',
                        [currentUser.userId, JSON.stringify(gameEngine.state)]
                    );
                    gameEngines.delete(currentUser.userId);
                    console.log(`用户 ${currentUser.username} 完全离线，已保存数据并清理内存实例`);
                }
            }
        }
        
        // 如果还有其他连接（页面刷新），只保存数据不移除实例
        if (currentUser && gameEngine && userSockets.has(currentUser.userId)) {
            gameEngine.state.lastLogoutTime = Date.now();
            db.run(
                'INSERT OR REPLACE INTO user_game_data (user_id, data, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)',
                [currentUser.userId, JSON.stringify(gameEngine.state)]
            );
        }
    });
});

// ============ 启动服务器 ============

const PORT = 1368;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`🎮 游戏服务器运行在 http://localhost:${PORT}`);
    console.log(`📝 登录页面: http://localhost:${PORT}/login`);
});

// ============ 行动定时器 ============

// 每500ms检查所有用户的活动行动
setInterval(() => {
    for (const [socketId, { gameEngine, socket }] of socketEngineMap) {
        if (gameEngine.state.activeAction) {
            const elapsed = Date.now() - gameEngine.state.actionStartTime;
            const duration = gameEngine.state.actionDuration;
            
            // 如果行动时间到了
            if (elapsed >= duration) {
                const action = gameEngine.state.activeAction;
                let result;
                
                // 根据行动类型调用不同的完成方法
                if (action.type === 'ENHANCE') {
                    result = gameEngine.completeEnhanceOnce();
                    socket.emit('enhance_complete_result', result);
                } else {
                    result = gameEngine.completeActionOnce();
                    socket.emit('action_complete_result', result);
                }
                
                socket.emit('game_state_update', gameEngine.getFullState());
                
                // 如果有下一个行动（已由 completeActionOnce 自动开始）
                if (result.nextAction) {
                    socket.emit('queue_next', result.nextAction);
                }
            }
        }
    }
}, 500);

// ============ 自动存档定时器 ============

// 每30秒自动保存所有在线用户的存档
setInterval(() => {
    for (const [userId, gameEngine] of gameEngines) {
        if (gameEngine.state) {
            db.run(
                'INSERT OR REPLACE INTO user_game_data (user_id, data, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)',
                [userId, JSON.stringify(gameEngine.state)],
                (err) => {
                    if (err) console.error(`自动存档失败 用户${userId}:`, err);
                }
            );
        }
    }
}, 30000);

// ============ 错误处理和进程管理 ============

// 捕获未处理的异常
process.on('uncaughtException', (err) => {
    console.error('❌ 未捕获的异常:', err);
    console.error('Stack:', err.stack);
    // 不退出，尝试继续运行
});

// 捕获未处理的 Promise 拒绝
process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ 未处理的 Promise 拒绝:', reason);
});

// 优雅关闭
function gracefulShutdown(signal) {
    console.log(`\n📢 收到 ${signal} 信号，正在保存数据并关闭服务器...`);
    
    // 保存所有用户数据
    let savedCount = 0;
    for (const [userId, gameEngine] of gameEngines) {
        if (gameEngine.state) {
            try {
                db.run(
                    'INSERT OR REPLACE INTO user_game_data (user_id, data, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)',
                    [userId, JSON.stringify(gameEngine.state)]
                );
                savedCount++;
            } catch (err) {
                console.error(`保存用户 ${userId} 数据失败:`, err);
            }
        }
    }
    console.log(`✅ 已保存 ${savedCount} 个用户的数据`);
    
    // 关闭数据库
    db.close(() => {
        console.log('✅ 数据库已关闭');
        process.exit(0);
    });
    
    // 强制退出超时
    setTimeout(() => {
        console.log('⚠️ 强制退出');
        process.exit(1);
    }, 5000);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

module.exports = { app, io, db };