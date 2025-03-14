// This file is a specific route for stocks from Alpha Vantage
const express = require('express');
const router = express.Router();


// Defining routes for stock-related operations
// For now I am just making a test route
router.get('/', (req, res) => {
    res.json({ message: 'Stock API is working!' });
});

module.exports = router;
