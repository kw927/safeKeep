/**
 * This file contains the context provider for the search query.
 */
'use client';

import React, { ReactNode, createContext, useContext, useState } from 'react';

// Define the type for the SearchContext
interface SearchContextType {
    searchQuery: string;
    setSearchQuery: (query: string) => void;
}

// Providing a default value matching the context type
const defaultValue: SearchContextType = {
    searchQuery: '',
    setSearchQuery: () => {}, // Function placeholder
};

// Create the SearchContext
const SearchContext = createContext<SearchContextType>(defaultValue);

// Create a custom hook to use the SearchContext
export const useSearch = () => useContext(SearchContext);

// Create the SearchProvider component
export const SearchProvider = ({ children }: { children: ReactNode }) => {
    const [searchQuery, setSearchQuery] = useState('');

    return <SearchContext.Provider value={{ searchQuery, setSearchQuery }}>{children}</SearchContext.Provider>;
};
