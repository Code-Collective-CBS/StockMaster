# StockMaster

## 📌 Project Overview

This project is a **Portfolio Management Web Application** designed to help students efficiently manage their stock investments. The goal is to provide a **user-friendly and intuitive platform** where users can track their **investment portfolios, transactions, and account balances** while also visualizing key financial metrics.

The application enables users to:
- Create accounts and portfolios and manage their personal investments.
- Track stock purchases and sales with **real-time market data**.
- View **portfolio performance** and generate reports.
- Analyze **unrealized and realized gains/losses**.
- Access data-driven **visualizations** and key financial insights.

This project is developed as part of the **"Programming of Small Systems Development"** course at **Copenhagen Business School**.

---

## 🛠️ Tech Stack

| Component         | Technologies Used                                                                                                                             |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| **Frontend**      | HTML, CSS, JavaScript                                                                                                                         |
| **Backend**       | Node.js, Express.js                                                                                                                           |
| **Database**      | T-SQL                                                                                                                                         |
| **External APIs** | [Alpha Vantage](https://www.alphavantage.co/) for stock market data, [ExchangeRate API](https://www.exchangerate-api.com/) for currency rates |

---

## Features

### ✅ User & Account Management

- User **sign-up, login, and authentication**.
- Ability to **create, update, and delete accounts**.
- Secure password handling.

### 📊 Portfolio Management

- Create multiple **investment portfolios**.
- Track **stock purchases and sales**.
- Compute **GAK (Gennemsnitlige anskaffelseskurs)** and **unrealized gains/losses**.

### 🔄 Transactions

- Log **buying and selling transactions**.
- Ensure correct **fund availability** for purchases.
- Automatic updates to account balance after transactions.

### 📈 Data Visualization & Analysis

- **Portfolio summary** with key performance indicators.
- Line charts for **historical stock price trends**.
- Pie charts showing **asset allocation**.
- Ranking of **top-performing investments**.

---

### 📈 HOW TO USE?
- Download **relevant** node_modules. Can be found in the file **package.json**
- Type 'npm start' or navigate to the backend folder and start the server with the command: 'node backend/server.js' (The server runs on http://localhost:3000)
- Here you'll be directed to login page where you can login with email and password or **Register as an User**

### License
This project is licensed under the MIT License – see the [LICENSE](LICENSE) file for details.

Back-end skal have hjælp til alt
Front-end rules