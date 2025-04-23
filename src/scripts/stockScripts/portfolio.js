// portfolio.js - Update to fetch real data
import { stockAPI } from "./api.js";
import { favoredStocks } from "../utilityFunctions/favoredStocks.js";
import { portfolioChartService } from "../utilityFunctions/portfolioChartService.js";
import { cachingService } from "../utilityFunctions/cachingService.js";

document.addEventListener("DOMContentLoaded", async () => {
  console.log("Portfolio page loaded!");

  try {
    const accountId = sessionStorage.getItem("selectedAccountId");

    if (!accountId) {
      showErrorMessage("Please select an account first");
      return;
    }

    // Show loading state first
    showLoadingState();

    // Try to get data from cache first
    const cacheKey = `portfolioData-${accountId}`;
    let portfolioData = cachingService.get(cacheKey);

    if (portfolioData) {
      // Update UI with cached data
      updatePortfolioUI(portfolioData);

      // Optionally refresh in background (not necessar4y, but nice to do)
      setTimeout(() => refreshDataInBackground(accountId, cacheKey), 100);
    } else {
      // Not in cache, fetch it
      portfolioData = await fetchPortfolioData(accountId, cacheKey);
      updatePortfolioUI(portfolioData);
    }
  } catch (error) {
    console.error("Error loading portfolio data:", error);
    showErrorMessage("Failed to load portfolio data. Please try again later.");
  }
});

// Separate function to fetch data and update cache
// In portfolio.js
async function fetchPortfolioData(accountId, cacheKey) {
  try {
    const portfolioData = await stockAPI.getPortfolioSummary(accountId);

    // Store in our frontend cache
    cachingService.set(cacheKey, portfolioData);

    return portfolioData;
  } catch (error) {
    console.error("Error fetching portfolio data:", error);

    // Try to fall back to cached data if available
    const cachedData = cachingService.get(cacheKey);
    if (cachedData) {
      console.log("Using cached data due to fetch error");
      return cachedData;
    }

    throw error; // Re-throw if no cached data
  }
}

// Refresh data without blocking the UI
async function refreshDataInBackground(accountId, cacheKey) {
  try {
    const freshData = await fetchPortfolioData(accountId, cacheKey);
    // Only update UI if it's meaningfully different
    if (
      JSON.stringify(freshData) !== JSON.stringify(cachingService.get(cacheKey))
    ) {
      updatePortfolioUI(freshData);
    }
  } catch (error) {
    console.error("Background refresh failed:", error);
    // Don't show errors for background refresh
  }
}

// Show a loading state
function showLoadingState() {
  const portfolioList = document.getElementById("portfolioList");
  if (portfolioList) {
    portfolioList.innerHTML = `
      <div class="loading-state">
        <div class="spinner"></div>
        <p>Loading portfolio data...</p>
      </div>
    `;
  }
}

function updatePortfolioUI(portfolios) {
  const totalValue = document.getElementById("totalValueDisplay");
  const performance7D = document.getElementById("performance7d");
  const performance1M = document.getElementById("performance1m");
  const performance6M = document.getElementById("performance6m");
  const portfolioChartCanvas = document.getElementById(
    "portfolioDistributionChart"
  );
  const portfolioList = document.getElementById("portfolioList");
  const portfolioGrowthChartCanvas = document.getElementById(
    "portfolioGrowthChart"
  );

  // Group by account for display
  const accountsMap = portfolios.reduce((acc, portfolio) => {
    if (!acc[portfolio.account_id]) {
      acc[portfolio.account_id] = {
        account_name: portfolio.account_name,
        currency: portfolio.currency,
        portfolios: [],
      };
    }
    acc[portfolio.account_id].portfolios.push(portfolio);
    return acc;
  }, {});

  // Display accounts and their portfolios
  if (portfolioList) {
    portfolioList.innerHTML = "";
    Object.values(accountsMap).forEach((account) => {
      const accountElement = document.createElement("div");
      accountElement.className = "account-group";
      accountElement.innerHTML = `
        <h3>${account.account_name} (${account.currency})</h3>
        <div class="portfolios-container" id="portfolios-${account.account_id}"></div>
      `;
      portfolioList.appendChild(accountElement);

      const container = document.getElementById(
        `portfolios-${account.account_id}`
      );
      account.portfolios.forEach((portfolio) => {
        const portfolioElement = document.createElement("div");
        portfolioElement.className = "portfolio-item";

        // Change "Value" to "Invested Value"
        portfolioElement.innerHTML = `
              <h4>${portfolio.name}</h4>
              <p>Invested Value: ${formatCurrency(
                portfolio.metrics.totalCost,
                account.currency
              )}</p>
              <p>Shares: ${portfolio.metrics.holdings.reduce(
                (sum, h) => sum + h.quantity,
                0
              )}</p>
              `;

        container.appendChild(portfolioElement);
      });
    });
  }

  // Calculate and display totals
  const totalPortfolioValue = portfolios.reduce(
    (sum, p) => sum + p.metrics.totalCurrentValue,
    0
  );
  const primaryCurrency = portfolios[0]?.currency || "DKK";

  if (totalValue) {
    totalValue.textContent = formatCurrency(
      totalPortfolioValue,
      primaryCurrency
    );
  }

  // Update performance indicators
  // In a real app, you'd calculate these based on historical data
  // For now, we'll use the overall unrealized gain percentage
  const overallPerformance =
    portfolios.reduce((sum, portfolio) => {
      return sum + portfolio.metrics.totalUnrealizedGainPercent;
    }, 0) / portfolios.length;

  // Mock performance for different time periods
  updatePerformanceDisplay(performance7D, overallPerformance * 0.4);
  updatePerformanceDisplay(performance1M, overallPerformance * 0.6);
  updatePerformanceDisplay(performance6M, overallPerformance);

  // Populate portfolio list
  if (portfolioList) {
    favoredStocks.populateStocksList(portfolioList, portfolios, formatCurrency);
  }

  // Create pie chart
  if (portfolioChartCanvas) {
    portfolioChartService.createPortfolioPieChart(
      portfolioChartCanvas,
      portfolios
    );
  }

  // Create portfolio selector for holdings distribution chart (replacing mock growth chart)
  if (portfolioGrowthChartCanvas) {
    // Create and add the portfolio selector above the chart
    createPortfolioSelector(portfolios, portfolioGrowthChartCanvas);
  }
}

