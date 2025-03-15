/* This is a service file that interacts with Alpha Vantage and should inculde:

Import the configuration from your config file
Define methods for each Alpha Vantage endpoint you need
Handle the actual API requests
Process responses before returning them
*/

const axios = require('axios');
const config = require('../config/config');
