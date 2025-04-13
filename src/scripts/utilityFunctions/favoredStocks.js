export const favoredStocks = {
  populateStocksList: (listElement, portfolios, formatCurrencyFn) => {
    listElement.innerHTML = ""; // Clear existing content

    // Since we're in a portfolio view, we'll show all stocks from all portfolios
    portfolios.forEach((portfolio) => {
      // Add a portfolio header
      const portfolioHeader = document.createElement("div");
      portfolioHeader.className = "portfolio-header";
      portfolioHeader.textContent = portfolio.name;
      listElement.appendChild(portfolioHeader);

      // Add stock list header row
      const headerRow = document.createElement("div");
      headerRow.className = "stock-header-row";

      const symbolHeader = document.createElement("div");
      symbolHeader.className = "stock-cell";
      symbolHeader.textContent = "Symbol";

      const nameHeader = document.createElement("div");
      nameHeader.className = "stock-cell stock-name";
      nameHeader.textContent = "Name";

      const boughtHeader = document.createElement("div");
      boughtHeader.className = "stock-cell";
      boughtHeader.textContent = "Bought Price";

      const currentHeader = document.createElement("div");
      currentHeader.className = "stock-cell";
      currentHeader.textContent = "Current Price";

      const gakHeader = document.createElement("div");
      gakHeader.className = "stock-cell";
      gakHeader.textContent = "GAK";

      const quantityHeader = document.createElement("div");
      quantityHeader.className = "stock-cell";
      quantityHeader.textContent = "Quantity";

      const valueHeader = document.createElement("div");
      valueHeader.className = "stock-cell";
      valueHeader.textContent = "Total Value";

      const changeHeader = document.createElement("div");
      changeHeader.className = "stock-cell";
      changeHeader.textContent = "Change %";

      headerRow.appendChild(symbolHeader);
      headerRow.appendChild(nameHeader);
      headerRow.appendChild(boughtHeader);
      headerRow.appendChild(currentHeader);
      headerRow.appendChild(gakHeader);
      headerRow.appendChild(quantityHeader);
      headerRow.appendChild(valueHeader);
      headerRow.appendChild(changeHeader);

      listElement.appendChild(headerRow);

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

          const boughtCell = document.createElement("div");
          boughtCell.className = "stock-cell";
          // Get price per share from first transaction or fallback to GAK
          const boughtPrice = holding.transactions && holding.transactions.length > 0
            ? holding.transactions[0].price_per_share
            : holding.gak;
          boughtCell.textContent = formatCurrencyFn(boughtPrice, portfolio.currency);

          const currentPriceCell = document.createElement("div");
          currentPriceCell.className = "stock-cell";
          currentPriceCell.textContent = formatCurrencyFn(holding.currentPrice, portfolio.currency);

          const gakCell = document.createElement("div");
          gakCell.className = "stock-cell";
          gakCell.textContent = formatCurrencyFn(holding.gak, portfolio.currency);

          const quantityCell = document.createElement("div");
          quantityCell.className = "stock-cell";
          quantityCell.textContent = holding.quantity;

          const valueCell = document.createElement("div");
          valueCell.className = "stock-cell";
          valueCell.textContent = formatCurrencyFn(holding.currentValue, portfolio.currency);

          const changeCell = document.createElement("div");
          changeCell.className = "stock-cell";
          changeCell.classList.add(
            holding.unrealizedGainPercent >= 0
              ? "positive-change"
              : "negative-change"
          );
          changeCell.textContent = `${holding.unrealizedGainPercent.toFixed(2)}%`;

          stockRow.appendChild(symbolCell);
          stockRow.appendChild(nameCell);
          stockRow.appendChild(boughtCell);
          stockRow.appendChild(currentPriceCell);
          stockRow.appendChild(gakCell);
          stockRow.appendChild(quantityCell);
          stockRow.appendChild(valueCell);
          stockRow.appendChild(changeCell);

          listElement.appendChild(stockRow);
        });
      }

      // Add a spacer after each portfolio's stocks
      const spacer = document.createElement("div");
      spacer.className = "portfolio-spacer";
      listElement.appendChild(spacer);
    });
  }
};