/**
 * Donation Page
 * This page is a server component and all the code is executed on the server side.
 */

import React from 'react';
import MainLayout from '@/components/layout/main-layout';
import ContentHeader from '@/components/layout/content-header';
import DonationComponent from '@/components/donation/donation-form';

const Donation = async () => {
    return (
        <>
            <MainLayout showSearchBar={false}>
                <ContentHeader title='Donation' />
                <div className='relative flex justify-center p-10'>
                    <DonationComponent />
                </div>
            </MainLayout>
        </>
    );
};

export default Donation;
