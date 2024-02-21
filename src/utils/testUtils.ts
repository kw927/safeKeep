import { TestUser } from '@/types/User';
import { TestItem } from '@/types/Item';
import { PrismaClient } from '@prisma/client';
import { saveItem } from '@/services/databaseService';
import path from 'path';

// This should be replaced with the actual test user's ID after creation
const testUserId = 1;

// Directory for test files
export const testFilesDirectory = path.join(__dirname, 'testFiles');

// A static test user
export const testUser: TestUser = {
    first_name: 'Test',
    last_name: 'User',
    email: 'test.user@safekeep.com',
    password_hash: '$2a$10$KlJHEOfucMDQZdaDFuXCfemivqT6ZZNBGSI/5WvprhRDZKuH.VZsW',
    password: 'Ab1234567890!',
    totp_secret: 'JEXUU2IEJYQESEQM',
    encrypted_totp_secret: '3ef629331641a35e7cc84bbf896b9e3eU2FsdGVkX18bJRZdF1YQTI2Wvj21k9vLUVcxWnhxFPTkefd2xkIB0jrbRyOf9/bM',
};

// A static test item
export const testItem = {
    name: 'Test Item 00000001',
    description: 'This is a test item',
    data: 'Test data',
    user_id: testUserId,
    folder: {
        id: -1,
        name: 'Test Folder 00000001',
        parent_folder_id: 0,
    },
    tags: ['Test Tag 00000001', 'Test Tag 00000002', 'Test Tag 00000003', 'Test Tag 00000004', 'Test Tag 00000005'],
};

// Static test items
export const testItems = [
    {
        name: 'Test Item 00000001',
        description: 'This is a test item 1',
        data: 'Test data for item 1',
        user_id: testUserId,
        folder: {
            id: -1, // -1 indicates a new folder to be created
            name: 'Test Folder 00000001',
            parent_folder_id: 0, // 0 indicates no parent folder
        },
        tags: ['Test Tag 00000001', 'Test Tag 00000002'],
    },
    {
        name: 'Test Item 00000002',
        description: 'This is a test item 2',
        data: 'Test data for item 2',
        user_id: testUserId,
        folder: {
            id: -1,
            name: 'Test Folder 00000002',
            parent_folder_id: 0,
        },
        tags: ['Test Tag 00000003', 'Test Tag 00000004'],
    },
    {
        name: 'Test Item 00000003',
        description: 'This is a test item 3',
        data: 'Test data for item 3',
        user_id: testUserId,
        folder: {
            id: -1,
            name: 'Test Folder 00000003',
            parent_folder_id: 0,
        },
        tags: ['Test Tag 00000005', 'Test Tag 00000006'],
    },
];

/**
 * Function to generate a test user
 * @returns {TestUser} A test user
 */
export const generateTestUser = () => {
    // Generate random postfix to avoid conflicts
    const postfix = Math.floor(Math.random() * 1000000);

    const testUser: TestUser = {
        first_name: 'Test',
        last_name: `User ${postfix}`,
        email: `test.user.${postfix}@safekeep.com`,
        password_hash: '$2a$10$KlJHEOfucMDQZdaDFuXCfemivqT6ZZNBGSI/5WvprhRDZKuH.VZsW',
        password: 'Ab1234567890!',
        totp_secret: 'JEXUU2IEJYQESEQM',
        encrypted_totp_secret: '3ef629331641a35e7cc84bbf896b9e3eU2FsdGVkX18bJRZdF1YQTI2Wvj21k9vLUVcxWnhxFPTkefd2xkIB0jrbRyOf9/bM',
    };

    return testUser;
};

/**
 * Function to generate a test item
 * @param userId {number} The user ID to associate with the test item
 * @returns A test item
 */
export const generateTestItem = (userId: number = 0) => {
    // Generate random postfix to avoid conflicts
    const postfix = Math.floor(Math.random() * 1000000);

    const testItem: TestItem = {
        name: `Test Item ${postfix}`,
        description: `This is a test item ${postfix}`,
        data: `Test data for item ${postfix}`,
        user_id: userId,
        folder: {
            id: -1,
            name: `Test Folder ${postfix}`,
            parent_folder_id: 0,
        },
        tags: [`Test Tag ${postfix}`, `Test Tag ${postfix + 1}`],
    };

    return testItem;
};

