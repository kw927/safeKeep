'use client'
import { EllipsisVerticalIcon } from '@heroicons/react/20/solid'
import { AllItemsProps } from '@/types/Item';
import { useRouter } from 'next/navigation';

const classNames = (...classes: any[]) => classes.filter(Boolean).join(' ');

const AllItems = ({ items }: AllItemsProps) => {
    const router = useRouter();

    const navigateToItem = (itemId: number) => {
        router.push(`./item/${itemId}`);
    };

    return (
        <div>
            <ul role="list" className="mt-3 grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
                {items.map((item) => (
                    <li key={item.name} className="col-span-1 flex rounded-md shadow-sm">
                        <div
                            className="flex w-full hover:border-blue-500 border border-gray-200 rounded-md cursor-pointer"
                            onClick={() => navigateToItem(item.id)}
                            aria-role="button"
                            tabIndex={0}
                        >
                            <div
                                className={classNames(
                                    item.color,
                                    'flex w-16 flex-shrink-0 items-center justify-center rounded-l-md text-sm font-medium text-white'
                                )}
                            >
                                {item.initials}
                            </div>
                            <div className="flex flex-1 items-center justify-between truncate rounded-r-md border-b border-r border-t border-gray-200 bg-white">
                                <div className="flex-1 truncate px-4 py-2 text-sm">
                                    {/* Title and description */}
                                    <div className="font-medium text-gray-900 hover:text-gray-600">
                                        {item.name}
                                    </div>
                                    <p className="text-gray-500" style={{ WebkitLineClamp: 2, display: '-webkit-box', WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                        {item.description} Members
                                    </p>
                                </div>
                            </div>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
}

export default AllItems;