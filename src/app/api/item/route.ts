import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { PrismaClient } from '@prisma/client';
import { EncryptedFile } from '@/types/Crypto';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';
import { ValidationError } from '@/types/ValidationError'

const prisma = new PrismaClient();

// The type definition for PrismaClient for transactions
// Code adapted from: https://stackoverflow.com/questions/77209892/pass-prisma-transaction-into-a-function-in-typescript 
type PrismaTransactionClient = Omit<PrismaClient, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">

const NewItem = async (req: NextRequest, res: NextResponse) => {
    // Only allow POST requests
    if (req.method !== 'POST') {
        return NextResponse.json({ message: 'Method not allowed' }, { status: 405 });
    }
    // Get the data from the request body
    const { name, description, data, files, folder, tags } = await req.json();

    try {
        // Check if the user is authenticated
        const user = await validUserSession();

        // Validate the user input
        await validUserInput(name, description, data, files, folder, tags);

        // Save the item to the database
        const itemId = await saveItem(user.user_id, name, description, data, folder, files, tags);

        return NextResponse.json({ message: 'Item saved successfully', itemId }, { status: 200 });
    } catch (error) {
        if (error instanceof ValidationError) {
            return NextResponse.json({ message: error.message }, { status: error.statusCode });
        } else {
            console.error('Error saving the item:', error);
            return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
        }
    }
}

const EditItem = async (req: NextRequest, res: NextResponse) => {
    // Only allow PUT and PATCH requests
    if (req.method !== 'PUT' && req.method !== 'PATCH') {
        return NextResponse.json({ message: 'Method not allowed' }, { status: 405 });
    }

    // Get the data from the request body
    const { itemId, name, description, data, files, folder, tags } = await req.json();

    try {
        // Check if the user is authenticated
        const user = await validUserSession();

        // Valid the item
        const item = await validItem(itemId, user.user_id);

        // Validate the user input
        await validUserInput(name, description, data, files, folder, tags);

        // Update the item in the database
        const result = await updateItem(req.method, itemId, user.user_id, name, description, data, folder, files, tags);

    } catch (error) {
        if (error instanceof ValidationError) {
            return NextResponse.json({ message: error.message }, { status: error.statusCode });
        } else {
            console.error('Error saving the item:', error);
            return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
        }
    }

    return NextResponse.json({ message: 'Item saved updated' }, { status: 200 });
}

const validUserSession = async () => {
    // Check if the user is authenticated
    const session = await getServerSession();

    if (!session?.user?.email) {
        throw new ValidationError('Unauthorized', 401);
    }

    // Get the user from the database
    const user = await prisma.user.findUnique({
        where: {
            email: session.user.email
        }
    });

    // Check if the user exists
    if (!user) {
        throw new ValidationError('User not found', 401);
    }

    return user;
}

const validItem = async (itemId: number, userId: number) => {
    // Get the item from the database
    const item = await prisma.item.findUnique({
        where: {
            item_id: itemId,
            user_id: userId,
            is_deleted: false
        }
    });

    // Check if the item exists
    if (!item) {
        throw new ValidationError('Item not found', 404);
    }

    return item;
}

const validUserInput = async (name: string, description: string, data: string, files: EncryptedFile[], folder: { id: number, name: string, parent_folder_id: number }, tags: string[]) => {
    // Check if the required fields are submitted
    if (!name) {
        throw new ValidationError('Name is required', 400);
    }

    if (!data) {
        throw new ValidationError('Data is required', 400);
    }

    // Check if the folder is valid
    if (!folder) {
        throw new ValidationError('Folder is required', 400);
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
                throw new ValidationError('Parent folder is invalid', 400);
            }
        } else if (folder?.parent_folder_id < 0) {
            // Parent folder id will not be less than 0
            throw new ValidationError('Parent folder is invalid', 400);
        }
    } catch (error) {
        console.error('Error checking parent folder:', error);
        throw new ValidationError('Internal server error', 500);
    }

    // Check if description is less than 5000 characters if submitted
    if (description && description.length > 5000) {
        throw new ValidationError('Description is too long', 400);
    }

    // Check if each single file is within 10MB if submitted
    if (files) {
        for (let file of files) {
            // 10MB = 10 * 1024 * 1024 = 10485760 bytes
            if (file.ciphertext.length > 10 * 1024 * 1024) {
                throw new ValidationError(`File: ${file.filename} is larger than 10MB`, 400);
            }
        }
    }

    // Check if each tag is less than or equal to 191 characters if submitted
    if (tags) {
        for (let tag of tags) {
            if (tag.length > 191) {
                throw new ValidationError(`Tag: ${tag} is too long`, 400);
            }
        }
    }
}

