// portfolio.js - Update to fetch real data
import { stockAPI } from "./api.js";
import { favoredStocks } from "../utilityFunctions/favoredStocks.js";
import { portfolioChartService } from "../utilityFunctions/portfolioChartService.js";

document.addEventListener("DOMContentLoaded", async () => {
  console.log("Portfolio page loaded!");

  // Instead of using mock data, fetch real data
  try {
    // Get the user ID from localStorage or session
    const userId = localStorage.getItem('userId') || 1;

    // For now, use a fixed userId
    // const userId = 1;

    if (!userId) {
      console.error("No user found. Redirecting to login...");
      window.location.href = "/pages/login.html";
      return;
    }

    // Fetch portfolio data
    console.log("Fetching portfolio data for user:", userId);
    const portfolioData = await stockAPI.getPortfolioSummary(userId);

    // Update UI with portfolio data
    if (portfolioData && portfolioData.length > 0) {
      updatePortfolioUI(portfolioData);
    } else {
      showNoPortfoliosMessage();
    }
  } catch (error) {
    console.error("Error loading portfolio data:", error);
    showErrorMessage("Failed to load portfolio data. Please try again later.");
  }
});

// Function to update the UI with portfolio data
function updatePortfolioUI(portfolios) {
  // Get DOM elements
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

  // Calculate total portfolio value and performance
  const totalPortfolioValue = portfolios.reduce((sum, portfolio) => {
    return sum + portfolio.metrics.totalCurrentValue;
  }, 0);

  // Update total value display
  if (totalValue) {
    // Assuming the first portfolio's currency for display
    const currency = portfolios[0]?.currency || "DKK";
    totalValue.textContent = formatCurrency(totalPortfolioValue, currency);
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
    portfolioChartService.createPortfolioPieChart(portfolioChartCanvas, portfolios);
  }

  // Create growth chart
  if (portfolioGrowthChartCanvas) {
    // For now, we'll use a mock growth chart since we don't have historical data
    portfolioChartService.createMockGrowthChart(portfolioGrowthChartCanvas);
  }
}


// Helper functions you already have
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
