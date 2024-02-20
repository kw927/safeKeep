/**
 * This crypto service can only be imported to the server side components because it uses the fs module
 */

import fs from 'fs';

/**
 * Function to get an encrypted file from the storage
 * @param filePath {string} The path to the file in the storage
 * @returns {Promise<EncryptedFile | null>} The encrypted file data, or null if the file does not exist
 */
export const getFilesFromStorage = async (filePath: string) => {
    // Check if the file exists
    if (!fs.existsSync(filePath)) {
        return null;
    }

    // Read the file from the storage
    const encryptedDataString = fs.readFileSync(filePath, 'utf8');

    // Parse the encrypted data to a JSON object
    const encryptedData = JSON.parse(encryptedDataString);

    return encryptedData;
}