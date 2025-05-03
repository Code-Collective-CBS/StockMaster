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
        console.log(accountCurrency)
        const currencyRates = await stockAPI.getCurrency(accountCurrency);
        console.log(currencyRates)

        const loadedTransactions = await loadTransactions();
        const transactions = loadedTransactions.data;

        // Aggregate buy/sell quantities and values per symbol
        const symbolMap = {};
        transactions.forEach(trans => {
            const type = trans.transaction_type.toLowerCase(); // 'buy' or 'sell'
            const symbol = trans.symbol;
            const qty = trans.amount;
            const priceRaw = trans.total_price;          // local currency amount
            const curr = trans.account_currency;

            // Convert transaction amount to account currency
            const amount = currencyHandler.convertCurrency(
                priceRaw, curr, accountCurrency, currencyRates
            );

            // Initialize map entry for symbol if missing
            if (!symbolMap[symbol]) {
                symbolMap[symbol] = {
                    buyQty: 0,
                    buyValue: 0,
                    sellQty: 0,
                    sellValue: 0
                };
            }
            const entry = symbolMap[symbol];

            if (type === 'buy') {
                // Accumulate buy quantity and value
                entry.buyQty += qty;
                entry.buyValue += amount;
            } else if (type === 'sell') {
                // Accumulate sell quantity and value
                entry.sellQty += qty;
                entry.sellValue += amount;
            }
        });

        // Calculate realized P/L using average entry/exit prices per symbol
        let totalRealizedPL = 0;
        Object.values(symbolMap).forEach(({ buyQty, buyValue, sellQty, sellValue }) => {
            // Only compute if there were buys and sells
            if (buyQty > 0 && sellQty > 0) {
                const avgEntryPrice = buyValue / buyQty;
                const avgExitPrice = sellValue / sellQty;
                // Realized P/L = (avg exit price − avg entry price) × quantity sold
                totalRealizedPL += (avgExitPrice - avgEntryPrice) * sellQty;
            }
        });

        return {
            realizedSum: totalRealizedPL.toFixed(2),
            currency: accountCurrency
        }
    }
};
