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
        <>
            {/* The display QR code step */}
            <SetupStep step={Step.DisplayQrCode} current={currentStep}>
                <>
                    <h1>Enable two-factor authentication</h1>
                    <p>Please scan the QR code below using an authenticator app or manually enter the code {totpData.totpSecret}</p>

                    {/* Display the QR Code */}
                    {totpData.totpQRCode && <img src={totpData.totpQRCode} alt='TOTP QR Code' />}

                    <button onClick={handleNextStep}>Continue</button>
                </>
            </SetupStep>

            {/* The enter TOTP code step */}
            <SetupStep step={Step.EnterTotpCode} current={currentStep}>
                <>
                    <h1>Verify TOTP Code</h1>
                    <input type='text' value={totpCode} onChange={(e) => setTotpCode(e.target.value)} placeholder='Enter your TOTP code' />
                    <button onClick={handleVerify}>Verify</button>
                </>
            </SetupStep>

            {/* Alert Dialog */}
            <AlertDialog open={isDialogVisible} setOpen={(show) => showDialog(show)} {...alertDialog} />
        </>
    );
};

export default TOTPSetps;
