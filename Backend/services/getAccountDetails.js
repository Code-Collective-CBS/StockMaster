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

// Get account details
const getAccountDetails = {
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
                        a.balance
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
    }
};