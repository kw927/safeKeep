import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { validatePassword, validateEmail } from '@/utils/userAccountUtils';

const prisma = new PrismaClient();

/**
 * The signup API for POST requests
 * @param req
 * @returns 
 */
const Signup = async (req: NextRequest) => {
    // Check if the request method is POST
    if (req.method !== 'POST') {
        console.log(req.method)
        return NextResponse.json({ message: 'Method not allowed' }, { status: 405 });
    }

    try {
        // Parse the request body and validate
        const body = await req.json();
        
        if (!body) {
            return NextResponse.json({ message: 'Bad request' }, { status: 400 });
        }

        // Get the user data from the request body
        const { firstName, lastName, email, password } = body;

        // Check if the required fields are submitted
        if (!firstName || !lastName || !email || !password) {
            return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
        }

        // Check if the first name and last name are not empty and within the length limit
        if (firstName.length < 1 || firstName.length > 50 || lastName.length < 1 || lastName.length > 50) {
            return NextResponse.json({ message: 'First name and last name must be between 1 and 50 characters' }, { status: 400 });
        }

        // Check if the email is valid
        if (!validateEmail(email)) {
            return NextResponse.json({ message: 'Invalid email' }, { status: 400 });
        }

        // Check if the password meets the password policy
        const validatePasswordResult = validatePassword(password);
        if (!validatePasswordResult.isValid) {
            return NextResponse.json({ message: validatePasswordResult.message }, { status: 400 });
        }

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email }
        });

        if (existingUser) {
            return NextResponse.json({ message: 'User already exists' }, { status: 409 });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create the user in the database
        const user = await prisma.user.create({
            data: {
                first_name: firstName,
                last_name: lastName,
                email,
                password_hash: hashedPassword,
                created_at: new Date(),
                updated_at: new Date(),
            },
        });

        // Return the newly created user (excluding the password)
        const { password_hash: _, ...userWithoutPassword } = user;
        return NextResponse.json(userWithoutPassword, { status: 200 });
    } catch (error) {
        console.error('Signup error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
};

export { Signup as POST }