document.getElementById("registerForm").addEventListener("submit", async function (event) {
    event.preventDefault(); // Prevents standard form-handling

    // Load inputs from the sign-up form
    const firstname = document.getElementById("fornavn").value;
    const lastname = document.getElementById("efternavn").value;
    const email = document.getElementById("email").value;
    const phone_number = document.getElementById("telefon").value;
    const password = document.getElementById("password").value;
    const country_code = "DK"; // Evt. hardcode eller hent fra dropdown senere


    // Sends sign-up data to backend via fetch
    try {
        const response = await fetch("http://localhost:3000/api/users", {
            method: "POST",
            headers: {
                "Content-Type": "application/json" // JSON data
            },
            body: JSON.stringify({
                firstname,
                lastname,
                email,
                password,
                phone_number,
                country_code
            })
        });

        const result = await response.json();
        if (response.status === 201) {
            alert("User succesfully created");
            window.location.href = "../pages/dashboard.html" // Redirects user to login-page
        } else {
            alert("Fail: " + result.message)
        }
    } catch (error) {
        console.log("Failed to create user: " + error)
        alert("Failed to create user")
    }
});