/**
 * Edit Item Form
 * This component is used to edit an item
 * It is a client component and all the code is executed on the client side.
 */
'use client';

import React, { useCallback, useState, useEffect } from 'react';
import { DocumentIcon, TrashIcon, CheckIcon, ChevronUpDownIcon } from '@heroicons/react/24/solid';
import { Combobox } from '@headlessui/react';
import { ComboboxFolder } from '@/types/Item';
import NewItemFolder from '@/components/items/new-item-folder';
import { FolderHierarchy } from '@/types/Folder';
import { encryptText, encryptFile } from '@/services/cryptoServiceClient';
import { getMasterPasswordFromServiceWorker } from '@/services/serviceWorkerUtils';
import { useRouter } from 'next/navigation';
import LoadingModal from '@/components/common/loading-modal';
import { ItemProps } from '@/types/Item';
import { decryptText, decryptFile } from '@/services/cryptoServiceClient';
import { EncryptedFile } from '@/types/Crypto';
import { classNames } from '@/utils/pageUtils';
import AlertDialog from '@/components/common/alert-dialog';
import { useAlertDialog } from '@/components/hook/use-alert-dialog';

/**
 * Function to get the folders from the API
 * @returns
 */
const getFolders = async (): Promise<FolderHierarchy> => {
    // Get the folders from API
    try {
        // Get the folders for the user
        const response = await fetch('/api/item/folder', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        let data = await response.json();

        if (response.ok) {
            return { folders: data.folders, rootFolders: data.rootFolders };
        }

        return { folders: [], rootFolders: [] };
    } catch (error) {
        console.error('Failed to get folders:', error);
        return { folders: [], rootFolders: [] };
    }
};

const EditItemForm = ({ item }: ItemProps) => {
    // The root folder
    const rootFolder: ComboboxFolder = { id: 0, name: 'Root Folder', parent_folder_id: 0 };

    // State to manage the loading state
    const [isInitialLoad, setIsInitialLoad] = useState(true);
    const [isLoading, setIsLoading] = useState(true);
    const [loadingMessage, setLoadingMessage] = useState('Decrypting Data...');

    // State to manage the form inputs
    const [title, setTitle] = useState(item.name);
    const [description, setDescription] = useState(item.description);
    const [sensitiveData, setSensitiveData] = useState(item.data);
    const [query, setQuery] = useState('');
    const [files, setFiles] = useState<File[]>([]);
    const [isNewFolderModalOpen, setIsNewFolderModalOpen] = useState(false);
    const [folders, setFolders] = useState<ComboboxFolder[]>([]);
    const [rootFolders, setRootFolders] = useState<ComboboxFolder[]>([]);
    const [tags, setTags] = useState<string[]>([]);
    const [tagInput, setTagInput] = useState('');
    const [selectedFolder, setSelectedFolder] = useState<ComboboxFolder>(rootFolder);

    // This is for creating a new folder along with the new item
    const [selectedParentFolder, setSelectedParentFolder] = useState({ id: 0, name: '', parent_folder_id: 0 });

    // State to manage the alert dialog
    const { isDialogVisible, alertDialog, showDialog } = useAlertDialog();

    const router = useRouter();

    useEffect(() => {
        /**
         * Check if the master password is saved in the service worker
         * If the master password is not saved, redirect the user to the home page
         * Note: Service worker is only available in the client side
         */
        const checkMasterPassword = async () => {
            const masterPasswordFromServiceWorker = await getMasterPasswordFromServiceWorker();
            if (!masterPasswordFromServiceWorker) {
                // Redirect to home if no master password
                router.push('/');
            }

            return masterPasswordFromServiceWorker;
        };

        /**
         * Fetch the folders from the API
         */
        const fetchFoldersAsync = async () => {
            let folders = await getFolders();
            folders.folders.unshift({ id: -1, name: 'Add to New Folder', parent_folder_id: 0 });
            setFolders(folders.folders);
            setRootFolders(folders.rootFolders);
        };

        /**
         * Function to decrypt the data field of the item
         * @param data {string} The encrypted data
         * @param masterPassword  {string} The master password
         */
        const decryptData = async (data: string, masterPassword: string) => {
            const decryptedData = await decryptText(data, masterPassword);
            setSensitiveData(decryptedData);
        };

        /**
         * Function to decrypt the files of the item
         * @param encryptedFiles {EncryptedFile[]} The encrypted files
         * @param masterPassword {string} The master password
         */
        const decryptFiles = async (encryptedFiles: EncryptedFile[], masterPassword: string) => {
            // Decrypt all the files
            const decryptedFilesPromises = encryptedFiles.map(async (file) => {
                // Decrypt the file
                const decryptedFile = await decryptFile(file, masterPassword);

                // Return the decrypted file with the array buffer
                return decryptedFile
                    ? {
                          ...decryptedFile,
                          arrayBuffer: decryptedFile.decryptedBuffer.buffer.slice(
                              decryptedFile.decryptedBuffer.byteOffset,
                              decryptedFile.decryptedBuffer.byteOffset + decryptedFile.decryptedBuffer.byteLength
                          ),
                      }
                    : null;
            });

            // Await all the files to be decrypted
            const decryptedFiles = await Promise.all(decryptedFilesPromises);

            // Prevent adding duplicate files to the state since useEffect will run twice in development mode
            setFiles((prevFiles) => {
                const updatedFiles = [...prevFiles];
                decryptedFiles.forEach((decryptedFile) => {
                    if (decryptedFile && !prevFiles.some((file) => file.name === decryptedFile.filename)) {
                        const newFile = new File([decryptedFile.arrayBuffer], decryptedFile.filename, { type: decryptedFile.filetype });
                        updatedFiles.push(newFile);
                    }
                });
                return updatedFiles;
            });
        };

        /**
         * Function to set the tags from the item
         */
        const setTagsFromItem = () => {
            if (item.item_tags.length > 0) {
                setTags(item.item_tags.map((tag) => tag.tag.name));
            }
        };

        /**
         * Function to initialise the component
         */
        const initializeComponent = async () => {
            try {
                const masterPasswordFromServiceWorker = await checkMasterPassword();

                // Wait for all necessary operations to complete
                await Promise.all([
                    decryptData(item.data, masterPasswordFromServiceWorker),
                    decryptFiles(item.files, masterPasswordFromServiceWorker),
                    fetchFoldersAsync(),
                    setTagsFromItem(),
                ]);
            } catch (error) {
                console.error('Initialization failed:', error);
                setIsLoading(false);
            } finally {
                setIsLoading(false);
            }
        };

        initializeComponent();
    }, []);

    /**
     * useEffect to set the selected folder when the folders are loaded
     */
    useEffect(() => {
        // Only run this one time when the folders are loaded
        if (isInitialLoad && (item.folder?.folder_id ?? 0) > 0) {
            // Find the folder in the folders list
            const folder = folders.find((folder) => folder.id === item.folder?.folder_id);
            if (folder) {
                setSelectedFolder(folder);
                setIsInitialLoad(false);
            }
        }
    }, [folders]);

    /**
     * useEffect to filter the folders by the query
     */
    const filteredFolders =
        query === ''
            ? folders
            : folders.filter((folder) => {
                  return folder.name.toLowerCase().includes(query.toLowerCase());
              });

    /**
     * Function to handle file drop
     * @param event {React.DragEvent<HTMLDivElement>} The drag event
     */
    const onFileDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();

        const validFiles = Array.from(event.dataTransfer.files).filter(
            // File size should be 10MB or less
            (file) => file.size <= 10 * 1024 * 1024
        );

        // Some files are less than 10MB
        if (validFiles.length !== event.dataTransfer.files.length) {
            showDialog(true, {
                type: 'error',
                title: 'Error',
                message: 'Some files are larger than 10MB and will not be uploaded.',
                buttonText: 'OK',
                onButtonClick: () => showDialog(false),
            });

            return;
        }

        addFiles(event.dataTransfer.files);
    }, []);

    /**
     * Function to handle file input change
     * @param event {React.ChangeEvent<HTMLInputElement>} The change event
     */
    const onFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files) {
            const validFiles = Array.from(event.target.files).filter(
                // File size should be 10MB or less
                (file) => file.size <= 10 * 1024 * 1024
            );

            // Some files are less than 10MB
            if (validFiles.length !== event.target.files.length) {
                showDialog(true, {
                    type: 'error',
                    title: 'Error',
                    message: 'Some files are larger than 10MB and will not be uploaded.',
                    buttonText: 'OK',
                    onButtonClick: () => showDialog(false),
                });

                return;
            }

            addFiles(event.target.files);
        }
    };

    /**
     * Function to allow drag and drop
     * @param event
     */
    const onDragOver = (event: React.DragEvent<HTMLDivElement>) => {
        // Prevent default behavior (prevent file from being opened)
        event.preventDefault();
    };

    /**
     * Function to add files to the state
     * @param newFiles {FileList} The new files to be added
     */
    const addFiles = (newFiles: FileList) => {
        setFiles((prevFiles) => [...prevFiles, ...Array.from(newFiles)]);
    };

    /**
     * Function to remove a file from the state
     * @param fileIndex {number} The index of the file to be removed
     */
    const removeFile = (fileIndex: number) => {
        setFiles((prevFiles) => prevFiles.filter((_, index) => index !== fileIndex));
    };

    /**
     * Function to add a new folder
     * @param newFolderName {string} The name of the new folder
     */
    const addNewFolder = (newFolderName: string) => {
        // Add the new folder to the folders list
        // Use id -1 to indicate that this is a new folder
        const newFolder = { id: -1, name: newFolderName, parent_folder_id: 0 };

        // Add the new folder to the folders list
        setFolders([...folders, newFolder]);

        // Select the selected folder to the new folder
        setSelectedFolder(newFolder);
    };

    /**
     * Function to handle the folder change
     * @param folder {ComboboxFolder} The selected folder
     */
    const onFolderChange = (folder: ComboboxFolder) => {
        if (folder.id === -1) {
            // Open modal for user to add a new folder
            setIsNewFolderModalOpen(true);
        } else {
            setSelectedFolder(folder);
        }
    };

    /**
     * Function to add a tag by pressing Enter
     * @param event {React.KeyboardEvent<HTMLInputElement>} The key press event
     */
    const addTag = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter') {
            // Prevent form submission
            event.preventDefault();
            if (tagInput) {
                setTags((prevTags) => [...prevTags, tagInput]);
                setTagInput('');
            }
        }
    };

    /**
     * Function to remove a tag
     * @param index {number} The index of the tag to be removed
     */
    const removeTag = (index: number) => {
        setTags((prevTags) => prevTags.filter((_, i) => i !== index));
    };

    /**
     * Function to handle the form submission
     * @param event {React.FormEvent<HTMLFormElement>} The form submission event
     */
    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const errors: string[] = [];

        // Check if the title is valid
        if (title.length === 0 || title.length > 191) {
            errors.push('Title is invalid');
        }

        // Check if the description is valid (the description is optional)
        if (description && description.length > 191) {
            errors.push('Description is too long');
        }

        // Check if the sensitive data is valid
        if (sensitiveData.length === 0 || sensitiveData.length > 5000) {
            errors.push('Sensitive data is invalid');
        }

        // Check if the selected folder is valid
        if (selectedFolder.id < -1) {
            errors.push('Selected folder is invalid');
        }

        // Check if the tags are valid
        for (const tag of tags) {
            if (tag.length === 0 || tag.length > 191) {
                errors.push('Tag is invalid');
            }
        }

        // Show the first error message if there are any errors
        if (errors.length > 0) {
            showDialog(true, {
                type: 'error',
                title: 'Error',
                message: errors[0],
                buttonText: 'OK',
                onButtonClick: () => showDialog(false),
            });

            return;
        }

        // Start processing the form data and files
        setIsLoading(true);
        setLoadingMessage('Encrypting Data...');

        // Get the derived master password from the service worker
        const masterPasswordFromServiceWorker = await getMasterPasswordFromServiceWorker();

        // Encrypt the data field
        // Salt is embedded in the encrypted data
        const encryptedSensitiveData = encryptText(sensitiveData, masterPasswordFromServiceWorker);

        // Encrypt the files
        const encryptedFiles = await Promise.all(
            files.map(async (file) => {
                const encryptedFile = await encryptFile(file, masterPasswordFromServiceWorker);
                if (encryptedFile) {
                    return encryptedFile;
                }
            })
        );

        // Declare the folder to be used in the request body
        // Because updating the selectedFolder state is asynchronous, and making the folder object inside the request body will not have the updated state
        let folder = selectedFolder;

        // Update the parent folder id if the selected folder is the new folder
        if (selectedFolder.id === -1) {
            folder = { ...selectedFolder, parent_folder_id: selectedParentFolder.id };
        }

        // Construct the request body
        const requestBody = {
            itemId: item.item_id,
            name: title,
            description,
            data: encryptedSensitiveData,
            files: encryptedFiles,
            folder: folder,
            tags,
        };

        // Update the loading message to show that the data is being saved
        setLoadingMessage('Saving Data...');

        // Send the request to the API
        const res = await fetch('/api/item', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
        });

        const data = await res.json();

        if (res.ok) {
            setIsLoading(false);

            // Show the success message dialog
            showDialog(true, {
                type: 'success',
                title: 'Item Updated',
                message: 'The item has been updated successfully.',
                buttonText: 'OK',
                onButtonClick: () => {
                    // Close the alert dialog
                    showDialog(false);

                    // Redirect the user to the item page
                    // Use window.location.href to force a reload of the items
                    window.location.href = `/item/${item.item_id}`;
                },
            });
        } else {
            showDialog(true, {
                type: 'error',
                title: 'Error',
                message: 'Failed to update the item',
                buttonText: 'OK',
                onButtonClick: () => showDialog(false),
            });

            setIsLoading(false);
            alert(data.message);
        }
    };

    if (isLoading) {
        return <LoadingModal messaage={loadingMessage} />;
    }

    return (
        <div className='relative flex justify-center py-10' style={{ height: 'calc(100vh - 144px)' }}>
            {/* Item Edit Form */}
            <form className='w-full max-w-7xl' onSubmit={handleSubmit}>
                <div className='space-y-12'>
                    <div className='mt-10 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6'>
                        {/* Title */}
                        <div className='col-span-full'>
                            <label htmlFor='title' className='block text-sm font-medium leading-6 text-gray-900'>
                                Title
                            </label>
                            <div className='mt-2'>
                                <input
                                    type='text'
                                    name='title'
                                    id='title'
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    maxLength={191} // The maximum length of a MySQL VARCHAR is 255 characters, but it will become 191 when using the default setting of prisma migrate
                                    className='block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6'
                                    autoComplete='off'
                                />
                            </div>
                        </div>

                        {/* Description */}
                        <div className='col-span-full'>
                            <label htmlFor='description' className='block text-sm font-medium leading-6 text-gray-900'>
                                Description
                            </label>
                            <div className='mt-2'>
                                <input
                                    id='description'
                                    name='description'
                                    value={description || ''}
                                    onChange={(e) => setDescription(e.target.value)}
                                    maxLength={191} // The maximum length of a MySQL VARCHAR is 255 characters, but it will become 191 when using the default setting of prisma migrate
                                    className='block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6'
                                    autoComplete='off'
                                />
                            </div>
                        </div>

                        {/* Sensitive Data */}
                        <div className='col-span-full'>
                            <label htmlFor='sensitive-data' className='block text-sm font-medium leading-6 text-gray-900'>
                                Sensitive Data
                            </label>
                            <p className='mt-1 text-sm leading-6 text-gray-600'>The sensitive data below will be encrypted.</p>
                            <div className='mt-2'>
                                <textarea
                                    id='sensitive-data'
                                    name='sensitive-data'
                                    rows={10}
                                    value={sensitiveData}
                                    onChange={(e) => setSensitiveData(e.target.value)}
                                    maxLength={5000}
                                    className='block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6'
                                />
                            </div>
                        </div>

                        <div className='col-span-full'>
                            {/* File Upload Section */}
                            <label htmlFor='file-upload' className='block text-sm font-medium leading-6 text-gray-900'>
                                Attachments
                            </label>
                            <div
                                className='mt-2 flex justify-center rounded-lg border border-dashed border-gray-900/25 px-6 py-10'
                                onDrop={onFileDrop}
                                onDragOver={onDragOver}
                            >
                                <div className='text-center'>
                                    <DocumentIcon className='mx-auto h-12 w-12 text-gray-300' aria-hidden='true' />
                                    <div className='mt-4 flex text-sm leading-6 text-gray-600'>
                                        <label
                                            htmlFor='file-upload'
                                            className='relative cursor-pointer rounded-md bg-white font-semibold text-indigo-600 focus-within:outline-none focus-within:ring-2 focus-within:ring-indigo-600 focus-within:ring-offset-2 hover:text-indigo-500'
                                        >
                                            <span>Upload a file</span>
                                            <input
                                                id='file-upload'
                                                name='file-upload'
                                                type='file'
                                                multiple
                                                className='sr-only' // This hides the input element from the screen
                                                onChange={onFileInputChange}
                                            />
                                        </label>
                                        <p className='pl-1'>or drag and drop</p>
                                    </div>
                                    <p className='text-xs leading-5 text-gray-600'>files up to 10MB</p>
                                </div>
                            </div>

                            {/* Uploaded Files List */}
                            {files.length > 0 && (
                                <div className='mt-4'>
                                    <label className='block text-sm font-medium leading-6 text-gray-900'>Uploaded Files</label>
                                    {files.map((file, index) => (
                                        <div key={index} className='flex items-center justify-between p-2 border-b border-gray-200'>
                                            <a
                                                href={URL.createObjectURL(file)}
                                                download={file.name}
                                                className='text-sm text-indigo-600 hover:text-indigo-800'
                                            >
                                                {file.name}
                                            </a>
                                            <button onClick={() => removeFile(index)} className='text-red-600 hover:text-red-800'>
                                                <TrashIcon className='h-5 w-5' />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Folder */}
                        <div className='col-span-full'>
                            <Combobox as='div' value={selectedFolder} onChange={onFolderChange}>
                                <Combobox.Label className='block text-sm font-medium leading-6 text-gray-900'>Folder</Combobox.Label>
                                <div className='relative mt-2'>
                                    <Combobox.Input
                                        autoComplete='off'
                                        className='w-full rounded-md border-0 bg-white py-1.5 pl-3 pr-10 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6'
                                        onChange={(event) => setQuery(event.target.value)}
                                        displayValue={(folder: ComboboxFolder) => (folder?.id !== 0 ? folder.name : '')}
                                    />
                                    <Combobox.Button className='absolute inset-y-0 right-0 flex items-center rounded-r-md px-2 focus:outline-none'>
                                        <ChevronUpDownIcon className='h-5 w-5 text-gray-400' aria-hidden='true' />
                                    </Combobox.Button>

                                    {filteredFolders.length > 0 && (
                                        <Combobox.Options className='absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm'>
                                            {filteredFolders.map((folder) => (
                                                <Combobox.Option
                                                    key={folder.id}
                                                    value={folder}
                                                    className={({ active }) =>
                                                        classNames(
                                                            'relative cursor-default select-none py-2 pl-3 pr-9',
                                                            active ? 'bg-indigo-600 text-white' : 'text-gray-900'
                                                        )
                                                    }
                                                >
                                                    {({ active, selected }) => (
                                                        <>
                                                            <span className={classNames('block truncate', selected && 'font-semibold')}>
                                                                {folder.name}
                                                            </span>

                                                            {selected && (
                                                                <span
                                                                    className={classNames(
                                                                        'absolute inset-y-0 right-0 flex items-center pr-4',
                                                                        active ? 'text-white' : 'text-indigo-600'
                                                                    )}
                                                                >
                                                                    <CheckIcon className='h-5 w-5' aria-hidden='true' />
                                                                </span>
                                                            )}
                                                        </>
                                                    )}
                                                </Combobox.Option>
                                            ))}
                                        </Combobox.Options>
                                    )}
                                </div>
                            </Combobox>

                            {/* New Folder Modal */}
                            <NewItemFolder
                                isNewFolderModalOpen={isNewFolderModalOpen}
                                setIsNewFolderModalOpen={setIsNewFolderModalOpen}
                                selectedParentFolder={selectedParentFolder}
                                setSelectedParentFolder={setSelectedParentFolder}
                                addNewFolder={addNewFolder}
                                rootFolders={rootFolders}
                            />
                        </div>

                        {/* Tags Input */}
                        <div className='col-span-full'>
                            <label htmlFor='tags' className='block text-sm font-medium leading-6 text-gray-900'>
                                Tags
                            </label>
                            <input
                                type='text'
                                name='tags'
                                id='tags'
                                value={tagInput}
                                onChange={(e) => setTagInput(e.target.value)}
                                onKeyDown={addTag}
                                className='mt-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm'
                                placeholder='Add a tag and press Enter'
                            />
                            <div className='mt-2 flex flex-wrap gap-2'>
                                {tags.map((tag, index) => (
                                    <div key={index} className='flex items-center gap-2 rounded bg-indigo-100 px-2 py-1 text-sm'>
                                        <span>{tag}</span>
                                        <button type='button' onClick={() => removeTag(index)} className='text-indigo-500 hover:text-indigo-700'>
                                            &times;
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Save and Cancel Buttons */}
                <div className='flex items-center justify-end gap-x-6 py-10'>
                    <button type='button' className='text-sm font-semibold leading-6 text-gray-900'>
                        Cancel
                    </button>
                    <button
                        type='submit'
                        className='rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600'
                        disabled={isLoading}
                    >
                        Save
                    </button>
                </div>
            </form>

            {/* Alert Dialog */}
            <AlertDialog open={isDialogVisible} setOpen={(show) => showDialog(show)} {...alertDialog} />
        </div>
    );
};

export default EditItemForm;
