import { stockAPI } from "./stockScripts/api.js";
import { searchFunction } from "./utilityFunctions/searchFunction.js";

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
      const data = await stockAPI.getIndicesoverview(topPick.symbol); // Use the parsed JSON directly
      const closedPrice = data.results[0].c;

      if (topPick.htmlElement) {
        const marketPriceElement = topPick.htmlElement.querySelector(".market-price");
        marketPriceElement.innerHTML = `${parseFloat(closedPrice.toFixed(1)) || "N/A"}`;
      }
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
      const data = await stockAPI.getNews();
      const randomNumber = Math.floor(Math.random() * data.results.length);
      const article = data.results[randomNumber];

      newsContainerAuthor.innerHTML = article.author;
      newsContainerDescription.innerHTML = `${article.description}<br><br><a href="${article.article_url}" target="_blank">Read more here</a>`; // The content will now scroll if it overflows
    } catch (error) {
      console.error('Error fetching news: ', error);
    }
  };
  gethNews();
});