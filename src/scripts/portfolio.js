// portfolio.js - Update to fetch real data
import { stockAPI } from "./stockScripts/api.js";
import { favoredStocks } from "./utilityFunctions/favoredStocks.js";
import { portfolioChartService } from "./utilityFunctions/portfolioChartService.js";
import { popUps } from "./utilityFunctions/popup.js";
import { loadAccounts } from "../scripts/utilityFunctions/loadAccounts.js";

document.addEventListener("DOMContentLoaded", async () => {
  console.log("Portfolio page loaded!");

  try {
    const accountId = sessionStorage.getItem("selectedAccountId");

    const selectedAccount = await accountDetails();
    console.log(selectedAccount);

    // POP UP
    popUps.setupDepositPopup();
    popUps.createPortfolio();

    if (!accountId) {
      showErrorMessage("Please select an account first");
      return;
    }

    // Show loading state first
    showLoadingState();

    const portfolioData = await stockAPI.getPortfolioSummary(accountId);
    updatePortfolioUI(portfolioData);

    renderHistoryChart(accountId, portfolioData[0]?.currency);
  } catch (error) {
    console.error("Error loading portfolio data:", error);
    showErrorMessage("Failed to load portfolio data. Please try again later.");
  }
});

async function accountDetails() {
  await loadAccounts();
  const selectedAccountId = sessionStorage.getItem("selectedAccountId");
  const accounts = window.cachedAccounts || [];
  return accounts.find((acc) => acc.account_id == selectedAccountId) || null;
}

//calculates the percentage change in portfolio value over a specific time period
function computePctChange(history, daysAgo) {
  // Handle error handling
  if (!Array.isArray(history) || history.length < 2) return 0;

  // Get the latest date from history
  const lastEntry = history[history.length - 1];
  const now = moment(lastEntry.date);

  // Calculate the target date daysAgo days before now
  const targetDate = moment(now).subtract(daysAgo, "days");

  // Find the entry in history with date closest to targetDate
  let closest = history[0];
  let minDiff = Infinity;

  for (const entry of history) {
    const entryDate = moment(entry.date);
    const diff = Math.abs(entryDate.diff(targetDate, "milliseconds"));

    if (diff < minDiff) {
      minDiff = diff;
      closest = entry;
    }
  }

  // Calculate percentage change
  if (closest.value === 0) return 0;

  return ((lastEntry.value - closest.value) / closest.value) * 100;
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

async function updatePortfolioUI(portfolios) {
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
    portfolioList.innerHTML = ""; // prevent duplication
    Object.values(accountsMap).forEach((account) => {
      // convert to array
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

  //Fetch real history data
  const accountId = portfolios[0]?.account_id;
  let historyData = [];
  try {
    historyData = await stockAPI.getPortfolioHistory(accountId);
  } catch (err) {
    console.error("History fetch failed, using mock values", err);
  }

  // 2) Compute real % changes
  const percent7D = computePctChange(historyData, 7);
  const percent1M = computePctChange(historyData, 30);
  const percent6M = computePctChange(historyData, 180);

  updatePerformanceDisplay(performance7D, percent7D);
  updatePerformanceDisplay(performance1M, percent1M);
  updatePerformanceDisplay(performance6M, percent6M);

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

  // Create portfolio selector for holdings distribution chart
  if (portfolioGrowthChartCanvas) {
    // Create and add the portfolio selector above the chart
    createPortfolioSelector(portfolios, portfolioGrowthChartCanvas);
  }
}

async function renderHistoryChart(accountId, currencyCode) {
  try {
    // 1) Fetch history from the server
    const historyData = await stockAPI.getPortfolioHistory(accountId);
    // eturning JSON array [{date, value}, ...]

    // 2) Get the canvas and draw
    const historyCanvas = document.getElementById("portfolioHistoryChart");
    portfolioChartService.createPortfolioHistoryChart(
      historyCanvas,
      historyData,
      currencyCode
    );
  } catch (err) {
    console.error("Failed to load history chart:", err);
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
  label.textContent = "Choose Portfolio ";
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
  if (!tableBody || !portfolio?.metrics?.holdings) return;
  tableBody.innerHTML = "";

  // Sort holdings by current value (descending)
  const sorted = [...portfolio.metrics.holdings].sort(
    (a, b) => b.currentValueAccount - a.currentValueAccount
  );

  sorted.forEach((h) => {
    console.log("Holding payload", h);
    const lastBoughtPricePerShare = h.lastBoughtPricePerShare;
    const currentPriceNative = h.currentPriceNative;
    const avgCostNative = h.avgCostNative;
    const qty = h.quantity;
    const valueNative = h.currentValueNative;
    const valueAccount = h.currentValueAccount;

    const row = document.createElement("tr");
    row.innerHTML = `
    <td>${h.symbol}</td>
    <td>${formatCurrency(lastBoughtPricePerShare, h.nativeCurrency)}</td>
    <td>${formatCurrency(currentPriceNative, h.nativeCurrency)}</td>
    <td>${formatCurrency(avgCostNative, h.nativeCurrency)}</td>
    <td>${qty}</td>
    <td>${formatCurrency(valueNative, h.nativeCurrency)}</td>
    <td>${formatCurrency(valueAccount, portfolio.currency)}</td>
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
