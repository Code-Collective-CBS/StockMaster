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
    const stockHeader = document.querySelector('.security-graph h2');

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

    if (companyData.Name) {
        updateStockHeader(companyData.Name)
    } else if (companyData.name) {
        updateStockHeader(companyData.name)
    }
    console.log('Could not find the company name')

    const infoSection = document.createElement('section');
    infoSection.className = 'company-info';

    const graphSection = document.querySelector('.security-graph');
    if (graphSection && graphSection.parentNode) {
        graphSection.parentNode.insertBefore(infoSection, graphSection.nextSibling);
    } else {
        // Fallback - append to main content
        const mainContent = document.querySelector('.security-content');
        if (mainContent) {
            mainContent.appendChild(infoSection);
        } else {
            console.error('Could not find a place to insert company info');
            return;
        }
    }

    infoSection.innerHTML = '';

    const heading = document.createElement('h2');
    heading.textContent = 'Aktie Information';
    infoSection.appendChild(heading);

    const infoList = document.createElement('div');
    infoList.className = 'company-details';

    // Update this based on the api json format
    const fields = [
        { label: 'Symbol', key: 'Symbol', fallback: symbol },
        { label: 'Industry', key: 'Industry', fallback: 'Not available' },
        { label: 'Sector', key: 'Sector', fallback: 'Not available' },
        { label: 'Exchange', key: 'Exchange', fallback: 'Not available' },
        { label: 'Market Cap', key: 'MarketCapitalization', fallback: 'Not available', formatter: formatMarketCap },
        { label: 'P/E Ratio', key: 'PERatio', fallback: 'Not available' },
        { label: 'Dividend Yield', key: 'DividendYield', fallback: 'Not available', formatter: formatPercentage },
        { label: '52-Week High', key: '52WeekHigh', fallback: 'Not available', formatter: formatCurrency },
        { label: '52-Week Low', key: '52WeekLow', fallback: 'Not available', formatter: formatCurrency }
    ];

    fields.forEach(field => {
        const item = document.createElement('p');
        let value = companyData[field.key] || field.fallback;

              // Apply formatter if provided
              if (field.formatter && value !== field.fallback) {
                value = field.formatter(value);
            }

            item.innerHTML = `<strong>${field.label}:</strong> ${value}`;
            infoList.appendChild(item);
        });

        infoSection.appendChild(infoList);
}