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