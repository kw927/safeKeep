/**
 * Edit Item Page
 * This page is a server component and all the code is executed on the server side.
 */

import React from 'react';
import MainLayout from '@/components/layout/main-layout';
import ContentHeader from '@/components/layout/content-header';
import { notFound } from 'next/navigation';
import { getFilesFromStorage } from '@/services/cryptoService';
import EditItemForm from '@/components/items/edit-item-form';
import { getItem } from '@/utils/itemUtils';

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
    ).then((files) => files.filter((file) => file !== null)); // Filter out any null values if a file was not found

    // Combine the item data with the encrypted files data
    const itemWithFiles = {
        ...item, // Spread the existing item properties
        files: encryptedFiles, // Override the files property with the new encryptedFiles array
    };

    // Prepare the props to pass to the ItemView component
    const itemProps = { item: itemWithFiles };

    return (
        <>
            <MainLayout showSearchBar={false}>
                <ContentHeader title='Edit Item' />
                <EditItemForm item={itemProps.item} />
            </MainLayout>
        </>
    );
};

export default EditItem;
