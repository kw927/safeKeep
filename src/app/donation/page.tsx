
import React from 'react';
import MainLayout from '@/components/main-layout';
import ContentHeader from '@/components/content-header';
import DonationComponent from '@/components/donation-form';

const Donation = async () => {
    return (
        <>
            <MainLayout showSearchBar={false}>
                <ContentHeader title="Donation" />
                <div className="relative flex justify-center p-10">
                    <DonationComponent />
                </div>
            </MainLayout>
        </>
    );
};

export default Donation;