import { stockAPI } from "./stockScripts/api.js";
import { popUps } from "./utilityFunctions/popup.js";
import { portfolioChartService } from "./utilityFunctions/portfolioChartService.js";
import { loadTransactions } from "./utilityFunctions/loadTransactions.js";
import { loadAccounts } from "./utilityFunctions/loadAccounts.js";
import { currencyHandler } from "./utilityFunctions/currencyConverter.js";

// ─── Utility: format a number as "1.234,56 DKK" ───
function formatCurrency(amount, currencyCode = "") {
  return (
    new Intl.NumberFormat("da-DK", {
      style: "decimal",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount) +
    (currencyCode ? ` ${currencyCode}` : "")
  );
}

// New function to create portfolio selector
function createPortfolioSelector(portfolios) {
  const selector = document.getElementById('portfolio-selector');
  if (!selector) return;

  // Clear any existing options
  selector.innerHTML = '';

  // Add options for each portfolio
  portfolios.forEach((portfolio, index) => {
    const option = document.createElement('option');
    option.value = index;
    option.textContent = portfolio.name;
    selector.appendChild(option);
  });

  // Add event listener for selection change
  selector.addEventListener('change', function () {
    const selectedIndex = parseInt(this.value);
    const selectedPortfolio = portfolios[selectedIndex];
    const holdingsCanvas = document.getElementById('holdingsChart');

    // Use the portfolioChartService to create the holdings chart
    portfolioChartService.createHoldingsDistributionChart(holdingsCanvas, selectedPortfolio);
  });

  // Initialize with first portfolio if available
  if (portfolios.length > 0) {
    const holdingsCanvas = document.getElementById('holdingsChart');
    portfolioChartService.createHoldingsDistributionChart(holdingsCanvas, portfolios[0]);
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  // PRESENT IN THE SECURITIES-NEWS.JS MAYBE MOVE IT?
  const topPicksSymbols = [
    {
      symbol: "I:NDX",
      htmlElement: document.getElementById("I:NDX"),
    },
    {
      symbol: "I:CX10GI",
      htmlElement: document.getElementById("I:CX10GI"),
    },
    {
      symbol: "I:CX35PI",
      htmlElement: document.getElementById("I:CX35PI"),
    },
    {
      symbol: "I:CX20GI",
      htmlElement: document.getElementById("I:CX20GI"),
    },
  ];
  // POP UP
  popUps.setupDepositPopup()
  popUps.createPortfolio();

  // Dashboard Realized and Unrealized Profit/Loss variables
  await loadAccounts();
  const selectedAccountId = sessionStorage.getItem("selectedAccountId");
  const accounts = window.cachedAccounts;
  const selectedAccount = accounts.find((acc) => acc.account_id == selectedAccountId) || null;
  const loadedTransactions = await loadTransactions();
  const transactions = loadedTransactions.data;

  // List for unique currencies for the transactions from our accounts
  const currencyList = [];

  // Loops through transactions to identify different currencies
  transactions.forEach(trans => {
    const currency = trans.account_currency;
    if (!currency) return;

    // Variable to check if the currency exists
    let exists = false;

    // Loops through our currencyList to see if we already have the currency
    for (const index in currencyList) {
      if (currencyList[index].currency === currency) {
        exists = true;
        break; // If yes - break
      }
    }
    // If no - add the currency to our list with sum
    if (!exists) {
      currencyList.push({ currency, sum: 0 });
    }
  });

  // Loops through all transactions for the account
  for (let i = 0; i < transactions.length; i++) {
    if (transactions[i].transaction_type === 'buy') {
      // We loop through our currencyList
      for (let j = 0; j < currencyList.length; j++) {
        // If the currency in our currencyList is equal to the currency for the transaction
        if (currencyList[j].currency === transactions[i].account_currency)
          // We add it to our list
          currencyList[j].sum += transactions[i].total_price
      }
    }
  };

  console.log('currencyList for account:', currencyList);

  const accountCurrency = selectedAccount.currency;
  const currencyRates = await stockAPI.getCurrency(accountCurrency);
  console.log('currencyRates: ', currencyRates.conversion_rates)

  let sumOfTransactions = 0;
  for (let i = 0; i < currencyList.length; i++) {
    sumOfTransactions += currencyHandler.convertCurrency(currencyList[i].sum, currencyList[i].currency, accountCurrency, currencyRates)
  }
  console.log('sum of buy transactions', sumOfTransactions)

  const soldCurrencyList = [];

  // Loops through transactions to identify different currencies
  transactions.forEach(trans => {
    const currency = trans.account_currency;
    if (!currency) return;

    // Variable to check if the currency exists
    let exists = false;

    // Loops through our currencyList to see if we already have the currency
    for (const index in soldCurrencyList) {
      if (soldCurrencyList[index].currency === currency) {
        exists = true;
        break; // If yes - break
      }
    }
    // If no - add the currency to our list with sum
    if (!exists) {
      soldCurrencyList.push({ currency, sum: 0 });
    }
  });

  // Loops through all transactions for the account
  for (let i = 0; i < transactions.length; i++) {
    if (transactions[i].transaction_type === 'sell') {
      // We loop through our soldsoldCurrencyList
      for (let j = 0; j < soldCurrencyList.length; j++) {
        // If the currency in our soldCurrencyList is equal to the currency for the transaction
        if (soldCurrencyList[j].currency === transactions[i].account_currency)
          // We add it to our list
          soldCurrencyList[j].sum += transactions[i].total_price
      }
    }
  };

  console.log('soldCurrencyList for account:', soldCurrencyList);

  let sumOfSoldTransactions = 0;
  for (let i = 0; i < soldCurrencyList.length; i++) {
    sumOfSoldTransactions += currencyHandler.convertCurrency(soldCurrencyList[i].sum, soldCurrencyList[i].currency, accountCurrency, currencyRates)
  }
  console.log(sumOfSoldTransactions)

  let realizedPL = sumOfTransactions - sumOfSoldTransactions
  console.log(realizedPL.toFixed(2))

  const newsContainerAuthor = document.getElementById("news-author");
  const newsContainerDescription = document.getElementById("news-description");

  //// TOP PICKS ////
  topPicksSymbols.forEach(async (topPick) => {
    try {
      const response = await stockAPI.getIndicesoverview(topPick.symbol);
      const data = response.data;

      // Safely check for valid data
      if (!data?.results?.length || !data.results[0]?.c) {
        console.warn(`No valid results for ${topPick.symbol}`);
        return; // Skip to next symbol
      }

      const closedPrice = data.results[0].c;

      if (topPick.htmlElement) {
        const marketPriceElement = topPick.htmlElement.querySelector(".market-price");
        marketPriceElement.innerHTML = `${parseFloat(closedPrice.toFixed(1)) || "N/A"}`;
      }
    } catch (error) {
      console.error(`Top pick fetch failed for ${topPick.symbol}:`, error.message);
    }
  });

  //// NEWS ////
  // article_url not working even though following documention on Polygon.io
  const gethNews = async () => {
    try {
      const response = await stockAPI.getNews();
      const data = response.data;

      // Safeguard: make sure we have valid results
      if (!data?.results?.length) {
        console.warn("No news articles received.");
        return;
      }

      // Pick a random article
      const randomIndex = Math.floor(Math.random() * data.results.length);
      const article = data.results[randomIndex];

      // Defensive rendering to avoid crashes if fields are missing
      newsContainerAuthor.innerHTML = article.author ?? "Unknown author";
      newsContainerDescription.innerHTML = `
            ${article.description ?? "No description available"}<br><br>
            <a href="${article.article_url}" target="_blank">Read more here</a>
          `;
    } catch (error) {
      console.error("Error fetching news:", error.message);
    }
  };
  gethNews();


  // PORTFOLIO DISPLAY //
  try {
    const accountId = sessionStorage.getItem("selectedAccountId");
    if (!accountId) throw new Error("No account selected");

    // 1) Fetch portfolio summary
    const portfolios = await stockAPI.getPortfolioSummary(accountId);

    // 2) Draw pie chart of all portfolios
    const canvas = document.getElementById("portfolioChart");

    // Ensure chart responsiveness - destroy any existing chart first
    if (window.portfolioDistributionChart) {
      window.portfolioDistributionChart.destroy();
    }

    // Create and store the chart reference
    window.portfolioDistributionChart = portfolioChartService.createPortfolioPieChart(canvas, portfolios);

    // 3) Create the portfolio selector and initialize holdings chart
    createPortfolioSelector(portfolios);

    // 4) Update Balance card
    const totalBalance = portfolios
      .reduce((sum, p) => sum + p.metrics.totalCurrentValue, 0);
    const currency = portfolios[0]?.currency || "";
    const balanceEl = document.querySelector(".overview-value");
    if (balanceEl) balanceEl.textContent = formatCurrency(totalBalance, currency);

    // 5) Flatten all holdings across all portfolios
    const allHoldings = portfolios.flatMap(p =>
      p.metrics.holdings.map(h => ({
        symbol: h.symbol,
        portfolio: p.name,
        value: h.currentValueAccount,
        gainPct: h.unrealizedGainPercent
      }))
    );

    // 6) Compute Top 5 by value
    const topByValue = [...allHoldings]
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    // 7) Compute Top 5 by unrealized gain %
    const topByGain = [...allHoldings]
      .sort((a, b) => b.gainPct - a.gainPct)
      .slice(0, 5);

    // 8) Render both lists
    function renderList(items, ulId, displayKey, formatter) {
      const ul = document.getElementById(ulId);
      if (!ul) return;

      ul.innerHTML = items.map(item => {
        const value = item[displayKey];
        const formattedValue = (value !== undefined && value !== null)
          ? formatter(value, currency)
          : "N/A";

        // For gain percentages, determine which class to use
        let valueClass = '';
        if (displayKey === 'gainPct') {
          valueClass = value >= 0 ? 'positive-change' : 'negative-change';
        }

        return `
              <li>
                <span class="symbol">${item.symbol || 'Unknown'}</span>
                <span class="val ${valueClass}">${formattedValue}</span>
              </li>
            `;
      }).join("");
    }

    renderList(topByValue, "top-value-list", "value", formatCurrency);
    renderList(topByGain, "top-gain-list", "gainPct", val => {
      // Format with 2 decimal places
      const formatted = Math.abs(val).toFixed(2) + "%";

      // Add a plus sign for positive values (optional)
      return val >= 0 ? "+" + formatted : "-" + formatted;
    });

  } catch (err) {
    console.error("Dashboard setup failed:", err);
  }
});