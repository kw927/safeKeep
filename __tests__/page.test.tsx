import { render, waitFor } from '@testing-library/react';
import Home from '../src/app/page';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

// Mocks the libraries
jest.mock('next-auth/react');
jest.mock('next/navigation', () => ({
    useRouter: jest.fn(),
}));

/**
 * Function to mock the service worker registration process
 * @param success {Boolean}
 */
const mockServiceWorkerRegistration = (success = true) => {
    Object.defineProperty(navigator, 'serviceWorker', {
        writable: true,
        value: {
            register: jest.fn().mockImplementation(() =>
                success
                    ? Promise.resolve({ scope: 'mockScope' })
                    : Promise.reject(new Error('Service Worker Registration Failed'))
            ),
        },
    });
};

/**
 * Test suite for the Home page
 */
describe('Home Page', () => {
    // Mock useRouter
    const push = jest.fn();
    beforeEach(() => {
        (useRouter as jest.Mock).mockReturnValue({ push });
    });

    // Clear mocks after each test
    afterEach(() => {
        jest.clearAllMocks();
    });

    it('redirects to login when not authenticated and service worker is ready', async () => {
        // Mock useSession to simulate not being authenticated
        (useSession as jest.Mock).mockReturnValue({ data: null });

        // Mock successful service worker registration
        mockServiceWorkerRegistration(true);

        render(<Home />);

        await waitFor(() => expect(push).toHaveBeenCalledWith('/login'));
    });

    it('redirects to home when authenticated and service worker is ready', async () => {
        // Mock useSession to simulate being authenticated
        (useSession as jest.Mock).mockReturnValue({ data: { user: { name: 'John Doe' } } });

        // Mock successful service worker registration
        mockServiceWorkerRegistration(true);

        render(<Home />);

        await waitFor(() => expect(push).toHaveBeenCalledWith('/home'));
    });
});
