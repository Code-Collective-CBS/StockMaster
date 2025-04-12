import { stockAPI } from "./stockScripts/api.js";
import { searchFunction } from "./utilityFunctions/searchFunction.js";

// PRESENT IN THE DASHBOARD.JS MAYBE MOVE IT?
const topPicksSymbols = [
  {
    symbol: "I:NDX",
    htmlElement: document.getElementById("I:NDX"),
  },
  {
    symbol: "I:CX10GI",
    htmlElement: document.getElementById("I:CX10GI"),
  },
  {
    symbol: "I:CX35PI",
    htmlElement: document.getElementById("I:CX35PI"),
  },
  {
    symbol: "I:CX20GI",
    htmlElement: document.getElementById("I:CX20GI"),
  },
];

document.addEventListener("DOMContentLoaded", () => {
  const stockInput = document.getElementById("stockInput");
  const deleteButton = document.querySelector(".delete-search");
  const searchContainer = document.querySelector(".displaySearch");

  const newsContainerAuthor = document.getElementById("news-author");
  const newsContainerDescription = document.getElementById("news-description");

  //// BUTTONS ////

  deleteButton.addEventListener('click', () => {
    stockInput.value = '';
    searchContainer.innerHTML = '';
  });

  //// TOP PICKS ////

  topPicksSymbols.forEach(async (topPick) => {
    try {
      const response = await stockAPI.getIndicesoverview(topPick.symbol);
      const data = response.data;

      // Safely check for valid data
      if (!data?.results?.length || !data.results[0]?.c) {
        console.warn(`No valid results for ${topPick.symbol}`);
        return; // Skip to next symbol
      }

      const closedPrice = data.results[0].c;

      if (topPick.htmlElement) {
        const marketPriceElement = topPick.htmlElement.querySelector(".market-price");
        marketPriceElement.innerHTML = `${parseFloat(closedPrice.toFixed(1)) || "N/A"}`;
      }
    } catch (error) {
      console.error(`Top pick fetch failed for ${topPick.symbol}:`, error.message);
    }
  });

  //// SEARCH STOCKS ////
  stockInput.addEventListener('input', async () => {
    const searchQuery = stockInput.value.trim();

    if (searchQuery.length === 0) searchContainer.innerHTML = '';
    if (searchQuery.length < 2) return

    try {
      const data = await searchFunction.searchStock(searchQuery);
      displaySearchResults(data);
    } catch (err) {
      console.error('Error fetching search results: ', err);
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

  //// NEWS ////

  const gethNews = async () => {
    try {
      const response = await stockAPI.getNews();
      const data = response.data;

      // Safeguard: make sure we have valid results
      if (!data?.results?.length) {
        console.warn("No news articles received.");
        return;
      }

      // Pick a random article
      const randomIndex = Math.floor(Math.random() * data.results.length);
      const article = data.results[randomIndex];

      // Defensive rendering to avoid crashes if fields are missing
      newsContainerAuthor.innerHTML = article.author ?? "Unknown author";
      newsContainerDescription.innerHTML = `
        ${article.description ?? "No description available"}<br><br>
        <a href="${article.article_url}" target="_blank">Read more here</a>
      `;
    } catch (error) {
      console.error("Error fetching news:", error.message);
    }
  };
  gethNews();
});