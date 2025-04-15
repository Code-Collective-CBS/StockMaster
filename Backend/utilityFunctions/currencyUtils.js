const currencyUtils = {
    convertCurrency: (amount, fromCurrency, toCurrency, conversionRates) => {
        if (fromCurrency === toCurrency) return amount;
    
        const fromRate = conversionRates[fromCurrency];
        const toRate = conversionRates[toCurrency];
    
        if (!fromRate || !toRate) {
            throw new Error(`Missing conversion rate for ${fromCurrency} or ${toCurrency}`);
        }
    
        return amount * (toRate / fromRate);
    }
}


module.exports =  currencyUtils;