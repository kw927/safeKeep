/**
 * Item View Component
 * This component is used to display the details of an item
 * It decrypts the data and files and displays the details
 * It also provides options to copy the data and download the files
 * This component is a client component and all the code is executed on the client side.
 */
'use client';

import React, { useState, useEffect } from 'react';
import { FolderIcon, EyeIcon, EyeSlashIcon, ClipboardDocumentIcon, DocumentArrowDownIcon } from '@heroicons/react/24/solid';
import { getMasterPasswordFromServiceWorker } from '@/services/serviceWorkerUtils';
import { useRouter } from 'next/navigation';
import { ItemProps } from '@/types/Item';
import LoadingModal from '@/components/common/loading-modal';
import { decryptText, decryptFile } from '@/services/cryptoServiceClient';
import { DecryptedFile } from '@/types/Crypto';
import AlertDialog from '@/components/common/alert-dialog';
import { useAlertDialog } from '@/components/hook/use-alert-dialog';

const ItemView = ({ item }: ItemProps) => {
    const router = useRouter();

    // State to manage the loading state
    const [isLoading, setIsLoading] = useState(true);

    // State to manage the visibility of sensitive data
    const [showSensitiveData, setShowSensitiveData] = useState(false);

    // State to manage the decrypted data
    const [decryptedData, setDecryptedData] = useState('');
    const [decryptedFiles, setDecryptedFiles] = useState<DecryptedFile[]>([]);

    // State to manage the alert dialog
    const { isDialogVisible, alertDialog, showDialog } = useAlertDialog();

    /**
     * Check if the master password is saved in the service worker
     * If the master password is not saved, redirect the user to the home page
     * Note: Service worker is only available in the client side
     */
    useEffect(() => {
        const decrypteData = async () => {
            const masterPasswordFromServiceWorker = await getMasterPasswordFromServiceWorker();

            if (!masterPasswordFromServiceWorker) {
                // Redirect the user to the home page
                router.push('/');
            } else {
                // Decrypt the data
                const decryptedData = await decryptText(item.data, masterPasswordFromServiceWorker);
                setDecryptedData(decryptedData);
                setIsLoading(false);

                // Decrypt the files
                const decryptedFiles: DecryptedFile[] = [];
                item.files.forEach(async (file) => {
                    const decryptedFile = await decryptFile(file, masterPasswordFromServiceWorker);
                    if (decryptedFile) {
                        decryptedFiles.push(decryptedFile);
                    }
                });
                setDecryptedFiles(decryptedFiles);
            }
        };

        decrypteData();
    }, []);

    /**
     * Function to toggle the visibility of sensitive data
     */
    const toggleSensitiveDataVisibility = () => {
        setShowSensitiveData(!showSensitiveData);
    };

    /**
     * Function to copy the sensitive data to the clipboard
     */
    const copySensitiveDataToClipboard = async () => {
        // TODO: change the alert to a toast would be better
        try {
            await navigator.clipboard.writeText(decryptedData);

            // Show the success message
            showDialog(true, {
                type: 'success',
                title: 'Success',
                message: 'Sensitive data copied to clipboard.',
                buttonText: 'OK',
                onButtonClick: () => showDialog(false),
            });
        } catch (err) {
            showDialog(true, {
                type: 'error',
                title: 'Error',
                message: 'Failed to copy data to clipboard.',
                buttonText: 'OK',
                onButtonClick: () => showDialog(false),
            });
        }
    };

    /**
     * Function to download the decrypted file
     * @param file {DecryptedFile} The decrypted file to download
     */
    const downloadFile = (file: DecryptedFile) => {
        // Convert the array of byte values to Uint8Array
        const uint8Array = new Uint8Array(file.decryptedBuffer);

        // Create a Blob from the Uint8Array
        const blob = new Blob([uint8Array], { type: file.filetype });

        // Generate a URL for the Blob and trigger the download
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.filename;
        document.body.appendChild(a);
        a.click();

        // Clean up the URL and remove the anchor element
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    };

    if (isLoading) {
        return <LoadingModal messaage='Decrypting Data...' />;
    }

    return (
        <div className='relative flex justify-center py-10' style={{ height: 'calc(100vh - 144px)' }}>
            <div className='w-full max-w-7xl'>
                <div className='space-y-12'>
                    <div className='mt-10 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6'>
                        {/* Title Display */}
                        <div className='col-span-full'>
                            <label htmlFor='title' className='block text-base font-medium leading-6 text-gray-900'>
                                Title
                            </label>
                            <p className='mt-1 text-base leading-6 text-gray-600'>{item.name}</p>
                        </div>

                        {/* Description Display */}
                        <div className='col-span-full'>
                            <label htmlFor='description' className='block text-base font-medium leading-6 text-gray-900'>
                                Description
                            </label>
                            <p className='mt-1 text-base leading-6 text-gray-600 break-words'>{item.description}</p>
                        </div>

                        {/* Data Display */}
                        <div className='col-span-full'>
                            <label htmlFor='sensitive-data' className='block text-base font-medium leading-6 text-gray-900'>
                                Data
                            </label>
                            <div className='mt-1 flex items-center space-x-2'>
                                <div className='flex-1 p-2 rounded-md bg-gray-100 text-gray-600 break-all overflow-hidden'>
                                    {showSensitiveData ? (
                                        <p style={{ wordWrap: 'break-word', whiteSpace: 'pre-wrap' }}>{decryptedData}</p>
                                    ) : (
                                        <p>••••••••••••••••</p>
                                    )}
                                </div>
                                <button onClick={toggleSensitiveDataVisibility} className='p-1 text-gray-500 hover:text-indigo-600'>
                                    {showSensitiveData ? <EyeSlashIcon className='h-5 w-5' /> : <EyeIcon className='h-5 w-5' />}
                                </button>
                                <button onClick={copySensitiveDataToClipboard} className='p-1 text-gray-500 hover:text-indigo-600'>
                                    <ClipboardDocumentIcon className='h-5 w-5' />
                                </button>
                            </div>
                        </div>

                        {/* Decrypted Files List */}
                        {decryptedFiles.length > 0 && (
                            <div className='col-span-full mt-4'>
                                <label className='block text-sm font-medium leading-6 text-gray-900'>Files</label>
                                {decryptedFiles.map((file, index) => (
                                    <div key={index} className='flex items-center justify-between p-2 border-b border-gray-200'>
                                        {/* Make filename a link for download */}
                                        <a
                                            href='#'
                                            onClick={(e) => {
                                                e.preventDefault(); // Prevent the default anchor action
                                                downloadFile(file);
                                            }}
                                            className='text-sm text-gray-600 hover:text-indigo-600'
                                        >
                                            {file.filename}
                                        </a>
                                        {/* Download button */}
                                        <button onClick={() => downloadFile(file)} className='text-gray-500 hover:text-indigo-600'>
                                            <DocumentArrowDownIcon className='h-5 w-5' />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Folder Display */}
                        <div className='col-span-full'>
                            <label className='block text-base font-medium leading-6 text-gray-900'>Folder</label>
                            <div className='mt-1 flex max-w-xs items-center p-2 rounded-md bg-indigo-50 text-gray-900 shadow ring-1 ring-inset ring-gray-300'>
                                <FolderIcon className='h-5 w-5 text-indigo-600 mr-2' aria-hidden='true' />
                                <span className='text-base leading-6'>{item.folder?.name || 'No Folder Selected'}</span>
                            </div>
                        </div>

                        {/* Tags Display */}
                        {item.item_tags.length > 0 && (
                            <div className='col-span-full'>
                                <label htmlFor='tags' className='block text-sm font-medium leading-6 text-gray-900'>
                                    Tags
                                </label>
                                <div className='mt-2 flex flex-wrap gap-2'>
                                    {item.item_tags.map((tag, index) => (
                                        <div key={index} className='flex items-center gap-2 rounded bg-indigo-50 px-2 py-1 text-sm'>
                                            <span>{tag.tag.name}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div><p></p>
                </div>
            </div>

            {/* Alert Dialog */}
            <AlertDialog open={isDialogVisible} setOpen={(show) => showDialog(show)} {...alertDialog} />
        </div>
    );
};

export default ItemView;
