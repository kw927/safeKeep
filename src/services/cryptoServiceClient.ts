import CryptoJS from 'crypto-js';
import { ec as EC } from 'elliptic';
import { generateKey, generateSalt, KEY_SIZE, SALT_SIZE, ITERATIONS } from './cryptoUtils';
import { EncryptedFile, DecryptedFile } from '@/types/Crypto';

/**
 * Function to generate a public key from a private key
 * @param privateKey {string} The private key to use
 * @returns {string} The generated public key with the salt concatenated
 */
export const generatePublicKey = (privateKey: string) => {
    // Create an instance of the elliptic curve algorithm
    const ec = new EC('secp256k1');

    // Generate a random salt
    const salt = generateSalt(SALT_SIZE);

    // Derive the key from the private key and the salt
    const key = generateKey(privateKey, salt, KEY_SIZE, ITERATIONS);

    // Convert the key to a hex string
    const keyHex = key.toString(CryptoJS.enc.Hex);

    // Generate the ECC public key
    const keyPair = ec.keyFromPrivate(keyHex);
    const publicKey = keyPair.getPublic('hex');

    // Concatenate the salt and the public key
    return salt.toString() + publicKey;
};

/**
 * Function to sign a challenge with a private key
 * @param challenge {string} The challenge to sign
 * @param privateKey {string} The private key to use
 * @param salt {string} The salt to use
 * @returns {string} The signature in DER format encoded as hex
 */
export const signChallenge = (challenge: string, privateKey: string, salt: string) => {
    // Create an instance of the elliptic curve algorithm
    const ec = new EC('secp256k1');

    // Convert the salt to a WordArray
    const saltHex = CryptoJS.enc.Hex.parse(salt);

    // Derive the key from the private key and the salt
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
};

/**
 * Function to verify a signature with a public key
 * @param publicKeyFromDatabase {string} The public key concatenated with the salt from the database
 * @returns {salt: string, publicKey: string} The extracted salt and public key
 */
export const getSaltAndPublicKey = (publicKeyFromDatabase: string) => {
    // Extract the salt from the public key
    const salt = publicKeyFromDatabase.substring(0, 32);

    // Extract the public key from the public key
    const publicKey = publicKeyFromDatabase.substring(32);

    return {
        salt: salt,
        publicKey: publicKey,
    };
};

/**
 * Function to verify a password strength and match
 * @param password {string} The password to validate
 * @param confirmPassword {string} The password to confirm
 * @returns {isValid: boolean, errorMessages: string[]}
 */
