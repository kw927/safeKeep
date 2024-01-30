'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { TOTPStepsProps } from '@/types/Totp';

// Enum for setup steps
enum Step {
    DisplayQrCode,
    EnterTotpCode,
}

// Function to render the setup step
const SetupStep = ({ step, current, children }: { step: Step, current: Step, children: JSX.Element }) => {
    return step === current ? children : null;
};

/**
 * Component to render the TOTP setup steps
 * @param props 
 * @returns 
 */
const TOTPSetps: React.FC<TOTPStepsProps> = (props) => {
    // Get the totp data from the props
    const { totpData } = props;

    // State to store the current step
    const [currentStep, setCurrentStep] = useState(Step.DisplayQrCode);
    // State to store the totp code entered by the user
    const [totpCode, setTotpCode] = useState('');

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
            alert('Please enter a valid TOTP code');
            return;
        }

        // Call the TOTP verification API to verify the TOTP code
        const verifyResult = await fetch('/api/totp/verify', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                totpCode
            })
        });

        if (verifyResult.ok && verifyResult.status === 200) {
            // Redirect to home page if the TOTP code is valid
            router.push('/home');
        } else {
            // Show the error message if the TOTP code is invalid
            const responseData = await verifyResult.json();

            console.error('TOTP code verification failed:', verifyResult);
            alert(`TOTP code verification failed: ${responseData.message}`);
        }

    };

    return (
        <>
            <SetupStep step={Step.DisplayQrCode} current={currentStep}>
                <>
                    <h1>Enable two-factor authentication</h1>
                    <p>Please scan the QR code below using an authenticator app or manually enter the code {totpData.totpSecret}</p>
                    {/* Display the QR Code */}
                    {totpData.totpQRCode && (
                        <img src={totpData.totpQRCode} alt="TOTP QR Code" />
                    )}

                    <button onClick={handleNextStep}>Continue</button>
                </>
            </SetupStep>

            <SetupStep step={Step.EnterTotpCode} current={currentStep}>
                <>
                    <h1>Verify TOTP Code</h1>
                    <input
                        type="text"
                        value={totpCode}
                        onChange={(e) => setTotpCode(e.target.value)}
                        placeholder="Enter your TOTP code"
                    />
                    <button onClick={handleVerify}>Verify</button>
                </>
            </SetupStep>
        </>
    )
}

export default TOTPSetps;