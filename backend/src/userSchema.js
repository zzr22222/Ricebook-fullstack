const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    salt: { type: String },
    hash: { type: String },
    email: { type: String, required: true },
    dob: { type: String, required: true },
    phone: { type: String, required: true },
    zipcode: { type: String, required: true },
    headline: { type: String, default: 'New user' },
    avatar: { type: String },
    following: [{ type: String }],
    googleId: { type: String },
    auth: { type: String, enum: ['local', 'google'] }
});

module.exports = mongoose.model('User', userSchema);
