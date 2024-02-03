import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { PrismaClient } from '@prisma/client';
import { EncryptedFile } from '@/types/Crypto';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';

const prisma = new PrismaClient();

const NewItem = async (req: NextRequest, res: NextResponse) => {
    // Only allow POST requests
    if (req.method !== 'POST') {
        return NextResponse.json({ message: 'Method not allowed' }, { status: 405 });
    }

    // Check if the user is authenticated
    const session = await getServerSession();

    if (!session?.user?.email) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Get the user from the database
    const user = await prisma.user.findUnique({
        where: {
            email: session.user.email
        }
    });

    // Check if the user exists
    if (!user) {
        return NextResponse.json({ message: 'User not found' }, { status: 401 });
    }

    // Check if the required fields are submitted
    const { name, description, data, files, folder, tags } = await req.json();

    if (!name) {
        return NextResponse.json({ message: 'Name is required' }, { status: 400 });
    }

    if (!data) {
        return NextResponse.json({ message: 'Data is required' }, { status: 400 });
    }

    // Check if the folder is valid
    if (!folder) {
        return NextResponse.json({ message: 'Invalid folder' }, { status: 400 });
    }

    try {
        // Check if user has selected a parent folder
        if (folder?.parent_folder_id > 0) {
            const parentFolder = await prisma.folder.findUnique({
                where: {
                    folder_id: folder.parent_folder_id
                }
            });

            if (!parentFolder) {
                return NextResponse.json({ message: 'Parent folder not found' }, { status: 400 });
            }
        } else if (folder?.parent_folder_id < 0) {
            // Parent folder id will not be less than 0
            return NextResponse.json({ message: 'Parent folder is invalid' }, { status: 400 });
        }
    } catch (error) {
        console.error('Error checking parent folder:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }

    // Save the item to the database
    try {
        let itemId = 0;
        // Use a transaction to save the item and files to the database
        const result = await prisma.$transaction(async (prisma) => {
            // Create new folder if folderId is -1
            if (folder.id === -1) {
                // Check if the folder name is submitted
                if (!folder?.name) {
                    throw new Error('Folder name is required');
                }

                // Create the folder
                const newFolder = await prisma.folder.create({
                    data: {
                        user_id: user.user_id,
                        name: folder.name,
                        parent_folder_id: folder.parent_folder_id,
                        created_at: new Date(),
                        updated_at: new Date(),
                    },
                });

                // Update the folder.id with the newly created folder id
                folder.id = newFolder.folder_id;
            }

            // Create the item
            const item = await prisma.item.create({
                data: {
                    name,
                    description,
                    data,
                    folder: {
                        connect: { folder_id: folder.id },
                    },
                    is_favorite: false,
                    is_deleted: false,
                    created_at: new Date(),
                    updated_at: new Date(),
                    user: {
                        connect: { user_id: user.user_id },
                    },
                },
            });

            // Save the item id to the variable
            itemId = item.item_id;

            // Save the files
            // The path to save the files {project directory}/encryptedfiles/{userId}/{fileName}.safekeep
            const baseDir = path.resolve(__dirname, '../../../../../', 'encryptedfiles');

            // Since the user_id is a number, convert it to a string
            const userId = user.user_id.toString();

            // Combine the base directory with the user id
            const userDir = path.join(baseDir, userId);

            // Create the directory if it doesn't exist
            if (!fs.existsSync(userDir)) {
                fs.mkdirSync(userDir, { recursive: true });
            }

            // Use map to allow parallel file creations
            const fileCreations = files.map(async (file: EncryptedFile) => {
                // Convert the encrypted data to a JSON string
                const encryptedDataString = JSON.stringify(file);

                // Generate a unique file name using uuid
                const fileName = uuidv4() + '.safekeep';
                const filePath = path.join(userDir, fileName);

                // Save the file to local storage
                fs.writeFileSync(filePath, encryptedDataString);

                // Create the record in the database
                await prisma.file.create({
                    data: {
                        item: {
                            connect: { item_id: item.item_id },
                        },
                        original_file_name: file.filename,
                        original_file_type: file.filetype,
                        file_path: filePath,
                        salt: file.salt,
                    },
                })
            });

            // Await all the file creations
            await Promise.all(fileCreations);

            // Convert the tags to lowercase and trim whitespace from the beginning and end
            const lowercaseTags = await tags.map((tag: string) => tag.toLowerCase().trim());

            // Filter out duplicate tags
            const uniqueTags: string[] = Array.from(new Set(lowercaseTags));

            // Create the tags
            const tagLinks = uniqueTags.map(async (tagName: string) => {
                // Check if the tag exists
                let tag = await prisma.tag.findUnique({
                    where: { name: tagName },
                });

                // Create the tag if it doesn't exist
                if (!tag) {
                    tag = await prisma.tag.create({
                        data: { name: tagName },
                    });
                }

                // Create the record to the junction table
                return prisma.itemTag.create({
                    data: {
                        item: {
                            connect: { item_id: item.item_id },
                        },
                        tag: {
                            connect: { tag_id: tag.tag_id },
                        }
                    },
                });
            });

            // Await all the tag links creations
            await Promise.all(tagLinks);
        });

        // Return the success message
        return NextResponse.json({ message: 'Item saved successfully', itemId }, { status: 200 });
    } catch (error) {
        console.error('Error saving the item:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}

export { NewItem as POST }