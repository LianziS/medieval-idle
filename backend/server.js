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

// 静态文件服务
app.use(express.static(path.join(__dirname, '../frontend')));
app.use(express.static(path.join(__dirname, '..'))); // 根目录的 index.html, game.js 等

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
    res.sendFile(path.join(__dirname, '../index.html'));
});

app.get('/game.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../index.html'));
});

// 默认路由
app.get('/', (req, res) => {
    res.redirect('/login');
});

// ============ Socket.io 连接处理 ============

io.on('connection', (socket) => {
    console.log(`用户连接: ${socket.id}`);
    
    let currentUser = null;
    
    // 认证
    socket.on('auth', (data) => {
        try {
            const decoded = jwt.verify(data.token, JWT_SECRET);
            currentUser = decoded;
            socket.userId = decoded.userId;
            socket.username = decoded.username;
            socket.join('global'); // 加入全服频道
            console.log(`用户认证成功: ${decoded.username}`);
            socket.emit('auth_result', { success: true, userId: decoded.userId });
        } catch (e) {
            socket.emit('auth_result', { success: false, error: 'Token无效' });
        }
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
    });
});

// ============ 启动服务器 ============

const PORT = 1368;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`🎮 游戏服务器运行在 http://localhost:${PORT}`);
    console.log(`📝 登录页面: http://localhost:${PORT}/login`);
});

module.exports = { app, io, db };