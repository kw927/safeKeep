'use client'

import React, { useState } from 'react';
import SidebarMenu from './sidebar-menu';
import TopNavAndContent from './top-nav-and-content';
import { LayoutProps } from '@/types/Layout';
import { UserProvider } from '@/context/UserProvider';

const MainLayout = ({children, showSearchBar}:LayoutProps) => {
    const [sidebarOpen, setSidebarOpen] = useState(false)

    return (
        <>
            {/* Main layout container */}
            <div className="lg:flex min-h-screen min-w-full bg-white text-gray-800">
                <UserProvider>
                <SidebarMenu sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
                </UserProvider>

                <TopNavAndContent children={children} setSidebarOpen={setSidebarOpen} showSearchBar={showSearchBar} />
            </div>
        </>
    )
};

export default MainLayout;