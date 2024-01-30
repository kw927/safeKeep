import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

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
        // Get the user data from the request body
        const { firstName, lastName, email, password } = await req.json();

        // Check if the required fields are submitted
        if (!firstName || !lastName || !email || !password) {
            return NextResponse.json({ message: 'Missing required fields' }), { status: 400 };
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