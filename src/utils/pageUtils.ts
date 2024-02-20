/**
 * Helper function to join class names together for Tailwind CSS
 * @param classes {any[]}
 * @returns {string} The joined class names
 */
export const classNames = (...classes: any[]) => {
    return classes.filter(Boolean).join(' ');
};
