import { getServerSession } from 'next-auth/next';
import { getUserByEmail } from '@/services/databaseService';

/**
 * Function to get the user from the next auth session
 * @returns {User | null} The user or null if the user is not found
 */
export const getUserFromSession = async () => {
    const session = await getServerSession();

    if (!session?.user?.email) {
        console.error('No session or user email found');
        return null;
    }

    const user = await getUserByEmail(session.user.email);
    if (!user) {
        console.error('No user found with the email from session');
        return null;
    }

    return user;
};
