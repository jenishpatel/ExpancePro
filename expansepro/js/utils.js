// js/utils.js

const toastMessage = document.getElementById('toast-message');
const confirmationModal = document.getElementById('confirmationModal');
const confirmModalTitle = document.getElementById('confirmation-modal-title');
const confirmModalMessage = document.getElementById('confirmation-modal-message');
const confirmYesBtn = document.getElementById('confirm-yes-btn');
const confirmNoBtn = document.getElementById('confirm-no-btn');

let resolveConfirmation; // To hold the promise resolve function

/**
 * Generates a unique ID for transactions/budgets.
 * @returns {number} A unique ID.
 */
export function generateID() {
    return Math.floor(Math.random() * 100000000);
}

/**
 * Displays a temporary toast message.
 * @param {string} message - The message to display.
 * @param {string} type - 'success', 'error', or default (neutral).
 */
export function showToast(message, type = '') {
    toastMessage.textContent = message;
    toastMessage.className = ''; // Clear existing classes
    toastMessage.classList.add('show');
    if (type) {
        toastMessage.classList.add(type);
    }

    setTimeout(() => {
        toastMessage.classList.remove('show');
        toastMessage.textContent = '';
    }, 3000);
}

/**
 * Gets a computed CSS variable value.
 * Useful for Chart.js styling in dark mode.
 * @param {string} varName - The name of the CSS variable (e.g., '--text-color-secondary').
 * @returns {string} The computed value.
 */
export function getCssVar(varName) {
    return getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
}

/**
 * Shows a custom confirmation modal.
 * @param {string} message - The message to display in the confirmation.
 * @param {string} [title='Confirm Action'] - The title of the confirmation modal.
 * @returns {Promise<boolean>} A promise that resolves to true if confirmed, false otherwise.
 */
export function showConfirmationModal(message, title = 'Confirm Action') {
    confirmModalTitle.textContent = title;
    confirmModalMessage.textContent = message;
    confirmationModal.classList.add('open');

    return new Promise(resolve => {
        resolveConfirmation = resolve; // Store the resolve function

        const handleYes = () => {
            confirmationModal.classList.remove('open');
            confirmYesBtn.removeEventListener('click', handleYes);
            confirmNoBtn.removeEventListener('click', handleNo);
            resolve(true);
        };

        const handleNo = () => {
            confirmationModal.classList.remove('open');
            confirmYesBtn.removeEventListener('click', handleYes);
            confirmNoBtn.removeEventListener('click', handleNo);
            resolve(false);
        };

        confirmYesBtn.addEventListener('click', handleYes);
        confirmNoBtn.addEventListener('click', handleNo);

        // Also handle clicking outside the modal to close and resolve to false
        confirmationModal.addEventListener('click', (e) => {
            if (e.target === confirmationModal) {
                handleNo(); // Treat clicking outside as a 'No'
            }
        }, { once: true }); // Use once to remove listener after first interaction
    });
}

