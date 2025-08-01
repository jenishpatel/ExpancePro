// js/charts.js

import { transactions } from './data.js';
import { getCssVar } from './utils.js';

// Chart instances (global references to allow destruction)
let dashboardMonthlyLineChart;
let dashboardCategoryPieChart;
let monthlyExpenseChart;
let categoryExpenseChart;

// Chart contexts
const dashboardCategoryPieChartCtx = document.getElementById('dashboardCategoryPieChart')?.getContext('2d');
const dashboardMonthlyLineChartCtx = document.getElementById('dashboardMonthlyLineChart')?.getContext('2d');
const monthlyExpenseChartCtx = document.getElementById('monthlyExpenseChart')?.getContext('2d');
const categoryExpenseChartCtx = document.getElementById('categoryExpenseChart')?.getContext('2d');

/**
 * Renders the charts on the Dashboard panel.
 */
export function renderDashboardCharts() {
    if (dashboardCategoryPieChartCtx) {
        dashboardCategoryPieChart = renderCategoryPieChart(dashboardCategoryPieChartCtx, dashboardCategoryPieChart, 'alltime');
    }
    if (dashboardMonthlyLineChartCtx) {
        dashboardMonthlyLineChart = renderMonthlyExpenseChart(dashboardMonthlyLineChartCtx, dashboardMonthlyLineChart, 'last6months');
    }
}

/**
 * Renders the charts on the Charts panel.
 * @param {string} period - Filter period ('last6months', 'last12months', 'alltime').
 */
export function renderMainCharts(period) {
    if (monthlyExpenseChartCtx) {
        monthlyExpenseChart = renderMonthlyExpenseChart(monthlyExpenseChartCtx, monthlyExpenseChart, period);
    }
    if (categoryExpenseChartCtx) {
        categoryExpenseChart = renderCategoryExpenseChart(categoryExpenseChartCtx, categoryExpenseChart, period);
    }
}

/**
 * Prepares data for monthly expense trend charts.
 * @param {string} period - Filter period ('last6months', 'last12months', 'alltime').
 * @returns {object} Labels and data for the chart.
 */
function getMonthlyExpenseData(period) {
    const expensesByMonth = {};
    const today = new Date();
    const minDate = new Date(today);

    if (period === 'last6months') {
        minDate.setMonth(today.getMonth() - 5);
        minDate.setDate(1);
    } else if (period === 'last12months') {
        minDate.setFullYear(today.getFullYear() - 1);
        minDate.setMonth(today.getMonth() + 1); // Start from the beginning of the month next to the current month in previous year
        minDate.setDate(1);
    } else { // 'alltime'
        if (transactions.length > 0) {
            const earliestTransactionDate = new Date(Math.min(...transactions.map(t => new Date(t.date + 'T00:00:00'))));
            minDate.setFullYear(earliestTransactionDate.getFullYear());
            minDate.setMonth(earliestTransactionDate.getMonth());
            minDate.setDate(1);
        } else {
            return { labels: [], data: [] };
        }
    }
    minDate.setHours(0,0,0,0); // Reset time to start of day

    transactions.filter(t => t.amount < 0).forEach(transaction => {
        const transactionDate = new Date(transaction.date + 'T00:00:00');
        if (transactionDate >= minDate && transactionDate <= today) {
            const monthYear = transactionDate.toLocaleString('en-IN', { month: 'short', year: 'numeric' });
            expensesByMonth[monthYear] = (expensesByMonth[monthYear] || 0) + Math.abs(transaction.amount);
        }
    });

    const labels = [];
    const data = [];
    let currentDate = new Date(minDate);

    // Loop from minDate up to today to get all months in between
    while (currentDate <= today) {
        const monthYear = currentDate.toLocaleString('en-IN', { month: 'short', year: 'numeric' });
        labels.push(monthYear);
        data.push(expensesByMonth[monthYear] || 0);

        currentDate.setMonth(currentDate.getMonth() + 1);
        // If it rolls over to next year, set year accordingly (handled by setMonth normally)
        // No need for setFullYear here as setMonth handles year overflow
    }
    return { labels, data };
}

/**
 * Initializes or updates the monthly expense line chart.
 * @param {CanvasRenderingContext2D} ctx - Canvas context.
 * @param {Chart} chartInstance - Existing Chart.js instance.
 * @param {string} period - Filter period.
 * @returns {Chart} The new Chart.js instance.
 */
