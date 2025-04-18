const { Transaction } = require('mssql');
const databaseServices = require('../services/databaseServices');
// CACHE
const cache = require("../utilityFunctions/cache");
const { getOrSetCache } = require('../utilityFunctions/cacheHelper');

const databaseController = {
    createUser: async (req, res) => {
        const { firstname, lastname, email, password, phone_number, country_code, avatar } = req.body;
        const body = req.body;
        if (!firstname || !lastname || !email || !password || !avatar) {
            return res.status(400).json({ message: "Manglende information" });
        }

        try {
            const result = await databaseServices.createUser(body);

            if (result.status === 400) {
                return res.status(400).json({ message: result.message });
            }

            // Save the user's ID in the session upon account creation
            req.session.user_id = result.userID;

            const user = await databaseServices.userInfo(result.userID);
            if (!user) {
                return res.status(404).json({ message: 'Fejl i database. Kunne ikke finde brugeren' });
            }

            res.status(201).json({
                message: "User created",
                fornavn: user.firstname,
                efternavn: user.lastname,
                avatar: user.avatar
            });
        } catch (err) {
            console.log(err);
            res.status(500).json({ message: "Fejl ved oprettelse af bruger" });
        }
    },

    login: async (req, res) => {
        const { email, password } = req.body;
        const body = req.body;

        try {
            const user = await databaseServices.login(body);

            if (user) {
                req.session.user_id = user.id;

                res.status(201).json({
                    message: "Login succesfull",
                    id: user.id,
                    firstname: user.firstname,
                    lastname: user.lastname,
                    avatar: user.avatar
                });
            } else {
                res.status(401).json({ message: 'Wrong username or password' });
            }
        } catch (err) {
            console.error('Login failed', err);
            res.status(500).json({ message: 'Intern serverfail' });
        }
    },

    // In databaseController.js - modify userInfo to include accounts
    userInfo: async (req, res) => {
        const userID = req.session.user_id;

        if (!userID) {
            return res.status(401).json({ message: 'Not authenticated' });
        }

        try {
            // Get basic user info
            const user = await databaseServices.userInfo(userID);
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }

            // Get accounts with portfolios
            const accounts = await databaseServices.getAccountInfo(userID);
            const accountsWithPortfolios = await Promise.all(
                accounts.map(async account => ({
                    ...account,
                    portfolios: await databaseServices.getPortfoliosByAccount(account.id)
                }))
            );

            res.status(200).json({
                user: {
                    firstname: user.firstname,
                    lastname: user.lastname,
                    email: user.email,
                    avatar: user.avatar
                },
                accounts: accountsWithPortfolios
            });
        } catch (err) {
            console.error('Error getting user info:', err);
            res.status(500).json({ message: 'Server error' });
        }
    },

    getUserProfile: async (req, res) => {
        const userID = req.session.user_id;

        if (!userID) {
            return res.status(401).json({ message: 'Bruger ikke logget ind' });
        }

        try {
            const user = await databaseServices.userInfo(userID);

            if (!user) {
                return res.status(401).json({ message: 'Brugeren findes ikke' })
            }

            res.status(200).json({
                firstname: user.firstname,
                lastname: user.lastname,
                email: user.email,
                phone: user.phone_number,
                avatar: user.avatar
            })
        } catch (err) {
            console.log('Fejl ved hentning af profil', err);
            res.status(500).json({ message: 'Fejl i database' })
        }
    },

    updateUserProfile: async (req, res) => {
        const userID = req.session.user_id;

        if (!userID) {
            return res.status(401).json({ message: "Fail by gathering id" })
        }

        const { firstname, lastname, email, phone_number, newPassword, avatar } = req.body;
        const body = req.body;

        try {
            const result = await databaseServices.updateProfile(userID, body);

            if (!result.success) {
                return res.status(400).json({ message: result.message })
            }
            res.status(200).json({ message: 'Profile updated' })
        } catch (err) {
            console.log('Fail by updating profile', err);
            res.status(500).json({ message: 'Database fail' })
        }
    },

    createAccount: async (req, res) => {
        const { accountName, accountCurrency } = req.body;
        // Fetches the users id from the session
        const userID = req.session.user_id;

        try {
            const account = await databaseServices.createAccount(userID, accountName, accountCurrency)

            if (!userID) {
                return res.status(401).json({ message: 'User not found' });
            }

            // Deletes existing cache for accounts-user_id (sets new cache automatically afterwards)
            const cacheKey = `accounts-user_id-${userID}`;
            cache.del(cacheKey);

            if (!account) {
                return res.status(400).json({ message: 'Fail in databaseServices' })
            }

            res.status(201).json({
                message: "Account created",
                accountName: account.accountName,
                accountCurrency: account.accountCurrency
            });
        } catch (err) {
            res.status(500).json({ message: "Failed trying to create account", err });
        }
    },

    getAllAccountsForUser: async (req, res) => {
        try {
            const userId = req.session.user_id

            if (!userId) {
                return res.status(400).json({ error: "User ID is required" });
            }

            const cacheKey = `accounts-user_id-${userId}`;
            const { data, source } = await getOrSetCache(
                cacheKey,
                () => databaseServices.getAccountInfo(userId),
                600
            );

            if (!data || data.length === 0) {
                return res.status(404).json({ error: "No accounts found for this user" });
            }

            res.json({ data, source });
        } catch (err) {
            console.error("Error fetching user accounts:", err);
            res.status(500).json({ error: "Internal server error" });
        }
    },

    searchCurrencies: async (req, res) => {
        try {
            const { query } = req.query; // Extract the query parameter from the requesr

            if (!query) {
                return res.status(400).json({ error: 'Search query is required' }); // Handle missing query
            }
            const result = await databaseServices.searchCurrencies(query); // Call the service function
            res.json(result); // Send the result back to the client
        } catch (err) {
            console.error('Error searching for currencies:', err);
            res.status(500).json({ error: 'Failed to search for currencies' }); // Handle errors
        }
    },

    searchStockNames: async (req, res) => {
        try {
            const { query } = req.query; // Extract the query parameter from the request

            if (!query) {
                return res.status(400).json({ error: 'Search query is required' }); // Handle missing query
            }

            const result = await databaseServices.searchStockNames(query); // Call the service function
            res.json(result); // Send the result back to the client
        } catch (err) {
            console.error('Error searching for stocks:', err);
            res.status(500).json({ error: 'Failed to search for stocks' }); // Handle errors
        }
    },

    depositToAccount: async (req, res) => {
        try {
            const user_id = req.session.user_id;
            const { accountId } = req.params;
            const { amount } = req.body; // { "amount": 500 }

            if (!user_id || !accountId) {
                return res.status(400).json({ error: 'User Id or Accound Id is required' });
            }

            // Acounts cache
            const cacheKeyAccounts = `accounts-user_id-${user_id}`;
            cache.del(cacheKeyAccounts);
            // Transaction cache
            const cacheKeyTransactions = `transactions-user_id-${user_id}`;
            cache.del(cacheKeyTransactions);

            const result = await databaseServices.depositToAccount(user_id, accountId, amount);
            res.status(201).json(result);
        } catch (error) {
            console.error(`Error depositing users id ${user_id} to account id: ${accountId}`, error);
        }
    },

    withdrawFromAccount: async (req, res) => {
        try {
            const user_id = req.session.user_id;
            const { accountId } = req.params;
            const { amount } = req.body;

            if (!user_id || !accountId) {
                return res.status(400).json({ error: 'User Id or account Id is required' });
            }

            // Acounts cache
            const cacheKeyAccounts = `accounts-user_id-${user_id}`;
            cache.del(cacheKeyAccounts);
            // Transaction cache
            const cacheKeyTransactions = `transactions-user_id-${user_id}`;
            cache.del(cacheKeyTransactions);


            const result = await databaseServices.withdrawFromAccount(user_id, accountId, amount);
            res.status(201).json(result);
        } catch (error) {
            console.error(`Error withdrawing user's id ${req.session?.user_id} from account id: ${req.params?.accountId}`, error);

            if (error.message === "Insufficient funds") {
                return res.status(400).json({ message: "Insufficient funds" });
            }

            return res.status(500).json({ message: "Something went wrong during withdrawal" });
        }
    },

    createPortfolio: async (req, res) => {
        // Saves the user- and account id from the session in a variable.
        const userId = req.session.user_id
        const accountId = parseInt(req.params.accountId);
        const { portfolioName } = req.body;

        try {
            const newPortfolio = await databaseServices.createPortfolio(accountId, portfolioName)

            // Checks if the user has an existing account
            if (!accountId) {
                return res.status(401).json({ message: 'User not found or logged in' });
            }

            if (!newPortfolio) {
                return res.status(400).json({ message: 'Fail in databaseServices' })
            }

            res.status(201).json({
                message: `Portfolio created on account: ${accountId}`,
                portfolioName: newPortfolio.portfolioName
            });
        } catch (err) {
            res.status(500).json({ message: "Failed trying to create portfolio", err });
        }
    },

    buySecurity: async (req, res) => {
        try {
            const user_id = req.session.user_id;
            const { portfolioId } = req.params;

            const { accountId, symbol, amount, price_per_share, security_currency } = req.body;

            if (!user_id || !portfolioId || !accountId || !symbol || !amount || !price_per_share) {
                return res.status(400).json({ message: "Missing required fields" });
            }

            const result = await databaseServices.buyOrSellSecurity({
                userId: user_id,
                accountId,
                portfolioId,
                symbol,
                amount,
                price_per_share,
                transaction_type: 'buy',
                security_currency
            });

            // Acounts cache
            const cacheKeyAccounts = `accounts-user_id-${user_id}`;
            cache.del(cacheKeyAccounts);
            // Transaction cache
            const cacheKeyTransactions = `transactions-user_id-${user_id}`;
            cache.del(cacheKeyTransactions);

            res.status(201).json({
                message: "Security bought",
                transaction_id: result.transaction_id

            });

        } catch (error) {
            console.error('Error buying security', error);
            res.status(500).json({ message: "Something went wrong trying to buy security" });
        }
    },

    sellSecurity: async (req, res) => {
        try {
            const user_id = req.session.user_id;
            const { portfolioId } = req.params;

            const { accountId, symbol, amount, price_per_share, security_currency } = req.body;

            if (!user_id || !portfolioId || !accountId || !symbol || !amount || !price_per_share) {
                return res.status(400).json({ message: "Missing required fields" });
            }

            const result = await databaseServices.buyOrSellSecurity({
                userId: user_id,
                accountId,
                portfolioId,
                symbol,
                amount,
                price_per_share,
                transaction_type: 'sell',
                security_currency
            });

            // Acounts cache
            const cacheKeyAccounts = `accounts-user_id-${user_id}`;
            cache.del(cacheKeyAccounts);
            // Transaction cache
            const cacheKeyTransactions = `transactions-user_id-${user_id}`;
            cache.del(cacheKeyTransactions);

            res.status(201).json({
                message: "Security sold",
                transaction_id: result.transaction_id

            });

        } catch (error) {
            console.error('Error selling security', error);
            res.status(500).json({ message: "Something went wrong trying to sell security" });
        }
    },

    getTransactionsSummary: async (req, res) => {
        try {
            const user_id = req.session.user_id;
            const account_id = parseInt(req.params.accountId); // Convert accountId (defined in routes) to an interger (string -> number) because of sql.Int
    
            if(!user_id || !account_id) {
                return res.status(400).json({ message: "Missing credentials to get transaction" });
            }
        
            const cacheKey = `transactions-user_id-${user_id}`;
            const { data, source } = await getOrSetCache(
                cacheKey,
                () => databaseServices.getTransactionsSummary(user_id, account_id),
                600
            );
    
            if (!data || data.length === 0) {
                return res.status(404).json({ error: "No accounts found for this user" });
            }
    
            res.json({ data, source });
        } catch (error) {
            console.error('Error in transactions summary', error);
            res.status(500).json({ message: 'Something went wrong trying to get transactions' });
        }
    }
};

module.exports = databaseController;