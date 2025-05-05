const express = require('express');
const router = express.Router();
const databaseController = require('../controllers/databaseController');
const portfolioController = require('../controllers/portfolioController');

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

router.get('/portfolio/account/:accountId', portfolioController.getPortfolioSummary);

// Get information for popup buy/sell
router.get('/simple-portfolios/:accountId', portfolioController.getSimplePortfolios);

// Get quantity in portfolio
router.get('/portfolio/:portfolioId/stock/:symbol', portfolioController.getStockQuantityInPortfolio);

// Get all portfolios on account
router.get('/portfolio/account/:accountId/history', portfolioController.getPortfolioHistory);

// Get specific portfolio
router.get('/portfolio/:portfolioId/history', portfolioController.getPortfolioHistoryForPortfolio);

// Create portfolio
router.post('/createPortfolio/:accountId', databaseController.createPortfolio);

// Deposit to account
router.put('/deposit-to-account/:account_id', databaseController.depositToAccount);

// Withdraw to account
router.put('/withdraw-to-account/:account_id', databaseController.withdrawFromAccount);

// Buy stocks to portfolio
router.put('/buy-security/:portfolio_id', databaseController.buySecurity);

// Sell stocks to portfolio
router.put('/sell-security/:portfolio_id', databaseController.sellSecurity);

// Get all transactions for an account
router.get('/transactions/account/:account_id', databaseController.getTransactionsSummary);

// Change account settings (name, currency and status)
router.put('/update-account-settings/:account_id', databaseController.updateAccountSettings)


module.exports = router;