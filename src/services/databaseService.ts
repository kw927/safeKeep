import { PrismaClient } from '@prisma/client';
import { Folder } from '@prisma/client';
import { SideMenuFolder } from '@/types/Sidebar';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';
import { EncryptedFile } from '@/types/Crypto';
import { ValidationError } from '@/types/ValidationError'

const prisma = new PrismaClient();

// The type definition for PrismaClient for transactions
// Code adapted from: https://stackoverflow.com/questions/77209892/pass-prisma-transaction-into-a-function-in-typescript 
type PrismaTransactionClient = Omit<PrismaClient, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">

/**
 * Function to get the user from the database by email
 * @param email {string} The email of the user
 * @returns {Promise<User>} The prisma user object
 * */
export const getUserByEmail = async (email: string) => {
    // Get the user from the database
    const user = await prisma.user.findUnique({
        where: {
            email: email
        }
    });

    return user;
};

/**
 * Function to get an item by item id and user id
 * @param itemId {number} The item id
 * @param userId {number} The user id
 * @returns {Promise<Item>} The prisma item object
 */
export const getUserItemById = async (itemId: number, userId: number) => {
    // Get an item for the user
    const item = await prisma.item.findUnique({
        where: {
            item_id: itemId,
            user_id: userId,
            is_deleted: false
        },
        select: {
            item_id: true,
            name: true,
            description: true,
            data: true,
            is_favorite: true,
            created_at: true,
            updated_at: true,
            folder: {
                select: {
                    folder_id: true,
                    name: true,
                    parent_folder_id: true
                }
            },
            files: {
                select: {
                    file_id: true,
                    original_file_name: true,
                    original_file_type: true,
                    file_path: true
                }
            },
            item_tags: {
                select: {
                    tag: {
                        select: {
                            name: true
                        }
                    }
                }
            }
        }
    });

    return item;
}

/**
 * Function to get the items for the user in a folder
 * @param folderId {number} The folder id
 * @param userId {number} The user id
 * @returns {Promise<Item[]>} The prisma item objects
 */
export const getUserListItemsByFolderId = async (folderId: number, userId: number) => {
    // Get the items for the user in a folder
    const items = await prisma.item.findMany({
        where: {
            user_id: userId,
            folder_id: folderId,
            is_deleted: false
        },
        select: {
            item_id: true,
            name: true,
            description: true,
            is_favorite: true
        },
        orderBy: {
            name: 'asc'
        }
    });

    return items;
}

/**
 * Function to get the a folder from a user
 * @param folderId {number} The folder id
 * @param userId {number} The user id
 * @returns {Promise<Folder>} The prisma folder object
 */
export const getFolder = async (folderId: number, userId: number) => {
    // Get the folder for the user
    const folder = await prisma.folder.findUnique({
        where: {
            folder_id: folderId,
            user_id: userId
        }
    });

    return folder;
}

/**
 * Function to get the folders for a user
 * @param userId {number} The user id
 * @returns {Promise<SideMenuFolder[]>} The prisma folder objects
 */
export const getUserFolders = async (userId: number) => {
    // Get the folders for the user
    const folders = await prisma.folder.findMany({
        where: {
            user_id: userId,
        },
        orderBy: {
            name: 'asc'
        }
    });

    /**
     * Helper function to transform Folder to SideMenuFolder
     * @param folder {Folder} The prisma folder object
     * @returns {SideMenuFolder} The transformed folder object
     */
    const transformToSideMenuFolder = (folder: Folder): SideMenuFolder => ({
        folderId: folder.folder_id,
        name: folder.name,
        parent_folder_id: folder.parent_folder_id,
        subFolders: [],
    });

    /**
     * Helper function to build the folder tree
     * @param folders {Folder[]} The prisma folder objects
     * @returns {SideMenuFolder[]} The transformed folder objects
     */
    const buildFolderTree = (folders: Folder[]): SideMenuFolder[] => {
        // Create a map of folder_id to SideMenuFolder which can be accessed by the parent_folder_id
        const folderMap: { [key: number]: SideMenuFolder } = {};

        // Initialise each folder with a children array and add it to the map
        folders.forEach(folder => {
            folderMap[folder.folder_id] = transformToSideMenuFolder(folder);
        });

        // Organise folders by their parent
        const rootFolders: SideMenuFolder[] = [];

        folders.forEach(folder => {
            const sideMenuFolder = folderMap[folder.folder_id];

            if (folder.parent_folder_id && folder.parent_folder_id > 0 && folderMap[folder.parent_folder_id]) {
                folderMap[folder.parent_folder_id].subFolders.push(sideMenuFolder);
            } else {
                rootFolders.push(sideMenuFolder);
            }
        });

        return rootFolders;
    };

    // Construct the folder tree from the flat list of folders
    const folderTree = buildFolderTree(folders);

    return folderTree;
}

