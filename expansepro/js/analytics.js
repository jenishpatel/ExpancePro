// js/analytics.js

import { transactions } from './data.js';
import { getCssVar } from './utils.js';

// DOM elements for analytics
const analyticsTabs = document.querySelectorAll('.analytics-tab-btn');
const dailyAnalysisView = document.getElementById('daily-analysis-view');
const monthlyAnalysisView = document.getElementById('monthly-analysis-view');
const yearlyAnalysisView = document.getElementById('yearly-analysis-view');

// Daily Analysis Elements
const dailyAnalysisDateInput = document.getElementById('dailyAnalysisDate');
const dailyIncomeCard = document.getElementById('daily-income-card');
const dailyExpensesCard = document.getElementById('daily-expenses-card');
const dailyNetBalanceCard = document.getElementById('daily-net-balance-card');
const dailyTopCategoryCard = document.getElementById('daily-top-category-card');
const dailyIncomeExpenseChartCtx = document.getElementById('dailyIncomeExpenseChart')?.getContext('2d');
const dailyCategoryPieChartCtx = document.getElementById('dailyCategoryPieChart')?.getContext('2d');

// Monthly Analysis Elements
const monthlyAnalysisMonthInput = document.getElementById('monthlyAnalysisMonth');
const monthlyTotalIncomeCard = document.getElementById('monthly-total-income-card');
const monthlyTotalExpensesCard = document.getElementById('monthly-total-expenses-card');
const monthlyNetBalanceCard = document.getElementById('monthly-net-balance-card');
const monthlyTopCategoryCard = document.getElementById('monthly-top-category-card');
const monthlyDailyTrendsChartCtx = document.getElementById('monthlyDailyTrendsChart')?.getContext('2d');
const monthlyCategoryPieChartCtx_Analytics = document.getElementById('monthlyCategoryPieChart')?.getContext('2d');

// Yearly Analysis Elements
const yearlyAnalysisYearSelect = document.getElementById('yearlyAnalysisYear');
const yearlyTotalIncomeCard = document.getElementById('yearly-total-income-card');
const yearlyTotalExpensesCard = document.getElementById('yearly-total-expenses-card');
const yearlyNetBalanceCard = document.getElementById('yearly-net-balance-card');
const yearlyTopCategoryCard = document.getElementById('yearly-top-category-card');
const yearlyMonthlyTrendsChartCtx = document.getElementById('yearlyMonthlyTrendsChart')?.getContext('2d');
const yearlyCategoryPieChartCtx_Analytics = document.getElementById('yearlyCategoryPieChart')?.getContext('2d');


// Chart instances (global references to allow destruction)
let dailyCategoryPieChart;
let dailyIncomeExpenseChart;
let monthlyDailyTrendsChart;
let monthlyCategoryPieChart_Analytics;
let yearlyMonthlyTrendsChart;
let yearlyCategoryPieChart_Analytics;


/**
 * Filters transactions for a specific date (YYYY-MM-DD).
 * @param {string} dateString - Date in YYYY-MM-DD format.
 * @returns {Array} Filtered transactions.
 */
function getTransactionsForDate(dateString) {
    if (!dateString) return [];
    return transactions.filter(t => t.date === dateString);
}

/**
 * Filters transactions for a specific month (YYYY-MM).
 * @param {string} monthString - Month in YYYY-MM format.
 * @returns {Array} Filtered transactions.
 */
function getTransactionsForMonth(monthString) {
    if (!monthString) return [];
    return transactions.filter(t => t.date.startsWith(monthString));
}

/**
 * Filters transactions for a specific year (YYYY).
 * @param {string} yearString - Year in YYYY format.
 * @returns {Array} Filtered transactions.
 */
function getTransactionsForYear(yearString) {
    if (!yearString) return [];
    return transactions.filter(t => t.date.startsWith(yearString));
}

/**
 * Calculates summary statistics for a given array of transactions.
 * @param {Array} transactionsArray - Transactions for the period.
 * @returns {Object} Summary stats.
 */
