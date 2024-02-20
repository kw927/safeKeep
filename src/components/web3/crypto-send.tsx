/**
 * Component to send token on the selected chain
 * @param encryptedWallet {string} the encrypted wallet
 */
'use client';
import React, { useEffect, useState } from 'react';
import { EncryptedWalletProps } from '@/types/Crypto';
import { Wallet, formatEther, isAddress, parseEther, JsonRpcProvider } from 'ethers';
import { useRouter, useSearchParams } from 'next/navigation';
import { getMasterPasswordFromServiceWorker } from '@/services/serviceWorkerUtils';
import Image from 'next/image';
import LoadingModal from '@/components/common/loading-modal';
import AlertDialog from '@/components/common/alert-dialog';
import { useAlertDialog } from '@/components/hook/use-alert-dialog';

// Enum for send token step
enum Step {
    DisplaySendForm,
    ConfirmSend,
}

// Function to render the send token step
const SendTokenStep = ({ step, current, children }: { step: Step; current: Step; children: JSX.Element }) => {
    return step === current ? children : null;
};

const SendCryptoComponent = ({ encryptedWallet }: EncryptedWalletProps) => {
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

    // State to store the current step
    const [currentStep, setCurrentStep] = useState(Step.DisplaySendForm);

    // State to store the selected chain (ethereum, mumbai, bscTestnet etc)
    // Currently, only BSC Testnet is supported
    const [selectedChain, setSelectedChain] = useState(chains[0]);
    const [tokenBalance, setTokenBalance] = useState(0.0);
    const [recipientAddress, setRecipientAddress] = useState('');
    const [isAddressValid, setIsAddressValid] = useState(false);
    const [amountToSend, setAmountToSend] = useState('');
    const [gasPrice, setGasPrice] = useState('');

    // State to store the loading status
    const [isLoading, setIsLoading] = useState(true);
    const [loadingMessage, setLoadingMessage] = useState('Fetching wallet data...');

    // State to manage the alert dialog
    const { isDialogVisible, alertDialog, showDialog } = useAlertDialog();

    /**
     * Function to get the token balances from the selected chain using the Moralis API
     * @param chain {string} the selected chain
     * @param walletAddress {string} the wallet address
     */
    const getTokenBalances = async (chain: string, walletAddress: string) => {
        try {
            // Call the API only if it is defined in environment variables
            if (!process.env.NEXT_PUBLIC_MORALIS_API_KEY || !process.env.NEXT_PUBLIC_MORALIS_API_URL) {
                showDialog(true, {
                    type: 'error',
                    title: 'Error',
                    message: 'Moralis API Key or URL is not defined',
                    buttonText: 'OK',
                    onButtonClick: () => showDialog(false),
                });

                return;
            }

            // Prepare the query parameters
            const params = new URLSearchParams({
                chain,
            });

            const url = `${process.env.NEXT_PUBLIC_MORALIS_API_URL}${walletAddress}/balance?${params}`;

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
                setTokenBalance(data.balance);
            }
        } catch (error) {
            showDialog(true, {
                type: 'error',
                title: 'Error',
                message: 'Failed to get token balance',
                buttonText: 'OK',
                onButtonClick: () => showDialog(false),
            });
        }
    };

    /**
     * Function to get the master password from the service worker and decrypt the wallet
     * @param encryptedWallet {string} the encrypted wallet
     * @returns
     */
    const decryptWallet = async (encryptedWallet: string) => {
        // Get the master password from the service worker
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
    const fetchBalance = async () => {
        setLoadingMessage('Fetching wallet data...');
        setIsLoading(true);

        // We will decrypt the wallet from the encrypted wallet every when we need to use it
        // This is to ensure that the wallet is not stored in the local storage and minimise the risk of being hacked
        const decryptedWallet = await decryptWallet(encryptedWallet);

        if (!decryptedWallet) {
            setIsLoading(false);

            showDialog(true, {
                type: 'error',
                title: 'Error',
                message: 'Error decrypting wallet',
                buttonText: 'OK',
                onButtonClick: () => showDialog(false),
            });

            return;
        }

        // Get the token balances and transactions
        await getTokenBalances(selectedChain.chainId, decryptedWallet.address);
        setIsLoading(false);
    };

    /**
     * Function to handle the recipient address change
     * @param e {React.ChangeEvent<HTMLInputElement>} the input change event
     */
    const handleRecipientAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const address = e.target.value;
        setRecipientAddress(address);
        setIsAddressValid(isAddress(address));
    };

    /**
     * Function to handle the amount to send change
     * @param e {React.ChangeEvent<HTMLInputElement>} the input change event
     */
    const handleAmountToSendChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setAmountToSend(e.target.value);
    };

    /**
     * Function to handle the send token click
     */
    const handleSend = async () => {
        const errors: string[] = [];

        // Check if the recipient address is valid
        if (!isAddress(recipientAddress)) {
            errors.push('Please enter a valid recipient address');
        }

        // Check if the amount to send is valid
        try {
            const amount = parseFloat(amountToSend);
            if (isNaN(amount) || amount <= 0) {
                errors.push('Please enter a valid amount to send');
            }
        } catch (error) {
            errors.push('Please enter a valid amount to send');
        }

        // Check if the amount to send is valid
        if (parseFloat(amountToSend) <= 0) {
            errors.push('Please enter a valid amount to send');
        }

        // Check if the amount to send is greater than the token balance
        if (parseFloat(amountToSend) > parseFloat(formatEther(tokenBalance))) {
            errors.push('Insufficient balance');
        }

        // Show the error message if there are any errors
        if (errors.length > 0) {
            showDialog(true, {
                type: 'error',
                title: 'Error',
                message: errors[0],
                buttonText: 'OK',
                onButtonClick: () => showDialog(false),
            });

            return;
        }

        // Get the decrypted wallet
        // We will decrypt the wallet from the encrypted wallet every when we need to use it
        // This is to ensure that the wallet is not stored in the local storage and minimise the risk of being hacked
        const decryptedWallet = await decryptWallet(encryptedWallet);

        if (!decryptedWallet) {
            showDialog(true, {
                type: 'error',
                title: 'Error',
                message: 'Error decrypting wallet',
                buttonText: 'OK',
                onButtonClick: () => showDialog(false),
            });

            // Need to return here, otherwise TypeScript will show an error for the next line
            return;
        }

        // Check if the token is sending to the user itself
        if (recipientAddress === decryptedWallet.address) {
            showDialog(true, {
                type: 'error',
                title: 'Error',
                message: 'You cannot send token to yourself',
                buttonText: 'OK',
                onButtonClick: () => showDialog(false),
            });

            return;
        }

        // Calculate the gas fee
        setLoadingMessage('Calculating gas fee...');
        setIsLoading(true);

        // Get the gas price
        const gasPrice = await getGasPrice();

        if (!gasPrice) {
            setIsLoading(false);

            showDialog(true, {
                type: 'error',
                title: 'Error',
                message: 'Failed to get gas price',
                buttonText: 'OK',
                onButtonClick: () => showDialog(false),
            });

            return;
        }

        // Check if the user has enough balance to pay for the gas fee
        if (parseFloat(amountToSend) + parseFloat(gasPrice) > parseFloat(formatEther(tokenBalance))) {
            showDialog(true, {
                type: 'error',
                title: 'Error',
                message: 'Insufficient balance to pay for the gas fee',
                buttonText: 'OK',
                onButtonClick: () => showDialog(false),
            });

            return;
        }

        setIsLoading(false);

        // Everything is valid, proceed to the next step to confirm the transaction
        setCurrentStep(Step.ConfirmSend);
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
     * Function to get the selected chain from the URL
     * @returns
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
     * Function to get the gas price for the transaction using ethers.js
     * @returns {Promise<string | null>} the gas price
     */
    const getGasPrice = async () => {
        try {
            // Get the decrypted wallet
            // We will decrypt the wallet from the encrypted wallet every when we need to use it
            // This is to ensure that the wallet is not stored in the local storage and minimise the risk of being hacked
            const decryptedWallet = await decryptWallet(encryptedWallet);

            if (!decryptedWallet) {
                showDialog(true, {
                    type: 'error',
                    title: 'Error',
                    message: 'Error decrypting wallet',
                    buttonText: 'OK',
                    onButtonClick: () => showDialog(false),
                });

                return null;
            }

            // Set the transaction details
            const transaction = {
                from: decryptedWallet.address,
                to: recipientAddress,
                value: parseEther(amountToSend.toString()),
            };

            // Create a new provider
            const provider = new JsonRpcProvider(selectedChain.rpc);

            // Get the fee data
            const feeData = await provider.getFeeData();

            if (!feeData || !feeData.gasPrice) {
                showDialog(true, {
                    type: 'error',
                    title: 'Error',
                    message: 'Failed to get fee data',
                    buttonText: 'OK',
                    onButtonClick: () => showDialog(false),
                });

                return null;
            }

            // Get the gas price
            const gasPrice = await provider.estimateGas(transaction);

            // Calculate the gas price for the transaction
            const calculatedGasPrice = formatEther(gasPrice * feeData.gasPrice);

            setGasPrice(calculatedGasPrice);

            return calculatedGasPrice;
        } catch (error) {
            showDialog(true, {
                type: 'error',
                title: 'Error',
                message: 'Failed to get gas price',
                buttonText: 'OK',
                onButtonClick: () => showDialog(false),
            });
        }
    };

    /**
     * Function to confirm the send token transaction
     */
    const confirmSend = async () => {
        setLoadingMessage('Sending token...');
        setIsLoading(true);

        // Get the decrypted wallet
        // We will decrypt the wallet from the encrypted wallet every when we need to use it
        // This is to ensure that the wallet is not stored in the local storage and minimise the risk of being hacked
        const decryptedWallet = await decryptWallet(encryptedWallet);

        if (!decryptedWallet) {
            setIsLoading(false);

            showDialog(true, {
                type: 'error',
                title: 'Error',
                message: 'Error decrypting wallet',
                buttonText: 'OK',
                onButtonClick: () => showDialog(false),
            });

            return;
        }

        // Set the transaction details
        const transaction = {
            from: decryptedWallet.address,
            to: recipientAddress,
            value: parseEther(amountToSend.toString()),
        };

        // Sign the transaction
        const signer = decryptedWallet.connect(new JsonRpcProvider(selectedChain.rpc));

        const signedTransaction = await signer.sendTransaction(transaction);

        // Check if the transaction is successful
        // The signed transaction will contain the transaction hash if it is successful
        if (signedTransaction.hash) {
            showDialog(true, {
                type: 'success',
                title: 'Success',
                message: 'Token has been sent successfully',
                buttonText: 'OK',
                onButtonClick: () => {
                    showDialog(false);
                    router.push('/web3/crypto');
                },
            });
        } else {
            showDialog(true, {
                type: 'error',
                title: 'Error',
                message: 'Transaction failed',
                buttonText: 'OK',
                onButtonClick: () => showDialog(false),
            });
        }
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

    /**
     * useEffect to fetch the balance and transactions when chain is defined
     */
    useEffect(() => {
        fetchBalance();
    }, [selectedChain]);

    return (
        <>
            {isLoading ? (
                <LoadingModal messaage={loadingMessage} />
            ) : (
                <>
                    {/* Render the send token step */}
                    <SendTokenStep step={Step.DisplaySendForm} current={currentStep}>
                        <div className='p-6 mx-auto bg-white rounded-xl shadow-md flex flex-col space-y-4 min-w-full items-center'>
                            <div className='text-center'>
                                {/* The selected chain icon and name */}
                                <Image
                                    className='mx-auto h-36 w-auto mb-6'
                                    src={selectedChain.icon}
                                    alt={selectedChain.name}
                                    width={144}
                                    height={144}
                                />
                                <h1 className='text-3xl font-bold tracking-tight text-gray-900'>Send token on {selectedChain.name}</h1>
                            </div>

                            {/* Recipient Address Input */}
                            <input
                                type='text'
                                value={recipientAddress}
                                onChange={handleRecipientAddressChange}
                                placeholder="Recipient's Wallet Address"
                                className='mt-1 block w-6/12 px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm'
                            />

                            {/* Only render the amount to send input if the address is valid */}
                            {isAddressValid && (
                                <>
                                    <input
                                        type='text'
                                        value={amountToSend}
                                        onChange={handleAmountToSendChange}
                                        placeholder='Amount to Send'
                                        className='mt-1 block w-6/12 px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm'
                                    />

                                    <p className='text-sm text-gray-500'>
                                        Available Balance: {formatEther(tokenBalance)} {selectedChain.symbol}
                                    </p>

                                    <button
                                        className='inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
                                        onClick={handleSend}
                                    >
                                        Send Token
                                    </button>
                                </>
                            )}
                        </div>
                    </SendTokenStep>

                    {/* Render the confirm send token step */}
                    <SendTokenStep step={Step.ConfirmSend} current={currentStep}>
                        <div className='p-6 mx-auto bg-white rounded-xl shadow-md flex flex-col space-y-4 min-w-full items-center'>
                            <div className='text-center'>
                                {/* The selected chain icon and name */}
                                <Image
                                    className='mx-auto h-36 w-auto mb-6'
                                    src={selectedChain.icon}
                                    alt={selectedChain.name}
                                    width={144}
                                    height={144}
                                />

                                {/* Transaction details */}
                                <h1 className='text-3xl font-bold tracking-tight text-gray-900'>Confirm send token on {selectedChain.name}</h1>
                                <div className='mt-4'>
                                    <p>
                                        <strong>Recipient Address:</strong> {recipientAddress}
                                    </p>
                                    <p>
                                        <strong>Amount to Send:</strong> {amountToSend} {selectedChain.symbol}
                                    </p>
                                    <p>
                                        <strong>Gas Price:</strong> {gasPrice} ETH
                                    </p>
                                </div>
                            </div>

                            {/* Send and Cancel buttons */}
                            <div className='flex justify-center items-center gap-4 p-5'>
                                <button
                                    className='inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500'
                                    onClick={confirmSend}
                                >
                                    Send
                                </button>
                                <button
                                    className='inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
                                    onClick={() => {
                                        router.push('/web3/crypto');
                                    }}
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </SendTokenStep>
                </>
            )}

            {/* Alert Dialog */}
            <AlertDialog open={isDialogVisible} setOpen={(show) => showDialog(show)} {...alertDialog} />
        </>
    );
};

export default SendCryptoComponent;
