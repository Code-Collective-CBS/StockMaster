// Portfolio page specific functionality

document.addEventListener('DOMContentLoaded', function() {
    // Error handling for missing ata
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

    // 3. Populate portfolio list
    populatePortfolioList(portfolios);

    // 4. Initialize portfolio distribution chart (pie chart)
    initializeDistributionChart(portfolios);

    // 5. Initialize portfolio growth chart (line graph)
    initializeGrowthChart(portfolios);

    // 6. Populate account options in forms
    populateAccountDropdowns(accounts);
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

    if (!performance7d || !performance1m || !performance6m) return;

    // Calculate weighted average performance for each time period
    let totalValue = portfolios.reduce((sum, p) => sum + p.totalValue, 0);

    // Calculate weighted averages for each timeframe
    const calcWeightedAvg = (period) => {
        return portfolios.reduce((sum, p) => {
            const weight = p.totalValue / totalValue;
            return sum + (p.historicalData[period] * weight);
        }, 0);
    };

    const avg7d = calcWeightedAvg('7d');
    const avg1m = calcWeightedAvg('1m');
    const avg6m = calcWeightedAvg('6m');

    // Update display and add appropriate CSS classes
    updatePerformanceDisplay(performance7d, avg7d);
    updatePerformanceDisplay(performance1m, avg1m);
    updatePerformanceDisplay(performance6m, avg6m);
}

function updatePerformanceDisplay(element, value) {
    // Format the value
    const formattedValue = value.toFixed(1) + '%';

    // Determine if positive or negative
    const isPositive = value >= 0;

    // Update element
    element.textContent = formattedValue;
    element.classList.remove('positive', 'negative');
    element.classList.add(isPositive ? 'positive' : 'negative');

    // Add arrow
    const arrow = document.createElement('span');
    arrow.className = 'arrow';
    arrow.textContent = isPositive ? ' ↗' : ' ↘';
    element.appendChild(arrow);
}

function populatePortfolioList(portfolios) {
    const portfolioListElement = document.getElementById('portfolioList');
    if (!portfolioListElement) return;

    // Clear existing rows
    portfolioListElement.innerHTML = '';

    // Create row for each portfolio
    portfolios.forEach(portfolio => {
        const row = document.createElement('div');
        row.className = 'portfolio-row';

        // Create the portfolio row content
        row.innerHTML = `
            <div class="portfolio-name">${portfolio.name}</div>
            <div class="portfolio-change ${portfolio.changePercent >= 0 ? 'positive' : 'negative'}">
                ${portfolio.changePercent.toFixed(2)}%
            </div>
            <div class="portfolio-value">${portfolio.totalValue.toLocaleString()} DKK</div>
            <div class="portfolio-link"><a href="portfolio-details.html?id=${portfolio.id}">Vis konto →</a></div>
        `;

        portfolioListElement.appendChild(row);
    });
}


    function initializeDistributionChart(portfolios) {
    // Chart.js to create the actual pie chart
        const ctx = document.getElementById('portfolioDistributionChart').getContext('2d');

        // Calculate distribution data
        const portfolioData = portfolios.map(p => ({
            value: p.totalValue,
            label: p.name
        }));

        new Chart(ctx, {
            type: 'pie',
            data: {
                labels: portfolioData.map(d => d.label),
                datasets: [{
                    data: portfolioData.map(d => d.value),
                    backgroundColor: [
                        '#00DA91',
                        '#1E6399',
                        '#FF6B6B'
                    ]
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }



function initializeGrowthChart(portfolios) {
    // This is a simplified placeholder - in a real app you'd use a charting library

    const chartContainer = document.getElementById('portfolioGrowthChart');
    if (!chartContainer) return;

    // For now, just add a message about the chart
    chartContainer.innerHTML = `
        <div style="text-align: center; padding: 20px;">
            <div style="font-size: 16px; margin-bottom: 20px;">Portfolio Growth Over Time</div>
            <svg width="100%" height="200" viewBox="0 0 600 200">
                <path d="M0,150 L100,120 L200,130 L300,80 L400,50 L500,30 L600,10"
                    stroke="#00DA91" stroke-width="3" fill="none" />
                <path d="M0,150 L100,120 L200,130 L300,80 L400,50 L500,30 L600,10"
                    stroke="none" fill="url(#gradient)" opacity="0.3" />
                <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" style="stop-color:#00DA91;stop-opacity:1" />
                        <stop offset="100%" style="stop-color:#00DA91;stop-opacity:0" />
                    </linearGradient>
                </defs>
            </svg>
        </div>
    `;

    // Set up time selector change event
    const timeSelector = document.getElementById('timeframeSelector');
    if (timeSelector) {
        timeSelector.addEventListener('change', function() {
            // In a real app, this would update the chart with different time period data
            console.log(`Changed timeframe to: ${this.value}`);
        });
    }
}

function populateAccountDropdowns(accounts) {
    // Populate account dropdowns in the modals
    const accountSelectors = [
        document.getElementById('accountSelect'),
        document.getElementById('accountSelectDeposit')
    ];

    accountSelectors.forEach(selector => {
        if (!selector) return;

        // Clear existing options
        selector.innerHTML = '';

        // Add options for each account
        accounts.forEach(account => {
            const option = document.createElement('option');
            option.value = account.id;
            option.textContent = `${account.name} (${account.balance.toLocaleString()} ${account.currency})`;
            selector.appendChild(option);
        });
    });
}

function setupEventListeners() {
    // Add portfolio button opens modal
    const addPortfolioButton = document.getElementById('addPortfolioButton');
    const addPortfolioModal = document.getElementById('addPortfolioModal');
    const closeModalButton = document.getElementById('closeModalButton');

    if (addPortfolioButton && addPortfolioModal) {
        addPortfolioButton.addEventListener('click', function() {
            addPortfolioModal.style.display = 'flex';
        });
    }

    if (closeModalButton && addPortfolioModal) {
        closeModalButton.addEventListener('click', function() {
            addPortfolioModal.style.display = 'none';
        });
    }

    // Deposit button opens modal
    const depositButton = document.getElementById('depositButton');
    const depositModal = document.getElementById('depositModal');
    const closeDepositModalButton = document.getElementById('closeDepositModalButton');

    if (depositButton && depositModal) {
        depositButton.addEventListener('click', function() {
            depositModal.style.display = 'flex';
        });
    }

    if (closeDepositModalButton && depositModal) {
        closeDepositModalButton.addEventListener('click', function() {
            depositModal.style.display = 'none';
        });
    }

    // Form submissions
    const addPortfolioForm = document.getElementById('addPortfolioForm');
    if (addPortfolioForm) {
        addPortfolioForm.addEventListener('submit', function(event) {
            event.preventDefault();

            // Get form values
            const portfolioName = document.getElementById('portfolioName').value;
            const accountId = document.getElementById('accountSelect').value;

            // In a real app, you'd make an API call to create the portfolio
            console.log(`Creating portfolio: ${portfolioName} for account ID: ${accountId}`);

            // Close the modal
            addPortfolioModal.style.display = 'none';

            // For demo purposes, show a temporary success message
            showSuccessMessage('Portfolio created successfully!');
        });
    }

    const depositForm = document.getElementById('depositForm');
    if (depositForm) {
        depositForm.addEventListener('submit', function(event) {
            event.preventDefault();

            // Get form values
            const accountId = document.getElementById('accountSelectDeposit').value;
            const amount = document.getElementById('depositAmount').value;

            // In a real app, you'd make an API call to deposit the amount
            console.log(`Depositing ${amount} DKK to account ID: ${accountId}`);

            // Close the modal
            depositModal.style.display = 'none';

            // For demo purposes, show a temporary success message
            showSuccessMessage('Amount deposited successfully!');
        });
    }

    // Close modals when clicking outside
    window.addEventListener('click', function(event) {
        if (event.target === addPortfolioModal) {
            addPortfolioModal.style.display = 'none';
        }

        if (event.target === depositModal) {
            depositModal.style.display = 'none';
        }
    });
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