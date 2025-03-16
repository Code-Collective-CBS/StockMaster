// Portfolio page specific functionality

document.addEventListener('DOMContentLoaded', function() {
    // Error handling for missing data
    try {
    // Load mock data (temporary solution for now)
    const portfolios = window.mockData?.portfolios || [];
    const accounts = window.mockData?.accounts || [];


    if (!portfolios || !accounts) {
        throw new Error('Failed to load portfolio data');
    }
    // Initialize the portfolio page
    initializePortfolioPage(portfolios, accounts);
} catch (error) {
    console.error('Portfolio initialization failed:', error);
    showErrorMessage('Failed to load portfolio data');
}

    // Set up event listeners for interactive elements
    setupEventListeners();
});

function initializePortfolioPage(portfolios, accounts) {
    // 1. Update total value display
    updateTotalValueDisplay(portfolios);

    // 2. Update performance indicators
    updatePerformanceIndicators(portfolios);
}

function updateTotalValueDisplay(portfolios) {
    const totalValueElement = document.getElementById('totalValueDisplay');
    if (!totalValueElement) return; // Element not found

    // Calculate total value across all portfolios
    const totalValue = portfolios.reduce((sum, portfolio) => sum + portfolio.totalValue, 0);

    // Format and display the total value
    totalValueElement.textContent = `${totalValue.toLocaleString()} DKK`;
}



function updatePerformanceIndicators(portfolios) {
    // Get elements for each time period
    const performance7d = document.getElementById('performance7d');
    const performance1m = document.getElementById('performance1m');
    const performance6m = document.getElementById('performance6m');
}

function setupEventListeners() {
    // Add portfolio button opens modal
    const addPortfolioButton = document.getElementById('addPortfolioButton');
    const addPortfolioModal = document.getElementById('addPortfolioModal');
    const closeModalButton = document.getElementById('closeModalButton');
}

function showSuccessMessage(message) {
    // Create a success message element
    const successMessage = document.createElement('div');
    successMessage.className = 'success-message';
    successMessage.textContent = message;

    // Add to document
    document.body.appendChild(successMessage);

    // Automatically remove after 3 seconds
    setTimeout(() => {
        successMessage.classList.add('fade-out');
        setTimeout(() => {
            document.body.removeChild(successMessage);
        }, 500);
    }, 3000);
}