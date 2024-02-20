/**
 * Login page
 * This page is a client component and all the code is executed on the client side.
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { User } from '@/types/User';
import LoginForm from '@/components/auth/login-form';
import TotpVerifyForm from '@/components/auth/totp-verify-form';

// Enum to define the login step
export enum LoginStep {
    DisplayLoginForm,
    EnterTotpCode,
}

// Function to render the login step
const LoginStepRenderer = ({ step, current, children }: { step: LoginStep; current: LoginStep; children: JSX.Element }) => {
    return step === current ? children : null;
};

const Login = () => {
    // State to store the login form data
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    // State to store the current login step
    const [currentStep, setCurrentStep] = useState(LoginStep.DisplayLoginForm);

    // Get the authenticated session
    const { data: session, status } = useSession();

    // The router object for redirecting the user to different pages
    const router = useRouter();

    // useEffect hook to detmine which page to redirect to according to the user's authentication status
    useEffect(() => {
        if (status === 'authenticated' && session?.user) {
            // Redirect the user to other pages if the user is authenticated
            const user = session.user as User;

            if (user.totp) {
                // Redirect to home page if the user has totp enabled
                router.push('/home');
            } else {
                // Redirect to totp setup page if the user has not setup totp
                router.push('/totp-setup');
            }
        }
    }, [status]);

    return (
        <>
            {/* The login page */}
            <LoginStepRenderer step={LoginStep.DisplayLoginForm} current={currentStep}>
                <>
                    <LoginForm email={email} setEmail={setEmail} password={password} setPassword={setPassword} setCurrentStep={setCurrentStep} />
                </>
            </LoginStepRenderer>

            {/* The totp verify page */}
            <LoginStepRenderer step={LoginStep.EnterTotpCode} current={currentStep}>
                <>
                    <TotpVerifyForm email={email} password={password} />
                </>
            </LoginStepRenderer>
        </>
    );
};

export default Login;
