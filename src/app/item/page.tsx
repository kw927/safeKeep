
import React from 'react';
import MainLayout from '@/components/main-layout';
import { getServerSession } from 'next-auth/next';
import { PrismaClient, Item } from '@prisma/client';
import { ListItem } from '@/types/Item';
import ContentHeader from '@/components/content-header';
import AllItems from '@/components/all-items';
import { getItemDetail } from '@/utils/itemUtils';

// Declare the prisma client
const prisma = new PrismaClient();

const getAllItems = async () => {
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
            // Get the items for the user
            const items = await prisma.item.findMany({
                where: {
                    user_id: user.user_id,
                    is_deleted: false
                },
                select: {
                    item_id: true,
                    name: true,
                    description: true,
                    is_favorite: true
                },
                orderBy: {
                    name: 'asc'
                }
            });

            // Loop through the items and get the details
            const listItems: ListItem[] = [];
            items.forEach(item => {
                listItems.push(getItemDetail(item));
            });

            return listItems;
        }

        return null;

    } catch (error) {
        console.error('Failed to get user:', error);
        return null;
    }
}

const AllItem = async () => {
    const items = await getAllItems();

    return (
        <>
            <MainLayout showSearchBar={true}>
                <ContentHeader title="All Items" button="add-item" />

                <div className="relative flex justify-center pt-10" style={{ height: 'calc(100vh - 144px)' }}>
                    {items && (
                        <AllItems items={items} />
                    )}
                    
                </div>
            </MainLayout>
        </>
    );
};

export default AllItem