// This file handles stock-related HTTP request and uses the Alpha Vantage service file
// Import alphaVantageService module
const alphaVantageService = require("../services/alphaVantageService");

const stockController = {
  getQuote: async (req, res) => {
    try {
      const { symbol } = req.params; // url paramaters ex :symbol in /quote/:symbol

      if (!symbol) {
        return res.status(400).json({ error: "Could not find stock symbol" });
      }

      // await is used to pause javascript until the promise resolves
      const quoteData = await alphaVantageService.getStockQuote(symbol);
      res.json(quoteData);
    } catch (error) {
      console.error("Error in getQuote controller:", error);
      res.status(500).json({ error: "Failed to fetch stock quote" });
    }
  },

  searchStocks: async (req, res) => {
    try {
      const { keywords } = req.query; // the string of the keywords: keywords=microsoft

      if (!keywords) {
        return res
          .status(400)
          .json({ error: "Could not find any keywords mathcing" });
      }

      const searchResults = await alphaVantageService.searchStocks(keywords);
      res.json(searchResults);
    } catch (error) {
      console.error("Error in searchStocks controller:", error);
      res.status(500).json({ error: "Failed to search stocks" });
    }
  },

  getDailyTimeSeries: async (req, res) => {
    try {
      const { symbol } = req.params;
      const { outputsize } = req.query;

      if (!symbol) {
        return res.status(400).json({ error: "Could not find stock symbol" });
      }

      const timeSeriesData = await alphaVantageService.getDailyTimeSeries(
        symbol,
        outputsize
      );
      res.json(timeSeriesData);
    } catch (error) {
      console.error("Error in getDailyTimeSeries controller", error);
      res.status(500).json({ error: "Failed to fetch time series data" });
    }
  },

  getCompanyOverview: async (req, res) => {
    try {
      const { symbol } = req.params;

      if (!symbol) {
        return res.status(400).json({ error: "Could not find stock symbol" });
      }

      const overviewData = await alphaVantageService.getCompanyOverview(symbol);
      res.json(overviewData);
    } catch (error) {
      console.error("Error in getCompanyOverview controller", error);
      res.status(500).json({ error: "Failed to fetch company overview" });
    }
  },

  // Test the connection
testConnection: async (req, res) => {
    try {
      const result = await alphaVantageService.testConnection();
      res.json(result);
    } catch (error) {
      console.error('Error in testConnection controller:', error);
      res.status(500).json({ error: 'Failed to test Alpha Vantage connection' });
    }
  }
};

module.exports = stockController;
