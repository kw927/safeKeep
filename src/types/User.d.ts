export interface User {
    name?: string | null;
    email?: string | null;
    image?: string | null;
    totp?: boolean;
}

export interface LoginUserResponse {
    message: string;
    userId: number;
    totpEnabled?: boolean;
}

export interface TestUser {
    first_name: string;
    last_name: string;
    email: string;
    password_hash: string;
}