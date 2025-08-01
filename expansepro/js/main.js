// js/main.js

import * as Data from './data.js';
import * as UI from './ui.js';
import * as Transactions from './transactions.js';
import * as Budgets from './budgets.js';
import * as Categories from './categories.js';
import * as Charts from './charts.js';
import * as Analytics from './analytics.js';
import { showToast, showConfirmationModal } from './utils.js';
import * as Themes from './themes.js';
import * as LangManager from './langManager.js';

// DOM Elements - General Layout
const sidebar = document.getElementById('sidebar');
const openSidebarBtn = document.getElementById('open-sidebar-btn');
const closeSidebarBtn = document.getElementById('close-sidebar-btn');
const navLinks = document.querySelectorAll('.nav-link');
const contentPanels = document.querySelectorAll('.content-panel');
const addExpenseButton = document.getElementById('add-expense-button');

// Top Navbar elements
const themeToggle = document.getElementById('theme-toggle');
const themeSelect = document.getElementById('theme-select');

// Transaction list filters and search
const filterPeriodSelect = document.getElementById('filterPeriod');
const searchInput = document.getElementById('search-input');

// Charts Panel elements
const chartFilterPeriodSelect = document.getElementById('chartFilterPeriod');

// Add/Edit Expense Modal elements
const modalTextInput = document.getElementById('modalText');
const modalCategorySelect = document.getElementById('modalCategory');

// Budget Panel elements
const addBudgetButton = document.getElementById('add-budget-button');
const budgetMonthFilter = document.getElementById('budgetMonthFilter');

// Analytics Panel elements
const analyticsTabs = document.querySelectorAll('.analytics-tab-btn');
const dailyAnalysisDateInput = document.getElementById('dailyAnalysisDate');
const monthlyAnalysisMonthInput = document.getElementById('monthlyAnalysisMonth');
const yearlyAnalysisYearSelect = document.getElementById('yearlyAnalysisYear');

// Settings Panel elements
const newCategoryInput = document.getElementById('newCategoryInput');
const addCategoryBtn = document.getElementById('addCategoryBtn');

// Export/Import elements
const exportCsvBtn = document.getElementById('export-csv-btn');
const importCsvFileInput = document.getElementById('import-csv-file-input');
const importCsvBtn = document.getElementById('import-csv-btn');



/**
 * A single function to refresh all UI components that depend on data.
 * This is called after any data change or theme change.
 */
export function refreshUI() {
    // Re-sort transactions by date
    Data.transactions.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Refresh dashboard summary cards
    UI.updateSummaryCards();

    // Refresh transaction list with current filters
    UI.filterTransactions(filterPeriodSelect.value, searchInput.value);

    // Re-render charts based on current filter values for each chart
    if (document.getElementById('dashboard-panel').classList.contains('active')) {
        Charts.renderDashboardCharts();
    }
    if (document.getElementById('charts-panel').classList.contains('active')) {
        Charts.renderMainCharts(chartFilterPeriodSelect.value);
    }
    if (document.getElementById('budgets-panel').classList.contains('active')) {
        Budgets.renderBudgets(); // Refresh budget cards
    }
    if (document.getElementById('analytics-panel').classList.contains('active')) {
        const activeTab = document.querySelector('#analytics-panel .analytics-tab-btn.active');
        if (activeTab) {
            Analytics.showAnalyticsView(activeTab.dataset.view); // Re-render the currently active analytics view
        }
    }

    // Refresh category dropdowns and lists
    Categories.populateCategorySelects();
    Categories.renderCategoryList();
    Categories.renderRecurringTransactionsList();
}


// --- Event Listeners ---

// Sidebar Navigation
openSidebarBtn.addEventListener('click', () => {
    sidebar.classList.add('open');
});
closeSidebarBtn.addEventListener('click', () => {
    sidebar.classList.remove('open');
});

navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const panelId = link.dataset.panel;
        if (panelId) {
            UI.switchPanel(panelId);
        }
    });
});

// Add Expense Button (Opens Modal)
addExpenseButton.addEventListener('click', (e) => {
    e.preventDefault();
    UI.openModal('expense');
});

// Modal recurrence toggle
document.getElementById('modalRecurrence').addEventListener('change', (e) => {
    const modalRecurrenceEndDateContainer = document.getElementById('modal-recurrence-end-date-container');
    const modalRecurrenceEndDateInput = document.getElementById('modalRecurrenceEndDate');
    if (e.target.value !== 'none') {
        modalRecurrenceEndDateContainer.style.display = 'block';
        const today = new Date();
        const defaultEndDate = new Date(today.getFullYear() + 1, today.getMonth(), today.getDate());
        modalRecurrenceEndDateInput.value = defaultEndDate.toISOString().split('T')[0];
    } else {
        modalRecurrenceEndDateContainer.style.display = 'none';
        modalRecurrenceEndDateInput.value = '';
    }
});

