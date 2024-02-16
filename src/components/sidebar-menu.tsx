'use client'
import { Fragment, useEffect, useState } from 'react'
import {
    ChartBarSquareIcon,
    Cog6ToothIcon,
    FolderIcon,
    GlobeAltIcon,
    ServerIcon,
    SignalIcon,
    XMarkIcon,
    ChevronDownIcon,
    ChevronRightIcon,
} from '@heroicons/react/24/outline'
import { Dialog, Transition } from '@headlessui/react'
import { SidebarProps } from '@/types/Sidebar'
import { SideMenuFolder } from '@/types/Sidebar'
import { useSideMenu } from '@/context/UserProvider';
import { useRouter } from 'next/navigation';

const navigation = [
    { name: 'All Items', href: '/item', icon: FolderIcon, current: true },
    { name: 'Item 1', href: '#', icon: ServerIcon, current: false },
    { name: 'Item 2', href: '#', icon: SignalIcon, current: false },
    { name: 'Item 3', href: '#', icon: GlobeAltIcon, current: false },
    { name: 'Item 4', href: '#', icon: ChartBarSquareIcon, current: false },
    { name: 'Item 5', href: '#', icon: Cog6ToothIcon, current: false },
]

const classNames = (...classes: any[]) => classes.filter(Boolean).join(' ');

