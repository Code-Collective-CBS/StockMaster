export const popUps = {
    accountDetails: () => {
        const selectedAccountId = sessionStorage.getItem('selectedAccountId');
        const accounts = window.cachedAccounts || [];
        return accounts.find(acc => acc.account_id == selectedAccountId) || null;
    },

    portfolioDetails: async (accountId) => {
        const selectedAccountId = accountId;

        try {
            const response = await fetch(`api/database`)
        } catch (error) {

        }

        const accountPortfolios = null;
    },

    setupDepositPopup: () => {
        const button = document.getElementById("depositButton");

        if (!button) return console.log("Could not find #depositButton button");

        button.addEventListener("click", () => {
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

            const selectedAccount = popUps.accountDetails();

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
            const amount = amountInput.value;
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
                } else {
                    alert("Failed to deposit", result.message);
                }
            } catch (error) {
                console.error("Failed to deposit: ", error);
            }
        };

        const withdrawingFromAccount = async (amountInput) => {
            const amount = amountInput.value;
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

        buyButton.addEventListener('click', () => {
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
                    <p class="modal-instruction">Enter ammount to buy</p>
                    <select id="popup-portfolios"></select>
                    <div class="input-group">
                        <input id="buy-amount" type="number" placeholder="Amount" />
                        <span class="currency-label" id="security-currency"></span>
                    </div>
                    <button id="confirmAction" class="btn btn-primary">Confirm</button>
                </div>
            </div>
            `;
            document.body.appendChild(tradeModal);

            // const selectedAccount = accountDetails(); // NEEED TO CHECK SCOPE

            const accountNamePara = tradeModal.querySelector('.account-name');
            // accountNamePara.innerHTML = `Account: ${selectedAccount.account_name}`;

            const currencySpan = tradeModal.querySelector('#security-currency');
            const securityCurrency = null; // FIND SECURITY CURRENCY
            // currencySpan.textContent = securityCurrency;

            // Close modal
            tradeModal.querySelector('.modal-close').addEventListener('click', () => tradeModal.remove());
            tradeModal.querySelector('.modal-overlay').addEventListener('click', () => tradeModal.remove());

            tradeModal.querySelector('#confirmAction').addEventListener('click', () => {
                const amount = tradeModal.querySelector('#pop-amount');

                console.log(`User wants to buy: STOCKNAME, Amunt: AMOUNT`)
            })
        });
    },

    sellSecurity: () => {
        const sellButton = document.getElementById('sellButton');

        if (!sellButton) return console.log('Could not find #sellButton');

        sellButton.addEventListener('click', () => {
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
                    <p class="modal-instruction">Enter ammount to sell</p>
                    <div class="input-group">
                        <input id="buy-amount" type="number" placeholder="Amount" />
                        <span class="currency-label" id="security-currency"></span>
                    </div>
                    <button id="confirmAction" class="btn btn-primary">Confirm</button>
                    <select id="popup-portfolios"></select>
                </div>
            </div>
            `;
            document.body.appendChild(tradeModal);

            // const selectedAccount = accountDetails(); // NEEED TO CHECK SCOPE

            const accountNamePara = tradeModal.querySelector('.account-name');
            // accountNamePara.innerHTML = `Account: ${selectedAccount.account_name}`;

            const currencySpan = tradeModal.querySelector('#security-currency');
            const securityCurrency = null; // FIND SECURITY CURRENCY
            // currencySpan.textContent = securityCurrency;

            // Close modal
            tradeModal.querySelector('.modal-close').addEventListener('click', () => tradeModal.remove());
            tradeModal.querySelector('.modal-overlay').addEventListener('click', () => tradeModal.remove());

            tradeModal.querySelector('#confirmAction').addEventListener('click', () => {
                const amount = tradeModal.querySelector('#pop-amount');

                console.log(`User wants to sell`)
                console.log(`User wants to sell: STOCKNAME, Amunt: ${amount.value}`)
            })
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

                try {
                    const response = await fetch('http://localhost:3000/api/database/createPortfolio', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ portfolioName })
                    });

                    const result = await response.json();

                    if (response.status === 200) {
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