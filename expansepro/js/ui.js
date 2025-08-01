// js/ui.js

import { getCssVar, showToast } from './utils.js';
import { transactions } from './data.js';
import * as Charts from './charts.js';
import * as Analytics from './analytics.js';
import * as Budgets from './budgets.js';
import * as Categories from './categories.js';
import { handleAddTransaction, deleteTransaction } from './transactions.js';
import { handleBudgetSubmit } from './budgets.js';



// DOM Elements - General Layout
const contentPanels = document.querySelectorAll('.content-panel');
const navLinks = document.querySelectorAll('.nav-link');
const sidebar = document.getElementById('sidebar');

// Dashboard Panel elements
const totalIncomeCard = document.getElementById('total-income-card');
const totalExpensesCard = document.getElementById('total-expenses-card');
const netSavingsCard = document.getElementById('net-savings-card');
const highestSpendingCategoryCard = document.getElementById('highest-spending-category-card');

// Transactions Panel elements
const list = document.getElementById('list');

// Modals
const addEditExpenseModal = document.getElementById('addEditExpenseModal');
const closeAddEditModal = document.getElementById('closeAddEditModal');
const modalTitle = document.getElementById('modal-title');
const modalForm = document.getElementById('modal-form');
const modalTextInput = document.getElementById('modalText');
const modalAmountInput = document.getElementById('modalAmount');
const modalDateInput = document.getElementById('modalDate');
const modalCategorySelect = document.getElementById('modalCategory');
const modalRecurrenceSelect = document.getElementById('modalRecurrence');
const modalRecurrenceEndDateInput = document.getElementById('modalRecurrenceEndDate');
const modalRecurrenceEndDateContainer = document.getElementById('modal-recurrence-end-date-container');
const modalAddIncomeBtn = document.getElementById('modalAddIncomeBtn');
const modalAddExpenseBtn = document.getElementById('modalAddExpenseBtn');
const modalErrorMessageDiv = document.getElementById('modal-error-message');

const addEditBudgetModal = document.getElementById('addEditBudgetModal');
const closeAddEditBudgetModal = document.getElementById('closeAddEditBudgetModal');
const budgetModalTitle = document.getElementById('budget-modal-title');
const budgetModalForm = document.getElementById('budget-modal-form');
const budgetEditId = document.getElementById('budgetEditId');
const budgetModalCategorySelect = document.getElementById('budgetModalCategory');
const budgetModalLimitInput = document.getElementById('budgetModalLimit');
const budgetModalMonthInput = document.getElementById('budgetModalMonth');
const addBudgetSubmitBtn = document.getElementById('addBudgetSubmitBtn');
const updateBudgetSubmitBtn = document.getElementById('updateBudgetSubmitBtn');
const budgetModalErrorMessageDiv = document.getElementById('budget-modal-error-message');


/**
 * Switches the active content panel.
 * @param {string} panelId - The ID of the panel to activate.
 */
export function switchPanel(panelId) {
    contentPanels.forEach(panel => {
        panel.classList.remove('active');
    });
    document.getElementById(panelId).classList.add('active');

    navLinks.forEach(link => link.classList.remove('active'));
    document.querySelector(`.nav-link[data-panel="${panelId}"]`)?.classList.add('active'); // Add null check for add-expense-button

    // Close sidebar on mobile after navigating
    if (window.innerWidth <= 768) {
        sidebar.classList.remove('open');
    }

    // Specific refresh for panels that need it
    if (panelId === 'dashboard-panel') {
        updateSummaryCards();
        Charts.renderDashboardCharts();
    } else if (panelId === 'transactions-panel') {
        const filterPeriodSelect = document.getElementById('filterPeriod');
        const searchInput = document.getElementById('search-input');
        filterTransactions(filterPeriodSelect.value, searchInput.value);
    } else if (panelId === 'budgets-panel') {
        Budgets.populateBudgetMonthFilter(); // Ensure month filter is populated
        Budgets.renderBudgets();
    } else if (panelId === 'charts-panel') {
        const chartFilterPeriodSelect = document.getElementById('chartFilterPeriod');
        Charts.renderMainCharts(chartFilterPeriodSelect.value);
    } else if (panelId === 'analytics-panel') {
        // Initialize analytics view to daily by default or previously active one
        const activeTab = document.querySelector('.analytics-tab-btn.active');
        if (activeTab) {
            Analytics.showAnalyticsView(activeTab.dataset.view);
        } else {
            Analytics.showAnalyticsView('daily-analysis-view'); // Default to daily analysis if no tab is active (first load)
        }
    } else if (panelId === 'settings-panel') {
        Categories.renderCategoryList(); // Ensure category list is updated
        Categories.renderRecurringTransactionsList(); // Render recurring transactions list
    }
}

/**
 * Updates the main balance, income, and expense values displayed on Dashboard.
 */
