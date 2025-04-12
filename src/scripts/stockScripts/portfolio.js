import { currencyDKKData } from "./currencyDKKData";
import { IBMStockData } from "./IBMStockData";


document.addEventListener('DOMContentLoaded', async () => {
    console.log("Portfolio page loaded!");

    // Get DOM elements
    const totalValue = document.getElementById('totalValueDisplay');
    const performance7D = document.getElementById('performance7d');
    const performance1M = document.getElementById('performance1m');
    const performance6M = document.getElementById('performance6m');
    const portfolioChartCanvas = document.getElementById('portfolioDistributionChart');
    const portfolioList = document.getElementById('portfolioList');
    const portfolioGrowthChartCanvas = document.getElementById('portfolioGrowthChart');

    // For the demo, assume the data is already available globally
    // This assumes your IBMStockData and currencyDKKData are defined globally

    // Mock user settings
    const userSettings = {
        baseCurrency: "DKK", // Base currency from account settings
    };

    // Get currency conversion data
    const baseCurrency = userSettings.baseCurrency;

    // Access currencyDKKData as a global variable
    const conversionRates = currencyDKKData.conversion_rates;
    console.log(`The account's preferred currency: ${baseCurrency}`);

    // Create mock portfolio holdings data
    const mockPortfolio = createMockPortfolio();

    try {
        // Calculate portfolio metrics
        const portfolioMetrics = calculatePortfolioMetrics(mockPortfolio, conversionRates, baseCurrency);

        // Update UI with portfolio data
        updatePortfolioSummary(portfolioMetrics, totalValue, performance7D, performance1M, performance6M, baseCurrency);

        // Create pie chart of holdings
        if (portfolioChartCanvas) {
            createPortfolioPieChart(portfolioChartCanvas, mockPortfolio, conversionRates, baseCurrency);
        }

        // Populate portfolio list
        populatePortfolioList(portfolioList, mockPortfolio, conversionRates, baseCurrency);

        // Create growth chart
        if (portfolioGrowthChartCanvas) {
            createGrowthChart(portfolioGrowthChartCanvas, baseCurrency);
        }

        // Set up event listeners for timeframe selection
        setupTimeframeSelector();

        // Set up modal functionality
        setupModals();

    } catch (error) {
        console.error('Error processing portfolio data', error);
    }
});

// Create mock portfolio data using the IBM stock data
function createMockPortfolio() {

    // Function to get the latest closing price from time series data
const getLatestClosingPrice = (timeSeriesData) => {
    // If there's no data, return null
    if (!timeSeriesData || Object.keys(timeSeriesData).length === 0) {
      return null;
    }
    // Get all dates in the time series
    const dates = Object.keys(timeSeriesData);
    // Sort dates in descending order (newest first)
    dates.sort((a, b) => new Date(b) - new Date(a));
    // Get the most recent date (first after sorting)
    const latestDate = dates[0];
    // Return the closing price from the latest date entry
    return parseFloat(timeSeriesData[latestDate]["4. close"]);
  }

    return [
        {
            symbol: "IBM",
            name: IBMStockData.companyOverview.Name,
            shares: 10,
            purchasePrice: 200.50,
            currency: IBMStockData.companyOverview.Currency,
            currentPrice: getLatestClosingPrice(IBMStockData.dailyTimeSeries),
            sector: IBMStockData.companyOverview.Sector
        },
        {
            symbol: "AAPL",
            name: "Apple Inc.",
            shares: 5,
            purchasePrice: 150.75,
            currency: "USD",
            currentPrice: 175.50,
            sector: "TECHNOLOGY"
        },
        {
            symbol: "MSFT",
            name: "Microsoft Corporation",
            shares: 8,
            purchasePrice: 280.25,
            currency: "USD",
            currentPrice: 310.45,
            sector: "TECHNOLOGY"
        },
        {
            symbol: "AMZN",
            name: "Amazon.com Inc.",
            shares: 3,
            purchasePrice: 3100.00,
            currency: "USD",
            currentPrice: 3250.75,
            sector: "CONSUMER SERVICES"
        }
    ];
}

// Calculate portfolio metrics
function calculatePortfolioMetrics(portfolio, conversionRates, baseCurrency) {
    let totalValue = 0;
    let totalCost = 0;
    let holdingsValue = {};

    // Calculate total value and cost in base currency
    portfolio.forEach(holding => {
        // Convert current value to base currency
        const currentValueInBaseCurrency = convertCurrency(
            holding.currentPrice * holding.shares,
            holding.currency,
            baseCurrency,
            conversionRates
        );

        // Convert purchase value to base currency
        const purchaseValueInBaseCurrency = convertCurrency(
            holding.purchasePrice * holding.shares,
            holding.currency,
            baseCurrency,
            conversionRates
        );

        totalValue += currentValueInBaseCurrency;
        totalCost += purchaseValueInBaseCurrency;

        // Aggregate by sector for the pie chart
        if (!holdingsValue[holding.sector]) {
            holdingsValue[holding.sector] = 0;
        }
        holdingsValue[holding.sector] += currentValueInBaseCurrency;
    });

    // Calculate performance metrics
    const overallPerformance = ((totalValue - totalCost) / totalCost) * 100;

    // Mock performance for different time periods
    // In a real app, you would calculate these based on historical data
    const performance7d = overallPerformance * 0.4;  // Just for demo
    const performance1m = overallPerformance * 0.6;  // Just for demo
    const performance6m = overallPerformance;        // Just for demo

    return {
        totalValue,
        totalCost,
        overallPerformance,
        performance7d,
        performance1m,
        performance6m,
        holdingsValue
    };
}

// Currency conversion helper
function convertCurrency(amount, fromCurrency, toCurrency, conversionRates) {
    if (fromCurrency === toCurrency) return amount;

    // Convert from source currency to DKK first (assuming conversionRates are based on DKK)
    // Then convert from DKK to target currency
    const amountInDKK = fromCurrency === "DKK" ? amount : amount / conversionRates[fromCurrency];
    const amountInTargetCurrency = toCurrency === "DKK" ? amountInDKK : amountInDKK * conversionRates[toCurrency];

    return amountInTargetCurrency;
}

// Update portfolio summary in UI
function updatePortfolioSummary(metrics, totalValueElement, perf7dElement, perf1mElement, perf6mElement, baseCurrency) {
    if (totalValueElement) {
        totalValueElement.textContent = formatCurrency(metrics.totalValue, baseCurrency);
    }

    updatePerformanceDisplay(perf7dElement, metrics.performance7d);
    updatePerformanceDisplay(perf1mElement, metrics.performance1m);
    updatePerformanceDisplay(perf6mElement, metrics.performance6m);
}

// Create pie chart for portfolio distribution
function createPortfolioPieChart(canvas, portfolio, conversionRates, baseCurrency) {
    // Calculate percentage for each sector
    const metrics = calculatePortfolioMetrics(portfolio, conversionRates, baseCurrency);
    const holdingsData = metrics.holdingsValue;

    const labels = Object.keys(holdingsData);
    const data = Object.values(holdingsData);
    const totalHoldingsValue = data.reduce((a, b) => a + b, 0);
    const percentages = data.map(value => (value / totalHoldingsValue) * 100);

    // Generate a nice color for each sector
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
                            const absoluteValue = formatCurrency(data[context.dataIndex], baseCurrency);
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

// Helper function to update performance displays
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

// Format currency values
function formatCurrency(amount, currencyCode) {
    return new Intl.NumberFormat("en-US", {
        style: "decimal",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(amount) + " " + currencyCode;
}

// Generate colors for chart segments
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