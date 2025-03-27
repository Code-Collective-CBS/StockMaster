import { stockAPI } from "./stockScripts/api.js";

const topPicksSymbols = ["^OMXC20", "SNP", "EUNL", "CCC"];

const dummyResults = {
  bestMatches: [
    {
      "1. symbol": "MSF0.FRK",
      "2. name": "MICROSOFT CORP. CDR",
      "3. type": "Equity",
      "4. region": "Frankfurt",
      "5. marketOpen": "08:00",
      "6. marketClose": "22:00",
      "7. timezone": "UTC+1",
      "8. currency": "EUR",
      "9. matchScore": "0.90",
    },
    {
      "1. symbol": "MSFT",
      "2. name": "Microsoft Corporation",
      "3. type": "Equity",
      "4. region": "United States",
      "5. marketOpen": "09:30",
      "6. marketClose": "16:00",
      "7. timezone": "UTC-04",
      "8. currency": "USD",
      "9. matchScore": "1.00",
    },
    {
      "1. symbol": "0QYP.LON",
      "2. name": "Microsoft Corporation",
      "3. type": "Equity",
      "4. region": "United Kingdom",
      "5. marketOpen": "08:00",
      "6. marketClose": "16:30",
      "7. timezone": "UTC+0",
      "8. currency": "GBP",
      "9. matchScore": "0.85",
    },
    {
      "1. symbol": "MSF.DEX",
      "2. name": "Microsoft Corporation",
      "3. type": "Equity",
      "4. region": "XETRA",
      "5. marketOpen": "08:00",
      "6. marketClose": "22:00",
      "7. timezone": "UTC+1",
      "8. currency": "EUR",
      "9. matchScore": "0.88",
    },
    {
      "1. symbol": "MSF.FRK",
      "2. name": "Microsoft Corporation",
      "3. type": "Equity",
      "4. region": "Frankfurt",
      "5. marketOpen": "08:00",
      "6. marketClose": "22:00",
      "7. timezone": "UTC+1",
      "8. currency": "EUR",
      "9. matchScore": "0.87",
    },
    {
      "1. symbol": "MSFT34.SAO",
      "2. name": "Microsoft Corporation",
      "3. type": "Equity",
      "4. region": "Brazil/Sao Paolo",
      "5. marketOpen": "10:00",
      "6. marketClose": "17:00",
      "7. timezone": "UTC-03",
      "8. currency": "BRL",
      "9. matchScore": "0.80",
    },
    {
      "1. symbol": "MSFT.TRT",
      "2. name": "Microsoft CDR (CAD Hedged)",
      "3. type": "Equity",
      "4. region": "Toronto",
      "5. marketOpen": "09:30",
      "6. marketClose": "16:00",
      "7. timezone": "UTC-05",
      "8. currency": "CAD",
      "9. matchScore": "0.75",
    },
  ],
};

document.addEventListener("DOMContentLoaded", () => {
  const stockInput = document.getElementById("stockInput");
  const searchButton = document.querySelector(".search-button");
  const searchContainer = document.querySelector(".displaySearch");

  //// TOP PICKS ////
  const topPicksContainer = document.querySelector(".top-picks");

  async function loadTopPicksData(symbol) {
    try {
      const result = await stockAPI.getCompanyOverview(symbol);

      const priceElement = document
        .getElementById(symbol)
        ?.querySelector(".market-price");
      if (priceElement) {
        priceElement.textContent = result.price || "N/A";
      }
      console.log(result);
    } catch (err) {
      console.error("Error fetching top pick", symbol, err);
    }
  }

  topPicksSymbols.forEach((symbol) => {
    loadTopPicksData(symbol);
  });

  //// TOP PICKS ////

  //// SEARCH STOCKS ////
  searchButton.addEventListener("click", async () => {
    const searchQuery = stockInput.value.trim(); // REMOVES WHITESPACE

    // CLEAR INPUTS //
    stockInput.value = "";
    searchContainer.innerHTML = "";

    if (!searchName) {
      console.warn("Indtast et søgeord");
      return;
    }

    try {
      const response = await fetch(
        `/api/stocks/search?query=${encodeURI(searchQuery)}`
      );
      const result = await response.json();

      if (!response.ok) {
        throw new Error("Error when fetchin response from database");
        return;
      } else if (!result.length) {
        console.warn("Ingen resultater fundet");
        return;
      }

      result.forEach(({ symbol, name }) => {
        const stockNameItem = document.createElement("p");
        stockNameItem.innerHTML = `
                <a href="../pages/security.html?symbol=${symbol}">
                        ${name} (${symbol})
                </a>`;
      });
    } catch (err) {
      console.error("Search failed", err);
    }
  });
});
