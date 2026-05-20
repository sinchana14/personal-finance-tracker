# 💰 FinTrack — Personal Finance Tracker

A full-stack personal finance tracking application built with **Java Spring Boot**, **H2/MySQL**, and a beautiful **vanilla HTML/CSS/JS** frontend.

![Java](https://img.shields.io/badge/Java-17-orange?logo=openjdk)
![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.3-green?logo=springboot)
![License](https://img.shields.io/badge/License-MIT-blue)

## ✨ Features

- 🔐 **JWT Authentication** — Secure login & registration
- 💸 **Transaction Management** — Full CRUD for income & expenses
- 📊 **Interactive Dashboard** — Charts for spending trends & category breakdown
- 🎯 **Budget Tracking** — Set monthly limits and track progress
- 🔍 **Smart Filters** — Filter transactions by date, type, and category
- 📱 **Responsive Design** — Works on desktop, tablet, and mobile
- 🌙 **Dark Theme** — Premium glassmorphism UI

## 🏗️ Architecture

```
┌─────────────────┐     HTTP/REST     ┌──────────────────┐     JPA/SQL     ┌─────────────┐
│                 │ ← ─ ─ ─ ─ ─ ─ → │                  │ ← ─ ─ ─ ─ ─ → │             │
│   Frontend      │    JSON + JWT     │   Spring Boot    │    Hibernate    │   H2 / MySQL│
│   (HTML/CSS/JS) │                   │   REST API       │                 │   Database   │
│                 │                   │                  │                 │             │
└─────────────────┘                   └──────────────────┘                 └─────────────┘
```

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Backend** | Java 17, Spring Boot 3.3, Spring Security, Spring Data JPA |
| **Database** | H2 (dev) / MySQL (prod) |
| **Auth** | JWT (JSON Web Tokens) with BCrypt password hashing |
| **Frontend** | HTML5, CSS3, Vanilla JavaScript, Chart.js |
| **Build** | Maven |
| **API Docs** | Swagger/OpenAPI (SpringDoc) |

## 📋 Prerequisites

- Java 17+ (`java -version`)
- Maven 3.9+ (`mvn -version`)
- Git (`git --version`)

## 🚀 Getting Started

### 1. Clone the repository
```bash
git clone https://github.com/YOUR_USERNAME/personal-finance-tracker.git
cd personal-finance-tracker
```

### 2. Run the backend
```bash
cd backend
mvn spring-boot:run
```
The API will start at `http://localhost:8080`

### 3. Open the frontend
Open `frontend/index.html` in your browser, or use Live Server in VS Code.

### 4. Explore the API docs
Visit `http://localhost:8080/swagger-ui.html` for interactive API documentation.

### 5. Access H2 Database Console (dev)
Visit `http://localhost:8080/h2-console`
- JDBC URL: `jdbc:h2:file:./data/financedb`
- Username: `sa`
- Password: *(empty)*

## 📂 Project Structure

```
personal-finance-tracker/
├── backend/
│   ├── pom.xml                          # Maven dependencies
│   └── src/main/java/com/finance/tracker/
│       ├── FinanceTrackerApplication.java  # Entry point
│       ├── config/                      # Security, CORS, JWT filter, data seeder
│       ├── controller/                  # REST API endpoints
│       ├── service/                     # Business logic
│       ├── model/                       # JPA entities
│       ├── dto/                         # Data transfer objects
│       ├── repository/                  # Database access (Spring Data JPA)
│       ├── security/                    # JWT utilities
│       └── exception/                   # Global error handling
├── frontend/
│   ├── index.html                       # Single Page Application
│   ├── css/styles.css                   # Dark theme design system
│   └── js/                              # Modular JavaScript
│       ├── api.js                       # HTTP client with JWT
│       ├── auth.js                      # Login/Register
│       ├── charts.js                    # Chart.js visualizations
│       ├── dashboard.js                 # Dashboard data loading
│       ├── transactions.js              # CRUD operations
│       └── app.js                       # App controller & routing
├── .gitignore
└── README.md
```

## 🔌 API Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/auth/register` | Register new user | ❌ |
| POST | `/api/auth/login` | Login & get JWT | ❌ |
| GET | `/api/transactions` | List transactions (with filters) | ✅ |
| POST | `/api/transactions` | Create transaction | ✅ |
| PUT | `/api/transactions/{id}` | Update transaction | ✅ |
| DELETE | `/api/transactions/{id}` | Delete transaction | ✅ |
| GET | `/api/categories` | List categories | ✅ |
| GET | `/api/budgets` | List budgets | ✅ |
| POST | `/api/budgets` | Set budget | ✅ |
| GET | `/api/dashboard` | Dashboard summary | ✅ |

## 🎯 Key Concepts Demonstrated

- **Spring Boot** — Auto-configuration, dependency injection, REST API
- **JPA/Hibernate** — ORM, entity relationships, JPQL queries
- **Spring Security** — JWT authentication, BCrypt, filter chains
- **REST API Design** — CRUD, DTOs, validation, error handling
- **Database Design** — Normalization, foreign keys, indexes
- **Frontend SPA** — DOM manipulation, Fetch API, Chart.js
- **Design Patterns** — Repository, Service, DTO, Builder

## 📄 License

This project is licensed under the MIT License.
