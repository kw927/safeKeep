/**
 * Login Form Component
 * This a server component and all the code is executed on the server side.
 */

import React, { FormEvent } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { LoginUserResponse } from '@/types/User';
import { LoginFormProps } from '@/types/Form';
import Link from 'next/link';
import { LoginStep } from '@/app/login/page';
import AlertDialog from '@/components/common/alert-dialog';
import { useAlertDialog } from '@/components/hook/use-alert-dialog';

/**
 * The login form component
 * @param email {string} The email address
 * @param setEmail {function} The function to set the email
 * @param password {string} The password
 * @param setPassword {function} The function to set the password
 * @param setCurrentStep {function} The function to set the current step
 */
const LoginForm = ({ email, setEmail, password, setPassword, setCurrentStep }: LoginFormProps) => {
    // State to manage the alert dialog
    const { isDialogVisible, alertDialog, showDialog } = useAlertDialog();

    // The router object for redirecting the user to different pages
    const router = useRouter();

    /**
     * Function to handle the login form submission
     * @param event {FormEvent<HTMLFormElement>} The form event
     */
    const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
        // Prevent the default form submission behavior
        event.preventDefault();

        try {
            // Call the login API to login the user
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                body: JSON.stringify({ email, password }),
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            const data = (await res.json()) as LoginUserResponse;

            if (res.ok) {
                if (data.totpEnabled) {
                    // Activate the totp code verification step if the user has totp enabled
                    setCurrentStep(LoginStep.EnterTotpCode);
                } else {
                    // Sign in the user and redirect to totp setup page if the user has not setup totp
                    const result = await signIn('credentials', {
                        redirect: false,
                        email,
                        password,
                    });

                    if (result?.ok) {
                        router.push('/totp-setup');
                    } else {
                        showDialog(true, {
                            type: 'error',
                            title: 'Error',
                            message: `Login failed: ${result?.error}`,
                            buttonText: 'OK',
                            onButtonClick: () => showDialog(false),
                        });
                    }
                }
            } else {
                showDialog(true, {
                    type: 'error',
                    title: 'Error',
                    message: `Login failed: ${data.message}`,
                    buttonText: 'OK',
                    onButtonClick: () => showDialog(false),
                });
            }
        } catch (error) {
            showDialog(true, {
                type: 'error',
                title: 'Error',
                message: `Login failed: ${error}`,
                buttonText: 'OK',
                onButtonClick: () => showDialog(false),
            });
        }
    };

    return (
        <>
            <div className='flex min-h-full flex-1 flex-col justify-center px-6 py-12 lg:px-8'>
                {/* SafeKeep logo */}
                <div className='sm:mx-auto sm:w-full sm:max-w-sm'>
                    <img className='mx-auto h-44 w-auto' src='/images/safe_keep_logo.png' alt='SafeKeep' />

                    {/* Form title */}
                    <h2 className='mt-10 text-center text-2xl font-bold leading-9 tracking-tight text-gray-900'>Sign in to your account</h2>
                </div>

                {/* Login form */}
                <div className='mt-10 sm:mx-auto sm:w-full sm:max-w-sm'>
                    <form className='space-y-6' onSubmit={handleLogin}>
                        {/* Email address */}
                        <div>
                            <label htmlFor='email' className='block text-sm font-medium leading-6 text-gray-900'>
                                Email address
                            </label>
                            <div className='mt-2'>
                                <input
                                    id='email'
                                    name='email'
                                    type='email'
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    autoComplete='off'
                                    required
                                    className='block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6'
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div>
                            <div className='flex items-center justify-between'>
                                <label htmlFor='password' className='block text-sm font-medium leading-6 text-gray-900'>
                                    Password
                                </label>
                                <div className='text-sm'>
                                    <a href='#' className='font-semibold text-indigo-600 hover:text-indigo-500'>
                                        Forgot password?
                                    </a>
                                </div>
                            </div>
                            <div className='mt-2'>
                                <input
                                    id='password'
                                    name='password'
                                    type='password'
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className='block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6'
                                />
                            </div>
                        </div>

                        {/* Sign in button */}
                        <div>
                            <button
                                type='submit'
                                className='flex w-full justify-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600'
                            >
                                Sign in
                            </button>
                        </div>
                    </form>

                    <p className='mt-10 text-center text-sm text-gray-500'>
                        Don't have an account?{' '}
                        <Link href='/signup' className='font-semibold leading-6 text-indigo-600 hover:text-indigo-500'>
                            Sign up here
                        </Link>
                    </p>
                </div>

                {/* Alert Dialog */}
                <AlertDialog open={isDialogVisible} setOpen={(show) => showDialog(show)} {...alertDialog} />
            </div>
        </>
    );
};

export default LoginForm;
