const { sql, poolPromise } = require('../services/databaseServices');

const createUser = async (req, res) => {
    const { firstname, lastname, email, password, phone_number, country_code } = req.body;
    const pool = await poolPromise;
    try {

        // Checks if user already exists
        const userExists = await pool.request()
            // "@-symbol" defines parameters in a SQL-query. More safe, optimizing query and prevents SQL injection
            .input("email", sql.NVarChar(100), email)
            .query("SELECT COUNT(*) AS count FROM Users WHERE email = @email"); // SQL returns a count of how many users has this email

        if (userExists.recordset[0].count > 0) { // SQL returns an array of objects (recordset) and we checks if the count is more than 0
            return res.status(400).json({ message: "E-mail already exists" });
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

const login = async (req, res) => {
    const { email, password } = req.body;

    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('email', sql.NVarChar, email)
            .input('password', sql.NVarChar, password) 
            .query(`SELECT user_id, email FROM Users WHERE email = @email AND password = @password`);

        if (result.recordset.length === 1) {
            req.session.user_id = result.recordset[0].user_id;
            alert("Logget ind")
            res.status(200).json({ message: "Logget ind!" });
        } else {
            res.status(401).json({ message: "Ugyldigt login" });
        }
    } catch (err) {
        res.status(500).json({ message: "Server fejl", error: err });
    }
};

const createAccount = async (req, res) => {
    const { account_name, currency, balance, state } = req.body;
    const user_id = req.session.user_id; 

    if (!user_id) {
        return res.status(401).json({ message: "Bruger ikke logget ind" });
    }

    try {
        const pool = await poolPromise;
        await pool.request()
            .input("user_id", sql.Int, user_id)
            .input("account_name", sql.NVarChar(50), account_name)
            .input("currency", sql.NVarChar(10), currency)
            .input("balance", sql.Decimal(15,2), balance)
            .input("state", sql.NVarChar(20), state)
            .query(`
                INSERT INTO Accounts (user_id, account_name, currency, balance, state)
                VALUES (@user_id, @account_name, @currency, @balance, @state)
            `);

        res.status(201).json({ message: "Konto oprettet" });
    } catch(err) {
        console.error("Create Account error:", err);
        res.status(500).json({ message: "Fejl ved oprettelse af konto" });
    }
};

module.exports = {
    createUser,
    login,
    createAccount
};