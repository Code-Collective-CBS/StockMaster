import { loadAccounts } from "./utilityFunctions/loadAccounts.js";
import { searchFunction } from "./utilityFunctions/searchFunction.js";

document.addEventListener('DOMContentLoaded', () => {
    // For currency-search function
    const deleteButton = document.querySelector(".delete-search");
    const searchContainer = document.querySelector(".displaySearch");
    // Account details
    const account_currency = document.getElementById('account_currency');
    const account_state = document.getElementById('account_state');
    const account_name = document.getElementById('account_name');
    const saveAcc = document.getElementById('changeAcc')
    const deleteAcc = document.getElementById('deleteAcc')

    // Fetch account name and put in placeholder

    //// BUTTONS ////
    deleteButton.addEventListener('click', () => {
        account_currency.value = '';
        searchContainer.innerHTML = '';
    });

    //// SEARCH CURRENCIES ////
    account_currency.addEventListener('input', async () => {
        const searchQuery = account_currency.value.trim();

        if (searchQuery.length === 0) searchContainer.innerHTML = '';
        if (searchQuery.length < 1) return

        try {
            const data = await searchFunction.searchCurrencies(searchQuery);
            displaySearchResults(data);
        } catch (err) {
            console.error('Error fetching search results: ', err);
        }
    });

    // Display search results
    const displaySearchResults = function (searchResults) {
        searchContainer.innerHTML = ""; // Clear previous results

        if (!searchResults || searchResults.length === 0) {
            searchContainer.innerHTML = '<p>No results</p>';
            return;
        }

        searchResults.forEach((currency) => {
            const currencyElement = document.createElement('div');
            currencyElement.classList.add('currency-result-div');

            currencyElement.innerHTML = `
            <p class="currency-result-p">${currency.currency_name}</p>
        `;
            currencyElement.addEventListener('click', () => {
                account_currency.value = currency.currency_name;
                searchContainer.innerHTML = '';
            });
            searchContainer.appendChild(currencyElement);
        });
    };
    // 

    /// CHANGE ACCOUNT DETAILS

    // Steps:
    // 1. Fetch account name and put in placeholder
    // 2. Make route: databaseRoutes -> databaseController -> databaseServices
    // 3. Create function in databaseController
    // 4. Make SQL query in databaseSerivces so its able to change account- name, currency and status in database

    saveAcc.addEventListener('click', async () => {

        // Gets the accountID from sidebar.js
        const account_id = sessionStorage.getItem('selectedAccountId');

        const name = account_name.value;
        const currency = account_currency.value.trim();
        const state = account_state.value

        try {

            const response = await fetch(`http://localhost:3000/api/database/update-account-settings/${account_id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json" // JSON data
                },
                body: JSON.stringify({
                    account_name: name,
                    account_currency: currency,
                    account_state: state
                })
            });

            const result = await response.json()
            if (response.status === 201) {
                alert("Account changes saved");
                window.location.href = "../pages/dashboard.html" // Redirects user to login-page
            } else {
                alert("Fail: " + result.message)
            }
        } catch (error) {
            console.log("Failed to change account settings: " + error)
            alert("Failed to change account settings")
        }
    })
});