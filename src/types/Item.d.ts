export interface ListItem {
    id: number;
    name: string;
    description: string;
    initials: string;
    color: string;
}

export interface ComboboxFolder {
    id: number;
    name: string;
    parent_folder_id: number;
}

export interface NewItemFolderProps {
    isNewFolderModalOpen: boolean;
    setIsNewFolderModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
    selectedParentFolder: ComboboxFolder;
    setSelectedParentFolder: React.Dispatch<React.SetStateAction<ComboboxFolder>>;
    addNewFolder: (folderName: string) => void;
    rootFolders: ComboboxFolder[];
}

export interface AllItemsProps {
    items: ListItem[];
}

export interface EncryptedFile {
    ciphertext: string;
    salt: string;
    filename: string;
    filetype: string;
}

export interface ItemProps {
    item: {
        item_id: number;
        name: string;
        description: string | null;
        data: string;
        is_favorite: boolean;
        created_at: Date;
        updated_at: Date;
        folder: {
            name: string;
            folder_id: number;
            parent_folder_id: number | null;
        } | null;
        item_tags: {
            tag: {
                name: string;
            };
        }[];
        files: EncryptedFile[];
    }
}
