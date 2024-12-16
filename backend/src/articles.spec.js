// article.spec.js
const request = require('supertest');
const express = require('express');
const bodyParser = require('body-parser');
const articles = require('./articles'); // Assume article.js is in the same directory

describe('Article API Tests', () => {
    let app;

    beforeEach(() => {
        app = express();
        app.use(bodyParser.json());

        // Mock authentication middleware to set req.user
        app.use((req, res, next) => {
            req.user = 'testUser';
            next();
        });

        // Use the articles routes
        articles(app);
    });

    it('should return an empty list of articles initially', (done) => {
        request(app)
            .get('/articles')
            .expect(200)
            .expect((res) => {
                if (!Array.isArray(res.body.articles)) {
                    throw new Error('Response articles is not an array');
                }
                if (res.body.articles.length !== 0) {
                    throw new Error('Initial articles list is not empty');
                }
            })
            .end(done);
    });

    it('should add a new article and return it', (done) => {
        const newArticleText = 'My first article!';
        request(app)
            .post('/article')
            .send({ text: newArticleText })
            .expect(200)
            .expect((res) => {
                const articles = res.body.articles;
                if (!Array.isArray(articles) || articles.length !== 1) {
                    throw new Error('Response articles is incorrect');
                }
                const article = articles[0];
                if (article.text !== newArticleText) {
                    throw new Error('Article text does not match');
                }
                if (article.author !== 'testUser') {
                    throw new Error('Author does not match');
                }
                if (!article.id) {
                    throw new Error('Article ID is missing');
                }
            })
            .end(done);
    });

    it('should retrieve an article by ID', (done) => {
        const newArticleText = 'My second article!';
        let articleId;

        // First, add an article
        request(app)
            .post('/article')
            .send({ text: newArticleText })
            .expect(200)
            .then((res) => {
                articleId = res.body.articles[0].id;
                // Then, retrieve the article by ID
                request(app)
                    .get(`/articles/${articleId}`)
                    .expect(200)
                    .expect((res) => {
                        const article = res.body.articles[0];
                        if (article.id !== articleId) {
                            throw new Error('Article ID does not match');
                        }
                        if (article.text !== newArticleText) {
                            throw new Error('Article text does not match');
                        }
                    })
                    .end(done);
            })
            .catch(done);
    });

    it('should return 404 when requesting a non-existent article ID', (done) => {
        request(app)
            .get('/articles/999')
            .expect(404)
            .expect((res) => {
                if (!res.body.error) {
                    throw new Error('Error message not returned');
                }
            })
            .end(done);
    });

    it('should update the text of an article', (done) => {
        const originalText = 'Original article text';
        const updatedText = 'Updated article text';
        let articleId;

        // Add an article
        request(app)
            .post('/article')
            .send({ text: originalText })
            .expect(200)
            .then((res) => {
                articleId = res.body.articles[0].id;
                // Update the article
                request(app)
                    .put(`/articles/${articleId}`)
                    .send({ text: updatedText })
                    .expect(200)
                    .expect((res) => {
                        const article = res.body.articles[0];
                        if (article.text !== updatedText) {
                            throw new Error('Article text was not updated');
                        }
                    })
                    .end(done);
            })
            .catch(done);
    });

    it('should add a comment to an article', (done) => {
        const articleText = 'Article to comment on';
        const commentText = 'This is a comment';
        let articleId;

        // Add an article
        request(app)
            .post('/article')
            .send({ text: articleText })
            .expect(200)
            .then((res) => {
                articleId = res.body.articles[0].id;
                // Add a comment
                request(app)
                    .put(`/articles/${articleId}`)
                    .send({ commentId: 1, comment: commentText })
                    .expect(200)
                    .expect((res) => {
                        const article = res.body.articles[0];
                        if (!Array.isArray(article.comments) || article.comments.length !== 1) {
                            throw new Error('Comment was not added correctly');
                        }
                        const comment = article.comments[0];
                        if (comment.text !== commentText) {
                            throw new Error('Comment text does not match');
                        }
                    })
                    .end(done);
            })
            .catch(done);
    });
});
