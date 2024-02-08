'use client'

import React, { useEffect, useState } from 'react';
import { HomeComponentProps } from '../types/Home';
import SetMasterPassword from './set-master-password';
import EnterMasterPassword from './enter-master-password';
import { getMasterPasswordFromServiceWorker } from '@/services/serviceWorkerUtils';
import { useRouter } from 'next/navigation';
import LoadingModal from './loading-modal';

/**
* The home component
* @param event 
*/
const HomeComponent = ({ salt }: HomeComponentProps) => {
    // State to set the overlay visibility
    const [isPasswordSet, setIsPasswordSet] = useState(salt === null);
    const [isLoading, setIsLoading] = useState(true);
    
    const router = useRouter();

    // Check if the master password is entered if the salt is not null
    useEffect(() => {
        const checkMasterPassword = async () => {
            if (salt) {
                const masterPassword = await getMasterPasswordFromServiceWorker();

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