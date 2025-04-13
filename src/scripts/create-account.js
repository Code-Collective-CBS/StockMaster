document.addEventListener('DOMContentLoaded', () => {
    const createAccBtn = document.getElementById('createAcc')

    createAccBtn.addEventListener('click', async () => {
        const accountCurrency = document.getElementById('accountCurrency').value
        const accountName = document.getElementById('accountName').value

        if (accountCurrency === 'chooseCurrency' && accountName === "") return alert('Udfyld begge felter')
        if (accountCurrency === 'chooseCurrency') return alert('Du skal vælge en valuta')
        if (accountName === "") return alert('Du skal indtaste et kontonavn')

        try {
            const response = await fetch("http://localhost:3000/api/database/create-account", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json" // JSON data
                },
                body: JSON.stringify({
                    accountName,
                    accountCurrency,
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
});

document.getElementById('cancel').addEventListener('click', () => {
    window.location.href = '../pages/dashboard.html';
});