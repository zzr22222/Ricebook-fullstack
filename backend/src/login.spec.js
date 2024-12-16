const request = require('supertest');
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const md5 = require('md5');
const auth = require('./auth'); // Assuming auth.js is in the same directory
const User = require('./userSchema'); // User Mongoose model

describe('Authentication API Tests', function() {
    this.timeout(10000); // Set timeout for all tests in this suite to 10 seconds
    let app;
    const testUsername = 'testuser';
    const testPassword = 'testpassword';

    before(async function() {
        // Connect to the test database
        await mongoose.connect('mongodb+srv://ziruizhao0222:zzr0222@cluster0.0kpui.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0');
    });

    after(async function() {
        // Close the database connection after all tests
        await mongoose.connection.close();
    });

    beforeEach(async function() {
        app = express();
        app.use(bodyParser.json());
        app.use(cookieParser());

        // Use the auth routes
        auth(app);

        // Clear the users collection before each test
        await User.deleteMany({});
    });

    it('should register a new user', async function() {
        const res = await request(app)
            .post('/register')
            .send({
                username: testUsername,
                password: testPassword,
                email: 'testuser@example.com',
                dob: '1990-01-01',
                phone: '123-456-7890',
                zipcode: '12345',
            })
            .expect(200);

        if (res.body.result !== 'success') {
            throw new Error('Registration did not succeed');
        }
        if (res.body.username !== testUsername) {
            throw new Error('Username does not match');
        }
    });

    it('should not register a user with an existing username', async function() {
        // First, register the user
        const user = new User({
            username: testUsername,
            salt: 'randomsalt',
            hash: 'randomhash',
            email: 'testuser@example.com',
            dob: '1990-01-01',
            phone: '123-456-7890',
            zipcode: '12345',
        });

        await user.save();

        // Try to register again with the same username
        const res = await request(app)
            .post('/register')
            .send({
                username: testUsername,
                password: testPassword,
                email: 'testuser2@example.com',
                dob: '1990-01-01',
                phone: '123-456-7890',
                zipcode: '12345',
            })
            .expect(409);

        if (!res.body.error) {
            throw new Error('Error message not returned');
        }
    });

    it('should log in an existing user', async function() {
        // First, register the user via the API
        await request(app)
            .post('/register')
            .send({
                username: testUsername,
                password: testPassword,
                email: 'testuser@example.com',
                dob: '1990-01-01',
                phone: '123-456-7890',
                zipcode: '12345',
            })
            .expect(200);
    
        // Now attempt to log in
        const res = await request(app)
            .post('/login')
            .send({
                username: testUsername,
                password: testPassword,
            })
            .expect(200);
    
        if (res.body.result !== 'success') {
            throw new Error('Login did not succeed');
        }
        if (res.body.username !== testUsername) {
            throw new Error('Username does not match');
        }
        if (!res.headers['set-cookie']) {
            throw new Error('Cookie was not set');
        }
    });
    

    it('should not log in with an incorrect password', async function() {
        // First, register the user
        const salt = 'randomsalt';
        const hash = md5(testPassword + salt);
        const user = new User({
            username: testUsername,
            salt: salt,
            hash: hash,
            email: 'testuser@example.com',
            dob: '1990-01-01',
            phone: '123-456-7890',
            zipcode: '12345',
        });

        await user.save();

        // Now attempt to log in with incorrect password
        const res = await request(app)
            .post('/login')
            .send({
                username: testUsername,
                password: 'wrongpassword',
            })
            .expect(401);

        if (!res.body.error) {
            throw new Error('Error message not returned');
        }
    });

    it('should log out a logged-in user', async function() {
        // First, register and log in the user via the API
        const agent = request.agent(app);
    
        await agent
            .post('/register')
            .send({
                username: testUsername,
                password: testPassword,
                email: 'testuser@example.com',
                dob: '1990-01-01',
                phone: '123-456-7890',
                zipcode: '12345',
            })
            .expect(200);
    
        await agent
            .post('/login')
            .send({
                username: testUsername,
                password: testPassword,
            })
            .expect(200);
    
        // Now log out
        const res = await agent.put('/logout').expect(200);
    
        if (res.text !== 'OK') {
            throw new Error('Logout did not succeed');
        }
    }); 
});
