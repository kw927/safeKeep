
import React from 'react';
import MainLayout from '@/components/main-layout';
import ContentHeader from '@/components/content-header';
import NewItemForm from '@/components/new-item-form';

const AddItem = async () => {
    return (
        <>
            <MainLayout showSearchBar={false}>
                <ContentHeader title="Add Item" />
                
                <NewItemForm />
            </MainLayout>
        </>
    );
};

export default AddItem