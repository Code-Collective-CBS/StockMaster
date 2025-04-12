const sql = require('mssql');
const config = require('../config/config');
const databaseController = require('../controllers/databaseController');

// Creates connection to our mssql databse through our login in config.database
// Creates a pool of connections. More reusable and effective
const poolPromise = new sql.ConnectionPool(config.database)
    .connect()
    .then((pool) => {
        console.log('Connected to Azure SQL');
        return pool;
    })
    .catch((err) => {
        console.log('Database connection failed:', err);
    })

// Create user
const createUser = async (body) => {
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

        // Gemmer brugerens id ved oprettelse af konto
    const insertedID = userCreated.recordset[0].id
    console.log('Inserted ID: ', insertedID)
    const returnValue = { status: 201 , userID: insertedID};
    console.log('UserID: ', returnValue.userID)
    return returnValue
};

const login = async (body) => {
    const { email, password } = body;

    try {
        const pool = await poolPromise;
        const checkLogin = await pool.request()
            .input('email', sql.NVarChar(100), email)
            .input('password', sql.NVarChar(255), password)
            .query(`SELECT * FROM Users WHERE email = @email AND password = @password`)

        // Returnér brugeren hvis fundet
        if (checkLogin.recordset.length > 0) {
            return checkLogin.recordset[0];
        } else {
            return null; // forkert login
        }
    } catch (err) {
        console.error("Fejl i login-service:", err);
        throw err;
    }
};

const userInfo = async (id) => {
    try {
        const pool = await poolPromise;
        const getUser = await pool.request()
            .input('id', sql.Int, id)
            .query('SELECT firstname, lastname FROM Users WHERE id = @id')
        if (getUser.recordset.length > 0) {
            return getUser.recordset[0]
        } else {
            return null;
        }
    } catch(err) {
        console.err('Fejl. Kunne ikke finde user-id', err)
        throw err;
    }
}
/*
const createAccount = async function (){

}
*/
const searchStockNames = async (query) => {
    try {
        const pool = await poolPromise; // Use the existing poolPromise
        const result = await pool
            .request()
            .input('query', sql.VarChar, `%${query}%`) // Use parameterized query to prevent SQL injection
            .query(`
                    SELECT TOP 10 *
                    FROM Securities
                    WHERE name LIKE @query OR symbol LIKE @query
                `);
        return result.recordset; // Return the results
    } catch (err) {
        console.error(`Error querying stockNames table with query "${query}":`, err);
        throw err; // Re-throw the error for the controller to handle
    }
};

const getPortfoliosForUser = async (userId) => {
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
};

const getTransactionsForPortfolio = async (portfolioId) => {
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
};

// Exports mssql and our poolPromise (connection) and all the functions
module.exports = {
    sql,
    poolPromise,
    searchStockNames,
    createUser,
    login,
    userInfo,
    getPortfoliosForUser,
    getTransactionsForPortfolio
};