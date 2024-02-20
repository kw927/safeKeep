/**
 * This service is used to manage the user data including the side menu folders for the user
 */
import { SideMenuFolder } from '@/types/Sidebar';

class UserService {
    // Internal variable to store the side menu folders
    private sideMenuFolders: SideMenuFolder[] | null = null;

    // Setter method to set the side menu folders
    setMenuFolder(data: SideMenuFolder[]) {
        this.sideMenuFolders = data;
    }

    // Getter method to get the side menu folders
    getMenuFolder(): SideMenuFolder[] | null {
        return this.sideMenuFolders;
    }

    // Method to fetch side menu folders from the API
    async fetchFolderData(): Promise<void> {
        // Get the user folders
        const response = await fetch('/api/user/get-menu-data', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (response.ok) {
            // Parse the response and set the side menu folders
            const data = await response.json();
            this.setMenuFolder(data.folders);
        }
    }

    // Method to clear the side menu folders
    clearMenuData() {
        this.sideMenuFolders = null;
    }
}

export const userService = new UserService();
