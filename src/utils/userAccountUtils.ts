import { getServerSession } from 'next-auth/next';
import { getUserByEmail } from '@/services/databaseService';

/**
 * Function to validate the password strength
 * @param password {string}
 * @returns {isValid: boolean, message: string}
 */
export const validatePassword = (password: string) => {
    const requirements = [
        { regex: /.{12,}/, message: 'Password must be at least 12 characters long.' },
        { regex: /[A-Z]/, message: 'Password must contain at least one uppercase letter.' },
        { regex: /[a-z]/, message: 'Password must contain at least one lowercase letter.' },
        { regex: /[0-9]/, message: 'Password must contain at least one number.' },
        { regex: /[\!\@\#\$\%\^\&\*\(\)\_\+\-\=\[\]\{\}\|\;\:\'\"\<\>\,\.\?\/]/, message: 'Password must contain at least one special character.' },
    ];

    for (let i = 0; i < requirements.length; i++) {
        if (!requirements[i].regex.test(password)) {
            return {
                isValid: false,
                message: requirements[i].message,
            };
        }
    }

    return {
        isValid: true,
        message: 'Password is valid',
    };
};

/**
 * Function to validate the email
 * @param email {string} The email to validate
 * @returns {boolean} True if the email is valid, false otherwise
 */
export const validateEmail = (email: string) => {
    // Check if the email is valid
    // The regex is from https://uibakery.io/regex-library/email
    const emailRegex =
        /^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/;
    return emailRegex.test(email);
};

/**
 * Function to get the user from the next auth session
 * @returns {User | null} The user or null if the user is not found
 */
export const getUserFromSession = async () => {
    const session = await getServerSession();

    if (!session?.user?.email) {
        console.error('No session or user email found');
        return null;
    }

    const user = await getUserByEmail(session.user.email);
    if (!user) {
        console.error('No user found with the email from session');
        return null;
    }

    return user;
};
