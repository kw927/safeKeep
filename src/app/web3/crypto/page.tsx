import React from 'react';
import { redirect } from 'next/navigation';
import MainLayout from '@/components/main-layout';
import ContentHeader from '@/components/content-header';
import { getEncryptedWeb3Wallet } from '@/utils/web3Utils';
import CryptoComponent from '@/components/crypto';

const Web3 = async () => {
    // Get the Web3 wallet data
    const encryptedWeb3Wallets = await getEncryptedWeb3Wallet();

    // Redirect to web3 wallet setup page if user does not have a web3 wallet
    if (!encryptedWeb3Wallets || encryptedWeb3Wallets.length === 0) {
        redirect('/web3');
    }

    // Render the crypto page
    return (
        <MainLayout showSearchBar={false}>
            <ContentHeader title='Web3 Wallet' />
            <div className='relative flex justify-center p-10'>
                <CryptoComponent
                    encryptedWallet={encryptedWeb3Wallets[0].encrypted_wallet}
                />
            </div>
        </MainLayout>
    );
};

export default Web3;
