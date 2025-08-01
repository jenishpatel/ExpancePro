// js/data.js

import { generateID, showToast } from './utils.js';
import { refreshUI } from './main.js'; // Import refreshUI from main.js

// Data from Local Storage
export let transactions = [];
export let recurringTransactions = [];
export let budgets = [];
export const defaultCategories = ["Food", "Transport", "Utilities", "Salary", "Entertainment", "Shopping", "Rent", "Health", "Education", "Investments", "Gifts", "Other"];
export let categories = [];

/**
 * Loads data from local storage.
 */
export function loadData() {
    transactions = JSON.parse(localStorage.getItem('transactions')) || [];
    recurringTransactions = JSON.parse(localStorage.getItem('recurringTransactions')) || [];
    budgets = JSON.parse(localStorage.getItem('budgets')) || [];

    // Initialize categories ensuring defaults are present
    let storedCategories = JSON.parse(localStorage.getItem('categories'));
    if (storedCategories) {
        categories = storedCategories;
        defaultCategories.forEach(cat => {
            if (!categories.includes(cat)) {
                categories.push(cat);
            }
        });
    } else {
        categories = [...defaultCategories];
    }
    categories.sort(); // Keep categories sorted
    updateLocalStorage(); // Save updated categories back if defaults were added
}

/**
 * Updates local storage with current transactions, recurring templates, and categories, budgets.
 */
export function updateLocalStorage() {
    localStorage.setItem('transactions', JSON.stringify(transactions));
    localStorage.setItem('recurringTransactions', JSON.stringify(recurringTransactions));
    localStorage.setItem('categories', JSON.stringify(categories));
    localStorage.setItem('budgets', JSON.stringify(budgets));
}

/**
 * Adds a new transaction to the data array.
 * @param {object} transaction - The transaction object.
 */
export function addTransaction(transaction) {
    transactions.push(transaction);
    updateLocalStorage();
    refreshUI();
}

/**
 * Deletes a transaction by its ID.
 * If it's a recurring transaction instance, only that instance is deleted.
 * If it's a recurring template, all instances and the template are deleted.
 * @param {number} id - The ID of the transaction to delete.
 * @param {boolean} isTemplate - True if deleting a recurring template.
 */
export function deleteTransactionById(id, isTemplate = false) {
    if (isTemplate) {
        recurringTransactions = recurringTransactions.filter(template => template.id !== id);
        transactions = transactions.filter(t => t.recurrentParentId !== id);
        showToast('Recurring transaction and all its instances deleted.', 'success');
    } else {
        transactions = transactions.filter(transaction => transaction.id !== id);
        showToast('Transaction deleted.', 'success');
    }
    updateLocalStorage();
    refreshUI();
}

/**
 * Adds a new recurring transaction template.
 * @param {object} template - The recurring transaction template object.
 */
export function addRecurringTemplate(template) {
    recurringTransactions.push(template);
    updateLocalStorage();
    generateRecurringTransactions(); // Generate instances immediately
    refreshUI();
}

/**
 * Generates instances for recurring transactions.
 * This function runs on init and when new recurring transactions are added.
 */
export function generateRecurringTransactions() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    recurringTransactions.forEach(template => {
        let lastDate = new Date(template.lastGeneratedDate + 'T00:00:00');
        const endDate = new Date(template.recurrenceEndDate + 'T00:00:00');

        while (lastDate <= today && lastDate <= endDate) {
            const exists = transactions.some(t =>
                t.recurrentParentId === template.id &&
                new Date(t.date + 'T00:00:00').toDateString() === lastDate.toDateString()
            );

            if (!exists) {
                const newTransaction = {
                    id: generateID(),
                    text: template.text,
                    amount: template.amount,
                    date: lastDate.toISOString().split('T')[0],
                    category: template.category,
                    recurrentParentId: template.id
                };
                transactions.push(newTransaction);
            }

            if (template.recurrence === 'weekly') {
                lastDate.setDate(lastDate.getDate() + 7);
            } else if (template.recurrence === 'monthly') {
                lastDate.setMonth(lastDate.getMonth() + 1);
            } else {
                break;
            }
        }
        template.lastGeneratedDate = new Date(Math.min(today, endDate)).toISOString().split('T')[0];
    });
    updateLocalStorage();
}

/**
 * Adds a new budget to the data array.
 * @param {object} budget - The budget object.
 */
export function addBudget(budget) {
    budgets.push(budget);
    updateLocalStorage();
    refreshUI();
}

/**
 * Updates an existing budget in the data array.
 * @param {object} updatedBudget - The updated budget object.
 */
export function updateBudget(updatedBudget) {
    const index = budgets.findIndex(b => b.id === updatedBudget.id);
    if (index > -1) {
        budgets[index] = updatedBudget;
        updateLocalStorage();
        refreshUI();
    }
}

/**
 * Deletes a budget by its ID.
 * @param {number} id - The ID of the budget to delete.
 */
export function deleteBudget(id) {
    budgets = budgets.filter(b => b.id !== id);
    updateLocalStorage();
    refreshUI();
}

/**
 * Adds a new category to the data array.
 * @param {string} newCat - The category name.
 */
