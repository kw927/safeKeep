import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

/**
 * The login API for POST requests
 * @param email {string} The email of the user
 * @param password {string} The password of the user
 * @returns
 */
const Login = async (req: NextRequest, res: NextResponse) => {
    // Check if the request method is POST
    if (req.method !== 'POST') {
        return NextResponse.json({ message: 'Method not allowed' }, { status: 405 });
    }

    // Parse the request body and validate
    const body = await req.json();
    if (!body) {
        return NextResponse.json({ message: 'Bad request' }, { status: 400 });
    }

    // Get the email and password from the request body
    const { email, password } = body;

    // Check if the user is authenticated
    const session = await getServerSession();

    if (session?.user?.email) {
        return NextResponse.json({ message: 'User has already logged in' }, { status: 401 });
    }

    // Check if the required fields are submitted
    if (!email || !password) {
        return NextResponse.json({ message: 'Email and password are required' }, { status: 400 });
    }

    // Get the user from the database
    const user = await prisma.user.findUnique({
        where: {
            email: email,
        },
    });

    // Check if the user exists
    if (!user) {
        return NextResponse.json({ message: 'Email or password incorrect' }, { status: 401 });
    }

    // Check if the password matches
    const isValid = await bcrypt.compare(password, user.password_hash);

    if (!isValid) {
        return NextResponse.json({ message: 'Email or password incorrect' }, { status: 401 });
    }

    return NextResponse.json({ message: 'success', totpEnabled: user.totp_enabled, userId: user.user_id }, { status: 200 });
};

export { Login as POST };
