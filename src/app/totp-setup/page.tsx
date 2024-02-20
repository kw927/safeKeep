/**
 * TOTP Setup Page
 * This page is a server component and all the code is executed on the server side.
 */

import React from 'react';
import { getServerSession } from 'next-auth/next';
import { redirect } from 'next/navigation';
import { PrismaClient } from '@prisma/client';
import { authenticator } from 'otplib';
import { encryptText } from '@/services/cryptoServiceClient';
import qrcode from 'qrcode';
import TOTPSetps from '@/components/auth/totp-steps';
import { TOTPData } from '@/types/Totp';

// Declare the prisma client
const prisma = new PrismaClient();

/**
 * Function to get the TOTP setup URL
 * Note: This function is called from the server side and not the client side
 * @returns
 */
const getTOTPSetupUrl = async () => {
    // Get the authenticated session to determine if the user is logged in
    const session = await getServerSession();

    if (!session?.user?.email) {
        return null;
    }

    // Check if user has totp enabled
    try {
        // Get the user from the database
        const user = await prisma.user.findUnique({
            where: {
                email: session.user.email,
            },
        });

        // Return if the user has already enabled totp, since this page is only for setting up totp
        if (user?.totp_enabled) {
            return {
                totpEnabled: true,
                totpQRCode: null,
                totpKeyUri: null,
                totpSecret: null,
            } as TOTPData;
        }

        // Generate TOTP secret for the user
        const secret = authenticator.generateSecret();

        // Encrypt the TOTP secret
        const encryptedSecret = encryptText(secret, process.env.TOTP_ENCRYPTION_KEY as string);

        // Save the encrypted secret to the database
        await prisma.user.update({
            where: {
                email: session.user.email,
            },
            data: {
                totp_secret: encryptedSecret,
                totp_enabled: false,
            },
        });

        // Generate the QR code and convert it to a data URL for the client to display
        const keyUri = authenticator.keyuri(session.user.email, 'SafeKeep', secret);
        const QRCode = await qrcode.toDataURL(keyUri);

        return {
            totpEnabled: false,
            totpQRCode: QRCode,
            totpKeyUri: keyUri,
            totpSecret: secret,
        } as TOTPData;
    } catch (error) {
        console.error('Failed to get user:', error);
        return null;
    }
};

/**
 * Function for the TOTP setup page
 * @returns
 */
const TOTPSetup = async () => {
    // Get the TOTP data
    const totpData = await getTOTPSetupUrl();

    // Redirect to home page if totp is already enabled
    if (totpData && totpData.totpEnabled) {
        redirect('/home');
    }

    // Show error if totp data is not available
    if (!totpData) {
        return (
            <div>
                <h1>Error getting TOTP data</h1>
            </div>
        );
    }

    // Render the TOTP setup page
    return (
        <div>
            <h1>TOTPSetup</h1>
            <TOTPSetps totpData={totpData} />
        </div>
    );
};

export default TOTPSetup;
