const mongoose = require('mongoose');
const md5 = require('md5');
const User = require('./userSchema'); // 用户 Schema
const cookieKey = 'sid'; // 会话的 Cookie 键
const sessionUser = {}; // 存储会话
const fetchJSONPlaceholderUsers = require('./fetchUsers');

// 在文件开头添加
let isInitialized = false;

async function initializeUsers() {
    try {
        console.log('=== Starting user initialization ===');
        // 强制重新初始化
        await User.deleteMany({});
        console.log('Cleared existing users');

        console.log('Fetching users from JSONPlaceholder...');
        const response = await fetch('https://jsonplaceholder.typicode.com/users');
        const users = await response.json();
        console.log(`Fetched ${users.length} users from JSONPlaceholder`);
        
        // 批量创建用户
        const userPromises = users.map(userData => {
            const salt = Math.random().toString(36).substring(2);
            const password = userData.address.street;
            const hash = md5(password + salt);
            
            const newUser = new User({
                username: userData.username,
                salt: salt,
                hash: hash,
                email: userData.email,
                phone: userData.phone,
                zipcode: userData.address.zipcode,
                dob: '2000-01-01'
            });
            
            console.log(`Creating user ${userData.username} with password: ${password}`);
            return newUser.save();
        });
        
        await Promise.all(userPromises);
        
        // 验证用户是否创建成功
        const createdUsers = await User.find({});
        console.log('Created users:', createdUsers.map(u => ({
            username: u.username,
            email: u.email
        })));
        
        console.log('=== User initialization completed ===');
    } catch (err) {
        console.error('Error in initializeUsers:', err);
        console.error('Error details:', err.message);
        throw err;
    }
}

// 注册用户
const register = async (req, res) => {
    await initializeUsers(); // 确保用户已初始化
    const { username, password, email, dob, phone, zipcode } = req.body;

    try {
        console.log('Registering user with data:', req.body);

        // 检查用户是否已存在
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(409).send({ error: 'Username already exists' });
        }

        // 生成盐值和哈希
        const salt = md5(username + new Date().getTime());
        const hash = md5(password + salt);

        console.log('Generated salt:', salt); // 打印盐值
        console.log('Generated hash:', hash); // 打印哈希值

        // 保存用户到数据库
        const newUser = new User({
            username,
            salt,
            hash,
            email,
            dob,
            phone,
            zipcode,
        });
        await newUser.save();

        res.send({ result: 'success', username });
    } catch (err) {
        console.error('Error during registration:', err);
        res.status(500).send({ error: 'Error registering user' });
    }
};

// 用户登录
const login = async (req, res) => {
    const { username, password } = req.body;

    try {
        console.log('Login attempt for:', username);
        console.log('Provided password:', password);

        const user = await User.findOne({ username });
        if (!user) {
            console.log('User not found in database');
            return res.status(401).send({ error: 'Invalid username or password' });
        }

        console.log('Found user:', user);
        const hash = md5(password + user.salt);
        console.log('Computed hash:', hash);
        console.log('Stored hash:', user.hash);
        console.log('Salt used:', user.salt);

        if (hash !== user.hash) {
            console.log('Password mismatch');
            return res.status(401).send({ error: 'Invalid username or password' });
        }

        const sessionKey = md5('secret' + new Date().getTime() + user.username);
        sessionUser[sessionKey] = username;

        // 设置cookie选项
        const cookieOptions = {
            httpOnly: true,
            secure: true,  // 使用HTTPS
            sameSite: 'None',  // 允许跨站点请求
            maxAge: 24 * 60 * 60 * 1000,  // 24小时过期
            path: '/',
            domain: '.herokuapp.com'  // 允许herokuapp域名下的所有子域
        };

        // 在登录成功后设置cookie
        res.cookie('sid', sessionKey, cookieOptions);
        res.send({ result: 'success', username });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).send({ error: 'Error logging in' });
    }
};

// 用户登出
const logout = (req, res) => {
    const sessionKey = req.cookies[cookieKey];
    if (sessionKey) {
        delete sessionUser[sessionKey];
    }
    res.clearCookie(cookieKey);
    res.send('OK');
};

// 中间件：检查是否登录
const isLoggedIn = (req, res, next) => {
    console.log('Checking auth:', {
        cookies: req.cookies,
        sessionId: req.cookies[cookieKey],
        sessionUser: sessionUser[req.cookies[cookieKey]]
    });

    if (!req.cookies) {
        return res.sendStatus(401);
    }
    
    const sid = req.cookies[cookieKey];
    const username = sessionUser[sid];

    if (!sid || !username) {
        return res.sendStatus(401);
    }

    req.user = username;
    next();
};

module.exports = (app) => {
    // 立即执行初始化
    console.log('Starting auth initialization...');
    initializeUsers()
        .then(() => console.log('Auth initialization completed'))
        .catch(err => console.error('Auth initialization failed:', err));

    app.post('/register', register);
    app.post('/login', login);
    app.put('/logout', logout);
    app.use(isLoggedIn);

    app.use((req, res, next) => {
        console.log('Session ID:', req.sessionID);
        console.log('Session:', req.session);
        next();
    });
};

module.exports.isLoggedIn = isLoggedIn;
