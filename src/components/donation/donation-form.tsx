/**
 * Donation form component
 * This is a client component and all the code is executed on the client side.
 */

'use client';
import React, { useState } from 'react';
import { RadioGroup } from '@headlessui/react';
import { loadStripe } from '@stripe/stripe-js';
import { classNames } from '@/utils/pageUtils';
import AlertDialog from '@/components/common/alert-dialog';
import { useAlertDialog } from '@/components/hook/use-alert-dialog';

const DonationComponent = () => {
    // Fixed donation amounts
    const fixedAmounts = [1, 5, 10, 25, 50, 100, 200, 500];

    // Use state to manage the selected amount and custom amount
    const [selectedAmount, setSelectedAmount] = useState(fixedAmounts[0]);
    const [customAmount, setCustomAmount] = useState(0);

    // State to manage the alert dialog
    const { isDialogVisible, alertDialog, showDialog } = useAlertDialog();

    /**
     * Function to handle the selection of a fixed amount
     * @param amount
     */
    const handleSelectAmount = (amount: number) => {
        // Set the selected amount
        setSelectedAmount(amount);
        // Clear custom amount when a fixed amount is selected
        setCustomAmount(0);
    };

    /**
     * Function to handle the change of the custom amount
     * @param e {React.ChangeEvent<HTMLInputElement>}
     */
    const handleCustomAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        // Parse the input value as a number
        const amount = parseInt(e.target.value, 10);

        // Set the custom amount
        setCustomAmount(amount);

        // Clear selected fixed amount when entering a custom amount
        setSelectedAmount(0);
    };

    /**
     * Function to handle the form submission
     * @param e {React.FormEvent<HTMLFormElement>}
     */
    const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        // Prevent the default form submission behaviour
        e.preventDefault();

        // Get the selected amount or custom amount
        const amount = selectedAmount || customAmount;

        // The minimum amount is 1
        if (amount === 0) {
            showDialog(true, {
                type: 'error',
                title: 'Error',
                message: 'Donation amount cannot be £0',
                buttonText: 'OK',
                onButtonClick: () => showDialog(false),
            });

            return;
        }

        // The maximum amount is 1000
        if (amount > 1000) {
            showDialog(true, {
                type: 'error',
                title: 'Error',
                message: 'The maximum donation amount is £1000',
                buttonText: 'OK',
                onButtonClick: () => showDialog(false),
            });

            return;
        }

        // Check if the amount is valid (is an integer and greater than 0)
        if (!Number.isInteger(amount) || amount < 1) {
            showDialog(true, {
                type: 'error',
                title: 'Error',
                message: 'Please enter a valid amount',
                buttonText: 'OK',
                onButtonClick: () => showDialog(false),
            });
            
            return;
        }

        // Create a new payment session and redirect the user to the checkout page
        // This will handle paymount outside of the application and redirect the user back to the application
        // This approach is used to avoid handling sensitive payment information in the application
        createPaymentSession(amount);
    };

    /**
     * Function to create a new payment session
     * @param amount
     */
    const createPaymentSession = async (amount: number) => {
        // Call the API to create a new payment session
        try {
            // Get the base URL of the current page, this approach works for both local and production environments
            const baseUrl = window.location.origin;

            // Call the donation API to create a new payment session
            const response = await fetch('/api/donation/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ amount, redirectUrl: baseUrl }),
            });

            let data = await response.json();

            if (response.ok) {
                // Load the Stripe library
                const stripe = await loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY as string);

                if (stripe) {
                    // Save the amount to local storage with the key as the session id
                    // This is used to retrieve the amount when the user is redirected back to the page
                    localStorage.setItem(data.sessionId, amount.toString());

                    // Redirect the user to the checkout page
                    const { error } = await stripe.redirectToCheckout({
                        sessionId: data.sessionId,
                    });
                } else {
                    alert('Stripe is not loaded');
                }
            }
        } catch (error) {
            alert('Failed to create payment session');
        }
    };

    return (
        <div className='p-6 mx-auto bg-white rounded-xl shadow-md flex flex-col space-y-4 min-w-full'>
            {/* Donation form */}
            <form onSubmit={handleFormSubmit}>
                <RadioGroup value={selectedAmount} onChange={handleSelectAmount} className='mt-4'>
                    {/* Donation amount options */}
                    <h2>Choose a donation amount</h2>
                    <div className='grid grid-cols-4 gap-4 sm:grid-cols-8 lg:grid-cols-4 pt-6'>
                        {fixedAmounts.map((amount) => (
                            <RadioGroup.Option
                                key={amount}
                                value={amount}
                                className={({ active }) =>
                                    classNames(
                                        active ? 'ring-2 ring-indigo-500' : '',
                                        'cursor-pointer bg-white text-gray-900 shadow-sm group relative flex items-center justify-center rounded-md border py-3 px-4 text-sm font-medium uppercase hover:bg-gray-50 focus:outline-none sm:flex-1 sm:py-6'
                                    )
                                }
                            >
                                {({ active, checked }) => (
                                    <>
                                        <RadioGroup.Label as='span'>£{amount}</RadioGroup.Label>

                                        <span
                                            className={classNames(
                                                active ? 'border' : 'border-2',
                                                checked ? 'border-indigo-500' : 'border-transparent',
                                                'pointer-events-none absolute -inset-px rounded-md'
                                            )}
                                            aria-hidden='true'
                                        />
                                    </>
                                )}
                            </RadioGroup.Option>
                        ))}
                    </div>
                </RadioGroup>

                {/* Custom amount input */}
                <div className='flex flex-col mt-4'>
                    <label htmlFor='customAmount' className='text-sm font-medium text-gray-700'>
                        Custom Amount
                    </label>
                    <input
                        type='number'
                        id='customAmount'
                        value={customAmount}
                        onChange={handleCustomAmountChange}
                        className='mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm'
                        placeholder='Enter your donation amount'
                        max='1000' // Maximum amount is £1000
                    />
                </div>

                {/* Submit button */}
                <div className='flex justify-center pt-6'>
                    <button
                        type='submit'
                        className='px-6 py-2 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700'
                    >
                        Donate
                    </button>
                </div>
            </form>

            {/* Alert Dialog */}
            <AlertDialog
                open={isDialogVisible}
                setOpen={(show) => showDialog(show)}
                {...alertDialog}
            />
        </div>
    );
};

export default DonationComponent;
