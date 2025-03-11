document.addEventListener("DOMContentLoaded", function () {
  // Configuration
  const CONFIG = {
    paths: {
      dashboard: ["dashboard", "index.html"],
      portfolio: ["portfolio"],
      securities: ["security", "securities-news"],
      transactions: ["transactions"],
      settings: ["profile-settings", "profile", "account-settings"]
    },
    selectors: {
      navItems: ".sideBarNav .nav-item",
      settingItems: ".setting-item",
      sidebarLinks: ".sideBar a",
      signOutButton: ".signOut"
    }
  };

  // Initialize sidebar functionality
  initializeSidebar();

  function initializeSidebar() {
    try {
      handleNavigation();
      setActiveSidebarItem();
      setupSignOut();
    } catch (error) {
      console.error("Error initializing sidebar:", error);
    }
  }

  function setActiveSidebarItem() {
    const currentPath = window.location.pathname.toLowerCase();

    // Remove all active classes first
    removeAllActiveClasses();

    // Set active class based on current path
    if (isPathMatch(currentPath, CONFIG.paths.dashboard)) {
      setActiveNavItem(1);
    } else if (isPathMatch(currentPath, CONFIG.paths.portfolio)) {
      setActiveNavItem(2);
    } else if (isPathMatch(currentPath, CONFIG.paths.securities)) {
      setActiveNavItem(3);
    } else if (isPathMatch(currentPath, CONFIG.paths.transactions)) {
      setActiveNavItem(4);
    } else if (isPathMatch(currentPath, CONFIG.paths.settings)) {
      setActiveSettingItem(1);
    }
  }

  function handleNavigation() {
    const sidebarLinks = document.querySelectorAll(CONFIG.selectors.sidebarLinks);

    sidebarLinks.forEach((link) => {
      link.addEventListener("click", function (event) {
        // Skip if it's the logout button
        if (link.classList.contains("signOut")) {
          return;
        }

        event.preventDefault();
        const href = link.getAttribute("href");

        if (href) {
          updateActiveState(link);
          navigateToPage(href);
        }
      });
    });
  }

  function setupSignOut() {
    const signOutButton = document.querySelector(CONFIG.selectors.signOutButton);
    if (signOutButton) {
      signOutButton.addEventListener("click", function (event) {
        event.preventDefault();
        handleSignOut();
      });
    }
  }

  // Helper functions
  function removeAllActiveClasses() {
    const elements = document.querySelectorAll(`${CONFIG.selectors.navItems}, ${CONFIG.selectors.settingItems}`);
    elements.forEach(item => item.classList.remove("active"));
  }

  function setActiveNavItem(index) {
    const navItem = document.querySelector(`${CONFIG.selectors.navItems}:nth-child(${index})`);
    if (navItem) {
      navItem.classList.add("active");
    }
  }

  function setActiveSettingItem(index) {
    const settingItem = document.querySelector(`${CONFIG.selectors.settingItems}:nth-child(${index})`);
    if (settingItem) {
      settingItem.classList.add("active");
    }
  }

  function isPathMatch(currentPath, pathArray) {
    return pathArray.some(path => currentPath.includes(path.toLowerCase()));
  }

  function updateActiveState(clickedLink) {
    removeAllActiveClasses();
    const parentItem = clickedLink.closest(".nav-item, .setting-item");
    if (parentItem) {
      parentItem.classList.add("active");
    }
  }

  function navigateToPage(href) {
    try {
      window.location.href = href;
    } catch (error) {
      console.error("Navigation failed:", error);
    }
  }

  function handleSignOut() {
    try {
      // Clear any stored user data
      localStorage.removeItem("userSession");
      sessionStorage.clear();

      // Redirect to login page
      window.location.href = "/src/pages/login.html";
    } catch (error) {
      console.error("Sign out failed:", error);
    }
  }
});