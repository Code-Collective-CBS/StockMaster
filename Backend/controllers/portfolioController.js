const databaseServices = require("../services/databaseServices");
const exchangeRateService = require("../services/exchangeRateService");
const { getOrSetCache } = require('../utilityFunctions/cacheHelper');

const portfolioController = {
  getPortfolioSummary: async (req, res) => {
    try {
      const accountId = req.params.accountId;
      console.log(`Getting portfolio summary for account: ${accountId}`);

      // Define the cache key for this account's portfolio data
      const cacheKey = `portfolio-${accountId}`;

      // Use your existing getOrSetCache function
      const { data, source } = await getOrSetCache(
        cacheKey,
        async () => {
          // This function only runs when cache is missing or expired
          const portfolios = await databaseServices.getPortfoliosByAccount(accountId);
          console.log(`Found ${portfolios?.length || 0} portfolios for account ${accountId}`);

          if (!portfolios || portfolios.length === 0) {
            return []; // Return empty array if no portfolios
          }

          // Get account info from the first portfolio (assuming all portfolios in same account have same currency)
          const accountCurrency = portfolios[0].currency;
          const accountName = portfolios[0].account_name;

          // Process each portfolio with its transactions
          const portfolioData = await Promise.all(
            portfolios.map(async (portfolio) => {
              console.log(`Processing portfolio: ${portfolio.id} - ${portfolio.name}`);
              const transactions = await databaseServices.getTransactionsForPortfolio(portfolio.id);
              console.log(`Found ${transactions?.length || 0} transactions for portfolio ${portfolio.id}`);

              const holdings = calculateHoldings(transactions);
              console.log(`Calculated ${holdings?.length || 0} holdings for portfolio ${portfolio.id}`);

              const securitiesData = getSecuritiesData(holdings);
              const metrics = calculatePortfolioMetrics(holdings);

              return {
                ...portfolio,
                account_name: accountName,
                currency: accountCurrency,
                holdings,
                metrics
              };
            })
          );

          return portfolioData;
        },
        3600 // Cache for 1 hour (or adjust as needed)
      );

      // Return data (without source for now)
      res.json(data);
    } catch (error) {
      console.error("Error in getPortfolioSummary", error);
      res.status(500).json({ error: "Failed to fetch portfolio data" });
    }
  }
};

// Helper function to calculate holdings from transactions
function calculateHoldings(transactions) {
  // Check if transactions is valid
  if (!transactions || !Array.isArray(transactions) || transactions.length === 0) {
    console.warn('No valid transactions data');
    return [];
  }

  const holdingsBySecurityId = {};

  transactions.forEach((transaction) => {
    // Validate transaction object
    if (!transaction || typeof transaction !== 'object') {
      console.warn('Invalid transaction object:', transaction);
      return; // Skip this transaction
    }

    const securityId = transaction.securities_id;

    // Skip if no security ID
    if (!securityId) {
      console.warn('Transaction missing securities_id:', transaction);
      return;
    }

    if (!holdingsBySecurityId[securityId]) {
      holdingsBySecurityId[securityId] = {
        securityId,
        security_name: transaction.security_name || 'Unknown Security',
        symbol: transaction.symbol || 'UNKNOWN',
        type: transaction.security_type || 'unknown',
        quantity: 0,
        totalCost: 0,
        transactions: [],
      };
    }

    const holding = holdingsBySecurityId[securityId];
    const transactionType = (transaction.transaction_type || '').toLowerCase();
    const amount = typeof transaction.amount === 'number' ? transaction.amount : 0;
    const totalPrice = typeof transaction.total_price === 'number' ? transaction.total_price : 0;

    if (transactionType === "buy") {
      holding.quantity += amount;
      holding.totalCost += totalPrice;
    } else if (transactionType === "sell") {
      holding.quantity -= amount;
      // Handle realized gains here if needed
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


async function getSecuritiesData(holdings) {
  // Get current currency rates (using cache)
  const currencyRates = await getOrSetCache(
    'currency-rates',
    async () => await exchangeRateService.getCurrency('DKK'),
    86400 // Cache for 24 hours
  );

  // Return enhanced securities data
  return holdings.reduce((acc, holding) => {
    // Determine currency for this security (could be from DB)
    const stockCurrency = holding.currency || 'DKK';

    acc[holding.securityId] = {
      currentPrice: holding.gak, // Still using GAK as price
      currency: stockCurrency,
      currencyRates: currencyRates.data?.conversion_rates || {}
    };
    return acc;
  }, {});
}

// Simplified function to calculate portfolio metrics without API calls
function calculatePortfolioMetrics(holdings) {
  // Ensure we have holdings and it's an array
  if (!holdings || !Array.isArray(holdings)) {
    console.warn('Invalid holdings data in calculatePortfolioMetrics');
    return {
      holdings: [],
      totalCost: 0,
      totalCurrentValue: 0,
      totalUnrealizedGain: 0,
      totalUnrealizedGainPercent: 0
    };
  }

  // Calculate total cost from holdings
  const totalCost = holdings.reduce((sum, h) => {
    // Ensure totalCost exists and is a number
    const cost = typeof h.totalCost === 'number' ? h.totalCost : 0;
    return sum + cost;
  }, 0);

  // Create enhanced holdings with metrics
  const enhancedHoldings = holdings.map(h => {
    // Ensure all properties exist
    const holding = {
      ...h,
      totalCost: typeof h.totalCost === 'number' ? h.totalCost : 0,
      quantity: typeof h.quantity === 'number' ? h.quantity : 0
    };

    return {
      ...holding,
      currentValue: holding.totalCost, // Value = cost since no live price
      unrealizedGain: 0, // No gain/loss calculation
      unrealizedGainPercent: 0
    };
  });

  return {
    holdings: enhancedHoldings,
    totalCost,
    totalCurrentValue: totalCost,
    totalUnrealizedGain: 0,
    totalUnrealizedGainPercent: 0
  };
}

// Keep your original convertCurrency function in case you need it later
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