export const portfolioChartService = {
    // Function to create pie chart
createPortfolioPieChart: (canvas, portfolios) => {
    try {
      console.log("Creating pie chart with portfolios:", portfolios);

      if (!canvas) {
        console.error("Canvas element is null or undefined");
        return;
      }

      // Create a distribution by individual stock symbol
      const stockDistribution = {};
      let totalValue = 0;

      // Aggregate by stock symbol
      portfolios.forEach(portfolio => {
        if (!portfolio.metrics || !portfolio.metrics.holdings) {
          console.error("Portfolio doesn't have metrics or holdings", portfolio);
          return;
        }

        portfolio.metrics.holdings.forEach(holding => {
          const symbol = holding.symbol;

          if (!stockDistribution[symbol]) {
            stockDistribution[symbol] = {
              value: 0,
              name: holding.security_name
            };
          }

          // Using currentValue which is price × quantity
          stockDistribution[symbol].value += holding.currentValue;
          totalValue += holding.currentValue;
        });
      });

      if (totalValue === 0) {
        console.error("No value to display in pie chart");
        return;
      }

      // Convert to arrays for Chart.js with percentages in labels
      const labels = Object.keys(stockDistribution).map(symbol => {
        const percentage = (stockDistribution[symbol].value / totalValue * 100).toFixed(1);
        return `${symbol} (${percentage}%)`;
      });

      const data = Object.values(stockDistribution).map(item => item.value);
      const percentages = data.map(value => (value / totalValue) * 100);

      console.log("Chart data:", { labels, data, percentages });

      // Generate colors
      const colors = generateChartColors(labels.length);

      // Create the pie chart
      new Chart(canvas, {
        type: "pie",
        data: {
          labels: labels,
          datasets: [{
            data: data, // Using actual monetary values
            backgroundColor: colors,
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          plugins: {
            tooltip: {
              callbacks: {
                label: function(context) {
                  const label = context.label || '';
                  const value = formatCurrency(context.raw, "DKK");
                  const percent = (context.raw / totalValue * 100).toFixed(1);
                  return `${label.split(' ')[0]}: ${value} (${percent}%)`;
                }
              }
            },
            legend: {
              position: "right",
              labels: {
                font: {
                  size: 12
                }
              }
            }
          }
        }
      });

      console.log("Chart created successfully");
    } catch (error) {
      console.error("Error creating pie chart:", error);
    }
  },

    createMockGrowthChart: (canvas) => {
        // Create a mock growth chart with random data
        // In a real app, you'd use historical data

        const labels = [];
        const data = [];

        // Generate data for the last 12 months
        const now = new Date();
        for (let i = 11; i >= 0; i--) {
          const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
          labels.push(
            date.toLocaleDateString("da-DK", { month: "short", year: "numeric" })
          );

          // Generate a random value that trends upward
          const value = 10000 + i * 500 + Math.random() * 1000;
          data.push(value);
        }

        new Chart(canvas, {
          type: "line",
          data: {
            labels: labels,
            datasets: [
              {
                label: "Portfolio Value",
                data: data,
                borderColor: "#00DA91",
                backgroundColor: "rgba(0, 218, 145, 0.1)",
                tension: 0.1,
                fill: true,
              },
            ],
          },
          options: {
            responsive: true,
            scales: {
              y: {
                beginAtZero: false,
              },
            },
          },
        });
      },
}

// Helper function to generate chart colors
const generateChartColors = (count) => {
    const baseColors = [
      "#00DA91", // Green
      "#4B6EFF", // Blue
      "#FFB800", // Yellow
      "#FF4D4F", // Red
      "#9254DE", // Purple
      "#36CFC9", // Teal
      "#FF7A45", // Orange
      "#73D13D", // Light green
    ];

    // If we need more colors than in our base array, generate them
    const colors = [...baseColors];

    while (colors.length < count) {
      const r = Math.floor(Math.random() * 255);
      const g = Math.floor(Math.random() * 255);
      const b = Math.floor(Math.random() * 255);
      colors.push(`rgb(${r}, ${g}, ${b})`);
    }

    return colors.slice(0, count);
  }