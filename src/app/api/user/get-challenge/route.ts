import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { getUserFromSession } from '@/utils/userAccountUtils';

const prisma = new PrismaClient();

/**
 * API endpoint to get the challenge for verifying the master password
 */
const GetChallenge = async (req: NextRequest, res: NextResponse) => {
    // Only allow GET requests
    if (req.method !== 'GET') {
        return NextResponse.json({ message: 'Method not allowed' }, { status: 405 });
    }

    const user = await getUserFromSession();

    if (!user) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    if (!user.public_key) {
        return NextResponse.json({ message: 'Public key has not been set' }, { status: 401 });
    }

    // Check if the public key is valid
    if (user.public_key && user.public_key.length !== 162) {
        return NextResponse.json({ message: 'Invalid public key' }, { status: 400 });
    }

    // Generate a random challenge and save it to the database
    try {
        const challenge = uuidv4();
        await prisma.challenge.create({
            data: {
                user_id: user.user_id,
                challenge: challenge,
                expires: new Date(Date.now() + 60000), // valid for 1 minutes
            },
        });

        // Remove all expired challenges
        await prisma.challenge.deleteMany({
            where: {
                expires: {
                    lte: new Date(),
                },
            },
        });

        return NextResponse.json({ message: 'Challenge generated', challenge: challenge }, { status: 200 });
    } catch (error) {
        console.error('Error generating challenge', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
};

export { GetChallenge as GET };
