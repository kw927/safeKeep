/**
 * Donation Result Page
 * This page is displayed after the user has completed the payment process
 * This is a client component and all the code is executed on the client side
 */

'use client';
import React, { useEffect, useState } from 'react';
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { useSearchParams } from 'next/navigation';
import LoadingModal from '@/components/common/loading-modal';

const PaymentSuccessPage = () => {
    // State to manage the loading state
    const [isLoading, setIsLoading] = useState(true);

    // State to manage the success state (is the payment successful)
    const [isSuccess, setIsSuccess] = useState(false);

    // State to manage the donation amount
    const [donationAmount, setDonationAmount] = useState(0);

    // Get the search params from the URL
    const searchParams = useSearchParams();
    const paymentSuccess = searchParams.get('payment_success');
    const sessionId = searchParams.get('session_id');

    /**
     * Function to set the success state and donation amount
     */
    useEffect(() => {
        // Set isSuccess to true if payment_success from the URL is true
        setIsSuccess(paymentSuccess === 'true');

        // Get the donation amount from the session storage
        // The key of the amount stored in the local storage is the session id
        if (sessionId) {
            const storedDonationAmount = localStorage.getItem(sessionId) || '0';
            setDonationAmount(parseInt(storedDonationAmount, 10));
        }

        // Set the loading state to false to hide the loading modal
        setIsLoading(false);
    }, [paymentSuccess, sessionId]);

    return (
        <div className='py-12'>
            {isLoading ? (
                <LoadingModal messaage={'Processing Payment'} />
            ) : (
                <div className='min-w-full mx-auto bg-white rounded-xl shadow-md overflow-hidden'>
                    <div className='md:flex'>
                        <div className='p-8'>
                            {/* Payment result icons */}
                            <div className='flex items-center justify-center'>
                                {isSuccess ? (
                                    <CheckCircleIcon className='h-12 w-12 text-green-500' />
                                ) : (
                                    <XCircleIcon className='h-12 w-12 text-red-500' />
                                )}
                            </div>

                            {/* Payment result text */}
                            <div className='mt-3 text-center space-y-2'>
                                {isSuccess ? (
                                    <>
                                        <p className='text-3xl font-bold text-gray-900'>Thank You!</p>
                                        <p className='text-base text-gray-500'>Your donation of ${donationAmount} has been successfully processed.</p>
                                        <p className='text-base text-gray-500'>
                                            Your support is greatly appreciated and will go a long way in helping us.
                                        </p>
                                    </>
                                ) : (
                                    <>
                                        <p className='text-3xl font-bold text-red-500'>Payment Failed</p>
                                        <p className='text-base text-gray-500'>Unfortunately, there was an issue processing your donation.</p>
                                        <p className='text-base text-gray-500'>Please try again or contact support for assistance.</p>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PaymentSuccessPage;
