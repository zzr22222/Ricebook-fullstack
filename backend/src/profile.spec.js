// profile.spec.js
const request = require('supertest');
const express = require('express');
const bodyParser = require('body-parser');
const profile = require('./profile'); // Assume profile.js is in the same directory

describe('Profile API Tests', () => {
    let app;

    beforeEach(() => {
        app = express();
        app.use(bodyParser.json());

        // Mock authentication middleware to set req.user
        app.use((req, res, next) => {
            req.user = 'loggedInUser';
            next();
        });

        // Use the profile routes
        profile(app);
    });

    it('should return the headline of the currently logged-in user', (done) => {
        request(app)
            .get('/headline')
            .expect(200)
            .expect((res) => {
                if (res.body.username !== 'loggedInUser') {
                    throw new Error('Username does not match');
                }
                if (!res.body.headline) {
                    throw new Error('Headline is missing');
                }
            })
            .end(done);
    });

    it('should update the headline of the currently logged-in user', (done) => {
        const newHeadline = 'Feeling great!';
        request(app)
            .put('/headline')
            .send({ headline: newHeadline })
            .expect(200)
            .expect((res) => {
                if (res.body.username !== 'loggedInUser') {
                    throw new Error('Username does not match');
                }
                if (res.body.headline !== newHeadline) {
                    throw new Error('Headline was not updated');
                }
            })
            .end(done);
    });

    it('should retrieve the headline of a specified user', (done) => {
        request(app)
            .get('/headline/loggedInUser')
            .expect(200)
            .expect((res) => {
                if (res.body.username !== 'loggedInUser') {
                    throw new Error('Username does not match');
                }
                if (!res.body.headline) {
                    throw new Error('Headline is missing');
                }
            })
            .end(done);
    });

    it('should return 404 when requesting a non-existent user', (done) => {
        request(app)
            .get('/headline/nonExistentUser')
            .expect(404)
            .expect((res) => {
                if (!res.body.error) {
                    throw new Error('Error message not returned');
                }
            })
            .end(done);
    });
});
