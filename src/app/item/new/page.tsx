
import React from 'react';
import MainLayout from '@/components/main-layout';
import ContentHeader from '@/components/content-header';



const AddItem = async () => {
    return (
        <>
            <MainLayout>
                <ContentHeader title="Add Item" />

                <div className="relative flex justify-center items-center" style={{ height: 'calc(100vh - 144px)' }}>
                    add item
                </div>
            </MainLayout>
        </>
    );
};

export default AddItem