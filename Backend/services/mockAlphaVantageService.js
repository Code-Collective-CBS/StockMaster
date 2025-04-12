const { IBMStockData } = require("../../src/scripts/stockScripts/IBMStockData");

module.exports = {
  getCompanyOverview: async (symbol) => {
    if (symbol === "IBM") {
      console.log("Mocked getCompanyOverview() for IBM");
      return IBMStockData.companyOverview; // return raw object
    }
  },

  getDailyTimeSeries: async (symbol) => {
    if (symbol === "IBM") {
      console.log("Mocked getDailyTimeSeries() for IBM");
      return {
        "Time Series (Daily)": IBMStockData["Time Series (Daily)"]
      }; // match Alpha Vantage shape
    }
  }
};