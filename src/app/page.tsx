'use client'

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import LoadingModal from '@/components/loading-modal';

const Home = () => {
  const { data: session } = useSession();
  const router = useRouter();

  useEffect(() => {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/service-worker.js')
            .then(registration => {
                console.log('Service Worker Registered');
            })
            .catch(err => {
                console.error('Service Worker Registration Failed', err);
            });
    }
}, []);

  useEffect(() => {
    // Redirect based on session status
    // Route to home page if the user is logged in
    session ? router.push('/home') : router.push('/login'); 
  }, [session, router]);

  return <LoadingModal/>;
};

export default Home;
