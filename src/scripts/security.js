import { stockAPI } from "./api";

document.addEventListener('DOMContentLoaded', async () => {
    console.log('Security page loaded');

    // stock symbol from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const symbol = urlParams.get('symbol');

    console.log('Stock symbol from URL:', symbol);

    // If no symbol
    if (!symbol) {
        console.error('No stock symbol provided in URL');
        updateStockHeader('No stock symbol specified');
        return;
    }
    updateStockHeader(symbol);

    // title of the page
    document.title = `${symbol} | StockMaster`;

    try {
        console.log('Fetching data for:', symbol)
        const companyData = await stockAPI.getCompanyOverview(symbol);
        console.log('Company data recieved:' , companyData);

        displayCompanyInfo(companyData, symbol);
    } catch (error) {
        console.error('Error fetching company data', errror);
    }
});

// Update the stock header
function updateStockHeader(text) {
    const stockHeader = document.querySelector('.stock-name-holder h2');

    if (stockHeader) {
        stockHeader.textContent = text;
    } else {
        console.error('Could not find the stock header element');
    }
}

function displayCompanyInfo(companyData, symbol) {
    if (!companyData) {
        console.error('No company data available');
        return;
    }
}