function calculatePeriodSummary(transactionsArray) {
    let totalIncome = 0;
    let totalExpenses = 0;
    const categoryExpenses = {};
    const dailyIncome = {}; // For monthly trends
    const dailyExpenses = {}; // For monthly trends
    const monthlyIncome = {}; // For yearly trends
    const monthlyExpenses = {}; // For yearly trends

    transactionsArray.forEach(t => {
        const amount = Math.abs(t.amount);
        const category = t.category || 'Other';
        const date = t.date; // YYYY-MM-DD
        const month = t.date.substring(0, 7); // YYYY-MM

        if (t.amount > 0) {
            totalIncome += amount;
            dailyIncome[date] = (dailyIncome[date] || 0) + amount;
            monthlyIncome[month] = (monthlyIncome[month] || 0) + amount;
        } else {
            totalExpenses += amount;
            categoryExpenses[category] = (categoryExpenses[category] || 0) + amount;
            dailyExpenses[date] = (dailyExpenses[date] || 0) + amount;
            monthlyExpenses[month] = (monthlyExpenses[month] || 0) + amount;
        }
    });

    const netBalance = totalIncome - totalExpenses;

    let topCategory = 'N/A';
    let maxExpense = 0;
    for (const cat in categoryExpenses) {
        if (categoryExpenses[cat] > maxExpense) {
            maxExpense = categoryExpenses[cat];
            topCategory = cat;
        }
    }

    return {
        totalIncome: totalIncome.toFixed(2),
        totalExpenses: totalExpenses.toFixed(2),
        netBalance: netBalance.toFixed(2),
        categoryExpenses,
        topCategory,
        dailyIncome,
        dailyExpenses,
        monthlyIncome,
        monthlyExpenses
    };
}

/**
 * Renders Daily Analysis charts and summary.
 * @param {string} dateString - Date in YYYY-MM-DD format.
 */
export function renderDailyAnalysis(dateString) {
    const transactionsForDay = getTransactionsForDate(dateString);
    const summary = calculatePeriodSummary(transactionsForDay);

    dailyIncomeCard.innerText = `₹${summary.totalIncome}`;
    dailyExpensesCard.innerText = `₹${summary.totalExpenses}`;
    dailyNetBalanceCard.innerText = `₹${summary.netBalance}`;
    dailyTopCategoryCard.innerText = summary.topCategory;

    // Daily Category Pie Chart
    if (dailyCategoryPieChart) dailyCategoryPieChart.destroy();
    if (dailyCategoryPieChartCtx) {
        const pieLabels = Object.keys(summary.categoryExpenses);
        const pieData = Object.values(summary.categoryExpenses);
        const pieColors = pieLabels.map((_, i) => `hsl(${(i * 137.508) % 360}, 70%, 60%)`);
        dailyCategoryPieChart = new Chart(dailyCategoryPieChartCtx, {
            type: 'doughnut',
            data: {
                labels: pieLabels,
                datasets: [{
                    label: 'Expenses by Category',
                    data: pieData,
                    backgroundColor: pieColors,
                    borderColor: getCssVar('--container-bg'),
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'right', labels: { color: getCssVar('--text-color-secondary') } },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                let label = context.label || '';
                                if (label) label += ': ';
                                if (context.parsed) {
                                    const total = context.dataset.data.reduce((sum, val) => sum + val, 0);
                                    const percentage = (context.parsed / total * 100).toFixed(2);
                                    label += `₹${context.parsed.toFixed(2)} (${percentage}%)`;
                                }
                                return label;
                            }
                        }
                    }
                }
            }
        });
    }

    // Daily Income vs Expense Bar Chart
    if (dailyIncomeExpenseChart) dailyIncomeExpenseChart.destroy();
    if (dailyIncomeExpenseChartCtx) {
        dailyIncomeExpenseChart = new Chart(dailyIncomeExpenseChartCtx, {
            type: 'bar',
            data: {
                labels: ['Income', 'Expenses'],
                datasets: [
                    {
                        label: 'Amount (₹)',
                        data: [parseFloat(summary.totalIncome), parseFloat(summary.totalExpenses)],
                        backgroundColor: ['#28a745', '#dc3545'],
                        borderColor: ['#28a745', '#dc3545'],
                        borderWidth: 1
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        title: { display: true, text: 'Amount (₹)', color: getCssVar('--text-color-secondary') },
                        ticks: { color: getCssVar('--text-color-secondary') },
                        grid: { color: getCssVar('--border-color') }
                    },
                    x: {
                        ticks: { color: getCssVar('--text-color-secondary') },
                        grid: { color: getCssVar('--border-color') }
                    }
                },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                         callbacks: {
                            label: function(context) {
                                let label = context.dataset.label || '';
                                if (context.parsed.y !== null) label = `₹${context.parsed.y.toFixed(2)}`;
                                return label;
                            }
                        }
                    }
                }
            }
        });
    }
}

/**
 * Renders Monthly Analysis charts and summary.
 * @param {string} monthString - Month in YYYY-MM format.
 */
