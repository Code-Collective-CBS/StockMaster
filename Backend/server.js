const express = require('express');
const cors = require('cors'); // Tillader frontend og backend at snakke sammen fra forskellige domains. Ex: localhost:3000 og localhost:5173
const app = express();
const PORT = 3000;

app.use(express.static('public')) // Gør at HTML, CSS, JS (frontend) er statisk. Loader hurtigere, og holder backend clean.
app.use(express.json()) // Parses JSON data. Dvs. konverterer rå data fra en HTTP request til en brugbar format, som serveren kan bruge.  
app.use(cors()) // Tillader frontend at fetch fra backend

// Importér router fra routes/index.js
const userRoutes = require('./routes'); 
app.use(userRoutes); // Brug ruter fra router-filen

// Starter serveren
app.listen(PORT, () => console.log(`Server is running on http://localhost:${PORT}`))