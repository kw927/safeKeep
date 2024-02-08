export interface EncryptedFile {
    ciphertext: string;
    salt: string;
    filename: string;
    filetype: string;
};

export interface DecryptedFile {
    decryptedBuffer: Buffer;
    filename: string;
    filetype: string;
};