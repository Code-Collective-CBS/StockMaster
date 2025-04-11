document.getElementById("createAcc").addEventListener("submit", async function (event) {
event.preventDefault(); // Prevents standard form-handling

// const button = document.getElementById("createAcc").value;
const accountName = document.getElementById("accountName").value;
const accountCurrency = document.getElementById("accountCurrency").value;
const accountState = document.getElementById("accountState").value;
    // Sends account data to backend via fetch
    try {
        const response = await fetch("http://localhost:3000/api/database/accounts", {
            method: "POST",
            headers: {
                "Content-Type": "application/json" // JSON data
            },
            body: JSON.stringify({
                accountName,
                accountCurrency,
                accountState
            })
        });

        const result = await response.json();
        if (response.status === 201) {
            alert("Account succesfully created");
            window.location.href = "../pages/dashboard.html" // Redirects user to login-page
        } else {
            alert("Fail: " + result.message)
        }
    } catch (error) {
        console.log("Failed to create account: " + error)
        alert("Failed to create account")
    }
});