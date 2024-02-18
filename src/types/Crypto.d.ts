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

export interface EncryptedWalletProps {
    encryptedWallet: string;
}

export interface DisplayTransaction {
    hash: string,
    datetime: string;
    displayAddress: string;
    direction: string;
    value: string;
    valuePrefix: string;
    valueColor: string;
}