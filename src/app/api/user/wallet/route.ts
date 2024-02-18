import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getUserFromSession } from '@/utils/userAccountUtils';
import { getUserWallets } from '@/services/databaseService';

const prisma = new PrismaClient();

/**
 * API to save the user's web3 wallet
 * Currently only one wallet per user is supported
 * @param req {NextRequest} 
 * @param res {NextResponse}
 */
const SaveWallet = async (req: NextRequest, res: NextResponse) => {
    // Only allow POST requests
    if (req.method !== 'POST') {
        return NextResponse.json({ message: 'Method not allowed' }, { status: 405 });
    }

    // Check if the user is logged in
    const user = await getUserFromSession();

    if (!user) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Check if the user has web3 wallets
    // The database design allows for multiple wallets per user
    // However, currently only one wallet per user is supported for this application
    const wallets = await getUserWallets(user.user_id);

    if (wallets.length > 0) {
        return NextResponse.json({ message: 'Wallet already exists' }, { status: 400 });
    }

    // Parse the request body and validate
    const body = await req.json();

    if (!body) {
        return NextResponse.json({ message: 'Bad request' }, { status: 400 });
    }

    const { encryptedWallet, walletName } = body;

    // Check if the required fields are submitted
    if (!encryptedWallet || !walletName) {
        return NextResponse.json({ message: 'Encrypted wallet and wallet name are required' }, { status: 400 });
    }

    // Save the wallet to the database
    try {
        const wallet = await prisma.web3Wallet.create({
            data: {
                user_id: user.user_id,
                encrypted_wallet: encryptedWallet,
                wallet_name: walletName,
                created_at: new Date(),
                updated_at: new Date()
            }
        });

        if (!wallet) {
            return NextResponse.json({ message: 'Failed to save wallet' }, { status: 500 });
        }

        // Return a success message
        return NextResponse.json({ message: 'Wallet saved successfully' }, { status: 200 });
    } catch (error) {
        console.error('Error verifying signature:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}

export { SaveWallet as POST }