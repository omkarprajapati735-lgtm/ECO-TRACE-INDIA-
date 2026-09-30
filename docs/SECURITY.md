# Security & Access Control Specification — EcoTrace India

**Document Version:** 1.0.0  
**Status:** Approved for Implementation  
**Standard:** OWASP Top 10 + India DPDP Act 2023  
**Traceability Code:** `ECO-SEC-V1`

---

## 1. Threat Model (STRIDE Methodology)

| STRIDE Category | Target Asset / Vector | Potential Threat Attack | Engineering Mitigation |
| :--- | :--- | :--- | :--- |
| **Spoofing** | Collector / Consumer Identity | Attacker impersonates a collector to claim payouts or falsify drop-offs. | Short-lived JWTs (15 min), signed HTTP-only cookies, SMS OTP verification for sensitive mobile actions. |
| **Tampering** | Scrap Weights & Pricing | Malicious user or rogue collector manipulates weigh-in payload via API request interception. | Server-side price recalculation using locked catalog rates; 5% automatic hub weight discrepancy threshold lockout. |
| **Repudiation** | Cash / UPI Disbursements | Consumer or Collector claims payment was never received. | Unique `idempotencyKey` per transaction, bank settlement reference logging, immutable append-only `Payment` and `AuditLog` rows. |
| **Information Disclosure** | Consumer PII (Phone & Address) | Rogue collectors scrape consumer contact numbers and home locations in bulk. | Proximity masking: phone and exact apartment numbers are withheld until a job is officially claimed, and purged from mobile cache post-completion. |
| **Denial of Service** | Public APIs & AI Endpoints | Distributed bot attacks flood the Gemini image grading or OTP SMS endpoints. | Redis-backed token-bucket rate limiters (`rate-limiter-flexible`): 3 OTPs/10min, 10 AI calls/min, 100 API calls/min. |
| **Elevation of Privilege** | Administrative Controls | A collector or consumer injects `"role": "ADMIN"` into user profile update requests. | Strict Prisma field filtering; role mutations forbidden through public endpoints; server-side RBAC middleware. |

---

## 2. Authentication Architecture & Token Lifecycle

EcoTrace India implements a hybrid authentication scheme:
1. **Field Agents (Consumers & Collectors):** Mobile Number + 6-digit SMS OTP (logged to console in development, Gupshup/Fast2SMS in production).
2. **Facility Staff (Hub Managers, Recyclers, Admins):** Email + Strong Password (salted via `bcryptjs`, 12 rounds) + optional 2FA.

### Token Lifecycle & Storage Rules
* **Access Tokens:** Signed with `JWT_ACCESS_SECRET` using HS256, containing `{ userId, role }` payload. Lifespan: **15 minutes**. Sent via `Authorization: Bearer <token>`.
* **Refresh Tokens:** Cryptographically random 64-byte string hashed in the database with a **7-day lifespan**. Stored in an **`HttpOnly`, `Secure`, `SameSite=Lax`** cookie.
* **Token Rotation:** Every call to `/api/v1/auth/refresh` invalidates the previous refresh token and issues a new pair, detecting token reuse and preventing replay attacks.

---

## 3. Authorization & Role-Based Access Control (RBAC) Matrix

```text
Action Legend:
  [C] Create  |  [R] Read  |  [U] Update  |  [D] Delete (Soft)  |  [-] No Access
```

| Resource Entity | Consumer | Collector | Hub Manager | Recycler | Admin |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **User Profile (Own)** | R, U | R, U | R, U | R, U | R, U |
| **User Management (All)** | - | - | - | - | C, R, U, D |
| **Pickup Requests** | C, R (Own) | R (Radius), U (Claim) | R (Assigned) | - | C, R, U, D |
| **Doorstep Weigh-in / Photos**| - | C, R (Claimed) | R | - | R, U |
| **Hub Lot Intake** | - | - | C, R, U | - | R, U |
| **Batch Consolidation** | - | - | C, R, U (Seal) | R (Inbound) | R, U |
| **Recycling Yield Records** | - | - | - | C, R, U | R, U |
| **EPR Compliance Certificates**| R (Own Item) | - | R (Hub Batch) | C, R (Issued) | C, R, U, D |
| **Pricing Catalog** | R | R | R | R | C, R, U |
| **Collector Wallet Balance** | - | R (Own) | - | - | R, U (Audit) |
| **Fraud & Audit Logs** | - | - | R (Limited Hub) | R (Limited) | C, R |

---

## 4. Row-Level Access Policies (Resource Ownership)

