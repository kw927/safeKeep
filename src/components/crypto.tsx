'use client'
import React, { useEffect, useState } from 'react';
import { EncryptedWalletProps, DisplayTransaction } from '@/types/Crypto';
import { Wallet, formatEther } from 'ethers';
import { useRouter } from 'next/navigation';
import { getMasterPasswordFromServiceWorker } from '@/services/serviceWorkerUtils';
import Image from 'next/image'
import { classNames } from '@/utils/pageUtils';
import LoadingModal from './loading-modal';

const CryptoComponent = ({ encryptedWallet }: EncryptedWalletProps) => {
    const router = useRouter();

    // Hardcoded chains information, only support BSC Testnet for now
    const chains = [
        { name: 'BSC Testnet', chainId: '0x61', symbol: 'BNB', icon: '/images/bsc.png' },
    ]

    // State to store the selected chain (ethereum, mumbai, bscTestnet etc)
    // Currently, only BSC Testnet is supported
    const [selectedChain, setSelectedChain] = useState(chains[0]);
    const [tokenBalance, setTokenBalance] = useState(0.0);
    const [transactions, setTransactions] = useState<DisplayTransaction[]>([]);

    // State to store the loading status
    const [isLoading, setIsLoading] = useState(true);

    /**
     * Function to get the token balances from the selected chain using the Moralis API
     * @param chain {string} the selected chain
     * @param walletAddress {string} the wallet address
     */
    const getTokenBalances = async (chain: string, walletAddress: string) => {
        try {
            // Call the API only if it is defined in environment variables
            if (!process.env.NEXT_PUBLIC_MORALIS_API_KEY || !process.env.NEXT_PUBLIC_MORALIS_API_URL) {
                alert('Moralis API Key or URL is not defined');
                return;
            }

            // Prepare the query parameters
            const params = new URLSearchParams({
                chain
            });

            const url = `${process.env.NEXT_PUBLIC_MORALIS_API_URL}${walletAddress}/balance?${params}`;

            // Call the balance API to get the token balance
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'X-API-Key': process.env.NEXT_PUBLIC_MORALIS_API_KEY,
                }
            });

            let data = await response.json();

            if (response.ok) {
                setTokenBalance(data.balance);
            }
        } catch (error) {
            console.error('Error:', error);
        }
    };

    /**
     * Function to get the transactions from the selected chain using the Moralis API
     * @param chain {string} the selected chain
     * @param walletAddress {string} the wallet address
     */
    const getTransactions = async (chain: string, walletAddress: string) => {
        try {
            // Call the API only if it is defined in environment variables
            if (!process.env.NEXT_PUBLIC_MORALIS_API_KEY || !process.env.NEXT_PUBLIC_MORALIS_API_URL) {
                alert('Moralis API Key or URL is not defined');
                return;
            }

            // Prepare the query parameters
            const params = new URLSearchParams({
                chain
            });

            const url = `${process.env.NEXT_PUBLIC_MORALIS_API_URL}${walletAddress}?${params}`;

            // Call the transactions API to get the transactions
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'X-API-Key': process.env.NEXT_PUBLIC_MORALIS_API_KEY,
                }
            });

            let data = await response.json();

            if (response.ok) {
                // Process the transactions to the required format for display
                processTransactions(data.result, walletAddress);
            }
        } catch (error) {
            console.error('Error:', error);
        }
    }

    /**
     * Function to process the transactions to the required format for display
     * @param transactions {any[]} the transactions returned from the API
     * @param walletAddress {string} the wallet address
     */
    const processTransactions = (transactions: any, walletAddress: string) => {
        // Variable to store the processed transactions
        const processedTransactions: DisplayTransaction[] = [];

        // Loop through the transactions and process them
        transactions.forEach((transaction: any) => {
            if (transaction.hash && transaction.block_timestamp && transaction.to_address && transaction.from_address) {
                // Check if the transaction is a send transaction
                const isSendTransaction = transaction.from_address.toLowerCase() === walletAddress.toLowerCase();

                // Add the processed transaction to the array
                processedTransactions.push({
                    hash: transaction.hash,
                    datetime: new Date(transaction.block_timestamp).toLocaleString(),
                    displayAddress: isSendTransaction ? transaction.to_address : transaction.from_address,
                    direction: isSendTransaction ? 'Send' : 'Receive',
                    value: formatEther(transaction.value),
                    valuePrefix: isSendTransaction ? '-' : '+',
                    valueColor: isSendTransaction ? 'text-red-500' : 'text-green-500',
                });
            }
        });

        // Set the transactions state only if there are transactions
        if (processedTransactions.length > 0) {
            setTransactions(processedTransactions);
        }
    }

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
    }

    /**
     * Function to fetch the balance and transactions when chain is defined
     * @returns 
     */
    const fetchBalanceAndTransactions = async () => {
        setIsLoading(true);

        // We will decrypt the wallet from the encrypted wallet every when we need to use it
        // This is to ensure that the wallet is not stored in the local storage and minimise the risk of being hacked
        const decryptedWallet = await decryptWallet(encryptedWallet);

        if (!decryptedWallet) {
            setIsLoading(false);
            alert('Error decrypting wallet');
            return;
        }

        // Get the token balances and transactions
        await getTokenBalances(selectedChain.chainId, decryptedWallet.address);
        await getTransactions(selectedChain.chainId, decryptedWallet.address);
        setIsLoading(false);
    }

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
        fetchBalanceAndTransactions();
    }, [selectedChain]);

    return (
        <>
            {isLoading ? <LoadingModal messaage='Fetching wallet data...' /> :
                (
                    <>
                        <div className="p-6 mx-auto bg-white rounded-xl shadow-md flex flex-col space-y-4 min-w-full">
                            <div className="text-center">
                                {/** The selected chain icon and name */}
                                <Image
                                    className="mx-auto h-36 w-auto mb-6"
                                    src={selectedChain.icon}
                                    alt={selectedChain.name}
                                    width={144}
                                    height={144}
                                />
                                <h1 className="text-3xl font-bold tracking-tight text-gray-900">{selectedChain.name}</h1>

                                {/** The wallet balance of selected chain */}
                                <div className="mt-5">
                                    <p className="text-3xl tracking-tight text-gray-900">{formatEther(tokenBalance)} {selectedChain.symbol}</p>
                                </div>
                            </div>

                            {/** Send and receive token buttons */}
                            <div className="flex justify-center items-center gap-4 p-5">
                                <button
                                    className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                    onClick={() => { router.push(`/web3/crypto/send?chainId=${selectedChain.chainId}`) }}
                                >
                                    Send Token
                                </button>
                                <button
                                    className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                    onClick={() => { router.push(`/web3/crypto/receive?chainId=${selectedChain.chainId}`) }}
                                >
                                    Receive Token
                                </button>
                            </div>

                            {/** The transactions table */}
                            <div className="mt-8 flow-root">
                                <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                                    <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                                        <table className="min-w-full divide-y divide-gray-300">
                                            <thead>
                                                <tr>
                                                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-0">
                                                        Datetime
                                                    </th>
                                                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                                        Address
                                                    </th>
                                                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                                        Send/Receive
                                                    </th>
                                                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                                        Amount
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-200">
                                                {/** Only show the first 10 transactions for now, It should support pagination for more transactions in the future */}
                                                {transactions.slice(0, 10).map((tx, index) => (
                                                    <tr key={tx.hash}>
                                                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-0">
                                                            {tx.datetime}
                                                        </td>
                                                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{tx.displayAddress}</td>
                                                        <td className={classNames('whitespace-nowrap px-3 py-4 text-sm', tx.valueColor)}>{tx.direction}</td>
                                                        <td className={classNames('whitespace-nowrap px-3 py-4 text-sm', tx.valueColor)}>{tx.valuePrefix} {tx.value} {selectedChain.symbol}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                )
            }
        </>
    );
};

export default CryptoComponent;
