# 🌿 EcoTrace India

<div align="center">

![EcoTrace India](https://img.shields.io/badge/EcoTrace-India-2d6a4f?style=for-the-badge&logo=leaf&logoColor=white)
![Version](https://img.shields.io/badge/version-1.0.0--MVP-blue?style=for-the-badge)
![License](https://img.shields.io/badge/license-MIT-green?style=for-the-badge)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen?style=for-the-badge&logo=node.js)
![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)

**A transparent, digitally-traceable reverse-logistics platform for India's e-waste ecosystem.**

*Connecting consumers, informal collectors, aggregation hubs, and CPCB-registered recyclers — every kilogram tracked, every transaction accountable.*

[📖 Docs](#-documentation) · [🚀 Quick Start](#-quick-start) · [🏗️ Architecture](#️-architecture) · [🔌 API Reference](#-api-reference) · [🤝 Contributing](#-contributing)

</div>

---

## 📋 Table of Contents

- [Vision](#-vision)
- [The Problem We Solve](#-the-problem-we-solve)
- [Key Features](#-key-features)
- [Architecture](#️-architecture)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Quick Start](#-quick-start)
- [Environment Variables](#-environment-variables)
- [API Reference](#-api-reference)
- [User Roles](#-user-roles)
- [E-Waste Categories](#-e-waste-categories)
- [Documentation](#-documentation)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🌱 Vision

> *"To transform India's informal, fragmented e-waste collection network into a transparent, digitally organized, and traceable reverse-logistics ecosystem."*

EcoTrace India empowers informal waste collectors (*kabadiwalas*, *raddiwalas*, and scrap dealers) with fair digital valuation while providing consumers with seamless doorstep pickup and formal recyclers with tamper-evident, CPCB/EPR-compliant material streams.

---

## 🚨 The Problem We Solve

India generates over **1.7 million tonnes of e-waste annually**, yet over **90%** is handled by the unorganized informal sector using hazardous dismantling techniques.

| Stakeholder | Pain Point |
|---|---|
| 🏠 **Consumers** | No doorstep collection, arbitrary pricing, no guarantee of green recycling |
| 🚛 **Informal Collectors** | Exploitative middlemen pricing, paper-based logs, excluded from digital finance |
| 🏭 **Hubs & Recyclers** | Contaminated batches, weight tampering, manual EPR certificate overhead |

### Core Principles

- **Digitize, Do Not Replace** — Organize the existing informal network, not displace it
- **Traceability at Every Hand-off** — `Consumer → Collector → Hub → Recycler → EPR Certificate`
- **Advisory AI, Deterministic Financials** — AI assists with material grading; locked catalogs govern all monetary values

---

## ✨ Key Features

| Feature | Description |
|---|---|
| 📱 **Doorstep Pickup Booking** | 3-step consumer booking with instant category-based payout estimation |
| 🗺️ **Geospatial Job Discovery** | Haversine proximity query (<50ms) for collectors to find nearby pickups |
| 🤖 **AI Vision Grading** | Google Gemini 1.5 Flash advisory material categorization with photo proof |
| ⚖️ **5% Discrepancy Engine** | Automated weight variance detection — locks payout above 5% hub delta |
| 📦 **QR Batch Manifests** | Tamper-evident sealed batch QR codes (`ecotrace://batch/<UUID>`) |
| 📄 **CPCB EPR Certificates** | Cryptographically signed (SHA-256) compliance PDF certificates via PDFKit |
| 💸 **UPI Wallet Payouts** | Razorpay/RazorpayX integration with idempotency keys and immutable audit ledger |
| 📊 **Admin Fraud Radar** | Real-time analytics dashboards, discrepancy feeds, and regional price management |
| 📶 **Offline-First PWA** | IndexedDB-backed weigh-in screen for collectors in low-connectivity environments |
| 🔐 **Multi-Role RBAC** | JWT auth with 5 distinct roles, phone OTP via Redis, bcrypt password login for admins |

---

## 🏗️ Architecture

EcoTrace India is architected as two **decoupled, independently deployable** applications:

```
┌─────────────────────────────────────────────────────────────┐
│                    Client Tier (Web & PWA)                   │
│  Consumer App · Collector PWA · Hub Manager · Recycler Portal │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTPS
                    Vercel Edge / CDN
                           │
┌──────────────────────────▼──────────────────────────────────┐
│                Backend API (Express.js / Node.js)            │
│  Routes → Controllers → Services → Repositories              │
│  Helmet · CORS · RateLimiter · Zod Validation                │
└──────┬──────────┬────────────────┬────────┬─────────────────┘
       │          │                │        │
  PostgreSQL    Redis          Gemini AI  Razorpay
  (Prisma ORM) (OTP Cache)   (Vision)   (Payments)
```

> 📐 See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for the full Mermaid system diagram and layer responsibilities.

---

## 🛠️ Tech Stack

### Backend (`backend/`)

| Category | Technology |
|---|---|
| Runtime | Node.js ≥ 18, TypeScript 5 |
| Framework | Express.js 4 |
| ORM | Prisma 5.14 |
| Database | PostgreSQL 15 |
| Cache | Redis 7 (via ioredis) |
| Auth | JWT (15-min access token + 7-day refresh cookie), bcryptjs |
| Validation | Zod |
| Payments | Razorpay / RazorpayX |
| AI Vision | Google Gemini 1.5 Flash (`@google/genai`) |
| PDF Generation | PDFKit |
| QR Codes | qrcode |
| Logging | Pino + pino-pretty |
| Security | Helmet, rate-limiter-flexible, CORS whitelisting |
| Testing | Vitest + Supertest |

### Frontend (`frontend/`)

| Category | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5, React 19 |
| Styling | Tailwind CSS 4 |
| Data Fetching | TanStack Query (React Query) v5 |
| Forms | React Hook Form + Zod resolvers |
| Charts | Recharts 3 |
| State | Zustand 5 |
| HTTP Client | Axios |
| Offline Storage | idb (IndexedDB) |
| Notifications | Sonner |
| Icons | Lucide React |

### Infrastructure

| Service | Usage |
|---|---|
| Vercel | Frontend hosting & edge functions |
| Render / Railway | Backend API hosting |
| Neon / Supabase | Managed PostgreSQL |
| Upstash Redis | Managed Redis (OTP & rate-limit cache) |
| Cloudinary / S3 | Scale photo evidence & PDF manifests |
| Docker | Local full-stack development |
| GitHub Actions | CI/CD pipelines |

---

## 📁 Project Structure

```
ecotrace-india/
├── backend/                    # Express.js REST API
│   ├── src/
│   │   ├── config/             # DB, Redis & app configuration
│   │   ├── controllers/        # HTTP request handlers (Zod-validated)
│   │   ├── services/           # Domain business logic
│   │   ├── repositories/       # Prisma data access layer
│   │   ├── routes/             # Express route definitions
│   │   ├── middlewares/        # Auth, RBAC, error handlers
│   │   ├── validators/         # Zod schemas
│   │   ├── types/              # Shared TypeScript types
│   │   ├── utils/              # Helpers (hashing, pricing, geo)
│   │   └── server.ts           # Application entry point
│   ├── prisma/
│   │   ├── schema.prisma       # 18 domain models
│   │   └── seed.ts             # 8 e-waste category seed data
│   ├── tests/                  # Vitest unit & integration tests
│   ├── Dockerfile
│   └── .env.example
│
├── frontend/                   # Next.js App Router
│   ├── src/
│   │   ├── app/                # App Router pages & layouts
│   │   ├── components/         # Reusable UI components
│   │   └── lib/                # API clients, hooks, utilities
│   └── public/
│
├── docs/                       # Engineering documentation
│   ├── PRD.md                  # Product Requirements Document
│   ├── TRD.md                  # Technical Requirements Document
│   ├── ARCHITECTURE.md         # System architecture & diagrams
│   ├── DB_SCHEMA.md            # Database schema specification
│   ├── TICKETS.md              # Sprint plan & feature tickets
│   ├── RULES.md                # Engineering guardrails
│   ├── SECURITY.md             # Security policy
│   └── UI_UX.md                # UI/UX design guidelines
│
├── docker-compose.yml          # Full local stack (Postgres + Redis + Backend)
├── render.yaml                 # Render deployment configuration
└── AGENTS.md                   # AI sub-agent roster & specs
```

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** ≥ 18.0.0
- **Docker & Docker Compose** (for local database)
- **Git**

---

### Option A: Docker (Recommended)

Spin up the full backend stack (PostgreSQL + Redis + API) with one command:

```bash
# Clone the repository
git clone https://github.com/your-org/ecotrace-india.git
cd ecotrace-india

# Start all services
docker-compose up -d

# Run database migrations and seed data
docker-compose exec backend npm run prisma:migrate
docker-compose exec backend npm run prisma:seed
```

The backend API will be available at **`http://localhost:5000`**.

---

### Option B: Manual Setup

#### 1. Backend

```bash
cd backend

# Install dependencies
npm install

# Copy and configure environment variables
cp .env.example .env
# Edit .env with your database URL, Redis URL, secrets, and API keys

# Generate Prisma client
npm run prisma:generate

# Run database migrations
npm run prisma:migrate

# Seed e-waste categories
npm run prisma:seed

# Start development server
npm run dev
```

> Backend will run at **`http://localhost:5000`**

#### 2. Frontend

```bash
cd frontend

# Install dependencies
npm install

# Copy and configure environment variables
cp .env.example .env.local
# Set NEXT_PUBLIC_API_URL=http://localhost:5000

# Start development server
npm run dev
```

> Frontend will run at **`http://localhost:3000`**

---

### Running Tests

```bash
cd backend
npm test           # Run all tests (Vitest)
npm run test:watch # Watch mode
```

---

## 🔧 Environment Variables

Copy `backend/.env.example` to `backend/.env` and fill in the values:

```env
# Server
PORT=5000
NODE_ENV=development

# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/ecotrace_db?schema=public"

# Redis
REDIS_URL="redis://localhost:6379"

# JWT Auth
JWT_ACCESS_SECRET="<min 32 chars>"
JWT_REFRESH_SECRET="<min 32 chars>"
JWT_ACCESS_EXPIRY="15m"
JWT_REFRESH_EXPIRY="7d"

# CORS
CORS_ORIGIN="http://localhost:3000"

# Razorpay (use sandbox keys for dev)
RAZORPAY_KEY_ID="rzp_test_..."
RAZORPAY_KEY_SECRET="..."

# Google Gemini Vision AI
GEMINI_API_KEY="..."

# Cloudinary (optional — photo evidence storage)
CLOUDINARY_CLOUD_NAME=""
CLOUDINARY_API_KEY=""
CLOUDINARY_API_SECRET=""
```

---

## 🔌 API Reference

All API routes are versioned under `/api/v1/`. The backend includes:

| Module | Base Path | Description |
|---|---|---|
| Health | `GET /api/v1/health` | Service health check |
| Auth | `/api/v1/auth` | OTP login, password login, refresh token |
| Pickups | `/api/v1/pickups` | Consumer booking & status tracking |
| Collector | `/api/v1/collector` | Proximity feed, job claiming, weigh-in |
| Hub | `/api/v1/hub` | Inbound scanning, discrepancy, dispatch |
| Recycler | `/api/v1/recycler` | Yield logging, EPR certificate generation |
| Payments | `/api/v1/payments` | UPI payouts, wallet, audit ledger |
| Admin | `/api/v1/admin` | Price catalog, fraud radar, analytics |

> 📌 Full endpoint specs, request/response schemas, and Zod validators are defined in [`docs/TRD.md`](docs/TRD.md).

---

## 👥 User Roles

| Role | Description |
|---|---|
| `CONSUMER` | Books doorstep e-waste pickups, receives UPI payout |
| `COLLECTOR` | Informal scrap dealer; discovers, claims, and completes pickup jobs |
| `HUB_MANAGER` | Aggregation facility supervisor; verifies inbound lots, seals batch dispatches |
| `RECYCLER` | CPCB-registered facility; logs material yields, signs EPR certificates |
| `ADMIN` | Platform operator; manages pricing, monitors fraud alerts, audits logs |

---

## ♻️ E-Waste Categories

The platform seeds **8 standardized Indian e-waste categories** with per-kg scrap rates:

| # | Category | Examples |
|---|---|---|
| 1 | PCB & Circuit Boards | Motherboards, GPUs, RAM modules |
| 2 | Large Home Appliances | Refrigerators, washing machines, ACs |
| 3 | Small IT Equipment | Laptops, desktops, printers, routers |
| 4 | Batteries & Cells | Li-ion cells, lead-acid, UPS batteries |
| 5 | CRT / Flat Screens | TVs, monitors, display panels |
| 6 | Cables & Wiring | Power cords, networking cables, wire harnesses |
| 7 | Telecom Equipment | Phones, tablets, SIM card trays |
| 8 | Mixed Metals & Components | Assorted metal parts, heat sinks |

---

## 📖 Documentation

| Document | Description |
|---|---|
| [`docs/PRD.md`](docs/PRD.md) | Product Requirements Document — Vision, personas, user journeys |
| [`docs/TRD.md`](docs/TRD.md) | Technical Requirements Document — API specs, constraints |
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | System architecture, component layers, data flows |
| [`docs/DB_SCHEMA.md`](docs/DB_SCHEMA.md) | Complete Prisma schema — 18 domain models with relationships |
| [`docs/TICKETS.md`](docs/TICKETS.md) | Sprint roadmap & granular feature tickets |
| [`docs/UI_UX.md`](docs/UI_UX.md) | Design system, component library, responsive guidelines |
| [`docs/SECURITY.md`](docs/SECURITY.md) | Security policy, vulnerability reporting, threat model |
| [`docs/RULES.md`](docs/RULES.md) | Engineering guardrails and coding standards |

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. **Fork** the repository
2. **Create** your feature branch: `git checkout -b feat/your-feature-name`
3. **Commit** your changes: `git commit -m 'feat: add amazing feature'`
4. **Push** to the branch: `git push origin feat/your-feature-name`
5. **Open** a Pull Request

### Commit Convention

This project follows [Conventional Commits](https://www.conventionalcommits.org/):

```
feat:     New feature
fix:      Bug fix
docs:     Documentation changes
refactor: Code refactoring
test:     Adding or updating tests
chore:    Build process or tooling updates
```

### Engineering Guardrails

Before contributing, review the engineering rules in [`docs/RULES.md`](docs/RULES.md):
- ✅ All monetary values stored as **integer paise** — no floating-point arithmetic
- ✅ All weights stored as **`Decimal(8,3)`** — three decimal precision
- ✅ All API inputs validated via **Zod schemas**
- ✅ All payment requests require **`Idempotency-Key`** headers
- ✅ Discrepancy engine threshold is exactly **5%** — not configurable at runtime

---

## 📜 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

<div align="center">

Made with 💚 for a cleaner India

**EcoTrace India** — *Tracing every gram, protecting every future.*

</div>
