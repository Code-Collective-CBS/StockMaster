// This file handles currency-related HTTP request and uses the ExchangeRate service file
const exchangeRateService = require("../services/exchangeRateService");

const currencyController = {
  getCurrency: async (req, res) => {
    try {
      const { currency } = req.params; // Extract the url param from the url /exchange/:currency
      if (!currency) {
        return res.status(400).json({ error: "Could not find the currency" });
      }

      const currencyData = await exchangeRateService.getCurrency(currency);
      res.json(currencyData);
    } catch (error) {
      console.error("Error in the getCurrency: ", err);
      res.status(500).json({ error: "Failed to fetch currency" });
    }
  },
};

module.exports = currencyController;
