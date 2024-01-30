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