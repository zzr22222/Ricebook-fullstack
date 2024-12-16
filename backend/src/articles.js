const mongoose = require('mongoose');
const fetch = require('node-fetch');

// 创建文章 Schema，添加 id 和 userId 字段
const articleSchema = new mongoose.Schema({
    id: { type: Number, required: true },
    userId: { type: Number, required: true },
    author: { type: String, required: true },
    text: { type: String, required: true },
    date: { type: Date, default: Date.now },
    comments: [{
        commentId: String,
        text: String,
        author: String,
        date: { type: Date, default: Date.now }
    }]
});

const Article = mongoose.model('Article', articleSchema);

// 初始化文章和评论数据
let initializedArticles = false;

const initializeArticles = async () => {
    try {
        const count = await Article.countDocuments();
        console.log('Current article count:', count);
        
        if (count === 0) {
            console.log('Fetching articles from JSONPlaceholder...');
            const response = await fetch('https://jsonplaceholder.typicode.com/posts');
            const posts = await response.json();
            console.log('Fetched', posts.length, 'articles');
            
            // 获取用户数据以匹配用户名
            const usersResponse = await fetch('https://jsonplaceholder.typicode.com/users');
            const users = await usersResponse.json();
            
            // 获取评论数据
            const commentsResponse = await fetch('https://jsonplaceholder.typicode.com/comments');
            const comments = await commentsResponse.json();
            
            for (const post of posts) {
                const user = users.find(u => u.id === post.userId);
                // 找到对应这篇文章的所有评论
                const postComments = comments
                    .filter(c => c.postId === post.id)
                    .map(c => ({
                        commentId: String(c.id),
                        text: c.body,
                        author: c.email.split('@')[0], // 使用邮箱用户名作为作者
                        date: new Date()
                    }));

                const article = new Article({
                    id: post.id,  // 确保设置数字类型的id
                    userId: post.userId,
                    author: user ? user.username : 'unknown',
                    text: post.body,
                    date: new Date(),
                    comments: postComments  // 添加评论数据
                });
                await article.save();
                console.log('Saved article with id:', post.id);
            }
            console.log('All articles initialized successfully');
        } else {
            // 检查现有文章的结构
            const sampleArticle = await Article.findOne({});
            console.log('Sample article structure:', JSON.stringify(sampleArticle, null, 2));
        }
    } catch (err) {
        console.error('Error initializing articles:', err);
        throw err;
    }
};

// 添加分页和用户订阅查询函数
const getFeedArticles = async (username, following, page = 1, limit = 10) => {
    const skip = (page - 1) * limit;
    const usersToQuery = [username, ...following];
    
    return await Article.find({
        author: { $in: usersToQuery }
    })
    .sort({ date: -1 })  // 按时间降序排序
    .skip(skip)
    .limit(limit)
    .exec();
};

const articles = (app) => {
    // 修改 GET /articles 路由
    app.get('/articles/:id?', async (req, res) => {
        try {
            await initializeArticles();
            
            // 获取分页参数
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            
            if (page < 1 || limit < 1) {
                return res.status(400).json({ 
                    error: 'Invalid page or limit parameters' 
                });
            }

            const { id } = req.params;
            
            if (id) {
                // 单篇文章查询逻辑保持不变
                let article = await Article.findOne({ id: parseInt(id) });
                if (!article) {
                    try {
                        article = await Article.findById(id);
                    } catch (err) {
                        console.log('Error finding by _id:', err.message);
                    }
                }
                
                if (article) {
                    return res.json({ articles: [article] });
                } else {
                    return res.status(404).json({ error: 'Article not found' });
                }
            } else {
                // 验证用户是否登录
                if (!req.user) {
                    return res.status(401).json({ error: 'Not logged in' });
                }

                // 获取用户信息和关注列表
                const username = typeof req.user === 'object' ? req.user.username : req.user;
                // 假设用户关注列表存储在 req.user.following 中
                const following = (req.user.following || []);

                // 获取订阅文章
                const articles = await getFeedArticles(username, following, page, limit);
                
                // 获取总文章数用于分页
                const total = await Article.countDocuments({
                    author: { $in: [username, ...following] }
                });

                // 返回分页信息和文章列表
                return res.json({
                    articles: articles,
                    pagination: {
                        current: page,
                        limit: limit,
                        total: total,
                        pages: Math.ceil(total / limit)
                    }
                });
            }
        } catch (err) {
            console.error('Error in /articles route:', err);
            return res.status(500).json({ error: 'Server error' });
        }
    });

    // POST /article
    app.post('/article', async (req, res) => {
        try {
            const { text } = req.body;
            
            // 详细的请求信息日志
            console.log('POST /article request:', {
                headers: req.headers,
                body: req.body,
                user: req.user,
                cookies: req.cookies
            });

            // 验证用户是否登录
            if (!req.user) {
                console.log('User not authenticated');
                return res.status(401).json({ error: 'Not logged in' });
            }

            // 验证请求体
            if (!text) {
                console.log('Missing text in request body');
                return res.status(400).json({ error: 'Text is required' });
            }

            // 获取当前最大的id
            const maxIdArticle = await Article.findOne().sort('-id');
            const newId = maxIdArticle ? maxIdArticle.id + 1 : 1;

            // 构建新文章对象前打印信息
            console.log('Creating article with data:', {
                id: newId,
                user: req.user,
                text: text
            });

            const newArticle = new Article({
                id: newId,
                userId: typeof req.user === 'object' ? req.user.id : 1,
                author: typeof req.user === 'object' ? req.user.username : req.user,
                text: text,
                date: new Date(),
                comments: []
            });

            // 验证文章对象
            console.log('New article object:', newArticle);

            // 保存前验证
            const validationError = newArticle.validateSync();
            if (validationError) {
                console.error('Validation error:', validationError);
                return res.status(400).json({ 
                    error: 'Validation failed', 
                    details: validationError.message 
                });
            }

            await newArticle.save();
            console.log('Article saved successfully:', newArticle);
            res.json({ articles: [newArticle] });
        } catch (err) {
            console.error('Detailed error in POST /article:', {
                name: err.name,
                message: err.message,
                stack: err.stack,
                code: err.code
            });
            res.status(500).json({ 
                error: 'Server error', 
                details: err.message,
                type: err.name
            });
        }
    });

    // PUT /articles/:id
    app.put('/articles/:id', async (req, res) => {
        try {
            const { id } = req.params;
            const { text, commentId, comment } = req.body;
            const article = await Article.findById(id);
            
            if (!article) {
                return res.status(404).send({ error: 'Article not found' });
            }

            if (text && article.author === req.user) {
                article.text = text;
            }
            
            if (commentId && comment) {
                article.comments.push({
                    commentId,
                    text: comment,
                    author: req.user,
                    date: new Date()
                });
            }

            await article.save();
            res.send({ articles: [article] });
        } catch (err) {
            res.status(500).send({ error: 'Server error' });
        }
    });
};

module.exports = articles;
