const mongoose = require('mongoose');

const articleSchema = new mongoose.Schema({
    postId: { type: Number, required: true, index: true },
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

module.exports = mongoose.model('Article', articleSchema);