1. **Consumer Pickups:** `WHERE pickup.consumerId = req.user.id`. Consumers can never view or modify another household's pickup bookings.
2. **Collector Job Feed:** Collectors only view unassigned pickups (`status = 'REQUESTED'`) located within their configured `serviceRadiusKm`. Once assigned, only the claiming collector can append items.
3. **Hub Inventory:** Hub managers can only inspect and batch items physically received at their assigned `hubId`.
4. **Recycler Manifests:** Recyclers can only view and update batches where `batch.recyclerId = req.user.recyclerProfile.id`.

---

## 5. Input Validation, Output Sanitization & File Uploads

### 5.1 Zod Schema Enforcement
Every incoming HTTP request must pass strict Zod validation before reaching controller logic:
* **Phone Numbers:** `z.string().regex(/^[6-9]\d{9}$/, "Invalid Indian mobile number")`.
* **Weights:** `z.number().positive().max(10000).refine(val => Number(val.toFixed(3)) === val, "Max 3 decimal places")`.
* **Coordinates:** Latitude in `[-90, 90]`, Longitude in `[-180, 180]`.

### 5.2 File Upload Defense-in-Depth
* **Allowed MIME Types:** Strictly `image/jpeg`, `image/png`, `image/webp`, and `application/pdf` (for CPCB manifests). Executable extensions (`.exe`, `.sh`, `.php`, `.js`) are rejected immediately.
* **Maximum File Sizes:** Proof Photos: $\le 10\text{ MB}$; Compliance Documents: $\le 20\text{ MB}$.
* **Storage Isolation:** Files are streamed directly to Cloudinary or AWS S3. The backend never stores user uploads directly on the local filesystem.
* **Magic Byte Inspection:** Server verifies the initial file bytes (e.g. `FF D8 FF` for JPEG) to prevent malicious files disguised with valid extensions.

---

## 6. Data Protection, PII & India DPDP Act 2023 Compliance

### 6.1 Encryption Standards
* **Data in Transit:** Strictly TLS 1.3 enforced across all web domains and API gateways. HTTP traffic is permanently redirected to HTTPS.
* **Data at Rest:** Database volumes on Neon/Supabase are encrypted with AES-256. Cloudinary assets are private and served via signed, time-limited URLs.

### 6.2 Personally Identifiable Information (PII) Handling
Under the **Digital Personal Data Protection Act (DPDP Act 2023)**:
* **Purpose Limitation:** Consumer phone numbers and full addresses are collected solely to execute physical waste collection.
* **Data Minimization:** Collectors only receive consumer details when the job is claimed. Post-completion, consumer contact info is purged from collector views.
* **What Must NEVER Be Logged:**
  * Raw passwords or OTP codes.
  * Full credit card numbers or CVVs.
  * UPI PINs or net-banking credentials.
  * Unmasked JWT tokens or secret keys.

---

## 7. API Protection & Network Hardening

* **Rate Limiting:** Managed via Upstash Redis token buckets. Exceeding limits returns `429 Too Many Requests` with a `Retry-After` header.
* **CORS Policy:** Strict whitelist. In production, only the verified Next.js domain (e.g., `https://ecotrace.in`) is allowed. Wildcard `*` is forbidden.
* **Security Headers (Helmet):**
  * `Content-Security-Policy`: Disallows untrusted inline scripts.
  * `X-Frame-Options: DENY`: Prevents clickjacking.
  * `X-Content-Type-Options: nosniff`: Prevents MIME-type sniffing.
  * `Strict-Transport-Security`: Enforces 1-year HSTS (`max-age=31536000; includeSubDomains`).
* **Financial Idempotency:** All payment requests require an `Idempotency-Key` header (UUIDv4) stored in a unique-indexed database column to prevent double-charging on network retry.

---

## 8. Incident Response & Pre-Launch Security Checklist

### 8.1 Incident Response Workflow
```text
[Suspicious Alert Detected] 
         |
         v
[Triage & Containment] -> Lock compromised user session / Revoke refresh tokens
         |
         v
[Forensic Audit]       -> Query immutable AuditLog table for entity mutations & IP
         |
         v
[Remediation]          -> Patch vulnerability, rotate leaked secrets, notify DPDP authority within 72 hours
```

### 8.2 Pre-Launch Security Verification Checklist
- [ ] No plaintext secrets or passwords exist in git commit history.
- [ ] All production environment variables are configured through Vercel and Render dashboards.
- [ ] CORS is locked strictly to the production frontend domain.
- [ ] Redis rate limiters are active on all `/auth/*` and `/ai/*` endpoints.
- [ ] Weight discrepancy threshold check ($>5\%$) is verified with passing unit tests.
- [ ] Database connection string utilizes SSL (`?sslmode=require`).
- [ ] All API error handlers return sanitized messages without internal stack traces.
