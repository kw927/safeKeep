import { getUserByEmail, getUserItemById, getUserListItemsByFolderId, getFolder, getUserFolders } from '@/services/databaseService';
import {
    createTestUser,
    removeTestUser,
    createTestItem,
    removeTestItem,
    testItems,
    createTestItems,
    removeTestItems,
    removeTestFolder,
    generateTestUser,
    generateTestItem,
} from '@/utils/testUtils';
import { PrismaClient } from '@prisma/client';
// Import @jest/globals to avoid conflict with cypress global types
import { expect } from '@jest/globals';

/**
 * Test suite for the database service getUserByEmail function
 */
describe('Database service getUserByEmail Function', () => {
    // Generate a test user
    const testUser = generateTestUser();

    beforeAll(async () => {
        // Remove the test user from the database if it exists
        await removeTestUser(testUser.email);

        // Create the test user in the database
        await createTestUser(testUser);
    });

    afterAll(async () => {
        // Delete the test user from the database
        await removeTestUser(testUser.email);
    });

    // Test case to check if the function returns a user object for a valid email
    it('should return a user object for a valid email', async () => {
        // Get the user from the database by email
        const user = await getUserByEmail(testUser.email);

        expect(user).not.toBeNull();

        // This is for TypeScript to know that user is not null
        if (!user) {
            return;
        }

        // Check if the user object matches the test user
        expect(user.email).toBe(testUser.email);
        expect(user.first_name).toBe(testUser.first_name);
        expect(user.last_name).toBe(testUser.last_name);
        expect(user.password_hash).toBe(testUser.password_hash);
    });

    // Test case to check if the function returns null for an email that does not exist in the database
    it('should return null for an email that does not exist in the database', async () => {
        const user = await getUserByEmail('nonexistent@safekeep.com');
        expect(user).toBeNull();
    });
});

/**
 * Test suite for the database service getUserItemById function
 */
describe('Database service getUserItemById Function', () => {
    // Create a test user and item
    const testUser = generateTestUser();
    const testItem = generateTestItem();

    let createdUserId: number;
    let createdItemId: number;

    beforeAll(async () => {
        // Remove the test user and item from the database if they exist
        await removeTestUser(testUser.email);
        await removeTestUser('another.test.user@safekeep.com');

        // Create a test user and item in the database
        createdUserId = await createTestUser(testUser);
        createdItemId = await createTestItem({ ...testItem, user_id: createdUserId });
    });

    afterAll(async () => {
        // Remove the test user and item from the database
        await removeTestItem(testItem);
        await removeTestUser(testUser.email);
        await removeTestUser('another.test.user@safekeep.com');
    });

    // Test case to check if the function returns an item object for a valid item and user id
    it('should return an item object for a valid item and user id', async () => {
        // Get the item from the database by item ID and user ID
        const item = await getUserItemById(createdItemId, createdUserId);

        // Expect the item to be retrieved
        expect(item).not.toBeNull();
        expect(item).toMatchObject({
            item_id: createdItemId,
            name: testItem.name,
            description: testItem.description,
        });

        // This is for TypeScript to know that item is not null
        if (!item) {
            return;
        }

        // Verify the item details
        if (item.folder) {
            expect(item.folder).toHaveProperty('name');
        }
        if (item.files && item.files.length > 0) {
            expect(item.files[0]).toHaveProperty('original_file_name');
        }
        if (item.item_tags && item.item_tags.length > 0) {
            expect(item.item_tags[0].tag).toHaveProperty('name');
        }
    });

    // Test case to check if the function returns null for an item id that does not exist for the user
    it('should return null for an item id that does not exist for the user', async () => {
        // The function should returns null when the item doesn't exist
        const item = await getUserItemById(999999, createdUserId);
        expect(item).toBeNull();
    });

    // Test case to check if the function returns null for an item id that exists but does not belong to the user
    it('should return null for an item id that exists but does not belong to the user', async () => {
        // Create another user
        const anotherUserId = await createTestUser({ ...testUser, email: 'another.test.user@safekeep.com' });

        // Use the existing item_id but with a different user_id
        const item = await getUserItemById(createdItemId, anotherUserId);

        // Expect the function to return null for an item that does not belong to the user
        expect(item).toBeNull();
    });
});

