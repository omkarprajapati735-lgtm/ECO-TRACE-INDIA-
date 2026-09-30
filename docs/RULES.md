# AI Coding Agent Rules & Engineering Guardrails — EcoTrace India

**Document Version:** 1.0.0  
**Target Audience:** AI Coding Assistants (Cursor, Claude Code, GitHub Copilot, Antigravity) & Software Engineers  
**Enforcement Level:** STRICT & NON-NEGOTIABLE  
**Traceability Code:** `ECO-RULES-V1`

---

## 1. Project Context

EcoTrace India is a production-grade e-waste reverse-logistics and material-traceability platform that digitally organizes India’s informal collection network (*kabadiwalas*, scrap dealers) connecting them to aggregation hubs and formal recyclers. The platform enforces calibrated digital weigh-ins, automated 5% discrepancy detection, tamper-evident batch QR manifests, and CPCB-compliant EPR certificates.

The project is strictly organized into two standalone directories plus documentation:
* Client Web Application: `frontend/` (Next.js 14 App Router, Tailwind CSS, shadcn/ui)
* Backend API Application: `backend/` (Express.js, TypeScript Layered Architecture, Prisma, PostgreSQL)
* Specifications & Blueprints: `docs/` (`PRD.md`, `TRD.md`, `UI_UX.md`, `DB_SCHEMA.md`, `ARCHITECTURE.md`, `SECURITY.md`, `TICKETS.md`, `RULES.md`)

---

## 2. Locked Tech Stack & Approved Libraries

### 2.1 Frontend Dependencies (`frontend/package.json`)
* `next`: `14.2.13` (Locked App Router)
* `react`: `^18.3.1`
* `react-dom`: `^18.3.1`
* `typescript`: `^5.4.5`
* `tailwindcss`: `^3.4.1`
* `@radix-ui/*`: Primitive components powering shadcn/ui
* `lucide-react`: `^0.395.0` (Standardized iconography)
* `react-hook-form`: `^7.51.5` (Form controller)
* `@hookform/resolvers`: `^3.6.0` (Zod resolver)
* `zod`: `^3.23.8` (Input validation)
* `@tanstack/react-query`: `^5.28.0` (Server state & cache)
* `zustand`: `^4.5.2` (Micro client state)
* `recharts`: `^2.12.7` (Analytics charts)
* `sonner`: `^1.4.41` (Toast notifications)
* `axios`: `^1.7.2` (HTTP client)
* `idb`: `^8.0.0` (IndexedDB offline store for mobile collectors)

### 2.2 Backend Dependencies (`backend/package.json`)
* `express`: `^4.19.2`
* `typescript`: `^5.4.5`
* `@prisma/client`: `^5.14.0`
* `prisma`: `^5.14.0` (Dev Dependency)
* `bcryptjs`: `^2.4.3` (Password hashing)
* `jsonwebtoken`: `^9.0.2` (JWT access & refresh tokens)
* `zod`: `^3.23.8` (Schema validation)
* `pino`: `^9.1.2` / `pino-pretty`: Structured logging
* `cors`: `^2.8.5` (CORS headers)
* `helmet`: `^7.1.0` (Security headers)
* `cookie-parser`: `^1.4.6` (Signed HTTP cookies)
* `rate-limiter-flexible`: `^5.0.3` (Redis rate limiting)
* `ioredis`: `^5.4.1` (Redis client)
* `razorpay`: `^2.9.2` (Payment gateway)
* `pdfkit`: `^0.15.0` (EPR PDF generation)
* `@google/genai`: Google Gemini 1.5 Flash Vision SDK

---

## 3. Banned Libraries & Forbidden Patterns

| Banned Pattern / Library | Why It Is Strictly Forbidden | What to Use Instead |
| :--- | :--- | :--- |
| **`any` TypeScript Type** | Defeats type safety; causes silent runtime property failures. | Explicit interfaces, Zod inferred types (`z.infer<typeof Schema>`), or `unknown` with type narrowing. |
| **NestJS / Heavy DI Frameworks** | Over-complicates architecture for college inspection and debugging. | Clean layered Express architecture (`Route -> Controller -> Service -> Repository`). |
| **Redux / Redux Toolkit** | Excessive boilerplate for this application scale. | **Zustand** for client micro-state; **TanStack Query** for server data. |
| **Direct Prisma Calls in Controllers**| Scatters database logic and breaks layer boundaries. | Wrap all database queries in domain **Repositories** or **Services**. |
| **Raw JavaScript Floating Currency**| Floating-point roundoff causes monetary discrepancies (e.g. `0.1 + 0.2`). | Use integer paise or PostgreSQL `Decimal(10,2)` / `Decimal(8,3)` for weights. |
| **Hardcoded Secrets or API Keys** | Severe security violation; leaks credentials to git. | Environment variables via `env.config.ts` backed by Zod validation. |
| **Generic Catch-All Error Swallowing**| `catch (e) {}` with no logging hides production bugs. | Use typed custom error classes logged via `pino` and sent to error middleware. |

---

## 4. Coding Standards & Conventions

