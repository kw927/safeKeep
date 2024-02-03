import { Fragment, useState, useRef, useEffect } from 'react'
import { Dialog, Transition, Combobox } from '@headlessui/react'
import { CheckIcon, ChevronUpDownIcon } from '@heroicons/react/24/outline'
import { NewItemFolderProps, ComboboxFolder } from '@/types/Item'

const NewItemFolder = ({ isNewFolderModalOpen, setIsNewFolderModalOpen, selectedParentFolder, setSelectedParentFolder, addNewFolder, rootFolders }: NewItemFolderProps) => {
    const rootFolder: ComboboxFolder = { id: 0, name: '', parent_folder_id: 0 };
    const [newFolderName, setNewFolderName] = useState('');
    // This ref is used to set the focus on the input field when the modal opens
    const newFolderNameInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isNewFolderModalOpen) {
            // Since the combobox from headlessui automatically sets the focus on the combobox input field
            // we need to set the focus on the input field after the combobox has set the focus, so that a timeout is needed
            setTimeout(() => {
                newFolderNameInputRef.current?.focus();
            }, 100);
        }
    }, [isNewFolderModalOpen]);


    const handleAddFolder = () => {
        addNewFolder(newFolderName);
        setNewFolderName('');
        setIsNewFolderModalOpen(false);
    };

    return (
        <Transition.Root show={isNewFolderModalOpen} as={Fragment}>
            <Dialog as="div" className="relative z-10" onClose={setIsNewFolderModalOpen}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
                </Transition.Child>

                <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
                    <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                            enterTo="opacity-100 translate-y-0 sm:scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                            leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                        >
                            <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-sm sm:p-6">
                                <Dialog.Title className="text-lg font-medium">Create New Folder</Dialog.Title>
                                <Combobox as="div" value={selectedParentFolder} onChange={setSelectedParentFolder}>
                                    <Combobox.Label className="block text-sm font-medium leading-6 text-gray-900">Parent Folder</Combobox.Label>
                                    <div className="relative mt-2">
                                        <Combobox.Input
                                            className="w-full rounded-md border-0 bg-white py-1.5 pl-3 pr-10 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                                            displayValue={(folder: ComboboxFolder) => folder?.name}
                                        />
                                        <Combobox.Button className="absolute inset-y-0 right-0 flex items-center rounded-r-md px-2 focus:outline-none">
                                            <ChevronUpDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                                        </Combobox.Button>
                                        <Combobox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                                            {[rootFolder, ...rootFolders].map((folder) => (
                                                <Combobox.Option
                                                    key={folder.id}
                                                    value={folder}
                                                    className={({ active }) =>
                                                        `relative cursor-default select-none py-2 pl-3 pr-9 ${active ? 'bg-indigo-600 text-white' : 'text-gray-900'
                                                        }`
                                                    }
                                                >
                                                    {({ selected, active }) => (
                                                        <>
                                                            <span className={`block truncate ${selected && 'font-semibold'}`}>
                                                                {folder.name}
                                                            </span>
                                                            {selected && (
                                                                <span className={`absolute inset-y-0 right-0 flex items-center pr-4 ${active ? 'text-white' : 'text-indigo-600'}`}>
                                                                    <CheckIcon className="h-5 w-5" aria-hidden="true" />
                                                                </span>
                                                            )}
                                                        </>
                                                    )}
                                                </Combobox.Option>
                                            ))}
                                        </Combobox.Options>
                                    </div>
                                </Combobox>
                                <input
                                    ref={newFolderNameInputRef}
                                    type="text"
                                    className="mt-2 w-full rounded-md border-gray-300 shadow-sm"
                                    placeholder="Folder name"
                                    value={newFolderName}
                                    onChange={(e) => setNewFolderName(e.target.value)}
                                />
                                <div className="mt-4 flex justify-end space-x-2">
                                    <button
                                        type="button"
                                        className="rounded-md bg-gray-200 px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-300"
                                        onClick={() => setIsNewFolderModalOpen(false)}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="button"
                                        className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                                        onClick={handleAddFolder}
                                    >
                                        Add Folder
                                    </button>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition.Root>
    )
}

export default NewItemFolder;