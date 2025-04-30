const databaseServices = require("../services/databaseServices");
const exchangeRateService = require("../services/exchangeRateService");
const alphaVantageService = require("../services/alphaVantageService");
const { getOrSetCache } = require("../utilityFunctions/cacheHelper");
const moment = require("moment");

const portfolioController = {
  getPortfolioSummary: async (req, res) => {
    try {
      // Set up key + TTL for the entire summary (whole portfolio)
      const accountId = req.params.accountId;
      const cacheKey = `portfolio-${accountId}`;
      const cacheTTL = 3600; // seconds = 1h

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

          // Second cache, seperate) Pre-cache exchange rates for accountCurrency (daily TTL) to convert currencies
          const ratesCacheKey = `rates-${accountCurrency}`;
          const { data: ratesData } = await getOrSetCache(
            ratesCacheKey,
            () => exchangeRateService.getCurrency(accountCurrency),
            86400
          );
          const rates = ratesData.conversion_rates;

          // 3) For each portfolio, build a fully enriched object
          return Promise.all(
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
          return { qty: h.quantity, series: tsData["Time Series (Daily)"] || {} };
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
