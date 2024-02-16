import { buildFolderHierarchy } from '@/utils/folderUtils';

// Define the test folders
const testFolders = [
    { folder_id: 1, user_id: 1, name: 'Root Folder 1', parent_folder_id: null, created_at: new Date(), updated_at: new Date() },
    { folder_id: 2, user_id: 1, name: 'Child Folder 1.1', parent_folder_id: 1, created_at: new Date(), updated_at: new Date() },
    { folder_id: 3, user_id: 1, name: 'Child Folder 1.2', parent_folder_id: 1, created_at: new Date(), updated_at: new Date() },
    { folder_id: 4, user_id: 1, name: 'Root Folder 2', parent_folder_id: null, created_at: new Date(), updated_at: new Date() },
    { folder_id: 5, user_id: 1, name: 'Child Folder 2.1', parent_folder_id: 4, created_at: new Date(), updated_at: new Date() },
    { folder_id: 6, user_id: 1, name: 'Child Folder 2.2', parent_folder_id: 4, created_at: new Date(), updated_at: new Date() },
    { folder_id: 7, user_id: 1, name: 'Child Folder 2.3', parent_folder_id: 4, created_at: new Date(), updated_at: new Date() },
    { folder_id: 8, user_id: 1, name: 'Root Folder 3', parent_folder_id: null, created_at: new Date(), updated_at: new Date() },
];

/**
 * Test suite for the buildFolderHierarchy function
 */
describe('buildFolderHierarchy Function', () => {
    // Test case to check if the root folders are correctly identified
    it('should correctly identify root folders', () => {
        // Get the root folders
        const { rootFolders } = buildFolderHierarchy(testFolders);

        // Check the count and the names of the root folders
        expect(rootFolders.length).toBe(3);
        expect(rootFolders).toEqual(expect.arrayContaining([
            expect.objectContaining({ name: 'Root Folder 1' }),
            expect.objectContaining({ name: 'Root Folder 2' }),
            expect.objectContaining({ name: 'Root Folder 3' })
        ]));
    });

    // Test case to check if the folders are correctly nested
    it('should build the correct hierarchical structure', () => {
        // Get the folders
        const { folders } = buildFolderHierarchy(testFolders);
        // Check the total count including nested folders
        expect(folders.length).toBe(8);
    });

    // Test case to check if the folders are correctly handled when there are no children
    it('should correctly handle folders without children', () => {
        const folderWithoutChildren = testFolders.filter(folder => folder.folder_id === 8);
        const { folders } = buildFolderHierarchy(folderWithoutChildren);

        expect(folders.length).toBe(1);
        expect(folders[0].name).toBe('Root Folder 3');
    });

    // Test case to check if the parent_folder_id is correctly assigned
    it('should assign the correct parent_folder_id', () => {
        const { folders } = buildFolderHierarchy(testFolders);
        const childFolder = folders.find(folder => folder.name === '-Child Folder 1.1');
        expect(childFolder).toBeDefined();
        if (childFolder) {
            expect(childFolder.parent_folder_id).toBe(1);
        }
    });
});
