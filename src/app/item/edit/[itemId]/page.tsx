
import React from 'react';
import MainLayout from '@/components/main-layout';
import ContentHeader from '@/components/content-header';
import { getServerSession } from 'next-auth/next';
import { getUserByEmail, getUserItemById } from '@/services/databaseService';
import { notFound } from 'next/navigation';
import { getFilesFromStorage } from '@/services/cryptoService';
import EditItemForm from '@/components/edit-item-form';

const getItem = async (itemId: string) => {
    // Get the authenticated session to determine if the user is logged in
    const session = await getServerSession();

    if (!session?.user?.email) {
        return null;
    }

    // Get the user
    try {
        // get the user from the database
        const user = await getUserByEmail(session.user.email);

        if (user) {
            // Try parsing the item id to a number
            const itemIdInt = parseInt(itemId);

            // Get the items for the user
            const item = await getUserItemById(itemIdInt, user.user_id);

            if (!item) {
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

const EditItem = async ({ params }: { params: { itemId: string } }) => {
    // Get the item from the database
    const item = await getItem(params.itemId);

    // If no item is found, redirect to the 404 page
    if (!item) {
        // This makes Next.js render its default 404 page
        notFound();
    }

    // Asynchronously fetch and decrypt the files
    const encryptedFiles = await Promise.all(
        item.files.map(async (file) => {
            // Get the encrypted file data from storage
            return await getFilesFromStorage(file.file_path);
        })
    ).then(files => files.filter(file => file !== null)); // Filter out any null values if a file was not found

    // Combine the item data with the encrypted files data
    const itemWithFiles = {
        ...item, // Spread the existing item properties
        files: encryptedFiles // Override the files property with the new encryptedFiles array
    };

    // Prepare the props to pass to the ItemView component
    const itemProps = { item: itemWithFiles };

    console.log(itemProps)

    return (
        <>
            <MainLayout showSearchBar={false}>
                <ContentHeader title="Edit Item" />
                <EditItemForm item={itemProps.item} />
                
            </MainLayout>
        </>
    );
};

export default EditItem