/**
 * Web3WalletSteps component to create or import a wallet
 * This is a client component and all the code is executed on the client side
 */
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ethers, Mnemonic } from 'ethers';
import { getMasterPasswordFromServiceWorker } from '@/services/serviceWorkerUtils';
import AlertDialog from '@/components/common/alert-dialog';
import { useAlertDialog } from '@/components/hook/use-alert-dialog';

// Enum for wallet setup steps
enum Step {
    WalletOtpoins,
    DisplayWalletPhrase,
    VerifyNewWallet,
    ImportWallet,
}

// Function to render the setup step
const SetupStep = ({ step, current, children }: { step: Step; current: Step; children: JSX.Element }) => {
    return step === current ? children : null;
};

const Web3WalletSetps = () => {
    // State to store the current step
    const [currentStep, setCurrentStep] = useState(Step.WalletOtpoins);

    // State to store the wallet of the user
    const [wallet, setWallet] = useState<ethers.HDNodeWallet>();

    // State to store the mnemonic phrase entered by the user when importing a wallet
    const [mnemonic, setMnemonic] = useState<string>('');

    // States for the wallet verification step
    const [shuffledWords, setShuffledWords] = useState<string[]>([]);
    const [selectedFirst, setSelectedFirst] = useState('');
    const [selectedLast, setSelectedLast] = useState('');

    // State to manage the alert dialog
    const { isDialogVisible, alertDialog, showDialog } = useAlertDialog();

    // The router object for redirecting the user to different pages
    const router = useRouter();

    /**
     * Function to check if the master password is set
     * If not, redirect to home page which will prompt the user to enter the master password
     */
    useEffect(() => {
        // check if master password is set
        const checkMasterPassword = async () => {
            const masterPasswordFromServiceWorker = await getMasterPasswordFromServiceWorker();
            if (!masterPasswordFromServiceWorker) {
                // Redirect to home if no master password is set
                router.push('/');
            }
        };

        checkMasterPassword();
    }, []);

    /**
     * Function to call the API to create a new wallet
     */
    const createNewWallet = async () => {
        try {
            // Generate a new wallet using ethers.js
            const newWallet = ethers.Wallet.createRandom();

            setWallet(newWallet);
            setCurrentStep(Step.DisplayWalletPhrase);
        } catch (error) {
            showDialog(true, {
                type: 'error',
                title: 'Error',
                message: 'Failed to create a new wallet. Please try again.',
                buttonText: 'OK',
                onButtonClick: () => showDialog(false),
            });
        }
    };

    /**
     * Function for DisplayWalletPhrase step to copy the wallet phrase to clipboard
     */
    const copyToClipboard = async () => {
        if (wallet?.mnemonic?.phrase) {
            {
                await navigator.clipboard.writeText(wallet.mnemonic.phrase);

                showDialog(true, {
                    type: 'success',
                    title: 'Success',
                    message: 'Wallet phrase copied to clipboard!',
                    buttonText: 'OK',
                    onButtonClick: () => showDialog(false),
                });
            }
        }
    };

    /**
     * Function for DisplayWalletPhrase step to shuffle the wallet phrase for verification
     */
    const processToVerify = () => {
        if (wallet?.mnemonic?.phrase) {
            // Suffule the words of the phrase for verification
            const shuffled = [...wallet.mnemonic.phrase.split(' ')].sort(() => 0.5 - Math.random());

            setShuffledWords(shuffled);
            setCurrentStep(Step.VerifyNewWallet);
        }
    };

    /**
     * Function for VerifyNewWallet step to verify the selected words
     * @returns
     */
    const verifySelectedWords = async () => {
        // Check if the wallet is generated
        if (!wallet?.mnemonic?.phrase) {
            showDialog(true, {
                type: 'error',
                title: 'Error',
                message: 'Failed to verify wallet phrase. Please try again.',
                buttonText: 'OK',
                onButtonClick: () => showDialog(false),
            });

            return;
        }

        // Split the phrase into words
        const phraseWords = wallet.mnemonic.phrase.split(' ');

        // Check if the selected words are the first and last words of the phrase
        if (selectedFirst === phraseWords[0] && selectedLast === phraseWords[phraseWords.length - 1]) {
            // Verification successful, encrypt the wallet and save it to the backend
            const encryptedWallet = await encryptWallet(wallet);

            if (!encryptedWallet) {
                showDialog(true, {
                    type: 'error',
                    title: 'Error',
                    message: 'Failed to encrypt wallet. Please try again.',
                    buttonText: 'OK',
                    onButtonClick: () => showDialog(false),
                });

                return;
            }

            const saveWalletResult = await saveWalletToBackend('Default Wallet', encryptedWallet);

            if (!saveWalletResult) {
                showDialog(true, {
                    type: 'error',
                    title: 'Error',
                    message: 'Failed to save wallet. Please try again.',
                    buttonText: 'OK',
                    onButtonClick: () => showDialog(false),
                });

                return;
            }

            // Clear the states before redirecting to the crypto page for security reasons
            setSelectedFirst('');
            setSelectedLast('');
            setShuffledWords([]);
            setWallet(undefined);

            router.push('/web3/crypto');
        } else {
            showDialog(true, {
                type: 'error',
                title: 'Error',
                message: 'Failed to verify wallet phrase. Please try again.',
                buttonText: 'OK',
                onButtonClick: () => showDialog(false),
            });

            // Clear the selected words when verification fails
            setSelectedFirst('');
            setSelectedLast('');
        }
    };

    /**
     * Function to encrypt the wallet using the master password saved in the service worker
     * @param walletToEncrypt {ethers.HDNodeWallet} The wallet to encrypt
     */
    const encryptWallet = async (walletToEncrypt: ethers.HDNodeWallet) => {
        try {
            const masterPasswordFromServiceWorker = await getMasterPasswordFromServiceWorker();

            const encryptedWallet = await walletToEncrypt.encrypt(masterPasswordFromServiceWorker);

            return encryptedWallet;
        } catch (error) {
            showDialog(true, {
                type: 'error',
                title: 'Error',
                message: 'Failed to encrypt wallet.',
                buttonText: 'OK',
                onButtonClick: () => showDialog(false),
            });

            return null;
        }
    };

    /**
     * Function to call the API to save the wallet to the backend
     * @param walletName {string} The name of the wallet
     * @param encryptedWallet {string} The encrypted wallet data
     * @returns  {Promise<boolean>} True if the wallet is saved successfully, false otherwise
     */
    const saveWalletToBackend = async (walletName: string, encryptedWallet: string) => {
        try {
            // Call the save wallet API to save the wallet to the backend
            const response = await fetch('/api/user/wallet', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ walletName, encryptedWallet }),
            });

            if (response.ok) {
                return true;
            }

            return false;
        } catch (error) {
            return false;
        }
    };

    /**
     * Function to import a wallet from the mnemonic phrase
     * @returns
     */
    const importFromMnemonic = async () => {
        // Validate the recovery phrase using ethers.js
        if (!Mnemonic.isValidMnemonic(mnemonic)) {
            showDialog(true, {
                type: 'error',
                title: 'Error',
                message: 'Please enter a valid 12-word recovery phrase.',
                buttonText: 'OK',
                onButtonClick: () => showDialog(false),
            });

            return;
        }

        // Import the wallet from the mnemonic phrase using ethers.js
        try {
            const importedWallet = ethers.Wallet.fromPhrase(mnemonic);

            if (!importedWallet) {
                showDialog(true, {
                    type: 'error',
                    title: 'Error',
                    message: 'Failed to import wallet. Please check your recovery phrase and try againn.',
                    buttonText: 'OK',
                    onButtonClick: () => showDialog(false),
                });

                return;
            }

            // Encrypt the wallet
            const encryptedWallet = await encryptWallet(importedWallet);

            if (!encryptedWallet) {
                showDialog(true, {
                    type: 'error',
                    title: 'Error',
                    message: 'Failed to encrypt wallet. Please try again.',
                    buttonText: 'OK',
                    onButtonClick: () => showDialog(false),
                });

                return;
            }

            // Save the wallet to the backend
            const saveWalletResult = await saveWalletToBackend('Default Wallet', encryptedWallet);

            if (!saveWalletResult) {
                showDialog(true, {
                    type: 'error',
                    title: 'Error',
                    message: 'Failed to save wallet. Please try again.',
                    buttonText: 'OK',
                    onButtonClick: () => showDialog(false),
                });

                return;
            }

            // Clear the states before redirecting to the crypto page for security reasons
            setMnemonic('');
            setWallet(undefined);

            // Redirect to the crypto page
            router.push('/web3/crypto');
        } catch (error) {
            showDialog(true, {
                type: 'error',
                title: 'Error',
                message: 'Failed to import wallet. Please check your recovery phrase and try again.',
                buttonText: 'OK',
                onButtonClick: () => showDialog(false),
            });
        }
    };

    return (
        <>
            {/* Wallet setup options */}
            <SetupStep step={Step.WalletOtpoins} current={currentStep}>
                <div className='space-y-4 text-center'>
                    {/* Title and description */}
                    <h1 className='text-xl font-semibold text-gray-900'>Create or import a wallet</h1>
                    <p className='text-sm text-gray-500'>Choose to create a new wallet or import your existing one.</p>

                    {/* Buttons to create or import a wallet */}
                    <div className='flex gap-4'>
                        <button
                            className='inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
                            onClick={createNewWallet}
                        >
                            Create New Wallet
                        </button>
                        <button
                            className='inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
                            onClick={() => setCurrentStep(Step.ImportWallet)}
                        >
                            I Already Have a Wallet
                        </button>
                    </div>
                </div>
            </SetupStep>

            {/* Display wallet phrase */}
            <SetupStep step={Step.DisplayWalletPhrase} current={currentStep}>
                <>
                    <div className='space-y-4 text-center'>
                        {/* Title */}
                        <h1 className='text-xl font-semibold text-gray-900'>Your Wallet Phrase</h1>

                        <div className='flex flex-col items-center w-full px-6'>
                            {/* Wallet phrase */}
                            <div className='w-full mb-6 bg-white shadow-lg rounded-lg p-4'>
                                <p className='text-lg text-center'>{wallet?.mnemonic?.phrase}</p>
                            </div>

                            <p className='text-md text-gray-600 mb-6 text-center'>Please make sure you've saved this phrase somewhere safe!</p>

                            {/* Copy to clipboard buttons */}
                            <button
                                className='mb-3 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2'
                                onClick={copyToClipboard}
                            >
                                Copy to Clipboard
                            </button>

                            {/* Process to verify button */}
                            <button
                                className='px-4 border border-indigo-600 text-indigo-600 py-2 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2'
                                onClick={processToVerify}
                            >
                                I've backed it up, continue
                            </button>
                        </div>
                    </div>
                </>
            </SetupStep>

            {/* Verify new wallet */}
            <SetupStep step={Step.VerifyNewWallet} current={currentStep}>
                <>
                    <div className='space-y-4 text-center'>
                        {/* Title and description */}
                        <h1 className='text-xl font-semibold text-gray-900'>Verify Wallet Phrase</h1>
                        <p className='text-md text-gray-600 mb-6 text-center'>Please select the first and last words from your phrase.</p>

                        {/* Display the shuffled word as options to select the first and last words */}
                        <div className='flex flex-wrap justify-center items-center mb-4'>
                            {shuffledWords.map((word, index) => (
                                <button
                                    key={index}
                                    onClick={() => {
                                        if (!selectedFirst) setSelectedFirst(word);
                                        else if (!selectedLast && word !== selectedFirst) setSelectedLast(word);
                                    }}
                                    className={`m-2 px-4 py-2 border rounded-md ${
                                        word === selectedFirst || word === selectedLast ? 'bg-blue-100 border-blue-500' : 'bg-white border-gray-300'
                                    } flex flex-col items-center`}
                                >
                                    <span>{word}</span>
                                    {word === selectedFirst && <span className='text-xs text-green-600 mt-1'>First</span>}
                                    {word === selectedLast && <span className='text-xs text-red-600 mt-1'>Last</span>}
                                </button>
                            ))}
                        </div>

                        {/* Verify button */}
                        <button
                            className='px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors'
                            onClick={verifySelectedWords}
                        >
                            Verify
                        </button>
                    </div>
                </>
            </SetupStep>

            {/* Import wallet */}
            <SetupStep step={Step.ImportWallet} current={currentStep}>
                <>
                    <div className='space-y-4 text-center'>
                        {/* Title and description */}
                        <h1 className='text-xl font-semibold text-gray-900'>Import Your Wallet</h1>
                        <p className='text-md text-gray-600 mb-6'>Please enter your 12-word recovery phrase to import your wallet.</p>

                        {/* Textarea to enter the recovery phrase */}
                        <textarea
                            className='w-full p-4 text-sm text-gray-900 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500'
                            rows={4}
                            placeholder='Enter 12-word recovery phrase'
                            value={mnemonic}
                            onChange={(e) => setMnemonic(e.target.value)}
                        ></textarea>

                        {/* Import wallet button */}
                        <button
                            className='mt-4 px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors'
                            onClick={importFromMnemonic}
                        >
                            Import Wallet
                        </button>
                    </div>
                </>
            </SetupStep>

            {/* Alert Dialog */}
            <AlertDialog open={isDialogVisible} setOpen={(show) => showDialog(show)} {...alertDialog} />
        </>
    );
};

export default Web3WalletSetps;
