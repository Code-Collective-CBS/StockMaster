const databaseServices = require("../services/databaseServices");
const exchangeRateService = require("../services/exchangeRateService");
const alphaVantageService = require("../services/alphaVantageService");
const { getOrSetCache } = require("../utilityFunctions/cacheHelper");
const moment = require("moment");

const portfolioController = {
  // Get portfolio summary for an account
  getPortfolioSummary: async (req, res) => {
    try {
      // 1. Get basic account info
      const accountId = req.params.accountId;
      const accountInfo = await databaseServices.getAccountBasicInfo(accountId);

      if (!accountInfo) {
        return res.status(404).json({ error: "Account not found" });
      }

      // 2. Set up cache key with account ID and currency
      const cacheKey = `portfolio-${accountId}-${accountInfo.currency}`;

      // 3. Try to get data from cache, or calculate it if not available
      const { data: portfolioData } = await getOrSetCache(
        cacheKey,
        async () => await calculatePortfolioData(accountId),
        3600 // Cache for 1 hour
      );

      // 4. Return the data
      res.json(portfolioData);
    } catch (err) {
      console.error("Error in getPortfolioSummary", err);
      res.status(500).json({ error: "Failed to fetch portfolio data" });
    }
  },

  // Get historical portfolio values
  getPortfolioHistory: async (req, res) => {
    try {
      const accountId = req.params.accountId;
      const cacheKey = `portfolio-history-${accountId}`;

      // Try to get history from cache, or calculate it
      const { data: historyData } = await getOrSetCache(
        cacheKey,
        async () => await calculatePortfolioHistory(accountId),
        3600 // Cache for 1 hour
      );

      res.json(historyData);
    } catch (err) {
      console.error("Error in getPortfolioHistory", err);
      res.status(500).json({ error: "Failed to fetch portfolio history" });
    }
  },

  // Get simple list of portfolios for an account
  getSimplePortfolios: async (req, res) => {
    try {
      const accountId = req.params.accountId;
      const portfolios = await databaseServices.getPortfoliosByAccount(accountId);

      if (!portfolios || portfolios.length === 0) {
        return res.status(404).json([]);
      }

      // Return just the ID and name of each portfolio
      const simplePortfolios = portfolios.map(p => ({
        id: p.id,
        name: p.name
      }));

      res.json(simplePortfolios);
    } catch (err) {
      console.error("Error fetching simple portfolios", err);
      res.status(500).json({ error: "Failed to fetch simple portfolios" });
    }
  },

  // Get quantity of a specific stock in a portfolio
  getStockQuantityInPortfolio: async (req, res) => {
    try {
      const { portfolioId, symbol } = req.params;

      if (!portfolioId || !symbol) {
        return res.status(400).json({ error: "Missing portfolioId or symbol" });
      }

      // Get all transactions for this portfolio
      const transactions = await databaseServices.getTransactionsForPortfolio(portfolioId);

      if (!transactions || transactions.length === 0) {
        return res.json({ quantity: 0 });
      }

      // Calculate total quantity by adding buys and subtracting sells
      let quantity = 0;
      transactions.forEach(tx => {
        if (tx.symbol === symbol) {
          if (tx.transaction_type.toLowerCase() === "buy") {
            quantity += tx.amount;
          } else if (tx.transaction_type.toLowerCase() === "sell") {
            quantity -= tx.amount;
          }
        }
      });

      // Ensure quantity isn't negative
      if (quantity < 0) quantity = 0;

      res.json({ quantity });
    } catch (error) {
      console.error("Error fetching stock quantity", error);
      res.status(500).json({ error: "Failed to fetch stock quantity" });
    }
  }
};

// HELPER FUNCTIONS FOR CALCULATIONS //

