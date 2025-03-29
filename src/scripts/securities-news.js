import { stockAPI } from "./stockScripts/api.js";

const topPicksSymbols = ["AAPL"];
// const topPicksSymbols = ["AAPL", "IBIT", "TSLA", "SP500F"];

document.addEventListener("DOMContentLoaded", () => {
  const stockInput = document.getElementById("stockInput");
  const deleteButton = document.querySelector(".delete-search");
  const searchContainer = document.querySelector(".displaySearch");
  const topPicksContainer = document.querySelector(".top-picks");


  //// BUTTONS ////

  deleteButton.addEventListener('click', () => {
    stockInput.value = '';
    searchContainer.innerHTML = '';
  });

  //// TOP PICKS ////


  //// TOP PICKS ////

  topPicksSymbols.forEach(async (topPick) => {
    try {
      console.log(`Fetching data for top pick: ${topPick}`); // Log the symbol
      const result = await stockAPI.getFinancialsPolygon(topPick); // Use the parsed JSON directly
      console.log(`Top Pick (${topPick}):`, {
        name: result.name || "N/A",
        symbol: result.symbol || "N/A",
        financials: result.financials ? result.financials.slice(0, 2) : "N/A", // Log only the first 2 financial entries
      });
    } catch (error) {
      console.error(`Error fetching top pick (${topPick}):`, error);
    }
  });


  //// SEARCH STOCKS ////
  stockInput.addEventListener('input', async () => {
    const searchQuery = stockInput.value.trim();

    if (searchQuery.length === 0) searchContainer.innerHTML = '';
    if (searchQuery.length < 2) return

    try {
      const response = await fetch(`/api/database/search-stocks?query=${encodeURIComponent(searchQuery)}`);
      if (!response.ok) {
        throw new Error('Failed to fetch search results');
      }

      const results = await response.json();
      displaySearchResults(results);
    } catch (err) {
      console.error('Error fetching search results:', err);
    }
  });

  const displaySearchResults = function (searchResults) {
    searchContainer.innerHTML = ""; // Clear previous results

    if (searchResults.length === 0) {
      searchContainer.innerHTML = '<p>No results</p>';
      return;
    }

    searchResults.forEach((stock) => {
      const stockElement = document.createElement('div');
      stockElement.classList.add('stock-result-div');
      stockElement.innerHTML = `
            <p class="stock-result-p"><a href="/src/pages/security.html?symbol=${stock.symbol}">${stock.symbol} - ${stock.name}</a></p>
        `;
      searchContainer.appendChild(stockElement);
    });
  };
});