import { authenticator } from 'otplib';

const BASE_URL = 'http://localhost:3000';

describe('Login Form Tests', () => {
    beforeEach(() => {
        cy.visit(`${BASE_URL}/login`);
    });

    it('successfully loads', () => {
        cy.url().should('include', '/login');
    });

    it('contains all required elements', () => {
        // Check for the presence of the SafeKeep logo
        cy.get('img[alt="SafeKeep"]').should('be.visible');

        // Check for the form title
        cy.contains('h2', 'Sign in to your account').should('be.visible');

        // Check for email and password input fields
        cy.get('input[name="email"]').should('be.visible');
        cy.get('input[name="password"]').should('be.visible');

        // Check for the "Sign in" button
        cy.get('button[type="submit"]').contains('Sign in').should('be.visible');

        // Check for the "Forgot password?" link
        cy.contains('a', 'Forgot password?').should('be.visible');

        // Check for the "Sign up here" link
        cy.contains('a', 'Sign up here').should('be.visible');
    });
});

describe('Login Process Tests', () => {
    let testUser:any = null;

    before(() => {
        cy.request('POST', `${BASE_URL}/api/test/create-test-user`).then((response) => {
            expect(response.body).to.have.property('user');
            testUser = response.body.user;
        });
    });

    beforeEach(() => {
        cy.visit(`${BASE_URL}/login`);
    });

    after(() => {
        if (testUser && testUser.email) {
            cy.request('DELETE', `${BASE_URL}/api/test/remove-test-user`, { email: testUser.email });
        }
    });

    it('successfully login using username and password', () => {
        cy.url().should('include', '/login');
        
        // Wait for the login form to load and input the email and password
        cy.get('input[name="email"]').type(testUser.email);
        cy.get('input[name="password"]').type(testUser.password);

        // Click the Login button
        cy.get('button[type="submit"]').click();

        // Check if the application routes to the Two-Factor Authentication page
        cy.contains('h2', 'Enter your verification code').should('be.visible');

        // Generate the TOTP code using the TOTP secret
        const totpCode = authenticator.generate(testUser.totp_secret);

        // Enter the TOTP code and click the Verify button
        cy.get('input[name="totp"]').type(totpCode);
        cy.get('button[name="verify-button"]').click();

        // The application should redirect to the Set Master Password page
        cy.contains('h3', 'Set Master Password').should('be.visible');
    });
});