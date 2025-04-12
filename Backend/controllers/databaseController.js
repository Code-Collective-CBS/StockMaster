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

const login = async (req, res) => {
    const { email, password } = req.body;
    const body = req.body;

    try {
        const user = await databaseServices.login(body)   
        
        if (user) {
            req.session.user_id = user.id
            res.status(201).json({ message: 'Login succesfull' });
        } else {
            res.status(401).json({ message: 'Wrong username or password' });
        }
    } catch (err) {
        console.error('Login failed', err);
        res.status(500).json({ message: 'Intern serverfail' })
    }
}

const userInfo = async (req, res) => {
    const userID = req.session.user_id;

    if(!userID) {
        return res.status(401).json({ message: 'Fejl i database. Kunne ikke hente navn' })
    }

    const user = await databaseServices.userInfo(userID)
    if(!user) {
        return res.status(404).json({ message: 'Fejl i database. Kunne ikke finde brugeren' })
    }

    res.status(200).json({ 
        fornavn: user.firstname,
        efternavn: user.lastname
    });
}

/*
const createAccount = async (req, res) => {
    const { account_name, currency, state } = req.body;
    const body = req.body;

    // Gets the user_id from the database
    const userId = sessionStorage.getItem("user_id")
    console.log(userId);

    if (!userId) {
        return res.status(401).json({ message: "Bruger ikke logget ind" });
    }
};
*/
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
    //createAccount,
    searchStockNames,
    login,
    userInfo
};