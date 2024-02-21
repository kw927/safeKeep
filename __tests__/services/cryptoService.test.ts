import CryptoJS from 'crypto-js';
import { ec as EC } from 'elliptic';
import { generatePublicKey, signChallenge, getSaltAndPublicKey, verifySignature, validatePassword, encryptText, decryptText } from '@/services/cryptoServiceClient';
import { generateSalt, generateKey } from '@/services/cryptoUtils';
import { SALT_SIZE, KEY_SIZE, ITERATIONS } from '@/services/cryptoUtils';
// Import @jest/globals to avoid conflict with cypress global types
import { expect } from '@jest/globals';

/**
 * Test suite for the generatePublicKey function    
 */
describe('generatePublicKey Function', () => {
    it('should generate a public key with the expected format', () => {
        const privateKey = 'privateKey';
        const publicKeyWithSalt = generatePublicKey(privateKey);

        // The salt is a hexadecimal string, followed by the public key also in hex
        // Validate the length considering the SALT_SIZE and the KEY_SIZE of an ECC public key
        expect(publicKeyWithSalt.length).toBeGreaterThan(SALT_SIZE * 2 + KEY_SIZE * 8);
    });

    it('should generate different public keys for different private keys', () => {
        const privateKey1 = 'privateKey1';
        const privateKey2 = 'privateKey2';

        const publicKeyWithSalt1 = generatePublicKey(privateKey1);
        const publicKeyWithSalt2 = generatePublicKey(privateKey2);

        expect(publicKeyWithSalt1).not.toEqual(publicKeyWithSalt2);
    });

    it('should include a valid salt in the output', () => {
        const privateKey = 'privateKey';
        const publicKeyWithSalt = generatePublicKey(privateKey);

        // Extract the salt part from the output
        const salt = publicKeyWithSalt.substring(0, SALT_SIZE * 2);

        // Attempt to parse the salt part as hex to ensure it's valid
        expect(() => CryptoJS.enc.Hex.parse(salt)).not.toThrow();

        // Validate the length of the salt
        expect(salt.length).toEqual(SALT_SIZE * 2);
    });
});

/**
 * Test suite for the signChallenge function
 */
describe('signChallenge Function', () => {
    const privateKey = 'testPrivateKey';
    const challenge = 'challengeString';
    const salt = generateSalt(SALT_SIZE).toString();

    it('should generate a valid signature for a given challenge', () => {
        const signature = signChallenge(challenge, privateKey, salt);

        expect(signature).toBeDefined();
        expect(typeof signature).toBe('string');
        expect(signature.length).toBeGreaterThan(0);
    });

    it('should produce different signatures for different challenges', () => {
        const challenge2 = 'anotherChallengeString';

        const signature1 = signChallenge(challenge, privateKey, salt);
        const signature2 = signChallenge(challenge2, privateKey, salt);

        expect(signature1).not.toEqual(signature2);
    });

    it('should produce different signatures with different private keys', () => {
        const privateKey2 = 'anotherPrivateKey';

        const signature1 = signChallenge(challenge, privateKey, salt);
        const signature2 = signChallenge(challenge, privateKey2, salt);

        expect(signature1).not.toEqual(signature2);
    });

    it('should verify the signature with the corresponding public key', () => {
        const ec = new EC('secp256k1');

        // Generate the public key from the private key
        const publicKey = generatePublicKey(privateKey);

        // Extract public key and salt from the combined public key and salt output
        const key = getSaltAndPublicKey(publicKey);

        // Use the same salt for the signature
        const signature = signChallenge(challenge, privateKey, key.salt);

        const verifyResult = verifySignature(key.publicKey, challenge, signature);

        expect(verifyResult).toBe(true);
    });
});

/**
 * Test suite for the getSaltAndPublicKey function
 */
describe('getSaltAndPublicKey Function', () => {
    it('should correctly extract salt and public key from a concatenated string', () => {
        // Test input with known salt and public key
        const testPublicKeyFromDatabase = 'f72d66b7cadcca8f0d61028a36509d4a0412a37643851786a81c0eb869401b0c969f7b2f32839a567e08f355ab674b6cd2389bc2b607172b512486048095dbf0c4ba5949653639b2d1d062df081e58e273';
        const { salt, publicKey } = getSaltAndPublicKey(testPublicKeyFromDatabase);

        expect(salt).toBe('f72d66b7cadcca8f0d61028a36509d4a');
        expect(publicKey).toBe('0412a37643851786a81c0eb869401b0c969f7b2f32839a567e08f355ab674b6cd2389bc2b607172b512486048095dbf0c4ba5949653639b2d1d062df081e58e273');
    });
});

/**
 * Test suite for the validatePassword function
 */
