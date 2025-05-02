const sql = require("mssql");
const config = require("../config/config");
const exchangeRateService = require("../services/exchangeRateService");
const currencyUtils = require("../utilityFunctions/currencyUtils");

// Creates connection to our MSSQL database through our login in config.database
// Creates a pool of connections. More reusable and effective
const poolPromise = new sql.ConnectionPool(config.database)
    .connect()
    .then((pool) => {
        console.log("Connected to Azure SQL");
        return pool;
    })
    .catch((err) => {
        console.log("Database connection failed:", err);
    });

const databaseServices = {
    createUser: async (body) => {
        const { firstname, lastname, email, password, phone_number, avatar } = body;

        const pool = await poolPromise;

        const userExists = await pool.request()
            .input("email", sql.NVarChar(100), email)
            .query("SELECT COUNT(*) AS count FROM Users WHERE email = @email");

        if (userExists.recordset[0].count > 0) {
            return { status: 400, message: "E-mail already exists" };
        }

        const userCreated = await pool.request()
            .input("firstname", sql.NVarChar(50), firstname)
            .input("lastname", sql.NVarChar(50), lastname)
            .input("email", sql.NVarChar(100), email)
            .input("password", sql.NVarChar(255), password)
            .input("phone_number", sql.NVarChar(20), phone_number)
            .input("avatar", sql.NVarChar(50), avatar)

            .query(`
                INSERT INTO Users (firstname, lastname, email, password, phone_number, avatar, create_date)
                OUTPUT INSERTED.id
                VALUES (@firstname, @lastname, @email, @password, @phone_number, @avatar, GETDATE())
            `);

        const inserted_id = userCreated.recordset[0].id;
        return { status: 201, user_id: inserted_id };
    },

    login: async (body) => {
        const { email, password } = body;

        try {
            const pool = await poolPromise;
            const checkLogin = await pool.request()
                .input('email', sql.NVarChar(100), email)
                .input('password', sql.NVarChar(255), password)
                .query(`SELECT id AS user_id, firstname, lastname, email, avatar FROM Users WHERE email = @email AND password = @password`);

            if (checkLogin.recordset.length > 0) {
                return checkLogin.recordset[0];
            } else {
                return null; // Incorrect login
            }
        } catch (err) {
            console.error("Error in login service:", err);
            throw err;
        }
    },

    userInfo: async (user_id) => {
        try {
            const pool = await poolPromise;
            const getUser = await pool.request()
                .input('id', sql.Int, user_id)
                .query('SELECT firstname, lastname, email, phone_number, avatar FROM Users WHERE id = @id');
            if (getUser.recordset.length > 0) {
                return getUser.recordset[0];
            } else {
                return null;
            }
        } catch (err) {
            console.error('Error: Could not find user by ID', err);
            throw err;
        }
    },

    updateProfile: async (user_id, body) => {
        const { firstname, lastname, email, phone_number, newPassword, avatar } = body;

        try {
            const pool = await poolPromise;
            const updateUser = await pool
                .request()
                .input("id", sql.Int, user_id)
                .input("firstname", sql.NVarChar(50), firstname)
                .input("lastname", sql.NVarChar(50), lastname)
                .input("email", sql.NVarChar(100), email)
                .input("phone_number", sql.NVarChar(20), phone_number)
                .input("avatar", sql.NVarChar(50), avatar);

            let query =
                "UPDATE Users SET firstname = @firstname, lastname = @lastname, email = @email, phone_number = @phone_number, avatar = @avatar";

            // Checks if password is changed
            if (newPassword && newPassword !== "") {
                updateUser.input("password", sql.NVarChar(255), newPassword);
                query += ", password = @password";
                console.log("Checks for password");
            }

            // Search by user-id
            query += " WHERE id = @id";

            await updateUser.query(query);

            return { success: true };
        } catch (err) {
            console.error("Error in updateProfile:", err);
            return { success: false, message: "Database error" };
        }
    },

    createAccount: async (id, account_name, account_currency, account_bank) => {
        try {
            const pool = await poolPromise;

            // 1. Find the matching id based on currency_name from Currrency table
            const result = await pool
                .request()
                .input('currency_name', sql.NVarChar(10), account_currency)
                .query(`
                    SELECT id
                    FROM Currency
                    WHERE currency_name = @currency_name
            `);


            if (result.recordset.length === 0) {
                throw new Error(`Invalid currency name: ${account_currency}`);
            }

            const currency_id = result.recordset[0].id;

            // 2. Create the account
            const createAcc = await pool
                .request()
                .input("account_name", sql.VarChar(255), account_name)
                .input("currency_id", sql.Int, currency_id)
                .input("user_id", sql.Int, id)
                .input("bank", sql.NVarChar(100), account_bank)
                .query(`
                INSERT INTO Accounts (account_name, currency_id, user_id, bank)
                OUTPUT inserted.id AS account_id
                VALUES (@account_name, @currency_id, @user_id, @bank)
                `);

            const newAccountId = createAcc.recordset[0].account_id

            // Insert state change into AccountHistory
            await pool
                .request()
                .input("account_id", sql.Int, newAccountId)
                .input("state_change", sql.NVarChar, 'active')
                .query(`
                INSERT INTO AccountHistory (account_id, state_change)
                VALUES (@account_id, @state_change)`
                );

            return {
                account_id: newAccountId,
                account_name,
                account_currency,
                account_bank
            };
        } catch (err) {
            console.error("Error: Could not create account", err);
            throw err;
        }
    },

    getAccountInfo: async (id) => {
        try {
            const pool = await poolPromise;
            const getAccount = await pool
                .request()
                .input("id", sql.Int, id).query(`
                SELECT
                    u.id AS user_id,
                    u.firstname,
                    u.lastname,
                    a.id AS account_id,
                    a.account_name,
                    c.currency_name AS currency,
                    a.total_balance,
                    a.state
                FROM Accounts a
                JOIN Users u ON a.user_id = u.id
                JOIN Currency c on a.currency_id = c.id
                WHERE u.id = @id
            `);

            if (getAccount.recordset.length > 0) {
                return getAccount.recordset;
            } else {
                return null;
            }
        } catch (error) {
            console.error("Fail: Could not find an account for user-id", error);
            return null;
        }
    },

    getAccountBalanceAndCurrency: async (accoun_id) => {
        try {
            const pool = await poolPromise;
            const result = await pool
                .request()
                .input('accountId', sql.Int, accoun_id)
                .query(`
                SELECT
                    a.total_balance,
                    c.currency_name AS currency
                FROM Accounts a
                JOIN Currency c ON a.currency_id = c.id
                WHERE a.id = @accountId
            `);

            if (!result.recordset[0]) {
                throw new Error(`Account with id: ${accoun_id} not found`);
            }

            return result.recordset[0]; // { total_balance, currency }
        } catch (error) {
            console.error("Error getting account balance and currency", error);
            throw error;
        }
    },

    searchStockNames: async (query) => {
        try {
            const pool = await poolPromise;
            const result = await pool
                .request()
                .input("query", sql.VarChar, `%${query}%`).query(`
                    SELECT TOP 10 *
                    FROM Securities
                    WHERE name LIKE @query OR symbol LIKE @query
                `);
            return result.recordset;
        } catch (err) {
            console.error(
                `Error querying stockNames table with query "${query}":`,
                err
            );
            throw err;
        }
    },

    searchCurrencies: async (query) => {
        try {
            const pool = await poolPromise;
            const result = await pool
                .request()
                .input("query", sql.NVarChar(10), `%${query}%`).query(`
                    SELECT TOP 10 *
                    FROM Currency
                    WHERE currency_name LIKE @query
                `);
            return result.recordset;
        } catch (err) {
            console.error(
                `Error querying Currency table with query "${query}":`,
                err
            );
            throw err;
        }
    },

    getAccountBasicInfo: async (accountId) => {
        try {
            const pool = await poolPromise;
            const result = await pool.request()
                .input("accountId", sql.Int, accountId)
                .query(`
              SELECT
                a.id,
                a.account_name,
                c.currency_name AS currency
              FROM Accounts a
              JOIN Currency c ON a.currency_id = c.id
              WHERE a.id = @accountId
            `);

            return result.recordset[0]; // Return the first row or undefined
        } catch (err) {
            console.error("Error getting account basic info:", err);
            throw err;
        }
    },

    getPortfoliosForUser: async (userId) => {
        try {
            const pool = await poolPromise;
            const result = await pool.request().input("userId", sql.Int, userId)
                .query(`
                SELECT
                    p.id,
                    p.name,
                    p.account_id,
                    p.create_date,
                    c.currency_name AS currency,
                    a.account_name
                FROM Portfolio p
                JOIN Accounts a ON p.account_id = a.id
                JOIN Currency c ON a.currency_id = c.id
                WHERE a.user_id = @userId
            `);

            return result.recordset;
        } catch (err) {
            console.error("Error getting portfolios for user:", err);
            throw err;
        }
    },

    getTransactionsForPortfolio: async (portfolioId) => {
        try {
            const pool = await poolPromise;
            const result = await pool
                .request()
                .input("portfolioId", sql.Int, portfolioId).query(`
                    SELECT t.*, s.symbol, s.name as security_name, s.type as security_type
                    FROM Transactions t
                    JOIN Securities s ON t.securities_id = s.id
                    WHERE t.portfolio_id = @portfolioId
                    ORDER BY t.transaction_date DESC
                `);
            return result.recordset;
        } catch (err) {
            console.error("Error getting transactions for portfolio:", err);
            throw err;
        }
    },

    // // Add this function to databaseServices.js
    // getTransactionsForMultiplePortfolios: async (portfolioIds) => {
    //     try {
    //         if (!portfolioIds || portfolioIds.length === 0) {
    //             return [];
    //         }

    //         const pool = await poolPromise;

    //         // SQL Server doesn't directly support array parameters
    //         // We'll use a comma-separated string and STRING_SPLIT
    //         const portfolioIdsString = portfolioIds.join(',');

    //         const result = await pool.request()
    //             .input('portfolioIds', sql.NVarChar, portfolioIdsString)
    //             .query(`
    //       SELECT t.*, s.symbol, s.name as security_name, s.type as security_type
    //       FROM Transactions t
    //       JOIN Securities s ON t.securities_id = s.id
    //       WHERE t.portfolio_id IN (SELECT value FROM STRING_SPLIT(@portfolioIds, ','))
    //       ORDER BY t.transaction_date DESC
    //     `);

    //         return result.recordset;
    //     } catch (err) {
    //         console.error('Error getting transactions for multiple portfolios:', err);
    //         throw err;
    //     }
    // },

    getPortfoliosByAccount: async (accountId) => {
        try {
            const pool = await poolPromise;
            const result = await pool.request()
                .input("accountId", sql.Int, accountId)
                .query(`
                SELECT
                    p.id, p.name,
                    p.account_id,
                    p.create_date,
                    c.currency_name AS currency,
                    a.account_name
                FROM Portfolio p
                JOIN Accounts a ON p.account_id = a.id
                JOIN Currency c ON a.currency_id = c.id
                WHERE p.account_id = @accountId
      `); // Fixed: Filter by account_id
            return result.recordset;
        } catch (err) {
            console.error("Error getting portfolios for account:", err);
            throw err;
        }
    },

    depositToAccount: async (userId, accountId, amount) => {
        try {
            const pool = await poolPromise;

            // 1. Fetch account currency
            const accountQuery = await pool
                .request()
                .input('account_id', sql.Int, accountId)
                .query(`
                SELECT currency_id
                FROM Accounts
                WHERE id = @account_id
            `);

            const currency_id = accountQuery.recordset[0]?.currency_id; // "?.currency_id" safety to acces currency from recordset[0] only if it exist, otherwise asign undefined to variable
            if (!currency_id) throw new Error('Account currency not found');

            // 2. Update balance
            const result = await pool
                .request()
                .input("user_id", sql.Int, userId)
                .input("account_id", sql.Int, accountId)
                .input("amount", sql.Decimal(18, 2), amount) // Use the same type as your DB column
                .query(`
                UPDATE Accounts
                SET total_balance = total_balance + @amount
                WHERE id = @account_id AND user_id = @user_id

                SELECT * FROM Accounts WHERE id = @account_id
            `); // USE OF SELECT FOR LATER USE TO DISPLAY NEW ACCOUNT INSTEAD OF GETTING NEW INFORMATION MAYBE NOT NEEDED

            // 3. Insert into Transactions table
            await pool
                .request()
                .input("account_id", sql.Int, accountId)
                .input("transaction_type", sql.VarChar(10), 'deposit')
                .input("amount", sql.Decimal(37, 2), amount)
                .input("price_per_share", sql.Decimal(18, 2), 1) // Placeholder 1 maybe change into 0 if no change on gak
                .input("total_price", sql.Decimal(37, 2), amount)
                .input("currency_id", sql.Int, null)
                .input("account_currency_id", sql.Int, currency_id)
                .query(`
                INSERT INTO Transactions
                (account_id, portfolio_id, securities_id, transaction_type, amount, price_per_share, total_price, currency_id, account_currency_id)
                VALUES (@account_id, NULL, NULL, @transaction_type, @amount, @price_per_share, @total_price, @currency_id, @account_currency_id)
            `);

            return result.recordset[0];
        } catch (error) {
            console.error("Failed to deposit to account", error);
            throw error;
        }
    },

    withdrawFromAccount: async (userId, accountId, amount) => {
        try {
            const pool = await poolPromise;

            // 1. Fetch account currency
            const accountQuery = await pool
                .request()
                .input('account_id', sql.Int, accountId)
                .query(`
                SELECT currency_id
                FROM Accounts
                WHERE id = @account_id
            `);


            const currency_id = accountQuery.recordset[0]?.currency_id;
            if (!currency_id) throw new Error('Account currency not found');

            // 2. Update balance
            const result = await pool
                .request()
                .input("user_id", sql.Int, userId)
                .input("account_id", sql.Int, accountId)
                .input("amount", sql.Decimal(18, 2), amount)
                .query(`
                UPDATE Accounts
                SET total_balance = total_balance - @amount
                WHERE id = @account_id AND user_id = @user_id AND total_balance >= @amount

                SELECT * FROM Accounts WHERE id = @account_id
            `);

            if (result.rowsAffected[0] === 0) throw new Error("Insufficient funds"); // Extra check if total_balance >= @amount in SQL fails

            // 3. Insert into Transactions table
            await pool
                .request()
                .input("account_id", sql.Int, accountId)
                .input("transaction_type", sql.VarChar(10), 'withdraw')
                .input("amount", sql.Decimal(37, 2), amount)
                .input("price_per_share", sql.Decimal(18, 2), 1) // Placeholder 1 maybe change into 0 if no change on gak
                .input("total_price", sql.Decimal(37, 2), amount)
                .input("currency_id", sql.Int, null)
                .input("account_currency_id", sql.Int, currency_id)
                .query(`
                INSERT INTO Transactions
                (account_id, portfolio_id, securities_id, transaction_type, amount, price_per_share, total_price, currency_id, account_currency_id)
                VALUES (@account_id, NULL, NULL, @transaction_type, @amount, @price_per_share, @total_price, @currency_id, @account_currency_id)
            `);

            return result.recordset[0];
        } catch (error) {
            console.error("Failed to withdraw from account", error);
            throw error;
        }
    },

    buyOrSellSecurity: async ({
        user_id,
        account_id,
        portfolio_id,
        symbol,
        amount,
        price_per_share,
        transaction_type,
        security_currency
    }) => {
        try {
            const pool = await poolPromise;

            // 1. Validate portfolio belongs to account and user
            const validatePortfolio = await pool
                .request()
                .input("user_id", sql.Int, user_id)
                .input("account_id", sql.Int, account_id)
                .input("portfolio_id", sql.Int, portfolio_id)
                .query(`
                    SELECT p.id
                    FROM Portfolio p
                    JOIN Accounts a ON p.account_id = a.id
                    WHERE p.id = @portfolio_id
                        AND a.id = @account_id
                        AND a.user_id = @user_id
            `);

            if (validatePortfolio.recordset.length === 0) {
                throw new Error("Unauthorized: Portfolio does not belong to this account or user");
            }

            // 2. Get account currency_id to track currency from account for transaction NEW (01/05)
            const accountCurrencyQuery = await pool
                .request()
                .input("account_id", sql.Int, account_id)
                .query(`
                    SELECT currency_id
                    FROM Accounts
                    WHERE id = @account_id
            `);

            if (accountCurrencyQuery.recordset.length === 0) {
                throw new Error('Account not found');
            }

            const account_currency_id = accountCurrencyQuery.recordset[0].currency_id;

            // 3. Get current account balance
            const { total_balance, currency: accountCurrency } = await databaseServices.getAccountBalanceAndCurrency(account_id);

            // 4. Get security ID from DB table Securities
            const securityQuery = await pool
                .request()
                .input("symbol", sql.VarChar(10), symbol)
                .query(`
                SELECT s.id
                FROM Securities s
                WHERE s.symbol = @symbol
            `);

            if (securityQuery.recordset.length === 0) {
                throw new Error('Security not found'); // MAYBE ADD FUNCTION TO ADD SECURITY
            }

            const securities_id = securityQuery.recordset[0].id;

            // 5. Lookup currency_id in Currency tabel to get currency_name
            const currencyResult = await pool
                .request()
                .input('currency_name', sql.NVarChar(10), security_currency)
                .query(`
                SELECT c.id
                FROM Currency c
                WHERE c.currency_name = @currency_name
            `);

            if (currencyResult.recordset.length === 0) {
                throw new Error(`Invalid security currency: ${security_currency}`);
            }

            const currency_id = currencyResult.recordset[0].id;

            // 6. Calculate total price
            const total_price = amount * price_per_share;
            let convertedTotalPrice = total_price;

            if (accountCurrency !== security_currency) { // SET window.securityCurrency in security.js
                const rates = await exchangeRateService.getCurrency(security_currency);
                convertedTotalPrice = currencyUtils.convertCurrency(
                    total_price,
                    security_currency,
                    accountCurrency,
                    rates.conversion_rates
                );
            }

            if (transaction_type === 'buy' && convertedTotalPrice > parseFloat(total_balance)) {
                throw new Error(`Insufficient balance. Need ${convertedTotalPrice.toFixed(2)} ${accountCurrency}, but have ${parseFloat(total_balance).toFixed(2)}`);
            }

            if (transaction_type === 'sell') {
                const quantityHeld = await databaseServices.validateSecurityAmount(symbol, portfolio_id, account_id);

                if (amount > quantityHeld) {
                    throw new Error(`Cannot sell ${amount} shares. You only hold ${quantityHeld} shares in this portfolio.`);
                }
            }


            // 7. Insert into Transactions table
            const insertQuery = await pool
                .request()
                .input("account_id", sql.Int, account_id)
                .input("portfolio_id", sql.Int, portfolio_id)
                .input("securities_id", sql.Int, securities_id)
                .input("transaction_type", sql.VarChar(10), transaction_type)
                .input("amount", sql.Decimal(37, 2), amount)
                .input("price_per_share", sql.Decimal(18, 2), price_per_share)
                .input("total_price", sql.Decimal(37, 2), convertedTotalPrice) // Using account currency
                .input('currency_id', sql.Int, currency_id)
                .input('account_currency_id', sql.Int, account_currency_id)
                .query(`
                INSERT INTO Transactions
                (account_id, portfolio_id, securities_id, transaction_type, amount, price_per_share, total_price, currency_id, account_currency_id)
                OUTPUT INSERTED.id
                VALUES (@account_id, @portfolio_id, @securities_id, @transaction_type, @amount, @price_per_share, @total_price, @currency_id, @account_currency_id)
            `);

            // 8. Update account balance if 'buy'
            if (transaction_type === 'buy') {
                await pool
                    .request()
                    .input('account_id', sql.Int, account_id)
                    .input('total_price', sql.Decimal(18, 2), convertedTotalPrice)
                    .query(`
                    UPDATE Accounts
                    SET total_balance = total_balance - @total_price
                    WHERE id = @account_id
                `);
            }

            if (transaction_type === 'sell') {
                await pool
                    .request()
                    .input('account_id', sql.Int, account_id)
                    .input('total_price', sql.Decimal(18, 2), convertedTotalPrice)
                    .query(`
                    UPDATE Accounts
                    SET total_balance = total_balance + @total_price
                    WHERE id = @account_id
                `);
            }

            const transaction_id = insertQuery.recordset[0].id; // OUTPUT from "OUTPUT INSERTED.id"

            return { success: true, transaction_id, accountCurrency }
        } catch (error) {
            console.error("Failed to buy security to portfolio", error);
            throw error;
        }
    },

    createPortfolio: async (accountId, portfolioName) => {
        try {
            const pool = await poolPromise
            const portfolio = await pool
                .request()
                .input('account_id', sql.Int, accountId)
                .input('name', sql.NVarChar(100), portfolioName)
                .query(`
            INSERT INTO Portfolio (account_id, name)
            VALUES (@account_id, @name)
            `)

            return { accountId, portfolioName }
        } catch (err) {
            console.error("Error: Could not create account", err);
            throw err;
        }
    },

    getTransactionsSummary: async (user_id, account_id) => {
        try {
            const pool = await poolPromise;
            const transactions = await pool
                .request()
                .input('user_id', sql.Int, user_id)
                .input('account_id', sql.Int, account_id)
                .query(`
                    SELECT
                        t.id AS transaction_id,
                        t.transaction_type,
                        t.amount,
                        t.price_per_share,
                        t.total_price,
                        c.currency_name AS security_currency,   -- LEFT JOIN now
                        ac.currency_name AS account_currency,
                        t.transaction_date,
                        s.symbol,
                        s.name AS security_name,
                        s.type AS security_type,
                        p.name AS portfolio_name,
                        a.account_name
                    FROM Transactions t
                    LEFT JOIN Securities s ON t.securities_id = s.id
                    LEFT JOIN Currency c ON t.currency_id = c.id
                    LEFT JOIN Currency ac ON t.account_currency_id = ac.id
                    LEFT JOIN Portfolio p ON t.portfolio_id = p.id
                    JOIN Accounts a ON t.account_id = a.id
                    WHERE a.id = @account_id
                    AND a.user_id = @user_id
                    ORDER BY t.transaction_date DESC;
            `);

            return transactions.recordset; // Not [0] because result is multiple rows
        } catch (error) {
            console.error('Failed to get transaction for user account');
            throw error;
        }
    },

    updateAccountSettings: async (user_id, account_id, account_name, account_currency, account_state) => {
        try {
            const pool = await poolPromise;

            // Selects the current currency_name of the account.
            const current_account_currency_query = await pool
                .request()
                .input('account_id', sql.Int, account_id)
                .query(`
                SELECT
                    c.currency_name AS currency
                    FROM Accounts a
                    JOIN Currency c ON a.currency_id = c.id
                WHERE a.id = @account_id
            `);

            if (current_account_currency_query.recordset.length === 0) {
                throw new Error('Could not find currency_name for currency account currency');
            }
            // Saves the current account currency in a variable.
            const current_account_currency = current_account_currency_query.recordset[0].currency;

            // Selects the total_balance from the account
            const account_balance_query = await pool
                .request()
                .input('account_id', sql.Int, account_id)
                .query(`
                SELECT total_balance
                FROM Accounts a
                WHERE a.id = @account_id
            `);

            if (account_balance_query.recordset.length === 0) {
                throw new Error('Could not find total_balance for account');
            }

            // Saves the current account balance in a variable.
            const current_account_balance = account_balance_query.recordset[0].total_balance;
            let convertedTotalPrice = current_account_balance;

            // If the currenct account currency is different from the new currency that has been chosen, it has to convert.
            if (current_account_currency !== account_currency) {

                const rates = await exchangeRateService.getCurrency(current_account_currency);
                convertedTotalPrice = currencyUtils.convertCurrency(
                    current_account_balance,
                    current_account_currency,
                    account_currency, // New currency
                    rates.conversion_rates
                );
            }

            // Looks up the currency_id based on currency_name
            const currencyResult = await pool
                .request()
                .input('currency_name', sql.NVarChar(50), account_currency)
                .query(`
                    SELECT id
                    FROM Currency
                    WHERE currency_name = @currency_name
            `);

            if (currencyResult.recordset.length === 0) {
                throw new Error(`Invalid currency name: ${account_currency}`);
            }

            const currency_id = currencyResult.recordset[0].id

            // Check the last updated state for the account
            const result = await pool
                .request()
                .input('account_id', sql.Int, account_id)
                .query(`
                    SELECT state_change
                    FROM AccountHistory
                    WHERE account_id = @account_id
                    ORDER BY create_date DESC
                    `);

            const latestAccountState = result.recordset[0].state_change

            // If the current state is different from the one in the database, insert data into AccountHistory
            if (latestAccountState !== account_state) {
                await pool
                    .request()
                    .input('account_id', sql.Int, account_id)
                    .input('state_change', sql.NVarChar(10), account_state)
                    .query(`
                    INSERT INTO AccountHistory (account_id, state_change)
                    VALUES (@account_id, @state_change)
                    `)
            }

            // Update the account
            await pool
                .request()
                .input('user_id', sql.Int, user_id)
                .input('id', sql.Int, account_id)
                .input('account_name', sql.VarChar(100), account_name)
                .input('currency_id', sql.Int, currency_id)
                .input('state', sql.VarChar(50), account_state)
                .input('total_balance', sql.Decimal(18, 2), convertedTotalPrice)
                .query(`
                    UPDATE Accounts
                    SET account_name = @account_name, currency_id = @currency_id, state = @state, total_balance = @total_balance
                    WHERE id = @id
                    AND user_id = @user_id
            `);

            return { account_name, account_currency, account_state };
        } catch (err) {
            console.log('Failed to update account in database', err)
            throw err;
        }
    },

    validateSecurityAmount: async (symbol, portfolio_id, account_id) => {
        try {
            const pool = await poolPromise;

            // First query: sum of buys
            const buysResult = await pool
                .request()
                .input('symbol', sql.VarChar(10), symbol)
                .input('portfolio_id', sql.Int, portfolio_id)
                .input('account_id', sql.Int, account_id)
                .query(`
                    SELECT
                        SUM(t.amount) AS total_buys
                    FROM Transactions t
                    JOIN Securities s ON t.securities_id = s.id
                    WHERE LOWER(t.transaction_type) = 'buy'
                    AND s.symbol = @symbol
                    AND t.portfolio_id = @portfolio_id
                `); // USE OF LOWER TO TREAT LEGACCY DATA THAT USES UPPERCASE

            // NOTE: Use "AND t.account_id = @account_id" When legacy data is wiped
            const totalBuys = buysResult.recordset[0].total_buys || 0;

            // Second query: sum of sells
            const sellsResult = await pool
                .request()
                .input('symbol', sql.VarChar(10), symbol)
                .input('portfolio_id', sql.Int, portfolio_id)
                .input('account_id', sql.Int, account_id)
                .query(`
                    SELECT
                    SUM(t.amount) AS total_sells
                    FROM Transactions t
                    JOIN Securities s ON t.securities_id = s.id
                    WHERE LOWER(t.transaction_type) = 'sell'
                    AND s.symbol = @symbol
                    AND t.portfolio_id = @portfolio_id
                    `);

            // NOTE: Use "AND t.account_id = @account_id" When legacy data is wiped
            const totalSells = sellsResult.recordset[0].total_sells || 0;

            const netQuantity = totalBuys - totalSells;

            return netQuantity;
        } catch (error) {
            console.error('Failed to validate security amount for portfolio', error);
            throw error;
        }
    },
    /*
    deleteAccount: async (user_id, account_id) => {
        try {
            const pool = await poolPromise;
            const result = await pool.request()
                .input('user_id', sql.Int, user_id)
                .input('id', sql.Int, account_id)
                .query(
                    `DELETE FROM Accounts
                WHERE id = @id
                AND user_id = @user_id`
                )
            return result.rowsAffected[0]
        } catch (err) {
            console.error('Failed to delete account', err)
            throw err
        }
    }
    */
};

module.exports = databaseServices;