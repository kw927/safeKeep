import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getUserFromSession } from '@/utils/userAccountUtils';

const prisma = new PrismaClient();

const SetMasterPassword = async (req: NextRequest, res: NextResponse) => {
    // Only allow POST requests
    if (req.method !== 'POST') {
        return NextResponse.json({ message: 'Method not allowed' }, { status: 405 });
    }

    const user = await getUserFromSession();

    if (!user) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Get the public key from the request body
    const { publicKey } = await req.json();

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
                email: user.email
            },
            data: {
                public_key: publicKey
            }
        });

        return NextResponse.json({ message: 'Public key saved successfully' }, { status: 200 });
    } catch (error) {
        console.error('Error saving public key:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}

export { SetMasterPassword as POST }