// Function to create portfolio selector and holdings distribution chart
function createPortfolioSelector(portfolios, chartCanvas) {
  if (!portfolios || portfolios.length === 0 || !chartCanvas) {
    console.warn("Missing portfolios data or chart canvas");
    return;
  }

  // Get the parent container of the canvas
  const chartContainer = chartCanvas.parentNode;

  // Create the selector container if it doesn't exist
  let selectorContainer = document.getElementById(
    "portfolio-selector-container"
  );
  if (!selectorContainer) {
    selectorContainer = document.createElement("div");
    selectorContainer.id = "portfolio-selector-container";
    selectorContainer.className = "portfolio-selector-container";

    // Insert before the chart canvas
    chartContainer.insertBefore(selectorContainer, chartCanvas);
  }

  // Clear any existing content
  selectorContainer.innerHTML = "";

  // Create the label
  const label = document.createElement("label");
  label.textContent = "Vælg portefølje: ";
  label.setAttribute("for", "portfolio-selector");
  selectorContainer.appendChild(label);

  // Create the select element
  const select = document.createElement("select");
  select.id = "portfolio-selector";
  select.className = "portfolio-selector";

  // Create options for each portfolio
  portfolios.forEach((portfolio, index) => {
    const option = document.createElement("option");
    option.value = index;
    option.textContent = portfolio.name;
    select.appendChild(option);
  });

  selectorContainer.appendChild(select);

  // Event listener for select change
  select.addEventListener("change", function () {
    const selectedIndex = parseInt(this.value);
    const selectedPortfolio = portfolios[selectedIndex];

    // Update chart with selected portfolio
    portfolioChartService.createHoldingsDistributionChart(
      chartCanvas,
      selectedPortfolio
    );

    // Update holdings table
    updateHoldingsTable(selectedPortfolio);
  });

  // Initialize with first portfolio
  if (portfolios.length > 0) {
    portfolioChartService.createHoldingsDistributionChart(
      chartCanvas,
      portfolios[0]
    );
    updateHoldingsTable(portfolios[0]);
  }
}

function updateHoldingsTable(portfolio) {
  const tableBody = document.querySelector("#holdings-table tbody");
  if (
    !tableBody ||
    !portfolio ||
    !portfolio.metrics ||
    !portfolio.metrics.holdings
  ) {
    return;
  }

  // Clear existing rows
  tableBody.innerHTML = "";

  // Sort holdings by value (descending)
  const sortedHoldings = [...portfolio.metrics.holdings].sort(
    (a, b) => b.currentValue - a.currentValue
  );

  // Add a row for each holding
  sortedHoldings.forEach((holding) => {
    const row = document.createElement("tr");

    // Format values
    const boughtPrice = formatCurrency(holding.gak, portfolio.currency);
    const totalValue = formatCurrency(holding.currentValue, portfolio.currency);

    row.innerHTML = `
      <td>${holding.symbol}</td>
      <td>${holding.security_name}</td>
      <td>${boughtPrice}</td>
      <td>${boughtPrice}</td>
      <td>${holding.quantity}</td>
      <td>${totalValue}</td>
    `;

    tableBody.appendChild(row);
  });
}

// Helper functions
function formatCurrency(amount, currencyCode) {
  return (
    new Intl.NumberFormat("da-DK", {
      style: "decimal",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount) +
    " " +
    currencyCode
  );
}

function updatePerformanceDisplay(element, percentChange) {
  if (!element) return;

  const formattedPercent = new Intl.NumberFormat("da-DK", {
    style: "decimal",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    signDisplay: "always",
  }).format(percentChange);

  element.textContent = `${formattedPercent}%`;
  element.classList.add(
    percentChange >= 0 ? "positive-change" : "negative-change"
  );
}

// Other display functions
function showNoPortfoliosMessage() {
  const mainContent = document.querySelector(".main-content");
  if (mainContent) {
    mainContent.innerHTML = `
            <div class="no-data-message">
                <h2>No portfolios found</h2>
                <p>Create a new portfolio to get started.</p>
                <button class="btn btn-primary" id="createFirstPortfolioButton">Create Portfolio</button>
            </div>
        `;

    // Add event listener for the button
    document
      .getElementById("createFirstPortfolioButton")
      .addEventListener("click", () => {
        // Show the create portfolio modal
        const modal = document.getElementById("addPortfolioModal");
        if (modal) modal.style.display = "flex";
      });
  }
}

function showErrorMessage(message) {
  const mainContent = document.querySelector(".main-content");
  if (mainContent) {
    mainContent.innerHTML = `
            <div class="error-message">
                <h2>Error</h2>
                <p>${message}</p>
                <button class="btn btn-primary" id="retryButton">Retry</button>
            </div>
        `;

    // Add event listener for the retry button
    document.getElementById("retryButton").addEventListener("click", () => {
      window.location.reload();
    });
  }
}
