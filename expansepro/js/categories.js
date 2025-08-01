// js/categories.js

import * as Data from './data.js';
import { showToast, showConfirmationModal } from './utils.js';
import { refreshUI } from './main.js'; // Import refreshUI from main.js

// DOM elements
const modalCategorySelect = document.getElementById('modalCategory');
const budgetModalCategorySelect = document.getElementById('budgetModalCategory');
const newCategoryInput = document.getElementById('newCategoryInput');
const categoryListContainer = document.querySelector('#category-list-container ul');
const recurringTransactionsList = document.getElementById('recurring-transactions-list');

/**
 * Populates the category select dropdowns.
 */
export function populateCategorySelects() {
    [modalCategorySelect, budgetModalCategorySelect].forEach(selectElement => {
        selectElement.innerHTML = '<option value="">Select a Category</option>';
        Data.categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            selectElement.appendChild(option);
        });
    });
}

/**
 * Renders the list of categories in the management section.
 */
export function renderCategoryList() {
    categoryListContainer.innerHTML = '';
    Data.categories.forEach(category => {
        const li = document.createElement('li');
        li.innerHTML = `
            <span>${category}</span>
            <button class="delete-category-btn" data-category="${category}">✕</button>
        `;
        if (Data.defaultCategories.includes(category)) {
            li.classList.add('default-category');
            li.querySelector('.delete-category-btn').disabled = true;
        }
        categoryListContainer.appendChild(li);
    });

    categoryListContainer.querySelectorAll('.delete-category-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const categoryToDelete = e.target.dataset.category;
            deleteCategory(categoryToDelete);
        });
    });
}

/**
 * Adds a new category to the list.
 */
export function addCategory() {
    const newCat = newCategoryInput.value.trim();
    if (newCat) {
        if (Data.addCategoryData(newCat)) {
            newCategoryInput.value = '';
            showToast(`Category "${newCat}" added!`, 'success');
            refreshUI(); // Re-render UI to update category dropdowns and lists
        } else {
            showToast(`Category "${newCat}" already exists.`, 'error');
        }
    } else {
        showToast('Please enter a category name.', 'error');
    }
}

/**
 * Deletes a category from the list.
 * @param {string} categoryToDelete - The category to delete.
 */
export async function deleteCategory(categoryToDelete) {
    if (Data.defaultCategories.includes(categoryToDelete)) {
        showToast(`Cannot delete default category "${categoryToDelete}".`, 'error');
        return;
    }

    const confirmed = await showConfirmationModal(`Are you sure you want to delete category "${categoryToDelete}"? Existing transactions with this category will remain unchanged.`, "Confirm Delete Category");

    if (confirmed) {
        if (Data.deleteCategoryData(categoryToDelete)) {
            showToast(`Category "${categoryToDelete}" deleted.`, 'success');
            refreshUI(); // Re-render UI to update category dropdowns and lists
        } else {
            showToast(`Failed to delete category "${categoryToDelete}".`, 'error');
        }
    }
}

/**
 * Renders the list of recurring transactions in the settings panel.
 */
export function renderRecurringTransactionsList() {
    recurringTransactionsList.innerHTML = '';
    if (Data.recurringTransactions.length === 0) {
        recurringTransactionsList.innerHTML = '<li class="py-4 text-center text-color-secondary">No recurring transactions set.</li>';
        return;
    }
    Data.recurringTransactions.forEach(template => {
        const li = document.createElement('li');
        li.classList.add(template.amount < 0 ? 'minus' : 'plus');
        const sign = template.amount < 0 ? '-' : '+';
        li.innerHTML = `
            <div class="description">
                <strong>${template.text}</strong>
                <span class="details">${template.recurrence.charAt(0).toUpperCase() + template.recurrence.slice(1)} until ${template.recurrenceEndDate}</span>
            </div>
            <span class="amount">${sign}₹${Math.abs(template.amount).toFixed(2)}</span>
            <button class="delete-btn delete-recurring-btn" data-id="${template.id}">✕</button>
        `;
        recurringTransactionsList.appendChild(li);
    });

    // Add event listeners for delete buttons on recurring templates
    recurringTransactionsList.querySelectorAll('.delete-recurring-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const templateId = parseInt(e.target.dataset.id);
            Data.deleteTransactionById(templateId, true); // Pass true to indicate it's a template
        });
    });
}
