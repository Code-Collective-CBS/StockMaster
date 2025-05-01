// Chooses avatar
document.addEventListener('DOMContentLoaded', () =>{
    const avatarOptions = document.querySelectorAll('.avatar-option');
    const avatarInput = document.getElementById('selectedAvatar');

    // Enable to choose between avatar before creating user
    avatarOptions.forEach((avatar) => {
        avatar.addEventListener('click', () => {
            avatarOptions.forEach((avatarElement) => avatarElement.classList.remove('selected'));
            avatar.classList.add('selected');
            avatarInput.value = avatar.dataset.avatar;
        })
    })
})

document.getElementById("registerForm").addEventListener("submit", async function (event) {
    event.preventDefault(); // Prevents standard form-handling

    // Load inputs from the sign-up form
    const firstname = document.getElementById("firstname").value;
    const lastname = document.getElementById("lastname").value;
    const email = document.getElementById("email").value;
    const phone_number = document.getElementById("telefon").value;
    const password = document.getElementById("new-password").value;
    const avatar = document.getElementById('selectedAvatar').value;


    // Sends sign-up data to backend via fetch
    try {
        const response = await fetch("http://localhost:3000/api/database/users", {
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
                avatar,
            })
        });

        const result = await response.json();
        if (response.status === 201) {
            alert("User succesfully created");
            window.location.href = "../pages/dashboard.html" // Redirects user to dashboard
        } else {
            alert("Fail: " + result.message)
        }
    } catch (error) {
        console.log("Failed to create user: " + error)
        alert("Failed to create user")
    }
});