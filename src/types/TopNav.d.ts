export interface TopNavProps {
    children: ReactNode;
    setSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
    showSearchBar: boolean;
}
