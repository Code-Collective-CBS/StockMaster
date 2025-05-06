export const favoredStocks = {
  populateStocksList: (listElement, portfolios, formatCurrencyFn) => {
    listElement.innerHTML = "";

    // Creates column headers
    const headerRow = document.createElement("div");
    headerRow.className = "stock-header-row";

    // Creates headers matching the cell structure below
    headerRow.append(createHeader("Symbol"));
    headerRow.append(createHeader("Name"));
    headerRow.append(createHeader("Last Bought"));
    headerRow.append(createHeader("Current"));
    headerRow.append(createHeader("GAK"));
    headerRow.append(createHeader("Qty"));
    headerRow.append(createHeader("Value"));
    headerRow.append(createHeader("Change"));

    listElement.appendChild(headerRow);

    portfolios.forEach((portfolio) => {
      if (portfolio.metrics && portfolio.metrics.holdings) {
        // Creates portfolio title
        const portfolioHeader = document.createElement("div");
        portfolioHeader.className = "portfolio-header";
        portfolioHeader.textContent = portfolio.name;
        listElement.appendChild(portfolioHeader);

        // Add portfolio unrealized value
        const portfolioUnrealized = document.createElement('p');
        portfolioUnrealized.textContent = `Unrealized: ${portfolio.metrics.totalUnrealizedGain.toFixed(2)} (${portfolio.currency})`
        portfolioUnrealized.classList.add(
          portfolio.metrics.totalUnrealizedGain >= 0 ? "positive-change" : "negative-change"
        );
        listElement.appendChild(portfolioUnrealized)

        portfolio.metrics.holdings.forEach((h) => {
          const row = document.createElement("div");
          row.className = "stock-row";

          // symbol & name
          row.append(createCell(h.symbol));
          row.append(createCell(h.security_name));

          // bought price (native)
          row.append(
            createCell(
              formatCurrencyFn(h.lastBoughtPricePerShare, h.nativeCurrency)
            )
          );

          // current price (native)
          row.append(
            createCell(formatCurrencyFn(h.currentPriceNative, h.nativeCurrency))
          );

          // GAK (native)
          row.append(createCell(formatCurrencyFn(h.gak, h.nativeCurrency)));

          // quantity
          row.append(createCell(h.quantity));

          // total value in account currency
          row.append(
            createCell(
              formatCurrencyFn(h.currentValueAccount, portfolio.currency)
            )
          );

          // change % = (currPrice - boughtPrice) / boughtPrice
          const changePct =
            h.lastBoughtPricePerShare > 0
              ? ((h.currentPriceNative - h.lastBoughtPricePerShare) /
                  h.lastBoughtPricePerShare) *
                100
              : 0;
          const changeCell = createCell(`${changePct.toFixed(2)}%`);
          changeCell.classList.add(
            changePct >= 0 ? "positive-change" : "negative-change"
          );
          row.append(changeCell);

          // The URL for the stock
          const targetUrl =
            "http://localhost:3000/src/pages/security.html?symbol=" +
            encodeURIComponent(h.symbol);

          // Make the whole row a click target
          row.addEventListener("click", () => {
            window.location.href = targetUrl;
          });

          // Change cursor on hover
          row.style.cursor = "pointer";

          listElement.appendChild(row);
        });
      }

      // spacer
      const spacer = document.createElement("div");
      spacer.className = "portfolio-spacer";
      listElement.appendChild(spacer);
    });

    function createCell(content) {
      const div = document.createElement("div");
      div.className = "stock-cell";
      div.textContent = content;
      return div;
    }

    function createHeader(content) {
      const div = document.createElement("div");
      div.className = "stock-header-cell";
      div.textContent = content;
      return div;
    }
  },
};