// Auto-suggest category on modal description input
modalTextInput.addEventListener('input', () => Transactions.suggestCategory(modalTextInput, modalCategorySelect));

// Transaction list filters and search
filterPeriodSelect.addEventListener('change', () => UI.filterTransactions(filterPeriodSelect.value, searchInput.value));
searchInput.addEventListener('input', () => UI.filterTransactions(filterPeriodSelect.value, searchInput.value));

// Chart filter
chartFilterPeriodSelect.addEventListener('change', refreshUI);

// Budget Section Event Listeners
addBudgetButton.addEventListener('click', () => UI.openModal('budget')); // Open budget modal
budgetMonthFilter.addEventListener('change', Budgets.renderBudgets); // Re-render budgets when month filter changes

// Analytics Tab Switching
analyticsTabs.forEach(btn => {
    btn.addEventListener('click', () => {
        Analytics.showAnalyticsView(btn.dataset.view);
    });
});

// Analytics Filter Event Listeners
dailyAnalysisDateInput.addEventListener('change', (e) => Analytics.renderDailyAnalysis(e.target.value));
monthlyAnalysisMonthInput.addEventListener('change', (e) => Analytics.renderMonthlyAnalysis(e.target.value));
yearlyAnalysisYearSelect.addEventListener('change', (e) => Analytics.renderYearlyAnalysis(e.target.value));

// Theme toggle from top navbar
themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    if (document.body.classList.contains('dark-mode')) {
        localStorage.setItem('theme', 'dark-mode');
        themeToggle.textContent = '☀️';
    } else {
        localStorage.setItem('theme', 'light-mode');
        themeToggle.textContent = '🌙';
    }
    refreshUI(); // Re-render charts to pick up new theme colors
});

// Category Management Event Listeners (moved to settings panel)
addCategoryBtn.addEventListener('click', Categories.addCategory);

// Export to CSV
exportCsvBtn.addEventListener('click', Data.exportCsv);

// Import from CSV
importCsvBtn.addEventListener('click', Data.importCsv);

// Theme logic
if (themeSelect) {
    themeSelect.addEventListener('change', (e) => {
        Themes.applyTheme(e.target.value);
    });
    // On load, set theme from localStorage or default
    const savedTheme = localStorage.getItem('selectedTheme') || 'light';
    themeSelect.value = savedTheme;
    Themes.applyTheme(savedTheme);
}

// Language toggle logic
const langToggle = document.getElementById('lang-toggle');
if (langToggle) {
    langToggle.addEventListener('click', () => {
        LangManager.toggleLanguage();
    });
    // On load, set language from localStorage or default
    LangManager.initLanguage();
}

// --- Reset All Data Functionality ---
const resetAllDataBtn = document.getElementById('reset-all-data-btn');
if (resetAllDataBtn) {
    resetAllDataBtn.addEventListener('click', async () => {
        const confirmed = await showConfirmationModal(
            "This will permanently delete ALL your transactions, budgets, categories (except defaults), and recurring transactions. Are you sure you want to reset everything?",
            "Reset All Data?"
        );
        if (confirmed) {
            // Clear all localStorage keys used by ExpensePro
            localStorage.removeItem('transactions');
            localStorage.removeItem('recurringTransactions');
            localStorage.removeItem('budgets');
            localStorage.removeItem('categories');
            // Optionally, clear theme/currency if you want a full reset:
            // localStorage.removeItem('theme');
            // localStorage.removeItem('currency');

            // Reload default data
            Data.loadData();
            // Refresh UI
            refreshUI();
            showToast('All data has been reset. Welcome to a fresh start!', 'success');
        }
    });
}

// --- Initialization ---

/**
 * Initializes the application on DOM load.
 */
function init() {
  
    
    Data.loadData(); // Load all data from local storage
    Data.generateRecurringTransactions(); // Generate any pending recurring transactions
    Categories.populateCategorySelects(); // Populate dropdowns for initial load
    Budgets.populateBudgetMonthFilter(); // Populate month filter for budgets
    Analytics.populateYearlyAnalysisYearSelect(); // Populate year filter for analytics

    // Set initial theme based on local storage
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        document.body.classList.add(savedTheme);
        themeToggle.textContent = savedTheme === 'dark-mode' ? '☀️' : '🌙';
    } else {
        // Default to light mode if no preference saved
        document.body.classList.remove('dark-mode');
        themeToggle.textContent = '🌙';
    }

    // Initial UI render handled by switchPanel, which will also call specific render functions for active panel
    UI.switchPanel('dashboard-panel'); // Show dashboard by default and render its content
}

// Initialize the app when the DOM is loaded
document.addEventListener('DOMContentLoaded', init);

