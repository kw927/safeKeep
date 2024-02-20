/**
 * Web3 wallet setup page
 * This page is a server component and all the code is executed on the server side.
 */

import React from 'react';
import { redirect } from 'next/navigation';
import MainLayout from '@/components/layout/main-layout';
import ContentHeader from '@/components/layout/content-header';
import Web3WalletSetps from '@/components/web3/web3-wallet-steps';
import { getEncryptedWeb3Wallet } from '@/utils/web3Utils';

const Web3 = async () => {
    // Get the encrypted Web3 wallet
    const web3Wallets = await getEncryptedWeb3Wallet();

    // Redirect to crypto page if user has a web3 wallet
    if (web3Wallets && web3Wallets.length > 0) {
        redirect('/web3/crypto');
    }

    // Render the Web3 wallet setup page if user does not have a web3 wallet
    return (
        <MainLayout showSearchBar={false}>
            <ContentHeader title='Web3 Wallet' />
            <div className='relative flex justify-center p-10'>
                <Web3WalletSetps />
            </div>
        </MainLayout>
    );
};

export default Web3;