export function renderMonthlyAnalysis(monthString) {
    const transactionsForMonth = getTransactionsForMonth(monthString);
    const summary = calculatePeriodSummary(transactionsForMonth);

    monthlyTotalIncomeCard.innerText = `₹${summary.totalIncome}`;
    monthlyTotalExpensesCard.innerText = `₹${summary.totalExpenses}`;
    monthlyNetBalanceCard.innerText = `₹${summary.netBalance}`;
    monthlyTopCategoryCard.innerText = summary.topCategory;

    // Monthly Category Pie Chart
    if (monthlyCategoryPieChart_Analytics) monthlyCategoryPieChart_Analytics.destroy();
    if (monthlyCategoryPieChartCtx_Analytics) {
        const pieLabels = Object.keys(summary.categoryExpenses);
        const pieData = Object.values(summary.categoryExpenses);
        const pieColors = pieLabels.map((_, i) => `hsl(${(i * 137.508) % 360}, 70%, 60%)`);
        monthlyCategoryPieChart_Analytics = new Chart(monthlyCategoryPieChartCtx_Analytics, {
            type: 'doughnut',
            data: {
                labels: pieLabels,
                datasets: [{
                    label: 'Expenses by Category',
                    data: pieData,
                    backgroundColor: pieColors,
                    borderColor: getCssVar('--container-bg'),
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'right', labels: { color: getCssVar('--text-color-secondary') } },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                let label = context.label || '';
                                if (label) label += ': ';
                                if (context.parsed) {
                                    const total = context.dataset.data.reduce((sum, val) => sum + val, 0);
                                    const percentage = (context.parsed / total * 100).toFixed(2);
                                    label += `₹${context.parsed.toFixed(2)} (${percentage}%)`;
                                }
                                return label;
                            }
                        }
                    }
                }
            }
        });
    }

    // Monthly Daily Trends Chart (Income vs Expense per day)
    if (monthlyDailyTrendsChart) monthlyDailyTrendsChart.destroy();
    if (monthlyDailyTrendsChartCtx) {
        const daysInMonth = new Date(new Date(monthString).getFullYear(), new Date(monthString).getMonth() + 1, 0).getDate();
        const dailyLabels = Array.from({ length: daysInMonth }, (_, i) => String(i + 1).padStart(2, '0'));
        const dailyIncomeData = dailyLabels.map(day => summary.dailyIncome[`${monthString}-${day}`] || 0);
        const dailyExpenseData = dailyLabels.map(day => summary.dailyExpenses[`${monthString}-${day}`] || 0);

        monthlyDailyTrendsChart = new Chart(monthlyDailyTrendsChartCtx, {
            type: 'line',
            data: {
                labels: dailyLabels,
                datasets: [
                    {
                        label: 'Income (₹)',
                        data: dailyIncomeData,
                        borderColor: '#28a745',
                        backgroundColor: 'rgba(40, 167, 69, 0.2)',
                        fill: true,
                        tension: 0.3
                    },
                    {
                        label: 'Expenses (₹)',
                        data: dailyExpenseData,
                        borderColor: '#dc3545',
                        backgroundColor: 'rgba(220, 53, 69, 0.2)',
                        fill: true,
                        tension: 0.3
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        title: { display: true, text: 'Amount (₹)', color: getCssVar('--text-color-secondary') },
                        ticks: { color: getCssVar('--text-color-secondary') },
                        grid: { color: getCssVar('--border-color') }
                    },
                    x: {
                        title: { display: true, text: 'Day of Month', color: getCssVar('--text-color-secondary') },
                        ticks: { color: getCssVar('--text-color-secondary') },
                        grid: { color: getCssVar('--border-color') }
                    }
                },
                plugins: {
                    legend: { position: 'top', labels: { color: getCssVar('--text-color-secondary') } },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                let label = context.dataset.label || '';
                                if (label) label += ': ';
                                if (context.parsed.y !== null) label += `₹${context.parsed.y.toFixed(2)}`;
                                return label;
                            }
                        }
                    }
                }
            }
        });
    }
}

/**
 * Renders Yearly Analysis charts and summary.
 * @param {string} yearString - Year in YYYY format.
 */
