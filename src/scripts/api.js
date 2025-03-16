const axios = require('axios');
// Base URL for all API requests
const API_BASE_URL = 'http://localhost:3000/api';

// Stock API functionss, ofc in OOP for better organization
const stockAPI = {
  // Stock quote
  getStockQuote: async (symbol) => {
    try {
      // Using axios to make a GET request to our backend
      const response = await axios.get(`${API_BASE_URL}/stocks/quote/${symbol}`); // this is a page with raw data from AV

      return response.data;
    } catch (error) {
      console.error('Error fetching stock quote:', error);
      throw error;
    }
  },

  // Function to search for stocks based on keywords
  searchStocks: async (keywords) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/stocks/search`, {
        params: { keywords: keywords }
      });

      // Return the data
      return response.data;
    } catch (error) {
      console.error('Error searching stocks:', error);
      throw error;
    }
  },

  // Function to get daily time series data for a stock
  getDailyTimeSeries: async (symbol, outputsize = 'compact') => {
    try {
      // Make the API request with optional outputsize parameter
      const response = await axios.get(`${API_BASE_URL}/stocks/daily/${symbol}`, {
        params: { outputsize: outputsize }
      });

      return response.data;
    } catch (error) {
      console.error('Error fetching daily time series:', error);
      throw error;
    }
  },

  // Function to get company overview information
  getCompanyOverview: async (symbol) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/stocks/overview/${symbol}`);

      return response.data;
    } catch (error) {
      console.error('Error fetching company overview:', error);
      throw error;
    }
  }
};


// Exporting the API functions
module.exports = {
  stock: stockAPI
  // Later we can add the other api's such as user and portfolio
};