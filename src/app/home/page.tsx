/**
 * Home page
 * This page is a server component and all the code is executed on the server side.
 */

import React from 'react';
import MainLayout from '@/components/layout/main-layout';
import HomeComponent from '@/components/home';
import { getServerSession } from 'next-auth/next';
import { PrismaClient } from '@prisma/client';
import { getSaltAndPublicKey } from '@/services/cryptoServiceClient';
import { UserProvider } from '@/context/UserProvider';

// declare the prisma client
const prisma = new PrismaClient();

/**
 * Function to get the salt for encrypting the master password
 * Note: This function is called from the server side and not the client side
 * @returns
 */
const getSalt = async () => {
    // Get the authenticated session to determine if the user is logged in
    const session = await getServerSession();

    if (!session?.user?.email) {
        return null;
    }

    // get the salt
    try {
        // Get the user from the database
        const user = await prisma.user.findUnique({
            where: {
                email: session.user.email,
            },
        });

        if (user?.public_key) {
            // get the salt and public key
            const { salt } = getSaltAndPublicKey(user.public_key);

            return salt;
        }

        return null;
    } catch (error) {
        console.error('Failed to get user:', error);
        return null;
    }
};

const Home = async () => {
    const salt = await getSalt();

    return (
        <>
            <MainLayout showSearchBar={false}>
                <UserProvider>
                    <HomeComponent salt={salt} />
                </UserProvider>
            </MainLayout>
        </>
    );
};

export default Home;