/**
 * Function to save the item to the database
 * Exported for testing
 * @param userId {number} The user id
 * @param name {string} The item name
 * @param description {string} The item description
 * @param data {string} The item data
 * @param folder {id: number, name: string, parent_folder_id: number} The folder object 
 * @param files {EncryptedFile[]} The encrypted files
 * @param tags {string[]} The tags
 */
export const saveItem = async (userId: number, name: string, description: string, data: string, folder: any, files: EncryptedFile[], tags: string[]) => {
    // Save the item to the database
    try {
        // Use a transaction to save the item and files to the database
        const result = await prisma.$transaction(async (tx) => {

            // Create the folder
            // Update the folder.id with the newly created folder id
            folder.id = await createFolder(tx, userId, folder);

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

            // Save the encrypted files
            await saveFiles(tx, files, item.item_id, userId);

            // Associate the tags with the item
            await associateTags(tx, tags, item.item_id);

            return item.item_id;
        });
    } catch (error) {
        console.log('Error saving the item:', error);
        throw new Error('Error saving the item');
    }
}

/**
 * Function to update the item
 * Exported for testing
 * @param method {string} The method to use (PUT, PATCH)
 * @param itemId {number} The item id
 * @param userId {number} The user id
 * @param name {string} The item name
 * @param description {string} The item description
 * @param data {string} The item data
 * @param folder {id: number, name: string, parent_folder_id: number} The folder object 
 * @param files {EncryptedFile[]} The encrypted files
 * @param tags {string[]} The tags
 * @returns 
 */
export const updateItem = async (method: string, itemId: number, userId: number, name: string, description: string, data: string, folder: any, files: EncryptedFile[], tags: string[]) => {
    // TODO: Implement PUT and PATCH methods for full and partial updates

    try {
        await prisma.$transaction(async (tx) => {
            // Create the folder
            // Update the folder.id with the newly created folder id
            folder.id = await createFolder(tx, userId, folder);

            // Update item basic information no matter if the data is changed or not for simplicity
            const updateData = { name, description, data, folder_id: folder.id, updated_at: new Date() };
            await tx.item.update({
                where: { item_id: itemId },
                data: updateData,
            });

            // Replacing all files for simplicity
            // Note: Or check if the submitted files are different from the existing files and only update the difference, but it is more complex

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
            await associateTags(tx, tags, itemId);
        });

        return true;
    } catch (error) {
        console.error('Error updating the item:', error);
        throw new ValidationError('Internal server error', 500);
    }
}

/**
 * Function to create a new folder
 * @param tx {PrismaTransactionClient} The prisma transaction client {PrismaClient}
 * @param userId {number} The user id
 * @param folder {id: number, name: string, parent_folder_id: number} The folder object
 * @returns {Promise<number>} The folder id
 */
export const createFolder = async (tx: PrismaTransactionClient, userId: number, folder: any) => {
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

        return newFolder.folder_id;
    }

    return folder.id;
}

/**
 * Function to save the files to the database and local storage
 * @param tx {PrismaTransactionClient} The prisma transaction client {PrismaClient}
 * @param files {EncryptedFile[]} The encrypted files
 * @param itemId {number} The item id
 * @param userId {number} The user id
 */
export const saveFiles = async (tx: PrismaTransactionClient, files: EncryptedFile[], itemId: number, userId: number) => {
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

/**
 * Function to associate the tags with the item
 * Exported for testing
 * @param tx {PrismaTransactionClient} The prisma transaction client {PrismaClient}
 * @param tags {string[]} The tags
 * @param itemId {number} The item id
 */
export const associateTags = async (tx: PrismaTransactionClient, tags: string[], itemId: number) => {
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