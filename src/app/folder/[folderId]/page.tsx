import React from 'react';
import MainLayout from '@/components/main-layout';
import ContentHeader from '@/components/content-header';
import { notFound } from 'next/navigation';
import { ListItem } from '@/types/Item';
import { getUserListItemsByFolderId, getFolder } from '@/services/databaseService';
import { getItemDetail } from '@/utils/itemUtils';
import AllItems from '@/components/all-items';
import { getUserFromSession } from '@/utils/userAccountUtils';

const getItemsByFolderId = async (folderId: number) => {
    const user = await getUserFromSession();

    if (!user) return [];

    try {
        const items = await getUserListItemsByFolderId(folderId, user.user_id);

        // Loop through the items and get the details
        const listItems: ListItem[] = [];
        items.forEach(item => {
            listItems.push(getItemDetail(item));
        });

        return listItems || [];
    } catch (error) {
        console.error('Failed to get the items:', error);
        return [];
    }
};

const getFolderDetail = async (folderId: number) => {
    const user = await getUserFromSession();

    if (!user) return null;

    try {
        const folder = await getFolder(folderId, user.user_id);
        return folder;
    } catch (error) {
        console.error('Failed to get the folder detail:', error);
        return null;
    }
};

const Folder = async ({ params }: { params: { folderId: string } }) => {
    const folderIdInt = parseInt(params.folderId);

    // Get the folder from the database
    const folder = await getFolderDetail(folderIdInt);

    if (!folder) {
        // This makes Next.js render its default 404 page
        notFound();
    }

    // Get the items for the folders from the database
    const items = await getItemsByFolderId(folderIdInt);

    return (
        <>
            <MainLayout showSearchBar={false}>
                <ContentHeader title={folder.name} />

                <div className="relative flex justify-center pt-10" style={{ height: 'calc(100vh - 144px)' }}>
                    {items && (
                        <AllItems items={items} />
                    )}
                    
                </div>
            </MainLayout>
        </>
    );
};

export default Folder;