const saveItem = async (userId: number, name: string, description: string, data: string, folder: any, files: EncryptedFile[], tags: string[]) => {
    // Save the item to the database
    try {
        let itemId = 0;
        // Use a transaction to save the item and files to the database
        const result = await prisma.$transaction(async (tx) => {
            // Create new folder if folderId is -1
            if (folder.id === -1) {
                // Check if the folder name is submitted
                if (!folder?.name) {
                    throw new Error('Folder name is required');
                }

                // Create the folder
                const newFolder = await tx.folder.create({
                    data: {
                        user_id: userId,
                        name: folder.name,
                        parent_folder_id: folder.parent_folder_id,
                        created_at: new Date(),
                        updated_at: new Date(),
                    },
                });

                // Update the folder.id with the newly created folder id
                folder.id = newFolder.folder_id;

                console.log(folder.id);
            }

            // Create the item
            const item = await tx.item.create({
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
                        connect: { user_id: userId },
                    },
                },
            });

            // Save the files
            await saveFiles(tx, files, item.item_id, userId);

            // Associate the tags
            await associateTags(tx, tags, item.item_id);

            return item.item_id;
        });
    } catch (error) {
        throw new Error('Error saving the item');
    }
}

const updateItem = async (method: string, itemId: number, userId: number, name: string, description: string, data: string, folder: any, files: EncryptedFile[], tags: string[]) => {
    // TODO: Implement PUT and PATCH methods for full and partial updates

    try {
        await prisma.$transaction(async (tx) => {
            // Update item basic information no matter if the data is changed or not for simplicity
            const updateData = { name, description, data, folder_id: folder.id, updated_at: new Date() };
            await tx.item.update({
                where: { item_id: itemId },
                data: updateData,
            });

            // Replacing all files for simplicity
            // Note: Or we can check if the submitted files are different from the existing files and only update the difference, but it is more complex

            // Remove existing files associated with the item
            const existingFiles = await tx.file.findMany({
                where: { item_id: itemId },
            });

            existingFiles.forEach(async (file) => {
                // Check if the file exists
                if (fs.existsSync(file.file_path)) {
                    // Delete the file from storage
                    fs.unlinkSync(file.file_path);
                }

                // Delete the record from the database
                await tx.file.delete({ where: { file_id: file.file_id } });
            });

            // Save the files
            await saveFiles(tx, files, itemId, userId);

            // Replacing all tags for simplicity
            // Remove existing tag associations
            await prisma.itemTag.deleteMany({
                where: { item_id: itemId },
            });

            // Add new tag associations
            // Associate the tags
            await associateTags(tx, tags, itemId);
        });

        return { message: 'Item updated successfully' };
    } catch (error) {
        console.error('Error updating the item:', error);
        throw new ValidationError('Internal server error', 500);
    }
}

const saveFiles = async (tx: PrismaTransactionClient, files: EncryptedFile[], itemId: number, userId: number) => {
    // Save the files
    // The path to save the files {project directory}/encryptedfiles/{userId}/{fileName}.safekeep
    const baseDir = path.resolve(__dirname, '../../../../../', 'encryptedfiles');
    
    // Combine the base directory with the user id
    const userDir = path.join(baseDir, userId.toString());
    
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
        try {
            await tx.file.create({
                data: {
                    item: {
                        connect: { item_id: itemId },
                    },
                    original_file_name: file.filename,
                    original_file_type: file.filetype,
                    file_path: filePath,
                    salt: file.salt,
                },
            });
        } catch (error) {
            console.error('Error saving file:', error);
            throw new Error('Error saving the file');
        }
    });

    // Await all the file creations
    await Promise.all(fileCreations);
}

const associateTags = async (tx: PrismaTransactionClient, tags: string[], itemId: number) => {
    // Convert the tags to lowercase and trim whitespace from the beginning and end
    const lowercaseTags = await tags.map((tag: string) => tag.toLowerCase().trim());

    // Filter out duplicate tags
    const uniqueTags: string[] = Array.from(new Set(lowercaseTags));

    const tagLinks = uniqueTags.map(async (tagName: string) => {
        // Check if the tag exists
        let tag = await tx.tag.findUnique({
            where: { name: tagName },
        });

        // Create the tag if it doesn't exist
        if (!tag) {
            tag = await tx.tag.create({
                data: { name: tagName },
            });
        }

        // Create the record to the junction table
        return tx.itemTag.create({
            data: {
                item: {
                    connect: { item_id: itemId },
                },
                tag: {
                    connect: { tag_id: tag.tag_id },
                }
            },
        });
    });

    // Await all the tag links creations
    await Promise.all(tagLinks);
}

export { NewItem as POST }
export { EditItem as PUT }
export { EditItem as PATCH }