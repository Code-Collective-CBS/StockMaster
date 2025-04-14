// Wait until the page is fully loaded
document.addEventListener("DOMContentLoaded", () => {
  const dropdown = document.getElementById('account-select');

  getUserInfo();
  loadAccountDropdown(dropdown);

  if (dropdown) {
    dropdown.addEventListener('change', () => {
      const selectedValue = dropdown.value;

      if (selectedValue === 'create-account.html') {
        window.location.href = `/src/pages/${selectedValue}`;
      } else {
        sessionStorage.setItem('selectedAccountId', selectedValue);
        console.log("Account switched to:", selectedValue); // Maybe delete later?
      }
    });
  }
});

const CONFIG = {
  paths: {
    dashboard: ["dashboard", "index.html"],
    portfolio: ["portfolio"],
    securities: ["security", "securities-news"],
    transactions: ["transactions"],
    settings: ["profile-settings", "account-settings"]
  },
  selectors: {
    navItems: ".nav-item",
    settingItem: ".setting-item",
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

  removeAllActiveClasses();

  if (isPathMatch(currentPath, CONFIG.paths.dashboard)) {
    setActiveNavItem(1);
  } else if (isPathMatch(currentPath, CONFIG.paths.portfolio)) {
    setActiveNavItem(2);
  } else if (isPathMatch(currentPath, CONFIG.paths.securities)) {
    setActiveNavItem(3);
  } else if (isPathMatch(currentPath, CONFIG.paths.transactions)) {
    setActiveNavItem(4);
  } else if (isPathMatch(currentPath, CONFIG.paths.settings)) {
    setActiveSettingItem();
  }
}

function handleNavigation() {
  const sidebarLinks = document.querySelectorAll(CONFIG.selectors.sidebarLinks);

  sidebarLinks.forEach((link) => {
    link.addEventListener("click", (event) => {
      if (link.classList.contains("signOut")) return;

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
    signOutButton.addEventListener("click", (event) => {
      event.preventDefault();
      handleSignOut();
    });
  }
}

function removeAllActiveClasses() {
  const elements = document.querySelectorAll(`${CONFIG.selectors.navItems}, ${CONFIG.selectors.settingItem}`);
  elements.forEach(item => item.classList.remove("active"));
}

function setActiveNavItem(index) {
  const navItem = document.querySelector(`${CONFIG.selectors.navItems}:nth-child(${index})`);
  if (navItem) {
    navItem.classList.add("active");
  }
}

function setActiveSettingItem() {
  const settingItem = document.querySelector(`${CONFIG.selectors.settingItem}`);
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
    window.location.href = "/src/pages/login.html";
  } catch (error) {
    console.error("Sign out failed:", error);
  }
}

const getUserInfo = async () => {
  try {
    const response = await fetch('http://localhost:3000/api/database/userInfo');
    const data = await response.ok ? await response.json() : null;

    if (data && data.user) {
      // Sets avatar picture
      const firstname = data.user.firstname;
      const lastname = data.user.lastname;
      const avatarSeed = data.user.avatar;

      const avatarURL = `https://api.dicebear.com/7.x/adventurer/svg?seed=${avatarSeed}`;
      const avatarElement = document.getElementById('profile-avatar');

      if (avatarElement) avatarElement.src = avatarURL;

      // Set name
      document.getElementById('profile-name').textContent = `${firstname} ${lastname}`;

    } else {
      document.getElementById('profile-name').textContent = 'N/A';
    }
  } catch (err) {
    console.error('Could not get user data', err);
    document.getElementById('profile-name').textContent = 'User not found';
  }
};

const loadAccountDropdown = async (dropdown) => {
  try {
    const response = await fetch('/api/database/get-accounts');
    const { data: accounts } = await response.json();
    window.cachedAccounts = accounts; // Frontend cache for user accounts not using server-side cache with npm

    const currentPath = window.location.pathname; // Used for if statement

    if ((!accounts || accounts.length === 0) && !currentPath.includes('create-account.html')) {
      alert("You need to create an account");
      return window.location.href = `/src/pages/create-account.html`;
    }
    if (!dropdown) return;

    dropdown.innerHTML = ''; // Clear existing options
    const storedId = sessionStorage.getItem('selectedAccountId');

    accounts.forEach((account, index) => {
      const option = document.createElement('option');
      option.value = account.account_id;
      option.textContent = `${account.account_name} (${account.currency})`;

      // (!storedId && index === 0) if the user has not selected and account the first accounts get selected
      if ((storedId && storedId == account.account_id) || (!storedId && index === 0)) {
        option.selected = true;
        sessionStorage.setItem('selectedAccountId', account.account_id);
      }

      dropdown.appendChild(option);
    });

    const createAccount = document.createElement('option');
    createAccount.value = 'create-account.html';
    createAccount.textContent = '-- Tilføj Konto --';
    dropdown.appendChild(createAccount);
  } catch (error) {
    console.error('Error fetching accounts for sidebar', error);
  }
};