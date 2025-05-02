import { stockAPI } from "./stockScripts/api.js";
import { popUps } from "./utilityFunctions/popup.js";
import { portfolioChartService } from "./utilityFunctions/portfolioChartService.js";
import { profitLoss } from "./utilityFunctions/profitLoss.js";
// import { loadTransactions } from "./utilityFunctions/loadTransactions.js";
// import { loadAccounts } from "./utilityFunctions/loadAccounts.js";
// import { currencyHandler } from "./utilityFunctions/currencyConverter.js";

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

  profitLoss.realizedPL();

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

    // 5) Flatten all holdings across all portfolios, pulling both native & account values
    const allHoldings = portfolios.flatMap(p =>
      p.metrics.holdings.map(h => ({
        symbol: h.symbol,
        currentValueNative:   h.currentValueNative,
        nativeCurrency:       h.nativeCurrency,
        unrealizedGainPercent: h.unrealizedGainPercent
      }))
    );

    // 6) Compute Top 5 by native value
    const topByValue = allHoldings
      .sort((a, b) => b.currentValueNative - a.currentValueNative)
      .slice(0, 5);

    // 7) Compute Top 5 by unrealized gain %
    const topByGain = allHoldings
      .sort((a, b) => b.unrealizedGainPercent - a.unrealizedGainPercent)
      .slice(0, 5);

    // 8 Render Top 5 native values
    const ulValue = document.getElementById("top-value-list");
    if (ulValue) {
      ulValue.innerHTML = topByValue.map(h => `
        <li>
          <span class="symbol">${h.symbol}</span>
          <span class="val">${formatCurrency(h.currentValueNative, h.nativeCurrency)}</span>
        </li>
      `).join("");
    }

    // 9) Render Top 5 unrealized gain %
    const ulGain = document.getElementById("top-gain-list");
    if (ulGain) {
      ulGain.innerHTML = topByGain.map(h => {
        const sign = h.unrealizedGainPercent >= 0 ? "+" : "-";
        const pct  = Math.abs(h.unrealizedGainPercent).toFixed(2) + "%";
        const cls  = h.unrealizedGainPercent >= 0 ? "positive-change" : "negative-change";
        return `
          <li>
            <span class="symbol">${h.symbol}</span>
            <span class="val ${cls}">${sign}${pct}</span>
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

    // Display total realized by all portfolios
    const totalRealizedPara = document.querySelector('.overview-realized-value')
    totalRealizedPara.textContent = null;
  } catch (err) {
    console.error("Dashboard setup failed:", err);
  }
});