const { sql, poolPromise } = require('../services/databaseServices');

const createUser = async (req, res) => {
    const { firstname, lastname, email, password, phone_number, country_code } = req.body;

    try {
        const pool = await poolPromise;

        // Creates a query to insert users into the DB
        const query = 
                `INSERT INTO Users (firstname, lastname, email, password, phone_number, country_code, create_date)
                VALUES ('${firstname}', '${lastname}', '${email}', '${password}', '${phone_number}', '${country_code}', GETDATE())`

                // Creates and sends a query to the DB
                await pool.request().query(query);

        res.status(201).json({ message: 'User created ' });
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: 'Fail to create user' });
    }
};

module.exports = {createUser};