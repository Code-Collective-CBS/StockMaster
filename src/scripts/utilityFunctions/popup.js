import { loadAccounts } from './loadAccounts.js';
import { currencyHandler } from './currencyConverter.js'

export const popUps = {
    accountDetails: async () => {
        await loadAccounts(); // Refresh window.cachedAccounts

        const selectedAccountId = sessionStorage.getItem('selectedAccountId');
        const accounts = window.cachedAccounts || [];
        return accounts.find(acc => acc.account_id == selectedAccountId) || null;
    },

    allPortfolioDetails: async (accountId) => {
        const selectedAccountId = accountId;

        try {
            const response = await fetch(`/api/database/portfolio/account/${selectedAccountId}`);
            if (!response.ok) throw new Error('Failed to fetch account portfolios');

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error fetching portfolios', error);
            return [];
        }
    },

    // NEW NEED MORE WORK
    currencyConverter: async (amount, fromCurrency, toCurrency) => {
        try {
            const reponse = await fetch(`/api/currency/exchange/${fromCurrency}`);
            const data = await reponse.json();

            const converted = await currencyHandler.convertCurrency(
                amount,
                fromCurrency,
                toCurrency,
                data
            );

            return converted;

        } catch (error) {
            console.error('Error fetching rates for currency conversion', error);
            throw error;
        }
    },

    getStockQuantityInPortfolio: async (symbol, portfolioId) => {
        try {
            const selectedAccountId = sessionStorage.getItem('selectedAccountId');
            const portfolios = await popUps.allPortfolioDetails(selectedAccountId);

            const portfolio = portfolios.find(p => p.id == portfolioId);
            if (!portfolio) return 0;

            const holding = portfolio.holdings.find(h => h.symbol === symbol);
            return holding ? holding.quantity : 0;
        } catch (error) {
            console.error('Failed to get stock quantity in portfolio', error);
            return 0;
        }
    },

    setupDepositPopup: () => {
        const button = document.getElementById("depositButton");

        if (!button) return console.log("Could not find #depositButton button");

        button.addEventListener("click", async () => {
            if (document.getElementById("depositModal")) return;

            const modal = document.createElement("div");
            modal.id = "depositModal";
            modal.classList.add("modal-wrapper");
            modal.innerHTML = `
            <div class="modal-overlay"></div>
            <div class="modal-content">
                <span class="modal-close">&times;</span>
                <div class="modal-toggle">
                    <button class="toggle-btn active" data-type="deposit">Deposit</button>
                    <button class="toggle-btn" data-type="withdraw">Withdraw</button>
                </div>
                <div class="modal-form">
                    <p class="account-name"></p>
                    <p class="modal-instruction">Enter amount to deposit:</p>
                    <div class="input-group">
                        <input id="popup-amount" type="number" placeholder="Amount" />
                        <span class="currency-label" id="accountCurrency">USD</span>
                    </div>
                    <button id="confirmAction" class="btn btn-primary">Confirm</button>
                </div>
            </div>
            `;
            document.body.appendChild(modal);

            const selectedAccount = await popUps.accountDetails();

            const accountNamePara = modal.querySelector('.account-name');
            accountNamePara.innerHTML = `Account: ${selectedAccount.account_name}`;

            const currencySpan = modal.querySelector("#accountCurrency");
            const userCurrency = selectedAccount.currency;
            currencySpan.textContent = userCurrency;

            // Close modal
            modal.querySelector(".modal-close").addEventListener("click", () => modal.remove());
            modal.querySelector(".modal-overlay").addEventListener("click", () => modal.remove());

            // Toggle logic
            const toggleButtons = modal.querySelectorAll(".toggle-btn");
            const instruction = modal.querySelector(".modal-instruction");

            toggleButtons.forEach((btn) => {
                btn.addEventListener("click", () => {
                    toggleButtons.forEach((b) => b.classList.remove("active"));
                    btn.classList.add("active");

                    const type = btn.getAttribute("data-type");
                    instruction.textContent = `Enter amount to ${type}:`;
                });
            });

            // Confirm logic (you can expand this)
            modal.querySelector("#confirmAction").addEventListener("click", () => {
                const activeType = modal.querySelector(".toggle-btn.active").dataset.type;
                const amount = modal.querySelector('#popup-amount');

                if (activeType == 'deposit') {
                    depositToAccount(amount);
                    amount.value = '';
                } else if (activeType == 'withdraw') {
                    withdrawingFromAccount(amount);
                    amount.value = '';
                }

                console.log(`User wants to ${activeType} ${amount.value}`);
                modal.remove(); // Optional: auto-close after action
            });
        });


        const depositToAccount = async (amountInput) => {
            const amount = parseFloat(amountInput.value);
            const selectedAccountId = sessionStorage.getItem('selectedAccountId');

            try {
                const response = await fetch(`/api/database/deposit-to-account/${selectedAccountId}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ amount }),
                });

                const result = await response.json();
                if (response.status === 201) {
                    alert("Deposit succesfull");

                    await popUps.accountDetails();
                } else {
                    alert("Failed to deposit", result.message);
                }
            } catch (error) {
                console.error("Failed to deposit: ", error);
            }
        };

        const withdrawingFromAccount = async (amountInput) => {
            const amount = parseFloat(amountInput.value);
            const selectedAccountId = sessionStorage.getItem('selectedAccountId');

            try {
                const response = await fetch(`/api/database/withdraw-to-account/${selectedAccountId}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ amount }),
                });

                const result = await response.json();
                if (response.status === 201) {
                    alert("Withdraw succesfull");

                    await popUps.accountDetails();
                } else {
                    alert("Failed to withdraw: " + result.message);
                }
            } catch (error) {
                console.error("Failed to Withdraw", error);
            }
        }
    },

    buySecurity: () => {
        const buyButton = document.getElementById('buyButton');

        if (!buyButton) return console.log('Could not find #buyButton');

        buyButton.addEventListener('click', async () => {
            if (document.getElementById('tradeModal')) return;

            const tradeModal = document.createElement('div');
            tradeModal.id = 'tradeModal';
            tradeModal.classList.add('modal-wrapper');
            tradeModal.innerHTML = `
            <div class="modal-overlay"></div>
            <div class="modal-content">
                <span class="modal-close">&times;</span>
                <div class="modal-form">
                    <p class="account-name"></p>
                    <p class="modal-instruction">Enter amount to buy</p>
                    <select id="popup-portfolios-select"></select>
                    <div class="input-group">
                        <input id="buy-amount" type="number" placeholder="Amount" />
                    </div>
                    <p class="stock-price-info">Price per share: <span id="stock-price"></span></p>
                    <p class="total-price-info">Total price: <span id="total-price">0</span></p>
                    <p class="account-balance-info">Available balance: <span id="account-balance"></span></p>
                    <button id="confirmAction" class="btn btn-primary">Confirm</button>
                </div>
            </div>
            `;
            document.body.appendChild(tradeModal);

            const dropdown = tradeModal.querySelector('#popup-portfolios-select');
            const amountInput = tradeModal.querySelector('#buy-amount');
            const totalPriceSpan = tradeModal.querySelector('#total-price')

            const selectedAccount = await popUps.accountDetails();
            const stockPriceSpan = tradeModal.querySelector("#stock-price");
            const accountBalanceSpan = tradeModal.querySelector("#account-balance");

            amountInput.addEventListener("input", async () => {
                const amount = parseFloat(amountInput.value);
                let total = amount * window.latestStockPrice;

                // Currency conversion for display
                if(window.securityCurrency !==  selectedAccount.currency) {
                    total = await popUps.currencyConverter(total, window.securityCurrency, selectedAccount.currency);
                }

                if (!isNaN(total)) {
                    totalPriceSpan.textContent = `${total.toFixed(2)} ${selectedAccount.currency}`;
                } else {
                    totalPriceSpan.textContent = `0 ${selectedAccount.currency}`;
                }
            });

            stockPriceSpan.textContent = `${window.latestStockPrice} ${window.securityCurrency}`;
            accountBalanceSpan.textContent = `${selectedAccount.total_balance} ${selectedAccount.currency}`;

            const allPortfolioDetails = await popUps.allPortfolioDetails(selectedAccount.account_id);

            allPortfolioDetails.forEach(portfolio => {
                const option = document.createElement('option');
                option.classList.add('popup-portfolios-option');
                option.value = portfolio.id;
                option.textContent = portfolio.name;

                dropdown.appendChild(option);
            });

            const accountNamePara = tradeModal.querySelector('.account-name');
            accountNamePara.innerHTML = `Account: ${selectedAccount.account_name}`;

            // Close modal
            tradeModal.querySelector('.modal-close').addEventListener('click', () => tradeModal.remove());
            tradeModal.querySelector('.modal-overlay').addEventListener('click', () => tradeModal.remove());

            tradeModal.querySelector('#confirmAction').addEventListener('click', async () => {
                const amount = parseFloat(amountInput.value);
                const latestPrice = window.latestStockPrice; // Saved in security.js

                const selectedPortfolio = tradeModal.querySelector('#popup-portfolios-select').value;
                const symbol = window.urlParams.get("symbol");

                if (!amount || isNaN(latestPrice) || !selectedPortfolio || !symbol) {
                    alert('Missing or invalid input');
                }

                // HELPER VARIABLE TO SEND BODY AS OBJECT
                const payload = {
                    account_id: selectedAccount.account_id,
                    symbol,
                    amount,
                    price_per_share: latestPrice,
                    security_currency: window.securityCurrency
                };

                try {
                    const response = await fetch(`/api/database/buy-security/${selectedPortfolio}`, {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(payload)
                    });

                    const result = await response.json();
                    console.log("Transaction ID: ", result.transaction_id)


                    if (response.status === 201) {
                        alert(`Successfully bought ${amount} shares of ${symbol} at ${latestPrice} per share.`);

                        const refreshedAccount = await popUps.accountDetails();
                        accountBalanceSpan.textContent = `${refreshedAccount.total_balance} ${refreshedAccount.currency}`;
                        window.location.reload(); // MAYBE SMOTHER UX LATER - BUT NEED FOR UPDATING HOLDINGS OF SECURITY
                    } else {
                        alert('Transaction failed: ', result.message);
                    }
                } catch (error) {
                    console.error('Buy request failed: ', result.message);
                }

                tradeModal.remove();
                console.log(`User wants to buy paylod: `, payload);
            });
        });
    },

    sellSecurity: () => {
        const sellButton = document.getElementById('sellButton');
        if (!sellButton) return console.log('Could not find #sellButton');

        sellButton.addEventListener('click', async () => {
            if (document.getElementById('tradeModal')) return;

            let currentQuantityHeld = 0; // To cache amount

            const tradeModal = document.createElement('div');
            tradeModal.id = 'tradeModal';
            tradeModal.classList.add('modal-wrapper');
            tradeModal.innerHTML = `
            <div class="modal-overlay"></div>
            <div class="modal-content">
                <span class="modal-close">&times;</span>
                <div class="modal-form">
                    <p class="account-name"></p>
                    <p class="modal-instruction">Enter amount to sell</p>
                    <select id="popup-portfolios-select"></select>
                    <div class="input-group">
                        <input id="sell-amount" type="number" placeholder="Amount" />
                    </div>
                    <p class="stock-price-info">Price per share: <span id="stock-price"></span></p>
                    <p class="total-price-info">Total price: <span id="total-price">0</span></p>
                    <p class="portfolio-amount-info">You own: <span id="owned-quantity">-</span></p>
                    <p class="account-balance-info">Available balance: <span id="account-balance"></span></p>
                    <button id="confirmAction" class="btn btn-primary">Confirm</button>
                </div>
            </div>
            `;
            document.body.appendChild(tradeModal);

            const symbol = urlParams.get("symbol");
            const dropdown = tradeModal.querySelector('#popup-portfolios-select');
            const amountInput = tradeModal.querySelector('#sell-amount');
            const totalPriceSpan = tradeModal.querySelector('#total-price');
            const stockPriceSpan = tradeModal.querySelector("#stock-price");
            const accountBalanceSpan = tradeModal.querySelector("#account-balance");
            const ownedQuantitySpan = tradeModal.querySelector('#owned-quantity');

            const selectedAccount = await popUps.accountDetails();
            const allPortfolioDetails = await popUps.allPortfolioDetails(selectedAccount.account_id);

            // Populate dropdown
            allPortfolioDetails.forEach(portfolio => {
                const option = document.createElement('option');
                option.classList.add('popup-portfolios-option');
                option.value = portfolio.id;
                option.textContent = portfolio.name;
                dropdown.appendChild(option);
            });

            // Initial UI setup
            stockPriceSpan.textContent = `${window.latestStockPrice} ${window.securityCurrency}`;
            accountBalanceSpan.textContent = `${selectedAccount.total_balance} ${selectedAccount.currency}`;
            const accountNamePara = tradeModal.querySelector('.account-name');
            accountNamePara.innerHTML = `Account: ${selectedAccount.account_name}`;

            // Update quantity display
            const updateOwnedQuantity = async () => {
                const portfolioId = dropdown.value;
                const quantity = await popUps.getStockQuantityInPortfolio(symbol, portfolioId);
                currentQuantityHeld = quantity; // Cache for later use
                ownedQuantitySpan.textContent = `${quantity} shares`;
            };

            await updateOwnedQuantity();
            dropdown.addEventListener('change', updateOwnedQuantity);

            // Calculate total on input
            amountInput.addEventListener("input", async () => {
                const amount = parseFloat(amountInput.value);
                let total = amount * window.latestStockPrice;

                // Currency conversion for display
                if(window.securityCurrency !==  selectedAccount.currency) {
                    total = await popUps.currencyConverter(total, window.securityCurrency, selectedAccount.currency);
                }

                if (!isNaN(total)) {
                    totalPriceSpan.textContent = `${total.toFixed(2)} ${selectedAccount.currency}`;
                } else {
                    totalPriceSpan.textContent = `0 ${selectedAccount.currency}`;
                }

                // Clear any previous error
                const existingError = tradeModal.querySelector("#sell-error-message");
                if (existingError) existingError.remove();

                // Add error if amount is too high
                if (!isNaN(amount) && amount > currentQuantityHeld) {
                    const errorMsg = document.createElement("p");
                    errorMsg.id = "sell-error-message";
                    errorMsg.style.color = "red";
                    errorMsg.style.marginTop = "6px";
                    errorMsg.textContent = `You only own ${currentQuantityHeld} shares in this portfolio.`;

                    amountInput.parentElement.appendChild(errorMsg);
                }
            });

            // Close modal
            tradeModal.querySelector('.modal-close').addEventListener('click', () => tradeModal.remove());
            tradeModal.querySelector('.modal-overlay').addEventListener('click', () => tradeModal.remove());

            // Confirm sell
            tradeModal.querySelector('#confirmAction').addEventListener('click', async () => {
                const amount = parseFloat(amountInput.value);
                const selectedPortfolio = dropdown.value;
                const latestPrice = window.latestStockPrice;

                if (!amount || isNaN(latestPrice) || !selectedPortfolio || !symbol) {
                    alert('Missing or invalid input');
                    return;
                }

                if (amount > currentQuantityHeld) {
                    alert(`You only own ${currentQuantityHeld} shares in this portfolio.`);
                    return;
                }

                const payload = {
                    account_id: selectedAccount.account_id,
                    symbol,
                    amount,
                    price_per_share: latestPrice,
                    security_currency: window.securityCurrency
                };

                try {
                    const response = await fetch(`/api/database/sell-security/${selectedPortfolio}`, {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(payload)
                    });

                    const result = await response.json();
                    console.log("Transaction ID:", result.transaction_id);

                    if (response.status === 201) {
                        alert(`Successfully sold ${amount} shares of ${symbol} at ${latestPrice} per share.`);
                        const refreshedAccount = await popUps.accountDetails();
                        accountBalanceSpan.textContent = `${refreshedAccount.total_balance} ${refreshedAccount.currency}`;
                        window.location.reload();
                    } else {
                        alert('Transaction failed: ' + result.message);
                    }
                } catch (error) {
                    console.error('Sell request failed:', error);
                    alert('An error occurred while processing your sell request.');
                }

                tradeModal.remove();
            });
        });
    },

    createPortfolio: () => {
        const addPortfolioButton = document.getElementById('addPortfolioButton');

        if (!addPortfolioButton) return console.log('Could not find #addPortfolioButton');

        addPortfolioButton.addEventListener('click', () => {
            // If pop-up already exists - do nothing.
            if (document.getElementById('portfolioPopupModal')) return;

            // Otherwise - build modal
            const modal = document.createElement('div');
            modal.id = 'portfolioPopupModal';
            modal.classList.add('modal-wrapper');

            modal.innerHTML = `
            <div class="modal-overlay"></div>
            <div class="modal-content">
              <span class="modal-close">&times;</span>
              <div class="modal-form">
                <h2>Add portfolio</h2>
                <input type="text" id="portfolioNameInput" placeholder="Portfolio name" />
                <button id="savePortfolioButton" class="btn btn-primary">Save</button>
              </div>
            </div>
          `;

            document.body.appendChild(modal);

            // Close pop-up
            modal.querySelector('.modal-close').addEventListener('click', () => modal.remove());
            modal.querySelector('.modal-overlay').addEventListener('click', () => modal.remove());

            // Save portfolio
            modal.querySelector('#savePortfolioButton').addEventListener('click', async () => {
                const nameInput = modal.querySelector('#portfolioNameInput');
                const portfolioName = nameInput.value.trim();

                if (portfolioName === '') {
                    alert('Please enter a portfolio name');
                    return;
                }

                const selectedAccountId = sessionStorage.getItem('selectedAccountId');

                try {
                    const response = await fetch(`/api/database/createPortfolio/${selectedAccountId}`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ portfolioName })
                    });

                    const result = await response.json();

                    if (response.status === 201) {
                        alert('Portfolio successfully created');
                        modal.remove();
                    } else {
                        alert('Failed: ' + result.message);
                    }
                } catch (err) {
                    console.error('Failed to create portfolio:', err);
                    alert('Failed to create portfolio');
                }
            });
        });
    }
};
// >&times is an HTML entity and represents x 