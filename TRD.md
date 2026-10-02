# Technical Requirements Document (TRD) — EcoTrace India

**Document Version:** 1.0.0  
**Status:** Approved for Implementation  
**Target Release:** MVP v1.0  
**Project Architecture:** Standalone Two-Tier Decoupled Architecture (`frontend/` and `backend/`)  
**Traceability Code:** `ECO-TRD-V1`

---

## 1. Chosen Tech Stack & Architectural Justifications

To ensure clean independent deployment to platforms like Vercel (Frontend) and Render/Railway (Backend), the project is structured into two separate top-level directories: `frontend/` and `backend/`.

```text
ECO TRACE INDIA/
├── frontend/          # Standalone Next.js 14+ App Router Client
├── backend/           # Standalone Express.js + Prisma ORM Server
└── docs/              # Master Architecture & Technical Specifications
```

| Component | Selected Technology | Version | "Why This and Not the Alternatives" |
| :--- | :--- | :--- | :--- |
| **Frontend Framework** | **Next.js (App Router) + React** | `^14.2` | Offers fast static generation for public SEO pages, flexible client components for dashboards, and native Vercel zero-config deployment over standard Vite SPAs. |
| **Frontend Language** | **TypeScript** | `^5.4` | Enforces compile-time type safety across UI props, Zod validation models, and API responses, preventing runtime errors. |
| **UI Styling & System** | **Tailwind CSS + shadcn/ui** | `^3.4` / `Radix` | Provides accessible, unstyled UI primitives that can be customized with exact environmental branding without the bloated bundle sizes of Material-UI or Ant Design. |
| **State & Server Cache** | **TanStack Query (v5) + Zustand** | `^5.28` / `^4.5` | TanStack Query simplifies server-state caching, pagination, and background refetching; Zustand provides micro-store client state for collector workflows without Redux boilerplate. |
| **Backend Runtime** | **Node.js + Express.js** | `Node 20 LTS` / `^4.19` | Express is universally understood, lightweight, and avoids the heavy opinionated abstraction layers of NestJS, making it ideal for clear student inspection and rapid debugging. |
| **Backend Architecture** | **Layered Architectural Pattern** | Layered | Strict separation: `Route -> Controller -> Service -> Repository -> Prisma DB`. Controllers stay thin; all business logic lives in deterministic services. |
| **Database & ORM** | **PostgreSQL + Prisma ORM** | `PostgreSQL 15+` / `^5.11` | Relational integrity is mandatory for financial ledger transactions, audit trails, and multi-tenant RBAC. Prisma provides auto-generated type-safe database queries. |
| **Geospatial Proximity** | **Indexed Lat/Long + SQL Haversine** | Native SQL | Standard indexed float coordinates with raw SQL Haversine calculations avoid complex PostGIS server extensions on free-tier serverless PostgreSQL (Neon/Supabase). |
| **In-Memory Store** | **Redis (Upstash / Redis 7)** | `^7.0` | Powers rate-limiting, temporary OTP storage with TTL expiry, and background job queues via BullMQ without overloading PostgreSQL. |
| **Storage Engine** | **Cloudinary (MVP) / AWS S3** | REST SDK | Cloudinary provides auto-resizing, compression, and WebP transformation on upload for field photos on low-bandwidth mobile networks. |
| **Payment Gateway** | **Pluggable IPaymentService (Razorpay + Mock)** | `razorpay ^2.9` | Pluggable interface enables instant sandbox testing without requiring an active business merchant bank account, while keeping production RazorpayX code intact. |
| **AI Vision Classifier** | **Google Gemini 1.5 Flash API** | `@google/genai` | Free-tier vision capabilities with sub-second multimodal latency for identifying electronic components, with fallback manual override. |
| **Testing Suite** | **Vitest + Supertest + React Testing Library**| `^1.4` | Vitest provides lightning-fast ESM testing with Jest-compatible APIs for unit and integration testing of services and controllers. |

---

## 2. Technical Requirements Mapped to PRD Requirements

