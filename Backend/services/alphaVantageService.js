// This is a service file that interacts with Alpha Vantage and include 4 key functions inside one object (OOP):
// getStockQueote,
// searchStocks,
// getDailyTimeSeries,
// getCompanyOverview

const axios = require("axios");
const config = require("../config/config");

// Alpha Vantage service object (OOP)
const alphaVantageService = {
  // Get stock data for a symbol (MSF or APPL etc)
  getStockQuote: async (symbol) => {
    try {
      const url = `${config.alphaVantage.baseUrl}?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${config.alphaVantage.apiKey}`;
      console.log('Making request to:', url); // Add this for debugging
      const response = await axios.get(url);
      return response.data;
    } catch (error) {
      console.error("Error fetching stock quote", error);
      throw error;
    }
  },

  // Search for stock by keywords
  searchStocks: async (keywords) => {
    try {
      const url = `${config.alphaVantage.baseUrl}?function=SYMBOL_SEARCH&keywords=${keywords}&apikey=${config.alphaVantage.apiKey}`;
      console.log('Making request to:', url); // Add this for debugging
      const response = await axios.get(url);
      return response.data;
    } catch (error) {
      console.error("Error searching stocks:", error);
      throw error;
    }
  },

  // Get the daily time series for a stock
  getDailyTimeSeries: async (symbol, outputsize = "compact") => {
    try {
      const response = await axios.get(config.alphaVantage.baseUrl, {
        params: {
          function: "TIME_SERIES_DAILY",
          symbol: symbol,
          outputsize: outputsize,
          apiKey: config.alphaVantage.apiKey,
        },
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching daily time series:", error);
      throw error;
    }
  },

  // Get the companies overview information
  getCompanyOverview: async (symbol) => {
    try {
      const response = await axios.get(config.alphaVantage.baseUrl, {
        params: {
          function: "OVERVIEW",
          symbol: symbol,
          apiKey: config.alphaVantage.apiKey,
        },
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching company overview:", error);
      throw error;
    }
  },

  testConnection: async () => {
    try {
      // Direct URL construction since we know this works
      const url = `${config.alphaVantage.baseUrl}?function=GLOBAL_QUOTE&symbol=AAPL&apikey=${config.alphaVantage.apiKey}`;
      console.log("Testing URL:", url); // Log for debugging

      const response = await axios.get(url);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error("Error testing Alpha Vantage connection:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  },
};

module.exports = alphaVantageService;