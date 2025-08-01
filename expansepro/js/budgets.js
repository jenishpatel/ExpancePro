// js/budgets.js

import * as Data from './data.js';
import * as UI from './ui.js';
import { showToast, showConfirmationModal } from './utils.js';
import { refreshUI } from './main.js'; // Import refreshUI from main.js


// DOM elements for budgets panel and modal
const budgetMonthFilter = document.getElementById('budgetMonthFilter');
const budgetsListContainer = document.getElementById('budgets-list-container');
const noBudgetsMessage = document.getElementById('no-budgets-message');

const budgetModalCategorySelect = document.getElementById('budgetModalCategory');
const budgetModalLimitInput = document.getElementById('budgetModalLimit');
const budgetModalMonthInput = document.getElementById('budgetModalMonth');
const budgetEditId = document.getElementById('budgetEditId');


/**
 * Calculates total spending for a given category and month.
 * @param {string} category - The category to sum.
 * @param {string} month - The month in `YYYY-MM` format.
 * @param {Array<Object>} transactionsArray - The array of transactions.
 * @returns {number} Total amount spent.
 */
export function getTotalSpentForCategory(category, month, transactionsArray) {
    return transactionsArray
        .filter(t => t.category === category && t.date.startsWith(month) && t.amount < 0)
        .reduce((acc, t) => acc + Math.abs(t.amount), 0);
}

/**
 * Calculates progress for a single budget.
 * @param {Object} budget - The budget object.
 * @param {Array<Object>} transactionsArray - The array of transactions.
 * @returns {Object} { spent, remaining, percentage, progressClass }
 */
export function getBudgetProgress(budget, transactionsArray) {
    const spent = getTotalSpentForCategory(budget.category, budget.month, transactionsArray);
    const remaining = budget.limit - spent;
    const percentage = (spent / budget.limit) * 100;

    let progressClass = 'progress-green';
    if (percentage >= 100) {
        progressClass = 'progress-red';
    } else if (percentage >= 75) {
        progressClass = 'progress-yellow';
    }

    return {
        spent: spent.toFixed(2),
        remaining: remaining.toFixed(2),
        percentage: Math.min(100, percentage).toFixed(2), // Cap at 100 for display
        progressClass
    };
}

/**
 * Renders the budget cards based on the selected month filter.
 */
export function renderBudgets() {
    budgetsListContainer.innerHTML = '';
    const selectedMonth = budgetMonthFilter.value;

    const filteredBudgets = Data.budgets.filter(budget => budget.month === selectedMonth);

    if (filteredBudgets.length === 0) {
        noBudgetsMessage.classList.remove('hidden');
        return;
    } else {
        noBudgetsMessage.classList.add('hidden');
    }

    filteredBudgets.forEach(budget => {
        const { spent, remaining, percentage, progressClass } = getBudgetProgress(budget, Data.transactions);

        const card = document.createElement('div');
        card.className = 'budget-card';
        card.innerHTML = `
            <h4>${budget.category}</h4>
            <p class="budget-month">${new Date(budget.month + '-01').toLocaleString('en-IN', { month: 'long', year: 'numeric' })}</p>
            <div class="amounts-row">
                <span>Limit: <strong>₹${budget.limit.toFixed(2)}</strong></span>
                <span>Spent: <strong>₹${spent}</strong></span>
                <span>Remaining: <strong>₹${remaining}</strong></span>
            </div>
            <div class="progress-bar-container">
                <div class="progress-bar ${progressClass}" style="width: ${percentage}%"></div>
            </div>
            <div class="budget-actions">
                <button class="btn btn-primary edit-budget-btn" data-id="${budget.id}">Edit</button>
                <button class="btn delete-btn delete-budget-btn" data-id="${budget.id}">Delete</button>
            </div>
        `;
        budgetsListContainer.appendChild(card);
    });

    // Add event listeners for edit and delete buttons on newly rendered budget cards
    budgetsListContainer.querySelectorAll('.edit-budget-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const budgetId = parseInt(e.target.dataset.id);
            UI.openModal('budget', budgetId);
        });
    });

    budgetsListContainer.querySelectorAll('.delete-budget-btn').forEach(button => {
        button.addEventListener('click', async (e) => {
            const budgetId = parseInt(e.target.dataset.id);
            const confirmed = await showConfirmationModal("Are you sure you want to delete this budget?", "Confirm Delete Budget");
            if (confirmed) {
                Data.deleteBudget(budgetId);
                showToast('Budget deleted!', 'success');
            }
        });
    });
}

/**
 * Returns a budget object by its ID.
 * @param {number} id - The ID of the budget.
 * @returns {object|undefined} The budget object or undefined if not found.
 */
export function getBudgetById(id) {
    return Data.budgets.find(b => b.id === id);
}

/**
 * Handles submission from the Add/Edit Budget modal.
 * @param {Event} e - The form submission event.
 */
export function handleBudgetSubmit(e) {
    e.preventDefault();

    const id = budgetEditId.value ? parseInt(budgetEditId.value) :Data.generateID();

    const category = budgetModalCategorySelect.value.trim();
    const limit = parseFloat(budgetModalLimitInput.value);
    const month = budgetModalMonthInput.value;

    if (!category) {
        UI.showBudgetModalMessage('Please select a category.', 'error');
        return;
    }
    if (isNaN(limit) || limit <= 0) {
        UI.showBudgetModalMessage('Please enter a valid positive limit.', 'error');
        return;
    }
    if (!month) {
        UI.showBudgetModalMessage('Please select a month.', 'error');
        return;
    }

    const existingBudgetIndex = Data.budgets.findIndex(b => b.category === category && b.month === month && b.id !== id);

    if (budgetEditId.value) { // Editing existing budget
        const budgetIndex = Data.budgets.findIndex(b => b.id === id);
        if (budgetIndex > -1) {
            // Check if new category/month combination already exists for a different budget
            if (existingBudgetIndex !== -1) {
                 UI.showBudgetModalMessage('A budget for this category and month already exists.', 'error');
                 return;
            }
            Data.updateBudget({ id: id, category, limit, month });
            showToast('Budget updated successfully!', 'success');
        } else {
            showToast('Error: Budget not found.', 'error');
        }
    } else { // Adding new budget
        if (existingBudgetIndex !== -1) {
            UI.showBudgetModalMessage('A budget for this category and month already exists.', 'error');
            return;
        }
        Data.addBudget({ id, category, limit, month });
        showToast('Budget added successfully!', 'success');
    }

    UI.closeModal('budget');
}

/**
 * Populates the month filter dropdown for budgets.
 */
export function populateBudgetMonthFilter() {
    budgetMonthFilter.innerHTML = '';
    const today = new Date();
    const yearsToDisplay = 3; // Display current year and 2 previous years

    for (let y = 0; y < yearsToDisplay; y++) {
        const year = today.getFullYear() - y;
        for (let m = 11; m >= 0; m--) { // From Dec to Jan
            const monthDate = new Date(year, m, 1);
            if (monthDate <= today) { // Only show months up to current month
                const value = `${year}-${String(m + 1).padStart(2, '0')}`;
                const text = monthDate.toLocaleString('en-IN', { month: 'long', year: 'numeric' });
                const option = document.createElement('option');
                option.value = value;
                option.textContent = text;
                budgetMonthFilter.appendChild(option);
            }
        }
    }
    // Set default to current month
    budgetMonthFilter.value = today.toISOString().split('T')[0].substring(0, 7);
}

