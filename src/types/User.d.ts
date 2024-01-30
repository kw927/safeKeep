export interface User {
    name?: string | null;
    email?: string | null;
    image?: string | null;
    totp?: boolean;
}

export interface LoginUserResponse {
    message: string;
    totpEnabled?: boolean;
}