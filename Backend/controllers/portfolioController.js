const databaseServices = require('../services/databaseServices');
const alphaVantageService = require('../services/alphaVantageService');
const exchangeRateService = require('../services/exchangeRateService');
const stockController = require('./stockController');

const portfolioController = {
    getPortfolioSummary: async (req, res) => {
        try {
            const userId = req.params.userId;

            const portfolios = await databaseServices.getPortfoliosForUser(userId);

            if (portfolios.length === 0) {
                return res.status(404).json({ message: "No portfolios found" });
            }

            // Now we take each portfolio and get their transactions
            const portfolioData = await Promise.all(portfolios.map(async (portfolio) => {
                const transactions = await databaseServices.getTransactionsForPortfolio(portfolio.id);

                // Calculate holdings based on transactions
                const holdings = calculateHoldings(transactions);

                // Get current prices for securities in the portfolio
                const securitiesData = await getSecuritiesData(holdings);

                // Calculate metrics like total value, unrealized gain/loss
                const metrics = calculatePortfolioMetrics(holdings, securitiesData, portfolio.currency);

                return {
                    ...portfolio,
                    holdings: holdings,
                    metrics: metrics
                };
            }));

            res.json(portfolioData);
        } catch (error) {
            console.error("Error in getPortfolioSummary", error);
            res.status(500).json({ error: "Failed to fetch portfolio data" });
        }
    },
};

// Helper function to calculate holdings
function calculateHoldings(transactions) {
    const holdingsBySecurityId = {};

    transactions.forEach(transaction => {
        const securityId = transaction.securities_id;

        if (!holdingsBySecurityId[securityId]) {
            holdingsBySecurityId[securityId] = {
                securityId,
                security_name: transaction.security_name,
                symbol: transaction.symbol,
                type: transaction.security_type,
                quantity: 0,
                totalCost: 0,
                transactions: []
            };
        }

        const holding = holdingsBySecurityId[securityId];

        if (transaction.transaction_type === 'BUY') {
            holding.quantity += transaction.amount;
            holding.totalCost += transaction.total_price; // remember this line, because I can't see any totalCost row in the transactions table
        } else if (transaction.transaction_type === 'SELL') {
            holding.quantity -= transaction.amount;
            // In a more complex implementation, we would calculate realized gains here
        }

        holding.transactions.push(transaction);
    });

    // Convert to array and filter out securities with zero quantity
    return Object.values(holdingsBySecurityId)
        .filter(holding => holding.quantity > 0)
        .map(holding => ({
            ...holding,
            gak: holding.quantity > 0 ? holding.totalCost / holding.quantity : 0,
        }));
}

// Helper function to get current securities data
async function getSecuritiesData(holdings) {
    // Get current prices and data for all securities in the portfolio
    const securitiesData = {};

    // For each security in holdings, fetch current price data
    await Promise.all(holdings.map(async (holding) => {
        try {
            // Get company overview for more details (optional)
            const companyData = await alphaVantageService.getCompanyOverview(holding.symbol);

            // Get current quote
            const quoteData = await alphaVantageService.getStockQuote(holding.symbol);

            // Extract current price from quote
            const currentPrice = quoteData['Global Quote'] ?
                parseFloat(quoteData['Global Quote']['05. price']) : 0;

            securitiesData[holding.securityId] = {
                currentPrice,
                companyData
            };
        } catch (error) {
            console.error(`Error fetching data for ${holding.symbol}:`, error);
            securitiesData[holding.securityId] = { currentPrice: 0 };
        }
    }));

    return securitiesData;
}

// Helper function to calculate portfolio metrics
function calculatePortfolioMetrics(holdings, securitiesData, portfolioCurrency) {
    let totalCost = 0;
    let totalCurrentValue = 0;

    // Calculate values for each holding
    const holdingsWithMetrics = holdings.map(holding => {
        const securityData = securitiesData[holding.securityId] || { currentPrice: 0 };
        const currentValue = holding.quantity * securityData.currentPrice;
        const unrealizedGain = currentValue - holding.totalCost;
        const unrealizedGainPercent = holding.totalCost > 0 ?
            (unrealizedGain / holding.totalCost) * 100 : 0;

        totalCost += holding.totalCost;
        totalCurrentValue += currentValue;

        return {
            ...holding,
            currentPrice: securityData.currentPrice,
            currentValue,
            unrealizedGain,
            unrealizedGainPercent
        };
    });

    // Calculate overall portfolio metrics
    const totalUnrealizedGain = totalCurrentValue - totalCost;
    const totalUnrealizedGainPercent = totalCost > 0 ?
        (totalUnrealizedGain / totalCost) * 100 : 0;

    return {
        holdings: holdingsWithMetrics,
        totalCost,
        totalCurrentValue,
        totalUnrealizedGain,
        totalUnrealizedGainPercent
    };
}

module.exports = portfolioController;