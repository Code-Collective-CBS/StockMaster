const databaseServices = require("../services/databaseServices");
const exchangeRateService = require("../services/exchangeRateService");
const alphaVantageService = require("../services/alphaVantageService");
const { getOrSetCache } = require("../utilityFunctions/cacheHelper");
const moment = require('moment');

const portfolioController = {
  getPortfolioSummary: async (req, res) => {
    try {
      const accountId = req.params.accountId;
      console.log(`Getting portfolio summary for account: ${accountId}`);

      const cacheKey = `portfolio-${accountId}`;
      const cacheTTL = 3600; // seconds

      // This callback runs if cache is empty or expired.
      const { data: portfolioData, source } = await getOrSetCache(
        cacheKey,
        async () => {
          // 1) Fetch portfolios and basic info
          const portfolios = await databaseServices.getPortfoliosByAccount(
            accountId
          );
          if (!portfolios || portfolios.length === 0) return [];

          const accountCurrency = portfolios[0].currency;
          const accountName = portfolios[0].account_name;

          // 2) Pre-cache exchange rates for accountCurrency (daily TTL)
          const ratesCacheKey = `rates-${accountCurrency}`;
          const { data: ratesData } = await getOrSetCache(
            ratesCacheKey,
            () => exchangeRateService.getCurrency(accountCurrency),
            86400
          );
          const rates = ratesData.conversion_rates;

          // 3) Process each portfolio
          return Promise.all(
            portfolios.map(async (p) => {
              // a) Load transactions → holdings
              const txs = await databaseServices.getTransactionsForPortfolio(
                p.id
              );
              const holdings = calculateHoldings(txs);

              // b) For each holding, fetch live price & overview
              const enhancedHoldings = await Promise.all(
                holdings.map(async (h) => {
                  const symbol = h.symbol;
                  const qty = h.quantity;
                  const cost = h.totalCost; // in native currency
                  const gak = cost / qty;

                  // — Fetch last close (compact = last 100 days, cached 1h)
                  const tsKey = `timeSeries-${symbol}`;
                  const { data: tsData } = await getOrSetCache(
                    tsKey,
                    () =>
                      alphaVantageService.getDailyTimeSeries(symbol, "compact"),
                    3600
                  );
                  const daily = tsData["Time Series (Daily)"] || {};
                  const latestDate = Object.keys(daily)[0];
                  const lastClose = parseFloat(daily[latestDate]["4. close"]);

                  // — Fetch company overview (cached 1h)
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
                    // conversion_rates is base DKK → XXX, so invert if XXX→DKK
                    const rate = rates[nativeCurrency];
                    currentValueAccount = currentValueNative / rate;
                  }

                  return {
                    securityId: h.securityId, 
                    symbol: symbol,
                    security_name: h.security_name,
                    quantity: qty,
                    totalCost: cost,
                    gak: gak, // bought price in native currency
                    boughtPriceNative: gak,
                    currentPriceNative: lastClose,
                    nativeCurrency,
                    currentValueNative,
                    currentValueAccount,
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
                balance: p.balance,
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
      // 1) load portfolios and turn txs → holdings
      const portfolios = await databaseServices.getPortfoliosByAccount(accountId);
      if (!portfolios.length) return res.json([]);

      const allHoldings = (
        await Promise.all(
          portfolios.map(async (p) => {
            const txs = await databaseServices.getTransactionsForPortfolio(p.id);
            return calculateHoldings(txs);
          })
        )
      ).flat();

      // 2) fetch each symbol’s time series (1h cache)
      const seriesData = await Promise.all(
        allHoldings.map(async (h) => {
          const { data: tsData } = await getOrSetCache(
            `timeSeries-${h.symbol}`,
            () => alphaVantageService.getDailyTimeSeries(h.symbol, "compact"),
            3600
          );
          return { qty: h.quantity, series: tsData["Time Series (Daily)"] };
        })
      );

      // 3) build date→value for the last 180 days
      const start = moment().subtract(180, "days"), end = moment();
      const dailyValues = {};

      for (let m = start.clone(); m.isSameOrBefore(end); m.add(1, "day")) {
        const d = m.format("YYYY-MM-DD");
        dailyValues[d] = seriesData.reduce((sum, {qty, series}) => {
          const day = series[d];
          return sum + (day ? parseFloat(day["4. close"]) * qty : 0);
        }, 0);
      }

      // 4) serialize and send
      const history = Object.entries(dailyValues).map(([date, value]) => ({ date, value }));
      res.json(history);

    } catch (err) {
      console.error("Error in getPortfolioHistory", err);
      res.status(500).json({ error: "Failed to fetch portfolio history" });
    }
  }
};

module.exports = portfolioController;

// Helper function to calculate holdings from transactions
function calculateHoldings(transactions) {
  // Check if transactions is valid
  if (
    !transactions ||
    !Array.isArray(transactions) ||
    transactions.length === 0
  ) {
    console.warn("No valid transactions data");
    return [];
  }

  const holdingsBySecurityId = {};

  transactions.forEach((transaction) => {
    // Validate transaction object
    if (!transaction || typeof transaction !== "object") {
      console.warn("Invalid transaction object:", transaction);
      return; // Skip this transaction
    }

    const securityId = transaction.securities_id;

    // Skip if no security ID
    if (!securityId) {
      console.warn("Transaction missing securities_id:", transaction);
      return;
    }

    if (!holdingsBySecurityId[securityId]) {
      holdingsBySecurityId[securityId] = {
        securityId,
        security_name: transaction.security_name || "Unknown Security",
        symbol: transaction.symbol || "UNKNOWN",
        type: transaction.security_type || "unknown",
        quantity: 0,
        totalCost: 0,
        transactions: [],
      };
    }

    const holding = holdingsBySecurityId[securityId];
    const transactionType = (transaction.transaction_type || "").toLowerCase();
    const amount =
      typeof transaction.amount === "number" ? transaction.amount : 0;
    const totalPrice =
      typeof transaction.total_price === "number" ? transaction.total_price : 0;

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

// async function getSecuritiesData(holdings) {
//   // Get current currency rates (using cache)
//   const currencyRates = await getOrSetCache(
//     'currency-rates',
//     async () => await exchangeRateService.getCurrency('DKK'),
//     86400 // Cache for 24 hours
//   );

//   // Return enhanced securities data
//   return holdings.reduce((acc, holding) => {
//     // Determine currency for this security (could be from DB)
//     const stockCurrency = holding.currency || 'DKK';

//     acc[holding.securityId] = {
//       currentPrice: holding.gak, // Still using GAK as price
//       currency: stockCurrency,
//       currencyRates: currencyRates.data?.conversion_rates || {}
//     };
//     return acc;
//   }, {});
// }

// // Simplified function to calculate portfolio metrics without API calls
// function calculatePortfolioMetrics(holdings) {
//   // Ensure we have holdings and it's an array
//   if (!holdings || !Array.isArray(holdings)) {
//     console.warn('Invalid holdings data in calculatePortfolioMetrics');
//     return {
//       holdings: [],
//       totalCost: 0,
//       totalCurrentValue: 0,
//       totalUnrealizedGain: 0,
//       totalUnrealizedGainPercent: 0
//     };
//   }

//   // Calculate total cost from holdings
//   const totalCost = holdings.reduce((sum, h) => {
//     // Ensure totalCost exists and is a number
//     const cost = typeof h.totalCost === 'number' ? h.totalCost : 0;
//     return sum + cost;
//   }, 0);

//   // Create enhanced holdings with metrics
//   const enhancedHoldings = holdings.map(h => {
//     // Ensure all properties exist
//     const holding = {
//       ...h,
//       totalCost: typeof h.totalCost === 'number' ? h.totalCost : 0,
//       quantity: typeof h.quantity === 'number' ? h.quantity : 0
//     };

//     return {
//       ...holding,
//       currentValue: holding.totalCost, // Value = cost since no live price
//       unrealizedGain: 0, // No gain/loss calculation
//       unrealizedGainPercent: 0
//     };
//   });

//   return {
//     holdings: enhancedHoldings,
//     totalCost,
//     totalCurrentValue: totalCost,
//     totalUnrealizedGain: 0,
//     totalUnrealizedGainPercent: 0
//   };
// }

// // Keep your original convertCurrency function in case you need it later
// function convertCurrency(amount, fromCurrency, toCurrency, ratesData) {
//     // If currencies are the same, no conversion needed
//     if (fromCurrency === toCurrency) return amount;

//     // Check if we have valid rates data
//     if (!ratesData || !ratesData.base_code || !ratesData.conversion_rates) {
//         console.error("Invalid rates data format");
//         return amount; // Return original amount as fallback
//     }

//     const baseCurrency = ratesData.base_code;
//     const conversionRates = ratesData.conversion_rates;

//     // Check if we have rates for both currencies
//     if (!conversionRates[fromCurrency] || !conversionRates[toCurrency]) {
//         console.error(`Missing conversion rate for ${fromCurrency} or ${toCurrency}`);
//         return amount; // Return unconverted amount as fallback
//     }

//     // First convert to the base currency of the rates
//     let amountInBaseCurrency;
//     if (fromCurrency === baseCurrency) {
//         amountInBaseCurrency = amount;
//     } else {
//         amountInBaseCurrency = amount / conversionRates[fromCurrency];
//     }

//     // Then convert from base currency to target currency
//     let amountInTargetCurrency;
//     if (toCurrency === baseCurrency) {
//         amountInTargetCurrency = amountInBaseCurrency;
//     } else {
//         amountInTargetCurrency = amountInBaseCurrency * conversionRates[toCurrency];
//     }

//     return amountInTargetCurrency;
// }
