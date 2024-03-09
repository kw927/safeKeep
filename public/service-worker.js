let masterPassword = null;

self.addEventListener('message', (event) => {
    if (event.data.action === 'setPassword') {
        masterPassword = event.data.password;
    } else if (event.data.action === 'getPassword') {
        event.ports[0].postMessage({ password: masterPassword });
    } else if (event.data.action === 'removePassword') {
        masterPassword = null;
    }
});
