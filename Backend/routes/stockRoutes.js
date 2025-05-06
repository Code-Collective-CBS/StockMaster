// This file is a specific route for stocks from Alpha Vantage
const express = require('express');
const router = express.Router();
const stockController = require('../controllers/stockController');


// This is just a test route
router.get('/test', (req, res) => {
    res.json({ message: 'Stock API is working!' });
});


// Stock quote endpoint
router.get('/quote/:symbol', stockController.getQuote)

// Stock search endpoint
router.get('/search', stockController.searchStocks)

// Stock daily times series endpoint
router.get('/daily/:symbol', stockController.getDailyTimeSeries)

// Stock company overview endpoint
router.get('/overview/:symbol', stockController.getCompanyOverview)

// Indicies symbol financials endpoint from Polygon Api
router.get('/overview-indices/:symbol', stockController.getIndicesoverview);

// News from Polygon io endpoint from Polygon Api
router.get('/news/', stockController.getNews);

module.exports = router;