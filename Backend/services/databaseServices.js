const sql = require('mssql');
const config = require('../config/config');

// Creates connection to our MSSQL database through our login in config.database
// Creates a pool of connections. More reusable and effective
const poolPromise = new sql.ConnectionPool(config.database)
    .connect()
    .then((pool) => {
        console.log('Connected to Azure SQL');
        return pool;
    })
    .catch((err) => {
        console.log('Database connection failed:', err);
    });

const databaseServices = {
    createUser: async (body) => {
        const { firstname, lastname, email, password, phone_number, country_code } = body;

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
            .query(`
                INSERT INTO Users (firstname, lastname, email, password, phone_number, country_code, create_date)
                OUTPUT INSERTED.id
                VALUES (@firstname, @lastname, @email, @password, @phone_number, @country_code, GETDATE())
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
                .query(`SELECT * FROM Users WHERE email = @email AND password = @password`);

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
                .query('SELECT firstname, lastname, email, phone_number FROM Users WHERE id = @id');
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
        const { firstname, lastname, email, phone_number, newPassword } = body;

        try {
            const pool = await poolPromise;
            const updateUser = await pool.request()
                .input('id', sql.Int, id)
                .input("firstname", sql.NVarChar(50), firstname)
                .input("lastname", sql.NVarChar(50), lastname)
                .input("email", sql.NVarChar(100), email)
                .input("phone_number", sql.NVarChar(20), phone_number);
            // Checks if password is changed
            if (newPassword !== "") {
                updateUser.input("newpassword", sql.NVarChar(255), newPassword);
            }
            // Creates query
            const query = 'UPDATE Users SET firstname = @firstname, lastname = @lastname, email = @email, phone_number = @phone_number'

            // Adds newpassword to query if neccesary
            if (newPassword !== '') query += 'newpassword = @newpassword';

            // Search by user-id
            query += 'WHERE id = @id';

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
            const checkUser = await pool.request()
                .input('account_name', sql.VarChar(255), accountName)
                .input('currency', sql.VarChar(3), accountCurrency)
                .input('user_id', sql.Int, id)
                .query(`
                INSERT INTO Accounts (account_name, currency, user_id)
                VALUES (@account_name, @currency, @user_id)`
                )

            return { accountName, accountCurrency }

        } catch (err) {
            console.error('Error: Could not create account', err)
            throw err;
        }
    },

    getAccountInfo: async (id) => {
        try {
            const pool = await poolPromise;
            const getAccount = await pool.request()
                .input('id', sql.Int, id)
                .query(`
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
            console.error('Fejl: kunne ikke finde konto til user-id', error);
            return null;
        }
    },

    searchStockNames: async (query) => {
        try {
            const pool = await poolPromise;
            const result = await pool
                .request()
                .input('query', sql.VarChar, `%${query}%`)
                .query(`
                    SELECT TOP 10 *
                    FROM Securities
                    WHERE name LIKE @query OR symbol LIKE @query
                `);
            return result.recordset;
        } catch (err) {
            console.error(`Error querying stockNames table with query "${query}":`, err);
            throw err;
        }
    },

    searchCurrencies: async (query) => {
        try {
            const pool = await poolPromise;
            const result = await pool
                .request()
                .input('query', sql.NVarChar(10), `%${query}%`)
                .query(`
                    SELECT TOP 10 *
                    FROM Currency
                    WHERE name LIKE @query
                `);
            return result.recordset;
        } catch (err) {
            console.error(`Error querying Currency table with query "${query}":`, err);
            throw err;
        }
    },

    getPortfoliosForUser: async (userId) => {
        try {
            const pool = await poolPromise;
            const result = await pool.request()
                .input('userId', sql.Int, userId)
                .query(`
                    SELECT p.id, p.name, p.account_id, p.create_date, p.balance,
                           a.currency, a.account_name
                    FROM Portfolio p
                    JOIN Accounts a ON p.account_id = a.id
                    WHERE a.user_id = @userId
                `);
            return result.recordset;
        } catch (err) {
            console.error('Error getting portfolios for user:', err);
            throw err;
        }
    },

    getTransactionsForPortfolio: async (portfolioId) => {
        try {
            const pool = await poolPromise;
            const result = await pool.request()
                .input('portfolioId', sql.Int, portfolioId)
                .query(`
                    SELECT t.*, s.symbol, s.name as security_name, s.type as security_type
                    FROM Transactions t
                    JOIN Securities s ON t.securities_id = s.id
                    WHERE t.portfolio_id = @portfolioId
                    ORDER BY t.transaction_date DESC
                `);
            return result.recordset;
        } catch (err) {
            console.error('Error getting transactions for portfolio:', err);
            throw err;
        }
    }
};

module.exports = databaseServices;