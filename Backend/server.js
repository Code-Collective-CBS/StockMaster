// Imports all the env-variables first
require('dotenv').config();

const express = require('express');
const path = require('path') // inbuild node utility to help find file paths
const cors = require('cors'); // Tillader frontend og backend at snakke sammen fra forskellige domains. Ex: localhost:3000 og localhost:5173
const config = require('./config/config'); // Importing the configuration from the config.js file
const app = express();
const session = require('express-session');

// Session Middleware setup
app.use(session({
    secret: 'din-hemmelige-nøgle-her', // vælg en sikker nøgle i produktion
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: true,  // brug "true" hvis du har HTTPS
        maxAge: 1000 * 60 * 60 // fx 1 time
    }
}));

// Use port from config that we imported
const PORT = config.server.port;

app.use('/src', express.static(path.join(__dirname, '../src'))); // Gør at HTML, CSS, JS (frontend) er statisk. Loader hurtigere, og holder backend clean.
app.use(express.json()) // Parses JSON data. Dvs. konverterer rå data fra en HTTP request til en brugbar format, som serveren kan bruge.
app.use(cors()) // Tillader frontend at fetch fra backend

// Importér router fra routes/index.js
const userRoutes = require('./routes');
app.use(userRoutes); // Brug ruter fra router-filen

// Starter serveren
app.listen(PORT, () => console.log(`Server is running on http://localhost:${PORT}`))