export function addCategoryData(newCat) {
    if (!categories.includes(newCat)) {
        categories.push(newCat);
        categories.sort();
        updateLocalStorage();
        return true;
    }
    return false;
}

/**
 * Deletes a category from the data array.
 * @param {string} categoryToDelete - The category name to delete.
 */
export function deleteCategoryData(categoryToDelete) {
    if (defaultCategories.includes(categoryToDelete)) {
        return false; // Cannot delete default categories
    }
    categories = categories.filter(cat => cat !== categoryToDelete);
    updateLocalStorage();
    return true;
}

/**
 * Exports all transaction and recurring transaction data to a CSV file.
 */
export function exportCsv() {
    if (transactions.length === 0 && recurringTransactions.length === 0) {
        showToast('No data to export.', 'error');
        return;
    }

    let csvContent = "data:text/csv;charset=utf-8,";
    const headers = ["Date", "Description", "Amount", "Category", "RecurrenceType", "RecurrenceEndDate", "IsRecurringInstance"];
    csvContent += headers.join(",") + "\n";

    // Add all transactions (including recurring instances)
    transactions.forEach(t => {
        const row = [
            t.date,
            `"${t.text.replace(/"/g, '""')}"`, // Handle commas and quotes in description
            t.amount.toFixed(2),
            t.category,
            '', // RecurrenceType for non-templates
            '', // RecurrenceEndDate for non-templates
            t.recurrentParentId ? 'Yes' : 'No'
        ].join(",");
        csvContent += row + "\n";
    });

    // Add recurring templates as well (optional, but good for full backup)
    recurringTransactions.forEach(t => {
        const row = [
            t.date,
            `"${t.text.replace(/"/g, '""')}"`,
            t.amount.toFixed(2),
            t.category,
            t.recurrence,
            t.recurrenceEndDate,
            'Template' // Mark as template
        ].join(",");
        csvContent += row + "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "expense_tracker_data.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Transactions exported to CSV!', 'success');
}

/**
 * Imports transaction and recurring transaction data from a CSV file.
 */
export function importCsv() {
    const fileInput = document.getElementById('import-csv-file-input');
    const file = fileInput.files[0];
    if (!file) {
        showToast('Please select a CSV file to import.', 'error');
        return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        const text = e.target.result;
        const lines = text.split('\n').filter(line => line.trim() !== ''); // Filter empty lines
        if (lines.length <= 1) { // Only header or empty file
            showToast('CSV file is empty or only contains headers.', 'error');
            fileInput.value = ''; // Clear file input
            return;
        }

        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
        const newTransactions = [];
        const newRecurringTemplates = [];

        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));

            if (values.length !== headers.length) {
                 console.warn(`Skipping malformed row: ${lines[i]}`);
                 showToast(`Skipped a malformed row in CSV. Check console.`, 'error');
                 continue;
            }

            const rowData = {};
            headers.forEach((header, index) => {
                rowData[header] = values[index];
            });

            // Basic validation for critical fields
            if (!rowData.Date || !rowData.Description || !rowData.Amount || !rowData.Category) {
                console.warn(`Skipping row due to missing critical data: ${lines[i]}`);
                showToast(`Skipped a row with missing data. Check console.`, 'error');
                continue;
            }

            const amount = parseFloat(rowData.Amount);
            if (isNaN(amount)) {
                console.warn(`Skipping row due to invalid amount: ${lines[i]}`);
                showToast(`Skipped a row with invalid amount. Check console.`, 'error');
                continue;
            }

            // Check if it's a recurring template or a regular transaction
            if (rowData.IsRecurringInstance === 'Template') {
                newRecurringTemplates.push({
                    id: generateID(), // Generate new ID on import
                    text: rowData.Description,
                    amount: amount,
                    date: rowData.Date,
                    category: rowData.Category,
                    recurrence: rowData.RecurrenceType || 'monthly', // Default if not specified
                    recurrenceEndDate: rowData.RecurrenceEndDate || rowData.Date, // Fallback if not specified
                    lastGeneratedDate: rowData.Date // Start from here
                });
            } else {
                newTransactions.push({
                    id: generateID(), // Generate new ID on import
                    text: rowData.Description,
                    amount: amount,
                    date: rowData.Date,
                    category: rowData.Category,
                    recurrentParentId: rowData.IsRecurringInstance === 'Yes' ? rowData.RecurrentParentId : undefined // Preserve if linked
                });
            }

            // Add new categories found during import
            if (rowData.Category && !categories.includes(rowData.Category)) {
                categories.push(rowData.Category);
                categories.sort();
            }
        }

        // Append new transactions/templates to existing ones
        transactions = [...transactions, ...newTransactions];
        recurringTransactions = [...recurringTransactions, ...newRecurringTemplates];

        updateLocalStorage();
        refreshUI();
        showToast(`Successfully imported ${newTransactions.length + newRecurringTemplates.length} transactions!`, 'success');
        fileInput.value = ''; // Clear file input
    };
    reader.onerror = function() {
        showToast('Error reading file.', 'error');
    };
    reader.readAsText(file);
}

function generateIDWrapper() {
    return generateID();
}

export { generateIDWrapper as generateID };

