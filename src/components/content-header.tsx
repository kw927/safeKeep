'use client'

import React from 'react';
import { ContentHeadertProps } from '@/types/Header';
import { useRouter } from 'next/navigation';

/**
* The home component
* @param event 
*/
const ContentHeader = ({ title, button }: ContentHeadertProps) => {
    const router = useRouter();

    let buttonText = '';

    if (button) {
        if (button === 'add-item') {
            buttonText = 'Add Item';
        } else if (button.startsWith('edit-item')) {
            buttonText = 'Edit Item';
        }
    }

    const handleButtonClick = () => {
        if (!button) {
            return;
        }

        if (button === 'add-item') {
            // Redirect to the add item page
            router.push('/item/new');
        }

        if (button.startsWith('edit-item')) {
            // Extract the item id from the button id e.g. edit-item-1
            const itemId = button.split('-')[2];
            // Redirect to the add folder page
            router.push(`/item/edit/${itemId}`);
        }
    }

    return (
        <>
            <header>
                <div className="mx-auto max-w-7xl flex justify-between items-center">
                    <h1 className="text-3xl font-bold leading-tight tracking-tight text-gray-900">{title}</h1>
                    {button && (
                        <button
                            type="button"
                            onClick={handleButtonClick}
                            className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                        >
                            {buttonText}
                        </button>
                    )}
                </div>
            </header>
        </>
    );
}

export default ContentHeader;