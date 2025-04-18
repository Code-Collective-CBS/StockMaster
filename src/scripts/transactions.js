import { popUps } from "./utilityFunctions/popup.js";
import { loadTransactions } from "./utilityFunctions/loadTransactions.js";

document.addEventListener("DOMContentLoaded", async () => {
    // POP UP
    popUps.setupDepositPopup()
    popUps.createPortfolio();

    // Get transactions
    const data = await loadTransactions();
    displayTransactions(data);
});

function displayTransactions(data) {
    const transaction = data.data;

    const table = document.getElementById('transaction-table');
    const tableBody = document.querySelector('.tbody-transactions');

    const displayFields = [
        'transaction_date',
        'account_id',
        'portfolio_name',
        'security_type',
        'symbol',
        'price_per_share',
        'total_price'
    ];

    transaction.forEach((transactionObject) => {
        const tableRow = document.createElement('tr')

        Object.entries(transactionObject).forEach(([key, value]) => {
            const cell = document.createElement('td');

            // Formatting
            let value = transaction[field];
            if (field === 'transaction_type') {
                value = value.toUpperCase();
            }
            if (field === 'transaction_date') {
                value = new Date(value).toLocaleString(); // Pretty date
            }

            cell.textContent = value;
            tableRow.appendChild(cell);
        });

        tableBody.appendChild(tableRow);
    });

    table.appendChild(tableBody);
}