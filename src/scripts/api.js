// api.js (Frontend API Calls)
const API_BASE_URL = 'http://localhost:3000/api/stocks';

export const stockAPI = {
  // Get stock quote
  getStockQuote: async (symbol) => {
    try {
      const response = await fetch(`${API_BASE_URL}/quote/${symbol}`);
      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('Error fetching stock quote:', error);
      throw error;
    }
  },

  // Search stocks by keyword
  searchStocks: async (keywords) => {
    try {
      const response = await fetch(`${API_BASE_URL}/search?keywords=${encodeURIComponent(keywords)}`);
      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('Error searching stocks:', error);
      throw error;
    }
  },

  // Get daily time series
  getDailyTimeSeries: async (symbol, outputsize = 'compact') => {
    try {
      const response = await fetch(`${API_BASE_URL}/daily/${symbol}?outputsize=${outputsize}`);
      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('Error fetching daily time series:', error);
      throw error;
    }
  },

  // Get company overview
  getCompanyOverview: async (symbol) => {
    try {
      const response = await fetch(`${API_BASE_URL}/overview/${symbol}`);
      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('Error fetching company overview:', error);
      throw error;
    }
  },

  // Test connection
  testConnection: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/test-connection`);
      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('Error testing connection:', error);
      throw error;
    }
  }
};