import CryptoJS from 'crypto-js';

// The key size for the AES algorithm, in bits
export const KEY_SIZE = 256 / 32;

// The salt size for the PBKDF2 algorithm, in bytes
export const SALT_SIZE = 16;

// The number of iterations for the PBKDF2 algorithm
export const ITERATIONS = 60000;

/**
 * Helper function to generate a key
 * @param encryptionKey {string} The key to use for encryption
 * @param salt {CryptoJS.lib.WordArray | string} The salt to use for encryption. If a string is passed, it will be converted to a WordArray
 * @param keySize {number} The size of the key to generate, in bits. Default is KEY_SIZE
 * @param iterations {number} The number of iterations to use for the PBKDF2 algorithm. Default is ITERATIONS
 * @returns {CryptoJS.lib.WordArray} The generated key as a WordArray
 */
export const generateKey = (
    encryptionKey: string,
    salt: CryptoJS.lib.WordArray | string,
    keySize: number = KEY_SIZE,
    iterations: number = ITERATIONS
) => {
    if (typeof salt === 'string') {
        salt = CryptoJS.enc.Hex.parse(salt);
    }

    return CryptoJS.PBKDF2(encryptionKey, salt, {
        keySize: keySize,
        iterations: iterations,
    });
};

/**
 * Helper function to generate a random salt
 * @param saltSize {number} The size of the salt to generate, in bytes. Default is SALT_SIZE
 * @returns {CryptoJS.lib.WordArray} The generated salt as a WordArray
 */
export const generateSalt = (saltSize: number) => {
    return CryptoJS.lib.WordArray.random(saltSize);
};

/**
 * Helper function to convert a WordArray to a Base64 string
 * @param wordArray {CryptoJS.lib.WordArray} The WordArray to convert
 * @returns {string} The WordArray as a Base64 string
 */
export const convertWordArrayToBase64 = (wordArray: CryptoJS.lib.WordArray) => {
    return CryptoJS.enc.Base64.stringify(wordArray);
};

/**
 * Helper function to convert a Base64 string to a WordArray
 * @param base64Str {string} The Base64 string to convert
 * @returns {CryptoJS.lib.WordArray} The Base64 string as a WordArray
 */
export const convertBase64ToWordArray = (base64Str: string) => {
    return CryptoJS.enc.Base64.parse(base64Str);
};
