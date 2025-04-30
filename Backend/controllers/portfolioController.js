const databaseServices = require("../services/databaseServices");
const exchangeRateService = require("../services/exchangeRateService");
const alphaVantageService = require("../services/alphaVantageService");
const { getOrSetCache } = require("../utilityFunctions/cacheHelper");
const moment = require("moment");

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

          // Second cache, seperate) Pre-cache exchange rates for accountCurrency (daily TTL)
          const ratesCacheKey = `rates-${accountCurrency}`;
          const { data: ratesData } = await getOrSetCache(
            ratesCacheKey,
            () => exchangeRateService.getCurrency(accountCurrency),
            86400
          );
          const rates = ratesData.conversion_rates;

          // 3) Process each portfolio with promise.all
          return Promise.all(
            portfolios.map(async (p) => {
              // Load transactions from database → holdings
              const txs = await databaseServices.getTransactionsForPortfolio(
                p.id
              );
              const holdings = calculateHoldings(txs);

              // b) For each holding, fetch live price & overview
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
                  const daily = tsData["Time Series (Daily)"] || {};
                  const latestDate = Object.keys(daily)[0];
                  const lastClose = parseFloat(daily[latestDate]["4. close"]);

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
                    // conversion_rates is base DKK → XXX, so invert if XXX→DKK
                    const rate = rates[nativeCurrency];
                    currentValueAccount = currentValueNative / rate;
                  }

                  return {
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
      const portfolios = await databaseServices.getPortfoliosByAccount(
        accountId
      );
      if (!portfolios.length) return res.json([]);

      const allHoldings = (
        await Promise.all(
          portfolios.map(async (p) => {
            const txs = await databaseServices.getTransactionsForPortfolio(
              p.id
            );
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
      const start = moment().subtract(180, "days"),
        end = moment();
      const dailyValues = {};

      for (let m = start.clone(); m.isSameOrBefore(end); m.add(1, "day")) {
        const d = m.format("YYYY-MM-DD");
        dailyValues[d] = seriesData.reduce((sum, { qty, series }) => {
          const day = series[d];
          return sum + (day ? parseFloat(day["4. close"]) * qty : 0);
        }, 0);
      }

      // 4) serialize and send
      const history = Object.entries(dailyValues).map(([date, value]) => ({
        date,
        value,
      }));
      res.json(history);
    } catch (err) {
      console.error("Error in getPortfolioHistory", err);
      res.status(500).json({ error: "Failed to fetch portfolio history" });
    }
  },
<<<<<<< HEAD

  getSimplePortfolios: async (req, res) => {
    try {
      const accountId = req.params.accountId;
      const portfolios = await databaseServices.getPortfoliosByAccount(accountId);
  
      if (!portfolios || portfolios.length === 0) {
        return res.status(404).json([]);
      }
  
      // Only return id and name
      const simplePortfolios = portfolios.map((p) => ({
        id: p.id,
        name: p.name
      }));
  
      res.json(simplePortfolios);
    } catch (err) {
      console.error('Error fetching simple portfolios', err);
      res.status(500).json({ error: 'Failed to fetch simple portfolios' });
    }
  },

  getStockQuantityInPortfolio: async (req, res) => {
    try {
      const { portfolioId, symbol } = req.params;
  
      if (!portfolioId || !symbol) {
        return res.status(400).json({ error: "Missing portfolioId or symbol" });
      }
  
      const transactions = await databaseServices.getTransactionsForPortfolio(portfolioId);
  
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
      console.error('Error fetching stock quantity', error);
      res.status(500).json({ error: 'Failed to fetch stock quantity' });
    }
  },  
=======
>>>>>>> 5166867 (adjusting p controller)
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
