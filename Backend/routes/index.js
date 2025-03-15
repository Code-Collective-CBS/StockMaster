// This is our main routes file (centralized routing system) that serves to bring all of our specific route modules together - This ensures our application contains organized routing

/* This is how the connection between routes, controllers, and services look like:
routes/index.js → routes/stockRoutes.js → controllers/stockController.js → services/alphaVantageService.js (pretty cool hehe)*/
const path = require('path');
const express = require('express')
const router = express.Router(); // Brug router i stedet for app
const fs = require('fs');


// Import API routes modules
// As we create new route files, we should import them here:
const stockRoutes = require('./stockRoutes'); // This is our stock routes file

// Main dashboard page route (this is our homepage)
router.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../../src/pages/dashboard.html'));
});

// Dynamic route handler for all our html pages, insted of hardcoding them all:
router.get('src/pages/:page.html', (req, res) => {
  const pageName = req.params.page + '.html';
  const filePath = path.join(__dirname, '../../src/pages', pageName);

  // Check if the file exists:
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  }
  res.status(404).send('Page not found');
});


// Imported routes (for now just the stockRoutes)
router.use('/api/stocks', stockRoutes); // This is an bsulote path so it will always start with api/stocks...the path


module.exports = router;