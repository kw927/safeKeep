/**
 * @jest-environment node
 */

import axios from 'axios';
import { testUser, createTestUser, removeTestUser } from '@/utils/testUtils';

// The test only works if the API is running locally on port 3000
const API_URL = 'http://localhost:3000/api/auth/login';

/**
 * Test suite for the Login API
 */
describe('Login API Tests', () => {
    beforeAll(async () => {
        // Remove the test user from the database
        await removeTestUser(testUser.email);

        // Insert test user into the database
        await createTestUser(testUser);
    });

    // The API should only accept POST requests
    test('Methods other than POST should fail', async () => {
        const methods = ['GET', 'PUT', 'DELETE', 'PATCH'];
        const promises = methods.map(method =>
            axios.request({
                url: API_URL,
                method,
                validateStatus: () => true // Prevent axios from throwing on non-2xx status
            }).then(response => {
                expect(response.status).toBe(405);
            })
        );

        await Promise.all(promises);
    });

    // The API should return a 400 response if required fields are missing
    test('Missing required fields results in a 400 response', async () => {
        const response = await axios.post(API_URL, {}, {
            validateStatus: () => true
        });

        expect(response.status).toBe(400);
        expect(response.data.message).toBe('Email and password are required');
    });

    // The API should return a 401 response if the email or password is incorrect
    test('Incorrect email or password results in a 401 response', async () => {
        const response = await axios.post(API_URL, {
            email: 'user.not.exist@safekeep.com',
            password: 'password',
        }, {
            validateStatus: () => true
        });

        expect(response.status).toBe(401);
        expect(response.data.message).toBe('Email or password incorrect');
    });

    // The API should return a 200 response if the email and password are correct
    test('Correct email and password results in a 200 response', async () => {
        const response = await axios.post(API_URL, {
            email: testUser.email,
            password: '1@4a}K1@1Z"4',
        });

        expect(response.status).toBe(200);
        expect(response.data.message).toBe('success');
    });

    afterAll(async () => {
        // Remove the test user from the database
        await await removeTestUser(testUser.email);
    });
});