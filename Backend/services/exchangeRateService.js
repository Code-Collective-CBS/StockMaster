// This is a service file that interacts with Echange Rate Service API and include # key functions inside one object (OOP):


const axios = require("axios");
const config = require("../config/config");

const exchangeRateService = {
  getCurrency: async (baseCurrency) => {
    try {
      const url = `${config.exchangeRate.baseUrl}/${config.exchangeRate.apiKey}/latest/${baseCurrency}`;
      const response = await axios.get(url);
      
      return response.data;
    } catch (error) {
      console.error("Error fetching currency rates", error);
      throw error;
    }
  },
};

module.exports = exchangeRateService;