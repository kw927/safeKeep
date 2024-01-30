'use client'

import React, { useState } from 'react';
import { HomeComponentProps } from '../types/Home';
import SetMasterPassword from './set-master-password';
import EnterMasterPassword from './enter-master-password';

/**
* The home component
* @param event 
*/
const HomeComponent = ({ salt }: HomeComponentProps) => {
    // State to set the overlay visibility
    const [isPasswordSet, setIsPasswordSet] = useState(salt === null);

    return (
        <div className="relative flex justify-center items-center" style={{ height: 'calc(100vh - 144px)' }}>
            {isPasswordSet ? (
                <SetMasterPassword />
            ) : (
                <EnterMasterPassword salt={salt as string} />
            )}
        </div>
                
    );
}

export default HomeComponent;