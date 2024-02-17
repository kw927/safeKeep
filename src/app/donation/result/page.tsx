
import React from 'react';
import MainLayout from '@/components/main-layout';
import ContentHeader from '@/components/content-header';
import DonationResult from '@/components/donation-result';

const Donation = async () => {
    return (
        <>
            <MainLayout showSearchBar={false}>
                <ContentHeader title="Donation" />
                <div className="relative flex justify-center p-10">
                    <DonationResult />
                </div>

            </MainLayout>
        </>
    );
};

export default Donation;