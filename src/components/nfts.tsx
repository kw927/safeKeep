'use client';
import React, { useEffect, useState } from 'react';
import { EncryptedWalletProps } from '@/types/Crypto';
import { Wallet } from 'ethers';
import { useRouter } from 'next/navigation';
import { getMasterPasswordFromServiceWorker } from '@/services/serviceWorkerUtils';
import Image from 'next/image';
import LoadingModal from './loading-modal';
import { NFTAttributes, DisplayNFT } from '@/types/Crypto';

const NFTsComponent = ({ encryptedWallet }: EncryptedWalletProps) => {
    const router = useRouter();

    // Hardcoded chains information, only support BSC Testnet for now
    const chains = [
        {
            name: 'BSC Testnet',
            chainId: '0x61',
            symbol: 'BNB',
            icon: '/images/bsc.png',
        },
    ];

    // State to store the selected chain (ethereum, mumbai, bscTestnet etc)
    // Currently, only BSC Testnet is supported
    const [selectedChain, setSelectedChain] = useState(chains[0]);
    const [nfts, setNFTs] = useState<DisplayNFT[]>([]);

    // State to store the loading status
    const [isLoading, setIsLoading] = useState(true);

    const getNFTs = async (chain: string, walletAddress: string) => {
        try {
            // Call the API only if it is defined in environment variables
            if (!process.env.NEXT_PUBLIC_MORALIS_API_KEY || !process.env.NEXT_PUBLIC_MORALIS_API_URL) {
                alert('Moralis API Key or URL is not defined');
                return;
            }

            // Prepare the query parameters
            const params = new URLSearchParams({
                chain,
            });

            const url = `${process.env.NEXT_PUBLIC_MORALIS_API_URL}${walletAddress}/nft?${params}`;

            // Call the balance API to get the token balance
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'X-API-Key': process.env.NEXT_PUBLIC_MORALIS_API_KEY,
                },
            });

            let data = await response.json();

            if (response.ok) {
                processNFTData(data.result);
            }
        } catch (error) {
            console.error('Error:', error);
        }
    };

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
     * Function to fetch the balance and transactions when chain is defined
     * @returns
     */
    const fetchNFTs = async () => {
        setIsLoading(true);

        // We will decrypt the wallet from the encrypted wallet every when we need to use it
        // This is to ensure that the wallet is not stored in the local storage and minimise the risk of being hacked
        const decryptedWallet = await decryptWallet(encryptedWallet);

        if (!decryptedWallet) {
            setIsLoading(false);
            alert('Error decrypting wallet');
            return;
        }

        // Get the NFTs
        await getNFTs(selectedChain.chainId, decryptedWallet.address);
        setIsLoading(false);
    };

    /**
     * Function to process the NFT data
     * @param nfts 
     */
    const processNFTData = (nfts: any) => {
        const processedNFTs: DisplayNFT[] = nfts.map((nft: any) => {
            const metadata = JSON.parse(nft.metadata);

            const attributes: NFTAttributes[] = metadata.attributes.map((attribute: any) => {
                return {
                    name: attribute.trait_type,
                    value: attribute.value,
                };
            });

            const truncatedDescription = (description: string) => {
                if (description.length > 100) {
                    return description.substring(0, 100) + '...';
                }
                return description;
            };

            return {
                name: metadata.name,
                description: metadata.description,
                shortDescription: truncatedDescription(metadata.description),
                image: metadata.image.replace('ipfs://', process.env.NEXT_PUBLIC_IPFS_GATEWAY),
                tokenId: nft.token_id,
                tokenAddress: nft.token_address,
                owner: nft.owner_of,
                contractType: nft.contract_type,
                symbol: nft.symbol,
                tokenUri: nft.token_uri,
                attributes,
            };
        });

        console.log('processedNFTs:', processedNFTs);
        setNFTs(processedNFTs);
    };

    /**
     * Function to check if the master password is set
     * If not, redirect to home page which will prompt the user to enter the master password
     */
    const getMasterPassword = async () => {
        const masterPasswordFromServiceWorker = await getMasterPasswordFromServiceWorker();
        if (!masterPasswordFromServiceWorker) {
            // Redirect to home if no master password is set
            router.push('/');
            return null;
        }

        return masterPasswordFromServiceWorker;
    };

    /**
     * useEffect to check if the master password is set
     * If not, redirect to home page which will prompt the user to enter the master password
     */
    useEffect(() => {
        // check if master password is set
        getMasterPassword();
    }, []);

    /**
     * useEffect to fetch the balance and transactions when chain is defined
     */
    useEffect(() => {
        fetchNFTs();
    }, [selectedChain]);

    return (
        <>
            {isLoading ? (
                <LoadingModal messaage='Fetching wallet data...' />
            ) : (
                <>
                    <div className='px-6 mx-autod flex flex-col space-y-4 min-w-full'>
                        <div className='flex items-center justify-center space-x-3 pb-4'>
                            {/* Chain icon */}
                            <Image className='h-16 w-16' src={selectedChain.icon} alt={selectedChain.name} width={64} height={64} />
                            {/* Chain name */}
                            <h1 className='text-3xl font-bold tracking-tight text-gray-900'>{selectedChain.name}</h1>
                        </div>

                        {/** NFTs */}
                        <div className='grid grid-cols-1 gap-y-4 sm:grid-cols-2 sm:gap-x-6 sm:gap-y-10 lg:grid-cols-3 lg:gap-x-8'>
                            {nfts.map((nft) => (
                                <div
                                    key={nft.tokenId}
                                    className='group relative flex flex-col overflow-hidden rounded-lg border border-gray-200 bg-white'
                                >
                                    <div className='aspect-h-4 aspect-w-3 bg-gray-200 sm:aspect-none group-hover:opacity-75 sm:h-96'>
                                        <img
                                            src={nft.image}
                                            alt={nft.name}
                                            className='h-full w-full object-cover object-center sm:h-full sm:w-full'
                                        />
                                    </div>
                                    <div className='flex flex-1 flex-col space-y-2 p-4'>
                                        <h3 className='text-lg font-medium text-gray-900'>
                                            <a href={`/web3/nft/${selectedChain.chainId}/${nft.tokenAddress}/${nft.tokenId}`}>
                                                <span aria-hidden='true' className='absolute inset-0' />
                                                {nft.name}
                                            </a>
                                        </h3>
                                        <p className='text-sm text-gray-500'>{nft.shortDescription}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </>
            )}
        </>
    );
};

export default NFTsComponent;
