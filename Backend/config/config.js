/*This file should:

Load environment variables
Export configuration objects
NOT make any API calls directly
*/

// Load environment variables form .env file
require('dotenv').config();

const config = {
    // Server configuration
    server: {
        port: process.env.PORT || 3000,
        environment: process.env.NODE_ENV || 'development'
    },

    // Alpha vantage API configuration
    alphaVantage: {
        baseUrl: 'https://www.alphavantage.co/query',
        apiKey: process.env.ALPHA_VANTAGE_API_KEY
    }
};

module.exports = config;
