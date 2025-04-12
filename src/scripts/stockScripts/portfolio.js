// portfolio.js - Update to fetch real data
import { stockAPI } from './api.js';

document.addEventListener('DOMContentLoaded', async () => {
    console.log("Portfolio page loaded!");

    // Instead of using mock data, fetch real data
    try {
        // Get the user ID from localStorage or session
        const userId = localStorage.getItem('userId') || 1; // Default to 1 for testing

        // Fetch portfolio data
        const portfolioData = await stockAPI.getPortfolioSummary(userId);

        // Update UI with portfolio data
        if (portfolioData && portfolioData.length > 0) {
            updatePortfolioUI(portfolioData);
        } else {
            showNoPortfoliosMessage();
        }

    } catch (error) {
        console.error('Error loading portfolio data:', error);
        showErrorMessage('Failed to load portfolio data. Please try again later.');
    }
});

// Function to update the UI with portfolio data
function updatePortfolioUI(portfolios) {
    // Get DOM elements
    const totalValue = document.getElementById('totalValueDisplay');
    const performance7D = document.getElementById('performance7d');
    const performance1M = document.getElementById('performance1m');
    const performance6M = document.getElementById('performance6m');
    const portfolioChartCanvas = document.getElementById('portfolioDistributionChart');
    const portfolioList = document.getElementById('portfolioList');
    const portfolioGrowthChartCanvas = document.getElementById('portfolioGrowthChart');

    // Calculate total portfolio value and performance
    const totalPortfolioValue = portfolios.reduce((sum, portfolio) => {
        return sum + portfolio.metrics.totalCurrentValue;
    }, 0);

    // Update total value display
    if (totalValue) {
        // Assuming the first portfolio's currency for display
        const currency = portfolios[0]?.currency || 'DKK';
        totalValue.textContent = formatCurrency(totalPortfolioValue, currency);
    }

    // Update performance indicators
    // In a real app, you'd calculate these based on historical data
    // For now, we'll use the overall unrealized gain percentage
    const overallPerformance = portfolios.reduce((sum, portfolio) => {
        return sum + portfolio.metrics.totalUnrealizedGainPercent;
    }, 0) / portfolios.length;

    // Mock performance for different time periods
    updatePerformanceDisplay(performance7D, overallPerformance * 0.4);
    updatePerformanceDisplay(performance1M, overallPerformance * 0.6);
    updatePerformanceDisplay(performance6M, overallPerformance);

    // Populate portfolio list
    if (portfolioList) {
        populatePortfolioList(portfolioList, portfolios);
    }

    // Create pie chart
    if (portfolioChartCanvas) {
        createPortfolioPieChart(portfolioChartCanvas, portfolios);
    }

    // Create growth chart
    if (portfolioGrowthChartCanvas) {
        // For now, we'll use a mock growth chart since we don't have historical data
        createMockGrowthChart(portfolioGrowthChartCanvas);
    }
}

// Function to populate the portfolio list
function populatePortfolioList(listElement, portfolios) {
    listElement.innerHTML = ''; // Clear existing content

    portfolios.forEach(portfolio => {
        // Create portfolio row
        const row = document.createElement('div');
        row.className = 'portfolio-row';

        // Portfolio name
        const nameDiv = document.createElement('div');
        nameDiv.className = 'portfolio-name';
        nameDiv.textContent = portfolio.name;

        // Portfolio change percentage
        const changeDiv = document.createElement('div');
        changeDiv.className = 'portfolio-change';
        const changePercent = portfolio.metrics.totalUnrealizedGainPercent;
        changeDiv.classList.add(changePercent >= 0 ? 'positive-change' : 'negative-change');
        changeDiv.textContent = `${changePercent.toFixed(2)}%`;

        // Portfolio value
        const valueDiv = document.createElement('div');
        valueDiv.className = 'portfolio-value';
        valueDiv.textContent = formatCurrency(portfolio.metrics.totalCurrentValue, portfolio.currency);

        // Portfolio link
        const linkDiv = document.createElement('div');
        linkDiv.className = 'portfolio-link';
        const link = document.createElement('a');
        link.href = `/portfolio/${portfolio.id}`;
        link.textContent = 'View';
        linkDiv.appendChild(link);

        // Add elements to row
        row.appendChild(nameDiv);
        row.appendChild(changeDiv);
        row.appendChild(valueDiv);
        row.appendChild(linkDiv);

        // Add row to list
        listElement.appendChild(row);
    });
}

