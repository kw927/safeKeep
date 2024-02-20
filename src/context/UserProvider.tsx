/**
 * This file contains the UserProvider component, which is a context provider for the user's data including the side menu data.
 */
'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { SideMenuData } from '@/types/Sidebar';
import { userService } from '@/services/userService';

// The context type for the SideMenuContext
interface SideMenuContextType {
    menuData: SideMenuData | null;
    updateMenuData: () => Promise<void>;
}

const SideMenuContext = createContext<SideMenuContextType | undefined>(undefined);

/**
 * useSideMenu is a custom hook to use the SideMenuContext
 * @returns {SideMenuContextType} The context value
 */
export const useSideMenu = (): SideMenuContextType => {
    const context = useContext(SideMenuContext);

    // To ensure that the component is wrapped in the UserProvider
    if (!context) {
        throw new Error('useSideMenu must be used within a UserProvider');
    }

    return context;
};

/**
 * UserProvider is a context provider for the user's data including the side menu data
 * @param children {ReactNode} The children components
 * @returns {ReactNode} The UserProvider component
 */
export const UserProvider = ({ children }: { children: ReactNode }) => {
    // The state for the menu data
    const [menuData, setMenuData] = useState<SideMenuData | null>(null);

    const updateMenuData = async () => {
        // Fetches data and updates userService's internal state
        await userService.fetchFolderData();

        // Retrieve the updated data from the userService
        const updatedFolders = userService.getMenuFolder();

        // Update the context state
        setMenuData({ folders: updatedFolders || [] });
    };

    return <SideMenuContext.Provider value={{ menuData, updateMenuData }}>{children}</SideMenuContext.Provider>;
};
