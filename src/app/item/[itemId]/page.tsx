
import React from 'react';
import MainLayout from '@/components/main-layout';
import ContentHeader from '@/components/content-header';
import { getServerSession } from 'next-auth/next';
import { PrismaClient } from '@prisma/client';
import { notFound } from 'next/navigation';

// Declare the prisma client
const prisma = new PrismaClient();

const getItem = async (itemId: string) => {
    // Get the authenticated session to determine if the user is logged in
    const session = await getServerSession();

    if (!session?.user?.email) {
        return null;
    }

    // Get the user
    try {
        // get the user from the database
        const user = await prisma.user.findUnique({
            where: {
                email: session.user.email
            }
        });

        if (user) {
            // Try parsing the item id to a number
            const itemIdInt = parseInt(itemId);

            // Get the items for the user
            const item = await prisma.item.findUnique({
                where: {
                    item_id: itemIdInt,
                    user_id: user.user_id,
                    is_deleted: false
                },
                select: {
                    item_id: true,
                    name: true,
                    description: true,
                    data: true,
                    is_favorite: true,
                    created_at: true,
                    updated_at: true,
                    folder: {
                        select: {
                            folder_id: true,
                            name: true,
                            parent_folder_id: true
                        }
                    }
                }
            });

            if(!item) {
                return null;
            }

            return item;
        }

        return null;

    } catch (error) {
        console.error('Failed to get the item:', error);
        return null;
    }
}

const Item = async ({ params }: { params: { itemId: string } }) => {
    // Get the item from the database
    const item = await getItem(params.itemId);

    // If no item is found, redirect to the 404 page
    if (!item) {
        // This makes Next.js render its default 404 page
        notFound();
    }

    return (
        <>
            <MainLayout showSearchBar={false}>
                <ContentHeader title="Item"  />
                
                {params.itemId}
            </MainLayout>
        </>
    );
};

export default Item