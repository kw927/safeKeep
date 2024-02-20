import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getUserFromSession } from '@/utils/userAccountUtils';
import { buildFolderHierarchy } from '@/utils/folderUtils';

const prisma = new PrismaClient();

/**
 * API endpoint to get the folders for the user
 */
const GetFolders = async (req: NextRequest, res: NextResponse) => {
    // Only allow GET requests
    if (req.method !== 'GET') {
        return NextResponse.json({ message: 'Method not allowed' }, { status: 405 });
    }

    // Get the user from the session
    const user = await getUserFromSession();

    if (!user) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Check if the user exists in the database
    try {
        // Get the folders for the user
        const folders = await prisma.folder.findMany({
            where: {
                user_id: user.user_id,
            },
            orderBy: {
                name: 'asc',
            },
        });

        // Build the folder hierarchy
        const folderHierarchy = buildFolderHierarchy(folders);

        return NextResponse.json({ message: 'success', folders: folderHierarchy.folders, rootFolders: folderHierarchy.rootFolders }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ message: 'Failed to get user' }, { status: 500 });
    }
};

export { GetFolders as GET };
