const initializeArticles = async () => {
    try {
        const count = await Article.countDocuments();
        if (count === 0) {
            const response = await fetch('https://jsonplaceholder.typicode.com/posts');
            const posts = await response.json();
            
            for (const post of posts) {
                const article = new Article({
                    postId: post.id,  // 保存原始 ID
                    author: 'Bret',   // 或者根据 post.userId 获取对应的用户名
                    text: post.body,
                    date: new Date(),
                    comments: []
                });
                await article.save();
            }
        }
    } catch (err) {
        console.error('Error initializing articles:', err);
    }
}; 