/**
 * Test suite for the database service getUserListItemsByFolderId function
 */
describe('Database service getUserListItemsByFolderId Function', () => {
    const prisma = new PrismaClient();
    // Create a test user
    const testUser = generateTestUser();

    let createdUserId: number;
    let createdItemIds: number[];
    let createdFolderId: number;

    const testFolder = {
        name: 'Test Folder 00000001',
        parent_folder_id: null,
        user_id: 0,
        created_at: new Date(),
        updated_at: new Date(),
    };

    beforeAll(async () => {
        // Remove the test items, and user from the database if they exist
        await removeTestItems(testItems);
        await removeTestUser(testUser.email);

        // Create a test user and item in the database
        createdUserId = await createTestUser(testUser);

        // Create a test folder in the database
        testFolder.user_id = createdUserId;
        const createdFolder = await prisma.folder.create({
            data: testFolder,
        });

        createdFolderId = createdFolder.folder_id;

        // Replace the folder in the test items
        for (const item of testItems) {
            item.folder.id = createdFolder.folder_id;
            item.folder.name = testFolder.name;
        }

        createdItemIds = await createTestItems(testItems, createdUserId);
    });

    afterAll(async () => {
        // Remove the test items, folder, and user from the database
        await removeTestFolder(testFolder.name);
        await removeTestItems(testItems);
        await removeTestUser(testUser.email);
    });

    // Test case to check if the function retrieves items correctly by folder ID for a valid user
    it('should retrieve items correctly by folder ID for a valid user', async () => {
        // Retrieve the items from the database by folder ID and user ID
        const items = await getUserListItemsByFolderId(createdFolderId, createdUserId);

        // Expect to retrieve the exact number of items created for the test folder
        expect(items.length).toBe(testItems.length);

        // This is for TypeScript to know that items is not null
        if (!items) {
            return;
        }

        // Verify the details of the retrieved items to ensure they match the test data
        items.forEach((item) => {
            // Check if the item ID is one of the created test items
            expect(createdItemIds).toContain(item.item_id);

            // Check if the name match the test items
            const testItem = testItems.find((testItem) => testItem.name === item.name);
            expect(testItem).not.toBeUndefined();
        });
    });

    // Test case to check if the function returns an empty array for a folder with no items
    it('should not retrieve items from an invalid folder id', async () => {
        // Since the folder ID is auto-incremented, use a non-existent folder ID
        // Add 1 to the created folder ID to get a non-existent folder ID
        const otherFolderId = createdFolderId + 1;

        const items = await getUserListItemsByFolderId(otherFolderId, createdUserId);

        // Expect no items to be retrieved from a non-existent folder
        expect(items.length).toBe(0);
    });
});

/**
 * Test suite for the database service getFolder function
 */
describe('Database service getFolder Function', () => {
    const prisma = new PrismaClient();
    // Create a test user
    const testUser = generateTestUser();

    let testUserId: number;
    let testFolderId: number;

    const testFolder = {
        name: 'Test Folder 00000001',
        parent_folder_id: null,
        user_id: 0,
        created_at: new Date(),
        updated_at: new Date(),
    };

    beforeAll(async () => {
        // Remove the test folder and user from the database if they exist
        await removeTestFolder(testFolder.name);
        await removeTestUser(testUser.email);
        await removeTestUser('another.folder.test@safekeep.com');

        // Create a test user in the database
        testUserId = await createTestUser(testUser);

        // Create a test folder in the database
        testFolder.user_id = testUserId;
        const createdFolder = await prisma.folder.create({
            data: testFolder,
        });

        testFolderId = createdFolder.folder_id;
    });

    afterAll(async () => {
        // Remove the test folder and user from the database
        await removeTestFolder(testFolder.name);
        await removeTestUser(testUser.email);
        await removeTestUser('another.folder.test@safekeep.com');
    });

    // Test case to check if the function retrieves an existing folder for a valid user
    it('should retrieve an existing folder for a valid user', async () => {
        // Retrieve the folder from the database by folder ID and user ID
        const folder = await getFolder(testFolderId, testUserId);
        expect(folder).not.toBeNull();

        // This is for TypeScript to know that folder is not null
        if (!folder) {
            return;
        }

        // Verify the details of the retrieved folder to ensure they match the test data
        expect(folder.folder_id).toBe(testFolderId);
        expect(folder.user_id).toBe(testUserId);
        expect(folder.name).toBe(testFolder.name);
    });

    // Test case to check if the function returns null for a non-existent folder ID
    it('should return null for a non-existent folder ID', async () => {
        // Assuming this ID does not exist in the database
        const nonExistentFolderId = testFolderId + 999999;

        const folder = await getFolder(nonExistentFolderId, testUserId);
        expect(folder).toBeNull();
    });

    // Test case to check if the function returns null for a folder belonging to another user
    it('should return null when attempting to retrieve a folder belonging to another user', async () => {
        // Creates another user for testing
        const anotherUserId = await createTestUser({
            first_name: 'Another',
            last_name: 'User',
            email: 'another.folder.test@safekeep.com',
            password_hash: 'passwordhash',
            password: 'password',
            totp_secret: 'JEXUU2IEJYQESEQM',
            encrypted_totp_secret: '3ef629331641a35e7cc84bbf896b9e3eU2FsdGVkX18bJRZdF1YQTI2Wvj21k9vLUVcxWnhxFPTkefd2xkIB0jrbRyOf9/bM',
        });

        // Attempt to retrieve the test folder belonging to another user
        const folder = await getFolder(testFolderId, anotherUserId);

        // Expect the function to return null for a folder belonging to another user
        expect(folder).toBeNull();

        // Remove the additional test user
        await removeTestUser('another.folder.test@safekeep.com');
    });
});

