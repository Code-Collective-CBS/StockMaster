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
            <p class="modal-instruction">Enter amount to deposit:</p>
            <div class="input-group">
            <input type="number" placeholder="Amount" />
            <span class="currency-label" id="accountCurrency">USD</span>
            </div>
            <button id="confirmAction" class="btn btn-primary">Confirm</button>
            </div>
            </div>
            `;
            
            document.body.appendChild(modal);
            const currencySpan = modal.querySelector("#accountCurrency");
            const userCurrency = "USD"; // or fetched later
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
                const amount = modal.querySelector("input").value;
                console.log(`User wants to ${activeType} ${amount}`);
                modal.remove(); // Optional: auto-close after action
            });
        });
    },
};

// >&times is an HTML entity and represents x 