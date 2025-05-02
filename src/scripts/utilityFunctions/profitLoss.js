import { loadTransactions } from "./loadTransactions.js";
import { loadAccounts } from "./loadAccounts.js";
import { stockAPI } from "../stockScripts/api.js";
import { currencyHandler } from "./currencyConverter.js";

export const profitLoss = {
    realizedPL: async () => {
        // Fetch accounts and transactions
        await loadAccounts();
        const selectedAccountId = sessionStorage.getItem("selectedAccountId");
        const selectedAccount = window.cachedAccounts
            .find(acc => acc.account_id == selectedAccountId);
        const accountCurrency = selectedAccount.currency;
        const currencyRates = await stockAPI.getCurrency(accountCurrency);

        const loadedTransactions = await loadTransactions();
        const transactions = loadedTransactions.data
            // Sort chronologically for FIFO calculation
            .sort((a, b) => new Date(a.date) - new Date(b.date));

        // Map per symbol to track current position and cost basis
        const positionMap = {};
        let totalRealizedPL = 0;

        for (const trans of transactions) {
            const type = trans.transaction_type.toLowerCase(); // 'buy' or 'sell'
            const symbol = trans.symbol;
            const qty = trans.quantity;
            const priceRaw = trans.total_price;                   // local currency amount
            const curr = trans.account_currency;

            // Convert to account currency
            const amount = currencyHandler.convertCurrency(
                priceRaw, curr, accountCurrency, currencyRates
            );

            // Initialize new symbol entry if needed
            if (!positionMap[symbol]) {
                positionMap[symbol] = { totalQty: 0, totalCost: 0 };
            }
            const pos = positionMap[symbol];

            if (type === 'buy') {
                // Add purchase
                pos.totalQty += qty;
                pos.totalCost += amount;
            }
            else if (type === 'sell') {
                if (pos.totalQty <= 0) {
                    console.warn(`Sale of ${symbol} without position!`);
                    continue;
                }
                // Calculate average cost basis
                const avgCostPerUnit = pos.totalCost / pos.totalQty;
                // Cost basis for this sale
                const costBasis = avgCostPerUnit * qty;
                // Realized P/L = sale proceeds − cost basis
                const realized = amount - costBasis;
                totalRealizedPL += realized;

                // Update position
                pos.totalQty -= qty;
                pos.totalCost -= costBasis;
            }
        }

        // Return only if there is realized P/L
        if (totalRealizedPL !== 0) {
            return {
                realizedSum: totalRealizedPL.toFixed(2),
                currency: accountCurrency
            };
        }
    }
};