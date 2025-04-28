// This file handles stock-related HTTP request and uses the Alpha Vantage service file
// Import alphaVantageService module
const alphaVantageService = require("../services/alphaVantageService");
// const alphaVantageService = require("../services/mockAlphaVantageService"); // MOCK DATA
const polygonService = require("../services/polygonService");

// CACHE
const cache = require("../utilityFunctions/cache");
const { getOrSetCache } = require('../utilityFunctions/cacheHelper');

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

      const cacheKey = `timeSeries-${symbol}`;
      const { data, source } = await getOrSetCache(
        cacheKey,
        () => alphaVantageService.getDailyTimeSeries(symbol, outputsize),
        86400000 // 24h
      )

      res.json({ data, source });
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

      const cacheKey = `symbol-${symbol}`;

      const { data, source } = await getOrSetCache(
        cacheKey,
        () => alphaVantageService.getCompanyOverview(symbol),
        86400000 // 1 day
      );

      res.json({ data, source });
    } catch (error) {
      console.error("Error in getCompanyOverview controller", error);
      res.status(500).json({ error: "Failed to fetch company overview" });
    }
  },

  getIndicesoverview: async (req, res) => {
    try {
      const { symbol } = req.params;

      if(!symbol) {
        return res.status(400).json({ error: 'Could not find the indicies', symbol});
      }

      const cacheKey = `indices-${symbol}`;

      // Use the cache helper function to get cached or fresh data
      const { data, source } = await getOrSetCache(
        cacheKey,
        () => polygonService.getIndicesoverview(symbol), // Wrap function in function to not call immediately
        600
      );

      res.json({ source, data });
    } catch (error) {
      console.error('Error in getIndicesoverview controller', error);
      res.status(500).json({ error: 'Failed to fetch data for indicies' });
    }
  },

  getNews: async (req, res) => {
    try {
      const cacheKey = 'news';

      const { data, source } = await getOrSetCache(
        cacheKey,
        () => polygonService.getNews(),
        3600 // 1 hour
      );

      res.json({ source, data });
    } catch (error) {
      console.error('Error in getNews', error);
      res.status(500).json({ error: 'Failed to fetch data for indicies' });
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