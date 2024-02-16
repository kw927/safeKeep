import { Folder } from '@prisma/client';
import { FolderHierarchy } from '@/types/Folder';
import { ComboboxFolder } from '@/types/Item';

/**
 * Function to build the folder hierarchy for combobox to display
 * @param folders {Folder[]} The list of folders to build the hierarchy from
 * @returns {FolderHierarchy} The folder hierarchy
 */
export const buildFolderHierarchy = (folders: Folder[]): FolderHierarchy => {
    // Create a map of folder_id to folder
    let folderMap = new Map<number, Folder>(folders.map(folder => [folder.folder_id, folder]));

    // Build the root folders array
    let rootFolders: ComboboxFolder[] = folders
        .filter(folder => folder.parent_folder_id === 0 || folder.parent_folder_id == null)
        .map(convertToComboboxFolder);

    // Clone the root folders array to hierarchicalFolders
    let hierarchicalFolders: ComboboxFolder[] = rootFolders.map(folder => Object.assign({}, folder));

    // Add child folders to the hierarchicalFolders, each child folder will have a prefix of "-"
    hierarchicalFolders.forEach(folder => {
        addChildFolders(folder, "-", folders, folderMap, hierarchicalFolders);
    });

    return { folders: hierarchicalFolders, rootFolders };
}

/**
 * Function to add child folders to the allFolders array recursively
 * @param parentFolder {ComboboxFolder} The parent folder to add the child folders to
 * @param prefix {string} The prefix to add to the child folder names
 * @param folders {Folder[]} The list of folders    
 * @param folderMap {Map<number, Folder>} The map of folder_id to folder
 * @param allFolders {ComboboxFolder[]} The array to add the child folders to
 */
const addChildFolders = (parentFolder: ComboboxFolder, prefix: string, folders: Folder[], folderMap: Map<number, Folder>, allFolders: ComboboxFolder[]) => {
    folders.forEach(folder => {
        if (folder.parent_folder_id === parentFolder.id) {
            const childFolder = convertToComboboxFolder(folder);
            // Prefix the name for the child folder
            childFolder.name = prefix + childFolder.name;
            allFolders.push(childFolder);
            addChildFolders(childFolder, prefix + prefix, folders, folderMap, allFolders);
        }
    });
};

/**
 * Helper function to convert Folder to ComboboxFolder
 * @param folder {Folder} The folder to convert
 * @returns {ComboboxFolder} The converted folder
 */
const convertToComboboxFolder = (folder: Folder): ComboboxFolder => {
    return {
        id: folder.folder_id,
        name: folder.name,
        parent_folder_id: folder.parent_folder_id ?? 0
    };
};