// Function to create pie chart
function createPortfolioPieChart(canvas, portfolios) {
    // Create a distribution by sector
    const sectorDistribution = {};
    let totalValue = 0;

    // Aggregate all holdings across portfolios by sector
    portfolios.forEach(portfolio => {
        portfolio.metrics.holdings.forEach(holding => {
            const sector = holding.sector || 'Other';

            if (!sectorDistribution[sector]) {
                sectorDistribution[sector] = 0;
            }

            sectorDistribution[sector] += holding.currentValue;
            totalValue += holding.currentValue;
        });
    });

    // Convert to arrays for Chart.js
    const labels = Object.keys(sectorDistribution);
    const data = Object.values(sectorDistribution);
    const percentages = data.map(value => (value / totalValue) * 100);

    // Generate colors
    const colors = generateChartColors(labels.length);

    // Create the pie chart
    new Chart(canvas, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                data: percentages,
                backgroundColor: colors,
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.raw.toFixed(1);
                            const absoluteValue = formatCurrency(data[context.dataIndex], 'DKK');
                            return `${label}: ${value}% (${absoluteValue})`;
                        }
                    }
                },
                legend: {
                    position: 'right'
                }
            }
        }
    });
}

// Helper functions you already have
function formatCurrency(amount, currencyCode) {
    return new Intl.NumberFormat("en-US", {
        style: "decimal",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(amount) + " " + currencyCode;
}

function updatePerformanceDisplay(element, percentChange) {
    if (!element) return;

    const formattedPercent = new Intl.NumberFormat("en-US", {
        style: "decimal",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
        signDisplay: "always",
    }).format(percentChange);

    element.textContent = `${formattedPercent}%`;
    element.classList.add(percentChange >= 0 ? "positive-change" : "negative-change");
}

function generateChartColors(count) {
    const baseColors = [
        '#00DA91', // Green
        '#4B6EFF', // Blue
        '#FFB800', // Yellow
        '#FF4D4F', // Red
        '#9254DE', // Purple
        '#36CFC9', // Teal
        '#FF7A45', // Orange
        '#73D13D'  // Light green
    ];

    // If we need more colors than in our base array, generate them
    const colors = [...baseColors];

    while (colors.length < count) {
        const r = Math.floor(Math.random() * 255);
        const g = Math.floor(Math.random() * 255);
        const b = Math.floor(Math.random() * 255);
        colors.push(`rgb(${r}, ${g}, ${b})`);
    }

    return colors.slice(0, count);
}

// Other display functions
function showNoPortfoliosMessage() {
    const mainContent = document.querySelector('.main-content');
    if (mainContent) {
        mainContent.innerHTML = `
            <div class="no-data-message">
                <h2>No portfolios found</h2>
                <p>Create a new portfolio to get started.</p>
                <button class="btn btn-primary" id="createFirstPortfolioButton">Create Portfolio</button>
            </div>
        `;

        // Add event listener for the button
        document.getElementById('createFirstPortfolioButton').addEventListener('click', () => {
            // Show the create portfolio modal
            const modal = document.getElementById('addPortfolioModal');
            if (modal) modal.style.display = 'flex';
        });
    }
}

function showErrorMessage(message) {
    const mainContent = document.querySelector('.main-content');
    if (mainContent) {
        mainContent.innerHTML = `
            <div class="error-message">
                <h2>Error</h2>
                <p>${message}</p>
                <button class="btn btn-primary" id="retryButton">Retry</button>
            </div>
        `;

        // Add event listener for the retry button
        document.getElementById('retryButton').addEventListener('click', () => {
            window.location.reload();
        });
    }
}

function createMockGrowthChart(canvas) {
    // Create a mock growth chart with random data
    // In a real app, you'd use historical data

    const labels = [];
    const data = [];

    // Generate data for the last 12 months
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        labels.push(date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }));

        // Generate a random value that trends upward
        const value = 10000 + (i * 500) + (Math.random() * 1000);
        data.push(value);
    }

    new Chart(canvas, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Portfolio Value',
                data: data,
                borderColor: '#00DA91',
                backgroundColor: 'rgba(0, 218, 145, 0.1)',
                tension: 0.1,
                fill: true
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: false
                }
            }
        }
    });
}