export const validatePassword = (password: string, confirmPassword: string) => {
    const hasSymbol = /[!@#$%^&*(),.?":{}|<>]/;
    const hasUppercaseLetter = /[A-Z]/;
    const hasLowercaseLetter = /[a-z]/;
    const hasNumber = /[0-9]/;
    let errorMessages = [];

    if (password.length < 12) {
        errorMessages.push('Password must be at least 12 characters long.');
    }
    if (!hasSymbol.test(password)) {
        errorMessages.push('Password must contain at least one symbol.');
    }
    if (!hasUppercaseLetter.test(password)) {
        errorMessages.push('Password must contain at least one uppercase letter.');
    }
    if (!hasLowercaseLetter.test(password)) {
        errorMessages.push('Password must contain at least one lowercase letter.');
    }
    if (!hasNumber.test(password)) {
        errorMessages.push('Password must contain at least one number.');
    }
    if (password !== confirmPassword) {
        errorMessages.push('Passwords do not match.');
    }

    return {
        isValid: errorMessages.length === 0,
        errorMessages: errorMessages,
    };
};

/**
 * Function to encrypt plain text such as TOTP secret
 * @param text {string} The text to encrypt
 * @param encryptionKey {string} The key to use for encryption
 * @returns {string} The encrypted text
 */
export const encryptText = (text: string, encryptionKey: string) => {
    // Generate a random salt
    const salt = generateSalt(SALT_SIZE);

    // Derive the key from the encryption key and the salt
    const key = generateKey(encryptionKey, salt, KEY_SIZE, ITERATIONS);

    // Encrypt the text
    const encryptedText = CryptoJS.AES.encrypt(text, key.toString());

    // Concatenate the salt and the encrypted Text
    return salt.toString() + encryptedText.toString();
};

/**
 * Function to decrypt encrypted text such as TOTP secret
 * @param text {string} The encrypted text to decrypt
 * @param encryptionKey {string} The key to use for decryption
 * @returns {string} The decrypted text
 */
export const decryptText = (text: string, encryptionKey: string) => {
    // Extract the salt from the text
    const salt = CryptoJS.enc.Hex.parse(text.substring(0, 32));

    // Extract the encrypted TOTP secret from the text
    const encryptedText = text.substring(32);

    // Derive the key from the encryption key and the salt
    const key = generateKey(encryptionKey, salt, KEY_SIZE, ITERATIONS);

    // Decrypt the text
    const decryptedText = CryptoJS.AES.decrypt(encryptedText, key.toString());

    // Return the decrypted Text
    return decryptedText.toString(CryptoJS.enc.Utf8);
};

/**
 * Function to encrypt a file
 * @param file {File} The file to encrypt
 * @param encryptionKey {string} The key to use for encryption}
 * @returns {Promise<EncryptedFile | null>} The encrypted file data, or null if an error occurred
 */
export const encryptFile = async (file: File, encryptionKey: string): Promise<EncryptedFile | null> => {
    try {
        // Convert the file to a buffer
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Convert the buffer to a WordArray
        const wordArray = CryptoJS.lib.WordArray.create(buffer as unknown as number[]);

        // Generate a random salt
        const salt = generateSalt(SALT_SIZE);

        // Derive the key from the encryption key and the salt
        const key = generateKey(encryptionKey, salt, KEY_SIZE, ITERATIONS);

        // Encrypt the file data
        const encryptedFile = CryptoJS.AES.encrypt(wordArray, key.toString());

        // Create an object to store the encrypted file data and the metadata
        const encryptedData: EncryptedFile = {
            ciphertext: encryptedFile.toString(),
            salt: salt.toString(),
            filename: file.name,
            filetype: file.type,
        };

        return encryptedData;
    } catch (error) {
        console.error('File processing error:', error);
        return null;
    }
};

/**
 * Function to decrypt a file
 * @param encryptedData {EncryptedFile} The encrypted file data to decrypt
 * @param encryptionKey {string} The key to use for decryption
 * @returns {Promise<DecryptedFile | null>} The decrypted file data, or null if an error occurred
 */
export const decryptFile = async (encryptedData: EncryptedFile, encryptionKey: string): Promise<DecryptedFile | null> => {
    try {
        // Extract the ciphertext, salt, filename and filetype from the encrypted data
        const ciphertext = encryptedData.ciphertext;
        const salt = CryptoJS.enc.Hex.parse(encryptedData.salt);
        const filename = encryptedData.filename;

        // Re-generate the key (using the same password and salt)
        const key = generateKey(encryptionKey, salt, KEY_SIZE, ITERATIONS);

        // Decrypt the file data
        const decryptedWordArray = CryptoJS.AES.decrypt(ciphertext, key.toString());

        // Convert the decrypted WordArray to a Buffer
        const decryptedBuffer = Buffer.from(decryptedWordArray.toString(CryptoJS.enc.Base64), 'base64');

        // Create an object to store the decrypted file data and the metadata
        const decryptedFile: DecryptedFile = {
            decryptedBuffer: decryptedBuffer,
            filename: filename,
            filetype: encryptedData.filetype,
        };

        return decryptedFile;
    } catch (error) {
        return null;
    }
};

/**
 * Function to verify a signature
 * @param publicKeyHex {string} The public key in hex format
 * @param challenge {string} The challenge to verify, in hex format
 * @param signatureHex {string} The signature to verify, in hex format
 * @returns {boolean} True if the signature is valid, false if not
 */
export const verifySignature = (publicKeyHex: string, challenge: string, signatureHex: string) => {
    try {
        const ec = new EC('secp256k1');

        const keyPair = ec.keyFromPublic(publicKeyHex, 'hex');

        // Hash the challenge
        const hashedChallenge = CryptoJS.SHA256(challenge).toString(CryptoJS.enc.Hex);

        // Verify the signature
        return keyPair.verify(hashedChallenge, signatureHex);
    } catch (error) {
        // Return false for any errors and invalid inputs
        return false;
    }
};
