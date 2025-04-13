document.addEventListener("DOMContentLoaded", function () {
  const loginForm = document.getElementById("loginForm");

  if (!loginForm) {
    console.error("Login form not found in the document!");
    return;
  }

  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const email = document.getElementById("email").value;
    const password = document.getElementById("adgangskode").value;

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
        // Store user data in localStorage
        localStorage.setItem("userId", result.id);
        localStorage.setItem("userFirstname", result.firstname);
        localStorage.setItem("userLastname", result.lastname);

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
