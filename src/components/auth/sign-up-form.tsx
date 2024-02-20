/**
 * Sign-up form component
 * This component is a client component and all the code is executed on the client side.
 */
'use client';

import React, { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { validatePassword, validateEmail } from '@/utils/userAccountUtils';
import AlertDialog from '@/components/common/alert-dialog';
import { useAlertDialog } from '@/components/hook/use-alert-dialog';

const SignUpFrom = () => {
    // State to store the sign-up form data
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    // State to manage the alert dialog
    const { isDialogVisible, alertDialog, showDialog } = useAlertDialog();

    // The router object for redirecting the user to different pages
    const router = useRouter();

    /**
     * Function to handle sign-up form submission
     * @param event {FormEvent<HTMLFormElement>} The form event
     */
    const handleSignUp = async (event: FormEvent<HTMLFormElement>) => {
        // prevent the default form submission behavior
        event.preventDefault();

        // Check if the first name and last name are not empty and within the length limit
        if (firstName.length < 1 || firstName.length > 50 || lastName.length < 1 || lastName.length > 50) {
            // Handle first name and last name error
            showDialog(true, {
                type: 'error',
                title: 'Error',
                message: 'First name and last name must be between 1 and 50 characters',
                buttonText: 'OK',
                onButtonClick: () => showDialog(false),
            });

            return;
        }

        // Check if the email is valid
        if (!validateEmail(email)) {
            // Handle invalid email error
            showDialog(true, {
                type: 'error',
                title: 'Error',
                message: 'Invalid email address',
                buttonText: 'OK',
                onButtonClick: () => showDialog(false),
            });

            return;
        }

        // Check if the password and confirm password match
        if (password !== confirmPassword) {
            // Handle password mismatch error
            showDialog(true, {
                type: 'error',
                title: 'Error',
                message: 'Password and confirm password do not match',
                buttonText: 'OK',
                onButtonClick: () => showDialog(false),
            });

            return;
        }

        // Check if the password meets the password policy
        const validatePasswordResult = validatePassword(password);

        if (!validatePasswordResult.isValid) {
            // Handle invalid password error
            alert(validatePasswordResult.message);
            return;
        }

        try {
            // Call the sign-up API to sign-up the user
            const res = await fetch('/api/user/signup', {
                method: 'POST',
                body: JSON.stringify({ firstName, lastName, email, password }),
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            const data = await res.json();

            if (res.ok) {
                // Redirect to login page if sign-up is successful
                // TODO: add a modal to show the user that sign-up is successful before redirecting to login page
                router.push('/login');
            } else {
                showDialog(true, {
                    type: 'error',
                    title: 'Error',
                    message: `Sign-up failed: ${data.message}`,
                    buttonText: 'OK',
                    onButtonClick: () => showDialog(false),
                });
            }
        } catch (error) {
            showDialog(true, {
                type: 'error',
                title: 'Error',
                message: `Sign-up failed: ${error}`,
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

                    {/* Sign-up form title */}
                    <h2 className='mt-10 text-center text-2xl font-bold leading-9 tracking-tight text-gray-900'>Sign up for SafeKeep</h2>
                </div>

                <div className='mt-10 sm:mx-auto sm:w-full sm:max-w-sm'>
                    {/* Sign-up form */}
                    <form className='space-y-6' onSubmit={handleSignUp}>
                        {/* First name */}
                        <div>
                            <label htmlFor='firstName' className='block text-sm font-medium leading-6 text-gray-900'>
                                First Name
                            </label>
                            <div className='mt-2'>
                                <input
                                    id='firstName'
                                    name='firstName'
                                    type='text'
                                    value={firstName}
                                    onChange={(e) => setFirstName(e.target.value)}
                                    required
                                    className='block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6'
                                />
                            </div>
                        </div>

                        {/* Last name */}
                        <div>
                            <label htmlFor='lastName' className='block text-sm font-medium leading-6 text-gray-900'>
                                Last Name
                            </label>
                            <div className='mt-2'>
                                <input
                                    id='lastName'
                                    name='lastName'
                                    type='text'
                                    value={lastName}
                                    onChange={(e) => setLastName(e.target.value)}
                                    required
                                    className='block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6'
                                />
                            </div>
                        </div>

                        {/* Email */}
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
                                    required
                                    className='block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6'
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div>
                            <label htmlFor='password' className='block text-sm font-medium leading-6 text-gray-900'>
                                Password
                            </label>
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

                        {/* Confirm Password */}
                        <div>
                            <label htmlFor='confirmPassword' className='block text-sm font-medium leading-6 text-gray-900'>
                                Confirm Password
                            </label>
                            <div className='mt-2'>
                                <input
                                    id='confirmPassword'
                                    name='confirmPassword'
                                    type='password'
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                    className='block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6'
                                />
                            </div>
                        </div>

                        {/* Sign up button */}
                        <div>
                            <button
                                type='submit'
                                className='flex w-full justify-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600'
                            >
                                Sign up
                            </button>
                        </div>
                    </form>

                    <p className='mt-10 text-center text-sm text-gray-500'>
                        Already have an account?{' '}
                        <Link href='/login' className='font-semibold leading-6 text-indigo-600 hover:text-indigo-500'>
                            Login here
                        </Link>
                    </p>
                </div>

                {/* Alert Dialog */}
                <AlertDialog open={isDialogVisible} setOpen={(show) => showDialog(show)} {...alertDialog} />
            </div>
        </>
    );
};

export default SignUpFrom;
