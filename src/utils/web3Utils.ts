import { getServerSession } from 'next-auth/next';
import { PrismaClient } from '@prisma/client';

/**
 * Function to get the encrypted web3 wallet for the user
 * @returns {Promise<Web3Wallet[]>} The encrypted web3 wallets
 */
export const getEncryptedWeb3Wallet = async () => {
    const prisma = new PrismaClient();

    // Get the authenticated session to determine if the user is logged in
    const session = await getServerSession();

    if (!session?.user?.email) {
        return null;
    }

    // Check if user has a web3 wallet
    try {
        // Get the user with web3 wallets from the database
        const user = await prisma.user.findUnique({
            where: {
                email: session.user.email,
            },
            include: {
                web3_wallets: true,
            },
        });

        return user?.web3_wallets;
    } catch (error) {
        console.error('Failed to get user:', error);
        return null;
    }
};
