document.addEventListener("DOMContentLoaded", function () {
  const loginForm = document.getElementById("loginForm");

  if (!loginForm) {
    console.error("Login form not found in the document!");
    return;
  }

  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const email = document.getElementById("email").value;
    const password = document.getElementById("current-password").value;

    try {
      const response = await fetch("http://localhost:3000/api/database/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const result = await response.json();
      if (response.ok) {
        // Set sessionstorage for user data 
        sessionStorage.setItem("userId", result.id);

        // store name for display
        sessionStorage.setItem("userFirstname", result.firstname);
        sessionStorage.setItem("userLastname", result.lastname);
        sessionStorage.setItem("userAvatar", result.avatar);

        alert("Login successful");

        window.location.href = "../pages/dashboard.html";
      } else {
        alert("Login failed: " + result.message);
      }
    } catch (err) {
      console.error("Failed to login:", err);
      alert("Failed to login");
    }
  });
});