const SidebarMenu = ({ sidebarOpen, setSidebarOpen }: SidebarProps) => {
    const { menuData, updateMenuData } = useSideMenu();
    const [openSubFolders, setOpenSubFolders] = useState<number[]>([]);

    const router = useRouter();

    // Function to be called when a folder is clicked
    const handleFolderClick = (folderId: number) => {
        router.push(`/folder/${folderId}`);
    };

    const toggleSubFolders = (folderId: number) => {
        const isOpen = openSubFolders.includes(folderId);
        setOpenSubFolders(isOpen ? openSubFolders.filter(id => id !== folderId) : [...openSubFolders, folderId]);
    };

    // useEffect to Fetch Initial Side Menu Data on Component Mount
    // This effect calls `updateMenuData` to asynchronously fetch and update the side menu data
    // when the component first mounts. 
    useEffect(() => {
        updateMenuData().catch(console.error);
    }, []);

    return (
        <>
            {/* Sidebar menu for desktop (lg) */}
            <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col bg-white">
                {/* Sidebar component, swap this element with another sidebar if you like */}
                <div className="flex grow flex-col gap-y-5 overflow-y-auto px-6 ring-1 ring-gray-300">
                    <div className="flex h-16 shrink-0 items-center">
                        <img
                            className="h-8 w-auto"
                            src="https://tailwindui.com/img/logos/mark.svg?color=indigo&shade=500"
                            alt="Your Company"
                        />
                    </div>
                    <nav className="flex flex-1 flex-col">
                        <ul role="list" className="flex flex-1 flex-col gap-y-7">
                            <li>
                                <ul role="list" className="-mx-2 space-y-1">
                                    {navigation.map((item) => (
                                        <li key={item.name}>
                                            <a
                                                href={item.href}
                                                className={classNames(
                                                    item.current
                                                        ? 'bg-gray-50 text-indigo-600'
                                                        : 'text-gray-700 hover:text-indigo-600 hover:bg-gray-50',
                                                    'group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold'
                                                )}
                                            >
                                                <item.icon className="h-6 w-6 shrink-0" aria-hidden="true" />
                                                {item.name}
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            </li>
                            { /* Folders */}
                            {menuData && menuData.folders && (
                                <li>
                                    <div className="text-xs font-semibold leading-6 text-gray-400">Folders</div>
                                    <ul role="list" className="-mx-2 mt-2 space-y-1">
                                        {menuData.folders.map((folder) => (
                                            <li key={folder.folderId}>
                                                <div className="flex items-center justify-between">
                                                    <button
                                                        onClick={() => handleFolderClick(folder.folderId)}
                                                        className={classNames(
                                                            false ? 'bg-gray-50 text-indigo-600' : 'text-gray-700 hover:text-indigo-600 hover:bg-gray-50',
                                                            'group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold'
                                                        )}
                                                    >
                                                        <FolderIcon className="h-6 w-6 shrink-0" aria-hidden="true" />
                                                        <span className="truncate">{folder.name}</span>
                                                    </button>
                                                    {folder.subFolders.length > 0 && (
                                                        <button
                                                            onClick={() => toggleSubFolders(folder.folderId)}
                                                            className="p-1"
                                                        >
                                                            {openSubFolders.includes(folder.folderId) ? <ChevronDownIcon className="h-5 w-5" /> : <ChevronRightIcon className="h-5 w-5" />}
                                                        </button>
                                                    )}
                                                </div>
                                                {openSubFolders.includes(folder.folderId) && (
                                                    <ul className="mt-2 ml-4 space-y-1">
                                                        {folder.subFolders.map((subFolder) => (
                                                            <li key={subFolder.folderId} className="truncate text-sm leading-6 font-semibold text-gray-700 hover:text-indigo-600">
                                                                <button
                                                                    onClick={() => handleFolderClick(subFolder.folderId)}
                                                                    className="flex items-center gap-x-2"
                                                                >
                                                                    <FolderIcon className="inline-block h-4 w-4 shrink-0" aria-hidden="true" />
                                                                    {subFolder.name}
                                                                </button>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                )}
                                            </li>
                                        ))}
                                    </ul>
                                </li>
                            )}

                            <li className="mt-auto">
                                <a
                                    href="#"
                                    className="group -mx-2 flex gap-x-3 rounded-md p-2 text-sm font-semibold leading-6 text-gray-700 hover:bg-gray-50 hover:text-indigo-600"
                                >
                                    <Cog6ToothIcon
                                        className="h-6 w-6 shrink-0 text-gray-400 group-hover:text-indigo-600"
                                        aria-hidden="true"
                                    />
                                    Settings
                                </a>
                            </li>
                        </ul>
                    </nav>
                </div>
            </div>

            {/* Sidebar menu for mobile (lg-) */}
            <Transition.Root show={sidebarOpen} as={Fragment}>
                <Dialog as="div" className="relative z-40 lg:hidden" onClose={setSidebarOpen}>
                    <Transition.Child
                        as={Fragment}
                        enter="transition-opacity ease-linear duration-300"
                        enterFrom="opacity-0"
                        enterTo="opacity-100"
                        leave="transition-opacity ease-linear duration-300"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                    >
                        <div className="fixed inset-0 bg-gray-900/80" />
                    </Transition.Child>

                    <div className="fixed inset-0 flex">
                        <Transition.Child
                            as={Fragment}
                            enter="transition ease-in-out duration-300 transform"
                            enterFrom="-translate-x-full"
                            enterTo="translate-x-0"
                            leave="transition ease-in-out duration-300 transform"
                            leaveFrom="translate-x-0"
                            leaveTo="-translate-x-full"
                        >
                            <Dialog.Panel className="relative mr-16 flex w-full max-w-xs flex-1">
                                <Transition.Child
                                    as={Fragment}
                                    enter="ease-in-out duration-300"
                                    enterFrom="opacity-0"
                                    enterTo="opacity-100"
                                    leave="ease-in-out duration-300"
                                    leaveFrom="opacity-100"
                                    leaveTo="opacity-0"
                                >
                                    <div className="absolute left-full top-0 flex w-16 justify-center pt-5">
                                        <button type="button" className="-m-2.5 p-2.5" onClick={() => setSidebarOpen(false)}>
                                            <span className="sr-only">Close sidebar</span>
                                            <XMarkIcon className="h-6 w-6 text-white" aria-hidden="true" />
                                        </button>
                                    </div>
                                </Transition.Child>
                                {/* Sidebar component, swap this element with another sidebar if you like */}
                                <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white px-6 ring-1 ring-white/10">
                                    <div className="flex h-16 shrink-0 items-center">
                                        <img
                                            className="h-8 w-auto"
                                            src="https://tailwindui.com/img/logos/mark.svg?color=indigo&shade=500"
                                            alt="Your Company"
                                        />
                                    </div>
                                    <nav className="flex flex-1 flex-col">
                                        <ul role="list" className="flex flex-1 flex-col gap-y-7">
                                            <li>
                                                <ul role="list" className="-mx-2 space-y-1">
                                                    {navigation.map((item) => (
                                                        <li key={item.name}>
                                                            <a
                                                                href={item.href}
                                                                className={classNames(
                                                                    item.current
                                                                        ? 'bg-gray-50 text-indigo-600'
                                                                        : 'text-gray-700 hover:text-indigo-600 hover:bg-gray-50',
                                                                    'group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold'
                                                                )}
                                                            >
                                                                <item.icon
                                                                    className={classNames(
                                                                        item.current ? 'text-indigo-600' : 'text-gray-400 group-hover:text-indigo-600',
                                                                        'h-6 w-6 shrink-0'
                                                                    )}
                                                                    aria-hidden="true"
                                                                />
                                                                {item.name}
                                                            </a>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </li>
                                            { /* Folders */}
                            {menuData && menuData.folders && (
                                <li>
                                    <div className="text-xs font-semibold leading-6 text-gray-400">Folders</div>
                                    <ul role="list" className="-mx-2 mt-2 space-y-1">
                                        {menuData.folders.map((folder) => (
                                            <li key={folder.folderId}>
                                                <div className="flex items-center justify-between">
                                                    <button
                                                        onClick={() => handleFolderClick(folder.folderId)}
                                                        className={classNames(
                                                            false ? 'bg-gray-50 text-indigo-600' : 'text-gray-700 hover:text-indigo-600 hover:bg-gray-50',
                                                            'group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold'
                                                        )}
                                                    >
                                                        <FolderIcon className="h-6 w-6 shrink-0" aria-hidden="true" />
                                                        <span className="truncate">{folder.name}</span>
                                                    </button>
                                                    {folder.subFolders.length > 0 && (
                                                        <button
                                                            onClick={() => toggleSubFolders(folder.folderId)}
                                                            className="p-1"
                                                        >
                                                            {openSubFolders.includes(folder.folderId) ? <ChevronDownIcon className="h-5 w-5" /> : <ChevronRightIcon className="h-5 w-5" />}
                                                        </button>
                                                    )}
                                                </div>
                                                {openSubFolders.includes(folder.folderId) && (
                                                    <ul className="mt-2 ml-4 space-y-1">
                                                        {folder.subFolders.map((subFolder) => (
                                                            <li key={subFolder.folderId} className="truncate text-sm leading-6 font-semibold text-gray-700 hover:text-indigo-600">
                                                                <button
                                                                    onClick={() => handleFolderClick(subFolder.folderId)}
                                                                    className="flex items-center gap-x-2"
                                                                >
                                                                    <FolderIcon className="inline-block h-4 w-4 shrink-0" aria-hidden="true" />
                                                                    {subFolder.name}
                                                                </button>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                )}
                                            </li>
                                        ))}
                                    </ul>
                                </li>
                            )}
                                            <li className="mt-auto">
                                                <a
                                                    href="#"
                                                    className="group -mx-2 flex gap-x-3 rounded-md p-2 text-sm font-semibold leading-6 text-gray-700 hover:bg-gray-50 hover:text-indigo-600"
                                                >
                                                    <Cog6ToothIcon
                                                        className="h-6 w-6 shrink-0 text-gray-400 group-hover:text-indigo-600"
                                                        aria-hidden="true"
                                                    />
                                                    Settings
                                                </a>
                                            </li>
                                        </ul>
                                    </nav>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </Dialog>
            </Transition.Root>
        </>
    );
};

export default SidebarMenu;