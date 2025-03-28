const path = require('path'); // Import path before using it
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const express = require('express');
const cors = require('cors');
const config = require('./config/config');
const app = express();
const session = require('express-session');

// Debugging logs
console.log('Current working directory:', process.cwd());
console.log('Server file directory:', __dirname);
console.log('Config:', config);

// Session Middleware setup
app.use(session({
    secret: 'din-hemmelige-nøgle-her',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: true,
        maxAge: 1000 * 60 * 60,
    },
}));

// Use port from config
const PORT = config.server.port;

// Use absolute paths for static files
app.use('/src', express.static(path.resolve(__dirname, '../src')));
app.use(express.json());
app.use(cors());

// Import router from routes/index.js
const userRoutes = require('./routes');
app.use(userRoutes);

// Start the server
app.listen(PORT, () => console.log(`Server is running on http://localhost:${PORT}`));