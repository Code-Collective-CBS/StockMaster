const express = require('express');
const router = express.Router();
const currencyController = require('../controllers/currencyController');

// This is just a test route
router.get('/test', (req, res) => {
    res.json({ message: 'Stock API is working!' });
});

