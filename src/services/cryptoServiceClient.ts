import CryptoJS from 'crypto-js';
import { ec as EC } from 'elliptic';
import { generateKey, generateSalt, KEY_SIZE, SALT_SIZE, ITERATIONS } from './cryptoUtil';

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