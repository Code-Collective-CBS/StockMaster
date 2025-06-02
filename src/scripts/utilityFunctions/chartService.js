export const chartService = {
  createPriceChart: function (
    timeSeriesData,
    companyCurrency,
    interval = -365 // Tager
  ) {
    if (!timeSeriesData) {
      console.error("Invalid time series data format");
      return;
    }

    const canvas = document.getElementById("portfolioChart");
    if (!canvas) {
      console.error("Canvas element not found");
      return;
    }

    // For debugging purposes
    console.log("Creating chart with interval:", interval);

    // Extract the currency code from the companyCurrency object
    // Include a fallback to "USD" in case it's undefined
    const currencyCode =
      companyCurrency && companyCurrency.Currency
        ? companyCurrency.Currency
        : "USD";

    // Clear existing chart
    if (window.priceChart) {
      window.priceChart.destroy(); // kan også bruge canvas.clearRect()
    }

    // Also remove any existing price info displays to prevent duplication
    const existingPriceInfo = document.querySelector(".price-info"); // Dette er et element, med className der bliver oprettet dynamisk
    if (existingPriceInfo) {
      // Fra tidligere
      existingPriceInfo.remove(); // Fjern elementet, så du kan oprette den igen senere
    }

    // Use the provided time series data
    const timeSeries = timeSeriesData;

    // converting the object to array of key value pairs for easier use with Object.entries
    // En JS-metode der konverterer et objekt til et array af [key, value] par.
    const dataPoints = Object.entries(timeSeries);
    // URL'en for at vise: "http://localhost:3000/api/stocks/daily/AAPL?outputsize=365"

    // Sorting from oldest to newest
    dataPoints.sort((a, b) => new Date(a[0]) - new Date(b[0])); // Sortere det nye Array (direkte manipulation) i stigende rækkefølge (ASC) vha nye instancser (new Date)
    // regnestykke: a - b (Hvis a er større end b kommer b før a, vice versa)

    // Log the total number of data points
    console.log(`Total data points: ${dataPoints.length}`);

    // Calculate the actual number of points to display based on the interval
    const pointsToShow = Math.min(
      // .Min() bruges til at sikre den laveste værdi, så vi kun viser de antal datapoints vi har
      dataPoints.length,
      interval < 0 ? Math.abs(interval) : dataPoints.length // .abs() = absolutte værdi
    );
    /*
Hvis dataPoints.length = 100 og interval = -30:
Math.abs(-30) = 30
Math.min(100, 30) = 30 - Vis kun 30 punkter

// Hvis dataPoints.length = 100 og interval = 0:
Math.min(100, 100) = 100 - Vis alle punkter

// Hvis dataPoints.length = 20 og interval = -50:
Math.min(20, 50) = 20 // Kan kun vise 20 (alt der er)
*/

    console.log(`Showing the last ${pointsToShow} data points`);

    // Using the specified interval using .slice that copies the array
    // If interval is negative, take the last |interval| elements
    // If interval is 0 or positive, take all elements
    const recentData =
      interval < 0 ? dataPoints.slice(-Math.abs(interval)) : dataPoints;

    console.log(`Filtered to ${recentData.length} data points`);

    // Extracting the dates and closing prices for the chart
    const rawDates = [];
    const prices = [];

    recentData.forEach(([date, values]) => {
      /*         '2025-05-22', (date)
    { (values)
      '1. open': '200.7100',
      '2. high': '202.7500',
      '3. low': '199.7000',
      '4. close': '201.3600',
      '5. volume': '46742407'
    }
    */
      // Adding the date to our dates array
      rawDates.push(date);

      // Adding the closing price to our prices array
      if (values && values["4. close"]) {
        prices.push(parseFloat(values["4. close"]));
      } else {
        console.warn(`Missing close price for date ${date}`);
        // Add the previous price or 0 if it's the first one
        prices.push(prices.length > 0 ? prices[prices.length - 1] : 0); // Hvis den ike eksistere,
        // pusher vi den samme som sidst for at undgå dårlig chart, men laver en horizonstal price chart
      }
    });

    // Log the date range we're displaying
    if (rawDates.length > 0) {
      console.log(
        `Date range: ${rawDates[0]} to ${rawDates[rawDates.length - 1]}` // logger ældste dato til nyeste i consollen, for bedre overblik
      );
    }

    // Calculate price difference for the info block
    const startPrice = prices[0];
    const endPrice = prices[prices.length - 1];
    const priceDifference = endPrice - startPrice;
    const percentageDifference = (priceDifference / startPrice) * 100;

    // Using this.updatePriceDifferenceDisplay to call the method within the object
    this.updatePriceDifferenceDisplay(
      endPrice,
      priceDifference,
      percentageDifference,
      currencyCode
    );

    const formattedDates = this.formatDatesByInterval(rawDates, interval);
    // Change the graph color based on the difference (red if negative)
    const chartColor = priceDifference >= 0 ? "#00DA91" : "#EB5050"; // Green or red

    const chartBackgroundColor =
      priceDifference >= 0
        ? "rgba(0, 218, 145, 0.1)" // Light green
        : "rgba(253, 55, 58, 0.1)"; // Light red

    // Create the chart
    window.priceChart = new Chart(canvas, {
      type: "line", // line chart
      data: { // dataen til chartet
        labels: formattedDates, // X-aksens labels (datoer)
        datasets: [ // Y-aksen data (priser)
          {
            label: ` Stock Price (${currencyCode})`,
            data: prices, // prices arrayet der indeholder "fourthClose" afhængigt af interval
            borderColor: chartColor, // rød / grøn afhængig af positiv/negativ
            backgroundColor: chartBackgroundColor, // transparency på 10%
            borderWidth: 2, // linje-grafen har en tykkelse på 2px
            tension: 0.1, // intensitet/aggresivitet mellem data-punkter
            fill: true, // fylder baggrunden på charten
          },
        ],
      },
      options: {
        responsive: true, // hvis du ændre skærmstørrlse
        interaction: {
          intersect: false, // du behøver ikke præcist at ramme data-punktet
          mode: "index", // laver punkter om til indexes, så på en uge har du 7 indexes
        },
        plugins: {
          tooltip: { // dette er informationsblokken der kommer når du hover over data-punkt
            enabled: true, // dette betyder vi har enabled den
            mode: "index", // deler punkter op i index
            intersect: false,
            callbacks: { // kalder sig selv så vi kan skrive vores egen kode til hvordan tooltip skal se ud
              label: function (context) { // context er en automatisk oprettet objekt af chart.js der indeholder alt information (en function med en indlejret funktion)
                let label = context.dataset.label || "";
                if (label) {
                  label += ": ";
                }
                if (context.parsed.y !== null) { // hvis priserne på y-aksen er bearbejdet (hvis værdierne findes), som er inde i prices array
                  // Use decimal style and append currency code
                  label +=
                    new Intl.NumberFormat("en-US", {
                      style: "decimal",
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    }).format(context.parsed.y) +
                    " " +
                    currencyCode;
                }
                return label; // ("Stock Price (USD): 201.58 USD")
              },
              title: function (tooltipItems) { // aoutomatisk oprettet objekt, der har alle tooltips items, som vi lige har oprettet
                const idx = tooltipItems[0].dataIndex;  // alle toolTips for hvert punkt
                return rawDates[idx]; // rawDates arryet med index for det givne tooltip
              },
            },
          },
        },
        scales: {
          y: {
            beginAtZero: false,
          },
          x: {
            title: {
              display: false,
            },
            ticks: {
              autoSkip: true,
              maxTicksLimit: interval === -7 ? 7 : 12, // hvis interval er -7 hvis maks 7 labels, ellers vis max 12 labels
              maxRotation: interval === -7 ? 30 : 0, // hvis intervallet er 7 så roter 30 grader
              callback: function (val, index) {
                return formattedDates[index] || ""; // selve datoen ("May 21")
              },
            },
          },
        },
      },
    });
  },

  formatDatesByInterval: function (rawDates, interval) {
    const months = [
      "Jan", // 0
      "Feb", // 1
      "Mar", // 2
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

    // Log the number of dates we're formatting
    console.log(`Formatting ${rawDates.length} dates for interval ${interval}`);

    // Determine how many labels to show based on interval
    let skipFactor;

    if (interval === 0 || interval <= -1100) {
      // All or 3+ years - show only years
      skipFactor = Math.max(1, Math.floor(rawDates.length / 10)); // Show ~10 labels
    } else if (interval <= -365) {
      // 1-3 years - show quarters
      skipFactor = Math.max(1, Math.floor(rawDates.length / 12)); // Show ~12 labels (months)
    } else if (interval <= -31) {
      // 1-12 months - show weeks
      skipFactor = Math.max(1, Math.floor(rawDates.length / 8)); // Show ~8 labels
    } else {
      // 7-30 days - show individual days
      skipFactor = 1; // Show all days
    }

    console.log(`Using skip factor: ${skipFactor}`);

    // Format dates
    rawDates.forEach((dateStr, index) => {
      if (!dateStr) {
        formattedDates.push("");
        return;
      }

      try {
        const date = new Date(dateStr);
        // console.log('formatDatesByInterval', date); VILLE VISE Mon Jan 06 2025 01:00:00 GMT+0100 (Centraleuropæisk normaltid)
        // Only show label for dates that fall on our skip factor
        if (index % skipFactor === 0 || index === rawDates.length - 1) { // Hvis label er deleligt med skipfaktor (fx. hvert 5. punkt) eller viser altid sidste dato ved (length-1)
          if (interval === 0 || interval <= -1095) {
            // For long intervals, just show year
            formattedDates.push(date.getFullYear().toString()); // Viser kun år ved lange intervaler +=3 år 
          } else if (interval <= -365) {
            // For 1+ year, show month + year
            formattedDates.push(
              `${months[date.getMonth()]} ${date.getFullYear()}` // Viser måned og årstal ved +=1 år
            );
          } else if (interval <= -31) {
            // For 1+ month, show month + day
            formattedDates.push(`${months[date.getMonth()]} ${date.getDate()}`); // Viser måned og dato ved +=1 måned
          } else {
            // For weeks, show month + day
            formattedDates.push(`${months[date.getMonth()]} ${date.getDate()}`); // Viser måned og dato ved alt mindre end 1 måned
          }
        } else {
          formattedDates.push(""); // Hvis index ikke er deleligt med skipfaktor eller sidste tal i rawDates. (Sikre samme antal labels som datapunkter)
        }
      } catch (e) {
        console.error(`Error formatting date ${dateStr}:`, e);
        formattedDates.push("");
      }
    });

    return formattedDates;
  },

  updatePriceDifferenceDisplay: function (
    currentPrice,
    difference,
    percentDifference,
    currencyCode = "USD" // Default to USD if no currency code is provided
  ) {
    // Creates element if it doesn't exist
    const priceInfoElement = document.createElement("div");
    priceInfoElement.className = "price-info";

    // Inserts it before the canvas in the security-graph section
    const securityGraph = document.querySelector(".security-graph");
    const canvas = document.getElementById("portfolioChart");
    if (securityGraph && canvas) {
      securityGraph.insertBefore(priceInfoElement, canvas); // hvad vil jeg gerne indsætte, reference til placeringen det skal være før
    }

    // Formats values for display using decimal style
    // indbygget js funktion til at fromttere tal efter lokal standard
    const formattedPrice =
      new Intl.NumberFormat("en-US", {
        style: "decimal",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(currentPrice) +
      " " +
      currencyCode;

    const formattedDifference =
      new Intl.NumberFormat("en-US", {
        style: "decimal",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
        signDisplay: "always",
      }).format(difference) +
      " " +
      currencyCode;

    const formattedPercent = new Intl.NumberFormat("en-US", {
      style: "decimal",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
      signDisplay: "always",
    }).format(percentDifference);

    // Sets color class based on whether difference is positive or negative
    const colorClass = difference >= 0 ? "positive-change" : "negative-change";

    // Updates the HTML content
    priceInfoElement.innerHTML = `
        <div class="current-price">${formattedPrice}</div>
        <div class="price-change ${colorClass}">
          <span>${formattedDifference}</span>
          <span>${formattedPercent}%</span>
        </div>
      `;
  },
};
