/**
 * Main layout component
 * This is a client component and all the code is executed on the client side
 */
'use client';

import React, { useState } from 'react';
import SidebarMenu from '@/components/layout/sidebar-menu';
import TopNavAndContent from '@/components/layout/top-nav-and-content';
import { LayoutProps } from '@/types/Layout';
import { UserProvider } from '@/context/UserProvider';

const MainLayout = ({ children, showSearchBar }: LayoutProps) => {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <>
            {/* Main layout container */}
            <div className='lg:flex min-h-screen min-w-full bg-white text-gray-800'>
                {/* User provider to provide user data to the components */}
                <UserProvider>
                    {/* sidemenu */}
                    <SidebarMenu sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
                </UserProvider>

                {/* Top navigation and content */}
                <TopNavAndContent children={children} setSidebarOpen={setSidebarOpen} showSearchBar={showSearchBar} />
            </div>
        </>
    );
};

export default MainLayout;