export function updateSummaryCards() {
    const amounts = transactions.map(transaction => transaction.amount);
    const total = amounts.reduce((acc, item) => (acc += item), 0);
    const income = amounts.filter(item => item > 0).reduce((acc, item) => (acc += item), 0);
    const expense = amounts.filter(item => item < 0).reduce((acc, item) => (acc += item), 0) * -1;
    const netSavings = total;

    totalIncomeCard.innerText = `₹${income.toFixed(2)}`;
    totalExpensesCard.innerText = `₹${expense.toFixed(2)}`;
    netSavingsCard.innerText = `₹${netSavings.toFixed(2)}`;

    // Highest Spending Category
    const expenseCategories = {};
    transactions.filter(t => t.amount < 0).forEach(t => {
        const category = t.category || 'Other';
        expenseCategories[category] = (expenseCategories[category] || 0) + Math.abs(t.amount);
    });

    let highestCategory = 'N/A';
    let maxAmount = 0;
    for (const category in expenseCategories) {
        if (expenseCategories[category] > maxAmount) {
            maxAmount = expenseCategories[category];
            highestCategory = category;
        }
    }
    highestSpendingCategoryCard.innerText = highestCategory;
}

/**
 * Adds a transaction to the DOM list.
 * @param {object} transaction - The transaction object to add.
 */
export function addTransactionDOM(transaction) {
    const sign = transaction.amount < 0 ? '-' : '+';
    const item = document.createElement('li');
    item.classList.add(transaction.amount < 0 ? 'minus' : 'plus');

    const transactionDate = new Date(transaction.date + 'T00:00:00');
    const day = String(transactionDate.getDate()).padStart(2, '0');
    const month = String(transactionDate.getMonth() + 1).padStart(2, '0');
    const year = transactionDate.getFullYear();
    const formattedDate = `${day}-${month}-${year}`;

    item.innerHTML = `
        <div class="description">${transaction.text}</div>
        <div class="details">
            <span>${formattedDate}</span> <br/>
            <span>${transaction.category}</span>
        </div>
        <span class="amount">${sign}₹${Math.abs(transaction.amount).toFixed(2)}</span>
        <button class="delete-btn" data-id="${transaction.id}" data-type="transaction">✕</button>
    `;
    list.appendChild(item);
}

/**
 * Filters and displays transactions based on the selected period and search term.
 * @param {string} period - The filter period ('all', 'today', 'thisMonth', 'thisYear').
 * @param {string} searchTerm - The search query.
 */
export function filterTransactions(period, searchTerm = '') {
    list.innerHTML = '';

    let filteredTransactions = [...transactions]; // Create a shallow copy to avoid modifying original array
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const firstDayOfYear = new Date(today.getFullYear(), 0, 1);

    if (period === 'today') {
        filteredTransactions = filteredTransactions.filter(transaction => {
            const transactionDate = new Date(transaction.date + 'T00:00:00');
            return transactionDate.toDateString() === today.toDateString();
        });
    } else if (period === 'thisMonth') {
        filteredTransactions = filteredTransactions.filter(transaction => {
            const transactionDate = new Date(transaction.date + 'T00:00:00');
            return transactionDate >= firstDayOfMonth && transactionDate <= today;
        });
    } else if (period === 'thisYear') {
        filteredTransactions = filteredTransactions.filter(transaction => {
            const transactionDate = new Date(transaction.date + 'T00:00:00');
            return transactionDate >= firstDayOfYear && transactionDate <= today;
        });
    }

    if (searchTerm.trim() !== '') {
        const lowerCaseSearchTerm = searchTerm.toLowerCase();
        filteredTransactions = filteredTransactions.filter(transaction =>
            transaction.text.toLowerCase().includes(lowerCaseSearchTerm) ||
            transaction.category.toLowerCase().includes(lowerCaseSearchTerm) ||
            String(Math.abs(transaction.amount).toFixed(2)).includes(lowerCaseSearchTerm)
        );
    }

    filteredTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));

    if (filteredTransactions.length > 0) {
        filteredTransactions.forEach(addTransactionDOM);
    } else {
        const noTransactionsItem = document.createElement('li');
        noTransactionsItem.classList.add('py-4', 'text-center', 'text-color-secondary');
        noTransactionsItem.textContent = 'No transactions found for this period or search.';
        list.appendChild(noTransactionsItem);
    }

    // Add event listeners for delete buttons
    list.querySelectorAll('.delete-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const transactionId = parseInt(e.target.dataset.id);
            deleteTransaction(transactionId);

        });
    });
}


/**
 * Opens a modal.
 * @param {string} modalType - 'expense' or 'budget'
 * @param {number|null} [id=null] - The ID of the item to edit (for budget modal).
 */
