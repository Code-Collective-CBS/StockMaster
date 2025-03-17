const { sql, poolPromise } = require('../services/databaseServices');

const createUser = async (req, res) => {
    const { firstname, lastname, email, password, phone_number, country_code } = req.body;

    try {
        const pool = await poolPromise;

        // Checks if user already exists
        const userExists = await pool.request()

            // "@-symbol" defines parameters in a SQL-query. More safe, optimizing query and prevents SQL injection
            .input("email", sql.NVarChar(100), email)
            .query("SELECT COUNT(*) AS count FROM Users WHERE email = @email");

        if (userExists.recordset[0].count) {
            return res.status(400).json({ message: "Email already exists" });
        }

                // SQL-query med parameterized input (for sikkerhed)
                await pool.request()
                    .input("firstname", sql.NVarChar(50), firstname)
                    .input("lastname", sql.NVarChar(50), lastname)
                    .input("email", sql.NVarChar(100), email)
                    .input("password", sql.NVarChar(255), password) // Skal hashes i fremtiden
                    .input("phone_number", sql.NVarChar(20), phone_number)
                    .input("country_code", sql.NVarChar(5), country_code)
                    .query(`
                    INSERT INTO Users (firstname, lastname, email, password, phone_number, country_code, create_date)
                    VALUES (@firstname, @lastname, @email, @password, @phone_number, @country_code, GETDATE())
                `);
        res.status(201).json({ message: 'User created ' });
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: 'Fail to create user' });
    }
};


// Accounts / Portfolio API-endpoints:

const getPortfolio = async (req, res) => {
    const { user_id } = req.params; // Fetches values from URL (GET-requests)

    try {
        const pool = await poolPromise;

        const result = await pool.request()
            .input("user_id", sql.Int, user_id) // sql.Int parses ID as a number 
            .query(`SELECT id, account_name, currency, balance, create_date, state
                    FROM Accounts
                    WHERE user_id = @user_id`);


                    res.status(200).json(result.recordset);
    } catch(err) {
        console.log("Fail to load portfolio", err);
        res.status(500).json({ message: "Error fetching portfolio" })
    }
};

module.exports = { createUser };