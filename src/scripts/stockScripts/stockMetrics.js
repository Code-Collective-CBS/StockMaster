
export const stockMetrics = {
    displayStockData: function(companyData, currentPrice) {
        if (!companyData) {
            console.error('No company data available');
            return;
        }

        // Populate each section
        this.populateKeyStatistics(companyData, currentPrice);
        this.populateDividends(companyData);
        this.populateCompanyProfile(companyData);
        this.populateTechnicalIndicators(companyData);
        this.createAnalystVisualizations(companyData, currentPrice);
    },

    /**
     * Format large numbers with K, M, B, T suffixes
     */
    formatNumber: function(num) {
        if (!num) return '-';
        num = parseFloat(num);

        if (isNaN(num)) return '-';

        if (num >= 1e12) return (num / 1e12).toFixed(2) + 'T'; //Trillion
        if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B'; // Billion
        if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M'; // Million
        if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K'; // // Thousand
        return num.toFixed(2);
    },

    // Format percentage values
    formatPercent: function(percent) {
        if (!percent) return '-';
        const num = parseFloat(percent);
        if (isNaN(num)) return '-';
        return (num * 100).toFixed(2) + '%';
    },

    /**
     * Update text content of an element if it exists
     */
    updateElement: function(id, value) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value || '-';
        }
    },

    /**
     * Populate key statistics section
     */
    populateKeyStatistics: function(companyData, currentPrice) {
        this.updateElement('prevClose', currentPrice?.toFixed(2)); // The "?" is the optional operater and checks if it even exists
        this.updateElement('daysRange',
            `${companyData['52WeekLow']} - ${companyData['52WeekHigh']}`);
        this.updateElement('marketCap',
            this.formatNumber(companyData.MarketCapitalization));
        this.updateElement('weekRange',
            `${companyData['52WeekLow']} - ${companyData['52WeekHigh']}`);
        this.updateElement('beta', companyData.Beta);

        // Volume is often not in the company overview API
        this.updateElement('volume', '-');

        this.updateElement('peRatio', companyData.PERatio);
        this.updateElement('forwardPE', companyData.ForwardPE);
        this.updateElement('eps', companyData.EPS);
    },

    /**
     * Populate dividends section
     */
    populateDividends: function(companyData) {
        // Skip if no dividend data is available
        if (!companyData.DividendPerShare || companyData.DividendPerShare === '0') {
            const dividendSection = document.querySelector('.stock-info-section:nth-child(2)');
            if (dividendSection) {
                dividendSection.style.display = 'none';
            }
            return;
        }

        this.updateElement('dividendPerShare', companyData.DividendPerShare);
        this.updateElement('dividendYield',
            this.formatPercent(companyData.DividendYield));
        this.updateElement('exDividendDate', companyData.ExDividendDate);
    },

    /**
     * Populate company profile section
     */
    populateCompanyProfile: function(companyData) {
        this.updateElement('sector', companyData.Sector);
        this.updateElement('industry', companyData.Industry);
        this.updateElement('country', companyData.Country);
        this.updateElement('exchange', companyData.Exchange);
    },

    /**
     * Populate technical indicators section
     */
    populateTechnicalIndicators: function(companyData) {
        this.updateElement('movingAvg50', companyData['50DayMovingAverage']);
        this.updateElement('movingAvg200', companyData['200DayMovingAverage']);
    },

    /**
     * Create analyst visualizations
     */
    createAnalystVisualizations: function(companyData, currentPrice) {
        // Skip if no analyst data is available
        if (!companyData.AnalystRatingBuy &&
            !companyData.AnalystRatingStrongBuy &&
            !companyData.AnalystTargetPrice) {

            const analystSection = document.querySelector('.analyst-section');
            if (analystSection) {
                analystSection.style.display = 'none';
            }
            return;
        }

        // Create analyst ratings chart
        this.createAnalystRatingsChart(companyData);

        // Update price target gauge
        this.updatePriceTargetGauge(companyData, currentPrice);
    },

    /**
     * Create analyst ratings chart
     */
    createAnalystRatingsChart: function(companyData) {
        const canvas = document.getElementById('analystRatingsChart');
        if (!canvas) return;

        // Get analyst ratings
        const strongBuy = parseInt(companyData.AnalystRatingStrongBuy) || 0;
        const buy = parseInt(companyData.AnalystRatingBuy) || 0;
        const hold = parseInt(companyData.AnalystRatingHold) || 0;
        const sell = parseInt(companyData.AnalystRatingSell) || 0;
        const strongSell = parseInt(companyData.AnalystRatingStrongSell) || 0;

        // Create the chart
        new Chart(canvas, {
            type: 'bar',
            data: {
                labels: ['Strong Buy', 'Buy', 'Hold', 'Sell', 'Strong Sell'],
                datasets: [{
                    label: 'Analyst Ratings',
                    data: [strongBuy, buy, hold, sell, strongSell],
                    backgroundColor: [
                        '#00DA91', // Strong Buy (your highlight color)
                        '#4CAF50', // Buy
                        '#FFD700', // Hold
                        '#FF9800', // Sell
                        '#F44336'  // Strong Sell
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 5
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });
    },

    /**
     * Update price target gauge
     */
    updatePriceTargetGauge: function(companyData, currentPrice) {
        // Get price targets
        const targetPrice = parseFloat(companyData.AnalystTargetPrice);
        const weekLow = parseFloat(companyData['52WeekLow']);
        const weekHigh = parseFloat(companyData['52WeekHigh']);

        if (!targetPrice || !weekLow || !weekHigh || !currentPrice) return;

        // Set the values
        this.updateElement('lowTarget', `$${weekLow.toFixed(2)}`);
        this.updateElement('avgTarget', `$${targetPrice.toFixed(2)}`);
        this.updateElement('highTarget', `$${weekHigh.toFixed(2)}`);
        this.updateElement('currentPriceValue', `$${currentPrice.toFixed(2)}`);
        this.updateElement('targetPriceValue', `$${targetPrice.toFixed(2)}`);

        // Calculate positions on the gauge
        const range = weekHigh - weekLow;
        const targetRange = document.getElementById('targetRange');
        const currentMarker = document.getElementById('currentPrice');

        if (targetRange) {
            targetRange.style.width = '100%';
        }

        // Position the current price marker
        if (currentMarker) {
            const currentPosition = ((currentPrice - weekLow) / range) * 100;
            currentMarker.style.left = `${currentPosition}%`;
        }
    }
}