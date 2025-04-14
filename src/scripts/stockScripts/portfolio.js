// portfolio.js - Update to fetch real data
import { stockAPI } from "./api.js";
import { favoredStocks } from "../utilityFunctions/favoredStocks.js";
import { portfolioChartService } from "../utilityFunctions/portfolioChartService.js";

document.addEventListener("DOMContentLoaded", async () => {
  console.log("Portfolio page loaded!");

  try {
    const accountId = sessionStorage.getItem("selectedAccountId");

    if (!accountId) {
      console.warn("No account selected");
      showErrorMessage("Please select an account first");
      return;
    }

    // Fetch all portfolio data in one call
    const portfolioData = await stockAPI.getPortfolioSummary(accountId);

    // Update UI
    if (
      (portfolioData &&
        Array.isArray(portfolioData) &&
        portfolioData.length > 0) ||
      (portfolioData.accounts && portfolioData.accounts.length > 0)
    ) {
      updatePortfolioUI(portfolioData);
    } else {
      showNoPortfoliosMessage();
    }
  } catch (error) {
    console.error("Error loading portfolio data:", error);
    showErrorMessage("Failed to load portfolio data. Please try again later.");
  }
});

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
        portfolioElement.innerHTML = `
          <h4>${portfolio.name}</h4>
          <p>Value: ${formatCurrency(
            portfolio.metrics.totalCurrentValue,
            account.currency
          )}</p>
          <p>Gain: ${portfolio.metrics.totalUnrealizedGainPercent.toFixed(
            2
          )}%</p>
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

  // Create growth chart
  if (portfolioGrowthChartCanvas) {
    // For now, we'll use a mock growth chart since we don't have historical data
    portfolioChartService.createMockGrowthChart(portfolioGrowthChartCanvas);
  }
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
