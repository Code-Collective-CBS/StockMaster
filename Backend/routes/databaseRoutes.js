const express = require('express');
const router = express.Router();
const databaseController = require('../controllers/databaseController');

// User routes
router.post('/users', databaseController.createUser);

// Login routes
router.post('/login', databaseController.login);

// Create account route
router.post('/create-account', databaseController.createAccount);

// Portfolio routes
router.post('/accounts', databaseController.createAccount); // Creates a new portfolio

// Search stocks from table stockNames
router.get('/search-stocks', databaseController.searchStockNames);

module.exports = router;