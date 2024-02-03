import CryptoJS from 'crypto-js';
import { ec as EC } from 'elliptic';
import { generateKey, generateSalt, convertBase64ToWordArray, KEY_SIZE, SALT_SIZE, ITERATIONS } from './cryptoUtil';
import { EncryptedFile } from '@/types/Crypto';

export const generatePublicKey = (privateKey: string) => {
    const ec = new EC('secp256k1');

    const salt = generateSalt(SALT_SIZE);
    const key = generateKey(privateKey, salt, KEY_SIZE, ITERATIONS);

    // Convert the key to a hex string
    const keyHex = key.toString(CryptoJS.enc.Hex);

    // Generate the ECC public key
    const keyPair = ec.keyFromPrivate(keyHex);
    const publicKey = keyPair.getPublic('hex');

    // Concatenate the salt and the public key
    return salt.toString() + publicKey;
}

export const signChallenge = (challenge: string, privateKey: string, salt: string) => {
    const ec = new EC('secp256k1');

    // Convert the salt to a WordArray
    const saltHex = CryptoJS.enc.Hex.parse(salt);

    // Generate the key
    const key = generateKey(privateKey, saltHex, KEY_SIZE, ITERATIONS);

    // Convert the key to a hex string
    const keyHex = key.toString(CryptoJS.enc.Hex);

    // Generate the ECC key pair
    const keyPair = ec.keyFromPrivate(keyHex);

    // Hash the challenge before signing
    const hashedChallenge = CryptoJS.SHA256(challenge).toString(CryptoJS.enc.Hex);

    // Sign the hashed challenge
    const signature = keyPair.sign(hashedChallenge);

    // Return the signature in DER format encoded as hex
    return signature.toDER('hex');
}

export const getSaltAndPublicKey = (publicKeyFromDatabase: string) => {
    // Extract the salt from the public key
    const salt = publicKeyFromDatabase.substring(0, 32);

    // Extract the public key from the public key
    const publicKey = publicKeyFromDatabase.substring(32);

    return {
        salt: salt,
        publicKey: publicKey
    }
}

export const validatePassword = (password: string, confirmPassword: string) => {
    const hasSymbol = /[!@#$%^&*(),.?":{}|<>]/;
    const hasUppercaseLetter = /[A-Z]/;
    const hasLowercaseLetter = /[a-z]/;
    const hasNumber = /[0-9]/;
    let errorMessages = [];

    if (password.length < 12) {
        errorMessages.push("Password must be at least 12 characters long.");
    }
    if (!hasSymbol.test(password)) {
        errorMessages.push("Password must contain at least one symbol.");
    }
    if (!hasUppercaseLetter.test(password)) {
        errorMessages.push("Password must contain at least one uppercase letter.");
    }
    if (!hasLowercaseLetter.test(password)) {
        errorMessages.push("Password must contain at least one lowercase letter.");
    }
    if (!hasNumber.test(password)) {
        errorMessages.push("Password must contain at least one number.");
    }
    if (password !== confirmPassword) {
        errorMessages.push("Passwords do not match.");
    }

    return {
        isValid: errorMessages.length === 0,
        errorMessages: errorMessages
    };
};

/**
 * Function to encrypt plain text such as TOTP secret
 * @param text 
 * @param encryptionKey 
 * @returns 
 */
export const encryptText = (text: string, encryptionKey: string) => {
    // Generate a random salt
    const salt = generateSalt(SALT_SIZE);

    // Generate the key
    const key = generateKey(encryptionKey, salt, KEY_SIZE, ITERATIONS);

    // Encrypt the text
    const encryptedText = CryptoJS.AES.encrypt(text, key.toString());

    // Concatenate the salt and the encrypted Text
    return salt.toString() + encryptedText.toString();
}

export const encryptTextWithDerivedKey = (text: string, derivedKey: string) => {
    // Generate a random salt
    const salt = generateSalt(SALT_SIZE);

    const key = convertBase64ToWordArray(derivedKey);

    // Encrypt the text
    const encryptedText = CryptoJS.AES.encrypt(text, key.toString());

    // Concatenate the salt and the encrypted Text
    return salt.toString() + encryptedText.toString();
}

/**
 * Function to decrypt encrypted text such as TOTP secret
 * @param text 
 * @param encryptionKey 
 * @returns 
 */
export const decryptText = (text: string, encryptionKey: string) => {
    // Extract the salt from the text
    const salt = CryptoJS.enc.Hex.parse(text.substring(0, 32));

    // Extract the encrypted TOTP secret from the text
    const encryptedText = text.substring(32);

    // Generate the key
    const key = generateKey(encryptionKey, salt, KEY_SIZE, ITERATIONS);


    // Decrypt the text
    const decryptedText = CryptoJS.AES.decrypt(encryptedText, key.toString());

    // Return the decrypted Text
    return decryptedText.toString(CryptoJS.enc.Utf8);
}

export const decryptTextWithDerivedKey = (text: string, derivedKey: string) => {
    // Extract the salt from the text
    const salt = CryptoJS.enc.Hex.parse(text.substring(0, 32));

    // Extract the encrypted TOTP secret from the text
    const encryptedText = text.substring(32);

    const key = convertBase64ToWordArray(derivedKey);

    // Decrypt the text
    const decryptedText = CryptoJS.AES.decrypt(encryptedText, key.toString());

    // Return the decrypted Text
    return decryptedText.toString(CryptoJS.enc.Utf8);
}

/**
 * Function to encrypt a file
 * @param file 
 * @param encryptionKey 
 * @param filePath 
 * @returns 
 */
export const encryptFileWithDerivedKey = async (file: File, derivedKey: string): Promise<EncryptedFile | null> => {
    try {
        // Convert the file to a buffer
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Convert the buffer to a WordArray
        const wordArray = CryptoJS.lib.WordArray.create(buffer as unknown as number[]);

        // Generate a random salt
        const salt = generateSalt(SALT_SIZE);

        // Generate the key
        const key = generateKey(derivedKey, salt, KEY_SIZE, ITERATIONS);

        // Encrypt the file data
        const encryptedFile = CryptoJS.AES.encrypt(wordArray, key.toString());

        // Create an object to store the encrypted file data and the metadata
        const encryptedData: EncryptedFile = {
            ciphertext: encryptedFile.toString(),
            salt: salt.toString(),
            filename: file.name,
            filetype: file.type
        };

        return encryptedData;
    } catch (error) {
        console.error('File processing error:', error);
        return null;
    }
}