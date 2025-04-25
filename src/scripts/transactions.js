import { popUps } from "./utilityFunctions/popup.js";
import { loadTransactions } from "./utilityFunctions/loadTransactions.js";

document.addEventListener("DOMContentLoaded", async () => {
    // POP UP
    popUps.setupDepositPopup()
    popUps.createPortfolio();

    // Get transactions
    const transactionData = await loadTransactions();
    displayTransactions(transactionData);

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
        'currency',
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
    const accounts = window.cachedAccounts; // Using window from ../scripts/utilityFunctions/loadAccounts.js and used inside sidebar.js for fresh account data when user switich account

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