| PRD Req ID | Tech Req ID | Architectural Implementation Details |
| :--- | :--- | :--- |
| **FR-001 / FR-002** | **TR-001** | `AuthController` routes to `AuthService`. Phone OTP stored in Redis with 300s TTL. Password hashed with `bcryptjs` (salt rounds: 12). |
| **FR-003** | **TR-002** | `JwtService` issues access token in `Authorization: Bearer` and refresh token in `Set-Cookie: refreshToken; HttpOnly; Secure; SameSite=Lax`. |
| **FR-004 / FR-005** | **TR-003** | `PickupService.createPickup` calculates estimated price in transaction block using active `PriceCatalogRepository.findCurrentRates`. |
| **FR-007 / FR-008** | **TR-004** | `PickupRepository.findNearbyAvailable` executes raw SQL Haversine formula bounding box query (`radius <= 10km`). Atomic optimistic lock for job claiming (`status = REQUESTED`). |
| **FR-009 / FR-011** | **TR-005** | `PickupItem` persistence handles weight (`Decimal(8,3)`), photo URL via `StorageService`, and snapshots `pricePerKg` directly from catalog into record. |
| **FR-010** | **TR-006** | `AiService.classifyImage` wraps Gemini Vision API in resilient try/catch block with 3.5s timeout; falls back to manual classification if unavailable. |
| **FR-012 / FR-014** | **TR-007** | `PaymentService.processPayment` requires `idempotencyKey` unique index constraint on `Payment` table. Database transaction guarantees ledger immutability. |
| **FR-015 / FR-016** | **TR-008** | `HubService.reconcileIntake` evaluates: `Math.abs(hubWeight - collectorWeight) / collectorWeight > 0.05`. If true, sets status to `FLAGGED_DISCREPANCY` and dispatches `AuditService.logEvent`. |
| **FR-018** | **TR-009** | `BatchService.createBatch` consolidates verified items, computes SHA-256 hash of batch contents, and generates QR code data payload: `ecotrace://batch/<UUID>`. |
| **FR-020 / FR-021** | **TR-010** | `RecyclerService.completeBatch` logs yield metrics; `EprService.generateCertificate` builds CPCB-compliant PDF via `pdfkit`, calculates digital hash, and persists `EprRecord`. |
| **FR-022 / FR-024** | **TR-011** | Global Prisma Middleware intercepts administrative mutations on `PriceCatalog` and `Pickup` models, inserting records into `AuditLog`. |

---

## 3. API Design & Specification (`/api/v1/`)

All API endpoints follow standard RESTful conventions with uniform JSON response envelopes.

### 3.1 Standard Response Envelopes

#### Success Envelope (`200 OK`, `201 Created`):
```json
{
  "success": true,
  "message": "Pickup claimed successfully",
  "data": {
    "pickupId": "c8b4d8a1-5f21-4d3e-9b22-12a4b98c3e01",
    "status": "ASSIGNED",
    "claimedAt": "2026-09-29T21:45:00.000Z"
  }
}
```

#### Error Envelope (`400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`, `409 Conflict`, `500 Internal Error`):
```json
{
  "success": false,
  "message": "Weight discrepancy threshold exceeded",
  "errors": [
    {
      "field": "hubWeightKg",
      "code": "DISCREPANCY_LIMIT_EXCEEDED",
      "detail": "Hub weight (12.400 kg) differs from collector weight (14.200 kg) by 12.67%, exceeding 5% limit."
    }
  ]
}
```

### 3.2 Complete Core Endpoints Matrix

