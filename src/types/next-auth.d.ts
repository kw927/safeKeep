/**
* Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
* Solution from: https://stackoverflow.com/questions/69602694/how-to-update-the-type-of-session-in-session-callback-in-next-auth-when-using-ty
*/
import NextAuth from "next-auth"

declare module "next-auth" {
    interface Session {
        user: {
            email: string;
            firstName: string;
            lastName: string;
            totp: boolean;
        }
    }
}