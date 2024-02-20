/**
 * TOTP verification form component
 * This is a server component and all the code is executed on the server side.
 */

import React, { useState, FormEvent } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { VerifyTotpFormProps } from '@/types/Form';
import AlertDialog from '@/components/common/alert-dialog';
import { useAlertDialog } from '@/components/hook/use-alert-dialog';

const TotpVerifyForm = ({ email, password }: VerifyTotpFormProps) => {
    const [totpCode, setTotpCode] = useState('');

    // State to manage the alert dialog
    const { isDialogVisible, alertDialog, showDialog } = useAlertDialog();

    // The router object for redirecting the user to different pages
    const router = useRouter();

    /**
     * Function to handle TOTP code verification
     * @param event {FormEvent<HTMLFormElement>} The form event
     */
    const handleVerify = async (event: FormEvent<HTMLFormElement>) => {
        // prevent the default form submission behavior
        event.preventDefault();

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

        // Call sign in with the totp code
        const result = await signIn('credentials', {
            redirect: false,
            email,
            password,
            totpCode,
        });

        if (result?.ok) {
            // Redirect to home page if user is authenticated and totp code is verified
            router.push('/home');
        } else {
            showDialog(true, {
                type: 'error',
                title: 'Error',
                message: 'TOTP code verification failed',
                buttonText: 'OK',
                onButtonClick: () => showDialog(false),
            });
        }
    };

    return (
        <>
            <div className='flex min-h-full flex-1 flex-col justify-center px-6 py-12 lg:px-8'>
                <div className='sm:mx-auto sm:w-full sm:max-w-sm'>
                    {/* SafeKeep logo */}
                    <img className='mx-auto h-44 w-auto' src='/images/safe_keep_logo.png' alt='SafeKeep' />

                    {/* Form title */}
                    <h2 className='mt-10 text-center text-2xl font-bold leading-9 tracking-tight text-gray-900'>Entery your verification code</h2>
                </div>

                <div className='mt-10 sm:mx-auto sm:w-full sm:max-w-sm'>
                    {/* Verification code form */}
                    <form className='space-y-6' onSubmit={handleVerify}>
                        {/* Verification code input */}
                        <div>
                            <label htmlFor='email' className='block text-sm font-medium leading-6 text-gray-900'>
                                Verification Code
                            </label>
                            <div className='mt-2'>
                                <input
                                    id='totp'
                                    name='totp'
                                    type='text'
                                    value={totpCode}
                                    onChange={(e) => setTotpCode(e.target.value)}
                                    required
                                    className='block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6'
                                />
                            </div>
                        </div>

                        {/* Verification button */}
                        <div>
                            <button
                                type='submit'
                                className='flex w-full justify-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600'
                            >
                                Verify
                            </button>
                        </div>
                    </form>
                </div>

                {/* Alert Dialog */}
                <AlertDialog open={isDialogVisible} setOpen={(show) => showDialog(show)} {...alertDialog} />
            </div>
        </>
    );
};

export default TotpVerifyForm;
