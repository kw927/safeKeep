'use client'

import React, { useState } from 'react';
import SidebarMenu from './sidebar-menu';
import TopNavAndContent from './top-nav-and-content';
import { LayoutProps } from '@/types/Layout';

const MainLayout = ({children}:LayoutProps) => {
    const [sidebarOpen, setSidebarOpen] = useState(false)

    return (
        <>
            {/* Main layout container */}
            <div className="lg:flex min-h-screen min-w-full bg-white text-gray-800">
                
                <SidebarMenu sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

                <TopNavAndContent children={children} setSidebarOpen={setSidebarOpen} showSearchBar={true} />
            </div>
        </>
    )
};

export default MainLayout;