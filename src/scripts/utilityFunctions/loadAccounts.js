const loadAccounts = async () => {
    try {
        const response = await fetch('/api/database/get-accounts');
        const { data: accounts } = await response.json();
        window.cachedAccounts = accounts;
    } catch (error) {
        console.error("Failed to refresh cached accounts", error);
    }
};

export { loadAccounts };