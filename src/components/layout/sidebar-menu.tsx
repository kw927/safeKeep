/**
 * SidebarMenu Component
 * This is a client component and all the code is executed on the client side
 */
'use client';
import { ForwardRefExoticComponent, Fragment, RefAttributes, SVGProps, useEffect, useState } from 'react';
import {
    Cog6ToothIcon,
    FolderIcon,
    XMarkIcon,
    ChevronDownIcon,
    ChevronRightIcon,
    CurrencyPoundIcon,
    GlobeAltIcon,
} from '@heroicons/react/24/outline';
import { Dialog, Transition } from '@headlessui/react';
import { SidebarProps } from '@/types/Sidebar';
import { usePathname } from 'next/navigation';
import { useSideMenu } from '@/context/UserProvider';
import { useRouter } from 'next/navigation';
import { classNames } from '@/utils/pageUtils';

// Type for items that may or may not have submenus
interface BasicNavItem {
    name: string;
    href: string;
    icon: ForwardRefExoticComponent<
        Omit<SVGProps<SVGSVGElement>, 'ref'> & {
            title?: string | undefined;
            titleId?: string | undefined;
        } & RefAttributes<SVGSVGElement>
    >;
    current: boolean;
}

// Type for items with submenus
interface NavItemWithSubmenus extends BasicNavItem {
    submenus: BasicNavItem[];
}

// Combined type for items that may or may not have submenus
type NavItem = BasicNavItem | NavItemWithSubmenus;

// Navigation data
const navigation = [
    { name: 'All Items', href: '/item', icon: FolderIcon, current: false },
    {
        name: 'Web3 Wallet',
        href: '/web3',
        icon: GlobeAltIcon,
        current: false,
        submenus: [
            { name: 'Cryptocurrency', href: '/web3/crypto', current: false },
            { name: 'NFT', href: '/web3/nft', current: false },
        ],
    },
    { name: 'Donation', href: '/donation', icon: CurrencyPoundIcon, current: false },
];

