const databaseServices = require("../services/databaseServices");
const alphaVantageService = require("../services/alphaVantageService");
const exchangeRateService = require("../services/exchangeRateService");

const portfolioController = {
  getPortfolioSummary: async (req, res) => {
    try {
      const userId = req.params.userId;

      // Get user's accounts with portfolios in one query
      const accounts = await databaseServices.getAccountInfo(userId);
      if (!accounts || accounts.length === 0) {
        return res.status(404).json({ message: "No accounts found" });
      }

      // Get detailed portfolio data for each account
      const portfolioData = await Promise.all(
        accounts.map(async (account) => {
          const portfolios = await databaseServices.getPortfoliosForUser(account.id);

          const portfoliosWithData = await Promise.all(
            portfolios.map(async (portfolio) => {
              const transactions = await databaseServices.getTransactionsForPortfolio(portfolio.id);
              const holdings = calculateHoldings(transactions);
              const securitiesData = await getSecuritiesData(holdings);
              const metrics = await calculatePortfolioMetrics(
                holdings,
                securitiesData,
                account.currency
              );

              return {
                ...portfolio,
                account_name: account.account_name,
                currency: account.currency,
                holdings,
                metrics
              };
            })
          );

          return {
            ...account,
            portfolios: portfoliosWithData
          };
        })
      );

      res.json(portfolioData);
    } catch (error) {
      console.error("Error in getPortfolioSummary", error);
      res.status(500).json({ error: "Failed to fetch portfolio data" });
    }
  }
};

// Helper function to calculate holdings
function calculateHoldings(transactions) {
  const holdingsBySecurityId = {};

  transactions.forEach((transaction) => {
    const securityId = transaction.securities_id;

    if (!holdingsBySecurityId[securityId]) {
      holdingsBySecurityId[securityId] = {
        securityId,
        security_name: transaction.security_name,
        symbol: transaction.symbol,
        type: transaction.security_type,
        quantity: 0,
        totalCost: 0,
        transactions: [],
      };
    }

    const holding = holdingsBySecurityId[securityId];

    if (transaction.transaction_type === "BUY") {
      holding.quantity += transaction.amount;
      holding.totalCost += transaction.total_price; // remember this line, because I can't see any totalCost row in the transactions table
    } else if (transaction.transaction_type === "SELL") {
      holding.quantity -= transaction.amount;
      // In a more complex implementation, we would calculate realized gains here
    }

    holding.transactions.push(transaction);
  });

  // Convert to array and filter out securities with zero quantity
  return Object.values(holdingsBySecurityId)
    .filter((holding) => holding.quantity > 0)
    .map((holding) => ({
      ...holding,
      gak: holding.quantity > 0 ? holding.totalCost / holding.quantity : 0,
    }));
}

// Helper function to get current securities data
async function getSecuritiesData(holdings) {
  // Get current prices and data for all securities in the portfolio
  const securitiesData = {};

  // For each security in holdings, fetch current price data
  await Promise.all(
    holdings.map(async (holding) => {
      try {
        // Get company overview for more details (optional)
        const companyData = await alphaVantageService.getCompanyOverview(
          holding.symbol
        );

        // Get current quote
        const quoteData = await alphaVantageService.getStockQuote(
          holding.symbol
        );

        // Extract current price from quote
        const currentPrice = quoteData["Global Quote"]
          ? parseFloat(quoteData["Global Quote"]["05. price"])
          : 0;

        securitiesData[holding.securityId] = {
          currentPrice,
          companyData,
        };
      } catch (error) {
        console.error(`Error fetching data for ${holding.symbol}:`, error);
        securitiesData[holding.securityId] = { currentPrice: 0 };
      }
    })
  );

  return securitiesData;
}

// Helper function to calculate portfolio metrics
async function calculatePortfolioMetrics(holdings, securitiesData, portfolioCurrency) {
    // Get exchange rates for the portfolio currency
    const exchangeRates = await exchangeRateService.getCurrency(portfolioCurrency);

    let totalCost = 0;
    let totalCurrentValue = 0;

    // Calculate values for each holding with currency conversion
    const holdingsWithMetrics = await Promise.all(holdings.map(async holding => {
        const securityData = securitiesData[holding.securityId] || { currentPrice: 0 };
        const stockCurrency = securityData.companyData?.Currency || 'DKK'; // Default to DKK

        // Convert currentValue to portfolio currency
        const valueInStockCurrency = holding.quantity * securityData.currentPrice;
        const currentValue = convertCurrency(
            valueInStockCurrency,
            stockCurrency,
            portfolioCurrency,
            exchangeRates.conversion_rates
        );

        // Convert cost to portfolio currency if needed
        // (costs were recorded in the stock's currency)
        const costInPortfolioCurrency = convertCurrency(
            holding.totalCost,
            stockCurrency, // totalCost is in the stock's currency
            portfolioCurrency,
            exchangeRates.conversion_rates
        );

        const unrealizedGain = currentValue - costInPortfolioCurrency;
        const unrealizedGainPercent = costInPortfolioCurrency > 0 ?
            (unrealizedGain / costInPortfolioCurrency) * 100 : 0;

        totalCost += costInPortfolioCurrency;
        totalCurrentValue += currentValue;

        return {
            ...holding,
            stockCurrency,
            currentPrice: securityData.currentPrice,
            currentValue,
            costInPortfolioCurrency,
            unrealizedGain,
            unrealizedGainPercent
        };
    }));

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


function convertCurrency(amount, fromCurrency, toCurrency, ratesData) {
    // If currencies are the same, no conversion needed
    if (fromCurrency === toCurrency) return amount;

    // Check if we have valid rates data
    if (!ratesData || !ratesData.base_code || !ratesData.conversion_rates) {
        console.error("Invalid rates data format");
        return amount; // Return original amount as fallback
    }

    const baseCurrency = ratesData.base_code;
    const conversionRates = ratesData.conversion_rates;

    // Check if we have rates for both currencies
    if (!conversionRates[fromCurrency] || !conversionRates[toCurrency]) {
        console.error(`Missing conversion rate for ${fromCurrency} or ${toCurrency}`);
        return amount; // Return unconverted amount as fallback
    }

    // First convert to the base currency of the rates
    let amountInBaseCurrency;
    if (fromCurrency === baseCurrency) {
        amountInBaseCurrency = amount;
    } else {
        amountInBaseCurrency = amount / conversionRates[fromCurrency];
    }

    // Then convert from base currency to target currency
    let amountInTargetCurrency;
    if (toCurrency === baseCurrency) {
        amountInTargetCurrency = amountInBaseCurrency;
    } else {
        amountInTargetCurrency = amountInBaseCurrency * conversionRates[toCurrency];
    }

    return amountInTargetCurrency;
}

module.exports = portfolioController;