// Calculate all portfolio data for an account
async function calculatePortfolioData(accountId) {
  // 1. Get all portfolios for this account
  const portfolios = await databaseServices.getPortfoliosByAccount(accountId);
  if (!portfolios || portfolios.length === 0) return [];

  // 2. Get account details
  const accountCurrency = portfolios[0].currency;
  const accountName = portfolios[0].account_name;

  // 3. Get exchange rates for currency conversion
  const ratesData = await getOrSetCache(
    `rates-${accountCurrency}`, // ratesCacheKey
    () => exchangeRateService.getCurrency(accountCurrency),
    86400 // Cache for 24 hours
  );
  const rates = ratesData.data.conversion_rates; // conversion rates from API

  // 4. Process each portfolio
  const processedPortfolios = [];

  for (const portfolio of portfolios) {
    // Get transactions and calculate holdings
    const transactions = await databaseServices.getTransactionsForPortfolio(portfolio.id);
    const holdings = calculateHoldings(transactions);

    // Process each holding to get current prices and values
    const enhancedHoldings = [];
    let totalCostAccount = 0;
    let totalCurrentAccount = 0;

    for (const holding of holdings) {
      // Get current price data
      const priceData = await getStockPriceData(holding.symbol);
      const stockInfo = await getStockInfo(holding.symbol);

      // Get stock details
      const currentPrice = priceData.lastClose;
      const nativeCurrency = stockInfo.Currency;

      // Calculate values
      const currentValueNative = currentPrice * holding.quantity;
      let currentValueAccount = currentValueNative;

      // Convert to account currency if needed
      if (nativeCurrency !== accountCurrency) {
        currentValueAccount = currentValueNative / rates[nativeCurrency];
      }

      // Calculate cost in account currency
      let costInAccountCurrency = holding.totalCost;
      if (nativeCurrency !== accountCurrency) {
        costInAccountCurrency = holding.totalCost / rates[nativeCurrency];
      }

      // Calculate gain/loss
      const unrealizedGain = currentValueAccount - costInAccountCurrency;
      const unrealizedGainPercent = costInAccountCurrency > 0
        ? (unrealizedGain / costInAccountCurrency) * 100
        : 0;

      // Add to totals
      totalCostAccount += costInAccountCurrency;
      totalCurrentAccount += currentValueAccount;

      // Add enhanced holding
      enhancedHoldings.push({
        securityId: holding.securityId,
        symbol: holding.symbol,
        security_name: holding.security_name,
        quantity: holding.quantity,
        totalCost: holding.totalCost,
        gak: holding.gak,
        boughtPriceNative: holding.gak,  // This is actually the price per share
        currentPriceNative: currentPrice,
        nativeCurrency,
        currentValueNative,
        currentValueAccount,
        unrealizedGain,
        unrealizedGainPercent
      });
    }

    // Calculate portfolio totals
    const totalUnrealizedGain = totalCurrentAccount - totalCostAccount;
    const totalUnrealizedGainPercent = totalCostAccount > 0
      ? (totalUnrealizedGain / totalCostAccount) * 100
      : 0;

    // Add processed portfolio
    processedPortfolios.push({
      id: portfolio.id,
      name: portfolio.name,
      account_id: portfolio.account_id,
      create_date: portfolio.create_date,
      account_name: accountName,
      currency: accountCurrency,
      metrics: {
        holdings: enhancedHoldings,
        totalCost: totalCostAccount,
        totalCurrentValue: totalCurrentAccount,
        totalUnrealizedGain,
        totalUnrealizedGainPercent
      }
    });
  }

  return processedPortfolios;
}

// Get stock price data with caching
async function getStockPriceData(symbol) {
  const tsData = await getOrSetCache(
    `timeSeries-${symbol}`,
    () => alphaVantageService.getDailyTimeSeries(symbol, "compact"),
    3600
  );

  const dailySeries = tsData.data["Time Series (Daily)"];
  let lastClose = 0;

  if (dailySeries && Object.keys(dailySeries).length) {
    const latestDate = Object.keys(dailySeries)[0];
    lastClose = parseFloat(dailySeries[latestDate]["4. close"]);
  }

  return { lastClose };
}

// Get stock info with caching
async function getStockInfo(symbol) {
  const stockData = await getOrSetCache(
    `overview-${symbol}`,
    () => alphaVantageService.getCompanyOverview(symbol),
    3600
  );

  return stockData.data;
}

