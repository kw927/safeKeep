import CryptoJS from 'crypto-js';
import {
    generateKey,
    generateSalt,
    convertWordArrayToBase64,
    convertBase64ToWordArray,
    KEY_SIZE,
    SALT_SIZE,
} from '@/services/cryptoUtils';
// Import @jest/globals to avoid conflict with cypress global types
import { expect } from '@jest/globals';

// Password to use for testing
const password = 'password123456789';

/**
 * Test suite for the crypto utility functions
 */
describe('Crypto Utility Functions', () => {
    /**
     * Test cases for the generateKey function
     */
    describe('generateKey function', () => {
        // Test case to check if the key is generated correctly
        it('should generate a key of the correct size', () => {
            const salt = generateSalt(SALT_SIZE);
            const key = generateKey(password, salt);

            // CryptoJS words are 32 bits
            expect(key.toString()).toHaveLength(KEY_SIZE * 8);
        });

        // Test case to check if the same key is generated for the same inputs
        it('should generate the same key for the same inputs', () => {
            const salt = generateSalt(SALT_SIZE);

            const key1 = generateKey(password, salt);
            const key2 = generateKey(password, salt);

            expect(key1.toString()).toEqual(key2.toString());
        });
    });

    /**
     * Test cases for the generateSalt function
     */
    describe('generateSalt function', () => {
        // Test case to check if the salt is generated correctly
        it('should generate a salt of the correct size', () => {
            const salt = generateSalt(SALT_SIZE);
            // Each byte is two hex characters
            expect(CryptoJS.enc.Hex.stringify(salt)).toHaveLength(SALT_SIZE * 2);
        });
    });

    /**
     * Test cases for the convertWordArrayToBase64 and convertBase64ToWordArray functions
     */
    describe('convertWordArrayToBase64 and convertBase64ToWordArray functions', () => {
        // Test case to check if the conversion is correct
        it('should correctly convert WordArray to Base64 and back', () => {
            const originalWordArray = CryptoJS.lib.WordArray.random(128 / 8);

            const base64Str = convertWordArrayToBase64(originalWordArray);

            const convertedWordArray = convertBase64ToWordArray(base64Str);

            expect(convertedWordArray.toString()).toEqual(originalWordArray.toString());
        });
    });
});
