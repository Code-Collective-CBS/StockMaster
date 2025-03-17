/*This file should:

Load environment variables
Export configuration objects
NOT make any API calls directly
*/

// Load environment variables form .env file
require('dotenv').config({ path: '../../.env' });

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

console.log(config.alphaVantage.apiKey);
console.log(config.server.port, config.server.environment);
module.exports = config;