export const popUps = {
    setupDepositPopup: () => {
        const button = document.getElementById('depositButton');

        if (!button) return console.log("Could not fint #depositButton button");

        button.addEventListener("click", () => {
            if (document.getElementById("depositModal")) return // Avoid duplicated popup/modal

            const modal = document.createElement("div");
            modal.id = "depositModal";
            modal.innerHTML = `
            <div class="modal-overlay"></div>
            <div class="modal-content">
                <span class="modal-close">&times;</span>
                <h2>Deposit Funds</h2>
                <p>Enter amount to deposit:</p>
                <input type="number" placeholder="Amount" />
             <button>Confirm</button>
            </div>
            `;
            modal.classList.add("modal-wrapper");

            document.body.appendChild(modal);

            modal.querySelector(".modal-close").addEventListener("click", () => {
                modal.remove();
            });
            modal.querySelector(".modal-overlay").addEventListener("click", () => {
                modal.remove();
            });
        });
    },
}