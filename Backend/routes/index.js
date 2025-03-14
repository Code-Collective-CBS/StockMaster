// This is our main routes file (centralized routing system) that serves to bring all of our specific route modules together - This ensures our application contains organized routing

/* This is how the connection between routes, controllers, and services look like:
routes/index.js → routes/stockRoutes.js → controllers/stockController.js → services/alphaVantageService.js (pretty cool hehe)*/
const path = require('path');
const express = require('express')
const router = express.Router(); // Brug router i stedet for app


// Import routes modules
// As we create new route files, we should import them here:
const stockRoutes = require('./stockRoutes'); // This is our stock routes file

// Main dashboard page route (this is our homepage)
router.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../../src/pages/dashboard.html'));
});

// Routes for each html files:
// Dashboard
router.get('/src/pages/dashboard.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../../src/pages/dashboard.html'));
  });

  // Portfolio page
  router.get('/src/pages/portfolio.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../../src/pages/portfolio.html'));
  });

  // Stock and News page
  router.get('/src/pages/securities-news.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../../src/pages/securities-news.html'));
  });

  // Single stock page
  router.get('/src/pages/security.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../../src/pages/security.html'));
  });

  // Transactions page
  router.get('/src/pages/transactions.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../../src/pages/transactions.html'));
  });


  // Profile settings page
  router.get('/src/pages/profile-settings.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../../src/pages/profile-settings.html'));
  });

  // Account settings page
  router.get('/src/pages/account-settings.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../../src/pages/account-settings.html'));
  });

  // Login page
  router.get('/src/pages/login.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../../src/pages/login.html'));
  });


  // Sign up page
  router.get('/src/pages/sign-up.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../../src/pages/sign-up.html'));
  });



// Imported routes (for now just the stockRoutes)
router.use('/api/stocks', stockRoutes); // This is an bsulote path so it will always start with api/stocks...the path


module.exports = router;