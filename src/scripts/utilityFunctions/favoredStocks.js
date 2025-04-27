export const favoredStocks = {
  populateStocksList: (listElement, portfolios, formatCurrencyFn) => {
    listElement.innerHTML = "";

    portfolios.forEach((portfolio) => {
      // … your header code stays the same …

      if (portfolio.metrics && portfolio.metrics.holdings) {
        portfolio.metrics.holdings.forEach((h) => {
          const row = document.createElement("div");
          row.className = "stock-row";

          // symbol & name
          row.append(createCell(h.symbol));
          row.append(createCell(h.security_name));

          // bought price (native)
          row.append(
            createCell(
              formatCurrencyFn(h.boughtPriceNative, h.nativeCurrency)
            )
          );

          // current price (native)
          row.append(
            createCell(
              formatCurrencyFn(h.currentPriceNative, h.nativeCurrency)
            )
          );

          // GAK (native)
          row.append(
            createCell(formatCurrencyFn(h.gak, h.nativeCurrency))
          );

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
            h.boughtPriceNative > 0
              ? ((h.currentPriceNative - h.boughtPriceNative) /
                  h.boughtPriceNative) *
                100
              : 0;
          const changeCell = createCell(`${changePct.toFixed(2)}%`);
          changeCell.classList.add(
            changePct >= 0 ? "positive-change" : "negative-change"
          );
          row.append(changeCell);

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
  },
};
