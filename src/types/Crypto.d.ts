export interface EncryptedFile {
    ciphertext: string;
    salt: string;
    filename: string;
    filetype: string;
};