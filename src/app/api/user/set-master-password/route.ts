import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getUserFromSession } from '@/utils/userAccountUtils';

const prisma = new PrismaClient();

/**
 * Function to set the master password for a user
 * This API will save the public key generated on the client to the database
 * @param publickKey {string} The public key generated on the client
 */
const SetMasterPassword = async (req: NextRequest, res: NextResponse) => {
    // Only allow POST requests
    if (req.method !== 'POST') {
        return NextResponse.json({ message: 'Method not allowed' }, { status: 405 });
    }

    const user = await getUserFromSession();

    if (!user) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Parse the request body and validate
    const body = await req.json();

    if (!body) {
        return NextResponse.json({ message: 'Bad request' }, { status: 400 });
    }

    // Get the public key from the request body
    const { publicKey } = body;

    if (!publicKey) {
        return NextResponse.json({ message: 'Public key is required' }, { status: 400 });
    }

    // Check if the public key is valid
    if (publicKey.length !== 162) {
        return NextResponse.json({ message: 'Invalid public key' }, { status: 400 });
    }

    // Check if the key has been set
    if (user.public_key) {
        return NextResponse.json({ message: 'Public key has been set' }, { status: 401 });
    }

    // Save the public key to the database
    try {
        await prisma.user.update({
            where: {
                email: user.email,
            },
            data: {
                public_key: publicKey,
            },
        });

        return NextResponse.json({ message: 'Public key saved successfully' }, { status: 200 });
    } catch (error) {
        console.error('Error saving public key:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
};

export { SetMasterPassword as POST };
