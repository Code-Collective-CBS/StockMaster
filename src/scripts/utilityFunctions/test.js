const getDailyTimeSeries = {
  "data": {
    "Meta Data": {
      "1. Information": "Daily Prices (open, high, low, close) and Volumes",
      "2. Symbol": "AAPL",
      "3. Last Refreshed": "2025-05-30",
      "4. Output Size": "Full size",
      "5. Time Zone": "US/Eastern"
    },
    "Time Series (Daily)": {
      "2025-05-30": {
        "1. open": "199.3700",
        "2. high": "201.9600",
        "3. low": "196.7800",
        "4. close": "200.8500",
        "5. volume": "70819942"
      },
      "2025-05-29": {
        "1. open": "203.5750",
        "2. high": "203.8100",
        "3. low": "198.5100",
        "4. close": "199.9500",
        "5. volume": "51477938"
      },
      "2025-05-28": {
        "1. open": "200.5900",
        "2. high": "202.7300",
        "3. low": "199.9000",
        "4. close": "200.4200",
        "5. volume": "45339678"
      },
      "2025-05-27": {
        "1. open": "198.3000",
        "2. high": "200.7400",
        "3. low": "197.4300",
        "4. close": "200.2100",
        "5. volume": "56288475"
      },
      "2025-05-23": {
        "1. open": "193.6650",
        "2. high": "197.7000",
        "3. low": "193.4600",
        "4. close": "195.2700",
        "5. volume": "78432918"
      }
    }
  }
};

const timeSeriesData = getDailyTimeSeries.data["Time Series (Daily)"];

// opret dato arrayet
  const rawDates = Object.entries(timeSeriesData)
  .map(([date, data]) => date)
  .sort((dateA, dateB) => new Date(dateA) - new Date(dateB));

  const prices = Object.entries(timeSeriesData)
  .sort(([dateA], [dateB]) => new Date(dateA) - new Date(dateB))
  .map(([date, data]) => data["4. close"]);

  console.log(rawDates)
  console.log(prices);
