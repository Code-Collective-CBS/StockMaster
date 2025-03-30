// This is a service file that interacts with Polygon and include 1 key functions inside one object (OOP):
// getfinancials

const axios = require("axios");
const config = require("../config/config");

// Polygon service object (OOP)
const polygonService = {
    getfinancials: async (symbol) => {
        try {
            const url = `${config.polygon.baseUrl}/vX/reference/financials?ticker=${symbol}&order=asc&limit=10&sort=filing_date&apiKey=${config.polygon.apiKey}`;
            const response = await axios.get(url);
            return response.data;
        } catch (error) {
            console.error('Error fetching financials ', error);
            throw error;
        }
    },
    getIndicesoverview: async (symbol) => {
        try {
            const url = `${config.polygon.baseUrl}/v2/aggs/ticker/${symbol}/prev?apiKey=${config.polygon.apiKey}`;
            const response = await axios.get(url);
            return response.data;
        } catch (error) {
            console.error('Error fetching indicies data ', error);
            throw error;
        }
    }
}

module.exports = polygonService;