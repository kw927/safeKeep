'use client';
import React, { useEffect, useState } from 'react';
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { useSearchParams } from 'next/navigation';
import LoadingModal from './loading-modal';

const PaymentSuccessPage = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [isSuccess, setIsSuccess] = useState(false);
    const [donationAmount, setDonationAmount] = useState(0);
    const searchParams = useSearchParams();
    const paymentSuccess = searchParams.get('payment_success');
    const sessionId = searchParams.get('session_id');

    useEffect(() => {
        setIsSuccess(paymentSuccess === 'true');
        if (sessionId) {
            const storedDonationAmount = localStorage.getItem(sessionId) || '0';
            setDonationAmount(parseInt(storedDonationAmount, 10));
        }
        setIsLoading(false);
    }, [paymentSuccess, sessionId]);

    return (
        <div className="py-12">
            {isLoading ?
                (
                    <LoadingModal messaage={"Processing Payment"} />
                ) : (
                    <div className="min-w-full mx-auto bg-white rounded-xl shadow-md overflow-hidden">
                        <div className="md:flex">
                            <div className="p-8">
                                <div className="flex items-center justify-center">
                                    {isSuccess ? (
                                        <CheckCircleIcon className="h-12 w-12 text-green-500" aria-hidden="true" />
                                    ) : (
                                        <XCircleIcon className="h-12 w-12 text-red-500" aria-hidden="true" />
                                    )}
                                </div>
                                <div className="mt-3 text-center space-y-2">
                                    {isSuccess ? (
                                        <>
                                            <p className="text-3xl font-bold text-gray-900">Thank You!</p>
                                            <p className="text-base text-gray-500">
                                                Your donation of ${donationAmount} has been successfully processed.
                                            </p>
                                            <p className="text-base text-gray-500">
                                                Your support is greatly appreciated and will go a long way in helping us.
                                            </p>
                                        </>
                                    ) : (
                                        <>
                                            <p className="text-3xl font-bold text-red-500">Payment Failed</p>
                                            <p className="text-base text-gray-500">
                                                Unfortunately, there was an issue processing your donation.
                                            </p>
                                            <p className="text-base text-gray-500">
                                                Please try again or contact support for assistance.
                                            </p>
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
