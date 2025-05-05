const databaseServices = require('../services/databaseServices');
// CACHE
const cache = require("../utilityFunctions/cache");
const { getOrSetCache } = require('../utilityFunctions/cacheHelper');

const databaseController = {
    createUser: async (req, res) => {
        const { firstname, lastname, email, password, phone_number, avatar } = req.body;
        const body = req.body;
        if (!firstname || !lastname || !email || !password || !phone_number || !avatar) {
            return res.status(400).json({ message: "Missing information" });
        }

        try {
            const result = await databaseServices.createUser(body);

            if (result.status === 400) {
                return res.status(400).json({ message: result.message });
            }

            // Save the user's ID in the session upon creating an account
            req.session.user_id = result.user_id;

            const user = await databaseServices.userInfo(result.user_id);
            if (!user) {
                return res.status(404).json({ message: 'Could not find user in database' });
            }

            res.status(201).json({
                message: "User created",
                firstname: user.firstname,
                lastname: user.lastname,
                avatar: user.avatar
            });
        } catch (err) {
            console.log(err);
            res.status(500).json({ message: "Fail by creating user" });
        }
    },

    login: async (req, res) => {
        const { email, password } = req.body;
        const body = req.body;

        try {
            const user = await databaseServices.login(body);

            if (user) {
                req.session.user_id = user.user_id;

                res.status(201).json({
                    message: "Login succesful",
                    id: user.user_id,
                    firstname: user.firstname,
                    lastname: user.lastname,
                    avatar: user.avatar
                });
            } else {
                res.status(401).json({ message: 'Wrong username or password' });
            }
        } catch (err) {
            console.error('Login failed', err);
            res.status(500).json({ message: 'Internal serverfail' });
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
        const user_id = req.session.user_id;

        if (!user_id) {
            return res.status(401).json({ message: 'User not logged in' });
        }

        try {
            const user = await databaseServices.userInfo(user_id);


            if (!user) {
                return res.status(401).json({ message: 'User dosent exists' })
            }

            res.status(200).json({
                firstname: user.firstname,
                lastname: user.lastname,
                email: user.email,
                phone_number: user.phone_number,
                avatar: user.avatar
            })
        } catch (err) {
            console.log('Fail by gathering profile info', err);
            res.status(500).json({ message: 'Fail in database' })
        }
    },

    updateUserProfile: async (req, res) => {
        const user_id = req.session.user_id;

        if (!user_id) {
            return res.status(401).json({ message: "Fail by gathering id" })
        }

        const { firstname, lastname, email, phone_number, newPassword, avatar } = req.body;
        const body = req.body;

        try {
            const result = await databaseServices.updateProfile(user_id, body);

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
        const { account_name, account_currency, account_bank } = req.body;
        // Fetches the users id from the session
        const user_id = req.session.user_id;

        try {
            const account = await databaseServices.createAccount(user_id, account_name, account_currency, account_bank)

            if (!user_id) {
                return res.status(401).json({ message: 'User not found' });
            }

            // Deletes existing cache for accounts-user_id (sets new cache automatically afterwards)
            const cacheKey = `accounts-user_id-${user_id}`;
            cache.del(cacheKey);

            if (!account) {
                return res.status(400).json({ message: 'Fail in databaseServices' })
            }

            res.status(201).json({
                message: "Account created",
                account_name: account.account_name,
                account_currency: account.account_currency,
                account_bank: account.account_bank
            });
        } catch (err) {
            res.status(500).json({ message: "Failed trying to create account", err });
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
            const account_id = parseInt(req.params.account_id);
            const { amount } = req.body; // { "amount": 500 }

            if (!user_id || !account_id) {
                return res.status(400).json({ error: 'User Id or Accound Id is required' });
            }

            // Acounts cache
            const cacheKeyAccounts = `accounts-user_id-${user_id}`;
            cache.del(cacheKeyAccounts);
            // Transaction cache
            const cacheKeyTransactions = `transactions-account_id-${account_id}`;
            cache.del(cacheKeyTransactions);

            const result = await databaseServices.depositToAccount(user_id, account_id, amount);
            res.status(201).json(result);
        } catch (error) {
            console.error(`Error depositing users id ${user_id} to account id: ${account_id}`, error);
        }
    },

    withdrawFromAccount: async (req, res) => {
        try {
            const user_id = req.session.user_id;
            const account_id = parseInt(req.params.account_id);
            const { amount } = req.body;

            if (!user_id || !account_id) {
                return res.status(400).json({ error: 'User Id or account Id is required' });
            }

            // Acounts cache
            const cacheKeyAccounts = `accounts-user_id-${user_id}`;
            cache.del(cacheKeyAccounts);
            // Transaction cache
            const cacheKeyTransactions = `transactions-account_id-${account_id}`;
            cache.del(cacheKeyTransactions);


            const result = await databaseServices.withdrawFromAccount(user_id, account_id, amount);
            res.status(201).json(result);
        } catch (error) {
            console.error(`Error withdrawing user's id ${req.session?.user_id} from account id: ${req.params?.account_id}`, error);

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
            const portfolio_id = parseInt(req.params.portfolio_id);

            const { account_id, symbol, amount, price_per_share, security_currency } = req.body;

            if (!user_id || !portfolio_id || !account_id || !symbol || !amount || !price_per_share) {
                return res.status(400).json({ message: "Missing required fields" });
            }

            const result = await databaseServices.buyOrSellSecurity({
                user_id,
                account_id,
                portfolio_id,
                symbol,
                amount,
                price_per_share,
                transaction_type: 'buy',
                security_currency
            });

            const accountCurrency = result.accountCurrency;

            // Acounts cache
            const cacheKeyAccounts = `accounts-user_id-${user_id}`;
            cache.del(cacheKeyAccounts);
            // Transaction cache
            const cacheKeyTransactions = `transactions-account_id-${account_id}`;
            cache.del(cacheKeyTransactions);
            // Portfolio cache
            const cacheKeyPortfolios = `portfolio-${account_id}-${accountCurrency}`;
            cache.del(cacheKeyPortfolios);

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
            const portfolio_id = parseInt(req.params.portfolio_id);

            const { account_id, symbol, amount, price_per_share, security_currency } = req.body;

            if (!user_id || !portfolio_id || !account_id || !symbol || !amount || !price_per_share) {
                return res.status(400).json({ message: "Missing required fields" });
            }

            const result = await databaseServices.buyOrSellSecurity({
                user_id,
                account_id,
                portfolio_id,
                symbol,
                amount,
                price_per_share,
                transaction_type: 'sell',
                security_currency
            });

            const accountCurrency = result.accountCurrency

            // Acounts cache
            const cacheKeyAccounts = `accounts-user_id-${user_id}`;
            cache.del(cacheKeyAccounts);
            // Transaction cache
            const cacheKeyTransactions = `transactions-account_id-${account_id}`;
            cache.del(cacheKeyTransactions);
            // Portfolio cache
            const cacheKeyPortfolios = `portfolio-${account_id}-${accountCurrency}`;
            cache.del(cacheKeyPortfolios);

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
            const account_id = parseInt(req.params.account_id); // Convert account_id (defined in routes) to an interger (string -> number) because of sql.Int

            if (!user_id || !account_id) {
                return res.status(400).json({ message: "Missing credentials to get transaction" });
            }

            const cacheKey = `transactions-account_id-${account_id}`;
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
    },

    updateAccountSettings: async (req, res) => {
        // Saves the user- and account id from the session in variables
        const user_id = req.session.user_id
        const account_id = parseInt(req.params.account_id);

        try {
            const { account_name, account_currency, account_state } = req.body;
            const changeAcc = await databaseServices.updateAccountSettings(user_id, account_id, account_name, account_currency, account_state)

            if (!changeAcc) return res.status(404).json({ message: 'Account not found' });

            // Clear cache
            const cacheKey = `accounts-user_id-${user_id}`;
            cache.del(cacheKey);

            const cacheKeyPortfolios = `portfolio-${account_id}-${account_currency}`;
            cache.del(cacheKeyPortfolios);

            res.status(201).json({
                message: "Account changed",
                account_name: changeAcc.account_name,
                account_currency: changeAcc.account_currency,
                account_state: changeAcc.account_state
            });
        } catch (err) {
            res.status(500).json({ message: 'Server fail' });
        }
    },
};
module.exports = databaseController;