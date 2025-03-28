export const chartService = {
  createPriceChart: function (timeSeriesData, interval = -365) {
    if (!timeSeriesData) {
      console.error("Invalid time series data format");
      return;
    }

    const canvas = document.getElementById("portfolioChart");
    if (!canvas) {
      console.error("Canvas element not found");
      return;
    }

    // Clear existing chart
    if (window.priceChart) {
      window.priceChart.destroy();
    }

    // Also remove any existing price info displays to prevent duplication
    const existingPriceInfo = document.querySelector(".price-info");
    if (existingPriceInfo) {
      existingPriceInfo.remove();
    }

    // Use the provided time series data
    const timeSeries = timeSeriesData;

    // converting the object to array for easier use with Object.entries
    const dataPoints = Object.entries(timeSeries);

    // Sorting from oldest to newest
    dataPoints.sort((a, b) => new Date(a[0]) - new Date(b[0]));

    // Using the specified interval
    const recentData = interval < 0 ? dataPoints.slice(interval) : dataPoints;

    // Extracting the dates and closing prices for the chart
    const rawDates = [];
    const prices = [];

    recentData.forEach(([date, values]) => {
      // Adding the date to our dates array
      rawDates.push(date);

      // Adding the closing price to our prices array
      prices.push(parseFloat(values["4. close"]));
    });

    // Calculate price difference for the info block
    const startPrice = prices[0];
    const endPrice = prices[prices.length - 1];
    const priceDifference = endPrice - startPrice;
    const percentageDifference = (priceDifference / startPrice) * 100;

    // Use this.updatePriceDifferenceDisplay to call the method within the object
    this.updatePriceDifferenceDisplay(
      endPrice,
      priceDifference,
      percentageDifference
    );

    const formattedDates = this.formatDatesByInterval(rawDates, interval);

    // Create the chart
    window.priceChart = new Chart(canvas, {
      type: "line",
      data: {
        labels: formattedDates,
        datasets: [
          {
            label: "Aktie Pris (USD)",
            data: prices,
            borderColor: "#00DA91",
            backgroundColor: "rgba(0, 218, 145, 0.1)",
            borderWidth: 2,
            tension: 0.1,
            fill: true,
          },
        ],
      },
      options: {
        responsive: true,
        interaction: {
          intersect: false,
          mode: "index",
        },
        plugins: {
          title: {
            display: true,
            text: "Aktie pris",
          },
          tooltip: {
            enabled: true,
            mode: "index",
            intersect: false,
            callbacks: {
              label: function (context) {
                let label = context.dataset.label || "";
                if (label) {
                  label += ": ";
                }
                if (context.parsed.y !== null) {
                  label += new Intl.NumberFormat("da-DK", {
                    style: "currency",
                    currency: "USD",
                  }).format(context.parsed.y);
                }
                return label;
              },
              title: function (tooltipItems) {
                const idx = tooltipItems[0].dataIndex;
                return rawDates[idx];
              },
            },
          },
        },
        scales: {
          y: {
            beginAtZero: false,
            title: {
              display: true,
              text: "Pris (USD)",
            },
          },
          x: {
            title: {
              display: false,
            },
            ticks: {
              autoSkip: true,
              maxTicksLimit: interval === -7 ? 7 : 12,
              maxRotation: interval === -7 ? 30 : 0,
              callback: function (val, index) {
                return formattedDates[index] || "";
              },
            },
          },
        },
      },
    });
  },

  formatDatesByInterval: function (rawDates, interval) {
    const months = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ];
    const formattedDates = [];

    // Determine how many labels to show based on interval
    let skipFactor;

    if (interval === 0 || interval <= -1100) { // All or 3+ years - show only years
      skipFactor = Math.max(1, Math.floor(rawDates.length / 10)); // Show ~10 labels
    } else if (interval <= -365) { // 1-3 years - show quarters
      skipFactor = Math.max(1, Math.floor(rawDates.length / 12)); // Show ~12 labels (months)
    } else if (interval <= -31) { // 1-12 months - show weeks
      skipFactor = Math.max(1, Math.floor(rawDates.length / 8)); // Show ~8 labels
    } else { // 7-30 days - show individual days
      skipFactor = 1; // Show all days
    }

    // Format dates
    rawDates.forEach((dateStr, index) => {
      const date = new Date(dateStr);

      // Only show label for dates that fall on our skip factor
      if (index % skipFactor === 0 || index === rawDates.length - 1) {
        if (interval === 0 || interval <= -1095) {
          // For long intervals, just show year
          formattedDates.push(date.getFullYear().toString());
        } else if (interval <= -365) {
          // For 1+ year, show month + year
          formattedDates.push(`${months[date.getMonth()]} ${date.getFullYear()}`);
        } else if (interval <= -31) {
          // For 1+ month, show month + day
          formattedDates.push(`${months[date.getMonth()]} ${date.getDate()}`);
        } else {
          // For weeks, show month + day
          formattedDates.push(`${months[date.getMonth()]} ${date.getDate()}`);
        }
      } else {
        formattedDates.push("");
      }
    });

    return formattedDates;
  },

  updatePriceDifferenceDisplay: function (
    currentPrice,
    difference,
    percentDifference
  ) {
    // Create the element if it doesn't exist
    const priceInfoElement = document.createElement("div");
    priceInfoElement.className = "price-info";

    // Insert it before the canvas in the security-graph section
    const securityGraph = document.querySelector(".security-graph");
    const canvas = document.getElementById("portfolioChart");
    if (securityGraph && canvas) {
      securityGraph.insertBefore(priceInfoElement, canvas);
    }

    // Format values for display
    const formattedPrice = new Intl.NumberFormat("da-DK", {
      style: "decimal",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(currentPrice);

    const formattedDifference = new Intl.NumberFormat("da-DK", {
      style: "decimal",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
      signDisplay: "always",
    }).format(difference);

    const formattedPercent = new Intl.NumberFormat("da-DK", {
      style: "decimal",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
      signDisplay: "always",
    }).format(percentDifference);

    // Set color class based on whether difference is positive or negative
    const colorClass = difference >= 0 ? "positive-change" : "negative-change";

    // Update the HTML content
    priceInfoElement.innerHTML = `
        <div class="current-price">${formattedPrice} DKK</div>
        <div class="price-change ${colorClass}">
          <span>${formattedDifference}</span>
          <span>${formattedPercent}%</span>
        </div>
      `;
  },
};