const SidebarMenu = ({ sidebarOpen, setSidebarOpen }: SidebarProps) => {
    // Get the current pathname
    const pathname = usePathname();

    const router = useRouter();

    // Get the menu data from the context
    const { menuData, updateMenuData } = useSideMenu();

    // State to keep track of open subfolders
    const [openSubFolders, setOpenSubFolders] = useState<number[]>([]);
    const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);

    // Check if the pathname matches the items in navigation and update the current state
    navigation.forEach((item) => {
        item.current = item.href === pathname;
    });

    /**
     * Function to handle folder click
     * @param folderId {number} The folder id
     */
    const handleFolderClick = (folderId: number) => {
        router.push(`/folder/${folderId}`);
    };

    /**
     * Function to handle menu click
     * @param item {NavItem} The clicked item
     */
    const handleMenuClick = (item: NavItem) => {
        // Check if item has submenus
        const hasSubmenus = 'submenus' in item && item.submenus.length > 0;

        // If the item has submenus, open the submenu, else navigate to the item's href
        if (hasSubmenus) {
            setOpenSubmenu(openSubmenu === item.name ? null : item.name);
        } else {
            router.push(item.href);
        }

        // Check if the current path is within the Web3 Wallet routes
        if (item.name === 'Web3 Wallet' && hasSubmenus) {
            const isWithinWeb3Routes = item.submenus.some((submenu) => pathname.includes(submenu.href)) || pathname === item.href;
            if (!isWithinWeb3Routes) {
                router.push('/web3');
            }
        }
    };

    /**
     * Function to toggle subfolders
     * @param folderId {number} The folder id
     */
    const toggleSubFolders = (folderId: number) => {
        const isOpen = openSubFolders.includes(folderId);
        setOpenSubFolders(isOpen ? openSubFolders.filter((id) => id !== folderId) : [...openSubFolders, folderId]);
    };

    // useEffect to Fetch Initial Side Menu Data on Component Mount
    // This effect calls `updateMenuData` to asynchronously fetch and update the side menu data
    // when the component first mounts.
    useEffect(() => {
        updateMenuData().catch(console.error);
    }, []);

    /**
     * useEffect to keep the submenu open when the user navigates to a submenu route
     */
    useEffect(() => {
        // Check if the current pathname matches any of the submenu routes
        const matchingItem = navigation.find((item) => 'submenus' in item && item.submenus?.some((submenu) => pathname.startsWith(submenu.href)));

        // If there's a match, update the openSubmenu state to keep the submenu open
        if (matchingItem) {
            setOpenSubmenu(matchingItem.name);
        }
    }, [pathname]);

    return (
        <>
            {/* Sidebar menu for desktop (lg) */}
            <div className='hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col bg-white'>
                <div className='flex grow flex-col gap-y-5 overflow-y-auto px-6 ring-1 ring-gray-300'>
                    {/* SafeKeep logo */}
                    <div className='flex h-24 shrink-0 items-center'>
                        <img className='h-24 w-auto' src='/images/safe_keep_logo.png' alt='SafeKeep' />
                    </div>

                    {/* Navigation */}
                    <nav className='flex flex-1 flex-col'>
                        <ul role='list' className='flex flex-1 flex-col gap-y-7'>
                            <li>
                                <ul role='list' className='-mx-2 space-y-1'>
                                    {navigation.map((item) => (
                                        <li key={item.name}>
                                            <a
                                                href={item.href}
                                                onClick={(e) => {
                                                    // Check for 'submenus' using a type guard
                                                    if ('submenus' in item) {
                                                        e.preventDefault(); // Prevent default link behavior
                                                        handleMenuClick(item);
                                                    }
                                                }}
                                                className={classNames(
                                                    item.current
                                                        ? 'bg-gray-50 text-indigo-600'
                                                        : 'text-gray-700 hover:text-indigo-600 hover:bg-gray-50',
                                                    'group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold'
                                                )}
                                            >
                                                <item.icon className='h-6 w-6 shrink-0' aria-hidden='true' />
                                                {item.name}
                                            </a>

                                            {/* Check for 'submenus' again before rendering them */}
                                            {'submenus' in item && item.name === openSubmenu && (
                                                <ul className='ml-4 mt-2'>
                                                    {item.submenus?.map((submenu) => (
                                                        <li key={submenu.name}>
                                                            <a
                                                                href={submenu.href}
                                                                className={classNames(
                                                                    pathname === submenu.href
                                                                        ? 'text-indigo-600 bg-gray-50'
                                                                        : 'text-gray-700 hover:text-indigo-600',
                                                                    'block p-2 text-sm leading-6 font-semibold hover:bg-gray-50'
                                                                )}
                                                            >
                                                                {submenu.name}
                                                            </a>
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            </li>

                            {/* Folders */}
                            {menuData && menuData.folders && (
                                <li>
                                    <div className='text-xs font-semibold leading-6 text-gray-400'>Folders</div>
                                    <ul role='list' className='-mx-2 mt-2 space-y-1'>
                                        {menuData.folders.map((folder) => (
                                            <li key={folder.folderId}>
                                                <div className='flex items-center justify-between'>
                                                    <button
                                                        onClick={() => handleFolderClick(folder.folderId)}
                                                        className={classNames(
                                                            false
                                                                ? 'bg-gray-50 text-indigo-600'
                                                                : 'text-gray-700 hover:text-indigo-600 hover:bg-gray-50',
                                                            'group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold'
                                                        )}
                                                    >
                                                        <FolderIcon className='h-6 w-6 shrink-0' aria-hidden='true' />
                                                        <span className='truncate'>{folder.name}</span>
                                                    </button>
                                                    {folder.subFolders.length > 0 && (
                                                        <button onClick={() => toggleSubFolders(folder.folderId)} className='p-1'>
                                                            {openSubFolders.includes(folder.folderId) ? (
                                                                <ChevronDownIcon className='h-5 w-5' />
                                                            ) : (
                                                                <ChevronRightIcon className='h-5 w-5' />
                                                            )}
                                                        </button>
                                                    )}
                                                </div>

                                                {/* Subfolders */}
                                                {openSubFolders.includes(folder.folderId) && (
                                                    <ul className='mt-2 ml-4 space-y-1'>
                                                        {folder.subFolders.map((subFolder) => (
                                                            <li
                                                                key={subFolder.folderId}
                                                                className='truncate text-sm leading-6 font-semibold text-gray-700 hover:text-indigo-600'
                                                            >
                                                                <button
                                                                    onClick={() => handleFolderClick(subFolder.folderId)}
                                                                    className='flex items-center gap-x-2'
                                                                >
                                                                    <FolderIcon className='inline-block h-4 w-4 shrink-0' aria-hidden='true' />
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

                            {/* Settings (Currenly has no functionality) */}
                            <li className='mt-auto'>
                                <a
                                    href='#'
                                    className='group -mx-2 flex gap-x-3 rounded-md p-2 text-sm font-semibold leading-6 text-gray-700 hover:bg-gray-50 hover:text-indigo-600'
                                >
                                    <Cog6ToothIcon className='h-6 w-6 shrink-0 text-gray-400 group-hover:text-indigo-600' aria-hidden='true' />
                                    Settings
                                </a>
                            </li>
                        </ul>
                    </nav>
                </div>
            </div>

            {/* Sidebar menu for mobile (lg-) */}
            <Transition.Root show={sidebarOpen} as={Fragment}>
                <Dialog as='div' className='relative z-40 lg:hidden' onClose={setSidebarOpen}>
                    <Transition.Child
                        as={Fragment}
                        enter='transition-opacity ease-linear duration-300'
                        enterFrom='opacity-0'
                        enterTo='opacity-100'
                        leave='transition-opacity ease-linear duration-300'
                        leaveFrom='opacity-100'
                        leaveTo='opacity-0'
                    >
                        <div className='fixed inset-0 bg-gray-900/80' />
                    </Transition.Child>

                    <div className='fixed inset-0 flex'>
                        <Transition.Child
                            as={Fragment}
                            enter='transition ease-in-out duration-300 transform'
                            enterFrom='-translate-x-full'
                            enterTo='translate-x-0'
                            leave='transition ease-in-out duration-300 transform'
                            leaveFrom='translate-x-0'
                            leaveTo='-translate-x-full'
                        >
                            <Dialog.Panel className='relative mr-16 flex w-full max-w-xs flex-1'>
                                <Transition.Child
                                    as={Fragment}
                                    enter='ease-in-out duration-300'
                                    enterFrom='opacity-0'
                                    enterTo='opacity-100'
                                    leave='ease-in-out duration-300'
                                    leaveFrom='opacity-100'
                                    leaveTo='opacity-0'
                                >
                                    <div className='absolute left-full top-0 flex w-16 justify-center pt-5'>
                                        <button type='button' className='-m-2.5 p-2.5' onClick={() => setSidebarOpen(false)}>
                                            <XMarkIcon className='h-6 w-6 text-white' aria-hidden='true' />
                                        </button>
                                    </div>
                                </Transition.Child>

                                <div className='flex grow flex-col gap-y-5 overflow-y-auto bg-white px-6 ring-1 ring-white/10'>
                                    {/* SafeKeep logo */}
                                    <div className='flex h-24 shrink-0 items-center'>
                                        <img className='h-24 w-auto' src='/images/safe_keep_logo.png' alt='SafeKeep' />
                                    </div>

                                    {/* Navigation */}
                                    <nav className='flex flex-1 flex-col'>
                                        <ul role='list' className='flex flex-1 flex-col gap-y-7'>
                                            <li>
                                                <ul role='list' className='-mx-2 space-y-1'>
                                                    {navigation.map((item) => (
                                                        <li key={item.name}>
                                                            <a
                                                                href={item.href}
                                                                onClick={(e) => {
                                                                    // Check for 'submenus' using a type guard
                                                                    if ('submenus' in item) {
                                                                        e.preventDefault(); // Prevent default link behavior
                                                                        handleMenuClick(item);
                                                                    }
                                                                }}
                                                                className={classNames(
                                                                    item.current
                                                                        ? 'bg-gray-50 text-indigo-600'
                                                                        : 'text-gray-700 hover:text-indigo-600 hover:bg-gray-50',
                                                                    'group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold'
                                                                )}
                                                            >
                                                                <item.icon className='h-6 w-6 shrink-0' aria-hidden='true' />
                                                                {item.name}
                                                            </a>

                                                            {/* Check for 'submenus' again before rendering them */}
                                                            {'submenus' in item && item.name === openSubmenu && (
                                                                <ul className='ml-4 mt-2'>
                                                                    {item.submenus?.map((submenu) => (
                                                                        <li key={submenu.name}>
                                                                            <a
                                                                                href={submenu.href}
                                                                                className={classNames(
                                                                                    pathname === submenu.href
                                                                                        ? 'text-indigo-600 bg-gray-50'
                                                                                        : 'text-gray-700 hover:text-indigo-600',
                                                                                    'block p-2 text-sm leading-6 font-semibold hover:bg-gray-50'
                                                                                )}
                                                                            >
                                                                                {submenu.name}
                                                                            </a>
                                                                        </li>
                                                                    ))}
                                                                </ul>
                                                            )}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </li>

                                            {/* Folders */}
                                            {menuData && menuData.folders && (
                                                <li>
                                                    <div className='text-xs font-semibold leading-6 text-gray-400'>Folders</div>
                                                    <ul role='list' className='-mx-2 mt-2 space-y-1'>
                                                        {menuData.folders.map((folder) => (
                                                            <li key={folder.folderId}>
                                                                <div className='flex items-center justify-between'>
                                                                    <button
                                                                        onClick={() => handleFolderClick(folder.folderId)}
                                                                        className={classNames(
                                                                            false
                                                                                ? 'bg-gray-50 text-indigo-600'
                                                                                : 'text-gray-700 hover:text-indigo-600 hover:bg-gray-50',
                                                                            'group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold'
                                                                        )}
                                                                    >
                                                                        <FolderIcon className='h-6 w-6 shrink-0' aria-hidden='true' />
                                                                        <span className='truncate'>{folder.name}</span>
                                                                    </button>
                                                                    {folder.subFolders.length > 0 && (
                                                                        <button onClick={() => toggleSubFolders(folder.folderId)} className='p-1'>
                                                                            {openSubFolders.includes(folder.folderId) ? (
                                                                                <ChevronDownIcon className='h-5 w-5' />
                                                                            ) : (
                                                                                <ChevronRightIcon className='h-5 w-5' />
                                                                            )}
                                                                        </button>
                                                                    )}
                                                                </div>

                                                                {/* Subfolders */}
                                                                {openSubFolders.includes(folder.folderId) && (
                                                                    <ul className='mt-2 ml-4 space-y-1'>
                                                                        {folder.subFolders.map((subFolder) => (
                                                                            <li
                                                                                key={subFolder.folderId}
                                                                                className='truncate text-sm leading-6 font-semibold text-gray-700 hover:text-indigo-600'
                                                                            >
                                                                                <button
                                                                                    onClick={() => handleFolderClick(subFolder.folderId)}
                                                                                    className='flex items-center gap-x-2'
                                                                                >
                                                                                    <FolderIcon
                                                                                        className='inline-block h-4 w-4 shrink-0'
                                                                                        aria-hidden='true'
                                                                                    />
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

                                            {/* Settings (Currenly has no functionality) */}
                                            <li className='mt-auto'>
                                                <a
                                                    href='#'
                                                    className='group -mx-2 flex gap-x-3 rounded-md p-2 text-sm font-semibold leading-6 text-gray-700 hover:bg-gray-50 hover:text-indigo-600'
                                                >
                                                    <Cog6ToothIcon
                                                        className='h-6 w-6 shrink-0 text-gray-400 group-hover:text-indigo-600'
                                                        aria-hidden='true'
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
