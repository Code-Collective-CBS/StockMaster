//////////////////////////// ALPHA VANTAGE ////////////////////////////
var request = require('request');
'use strict';

const url = 'https://www.alphavantage.co';
const query = '';

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