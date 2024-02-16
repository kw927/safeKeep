'use client'

import React, { useEffect, useState } from 'react';
import { HomeComponentProps } from '../types/Home';
import SetMasterPassword from './set-master-password';
import EnterMasterPassword from './enter-master-password';
import { getMasterPasswordFromServiceWorker } from '@/services/serviceWorkerUtils';
import { useRouter } from 'next/navigation';
import LoadingModal from './loading-modal';
import { useSession } from 'next-auth/react';
import { User } from '@/types/User';
import { useSideMenu } from '@/context/UserProvider';

/**
* The home component
* @param event 
*/
const HomeComponent = ({ salt }: HomeComponentProps) => {
    // State to set the overlay visibility
    const [isPasswordSet, setIsPasswordSet] = useState(salt === null);
    const [isLoading, setIsLoading] = useState(true);
    const { menuData, updateMenuData } = useSideMenu();
    
    // Get the authenticated session
    const { data: session, status } = useSession();

    // The router object for redirecting the user to different pages
    const router = useRouter();

    // useEffect hook to detmine which page to redirect to according to the user's authentication status
    useEffect(() => {
        if (status === 'authenticated' && session?.user) {
            const user = session.user as User;
            updateMenuData();
        }
    }, [status]);

    // Check if the master password is entered if the salt is not null
    useEffect(() => {
        const checkMasterPassword = async () => {
            if (salt) {
                const masterPassword = await getMasterPasswordFromServiceWorker();
                console.log('Master password from service worker:');
                console.log(masterPassword);

                if (masterPassword) {
                    // route the all items page
                    // use window.location.href to force a reload of the items
                    window.location.href = '/item';
                } else {
                    setIsLoading(false);
                }
            } else {
                setIsLoading(false);
            }
        };

        checkMasterPassword();
    }, [salt]);

    if (isLoading) {
        return (
            <LoadingModal />
        );
    }    

    return (
        <div className="relative flex justify-center items-center" style={{ height: 'calc(100vh - 144px)' }}>
            {isPasswordSet ? (
                <SetMasterPassword />
            ) : (
                <EnterMasterPassword salt={salt as string} />
            )}
        </div>
                
    );
}

export default HomeComponent;