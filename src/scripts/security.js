import { stockAPI } from "./stockScripts/api.js";
import { stockMetrics } from "./stockScripts/stockMetrics.js";
// import { IBMStockData } from "./stockScripts/IBMStockData.js";
import { chartService } from "./utilityFunctions/chartService.js";

document.addEventListener("DOMContentLoaded", async () => {
  console.log("Security page loaded!");

  const urlParams = new URLSearchParams(window.location.search);
  const symbol = urlParams.get("symbol");
  //   const symbol = IBMStockData.companyOverview.Symbol;
  //   console.log(`Stock symbol: ${symbol}`);

  // Storing time series globally so we can use it again
  let globalTimeSeriesData;
  let globalCompanyOverview;

  try {
    // Get company overview data
    const companyData = await stockAPI.getCompanyOverview(symbol);
    globalCompanyOverview = companyData.data; // Caching
    // globalCompanyOverview = IBMStockData.companyOverview;
    // globalTimeSeriesData = IBMStockData.dailyTimeSeries;

    displayCompanyName(globalCompanyOverview, symbol);
    displayCompanyOverview(globalCompanyOverview, symbol);
    updatePageTitle(globalCompanyOverview.Name);
    document.title = `${globalCompanyOverview.Name} (${symbol})`;

    // price history data for stock graph (chart.js)
    const timeSeriesResponse = await stockAPI.getDailyTimeSeries(symbol);
    const fullTimeSeriesData = timeSeriesResponse.data; // unwrap it first
    globalTimeSeriesData = fullTimeSeriesData?.["Time Series (Daily)"];
    
    chartService.createPriceChart(globalTimeSeriesData, globalCompanyOverview);

    // Displaying all stock metrics from the stockMetrics module
    stockMetrics.displayStockData(globalCompanyOverview, 251.25);

    // Setting up the event listener for change in time interval
    const intervalSelect = document.getElementById("portfolio-graph-interval");
    if (intervalSelect) {
      intervalSelect.addEventListener("change", function () {
        const days = parseInt(this.value); // from security.html value, and then parse it to a number
        chartService.createPriceChart(globalTimeSeriesData, globalCompanyOverview, -days);
      });
    }
  } catch (error) {
    console.error("Error fetching data:", error);
  }
});

function updateStockHeader(text) {
  const stockHeader = document.querySelector(".security-graph h2");

  if (!stockHeader) {
    console.error("Could not find the stock");
  }
  stockHeader.textContent = text;
}

function displayCompanyName(companyData, symbol) {
  console.log("Company data: ", companyData);
  // Check if we have the data
  if (!companyData) {
    console.error("No company data available");
    updateStockHeader(`${symbol} - Data not available`);
    return;
  }
  if (companyData.Name) {
    updateStockHeader(companyData.Name);
  }
  updateStockHeader(symbol);
}

function displayCompanyOverview(companyData, symbol) {
  // Check if we have company data
  if (!companyData) {
    console.error(`No company data available for ${symbol}`);
    return;
  }

  const companyDescription = document.querySelector(".company-description p");
  if (!companyDescription) {
    console.error("Company description element not found in the DOM");
    return;
  }

  // Check if we have a description in the data
  if (!companyData.Description) {
    console.warn(`No description available for ${symbol}`);
    companyDescription.textContent = `No description available for ${symbol}.`;
    return;
  }

  // Display the description
  companyDescription.textContent = companyData.Description;
  console.log(`Successfully displayed ${symbol} details`);
}

function updatePageTitle(stockName) {
  const pageTitle = document.querySelector(".page-title");

  if (!pageTitle) {
    console.error("Could not find the stock");
  }
  pageTitle.textContent = stockName;
}
