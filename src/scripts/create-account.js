import { searchFunction } from "./utilityFunctions/searchFunction.js";

document.addEventListener('DOMContentLoaded', () => {
    // For currency-search function
    // const deleteButton = document.querySelector(".delete-search");
    const searchContainer = document.querySelector(".displaySearch");
    // Account details
    const account_currency = document.getElementById('accountCurrency');
    const account_name = document.getElementById('accountName');
    const account_bank = document.getElementById('bank');
    const createAccBtn = document.getElementById('createAcc')

    // //// BUTTONS ////
    // deleteButton.addEventListener('click', () => {
    //     account_currency.value = '';
    //     searchContainer.innerHTML = '';
    // });

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

    //// CREATE ACCOUNT ////
    createAccBtn.addEventListener('click', async () => {

        const name = account_name.value.trim();
        const currency = account_currency.value.trim();
        const bank = account_bank.value;

        if (currency === '' && name === '' && bank === '') return alert('Please fill out all fields')
        if (currency === '') return alert('You must choose a currency')
        if (name === '') return alert('You must choose an account name')
        if (bank === '') return alert('You must choose a bank for your account')

        try {

            const response = await fetch("http://localhost:3000/api/database/create-account", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json" // JSON data
                },
                body: JSON.stringify({
                    account_name: name,
                    account_currency: currency,
                    account_bank: bank
                })
            });

            const result = await response.json();
            if (response.status === 201) {
                alert("Account succesfully created");
                window.location.href = "../pages/dashboard.html" // Redirects user to login-page
            } else {
                alert("Fail: " + result.message)
            }
        } catch (error) {
            console.error("Failed to create account: " + error)
            alert("Failed to create account")
        }
    });
});

document.getElementById('cancel').addEventListener('click', () => {
    window.location.href = '../pages/dashboard.html';
});