// Calculate portfolio history
async function calculatePortfolioHistory(accountId) {
    // 1. Get all portfolios for this account
    const portfolios = await databaseServices.getPortfoliosByAccount(accountId);
    if (!portfolios.length) return [];

    const accountCurrency = portfolios[0].currency;

    // 2. Get all transactions across all portfolios
    const allTransactions = [];
    for (const portfolio of portfolios) {
      const txs = await databaseServices.getTransactionsForPortfolio(portfolio.id);
      allTransactions.push(...txs);
    }

    // 3. Get exchange rates for currency conversion
    const ratesData = await getOrSetCache(
      `rates-${accountCurrency}`,
      () => exchangeRateService.getCurrency(accountCurrency),
      86400 // Cache for 1 day
    );
    const rates = ratesData.data.conversion_rates;

    // 4. Calculate what was held on each day
    const historyByDate = calculatePortfolioHistoryByDate(allTransactions);

    // 5. Get price data for all securities in the portfolio
    const securities = new Set();
    Object.values(historyByDate).forEach(holdings =>
      holdings.forEach(h => securities.add(h.symbol))
    );

    const priceHistories = {};
    for (const symbol of securities) {
      try {
        // Get historical prices
        const tsData = await getOrSetCache(
          `timeSeries-${symbol}`,
          () => alphaVantageService.getDailyTimeSeries(symbol, "compact"),
          3600
        );

        // Get stock info (for currency)
        const stockInfo = await getOrSetCache(
          `overview-${symbol}`,
          () => alphaVantageService.getCompanyOverview(symbol),
          86400
        );

        const currency = stockInfo.data?.Currency || accountCurrency;
        priceHistories[symbol] = {
          series: tsData.data["Time Series (Daily)"] || {},
          currency
        };
      } catch (error) {
        console.warn(`Failed to get price data for ${symbol}`);
        priceHistories[symbol] = { series: {}, currency: accountCurrency };
      }
    }

    // 6. Calculate daily portfolio values (for the last 180 days)
    const startDate = moment().subtract(180, "days");
    const endDate = moment();
    const dailyValues = [];

    // For each business day (Mon-Fri)
    for (let day = startDate.clone(); day.isSameOrBefore(endDate); day.add(1, "day")) {
      // Skip weekends
      if (day.day() === 0 || day.day() === 6) continue;

      const dateStr = day.format("YYYY-MM-DD");

      // Get holdings for this date (or closest previous date)
      let holdings = historyByDate[dateStr] || [];
      if (holdings.length === 0) {
        holdings = findMostRecentHoldings(historyByDate, dateStr, startDate);
      }

      // Calculate total value for this day
      let totalValue = 0;

      for (const holding of holdings) {
        const { symbol, quantity } = holding;
        const priceData = priceHistories[symbol];
        if (!priceData) continue;

        // Find price for this day (or closest previous day)
        const price = findPriceForDate(priceData.series, dateStr);
        if (price === null) continue;

        // Convert to account currency if needed
        let valueInAccountCurrency = price * quantity;
        if (priceData.currency !== accountCurrency) {
          const rate = rates[priceData.currency];
          if (rate) {
            valueInAccountCurrency = valueInAccountCurrency / rate;
          }
        }

        totalValue += valueInAccountCurrency;
      }

      // Add to daily values if we have a value
      if (totalValue > 0) {
        dailyValues.push({
          date: dateStr,
          value: totalValue
        });
      }
    }

    // 7. Fill in any gaps in the data
    const result = interpolateMissingDays(dailyValues);

    // 8. Sort by date
    result.sort((a, b) => new Date(a.date) - new Date(b.date));

    return result;
  }

