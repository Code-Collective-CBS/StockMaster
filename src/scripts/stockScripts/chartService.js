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
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const formattedDates = [];

    // Convert string dates to Date objects
    const dateObjects = rawDates.map((dateStr) => new Date(dateStr));

    // Determine date format based on interval
    if (interval >= 0) {
      // All history - show only years
      let currentYear = null;

      dateObjects.forEach((date, index) => {
        const year = date.getFullYear();

        // Show year only when it changes
        if (currentYear !== year) {
          currentYear = year;
          formattedDates.push(year.toString());
        } else {
          formattedDates.push("");
        }
      });
    } else if (interval >= -7) {
      // Daily view - show dates as "Mar 21", "Mar 22", etc.
      dateObjects.forEach((date) => {
        const day = date.getDate();
        const month = months[date.getMonth()];
        formattedDates.push(`${month} ${day}`);
      });
    } else if (interval >= -31) {
      // Monthly view - show selected dates
      dateObjects.forEach((date) => {
        const day = date.getDate();

        // Show only every 5th day or start/end of month
        if (
          day === 1 ||
          day === 5 ||
          day === 10 ||
          day === 15 ||
          day === 20 ||
          day === 25 ||
          day === 30 ||
          day === 31 ||
          date.getTime() === dateObjects[0].getTime() ||
          date.getTime() === dateObjects[dateObjects.length - 1].getTime()
        ) {
          formattedDates.push(day.toString());
        } else {
          formattedDates.push("");
        }
      });
    } else if (interval >= -90) {
      // Quarterly view - show month names
      let currentMonth = null;

      dateObjects.forEach((date) => {
        const month = date.getMonth();

        if (currentMonth !== month) {
          currentMonth = month;
          formattedDates.push(months[month]);
        } else {
          formattedDates.push("");
        }
      });
    } else {
      // Yearly view (or longer) - show month + year for first of each month
      let currentMonth = null;
      let currentYear = null;

      dateObjects.forEach((date) => {
        const month = date.getMonth();
        const year = date.getFullYear();

        if (currentMonth !== month || currentYear !== year) {
          currentMonth = month;
          currentYear = year;

          if (interval < -1095) {
            // > 3 years
            // For very long intervals, only show month + year at 3-month intervals
            if (month === 0 || month === 3 || month === 6 || month === 9) {
              formattedDates.push(`${months[month]} ${year}`);
            } else {
              formattedDates.push("");
            }
          } else {
            formattedDates.push(months[month]);
          }
        } else {
          formattedDates.push("");
        }
      });
    }

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
