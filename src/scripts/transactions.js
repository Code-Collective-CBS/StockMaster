import { popUps } from "./utilityFunctions/popup.js";
import { loadTransactions } from "./utilityFunctions/loadTransactions.js";
import { stockAPI } from "./stockScripts/api.js";

// PRESENT IN THE SECURITIES-NEWS.JS MAYBE MOVE IT?
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

document.addEventListener("DOMContentLoaded", async () => {
    // POP UP
    popUps.setupDepositPopup()
    popUps.createPortfolio();

    // Get transactions
    const data = await loadTransactions();
    displayTransactions(data);

    displayAccountSummary();

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
});

function displayTransactions(data) {
    const transaction = data.data;

    const table = document.getElementById('transaction-table');
    const tableBody = document.querySelector('.tbody-transactions');

    // Custome order for td in table with bracket notation 
    const displayFields = [
        'transaction_date',
        'account_name',
        'portfolio_name',
        'transaction_type',
        'security_type',
        'symbol',
        'amount',
        'price_per_share',
        'total_price'
    ];

    transaction.forEach((transactionObject) => {
        const tableRow = document.createElement('tr');

        displayFields.forEach((field) => {
            const cell = document.createElement('td');
            let value = transactionObject[field]; // Need to resign value for formating

            // Formatting
            if (field === 'transaction_type') {
                value = value.toUpperCase();
            }
            if (field === 'transaction_date') {
                value = new Date(value).toLocaleString();
            }

            cell.textContent = value;
            tableRow.appendChild(cell);
        });

        tableBody.appendChild(tableRow);
    });

    table.appendChild(tableBody);
};

const displayAccountSummary = () => {
    const accounts = window.cachedAccounts;

    if (!accounts || accounts.length === 0) {
        console.warn("No cached accounts available.");
        return;
    }
    const table = document.getElementById('balance-table');
    const tableBody = table.querySelector('.tbody-balance');

    const displayFields = [
        "currency",
        "account_name",
        "total_balance"
    ];

    accounts.forEach((acount) => {
        const tableRow = document.createElement('tr');

        displayFields.forEach((field) => {
            const cell = document.createElement('td');
            const value = acount[field];

            cell.textContent = value;

            tableRow.appendChild(cell);
        });

        tableBody.appendChild(tableRow);
    });
};

