const { sql, poolPromise } = require('../services/databaseServices'); // ONLY IMPORTING TWO MODULES SO BENATH WE IMPORT IT ALLLLL!
const databaseServices = require('../services/databaseServices');

const createUser = async (req, res) => {
    const { firstname, lastname, email, password, phone_number, country_code } = req.body;
    const body = req.body;
    if (!firstname || !lastname || !email || !password) {
        return res.status(400).json({ message: "Manglende information" });
    }


    try {
        const result = await databaseServices.createUser(body);

        if (result.status === 400) {
            return res.status(400).json({ message: result.message });
        }

        res.status(201).json({ message: "User created" });
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Fejl ved oprettelse af bruger" });
    }
};

const createAccount = async (req, res) => {
    const { account_name, currency, state } = req.body;
    const user_id = req.session.user_id; 
    console.log(user_id);

    if (!user_id) {
        return res.status(401).json({ message: "Bruger ikke logget ind" });
    }

    try {
        const pool = await poolPromise;
        await pool.request()
            .input("user_id", sql.Int, user_id)
            .input("account_name", sql.NVarChar(50), account_name)
            .input("currency", sql.NVarChar(10), currency)
            .input("balance", sql.Decimal(15,2), 0)
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

const searchStockNames = async (req, res) => {
    try {
        const { query } = req.query; // Extract the query parameter from the request

        if (!query) {
            return res.status(400).json({ error: 'Search query is required' }); // Handle missing query
        }

        const result = await databaseServices.searchStockNames(query); // Call the service function
        res.json(result); // Send the result back to the client
    } catch (err) {
        console.error('Error searching for stocks:', err);
        res.status(500).json({ error: 'Failed to search for stocks' }); // Handle errors
    }
};

module.exports = {
    createUser,
    login,
    createAccount,
    searchStockNames
};