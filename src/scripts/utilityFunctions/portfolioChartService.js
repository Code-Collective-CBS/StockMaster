export const portfolioChartService = {
  // Function to create pie chart
  createPortfolioPieChart: (canvas, portfolios) => {
    try {
      if (!canvas || !portfolios || portfolios.length === 0) {
        console.warn("Missing canvas or portfolio data");
        return null;
      }

      // Clear any existing chart
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Extract portfolio names and values
      const portfolioValues = portfolios.map((portfolio) => ({
        name: portfolio.name,
        value: portfolio.metrics.totalCostNative || 0,
      }));

      // Skip if no values
      if (
        portfolioValues.length === 0 ||
        portfolioValues.every((p) => p.value === 0)
      ) {
        console.warn("No portfolio values to display");
        return null;
      }

      // Prepare data for chart
      const totalValue = portfolioValues.reduce((sum, p) => sum + p.value, 0);
      const labels = portfolioValues.map((p) => {
        const percentage = ((p.value / totalValue) * 100).toFixed(1);
        return `${p.name} (${percentage}%)`;
      });
      const data = portfolioValues.map((p) => p.value);

      // Generate colors
      const colors = generateChartColors(labels.length);

      // Ensure proper size before rendering
      canvas.style.width = '100%';
      canvas.style.height = '300px';

      // Create chart
      const chartInstance = new Chart(canvas, {
        type: "pie",
        data: {
          labels: labels,
          datasets: [
            {
              data: data,
              backgroundColor: colors,
              borderWidth: 1,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            tooltip: {
              callbacks: {
                label: function (context) {
                  const label = context.label || "";
                  const value = formatCurrency(context.raw, "DKK");
                  const percent = ((context.raw / totalValue) * 100).toFixed(1);
                  return `${label.split(" ")[0]}: ${value} (${percent}%)`;
                },
              },
            },
            legend: {
              position: "right",
              labels: {
                font: {
                  size: 12,
                },
              },
            },
          },
        },
      });

      return chartInstance;
    } catch (error) {
      console.error("Error creating pie chart:", error);
      return null;
    }
  },

  // Similar changes to createHoldingsDistributionChart
  createHoldingsDistributionChart: (canvas, portfolio) => {
    try {
      if (
        !canvas ||
        !portfolio ||
        !portfolio.metrics ||
        !portfolio.metrics.holdings
      ) {
        console.warn("Missing canvas or portfolio holdings data");
        return null;
      }

      // Clear any existing chart
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const holdings = portfolio.metrics.holdings;

      // Skip if no holdings
      if (holdings.length === 0) {
        console.warn("No holdings to display");
        return null;
      }

      // Prepare data for chart
      const totalValue = holdings.reduce((sum, h) => sum + h.currentValueAccount, 0);

      // Map holdings to chart data
      const chartData = holdings.map((holding) => ({
        symbol: holding.symbol,
        name: holding.security_name,
        value: holding.currentValueAccount,
        percentage: (holding.currentValueAccount / totalValue) * 100,
      }));

      // Sort by value descending for better visualization
      chartData.sort((a, b) => b.value - a.value);

      const labels = chartData.map(
        (item) => `${item.symbol} (${item.percentage.toFixed(1)}%)`
      );

      const data = chartData.map((item) => item.value);

      // Generate colors
      const colors = generateChartColors(labels.length);

      // Destroy previous chart if it exists
      if (canvas.chart) {
        canvas.chart.destroy();
      }

      // Ensure proper size before rendering
      canvas.style.width = '100%';
      canvas.style.height = '300px';

      // Create chart
      canvas.chart = new Chart(canvas, {
        type: "pie",
        data: {
          labels: labels,
          datasets: [
            {
              data: data,
              backgroundColor: colors,
              borderWidth: 1,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            title: {
              display: true,
              text: `Holdings in ${portfolio.name}`,
              font: {
                size: 16,
              },
            },
            tooltip: {
              callbacks: {
                label: function (context) {
                  const item = chartData[context.dataIndex];
                  const value = formatCurrency(item.value, portfolio.currency);
                  return `${item.name}: ${value} (${item.percentage.toFixed(
                    1
                  )}%)`;
                },
              },
            },
            legend: {
              position: "right",
              labels: {
                font: {
                  size: 12,
                },
              },
            },
          },
        },
      });

      return canvas.chart;
    } catch (error) {
      console.error("Error creating holdings distribution chart:", error);
      return null;
    }
  },

  // Enhanced Portfolio History Chart Function
  createPortfolioHistoryChart: (canvas, history, currencyCode) => {
    if (!canvas || !Array.isArray(history) || history.length === 0) {
      console.warn("Missing canvas or history data");
      return null;
    }

    // Clear any existing chart
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Process and clean the data
    // Filter out any entries with null or undefined values
    const cleanHistory = history.filter(entry =>
      entry && entry.date && entry.value !== undefined && entry.value !== null
    );

    // Sort by date (ascending)
    cleanHistory.sort((a, b) => new Date(a.date) - new Date(b.date));

    // Format labels and data
    const labels = cleanHistory.map(entry => {
      const date = new Date(entry.date);
      // Format date more compactly
      return date.toLocaleDateString("da-DK", { month: 'short', year: 'numeric' });
    });

    const data = cleanHistory.map(entry => entry.value);

    // Calculate percentage change for the tooltip
    const startValue = data[0] || 0;
    const percentageChange = data.map(value => {
      if (startValue === 0) return 0;
      return ((value - startValue) / startValue) * 100;
    });

    // Generate gradient for fill
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, 'rgba(0, 218, 145, 0.5)');  // highlight color with opacity
    gradient.addColorStop(1, 'rgba(0, 218, 145, 0.05)'); // almost transparent at bottom

    // Destroy existing chart if any
    if (canvas.chart) {
      canvas.chart.destroy();
    }

    // Ensure proper canvas size
    canvas.style.height = '300px';
    canvas.style.width = '100%';

    // Create chart
    canvas.chart = new Chart(canvas, {
      type: "line",
      data: {
        labels,
        datasets: [
          {
            label: "Portfolio Value",
            data,
            borderColor: "#00DA91",
            backgroundColor: gradient,
            tension: 0.4,
            fill: true,
            pointRadius: 0, // hide points for cleaner look
            pointHoverRadius: 5, // show points on hover
            pointHoverBackgroundColor: "#00DA91",
            pointHoverBorderColor: "#FFFFFF",
            pointHoverBorderWidth: 2,
            borderWidth: 3,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        layout: {
          padding: {
            top: 20,
            right: 20,
            bottom: 20,
            left: 20
          }
        },
        scales: {
          x: {
            grid: {
              display: false,
              drawBorder: false
            },
            ticks: {
              maxRotation: 0, // keep labels horizontal
              font: {
                size: 10,
              },
              color: "rgba(255, 255, 255, 0.7)" // slightly muted text
            }
          },
          y: {
            title: {
              display: true,
              text: currencyCode,
              color: "rgba(255, 255, 255, 0.9)",
              font: {
                size: 12,
                weight: 'bold'
              }
            },
            grid: {
              color: "rgba(255, 255, 255, 0.1)" // subtle grid lines
            },
            ticks: {
              callback: (val) =>
                new Intl.NumberFormat("da-DK", {
                  style: "decimal",
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                }).format(val) +
                " " +
                currencyCode,
              font: {
                size: 10,
              },
              color: "rgba(255, 255, 255, 0.7)" // slightly muted text
            },
            beginAtZero: false,
          },
        },
        interaction: {
          mode: 'index',
          intersect: false,
        },
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            backgroundColor: "rgba(23, 37, 64, 0.9)",
            titleColor: "#FFFFFF",
            bodyColor: "#FFFFFF",
            borderColor: "rgba(255, 255, 255, 0.2)",
            borderWidth: 1,
            padding: 10,
            displayColors: false,
            callbacks: {
              // Enhanced tooltip showing value and % change
              label: function (context) {
                const value = context.raw;
                const index = context.dataIndex;
                const formattedValue = new Intl.NumberFormat("da-DK", {
                  style: "decimal",
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                }).format(value);

                const pctChange = percentageChange[index];
                const pctSign = pctChange >= 0 ? '+' : '';
                const pctFormatted = pctChange.toFixed(2);

                return [
                  `Value: ${formattedValue} ${currencyCode}`,
                  `Change: ${pctSign}${pctFormatted}%`
                ];
              }
            }
          }
        }
      },
    });

    return canvas.chart;
  },

};

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
};

function formatCurrency(amount, currencyCode) {
  return (
    new Intl.NumberFormat("da-DK", {
      style: "decimal",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount) +
    " " +
    currencyCode
  );
}
