const User = require('./userSchema');
const md5 = require('md5');
const { uploadImage } = require('./uploadCloudinary');

const profile = (app) => {
    // GET /headline/:user?
    app.get('/headline/:user?', async (req, res) => {
        try {
            const username = req.params.user || req.user;
            const user = await User.findOne({ username });
            if (user) {
                res.send({ username: user.username, headline: user.headline || 'No headline set' });
            } else {
                res.status(404).send({ error: 'User not found' });
            }
        } catch (err) {
            res.status(500).send({ error: 'Server error' });
        }
    });

    // PUT /headline
    app.put('/headline', async (req, res) => {
        try {
            const { headline } = req.body;
            const user = await User.findOneAndUpdate(
                { username: req.user },
                { headline },
                { new: true }
            );
            if (user) {
                res.send({ username: user.username, headline });
            } else {
                res.status(404).send({ error: 'User not found' });
            }
        } catch (err) {
            res.status(500).send({ error: 'Server error' });
        }
    });

    // PUT /password - 更新密码
    app.put('/password', async (req, res) => {
        try {
            console.log('Password update request:', {
                user: req.user,
                body: req.body,
                headers: req.headers
            });

            const { password } = req.body;
            if (!password) {
                console.log('Password missing in request');
                return res.status(400).json({ error: 'Password is required' });
            }

            const salt = Math.random().toString(36).substring(2);
            const hash = md5(password + salt);
            
            console.log('Updating password for user:', req.user);
            const user = await User.findOneAndUpdate(
                { username: req.user },
                { salt: salt, hash: hash },
                { new: true }
            ).exec();
            
            if (!user) {
                console.log('User not found in database:', req.user);
                return res.status(404).json({ error: 'User not found' });
            }
            
            console.log('Password updated successfully');
            res.json({ username: user.username, result: 'success' });
        } catch (err) {
            console.error('Password update error:', err);
            res.status(500).json({ error: err.message });
        }
    });

    // GET /email/:user?
    app.get('/email/:user?', async (req, res) => {
        try {
            const username = req.params.user || req.user;
            const user = await User.findOne({ username });
            if (!user) return res.status(404).send({ error: 'User not found' });
            res.json({ username: user.username, email: user.email });
        } catch (err) {
            res.status(500).send({ error: 'Server error' });
        }
    });

    // PUT /email
    app.put('/email', async (req, res) => {
        try {
            const { email } = req.body;
            const user = await User.findOneAndUpdate(
                { username: req.user },
                { email },
                { new: true }
            );
            res.json({ username: user.username, email: user.email });
        } catch (err) {
            res.status(500).send({ error: 'Server error' });
        }
    });

    // GET /zipcode/:user?
    app.get('/zipcode/:user?', async (req, res) => {
        try {
            const username = req.params.user || req.user;
            const user = await User.findOne({ username });
            if (!user) return res.status(404).send({ error: 'User not found' });
            res.json({ username: user.username, zipcode: user.zipcode });
        } catch (err) {
            res.status(500).send({ error: 'Server error' });
        }
    });

    // PUT /zipcode
    app.put('/zipcode', async (req, res) => {
        try {
            const { zipcode } = req.body;
            const user = await User.findOneAndUpdate(
                { username: req.user },
                { zipcode },
                { new: true }
            );
            res.json({ username: user.username, zipcode: user.zipcode });
        } catch (err) {
            res.status(500).send({ error: 'Server error' });
        }
    });

    // GET /avatar/:user?
    app.get('/avatar/:user?', async (req, res) => {
        try {
            const username = req.params.user || req.user;
            console.log('Getting avatar for user:', username);
            
            const user = await User.findOne({ username });
            if (!user) {
                console.log('User not found:', username);
                return res.status(404).json({ error: 'User not found' });
            }

            res.json({ username: user.username, avatar: user.avatar });
        } catch (err) {
            console.error('Error getting avatar:', err);
            res.status(500).json({ error: err.message });
        }
    });

    // PUT /avatar - 更新头像
    app.put('/avatar', uploadImage('avatar'), async (req, res) => {
        try {
            const user = await User.findOneAndUpdate(
                { username: req.user },
                { avatar: req.fileurl },
                { new: true }
            );

            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }

            res.json({ username: user.username, avatar: req.fileurl });
        } catch (err) {
            console.error('Avatar update error:', err);
            res.status(500).json({ error: err.message });
        }
    });

    // GET /phone/:user?
    app.get('/phone/:user?', async (req, res) => {
        try {
            const username = req.params.user || req.user;
            const user = await User.findOne({ username });
            if (!user) return res.status(404).send({ error: 'User not found' });
            res.json({ username: user.username, phone: user.phone });
        } catch (err) {
            res.status(500).send({ error: 'Server error' });
        }
    });

    // PUT /phone
    app.put('/phone', async (req, res) => {
        try {
            const { phone } = req.body;
            const user = await User.findOneAndUpdate(
                { username: req.user },
                { phone },
                { new: true }
            );
            res.json({ username: user.username, phone: user.phone });
        } catch (err) {
            res.status(500).send({ error: 'Server error' });
        }
    });

    // GET /dob
    app.get('/dob', async (req, res) => {
        try {
            const user = await User.findOne({ username: req.user });
            if (!user) return res.status(404).send({ error: 'User not found' });
            res.json({ username: user.username, dob: user.dob });
        } catch (err) {
            res.status(500).send({ error: 'Server error' });
        }
    });
};

module.exports = profile;
