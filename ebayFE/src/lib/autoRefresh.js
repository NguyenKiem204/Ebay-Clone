export function isUserInteractingWithForm() {
    if (typeof document === 'undefined') {
        return false;
    }

    const activeElement = document.activeElement;
    if (!activeElement) {
        return false;
    }

    const tagName = activeElement.tagName?.toLowerCase();
    return tagName === 'input'
        || tagName === 'textarea'
        || tagName === 'select'
        || activeElement.isContentEditable === true;
}
