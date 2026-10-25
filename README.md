# 💰 FinTrack — Personal Finance Tracker

A personal finance tracker with a 3D, cursor-reactive interface. It's built with **React + three.js** on the frontend, uses **Supabase** (Postgres, Auth and row-level security) as the backend, and deploys to **Vercel**.

![React](https://img.shields.io/badge/React-19-61dafb?logo=react)
![three.js](https://img.shields.io/badge/three.js-r3f-black?logo=threedotjs)
![Supabase](https://img.shields.io/badge/Supabase-Postgres%20%2B%20Auth-3ecf8e?logo=supabase)
![Vercel](https://img.shields.io/badge/Deploy-Vercel-black?logo=vercel)

## ✨ Features

- 🔐 **Supabase Auth**: email and password sign-up and sign-in, with sessions persisted in the browser
- 💸 **Transactions**: full CRUD for income and expenses, with search, type and date filters, and CSV export
- 🎯 **Budgets**: monthly limits per category, with animated progress rings and over-budget alerts
- 🏷️ **Custom categories**: 15 built-in categories plus your own, each with an emoji and colour
- 📊 **Dashboard**: all-time balance, monthly income, expenses and savings rate, a category donut, and a **3D six-month bar chart** you can orbit with the cursor
- 🌐 **3D and motion**: a floating coin hero scene, a "financial health" orb that shifts colour with your savings rate, cards that tilt toward the cursor with a glare effect, and magnetic buttons
- 🖱️ **Cursor effects**: a custom dot-and-ring cursor, a particle trail, click ripples and cursor-following ambient light. These are turned off automatically on touch devices and reduced for `prefers-reduced-motion`
- 📱 **Responsive**: a sidebar on desktop and a bottom tab bar with a floating add button on mobile

## 🏗️ Architecture

```
┌──────────────────────────┐   supabase-js (HTTPS)   ┌──────────────────────────────┐
│  web/  (Vite + React)    │ ──────────────────────▶ │  Supabase                    │
│  three.js · motion       │    JWT from Supabase    │  Auth · PostgREST · Postgres │
│  hosted on Vercel        │ ◀────────────────────── │  Row-Level Security per user │
└──────────────────────────┘                         └──────────────────────────────┘
```

The browser talks to Supabase directly. Every table has RLS policies, so each user can only read and write their own rows. Transactions and budgets can only reference built-in categories or the user's own categories, and the transaction type must match the category type.

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **UI** | React 19, TypeScript, Tailwind CSS v4, motion |
| **3D** | three.js, @react-three/fiber, @react-three/drei |
| **Charts** | Recharts + a custom 3D bar chart |
| **Backend** | Supabase: Postgres 17, Auth, RLS |
| **Hosting** | Vercel |

## 🚀 Getting Started

```bash
cd web
cp .env.example .env.local   # fill in your Supabase URL + publishable key
npm install
npm run dev
```

The database schema lives in [`supabase/migrations`](supabase/migrations). Apply it to a new project with the Supabase CLI (`supabase db push`) or paste the files into the SQL editor in order.

### Environment variables

| Name | Where to find it |
|------|------------------|
| `VITE_SUPABASE_URL` | Supabase → Project Settings → API |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase → Project Settings → API Keys (publishable) |

## 📂 Project Structure

```
personal-finance-tracker/
├── web/                       # The app (deployed to Vercel)
│   ├── src/
│   │   ├── components/        # CursorFX, TiltCard, MagneticButton, Layout, forms
│   │   ├── three/             # HeroScene, BalanceOrb, TrendBars3D (lazy-loaded)
│   │   ├── pages/             # Auth, Dashboard, Transactions, Budgets, Settings
│   │   └── lib/               # Supabase client, data access, auth context
│   └── vercel.json            # SPA rewrites
├── supabase/migrations/       # Schema, RLS policies, seed categories
├── backend/                   # Legacy Spring Boot API (v1, kept for reference)
└── frontend/                  # Legacy vanilla JS UI (v1, kept for reference)
```

## 📄 License

MIT
