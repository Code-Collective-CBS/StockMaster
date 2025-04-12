const express = require('express');
const router = express.Router();
const databaseController = require('../controllers/databaseController');
const { database } = require('../config/config');

// User routes
router.post('/users', databaseController.createUser);

// Login routes
router.post('/login', databaseController.login);

// User info routes
router.get('/getUser', databaseController.userInfo)

// Create account route
//router.post('/create-account', databaseController.createAccount);

// Search stocks from table stockNames
router.get('/search-stocks', databaseController.searchStockNames);

module.exports = router;