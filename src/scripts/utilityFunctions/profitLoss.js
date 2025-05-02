import { loadTransactions } from "./loadTransactions.js";
import { loadAccounts } from "./loadAccounts.js";
import { stockAPI } from "../stockScripts/api.js";
import { currencyHandler } from "./currencyConverter.js";

export const profitLoss = {
    realizedPL: async () => {
        // Dashboard Realized and Unrealized Profit/Loss variables
        await loadAccounts();
        const selectedAccountId = sessionStorage.getItem("selectedAccountId");
        const accounts = window.cachedAccounts;
        const selectedAccount = accounts.find((acc) => acc.account_id == selectedAccountId) || null;
        const loadedTransactions = await loadTransactions();
        const transactions = loadedTransactions.data;
        let sumOfBoughtTransactions = 0;
        let sumOfSoldTransactions = 0;
        const accountCurrency = selectedAccount.currency;
        const currencyRates = await stockAPI.getCurrency(accountCurrency);

        // List for unique currencies for the transactions from our accounts
        // Loops through transactions to identify different currencies
        for (let i = 0; i < 2; i++) {
            const type = i === 0 ? 'buy' : 'sell'; // First time looping check for 'buy'
            const currencyList = [];

            transactions.forEach(trans => {
                const currency = trans.account_currency;
                if (!currency) return;

                // Variable to check if the currency exists
                let exists = false;

                // Loops through our currencyList to see if we already have the currency
                for (const index in currencyList) {
                    if (currencyList[index].currency === currency) {
                        exists = true;
                        break; // If yes - break
                    }
                }
                // If no - add the currency to our list with sum
                if (!exists) {
                    currencyList.push({ currency, sum: 0 });
                }
            });

            // Loops through all transactions for the account
            for (let i = 0; i < transactions.length; i++) {
                if (transactions[i].transaction_type === type) {
                    // We loop through our currencyList
                    for (let j = 0; j < currencyList.length; j++) {
                        // If the currency in our currencyList is equal to the currency for the transaction
                        if (currencyList[j].currency === transactions[i].account_currency)
                            // We add it to our list
                            currencyList[j].sum += transactions[i].total_price
                    }
                }
            };


            if (type === 'buy') {
                for (let i = 0; i < currencyList.length; i++) {
                    sumOfBoughtTransactions += currencyHandler.convertCurrency(currencyList[i].sum, currencyList[i].currency, accountCurrency, currencyRates)
                }
            } else if (type === 'sell') {
                for (let i = 0; i < currencyList.length; i++) {
                    sumOfSoldTransactions += currencyHandler.convertCurrency(currencyList[i].sum, currencyList[i].currency, accountCurrency, currencyRates)
                }
            }
        }
        console.log('sum of buy transactions', sumOfBoughtTransactions);
        console.log('sum of sold transactions', sumOfSoldTransactions);
        if (sumOfSoldTransactions !== 0) {
            const realizedProfitLoss = (sumOfSoldTransactions - sumOfBoughtTransactions).toFixed(2)
            return { realizedSum: realizedProfitLoss, currency: accountCurrency };
        }
    }
};