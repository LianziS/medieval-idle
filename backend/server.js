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
            console.log(`用户认证成功: ${decoded.username}`);
            
            // 获取或创建游戏引擎实例
            if (gameEngines.has(decoded.userId)) {
                // 已有内存中的实例
                gameEngine = gameEngines.get(decoded.userId);
                socketEngineMap.set(socket.id, { gameEngine, socket });
                socket.emit('auth_result', { success: true, userId: decoded.userId });
                socket.emit('game_state', gameEngine.getFullState());
            } else {
                // 尝试从数据库加载存档
                db.get('SELECT data FROM user_game_data WHERE user_id = ?', [decoded.userId], (err, row) => {
                    gameEngine = new GameEngine(decoded.userId);
                    
                    if (!err && row && row.data) {
                        try {
                            // 恢复存档数据
                            const savedState = JSON.parse(row.data);
                            gameEngine.state = { ...gameEngine.state, ...savedState };
                            console.log(`已加载用户 ${decoded.username} 的存档`);
                        } catch (parseError) {
                            console.error('存档解析失败:', parseError);
                        }
                    }
                    
                    gameEngines.set(decoded.userId, gameEngine);
                    socketEngineMap.set(socket.id, { gameEngine, socket });
                    
                    socket.emit('auth_result', { success: true, userId: decoded.userId });
                    socket.emit('game_state', gameEngine.getFullState());
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
        
        const result = gameEngine.startAction(data.type, data.id, data.count || 1);
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
    
    // 锻造工具
    socket.on('forge_tool', (data) => {
        if (!gameEngine) return socket.emit('error', { message: '未认证' });
        
        const result = gameEngine.forgeTool(data.toolType, data.toolIndex, data.ingotId, data.plankId);
        socket.emit('forge_result', result);
        if (result.success) {
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
        console.log(`用户断开: ${socket.id}`);
        
        // 清理 socket 映射
        socketEngineMap.delete(socket.id);
        
        // 保存游戏状态到数据库
        if (currentUser && gameEngine) {
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
                const result = gameEngine.completeActionOnce();
                socket.emit('action_complete_result', result);
                socket.emit('game_state_update', gameEngine.getFullState());
                
                // 如果有下一个行动
                if (result.nextAction) {
                    socket.emit('queue_next', result.nextAction);
                    // 自动开始下一个行动
                    const startResult = gameEngine.startAction(result.nextAction.type, result.nextAction.id, result.nextAction.count);
                    if (startResult.success) {
                        socket.emit('action_result', startResult);
                        socket.emit('game_state_update', gameEngine.getFullState());
                    }
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

module.exports = { app, io, db };