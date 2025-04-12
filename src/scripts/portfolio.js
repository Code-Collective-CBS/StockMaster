import { currencyHandler } from "./utilityFunctions/currencyConverter"
import { stockAPI } from "./stockScripts/api";
import { currencyDKKData } from "./stockScripts/currencyDKKData";

document.addEventListener('DOMContentLoaded', async () => {

    const totalValue = document.getElementById('totalValueDisplay');
    const performance7D = document.getElementById('performance7d');
    const performance1M = document.getElementBydId('performance1m');
    const performance6M = document.getElementById('performance6m');

    const baseCurrency = currencyDKKData.base_code;
    const conversionRates = currencyDKKData.conversion_rates;
    console.log(`The account's preferred currency: ${baseCurrency}`);

    let globalBaseCurrency;
    let globalConversionRates;
    let globalPortfolioTimeSeries;

    try {
        globalBaseCurrency = baseCurrency;
        globalConversionRates = currencyDKKData.conversion_rates;
    } catch (error) {
        console.error('Error fetching currency data', error);
    }

})