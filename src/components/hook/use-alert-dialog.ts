/**
 * Custom hook to manage the alert dialog
 */
import { useState } from 'react';
import { AlertDialogProps } from '@/types/Alert';

export const useAlertDialog = () => {
    // State to manage the alert dialog
    const [isDialogVisible, setIsDialogVisible] = useState(false);
    const [alertDialog, setAlertDialog] = useState<Omit<AlertDialogProps, 'open' | 'setOpen'>>({
        type: 'success',
        title: '',
        message: '',
        buttonText: 'OK',
        onButtonClick: () => {},
    });

    /**
     * Function to show or hide the alert dialog
     * @param show {boolean} Whether to show or hide the dialog
     * @param dialogState  {Partial<Omit<AlertDialogProps, 'open' | 'setOpen'>>} The state of the dialog
     */
    const showDialog = (
        show: boolean,
        dialogState?: Partial<Omit<AlertDialogProps, 'open' | 'setOpen'>>
    ) => {
        setIsDialogVisible(show);
        if (dialogState) {
            setAlertDialog((prevState) => ({
                ...prevState,
                ...dialogState,
                onButtonClick: () => setIsDialogVisible(false),
            }));
        }
    };

    return { isDialogVisible, alertDialog, showDialog };
};
