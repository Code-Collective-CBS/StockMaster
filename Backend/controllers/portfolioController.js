const databaseServices = require("../services/databaseServices");
const exchangeRateService = require("../services/exchangeRateService");
const alphaVantageService = require("../services/alphaVantageService");
const { getOrSetCache } = require("../utilityFunctions/cacheHelper");
const moment = require("moment");
const cache = require('../utilityFunctions/cache');

const portfolioController = {
  getPortfolioSummary: async (req, res) => {
    try {
      
      // Set up key + TTL for the entire summary (whole portfolio)
      const accountId = req.params.accountId;

        // First, get the current account info to check currency - without caching this part
        const accountInfo = await databaseServices.getAccountBasicInfo(accountId);
        if (!accountInfo) {
          return res.status(404).json({ error: "Account not found" });
        }

        // Include the currency in the cache key
        const cacheKey = `portfolio-${accountId}-${accountInfo.currency}`;
        const cacheTTL = 3600; // seconds = 1h


      // This callback runs if cache is empty or expired.
      const { data: portfolioData, source } = await getOrSetCache(
        cacheKey,
        async () => {
          // If data doesn't exist or is expired, executes the callback function to fetch fresh data
          // 1) Fetch portfolios and basic info
          const portfolios = await databaseServices.getPortfoliosByAccount(
            accountId
          );
          if (!portfolios || portfolios.length === 0) return [];

          const accountCurrency = portfolios[0].currency;
          const accountName = portfolios[0].account_name;

          // (2) Pre-cache exchange rates for accountCurrency (daily TTL) to convert currencies
          const ratesCacheKey = `rates-${accountCurrency}`;
          const { data: ratesData } = await getOrSetCache(
            ratesCacheKey,
            () => exchangeRateService.getCurrency(accountCurrency),
            86400 // 24h
          );
          const rates = ratesData.conversion_rates;

          // 3) For each portfolio, build a fully enriched object
          return Promise.all(
            // Promise.all is typically used when there are multiple related asynchronous tasks that the overall code relies on to work successfully — all of whom we want to fulfill before the code execution continues.
            portfolios.map(async (p) => {
              // Load transactions from database - holdings
              const txs = await databaseServices.getTransactionsForPortfolio(
                p.id
              );
              const holdings = calculateHoldings(txs); // handles buys/sells

              // b) For each holding, fetch live price & currency info
              const enhancedHoldings = await Promise.all(
                holdings.map(async (h) => {
                  const { symbol, quantity: qty, totalCost: cost, gak } = h;

                  // Third cache — Fetch last close (compact = last 100 days, cached 1h)
                  const tsKey = `timeSeries-${symbol}`;
                  const { data: tsData } = await getOrSetCache(
                    tsKey,
                    () =>
                      alphaVantageService.getDailyTimeSeries(symbol, "compact"),
                    3600
                  );

                  const dailySeries = tsData["Time Series (Daily)"];
                  let lastClose = gak; // fallback

                  if (dailySeries && Object.keys(dailySeries).length) {
                    const latestDate = Object.keys(dailySeries)[0];
                    lastClose = parseFloat(dailySeries[latestDate]["4. close"]);
                  } else {
                    console.warn(`No Time Series for ${symbol}`, tsData);
                  }

                  // Fourth cache — Fetch company overview (cached 1h)
                  const ovKey = `overview-${symbol}`;
                  const { data: ovData } = await getOrSetCache(
                    ovKey,
                    () => alphaVantageService.getCompanyOverview(symbol),
                    3600
                  );
                  const nativeCurrency = ovData["Currency"] || accountCurrency;

                  // — Compute native & account values
                  const currentValueNative = lastClose * qty;
                  let currentValueAccount = currentValueNative;
                  if (nativeCurrency !== accountCurrency) {
                    const rate = rates[nativeCurrency];
                    currentValueAccount = currentValueNative / rate;
                  }

                  // Calculate unrealized gain and gain percent for this holding
                  let costInAccountCurrency = cost;
                  if (nativeCurrency !== accountCurrency) {
                    const rate = rates[nativeCurrency];
                    costInAccountCurrency = cost / rate;
                  }

                  const unrealizedGain =
                    currentValueAccount - costInAccountCurrency;
                  const unrealizedGainPercent =
                    costInAccountCurrency > 0
                      ? (unrealizedGain / costInAccountCurrency) * 100
                      : 0;

                  return {
                    // object containing detailed information of each holding (enhancedHolding)
                    securityId: h.securityId,
                    symbol,
                    security_name: h.security_name,
                    quantity: qty,
                    totalCost: cost,
                    gak, // use the helper’s functions GAK
                    boughtPriceNative: gak,
                    currentPriceNative: lastClose,
                    nativeCurrency,
                    currentValueNative,
                    currentValueAccount,
                    unrealizedGain, // holding
                    unrealizedGainPercent, // holding
                  };
                })
              );

              // c) Aggregate portfolio metrics in account currency
              const totalCostAccount = enhancedHoldings.reduce((sum, h) => {
                if (h.nativeCurrency === accountCurrency) {
                  return sum + h.totalCost;
                }
                return sum + h.totalCost / rates[h.nativeCurrency];
              }, 0);

              const totalCurrentAccount = enhancedHoldings.reduce(
                (sum, h) => sum + h.currentValueAccount,
                0
              );

              const totalUnrealizedGain =
                totalCurrentAccount - totalCostAccount;
              const totalUnrealizedGainPercent =
                totalCostAccount > 0
                  ? (totalUnrealizedGain / totalCostAccount) * 100
                  : 0;

              const metrics = {
                holdings: enhancedHoldings,
                totalCost: totalCostAccount,
                totalCurrentValue: totalCurrentAccount,
                totalUnrealizedGain,
                totalUnrealizedGainPercent,
              };

              return {
                id: p.id,
                name: p.name,
                account_id: p.account_id,
                create_date: p.create_date,
                account_name: accountName,
                currency: accountCurrency,
                metrics,
              };
            })
          );
        },
        cacheTTL
      );

      // Return JSON
      res.json(portfolioData);
    } catch (err) {
      console.error("Error in getPortfolioSummary", err);
      res.status(500).json({ error: "Failed to fetch portfolio data" });
    }
  },

  getPortfolioHistory: async (req, res) => {
    try {
      const accountId = req.params.accountId;
      const cacheKey = `portfolio-history-${accountId}`;
      const cacheTTL = 3600; // 1 hour cache

      // Use cache to avoid repeated calculation
      const { data: historyData } = await getOrSetCache(
        cacheKey,
        async () => {
          // 1) Get all portfolios for this account
          const portfolios = await databaseServices.getPortfoliosByAccount(
            accountId
          );
          if (!portfolios.length) return [];

          const accountCurrency = portfolios[0].currency || "DKK";

          // 2) Get all transactions across all portfolios in this account
          const allTransactions = [];
          for (const portfolio of portfolios) {
            const txs = await databaseServices.getTransactionsForPortfolio(
              portfolio.id
            );
            allTransactions.push(...txs);
          }

          // 3) Calculate daily portfolio state (what stocks were held on each day)
          // This is better than just using current holdings, as it accounts for changes over time
          const historyByDate =
            calculatePortfolioHistoryByDate(allTransactions);

          // 4) Get exchange rates for currency conversion
          const { data: ratesData } = await getOrSetCache(
            `rates-${accountCurrency}`,
            () => exchangeRateService.getCurrency(accountCurrency),
            86400 // 1 day cache for exchange rates
          );
          const rates = ratesData.conversion_rates;

          // 5) For each unique security in the portfolio history, get its price history
          const securities = new Set();
          Object.values(historyByDate).forEach((holdings) =>
            holdings.forEach((h) => securities.add(h.symbol))
          );

          const priceHistories = {};
          await Promise.all(
            Array.from(securities).map(async (symbol) => {
              try {
                const { data: tsData } = await getOrSetCache(
                  `timeSeries-${symbol}`,
                  () =>
                    alphaVantageService.getDailyTimeSeries(symbol, "compact"),
                  3600 // 1 hour cache
                );

                const { data: ovData } = await getOrSetCache(
                  `overview-${symbol}`,
                  () => alphaVantageService.getCompanyOverview(symbol),
                  86400 // 1 day cache
                );

                const currency = ovData?.Currency || accountCurrency;
                priceHistories[symbol] = {
                  series: tsData["Time Series (Daily)"] || {},
                  currency,
                };
              } catch (error) {
                console.warn(
                  `Failed to get price data for ${symbol}:`,
                  error.message
                );
                priceHistories[symbol] = {
                  series: {},
                  currency: accountCurrency,
                };
              }
            })
          );

          // 6) Calculate portfolio value for each day (business days only)
          const startDate = moment().subtract(180, "days");
          const endDate = moment();
          const dailyValues = [];

          // Only use business days (Mon-Fri)
          for (
            let day = startDate.clone();
            day.isSameOrBefore(endDate);
            day.add(1, "day")
          ) {
            // Skip weekends - no market data
            if (day.day() === 0 || day.day() === 6) continue;

            const dateStr = day.format("YYYY-MM-DD");
            const holdings = historyByDate[dateStr] || [];

            // If we have no holdings for this date, use the most recent previous date's holdings
            let effectiveHoldings = holdings;
            if (holdings.length === 0) {
              let prevDate = day.clone().subtract(1, "day");
              while (prevDate.isSameOrAfter(startDate)) {
                const prevDateStr = prevDate.format("YYYY-MM-DD");
                if (
                  historyByDate[prevDateStr] &&
                  historyByDate[prevDateStr].length > 0
                ) {
                  effectiveHoldings = historyByDate[prevDateStr];
                  break;
                }
                prevDate.subtract(1, "day");
              }
            }

            // Calculate total value for this day
            let totalValue = 0;
            for (const holding of effectiveHoldings) {
              const { symbol, quantity } = holding;
              const priceData = priceHistories[symbol];
              if (!priceData) continue;

              const { series, currency } = priceData;
              // Find the closest previous date with price data
              let price = null;
              let checkDate = day.clone();
              while (checkDate.isSameOrAfter(startDate) && price === null) {
                const checkDateStr = checkDate.format("YYYY-MM-DD");
                if (series[checkDateStr]) {
                  price = parseFloat(series[checkDateStr]["4. close"]);
                  break;
                }
                checkDate.subtract(1, "day");
              }

              // If no price found, skip this holding
              if (price === null) continue;

              // Convert to account currency if needed
              let valueInAccountCurrency = price * quantity;
              if (currency !== accountCurrency) {
                const rate = rates[currency];
                if (rate) {
                  valueInAccountCurrency = valueInAccountCurrency / rate;
                }
              }

              totalValue += valueInAccountCurrency;
            }

            // Only add days with values
            if (totalValue > 0) {
              dailyValues.push({
                date: dateStr,
                value: totalValue,
              });
            }
          }

          // If we still have days with zero value, apply linear interpolation to fix
          const result = interpolateMissingDays(dailyValues);

          // Sort by date ascending
          result.sort((a, b) => new Date(a.date) - new Date(b.date));

          return result;
        },
        cacheTTL
      );

      res.json(historyData);
    } catch (err) {
      console.error("Error in getPortfolioHistory", err);
      res.status(500).json({ error: "Failed to fetch portfolio history" });
    }
  },

  getSimplePortfolios: async (req, res) => {
    try {
      const accountId = req.params.accountId;
      const portfolios = await databaseServices.getPortfoliosByAccount(
        accountId
      );

      if (!portfolios || portfolios.length === 0) {
        return res.status(404).json([]);
      }

      // Only return id and name
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

  getStockQuantityInPortfolio: async (req, res) => {
    try {
      const { portfolioId, symbol } = req.params;

      if (!portfolioId || !symbol) {
        return res.status(400).json({ error: "Missing portfolioId or symbol" });
      }

      const transactions = await databaseServices.getTransactionsForPortfolio(
        portfolioId
      );

      if (!transactions || transactions.length === 0) {
        return res.json({ quantity: 0 });
      }

      // Find the total quantity for the requested stock
      let quantity = 0;
      transactions.forEach((tx) => {
        if (tx.symbol === symbol) {
          const type = tx.transaction_type.toLowerCase();
          if (type === "buy") {
            quantity += tx.amount;
          } else if (type === "sell") {
            quantity -= tx.amount;
          }
        }
      });

      if (quantity < 0) quantity = 0; // Safety: no negative quantity

      res.json({ quantity });
    } catch (error) {
      console.error("Error fetching stock quantity", error);
      res.status(500).json({ error: "Failed to fetch stock quantity" });
    }
  },
};

module.exports = portfolioController;

// Helper function to calculate holdings from transactions
// controllers/portfolioHelpers.js (or wherever you keep it)
function calculateHoldings(transactions) {
  if (!Array.isArray(transactions) || transactions.length === 0) {
    console.warn("No valid transactions data");
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
          value: interpolatedValue,
        });
      }
    }
  }

  // Re-sort after adding interpolated values
  result.sort((a, b) => new Date(a.date) - new Date(b.date));
  return result;
}
