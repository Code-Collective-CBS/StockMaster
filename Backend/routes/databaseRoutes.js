const express = require('express');
const router = express.Router();
const databaseController = require('../controllers/databaseController');
const { database } = require('../config/config');
const portfolioController = require('../controllers/portfolioController')

// User routes
router.post('/users', databaseController.createUser);

// Login routes
router.post('/login', databaseController.login);

// User info routes
router.get('/userInfo', databaseController.userInfo)

// Create account route
router.post('/create-account', databaseController.createAccount);

// Search stocks from table stockNames
router.get('/search-stocks', databaseController.searchStockNames);

router.get('/user/:userId', portfolioController.getPortfolioSummary)

// Get accounts to show
router.get('/get-accounts', databaseController.getAllAccountsForUser);

// Profile info route
router.get('/profileInfo', databaseController.getUserProfile);

// Search currencies from tables currency
router.get('/search-currency', databaseController.searchCurrencies);

// Update profile route
router.put('/updateprofileInfo', databaseController.updateUserProfile);


module.exports = router;