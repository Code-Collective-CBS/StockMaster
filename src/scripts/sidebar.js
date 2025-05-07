import { loadAccounts } from '../scripts/utilityFunctions/loadAccounts.js';

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
        window.location.reload(); // Force reload to fetch new data
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
    signOutButton: "#signOut-item"
  }
};


// Initialize sidebar functionality
initializeSidebar();

function initializeSidebar() {
  try {
    handleNavigation();
    setActiveSidebarItem();
    setupSignOut();
    initializeThemeToggle();
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
  const navItems = document.querySelectorAll(`${CONFIG.selectors.navItems}, ${CONFIG.selectors.settingItem}`);

  navItems.forEach(item => {
    item.addEventListener('click', () => {
      const href = item.getAttribute('data-href');
      if (href) {
        updateActiveState(item);
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
    sessionStorage.clear();

    window.location.href = "/src/pages/login.html";
  } catch (error) {
    console.error("Sign out failed:", error);
  }
}

const getUserInfo = async () => {
  try {
    // Checking for session storrage
    const firstname = sessionStorage.getItem('userFirstname');
    const lastname = sessionStorage.getItem('userLastname');
    const avatarSeed = sessionStorage.getItem('userAvatar');

    if (firstname && lastname && avatarSeed) {
      // If exists in sessionstorrage use it
      const avatarURL = `https://api.dicebear.com/7.x/adventurer/svg?seed=${avatarSeed}`;
      const avatarElement = document.getElementById('profile-avatar');

      if (avatarElement) avatarElement.src = avatarURL;

      document.getElementById('profile-name').textContent = `${firstname} ${lastname}`;
    } else {
      // If it dosent exist fetch it
      const response = await fetch('http://localhost:3000/api/database/userInfo');
      const data = await response.ok ? await response.json() : null;

      if (data && data.user) {
        // Sets avatar picture
        const firstname = data.user.firstname;
        const lastname = data.user.lastname;
        const avatarSeed = data.user.avatar;

        // Save in sessionstorrage
        sessionStorage.setItem('userFirstname', firstname);
        sessionStorage.setItem('userLastname', lastname);
        sessionStorage.setItem('userAvatar', avatarSeed);

        const avatarURL = `https://api.dicebear.com/7.x/adventurer/svg?seed=${avatarSeed}`;
        const avatarElement = document.getElementById('profile-avatar');

        if (avatarElement) avatarElement.src = avatarURL;

        document.getElementById('profile-name').textContent = `${firstname} ${lastname}`;
      } else {
        document.getElementById('profile-name').textContent = 'N/A';
      }
    }
  } catch (error) {
    console.error('Could not get user data', error);
    document.getElementById('profile-name').textContent = 'User not found';
  }
};

function initializeThemeToggle() {
  const themeToggle = document.getElementById('theme-toggle');

  if (themeToggle) {
    //
    const savedTheme = sessionStorage.getItem('theme');

    // use savedTheme
    if (savedTheme === 'light') {
      document.body.classList.add('light-theme');
      themeToggle.classList.add('active');
    }
    themeToggle.addEventListener('click', () => {

      themeToggle.classList.toggle('active');


      document.body.classList.toggle('light-theme');

      // save in sessionStorage
      const isLightTheme = document.body.classList.contains('light-theme');
      sessionStorage.setItem('theme', isLightTheme ? 'light' : 'dark');
    });
  }
}


const loadAccountDropdown = async (dropdown) => {
  try {
    await loadAccounts(); // Frontend cache for user accounts not using server-side cache with npm
    const accounts = window.cachedAccounts || [];

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

    const storedIdNum = Number(storedId);
    const onAccSettingsPage = window.location.pathname.endsWith('account-settings.html');
    const onProfileSettingsPage = window.location.pathname.endsWith('profile-settings.html');
    const onCreateAccPage = window.location.pathname.endsWith('create-account.html');

    // If we're already on the settings page, don't execute the for-loop
    if (!onAccSettingsPage && !onCreateAccPage && !onProfileSettingsPage) {
      // Running through all of the users account to find the chosen account
      for (const account of accounts) {
        if (account.account_id === storedIdNum && account.state === 'inactive') {
          alert('You need to activate your account');
          window.location.href = '/src/pages/account-settings.html';
          break;
        }
      }
    }


    const createAccount = document.createElement('option');
    createAccount.value = 'create-account.html';
    createAccount.textContent = '-- Add new account --';
    dropdown.appendChild(createAccount);
  } catch (error) {
    console.error('Error fetching accounts for sidebar', error);
  }
};