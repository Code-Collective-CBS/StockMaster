import { stockAPI } from "./api.js";

document.addEventListener('DOMContentLoaded', async () =>  {
    console.log('Security page loaded!');

    const urlParams = new URLSearchParams(window.location.search);
    const symbol = urlParams.get('symbol');
    console.log(`Stock symbol: ${symbol}`);

    // Storing time series globally so we can use it again
    let globalTimeSeriesData;

    try {
        // Get company overview data
        const companyData = await stockAPI.getCompanyOverview(symbol);
        displayCompanyName(companyData, symbol);
        displayCompanyOverview(companyData, symbol);
        updatePageTitle(companyData.Name);
        document.title = `StockMaster | ${symbol}`;

        // price history data for graph (chart.js)
        const timeSeriesData = await stockAPI.getDailyTimeSeries(symbol);
        globalTimeSeriesData = timeSeriesData; // Storing the time data (caching)
        createPriceChart(timeSeriesData);

        // Setting up the event listener for change in time interval
        const intervalSelect = document.getElementById('portfolio-graph-interval');
        if (intervalSelect) {
            intervalSelect.addEventListener('change', function() {
                const days = parseInt(this.value); // from security.html value, and then parse it to a number
                createPriceChart(globalTimeSeriesData, -days)
            })
        }


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

function displayCompanyName(companyData, symbol) {
    console.log('Company data: ', companyData)
        // Check if we have the data
        if (!companyData) {
            console.error('No company data available');
            updateStockHeader(`${symbol} - Data not available`);
            return;
        }
        if (companyData.Name) {
            updateStockHeader(companyData.Name)
        }
            updateStockHeader(symbol);
}

function displayCompanyOverview(companyData, symbol) {
    // Check if we have company data
    if (!companyData) {
        console.error(`No company data available for ${symbol}`);
        return;
    }

    const companyDescription = document.querySelector('.company-description p');
    if (!companyDescription) {
        console.error('Company description element not found in the DOM');
        return;
    }

    // Check if we have a description in the data
    if (!companyData.Description) {
        console.warn(`No description available for ${symbol}`);
        companyDescription.textContent = `No description available for ${symbol}.`;
        return;
    }

    // Display the description
    companyDescription.textContent = companyData.Description;
    console.log(`Successfully displayed ${symbol} details`);
}

function createPriceChart(timeSeriesData, interval = -365) {
    if (!timeSeriesData || !timeSeriesData['Time Series (Daily)']) {
        console.error('Invalid time series data format');
        return;
    }

    const canvas = document.getElementById('portfolioChart');
    if (!canvas) {
        console.error('Canvas element not found');
        return;
    }

    // Clear existing chart
    if (window.priceChart) {
        window.priceChart.destroy();
    }

    // Defining the key in the json file
    const timeSeries = timeSeriesData['Time Series (Daily)'];

    // converting the object to array for easier use with Object.entries
    const dataPoints = Object.entries(timeSeries);

    // Sorting from oldest to newest
    dataPoints.sort((a, b) => new Date(a[0]) - new Date(b[0]));

    // Using the specified interval
    const recentData = dataPoints.slice(interval); /* .slice() usually takes two parameters, so 1 parameter means:
    Positive number: Starts slicing from that index position to the end of the array
    Negative number: Counts backward from the end of the array

    Which means we are starting from the end of the orginial datsPoints array and slicing -365 numbers data points from that array to display 1 year
*/


    // Extracting the dates and closing prices for the chart
    const dates = [];
    const prices = [];

    recentData.forEach(([date, values]) => {
        // Adding the date to our dates array
        dates.push(date);

        // Adding the closing price to our prices array
        prices.push(parseFloat(values['4. close'])); // converts string to number
    });

    // Calculate price difference for the info block
    const startPrice = prices[0];
    const endPrice = prices[prices.length - 1];
    const priceDifference = endPrice - startPrice;
    const percentageDifference = (priceDifference / startPrice) * 100;

    // Update price difference display
    updatePriceDifferenceDisplay(endPrice, priceDifference, percentageDifference);

    // Creating the chart with chart.js
    // Using window so it is global and more accessible in other scripts
    window.priceChart = new Chart(canvas, {
        type: 'line',

        // providing the data:
        data: {
            labels: dates, // this is the x-axis labels
            datasets: [{
                label: 'Aktie Pris (USD)',
                data: prices, // The y-axis data (closing prices)

                // Here we are styling the line
                borderColor: '#00DA91', // The highlight color from color.css
                backgroundColor: 'rgba(0, 218, 145, 0.1)', // Semi-transparent area under line
                borderWidth: 2,
                tension: 0.1, //Slightly curve
                fill: true
            }]
        },

        // Configuring the chart options:
        options: {
            responsive: true, // Capable of resizing the chart if the container size changes
            interaction: {
                intersect: false, // So the mouse can hover anywhere in the canvas element, and do not have to intersect
                mode: 'index',
            },

            // Plugins like (title, legend, tooltip)
            plugins: {
                title: {
                    display: true,
                    text: 'Aktie pris'
                },
                tooltip: {
                    enabled: true,
                    mode: 'index',
                    intersect: false,
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed.y !== null) {
                                label += new Intl.NumberFormat('da-DK', {
                                    style: 'currency',
                                    currency: 'USD'
                                }).format(context.parsed.y);
                            }
                            return label;
                        }
                    }
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


function updatePriceDifferenceDisplay(currentPrice, difference, percentDifference) {
        // Create the element if it doesn't exist
        const priceInfoElement = document.createElement('div');
        priceInfoElement.className = 'price-info';

        // Insert it before the canvas in the security-graph section
        const securityGraph = document.querySelector('.security-graph');
        const canvas = document.getElementById('portfolioChart');
        if (securityGraph && canvas) {
            securityGraph.insertBefore(priceInfoElement, canvas);
        }

        // Format values for display
        const formattedPrice = new Intl.NumberFormat('da-DK', {
            style: 'decimal',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(currentPrice);

        const formattedDifference = new Intl.NumberFormat('da-DK', {
            style: 'decimal',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
            signDisplay: 'always'
        }).format(difference);

        const formattedPercent = new Intl.NumberFormat('da-DK', {
            style: 'decimal',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
            signDisplay: 'always'
        }).format(percentDifference);

        // Set color class based on whether difference is positive or negative
        const colorClass = difference >= 0 ? 'positive-change' : 'negative-change';

        // Update the HTML content
        priceInfoElement.innerHTML = `
            <div class="current-price">${formattedPrice} DKK</div>
            <div class="price-change ${colorClass}">
                <span>${formattedDifference}</span>
                <span>${formattedPercent}%</span>
            </div>
        `;
}

function updatePageTitle (stockName) {
    const pageTitle = document.querySelector('.page-title');

    if (!pageTitle) {
    console.error('Could not find the stock');
    }
    pageTitle.textContent = stockName;
}