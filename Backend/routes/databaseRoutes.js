const express = require('express');
const router = express.Router();
const databaseController = require('../controllers/databaseController');
const database = require('../config/config');

// User routes
router.post('/users', databaseController.createUser);

// Login routes
router.post('/login', databaseController.login);

// Create account route
router.post('/create-account', databaseController.createAccount);

// Portfolio rutes
router.post('/accounts', databaseController.createAccount) // Creates a new portfolio

module.exports = router;