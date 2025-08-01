// js/transactions.js

import * as Data from './data.js';
import { showModalMessage, openModal, closeModal } from './ui.js';
import { showToast, showConfirmationModal } from './utils.js';
import { refreshUI } from './main.js'; // Import refreshUI from main.js

// DOM elements from the transaction modal (re-declared for clarity in this module)
const modalTextInput = document.getElementById('modalText');
const modalAmountInput = document.getElementById('modalAmount');
const modalDateInput = document.getElementById('modalDate');
const modalCategorySelect = document.getElementById('modalCategory');
const modalRecurrenceSelect = document.getElementById('modalRecurrence');
const modalRecurrenceEndDateInput = document.getElementById('modalRecurrenceEndDate');


// Keyword mapping for auto-suggestion
const categoryKeywords = {
    "Food": ["restaurant", "cafe", "groceries", "supermarket", "dinner", "lunch", "breakfast", "coffee", "bakery", "eat", "food", "milk", "bread", "pizza", "burger", "samosa", "chai"],
    "Transport": ["bus", "train", "metro", "cab", "taxi", "petrol", "fuel", "uber", "ola", "travel", "flight", "auto", "bike", "car", "public transport"],
    "Utilities": ["electricity", "water bill", "internet", "phone bill", "gas bill", "utility", "wifi"],
    "Salary": ["salary", "paycheck", "income", "freelance", "wages", "bonus"],
    "Entertainment": ["movie", "cinema", "concert", "game", "book", "subscription", "netflix", "prime", "spotify", "ticket", "leisure", "outing"],
    "Shopping": ["clothes", "shoes", "mall", "online store", "amazon", "flipkart", "shop", "fashion", "electronics"],
    "Rent": ["rent", "housing", "apartment", "emi", "mortgage"],
    "Health": ["doctor", "medicine", "pharmacy", "hospital", "clinic", "health", "medication", "checkup"],
    "Education": ["school fees", "tuition", "course", "books", "education", "college", "university", "coaching"],
    "Investments": ["investment", "stocks", "mutual fund", "sip", "shares", "fd", "gold"],
    "Gifts": ["gift", "present", "birthday", "anniversary", "wedding"],
    "Other": ["miscellaneous", "misc"]
};

/**
 * Handles adding a new transaction (regular or recurring) from the modal.
 * @param {Event} e - The form submission event.
 */
export function handleAddTransaction(e) {
    e.preventDefault();

    const transactionType = e.target.dataset.type; // 'income' or 'expense'
    const recurrence = modalRecurrenceSelect.value;
    const recurrenceEndDate = modalRecurrenceEndDateInput.value;

    // Input validation for modal
    if (modalTextInput.value.trim() === '') {
        showModalMessage('Please enter a description.', 'error');
        return;
    }
    if (modalAmountInput.value.trim() === '' || isNaN(modalAmountInput.value) || parseFloat(modalAmountInput.value) <= 0) {
        showModalMessage('Please enter a valid positive amount.', 'error');
        return;
    }
    if (modalDateInput.value.trim() === '') {
        showModalMessage('Please select a date.', 'error');
        return;
    }
    if (modalCategorySelect.value.trim() === '') {
        showModalMessage('Please select a category.', 'error');
        return;
    }
    if (recurrence !== 'none' && recurrenceEndDate.trim() === '') {
        showModalMessage('Please select an end date for recurring transactions.', 'error');
        return;
    }
    if (recurrence !== 'none' && new Date(recurrenceEndDate) < new Date(modalDateInput.value)) {
         showModalMessage('Recurrence end date cannot be before the start date.', 'error');
         return;
    }

    let amountValue = parseFloat(modalAmountInput.value);
    if (transactionType === 'expense' && amountValue > 0) {
        amountValue = -amountValue;
    } else if (transactionType === 'income' && amountValue < 0) {
        amountValue = Math.abs(amountValue);
    }

    if (recurrence === 'none') {
        const transaction = {
            id: Data.generateID(),
            text: modalTextInput.value.trim(),
            amount: amountValue,
            date: modalDateInput.value,
            category: modalCategorySelect.value
        };
        Data.addTransaction(transaction);
    } else {
        const recurringTemplate = {
            id: Data.generateID(),
            text: modalTextInput.value.trim(),
            amount: amountValue,
            date: modalDateInput.value,
            category: modalCategorySelect.value,
            recurrence: recurrence,
            recurrenceEndDate: recurrenceEndDate,
            lastGeneratedDate: modalDateInput.value // Initially set to start date
        };
        Data.addRecurringTemplate(recurringTemplate);
    }

    closeModal('expense'); // Close expense modal
    showToast('Transaction added!', 'success');

    // Clear modal form fields (handled by closeModal now)
}

/**
 * Deletes a transaction by its ID.
 * This function uses a custom confirmation modal.
 * @param {number} id - The ID of the transaction to delete.
 */
export async function deleteTransaction(id) {
    // Determine if it's a recurring template
    const isRecurringTemplate = Data.recurringTransactions.some(template => template.id === id);

    let confirmationMessage = "Are you sure you want to delete this transaction?";
    if (isRecurringTemplate) {
        confirmationMessage = "This is a recurring transaction template. Deleting it will also delete ALL associated generated transactions. Are you sure you want to proceed?";
    }

    const confirmed = await showConfirmationModal(confirmationMessage, "Delete Transaction?");

    if (confirmed) {
        Data.deleteTransactionById(id, isRecurringTemplate);
    }
}

/**
 * Suggests a category based on the transaction description.
 * Updates the given select element.
 * @param {HTMLInputElement} descriptionInput - The input element for description.
 * @param {HTMLSelectElement} categorySelectElement - The select element for category.
 */
export function suggestCategory(descriptionInput, categorySelectElement) {
    const description = descriptionInput.value.toLowerCase();
    let suggested = '';

    // Only suggest if no category is currently selected or if it's the default prompt
    if (categorySelectElement.value === '' || categorySelectElement.value === 'Select a Category') {
        for (const category in categoryKeywords) {
            if (categoryKeywords.hasOwnProperty(category)) {
                for (const keyword of categoryKeywords[category]) {
                    if (description.includes(keyword)) {
                        suggested = category;
                        break;
                    }
                }
            }
            if (suggested) break;
        }
        if (suggested) {
            categorySelectElement.value = suggested;
        }
    }
}

