import { withAuth } from 'next-auth/middleware'

export default withAuth({
    callbacks: {
        authorized: async ({ req, token }) => {
            // Exclude the following paths
            const publicPaths = ['/login', '/signup', '/api', '/images'];
            const path = req.nextUrl.pathname;

            // Allow access if the path is public
            if (publicPaths.some(publicPath => path.startsWith(publicPath))) {
                return true;
            }

            // API routes are public
            const publicApiPaths = ['/api/auth', '/api/user/signup'];
            const apiPath = req.nextUrl.pathname;

            // Allow access if the path is public API routes
            if (publicApiPaths.some(publicPath => apiPath.startsWith(publicPath))) {
                return true;
            }

            // Check if the token is expired
            if (!token) {
                return false;
            }

            // Check if the token is present and not expired
            const tokenExpiration = token.exp as number;

            if (!tokenExpiration) {
                return false;
            }

            const now = Math.floor(Date.now() / 1000); // Current time in UNIX epoch time
            if (tokenExpiration < now) {
                // Token is expired
                return false;
            }

            // Since PrismaClient cannot run in Vercel Edge Functions
            // Each route should check if the user exists in the database and not disabled or deleted

            return true;
        },
    },
    pages: {
        signIn: '/login'
    }
})