export function openModal(modalType, id = null) {
    if (modalType === 'expense') {
        addEditExpenseModal.classList.add('open');
        modalTextInput.focus(); // Focus on first input
        modalDateInput.value = new Date().toISOString().split('T')[0]; // Set today's date
        Categories.populateCategorySelects(); // Ensure categories are up-to-date for expense modal
        // Reset form for new transaction
        modalForm.reset();
        modalRecurrenceSelect.value = 'none';
        modalRecurrenceEndDateContainer.style.display = 'none';
        modalErrorMessageDiv.classList.remove('show');
        modalErrorMessageDiv.textContent = '';

        // Attach event listeners for add income/expense buttons
        modalAddIncomeBtn.onclick = (e) => handleAddTransaction(e);
        modalAddExpenseBtn.onclick = (e) => handleAddTransaction(e);
    } else if (modalType === 'budget') {
        openBudgetModal(id); // Call the specific budget modal open function
    }
}

/**
 * Closes a modal.
 * @param {string} modalType - 'expense' or 'budget'
 */
export function closeModal(modalType) {
    if (modalType === 'expense') {
        addEditExpenseModal.classList.remove('open');
        modalErrorMessageDiv.classList.remove('show'); // Hide modal error
        modalErrorMessageDiv.textContent = ''; // Clear modal error text
        // Reset form fields
        modalForm.reset();
        modalRecurrenceEndDateContainer.style.display = 'none';
        // Remove event listeners to prevent multiple bindings if modal is reused frequently
        modalAddIncomeBtn.onclick = null;
        modalAddExpenseBtn.onclick = null;
    } else if (modalType === 'budget') {
        closeBudgetModal(); // Call the specific budget modal close function
    }
}

// Event Listeners for common modal close buttons
closeAddEditModal.addEventListener('click', () => closeModal('expense'));
addEditExpenseModal.addEventListener('click', (e) => {
    if (e.target === addEditExpenseModal) { // Close when clicking outside content
        closeModal('expense');
    }
});

closeAddEditBudgetModal.addEventListener('click', () => closeModal('budget')); // Close budget modal
addEditBudgetModal.addEventListener('click', (e) => {
    if (e.target === addEditBudgetModal) { // Close when clicking outside
        closeModal('budget');
    }
});


/**
 * Displays a temporary error message within the expense modal.
 * @param {string} message - The message to display.
 */
export function showModalMessage(message) {
    modalErrorMessageDiv.textContent = message;
    modalErrorMessageDiv.classList.add('show');
    setTimeout(() => {
        modalErrorMessageDiv.classList.remove('show');
        modalErrorMessageDiv.textContent = '';
    }, 3000);
}

/**
 * Opens the Add/Edit Budget modal.
 * @param {number|null} budgetId - The ID of the budget to edit, or null for a new budget.
 */
export function openBudgetModal(budgetId = null) {
    budgetModalForm.reset();
    budgetModalErrorMessageDiv.classList.remove('show');
    budgetModalErrorMessageDiv.textContent = '';
    Categories.populateCategorySelects(); // Ensure categories are fresh

    if (budgetId) {
        const budgetToEdit = Budgets.getBudgetById(budgetId);
        if (budgetToEdit) {
            budgetModalTitle.textContent = 'Edit Budget';
            budgetEditId.value = budgetToEdit.id;
            budgetModalCategorySelect.value = budgetToEdit.category;
            budgetModalLimitInput.value = budgetToEdit.limit;
            budgetModalMonthInput.value = budgetToEdit.month;
            addBudgetSubmitBtn.classList.add('hidden');
            updateBudgetSubmitBtn.classList.remove('hidden');
        } else {
            showToast('Budget not found for editing.', 'error');
            closeModal('budget');
            return;
        }
    } else {
        budgetModalTitle.textContent = 'Add New Budget';
        budgetEditId.value = ''; // Clear edit ID
        // Set default month to current month `YYYY-MM`
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        budgetModalMonthInput.value = `${year}-${month}`;
        addBudgetSubmitBtn.classList.remove('hidden');
        updateBudgetSubmitBtn.classList.add('hidden');
    }
    addEditBudgetModal.classList.add('open');

    // Attach event listeners for budget form submission
    addBudgetSubmitBtn.onclick = (e) => handleBudgetSubmit(e);
    updateBudgetSubmitBtn.onclick = (e) => handleBudgetSubmit(e);
}

/**
 * Closes the Add/Edit Budget modal.
 */
export function closeBudgetModal() {
    addEditBudgetModal.classList.remove('open');
    budgetModalErrorMessageDiv.classList.remove('show');
    budgetModalErrorMessageDiv.textContent = '';
    budgetModalForm.reset();
    // Remove event listeners
    addBudgetSubmitBtn.onclick = null;
    updateBudgetSubmitBtn.onclick = null;
}

/**
 * Displays a temporary error message within the budget modal.
 * @param {string} message - The message to display.
 */
export function showBudgetModalMessage(message) {
    budgetModalErrorMessageDiv.textContent = message;
    budgetModalErrorMessageDiv.classList.add('show');
    setTimeout(() => {
        budgetModalErrorMessageDiv.classList.remove('show');
        budgetModalErrorMessageDiv.textContent = '';
    }, 3000);
}
