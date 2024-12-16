const express = require('express');
const cors = require('cors');
const app = express();

// CORS配置
app.use(cors({
    origin: [
        'http://localhost:3000',
        'https://jumpy-streamzzr.surge.sh',  // 替换为您的Surge域名
        /\.surge\.sh$/  // 允许所有surge.sh子域名
    ],
    credentials: true,  // 允许携带凭证
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['set-cookie']
}));

// Cookie解析器配置
app.use(cookieParser());

// 设置安全头
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});
