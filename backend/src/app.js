const express = require('express');
const session = require('express-session');
const passport = require('passport');
const cors = require('cors');
const MongoStore = require('connect-mongo');
const setupGoogle = require('./googleAuth');

const app = express();

// 1. 添加调试日志
console.log('Starting server...');

// 2. CORS 配置
app.use(cors({
    origin: ['https://jumpy-streamzzr.surge.sh', 'http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// 3. Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 4. 公开路由（在任何认证中间件之前）
app.get('/basic-test', (req, res) => {
    console.log('Basic test route accessed');
    res.json({ 
        message: 'Basic test route working',
        timestamp: new Date().toISOString()
    });
});

app.get('/env-test', (req, res) => {
    console.log('Environment test route accessed');
    res.json({
        message: 'Environment test',
        vars: {
            MONGODB_URI: process.env.MONGODB_URI ? 'Set' : 'Not set',
            SESSION_SECRET: process.env.SESSION_SECRET ? 'Set' : 'Not set',
            GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ? 'Set' : 'Not set',
            GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET ? 'Set' : 'Not set'
        }
    });
});

// 5. Session 配置
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: process.env.MONGODB_URI,
        ttl: 24 * 60 * 60
    }),
    cookie: {
        secure: true,
        httpOnly: true,
        sameSite: 'none',
        maxAge: 24 * 60 * 60 * 1000
    }
}));

// 6. Passport 配置（在公开路由之后）
app.use(passport.initialize());
app.use(passport.session());

// 7. 设置 Google OAuth
setupGoogle(app);

// 8. 错误处理中间件
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({ error: err.message });
});

module.exports = app;