| HTTP Method | Route Endpoint | Authentication / Role | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/auth/register` | Public | Register new user across supported roles. |
| `POST` | `/api/v1/auth/send-otp` | Public | Trigger 6-digit phone verification OTP. |
| `POST` | `/api/v1/auth/verify-otp` | Public | Verify phone OTP and return auth tokens. |
| `POST` | `/api/v1/auth/login` | Public | Email/Password login for Hub, Recycler, Admin. |
| `POST` | `/api/v1/auth/refresh` | Public (Cookie) | Rotate and issue new access token. |
| `POST` | `/api/v1/auth/logout` | Authenticated | Revoke refresh token and clear cookies. |
| `GET` | `/api/v1/users/me` | Authenticated | Return profile, active role, and address list. |
| `POST` | `/api/v1/pickups` | `CONSUMER` | Create new pickup booking. |
| `GET` | `/api/v1/pickups` | `CONSUMER`, `ADMIN` | List user's pickup history with pagination. |
| `GET` | `/api/v1/pickups/nearby` | `COLLECTOR` | Geospatial list of open pickups within radius. |
| `PATCH`| `/api/v1/pickups/:id/claim` | `COLLECTOR` | Atomically claim an open pickup job. |
| `PATCH`| `/api/v1/pickups/:id/arrived`| `COLLECTOR` | Mark arrival at consumer doorstep. |
| `POST` | `/api/v1/pickups/:id/items` | `COLLECTOR` | Record weight, photo, and grading per item. |
| `POST` | `/api/v1/pickups/:id/complete`| `COLLECTOR` | Finalize weigh-in and trigger consumer payout. |
| `POST` | `/api/v1/payments` | `CONSUMER`, `SYSTEM` | Process payment with `Idempotency-Key` header. |
| `POST` | `/api/v1/payments/webhook` | Public (Signed) | Verify Razorpay HMAC SHA256 signature. |
| `GET` | `/api/v1/collectors/wallet`| `COLLECTOR` | Get current balance and transaction ledger. |
| `POST` | `/api/v1/hubs/:id/intake` | `HUB_MANAGER` | Scan collector QR and verify aggregate weight. |
| `POST` | `/api/v1/batches` | `HUB_MANAGER` | Bundle sorted inventory into sealed batch. |
| `POST` | `/api/v1/batches/:id/seal` | `HUB_MANAGER` | Lock batch, assign QR code and manifest URL. |
| `POST` | `/api/v1/batches/:id/dispatch`| `HUB_MANAGER` | Dispatch batch to assigned formal recycler. |
| `POST` | `/api/v1/recyclers/:id/receive`| `RECYCLER` | Confirm physical receipt of sealed batch. |
| `POST` | `/api/v1/recyclers/:id/process`| `RECYCLER` | Log metallurgical and plastic recovery yield. |
| `POST` | `/api/v1/epr` | `RECYCLER`, `ADMIN` | Generate CPCB-compliant EPR digital certificate. |
| `GET` | `/api/v1/pricing` | Authenticated | Read regional per-kg rates for categories. |
| `PUT` | `/api/v1/admin/pricing/:id`| `ADMIN` | Update base/min/max category rates (Audited). |
| `POST` | `/api/v1/ai/classify-waste` | `COLLECTOR`, `HUB` | Advisory Gemini 1.5 Flash image grading. |
| `GET` | `/api/v1/admin/analytics` | `ADMIN` | Macro KPIs: tonnage, payouts, loss rates. |
| `GET` | `/api/v1/health` | Public | Return server health and DB connection status. |

---

## 4. Third-Party Services & Operational Limits

| Provider / Service | Functional Purpose | Free Tier Limits / Cost Profile | Production Fallback Strategy |
| :--- | :--- | :--- | :--- |
| **Supabase / Neon** | Managed PostgreSQL 15 | Free tier: 500 MB storage, compute pooling. | Automated daily pg_dump backups to S3. |
| **Upstash Redis** | Serverless Redis | 10,000 commands/day free; $0.20 per 100k commands. | Fall back to in-memory `node-cache` for dev/test. |
| **Cloudinary** | Image storage & optimization | 25 monthly credits (~25k image transformations). | Direct AWS S3 presigned PUT URL upload. |
| **Razorpay / RazorpayX** | UPI disbursements & payouts | Test mode free; 2% transaction fee in production. | `MockPaymentService` driver for zero-cost demos. |
| **Google Gemini API** | Advisory waste vision AI | 15 RPM (Requests Per Minute) free tier. | Manual category selection with no blocking error. |
| **Leaflet / OSM** | Map rendering & geocoding | 100% Free / Open Source (Nominatim tile server). | Seamless drop-in Google Maps JavaScript API. |

---

## 5. Performance Budgets, Caching & Rate Limiting

### 5.1 Performance Budgets
* **API Response Time ($p95$):** $< 250\text{ ms}$ for standard queries; $< 400\text{ ms}$ for geospatial queries.
* **Frontend First Contentful Paint (FCP):** $< 1.2\text{ s}$ on 4G mobile devices.
* **Largest Contentful Paint (LCP):** $< 2.0\text{ s}$.
* **Image Payload Budget:** Camera photos compressed client-side to $< 500\text{ KB}$ WebP before upload.

### 5.2 Caching Strategy
* **HTTP Level:** `Cache-Control: public, max-age=3600, stale-while-revalidate=86400` on category pricing catalog (`/api/v1/pricing`).
* **Redis Layer:** Active price catalogs cached under key `cache:pricing:all` with 1-hour TTL, invalidated automatically on administrative updates.
* **Client Layer:** TanStack Query handles stale-while-revalidate caching (staleTime: 2 minutes for pickups; 5 minutes for user profiles).

### 5.3 Rate Limiting Configuration
Using Redis token bucket algorithm via `rate-limiter-flexible`:
* **Auth Endpoints (`/api/v1/auth/*`):** 5 requests per minute per IP.
* **OTP Endpoints (`/api/v1/auth/send-otp`):** 3 requests per 10 minutes per phone number.
* **AI Classification (`/api/v1/ai/*`):** 10 requests per minute per authenticated user.
* **General API Endpoints:** 100 requests per minute per user/IP.

---

## 6. Offline, Sync & Real-Time Strategy

### 6.1 Collector Offline PWA Architecture
Informal collectors frequently operate in urban basements and dead zones with zero cellular connectivity.

```text
[Camera Capture] -> [HTML5 Canvas Resize (Max 1280px WebP)]
                             |
                             v
                 [IndexedDB ObjectStore: 'offline_items']
                             |
                             v
            [Connection Status Banner: "Offline - Saved Locally"]
                             |
                   (Network Restored)
                             |
                             v
         [TanStack Query Mutation Queue / Service Worker Sync]
                             |
                             v
            [POST /api/v1/pickups/:id/items (Bulk Synchronize)]
```

* **IndexedDB Store:** Records item category, local scale weight, timestamp, and Base64/Blob image.
* **State Reconciliation:** When network is restored, client queues sequential POST requests. Each record includes a client timestamp to prevent overwrite race conditions.

---

## 7. Testing Strategy & Quality Assurance

```text
Testing Pyramid:
       / \
      / E2E \       --> Playwright (Critical Journey: Consumer -> Collector -> Hub)
     /-------\
    /  Integ  \     --> Supertest + Testcontainers (PostgreSQL API Endpoint Tests)
   /-----------\
  /    Unit     \   --> Vitest (Pricing calculations, discrepancy formulas, Zod schemas)
 /---------------\
```

* **Unit Testing (Vitest):**
  * Mathematical verification of price formulas: `price = weight * rate`.
  * Hub discrepancy calculation: ensuring strict $5\%$ boundary checks.
  * Zod schema input boundary tests (phone format, weight decimal bounds).
* **Integration Testing (Supertest + In-Memory/Docker PostgreSQL):**
  * Complete lifecycle test: Register -> Create Pickup -> Claim -> Add Items -> Complete -> Hub Verify -> Batch.
  * Payment idempotency test: issuing identical `Idempotency-Key` headers concurrently to confirm single ledger entry.
* **Test Coverage Standard:** Strict minimum of **80% code coverage** on all business logic files in `backend/src/services/`.

---

## 8. Environments, Configuration & Environment Variables

Three isolated environments are maintained: `development`, `staging`, and `production`.

### 8.1 Backend Environment Variables (`backend/.env.example`)
```bash
# Server Configuration
PORT=5000
NODE_ENV=development
API_PREFIX=/api/v1
CORS_ORIGIN=http://localhost:3000

# PostgreSQL Database (Prisma)
DATABASE_URL="postgresql://user:password@localhost:5432/ecotrace_db?schema=public"

# Redis Cache & Queues
REDIS_URL="redis://localhost:6379"

# JWT Authentication
JWT_ACCESS_SECRET="min-32-char-cryptographically-secure-random-string"
JWT_REFRESH_SECRET="min-32-char-cryptographically-secure-random-string"
JWT_ACCESS_EXPIRY="15m"
JWT_REFRESH_EXPIRY="7d"

# Payment Gateway (Razorpay)
PAYMENT_PROVIDER="MOCK" # Set to "RAZORPAY" in production
RAZORPAY_KEY_ID="rzp_test_xxxxxx"
RAZORPAY_KEY_SECRET="xxxxxx"
RAZORPAY_WEBHOOK_SECRET="xxxxxx"

# Storage Service (Cloudinary)
CLOUDINARY_CLOUD_NAME="ecotrace-india"
CLOUDINARY_API_KEY="xxxxxx"
CLOUDINARY_API_SECRET="xxxxxx"

# AI Vision Service
GEMINI_API_KEY="AIzaSyxxxxxx"

# SMS Gateway (Fast2SMS / Gupshup)
SMS_GATEWAY_PROVIDER="MOCK" # Logs OTP to console in development
SMS_API_KEY="xxxxxx"
```

### 8.2 Frontend Environment Variables (`frontend/.env.example`)
```bash
NEXT_PUBLIC_API_URL="http://localhost:5000/api/v1"
NEXT_PUBLIC_APP_NAME="EcoTrace India"
NEXT_PUBLIC_DEFAULT_LOCALE="en"
NEXT_PUBLIC_RAZORPAY_KEY_ID="rzp_test_xxxxxx"
```

---

## 9. Deployment, CI/CD & Rollback Strategy

```mermaid
gitGraph
   commit id: "Initial Commit"
   branch feature
   checkout feature
   commit id: "Add Hub Intake Logic"
   commit id: "Add Vitest Suite"
   checkout main
   merge feature id: "PR Merge"
   commit id: "GitHub Actions CI"
   branch staging
   commit id: "Deploy Staging"
   checkout main
   branch production
   commit id: "Deploy Vercel & Render"
```

* **Frontend Deployment:** Deployed to **Vercel** with automatic preview deployments on Pull Requests. Static assets cached via Vercel Edge Network.
* **Backend Deployment:** Deployed to **Render** or **Railway** running `node dist/server.js` with managed health checks pointing to `/api/v1/health`.
* **Database Migrations:** Executed during release step: `npx prisma migrate deploy`. Schema changes must be backward-compatible (expand-and-contract pattern).
* **Rollback Plan:** In the event of catastrophic deployment failure, Vercel allows instant 1-click rollback to prior deployment artifact; backend rollbacks revert to previous Docker container tag with backward-compatible migrations.

---

## 10. Monitoring, Logging & Error Tracking

* **Structured Logging:** Powered by `pino` logger, emitting JSON-formatted logs with request correlation IDs (`x-request-id`).
* **Error Tracking:** Integration with **Sentry** captures unhandled exceptions with full stack traces, user context (excluding PII), and environment tags.
* **Audit Logging:** System-critical operations (price changes, lot rejections, status overrides) write asynchronously to the PostgreSQL `AuditLog` table.

---

## 11. Technical Risks & Engineering Mitigations

1. **Risk: Neon/Supabase Connection Exhaustion during Peak Spikes**  
   *Mitigation:* Utilize Prisma Client with PgBouncer connection pooling (`?pgbouncer=true&connection_limit=10`).
2. **Risk: Disconnected Scale Readout Spoofing**  
   *Mitigation:* Mandate photo upload containing both the physical item and the digital scale LED readout; log EXIF metadata and photo hashes to detect duplicates.
3. **Risk: Inconsistent Floating-Point Price Calculations**  
   *Mitigation:* Forbid native JavaScript `number` for currency. Store all weights in PostgreSQL `Decimal(8,3)` and financial values in integer paise (₹1.00 = 100 paise) or `Decimal(12,2)`.
