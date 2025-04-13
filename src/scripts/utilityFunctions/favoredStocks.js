export const favoredStocks = {
  populatePortfolioList: (listElement, portfolios, formatCurrencyFn) => {
    listElement.innerHTML = ""; // Clear existing content

    portfolios.forEach((portfolio) => {
      // Create portfolio row
      const row = document.createElement("div");
      row.className = "portfolio-row";

      // Portfolio name
      const nameDiv = document.createElement("div");
      nameDiv.className = "portfolio-name";
      nameDiv.textContent = portfolio.name;

      // Portfolio change percentage
      const changeDiv = document.createElement("div");
      changeDiv.className = "portfolio-change";
      const changePercent = portfolio.metrics.totalUnrealizedGainPercent;
      changeDiv.classList.add(
        changePercent >= 0 ? "positive-change" : "negative-change"
      );
      changeDiv.textContent = `${changePercent.toFixed(2)}%`;

      // Portfolio value
      const valueDiv = document.createElement("div");
      valueDiv.className = "portfolio-value";
      valueDiv.textContent = formatCurrencyFn(
        portfolio.metrics.totalCurrentValue,
        portfolio.currency
      );

      // Portfolio link
      const linkDiv = document.createElement("div");
      linkDiv.className = "portfolio-link";
      const link = document.createElement("a");
      link.href = `#`; // add the portfolio link here
      link.textContent = "View";
      link.addEventListener("click", (e) => {
        e.preventDefault();
        toggleStocksList(portfolio.id);
      });
      linkDiv.appendChild(link);

      // Add elements to row
      row.appendChild(nameDiv);
      row.appendChild(changeDiv);
      row.appendChild(valueDiv);
      row.appendChild(linkDiv);

      // Add row to list
      listElement.appendChild(row);

      // Create a hidden stocks list container for this portfolio
      const stocksContainer = document.createElement("div");
      stocksContainer.id = `stocks-list-${portfolio.id}`;
      stocksContainer.className = "stocks-list-container";
      stocksContainer.style.display = "none";

      // Add header row for stocks
      const headerRow = document.createElement("div");
      headerRow.className = "stocks-header-row";

      const symbolHeader = document.createElement("div");
      symbolHeader.className = "stock-cell";
      symbolHeader.textContent = "Symbol";

      const nameHeader = document.createElement("div");
      nameHeader.className = "stock-cell stock-name";
      nameHeader.textContent = "Name";

      const quantityHeader = document.createElement("div");
      quantityHeader.className = "stock-cell";
      quantityHeader.textContent = "Quantity";

      const valueHeader = document.createElement("div");
      valueHeader.className = "stock-cell";
      valueHeader.textContent = "Value";

      const changeHeader = document.createElement("div");
      changeHeader.className = "stock-cell";
      changeHeader.textContent = "Change";

      headerRow.appendChild(symbolHeader);
      headerRow.appendChild(nameHeader);
      headerRow.appendChild(quantityHeader);
      headerRow.appendChild(valueHeader);
      headerRow.appendChild(changeHeader);

      stocksContainer.appendChild(headerRow);

      // Add each stock in the portfolio
      if (portfolio.metrics && portfolio.metrics.holdings) {
        portfolio.metrics.holdings.forEach((holding) => {
          const stockRow = document.createElement("div");
          stockRow.className = "stock-row";

          const symbolCell = document.createElement("div");
          symbolCell.className = "stock-cell";
          symbolCell.textContent = holding.symbol;

          const nameCell = document.createElement("div");
          nameCell.className = "stock-cell stock-name";
          nameCell.textContent = holding.security_name;

          const quantityCell = document.createElement("div");
          quantityCell.className = "stock-cell";
          quantityCell.textContent = holding.quantity;

          const valueCell = document.createElement("div");
          valueCell.className = "stock-cell";
          valueCell.textContent = formatCurrencyFn(
            holding.currentValue,
            portfolio.currency
          );

          const changeCell = document.createElement("div");
          changeCell.className = "stock-cell";
          changeCell.classList.add(
            holding.unrealizedGainPercent >= 0
              ? "positive-change"
              : "negative-change"
          );
          changeCell.textContent = `${holding.unrealizedGainPercent.toFixed(
            2
          )}%`;

          stockRow.appendChild(symbolCell);
          stockRow.appendChild(nameCell);
          stockRow.appendChild(quantityCell);
          stockRow.appendChild(valueCell);
          stockRow.appendChild(changeCell);

          stocksContainer.appendChild(stockRow);
        });
      }

      listElement.appendChild(stocksContainer);
    });
  },

  // Function to toggle display of stocks list
  toggleStocksList: (portfolioId) => {
    const stocksList = document.getElementById(`stocks-list-${portfolioId}`);
    if (stocksList) {
      stocksList.style.display =
        stocksList.style.display === "none" ? "block" : "none";
    }
  },
};
