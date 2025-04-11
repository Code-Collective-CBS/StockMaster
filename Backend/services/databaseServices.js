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
const createUser = async function (body) {
    const { firstname, lastname, email, password, phone_number, country_code } = body; // <- tilføj denne linje

    const pool = await poolPromise;

    const userExists = await pool.request()
        .input("email", sql.NVarChar(100), email)
        .query("SELECT COUNT(*) AS count FROM Users WHERE email = @email");

    if (userExists.recordset[0].count > 0) {
        return { status: 400, message: "E-mail already exists" };
    }

    await pool.request()
        .input("firstname", sql.NVarChar(50), firstname)
        .input("lastname", sql.NVarChar(50), lastname)
        .input("email", sql.NVarChar(100), email)
        .input("password", sql.NVarChar(255), password)
        .input("phone_number", sql.NVarChar(20), phone_number)
        .input("country_code", sql.NVarChar(5), country_code)
        .query(`
            INSERT INTO Users (firstname, lastname, email, password, phone_number, country_code, create_date)
            VALUES (@firstname, @lastname, @email, @password, @phone_number, @country_code, GETDATE())
        `);

    return { status: 201 };
};

const createAccount = async function (){}

const searchStockNames = async function (query) {
    try {
        const pool = await poolPromise; // Use the existing poolPromise
        const result = await pool
            .request()
            .input('query', sql.VarChar, `%${query}%`) // Use parameterized query to prevent SQL injection
            .query(`
                    SELECT TOP 10 *
                    FROM stockNames
                    WHERE name LIKE @query OR symbol LIKE @query
                `);
        return result.recordset; // Return the results
    } catch (err) {
        console.error(`Error querying stockNames table with query "${query}":`, err);
        throw err; // Re-throw the error for the controller to handle
    }
};

// Exports mssql and our poolPromise (connection)
module.exports = {
    sql,
    poolPromise,
    searchStockNames,
    createUser
};