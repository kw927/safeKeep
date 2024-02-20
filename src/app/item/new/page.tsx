/**
 * New Item Page
 * This page is a server component and all the code is executed on the server side.
 */

import React from 'react';
import MainLayout from '@/components/layout/main-layout';
import ContentHeader from '@/components/layout/content-header';
import NewItemForm from '@/components/items/new-item-form';

const AddItem = async () => {
    return (
        <>
            <MainLayout showSearchBar={false}>
                <ContentHeader title='Add Item' />

                <NewItemForm />
            </MainLayout>
        </>
    );
};

export default AddItem;