export function renderYearlyAnalysis(yearString) {
    const transactionsForYear = getTransactionsForYear(yearString);
    const summary = calculatePeriodSummary(transactionsForYear);

    yearlyTotalIncomeCard.innerText = `₹${summary.totalIncome}`;
    yearlyTotalExpensesCard.innerText = `₹${summary.totalExpenses}`;
    yearlyNetBalanceCard.innerText = `₹${summary.netBalance}`;
    yearlyTopCategoryCard.innerText = summary.topCategory;

    // Yearly Category Pie Chart
    if (yearlyCategoryPieChart_Analytics) yearlyCategoryPieChart_Analytics.destroy();
    if (yearlyCategoryPieChartCtx_Analytics) {
        const pieLabels = Object.keys(summary.categoryExpenses);
        const pieData = Object.values(summary.categoryExpenses);
        const pieColors = pieLabels.map((_, i) => `hsl(${(i * 137.508) % 360}, 70%, 60%)`);
        yearlyCategoryPieChart_Analytics = new Chart(yearlyCategoryPieChartCtx_Analytics, {
            type: 'doughnut',
            data: {
                labels: pieLabels,
                datasets: [{
                    label: 'Expenses by Category',
                    data: pieData,
                    backgroundColor: pieColors,
                    borderColor: getCssVar('--container-bg'),
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'right', labels: { color: getCssVar('--text-color-secondary') } },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                let label = context.label || '';
                                if (label) label += ': ';
                                if (context.parsed) {
                                    const total = context.dataset.data.reduce((sum, val) => sum + val, 0);
                                    const percentage = (context.parsed / total * 100).toFixed(2);
                                    label += `₹${context.parsed.toFixed(2)} (${percentage}%)`;
                                }
                                return label;
                            }
                        }
                    }
                }
            }
        });
    }

    // Yearly Monthly Trends Chart (Income vs Expense per month)
    if (yearlyMonthlyTrendsChart) yearlyMonthlyTrendsChart.destroy();
    if (yearlyMonthlyTrendsChartCtx) {
        const months = Array.from({ length: 12 }, (_, i) => new Date(0, i).toLocaleString('en-IN', { month: 'short' }));
        const monthlyIncomeData = months.map((_, i) => summary.monthlyIncome[`${yearString}-${String(i + 1).padStart(2, '0')}`] || 0);
        const monthlyExpenseData = months.map((_, i) => summary.monthlyExpenses[`${yearString}-${String(i + 1).padStart(2, '0')}`] || 0);

        yearlyMonthlyTrendsChart = new Chart(yearlyMonthlyTrendsChartCtx, {
            type: 'bar', // Changed to bar chart for clarity
            data: {
                labels: months,
                datasets: [
                    {
                        label: 'Income (₹)',
                        data: monthlyIncomeData,
                        backgroundColor: '#28a745',
                        borderColor: '#28a745',
                        borderWidth: 1
                    },
                    {
                        label: 'Expenses (₹)',
                        data: monthlyExpenseData,
                        backgroundColor: '#dc3545',
                        borderColor: '#dc3545',
                        borderWidth: 1
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        title: { display: true, text: 'Amount (₹)', color: getCssVar('--text-color-secondary') },
                        ticks: { color: getCssVar('--text-color-secondary') },
                        grid: { color: getCssVar('--border-color') }
                    },
                    x: {
                        title: { display: true, text: 'Month', color: getCssVar('--text-color-secondary') },
                        ticks: { color: getCssVar('--text-color-secondary') },
                        grid: { color: getCssVar('--border-color') }
                    }
                },
                plugins: {
                    legend: { position: 'top', labels: { color: getCssVar('--text-color-secondary') } },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                let label = context.dataset.label || '';
                                if (label) label += ': ';
                                if (context.parsed.y !== null) label += `₹${context.parsed.y.toFixed(2)}`;
                                return label;
                            }
                        }
                    }
                }
            }
        });
    }
}

/**
 * Populates the year dropdown for Yearly Analysis.
 */
export function populateYearlyAnalysisYearSelect() {
    yearlyAnalysisYearSelect.innerHTML = '';
    const currentYear = new Date().getFullYear();
    // Show current year and 5 previous years
    for (let i = 0; i < 6; i++) {
        const year = currentYear - i;
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;
        yearlyAnalysisYearSelect.appendChild(option);
    }
    yearlyAnalysisYearSelect.value = currentYear; // Default to current year
}


/**
 * Shows the selected analytics sub-view and renders its content.
 * @param {string} viewId - The ID of the analytics sub-view to show (e.g., 'daily-analysis-view').
 */
export function showAnalyticsView(viewId) {
    document.querySelectorAll('.analytics-view-content').forEach(view => {
        view.classList.remove('active');
    });
    document.getElementById(viewId).classList.add('active');

    analyticsTabs.forEach(btn => {
        if (btn.dataset.view === viewId) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    // Render content for the activated view
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const currentMonth = today.substring(0, 7); // YYYY-MM
    const currentYear = today.substring(0, 4); // YYYY

    if (viewId === 'daily-analysis-view') {
        dailyAnalysisDateInput.value = dailyAnalysisDateInput.value || today; // Set default to today
        renderDailyAnalysis(dailyAnalysisDateInput.value);
    } else if (viewId === 'monthly-analysis-view') {
        monthlyAnalysisMonthInput.value = monthlyAnalysisMonthInput.value || currentMonth; // Set default to current month
        renderMonthlyAnalysis(monthlyAnalysisMonthInput.value);
    } else if (viewId === 'yearly-analysis-view') {
        populateYearlyAnalysisYearSelect(); // Ensure year dropdown is populated
        yearlyAnalysisYearSelect.value = yearlyAnalysisYearSelect.value || currentYear; // Set default to current year
        renderYearlyAnalysis(yearlyAnalysisYearSelect.value);
    }
}
