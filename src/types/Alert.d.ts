export interface AlertComponentProps {
    type: string;
    title: string;
    messages: string[];
}

export interface AlertState {
    show: boolean;
    type: 'error' | 'success' | 'warning';
    title: string;
    messages: string[];
}

export interface AlertDialogState {
    show: boolean;
    type: 'error' | 'success';
    title: string;
    message: string;
    buttonText: string;
    onButtonClick: () => void;
}

export interface AlertDialogProps {
    open: boolean;
    setOpen: (show: boolean) => void;
    type: 'error' | 'success';
    title: string;
    message: string;
    buttonText: string;
    onButtonClick: () => void;
}
