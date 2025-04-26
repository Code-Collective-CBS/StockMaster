// File for utility functions used across pages
const DATABASE_BASE_URL = '/api/database';

export const searchFunction = {
    // SEARCH STOCKS IN DATABASE
    searchStock: async (searchQuery) => {
        try {
            const response = await fetch(`${DATABASE_BASE_URL}/search-stocks?query=${encodeURIComponent(searchQuery)}`);
            if (!response.ok) {
                throw new Error('HTTP error! Status: ', response.status);
            }

            return await response.json();
        } catch (err) {
            console.error('Error fetching search results:', err);
        }
    },

    // SEARCH CURRENCIES IN DATABASE
    searchCurrencies: async (searchQuery) => {
        try {
            const response = await fetch(`${DATABASE_BASE_URL}/search-currency?query=${encodeURIComponent(searchQuery)}`);
            if (!response.ok) {
                throw new Error(`HTTP error! Status: : ${response.status}`)
            }

            return await response.json()
        } catch (err) {
            console.error('Error fetching search results: ', err)
            return null;
        }
    }
};