// Reusable sidebar functionality

document.addEventListener("DOMContentLoaded", function () {
  // Function to set active sidebar navigation item based on current page
  function setActiveSidebarItem() {
    // current page path
    const currentPath = window.location.pathname;

    // all navigation items
    const navItems = document.querySelectorAll(".sideBarNav .nav-item");

    // Remove active class from all items first
    navItems.forEach((item) => {
      item.classList.remove("active");
    });

    // Determine which nav item should be active based on the current path

    // Dashboard page (home page)
    if (
      currentPath.includes("dashboard") ||
      currentPath === "/" ||
      currentPath.endsWith("index.html")
    ) {
      document.querySelector(".nav-item:nth-child(1)").classList.add("active");

      // portfolio page
    } else if (currentPath.includes("portfolio")) {
      document.querySelector(".nav-item:nth-child(2)").classList.add("active");


      // security page
    } else if (
      currentPath.includes("security") ||
      currentPath.includes("aktier")
    ) {
      document.querySelector(".nav-item:nth-child(3)").classList.add("active");



      // also security page
    } else if (
      currentPath.includes("securities-news") ||
      currentPath.includes("værdipapirer-nyheder")
    ) {
      document.querySelector(".nav-item:nth-child(3)").classList.add("active");


      // transactions page
    } else if (
      currentPath.includes("transactions") ||
      currentPath.includes("transaktioner")
    ) {
      document.querySelector(".nav-item:nth-child(4)").classList.add("active");


      // settings page (bottom)
    } else if (
      currentPath.includes("settings") ||
      currentPath.includes("indstillinger")
    ) {
      document
        .querySelector(".setting-item:nth-child(1)")
        .classList.add("active");
    }
  }

  // Set active item when page loads
  setActiveSidebarItem();

  // Setup logout button functionality
  const logoutButton =
    document.getElementById("logoutButton") ||
    document.querySelector(".signOut");
  if (logoutButton) {
    logoutButton.addEventListener("click", function (event) {
      event.preventDefault();

      // This would be replaced with actual logout logic when implemented
      console.log("Logging out...");

      // For now, redirect to login page after "logout"
      // In the real implementation, you'd make an API call to logout first
      window.location.href = "/src/pages/login.html";
    });
  }

  // Make sure all sidebar links work properly
  const sidebarLinks = document.querySelectorAll(".sideBar a");
  sidebarLinks.forEach((link) => {
    link.addEventListener("click", function (event) {
      // Don't apply this to the logout button which has its own handler
      if (link.classList.contains("signOut")) {
        return; // Skip this link as it's handled above
      }

      // Let the browser handle navigation normally
      // This function can be expanded later when needed
    });
  });
});
