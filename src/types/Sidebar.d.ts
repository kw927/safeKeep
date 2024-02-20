export interface SidebarProps {
    sidebarOpen: boolean;
    setSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

export interface SideMenuData {
    folders: SideMenuFolder[];
}

export interface SideMenuFolder {
    folderId: number;
    name: string;
    parent_folder_id: number | null;
    subFolders: SideMenuFolder[];
}
