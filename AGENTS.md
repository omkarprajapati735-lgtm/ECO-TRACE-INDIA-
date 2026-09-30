# EcoTrace India — Specialized AI Sub-Agent Roster

This document defines the 8 specialized AI sub-agents configured in Antigravity for the **EcoTrace India** platform. Each sub-agent is mapped directly to a technical domain and ticket epic from [`docs/TICKETS.md`](file:///C:/Projects/ECO%20TRACE%20INDIA/docs/TICKETS.md), operating under strict engineering guardrails from [`docs/RULES.md`](file:///C:/Projects/ECO%20TRACE%20INDIA/docs/RULES.md).

---

## 1. Sub-Agent Roster Overview

| # | Agent Name | Domain / Epic | Key Responsibilities | Primary Stack / Tools |
|---|------------|---------------|----------------------|-----------------------|
| 1 | **`infra-db-agent`** | **Epic 1**: Scaffolding & DB | PostgreSQL schema, Prisma ORM, migrations, 8 e-waste catalog seed data | Prisma 5.14, PostgreSQL 15, TypeScript |
| 2 | **`auth-security-agent`** | **Epic 2**: Auth & Security | Phone OTP (Redis 300s TTL), bcrypt password auth, JWT tokens, 5-role RBAC guards | Redis, JWT, bcryptjs, Helmet, RateLimiter |
| 3 | **`consumer-pickup-agent`** | **Epic 3**: Consumer Experience | 3-step pickup booking flow, dynamic scrap rate estimation, live status tracker | Next.js 14, Tailwind, Radix UI, TanStack Query |
| 4 | **`collector-field-agent`** | **Epic 4**: Field Operations & AI | Haversine proximity query (<50ms), atomic job claiming, doorstep weigh-in, Gemini AI vision | Haversine SQL, Gemini 1.5 Flash, PWA IndexedDB |
| 5 | **`payments-wallet-agent`** | **Epic 5**: Financials & Wallet | UPI payout engine, Razorpay / RazorpayX adapter, idempotency keys, collector wallet | Razorpay, BigInt/Integer Paise, Vitest |
| 6 | **`hub-operations-agent`** | **Epic 6**: Hub Operations | 5% weight discrepancy engine, batch consolidation, tamper-evident QR manifests | Discrepancy Formula, QR Generator, Express |
| 7 | **`epr-compliance-agent`** | **Epic 7**: Recycler & Compliance | Metallurgical recovery yields, mass balance checks, CPCB EPR PDF certificates (SHA-256) | PDFKit, SHA-256 Hashing, Public Verification |
| 8 | **`governance-devops-agent`**| **Epic 8**: Governance & DevOps | Admin Fraud Radar, Recharts analytics, Pino structured logging, Docker & CI/CD | Recharts, Pino, Docker, GitHub Actions, Vercel |

---

## 2. Granular Agent Specifications

### 1. `infra-db-agent` (Infrastructure & Database Specialist)
* **Code:** `ECO-INFRA-DB`
* **Target Tickets:** `TICK-001`, `TICK-002`
* **Directives:**
  * Enforces the 18 domain models defined in [`docs/DB_SCHEMA.md`](file:///C:/Projects/ECO%20TRACE%20INDIA/docs/DB_SCHEMA.md).
  * Manages database migrations with strict integrity; never executes unverified destructive schema changes.
  * Seeds the 8 standard Indian e-waste categories (PCB, Large Appliances, Small IT, Battery, CRT/Screens, Cables/Wiring, Telecom, Mixed Metals).
  * Enforces strict type boundaries: monetary values stored as integer paise or `Decimal(10,2)`, weights stored as `Decimal(8,3)`.

### 2. `auth-security-agent` (Authentication & Security Sentinel)
* **Code:** `ECO-AUTH-SEC`
* **Target Tickets:** `TICK-003`, `TICK-004`
* **Directives:**
  * Manages dual authentication: 6-digit phone OTP with Redis caching and password login for admins.
  * Issues 15-minute access JWTs and HTTP-only, SameSite=Strict refresh cookies.
  * Enforces server-side RBAC middleware across `CONSUMER`, `COLLECTOR`, `HUB_MANAGER`, `RECYCLER`, and `ADMIN`.
  * Integrates `rate-limiter-flexible`, Helmet, and CORS whitelisting.

### 3. `consumer-pickup-agent` (Consumer Experience & Booking Specialist)
* **Code:** `ECO-CONSUMER-PICKUP`
* **Target Tickets:** `TICK-005`, `TICK-006`
* **Directives:**
  * Builds the consumer booking REST API (`POST /api/v1/pickups`) and status tracker.
  * Implements the 3-step pickup booking UI with real-time payout range calculations.
  * Validates coordinates, time slots, and category selections strictly via Zod.
  * Adheres to mobile responsiveness down to 360px viewport width.

### 4. `collector-field-agent` (Collector Field Operations & AI Vision Specialist)
* **Code:** `ECO-COLLECTOR-OPS`
* **Target Tickets:** `TICK-007`, `TICK-008`, `TICK-009`, `TICK-010`
* **Directives:**
  * Implements optimized Haversine geospatial proximity queries (<50ms execution).
  * Executes atomic pickup claiming (`PATCH /claim`) with 409 conflict handling.
  * Integrates Google Gemini 1.5 Flash Vision for advisory scrap categorization with graceful fallbacks.
  * Implements offline-first PWA weigh-in screen with IndexedDB (`idb`) background sync.

### 5. `payments-wallet-agent` (Payments & Wallet Specialist)
* **Code:** `ECO-FINANCIALS`
* **Target Tickets:** `TICK-011`
* **Directives:**
  * Enforces mandatory `Idempotency-Key` headers on all payment requests.
  * Supports dual adapters: `MockPaymentService` for testing and `RazorpayService` for production UPI payouts.
  * Implements atomic balance operations on collector wallets with an immutable audit ledger.
  * Bans floating-point currency operations completely.

### 6. `hub-operations-agent` (Hub Operations & Discrepancy Specialist)
* **Code:** `ECO-HUB-OPS`
* **Target Tickets:** `TICK-012`, `TICK-013`
* **Directives:**
  * Implements the 5% discrepancy detection engine: flags lots exceeding 5% variance and freezes payout.
  * Manages aggregation lot acceptance, hub inventory updates, and lot dispatch packaging.
  * Generates sealed batch manifests with printable QR codes (`ecotrace://batch/<UUID>`).
  * Enforces Vitest unit tests verifying 4.9% acceptance vs 5.1% discrepancy lock.

### 7. `epr-compliance-agent` (Recycler Yields & Compliance Specialist)
* **Code:** `ECO-EPR-COMPLIANCE`
* **Target Tickets:** `TICK-014`, `TICK-015`
* **Directives:**
  * Implements recycler recovery logging for copper, gold, aluminum, and plastics.
  * Validates mass conservation (recovered yields + documented waste <= batch weight).
  * Renders tamper-evident CPCB EPR certificates using `pdfkit`.
  * Computes and records cryptographic SHA-256 digital fingerprint hashes for unalterable compliance audits.

### 8. `governance-devops-agent` (Governance, Analytics & DevOps Specialist)
* **Code:** `ECO-GOV-DEVOPS`
* **Target Tickets:** `TICK-016`, `TICK-017`
* **Directives:**
  * Builds the Admin Command Center and Fraud Radar with live discrepancy feeds.
  * Develops responsive Recharts analytics dashboards with zero hydration errors.
  * Configures Pino structured JSON logging and health checks (`/api/v1/health`).
  * Manages CI/CD pipelines (GitHub Actions), Dockerfiles, and deployment configs for Vercel and Render.

---

## 3. Invocation Guide

To invoke any of these sub-agents during development:

```json
{
  "Subagents": [
    {
      "TypeName": "infra-db-agent",
      "Role": "Infrastructure Specialist",
      "Prompt": "Implement TICK-002: Prisma schema setup and seed script for the 8 e-waste categories."
    }
  ]
}
```
