import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { PrismaClient } from '@prisma/client';
import { authenticator } from 'otplib';
import { decryptText } from '../../../../services/cryptoService';

const prisma = new PrismaClient();

/**
 * The API for verifying the TOTP code
 * @param req 
 * @param res 
 * @returns 
 */
const Verify = async (req: NextRequest, res: NextResponse) => {
    // Check if the request method is POST
    if (req.method !== 'POST') {
        return NextResponse.json({ message: 'Method not allowed' }, { status: 405 });
    }

    // Get the TOTP code from the request body
    const { totpCode } = await req.json();

    // Check if the user is authenticated
    const session = await getServerSession();
    
    if (!session?.user?.email) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Check if the TOTP code is submitted
    if (!totpCode) {
        return NextResponse.json({ message: 'TOTP code is required' }, { status: 400 });
    }

    // Get the TOTP secret from the database
    const user = await prisma.user.findUnique({
        where: {
            email: session.user.email
        }
    });

    // Check if the user exists
    if (!user) {
        return NextResponse.json({ message: 'User not found' }, { status: 401 });
    }

    // Check if the TOTP secret exists
    if (!user.totp_secret) {
        return NextResponse.json({ message: 'TOTP is not set' }, { status: 401 });
    }

    // Decrypt the TOTP secret
    const decryptedSecret = decryptText(user.totp_secret, process.env.TOTP_ENCRYPTION_KEY as string);

    // Check if the TOTP code is valid
    const isValid = authenticator.check(totpCode, decryptedSecret);

    if (!isValid) {
        return NextResponse.json({ message: 'Invalid TOTP code' }, { status: 401 });
    }

    // The TOTP code is valid, so enable TOTP for the user
    await prisma.user.update({
        where: {
            email: session.user.email
        },
        data: {
            totp_enabled: true
        }
    });

    return NextResponse.json({ message: 'success' }, { status: 200 });
};

export { Verify as POST }