'use client';
import React, { useEffect, useState } from 'react';
import { getMasterPasswordFromServiceWorker } from '@/services/serviceWorkerUtils';
import LoadingModal from './loading-modal';
import { NFTAttributes, DisplayNFT } from '@/types/Crypto';
import { useRouter } from 'next/navigation';
import { NFTProps } from '@/types/Crypto';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

const NFTComponent = ({ chainId, tokenAddress, tokenId }: NFTProps) => {
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
    const [nft, setNFT] = useState<DisplayNFT>();

    // State to store the loading status
    const [isLoading, setIsLoading] = useState(true);

    /**
     * Function to get the selected chain from the URL
     */
    const getSelectedChain = () => {
        // Get the chain from the chainId
        const chain = chains.find((chain) => chain.chainId === chainId);

        // Check if the chainId is valid
        if (!chainId || !chain) {
            // Redirect back to the web3 page if the chainId is invalid
            router.push('/web3');
            return;
        }

        setSelectedChain(chain);
    };

    const getNFT = async (chain: string) => {
        try {
            if (!tokenAddress || !tokenId) {
                alert('Token address or token id is not defined');
                return;
            }

            // Call the API only if it is defined in environment variables
            if (!process.env.NEXT_PUBLIC_MORALIS_API_KEY || !process.env.NEXT_PUBLIC_MORALIS_API_URL) {
                alert('Moralis API Key or URL is not defined');
                return;
            }

            // Prepare the query parameters
            const params = new URLSearchParams({
                chain,
            });

            const url = `${process.env.NEXT_PUBLIC_MORALIS_API_URL}/nft/${tokenAddress}/${tokenId}?${params}`;

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
                processNFTData(data);
            }
        } catch (error) {
            console.error('Error:', error);
        }
    };

    /**
     * Function to fetch the balance and transactions when chain is defined
     * @returns
     */
    const fetchNFT = async () => {
        setIsLoading(true);

        // Get the NFTs
        await getNFT(selectedChain.chainId);
        setIsLoading(false);
    };

    const processNFTData = (nft: any) => {
        const metadata = JSON.parse(nft.metadata);

        const attributes: NFTAttributes[] = metadata.attributes.map((attribute: any) => {
            return {
                name: attribute.trait_type,
                value: attribute.value,
            };
        });

        const processedNFT: DisplayNFT = {
            name: metadata.name,
            description: metadata.description,
            shortDescription: metadata.description,
            image: metadata.image.replace('ipfs://', process.env.NEXT_PUBLIC_IPFS_GATEWAY),
            tokenId: nft.token_id,
            tokenAddress: nft.token_address,
            owner: nft.owner_of,
            contractType: nft.contract_type,
            symbol: nft.symbol,
            tokenUri: nft.token_uri,
            attributes,
        };

        setNFT(processedNFT);
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

        getSelectedChain();
    }, []);

    /**
     * useEffect to fetch the balance and transactions when chain is defined
     */
    useEffect(() => {
        fetchNFT();
    }, [selectedChain]);

    return (
        <>
            {isLoading ? (
                <LoadingModal messaage='Fetching wallet data...' />
            ) : (
                <>
                    <div className='px-6 mx-autod flex flex-col space-y-4 min-w-full'>
                        {/* Back Button */}
                        <button
                            onClick={() => router.push('/web3/nft')}
                            className='flex items-center space-x-2 mb-4 text-sm font-medium text-gray-900'
                        >
                            <ArrowLeftIcon className='h-5 w-5' aria-hidden='true' />
                            <span>Back</span>
                        </button>

                        {/** NFT detail */}
                        {nft && (
                            <div className='mx-auto mt-8 max-w-2xl px-4 sm:px-6 lg:max-w-7xl lg:px-8'>
                                <div className='lg:grid lg:auto-rows-min lg:grid-cols-12 lg:gap-x-8'>
                                    <div className='lg:col-span-5 lg:col-start-8'>
                                        <div className='flex justify-between'>
                                            <h1 className='text-xl font-medium text-gray-900'>{nft.name}</h1>
                                        </div>
                                    </div>

                                    {/* Image  */}
                                    <div className='mt-8 lg:col-span-7 lg:col-start-1 lg:row-span-3 lg:row-start-1 lg:mt-0'>
                                        <h2 className='sr-only'>Images</h2>

                                        <div className='grid grid-cols-1 lg:grid-cols-2 lg:grid-rows-3 lg:gap-8'>
                                            <img
                                                key={nft?.tokenId}
                                                src={nft?.image}
                                                alt={nft?.name}
                                                className='lg:col-span-2 lg:row-span-2 rounded-lg'
                                            />
                                        </div>
                                    </div>

                                    {/* NFT details */}
                                    <div className='lg:col-span-5'>
                                        {/* Description */}
                                        <div className='mt-5'>
                                            <h2 className='text-sm font-medium text-gray-900'>Description</h2>

                                            <p className='prose prose-sm mt-4 text-gray-500'>{nft.description}</p>
                                        </div>

                                        {/* Token address */}
                                        <div className='mt-6 border-t border-gray-200 pt-6'>
                                            <h2 className='text-sm font-medium text-gray-900'>Blockchain Network</h2>

                                            <p className='prose prose-sm mt-2 text-gray-500'>{selectedChain.name}</p>
                                        </div>

                                        {/* Token address */}
                                        <div className='mt-4 pt-4'>
                                            <h2 className='text-sm font-medium text-gray-900'>Token Address</h2>

                                            <p className='prose prose-sm mt-2 text-gray-500'>{nft.tokenAddress}</p>
                                        </div>

                                        {/* Token ID */}
                                        <div className='mt-4 pt-4'>
                                            <h2 className='text-sm font-medium text-gray-900'>Token ID</h2>

                                            <p className='prose prose-sm mt-2 text-gray-500'>{nft.tokenId}</p>
                                        </div>

                                        {/* Owner */}
                                        <div className='mt-4 pt-4'>
                                            <h2 className='text-sm font-medium text-gray-900'>Owner</h2>

                                            <p className='prose prose-sm mt-2 text-gray-500'>{nft.owner}</p>
                                        </div>

                                        {/* Contract Type */}
                                        <div className='mt-4 pt-4'>
                                            <h2 className='text-sm font-medium text-gray-900'>Contract Type</h2>

                                            <p className='prose prose-sm mt-2 text-gray-500'>{nft.contractType}</p>
                                        </div>

                                        {/* Symbol */}
                                        <div className='mt-4 pt-4'>
                                            <h2 className='text-sm font-medium text-gray-900'>Symbol</h2>

                                            <p className='prose prose-sm mt-2 text-gray-500'>{nft.symbol}</p>
                                        </div>

                                        {/* Symbol */}
                                        <div className='mt-4 pt-4'>
                                            <h2 className='text-sm font-medium text-gray-900'>Metadata</h2>
                                            <a href={nft.tokenUri} target='_blank'>
                                                <p className='prose prose-sm mt-2 text-blue-600'>Veiw on IPFS</p>
                                            </a>
                                        </div>

                                        {/* attributes */}
                                        <section className='mt-8 border-t border-gray-200 pt-8'>
                                            <dl className='grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2'>
                                                {nft.attributes.map((attribute) => (
                                                    <div
                                                        key={attribute.name}
                                                        className='rounded-lg border border-gray-200 bg-gray-50 p-6 text-center'
                                                    >
                                                        <dt>
                                                            <span className='mt-4 text-sm font-medium text-gray-900'>{attribute.name}</span>
                                                        </dt>
                                                        <dd className='mt-1 text-sm text-gray-500'>{attribute.value}</dd>
                                                    </div>
                                                ))}
                                            </dl>
                                        </section>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </>
            )}
        </>
    );
};

export default NFTComponent;