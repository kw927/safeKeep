import { NextRequest, NextResponse } from 'next/server';
import { removeTestUser } from '@/utils/testUtils';

/**
 * The API for creating a test user for cypress tests
 */
const RemoveTestUser = async (req: NextRequest, res: NextResponse) => {
    // Check if ther server is running in development mode
    if (process.env.NODE_ENV !== 'development') {
        return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    // Check if the request method is DELETE
    if (req.method !== 'DELETE') {
        return NextResponse.json({ message: 'Method not allowed' }, { status: 405 });
    }

    // get the test user email from the request body
    const body = await req.json();

    if (!body) {
        return NextResponse.json({ message: 'Bad request' }, { status: 400 });
    }

    const { email } = body;

    if (!email) {
        return NextResponse.json({ message: 'Email is required' }, { status: 400 });
    }

    // Remove the test user from the database
    await removeTestUser(email);

    // Return success
    return NextResponse.json({ message: 'The test user has been removed' }, { status: 200 });
};

export { RemoveTestUser as DELETE };
