export const popUps = {
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

            const selectedAccount = accountDetails();

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

        const accountDetails = () => {
            const selectedAccountId = sessionStorage.getItem('selectedAccountId');
            const accounts = window.cachedAccounts || [];
            return accounts.find(acc => acc.account_id == selectedAccountId) || null;
        };

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
                    modal.querySelector(".modal-close").click(); // Click close popup
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
                if(response.status === 201) {
                    alert("Withdraw succesfull");
                    modal.querySelector(".modal-close").click();
                } else {
                    alert("Failed to Withdraw", result.message);
                }
            } catch (error) {
                console.error("Failed to Withdraw", error);
            }
        }
    }
};
// >&times is an HTML entity and represents x 