// Helper function to interpolate missing days
function interpolateMissingDays(dailyValues) {
  if (dailyValues.length < 2) return dailyValues;

  const result = [...dailyValues];
  result.sort((a, b) => new Date(a.date) - new Date(b.date));

  // Iterate through adjacent days to find gaps
  for (let i = 0; i < result.length - 1; i++) {
    const currDate = new Date(result[i].date);
    const nextDate = new Date(result[i + 1].date);

    // Check if there's a gap (more than 1 day difference)
    const daysDiff = Math.floor((nextDate - currDate) / (1000 * 60 * 60 * 24));
    if (daysDiff > 1) {
      // We have missing days, interpolate values
      const startValue = result[i].value;
      const endValue = result[i + 1].value;

      for (let d = 1; d < daysDiff; d++) {
        const interpolatedDate = new Date(currDate);
        interpolatedDate.setDate(currDate.getDate() + d);

        // Skip weekends during interpolation too
        const dayOfWeek = interpolatedDate.getDay();
        if (dayOfWeek === 0 || dayOfWeek === 6) continue;

        // Linear interpolation formula: start + (d/total) * (end - start)
        const ratio = d / daysDiff;
        const interpolatedValue = startValue + ratio * (endValue - startValue);

        // Insert the interpolated day
        const dateStr = moment(interpolatedDate).format("YYYY-MM-DD");
        result.push({
          date: dateStr,
          value: interpolatedValue
        });
      }
    }
  }
  // Re-sort after adding interpolated values
  result.sort((a, b) => new Date(a.date) - new Date(b.date));
  return result;
}


  // Helper function to calculate portfolio state (holdings) for each day
  function calculatePortfolioHistoryByDate(transactions) {
    if (!Array.isArray(transactions) || transactions.length === 0) {
      return {};
    }

    // Sort transactions by date ascending
    transactions.sort(
      (a, b) => new Date(a.transaction_date) - new Date(b.transaction_date)
    );

    const historyByDate = {};
    const portfolio = {}; // Current portfolio state indexed by security_id

    // Process each transaction in chronological order
    transactions.forEach((tx) => {
      const dateStr = moment(tx.transaction_date).format("YYYY-MM-DD");
      const id = tx.securities_id;
      const type = (tx.transaction_type || "").toLowerCase();
      const qty = Number(tx.amount) || 0;

      // Initialize portfolio entry if needed
      if (!portfolio[id]) {
        portfolio[id] = {
          securityId: id,
          security_name: tx.security_name,
          symbol: tx.symbol,
          quantity: 0,
        };
      }

      // Update portfolio based on transaction type
      if (type === "buy") {
        portfolio[id].quantity += qty;
      } else if (type === "sell") {
        portfolio[id].quantity -= qty;
      }

      // Create a snapshot of the portfolio for this date
      historyByDate[dateStr] = Object.values(portfolio)
        .filter((h) => h.quantity > 0) // Only include positions with positive quantity
        .map((h) => ({ ...h })); // Clone the holdings to avoid reference issues
    });

    return historyByDate;
  }

  // Helper to find the most recent holdings before a date
  function findMostRecentHoldings(historyByDate, dateStr, startDate) {
    const date = moment(dateStr);
    let prevDate = date.clone().subtract(1, "day");

    while (prevDate.isSameOrAfter(startDate)) {
      const prevDateStr = prevDate.format("YYYY-MM-DD");
      if (historyByDate[prevDateStr] && historyByDate[prevDateStr].length > 0) {
        return historyByDate[prevDateStr];
      }
      prevDate.subtract(1, "day");
    }

    return [];
  }

  // Helper to find price for a specific date
  function findPriceForDate(priceData, dateStr) {
    // Try exact date first
    if (priceData[dateStr]) {
      return parseFloat(priceData[dateStr]["4. close"]);
    }

    // If not found, look for closest previous date
    const date = moment(dateStr);
    const dates = Object.keys(priceData).sort().reverse(); // Newest first

    for (const d of dates) {
      if (moment(d).isBefore(date)) {
        return parseFloat(priceData[d]["4. close"]);
      }
    }

    return null;
  }

// Calculate holdings from transactions - same as original
function calculateHoldings(transactions) {
  if (!Array.isArray(transactions) || transactions.length === 0) {
    console.log("No transactions data")
    return [];
  }

  const bySecurity = {};

  transactions.forEach((tx) => {
    const id = tx.securities_id;
    const type = (tx.transaction_type || "").toLowerCase();
    const qty = Number(tx.amount) || 0;
    const tot = Number(tx.total_price) || 0;

    if (!bySecurity[id]) {
      bySecurity[id] = {
        securityId: id,
        security_name: tx.security_name,
        symbol: tx.symbol,
        quantity: 0,
        totalCost: 0,
        transactions: [],
      };
    }
    const h = bySecurity[id];

    if (type === "buy") {
      h.quantity += qty;
      h.totalCost += tot;
    } else if (type === "sell") {
      const avgCost = h.quantity > 0 ? h.totalCost / h.quantity : 0;
      h.totalCost -= avgCost * qty; // remove cost basis of sold shares
      h.quantity -= qty;
    }

    h.transactions.push(tx);
  });

  return Object.values(bySecurity)
    .filter((h) => h.quantity > 0)
    .map((h) => ({
      ...h,
      gak: h.totalCost / h.quantity, // true average acquisition cost
    }));
}

module.exports = portfolioController;