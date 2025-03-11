const mockData = {
  // User data
  currentUser: {
    id: 1,
    name: "testUser",
    email: "test@gmail.com",
    phone: "123456789",
    password: "test1234",
  },

  // Accounts data
  accounts: [
    {
      id: 1,
      name: "Hovedkonto",
      currency: "DKK",
      balance: 50000,
      createdAt: "2024-01-15T00:00:00Z",
      closedAt: null,
      bankId: 1,
    },
  ],

  // Portfolios
  portfolios: [
    {
      id: 1,
      name: "Growth Tech",
      accountId: 1,
      createdAt: "2024-01-15T00:00:00Z",
      totalValue: 123567,
      changePercent: 1.87,
      holdings: [
        {
          securityId: 1,
          ticker: "AAPL",
          name: "Apple Inc.",
          quantity: 10,
          averagePrice: 180.5,
          currentPrice: 191.2,
          totalValue: 1912,
          unrealizedGain: 107,
        },
        {
          securityId: 2,
          ticker: "MSFT",
          name: "Microsoft Corporation",
          quantity: 15,
          averagePrice: 150.2,
          currentPrice: 160.1,
          totalValue: 2401.5,
          unrealizedGain: 148,
        },
        // More holdings if needed...
      ],
    },
    {
      id: 2,
      name: "Bank & Finance",
      accountId: 1,
      createdAt: "2024-02-01T00:00:00Z",
      totalValue: 28141,
      changePercent: -0.65,
      holdings: [
        // Holdings...
        {
          securityId: 3,
          ticker: "JPM",
          name: "JPMorgan Chase & Co.",
          quantity: 5,
          averagePrice: 110.2,
          currentPrice: 105.5,
          totalValue: 527.5,
          unrealizedGain: -23.5,
        },
      ],
    },
  ],

  // Transactions
  transactions: [
    {
      id: 1,
      accountId: 1,
      type: "DEPOSIT",
      amount: 10000,
      currency: "DKK",
      date: "2024-01-16T10:30:00Z",
      description: "Initial deposit",
    },

    {
      id: 2,
      accountId: 1,
      type: "WITHDRAWAL",
      amount: 500,
      currency: "DKK",
      date: "2024-01-17T12:45:00Z",
      description: "Withdrawal",
    },
  ],

  // Trades
  trades: [
    {
      id: 1,
      portfolioId: 1,
      securityId: 1,
      ticker: "AAPL",
      name: "Apple Inc.",
      quantity: 10,
      price: 180.5,
      fee: 45.13,
      type: "BUY",
      date: "2024-01-17T14:22:00Z",
      total: 1850.13,
    },

    {
      id: 2,
      portfolioId: 1,
      securityId: 1,
      ticker: "AAPL",
      name: "Apple Inc.",
      quantity: 5,
      price: 191.2,
      fee: 22.13,
      type: "SELL",
      date: "2024-01-18T10:15:00Z",
      total: 956.13,
    },
  ],
};

// Export for use in other files
window.mockData = mockData;
