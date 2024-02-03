import CryptoJS from 'crypto-js';
import { ec as EC } from 'elliptic';
import fs from 'fs';
import { generateKey, generateSalt, KEY_SIZE, SALT_SIZE, ITERATIONS } from './cryptoUtil';

/**
 * Function to encrypt a file
 * @param file 
 * @param encryptionKey 
 * @param filePath 
 * @returns 
 */
export const encryptFile = async (file: File, encryptionKey: string, filePath: string): Promise<boolean> => {
    // Check if the file is submitted
    if (!file) {
        return false;
    }

    // Check if the encryption key is submitted
    if (!encryptionKey || encryptionKey.length === 0) {
        return false;
    }

    // Check if the file path is submitted
    if (!filePath || filePath.length === 0) {
        return false;
    }

    try {
        // Convert the file to a buffer
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Convert the buffer to a WordArray
        const wordArray = CryptoJS.lib.WordArray.create(buffer as unknown as number[]);

        // Generate a random salt
        const salt = generateSalt(SALT_SIZE);

        // Generate the key
        const key = generateKey(encryptionKey, salt, KEY_SIZE, ITERATIONS);

        // Encrypt the file data
        const encryptedFile = CryptoJS.AES.encrypt(wordArray, key.toString());

        // Create an object to store the encrypted file data and the metadata
        const encryptedData = {
            ciphertext: encryptedFile.toString(),
            salt: salt.toString(),
            filename: file.name,
            filetype: file.type
        };

        // Convert the encrypted data to a JSON string
        const encryptedDataString = JSON.stringify(encryptedData);

        // Write to a file
        fs.writeFileSync(filePath, encryptedDataString);

        return true;
    } catch (error) {
        console.error('File processing error:', error);
        return false;
    }
}

/**
 * Function to decrypt a file
 * @param filePath 
 * @param encryptionKey 
 * @returns 
 */
export const decryptFile = async (filePath: string, encryptionKey: string): Promise<boolean> => {
    // Check if the file path is submitted
    if (!filePath || filePath.length === 0) {
        return false;
    }

    // Check if the encryption key is submitted
    if (!encryptionKey || encryptionKey.length === 0) {
        return false;
    }

    try {
        // Read the encrypted data from the encrypted file
        const encryptedDataString = fs.readFileSync(filePath, 'utf8');
        const encryptedData = JSON.parse(encryptedDataString);

        // Extract the ciphertext, salt, filename and filetype from the encrypted data
        const ciphertext = encryptedData.ciphertext;
        const salt = CryptoJS.enc.Hex.parse(encryptedData.salt);
        const filename = encryptedData.filename;

        // Re-generate the key (using the same password and salt)
        const key = generateKey(encryptionKey, salt, KEY_SIZE, ITERATIONS);

        // Decrypt the file data
        const decryptedWordArray = CryptoJS.AES.decrypt(ciphertext, key.toString());

        // If the file is not a text file, handle as binary
        const decryptedBuffer = Buffer.from(decryptedWordArray.toString(CryptoJS.enc.Base64), 'base64');

        // Use regx to replace the encrypted file with the decrypted file, the encrypted file name is in the pattern: <filename>.crypt
        const decryptedFilePath = replaceFilename(filePath, filename);

        // Write the decrypted file to the file system
        fs.writeFileSync(decryptedFilePath, decryptedBuffer);

        return true;
    } catch (error) {
        console.error('File processing error:', error);
        return false;
    }
}

export const verifySignature = (publicKeyHex: string, challenge: string, signatureHex: string) => {
    const ec = new EC('secp256k1');
    
    const keyPair = ec.keyFromPublic(publicKeyHex, 'hex');

    // Hash the challenge
    const hashedChallenge = CryptoJS.SHA256(challenge).toString(CryptoJS.enc.Hex);

    // Verify the signature
    return keyPair.verify(hashedChallenge, signatureHex);
};

/**
 * Helper function to replace the filename
 * @param originalString 
 * @param filename 
 * @param filetype 
 * @returns 
 */
const replaceFilename = (originalString: string, filename: string): string => {
    // Regular expression to match the filename at the end of the path ending with .crypt
    const regex = /[^/]+\.crypt$/;

    // Replace the matched filename with the new filename
    return originalString.replace(regex, `${filename}`);
}