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
        const { firstname, lastname, email, password, phone_number, country_code, avatar } = body;

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
            .input("country_code", sql.NVarChar(5), country_code)
            .input("avatar", sql.NVarChar(50), avatar)

            .query(`
                INSERT INTO Users (firstname, lastname, email, password, phone_number, country_code, avatar, create_date)
                OUTPUT INSERTED.id
                VALUES (@firstname, @lastname, @email, @password, @phone_number, @country_code, @avatar, GETDATE())
            `);

        const insertedID = userCreated.recordset[0].id;
        return { status: 201, userID: insertedID };
    },

    login: async (body) => {
        const { email, password } = body;

        try {
            const pool = await poolPromise;
            const checkLogin = await pool.request()
                .input('email', sql.NVarChar(100), email)
                .input('password', sql.NVarChar(255), password)
                .query(`SELECT id, firstname, lastname, email, avatar FROM Users WHERE email = @email AND password = @password`);

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

    userInfo: async (id) => {
        try {
            const pool = await poolPromise;
            const getUser = await pool.request()
                .input('id', sql.Int, id)
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

    updateProfile: async (id, body) => {
        const { firstname, lastname, email, phone_number, newPassword, avatar } = body;

        try {
            const pool = await poolPromise;
            const updateUser = await pool
                .request()
                .input("id", sql.Int, id)
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

    createAccount: async (id, accountName, accountCurrency) => {
        try {
            const pool = await poolPromise;
            const checkUser = await pool
                .request()
                .input("account_name", sql.VarChar(255), accountName)
                .input("currency", sql.VarChar(3), accountCurrency)
                .input("user_id", sql.Int, id)
                .query(`
                INSERT INTO Accounts (account_name, currency, user_id)
                VALUES (@account_name, @currency, @user_id)`);

            return { accountName, accountCurrency };
        } catch (err) {
            console.error("Error: Could not create account", err);
            throw err;
        }
    },

    getAccountInfo: async (id) => {
        try {
            const pool = await poolPromise;
            const getAccount = await pool.request().input("id", sql.Int, id).query(`
                        SELECT
                            u.id AS user_id,
                            u.firstname,
                            u.lastname,
                            a.id AS account_id,
                            a.account_name,
                            a.currency,
                            a.total_balance
                        FROM Accounts a
                        JOIN Users u ON a.user_id = u.id
                        WHERE u.id = @id
                    `);

            if (getAccount.recordset.length > 0) {
                return getAccount.recordset;
            } else {
                return null;
            }
        } catch (error) {
            console.error("Fejl: kunne ikke finde konto til user-id", error);
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
                SELECT total_balance, currency
                FROM Accounts
                WHERE id = @accountId
            `);

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

    getPortfoliosForUser: async (userId) => {
        try {
            const pool = await poolPromise;
            const result = await pool.request().input("userId", sql.Int, userId)
                .query(`
                    SELECT p.id, p.name, p.account_id, p.create_date, p.balance,
                           a.currency, a.account_name
                    FROM Portfolio p
                    JOIN Accounts a ON p.account_id = a.id
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

// Add this function to databaseServices.js
getTransactionsForMultiplePortfolios: async (portfolioIds) => {
    try {
      if (!portfolioIds || portfolioIds.length === 0) {
        return [];
      }

      const pool = await poolPromise;

      // SQL Server doesn't directly support array parameters
      // We'll use a comma-separated string and STRING_SPLIT
      const portfolioIdsString = portfolioIds.join(',');

      const result = await pool.request()
        .input('portfolioIds', sql.NVarChar, portfolioIdsString)
        .query(`
          SELECT t.*, s.symbol, s.name as security_name, s.type as security_type
          FROM Transactions t
          JOIN Securities s ON t.securities_id = s.id
          WHERE t.portfolio_id IN (SELECT value FROM STRING_SPLIT(@portfolioIds, ','))
          ORDER BY t.transaction_date DESC
        `);

      return result.recordset;
    } catch (err) {
      console.error('Error getting transactions for multiple portfolios:', err);
      throw err;
    }
  },

    getPortfoliosByAccount: async (accountId) => {
        try {
            const pool = await poolPromise;
            const result = await pool.request()
            .input("accountId", sql.Int, accountId)
            .query(`
                SELECT
                p.id, p.name, p.account_id, p.create_date, p.balance,
                a.currency, a.account_name
                FROM Portfolio p
                JOIN Accounts a ON p.account_id = a.id
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
                SELECT currency FROM Accounts    
                WHERE id = @account_id
            `);

            const accountCurrency = accountQuery.recordset[0]?.currency; // "?.currency" safety to acces currency from recordset[0] only if it exist, otherwise asign undefined to variable 
            if(!accountCurrency) throw new Error('Account currency not found');
        
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
            .input('currency', sql.VarChar(10), accountCurrency)
            .query(`
                INSERT INTO Transactions
                (account_id, portfolio_id, securities_id, transaction_type, amount, price_per_share, total_price, currency)
                VALUES (@account_id, NULL, NULL, @transaction_type, @amount, @price_per_share, @total_price, @currency)
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
            SELECT currency FROM Accounts    
            WHERE id = @account_id
            `);

            
            const accountCurrency = accountQuery.recordset[0]?.currency;
            if(!accountCurrency) throw new Error('Account currency not found');

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
            .input('currency', sql.VarChar(10), accountCurrency)
            .query(`
                INSERT INTO Transactions
                (account_id, portfolio_id, securities_id, transaction_type, amount, price_per_share, total_price, currency)
                VALUES (@account_id, NULL, NULL, @transaction_type, @amount, @price_per_share, @total_price, @currency)
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

            // 0. Validate portfolio belongs to account and user
            const validatePortfolio = await pool
                .request()
                .input("user_id", sql.Int, user_id)
                .input("account_id", sql.Int, account_id)
                .input("portfolio_id", sql.Int, portfolio_id)
                .query(`
                    SELECT p.id
                    FROM Portfolio p
                    JOIN Accounts a ON p.account_id = a.id
                    WHERE p.id = @portfolio_id AND a.id = @account_id AND a.user_id = @user_id
            `);

            if (validatePortfolio.recordset.length === 0) {
                throw new Error("Unauthorized: Portfolio does not belong to this account or user");
            }

            // 1. Get current account balance
            const { total_balance, currency: accountCurrency } = await databaseServices.getAccountBalanceAndCurrency(account_id);


            // 2. Get security ID from DB table Securities
            const securityQuery = await pool
                .request()
                .input("symbol", sql.VarChar(10), symbol)
                .query(`
                SELECT id FROM Securities
                WHERE symbol = @symbol
            `);

            if (securityQuery.recordset.length === 0) {
                throw new Error('Security not found'); // MAYBE ADD FUNCTION TO ADD SECURITY
            }

            const securities_id = securityQuery.recordset[0].id;

            // 3. Calculate total price
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

            // 4. Insert into Transactions table
            const insertQuery = await pool
            .request()
            .input("account_id", sql.Int, account_id)
            .input("portfolio_id", sql.Int, portfolio_id)
            .input("securities_id", sql.Int, securities_id)
            .input("transaction_type", sql.VarChar(10), transaction_type)
            .input("amount", sql.Decimal(37, 2), amount)
            .input("price_per_share", sql.Decimal(18, 2), price_per_share)
            .input("total_price", sql.Decimal(37, 2), convertedTotalPrice) // Using account currency
            .input('currency', sql.VarChar(10), security_currency)
            .query(`
                INSERT INTO Transactions
                (account_id, portfolio_id, securities_id, transaction_type, amount, price_per_share, total_price, currency)
                OUTPUT INSERTED.id
                VALUES (@account_id, @portfolio_id, @securities_id, @transaction_type, @amount, @price_per_share, @total_price, @currency)
            `);

            // 5. Update account balance if 'buy'
            if(transaction_type === 'buy') {
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

            if(transaction_type === 'sell') {
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

            return { success: true, transaction_id }
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
        try{
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
                    t.currency,
                    t.transaction_date,
                    s.symbol,
                    s.name AS security_name,
                    s.type AS security_type,
                    p.name AS portfolio_name,
                    a.account_name
                FROM Transactions t
                LEFT JOIN Securities s ON t.securities_id = s.id
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
    }
};

module.exports = databaseServices;
