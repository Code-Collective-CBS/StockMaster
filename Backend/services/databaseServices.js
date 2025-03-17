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

// Exports mssql and our poolPromise (connection)
module.exports = {
    sql,
    poolPromise
};