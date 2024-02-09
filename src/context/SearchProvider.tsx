'use client'

import React, { ReactNode, createContext, useContext, useState } from 'react';

// Define the shape of the context data for TypeScript
interface SearchContextType {
    searchQuery: string;
    setSearchQuery: (query: string) => void;
}

// Providing a default value matching the context type
const defaultValue: SearchContextType = {
    searchQuery: '',
    setSearchQuery: () => {}, // Function placeholder
};

const SearchContext = createContext<SearchContextType>(defaultValue);

export const useSearch = () => useContext(SearchContext);

export const SearchProvider = ({ children }: { children: ReactNode }) => {
    const [searchQuery, setSearchQuery] = useState('');

    return (
        <SearchContext.Provider value={{ searchQuery, setSearchQuery }}>
            {children}
        </SearchContext.Provider>
    );
};
