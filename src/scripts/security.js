import { stockAPI } from "./api.js";

document.addEventListener('DOMContentLoaded', async () =>  {
    console.log('Security page loaded!');

    const urlParams = new URLSearchParams(window.location.search);
    const symbol = urlParams.get('symbol');
    console.log(`Stock symbol: ${symbol}`);

    try {
        // Get company overview data
        const companyData = await stockAPI.getCompanyOverview(symbol);
        displayCompanyInfo(companyData, symbol);

        // price history data for graph (chart.js)
        const timeSeriesData = await stockAPI.getDailyTimeSeries(symbol);
        createPriceChart(timeSeriesData);
    } catch (error) {
        console.error('Error fetching data:', error);
    }
})


function updateStockHeader(text) {
    const stockHeader = document.querySelector('.security-graph h2');

    if (!stockHeader) {
    console.error('Could not find the stock');
    }
    stockHeader.textContent = text;
}

function displayCompanyInfo(companyData, symbol) {
    console.log('Company data: ', companyData)
        // Check if we have the data
        if (!companyData || Object.keys(companyData).length === 0) {
            console.error('No company data available');
            updateStockHeader(`${symbol} - Data not available`);
            return;
        }
        if (companyData.Name) {
            updateStockHeader(companyData.Name)
        } else if (companyData.name) {
            updateStockHeader(companyData.name)
        }
        else {
            updateStockHeader(symbol);
        }
}

function createPriceChart(timeSeriesData) {
    if (!timeSeriesData || !timeSeriesData['Time Series (Daily)']) {
        console.error('Invalid time series data format');
        return
    }

    const canvas = document.getElementById('portfolioChart');
    if (!canvas) {
        console.error('Canvas element not found');
    }

    // Defining the key in the json file
    const timeSeries = timeSeriesData['Time Series (Daily)'];

    // converting the object to array for easier use with Object.entries
    const dataPoints = Object.entries(timeSeries);

    // Sorting from oldest to newest
    dataPoints.sort((a, b) => new Date(a[0]) - new Date(b[0]));

    // Using the last 30 days as data
    const recentData = dataPoints.slice(-365);


    // Extracting the dates and clising prices for the chart
    const dates = [];
    const prices = [];

    recentData.forEach(([date, values]) => {
        // Adding the date to our dates array
        dates.push(date)

        // Adding the closing price to our prices array, in the data from Alpha Vantage, it is the '4. close' that's the key for the closing price:
        prices.push(parseFloat(values['4. close']));
    });

    // Logging our two arrays to the console for debugging
    console.log('Dates: ', dates)
    console.log('Prices: ', prices)

    // Now I am creating the chart with chart.js
    new Chart(canvas, {
        type: 'line',

        // providing the data:
        data: {
            labels: dates, // this is the x-axis labels
            datasets: [{
                label: 'Aktie Pris (USD)',
                data: prices, // The y-axis data (closing prices)


            // Here we are styling the line
            borderColor: '#00DA91', // The highlight color color.css
            backgroundColor: '#151F32', // Primary color
            borderWidth: 2,
            tension: 0.1 // This is just a slightly curve
            }]
        },

        // Configurating the chart options:
        options: {
            responsive: true, // Capable of resizing the chart if the container size changes

            // Plugins like (title, legend, tooltip)
            plugins: {
                title: {
                    display: true,
                    text: 'Aktie pris (1 år)'
                },
                tooltip: {
                    mode: 'index', // showing all values at a particular x-value
                    intersect: false,
                }
            },

            // Configuring axes
            scales: {
                y: {
                    beginAtZero: false, // Not forcing axes to start at 0
                    title: {
                        display: true,
                        text: 'Pris (USD)'
                    }
                },

                x: {
                    title: {
                        display: true,
                        text: 'Dato'
                    }
                }
            }
        }
    });
}