'use client'

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import LoadingModal from '@/components/common/loading-modal';

const Home = () => {
    const { data: session } = useSession();
    const router = useRouter();
    const [serviceWorkerReady, setServiceWorkerReady] = useState(false);

    /**
     * useEffect to register the service worker
     */
    useEffect(() => {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/service-worker.js')
                .then(registration => {
                    console.log('Service Worker Registered', registration.scope);
                    setServiceWorkerReady(true);
                })
                .catch(err => {
                    console.error('Service Worker Registration Failed', err);
                });
        } else {
            console.log('Service Worker not supported in this browser');
        }
    }, []);

    /**
     * useEffect to redirect the user to the home page if the service worker is ready
     */
    useEffect(() => {
        if (serviceWorkerReady) {
            // Using a slight delay to ensure state updates and other async operations have settled
            setTimeout(() => {
                session ? router.push('/home') : router.push('/login');
            }, 0);
        }
    }, [serviceWorkerReady, session, router]);

    return <LoadingModal />;
};

export default Home;


