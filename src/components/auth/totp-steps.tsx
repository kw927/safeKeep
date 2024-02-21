/**
 * TOTP setup steps component
 * This is a client component and all the code is executed on the client side.
 */

'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { TOTPStepsProps } from '@/types/Totp';
import AlertDialog from '@/components/common/alert-dialog';
import { useAlertDialog } from '@/components/hook/use-alert-dialog';

// Enum for setup steps
enum Step {
    DisplayQrCode,
    EnterTotpCode,
}

// Function to render the setup step
const SetupStep = ({ step, current, children }: { step: Step; current: Step; children: JSX.Element }) => {
    return step === current ? children : null;
};

/**
 * Component to render the TOTP setup steps
 * @param props {TOTPStepsProps} The props for the component
 */
const TOTPSetps: React.FC<TOTPStepsProps> = (props) => {
    // Get the totp data from the props
    const { totpData } = props;

    // State to store the current step
    const [currentStep, setCurrentStep] = useState(Step.DisplayQrCode);
    // State to store the totp code entered by the user
    const [totpCode, setTotpCode] = useState('');

    // State to manage the alert dialog
    const { isDialogVisible, alertDialog, showDialog } = useAlertDialog();

    // The router object for redirecting the user to different pages
    const router = useRouter();

    /**
     * Function to switch to the next step
     */
    const handleNextStep = () => {
        setCurrentStep(Step.EnterTotpCode);
    };

    /**
     * Function to check if the user has entered a valid TOTP code
     * @returns
     */
    const handleVerify = async () => {
        // Check if the totp code is valid in length
        if (!totpCode || totpCode.length !== 6) {
            showDialog(true, {
                type: 'error',
                title: 'Error',
                message: 'Please enter a valid TOTP code',
                buttonText: 'OK',
                onButtonClick: () => showDialog(false),
            });

            return;
        }

        // Call the TOTP verification API to verify the TOTP code
        const verifyResult = await fetch('/api/totp/verify', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                totpCode,
            }),
        });

        if (verifyResult.ok && verifyResult.status === 200) {
            // Redirect to home page if the TOTP code is valid
            router.push('/home');
        } else {
            // Show the error message if the TOTP code is invalid
            const responseData = await verifyResult.json();

            showDialog(true, {
                type: 'error',
                title: 'Error',
                message: `TOTP code verification failed: ${responseData.message}`,
                buttonText: 'OK',
                onButtonClick: () => showDialog(false),
            });
        }
    };

    return (
        <div className='flex min-h-full flex-1 flex-col justify-center px-6 py-12 lg:px-8'>
            {/* The SafeKeep logo */}
            <img className='mx-auto h-44 w-auto' src='/images/safe_keep_logo.png' alt='SafeKeep' />

            {/* Display the TOTP code and QR code */}
            <SetupStep step={Step.DisplayQrCode} current={currentStep}>
                <div className='space-y-6'>
                    {/* Title and description */}
                    <h2 className='mt-6 text-center text-3xl font-bold text-gray-900'>Enable Two-Factor Authentication</h2>
                    <p className='text-gray-600'>
                        Scan the QR code below using an authenticator app or manually enter the code {totpData.totpSecret}.
                    </p>

                    {/* TOTP QR code */}
                    {totpData.totpQRCode && <img className='mx-auto' src={totpData.totpQRCode} alt='TOTP QR Code' />}

                    {/* Continue button */}
                    <div className='flex justify-center'>
                        <button
                            name='continue-button'
                            className='mt-4 w-6/12 flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
                            onClick={handleNextStep}
                        >
                            Continue
                        </button>
                    </div>
                </div>
            </SetupStep>

            {/* Enter the TOTP code to verify */}
            <SetupStep step={Step.EnterTotpCode} current={currentStep}>
                <div className='space-y-6 w-full text-center'>
                    {/* Title and description */}
                    <h2 className='text-center text-3xl font-bold text-gray-900'>Verify TOTP Code</h2>
                    <p className='text-gray-600'>Enter the TOTP code from your authenticator app.</p>

                    {/* TOTP code input */}
                    <input
                        className='mt-2 block w-3/4 mx-auto rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm'
                        type='text'
                        name='totp-code'
                        value={totpCode}
                        onChange={(e) => setTotpCode(e.target.value)}
                        placeholder='Enter your TOTP code'
                    />

                    {/* Verify button */}
                    <div className='mt-4'>
                        <button
                            name='verify-button'
                            className='w-3/4 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
                            onClick={handleVerify}
                        >
                            Verify
                        </button>
                    </div>
                </div>
            </SetupStep>

            <AlertDialog open={isDialogVisible} setOpen={(show) => showDialog(show)} {...alertDialog} />
        </div>
    );
};

export default TOTPSetps;
