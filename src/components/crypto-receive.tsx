'use client';
import React, { useEffect, useState } from 'react';
import { EncryptedWalletProps } from '@/types/Crypto';
import { Wallet } from 'ethers';
import { useRouter, useSearchParams } from 'next/navigation';
import { getMasterPasswordFromServiceWorker } from '@/services/serviceWorkerUtils';
import Image from 'next/image';
import LoadingModal from './loading-modal';
import { ClipboardDocumentIcon } from '@heroicons/react/24/outline';
import { QRCodeSVG } from 'qrcode.react';

const ReceiveCryptoComponent = ({ encryptedWallet }: EncryptedWalletProps) => {
    const router = useRouter();

    const searchParams = useSearchParams();

    // Hardcoded chains information, only support BSC Testnet for now
    const chains = [
        {
            name: 'BSC Testnet',
            chainId: '0x61',
            symbol: 'BNB',
            icon: '/images/bsc.png',
            rpc: process.env.NEXT_PUBLIC_BSC_TESTNET_RPC as string,
        },
    ];

    // State to store the selected chain (ethereum, mumbai, bscTestnet etc)
    // Currently, only BSC Testnet is supported
    const [selectedChain, setSelectedChain] = useState(chains[0]);
    const [walletAddress, setWalletAddress] = useState('');

    // State to store the loading status
    const [isLoading, setIsLoading] = useState(true);
    const [loadingMessage, setLoadingMessage] = useState(
        'Fetching wallet data...'
    );

    /**
     * Function to get the master password from the service worker and decrypt the wallet
     * @param encryptedWallet {string} the encrypted wallet
     * @returns
     */
    const decryptWallet = async (encryptedWallet: string) => {
        const masterPassword = await getMasterPassword();

        if (!masterPassword) {
            return null;
        }

        // Decrypt the wallet
        return Wallet.fromEncryptedJson(encryptedWallet, masterPassword);
    };

    /**
     * Function to check if the master password is set
     * If not, redirect to home page which will prompt the user to enter the master password
     */
    const getMasterPassword = async () => {
        const masterPasswordFromServiceWorker =
            await getMasterPasswordFromServiceWorker();
        if (!masterPasswordFromServiceWorker) {
            // Redirect to home if no master password is set
            router.push('/');
            return null;
        }

        return masterPasswordFromServiceWorker;
    };

    /**
     * Function to get the selected chain from the URL
     */
    const getSelectedChain = () => {
        // Get the chainId from the URL
        const chainId = searchParams.get('chainId');

        const chain = chains.find((chain) => chain.chainId === chainId);

        // Check if the chainId is valid
        if (!chainId || !chain) {
            // Redirect back to the web3 page if the chainId is invalid
            router.push('/web3');
            return;
        }

        setSelectedChain(chain);
    };

    /**
     * Function to copy the wallet address to the clipboard
     */
    const handleCopyToClipboard = () => {
        navigator.clipboard.writeText(walletAddress).then(
            () => {
                alert('Wallet address copied to clipboard!');
            },
            (error) => {
                console.error('Could not copy text: ', error);
            }
        );
    };

    /**
     * useEffect to check if the master password is set
     * If not, redirect to home page which will prompt the user to enter the master password
     */
    useEffect(() => {
        // check if master password is set
        getMasterPassword();

        // Get the selected chain from the URL
        getSelectedChain();
    }, []);

    useEffect(() => {
        // Decrypt the wallet to get the address
        const decryptWalletAndGetAddress = async () => {
            setIsLoading(true);
            // Assuming decryptWallet is a function that returns the wallet object
            const wallet = await decryptWallet(encryptedWallet);

            if (wallet?.address) {
                setWalletAddress(wallet?.address);
            }

            setIsLoading(false);
        };

        decryptWalletAndGetAddress();
    }, [encryptedWallet]);

    return (
        <>
            {isLoading ? (
                <LoadingModal messaage={loadingMessage} />
            ) : (
                <>
                    <div className='p-6 mx-auto bg-white rounded-xl shadow-md flex flex-col space-y-4 min-w-full items-center'>
                        <div className='text-center items-center'>
                            {/** The selected chain icon and name */}
                            <Image
                                className='mx-auto h-36 w-auto mb-6'
                                src={selectedChain.icon}
                                alt={selectedChain.name}
                                width={144}
                                height={144}
                            />
                            <h1 className='text-3xl font-bold tracking-tight text-gray-900'>
                                Receive token on {selectedChain.name}
                            </h1>
                        </div>

                        {/** QR code for the wallet address */}
                        <QRCodeSVG
                            value={walletAddress}
                            size={256}
                            level={'L'}
                            includeMargin={true}
                            imageSettings={{
                                src: selectedChain.icon,
                                x: undefined,
                                y: undefined,
                                height: 36,
                                width: 36,
                                excavate: true,
                            }}
                        />

                        {/** The wallet address */}
                        <div className='mt-4'>
                            <p className='text-lg text-center'>
                                Your wallet address
                            </p>
                            <div className='flex w-full mb-6 bg-white shadow-lg rounded-lg p-4'>
                                <p className='text-lg text-center'>
                                    {walletAddress}
                                </p>
                                <ClipboardDocumentIcon
                                    className='ml-3 h-5 w-5 text-gray-500 cursor-pointer'
                                    onClick={handleCopyToClipboard}
                                />
                            </div>
                        </div>

                        {/** Back button */}
                        <button
                            className='inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
                            onClick={() => {
                                router.push('/web3/crypto');
                            }}
                        >
                            Back
                        </button>
                    </div>
                </>
            )}
        </>
    );
};

export default ReceiveCryptoComponent;