### 4.1 Naming Conventions
* **Files & Directories:** `kebab-case.ts` (e.g., `pickup.service.ts`, `auth.middleware.ts`, `use-offline-sync.ts`).
* **Classes & TypeScript Types/Interfaces:** `PascalCase` (e.g., `PickupService`, `WasteCategoryDto`, `JwtPayload`).
* **Functions & Variables:** `camelCase` (e.g., `calculateScrapValuation`, `claimedWeightKg`).
* **Database Tables & Prisma Models:** `PascalCase` singular (e.g., `Pickup`, `PickupItem`, `EprRecord`).
* **Environment Variables:** `UPPER_SNAKE_CASE` (e.g., `DATABASE_URL`, `JWT_ACCESS_SECRET`).

### 4.2 File Size & Structure Boundaries
* **Maximum File Length:** 250 lines of code. If a service or component exceeds 250 lines, refactor sub-functions or split UI into child components.
* **Component Reuse:** Before creating a new button, card, or modal, inspect `frontend/src/components/ui/` for existing shadcn primitives.

---

## 5. Standard Error Handling Pattern

All backend errors must inherit from a standardized base `AppError` class:

```typescript
// backend/src/errors/app-error.ts
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly errorCode: string;
  public readonly details: any;

  constructor(message: string, statusCode = 400, errorCode = 'BAD_REQUEST', details: any = null) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

// Subclasses:
export class NotFoundError extends AppError { constructor(msg = 'Resource not found') { super(msg, 404, 'NOT_FOUND'); } }
export class UnauthorizedError extends AppError { constructor(msg = 'Unauthorized') { super(msg, 401, 'UNAUTHORIZED'); } }
export class ForbiddenError extends AppError { constructor(msg = 'Forbidden') { super(msg, 403, 'FORBIDDEN'); } }
export class ConflictError extends AppError { constructor(msg = 'Conflict') { super(msg, 409, 'CONFLICT'); } }
```

Controllers must never construct arbitrary error objects. All unhandled errors are intercepted by `error.middleware.ts`, ensuring zero internal database stack traces leak to the client.

---

## 6. Testing & Quality Assurance Mandate

Before any ticket or task is marked **DONE**, the following tests are mandatory:
1. **Business Calculations:** Pricing formulas (`weight * rate`) and the 5% Hub Discrepancy boundary check must have dedicated Vitest unit tests.
2. **Idempotency:** Payment endpoints must have automated tests demonstrating that duplicate `Idempotency-Key` headers return the cached transaction without creating double records.
3. **Zod Boundary Tests:** Phone regex, coordinate ranges, and weight precision ($\le 3$ decimal places) must be verified with failing boundary test cases.

---

## 7. Git & Version Control Conventions

* **Branch Naming:** `<type>/<ticket-id>-<short-description>`
  * Examples: `feat/TICK-003-otp-authentication`, `fix/TICK-012-discrepancy-rounding`
* **Commit Message Standard (Conventional Commits):**
  * Format: `<type>(<scope>): <short description> [TICK-xxx]`
  * Examples:
    * `feat(auth): implement 6-digit phone OTP service [TICK-003]`
    * `fix(hub): correct 5% tolerance formula threshold [TICK-012]`
    * `test(pricing): add unit tests for scrap rate calculations [TICK-005]`

---

## 8. AI Agent Operational Boundaries (Strict Rules of Engagement)

When acting as an AI coding agent on this codebase:

1. **Explicit Permission Required for Critical Changes:**
   * **NEVER** modify `backend/prisma/schema.prisma` or run schema migrations without explicit user confirmation.
   * **NEVER** alter authentication token generation, password hashing algorithms, or security middleware.
   * **NEVER** modify environment variable keys in `.env.example` without asking first.
2. **No Deletion Without Permission:**
   * **NEVER** delete existing project files, database tables, or test suites unless explicitly instructed.
3. **No Hallucinated Packages:**
   * Only import packages listed in Section 2. If a new library is required, STOP and ask the user for permission, explaining the exact rationale.
4. **Scope Discipline:**
   * Work strictly on **one ticket at a time** (from `docs/TICKETS.md`). Do not combine refactors or add unrequested "bonus" features outside the ticket scope.
5. **Transparency Protocol:**
   * **Before Coding:** Output a concise 3-bullet plan of the exact files you will touch.
   * **After Coding:** Summarize what changed and provide the exact commands to run tests and verify the task.
6. **Data & Secret Privacy:**
   * **NEVER** commit real API keys, passwords, or personal test data into source files.

---

## 9. Definition of Done (DoD) Checklist

Every ticket completed by an engineer or AI assistant must satisfy this checklist:

- [ ] Code is written in strict TypeScript with zero `any` types.
- [ ] Zod schema validates all incoming request parameters, query strings, and payloads.
- [ ] Database interactions are encapsulated inside Repositories or Services (never directly inside Controllers).
- [ ] Error handling utilizes standard `AppError` subclasses with clean JSON envelopes.
- [ ] Unit or integration tests are written in Vitest and pass with `npm test`.
- [ ] Linting and type-checking pass cleanly (`npm run lint` and `npx tsc --noEmit`).
- [ ] No hardcoded secrets, temporary debug `console.log` statements, or mock payloads remain in production paths.
- [ ] Responsive design verified down to $360\text{px}$ viewport width.
