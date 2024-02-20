/**
 * Set Master Password Component
 * This component is a client component and all the code is executed on the client side.
 */

'use client';

import React, { FormEvent, Fragment, useState } from 'react';
import CustomAlert from '@/components/common/alert';
import { AlertState } from '@/types/Alert';
import { generateKey, convertWordArrayToBase64 } from '@/services/cryptoUtils';
import { generatePublicKey, validatePassword, getSaltAndPublicKey } from '@/services/cryptoServiceClient';
import { setMasterPasswordInServiceWorker } from '@/services/serviceWorkerUtils';
import { useRouter } from 'next/navigation';

const SetMasterPassword = () => {
    // State to manage the alert
    const [alert, setAlert] = useState<AlertState>({ show: false, type: 'error', title: '', messages: [] });

    // State to manage the master password
    const [masterPassword, setMasterPassword] = useState('');
    const [confirmMasterPassword, setConfirmMasterPassword] = useState('');

    const router = useRouter();

    /**
     * Function to handle the submit of the set master password form
     * @param event {FormEvent<HTMLFormElement>} The form event
     */
    const setPasswordSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        // Check if the msater password meets the requirements
        const { isValid, errorMessages } = validatePassword(masterPassword, confirmMasterPassword);

        if (!isValid) {
            setAlert({
                show: true,
                type: 'error',
                title: errorMessages.length > 1 ? 'Errors' : 'Error',
                messages: errorMessages,
            });
            return;
        }

        // Passwords match and meet all requirements, so generate the public key and salt the master password
        const publicKey = generatePublicKey(masterPassword);

        try {
            // Call the API to save the public key to the database
            const response = await fetch('/api/user/set-master-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ publicKey }),
            });

            const data = await response.json();

            if (response.ok) {
                const { salt } = getSaltAndPublicKey(publicKey);

                // Derive the master password before saving it in the service worker
                const derivedMasterPassword = generateKey(masterPassword, salt);
                setMasterPasswordInServiceWorker(convertWordArrayToBase64(derivedMasterPassword));

                // Clear the master passwords from the state before redirecting
                setMasterPassword('');
                setConfirmMasterPassword('');

                // Redirect to all items page
                router.push('/item');
            } else {
                setAlert({
                    show: true,
                    type: 'error',
                    title: 'Error',
                    messages: [data.message],
                });
            }
        } catch (error) {
            setAlert({
                show: true,
                type: 'error',
                title: 'Error',
                messages: [(error as Error).message],
            });
        }
    };

    return (
        <>
            <div className='absolute z-10'>
                {/* Content to display when the slat is null */}
                {/* Set Master Password Modal */}
                <div className='fixed inset-0 bg-gray-500 bg-opacity-75'></div> {/* Overlay */}
                <div className='relative bg-white p-4 rounded-lg shadow-xl'>
                    {' '}
                    {/* Custom Modal */}
                    <div className='text-center'>
                        {/* Modal Content */}
                        <h3 className='text-lg font-semibold'>Set Master Password</h3>
                        <div className='mt-2'>
                            <p className='text-sm text-gray-500'>Please set your master password to encrypt your data.</p>
                        </div>

                        {/* Alert */}
                        {alert.show && <CustomAlert type={alert.type} title={alert.title} messages={alert.messages} />}

                        {/* Set master password form */}
                        <form onSubmit={setPasswordSubmit}>
                            {/* Master Password */}
                            <div className='mt-2'>
                                <input
                                    type='password'
                                    className='block w-full rounded-md border-gray-300 py-2 pl-3 pr-3 text-gray-900 shadow-sm placeholder:text-gray-400 focus:ring-indigo-600 focus:border-indigo-600 sm:text-sm'
                                    placeholder='Enter Master Password'
                                    value={masterPassword}
                                    onChange={(e) => setMasterPassword(e.target.value)}
                                />
                            </div>

                            {/* Confirm Master Password */}
                            <div className='mt-2'>
                                <input
                                    type='password'
                                    className='block w-full rounded-md border-gray-300 py-2 pl-3 pr-3 text-gray-900 shadow-sm placeholder:text-gray-400 focus:ring-indigo-600 focus:border-indigo-600 sm:text-sm'
                                    placeholder='Confirm Master Password'
                                    value={confirmMasterPassword}
                                    onChange={(e) => setConfirmMasterPassword(e.target.value)}
                                />
                            </div>

                            {/* Set master password button */}
                            <div className='mt-4'>
                                <button
                                    type='submit'
                                    className='inline-flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600'
                                >
                                    Set Password
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </>
    );
};

export default SetMasterPassword;
