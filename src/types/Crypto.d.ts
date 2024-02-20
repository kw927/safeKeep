export interface EncryptedFile {
    ciphertext: string;
    salt: string;
    filename: string;
    filetype: string;
}

export interface DecryptedFile {
    decryptedBuffer: Buffer;
    filename: string;
    filetype: string;
}

export interface EncryptedWalletProps {
    encryptedWallet: string;
}

export interface DisplayTransaction {
    hash: string;
    datetime: string;
    displayAddress: string;
    direction: string;
    value: string;
    valuePrefix: string;
    valueColor: string;
}

export interface DisplayNFT {
    name: string;
    description: string;
    shortDescription: string;
    image: string;
    tokenId: string;
    tokenAddress: string;
    owner: string;
    contractType: string;
    symbol: string;
    tokenUri: string;
    attributes: NFTAttributes[];
}

export interface NFTAttributes {
    name: string;
    value: string;
}

export interface NFTProps {
    chainId: string;
    tokenAddress: string;
    tokenId: string;
}
