import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { PrismaClient } from '@prisma/client';
import { getSaltAndPublicKey } from '@/services/cryptoServiceClient';
import { verifySignature } from '@/services/cryptoService';

const prisma = new PrismaClient();

const VerifyChallenge = async (req: NextRequest, res: NextResponse) => {
    // Only allow POST requests
    if (req.method !== 'POST') {
        return NextResponse.json({ message: 'Method not allowed' }, { status: 405 });
    }

    // Check if the user is authenticated
    const session = await getServerSession();
    
    if (!session?.user?.email) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Check if the public key has been set
    const user = await prisma.user.findUnique({
        where: {
            email: session.user.email
        }
    });

    if (!user) {
        return NextResponse.json({ message: 'User not found' }, { status: 401 });
    }

    if (!user.public_key) {
        return NextResponse.json({ message: 'Public key has not been set' }, { status: 401 });
    }

    // Check if the public key is valid
    if (user.public_key && user.public_key.length !== 162) {
        return NextResponse.json({ message: 'Invalid public key' }, { status: 400 });
    }

    // Get the signture from the request body
    const { signature } = await req.json();

    // Get the challenge from the database
    try {
        const challenge = await prisma.challenge.findFirst({
            where: {
                user_id: user.user_id
            },
            orderBy: {
                expires: 'desc'
            }
        });

        if (!challenge) {
            return NextResponse.json({ message: 'Challenge not found' }, { status: 404 });
        }

        // Check if the challenge has expired
        if (challenge.expires < new Date()) {
            return NextResponse.json({ message: 'Challenge has expired' }, { status: 401 });
        }

        // Check if the signature is valid
        const { publicKey } = getSaltAndPublicKey(user.public_key);

        const isValid = verifySignature(publicKey, challenge.challenge, signature);

        if (!isValid) {
            return NextResponse.json({ message: 'Invalid master password' }, { status: 401 });
        }

        // Return a success message
        return NextResponse.json({ message: 'Signature verified successfully' }, { status: 200 });
    } catch (error) {
        console.error('Error verifying signature:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}

export { VerifyChallenge as POST }