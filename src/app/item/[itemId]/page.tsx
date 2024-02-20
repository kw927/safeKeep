/**
 * Item page
 * This page is a server component and all the code is executed on the server side.
 */

import React from 'react';
import MainLayout from '@/components/layout/main-layout';
import ContentHeader from '@/components/layout/content-header';
import { notFound } from 'next/navigation';
import ItemView from '@/components/items/item-view';
import { getItem } from '@/utils/itemUtils';
import { getFilesFromStorage } from '@/services/cryptoService';


const Item = async ({ params }: { params: { itemId: string } }) => {
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

    // Set the header button for the edit item functionality
    const headerButton = `edit-item-${item.item_id}`;

    return (
        <>
            <MainLayout showSearchBar={false}>
                <ContentHeader title={item.name} button={headerButton} />

                <ItemView {...itemProps} />
            </MainLayout>
        </>
    );
};

export default Item;
