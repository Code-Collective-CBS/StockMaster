const express = require('express');
const router = express.Router();
const currencyController = require('../controllers/currencyController');

// Exchange route to get base_currency and exchange rates
router.get('/exchange/:currency', currencyController.getCurrency);

module.exports =router;