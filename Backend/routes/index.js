// This is our main routes file (centralized routing system) that serves to bring all of our specific route modules together - This ensures our application contains organized routing

const path = require('path');
const express = require('express')
const router = express.Router(); // Brug router i stedet for app
const fs = require('fs');
const cors = require('cors');


// Import API routes modules
// As we create new route files, we should import them here:
const stockRoutes = require('./stockRoutes'); //

// Exchange routes
const currencyRoutes = require('./currencyRoutes');

// Database routes
const databaseRoutes = require('./databaseRoutes')

// Main dashboard page route (this is our homepage)
router.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../../src/pages/login.html'));  // Changed this to login instead of dashboard
});

// Dynamic route handler for all our html pages, insted of hardcoding them all:
router.get('/pages/:page.html', (req, res) => {
  const pageName = req.params.page;
  const filePath = path.join(__dirname, '../../src/pages', `${pageName}.html`);

  // Check if the file exists
  if (fs.existsSync(filePath)) {
    return res.sendFile(filePath);
  }
  res.status(404).send('Page not found');
});

router.use(cors());


// Let app use our imported stocks routes
router.use('/api/stocks', stockRoutes); // This is an bsulote path so it will always start with api/stocks...the path

// Let app use our imported exchanges routes
router.use('/api/currency', currencyRoutes);

// Let app use our imported portfolio route
router.use('api/portfolios', databaseRoutes);

router.use('/api/database', databaseRoutes);

module.exports = router;