
import React, { useState, FormEvent, useEffect } from 'react';
import { signIn, useSession, signOut } from "next-auth/react"
import { useRouter } from 'next/navigation';
import { User, LoginUserResponse } from '@/types/User';
import { LoginFormProps } from '@/types/Form';
import Link from 'next/link';
import { LoginStep } from '@/app/login/page';

/**
 * Function to handle login form submission
 * @param event 
 */
const LoginForm = ({ email, setEmail, password, setPassword, setCurrentStep }: LoginFormProps) => {

    // The router object for redirecting the user to different pages
    const router = useRouter();

    const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
        // Prevent the default form submission behavior
        event.preventDefault();

        try {
            // Call the login API to login the user
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                body: JSON.stringify({ email, password }),
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            const data = await res.json() as LoginUserResponse;

            if (res.ok) {

                if (data.totpEnabled) {
                    // Activate the totp code verification step if the user has totp enabled
                    setCurrentStep(LoginStep.EnterTotpCode);
                } else {
                    // Sign in the user and redirect to totp setup page if the user has not setup totp
                    const result = await signIn('credentials', {
                        redirect: false,
                        email,
                        password
                    });

                    if (result?.ok) {
                        router.push('/totp-setup');
                    } else {
                        console.error('Login failed:', result);
                        alert('Login failed');
                    }
                }
            } else {
                console.error('Login failed:', data);
                alert(data.message);
            }
        } catch (error) {
            console.error('Login failed:', error);
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
                        Sign in to your account
                    </h2>
                </div>

                <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
                    <form className="space-y-6" onSubmit={handleLogin}>
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium leading-6 text-gray-900">
                                Email address
                            </label>
                            <div className="mt-2">
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    autoComplete="off"
                                    required
                                    className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                                />
                            </div>
                        </div>

                        <div>
                            <div className="flex items-center justify-between">
                                <label htmlFor="password" className="block text-sm font-medium leading-6 text-gray-900">
                                    Password
                                </label>
                                <div className="text-sm">
                                    <a href="#" className="font-semibold text-indigo-600 hover:text-indigo-500">
                                        Forgot password?
                                    </a>
                                </div>
                            </div>
                            <div className="mt-2">
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
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
                                Sign in
                            </button>
                        </div>
                    </form>

                    <p className="mt-10 text-center text-sm text-gray-500">
                        Don't have an account?{' '}
                        <Link href='/signup' className="font-semibold leading-6 text-indigo-600 hover:text-indigo-500">
                            Sign up here
                        </Link>
                    </p>
                </div>
            </div>
        </>
    )
}

export default LoginForm;