describe('validatePassword Function', () => {
    it('should validate a strong password that matches the confirmation password', () => {
        const password = 'ValidPassword123!';
        const { isValid, errorMessages } = validatePassword(password, password);

        expect(isValid).toBeTruthy();
        expect(errorMessages).toHaveLength(0);
    });

    it('should invalidate a password that is too short', () => {
        const password = 'Short1!';
        const { isValid, errorMessages } = validatePassword(password, password);

        expect(isValid).toBeFalsy();
        expect(errorMessages).toContain("Password must be at least 12 characters long.");
    });

    it('should invalidate a password without symbols', () => {
        const password = 'PasswordWithoutSymbols123';
        const { isValid, errorMessages } = validatePassword(password, password);

        expect(isValid).toBeFalsy();
        expect(errorMessages).toContain("Password must contain at least one symbol.");
    });

    it('should invalidate a password without uppercase letters', () => {
        const password = 'lowercase1!!';
        const { isValid, errorMessages } = validatePassword(password, password);

        expect(isValid).toBeFalsy();
        expect(errorMessages).toContain("Password must contain at least one uppercase letter.");
    });

    it('should invalidate a password without lowercase letters', () => {
        const password = 'UPPERCASE1!!';
        const { isValid, errorMessages } = validatePassword(password, password);

        expect(isValid).toBeFalsy();
        expect(errorMessages).toContain("Password must contain at least one lowercase letter.");
    });

    it('should invalidate a password without numbers', () => {
        const password = 'NoNumbers!!!';
        const { isValid, errorMessages } = validatePassword(password, password);

        expect(isValid).toBeFalsy();
        expect(errorMessages).toContain("Password must contain at least one number.");
    });

    it('should invalidate when password and confirmation do not match', () => {
        const password = 'ValidPassword123!';
        const confirmPassword = 'AnotherPassword123!';
        const { isValid, errorMessages } = validatePassword(password, confirmPassword);

        expect(isValid).toBeFalsy();
        expect(errorMessages).toContain("Passwords do not match.");
    });

    it('should handle multiple validation errors', () => {
        const password = 'short';
        const { isValid, errorMessages } = validatePassword(password, 'another');

        expect(isValid).toBeFalsy();
        // Expecting multiple error messages
        expect(errorMessages.length).toBeGreaterThan(1);
    });
});

/**
 * Test suite for the encryptText and decryptText functions
 */
describe('encryptText Function', () => {
    const encryptionKey = 'testSecretKey123';
    const testText = 'Test text to encrypt';

    it('should return a non-empty encrypted string', () => {
        const encryptedText = encryptText(testText, encryptionKey);

        expect(encryptedText).toBeDefined();
        expect(typeof encryptedText).toBe('string');
        expect(encryptedText.length).toBeGreaterThan(0);
    });

    it('should produce different outputs for the same text with different keys', () => {
        const encryptionKey1 = 'testSecretKey1';
        const encryptionKey2 = 'testSecretKey2';
        const encryptedText1 = encryptText(testText, encryptionKey1);
        const encryptedText2 = encryptText(testText, encryptionKey2);

        expect(encryptedText1).not.toEqual(encryptedText2);
    });

    it('should be possible to decrypt the text with the correct key', () => {
        const encryptedText = encryptText(testText, encryptionKey);

        // Extract the salt and the ciphertext from the encrypted text
        const salt = encryptedText.substring(0, SALT_SIZE * 2);
        const ciphertext = encryptedText.substring(SALT_SIZE * 2);

        // Derive the key from the encryption key and the salt
        const key = generateKey(encryptionKey, salt, KEY_SIZE, ITERATIONS);

        // Decrypt the text
        const decryptedBytes = CryptoJS.AES.decrypt(ciphertext, key.toString());
        const decryptedText = decryptedBytes.toString(CryptoJS.enc.Utf8);

        expect(decryptedText).toEqual(testText);
    });
});

/**
 * Test suite for the decryptText function
 */
describe('decryptText Function', () => {
    const sampleText = 'Test text to encrypt';
    const encryptionKey = 'testSecretKey123';

    let encryptedText = '';

    beforeAll(() => {
        // Encrypt the sample text
        encryptedText = encryptText(sampleText, encryptionKey);
    });

    it('should correctly decrypt text with the correct encryption key', () => {
        const decryptedText = decryptText(encryptedText, encryptionKey);
        expect(decryptedText).toEqual(sampleText);
    });

    it('should not decrypt text with an incorrect encryption key', () => {
        const incorrectKey = 'incorrectSecretKey123';

        let decryptedText = '';

        try {
            decryptedText = decryptText(encryptedText, incorrectKey);
        } catch (error) {
            // An error should be thrown when the key is incorrect
        }

        expect(decryptedText).not.toEqual(sampleText);
        expect(decryptedText).toEqual('');
    });
});

/**
 * Test suite for the verifySignature function
 */
describe('verifySignature Function', () => {
    const ec = new EC('secp256k1');

    // Generate the keys, challenge and signature for the test
    const privateKey = 'privateKey';
    const keys = getSaltAndPublicKey(generatePublicKey(privateKey));
    const challenge = 'challengeString';
    const signature = signChallenge(challenge, privateKey, keys.salt);

    it('should verify a valid signature correctly', () => {
        const isValid = verifySignature(keys.publicKey, challenge, signature);
        expect(isValid).toBeTruthy();
    });

    it('should not verify a challenge with an incorrect signature', () => {
        const incorrectSignature = CryptoJS.lib.WordArray.random(SALT_SIZE).toString(CryptoJS.enc.Hex);

        const isValid = verifySignature(keys.publicKey, challenge, incorrectSignature);
        expect(isValid).toBeFalsy();
    });

    it('should not verify a challenge with an incorrect public key', () => {
        const incorrectPublicKey = ec.genKeyPair().getPublic('hex');

        const isValid = verifySignature(incorrectPublicKey, challenge, signature);
        expect(isValid).toBeFalsy();
    });

    it('should handle malformed inputs gracefully', () => {
        const isValid = verifySignature('invalidPublicKey', 'invalidChallenge', 'invalidSignature');

        expect(isValid).toBeFalsy();
    });
});