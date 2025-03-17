const express = require('express');
const router = express.Router();
const databaseController = require('../controllers/databaseController');
const database = require('../config/config');

// User routes
router.post('/users', databaseController.createUser);

// Portfolio rutes
router.get('/accounts/:user_id', databaseController.getPortfolio) // Shows portfolios
router.post('/accounts', databaseController.createPortfolio) // Creates a new portfolio

module.exports = router;