import { PrismaClient } from '@prisma/client';
import { saveItem, updateItem } from '@/services/databaseService';
import { generateTestUser, createTestUser, removeTestUser } from '@/utils/testUtils';
// Import @jest/globals to avoid conflict with cypress global types
import { expect } from '@jest/globals';

// Create a test user
const testUser = generateTestUser();

let userId = 0;

let testItem = {
    name: 'Test Item 00000001',
    description: 'This is a test item',
    data: 'Test data',
    user_id: 0,
    folder: {
        id: -1,
        name: 'Test Folder 00000001',
        parent_folder_id: 0
    },
    tags: ["Test Tag 00000001", "Test Tag 00000002", "Test Tag 00000003", "Test Tag 00000004", "Test Tag 00000005"],
};

/**
 * Test suite for the Item API
 */
describe('API Function Tests', () => {
    beforeAll(async () => {
        // Create a user for testing
        userId = await createTestUser(testUser);

        // Set the user_id for the test item
        testItem.user_id = userId;
    });

    afterAll(async () => {
        // Remove all test items and users
        await removeTestUser(testUser.email);
    });

    // Test case for saving and updating an item
    test('Item should be saved and updated successfully', async () => {
        // check if the user is created
        expect(testItem.user_id).not.toBe(0);

        // Save the test item
        await saveItem(testItem.user_id, testItem.name, testItem.description, testItem.data, testItem.folder, [], testItem.tags);

        // check if the item is saved correctly
        const prisma = new PrismaClient();
        const item = await prisma.item.findFirst({
            where: {
                name: testItem.name,
            }
        });

        if (!item) {
            throw new Error('Item not found');
        }

        // Verify the item is saved correctly
        expect(item).not.toBeNull();
        expect(item?.description).toBe(testItem.description);
        expect(item?.name).toBe(testItem.name);

        // check if the folder is saved correctly
        const folder = await prisma.folder.findFirst({
            where: {
                name: testItem.folder.name,
            }
        });

        expect(folder).not.toBeNull();

        // check if the tags are saved correctly
        const tags = await prisma.tag.findMany({
            where: {
                name: {
                    in: testItem.tags
                }
            }
        });

        expect(tags.length).toBe(testItem.tags.length);

        // Remove the test folder as we have already verified it
        if (folder) {
            await prisma.folder.delete({
                where: {
                    folder_id: folder.folder_id
                }
            });
        }

        // Update the item with new data including a new folder
        testItem = {
            ...testItem,
            name: 'Test Item 00000001 Updated',
            description: 'This is a test item updated',
            data: 'Test data updated',
            folder: {
                id: -1,
                name: 'Test Folder 00000001 Updated',
                parent_folder_id: 0
            },
            tags: ["Test Tag 00000001 Updated", "Test Tag 00000002 Updated", "Test Tag 00000003 Updated", "Test Tag 00000004 Updated", "Test Tag 00000005 Updated"],
        };

        const updateResult = await updateItem("POST", item.item_id, userId, testItem.name, testItem.description, testItem.data, testItem.folder, [], testItem.tags);

        expect(updateResult).toBe(true);

        // check if the item is updated correctly
        const updatedItem = await prisma.item.findFirst({
            where: {
                name: testItem.name,
            }
        });

        expect(updatedItem).not.toBeNull();
        expect(updatedItem?.description).toBe(testItem.description);
        expect(updatedItem?.name).toBe(testItem.name);

        // check if the folder is updated correctly
        const updatedFolder = await prisma.folder.findFirst({
            where: {
                name: testItem.folder.name,
            }
        });

        expect(updatedFolder).not.toBeNull();

        // Remove the test folder
        if (updatedFolder) {
            await prisma.folder.delete({
                where: {
                    folder_id: updatedFolder.folder_id
                }
            });
        }

        // check if the tags are updated correctly
        const updatedTags = await prisma.tag.findMany({
            where: {
                name: {
                    in: testItem.tags
                }
            }
        });

        expect(updatedTags.length).toBe(testItem.tags.length);

        if (updatedTags) {
            // Delete associations in the junction table before deleting the tags
            await prisma.itemTag.deleteMany({
                where: {
                    tag: {
                        name: {
                            in: testItem.tags,
                        },
                    },
                },
            });

            // Delete the tags
            await prisma.tag.deleteMany({
                where: {
                    name: {
                        in: testItem.tags,
                    },
                },
            });
        }

        if (updatedItem) {
            await prisma.item.delete({
                where: {
                    item_id: updatedItem.item_id
                }
            });
        }
    });
});
