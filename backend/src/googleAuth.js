const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('./userSchema');

const setupGoogle = (router) => {  // 改为接收 router 而不是 app
    console.log('Setting up Google OAuth...');

    // 1. Google 策略配置
    passport.use(new GoogleStrategy({
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: "https://ricebookserverzzr-d6195a521a04.herokuapp.com/auth/google/callback",
        proxy: true
    }, async (accessToken, refreshToken, profile, done) => {
        try {
            let user = await User.findOne({ googleId: profile.id });
            if (!user) {
                user = new User({
                    username: `google_${profile.id}`,
                    email: profile.emails[0].value,
                    googleId: profile.id,
                    auth: 'google',
                    avatar: profile.photos[0].value
                });
                await user.save();
            }
            return done(null, user);
        } catch (err) {
            return done(err, null);
        }
    }));

    // 2. 序列化用户
    passport.serializeUser((user, done) => {
        done(null, user.id);
    });

    // 3. 反序列化用户
    passport.deserializeUser(async (id, done) => {
        try {
            const user = await User.findById(id);
            done(null, user);
        } catch (err) {
            done(err, null);
        }
    });

    // 4. 路由配置
    router.get('/google/login', (req, res, next) => {
        passport.authenticate('google', {
            scope: ['profile', 'email'],
            prompt: 'select_account'
        })(req, res, next);
    });

    router.get('/google/callback',
        passport.authenticate('google', {
            failureRedirect: 'https://jumpy-streamzzr.surge.sh/login',
            successRedirect: 'https://jumpy-streamzzr.surge.sh/main'
        })
    );
};

module.exports = setupGoogle;