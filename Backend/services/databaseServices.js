const sql = require('mssql');
const config = require('../config/config');

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
    searchStockNames
};