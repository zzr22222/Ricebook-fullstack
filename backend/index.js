require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const auth = require('./src/auth');
const profile = require('./src/profile');
const following = require('./src/following');
const articles = require('./src/articles');

const app = express();

// MongoDB 连接
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('Could not connect to MongoDB:', err));

// 基本中间件
app.use(express.json());
app.use(cookieParser());
app.use(cors({
    origin: [
        'http://localhost:3000',
        'https://jumpy-streamzzr.surge.sh',  // 添加你的 Surge 域名
        'http://jumpy-streamzzr.surge.sh'    // 同时支持 http
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type'],
    exposedHeaders: ['set-cookie']
}));

// 添加预检请求的处理
app.options('*', cors());

// Session 配置
app.use(session({
    secret: 'doNotGuessTheSecret',
    resave: false,
    saveUninitialized: false
}));

// 路由
auth(app);
profile(app);
following(app);
articles(app);

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});

module.exports = app;
