/**
 * This file contains the utility functions for the service worker
 * Service workers are used to store the master password in the browser
 * The advantage of using a service worker is that it runs isolated from the web page and has no DOM access
 * This makes it a secure place to store the master password
 */

/**
 * Function to set the master password in the service worker
 * @param password {string} The master password to set
 */
export const setMasterPasswordInServiceWorker = async (password: string) => {
    // Wait for the service worker to be ready
    const swRegistration = await navigator.serviceWorker.ready;

    // Set the master password in the service worker
    if (swRegistration.active) {
        swRegistration.active.postMessage({
            action: 'setPassword',
            password,
        });
    } else {
        console.error('Service Worker not controlling the page');
    }
};

/**
 * Function to retrieve the master password from the service worker
 * @returns {Promise<string>} The master password
 */
export const getMasterPasswordFromServiceWorker = async (): Promise<string> => {
    // Return a promise to get the master password from the service worker
    return new Promise(async (resolve, reject) => {
        // Wait for the service worker to be ready
        const swRegistration = await navigator.serviceWorker.ready;

        // Get the master password from the service worker
        if (swRegistration.active) {
            const messageChannel = new MessageChannel();
            messageChannel.port1.onmessage = (event: MessageEvent) => {
                if (event.data.error) {
                    reject(event.data.error);
                } else {
                    resolve(event.data.password);
                }
            };

            swRegistration.active.postMessage({ action: 'getPassword' }, [messageChannel.port2]);
        } else {
            reject('Service Worker not controlling the page');
        }
    });
};

/**
 * Function to remove the master password from the service worker (use when the user logs out)
 */
export const removeMasterPasswordFromServiceWorker = async () => {
    // Wait for the service worker to be ready  
    const swRegistration = await navigator.serviceWorker.ready;
    // Remove the master password from the service worker
    if (swRegistration.active) {
        swRegistration.active.postMessage({
            action: 'removePassword',
        });
    } else {
        console.error('Service Worker not controlling the page');
    }
};
