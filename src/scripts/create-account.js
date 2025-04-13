import { searchFunction } from "./utilityFunctions/searchFunction.js";

document.addEventListener('DOMContentLoaded', () => {
    // Search functions
    const deleteButton = document.querySelector(".delete-search");
    const searchContainer = document.querySelector(".displaySearch");
    // Account details
    const accountCurrency = document.getElementById('accountCurrency');
    const accountName = document.getElementById('accountName');
    const createAccBtn = document.getElementById('createAcc')

    //// BUTTONS ////
    deleteButton.addEventListener('click', () => {
        accountCurrency.value = '';
        searchContainer.innerHTML = '';
    });

    //// SEARCH CURRENCIES ////
    accountCurrency.addEventListener('input', async () => {
        const searchQuery = accountCurrency.value.trim();

        if (searchQuery.length === 0) searchContainer.innerHTML = '';
        if (searchQuery.length < 2) return

        try {
            const data = await searchFunction.searchStock(searchQuery);
            displaySearchResults(data);
        } catch (err) {
            console.error('Error fetching search results: ', err);
        }
    });

    // Display search results
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

    //// CREATE ACCOUNT ////
    createAccBtn.addEventListener('click', async () => {
        if (accountCurrency.value.trim() === 'chooseCurrency' && accountName === "") return alert('Udfyld begge felter')
        if (accountCurrency.value.trim() === 'chooseCurrency') return alert('Du skal vælge en valuta')
        if (accountName.value.trim() === "") return alert('Du skal indtaste et kontonavn')

        try {
            const response = await fetch("http://localhost:3000/api/database/create-account", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json" // JSON data
                },
                body: JSON.stringify({
                    accountName,
                    accountCurrency,
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
            console.log("Failed to create account: " + error)
            alert("Failed to create account")
        }
    });
});

document.getElementById('cancel').addEventListener('click', () => {
    window.location.href = '../pages/dashboard.html';
});