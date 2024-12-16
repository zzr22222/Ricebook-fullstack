const User = require('./userSchema');

const following = (app) => {
    // GET /following/:user?
    app.get('/following/:user?', async (req, res) => {
        try {
            const username = req.params.user || req.user;
            const user = await User.findOne({ username });
            
            if (!user) {
                return res.status(404).send({ error: 'User not found' });
            }
            
            res.json({ username: user.username, following: user.following || [] });
        } catch (err) {
            console.error('Error in GET /following:', err);
            res.status(500).send({ error: 'Server error' });
        }
    });

    // PUT /following/:user
    app.put('/following/:user', async (req, res) => {
        try {
            const userToFollow = req.params.user;
            
            // 检查要关注的用户是否存在
            const targetUser = await User.findOne({ username: userToFollow });
            if (!targetUser) {
                return res.status(404).send({ error: 'User to follow not found' });
            }
            
            // 更新当前用户的 following 列表
            const currentUser = await User.findOneAndUpdate(
                { username: req.user },
                { $addToSet: { following: userToFollow } },
                { new: true }
            );
            
            res.json({ username: currentUser.username, following: currentUser.following });
        } catch (err) {
            console.error('Error in PUT /following:', err);
            res.status(500).send({ error: 'Server error' });
        }
    });

    // DELETE /following/:user
    app.delete('/following/:user', async (req, res) => {
        try {
            const userToUnfollow = req.params.user;
            
            const currentUser = await User.findOneAndUpdate(
                { username: req.user },
                { $pull: { following: userToUnfollow } },
                { new: true }
            );
            
            if (!currentUser) {
                return res.status(404).send({ error: 'User not found' });
            }
            
            res.json({ username: currentUser.username, following: currentUser.following });
        } catch (err) {
            console.error('Error in DELETE /following:', err);
            res.status(500).send({ error: 'Server error' });
        }
    });
};

module.exports = following;
