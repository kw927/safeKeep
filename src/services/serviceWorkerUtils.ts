// Function to set the master password in the service worker
export const setMasterPasswordInServiceWorker = (password: string) => {
    if (navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
            action: 'setPassword',
            password
        });
    }
}

// Function to retrieve the master password from the service worker
export const getMasterPasswordFromServiceWorker = (): Promise<string> => {
    return new Promise((resolve, reject) => {
        if (navigator.serviceWorker.controller) {
            const messageChannel = new MessageChannel();
            messageChannel.port1.onmessage = (event: MessageEvent) => {
                if (event.data.error) {
                    reject(event.data.error);
                } else {
                    resolve(event.data.password);
                }
            };

            navigator.serviceWorker.controller.postMessage({ action: 'getPassword' }, [messageChannel.port2]);
        } else {
            reject('Service Worker not available');
        }
    });
}
