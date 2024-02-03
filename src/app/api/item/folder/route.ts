import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { PrismaClient } from '@prisma/client';
import { Folder } from '@prisma/client';
import { ComboboxFolder } from '@/types/Item';
import { FolderHierarchy } from '@/types/Folder';

const prisma = new PrismaClient();

/**
 * API endpoint to get the folders for the user
 * @param req 
 * @param res 
 * @returns 
 */
const GetFolders = async (req: NextRequest, res: NextResponse) => {
    // Only allow GET requests
    if (req.method !== 'GET') {
        return NextResponse.json({ message: 'Method not allowed' }, { status: 405 });
    }

    // Check if the user is authenticated
    const session = await getServerSession();
    
    if (!session?.user?.email) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Check if the user exists in the database
    try {
        const user = await prisma.user.findUnique({
            where: {
                email: session.user.email
            }
        });

        if (!user) {
            return NextResponse.json({ message: 'User not found' }, { status: 401 });
        }

        // Get the folders for the user
        const folders = await prisma.folder.findMany({
            where: {
                user_id: user.user_id
            },
            orderBy: {
                name: 'asc'
            }
        });

        // Build the folder hierarchy
        const folderHierarchy = buildFolderHierarchy(folders);

        return NextResponse.json({ message: 'success', folders: folderHierarchy.folders, rootFolders: folderHierarchy.rootFolders }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ message: 'Failed to get user' }, { status: 500 });
    }
}

const buildFolderHierarchy = (folders: Folder[]): FolderHierarchy => {
    let folderMap = new Map<number, Folder>(folders.map(folder => [folder.folder_id, folder]));

    // Build the root folders array
    let rootFolders: ComboboxFolder[] = folders
        .filter(folder => folder.parent_folder_id === 0 || folder.parent_folder_id == null)
        .map(convertToComboboxFolder);

    // Clone the root folders array to hierarchicalFolders
    let hierarchicalFolders: ComboboxFolder[] = rootFolders.map(folder => Object.assign({}, folder));

    hierarchicalFolders.forEach(folder => {
        addChildFolders(folder, "-", folders, folderMap, hierarchicalFolders);
    });

    return { folders: hierarchicalFolders, rootFolders };
}

// Recursively add child folders
const addChildFolders = (parentFolder: ComboboxFolder, prefix: string, folders: Folder[], folderMap: Map<number, Folder>, allFolders: ComboboxFolder[]) => {
    folders.forEach(folder => {
        if (folder.parent_folder_id === parentFolder.id) {
            const childFolder = convertToComboboxFolder(folder);
            childFolder.name = prefix + childFolder.name; // Prefix the name
            allFolders.push(childFolder);
            addChildFolders(childFolder, prefix + "-", folders, folderMap, allFolders);
        }
    });
};

// Helper function to convert Folder to ComboboxFolder
const convertToComboboxFolder = (folder: Folder): ComboboxFolder => {
    return {
        id: folder.folder_id,
        name: folder.name,
        parent_folder_id: folder.parent_folder_id ?? 0 // or handle null as you prefer
    };
};

export { GetFolders as GET }