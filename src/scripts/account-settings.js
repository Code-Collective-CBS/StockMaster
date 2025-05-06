import { searchFunction } from "../scripts/utilityFunctions/searchFunction.js";
import { loadAccounts } from "./utilityFunctions/loadAccounts.js";

// For currency-search function
const deleteButton = document.querySelector(".delete-search");
const searchContainer = document.querySelector(".displaySearch");

// Account details
const account_currency = document.getElementById("account_currency");
const account_state = document.getElementById("account_state");
const account_name = document.getElementById("account_name");
const saveAcc = document.getElementById("changeAcc");

// Gets the accountID from sidebar.js. Covnerts to number because session-/localStorage always return number.
const account_id = Number(sessionStorage.getItem("selectedAccountId"));

document.addEventListener("DOMContentLoaded", () => {
  // Display account-info
  displayAccounts();

  //// BUTTONS ////
  deleteButton.addEventListener("click", () => {
    account_currency.value = "";
    searchContainer.innerHTML = "";
  });

  //// SEARCH CURRENCIES ////
  account_currency.addEventListener("input", async () => {
    const searchQuery = account_currency.value.trim();

    if (searchQuery.length === 0) searchContainer.innerHTML = "";
    if (searchQuery.length < 1) return;

    try {
      const data = await searchFunction.searchCurrencies(searchQuery);
      displaySearchResults(data);
    } catch (err) {
      console.error("Error fetching search results: ", err);
    }
  });

  // Display search results
  const displaySearchResults = function (searchResults) {
    searchContainer.innerHTML = ""; // Clear previous results

    if (!searchResults || searchResults.length === 0) {
      searchContainer.innerHTML = "<p>No results</p>";
      return;
    }

    searchResults.forEach((currency) => {
      const currencyElement = document.createElement("div");
      currencyElement.classList.add("currency-result-div");

      currencyElement.innerHTML = `
            <p class="currency-result-p">${currency.currency_name}</p>
        `;
      currencyElement.addEventListener("click", () => {
        account_currency.value = currency.currency_name;
        searchContainer.innerHTML = "";
      });
      searchContainer.appendChild(currencyElement);
    });
  };

  /// CHANGE ACCOUNT DETAILS
  saveAcc.addEventListener("click", async () => {
    const name = account_name.value;
    const currency = account_currency.value.trim();
    const state = account_state.value;

    try {
      const response = await fetch(
        `http://localhost:3000/api/database/update-account-settings/${account_id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            account_name: name,
            account_currency: currency,
            account_state: state,
          }),
        }
      );

      const result = await response.json();
      if (response.status === 201) {

        alert("Account changes saved");
        window.location.href = "../pages/dashboard.html";
      } else {
        alert("Fail: " + result.message);
      }
    } catch (error) {
      console.error("Failed to change account settings: " + error);
      alert("Failed to change account settings");
    }
  });
});

// Function to display account-info in account-settings.
const displayAccounts = async () => {
  // Gets the accountinfo from the cache and saves in a variable.
  await loadAccounts();
  const accounts = window.cachedAccounts;

  // Searches all acounts for the user and finds the one that matches the account_id from the session.
  let selectedAccount;
  accounts.forEach((account) => {
    if (account.account_id === account_id) selectedAccount = account;
  });

  if (!selectedAccount) {
    console.log("Could not find account with id: ", account_id);
    return;
  }

  // Sets the value
  account_name.value = selectedAccount.account_name;
  account_currency.value = selectedAccount.currency;
  account_state.value = selectedAccount.state;
};
