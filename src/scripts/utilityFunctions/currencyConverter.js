export const currencyHandler = {
  convertCurrency: (amount, fromCurrency, toCurrency, rates) => {
    // If currencies are the same, no conversion needed
    if (fromCurrency === toCurrency) {
      return amount;
    }

    const conversionRates = rates.conversion_rates;
    // Direct conversion using cross-rate
    return (
      amount * (conversionRates[toCurrency] / conversionRates[fromCurrency])
    );
  },

  portfolioValue: (holdings, targetCurrency, exchangeRates) => {
    let total = 0;


    // For now we use mock data to calculate the portfolio holding: (everyting in the holding variable)
    holdings.forEach((holding) => {
      const valueInOriginalCurrency = holding.quantity * holding.currenPrice;
      const valueInTargetCurrency = convertCurrency(
        valueInOriginalCurrency,
        holding.currency,
        targetCurrency,
        exchangeRates
      );

      total += valueInTargetCurrency;
    });

    return total;
  },
};
