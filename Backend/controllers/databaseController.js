const databaseServices = require('../services/databaseServices');
// CACHE
const cache = require("../utilityFunctions/cache");
const { getOrSetCache } = require('../utilityFunctions/cacheHelper');

const databaseController = {
    createUser: async (req, res) => {
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

            // Save the user's ID in the session upon account creation
            req.session.user_id = result.userID;

            const user = await databaseServices.userInfo(result.userID);
            if (!user) {
                return res.status(404).json({ message: 'Fejl i database. Kunne ikke finde brugeren' });
            }

            res.status(201).json({
                message: "User created",
                fornavn: user.firstname,
                efternavn: user.lastname
            });
        } catch (err) {
            console.log(err);
            res.status(500).json({ message: "Fejl ved oprettelse af bruger" });
        }
    },

    login: async (req, res) => {
        const { email, password } = req.body;
        const body = req.body;

        try {
            const user = await databaseServices.login(body);

            if (user) {
                req.session.user_id = user.id;
                res.status(201).json({ message: 'Login succesfull' });
            } else {
                res.status(401).json({ message: 'Wrong username or password' });
            }
        } catch (err) {
            console.error('Login failed', err);
            res.status(500).json({ message: 'Intern serverfail' });
        }
    },

    userInfo: async (req, res) => {
        const userID = req.session.user_id;

        if (!userID) {
            return res.status(401).json({ message: 'Fejl i database. Kunne ikke hente navn' });
        }

        const user = await databaseServices.userInfo(userID);
        if (!user) {
            return res.status(404).json({ message: 'Fejl i database. Kunne ikke finde brugeren' });
        }

        res.status(200).json({
            fornavn: user.firstname,
            efternavn: user.lastname
        });
    },

    getUserProfile: async (req, res) => {
        const userID = req.session.user_id;

        if (!userID) {
            return res.status(401).json({ message: 'Bruger ikke logget ind' });
        }

        try {
            const user = await databaseServices.userInfo(userID);

            if (!user) {
                return res.status(401).json({ message: 'Brugeren findes ikke' })
            }
            res.status(200).json({
                firstname: user.firstname,
                lastname: user.lastname,
                email: user.email,
                phone: user.phone_number
            })
        } catch (err) {
            console.log('Fejl ved hentning af profil', err);
            res.status(500).json({ message: 'Fejl i database' })
        }
    },

    updateUserProfile: async (req, res) => {
        const userID = req.session.user_id;

        if (!userID) {
            return res.status(401).json({ message: "Fail by gathering id" })
        }

        const {firstname, lastname, email, phone, newPassword} = req.body;
        const body = req.body;

        try {
            const result = await databaseServices.updateProfile(userID, body);

            if(!result.success){
                return res.status(400).json({message: result.message})
            }
            res.status(200).json({message: 'Profile updated'})
        }catch(err){
            console.log('Fail by updating profile', err);
            res.status(500).json({message: 'Database fail'})
        }
      },

    createAccount: async (req, res) => {
        const { accountName, accountCurrency } = req.body;
        // Fetches the users id from the session
        const userID = req.session.user_id;


        try {
            const account = await databaseServices.createAccount(userID, accountName, accountCurrency)

            if (!userID) {
                return res.status(401).json({ message: 'User not found or logged in' });
            }

            // Deletes existing cache for accounts-user_id (sets new cache automatically afterwards)
            const cacheKey = `accounts-user_id-${userID}`;
            cache.del(cacheKey);

            if (!account) {
                return res.status(400).json({ message: 'Fail in databaseServices' })
            }

            res.status(201).json({
                message: "Account created",
                accountName: account.accountName,
                accountCurrency: account.accountCurrency
            });
        } catch (err) {
            res.status(500).json({ message: "Failed trying to create account", err });
        }
    },

    getAllAccountsForUser: async (req, res) => {
        try {
            const userId = req.session.user_id

            if (!userId) {
                return res.status(400).json({ error: "User ID is required" });
            }

            const cacheKey = `accounts-user_id-${userId}`;
            const { data, source } = await getOrSetCache(
                cacheKey,
                () => databaseServices.getAccountInfo(userId),
                600
            );

            if (!data || data.length === 0) {
                return res.status(404).json({ error: "No accounts found for this user" });
            }

            res.json({ data, source });
        } catch (err) {
            console.error("Error fetching user accounts:", err);
            res.status(500).json({ error: "Internal server error" });
        }
    },

    searchStockNames: async (req, res) => {
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
    }
};

module.exports = databaseController;