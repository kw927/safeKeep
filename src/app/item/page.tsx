
import React from 'react';
import MainLayout from '@/components/main-layout';

import { getServerSession } from 'next-auth/next';
import { PrismaClient, Item } from '@prisma/client';
import { ListItem } from '@/types/Item';
import ContentHeader from '@/components/content-header';

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

const getColorByName = (name: string) => {
    const colors: { [key: string]: string } = {
        'A': 'bg-red-500', 'B': 'bg-green-500', 'C': 'bg-blue-500',
        'D': 'bg-orange-500', 'E': 'bg-yellow-500', 'F': 'bg-teal-500',
        'G': 'bg-pink-600', 'H': 'bg-purple-600', 'I': 'bg-indigo-500',
        'J': 'bg-red-600', 'K': 'bg-green-600', 'L': 'bg-blue-600',
        'M': 'bg-orange-600', 'N': 'bg-yellow-600', 'O': 'bg-teal-600',
        'P': 'bg-pink-700', 'Q': 'bg-purple-700', 'R': 'bg-indigo-700',
        'S': 'bg-red-700', 'T': 'bg-green-700', 'U': 'bg-blue-700',
        'V': 'bg-orange-700', 'W': 'bg-yellow-700', 'X': 'bg-teal-700',
        'Y': 'bg-pink-800', 'Z': 'bg-purple-800'
    };

    // The default colour to use if the first letter is not in the list
    // For example, if the name starts with a number, symbol, other language character, etc.
    const defaultColor = 'bg-gray-500';

    if (name.length === 0) {
        return defaultColor;
    }
    const firstLetter = name.charAt(0).toUpperCase();
    return colors[firstLetter] || defaultColor;
}

const getItemDetail = (item: Item) => {
    const initials = item.name.split(' ').slice(0, 2).map(n => n[0]).join('');
    const bgColor = getColorByName(item.name);

    const listItem: ListItem = {
        name: item.name,
        description: item.description,
        initials,
        color: bgColor
    };
    return listItem;
}

const AllItem = async () => {
    const items = await getAllItems();

    return (
        <>
            <MainLayout>
                <ContentHeader title="All Items" button="add-item" />

                <div className="relative flex justify-center items-center" style={{ height: 'calc(100vh - 144px)' }}>
                    all items
                </div>
            </MainLayout>
        </>
    );
};

export default AllItem