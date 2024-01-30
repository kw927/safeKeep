import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { authenticator } from 'otplib';
import { decryptText } from '../../../../services/cryptoService';

// Define a type for the credentials
interface Credentials {
    username: string;
    password: string;
}

// Overriding the default User interface from next-auth
interface User {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    totp: boolean;
}

interface Session {
    refreshTokenExpires?: number;
    accessTokenExpires?: string;
    refreshToken?: string;
    token?: string;
    error?: string;
    user?: User;
}

// Declare the prisma client
const prisma = new PrismaClient();

/**
 * The default handler for the NextAuth API route
 */
const handler = NextAuth({
    providers: [
        CredentialsProvider({
            name: 'credentials',
            // The credentials object will be passed to the authorize callback
            credentials: {
                email: {},
                password: {},
                totpCode: {}
            },
            // The authorize function will receive the credentials object
            async authorize(credentials, req) {
                // Check if the credentials object is null
                if (credentials === undefined) {
                    return null;
                }

                // Check if the required fields are submitted
                if (!credentials.email || !credentials.password) {
                    return null;
                }

                // Get the user from the database
                const user = await prisma.user.findUnique({
                    where: {
                        email: credentials.email
                    }
                });

                if (user) {
                    // Check if the password matches
                    // Use the bcrypt library to compare the passwords
                    const passwordMatches = await bcrypt.compare(credentials.password, user.password_hash);

                    if (!passwordMatches) {
                        return null;
                    }

                    // Check if 2fa is enabled
                    if (user.totp_enabled && user.totp_secret) {
                        // Check if the totp code is submitted
                        if (!credentials.totpCode) {
                            return null;
                        }

                        // Verify the totp code
                        // Decrypt the totp secret from the database
                        const decryptedSecret = decryptText(user.totp_secret, process.env.TOTP_ENCRYPTION_KEY as string);

                        // Check if the totp code is valid
                        const isValid = authenticator.check(credentials.totpCode, decryptedSecret);

                        // Return null if the totp code is invalid
                        if (!isValid) {
                            return null;
                        }
                    }

                    // Return the user object
                    const userInSession: User = {
                        id: user.user_id.toString(),
                        firstName: user.first_name,
                        lastName: user.last_name,
                        email: user.email,
                        totp: user.totp_enabled
                    }

                    return userInSession
                }

                return null;
            }
        })
    ],
    callbacks: {
        async jwt({ token, user, session, account }) {
            // Only user object will be passed to jwt callback if it is the first call during the authentication process
            if (user?.email) {
                return { ...token, ...user };
            }

            return { ...token, ...user };

            // on the subsequent calls, jwt callback will receive the token object
            // so we can refresh the token on the subsequent calls
            // if (token?.accessTokenExpires) {
            //     // check if the access token is expired
            //     if (Date.now() / 1000 < token.accessTokenExpires) {
            //         // access token is not expired, so we can just return the token
            //         return token;
            //     }
            // }
        },
        async session({ session, token }) {
            // Check if the token contains the required fields
            if (token?.id === undefined || token?.firstName === undefined || token?.lastName === undefined || token?.email === undefined) {
                return session;
            }

            // Return the session with the user object
            return {
                ...session,
                user: {
                    ...session.user,
                    firstName: token.firstName as string,
                    lastName: token.lastName as string,
                    email: session.user?.email as string,
                    totp: token.totp as boolean
                }
            };
        },
    },
    session: {
        strategy: 'jwt',
    },
});

export { handler as GET, handler as POST }