import { stockAPI } from './api.js';  // ✅ Correctly importing frontend API functions

const stockInput = document.getElementById('stockInput');
const searchButton = document.querySelector('.search-button');

searchButton.addEventListener('click', async () => {
    const searchName = stockInput.value.trim();
    stockInput.value = '';

    if (searchName) {
        try {
            const results = await stockAPI.searchStocks(searchName);
            console.log('Search Results:', results); // ✅ Show results in console (or UI)
        } catch (error) {
            console.error('Error fetching search results:', error);
        }
    } else {
        console.warn('Please enter a valid stock name.');
    }
});