const express = require('express');
const router = express.Router();
const databaseController = require('../controllers/databaseController');
const { database } = require('../config/config');
const portfolioController = require('../controllers/portfolioController');
const databaseServices = require('../services/databaseServices');

// User routes
router.post('/users', databaseController.createUser);

// Login routes
router.post('/login', databaseController.login);

// User info routes
router.get('/userInfo', databaseController.userInfo);

// Create account route
router.post('/create-account', databaseController.createAccount);

// Search stocks from table stockNames
router.get('/search-stocks', databaseController.searchStockNames);


// Get accounts to show
router.get('/get-accounts', databaseController.getAllAccountsForUser);

// Profile info route
router.get('/profileInfo', databaseController.getUserProfile);

// Search currencies from tables currency
router.get('/search-currency', databaseController.searchCurrencies);

// Update profile route
router.put('/updateprofileInfo', databaseController.updateUserProfile);

router.get('/portfolio/user/:userId', portfolioController.getPortfolioSummary);

// Create portfolio
//router.get('createPortfolio', databaseController.createPortfolio);


// Test to see if our API is working
router.get('/test', (req, res) => {
    res.json({ message: 'API is working!' });
});

// Deposit to account
router.put('/deposit-to-account/:accountId', databaseController.depositToAccount);

// Withdraw to account
router.put('/withdraw-to-account/:accountId', databaseController.withdrawFromAccount);

// Buy stocks to portfolio
router.put('/buy-security/:portfolioId', )

// Sell stocks to portfolio
router.put('/sell-security/:portfolioId', )

module.exports = router;