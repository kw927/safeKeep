import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { EncryptedFile } from '@/types/Crypto';
import { ValidationError } from '@/types/ValidationError';
import { getUserFromSession } from '@/utils/userAccountUtils';
import { saveItem, updateItem } from '@/services/databaseService';

const prisma = new PrismaClient();

// The type definition for PrismaClient for transactions
// Code adapted from: https://stackoverflow.com/questions/77209892/pass-prisma-transaction-into-a-function-in-typescript
type PrismaTransactionClient = Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>;

/**
 * POST request to save a new item
 * @param name {string} The name of the item
 * @param description {string} The description of the item
 * @param data {string} The encrypted data of the item
 * @param files {EncryptedFile[]} The encrypted files of the item
 * @param folder {{ id: number; name: string; parent_folder_id: number }} The folder of the item
 * @param tags {string[]} The tags of the item
 */
const NewItem = async (req: NextRequest, res: NextResponse) => {
    // Only allow POST requests
    if (req.method !== 'POST') {
        return NextResponse.json({ message: 'Method not allowed' }, { status: 405 });
    }

    // Parse the request body and validate
    const body = await req.json();

    if (!body) {
        return NextResponse.json({ message: 'Bad request' }, { status: 400 });
    }

    // Get the data from the request body
    const { name, description, data, files, folder, tags } = body;

    try {
        // Check if the user is authenticated
        const user = await getUserFromSession();

        if (!user) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        // Validate the user input
        await validateUserInput(name, description, data, files, folder, tags);

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
};

/**
 * PUT and PATCH request to edit an item
 * @param itemId {number} The id of the item
 * @param name {string} The name of the item
 * @param description {string} The description of the item
 * @param data {string} The encrypted data of the item
 * @param files {EncryptedFile[]} The encrypted files of the item
 * @param folder {{ id: number; name: string; parent_folder_id: number }} The folder of the item
 * @param tags {string[]} The tags of the item
 * @returns
 */
const EditItem = async (req: NextRequest, res: NextResponse) => {
    // Only allow PUT and PATCH requests
    if (req.method !== 'PUT' && req.method !== 'PATCH') {
        return NextResponse.json({ message: 'Method not allowed' }, { status: 405 });
    }

    // Parse the request body and validate
    const body = await req.json();

    if (!body) {
        return NextResponse.json({ message: 'Bad request' }, { status: 400 });
    }

    // Get the data from the request body
    const { itemId, name, description, data, files, folder, tags } = body;

    try {
        // Check if the user is authenticated
        const user = await getUserFromSession();

        if (!user) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        // Validate the item
        const item = await validateItem(itemId, user.user_id);

        // Validate the user input
        await validateUserInput(name, description, data, files, folder, tags);

        // Update the item in the database
        const result = await updateItem(req.method, itemId, user.user_id, name, description, data, folder, files, tags);
    } catch (error) {
        if (error instanceof ValidationError) {
            return NextResponse.json({ message: error.message }, { status: error.statusCode });
        } else {
            console.error('Error updating the item:', error);
            return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
        }
    }

    return NextResponse.json({ message: 'Item saved updated' }, { status: 200 });
};

/**
 * Function to check if the item exists
 * Exported for testing
 * @param itemId {number} The item id
 * @param userId {number} The user id
 * @returns {Promise} The item from the database
 */
const validateItem = async (itemId: number, userId: number) => {
    // Get the item from the database
    const item = await prisma.item.findUnique({
        where: {
            item_id: itemId,
            user_id: userId,
            is_deleted: false,
        },
    });

    // Check if the item exists
    if (!item) {
        throw new ValidationError('Item not found', 404);
    }

    return item;
};

/**
 * Function to validate the user input
 * Exported for testing
 * @param name {string} The name of the item
 * @param description {string} The description of the item
 * @param data {string} The data of the item
 * @param files {EncryptedFile[]} The files of the item
 * @param folder {{ id: number; name: string; parent_folder_id: number }} The folder of the item
 * @param tags {string[]} The tags of the item
 */
export const validateUserInput = async (
    name: string,
    description: string,
    data: string,
    files: EncryptedFile[],
    folder: { id: number; name: string; parent_folder_id: number },
    tags: string[]
) => {
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
                    folder_id: folder.parent_folder_id,
                },
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
};

export { NewItem as POST };
export { EditItem as PUT };
export { EditItem as PATCH };
