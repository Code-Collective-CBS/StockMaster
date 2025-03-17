import { stockAPI } from './api.js';

const dummyResults = {
    bestMatches: [
        { symbol: 'MSF0.FRK', name: 'MICROSOFT CORP. CDR', type: 'Equity', region: 'Frankfurt', marketOpen: '08:00' },
        { symbol: 'MSFT', name: 'Microsoft Corporation', type: 'Equity', region: 'United States', marketOpen: '09:30' },
        { symbol: '0QYP.LON', name: 'Microsoft 2Corporation', type: 'Equity', region: 'United Kingdom', marketOpen: '08:00' },
        { symbol: 'MSF.DEX', name: 'Microsoft 3Corporation', type: 'Equity', region: 'XETRA', marketOpen: '08:00' },
        { symbol: 'MSF.FRK', name: 'Microsoft 4Corporation', type: 'Equity', region: 'Frankfurt', marketOpen: '08:00' },
        { symbol: 'MSFT34.SAO', name: 'Microsoft 5Corporation', type: 'Equity', region: 'Brazil/Sao Paolo', marketOpen: '10:00' },
        { symbol: 'MSFT.TRT', name: 'Microsoft CDR (CAD Hedged)', type: 'Equity', region: 'Toronto', marketOpen: '09:30' }
    ]
};

document.addEventListener('DOMContentLoaded', () => {
    const stockInput = document.getElementById('stockInput');
    const searchButton = document.querySelector('.search-button');
    const searchContainer = document.querySelector('.displaySearch');

    searchButton.addEventListener('click', async () => {
        const searchName = stockInput.value.trim();
        stockInput.value = '';
        searchContainer.innerHTML = '';

        if (searchName) {
            try {
                const results = await stockAPI.searchStocks(searchName);
                console.log('Search Results:', results); 

                dummyResults.bestMatches.forEach((match) => { // CHANGE dummyResults TO results
                    const stockName = match.name;
                    const stockNameItem = document.createElement('p');

                    stockNameItem.setAttribute('id', match.symbol)
                    stockNameItem.innerHTML = `<a href="../pages/security.html?symbol=${stockNameItem.id}">${stockName}</a>`;

                    searchContainer.appendChild(stockNameItem);
                    console.log(match.name);
                });

            } catch (error) {
                console.error('Error fetching search results:', error);
            }
        } else {
            console.warn('Please enter a valid stock name.');
        }
    });
});