import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getUserFolders } from '@/services/databaseService';
import { getUserFromSession } from '@/utils/userSessionUtils';

const prisma = new PrismaClient();

/**
 * Function to get the menu data for the user
 */
const GetMenuData = async (req: NextRequest, res: NextResponse) => {
    // Only allow GET requests
    if (req.method !== 'GET') {
        return NextResponse.json({ message: 'Method not allowed' }, { status: 405 });
    }

    const user = await getUserFromSession();

    if (!user) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Get the user menu data
    try {
        const folders = await getUserFolders(user.user_id);
        return NextResponse.json({ message: 'User menu data', folders: folders }, { status: 200 });
    } catch (error) {
        console.error('Error getting menu data', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
};

export { GetMenuData as GET };
