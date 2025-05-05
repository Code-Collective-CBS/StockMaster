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
      const portfolios = await databaseServices.getPortfoliosByAccount(
        accountId
      );

      if (!portfolios || portfolios.length === 0) {
        return res.status(404).json([]);
      }

      // Return just the ID and name of each portfolio
      const simplePortfolios = portfolios.map((p) => ({
        id: p.id,
        name: p.name,
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
      const transactions = await databaseServices.getTransactionsForPortfolio(
        portfolioId
      );

      if (!transactions || transactions.length === 0) {
        return res.json({ quantity: 0 });
      }

      // Calculate total quantity by adding buys and subtracting sells
      let quantity = 0;
      transactions.forEach((tx) => {
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
  },
  getPortfolioHistoryForPortfolio: async (req, res) => {
    const portfolioId = parseInt(req.params.portfolioId);
    const userId = req.session.user_id;
  
    if (!userId || !portfolioId) {
      return res.status(400).json({ message: 'Missing user or portfolio ID' });
    }
  
    try {
      const transactions = await databaseServices.getTransactionsForPortfolio(portfolioId); // All transactions for specific portfolio
  
      // Aggregate value over time
      const historyMap = new Map();
      
      // for each transaction we figure out if it's a buy or sell
      let cumulativeValue = 0;
      for (const tx of transactions.reverse()) { // Go oldest to newest because of DESC from DB
        const dateKey = moment(tx.transaction_date).format("YYYY-MM-DD"); // "YYYY-MM-DD"
  
        const value = tx.amount * tx.price_per_share * (tx.transaction_type.toLowerCase() === 'buy' ? 1 : -1); // if it's a buy we add the value to the portfolio (sell = -1 and buy = +1)
        cumulativeValue += value;
  
        historyMap.set(dateKey, cumulativeValue);
      }
  
      // Convert Map to array
      const historyArray = Array.from(historyMap.entries()).map(([date, value]) => ({
        date,
        value
      }));
  
      res.status(200).json(historyArray);
    } catch (err) {
      console.error('Failed to calculate portfolio history from transactions', err);
      res.status(500).json({ message: 'Server error while calculating portfolio history' });
    }
  },  
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
    const transactions = await databaseServices.getTransactionsForPortfolio(
      portfolio.id
    );
    const holdings = calculateHoldings(transactions);

    // Process each holding to get current prices and values
    const enhancedHoldings = [];
    let totalCostAccount = 0;
    let totalCurrentAccount = 0;

    let totalRealizedGainAccount = 0;

    for (const holding of holdings) {
      const nativeCurrency = holding.nativeCurrency;

      // Always accumulate realized gain
      let realizedAccount = holding.realizedGain || 0;

      if (holding.nativeCurrency !== accountCurrency) {
        realizedAccount = realizedAccount / rates[holding.nativeCurrency];
      }
      totalRealizedGainAccount += realizedAccount;

      // Skip if no quantity left (fully sold) - in const of we jump to the next iteration
      if (holding.quantity === 0) continue;

      // Get current price data
      const priceData = await getStockPriceData(holding.symbol);

      // Get stock details
      const currentPrice = priceData.lastClose;

      // Calculate values
      const currentValueNative = currentPrice * holding.quantity;
      let currentValueAccount = currentValueNative;

      // Convert cost to account currency
      if (nativeCurrency !== accountCurrency) {
        currentValueAccount = currentValueNative / rates[nativeCurrency];
      }

      // Convert cost to account currency
      let costInAccountCurrency = holding.totalCostNative || 0;
      if (nativeCurrency !== accountCurrency) {
        costInAccountCurrency = holding.totalCostNative / rates[nativeCurrency];
      }

      // Calculate unrealized gain/loss
      const unrealizedGain = currentValueAccount - costInAccountCurrency;
      const unrealizedGainPercent =
        costInAccountCurrency && costInAccountCurrency > 0
          ? (unrealizedGain / costInAccountCurrency) * 100
          : null;

      // Add to totals
      totalCostAccount += costInAccountCurrency;
      totalCurrentAccount += currentValueAccount;

      // Add enhanced holding
      enhancedHoldings.push({
        securityId: holding.securityId,
        symbol: holding.symbol,
        security_name: holding.security_name,
        quantity: holding.quantity,
        totalCostNative: holding.totalCostNative,
        gak: holding.gak,
        avgCostAccount: holding.gak / rates[nativeCurrency],       // keep your existing account-currency avg
        avgCostNative: holding.gak,                    // the true native-currency avg we just computed
        lastBoughtPricePerShare: holding.lastPrice, // This is actually the price per share from most recent buy
        currentPriceNative: currentPrice,
        nativeCurrency,
        currentValueNative,
        currentValueAccount,
        unrealizedGain,
        unrealizedGainPercent,
        realizedGain: holding.realizedGain,
        realizedGainAccount: realizedAccount,
      });
    }

    // Calculate portfolio totals
    const totalUnrealizedGain = totalCurrentAccount - totalCostAccount;
    const totalUnrealizedGainPercent =
      totalCostAccount > 0 ? (totalUnrealizedGain / totalCostAccount) * 100 : 0;

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
        totalCostNative: totalCostAccount,
        totalCurrentValue: totalCurrentAccount,
        totalUnrealizedGain,
        totalUnrealizedGainPercent,
        totalRealizedGain: totalRealizedGainAccount,
      },
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

// Calculate portfolio history
async function calculatePortfolioHistory(accountId) {
  // 1. Get all portfolios for this account
  const portfolios = await databaseServices.getPortfoliosByAccount(accountId);
  if (!portfolios.length) return [];

  const accountCurrency = portfolios[0].currency;

  // 2. Get all transactions across all portfolios
  const allTransactions = [];
  for (const portfolio of portfolios) {
    const txs = await databaseServices.getTransactionsForPortfolio(
      portfolio.id
    );
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
  Object.values(historyByDate).forEach((holdings) =>
    holdings.forEach((h) => securities.add(h.symbol))
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
        currency,
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
  for (
    let day = startDate.clone();
    day.isSameOrBefore(endDate);
    day.add(1, "day")
  ) {
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
        value: totalValue,
      });
    }
  }

  // 7. Fill in any gaps in the data
  const result = dailyValues;

  // 8. Sort by date
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

// This function takes all transactions and groups them by each stock (securities_id)
// Then it calculates the holding for each stock using calculateSingleHolding
function calculateHoldings(transactions) {
  // If there are no transactions, return an empty list
  if (!Array.isArray(transactions) || transactions.length === 0) {
    return [];
  }

  const transactionsBySecurity = {};
  transactions.forEach((tx) => {
    const id = tx.securities_id;
    if (!transactionsBySecurity[id]) {
      transactionsBySecurity[id] = [];
    }
    transactionsBySecurity[id].push(tx);
  });

  // Calculate holding details for each stock
  return Object.values(transactionsBySecurity).map(calculateSingleHolding);
}

// This function calculates the result for one specific stock
// It returns quantity, cost, average price, gain etc.
function calculateSingleHolding(transactions) {
  let quantity = 0; // How many shares we currently have
  let totalBuyQty = 0; // Total shares bought
  let totalBuyValue = 0; // Total amount spent on buys
  let realizedGain = 0; // Total gain/loss from sold shares
  let lastBuyPrice = 0; // Price of the last time we bought this stock

  // Get shared info from the first transaction (symbol, currency, etc.)
  const txObject = transactions[0];
  const { securities_id, symbol, security_name, nativeCurrency } = txObject;

  // Loop through all transactions, starting with the most recent - result from database is DESC
  transactions.reverse().forEach((tx) => {
    const qty = Number(tx.amount) || 0;
    const price = Number(tx.price_per_share) || 0;
    const total = qty * price;

    if (tx.transaction_type === "buy") {
      // For buys, add to our holding
      quantity += qty;
      totalBuyQty += qty;
      totalBuyValue += total;
      lastBuyPrice = price; // Remember the last buy price
    } else if (tx.transaction_type === "sell") {
      // For sells, calculate how much we gained/lost
      const avgCost = totalBuyQty > 0 ? totalBuyValue / totalBuyQty : 0;
      const costBasis = avgCost * qty;
      const saleValue = price * qty;
      realizedGain += saleValue - costBasis;
      quantity -= qty;

      // If we sold everything, reset the cost tracking for GAK
      if (quantity === 0) {
        totalBuyQty = 0;
        totalBuyValue = 0;
      }
    }
  });

  // After all transactions, calculate average cost and total cost
  const avgCost = totalBuyQty > 0 ? totalBuyValue / totalBuyQty : 0;
  const totalCostNative = avgCost * quantity;

  // Return an object with all holding info for this stock
  return {
    securityId: securities_id,
    symbol,
    security_name,
    nativeCurrency,
    quantity,
    totalCostNative,
    gak: isNaN(avgCost) ? 0 : avgCost, // GAK = average purchase price
    lastPrice: lastBuyPrice,
    realizedGain,
  };
}

module.exports = portfolioController;