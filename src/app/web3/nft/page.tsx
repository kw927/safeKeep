import React from 'react';
import { redirect } from 'next/navigation';
import MainLayout from '@/components/main-layout';
import ContentHeader from '@/components/content-header';
import NFTsComponent from '@/components/nfts';
import { getEncryptedWeb3Wallet } from '@/utils/web3Utils';

const NFTs = async () => {
    // Get the encrypted Web3 wallet
    const encryptedWeb3Wallets = await getEncryptedWeb3Wallet();

    // Redirect to web3 wallet setup page if user does not have a web3 wallet
    if (!encryptedWeb3Wallets || encryptedWeb3Wallets.length === 0) {
        redirect('/web3');
    }

    // Render the Web3 wallet setup page if user does not have a web3 wallet
    return (
        <MainLayout showSearchBar={false}>
            <ContentHeader title='NFTs' />
            <div className='relative flex justify-center p-10'>
                <NFTsComponent encryptedWallet={encryptedWeb3Wallets[0].encrypted_wallet} />
            </div>
        </MainLayout>
    );
};

export default NFTs;
