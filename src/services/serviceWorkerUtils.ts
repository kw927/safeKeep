// Function to set the master password in the service worker
export const setMasterPasswordInServiceWorker = async (password: string) => {
    const swRegistration = await navigator.serviceWorker.ready;
    if (swRegistration.active) {
        swRegistration.active.postMessage({
            action: 'setPassword',
            password,
        });
    } else {
        console.error('Service Worker not controlling the page');
    }
};

// Function to retrieve the master password from the service worker
export const getMasterPasswordFromServiceWorker = async (): Promise<string> => {
    return new Promise(async (resolve, reject) => {
        const swRegistration = await navigator.serviceWorker.ready;
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

// Function to remove the master password from the service worker
export const removeMasterPasswordFromServiceWorker = async () => {
    const swRegistration = await navigator.serviceWorker.ready;
    if (swRegistration.active) {
        swRegistration.active.postMessage({
            action: 'removePassword',
        });
    } else {
        console.error('Service Worker not controlling the page');
    }
};
