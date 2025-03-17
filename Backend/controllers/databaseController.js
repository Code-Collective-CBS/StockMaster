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
                
/*
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
*/
        res.status(201).json({ message: 'User created ' });
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: 'Fail to create user' });
    }
};

module.exports = { createUser };