/**
 * Custom alert component
 */

import { XCircleIcon, CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/20/solid';
import { AlertComponentProps } from '@/types/Alert';

const CustomAlert = ({ type, title, messages }: AlertComponentProps) => {
    // The icon classes for fixed width and height
    const iconClasses = 'h-5 w-5';

    // Determine icon and colour based on alert type
    let icon, bgColor, textColor, titleColor;

    switch (type) {
        case 'success':
            icon = <CheckCircleIcon className={`${iconClasses} text-green-400`} aria-hidden='true' />;
            bgColor = 'bg-green-50';
            textColor = 'text-green-700';
            titleColor = 'text-green-800';
            break;
        case 'warning':
            icon = <ExclamationTriangleIcon className={`${iconClasses} text-yellow-400`} aria-hidden='true' />;
            bgColor = 'bg-yellow-50';
            textColor = 'text-yellow-700';
            titleColor = 'text-yellow-800';
            break;
        default:
            // Default to error if type is not specified or the type is 'error'
            icon = <XCircleIcon className={`${iconClasses} text-red-400`} aria-hidden='true' />;
            bgColor = 'bg-red-50';
            textColor = 'text-red-700';
            titleColor = 'text-red-800';
    }

    return (
        <div className={`rounded-md ${bgColor} p-4 my-4 text-left`}>
            <div className='flex'>
                {/* Icon */}
                <div className='flex-shrink-0'>{icon}</div>
                <div className='ml-3'>
                    {/* Title */}
                    <h3 className={`text-sm font-medium ${titleColor}`}>{title}</h3>

                    {/* Messages */}
                    <div className={`mt-2 text-sm ${textColor}`}>
                        <ul role='list' className='list-disc space-y-1 pl-5'>
                            {messages.map((message, index) => (
                                <li key={index}>{message}</li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CustomAlert;
