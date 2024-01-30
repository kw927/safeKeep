import React, { useState, FormEvent } from 'react';
import { signIn } from "next-auth/react"
import { useRouter } from 'next/navigation';
import { VerifyTotpFormProps } from '../types/Form';

const TotpVerifyForm = ({ email, password }: VerifyTotpFormProps) => {
    const [totpCode, setTotpCode] = useState('');

    // The router object for redirecting the user to different pages
    const router = useRouter();

    /**
     * Function to handle TOTP code verification
     * @returns 
     */
    const handleVerify = async (event: FormEvent<HTMLFormElement>) => {
        // prevent the default form submission behavior
        event.preventDefault();

        // Check if the totp code is valid in length
        if (!totpCode || totpCode.length !== 6) {
            alert('Please enter a valid TOTP code');
            return;
        }

        // Call sign in with the totp code
        const result = await signIn('credentials', {
            redirect: false,
            email,
            password,
            totpCode
        });

        if (result?.ok) {
            // Redirect to home page if user is authenticated and totp code is verified
            router.push('/home');
        } else {
            alert('TOTP code verification failed');
        }
    };

    return (
        <>
            <div className="flex min-h-full flex-1 flex-col justify-center px-6 py-12 lg:px-8">
                <div className="sm:mx-auto sm:w-full sm:max-w-sm">
                    <img
                        className="mx-auto h-44 w-auto"
                        src="/images/safe_keep_logo.png"
                        alt="SafeKeep"
                    />
                    <h2 className="mt-10 text-center text-2xl font-bold leading-9 tracking-tight text-gray-900">
                        Entery your verification code
                    </h2>
                </div>

                <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
                    <form className="space-y-6" onSubmit={handleVerify}>
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium leading-6 text-gray-900">
                                Verification Code
                            </label>
                            <div className="mt-2">
                                <input
                                    id="totp"
                                    name="totp"
                                    type="text"
                                    value={totpCode}
                                    onChange={(e) => setTotpCode(e.target.value)}
                                    required
                                    className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                                />
                            </div>
                        </div>

                        <div>
                            <button
                                type="submit"
                                className="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                            >
                                Verify
                            </button>
                        </div>
                    </form>

                 
                </div>
            </div>
        </>
    )
}

export default TotpVerifyForm;