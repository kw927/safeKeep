/**
 * Top nav and content
 * This is a client component and all the code is executed on the client side
 */
'use client';

import { Fragment, ChangeEvent } from 'react';
import { Bars3Icon, BellIcon } from '@heroicons/react/24/outline';
import { MagnifyingGlassIcon, ChevronDownIcon } from '@heroicons/react/20/solid';
import { Transition, Menu } from '@headlessui/react';
import { TopNavProps } from '@/types/TopNav';
import { useSearch } from '@/context/SearchProvider';
import { useSession, signOut } from 'next-auth/react';
import { removeMasterPasswordFromServiceWorker } from '@/services/serviceWorkerUtils';
import { classNames } from '@/utils/pageUtils';

// Navigation items
// The profile link is not implemented yet
const userNavigation = [{ name: 'profile', href: '#' }, { name: 'Sign out' }];

const TopNavAndContent = ({ children, setSidebarOpen, showSearchBar }: TopNavProps) => {
    // Get the session data
    const { data: session, status } = useSession();

    // Get the search query and the function to set the search query
    const { searchQuery, setSearchQuery } = useSearch();

    /**
     * Function to handle the search input change
     * @param event {ChangeEvent<HTMLInputElement>} The input change event
     */
    const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(event.target.value);
    };

    /**
     * Function to handle the sign out
     */
    const handleSignOut = async () => {
        // Remove the master password from the service worker
        await removeMasterPasswordFromServiceWorker();

        // Sign out the user
        signOut();
    };

    return (
        <>
            {/* Top nav and content */}
            <div className='flex-grow lg:ml-72 w-full'>
                {/* Sticky search header */}
                <div className='sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8'>
                    <button type='button' className='-m-2.5 p-2.5 text-gray-700 lg:hidden' onClick={() => setSidebarOpen(true)}>
                        <Bars3Icon className='h-6 w-6' aria-hidden='true' />
                    </button>

                    {/* Separator */}
                    <div className='h-6 w-px bg-gray-200 lg:hidden' aria-hidden='true' />

                    {/* Search bar */}
                    <div className='flex flex-1 gap-x-4 self-stretch lg:gap-x-6'>
                        <form className='relative flex flex-1' action='#' method='GET'>
                            {showSearchBar && (
                                <>
                                    <MagnifyingGlassIcon
                                        className='pointer-events-none absolute inset-y-0 left-0 h-full w-5 text-gray-400'
                                        aria-hidden='true'
                                    />
                                    <input
                                        id='search-field'
                                        className='block h-full w-full border-0 py-0 pl-8 pr-0 text-gray-900 placeholder:text-gray-400 focus:ring-0 sm:text-sm'
                                        placeholder='Search...'
                                        type='search'
                                        name='search'
                                        value={searchQuery}
                                        onChange={handleSearchChange}
                                    />
                                </>
                            )}
                        </form>

                        {/* Notification (Currently not implemented) */}
                        <div className='flex items-center gap-x-4 lg:gap-x-6'>
                            <button type='button' className='-m-2.5 p-2.5 text-gray-400 hover:text-gray-500'>
                                <BellIcon className='h-6 w-6' aria-hidden='true' />
                            </button>

                            {/* Separator */}
                            <div className='hidden lg:block lg:h-6 lg:w-px lg:bg-gray-200' aria-hidden='true' />

                            {/* Profile dropdown */}
                            <Menu as='div' className='relative'>
                                <Menu.Button className='-m-1.5 flex items-center p-1.5'>
                                    <span className='h-8 w-8 rounded-full bg-gray-400 flex items-center justify-center ring-8 ring-white'>
                                        <svg className='h-5 w-5 text-white' viewBox='0 0 20 20' fill='currentColor' aria-hidden='true'>
                                            <path d='M10 8a3 3 0 100-6 3 3 0 000 6zM3.465 14.493a1.23 1.23 0 00.41 1.412A9.957 9.957 0 0010 18c2.31 0 4.438-.784 6.131-2.1.43-.333.604-.903.408-1.41a7.002 7.002 0 00-13.074.003z'></path>
                                        </svg>
                                    </span>
                                    <span className='hidden lg:flex lg:items-center'>
                                        <span className='ml-4 text-sm font-semibold leading-6 text-gray-900' aria-hidden='true'>
                                            {status === 'authenticated' ? `${session?.user?.firstName} ${session?.user?.lastName}` : 'Guest'}
                                        </span>
                                        <ChevronDownIcon className='ml-2 h-5 w-5 text-gray-400' aria-hidden='true' />
                                    </span>
                                </Menu.Button>
                                <Transition
                                    as={Fragment}
                                    enter='transition ease-out duration-100'
                                    enterFrom='transform opacity-0 scale-95'
                                    enterTo='transform opacity-100 scale-100'
                                    leave='transition ease-in duration-75'
                                    leaveFrom='transform opacity-100 scale-100'
                                    leaveTo='transform opacity-0 scale-95'
                                >
                                    {/* Dropdown menu */}
                                    <Menu.Items className='absolute right-0 z-10 mt-2.5 w-32 origin-top-right rounded-md bg-white py-2 shadow-lg ring-1 ring-gray-900/5 focus:outline-none'>
                                        {userNavigation.map((item) => (
                                            <Menu.Item key={item.name}>
                                                {({ active }) =>
                                                    item.name !== 'Sign out' ? (
                                                        <a
                                                            href={item.href}
                                                            className={classNames(
                                                                active ? 'bg-gray-50' : '',
                                                                'block px-3 py-1 text-sm leading-6 text-gray-900'
                                                            )}
                                                        >
                                                            {item.name}
                                                        </a>
                                                    ) : (
                                                        // Button for sign out
                                                        <button
                                                            onClick={handleSignOut}
                                                            className={classNames(
                                                                active ? 'bg-gray-50' : '',
                                                                'block w-full text-left px-3 py-1 text-sm leading-6 text-gray-900'
                                                            )}
                                                        >
                                                            {item.name}
                                                        </button>
                                                    )
                                                }
                                            </Menu.Item>
                                        ))}
                                    </Menu.Items>
                                </Transition>
                            </Menu>
                        </div>
                    </div>
                </div>

                {/* Main content */}
                <main className='py-10 w-full'>
                    <div className='px-4 sm:px-6 lg:px-8 py-10'>{children}</div>
                </main>
            </div>
        </>
    );
};

export default TopNavAndContent;
