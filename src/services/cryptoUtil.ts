import CryptoJS from 'crypto-js';

// The key size for the AES algorithm, in bits
export const KEY_SIZE = 256/32;

// The salt size for the PBKDF2 algorithm, in bytes
export const SALT_SIZE = 16;

// The number of iterations for the PBKDF2 algorithm
export const ITERATIONS = 60000;

/**
 * Helper function to generate a key
 * @param encryptionKey 
 * @param salt 
 * @param keySize 
 * @param iterations 
 * @returns 
 */
export const generateKey = (encryptionKey: string, salt: CryptoJS.lib.WordArray | string, keySize : number = KEY_SIZE, iterations: number  = ITERATIONS) => {
    if (typeof salt === 'string') {
        salt = CryptoJS.enc.Hex.parse(salt);
    }
    
    return CryptoJS.PBKDF2(encryptionKey, salt, {
        keySize: keySize,
        iterations: iterations
    });
}

/**
 * Helper function to generate a random salt
 * @param saltSize 
 * @returns 
 */
export const generateSalt = (saltSize: number) => {
    return CryptoJS.lib.WordArray.random(saltSize);
}

export const convertWordArrayToBase64 = (wordArray: CryptoJS.lib.WordArray) => {
    return CryptoJS.enc.Base64.stringify(wordArray);
}

export const convertBase64ToWordArray = (base64Str: string) => {
    return CryptoJS.enc.Base64.parse(base64Str);
}