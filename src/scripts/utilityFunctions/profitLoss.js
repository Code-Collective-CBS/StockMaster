import { loadTransactions } from "./loadTransactions.js";
import { loadAccounts } from "./loadAccounts.js";
import { stockAPI } from "../stockScripts/api.js";
import { currencyHandler } from "./currencyConverter.js";

export const profitLoss = {
    realizedPL: async () => {
        await loadAccounts();

        const selectedAccountId = sessionStorage.getItem("selectedAccountId");
        const selectedAccount = window.cachedAccounts.find(
            (acc) => acc.account_id == selectedAccountId
        );

        if (!selectedAccount) {
            console.warn("No account selected");
            return { realizedSum: 0, currency: "" };
        }

        const accountCurrency = selectedAccount.currency;
        const currencyRates = await stockAPI.getCurrency(accountCurrency);

        const loadedTransactions = await loadTransactions();
        const transactions = loadedTransactions.data
            .filter((tx) => tx.account_id == selectedAccountId)
            .reverse(); // SQL gives descending; we need ascending

        const symbolMap = {}; // Track average cost and quantity
        let totalRealizedPL = 0;

        for (const tx of transactions) {
            const symbol = tx.symbol;
            const type = tx.transaction_type;
            const qty = Number(tx.amount);
            const totalAccountValue = currencyHandler.convertCurrency(
                Number(tx.total_price),
                tx.account_currency,
                accountCurrency,
                currencyRates
            );

            console.log('txx.total_price', tx.total_price);

            if (!symbolMap[symbol]) {
                symbolMap[symbol] = {
                    totalQty: 0,
                    totalCost: 0,
                };
            }

            const entry = symbolMap[symbol];

            if (type === "buy") {
                entry.totalQty += qty;
                entry.totalCost += totalAccountValue;
            } else if (type === "sell") {
                if (entry.totalQty === 0) {
                    console.warn(`Skipping sell of ${symbol} — no holdings`);
                    continue;
                }

                const avgCost = entry.totalCost / entry.totalQty;
                const sellProceeds = totalAccountValue;
                const costBasis = avgCost * qty;
                const realizedGain = sellProceeds - costBasis;

                totalRealizedPL += realizedGain;

                // Update holding state
                entry.totalQty -= qty;
                entry.totalCost -= costBasis;

                // Debug log
                console.log(`[REALIZED] ${symbol}: Sold ${qty} at ${sellProceeds.toFixed(2)}, GAK ${avgCost.toFixed(2)} → Gain ${realizedGain.toFixed(2)}`);
            }
        }

        return {
            realizedSum: totalRealizedPL.toFixed(2),
            currency: accountCurrency,
        };
    },
};
