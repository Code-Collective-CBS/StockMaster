# StockMaster

## Project Overview

This project is a **Portfolio Management Web Application** designed to help students efficiently manage their stock investments. The goal is to provide a **user-friendly and intuitive platform** where users can track their **investment portfolios, transactions, and account balances** while also visualizing key financial metrics.

The application enables users to:
- Create accounts and portfolios and manage their personal investments.
- Track stock purchases and sales with **real-time market data**.
- View **portfolio performance** and visualize informative charts.
- Analyze **unrealized and realized gains/losses**.
- Access data-driven **visualizations** and key financial insights.

This project is developed as part of the **"Programming of Small Systems Development"** course at **Copenhagen Business School**.

---

### HOW TO USE?

- Open the terminal and type the command "npm start" to Download **relevant** node_modules. These Can be found in the file **package.json**

- After downloading all dependencies it will automatically start the server (The server runs on http://localhost:3000)

- Here you'll be directed to login page where you can login with email and password or **Register as an User**

---

## Tech Stack

| Component         | Technologies Used                                                                                                                             |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| **Frontend**      | HTML, CSS, JavaScript                                                                                                                         |
| **Backend**       | Node.js, Express.js                                                                                                                           |
| **Database**      | T-SQL                                                                                                                                         |
| **External APIs** | [Alpha Vantage](https://www.alphavantage.co/) for stock market data, [ExchangeRate API](https://www.exchangerate-api.com/) for currency rates |

---

## Features

### User & Account Management

- User **sign-up, login, and authentication**.
- Ability to **create, update, and inactivate accounts**.

### Portfolio Management

- Create multiple **investment portfolios**.
- Track **stock purchases and sales**.
- Compute **GAK (Gennemsnitlige anskaffelseskurs)** and **unrealized gains/losses**.

### Transactions

- Log **buying- and selling transactions**.
- Ensure correct **balance availability** for purchases.

### Data Visualization & Analysis

- **Portfolio summary** with key performance indicators.
- Line charts for **historical stock price**.
- Pie charts showing **asset allocation**.
- Ranking of **top-performing investments**.

---

### License
This project is licensed under the MIT License – see the [LICENSE](LICENSE) file for details.