/**
 * Function to save a test user to the database
 * @param user {TestUser} The test user to save
 * @returns {number} The ID of the saved user
 */
export const createTestUser = async (user: TestUser) => {
    const prisma = new PrismaClient();

    const newUser = await prisma.user.create({
        data: {
            first_name: user.first_name,
            last_name: user.last_name,
            email: user.email,
            password_hash: user.password_hash,
            totp_secret: user.encrypted_totp_secret,
            totp_enabled: true,
            created_at: new Date(),
            updated_at: new Date(),
        },
    });

    return newUser.user_id;
};

/**
 * Function to remove a test user from the database
 * @param email {string} The email of the test user to remove
 */
export const removeTestUser = async (email: string) => {
    const prisma = new PrismaClient();

    await prisma.user.deleteMany({
        where: {
            email: email,
        },
    });
};

/**
 * Function to save a test item to the database
 * @param item {TestItem} The test item to save
 * @returns {number} The ID of the saved item
 */
export const createTestItem = async (item: TestItem) => {
    // Save the test item
    await saveItem(item.user_id, item.name, item.description, item.data, item.folder, [], item.tags);

    const prisma = new PrismaClient();

    // Get the test item
    const newItem = await prisma.item.findFirst({
        where: {
            name: item.name,
        },
    });

    if (!newItem) {
        return 0;
    }

    // Return the item_id
    return newItem.item_id;
};

/**
 * Remove a test item from the database
 * @param item {TestItem} The test item to remove
 */
export const removeTestItem = async (item: TestItem) => {
    const prisma = new PrismaClient();

    // Get the test item
    const itemToRemove = await prisma.item.findFirst({
        where: {
            name: item.name,
        },
    });

    // Get the test folder
    const folderToRemove = await prisma.folder.findFirst({
        where: {
            name: item.folder.name,
        },
    });

    // Get the test tags
    const tagsToRemove = await prisma.tag.findMany({
        where: {
            name: {
                in: item.tags,
            },
        },
    });

    // Remove the test folder
    if (folderToRemove) {
        await prisma.folder.delete({
            where: {
                folder_id: folderToRemove.folder_id,
            },
        });
    }

    if (tagsToRemove) {
        // Delete associations in the junction table before deleting the tags
        await prisma.itemTag.deleteMany({
            where: {
                tag: {
                    name: {
                        in: item.tags,
                    },
                },
            },
        });

        // Delete the tags
        await prisma.tag.deleteMany({
            where: {
                name: {
                    in: item.tags,
                },
            },
        });
    }

    if (itemToRemove) {
        await prisma.item.delete({
            where: {
                item_id: itemToRemove.item_id,
            },
        });
    }
};

/**
 * Function to create test items
 * @param items {TestItem[]} The test items to create
 * @param userId {number} The user ID to associate with the test items
 * @returns {number[]} An array of the IDs of the saved items
 */
export const createTestItems = async (items: TestItem[], userId: number): Promise<number[]> => {
    const prisma = new PrismaClient();
    const itemIds: number[] = [];

    for (const item of items) {
        const itemId = await createTestItem({ ...item, user_id: userId });
        if (itemId !== 0) {
            itemIds.push(itemId);
        }
    }

    await prisma.$disconnect();
    return itemIds;
};

/**
 * Function to remove test items from the database
 * @param items {TestItem[]} The test items to remove
 */
export const removeTestItems = async (items: TestItem[]) => {
    for (const item of items) {
        await removeTestItem(item);
    }
};

/**
 * Function to remove a test folder
 * @param folderName {string} The name of the test folder to remove
 */
export const removeTestFolder = async (folderName: string) => {
    const prisma = new PrismaClient();

    await prisma.folder.deleteMany({
        where: {
            name: folderName,
        },
    });
};
