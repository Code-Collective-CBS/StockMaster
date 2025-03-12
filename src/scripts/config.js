//////// ALPHA VANTAGE API KEY ////////
'use strict';
require('dotenv').config({ path: '../../.env' });

const apiKey = process.env.APIKEY_ALPHA_VANTAGE;
console.log(apiKey);

//////// ALPHA VANTAGE ////////

var request = require('request');

const url = 'https://www.alphavantage.co/query';
const query = '/query?';

request.get({
    url: url,
    json: true,
    headers: {'User-Agent': 'request'}
  }, (err, res, data) => {
    if (err) {
      console.log('Error:', err);
    } else if (res.statusCode !== 200) {
      console.log('Status:', res.statusCode);
    } else {
      console.log(data);
    }
});

//////// FUNCTIONS API ////////

const overview = '/function=OVERVIEW';