/**
 * Test suite for the database service getUserFolders function
 */
describe('Database service getUserFolders Function', () => {
    const prisma = new PrismaClient();

    // Create a test user
    const testUser = generateTestUser();

    let testUserId: number;

    const testFolders = [
        {
            name: 'Test Folder 00000001',
            parent_folder_id: null,
            user_id: 0,
            created_at: new Date(),
            updated_at: new Date(),
        },
        {
            name: 'Test Folder 00000002',
            parent_folder_id: null,
            user_id: 0,
            created_at: new Date(),
            updated_at: new Date(),
        },
    ];

    beforeAll(async () => {
        // Remove the test user from the database if they exist
        await removeTestUser(testUser.email);
        await removeTestUser('another.folder.test@safekeep.com');

        testUserId = await createTestUser(testUser);

        for (let i = 0; i < testFolders.length; i++) {
            testFolders[i].user_id = testUserId;

            // Create a test folder in the database
            const createdFolder = await prisma.folder.create({
                data: testFolders[i],
            });
        }
    });

    afterAll(async () => {
        // Remove test folders and users
        for (let i = 0; i < testFolders.length; i++) {
            await removeTestFolder(testFolders[i].name);
        }
        await removeTestUser(testUser.email);
        await removeTestUser('another.folder.test@safekeep.com');
    });

    // Test case to check if the function retrieves and correctly structures folders for a given user
    it('should retrieve and correctly structure folders for a given user', async () => {
        const folders = await getUserFolders(testUserId);

        // Expect the function to retrieve the exact number of folders created for the test user
        expect(folders).toBeInstanceOf(Array);
        expect(folders).toHaveLength(testFolders.length);

        // Check for correct ordering by name
        for (let i = 0; i < folders.length; i++) {
            expect(folders[i].name).toBe(testFolders[i].name);
        }
    });

    // Test case to check if the function returns an empty array for a user with no folders
    it('should return an empty array for a user with no folders', async () => {
        // Creates another user for testing
        const anotherUserId = await createTestUser({
            first_name: 'Another',
            last_name: 'User',
            email: 'another.folder.test@safekeep.com',
            password_hash: 'passwordhash',
            password: 'password',
            totp_secret: 'JEXUU2IEJYQESEQM',
            encrypted_totp_secret: '3ef629331641a35e7cc84bbf896b9e3eU2FsdGVkX18bJRZdF1YQTI2Wvj21k9vLUVcxWnhxFPTkefd2xkIB0jrbRyOf9/bM',
        });

        // Attempt to retrieve folders for the additional test user
        const folders = await getUserFolders(anotherUserId);

        // Expect the function to return an empty array for a user with no folders
        expect(folders).toEqual([]);

        // Cleanup the additional test user
        await removeTestUser('another.folder.test@safekeep.com');
    });
});
