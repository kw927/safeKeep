import { NextRequest, NextResponse } from 'next/server';
import { generateTestUser, createTestUser } from '@/utils/testUtils';

/**
 * The API for creating a test user for cypress tests
 */
const CreateTestUser = async (req: NextRequest, res: NextResponse) => {
    // Check if ther server is running in development mode
    if (process.env.NODE_ENV !== 'development') {
        return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    // Check if the request method is POST
    if (req.method !== 'POST') {
        return NextResponse.json({ message: 'Method not allowed' }, { status: 405 });
    }

    // Generate a test user
    const testUser = generateTestUser();

    // Create the test user in the database
    const userId = await createTestUser(testUser);

    // Return the test user
    return NextResponse.json({ message: 'The test user has been created', user: testUser }, { status: 200 });
};

export { CreateTestUser as POST };
