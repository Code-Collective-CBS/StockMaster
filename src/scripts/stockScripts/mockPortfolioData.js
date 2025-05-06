// src/scripts/mockPortfolioData.js
export const mockPortfolioData = [
    {
      "id": 1,
      "name": "Nik's Konge Portefølje!",
      "account_id": 2,
      "create_date": "2025-04-12T13:23:00.050Z",
      "balance": 10000,
      "currency": "DKK",
      "account_name": "Opsparing",
      "holdings": [
        {
          "securityId": 1,
          "security_name": "Agilent Technologies Inc. Common Stock",
          "symbol": "A",
          "type": "Aktie",
          "quantity": 10,
          "totalCost": 1350,
          "transactions": [
            {
              "id": 7,
              "portfolio_id": 1,
              "securities_id": 1,
              "transaction_type": "BUY",
              "amount": 10,
              "price_per_share": 135,
              "total_price": 1350,
              "transaction_date": "2025-04-12T14:37:07.593Z",
              "symbol": "A",
              "security_name": "Agilent Technologies Inc. Common Stock",
              "security_type": "Aktie"
            }
          ],
          "gak": 135
        },
        {
          "securityId": 2,
          "security_name": "Alcoa Corporation Common Stock",
          "symbol": "AA",
          "type": "Aktie",
          "quantity": 7,
          "totalCost": 350,
          "transactions": [
            {
              "id": 8,
              "portfolio_id": 1,
              "securities_id": 2,
              "transaction_type": "BUY",
              "amount": 7,
              "price_per_share": 50,
              "total_price": 350,
              "transaction_date": "2025-04-12T14:37:07.593Z",
              "symbol": "AA",
              "security_name": "Alcoa Corporation Common Stock",
              "security_type": "Aktie"
            }
          ],
          "gak": 50
        },
        {
          "securityId": 4,
          "security_name": "ATA Creativity Global American Depositary Shares",
          "symbol": "AACG",
          "type": "Aktie",
          "quantity": 20,
          "totalCost": 90,
          "transactions": [
            {
              "id": 9,
              "portfolio_id": 1,
              "securities_id": 4,
              "transaction_type": "BUY",
              "amount": 20,
              "price_per_share": 4.5,
              "total_price": 90,
              "transaction_date": "2025-04-12T14:37:07.593Z",
              "symbol": "AACG",
              "security_name": "ATA Creativity Global American Depositary Shares",
              "security_type": "Aktie"
            }
          ],
          "gak": 4.5
        },
        {
          "securityId": 6,
          "security_name": "American Airlines Group Inc. Common Stock",
          "symbol": "AAL",
          "type": "Aktie",
          "quantity": 15,
          "totalCost": 225,
          "transactions": [
            {
              "id": 10,
              "portfolio_id": 1,
              "securities_id": 6,
              "transaction_type": "BUY",
              "amount": 15,
              "price_per_share": 15,
              "total_price": 225,
              "transaction_date": "2025-04-12T14:37:07.593Z",
              "symbol": "AAL",
              "security_name": "American Airlines Group Inc. Common Stock",
              "security_type": "Aktie"
            }
          ],
          "gak": 15
        },
        {
          "securityId": 12,
          "security_name": "Advance Auto Parts Inc.",
          "symbol": "AAP",
          "type": "Aktie",
          "quantity": 5,
          "totalCost": 550,
          "transactions": [
            {
              "id": 11,
              "portfolio_id": 1,
              "securities_id": 12,
              "transaction_type": "BUY",
              "amount": 5,
              "price_per_share": 110,
              "total_price": 550,
              "transaction_date": "2025-04-12T14:37:07.593Z",
              "symbol": "AAP",
              "security_name": "Advance Auto Parts Inc.",
              "security_type": "Aktie"
            }
          ],
          "gak": 110
        }
      ],
      "metrics": {
        "holdings": [
          {
            "securityId": 1,
            "security_name": "Agilent Technologies Inc. Common Stock",
            "symbol": "A",
            "type": "Aktie",
            "quantity": 10,
            "totalCost": 1350,
            "transactions": [
              {
                "id": 7,
                "portfolio_id": 1,
                "securities_id": 1,
                "transaction_type": "BUY",
                "amount": 10,
                "price_per_share": 135,
                "total_price": 1350,
                "transaction_date": "2025-04-12T14:37:07.593Z",
                "symbol": "A",
                "security_name": "Agilent Technologies Inc. Common Stock",
                "security_type": "Aktie"
              }
            ],
            "gak": 135,
            "currentPrice": 102.71,
            "currentValue": 1027.1,
            "unrealizedGain": -322.9000000000001,
            "unrealizedGainPercent": -23.918518518518525
          },
          {
            "securityId": 2,
            "security_name": "Alcoa Corporation Common Stock",
            "symbol": "AA",
            "type": "Aktie",
            "quantity": 7,
            "totalCost": 350,
            "transactions": [
              {
                "id": 8,
                "portfolio_id": 1,
                "securities_id": 2,
                "transaction_type": "BUY",
                "amount": 7,
                "price_per_share": 50,
                "total_price": 350,
                "transaction_date": "2025-04-12T14:37:07.593Z",
                "symbol": "AA",
                "security_name": "Alcoa Corporation Common Stock",
                "security_type": "Aktie"
              }
            ],
            "gak": 50,
            "currentPrice": 24.75,
            "currentValue": 173.25,
            "unrealizedGain": -176.75,
            "unrealizedGainPercent": -50.5
          },
          {
            "securityId": 4,
            "security_name": "ATA Creativity Global American Depositary Shares",
            "symbol": "AACG",
            "type": "Aktie",
            "quantity": 20,
            "totalCost": 90,
            "transactions": [
              {
                "id": 9,
                "portfolio_id": 1,
                "securities_id": 4,
                "transaction_type": "BUY",
                "amount": 20,
                "price_per_share": 4.5,
                "total_price": 90,
                "transaction_date": "2025-04-12T14:37:07.593Z",
                "symbol": "AACG",
                "security_name": "ATA Creativity Global American Depositary Shares",
                "security_type": "Aktie"
              }
            ],
            "gak": 4.5,
            "currentPrice": 0.9599,
            "currentValue": 19.198,
            "unrealizedGain": -70.80199999999999,
            "unrealizedGainPercent": -78.66888888888887
          },
          {
            "securityId": 6,
            "security_name": "American Airlines Group Inc. Common Stock",
            "symbol": "AAL",
            "type": "Aktie",
            "quantity": 15,
            "totalCost": 225,
            "transactions": [
              {
                "id": 10,
                "portfolio_id": 1,
                "securities_id": 6,
                "transaction_type": "BUY",
                "amount": 15,
                "price_per_share": 15,
                "total_price": 225,
                "transaction_date": "2025-04-12T14:37:07.593Z",
                "symbol": "AAL",
                "security_name": "American Airlines Group Inc. Common Stock",
                "security_type": "Aktie"
              }
            ],
            "gak": 15,
            "currentPrice": 9.67,
            "currentValue": 145.05,
            "unrealizedGain": -79.94999999999999,
            "unrealizedGainPercent": -35.53333333333333
          },
          {
            "securityId": 12,
            "security_name": "Advance Auto Parts Inc.",
            "symbol": "AAP",
            "type": "Aktie",
            "quantity": 5,
            "totalCost": 550,
            "transactions": [
              {
                "id": 11,
                "portfolio_id": 1,
                "securities_id": 12,
                "transaction_type": "BUY",
                "amount": 5,
                "price_per_share": 110,
                "total_price": 550,
                "transaction_date": "2025-04-12T14:37:07.593Z",
                "symbol": "AAP",
                "security_name": "Advance Auto Parts Inc.",
                "security_type": "Aktie"
              }
            ],
            "gak": 110,
            "currentPrice": 32.26,
            "currentValue": 161.29999999999998,
            "unrealizedGain": -388.70000000000005,
            "unrealizedGainPercent": -70.67272727272727
          }
        ],
        "totalCost": 2565,
        "totalCurrentValue": 1525.898,
        "totalUnrealizedGain": -1039.102,
        "totalUnrealizedGainPercent": -40.51079922027291
      }
    }
  ];