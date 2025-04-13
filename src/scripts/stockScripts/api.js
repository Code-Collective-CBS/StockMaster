import { mockPortfolioData } from "./mockPortfolioData.js";

// api.js (Frontend API Calls)
const API_BASE_URL = "http://localhost:3000/api/stocks";
const API_CURRENCY_URL = "http://localhost:3000/api/currency";
const PORTFOLIO_URL = "http://localhost:3000/api/database/user";

export const stockAPI = {
  // Get stock quote
  getStockQuote: async (symbol) => {
    try {
      const response = await fetch(`${API_BASE_URL}/quote/${symbol}`);
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Error fetching stock quote:", error);
      throw error;
    }
  },

  // Get daily time series
  getDailyTimeSeries: async (symbol, outputsize = "full") => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/daily/${symbol}?outputsize=${outputsize}`
      );
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Error fetching daily time series:", error);
      throw error;
    }
  },

  // Get company overview
  getCompanyOverview: async (symbol) => {
    try {
      const response = await fetch(`${API_BASE_URL}/overview/${symbol}`);
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Error fetching company overview:", error);
      throw error;
    }
  },

  // GET NEWS FROM POLYGON
  getIndicesoverview: async (symbol) => {
    try {
      const url = `${API_BASE_URL}/overview-indices/${symbol}`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! Status, ${response.status}`);
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`Error fetching indicies data: ${symbol}`, error);
      throw error;
    }
  },

  getNews: async () => {
    try {
      const url = `${API_BASE_URL}/news/`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! Status, ${response.ok}`);
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error fetching news: ", error);
      throw error;
    }
  },

  getCurrency: async (currency) => {
    try {
      const url = `${API_CURRENCY_URL}/exchange/${currency}`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! Status, ${response.ok}`);
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error fetching exchange data", error);
      throw error;
    }
  },

  getPortfolioSummary: async (userId) => {
    try {
      const USE_MOCK_DATA = true;

      if (USE_MOCK_DATA) {
        console.log("Using mock portfolio data for user:", userId);
        // Simulate network delay for realistic testing
        await new Promise((resolve) => setTimeout(resolve, 300));
        return mockPortfolioData;
      }

      // our actual api call (when USE_MOCK_DATA is not true)
      const url = `${PORTFOLIO_URL}/${userId}`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(
          "HTTP error, could not get the portfolio url! Status:",
          `${response.status}`
        );
      }
      return await response.json();
    } catch (error) {
      console.error("Error fetching portfolio summary", error);
      throw error;
    }
  },

  // Test connection
  // testConnection: async () => {
  //   try {
  //     const response = await fetch(`${API_BASE_URL}/test-connection`);
  //     if (!response.ok) {
  //       throw new Error(`HTTP error! Status: ${response.status}`);
  //     }
  //     return await response.json();
  //   } catch (error) {
  //     console.error('Error testing connection:', error);
  //     throw error;
  //   }
  // }
};