function renderMonthlyExpenseChart(ctx, chartInstance, period) {
    if (!ctx) return null; // Ensure context exists
    if (chartInstance) {
        chartInstance.destroy();
    }
    const { labels, data } = getMonthlyExpenseData(period);

    return new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Total Expenses (₹)',
                data: data,
                backgroundColor: 'rgba(220, 53, 69, 0.4)',
                borderColor: '#dc3545',
                borderWidth: 2,
                fill: true,
                tension: 0.3,
                pointBackgroundColor: '#dc3545',
                pointBorderColor: '#fff',
                pointRadius: 5,
                pointHoverRadius: 7,
            }]
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
                legend: {
                    display: true,
                    position: 'top',
                    labels: { color: getCssVar('--text-color-secondary') }
                },
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

/**
 * Prepares data for category-wise expense charts.
 * @param {string} period - Filter period ('last6months', 'last12months', 'alltime').
 * @returns {object} Labels, data, and backgroundColors for the chart.
 */
function getCategoryExpenseData(period) {
    const expensesByCategory = {};
    const today = new Date();
    const minDate = new Date(today);

    if (period === 'last6months') {
        minDate.setMonth(today.getMonth() - 5);
        minDate.setDate(1);
    } else if (period === 'last12months') {
        minDate.setFullYear(today.getFullYear() - 1);
        minDate.setMonth(today.getMonth() + 1);
        minDate.setDate(1);
    } else { // 'alltime'
        if (transactions.length > 0) {
            const earliestTransactionDate = new Date(Math.min(...transactions.map(t => new Date(t.date + 'T00:00:00'))));
            minDate.setFullYear(earliestTransactionDate.getFullYear());
            minDate.setMonth(earliestTransactionDate.getMonth());
            minDate.setDate(1);
        } else {
            return { labels: [], data: [], backgroundColors: [] };
        }
    }
    minDate.setHours(0,0,0,0);

    transactions.filter(t => t.amount < 0).forEach(transaction => {
        const transactionDate = new Date(transaction.date + 'T00:00:00');
        if (transactionDate >= minDate && transactionDate <= today) {
            const category = transaction.category || 'Other';
            expensesByCategory[category] = (expensesByCategory[category] || 0) + Math.abs(transaction.amount);
        }
    });

    const labels = Object.keys(expensesByCategory);
    const data = Object.values(expensesByCategory);

    const backgroundColors = labels.map((_, index) => {
        const hue = (index * 137.508) % 360;
        return `hsl(${hue}, 70%, 60%)`;
    });

    return { labels, data, backgroundColors };
}

/**
 * Initializes or updates the category-wise expense bar chart.
 * @param {CanvasRenderingContext2D} ctx - Canvas context.
 * @param {Chart} chartInstance - Existing Chart.js instance.
 * @param {string} period - Filter period.
 * @returns {Chart} The new Chart.js instance.
 */
function renderCategoryExpenseChart(ctx, chartInstance, period) {
    if (!ctx) return null; // Ensure context exists
    if (chartInstance) {
        chartInstance.destroy();
    }
    const { labels, data, backgroundColors } = getCategoryExpenseData(period);

    return new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Expenses by Category (₹)',
                data: data,
                backgroundColor: backgroundColors,
                borderColor: backgroundColors.map(color => color.replace('70%', '50%').replace('60%', '50%')),
                borderWidth: 1
            }]
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
                    title: { display: true, text: 'Category', color: getCssVar('--text-color-secondary') },
                    ticks: {
                        autoSkip: false,
                        maxRotation: 45,
                        minRotation: 45,
                        color: getCssVar('--text-color-secondary')
                    },
                    grid: { color: getCssVar('--border-color') }
                }
            },
            plugins: {
                legend: { display: false },
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

/**
 * Initializes or updates the category-wise expense pie chart.
 * @param {CanvasRenderingContext2D} ctx - Canvas context.
 * @param {Chart} chartInstance - Existing Chart.js instance.
 * @param {string} period - Filter period.
 * @returns {Chart} The new Chart.js instance.
 */
export function renderCategoryPieChart(ctx, chartInstance, period) {
    if (!ctx) return null; // Ensure context exists
    if (chartInstance) {
        chartInstance.destroy();
    }
    const { labels, data, backgroundColors } = getCategoryExpenseData(period);

    return new Chart(ctx, {
        type: 'doughnut', // Changed to doughnut for a modern look
        data: {
            labels: labels,
            datasets: [{
                label: 'Expenses by Category (₹)',
                data: data,
                backgroundColor: backgroundColors,
                borderColor: getCssVar('--container-bg'), // Border color to match container for seamless look
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        color: getCssVar('--text-color-secondary')
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let label = context.label || '';
                            if (label) {
                                label += ': ';
                            }
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
