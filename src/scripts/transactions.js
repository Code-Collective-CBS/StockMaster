import { popUps } from "./utilityFunctions/popup.js";
import { stockAPI } from "./stockScripts/api.js";

document.addEventListener("DOMContentLoaded", () => {
    const table = document.getElementById('transaction-table');

    // POP UP
    popUps.setupDepositPopup()
    popUps.createPortfolio();

    getTransactionSummary();
});


async function getTransactionSummary (symbol) {
    try {
        const selectedAccount = sessionStorage.getItem('selectedAccountId');
        const portfolioSummary = await stockAPI.getPortfolioSummary(selectedAccount);
  
        console.log(portfolioSummary);
        return portfolioSummary;
    } catch (error) {
        console.error('Error fetching portfolios', error);
    }
};