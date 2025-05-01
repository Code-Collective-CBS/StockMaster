import { popUps } from "./utilityFunctions/popup.js";
import { loadTransactions } from "./utilityFunctions/loadTransactions.js";
import {loadAccounts } from './utilityFunctions/loadAccounts.js'

document.addEventListener("DOMContentLoaded", async () => {
    // POP UP
    popUps.setupDepositPopup()
    popUps.createPortfolio();

    // Get transactions
    const transactionData = await loadTransactions();
    displayTransactions(transactionData);

    // Load accounts for balance
    await loadAccounts();
    displayAccountSummary();
});

function displayTransactions(transactionData) {
    const transaction = transactionData.data;

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
        'security_currency', // currency of the security column name in db named currency_id
        'total_price',
        'account_currency' // account_currency at the time of transaction
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
    const accounts = window.cachedAccounts; // Using window from ../scripts/utilityFunctions/loadAccounts.js and are called in DOM (note before was it called inside sidebar.js but the accounts could not load)

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