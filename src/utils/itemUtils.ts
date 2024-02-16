import { ListItem } from '@/types/Item';

/**
 * Function to get the color based on the first letter of the name
 * @param name {string} The name to get the color for
 * @returns {string} The color in hex format, e.g. #f87171
 */
const getColorByName = (name: string) => {
    const colors: { [key: string]: string } = {
        'A': '#f87171', // bg-red-500
        'B': '#34d399', // bg-green-500
        'C': '#60a5fa', // bg-blue-500
        'D': '#f97316', // bg-orange-500
        'E': '#fde047', // bg-yellow-500
        'F': '#14b8a6', // bg-teal-500
        'G': '#db2777', // bg-pink-600
        'H': '#8b5cf6', // bg-purple-600
        'I': '#6366f1', // bg-indigo-500
        'J': '#ef4444', // bg-red-600
        'K': '#22c55e', // bg-green-600
        'L': '#2563eb', // bg-blue-600
        'M': '#ea580c', // bg-orange-600
        'N': '#eab308', // bg-yellow-600
        'O': '#0d9488', // bg-teal-600
        'P': '#be185d', // bg-pink-700
        'Q': '#9333ea', // bg-purple-700
        'R': '#4f46e5', // bg-indigo-700
        'S': '#b91c1c', // bg-red-700
        'T': '#15803d', // bg-green-700
        'U': '#1d4ed8', // bg-blue-700
        'V': '#c2410c', // bg-orange-700
        'W': '#ca8a04', // bg-yellow-700
        'X': '#115e59', // bg-teal-700
        'Y': '#9d174d', // bg-pink-800
        'Z': '#6d28d9', // bg-purple-800
    };

    // The default colour to use if the first letter is not in the list
    // For example, if the name starts with a number, symbol, other language character, etc.
    const defaultColor = '#6b7280'; // bg-gray-500

    if (name.length === 0) {
        return defaultColor;
    }
    const firstLetter = name.charAt(0).toUpperCase();
    return colors[firstLetter] || defaultColor;
}

/**
 * Function to get the item detail including the initials and color
 * @param item {item: {item_id: number, name: string, description: string | null, is_favorite: boolean}}
 * @returns {ListItem} The item with detail
 */
export const getItemDetail = (item: { item_id: number, name: string, description: string | null, is_favorite: boolean }) => {
    const initials = item.name.split(' ').slice(0, 2).map(n => n[0]).join('');
    const bgColor = getColorByName(item.name);

    const listItem: ListItem = {
        id: item.item_id,
        name: item.name,
        description: item.description ?? '', // Use nullish coalescing operator to provide a default value if it is null or undefined
        initials,
        color: bgColor
    };
    return listItem;
}
