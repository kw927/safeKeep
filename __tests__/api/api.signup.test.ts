/**
 * @jest-environment node
 */

// Use the axios library to make requests to the API
import axios from 'axios';
import { PrismaClient } from '@prisma/client';
// Import @jest/globals to avoid conflict with cypress global types
import { expect } from '@jest/globals';

const prisma = new PrismaClient();

// The test only works if the API is running locally on port 3000
const API_URL = 'http://localhost:3000/api/user/signup';

// Test users
const existingUser = {
    first_name: 'Existing',
    last_name: 'User',
    email: 'existing.user@safekeep.com',
    password_hash: 'hashedpassword',
    created_at: new Date(),
    updated_at: new Date(),
};

const newUser = {
    first_name: 'New',
    last_name: 'User',
    email: 'new.user@safekeep.com',
    password_hash: 'hashedpassword',
    created_at: new Date(),
    updated_at: new Date(),
};

// Password requirements
const passwordRequirements = [
    { description: 'less than 12 characters', password: 'Short1!', expectMessage: "Password must be at least 12 characters long." },
    { description: 'missing an uppercase letter', password: 'lowercase1!!', expectMessage: "Password must contain at least one uppercase letter." },
    { description: 'missing a lowercase letter', password: 'UPPERCASE1!!', expectMessage: "Password must contain at least one lowercase letter." },
    { description: 'missing a number', password: 'NoNumber!!!!!', expectMessage: "Password must contain at least one number." },
    { description: 'missing a special character', password: 'NoSpecials111111', expectMessage: "Password must contain at least one special character." },
];

/**
 * Test suite for the Signup API
 */
describe('Signup API Tests', () => {
    beforeAll(async () => {
        // Remove the test users from the database
        await removeTestUser();
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
        expect(response.data.message).toBe('Missing required fields');
    });

    // The API should return a 400 response if the first name or last name are outside the character limits
    test('Signup fails if first name or last name are outside character limits', async () => {
        const userData = {
            firstName: new Array(52).join('a'),
            lastName: new Array(52).join('b'),
            email: newUser.email,
            password: 'ValidPassword1!'
        };
        const response = await axios.post(API_URL, userData, {
            validateStatus: () => true
        });

        expect(response.status).toBe(400);
        expect(response.data.message).toBe('First name and last name must be between 1 and 50 characters');
    });

    // The API should return a 400 response if the email is invalid
    test('Signup fails with an invalid email', async () => {
        const userData = {
            firstName: newUser.first_name,
            lastName: newUser.last_name,
            email: 'invalidemail',
            password: 'ValidPassword1!'
        };
        const response = await axios.post(API_URL, userData, {
            validateStatus: () => true
        });

        expect(response.status).toBe(400);
        expect(response.data.message).toBe('Invalid email');
    });

    // The API should return a 400 response if the password does not meet the password policy
    passwordRequirements.forEach(({ description, password, expectMessage }) => {
        test(`Signup fails if password is ${description}`, async () => {
            const userData = {
                firstName: newUser.first_name,
                lastName: newUser.last_name,
                email: newUser.email,
                password
            };
            const response = await axios.post(API_URL, userData, {
                validateStatus: () => true
            });

            expect(response.status).toBe(400);
            expect(response.data.message).toBe(expectMessage);
        });
    });

    // The API should return a 409 response if the user already exists
    test('Attempt to signup with an existing user\'s email returns a 409 response', async () => {
        // Insert a test user
        await prisma.user.create({
            data: existingUser
        });

        const response = await axios.post(API_URL, {
            firstName: existingUser.first_name,
            lastName: existingUser.last_name,
            email: existingUser.email,
            password: '1@4a}K1@1Z"4'
        }, {
            validateStatus: () => true
        });

        expect(response.status).toBe(409);
        expect(response.data.message).toBe('User already exists');
    });

    // A successful signup should return a 200 response and create the user
    test('Successful signup returns a 200 response and creates the user', async () => {
        const user = {
            firstName: newUser.first_name,
            lastName: newUser.last_name,
            email: newUser.email,
            password: '1@4a}K1@1Z"4'
        };

        const response = await axios.post(API_URL, user, {
            validateStatus: () => true
        });

        expect(response.status).toBe(200);
        expect(response.data.email).toBe(newUser.email);

        // Verify the user was created in the database
        const createdUser = await prisma.user.findUnique({
            where: {
                email: newUser.email,
            },
        });

        expect(createdUser).not.toBeNull();
    });

    // Remove the test users from the database after all tests
    afterAll(async () => {
        // remove test users
        await removeTestUser();
    });
});

/**
 * Function to remove the test users from the database
 */
const removeTestUser = async () => {
    await prisma.user.deleteMany({
        where: {
            OR: [
                { email: newUser.email },
                { email: existingUser.email },
            ],
        },
    });
};