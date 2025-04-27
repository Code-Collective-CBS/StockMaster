export const portfolioChartService = {
  // Function to create pie chart
  createPortfolioPieChart: (canvas, portfolios) => {
    try {
      if (!canvas || !portfolios || portfolios.length === 0) {
        console.warn("Missing canvas or portfolio data");
        return;
      }

      // Extract portfolio names and values
      const portfolioValues = portfolios.map((portfolio) => ({
        name: portfolio.name,
        value: portfolio.metrics.totalCost || 0,
      }));

      // Skip if no values
      if (
        portfolioValues.length === 0 ||
        portfolioValues.every((p) => p.value === 0)
      ) {
        console.warn("No portfolio values to display");
        return;
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

      // Create chart
      new Chart(canvas, {
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
    } catch (error) {
      console.error("Error creating pie chart:", error);
    }
  },

  createHoldingsDistributionChart: (canvas, portfolio) => {
    try {
      if (
        !canvas ||
        !portfolio ||
        !portfolio.metrics ||
        !portfolio.metrics.holdings
      ) {
        console.warn("Missing canvas or portfolio holdings data");
        return;
      }

      const holdings = portfolio.metrics.holdings;

      // Skip if no holdings
      if (holdings.length === 0) {
        console.warn("No holdings to display");
        return;
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
          maintainAspectRatio: true,
          aspectRatio: 1.5, // Adjust this value to control height (higher = shorter)
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
    } catch (error) {
      console.error("Error creating holdings distribution chart:", error);
    }
  },

  createPortfolioHistoryChart: (canvas, history, currencyCode) => {
    if (!canvas || !Array.isArray(history) || history.length === 0) {
      console.warn("Missing canvas or history data");
      return;
    }

    // Format labels and data
    const labels = history.map((p) =>
      new Date(p.date).toLocaleDateString("da-DK")
    );
    const data = history.map((p) => p.value);

    // Destroy existing chart if any
    if (canvas.chart) {
      canvas.chart.destroy();
    }

    canvas.chart = new Chart(canvas, {
      type: "line",
      data: {
        labels,
        datasets: [
          {
            label: "Portfolio Value",
            data,
            tension: 0.2,
            fill: false,
          },
        ],
      },
      options: {
        responsive: true,
        scales: {
          y: {
            title: { display: true, text: currencyCode },
            ticks: {
              callback: (val) =>
                new Intl.NumberFormat("da-DK", {
                  style: "decimal",
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                }).format(val) +
                " " +
                currencyCode,
            },
          },
        },
        plugins: {
          legend: { display: false },
        },
      },
    });
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
